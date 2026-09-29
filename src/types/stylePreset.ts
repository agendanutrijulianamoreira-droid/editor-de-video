export interface StylePreset {
  id: string;
  userId: string;
  name: string;
  description: string;
  fontePrincipal: string;
  fonteLegendas: string;
  corPrincipal: string;
  corDestaque: string;
  logo: string;
  palavrasPorBloco: number;
  linhasMaximas: number;
  posicaoLegenda: 'bottom' | 'center' | 'top';
  estiloDestaque: 'glow' | 'box' | 'underline' | 'color' | 'bounce';
  posicaoTitulo: 'top' | 'center' | 'hook-banner';
  duracaoTitulo: number; // segundos
  intensidadeZoom: 'suave' | 'moderada' | 'agressiva';
  estiloCortes: 'ritmico' | 'dinamico' | 'conservador';
  createdAt: string;
  updatedAt: string;
}
