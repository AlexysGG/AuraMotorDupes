/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { SearchHero } from './components/SearchHero';
import { ResultsSection } from './components/ResultsSection';
import { PerfumeDetailModal } from './components/PerfumeDetailModal';
import { WishlistDrawer } from './components/WishlistDrawer';
import { OfflineBanner } from './components/OfflineBanner';
import { InstallModal } from './components/InstallModal';
import { NotificationModal } from './components/NotificationModal';
import { RecommendationResponse, PerfumeItem } from './types/perfume';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import {
  cacheQueryResult,
  getCachedQueryResult,
  saveFavoriteDB,
  removeFavoriteDB,
  getFavoritesDB,
  queueOfflineAction,
} from './services/db';
import { Sparkles, Info, RefreshCw, Feather, WifiOff } from 'lucide-react';

export default function App() {
  const [query, setQuery] = useState('quiero un perfume similar de Club de nuit mas barato');
  const [maxPrice, setMaxPrice] = useState(35);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [selectedPerfume, setSelectedPerfume] = useState<PerfumeItem | null>(null);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // PWA Hooks
  const { isInstallable, isInstalled, isStandalone, isIOS, triggerInstall } = usePWAInstall();

  // Network & Sync Hook
  const { isOnline, wasOffline, pendingSyncCount, refreshPendingCount, processPendingSync } =
    useNetworkStatus((syncedCount) => {
      setOfflineNotice(`¡Sincronización completada! (${syncedCount} acción${syncedCount > 1 ? 'es' : ''} actualizada${syncedCount > 1 ? 's' : ''})`);
      setTimeout(() => setOfflineNotice(null), 3000);
    });

  // Favorites state backed by both IndexedDB and LocalStorage fallback
  const [favorites, setFavorites] = useState<PerfumeItem[]>(() => {
    try {
      const saved = localStorage.getItem('aura_perfume_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Initial favorites load from IndexedDB
  useEffect(() => {
    getFavoritesDB().then((dbFavorites) => {
      if (dbFavorites && dbFavorites.length > 0) {
        setFavorites(dbFavorites);
      }
    });
  }, []);

  const handleToggleFavorite = async (item: PerfumeItem) => {
    const exists = favorites.some((p) => p.id === item.id);
    let updated: PerfumeItem[];

    if (exists) {
      updated = favorites.filter((p) => p.id !== item.id);
      await removeFavoriteDB(item.id);
    } else {
      updated = [...favorites, item];
      await saveFavoriteDB(item);
    }

    setFavorites(updated);
    try {
      localStorage.setItem('aura_perfume_favorites', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    if (!navigator.onLine) {
      await queueOfflineAction('toggle_favorite', { item, action: exists ? 'remove' : 'add' });
      await refreshPendingCount();
    }
  };

  const handleConsultar = useCallback(
    async (searchQuery = query, budget = maxPrice) => {
      if (!searchQuery.trim()) return;
      setIsLoading(true);
      setError(null);
      setOfflineNotice(null);

      // Check IndexedDB cache first
      const cached = await getCachedQueryResult(searchQuery, budget);

      if (!navigator.onLine) {
        // In offline mode: use cached if available
        if (cached) {
          setResults(cached);
          setOfflineNotice('Mostrando resultados cacheados en tu dispositivo (Modo Offline).');
          setIsLoading(false);
          return;
        }

        // If not cached, queue query for background sync
        await queueOfflineAction('search_query', { query: searchQuery, maxPrice: budget });
        await refreshPendingCount();
      }

      try {
        const res = await fetch('/api/recommend-perfumes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: searchQuery,
            maxPrice: budget,
            minPrice: 0,
          }),
        });

        if (!res.ok) {
          throw new Error('Error al conectar con el sumiller inteligente.');
        }

        const data: RecommendationResponse = await res.json();
        setResults(data);

        // Store in IndexedDB for instant offline retrieval
        await cacheQueryResult(searchQuery, budget, data);

        // Scroll to results gently
        setTimeout(() => {
          const el = document.getElementById('results-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } catch (err: any) {
        console.error('Fetch error:', err);

        // If fetch fails but we had cached data in IndexedDB, fallback to it
        if (cached) {
          setResults(cached);
          setOfflineNotice('Conexión inestable. Se muestran los últimos datos cacheados en tu dispositivo.');
        } else {
          setError(
            !navigator.onLine
              ? 'Sin conexión a internet. La consulta se ha encolado para sincronizarse automáticamente cuando recuperes la señal.'
              : err.message || 'No pudimos obtener la recomendación. Inténtalo de nuevo.'
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [query, maxPrice, refreshPendingCount]
  );

  // App Shortcuts Handling (from URL ?action=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');

    if (action === 'wishlist') {
      setIsWishlistOpen(true);
    } else if (action === 'club_de_nuit') {
      const q = 'quiero un perfume similar de Club de nuit mas barato';
      setQuery(q);
      setMaxPrice(35);
      handleConsultar(q, 35);
    } else if (action === 'sommelier') {
      const q = 'asesoramiento del sumiller olfativo para fragancias versátiles y económicas';
      setQuery(q);
      setMaxPrice(40);
      handleConsultar(q, 40);
    } else {
      // Default initial query
      handleConsultar('quiero un perfume similar de Club de nuit mas barato', 35);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-zinc-900 selection:bg-zinc-900 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        favoritesCount={favorites.length}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onReset={() => {
          setQuery('quiero un perfume similar de Club de nuit mas barato');
          setMaxPrice(35);
          handleConsultar('quiero un perfume similar de Club de nuit mas barato', 35);
        }}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isStandalone={isStandalone}
      />

      {/* Offline Status & Background Sync Alert Banner */}
      <OfflineBanner
        isOnline={isOnline}
        wasOffline={wasOffline}
        pendingSyncCount={pendingSyncCount}
        onManualSync={processPendingSync}
      />

      <main className="flex-1">
        {/* Offline Notice Badge */}
        {offlineNotice && (
          <div className="max-w-4xl mx-auto px-4 mt-4">
            <div className="bg-amber-50 border border-amber-200/80 text-amber-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{offlineNotice}</span>
              </div>
              <button
                onClick={() => setOfflineNotice(null)}
                className="font-bold underline ml-2 text-amber-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Hero & Input Section */}
        <SearchHero
          query={query}
          setQuery={setQuery}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          onSearch={() => handleConsultar(query, maxPrice)}
          isLoading={isLoading}
        />

        {/* Error message */}
        {error && (
          <div className="max-w-2xl mx-auto px-4 my-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => handleConsultar(query, maxPrice)}
                className="font-bold underline hover:no-underline ml-3 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <ResultsSection
            data={results}
            currentMaxPrice={maxPrice}
            onAdjustMaxPrice={(newMax) => {
              setMaxPrice(newMax);
              handleConsultar(query, newMax);
            }}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectPerfume={(perfume) => setSelectedPerfume(perfume)}
          />
        )}
      </main>

      {/* Fragrance Details Modal with Web Share API */}
      <PerfumeDetailModal
        perfume={selectedPerfume}
        originalReference={results?.originalReference}
        originalPrice={results?.originalEstimatedPrice}
        onClose={() => setSelectedPerfume(null)}
        isFavorite={selectedPerfume ? favorites.some((f) => f.id === selectedPerfume.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        favorites={favorites}
        onRemoveFavorite={async (id) => {
          const item = favorites.find((f) => f.id === id);
          if (item) {
            await handleToggleFavorite(item);
          }
        }}
        onClearAll={async () => {
          for (const item of favorites) {
            await removeFavoriteDB(item.id);
          }
          setFavorites([]);
          localStorage.removeItem('aura_perfume_favorites');
        }}
        onSelectPerfume={(item) => {
          setSelectedPerfume(item);
          setIsWishlistOpen(false);
        }}
      />

      {/* PWA Install Modal */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onInstall={triggerInstall}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
      />

      {/* Web Push & Native Notification Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-zinc-200/80 bg-white py-8 mt-16 text-center text-xs text-zinc-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800 tracking-wider font-serif-luxury">AURA</span>
            <span>• PWA & Atelier Olfativo con IA y Persistencia Offline</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-500">
            <span>Precios orientativos en tiendas europeas</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Feather className="w-3 h-3" />
              Diseño PWA Standalone
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
