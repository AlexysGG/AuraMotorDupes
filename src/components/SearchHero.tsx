import React, { useState } from 'react';
import { Search, SlidersHorizontal, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';

interface SearchHeroProps {
  query: string;
  setQuery: (q: string) => void;
  maxPrice: number;
  setMaxPrice: (p: number) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const PRESET_QUERIES = [
  'quiero un perfume similar de Club de nuit mas barato',
  'alternativa a Baccarat Rouge 540 dulce y económica',
  'dupe cítrico y fresco de Sauvage de Dior para uso diario',
  'clon de Tom Ford Tobacco Vanille para invierno',
  'perfume con olor a limpio y almizcle blanco económico',
];

const BUDGET_PRESETS = [
  { label: 'Ultra Low-Cost', max: 25 },
  { label: 'Económico', max: 35 },
  { label: 'Equilibrado', max: 50 },
  { label: 'Gama Media', max: 80 },
  { label: 'Sin límite', max: 120 },
];

export const SearchHero: React.FC<SearchHeroProps> = ({
  query,
  setQuery,
  maxPrice,
  setMaxPrice,
  onSearch,
  isLoading,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch();
    }
  };

  return (
    <section className="relative pt-10 pb-8 sm:pt-16 sm:pb-12 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Decorative ambient subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-gradient-to-tr from-zinc-100 via-amber-50/20 to-zinc-50 rounded-full blur-3xl -z-10 pointer-events-none opacity-80" />

      {/* Header text */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200/80 shadow-2xs text-[11px] font-medium text-zinc-600 mb-4 tracking-wide uppercase">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Sumiller de Fragancias & Dupes Accesibles</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-zinc-950 font-serif-luxury leading-tight sm:leading-none">
          Encuentra tu aroma ideal al mejor precio
        </h1>
        <p className="mt-3 text-sm sm:text-base text-zinc-500 max-w-xl mx-auto font-normal leading-relaxed">
          Describe qué perfume te gusta o qué notas buscas. Nuestra IA analiza pirámides olfativas y encuentra equivalencias reales y económicas.
        </p>
      </div>

      {/* Main Consultation Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xl shadow-zinc-200/30 p-4 sm:p-7 transition-all">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="perfume-query" className="text-xs font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <span>¿Qué fragancia o estilo buscas?</span>
              </label>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-[11px] text-zinc-400 hover:text-zinc-700 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>

            <div
              className={`relative rounded-xl border transition-all duration-200 bg-zinc-50/60 ${
                isFocused
                  ? 'border-zinc-900 bg-white ring-2 ring-zinc-900/10 shadow-sm'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <textarea
                id="perfume-query"
                rows={2}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (query.trim()) onSearch();
                  }
                }}
                placeholder="Ejemplo: quiero un perfume similar de Club de nuit mas barato..."
                className="w-full bg-transparent p-3.5 sm:p-4 text-sm sm:text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden resize-none font-normal"
              />
            </div>
          </div>

          {/* Budget Slider Section */}
          <div className="pt-2 border-t border-zinc-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                  Presupuesto máximo por frasco
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Límite:</span>
                <span className="text-sm font-bold text-zinc-900 bg-zinc-100 px-3 py-0.5 rounded-full border border-zinc-200">
                  {maxPrice >= 120 ? 'Sin límite (> 120 €)' : `Hasta ${maxPrice} €`}
                </span>
              </div>
            </div>

            {/* Slider input */}
            <div className="px-1 py-2">
              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900 hover:accent-zinc-800 transition-all"
              />
              <div className="flex justify-between text-[11px] text-zinc-400 mt-1 font-medium">
                <span>15 €</span>
                <span>35 €</span>
                <span>60 €</span>
                <span>90 €</span>
                <span>120 €+</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2">
              <span className="text-[11px] text-zinc-400 mr-1">Rápidos:</span>
              {BUDGET_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setMaxPrice(preset.max)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    maxPrice === preset.max
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs font-medium'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  {preset.label} {preset.max < 120 && `(${preset.max}€)`}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button: Exact label "consultar" as specified */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="w-full relative group flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-sm sm:text-base font-medium tracking-wide transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Consultando con el sumiller IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold capitalize">consultar</span>
                  <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Suggested quick chips */}
      <div className="mt-5 text-center">
        <p className="text-[11px] uppercase tracking-wider text-zinc-400 mb-2 font-medium">
          O prueba una de estas consultas populares:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {PRESET_QUERIES.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setQuery(preset);
                // Also auto set sensible budget if it's Club de Nuit
                if (preset.includes('Club de nuit')) {
                  setMaxPrice(35);
                }
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:border-zinc-400 hover:bg-zinc-50 transition-all text-left shadow-2xs"
            >
              "{preset}"
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
