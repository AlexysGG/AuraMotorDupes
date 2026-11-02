import React from 'react';
import { X, Download, Smartphone, Zap, WifiOff, Share2, PlusSquare, CheckCircle } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<boolean>;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isInstallable,
  isInstalled,
  isIOS,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 text-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
          title="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-md p-2">
            <img src="/icons/icon.svg" alt="Aura Logo" className="w-full h-full" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-serif-luxury text-zinc-950">
              Instalar Aura App
            </h3>
            <p className="text-xs text-zinc-500">Progressive Web App (PWA)</p>
          </div>
        </div>

        {isInstalled ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-zinc-900 mb-1">
              ¡Aura ya está instalada!
            </h4>
            <p className="text-xs text-zinc-500">
              Puedes abrirla directamente desde tu pantalla de inicio o cajón de aplicaciones en modo independiente nativo.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs sm:text-sm text-zinc-600 mb-5 leading-relaxed font-normal">
              Disfruta de la experiencia nativa completa: sin barra de navegación, acceso offline instantáneo a tus perfumes y consultas inmediatas.
            </p>

            {/* Feature cards */}
            <div className="space-y-2.5 mb-6">
              <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 text-xs">
                <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-900 block font-semibold">Carga Ultrarrápida</strong>
                  <span className="text-zinc-500 font-normal">App Shell pre-cacheador con apertura en milisegundos.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 text-xs">
                <WifiOff className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-900 block font-semibold">Catálogo y Tocador Offline</strong>
                  <span className="text-zinc-500 font-normal">IndexedDB guarda tus fragancias y consultas sin internet.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 text-xs">
                <Smartphone className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-900 block font-semibold">Ventana Standalone & Atajos</strong>
                  <span className="text-zinc-500 font-normal">Acceso directo desde el icono de tu teléfono o escritorio.</span>
                </div>
              </div>
            </div>

            {/* iOS specific instructions */}
            {isIOS ? (
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs space-y-2 mb-4">
                <span className="font-bold text-amber-900 block">
                  Para instalar en iPhone o iPad (Safari):
                </span>
                <ol className="list-decimal list-inside space-y-1 text-zinc-700">
                  <li className="flex items-center gap-1.5">
                    <span>1. Pulsa el botón</span>
                    <Share2 className="w-3.5 h-3.5 text-zinc-600 inline" />
                    <strong>Compartir</strong>
                    <span>en la barra de Safari.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span>2. Desplaza hacia abajo y selecciona</span>
                    <PlusSquare className="w-3.5 h-3.5 text-zinc-600 inline" />
                    <strong>Añadir a pantalla de inicio</strong>.
                  </li>
                </ol>
              </div>
            ) : null}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-600 transition-colors"
              >
                Quizás luego
              </button>

              {isInstallable ? (
                <button
                  onClick={async () => {
                    const success = await onInstall();
                    if (success) onClose();
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-md active:scale-95"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>Instalar Aplicación</span>
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold"
                >
                  Entendido
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
