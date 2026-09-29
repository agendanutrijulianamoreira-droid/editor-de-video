import { CaptionBlock, Highlight } from '../types/edl';
import { TimelineMapper } from './TimelineMapper';

export class ASSGenerator {
  /**
   * Gera o conteúdo de um arquivo .ass estilizado com suporte a highlights por palavra.
   */
  static generate(
    blocks: CaptionBlock[],
    highlights: Highlight[],
    timelineMapper: TimelineMapper,
    style: any
  ): string {
    const { font, size, color, highlightColor, position } = style;

    // Converter cores Hex para ASS (&HBBGGRR)
    const assColor = this.hexToAss(color);
    const assHighlightColor = this.hexToAss(highlightColor);

    let ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${font},${size},${assColor},&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,2,0,2,30,30,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    blocks.forEach(block => {
      const mapped = timelineMapper.mapInterval(block.start, block.end);
      if (!mapped) return;

      const start = this.formatTime(mapped.start);
      const end = this.formatTime(mapped.end);

      // Gerar texto com tags de animação ou destaque se houver highlights
      let text = '';
      block.words.forEach(word => {
        const isHighlighted = highlights.some(h => 
          word.start >= h.start - 0.01 && word.end <= h.end + 0.01
        );
        
        if (isHighlighted) {
          text += `{\\c${assHighlightColor}\\b1}${word.text}{\\c${assColor}\\b0} `;
        } else {
          text += `${word.text} `;
        }
      });

      ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${text.trim()}\n`;
    });

    return ass;
  }

  private static hexToAss(hex: string): string {
    // #RRGGBB -> &H00BBGGRR
    const r = hex.slice(1, 3);
    const g = hex.slice(3, 5);
    const b = hex.slice(5, 7);
    return `&H00${b}${g}${r}`;
  }

  private static formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
}
