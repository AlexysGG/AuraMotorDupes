import React, { useState } from 'react';
import { PerfumeItem } from '../types/perfume';
import { X, Heart, Clock, Wind, Check, Sparkles, Shield, Droplets, Calendar, ThumbsUp, Share2 } from 'lucide-react';
import { sharePerfume } from '../services/shareService';

interface PerfumeDetailModalProps {
  perfume: PerfumeItem | null;
  originalReference?: string;
  originalPrice?: number;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (item: PerfumeItem) => void;
}

export const PerfumeDetailModal: React.FC<PerfumeDetailModalProps> = ({
  perfume,
  originalReference = 'Perfume de Referencia',
  originalPrice = 45,
  onClose,
  isFavorite,
  onToggleFavorite,
}) => {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  if (!perfume) return null;

  const handleShare = async () => {
    const res = await sharePerfume(perfume, originalReference);
    if (res.shared) {
      setShareFeedback(res.message);
      setTimeout(() => setShareFeedback(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-8 space-y-6 text-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
          title="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 bg-zinc-100 px-3 py-0.5 rounded-full">
              {perfume.brand}
            </span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {perfume.matchScore}% Afinidad Olfativa
            </span>
            {perfume.badge && (
              <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                {perfume.badge}
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-zinc-950">
            {perfume.name}
          </h2>
          <p className="text-sm text-zinc-500 mt-1 font-normal">
            {perfume.olfactoryFamily} • {perfume.vibeDescription}
          </p>
        </div>

        {/* Price & Savings Comparison Bar */}
        <div className="bg-zinc-50 rounded-2xl p-4 sm:p-5 border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-zinc-400 block font-medium">
              Precio Estimado del Dupe
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-950 font-serif-luxury">
                {perfume.estimatedPrice.toFixed(2)} €
              </span>
              <span className="text-xs text-zinc-400">frente a ~{originalPrice} € original</span>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-600 text-white shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              Ahorras {perfume.savingsPercent}% en tu compra
            </span>
          </div>
        </div>

        {/* Olfactory Pyramid (Pirámide Olfativa Detallada) */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-zinc-500" />
            Estructura Olfativa & Notas
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Top */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/70">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                Salida (0 - 15 min)
              </div>
              <ul className="text-xs text-zinc-700 space-y-1 font-medium">
                {perfume.topNotes.map((note, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Heart */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/70">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700 mb-1">
                Corazón (1 - 4 hrs)
              </div>
              <ul className="text-xs text-zinc-700 space-y-1 font-medium">
                {perfume.heartNotes.map((note, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Base */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/70">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-1">
                Fondo (Secado 4+ hrs)
              </div>
              <ul className="text-xs text-zinc-700 space-y-1 font-medium">
                {perfume.baseNotes.map((note, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sommelier Deep Dive */}
        <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Por qué es la alternativa ideal frente a {originalReference}
          </h4>
          <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-normal">
            {perfume.whyItMatches}
          </p>
        </div>

        {/* Key Strengths & Pros */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5 flex items-center gap-1.5">
            <ThumbsUp className="w-3.5 h-3.5 text-zinc-500" />
            Puntos Fuertes
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {perfume.pros.map((pro, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200/60 text-xs">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-zinc-700 font-medium">{pro}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance & Usage Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-3 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/60">
            <Clock className="w-5 h-5 text-zinc-500 shrink-0" />
            <div>
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Fijación en Piel</span>
              <span className="text-sm font-bold text-zinc-900">{perfume.longevityHours}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/60">
            <Calendar className="w-5 h-5 text-zinc-500 shrink-0" />
            <div>
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Ocasiones Ideales</span>
              <span className="text-xs font-bold text-zinc-900 truncate block">
                {perfume.bestOccasions.join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(perfume)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-zinc-500'}`}
              />
              <span>{isFavorite ? 'Guardado' : 'Añadir a favoritos'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-colors"
              title="Compartir mediante Web Share API"
            >
              <Share2 className="w-4 h-4 text-zinc-600" />
              <span>Compartir</span>
            </button>

            {shareFeedback && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg animate-in fade-in">
                {shareFeedback}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
