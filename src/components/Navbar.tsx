import React from 'react';
import { Sparkles, Heart, ShieldCheck, Download, Bell, Smartphone } from 'lucide-react';

interface NavbarProps {
  favoritesCount: number;
  onOpenWishlist: () => void;
  onReset: () => void;
  onOpenInstall: () => void;
  onOpenNotifications: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  favoritesCount,
  onOpenWishlist,
  onReset,
  onOpenInstall,
  onOpenNotifications,
  isInstallable,
  isInstalled,
  isStandalone,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-zinc-100 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={onReset}
          className="flex items-center gap-3 group text-left transition-transform active:scale-95"
        >
          <div className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-xs group-hover:bg-zinc-800 transition-colors">
            <Sparkles className="w-4 h-4 text-zinc-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-wider text-sm uppercase text-zinc-900">AURA</span>
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-xs bg-zinc-100 text-zinc-600 font-medium border border-zinc-200/60">
                AI Atelier
              </span>
              {isStandalone && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] uppercase tracking-widest px-1.5 py-0.2 rounded-xs bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  <Smartphone className="w-2.5 h-2.5" /> App
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 font-normal">Sumiller de Fragancias & Dupes</p>
          </div>
        </button>

        {/* Right tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-50 border border-zinc-200/60 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Precios & dupes verificados</span>
          </div>

          {/* Native Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-full text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200/70 transition-all shadow-2xs"
            title="Configurar notificaciones de dupes"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>

          {/* PWA Install Button */}
          {!isStandalone && (
            <button
              onClick={onOpenInstall}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 shadow-2xs ${
                isInstallable
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
              }`}
              title="Instalar Aura como aplicación nativa"
            >
              <Download className={`w-3.5 h-3.5 ${isInstallable ? 'text-amber-300 animate-bounce' : 'text-zinc-500'}`} />
              <span className="hidden sm:inline">
                {isInstalled ? 'App Lista' : 'Instalar App'}
              </span>
            </button>
          )}

          {/* Wishlist Button */}
          <button
            onClick={onOpenWishlist}
            className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 transition-all active:scale-95 shadow-2xs"
            title="Ver favoritos guardados"
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : 'text-zinc-600'}`} />
            <span className="hidden sm:inline">Favoritos</span>
            {favoritesCount > 0 && (
              <span className="bg-zinc-900 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {favoritesCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
