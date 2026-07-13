import React from 'react';
import { ArrowLeft, Bug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PushDiagnosticBanner } from '../components/PushDiagnosticBanner';

export const ProfileLogs = () => {
  const navigate = useNavigate();

  return (
    <div className="main-wrapper bg-[var(--bg-app)]">
      <div className="app-container min-h-screen bg-transparent pb-12 shadow-none border-none">
        <header className="sticky top-0 z-40 flex items-center gap-4 bg-[var(--bg-app)]/90 px-6 pb-5 pt-12 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-container)] text-[var(--text-main)] shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all active:scale-95"
            aria-label="Voltar ao perfil"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-[var(--text-main)]">Logs de notificações</h1>
            <p className="text-[11px] font-medium text-[var(--text-muted)]">Diagnóstico técnico do dispositivo atual</p>
          </div>
        </header>

        <main className="px-6">
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-container)] p-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-500">
              <Bug className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium leading-relaxed text-[var(--text-muted)]">
              Esta página é privada e não aparece no menu. Use-a somente para verificar Web Push e copiar o relatório técnico.
            </p>
          </div>

          <PushDiagnosticBanner showWhenHealthy />
        </main>
      </div>
    </div>
  );
};
