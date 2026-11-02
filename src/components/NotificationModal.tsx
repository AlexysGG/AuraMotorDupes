import React, { useState, useEffect } from 'react';
import { X, Bell, BellRing, CheckCircle, ShieldAlert, Sparkles, Send } from 'lucide-react';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  triggerSamplePerfumeAlert,
} from '../services/pushNotifications';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setSupported(isPushSupported());
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
  };

  const handleSendTestNotification = async () => {
    const ok = await triggerSamplePerfumeAlert();
    if (ok) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

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
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-serif-luxury text-zinc-950">
              Notificaciones de Dupes
            </h3>
            <p className="text-xs text-zinc-500">Web Push & Alertas del Sistema</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-600 mb-5 leading-relaxed font-normal">
          Recibe alertas instantáneas en tu dispositivo cuando encontremos bajadas de precio en tus fragancias guardadas o nuevos clones accesibles de tus perfumes favoritos.
        </p>

        {/* Status card */}
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 mb-5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 font-medium">Estado del permiso:</span>
            {permission === 'granted' ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                Activadas
              </span>
            ) : permission === 'denied' ? (
              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-100/80 px-2.5 py-0.5 rounded-full font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                Bloqueadas en navegador
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-zinc-600 bg-zinc-200/80 px-2.5 py-0.5 rounded-full font-bold">
                Pendiente de autorización
              </span>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2.5">
          {permission !== 'granted' ? (
            <button
              onClick={handleRequestPermission}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Bell className="w-4 h-4 text-amber-300" />
              <span>Habilitar Notificaciones en este Dispositivo</span>
            </button>
          ) : (
            <button
              onClick={handleSendTestNotification}
              disabled={testSent}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-all"
            >
              {testSent ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>¡Alerta enviada a tu sistema operativo!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>Lanzar Alerta Nativa de Prueba</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
