import React from 'react';
import { X, Sliders, Trash2, Copy, AlertTriangle } from 'lucide-react';
import { WorkflowNode, AnyNodeConfig } from '../../types/workflow';
import { StylePreset } from '../../types/stylePreset';

interface NodeInspectorProps {
  selectedNode: WorkflowNode | null;
  presets: StylePreset[];
  onClose: () => void;
  onUpdateConfig: (nodeId: string, newConfig: Partial<AnyNodeConfig>) => void;
  onUpdateNodeName: (nodeId: string, newName: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  selectedNode,
  presets,
  onClose,
  onUpdateConfig,
  onUpdateNodeName,
  onDeleteNode,
  onDuplicateNode,
}) => {
  if (!selectedNode) return null;

  const { id, data } = selectedNode;
  const config = (data.config || {}) as any;

  const handleFieldChange = (key: string, value: any) => {
    onUpdateConfig(id, { [key]: value });
  };

  return (
    <aside className="w-80 border-l border-slate-800 bg-slate-900/95 flex flex-col h-full z-20 overflow-hidden shadow-2xl">
      {/* Header do Inspector */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Inspetor de Nó
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicateNode(id)}
            title="Duplicar Nó"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteNode(id)}
            title="Excluir Nó"
            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conteúdo rolável */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-300">
        {/* Identificação Geral */}
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">Nome do Nó</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onUpdateNodeName(id, e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
          />
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
            <span>Tipo: {data.nodeType}</span>
            <span>·</span>
            <span>v{data.version}</span>
            <span>·</span>
            <span className="font-mono">{id}</span>
          </div>
        </div>

        {/* 1. CONFIGURAÇÕES: NODE LIMPEZA */}
        {data.nodeType === 'cleanup' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h5 className="font-semibold text-slate-200">Parâmetros de Limpeza</h5>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Remover Silêncio</span>
              <input
                type="checkbox"
                checked={config.removerSilencio ?? true}
                onChange={(e) => handleFieldChange('removerSilencio', e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
              />
            </label>

            <div>
              <div className="flex justify-between mb-1">
                <span>Duração mínima de silêncio</span>
                <span className="font-mono text-slate-400">{config.duracaoMinimaSilencioSec ?? 0.4}s</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={config.duracaoMinimaSilencioSec ?? 0.4}
                onChange={(e) => handleFieldChange('duracaoMinimaSilencioSec', parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Preservar Pausas Naturais</span>
              <input
                type="checkbox"
                checked={config.preservarPausasNaturais ?? true}
                onChange={(e) => handleFieldChange('preservarPausasNaturais', e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Remover Repetições</span>
              <input
                type="checkbox"
                checked={config.removerRepeticoes ?? true}
                onChange={(e) => handleFieldChange('removerRepeticoes', e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
              />
            </label>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Agressividade</label>
              <select
                value={config.agressividade ?? 'media'}
                onChange={(e) => handleFieldChange('agressividade', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="baixa">Baixa (Conservadora)</option>
                <option value="media">Média (Recomendada)</option>
                <option value="alta">Alta (Cortes Rápidos)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Comportamento em dúvida</label>
              <select
                value={config.comportamentoDuvida ?? 'marcar-revisao'}
                onChange={(e) => handleFieldChange('comportamentoDuvida', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="manter">Manter trecho</option>
                <option value="remover">Remover trecho</option>
                <option value="marcar-revisao">Marcar para revisão humana</option>
              </select>
            </div>
          </div>
        )}

        {/* 2. CONFIGURAÇÕES: NODE LEGENDA */}
        {data.nodeType === 'subtitles' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h5 className="font-semibold text-slate-200">Parâmetros de Legenda</h5>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Preset de Estilo Vinculado</label>
              <select
                value={config.stylePresetId ?? ''}
                onChange={(e) => handleFieldChange('stylePresetId', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">Nenhum (Customizado)</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Fonte</label>
              <select
                value={config.fonte ?? 'Plus Jakarta Sans'}
                onChange={(e) => handleFieldChange('fonte', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Cabinet Grotesk">Cabinet Grotesk</option>
                <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                <option value="Satoshi">Satoshi</option>
                <option value="Cinzel">Cinzel</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Tamanho da Fonte</span>
                <span className="font-mono text-slate-400">{config.tamanho ?? 24}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="48"
                step="1"
                value={config.tamanho ?? 24}
                onChange={(e) => handleFieldChange('tamanho', parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Posição na Tela</label>
              <select
                value={config.posicao ?? 'inferior'}
                onChange={(e) => handleFieldChange('posicao', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="inferior">Inferior (Padrão Reel)</option>
                <option value="centro">Centro</option>
                <option value="superior">Superior</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Máx Palavras</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={config.maximoPalavras ?? 3}
                  onChange={(e) => handleFieldChange('maximoPalavras', parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Máx Linhas</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={config.maximoLinhas ?? 2}
                  onChange={(e) => handleFieldChange('maximoLinhas', parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Animação</label>
              <select
                value={config.animacao ?? 'pop'}
                onChange={(e) => handleFieldChange('animacao', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="pop">Pop / Escala</option>
                <option value="fade">Suave (Fade)</option>
                <option value="typewriter">Máquina de Escrever</option>
                <option value="nenhuma">Sem animação</option>
              </select>
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Destaque Ativo de Palavras</span>
              <input
                type="checkbox"
                checked={config.destaquePalavras ?? true}
                onChange={(e) => handleFieldChange('destaquePalavras', e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
              />
            </label>
          </div>
        )}

        {/* 3. CONFIGURAÇÕES: NODE DESTAQUES */}
        {data.nodeType === 'highlights' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h5 className="font-semibold text-slate-200">Critérios de Destaque</h5>

            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Números e Estatísticas</span>
                <input
                  type="checkbox"
                  checked={config.numeros ?? true}
                  onChange={(e) => handleFieldChange('numeros', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span>Dores do Público</span>
                <input
                  type="checkbox"
                  checked={config.dores ?? true}
                  onChange={(e) => handleFieldChange('dores', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span>Benefícios & Soluções</span>
                <input
                  type="checkbox"
                  checked={config.beneficios ?? true}
                  onChange={(e) => handleFieldChange('beneficios', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span>Alertas & Atenção</span>
                <input
                  type="checkbox"
                  checked={config.alertas ?? true}
                  onChange={(e) => handleFieldChange('alertas', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span>Palavras-chave semânticas</span>
                <input
                  type="checkbox"
                  checked={config.palavrasChave ?? true}
                  onChange={(e) => handleFieldChange('palavrasChave', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
                />
              </label>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Máx de Destaques</span>
                <span className="font-mono text-slate-400">{config.quantidadeMaximaDestaques ?? 6}</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={config.quantidadeMaximaDestaques ?? 6}
                onChange={(e) => handleFieldChange('quantidadeMaximaDestaques', parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Intensidade Visual</label>
              <select
                value={config.intensidadeVisual ?? 'chamativa'}
                onChange={(e) => handleFieldChange('intensidadeVisual', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="sutil">Sutil (Sem distrações)</option>
                <option value="moderada">Moderada</option>
                <option value="chamativa">Chamativa (Alto contraste)</option>
              </select>
            </div>
          </div>
        )}

        {/* 4. CONFIGURAÇÕES: NODE TÍTULO */}
        {data.nodeType === 'title' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h5 className="font-semibold text-slate-200">Geração de Título</h5>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Geração Automática AI</span>
              <input
                type="checkbox"
                checked={config.geracaoAutomatica ?? true}
                onChange={(e) => handleFieldChange('geracaoAutomatica', e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
              />
            </label>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Objetivo Estratégico</label>
              <select
                value={config.objetivo ?? 'retencao'}
                onChange={(e) => handleFieldChange('objetivo', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="retencao">Retenção de Primeiros Segundos</option>
                <option value="autoridade">Autoridade e Credibilidade</option>
                <option value="viralizacao">Viralização e Compartilhamento</option>
                <option value="didatico">Didático e Informativo</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Máx de Palavras</span>
                <span className="font-mono text-slate-400">{config.maximoPalavras ?? 8}</span>
              </div>
              <input
                type="range"
                min="3"
                max="14"
                step="1"
                value={config.maximoPalavras ?? 8}
                onChange={(e) => handleFieldChange('maximoPalavras', parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Tom de Voz</label>
              <select
                value={config.tom ?? 'urgente'}
                onChange={(e) => handleFieldChange('tom', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="urgente">Urgente e Impactante</option>
                <option value="curioso">Curioso e Instigante</option>
                <option value="direto">Direto ao Ponto</option>
                <option value="educativo">Educativo e Calmo</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Posição</label>
              <select
                value={config.posicao ?? 'topo'}
                onChange={(e) => handleFieldChange('posicao', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="topo">Topo</option>
                <option value="centro">Centro</option>
                <option value="banner-dinamico">Banner Dinâmico Animado</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Duração na Tela</span>
                <span className="font-mono text-slate-400">{config.duracaoSec ?? 3.5}s</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="8.0"
                step="0.5"
                value={config.duracaoSec ?? 3.5}
                onChange={(e) => handleFieldChange('duracaoSec', parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Evitar Clickbait</span>
                <input
                  type="checkbox"
                  checked={config.evitarClickbait ?? true}
                  onChange={(e) => handleFieldChange('evitarClickbait', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span>Evitar Promessas Exageradas</span>
                <input
                  type="checkbox"
                  checked={config.evitarPromessasExageradas ?? true}
                  onChange={(e) => handleFieldChange('evitarPromessasExageradas', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
                />
              </label>
            </div>
          </div>
        )}

        {/* 5. CONFIGURAÇÕES: NODE ZOOM */}
        {data.nodeType === 'zoom' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h5 className="font-semibold text-slate-200">Parâmetros de Zoom Dinâmico</h5>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Ativar Zoom Dinâmico</span>
              <input
                type="checkbox"
                checked={config.ativar ?? true}
                onChange={(e) => handleFieldChange('ativar', e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
              />
            </label>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Frequência</label>
              <select
                value={config.frequencia ?? 'enfase-destaques'}
                onChange={(e) => handleFieldChange('frequencia', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="baixa">Baixa (Poucos zooms)</option>
                <option value="media">Média</option>
                <option value="alta">Alta (Ritmo rápido)</option>
                <option value="enfase-destaques">Apenas em Ênfases / Destaques</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Intensidade</label>
              <select
                value={config.intensidade ?? 'padrao'}
                onChange={(e) => handleFieldChange('intensidade', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="suave">Suave</option>
                <option value="padrao">Padrão</option>
                <option value="impacto">Impacto</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Escala Máxima</span>
                <span className="font-mono text-slate-400">{config.escalaMaximaPercent ?? 115}%</span>
              </div>
              <input
                type="range"
                min="105"
                max="140"
                step="1"
                value={config.escalaMaximaPercent ?? 115}
                onChange={(e) => handleFieldChange('escalaMaximaPercent', parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Evitar Mudanças Bruscas</span>
              <input
                type="checkbox"
                checked={config.evitarMudancasBruscas ?? true}
                onChange={(e) => handleFieldChange('evitarMudancasBruscas', e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
              />
            </label>
          </div>
        )}

        {/* 6. CONFIGURAÇÕES: NODE FORMATO */}
        {data.nodeType === 'format' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h5 className="font-semibold text-slate-200">Enquadramento & Proporção</h5>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-2">Formato de Saída</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '9:16', label: 'Reel 9:16', desc: 'Vertical' },
                  { id: '4:5', label: 'Feed 4:5', desc: 'Retrato' },
                  { id: '16:9', label: '16:9', desc: 'Horizontal' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleFieldChange('aspectRatio', f.id)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      (config.aspectRatio ?? '9:16') === f.id
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-medium text-[11px]">{f.label}</div>
                    <div className="text-[9px] text-slate-400">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Enquadramento Inteligente (Face Lock)</span>
              <input
                type="checkbox"
                checked={config.enquadramentoInteligente ?? true}
                onChange={(e) => handleFieldChange('enquadramentoInteligente', e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
              />
            </label>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Preenchimento de Bordas</label>
              <select
                value={config.preenchimentoFundo ?? 'desfoque'}
                onChange={(e) => handleFieldChange('preenchimentoFundo', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="desfoque">Desfoque do próprio vídeo</option>
                <option value="preto">Preto minimalista</option>
                <option value="cor-solida">Cor sólida neutra</option>
              </select>
            </div>
          </div>
        )}

        {/* 7. CONFIGURAÇÕES: NODE VÍDEO INPUT */}
        {data.nodeType === 'video-input' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h5 className="font-semibold text-slate-200">Origem do Vídeo</h5>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Resolução Alvo</label>
              <select
                value={config.resolucaoDesejada ?? '1080p'}
                onChange={(e) => handleFieldChange('resolucaoDesejada', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="original">Original</option>
                <option value="1080p">1080p Full HD</option>
                <option value="4k">4K Ultra HD</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Taxa de Quadros (FPS)</label>
              <select
                value={config.framerateFps ?? 60}
                onChange={(e) => handleFieldChange('framerateFps', parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="30">30 FPS</option>
                <option value="60">60 FPS (Mais fluido)</option>
              </select>
            </div>
          </div>
        )}

        {/* 8. CONFIGURAÇÕES: NODE TRANSCREVER */}
        {data.nodeType === 'transcribe' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h5 className="font-semibold text-slate-200">Reconhecimento de Voz</h5>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Idioma</label>
              <select
                value={config.idioma ?? 'pt-BR'}
                onChange={(e) => handleFieldChange('idioma', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
                <option value="auto">Detecção Automática</option>
              </select>
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Detectar Locutores</span>
              <input
                type="checkbox"
                checked={config.deteccaoLocutores ?? true}
                onChange={(e) => handleFieldChange('deteccaoLocutores', e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Filtro de Ruído no Áudio</span>
              <input
                type="checkbox"
                checked={config.removerRuidoAudio ?? true}
                onChange={(e) => handleFieldChange('removerRuidoAudio', e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
              />
            </label>
          </div>
        )}

        {/* 9. CONFIGURAÇÕES: NODE ERROS DE FALA */}
        {data.nodeType === 'speech-errors' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h5 className="font-semibold text-slate-200">Erros & Cacoetes</h5>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Remover Gagueira</span>
              <input
                type="checkbox"
                checked={config.removerGagueira ?? true}
                onChange={(e) => handleFieldChange('removerGagueira', e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Remover Vícios (né, tipo, éee)</span>
              <input
                type="checkbox"
                checked={config.removerViciosLinguagem ?? true}
                onChange={(e) => handleFieldChange('removerViciosLinguagem', e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Remover Falsos Inícios de Frase</span>
              <input
                type="checkbox"
                checked={config.removerFalsosInicios ?? true}
                onChange={(e) => handleFieldChange('removerFalsosInicios', e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0"
              />
            </label>
          </div>
        )}

        {/* 10. CONFIGURAÇÕES: NODE BRANDING */}
        {data.nodeType === 'brand' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h5 className="font-semibold text-slate-200">Assinatura de Marca</h5>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Posição da Marca d'Água</label>
              <select
                value={config.posicao ?? 'topo-direita'}
                onChange={(e) => handleFieldChange('posicao', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="topo-direita">Topo Direita</option>
                <option value="topo-esquerda">Topo Esquerda</option>
                <option value="rodape-direita">Rodapé Direita</option>
                <option value="rodape-esquerda">Rodapé Esquerda</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Opacidade</span>
                <span className="font-mono text-slate-400">{config.opacidadePercent ?? 85}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={config.opacidadePercent ?? 85}
                onChange={(e) => handleFieldChange('opacidadePercent', parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        )}

        {/* 11. CONFIGURAÇÕES: NODE EXPORTAR */}
        {data.nodeType === 'export' && (
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h5 className="font-semibold text-slate-200">Configuração de Render</h5>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Codec de Vídeo</label>
              <select
                value={config.codecVideo ?? 'h264'}
                onChange={(e) => handleFieldChange('codecVideo', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="h264">H.264 (Universal / Redes Sociais)</option>
                <option value="hevc">H.265 / HEVC (Compacto)</option>
                <option value="prores">Apple ProRes 422 (Master)</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span>Bitrate de Vídeo</span>
                <span className="font-mono text-slate-400">{Math.round((config.taxaBitsKbps ?? 18000) / 1000)} Mbps</span>
              </div>
              <input
                type="range"
                min="6000"
                max="40000"
                step="2000"
                value={config.taxaBitsKbps ?? 18000}
                onChange={(e) => handleFieldChange('taxaBitsKbps', parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        )}

        {/* Informações da Arquitetura do Nó */}
        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Contrato: INPUT → PROCESS → OUTPUT</span>
          </div>
          <p className="leading-relaxed">
            As alterações são salvas automaticamente na fonte da verdade do workflow.
          </p>
        </div>
      </div>
    </aside>
  );
};
