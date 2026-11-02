import React from 'react';
import { PerfumeItem } from '../types/perfume';
import { X, Trash2, Heart, ExternalLink, ArrowRight } from 'lucide-react';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: PerfumeItem[];
  onRemoveFavorite: (id: string) => void;
  onClearAll: () => void;
  onSelectPerfume: (item: PerfumeItem) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  favorites,
  onRemoveFavorite,
  onClearAll,
  onSelectPerfume,
}) => {
  if (!isOpen) return null;

  const totalCost = favorites.reduce((sum, item) => sum + item.estimatedPrice, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between text-zinc-900 border-l border-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
              <h3 className="text-lg font-bold font-serif-luxury text-zinc-950">
                Mis Fragancias Guardadas
              </h3>
              <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded-full font-bold text-zinc-700">
                {favorites.length}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="py-4 space-y-3 max-h-[65vh] overflow-y-auto">
            {favorites.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <Heart className="w-8 h-8 mx-auto mb-2 opacity-30 text-zinc-400" />
                <p className="text-sm font-medium">Aún no has guardado perfumes</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Pulsa el corazón en cualquier resultado para compararlo luego.
                </p>
              </div>
            ) : (
              favorites.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectPerfume(item)}
                  className="group p-3.5 rounded-xl border border-zinc-200/80 hover:border-zinc-300 bg-zinc-50/50 hover:bg-white transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                      {item.brand}
                    </span>
                    <h4 className="text-sm font-bold text-zinc-900 font-serif-luxury truncate group-hover:text-zinc-700">
                      {item.name}
                    </h4>
                    <span className="text-xs font-semibold text-zinc-800">
                      {item.estimatedPrice.toFixed(2)} €
                    </span>
                    <span className="text-[11px] text-emerald-600 font-medium ml-2">
                      ({item.matchScore}% afinidad)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFavorite(item.id);
                    }}
                    className="p-1.5 rounded-lg text-zinc-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Eliminar de guardados"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer with summary */}
        {favorites.length > 0 && (
          <div className="pt-4 border-t border-zinc-100 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Inversión estimada:</span>
              <span className="text-lg font-bold text-zinc-950 font-serif-luxury">
                {totalCost.toFixed(2)} €
              </span>
            </div>

            <button
              onClick={onClearAll}
              className="w-full text-xs text-zinc-400 hover:text-zinc-600 py-1 transition-colors"
            >
              Vaciar lista de guardados
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
