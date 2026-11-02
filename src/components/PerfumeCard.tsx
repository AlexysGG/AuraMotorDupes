import React, { useState } from 'react';
import { PerfumeItem } from '../types/perfume';
import { Heart, Clock, Wind, Check, Copy, ArrowUpRight, Flame, Share2 } from 'lucide-react';
import { sharePerfume } from '../services/shareService';

interface PerfumeCardProps {
  perfume: PerfumeItem;
  originalReference?: string;
  isFavorite: boolean;
  onToggleFavorite: (item: PerfumeItem) => void;
  onSelect: (item: PerfumeItem) => void;
}

export const PerfumeCard: React.FC<PerfumeCardProps> = ({
  perfume,
  originalReference,
  isFavorite,
  onToggleFavorite,
  onSelect,
}) => {
  const [copied, setCopied] = useState(false);
  const [sharedToast, setSharedToast] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `${perfume.name} (${perfume.brand}) - ~${perfume.estimatedPrice}€\nNotas: ${perfume.topNotes.join(', ')} / ${perfume.heartNotes.join(', ')} / ${perfume.baseNotes.join(', ')}\nLongevidad: ${perfume.longevityHours}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await sharePerfume(perfume, originalReference);
    if (result.shared) {
      setSharedToast(result.message);
      setTimeout(() => setSharedToast(null), 2500);
    }
  };

  return (
    <article
      onClick={() => onSelect(perfume)}
      className="group relative bg-white rounded-2xl border border-zinc-200/90 hover:border-zinc-300 p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-zinc-200/40 flex flex-col justify-between cursor-pointer"
    >
      {/* Top Bar: Brand, Badge & Favorite */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200/60">
              {perfume.brand}
            </span>
            {perfume.badge && (
              <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-600" />
                {perfume.badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 relative">
            {sharedToast && (
              <span className="absolute right-0 -top-8 whitespace-nowrap bg-zinc-900 text-white text-[10px] px-2 py-1 rounded-md shadow-lg z-20 animate-in fade-in">
                {sharedToast}
              </span>
            )}
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              title="Compartir fragancia"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              title="Copiar detalles"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(perfume);
              }}
              className="p-1.5 rounded-full text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            >
              <Heart
                className={`w-4 h-4 transition-transform active:scale-125 ${
                  isFavorite ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Perfume Name */}
        <h3 className="text-lg sm:text-xl font-bold text-zinc-950 font-serif-luxury group-hover:text-zinc-800 transition-colors">
          {perfume.name}
        </h3>

        {/* Olfactory Family */}
        <p className="text-xs text-zinc-500 mt-0.5 font-normal">
          {perfume.olfactoryFamily}
        </p>

        {/* Price & Savings Badge */}
        <div className="mt-4 pb-4 border-b border-zinc-100 flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold tracking-tight text-zinc-950">
              {perfume.estimatedPrice.toFixed(2)} €
            </span>
            <span className="text-xs text-zinc-400 ml-1.5 font-normal">aprox.</span>
          </div>

          <div className="text-right">
            <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              -{perfume.savingsPercent}% ahorro
            </span>
          </div>
        </div>

        {/* Affinity Match Score */}
        <div className="mt-4 mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-zinc-500 font-medium">Afinidad con la referencia:</span>
            <span className="font-bold text-zinc-900">{perfume.matchScore}% similitud</span>
          </div>
          <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-zinc-900 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${perfume.matchScore}%` }}
            />
          </div>
        </div>

        {/* Olfactory Pyramid Accord Pills */}
        <div className="space-y-2 mb-4 bg-zinc-50/70 p-3 rounded-xl border border-zinc-100 text-xs">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 min-w-14">
              Salida
            </span>
            <span className="text-zinc-700 truncate font-medium">
              {perfume.topNotes.slice(0, 3).join(' · ')}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 min-w-14">
              Corazón
            </span>
            <span className="text-zinc-700 truncate font-medium">
              {perfume.heartNotes.slice(0, 3).join(' · ')}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 min-w-14">
              Fondo
            </span>
            <span className="text-zinc-700 truncate font-medium">
              {perfume.baseNotes.slice(0, 3).join(' · ')}
            </span>
          </div>
        </div>

        {/* Performance Highlights */}
        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 mb-4">
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-zinc-200/60">
            <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-zinc-400 block leading-tight">Duración</span>
              <span className="font-semibold text-zinc-900">{perfume.longevityHours}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-zinc-200/60">
            <Wind className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-zinc-400 block leading-tight">Estela</span>
              <span className="font-semibold text-zinc-900">{perfume.sillage}</span>
            </div>
          </div>
        </div>

        {/* Why it matches */}
        <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed mb-4 italic">
          "{perfume.whyItMatches}"
        </p>
      </div>

      {/* Footer action */}
      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400 font-medium">
          {perfume.bestOccasions[0] || 'Uso versátil'}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-transform">
          Ver análisis completo
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </article>
  );
};
