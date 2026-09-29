import React from 'react';
import { Film, Sparkles, LogIn } from 'lucide-react';

interface LoginViewProps {
  onLogin: () => void;
  loading: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, loading }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Film className="w-8 h-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">VideoFlow AI</h1>
            <p className="text-slate-400 text-sm">
              Sua plataforma profissional de workflows audiovisuais inteligentes.
            </p>
          </div>
        </div>

        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Acesse sua conta</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Inicie sessão com sua conta Google para gerenciar seus projetos e workflows na nuvem.
            </p>
          </div>

          <button
            onClick={onLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Entrar com Google</span>
              </>
            )}
          </button>
        </div>

        <div className="pt-4">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium">
            Arquitetura Desacoplada · Firebase Cloud Suite
          </p>
        </div>
      </div>
    </div>
  );
};
