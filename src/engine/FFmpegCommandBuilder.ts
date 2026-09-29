import { RenderPlan, RenderOperation } from '../types/renderPlan';
import { TimelineMapper } from '../utils/TimelineMapper';

export interface FFmpegCommand {
  inputs: string[];
  filterComplex: string;
  outputArgs: string[];
}

export class FFmpegCommandBuilder {
  /**
   * Constrói os argumentos do FFmpeg a partir de um RenderPlan.
   */
  static build(plan: RenderPlan, localVideoPath: string, assPath?: string): FFmpegCommand {
    const inputs: string[] = [localVideoPath];
    const filterParts: string[] = [];
    let lastStream = '0:v';
    let lastAudioStream = '0:a';

    const timelineMapper = new TimelineMapper(plan.timeline.segments);

    // 1. TRIM & CONCAT (Cortes)
    const { filter: concatFilter, videoOut, audioOut } = this.buildConcatFilter(plan.timeline.segments);
    filterParts.push(concatFilter);
    lastStream = videoOut;
    lastAudioStream = audioOut;

    // 2. RESIZE & CROP (Formato)
    const resizeOp = plan.operations.find(o => o.type === 'resize');
    if (resizeOp) {
      const { filter: resizeFilter, output: resizeOut } = this.buildResizeFilter(lastStream, plan.output.resolution);
      filterParts.push(resizeFilter);
      lastStream = resizeOut;
    }

    // 3. ZOOM
    const zoomOp = plan.operations.find(o => o.type === 'zoom');
    if (zoomOp && zoomOp.config.events.length > 0) {
      const { filter: zoomFilter, output: zoomOut } = this.buildZoomFilter(lastStream, zoomOp.config.events, timelineMapper, zoomOp.config.maxScale, plan.output.resolution);
      filterParts.push(zoomFilter);
      lastStream = zoomOut;
    }

    // 4. SUBTITLES (ASS)
    if (assPath) {
      // Subtitles filter costumam ser aplicados ao final da cadeia de vídeo
      const subFilter = `[${lastStream}]ass='${assPath}'[v_subs]`;
      filterParts.push(subFilter);
      lastStream = 'v_subs';
    }

    // 5. TITLE & BRANDING (Simplificado para V1)
    // Para V1, vamos focar nos cortes e legendas. Title e Branding podem ser drawtext ou overlay de imagem.
    const titleOp = plan.operations.find(o => o.type === 'title');
    if (titleOp) {
      const { filter: titleFilter, output: titleOut } = this.buildTitleFilter(lastStream, titleOp.config, timelineMapper);
      filterParts.push(titleFilter);
      lastStream = titleOut;
    }

    const brandingOp = plan.operations.find(o => o.type === 'branding');
    if (brandingOp) {
       // Branding requer um input extra (logo)
       // Para simplicidade na V1, vamos pular se não for fácil baixar o logo agora
    }

    // Configurar Argumentos de Saída
    const outputArgs: string[] = [
      '-map', `[${lastStream}]`,
      '-map', `[${lastAudioStream}]`,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', plan.output.quality === 'high' ? '18' : (plan.output.quality === 'balanced' ? '23' : '28'),
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      '-y'
    ];

    return {
      inputs,
      filterComplex: filterParts.join(';'),
      outputArgs
    };
  }

  private static buildConcatFilter(segments: any[]) {
    // [0:v]trim=start=5:end=10,setpts=PTS-STARTPTS[v0]; [0:a]atrim=start=5:end=10,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.05,afade=t=out:st=4.95:d=0.05[a0]; ...
    let filter = '';
    const vStreams: string[] = [];
    const aStreams: string[] = [];
    const FADE_DURATION = 0.05; // 50ms to avoid pops

    segments.forEach((s, i) => {
      const duration = s.end - s.start;
      filter += `[0:v]trim=start=${s.start}:end=${s.end},setpts=PTS-STARTPTS[v${i}];`;
      
      // Aplicar micro-fade no áudio para evitar estalos (clicks/pops)
      filter += `[0:a]atrim=start=${s.start}:end=${s.end},asetpts=PTS-STARTPTS`;
      if (duration > FADE_DURATION * 2) {
        filter += `,afade=t=in:st=0:d=${FADE_DURATION},afade=t=out:st=${(duration - FADE_DURATION).toFixed(3)}:d=${FADE_DURATION}`;
      }
      filter += `[a${i}];`;
      
      vStreams.push(`[v${i}]`);
      aStreams.push(`[a${i}]`);
    });

    filter += `${vStreams.join('')}${aStreams.join('')}concat=n=${segments.length}:v=1:a=1[v_concat][a_concat]`;

    return { filter, videoOut: 'v_concat', audioOut: 'a_concat' };
  }

  private static buildResizeFilter(input: string, res: { width: number, height: number }) {
    // Scale and Crop to fill the target resolution (Center Crop)
    // Garantir que a resolução seja par para o encoder x264
    const w = Math.floor(res.width / 2) * 2;
    const h = Math.floor(res.height / 2) * 2;
    const filter = `[${input}]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}[v_res]`;
    return { filter, output: 'v_res' };
  }

  private static buildZoomFilter(input: string, events: any[], mapper: TimelineMapper, maxScale: number, res: { width: number, height: number }) {
    let zoomExpr = '1';
    events.forEach(e => {
       const mapped = mapper.mapInterval(e.timestamp, e.timestamp + e.duration);
       if (!mapped) return;
       zoomExpr += `+(${e.scale}-1)*between(t,${mapped.start.toFixed(3)},${mapped.end.toFixed(3)})`;
    });
    
    // Zoompan requer s (output size) e d (duration em frames, 1 = processa cada frame)
    // Para 9:16, usamos a resolução de saída do plano.
    const filter = `[${input}]zoompan=z='${zoomExpr}':d=1:s=${res.width}x${res.height}:fps=30[v_zoom]`;
    return { filter, output: 'v_zoom' };
  }

  private static buildTitleFilter(input: string, config: any, mapper: TimelineMapper) {
    const { text, duration, position, style } = config;
    let y = '100';
    if (position === 'center') y = '(h-text_h)/2';
    if (position === 'bottom') y = 'h-text_h-200';
    
    // Escapar caracteres especiais para drawtext
    const escapedText = text
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "'\\\\''")
      .replace(/:/g, '\\:')
      .replace(/%/g, '\\%');

    const filter = `[${input}]drawtext=text='${escapedText}':enable='between(t,0,${duration})':fontcolor=${style.color.replace('#', '0x')}:fontsize=64:x=(w-text_w)/2:y=${y}:shadowcolor=black:shadowx=2:shadowy=2[v_title]`;
    return { filter, output: 'v_title' };
  }
}
