import React, { useState, useEffect, useCallback, useMemo } from 'https://esm.sh/react@19.0.0';
import { createRoot } from 'https://esm.sh/react-dom@19.0.0/client';
import {
  Sparkles, Heart, Search, SlidersHorizontal, ArrowRight, RotateCcw,
  ShieldCheck, Download, Bell, BellRing, Smartphone, Wifi, WifiOff,
  RefreshCw, Database, X, Check, Copy, Flame, Clock, Wind, ArrowUpRight,
  Droplets, Calendar, ThumbsUp, Trash2, Zap, Share2, PlusSquare, CheckCircle,
  ShieldAlert, Send, ArrowUpDown, Tag, AlertCircle, Feather
} from 'https://esm.sh/lucide-react@0.460.0';

// ======================== INDEXEDDB SERVICE ========================
const DB_NAME = 'AuraPerfumeDB';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error('IndexedDB not supported'));
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('queries_cache')) {
        db.createObjectStore('queries_cache', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('offline_sync_queue')) {
        const syncStore = db.createObjectStore('offline_sync_queue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('status', 'status', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function makeKey(query, maxPrice) {
  return `${query.trim().toLowerCase()}_${maxPrice}`;
}

async function cacheQueryResult(query, maxPrice, data) {
  try {
    const db = await openDB();
    const tx = db.transaction('queries_cache', 'readwrite');
    tx.objectStore('queries_cache').put({
      id: makeKey(query, maxPrice),
      query,
      maxPrice,
      data,
      savedAt: Date.now()
    });
  } catch (err) {
    console.warn('[DB] cache error:', err);
  }
}

async function getCachedQueryResult(query, maxPrice) {
  try {
    const db = await openDB();
    const tx = db.transaction('queries_cache', 'readonly');
    const store = tx.objectStore('queries_cache');
    return new Promise((resolve) => {
      const req = store.get(makeKey(query, maxPrice));
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveFavoriteDB(perfume) {
  try {
    const db = await openDB();
    const tx = db.transaction('favorites', 'readwrite');
    tx.objectStore('favorites').put({ ...perfume, savedAt: Date.now() });
  } catch (err) {
    console.warn('[DB] save favorite error:', err);
  }
}

async function removeFavoriteDB(id) {
  try {
    const db = await openDB();
    const tx = db.transaction('favorites', 'readwrite');
    tx.objectStore('favorites').delete(id);
  } catch (err) {
    console.warn('[DB] remove favorite error:', err);
  }
}

async function getFavoritesDB() {
  try {
    const db = await openDB();
    const tx = db.transaction('favorites', 'readonly');
    return new Promise((resolve) => {
      const req = tx.objectStore('favorites').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

async function queueOfflineAction(action, payload) {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_sync_queue', 'readwrite');
    tx.objectStore('offline_sync_queue').add({
      action,
      payload,
      createdAt: Date.now(),
      status: 'pending'
    });
  } catch (err) {
    console.warn('[DB] queue offline action error:', err);
  }
}

async function getPendingSyncQueue() {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_sync_queue', 'readonly');
    return new Promise((resolve) => {
      const req = tx.objectStore('offline_sync_queue').getAll();
      req.onsuccess = () => resolve((req.result || []).filter(i => i.status === 'pending'));
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

async function removeSyncQueueItem(id) {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_sync_queue', 'readwrite');
    tx.objectStore('offline_sync_queue').delete(id);
  } catch (e) {}
}

// ======================== WEB SHARE SERVICE ========================
async function sharePerfume(perfume, originalReference) {
  const shareTitle = `Aura Dupe: ${perfume.name} (${perfume.brand})`;
  const refText = originalReference ? ` Alternativa a ${originalReference}.` : '';
  const shareText = `¡Mira esta fragancia de Aura! ✨\n${perfume.name} (${perfume.brand}) por solo ~${perfume.estimatedPrice.toFixed(2)}€ (${perfume.matchScore}% afinidad).${refText}\nFamilia: ${perfume.olfactoryFamily}\nDuración: ${perfume.longevityHours}`;
  const shareUrl = window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      return { shared: true, message: 'Compartido correctamente' };
    } catch (e) {
      if (e.name === 'AbortError') return { shared: false, message: 'Cancelado' };
    }
  }

  try {
    await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    return { shared: true, message: '¡Detalles copiados al portapapeles!' };
  } catch {
    return { shared: false, message: 'No se pudo copiar' };
  }
}

// ======================== WEB PUSH NOTIFICATIONS ========================
async function triggerSampleNotification() {
  if (!('Notification' in window)) return false;
  let perm = Notification.permission;
  if (perm !== 'granted') {
    perm = await Notification.requestPermission();
  }
  if (perm !== 'granted') return false;

  const title = '¡Alerta de Dupe Encontrado! 🌟';
  const options = {
    body: 'Vibrant Leather (Zara) está disponible como alternativa directa a Club de Nuit por solo 22.95€ (-45% ahorro).',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { url: '/?action=club_de_nuit' }
  };

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    if (reg.showNotification) {
      await reg.showNotification(title, options);
      return true;
    }
  }
  new Notification(title, options);
  return true;
}

// ======================== MAIN REACT APPLICATION ========================
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

function App() {
  const [query, setQuery] = useState('quiero un perfume similar de Club de nuit mas barato');
  const [maxPrice, setMaxPrice] = useState(35);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offlineNotice, setOfflineNotice] = useState(null);
  const [results, setResults] = useState(null);
  const [selectedPerfume, setSelectedPerfume] = useState(null);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [sharedToast, setSharedToast] = useState(null);
  const [sortBy, setSortBy] = useState('affinity');

  // Network State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  );
  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());

  // Favorites
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_perfume_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const refreshPendingCount = useCallback(async () => {
    const list = await getPendingSyncQueue();
    setPendingSyncCount(list.length);
  }, []);

  const processPendingSync = useCallback(async () => {
    const list = await getPendingSyncQueue();
    if (list.length === 0) return;
    for (const it of list) {
      if (it.id) await removeSyncQueueItem(it.id);
    }
    await refreshPendingCount();
    setOfflineNotice(`¡Sincronización completada! (${list.length} acciones actualizadas)`);
    setTimeout(() => setOfflineNotice(null), 3000);
  }, [refreshPendingCount]);

  // Network listeners
  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      processPendingSync();
      setTimeout(() => setWasOffline(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA beforeinstallprompt capture
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [processPendingSync, refreshPendingCount]);

  // Load favorites from DB
  useEffect(() => {
    getFavoritesDB().then(dbFavs => {
      if (dbFavs && dbFavs.length > 0) setFavorites(dbFavs);
    });
  }, []);

  const handleToggleFavorite = async (item) => {
    const exists = favorites.some(p => p.id === item.id);
    let updated;
    if (exists) {
      updated = favorites.filter(p => p.id !== item.id);
      await removeFavoriteDB(item.id);
    } else {
      updated = [...favorites, item];
      await saveFavoriteDB(item);
    }
    setFavorites(updated);
    try {
      localStorage.setItem('aura_perfume_favorites', JSON.stringify(updated));
    } catch {}

    if (!navigator.onLine) {
      await queueOfflineAction('toggle_favorite', { item, action: exists ? 'remove' : 'add' });
      await refreshPendingCount();
    }
  };

  const handleConsultar = useCallback(async (searchQuery = query, budget = maxPrice) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    setOfflineNotice(null);

    const cached = await getCachedQueryResult(searchQuery, budget);

    if (!navigator.onLine) {
      if (cached) {
        setResults(cached);
        setOfflineNotice('Mostrando resultados cacheados en tu dispositivo (Modo Offline).');
        setIsLoading(false);
        return;
      }
      await queueOfflineAction('search_query', { query: searchQuery, maxPrice: budget });
      await refreshPendingCount();
    }

    try {
      const res = await fetch('/api/recommend-perfumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, maxPrice: budget, minPrice: 0 })
      });

      if (!res.ok) throw new Error('Error al conectar con el sumiller inteligente.');

      const data = await res.json();
      setResults(data);
      await cacheQueryResult(searchQuery, budget, data);

      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      if (cached) {
        setResults(cached);
        setOfflineNotice('Conexión inestable. Se muestran los últimos datos cacheados en tu dispositivo.');
      } else {
        setError(!navigator.onLine
          ? 'Sin conexión. La consulta se ha encolado para sincronizarse automáticamente.'
          : err.message || 'Error al obtener la recomendación.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [query, maxPrice, refreshPendingCount]);

  // Handle URL shortcuts (?action=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'wishlist') setIsWishlistOpen(true);
    else if (action === 'club_de_nuit') {
      const q = 'quiero un perfume similar de Club de nuit mas barato';
      setQuery(q); setMaxPrice(35); handleConsultar(q, 35);
    } else if (action === 'sommelier') {
      const q = 'asesoramiento del sumiller olfativo para fragancias versátiles y económicas';
      setQuery(q); setMaxPrice(40); handleConsultar(q, 40);
    } else {
      handleConsultar('quiero un perfume similar de Club de nuit mas barato', 35);
    }
  }, []);

  const triggerInstallPrompt = async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
    } catch (e) {}
    return false;
  };

  const filteredItems = useMemo(() => {
    if (!results?.recommendations) return [];
    return results.recommendations.filter(item => item.estimatedPrice <= maxPrice);
  }, [results, maxPrice]);

  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    if (sortBy === 'affinity') return list.sort((a, b) => b.matchScore - a.matchScore);
    if (sortBy === 'price-asc') return list.sort((a, b) => a.estimatedPrice - b.estimatedPrice);
    if (sortBy === 'longevity') {
      const parseHours = (h) => parseInt(h.split('-')[0] || '6', 10);
      return list.sort((a, b) => parseHours(b.longevityHours) - parseHours(a.longevityHours));
    }
    return list;
  }, [filteredItems, sortBy]);

  const favoriteIds = useMemo(() => new Set(favorites.map(f => f.id)), [favorites]);

  return (
    React.createElement('div', { className: 'min-h-screen flex flex-col bg-[#FAFAFA] text-zinc-900 selection:bg-zinc-900 selection:text-white' },
      // Top Navbar
      React.createElement('header', { className: 'sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-zinc-100' },
        React.createElement('div', { className: 'max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between' },
          React.createElement('button', {
            onClick: () => {
              setQuery('quiero un perfume similar de Club de nuit mas barato');
              setMaxPrice(35);
              handleConsultar('quiero un perfume similar de Club de nuit mas barato', 35);
            },
            className: 'flex items-center gap-3 text-left'
          },
            React.createElement('div', { className: 'w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-xs' },
              React.createElement(Sparkles, { className: 'w-4 h-4 text-zinc-100' })
            ),
            React.createElement('div', null,
              React.createElement('div', { className: 'flex items-center gap-2' },
                React.createElement('span', { className: 'font-semibold tracking-wider text-sm uppercase text-zinc-900' }, 'AURA'),
                React.createElement('span', { className: 'text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-xs bg-zinc-100 text-zinc-600 font-medium border border-zinc-200/60' }, 'AI Atelier'),
                isStandalone && React.createElement('span', { className: 'hidden sm:inline-flex items-center gap-1 text-[9px] uppercase tracking-widest px-1.5 py-0.2 rounded-xs bg-emerald-50 text-emerald-700 font-bold border border-emerald-200' },
                  React.createElement(Smartphone, { className: 'w-2.5 h-2.5' }), ' App'
                )
              ),
              React.createElement('p', { className: 'text-[11px] text-zinc-400' }, 'Sumiller de Fragancias & Dupes')
            )
          ),
          React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3' },
            React.createElement('div', { className: 'hidden lg:flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-50 border border-zinc-200/60 px-3 py-1.5 rounded-full' },
              React.createElement(ShieldCheck, { className: 'w-3.5 h-3.5 text-emerald-600' }),
              React.createElement('span', null, 'Precios & dupes verificados')
            ),
            React.createElement('button', {
              onClick: () => setIsNotificationModalOpen(true),
              className: 'p-2 rounded-full text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200/70 transition-all shadow-2xs',
              title: 'Notificaciones de Dupes'
            }, React.createElement(Bell, { className: 'w-3.5 h-3.5' })),
            !isStandalone && React.createElement('button', {
              onClick: () => setIsInstallModalOpen(true),
              className: `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-2xs ${isInstallable ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200'}`,
              title: 'Instalar Aura App'
            },
              React.createElement(Download, { className: `w-3.5 h-3.5 ${isInstallable ? 'text-amber-300 animate-bounce' : 'text-zinc-500'}` }),
              React.createElement('span', { className: 'hidden sm:inline' }, isInstalled ? 'App Lista' : 'Instalar App')
            ),
            React.createElement('button', {
              onClick: () => setIsWishlistOpen(true),
              className: 'relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 shadow-2xs'
            },
              React.createElement(Heart, { className: `w-3.5 h-3.5 ${favorites.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-zinc-600'}` }),
              React.createElement('span', { className: 'hidden sm:inline' }, 'Favoritos'),
              favorites.length > 0 && React.createElement('span', { className: 'bg-zinc-900 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full' }, favorites.length)
            )
          )
        )
      ),

      // Offline Banner
      (!isOnline || wasOffline) && React.createElement('aside', {
        className: `sticky top-16 z-30 text-xs px-4 py-2.5 shadow-md flex items-center justify-between ${isOnline ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-100 border-b border-zinc-800'}`
      },
        React.createElement('div', { className: 'max-w-6xl mx-auto w-full flex items-center justify-between' },
          isOnline ? React.createElement('div', { className: 'flex items-center gap-2' },
            React.createElement(Wifi, { className: 'w-4 h-4 text-emerald-200 animate-pulse' }),
            React.createElement('span', { className: 'font-semibold' }, '¡Conexión a internet restablecida! Sincronizando datos...')
          ) : React.createElement('div', { className: 'flex items-center gap-2.5' },
            React.createElement('div', { className: 'w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center' },
              React.createElement(WifiOff, { className: 'w-3.5 h-3.5' })
            ),
            React.createElement('div', null,
              React.createElement('span', { className: 'font-bold text-amber-400' }, 'Modo Sin Conexión Activo: '),
              React.createElement('span', { className: 'text-zinc-300' }, 'Navegando catálogo y fragancias guardadas en tu memoria local.')
            )
          ),
          React.createElement('div', { className: 'flex items-center gap-3' },
            pendingSyncCount > 0 && React.createElement('span', { className: 'flex items-center gap-1.5 text-[11px] bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-300' },
              React.createElement(Database, { className: 'w-3 h-3 text-amber-400' }),
              `${pendingSyncCount} en cola`
            ),
            React.createElement('button', {
              onClick: processPendingSync,
              className: 'px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold border border-zinc-700'
            }, 'Reintentar')
          )
        )
      ),

      // Main content
      React.createElement('main', { className: 'flex-1' },
        offlineNotice && React.createElement('div', { className: 'max-w-4xl mx-auto px-4 mt-4' },
          React.createElement('div', { className: 'bg-amber-50 border border-amber-200/80 text-amber-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between' },
            React.createElement('div', { className: 'flex items-center gap-2' },
              React.createElement(WifiOff, { className: 'w-4 h-4 text-amber-600 shrink-0' }),
              React.createElement('span', null, offlineNotice)
            ),
            React.createElement('button', { onClick: () => setOfflineNotice(null), className: 'font-bold underline ml-2' }, 'Cerrar')
          )
        ),

        // Hero Search Section
        React.createElement('section', { className: 'relative pt-10 pb-8 sm:pt-16 sm:pb-12 px-4 sm:px-6 max-w-4xl mx-auto' },
          React.createElement('div', { className: 'text-center mb-8 sm:mb-10' },
            React.createElement('div', { className: 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200/80 text-[11px] font-medium text-zinc-600 mb-4 tracking-wide uppercase' },
              React.createElement(Sparkles, { className: 'w-3 h-3 text-amber-500' }),
              React.createElement('span', null, 'Sumiller de Fragancias & Dupes Accesibles con IA')
            ),
            React.createElement('h1', { className: 'text-3xl sm:text-5xl font-normal tracking-tight text-zinc-950 font-serif-luxury leading-tight sm:leading-none' },
              'Encuentra tu aroma ideal al mejor precio'
            ),
            React.createElement('p', { className: 'mt-3 text-sm sm:text-base text-zinc-500 max-w-xl mx-auto font-normal leading-relaxed' },
              'Describe qué perfume te gusta o qué notas buscas. Nuestra IA analiza pirámides olfativas y encuentra equivalencias reales y económicas.'
            )
          ),

          // Search Form Card
          React.createElement('div', { className: 'bg-white rounded-2xl border border-zinc-200/90 shadow-xl shadow-zinc-200/30 p-4 sm:p-7' },
            React.createElement('form', {
              onSubmit: (e) => { e.preventDefault(); if (query.trim()) handleConsultar(query, maxPrice); },
              className: 'space-y-6'
            },
              React.createElement('div', null,
                React.createElement('div', { className: 'flex items-center justify-between mb-2' },
                  React.createElement('label', { className: 'text-xs font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5' },
                    React.createElement(Search, { className: 'w-3.5 h-3.5 text-zinc-400' }),
                    React.createElement('span', null, '¿Qué fragancia o estilo buscas?')
                  ),
                  query && React.createElement('button', {
                    type: 'button',
                    onClick: () => setQuery(''),
                    className: 'text-[11px] text-zinc-400 hover:text-zinc-700 flex items-center gap-1'
                  }, React.createElement(RotateCcw, { className: 'w-3 h-3' }), 'Limpiar')
                ),
                React.createElement('div', { className: 'relative rounded-xl border border-zinc-200 bg-zinc-50/60 p-1' },
                  React.createElement('textarea', {
                    rows: 2,
                    value: query,
                    onChange: (e) => setQuery(e.target.value),
                    onKeyDown: (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleConsultar(query, maxPrice); } },
                    placeholder: 'Ejemplo: quiero un perfume similar de Club de nuit mas barato...',
                    className: 'w-full bg-transparent p-3 sm:p-4 text-sm sm:text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none resize-none'
                  })
                )
              ),

              // Budget Slider
              React.createElement('div', { className: 'pt-2 border-t border-zinc-100' },
                React.createElement('div', { className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3' },
                  React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement(SlidersHorizontal, { className: 'w-3.5 h-3.5 text-zinc-500' }),
                    React.createElement('span', { className: 'text-xs font-semibold text-zinc-700 uppercase tracking-wide' }, 'Presupuesto máximo por frasco')
                  ),
                  React.createElement('span', { className: 'text-sm font-bold text-zinc-900 bg-zinc-100 px-3 py-0.5 rounded-full border border-zinc-200' },
                    maxPrice >= 120 ? 'Sin límite (> 120 €)' : `Hasta ${maxPrice} €`
                  )
                ),
                React.createElement('input', {
                  type: 'range', min: 15, max: 120, step: 5, value: maxPrice,
                  onChange: (e) => setMaxPrice(parseInt(e.target.value, 10)),
                  className: 'w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900'
                }),
                React.createElement('div', { className: 'flex justify-between text-[11px] text-zinc-400 mt-1 font-medium' },
                  React.createElement('span', null, '15 €'), React.createElement('span', null, '35 €'),
                  React.createElement('span', null, '60 €'), React.createElement('span', null, '90 €'), React.createElement('span', null, '120 €+')
                ),
                React.createElement('div', { className: 'flex flex-wrap items-center gap-1.5 mt-3 pt-2' },
                  React.createElement('span', { className: 'text-[11px] text-zinc-400 mr-1' }, 'Rápidos:'),
                  BUDGET_PRESETS.map(preset => React.createElement('button', {
                    key: preset.label, type: 'button',
                    onClick: () => setMaxPrice(preset.max),
                    className: `text-xs px-2.5 py-1 rounded-full border ${maxPrice === preset.max ? 'bg-zinc-900 text-white border-zinc-900 font-medium' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`
                  }, `${preset.label} ${preset.max < 120 ? `(${preset.max}€)` : ''}`))
                )
              ),

              // Consult button
              React.createElement('button', {
                type: 'submit', disabled: isLoading || !query.trim(),
                className: 'w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 text-white text-sm sm:text-base font-medium shadow-md transition-all active:scale-[0.99] cursor-pointer'
              },
                isLoading ? React.createElement(React.Fragment, null,
                  React.createElement('div', { className: 'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' }),
                  React.createElement('span', null, 'Consultando con el sumiller IA...')
                ) : React.createElement(React.Fragment, null,
                  React.createElement(Sparkles, { className: 'w-4 h-4 text-amber-300' }),
                  React.createElement('span', { className: 'font-semibold capitalize' }, 'consultar'),
                  React.createElement(ArrowRight, { className: 'w-4 h-4 text-zinc-300' })
                )
              )
            )
          ),

          // Preset queries chips
          React.createElement('div', { className: 'mt-5 text-center' },
            React.createElement('p', { className: 'text-[11px] uppercase tracking-wider text-zinc-400 mb-2 font-medium' }, 'O prueba una de estas consultas populares:'),
            React.createElement('div', { className: 'flex flex-wrap justify-center gap-2' },
              PRESET_QUERIES.map(preset => React.createElement('button', {
                key: preset, type: 'button',
                onClick: () => {
                  setQuery(preset);
                  if (preset.includes('Club de nuit')) setMaxPrice(35);
                },
                className: 'text-xs px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:border-zinc-400 hover:bg-zinc-50 shadow-2xs text-left'
              }, `"${preset}"`))
            )
          )
        ),

        // Error message
        error && React.createElement('div', { className: 'max-w-2xl mx-auto px-4 my-4' },
          React.createElement('div', { className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between text-xs' },
            React.createElement('div', { className: 'flex items-center gap-2' },
              React.createElement(AlertCircle, { className: 'w-4 h-4 shrink-0' }),
              React.createElement('span', null, error)
            ),
            React.createElement('button', { onClick: () => handleConsultar(query, maxPrice), className: 'font-bold underline ml-3 flex items-center gap-1' },
              React.createElement(RefreshCw, { className: 'w-3 h-3' }), 'Reintentar'
            )
          )
        ),

        // Results Section
        results && React.createElement('section', { id: 'results-section', className: 'max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12' },
          // Sommelier Verdict Card
          React.createElement('div', { className: 'bg-white rounded-2xl border border-zinc-200/90 p-5 sm:p-7 shadow-xs mb-8' },
            React.createElement('div', { className: 'flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-100' },
              React.createElement('div', null,
                React.createElement('div', { className: 'flex items-center gap-2 mb-1.5' },
                  React.createElement('span', { className: 'inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500' },
                    React.createElement(Sparkles, { className: 'w-3.5 h-3.5 text-amber-500' }), 'Veredicto del Sumiller'
                  ),
                  React.createElement('span', { className: 'text-zinc-300' }, '•'),
                  React.createElement('span', { className: 'text-xs text-zinc-500' },
                    'Referencia: ', React.createElement('strong', { className: 'text-zinc-900 font-semibold' }, results.originalReference)
                  )
                ),
                React.createElement('p', { className: 'text-sm sm:text-base text-zinc-700 leading-relaxed max-w-3xl' }, results.analysis)
              ),
              results.originalEstimatedPrice > 0 && React.createElement('div', { className: 'shrink-0 bg-zinc-50 border border-zinc-200/70 rounded-xl px-4 py-3 flex items-center gap-4' },
                React.createElement('div', null,
                  React.createElement('span', { className: 'text-[11px] uppercase tracking-wider text-zinc-400 block font-medium' }, 'Precio Ref. Original'),
                  React.createElement('span', { className: 'text-lg font-bold text-zinc-900 line-through decoration-zinc-400' }, `~${results.originalEstimatedPrice} €`)
                ),
                React.createElement('div', { className: 'h-8 w-px bg-zinc-200' }),
                React.createElement('div', null,
                  React.createElement('span', { className: 'text-[11px] uppercase tracking-wider text-emerald-700 block font-medium' }, 'Ahorro Dupes'),
                  React.createElement('span', { className: 'text-lg font-bold text-emerald-600' }, 'Hasta 65%')
                )
              )
            ),
            React.createElement('div', { className: 'pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3' },
              React.createElement('div', { className: 'flex items-center gap-2 text-xs text-zinc-500' },
                React.createElement('span', null, 'Resultados:'),
                React.createElement('strong', { className: 'text-zinc-900 font-semibold' }, `${sortedItems.length} fragancias`),
                React.createElement('span', null, `dentro de tu presupuesto (≤ ${maxPrice} €)`)
              ),
              React.createElement('div', { className: 'flex items-center gap-2' },
                React.createElement('span', { className: 'text-xs text-zinc-400 flex items-center gap-1' },
                  React.createElement(ArrowUpDown, { className: 'w-3 h-3' }), 'Ordenar:'
                ),
                React.createElement('div', { className: 'inline-flex rounded-lg border border-zinc-200 p-0.5 bg-zinc-50 text-xs' },
                  ['affinity', 'price-asc', 'longevity'].map(key => React.createElement('button', {
                    key, onClick: () => setSortBy(key),
                    className: `px-2.5 py-1 rounded-md transition-all font-medium ${sortBy === key ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'}`
                  }, key === 'affinity' ? 'Mayor afinidad' : key === 'price-asc' ? 'Más barato' : 'Fijación'))
                )
              )
            )
          ),

          // Cards Grid
          sortedItems.length > 0 ? React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
            sortedItems.map(perfume => React.createElement('article', {
              key: perfume.id,
              onClick: () => setSelectedPerfume(perfume),
              className: 'group relative bg-white rounded-2xl border border-zinc-200/90 hover:border-zinc-300 p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-zinc-200/40 flex flex-col justify-between cursor-pointer'
            },
              React.createElement('div', null,
                React.createElement('div', { className: 'flex items-start justify-between gap-3 mb-2.5' },
                  React.createElement('div', { className: 'flex flex-wrap items-center gap-2' },
                    React.createElement('span', { className: 'text-[11px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200/60' }, perfume.brand),
                    perfume.badge && React.createElement('span', { className: 'text-[11px] font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 flex items-center gap-1' },
                      React.createElement(Flame, { className: 'w-3 h-3 text-amber-600' }), perfume.badge
                    )
                  ),
                  React.createElement('div', { className: 'flex items-center gap-1.5 relative' },
                    // Web Share API trigger
                    React.createElement('button', {
                      type: 'button',
                      onClick: async (e) => {
                        e.stopPropagation();
                        const res = await sharePerfume(perfume, results?.originalReference);
                        if (res.shared) {
                          setSharedToast(res.message);
                          setTimeout(() => setSharedToast(null), 2500);
                        }
                      },
                      className: 'p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors',
                      title: 'Compartir fragancia (Web Share API)'
                    }, React.createElement(Share2, { className: 'w-4 h-4' })),
                    // Favorite button
                    React.createElement('button', {
                      type: 'button',
                      onClick: (e) => { e.stopPropagation(); handleToggleFavorite(perfume); },
                      className: 'p-1.5 rounded-full text-zinc-400 hover:text-rose-500 hover:bg-rose-50 transition-colors',
                      title: favoriteIds.has(perfume.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'
                    }, React.createElement(Heart, { className: `w-4 h-4 ${favoriteIds.has(perfume.id) ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'}` }))
                  )
                ),
                React.createElement('h3', { className: 'text-lg sm:text-xl font-bold text-zinc-950 font-serif-luxury group-hover:text-zinc-800 transition-colors' }, perfume.name),
                React.createElement('p', { className: 'text-xs text-zinc-500 mt-0.5' }, perfume.olfactoryFamily),
                React.createElement('div', { className: 'mt-4 pb-4 border-b border-zinc-100 flex items-baseline justify-between' },
                  React.createElement('div', null,
                    React.createElement('span', { className: 'text-2xl font-bold tracking-tight text-zinc-950' }, `${perfume.estimatedPrice.toFixed(2)} €`),
                    React.createElement('span', { className: 'text-xs text-zinc-400 ml-1.5' }, 'aprox.')
                  ),
                  React.createElement('span', { className: 'text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200' }, `-${perfume.savingsPercent}% ahorro`)
                ),
                React.createElement('div', { className: 'mt-4 mb-4' },
                  React.createElement('div', { className: 'flex items-center justify-between text-xs mb-1.5' },
                    React.createElement('span', { className: 'text-zinc-500 font-medium' }, 'Afinidad con la referencia:'),
                    React.createElement('span', { className: 'font-bold text-zinc-900' }, `${perfume.matchScore}% similitud`)
                  ),
                  React.createElement('div', { className: 'w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden' },
                    React.createElement('div', { className: 'bg-zinc-900 h-full rounded-full', style: { width: `${perfume.matchScore}%` } })
                  )
                ),
                // Olfactory Pyramid Accord
                React.createElement('div', { className: 'space-y-1.5 mb-4 bg-zinc-50/70 p-3 rounded-xl border border-zinc-100 text-xs' },
                  React.createElement('div', { className: 'flex items-baseline gap-2 truncate' },
                    React.createElement('span', { className: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400 min-w-12' }, 'Salida'),
                    React.createElement('span', { className: 'text-zinc-700 truncate font-medium' }, perfume.topNotes.slice(0, 3).join(' · '))
                  ),
                  React.createElement('div', { className: 'flex items-baseline gap-2 truncate' },
                    React.createElement('span', { className: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400 min-w-12' }, 'Corazón'),
                    React.createElement('span', { className: 'text-zinc-700 truncate font-medium' }, perfume.heartNotes.slice(0, 3).join(' · '))
                  ),
                  React.createElement('div', { className: 'flex items-baseline gap-2 truncate' },
                    React.createElement('span', { className: 'text-[10px] font-bold uppercase tracking-wider text-zinc-400 min-w-12' }, 'Fondo'),
                    React.createElement('span', { className: 'text-zinc-700 truncate font-medium' }, perfume.baseNotes.slice(0, 3).join(' · '))
                  )
                ),
                React.createElement('div', { className: 'grid grid-cols-2 gap-2 text-xs text-zinc-600 mb-4' },
                  React.createElement('div', { className: 'flex items-center gap-1.5 p-2 rounded-lg bg-white border border-zinc-200/60 truncate' },
                    React.createElement(Clock, { className: 'w-3.5 h-3.5 text-zinc-500 shrink-0' }),
                    React.createElement('div', { className: 'truncate' },
                      React.createElement('span', { className: 'text-[10px] text-zinc-400 block leading-tight' }, 'Duración'),
                      React.createElement('span', { className: 'font-semibold text-zinc-900' }, perfume.longevityHours)
                    )
                  ),
                  React.createElement('div', { className: 'flex items-center gap-1.5 p-2 rounded-lg bg-white border border-zinc-200/60 truncate' },
                    React.createElement(Wind, { className: 'w-3.5 h-3.5 text-zinc-500 shrink-0' }),
                    React.createElement('div', { className: 'truncate' },
                      React.createElement('span', { className: 'text-[10px] text-zinc-400 block leading-tight' }, 'Estela'),
                      React.createElement('span', { className: 'font-semibold text-zinc-900' }, perfume.sillage)
                    )
                  )
                ),
                React.createElement('p', { className: 'text-xs text-zinc-600 line-clamp-3 leading-relaxed mb-4 italic' }, `"${perfume.whyItMatches}"`)
              ),
              React.createElement('div', { className: 'pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-zinc-900 group-hover:text-zinc-700' },
                React.createElement('span', { className: 'text-[11px] text-zinc-400 font-medium' }, perfume.bestOccasions[0] || 'Uso versátil'),
                React.createElement('span', { className: 'inline-flex items-center gap-1' }, 'Ver análisis', React.createElement(ArrowUpRight, { className: 'w-3.5 h-3.5' }))
              )
            ))
          ) : React.createElement('div', { className: 'text-center py-12 px-6 bg-white rounded-2xl border border-zinc-200' },
            React.createElement('h3', { className: 'text-lg font-bold text-zinc-900 font-serif-luxury' }, `Ninguna alternativa por debajo de ${maxPrice} €`),
            React.createElement('p', { className: 'text-sm text-zinc-500 max-w-md mx-auto mt-1 mb-4' }, 'Puedes ampliar el presupuesto para ver opciones recomendadas.'),
            React.createElement('button', {
              onClick: () => { setMaxPrice(50); handleConsultar(query, 50); },
              className: 'px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold'
            }, 'Ajustar a 50 €')
          )
        )
      ),

      // Toast Feedback
      sharedToast && React.createElement('div', {
        className: 'fixed bottom-6 right-6 z-50 bg-zinc-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom'
      },
        React.createElement(CheckCircle, { className: 'w-4 h-4 text-emerald-400' }),
        React.createElement('span', null, sharedToast)
      ),

      // Detail Modal
      selectedPerfume && React.createElement('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs'
      },
        React.createElement('div', {
          className: 'relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-8 space-y-6 text-zinc-900',
          onClick: (e) => e.stopPropagation()
        },
          React.createElement('button', {
            onClick: () => setSelectedPerfume(null),
            className: 'absolute top-5 right-5 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
          }, React.createElement(X, { className: 'w-5 h-5' })),
          React.createElement('div', null,
            React.createElement('div', { className: 'flex flex-wrap items-center gap-2 mb-2' },
              React.createElement('span', { className: 'text-xs font-bold uppercase tracking-widest text-zinc-500 bg-zinc-100 px-3 py-0.5 rounded-full' }, selectedPerfume.brand),
              React.createElement('span', { className: 'text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200' }, `${selectedPerfume.matchScore}% Afinidad`),
              selectedPerfume.badge && React.createElement('span', { className: 'text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200' }, selectedPerfume.badge)
            ),
            React.createElement('h2', { className: 'text-2xl sm:text-3xl font-bold font-serif-luxury text-zinc-950' }, selectedPerfume.name),
            React.createElement('p', { className: 'text-sm text-zinc-500 mt-1' }, `${selectedPerfume.olfactoryFamily} • ${selectedPerfume.vibeDescription}`)
          ),
          React.createElement('div', { className: 'bg-zinc-50 rounded-2xl p-4 sm:p-5 border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4' },
            React.createElement('div', null,
              React.createElement('span', { className: 'text-xs uppercase tracking-wider text-zinc-400 block font-medium' }, 'Precio Estimado'),
              React.createElement('span', { className: 'text-3xl font-bold text-zinc-950 font-serif-luxury' }, `${selectedPerfume.estimatedPrice.toFixed(2)} €`)
            ),
            React.createElement('span', { className: 'inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-600 text-white shadow-2xs' },
              React.createElement(Sparkles, { className: 'w-3.5 h-3.5' }), `Ahorro estimado del ${selectedPerfume.savingsPercent}%`
            )
          ),
          // Pyramid details
          React.createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-3 gap-3' },
            React.createElement('div', { className: 'p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-xs' },
              React.createElement('div', { className: 'text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1' }, 'Salida (0 - 15 min)'),
              React.createElement('ul', { className: 'space-y-1 font-medium text-zinc-700' }, selectedPerfume.topNotes.map((n, i) => React.createElement('li', { key: i }, `• ${n}`)))
            ),
            React.createElement('div', { className: 'p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-xs' },
              React.createElement('div', { className: 'text-[11px] font-bold uppercase tracking-wider text-rose-700 mb-1' }, 'Corazón (1 - 4 hrs)'),
              React.createElement('ul', { className: 'space-y-1 font-medium text-zinc-700' }, selectedPerfume.heartNotes.map((n, i) => React.createElement('li', { key: i }, `• ${n}`)))
            ),
            React.createElement('div', { className: 'p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-xs' },
              React.createElement('div', { className: 'text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-1' }, 'Fondo (Secado 4+ hrs)'),
              React.createElement('ul', { className: 'space-y-1 font-medium text-zinc-700' }, selectedPerfume.baseNotes.map((n, i) => React.createElement('li', { key: i }, `• ${n}`)))
            )
          ),
          React.createElement('div', { className: 'p-4 rounded-2xl bg-amber-50/40 border border-amber-200/50 text-xs sm:text-sm text-zinc-700 leading-relaxed' },
            React.createElement('strong', { className: 'block text-amber-900 font-bold mb-1' }, 'Por qué es la alternativa ideal:'),
            selectedPerfume.whyItMatches
          ),
          // Actions bar
          React.createElement('div', { className: 'pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3' },
            React.createElement('div', { className: 'flex items-center gap-2' },
              React.createElement('button', {
                onClick: () => handleToggleFavorite(selectedPerfume),
                className: 'flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-800'
              },
                React.createElement(Heart, { className: `w-4 h-4 ${favoriteIds.has(selectedPerfume.id) ? 'fill-rose-500 text-rose-500' : 'text-zinc-500'}` }),
                favoriteIds.has(selectedPerfume.id) ? 'Guardado' : 'Guardar en Favoritos'
              ),
              React.createElement('button', {
                onClick: async () => {
                  const res = await sharePerfume(selectedPerfume, results?.originalReference);
                  if (res.shared) {
                    setSharedToast(res.message);
                    setTimeout(() => setSharedToast(null), 2500);
                  }
                },
                className: 'flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-800'
              },
                React.createElement(Share2, { className: 'w-4 h-4 text-zinc-600' }), 'Compartir'
              )
            ),
            React.createElement('button', {
              onClick: () => setSelectedPerfume(null),
              className: 'px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold'
            }, 'Entendido')
          )
        )
      ),

      // Wishlist Drawer
      isWishlistOpen && React.createElement('div', {
        className: 'fixed inset-0 z-50 flex justify-end bg-zinc-950/40 backdrop-blur-xs',
        onClick: () => setIsWishlistOpen(false)
      },
        React.createElement('div', {
          className: 'w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between text-zinc-900 border-l border-zinc-200',
          onClick: (e) => e.stopPropagation()
        },
          React.createElement('div', null,
            React.createElement('div', { className: 'flex items-center justify-between pb-4 border-b border-zinc-100' },
              React.createElement('div', { className: 'flex items-center gap-2' },
                React.createElement(Heart, { className: 'w-5 h-5 fill-rose-500 text-rose-500' }),
                React.createElement('h3', { className: 'text-lg font-bold font-serif-luxury text-zinc-950' }, 'Fragancias Guardadas'),
                React.createElement('span', { className: 'text-xs bg-zinc-100 px-2 py-0.5 rounded-full font-bold' }, favorites.length)
              ),
              React.createElement('button', { onClick: () => setIsWishlistOpen(false), className: 'p-1.5 rounded-full text-zinc-400 hover:text-zinc-700' },
                React.createElement(X, { className: 'w-5 h-5' })
              )
            ),
            React.createElement('div', { className: 'py-4 space-y-3 max-h-[65vh] overflow-y-auto' },
              favorites.length === 0 ? React.createElement('div', { className: 'text-center py-12 text-zinc-400' },
                React.createElement(Heart, { className: 'w-8 h-8 mx-auto mb-2 opacity-30' }),
                React.createElement('p', { className: 'text-sm font-medium' }, 'Aún no tienes perfumes guardados')
              ) : favorites.map(item => React.createElement('div', {
                key: item.id,
                onClick: () => { setSelectedPerfume(item); setIsWishlistOpen(false); },
                className: 'group p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-white cursor-pointer flex items-center justify-between gap-3'
              },
                React.createElement('div', { className: 'min-w-0' },
                  React.createElement('span', { className: 'text-[10px] uppercase font-bold text-zinc-400 block tracking-wider' }, item.brand),
                  React.createElement('h4', { className: 'text-sm font-bold text-zinc-900 font-serif-luxury truncate' }, item.name),
                  React.createElement('span', { className: 'text-xs font-semibold text-zinc-800' }, `${item.estimatedPrice.toFixed(2)} €`)
                ),
                React.createElement('button', {
                  type: 'button',
                  onClick: (e) => { e.stopPropagation(); handleToggleFavorite(item); },
                  className: 'p-1.5 text-zinc-300 hover:text-rose-600'
                }, React.createElement(Trash2, { className: 'w-4 h-4' }))
              ))
            )
          ),
          favorites.length > 0 && React.createElement('div', { className: 'pt-4 border-t border-zinc-100' },
            React.createElement('button', {
              onClick: async () => {
                for (const it of favorites) await removeFavoriteDB(it.id);
                setFavorites([]);
                localStorage.removeItem('aura_perfume_favorites');
              },
              className: 'w-full text-xs text-zinc-400 hover:text-zinc-600 py-1'
            }, 'Vaciar lista de guardados')
          )
        )
      ),

      // PWA Install Modal
      isInstallModalOpen && React.createElement('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs',
        onClick: () => setIsInstallModalOpen(false)
      },
        React.createElement('div', {
          className: 'relative w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 text-zinc-900',
          onClick: (e) => e.stopPropagation()
        },
          React.createElement('button', {
            onClick: () => setIsInstallModalOpen(false),
            className: 'absolute top-5 right-5 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
          }, React.createElement(X, { className: 'w-5 h-5' })),
          React.createElement('div', { className: 'flex items-center gap-3 mb-4' },
            React.createElement('div', { className: 'w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center p-2' },
              React.createElement('img', { src: '/icons/icon.svg', alt: 'Aura', className: 'w-full h-full' })
            ),
            React.createElement('div', null,
              React.createElement('h3', { className: 'text-xl font-bold font-serif-luxury text-zinc-950' }, 'Instalar Aura App'),
              React.createElement('p', { className: 'text-xs text-zinc-500' }, 'Progressive Web App (PWA)')
            )
          ),
          isInstalled ? React.createElement('div', { className: 'text-center py-6' },
            React.createElement(CheckCircle, { className: 'w-12 h-12 text-emerald-500 mx-auto mb-2' }),
            React.createElement('h4', { className: 'text-base font-bold' }, '¡Aura ya está instalada!'),
            React.createElement('p', { className: 'text-xs text-zinc-500' }, 'Puedes acceder desde tu pantalla de inicio.')
          ) : React.createElement(React.Fragment, null,
            React.createElement('p', { className: 'text-xs text-zinc-600 mb-5 leading-relaxed' },
              'Disfruta de la experiencia nativa: sin barra de navegación, acceso offline instantáneo a tus perfumes guardados y apertura ultrarrápida.'
            ),
            isIOS && React.createElement('div', { className: 'p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs space-y-2 mb-4' },
              React.createElement('span', { className: 'font-bold text-amber-900 block' }, 'Para instalar en Safari (iOS):'),
              React.createElement('p', null, '1. Pulsa el botón Compartir en la barra de Safari.'),
              React.createElement('p', null, '2. Selecciona "Añadir a pantalla de inicio".')
            ),
            React.createElement('div', { className: 'flex items-center justify-end gap-3 pt-2' },
              React.createElement('button', {
                onClick: () => setIsInstallModalOpen(false),
                className: 'px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600'
              }, 'Quizás luego'),
              isInstallable ? React.createElement('button', {
                onClick: async () => {
                  const ok = await triggerInstallPrompt();
                  if (ok) setIsInstallModalOpen(false);
                },
                className: 'flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold shadow-md'
              },
                React.createElement(Download, { className: 'w-4 h-4 text-amber-300' }),
                React.createElement('span', null, 'Instalar Aplicación')
              ) : React.createElement('button', {
                onClick: () => setIsInstallModalOpen(false),
                className: 'px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold'
              }, 'Entendido')
            )
          )
        )
      ),

      // Notification Modal
      isNotificationModalOpen && React.createElement('div', {
        className: 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs',
        onClick: () => setIsNotificationModalOpen(false)
      },
        React.createElement('div', {
          className: 'relative w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 sm:p-7 text-zinc-900',
          onClick: (e) => e.stopPropagation()
        },
          React.createElement('button', {
            onClick: () => setIsNotificationModalOpen(false),
            className: 'absolute top-5 right-5 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
          }, React.createElement(X, { className: 'w-5 h-5' })),
          React.createElement('div', { className: 'flex items-center gap-3 mb-4' },
            React.createElement('div', { className: 'w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80' },
              React.createElement(BellRing, { className: 'w-6 h-6' })
            ),
            React.createElement('div', null,
              React.createElement('h3', { className: 'text-xl font-bold font-serif-luxury text-zinc-950' }, 'Notificaciones de Dupes'),
              React.createElement('p', { className: 'text-xs text-zinc-500' }, 'Web Push & Alertas del Sistema')
            )
          ),
          React.createElement('p', { className: 'text-xs text-zinc-600 mb-5 leading-relaxed' },
            'Recibe alertas directas en tu sistema operativo cuando detectemos bajadas de precio o nuevos dupes recomendados.'
          ),
          React.createElement('div', { className: 'space-y-3' },
            React.createElement('button', {
              onClick: async () => {
                const ok = await triggerSampleNotification();
                if (ok) {
                  setSharedToast('¡Notificación nativa enviada al sistema operativo!');
                  setTimeout(() => setSharedToast(null), 3000);
                  setIsNotificationModalOpen(false);
                }
              },
              className: 'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 text-white text-xs font-semibold shadow-xs'
            },
              React.createElement(Send, { className: 'w-4 h-4 text-amber-300' }),
              React.createElement('span', null, 'Activar y Probar Alerta Nativa')
            ),
            React.createElement('button', {
              onClick: () => setIsNotificationModalOpen(false),
              className: 'w-full py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600'
            }, 'Cerrar')
          )
        )
      ),

      // Minimalist Footer
      React.createElement('footer', { className: 'border-t border-zinc-200/80 bg-white py-8 mt-16 text-center text-xs text-zinc-400' },
        React.createElement('div', { className: 'max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4' },
          React.createElement('div', { className: 'flex items-center gap-2' },
            React.createElement('span', { className: 'font-semibold text-zinc-800 tracking-wider font-serif-luxury' }, 'AURA'),
            React.createElement('span', null, '• PWA & Atelier Olfativo con Gemini IA y Persistencia Offline')
          ),
          React.createElement('div', { className: 'flex items-center gap-4 text-[11px] text-zinc-500' },
            React.createElement('span', null, 'Precios orientativos en tiendas europeas'),
            React.createElement('span', null, '•'),
            React.createElement('span', { className: 'flex items-center gap-1' },
              React.createElement(Feather, { className: 'w-3 h-3' }), 'Modo Standalone'
            )
          )
        )
      )
    )
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(React.createElement(App));
}
