import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Type,
  Plus,
  Save,
  CheckCircle,
  Eye,
  Sliders,
  Scissors,
  Maximize2,
  Film,
} from 'lucide-react';
import { StylePreset } from '../../types/stylePreset';

interface StylePresetsViewProps {
  presets: StylePreset[];
  onSavePreset: (preset: StylePreset) => void;
  onCreatePreset: (preset: StylePreset) => void;
}

export const StylePresetsView: React.FC<StylePresetsViewProps> = ({
  presets,
  onSavePreset,
  onCreatePreset,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    presets[0]?.id || 'preset-juliana-premium'
  );
  const [activePreset, setActivePreset] = useState<StylePreset>(
    presets.find((p) => p.id === selectedPresetId) || presets[0]
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Trocar de preset
  const handleSelectPreset = (preset: StylePreset) => {
    setSelectedPresetId(preset.id);
    setActivePreset({ ...preset });
  };

  const handleFieldChange = (key: keyof StylePreset, value: any) => {
    setActivePreset((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    onSavePreset(activePreset);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleNewPreset = () => {
    const newId = `preset-${Date.now()}`;
    const newPreset: StylePreset = {
      ...activePreset,
      id: newId,
      name: `Novo Estilo ${presets.length + 1}`,
      description: 'Estilo customizado para formatos curtos.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onCreatePreset(newPreset);
    setSelectedPresetId(newId);
    setActivePreset(newPreset);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Meu Estilo (Style Presets)
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Padronização de tipografia, paleta cromática, ritmo de cortes e enquadramento referenciada pelos workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleNewPreset}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Preset</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            {savedSuccess ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span>Salvo!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Seletor de Presets Existentes */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleSelectPreset(preset)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              selectedPresetId === preset.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: preset.corDestaque }}
            />
            <span>{preset.name}</span>
          </button>
        ))}
      </div>

      {/* Grid Principal: Configurações + Visualizador Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Formulário de Configuração (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Identificação Geral */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Identificação do Estilo</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Nome do Preset
                </label>
                <input
                  type="text"
                  value={activePreset.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  ID de Referência (Workflows)
                </label>
                <input
                  type="text"
                  value={activePreset.id}
                  disabled
                  className="w-full bg-slate-950/50 border border-slate-800/80 rounded-lg px-3 py-2 text-slate-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Descrição do Estilo
              </label>
              <input
                type="text"
                value={activePreset.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tipografia & Cores */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-blue-400" />
              <span>Tipografia e Paleta Cromática</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Fonte Principal (Títulos)
                </label>
                <select
                  value={activePreset.fontePrincipal}
                  onChange={(e) => handleFieldChange('fontePrincipal', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Cabinet Grotesk">Cabinet Grotesk (Expressiva)</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans (Moderna)</option>
                  <option value="Satoshi">Satoshi (Clean)</option>
                  <option value="Cinzel">Cinzel (Clássica)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Fonte das Legendas
                </label>
                <select
                  value={activePreset.fonteLegendas}
                  onChange={(e) => handleFieldChange('fonteLegendas', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  <option value="Cabinet Grotesk">Cabinet Grotesk</option>
                  <option value="Satoshi">Satoshi</option>
                  <option value="JetBrains Mono">JetBrains Mono (Data)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Cor Principal do Texto
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activePreset.corPrincipal}
                    onChange={(e) => handleFieldChange('corPrincipal', e.target.value)}
                    className="w-8 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={activePreset.corPrincipal}
                    onChange={(e) => handleFieldChange('corPrincipal', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Cor de Destaque / Realce
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={activePreset.corDestaque}
                    onChange={(e) => handleFieldChange('corDestaque', e.target.value)}
                    className="w-8 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={activePreset.corDestaque}
                    onChange={(e) => handleFieldChange('corDestaque', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Formatação das Legendas e Títulos */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Regras de Legendas & Destaques</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Palavras por Bloco</span>
                  <span className="font-mono text-slate-400">{activePreset.palavrasPorBloco}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={activePreset.palavrasPorBloco}
                  onChange={(e) => handleFieldChange('palavrasPorBloco', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Linhas Máximas</span>
                  <span className="font-mono text-slate-400">{activePreset.linhasMaximas}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={activePreset.linhasMaximas}
                  onChange={(e) => handleFieldChange('linhasMaximas', parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Posição da Legenda
                </label>
                <select
                  value={activePreset.posicaoLegenda}
                  onChange={(e) => handleFieldChange('posicaoLegenda', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="bottom">Inferior (Safe Zone)</option>
                  <option value="center">Centro</option>
                  <option value="top">Superior</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Estilo do Destaque
                </label>
                <select
                  value={activePreset.estiloDestaque}
                  onChange={(e) => handleFieldChange('estiloDestaque', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="glow">Glow Luminoso</option>
                  <option value="box">Box / Fundo Sólido</option>
                  <option value="underline">Sublinhado Estilizado</option>
                  <option value="color">Apenas Troca de Cor</option>
                  <option value="bounce">Bounce Suave</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Posição do Título
                </label>
                <select
                  value={activePreset.posicaoTitulo}
                  onChange={(e) => handleFieldChange('posicaoTitulo', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="top">Topo</option>
                  <option value="center">Centro</option>
                  <option value="hook-banner">Hook Banner Animado</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Duração do Título</span>
                  <span className="font-mono text-slate-400">{activePreset.duracaoTitulo}s</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="6.0"
                  step="0.5"
                  value={activePreset.duracaoTitulo}
                  onChange={(e) => handleFieldChange('duracaoTitulo', parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Intensidade de Zoom
                </label>
                <select
                  value={activePreset.intensidadeZoom}
                  onChange={(e) => handleFieldChange('intensidadeZoom', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="suave">Suave (108%)</option>
                  <option value="moderada">Moderada (115%)</option>
                  <option value="agressiva">Agressiva (125%)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Estilo de Cortes
                </label>
                <select
                  value={activePreset.estiloCortes}
                  onChange={(e) => handleFieldChange('estiloCortes', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="ritmico">Rítmico (Cadência fluida)</option>
                  <option value="dinamico">Dinâmico (Alta retenção)</option>
                  <option value="conservador">Conservador (Respirações)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Live Preview Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-24 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Simulação Visual ao Vivo</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">9:16 Vertical</span>
            </div>

            {/* Mock Smartphone Frame */}
            <div className="w-full bg-slate-950 rounded-2xl border border-slate-800 p-4 flex items-center justify-center">
              <div className="w-60 h-[480px] rounded-2xl bg-slate-900 border-2 border-slate-700/80 shadow-2xl relative flex flex-col justify-between p-4 overflow-hidden">
                {/* Background Texture Overlay */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Top: Logo & Title Simulation */}
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <img
                      src={activePreset.logo}
                      alt="Logo"
                      className="w-6 h-6 rounded"
                    />
                    <span className="text-[9px] font-mono text-slate-500">VideoFlow Preview</span>
                  </div>

                  {/* Title Preview based on preset */}
                  {activePreset.posicaoTitulo !== 'center' && (
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-700/60 text-center shadow-lg">
                      <span
                        className="text-xs font-bold leading-tight block"
                        style={{
                          fontFamily: activePreset.fontePrincipal,
                          color: activePreset.corDestaque,
                        }}
                      >
                        O SEGREDO DO FOCO ABSOLUTO
                      </span>
                    </div>
                  )}
                </div>

                {/* Center Speaker Icon */}
                <div className="relative z-10 self-center p-3 rounded-full bg-slate-800/70 text-slate-400 border border-slate-700">
                  <Film className="w-6 h-6" />
                </div>

                {/* Bottom: Subtitle preview based on preset */}
                <div className="relative z-10 space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-center shadow-xl">
                    <div
                      className="text-xs leading-snug"
                      style={{
                        fontFamily: activePreset.fonteLegendas,
                        color: activePreset.corPrincipal,
                      }}
                    >
                      {activePreset.estiloDestaque === 'glow' && (
                        <span>
                          Você precisa{' '}
                          <span
                            className="font-bold underline"
                            style={{
                              color: activePreset.corDestaque,
                              textShadow: `0 0 10px ${activePreset.corDestaque}66`,
                            }}
                          >
                            eliminar distrações
                          </span>{' '}
                          agora!
                        </span>
                      )}
                      {activePreset.estiloDestaque === 'box' && (
                        <span>
                          Você precisa{' '}
                          <span
                            className="px-1.5 py-0.5 rounded font-bold text-slate-950"
                            style={{ backgroundColor: activePreset.corDestaque }}
                          >
                            eliminar distrações
                          </span>{' '}
                          agora!
                        </span>
                      )}
                      {activePreset.estiloDestaque === 'underline' && (
                        <span>
                          Você precisa{' '}
                          <span
                            className="font-bold border-b-2"
                            style={{ borderColor: activePreset.corDestaque }}
                          >
                            eliminar distrações
                          </span>{' '}
                          agora!
                        </span>
                      )}
                      {activePreset.estiloDestaque !== 'glow' &&
                        activePreset.estiloDestaque !== 'box' &&
                        activePreset.estiloDestaque !== 'underline' && (
                          <span>
                            Você precisa{' '}
                            <span
                              className="font-bold"
                              style={{ color: activePreset.corDestaque }}
                            >
                              eliminar distrações
                            </span>{' '}
                            agora!
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono px-1">
                    <span>{activePreset.palavrasPorBloco} palavras/bloco</span>
                    <span>Cortes: {activePreset.estiloCortes}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Todos os workflows vinculados a este preset herdam essas definições em tempo real sem duplicação de dados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
