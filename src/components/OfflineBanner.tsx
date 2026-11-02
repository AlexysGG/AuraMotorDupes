import React from 'react';
import { WifiOff, Wifi, RefreshCw, Database } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  wasOffline: boolean;
  pendingSyncCount: number;
  onManualSync: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  wasOffline,
  pendingSyncCount,
  onManualSync,
}) => {
  // If online and wasn't recently offline, don't show anything
  if (isOnline && !wasOffline) return null;

  // When connection was restored
  if (isOnline && wasOffline) {
    return (
      <aside aria-label="Notificación de conectividad" className="sticky top-16 z-30 bg-emerald-600 text-white text-xs px-4 py-2.5 shadow-md flex items-center justify-between transition-all animate-in slide-in-from-top duration-300">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span className="font-semibold">¡Conexión a internet restablecida!</span>
            <span className="hidden sm:inline text-emerald-100">
              Sincronizando fragancias y datos locales...
            </span>
          </div>
          <span className="text-[11px] bg-emerald-700/60 px-2 py-0.5 rounded-full font-medium">
            En línea
          </span>
        </div>
      </aside>
    );
  }

  // When offline
  return (
    <aside aria-label="Alerta de modo sin conexión" className="sticky top-16 z-30 bg-zinc-900 text-zinc-100 border-b border-zinc-800 text-xs px-4 py-2.5 shadow-lg flex items-center justify-between transition-all">
      <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <WifiOff className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-amber-400">Modo Sin Conexión Activo</span>
            <span className="text-zinc-300 ml-2">
              Navegando catálogo y fragancias guardadas en la memoria de tu dispositivo.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {pendingSyncCount > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700">
              <Database className="w-3 h-3 text-amber-400" />
              <span>{pendingSyncCount} acción{pendingSyncCount > 1 ? 'es' : ''} en cola</span>
            </span>
          )}

          <button
            onClick={onManualSync}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold border border-zinc-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3 text-zinc-400" />
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
