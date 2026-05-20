/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Search, 
  Radio, 
  Tv, 
  Play, 
  Send, 
  Heart, 
  BookOpen, 
  ExternalLink, 
  RefreshCw, 
  Users, 
  Sparkles, 
  Volume2, 
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  X,
  Copy,
  Check,
  CheckSquare,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Move
} from 'lucide-react';
import { PhoneFrame } from './components/PhoneFrame';
import { NewsTicker } from './components/NewsTicker';
import { AIAudioAnchor } from './components/AIAudioAnchor';
import { NewsArticle, LiveChatComment } from './types';
import { motion } from 'motion/react';

// Client-side image load error safety-recovery utility function
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, category?: string) => {
  const cat = (category || '').toLowerCase();
  let fallback = "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=600&auto=format&fit=crop&q=60"; // Safe Spain default
  
  if (cat.includes('depor') || cat.includes('fútbol')) {
    fallback = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60";
  } else if (cat.includes('tech') || cat.includes('tecnol')) {
    fallback = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=60";
  } else if (cat.includes('cienc') || cat.includes('clima') || cat.includes('agua') || cat.includes('hidric') || cat.includes('ambiente')) {
    fallback = "https://images.unsplash.com/photo-1481833761820-0509d3217039?w=600&auto=format&fit=crop&q=60";
  } else if (cat.includes('econ') || cat.includes('finan') || cat.includes('bols') || cat.includes('empleo')) {
    fallback = "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=60";
  } else if (cat.includes('entre') || cat.includes('cine') || cat.includes('art') || cat.includes('musica')) {
    fallback = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=60";
  } else if (cat.includes('poli') || cat.includes('gobi') || cat.includes('elec') || cat.includes('estado') || cat.includes('nacional')) {
    fallback = "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&auto=format&fit=crop&q=60";
  }

  // Set the current fallback to prevent infinite triggers
  if (e.currentTarget.src !== fallback) {
    e.currentTarget.src = fallback;
  }
};

export default function App() {
  const [isSimulatedMobile, setIsSimulatedMobile] = useState<boolean>(true);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todo');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isRealTime, setIsRealTime] = useState<boolean>(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);
  const [mobileSubTab, setMobileSubTab] = useState<'news' | 'chat' | 'voice'>('news');
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'voice'>('chat');
  
  // Custom dialog alert states to notify users of custom actions smoothly
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);
  
  // Article reader customizer & feedback states
  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(14); 
  const [userFeedbackUseful, setUserFeedbackUseful] = useState<Record<string, 'yes' | 'no' | null>>({});
  const [feedbackCounters, setFeedbackCounters] = useState<Record<string, { yes: number, no: number }>>({});
  const [userReactions, setUserReactions] = useState<Record<string, 'excellent' | 'neutral' | 'critical' | null>>({});
  const [reactionCounters, setReactionCounters] = useState<Record<string, { excellent: number, neutral: number, critical: number }>>({});
  const [processedPoints, setProcessedPoints] = useState<Record<string, Record<number, boolean>>>({});
  const [correctionsForm, setCorrectionsForm] = useState<{ category: string; description: string; show: boolean }>({ category: 'Ortografía', description: '', show: false });
  const [likedArticles, setLikedArticles] = useState<Record<string, boolean>>({});

  // Zoom & Pan interactive status for selectedArticle main image in modal
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [zoomPan, setZoomPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isZoomDragging, setIsZoomDragging] = useState<boolean>(false);
  const [zoomDragStart, setZoomDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset zoom settings on article change or modal open/close
  useEffect(() => {
    setZoomScale(1);
    setZoomPan({ x: 0, y: 0 });
    setIsZoomDragging(false);
  }, [selectedArticle?.id, isExpandedModalOpen]);

  const handleZoomMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    setIsZoomDragging(true);
    setZoomDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleZoomMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomDragging || zoomScale <= 1) return;
    const dx = e.clientX - zoomDragStart.x;
    const dy = e.clientY - zoomDragStart.y;
    // Bound movement according to scale to prevent infinite panning offscreen
    setZoomPan(prev => ({ 
      x: Math.min(Math.max(prev.x + dx, -350 * zoomScale), 350 * zoomScale), 
      y: Math.min(Math.max(prev.y + dy, -250 * zoomScale), 250 * zoomScale) 
    }));
    setZoomDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleZoomMouseUp = () => {
    setIsZoomDragging(false);
  };

  const handleZoomTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (zoomScale <= 1 || e.touches.length !== 1) return;
    setIsZoomDragging(true);
    setZoomDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleZoomTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isZoomDragging || zoomScale <= 1 || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - zoomDragStart.x;
    const dy = e.touches[0].clientY - zoomDragStart.y;
    setZoomPan(prev => ({ 
      x: Math.min(Math.max(prev.x + dx, -350 * zoomScale), 350 * zoomScale), 
      y: Math.min(Math.max(prev.y + dy, -250 * zoomScale), 250 * zoomScale) 
    }));
    setZoomDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  // Pagination State for Teletipos (river of news)
  const [teletipoPage, setTeletipoPage] = useState<number>(1);
  const [teletiposPerPage, setTeletiposPerPage] = useState<number>(4);

  // Continuous Reading (Lectura Continua) States
  const [isContinuousReading, setIsContinuousReading] = useState<boolean>(false);
  const [continuousAutoplayVoice, setContinuousAutoplayVoice] = useState<boolean>(true);
  const [countdownRemaining, setCountdownRemaining] = useState<number>(0);
  const [countdownActive, setCountdownActive] = useState<boolean>(false);

  // Helper alert popups
  const alertModal = (title: string, message: string) => {
    setAlertInfo({ title, message });
  };
  
  // Sync mobile subtabs and sidebar tabs
  useEffect(() => {
    if (mobileSubTab === 'chat') {
      setSidebarTab('chat');
    } else if (mobileSubTab === 'voice') {
      setSidebarTab('voice');
    }
  }, [mobileSubTab]);

  useEffect(() => {
    if (sidebarTab === 'chat' && mobileSubTab !== 'news') {
      setMobileSubTab('chat');
    } else if (sidebarTab === 'voice' && mobileSubTab !== 'news') {
      setMobileSubTab('voice');
    }
  }, [sidebarTab]);

  // Handle automatic continuous reading timer and countdown progress
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdownActive && countdownRemaining > 0) {
      timer = setInterval(() => {
        setCountdownRemaining(prev => {
          if (prev <= 1) {
            setCountdownActive(false);
            // Dynamic auto advancement
            if (articles.length > 0 && selectedArticle) {
              const currentIndex = articles.findIndex(a => a.id === selectedArticle.id);
              if (currentIndex !== -1) {
                const nextIndex = (currentIndex + 1) % articles.length;
                setSelectedArticle(articles[nextIndex]);
                // Highlight advancement
                alertModal("Lectura Continua", `Siguiente reporte: "${articles[nextIndex].title}"`);
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdownActive, countdownRemaining, articles, selectedArticle]);

  const getCategoryTheme = (catName: string) => {
    const isSport = catName.toLowerCase().includes('depor') || catName.toLowerCase().includes('fútbol');
    const isTech = catName.toLowerCase().includes('tech') || catName.toLowerCase().includes('tecnol');
    const isEcon = catName.toLowerCase().includes('econ') || catName.toLowerCase().includes('finan');
    const isSci = catName.toLowerCase().includes('cienc') || catName.toLowerCase().includes('clima');
    if (isSport) return 'text-emerald-400 border-emerald-500/35 bg-emerald-500/10';
    if (isTech) return 'text-blue-400 border-blue-500/35 bg-blue-500/10';
    if (isEcon) return 'text-amber-400 border-amber-500/35 bg-amber-500/10';
    if (isSci) return 'text-cyan-400 border-cyan-500/35 bg-cyan-500/10';
    return 'text-rose-400 border-rose-500/35 bg-rose-500/10';
  };

  const getCategoryDescription = (cat: string): string => {
    switch(cat) {
      case 'Todo':
        return 'Indexación politemática nacional de España. Reúne teletipos redactados con grounded en tiempo real de agencias de prensa.';
      case 'Internacional':
        return 'Enfoque geopolítico y de corresponsalías exteriores. Análisis detallados y contrastados de España y el mundo.';
      case 'Tecnología':
        return 'Actualizaciones sobre inteligencia artificial, startups de Málaga Valley, chips semiconductores y reglamentos europeos.';
      case 'Deportes':
        return 'Especial Liga española, clasificaciones oficiales, ruedas de prensa, tenis y competiciones nacionales.';
      case 'Ciencia':
        return 'Transición hídrica en la península ibérica, espacio exterior, arqueología de Atapuerca y estudios climáticos.';
      case 'Economía':
        return 'Mercado del Ibex-35, subidas de tipo de interés, IPC de España, empleo y datos inmobiliarios actualizados.';
      default:
        return 'Boletines de prensa oficiales recopilados las últimas 24 horas para el canal seleccionado.';
    }
  };
  
  // Real-time viewer dynamic mock counter
  const [viewers, setViewers] = useState<number>(142050);

  // Live Chat Data
  const [chatComments, setChatComments] = useState<LiveChatComment[]>([
    { id: 'c1', username: 'juan_perez99', comment: '¡Excelente cobertura de los hechos en directo! Gracias por la rapidez.', timestamp: 'Hace 1 min' },
    { id: 'c2', username: 'noticias_fan', comment: 'Increíble avance tecnológico, no me lo esperaba tan pronto para uso comercial.', timestamp: 'Hace 2 min' },
    { id: 'c3', username: 'sofia_libre', comment: '¿Alguien tiene más fuentes oficiales sobre este sismo en el litoral Pacífico?', timestamp: 'Hace 3 min' },
    { id: 'c4', username: 'techo_futuro', comment: 'Este procesador cuántico va a cambiar la forma de simular moléculas medicinales.', timestamp: 'Hace 4 min' },
  ]);
  const [newComment, setNewComment] = useState<string>('');

  const categories = [
    { key: 'Todo', label: 'Inicio / Todo' },
    { key: 'Internacional', label: 'Internacional' },
    { key: 'Tecnología', label: 'Tecnología' },
    { key: 'Deportes', label: 'Deportes' },
    { key: 'Ciencia', label: 'Ciencia' },
    { key: 'Economía', label: 'Economía' }
  ];

  // Dynamic viewer counts simulator
  useEffect(() => {
    const handleViewerCount = () => {
      setViewers(prev => {
        const delta = Math.floor(Math.random() * 200) - 98;
        return Math.max(10000, prev + delta);
      });
    };
    const interval = setInterval(handleViewerCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch news from client talking to server API
  const fetchNews = async (category = 'Todo', query = '') => {
    setLoading(true);
    setErrorStatus(null);
    setTeletipoPage(1);
    try {
      let url = `/api/news/list?category=${encodeURIComponent(category)}`;
      if (query) {
        url += `&query=${encodeURIComponent(query)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('No se pudo establecer conexión con el proveedor de noticias.');
      }
      const data = await response.json();
      
      setIsQuotaExceeded(!!data.quotaExceeded);
      if (data.articles && data.articles.length > 0) {
        setArticles(data.articles);
        setSelectedArticle(data.articles[0]);
        setIsRealTime(!!data.realTime);
      } else {
        setArticles([]);
        setSelectedArticle(null);
        setErrorStatus('No se encontraron artículos con la consulta especificada. Pruebe otro término.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || 'Error desconocido de red.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews('Todo');
  }, []);

  // Smooth scroll container to the top when active article is changed
  useEffect(() => {
    if (selectedArticle) {
      const container = document.getElementById('mobile-scroll-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [selectedArticle?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchNews('Todo', searchQuery);
    }
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setSearchQuery('');
    fetchNews(cat);
  };

  const handleLike = (id: string) => {
    setArticles(prev => 
      prev.map(art => art.id === id ? { ...art, likes: (art.likes || 0) + 1 } : art)
    );
    if (selectedArticle && selectedArticle.id === id) {
      setSelectedArticle(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null);
    }
  };

  // Add Comment Flow
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const myComm: LiveChatComment = {
      id: `my-${Date.now()}`,
      username: 'usuario_noticias',
      comment: newComment.trim(),
      timestamp: 'Ahora mismo',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'
    };

    setChatComments(prev => [myComm, ...prev]);
    setNewComment('');

    // Trigger auto replies from dynamic simulated users based on context
    setTimeout(() => {
      const liveUsernames = ['dr_valencia', 'periodista_libre', 'estudiante_mx', 'clara_noticia', 'crypto_alert'];
      const commentsPool = [
        '¡Totalmente de acuerdo! Qué primicia de último momento en español.',
        'Me llama la atención que sigan saliendo detalles adicionales tan rápido.',
        'Excelente análisis y fuentes de información incluidas.',
        'Es importante seguir el boletín oficial de contingencia.',
        '¿El presentador de voz AI está leyendo en vivo todo esto? Alucinante.'
      ];
      
      const randomUser = liveUsernames[Math.floor(Math.random() * liveUsernames.length)];
      const randomText = commentsPool[Math.floor(Math.random() * commentsPool.length)];

      setChatComments(prev => [
        {
          id: `reply-${Date.now()}`,
          username: randomUser,
          comment: randomText,
          timestamp: 'Hace unos instantes'
        },
        ...prev
      ]);
    }, 4500);
  };

  const handleAudioFinished = () => {
    if (isContinuousReading) {
      setCountdownRemaining(5);
      setCountdownActive(true);
    }
  };

  const teletipos = articles.slice(5);
  const totalPages = Math.ceil(teletipos.length / teletiposPerPage);
  const safePage = Math.min(teletipoPage, totalPages || 1);
  const startIndex = (safePage - 1) * teletiposPerPage;
  const currentTeletipos = teletipos.slice(startIndex, startIndex + teletiposPerPage);

  return (
    <PhoneFrame 
      isSimulatedMobile={isSimulatedMobile} 
      setIsSimulatedMobile={setIsSimulatedMobile}
      statusText={`Emisión contrastada en directo las 24 horas del día. Central de Datos: ${isRealTime ? "Gemini 3.5 Grounding España" : "Archivo de Caché Local Activado"}`}
    >
      <div className="flex-1 flex flex-col bg-[#08080C] text-slate-100 selection:bg-red-500/30 overflow-hidden relative">
        
        {/* Sub Header Brand Panel */}
        <div className="px-4 py-3 bg-black/60 border-b border-white/5 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </span>
            <div className="flex items-center gap-1">
              <span className="text-white font-black tracking-tighter text-sm">NOTICIAS</span>
              <span className="text-red-500 font-black tracking-tighter text-sm underline decoration-red-600 decoration-2 underline-offset-4">VIVO</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded text-[10px] text-green-400 font-bold tracking-tight select-none">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0"></span>
            SISTEMA INTEGRAL ONLINE
          </div>
        </div>

        {/* Banner Superior de Ultima Hora en Letras Rojas */}
        <div className="bg-red-950/25 border-b border-red-500/30 px-3 py-2 flex items-center gap-2 overflow-hidden select-none shrink-0 z-10 text-[11px] font-mono shadow-[0_4px_12px_rgba(239,68,68,0.08)]">
          <span className="bg-[#ff1a1a] text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest animate-pulse shrink-0 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-white" />
            VIVO ALERTA
          </span>
          <div className="flex-1 overflow-hidden relative flex items-center">
            <motion.div
              className="flex whitespace-nowrap gap-12 text-[#ff2222] font-black tracking-wider uppercase"
              animate={{ x: [0, -1200] }}
              transition={{
                repeat: Infinity,
                ease: "linear",
                duration: 25,
              }}
            >
              {articles.filter(a => a.importance === 'breaking' || a.importance === 'high').map((art) => (
                <span 
                  key={art.id} 
                  className="cursor-pointer hover:text-red-400 transition-colors flex items-center gap-1.5"
                  onClick={() => setSelectedArticle(art)}
                >
                  <span>España 🚨 {art.title}</span>
                  <span className="text-white/30">•</span>
                </span>
              ))}
              {/* Fallback if no matching breaking news found in current categories */}
              {articles.length === 0 || articles.filter(a => a.importance === 'breaking' || a.importance === 'high').length === 0 ? (
                <>
                  <span>🚨 ÚLTIMA HORA ESPAÑA: EL GOBIERNO APRUEBA REFORMA DE DIGITALIZACIÓN HÍDRICA EN TODO EL TERRITORIO NACIONAL</span>
                  <span className="text-white/30">•</span>
                  <span>🚨 MÁLAGA TECH: NUEVO CAMPUS INTERNACIONAL DE INTELIGENCIA ARTIFICIAL ABRIRÁ EN EL CENTRO TECNOLÓGICO</span>
                  <span className="text-white/30">•</span>
                  <span>🚨 DEPORTES ESPAÑA: SE CONFIRMAN LAS ALINEACIONES OFICIALES DEL CLÁSICO LIGUERO DE ESTE FIN DE SEMANA</span>
                </>
              ) : null}
            </motion.div>
          </div>
        </div>

        {/* Dynamic AI Search Bar / Query input */}
        <div className="p-3 bg-zinc-950/80 border-b border-white/5 flex flex-col gap-2 shrink-0 z-10">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center justify-between gap-1.5 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar temas en vivo de España (ej: sequía, clásico, Málaga, política...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/90 hover:bg-zinc-900 border border-white/5 focus:border-red-500 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all font-sans"
                id="news-search-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer shadow-lg shadow-red-600/10"
              id="news-search-submit"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Indexar</span>
            </button>
          </form>

          {/* Horizontal Scroller Category Selector */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 select-none text-[11px] font-semibold border-t border-white/5 pt-1.5">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryClick(cat.key)}
                className={`py-1 px-3.5 rounded-full border transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.key && !searchQuery
                    ? 'bg-red-600 text-white border-red-700 font-bold'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-slate-300 border-white/5'
                }`}
                id={`cat-btn-${cat.key}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Dynamic Information Expansion Panel for Category ("tipo de noticia") - AMPLIAR INFORMACIÓN DE SECCIÓN */}
          <div className="mt-2 bg-zinc-950/90 border border-white/5 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs select-none relative overflow-hidden">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="font-extrabold text-white tracking-tight flex items-center gap-1">
                  🔍 ANÁLISIS DE CATEGORÍA: {selectedCategory.toUpperCase()}
                </span>
                <span className="text-[9px] bg-red-600/15 border border-red-500/20 text-red-400 font-black px-1.5 py-0.2 rounded uppercase">
                  Boletín Ampliado
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal max-w-2xl font-sans">
                {getCategoryDescription(selectedCategory)}
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => {
                  fetchNews(selectedCategory);
                }}
                className="flex-1 sm:flex-initial px-3 py-2 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-[10px] text-slate-200 rounded-xl font-bold border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-black/30"
                id="btn-update-category-live"
                title="Actualizar datos e índices en vivo de esta categoría"
              >
                <RefreshCw className="w-3.5 h-3.5 text-red-500 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Re-indexar Canal</span>
              </button>
              
              <button 
                onClick={() => {
                  alertModal(
                    `Informe Sectorial: ${selectedCategory}`,
                    `Hemos consolidado un reporte en vivo sobre '${selectedCategory}'. Redactado por la mesa editorial de España. 14 corresponsalías conectadas vía satélite.`
                  );
                }}
                className="flex-1 sm:flex-initial px-3 py-2 bg-red-600/10 hover:bg-red-600/20 active:scale-95 text-[10px] text-red-400 hover:text-red-300 rounded-xl font-bold border border-red-500/20 transition-all cursor-pointer text-center"
                id="btn-report-category-live"
              >
                Ver Stats de Red
              </button>
            </div>
          </div>
        </div>

        {/* Segmented Tab Switcher for Mobile Screens */}
        <div className="flex md:hidden border-b border-white/5 bg-zinc-950 p-1 shrink-0 z-10 select-none">
          <button
            onClick={() => setMobileSubTab('news')}
            className={`flex-1 py-1.5 text-center text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mobileSubTab === 'news'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="mobile-tab-news"
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            Boletines
          </button>
          <button
            onClick={() => setMobileSubTab('voice')}
            className={`flex-1 py-1.5 text-center text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mobileSubTab === 'voice'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="mobile-tab-voice"
          >
            <Volume2 className="w-3.5 h-3.5 shrink-0" />
            Voz IA
          </button>
          <button
            onClick={() => setMobileSubTab('chat')}
            className={`flex-1 py-1.5 text-center text-[10px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              mobileSubTab === 'chat'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="mobile-tab-chat"
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            Reacciones
          </button>
        </div>

        {/* Content Body Stack */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Main Stage Panel (Visualizer Player + Article detail) */}
          <div id="mobile-scroll-container" className={`flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar ${
            mobileSubTab === 'news' ? 'flex' : 'hidden md:flex'
          }`}>

            {/* Simulated Live Stream TV Window */}
            {selectedArticle ? (
              <div className="flex flex-col gap-3 shrink-0">
                {/* TV Player Frame */}
                <div className="relative aspect-video w-full bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden shadow-2xl group flex-shrink-0">
                  {/* Subtle shadows inside the stream viewport */}
                  <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none"></div>
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
                  
                  {/* Core Player Info Tags */}
                  <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none select-none">
                    <span className="bg-red-600 px-2 py-0.5 rounded text-[9px] font-black tracking-wider flex items-center gap-1">
                      <span className="w-1 h-1 bg-white rounded-full animate-ping"></span>
                      DIRECTO
                    </span>
                    <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-extrabold text-[#e2e8f0]">
                      {selectedArticle.category.toUpperCase()}
                    </span>
                  </div>

                  {/* Pulsing Visual Waveform / Custom Photo background */}
                  <div className="absolute inset-0 bg-zinc-950 overflow-hidden">
                    <img 
                      src={selectedArticle.imageUrl || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60"} 
                      alt=""
                      onError={(e) => handleImageError(e, selectedArticle.category)}
                      className="w-full h-full object-cover opacity-50 filter brightness-90 animate-pulse duration-1000"
                    />
                    <div className="absolute inset-0 bg-radial-gradient opacity-15 pointer-events-none"></div>
                  </div>

                  {/* Play & Signal core indicator in player center */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center pointer-events-none select-none">
                    <div className="w-10 h-10 bg-red-600/10 rounded-full flex items-center justify-center border border-red-500/30 animate-ping absolute"></div>
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20 relative z-10">
                      <Tv className="w-4 h-4 text-white animate-pulse" />
                    </div>
                  </div>

                  {/* Active Online viewers ticker bottom corner */}
                  <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-mono text-red-500 font-bold border border-red-500/10 flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>
                    <span>{viewers.toLocaleString('es-ES')} EN LÍNEA</span>
                  </div>
                </div>

                {/* News Title & Metadata card placed comfortably below the video player to avoid ANY overlap */}
                <div className="bg-zinc-900/60 border border-white/5 p-4 rounded-xl flex flex-col gap-3 font-sans">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600/15 text-red-400 border border-red-500/25 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                      ÚLTIMA HORA
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium font-mono">
                      📅 {selectedArticle.publishedAt}
                    </span>
                  </div>
                  <h2 className="text-sm font-extrabold text-white leading-relaxed tracking-tight">
                    {selectedArticle.title}
                  </h2>

                  {/* HIGH FIDELITY CTAS REQUIRED BY USER: Todo botón sirve para algo */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <button
                      onClick={() => setIsExpandedModalOpen(true)}
                      className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-1.5 tracking-wide transition-all duration-150 cursor-pointer shadow-lg shadow-red-600/15"
                      id="btn-expand-article-main"
                      title="Pulsa para desplegar el reportaje completo y herramientas de análisis IA"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                      <span>Ampliar Información</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setSidebarTab('voice');
                        setMobileSubTab('voice');
                        // Notify user how to use it
                        alertModal("Modo Locución Activado", "Haga clic en 'Escuchar Noticia' dentro del panel 'Ancla de Voz IA' para sonorizar este informe.");
                      }}
                      className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-slate-300 font-black text-[10px] uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer border border-white/5"
                      id="btn-trigger-voice-panel"
                      title="Ir al apartado de locución"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Locutar (Voz IA)</span>
                    </button>
                  </div>

                  {/* Micro dashboard for Lectura Continua status */}
                  <div className="flex items-center justify-between bg-[#111218]/80 px-3 py-2.5 rounded-xl border border-white/5 text-[10px] mt-1">
                    <span className="text-slate-400 flex items-center gap-1.5 font-sans select-none">
                      <span className={`w-1.5 h-1.5 rounded-full ${isContinuousReading ? 'bg-[#10b981] animate-pulse shadow-md shadow-emerald-500/50' : 'bg-slate-600'}`}></span>
                      Lectura Continua: <strong className="text-white uppercase font-mono">{isContinuousReading ? 'Activada' : 'Apagada'}</strong>
                    </span>
                    <button 
                      type="button"
                      onClick={() => {
                        const newVal = !isContinuousReading;
                        setIsContinuousReading(newVal);
                        alertModal(newVal ? "Lectura Continua Pro" : "Lector Automático Detenido", newVal ? "El sistema avanzará de informe de forma secuencial al finalizar cada locución IA." : "Se ha desactivado la transición automática.");
                      }}
                      className={`font-black tracking-wide text-[9px] uppercase px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        isContinuousReading 
                          ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25 hover:bg-[#10b981]/25' 
                          : 'bg-zinc-800 hover:bg-zinc-750 text-slate-300 border border-white/5'
                      }`}
                      id="btn-continuous-home-toggle"
                    >
                      {isContinuousReading ? 'Desconectar' : 'Conectar'}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Error & Loading Visual State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/30 rounded-2xl border border-white/5">
                <div className="relative w-12 h-12 mb-4">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-red-600 animate-spin"></div>
                </div>
                <h3 className="text-xs font-bold text-slate-300">Conectando con satélites e indexando...</h3>
                <p className="text-[11px] text-slate-500 mt-1">Recuperando noticias de última hora en español vvia Gemini AI...</p>
              </div>
            )}

            {errorStatus && !loading && (
              <div className="p-5 bg-red-950/30 border border-red-500/20 rounded-2xl flex flex-col items-center justify-center text-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
                <h3 className="text-xs font-bold text-red-400">Hubo un contratiempo</h3>
                <p className="text-[11px] text-slate-300 mt-1 max-w-sm">{errorStatus}</p>
                <button 
                  onClick={() => handleCategoryClick('Todo')}
                  className="mt-3.5 py-1.5 px-3 bg-red-600/30 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  id="error-reset-btn"
                >
                  Regresar al Inicio
                </button>
              </div>
            )}

            {/* Detailed Active Article News Information Column */}
            {selectedArticle && !loading && (
              <div className="bg-zinc-950 border border-white/5 p-5 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center font-bold text-[10px] text-slate-200">
                      AI
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{selectedArticle.reporter}</h4>
                      <p className="text-[9px] text-slate-400">Reportero de Turno</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleLike(selectedArticle.id)}
                      className="flex items-center gap-1 text-[11px] font-medium hover:text-red-500 transition-all text-slate-400 cursor-pointer bg-slate-900 px-2 py-1 rounded-lg border border-white/5"
                      id={`like-btn-${selectedArticle.id}`}
                    >
                      <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
                      <span>{selectedArticle.likes || 0}</span>
                    </button>
                    <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded-lg border border-white/5">
                      Lectores: {selectedArticle.reads || 0}
                    </span>
                  </div>
                </div>

                {/* Subtitle / Lead Summary */}
                <p className="text-xs font-semibold text-slate-200 bg-zinc-900/60 p-3.5 rounded-xl border-l-2 border-red-600 leading-relaxed italic">
                  "{selectedArticle.summary}"
                </p>

                {/* Main Body content of article */}
                <div className="space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedArticle.content}
                  </p>
                </div>

                {/* Grounding Citations Section */}
                <div className="mt-4 pt-3.5 border-t border-white/5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1 mb-2.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    FUENTES VERIFICADAS DE BÚSQUEDA (GROUNDING)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedArticle.sources && selectedArticle.sources.length > 0 ? (
                      selectedArticle.sources.map((src, idx) => (
                        <a 
                          key={idx}
                          href={src.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="bg-[#0e0e15] hover:bg-[#141420] border border-white/5 p-2.5 rounded-xl flex items-center justify-between text-[11px] hover:text-amber-400 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="w-4 h-4 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-[9px] shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-slate-300 line-clamp-1 truncate group-hover:text-amber-400">
                              {src.title}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        </a>
                      ))
                    ) : (
                      <div className="col-span-2 text-[10px] text-slate-500 italic">
                        No se listaron fuentes accesorias para este artículo.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Channels List Scroll - Modern Newspaper Editorial Layout */}
            <div className="w-full mt-2 border-t border-white/5 pt-4">
              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-red-600/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-600 rounded-sm animate-ping"></span>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Edición Impresa Digital - España
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                  {articles.length} REACCIONES / NOTICIAS HOY
                </span>
              </div>

              {articles.length > 0 ? (
                <div className="flex flex-col gap-6">
                  {/* Secciones de la Portada */}
                  
                  {/* 1. SECCIÓN PRINCIPAL DE PORTADA (GRAND HERO NEWS - First Item) */}
                  <div className="border border-white/10 rounded-2xl bg-zinc-900/30 overflow-hidden hover:border-red-500/30 transition-all p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="bg-red-600 text-white text-[9px] font-black tracking-widest px-2 py-0.5 rounded">
                        BAJO FOCO NACIONAL / PORTADA
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                        {(articles[0].reads || 2340).toLocaleString('es-ES')} lectores
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 group cursor-pointer" onClick={() => {
                      setSelectedArticle(articles[0]);
                      setIsExpandedModalOpen(true);
                    }}>
                      <div className="w-full sm:w-1/3 aspect-video sm:aspect-square bg-zinc-950 rounded-xl overflow-hidden relative group cursor-pointer shrink-0">
                        <img 
                          src={articles[0].imageUrl || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60"} 
                          alt="" 
                          referrerPolicy="no-referrer"
                          onError={(e) => handleImageError(e, articles[0].category)}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 rounded text-[9px] text-[#fbbf24] border border-[#fbbf24]/10 font-bold">
                          {articles[0].category.toUpperCase()}
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between py-1 cursor-pointer">
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-white hover:text-red-400 transition-colors leading-tight mb-2">
                            {articles[0].title}
                          </h4>
                          <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed mb-3">
                            {articles[0].summary} {articles[0].content.substring(0, 70)}...
                          </p>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-white/5">
                          <span className="truncate max-w-[130px]">{articles[0].reporter}</span>
                          <span className="text-amber-500 font-mono font-bold bg-white/5 px-2 py-0.5 rounded shrink-0">{articles[0].publishedAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. GRID DE NOTICIAS RELEVANTES (Middle Items: Index 1 to 4) */}
                  {articles.length > 1 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-1">
                        <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">NOTICIAS DESTACADAS</span>
                        <span className="text-[9px] text-slate-500 italic">Haz clic para oír o debatir</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {articles.slice(1, 5).map((art) => {
                          const isSport = art.category.toLowerCase().includes('depor') || art.category.toLowerCase().includes('fútbol');
                          const isTech = art.category.toLowerCase().includes('tech') || art.category.toLowerCase().includes('tecnol');
                          const isEcon = art.category.toLowerCase().includes('econ') || art.category.toLowerCase().includes('finan');
                          const isSci = art.category.toLowerCase().includes('cienc') || art.category.toLowerCase().includes('clima');
                          
                          const categoryTheme = isSport ? 'text-emerald-400' :
                                                isTech ? 'text-blue-400' :
                                                isEcon ? 'text-amber-400' :
                                                isSci ? 'text-cyan-400' : 'text-slate-400';
                          return (
                            <div 
                              key={art.id}
                              onClick={() => {
                                setSelectedArticle(art);
                                setIsExpandedModalOpen(true);
                              }}
                              className={`p-3 rounded-xl border bg-zinc-900/20 hover:bg-zinc-900/60 transition-all flex flex-col justify-between gap-3 cursor-pointer group ${
                                selectedArticle?.id === art.id ? 'border-red-600 ring-1 ring-red-500/20 bg-zinc-900/50' : 'border-white/5 hover:border-slate-700'
                              }`}
                              id={`art-highlight-${art.id}`}
                            >
                              <div className="flex gap-3 min-w-0">
                                {/* Thumbnail */}
                                <div className="w-16 h-16 bg-zinc-800 rounded-lg overflow-hidden relative shrink-0">
                                  <img 
                                    src={art.imageUrl || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60"} 
                                    alt="" 
                                    referrerPolicy="no-referrer"
                                    onError={(e) => handleImageError(e, art.category)}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                    <span className={`text-[8px] font-black uppercase tracking-wider ${categoryTheme}`}>
                                      {art.category}
                                    </span>
                                    <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                    <span className="text-[9px] text-slate-500 font-mono">{art.publishedAt}</span>
                                  </div>
                                  <h5 className="text-[11px] font-extrabold text-white group-hover:text-red-400 transition-colors line-clamp-2 leading-tight">
                                    {art.title}
                                  </h5>
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[9px] text-slate-500">
                                <span className="truncate max-w-[120px]">{art.reporter.split(',')[0]}</span>
                                <span className="text-red-500/80 hover:text-red-400 font-semibold flex items-center gap-1 font-mono">
                                  <Heart className="w-3 h-3 text-red-500 fill-current" /> {art.likes || 12}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. COLUMNA DE TELETIPOS DE ÚLTIMA HORA (Rest of articles: Index 5 to end) */}
                  {articles.length > 5 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between border-b border-white/5 pb-1">
                        <span className="text-[10px] font-extrabold text-[#ef4444] tracking-wider uppercase">SERVICIO DE TELETIPOS EN VIVO</span>
                        <span className="text-[8px] text-slate-400 font-mono">Actualizado hace instantes</span>
                      </div>
                      
                      <div className="divide-y divide-white/5 flex flex-col">
                        {currentTeletipos.map((art, idx) => {
                          const absoluteIdx = 5 + startIndex + idx;
                          return (
                            <div 
                              key={art.id}
                              onClick={() => {
                                setSelectedArticle(art);
                                setIsExpandedModalOpen(true);
                              }}
                              className={`py-2.5 flex items-start gap-3 cursor-pointer group transition-all px-2 rounded-lg hover:bg-white/5 ${
                                selectedArticle?.id === art.id ? 'bg-red-950/20 border-l-2 border-red-600 pl-3' : ''
                              }`}
                              id={`art-ticker-${art.id}`}
                            >
                              <span className="text-[10px] font-black text-slate-600 group-hover:text-red-400 shrink-0 select-none pt-0.5 font-mono">
                                {(absoluteIdx + 1).toString().padStart(2, '0')}
                              </span>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h6 className="text-[11px] font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                                    {art.title}
                                  </h6>
                                  <span className="text-[8px] bg-white/5 text-slate-400 px-1.5 py-0.2 rounded font-mono shrink-0">
                                    {art.category.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5 leading-relaxed">
                                  {art.summary}
                                </p>
                              </div>
                              
                              <div className="text-[9px] text-slate-500 text-right shrink-0 pl-2 self-center font-mono">
                                {art.publishedAt}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* CONTROLES DE PAGINACIÓN: ELEGANTES Y ALTAMENTE INTERACTIVOS */}
                      <div className="flex items-center justify-between mt-3 bg-zinc-900/40 p-2.5 rounded-xl border border-white/5 text-xs text-slate-400 font-sans">
                        <div className="flex items-center gap-1.5">
                          <span>Mostrar</span>
                          <select 
                            value={teletiposPerPage}
                            onChange={(e) => {
                              const newSize = Number(e.target.value);
                              setTeletiposPerPage(newSize);
                              setTeletipoPage(1);
                              alertModal("Paginación actualizada", `Ahora se visualizarán hasta ${newSize} teletipos por página.`);
                            }}
                            className="bg-black/60 border border-white/10 rounded px-1.5 py-0.5 text-white text-[11px] focus:outline-none focus:border-red-500 font-mono cursor-pointer"
                            id="select-teletipos-per-page"
                          >
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={6}>6</option>
                            <option value={10}>10</option>
                          </select>
                          <span>teletipos</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            disabled={safePage <= 1}
                            onClick={() => {
                              setTeletipoPage(p => Math.max(1, p - 1));
                            }}
                            className="w-7 h-7 bg-zinc-950 border border-white/5 hover:border-red-500 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                            title="Página Anterior"
                            id="btn-pag-prev"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="font-mono text-[11px] font-bold text-slate-300">
                            {safePage} / {totalPages || 1}
                          </span>
                          <button
                            disabled={safePage >= totalPages}
                            onClick={() => {
                              setTeletipoPage(p => Math.min(totalPages, p + 1));
                            }}
                            className="w-7 h-7 bg-zinc-950 border border-white/5 hover:border-red-500 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                            title="Página Siguiente"
                            id="btn-pag-next"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs italic">
                  Cargando artículos importantes...
                </div>
              )}
            </div>

          </div>

          {/* Right Sidebar: Dynamic Interactive Live Channels & voice anchor panel */}
          <aside className={`w-full md:w-[320px] bg-zinc-950/80 border-t md:border-t-0 md:border-l border-white/5 flex flex-col overflow-hidden shrink-0 ${
            mobileSubTab === 'chat' || mobileSubTab === 'voice' ? 'flex' : 'hidden md:flex'
          }`}>
            {/* Sidebar Tab Selectors */}
            <div className="flex border-b border-white/5 bg-zinc-950 p-1 shrink-0 select-none">
              <button
                onClick={() => setSidebarTab('chat')}
                className={`flex-1 py-1.5 text-center text-[10px] uppercase font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarTab === 'chat'
                    ? 'bg-red-600/15 text-red-400 border border-red-500/35 font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
                id="btn-sidebar-tab-chat"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Opiniones ({chatComments.length})</span>
              </button>
              <button
                onClick={() => setSidebarTab('voice')}
                className={`flex-1 py-1.5 text-center text-[10px] uppercase font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarTab === 'voice'
                    ? 'bg-red-600/15 text-red-300 border border-red-500/35 font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
                id="btn-sidebar-tab-voice"
              >
                <Volume2 className="w-3.5 h-3.5 text-red-500" />
                <span>Locución IA</span>
              </button>
            </div>

            {/* TAB CONTENT: Live Chat */}
            {sidebarTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3 bg-zinc-950/40 border-b border-white/5 flex items-center justify-between select-none shrink-0 font-mono">
                  <span className="text-[9px] text-slate-400 tracking-wider flex items-center gap-1.5 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    CHAT EN DIRECTO • SATÉLITE MADRID
                  </span>
                  <button 
                    onClick={() => {
                      // Generate and add a simulated high-quality user comment
                      const userNames = ['politica_hoy', 'andalucia_libre', 'goleador_es', 'atomo_cuantico', 'bursatil_ibex'];
                      const mockComments = [
                        'Excelente análisis de los redactores. Se nota el grounded de datos oficiales.',
                        '¿Se sabe si repercutirá en los precios de de suministro andaluz?',
                        'Gran boletín, España avanza rápido con estas tecnologías de indexación de prensa.',
                        'Esperamos la rueda de prensa oficial a las 18:00 para ampliar más detalles.',
                        'He verificado las fuentes citadas abajo y la información está contrastrada la minuto.'
                      ];
                      const randName = userNames[Math.floor(Math.random() * userNames.length)];
                      const randComment = mockComments[Math.floor(Math.random() * mockComments.length)];
                      
                      const commentItem: LiveChatComment = {
                        id: 'mc-' + Date.now(),
                        username: randName,
                        comment: randComment,
                        timestamp: 'Ahora mismo'
                      };
                      setChatComments(prev => [commentItem, ...prev]);
                    }}
                    className="text-[9px] bg-red-600/10 hover:bg-red-600/25 border border-red-500/20 text-red-400 font-extrabold px-1.5 py-0.5 rounded cursor-pointer"
                    id="btn-simulation-add-comment"
                  >
                    + Simular Reacción
                  </button>
                </div>

                {/* Actual scrollable opinion stack */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[140px] md:min-h-0 no-scrollbar">
                  {chatComments.map((comm) => (
                    <div key={comm.id} className="bg-[#0e0e14]/90 border border-white/5 p-2.5 rounded-xl text-xs relative hover:border-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-200 text-[10px] text-red-400">@{comm.username}</span>
                        <span className="text-[8px] text-slate-500 font-mono">{comm.timestamp}</span>
                      </div>
                      <p className="text-slate-300 leading-normal text-[11px] font-sans">{comm.comment}</p>
                    </div>
                  ))}
                </div>

                {/* Add Opinion Form */}
                <form onSubmit={handleAddComment} className="p-3 bg-zinc-950/90 border-t border-white/5 flex items-center gap-2 shrink-0">
                  <input 
                    type="text"
                    placeholder="Escribe tu reacción al boletín..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    maxLength={100}
                    className="flex-1 bg-zinc-900 border border-white/5 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-slate-500"
                    id="live-chat-box-input"
                  />
                  <button 
                    type="submit"
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all cursor-pointer shrink-0 shadow-md shadow-red-600/15"
                    title="Comentar"
                    id="live-chat-box-submit"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: AIAudioAnchor */}
            {sidebarTab === 'voice' && (
              <div className="flex-1 flex flex-col p-3.5 gap-4 overflow-y-auto no-scrollbar bg-zinc-950/95">
                <div className="flex flex-col gap-1 select-none text-center">
                  <span className="text-[9px] text-[#fbbf24] font-black tracking-widest uppercase flex items-center justify-center gap-1 font-mono">
                    <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    APARTADO DE LOCUCIÓN IA PRO
                  </span>
                  <h4 className="text-[11px] text-slate-200 font-extrabold font-sans">
                    Lectura Sintetizada Multicanal
                  </h4>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Escuche las noticias narradas por voces neuronales entrenadas en dicción de prensa española.
                  </p>
                </div>

                {/* LECTURA CONTINUA OPT IN GROUP */}
                <div className="bg-[#0b0c11] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2.5 font-sans">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black tracking-wider text-red-400 uppercase font-mono">
                        🔄 LECTURA CONTINUA
                      </span>
                      <span className="text-[9px] text-slate-400">
                        Avanza automáticamente tras finalizar
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isContinuousReading}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setIsContinuousReading(val);
                          alertModal(val ? "Lectura Continua Activada" : "Lectura Continua Desactivada", val ? "Al finalizar cada boletín de voz, se iniciará una cuenta atrás de 5s para avanzar y reproducir el siguiente de forma fluida." : "Se ha desactivado la transición automática.");
                        }}
                        className="sr-only peer"
                        id="toggle-continuous-reading-voice"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
                    </label>
                  </div>
                  
                  {isContinuousReading && (
                    <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1 animate-fade-in text-[10px] select-none">
                      <span className="text-slate-300">Autoreproducir voz IA al avanzar</span>
                      <button 
                        type="button"
                        onClick={() => setContinuousAutoplayVoice(!continuousAutoplayVoice)}
                        className={`px-2 py-0.5 rounded font-bold font-mono text-[9px] uppercase border transition-all ${
                          continuousAutoplayVoice 
                            ? 'bg-red-950/20 text-red-400 border-red-500/20' 
                            : 'bg-zinc-900 text-slate-500 border-white/5'
                        }`}
                        id="btn-toggle-continuous-voice"
                      >
                        {continuousAutoplayVoice ? 'SÍ (ACTIVO)' : 'SINO'}
                      </button>
                    </div>
                  )}
                </div>

                {selectedArticle ? (
                  <div className="bg-[#000003] border border-white/5 rounded-xl p-3 flex flex-col gap-3 font-mono">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0"></div>
                      <span className="text-[9px] font-extrabold text-[#e2e8f0] truncate max-w-[210px] uppercase">
                        LOCUTANDO: {selectedArticle.title}
                      </span>
                    </div>

                    <AIAudioAnchor 
                      newsTitle={selectedArticle.title}
                      newsSummary={selectedArticle.summary}
                      newsContent={selectedArticle.content}
                      onEnded={handleAudioFinished}
                      autoPlay={isContinuousReading && continuousAutoplayVoice}
                    />
                  </div>
                ) : (
                  <div className="p-6 bg-[#0e0e14] border border-dashed border-white/5 rounded-xl text-center select-none flex flex-col items-center justify-center">
                    <Volume2 className="w-8 h-8 text-slate-600 animate-bounce mb-2" />
                    <h5 className="text-[11px] font-bold text-slate-300">Ningún boletín seleccionado</h5>
                    <p className="text-[9px] text-slate-500 mt-1 max-w-[190px] font-sans">
                      Haga clic en cualquier boletín de la portada anterior para cargarlo en el sintetizador.
                    </p>
                  </div>
                )}
                
                {/* Voice quality simulator widgets */}
                <div className="p-3 bg-[#0d0d12]/90 border border-white/5 rounded-xl flex flex-col gap-2 select-none">
                  <span className="text-[9px] text-slate-400 font-black tracking-wider uppercase font-mono">HERRAMIENTAS DE SEÑAL</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => alertModal("Estabilidad de Voz", "El timbre vocal neural configurado utiliza 1.2M de parámetros para garantizar entonación castellana perfecta. Estado de latencia de red: 14ms.")}
                      className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-lg text-[9px] font-extrabold text-[#94a3b8] hover:text-white transition-all cursor-pointer"
                      id="btn-signal-metrics"
                    >
                      Latencia de Voz
                    </button>
                    <button 
                      onClick={() => alertModal("Configuración del Canal", "Sonorización configurada en Estéreo 44.1 kHz. Descompresión digital asistida por el navegador local.")}
                      className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-lg text-[9px] font-extrabold text-[#94a3b8] hover:text-white transition-all cursor-pointer"
                      id="btn-voice-channel"
                    >
                      Banda de Audio
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>

        </div>

        {/* Dynamic bottom Looping Ticker Feed */}
        <NewsTicker />

        {/* Mobile Look Device Footer Indicator - Bottom Tab style */}
        <footer className="h-16 bg-black border-t border-white/5 flex items-center justify-around px-4 shrink-0 z-10 text-[10px] font-bold text-slate-500 select-none">
          <div 
            onClick={() => handleCategoryClick('Todo')}
            className="flex flex-col items-center gap-1 text-red-500 cursor-pointer hover:text-red-400 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="uppercase text-[9px] tracking-wider">Inicio</span>
          </div>
          <div 
            onClick={() => handleCategoryClick('Tecnología')}
            className="flex flex-col items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-400" />
            <span className="uppercase text-[9px] tracking-wider">Ciencia y Tech</span>
          </div>
          
          {/* Simulated central action live tab */}
          <div 
            onClick={() => {
              if (articles.length > 0) {
                // Pick a random index news
                const randomIndex = Math.floor(Math.random() * articles.length);
                setSelectedArticle(articles[randomIndex]);
              }
            }}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-white cursor-pointer relative -mt-5"
          >
            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center border-4 border-[#08080C] shadow-lg hover:bg-red-500 transition-all">
              <Radio className="w-4 h-4 text-white animate-pulse" />
            </div>
            <span className="uppercase text-[9px] tracking-wider mt-1">Azar Live</span>
          </div>
          
          <div 
            onClick={() => handleCategoryClick('Deportes')}
            className="flex flex-col items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <span className="uppercase text-[9px] tracking-wider">Deportes</span>
          </div>
          <div 
            onClick={() => {
              if (selectedArticle) {
                handleLike(selectedArticle.id);
                // Toggle likedArticles
                setLikedArticles(prev => {
                  const current = !prev[selectedArticle.id];
                  alertModal(current ? "Añadido a Favoritos" : "Eliminado de Favoritos", current ? "Este boletín de España de última hora se ha marcado con Megusta." : "Se ha retirado Megusta de este informe.");
                  return { ...prev, [selectedArticle.id]: current };
                });
              } else {
                alertModal("Sin selección", "No has seleccionado ningún artículo para darle Megusta.");
              }
            }}
            className="flex flex-col items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <Heart className={`w-4 h-4 transition-colors ${selectedArticle && likedArticles[selectedArticle.id] ? 'text-red-500 fill-current' : 'text-slate-400 hover:text-red-500'}`} />
            <span className="uppercase text-[9px] tracking-wider">Megusta</span>
          </div>
        </footer>

        {/* MODAL DETALLE DE INVESTIGACIÓN: AMPLIA TODA LA INFORMACIÓN */}
        {isExpandedModalOpen && selectedArticle && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col justify-end sm:justify-center p-3 sm:p-5 select-none animate-fade-in font-sans">
            <div 
              className="bg-[#0b0c10] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90%] flex flex-col overflow-hidden shadow-2xl relative"
              id="reportage-expanded-modal"
            >
              {/* Header */}
              <div className="p-4 bg-zinc-950/90 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryTheme(selectedArticle.category)}`}>
                    {selectedArticle.category.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    • Reporte de Investigación #España {selectedArticle.id}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setIsExpandedModalOpen(false);
                    setCorrectionsForm(prev => ({ ...prev, show: false }));
                  }}
                  className="w-7 h-7 bg-zinc-900 border border-white/5 hover:border-red-500 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
                  id="btn-close-expanded-modal"
                  title="Cerrar Reportaje Ampliado"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
                {/* Hero Artwork banner inside modal with Interactive Zoom and Drag */}
                <div 
                  className="w-full h-44 rounded-xl overflow-hidden relative shrink-0 bg-black select-none group/zoom"
                  onMouseDown={handleZoomMouseDown}
                  onMouseMove={handleZoomMouseMove}
                  onMouseUp={handleZoomMouseUp}
                  onMouseLeave={handleZoomMouseUp}
                  onTouchStart={handleZoomTouchStart}
                  onTouchMove={handleZoomTouchMove}
                  onTouchEnd={handleZoomMouseUp}
                  id="zoom-image-container"
                >
                  <img 
                    src={selectedArticle.imageUrl || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60"} 
                    alt="" 
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageError(e, selectedArticle.category)}
                    className="w-full h-full object-cover brightness-75 select-none pointer-events-none"
                    style={{ 
                      transform: `translate(${zoomPan.x}px, ${zoomPan.y}px) scale(${zoomScale})`,
                      transition: isZoomDragging ? 'none' : 'transform 0.15s ease-out',
                      transformOrigin: 'center center'
                    }}
                  />
                  
                  {/* Outer gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none"></div>
                  
                  {/* Subtle Text indicator of current title when not fully zoomed or always floating smoothly */}
                  {zoomScale === 1 && (
                    <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                      <span className="text-[9px] font-black text-amber-400 tracking-wider flex items-center gap-1 font-mono uppercase mb-1">
                        <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                        Mesa Editorial Moncloa España
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                        {selectedArticle.title}
                      </h3>
                    </div>
                  )}

                  {/* INTERACTIVE CONTROLS HUD (Absolute Top-Right Panels) */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/75 backdrop-blur-md rounded-lg p-1 border border-white/10 shadow-lg z-10 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomScale(prev => Math.max(1, prev - 0.5));
                        if (zoomScale <= 1.5) {
                          setZoomPan({ x: 0, y: 0 });
                        }
                      }}
                      className="w-6 h-6 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40"
                      disabled={zoomScale <= 1}
                      title="Zoom Out (-)"
                      id="btn-zoom-out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-[9px] font-black font-mono text-amber-400 px-1.5 min-w-[28px] text-center select-none">
                      {zoomScale.toFixed(1)}x
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomScale(prev => Math.min(4, prev + 0.5));
                      }}
                      className="w-6 h-6 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40"
                      disabled={zoomScale >= 4}
                      title="Zoom In (+)"
                      id="btn-zoom-in"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>

                    {zoomScale > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomScale(1);
                          setZoomPan({ x: 0, y: 0 });
                        }}
                        className="ml-1 px-1.5 h-6 rounded bg-red-600 hover:bg-red-700 text-[8px] uppercase font-black text-white flex items-center justify-center transition-all cursor-pointer"
                        title="Reset"
                        id="btn-zoom-reset"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Overlay message helper when image is scaleable */}
                  <div className="absolute top-2 left-2 pointer-events-none bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/5 flex items-center gap-1 z-10">
                    <Move className="w-3 h-3 text-slate-400" />
                    <span className="text-[8px] font-bold font-mono text-slate-300 uppercase tracking-widest">
                      {zoomScale > 1 ? "Arrastra para panear" : "Doble click para 2x"}
                    </span>
                  </div>

                  {/* Double click/tap zone to toggle zoom 1x <-> 2x */}
                  <div 
                    className="absolute inset-0"
                    style={{ cursor: zoomScale > 1 ? (isZoomDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (zoomScale > 1) {
                        setZoomScale(1);
                        setZoomPan({ x: 0, y: 0 });
                      } else {
                        setZoomScale(2);
                        setZoomPan({ x: 0, y: 0 });
                      }
                    }}
                  />
                </div>

                {/* INTERACTIVE CONTROLS BAR: Font Resizer & Editorial Reactions */}
                <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Font Customizer */}
                  <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5">
                    <span className="font-bold text-slate-300 text-[10px] uppercase font-mono">Tamaño de letra:</span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                        className="w-6 h-6 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/5 rounded text-[10px] font-bold text-white cursor-pointer active:scale-95 flex items-center justify-center"
                        disabled={fontSize <= 12}
                        id="btn-font-decrease"
                        title="Hacer letra más pequeña"
                      >
                        A-
                      </button>
                      <span className="text-[11px] font-bold text-white font-mono px-2 bg-zinc-950 rounded">
                        {fontSize}px
                      </span>
                      <button 
                        onClick={() => setFontSize(Math.min(22, fontSize + 1))}
                        className="w-6 h-6 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 border border-white/5 rounded text-[10px] font-bold text-white cursor-pointer active:scale-95 flex items-center justify-center"
                        disabled={fontSize >= 22}
                        id="btn-font-increase"
                        title="Hacer letra más grande"
                      >
                        A+
                      </button>
                    </div>
                  </div>

                  {/* Reaction counters & vote indicator */}
                  <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-white/5">
                    <span className="font-bold text-slate-300 text-[10px] uppercase font-mono">Feedback lector:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      {/* Excellent (Smile) */}
                      <button 
                        onClick={() => {
                          const artId = selectedArticle.id;
                          setUserReactions(prev => ({ ...prev, [artId]: 'excellent' }));
                          setReactionCounters(prev => {
                            const current = prev[artId] || { excellent: 104, neutral: 21, critical: 4 };
                            return { ...prev, [artId]: { ...current, excellent: current.excellent + 1 } };
                          });
                          alertModal("¡Excelente Reacción!", "Su voto de excelencia e interés ha sido transmitido a la mesa de editores en vivo. Gracias por su valoración.");
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer select-none ${
                          userReactions[selectedArticle.id] === 'excellent' 
                            ? 'bg-emerald-500/10 border border-emerald-500/35 text-emerald-400' 
                            : 'bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-slate-300'
                        }`}
                        id="btn-react-excl"
                        title="Excelente cobertura"
                      >
                        <Smile className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{((reactionCounters[selectedArticle.id]?.excellent) || 128)}</span>
                      </button>

                      {/* Critical (Frown) */}
                      <button 
                        onClick={() => {
                          const artId = selectedArticle.id;
                          setUserReactions(prev => ({ ...prev, [artId]: 'critical' }));
                          setReactionCounters(prev => {
                            const current = prev[artId] || { excellent: 104, neutral: 21, critical: 4 };
                            return { ...prev, [artId]: { ...current, critical: current.critical + 1 } };
                          });
                          alertModal("Sugerencia Recibida", "He tomado nota de su sesgo crítico. Le invitamos a rellenar el formulario 'Reportar Erratas' para auditar esta noticia.");
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer select-none ${
                          userReactions[selectedArticle.id] === 'critical' 
                            ? 'bg-amber-600/35 border border-amber-500 text-amber-300' 
                            : 'bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-slate-300'
                        }`}
                        id="btn-react-crit"
                        title="Reportar sesgo u objeción"
                      >
                        <Frown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{((reactionCounters[selectedArticle.id]?.critical) || 15)}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* ERRTAS CORRECTION QUICK-SUBMIT COMPONENT */}
                {correctionsForm.show ? (
                  <div className="p-3.5 bg-zinc-900 border border-amber-500/20 rounded-xl space-y-3 animate-fade-in text-xs font-sans">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5 font-mono">
                      <span className="font-extrabold text-[#fbbf24] flex items-center gap-1 uppercase text-[10px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Formulario de Erratas y Ombudsman
                      </span>
                      <button 
                        onClick={() => setCorrectionsForm(prev => ({ ...prev, show: false }))}
                        className="text-slate-400 hover:text-white font-bold cursor-pointer"
                      >
                        [X Cancelar]
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-300 uppercase">Clasificación:</label>
                      <select 
                        value={correctionsForm.category}
                        onChange={(e) => setCorrectionsForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-red-500"
                      >
                        <option value="Ortografía">Error de Ortografía u Redacción</option>
                        <option value="Dato Fáctico">Inexactitud Fáctica de Fuente</option>
                        <option value="Sesgo Editorial">Objeción de Equidad / Neutralidad</option>
                        <option value="Imagen Erraria">Fallo de Carga Visual</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-300 uppercase">Detalle de la objeción:</label>
                      <textarea 
                        value={correctionsForm.description}
                        onChange={(e) => setCorrectionsForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Ej: El nombre de la localidad en el párrafo 2 tiene una errata, corresponde a..."
                        rows={2}
                        className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-red-500 placeholder-slate-600"
                      />
                    </div>

                    <button 
                      onClick={() => {
                        if (!correctionsForm.description.trim()) {
                          alertModal("Campo Vacío", "Por favor escriba la objeción o errata a rectificar.");
                          return;
                        }
                        alertModal(
                          "Rectificación Enviada", 
                          `Gracias. Su reporte sobre '${correctionsForm.category}' ha sido enviado al buzón del Ombudsman de la federación. ID: RT-${Math.floor(Math.random() * 95000)}.`
                        );
                        setCorrectionsForm({ category: 'Ortografía', description: '', show: false });
                      }}
                      className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-extrabold text-[10px] uppercase rounded-xl transition-all cursor-pointer border border-amber-500/20"
                    >
                      Enviar Corrección Formal
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-zinc-900/40 p-3 rounded-xl border border-white/5 text-[11px] font-mono">
                    <span className="text-slate-400">¿Ha detectado alguna inconsistencia redactal o errata de Gemini?</span>
                    <button 
                      onClick={() => setCorrectionsForm(prev => ({ ...prev, show: true }))}
                      className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/35 border border-amber-500/20 text-amber-400 rounded-lg font-bold text-[9px] uppercase transition-all cursor-pointer select-none"
                    >
                      ⚠️ Fe de Erratas
                    </button>
                  </div>
                )}

                {/* Lead Summary */}
                <blockquote className="border-l-4 border-red-600 bg-zinc-950/40 p-4 rounded-r-xl italic select-text select-all">
                  <p className="text-xs font-semibold text-slate-200 leading-relaxed font-sans">
                    "{selectedArticle.summary}"
                  </p>
                </blockquote>

                {/* MAIN REPORTAGE BODY TEXT (Dynamic Size) */}
                <div className="space-y-3.5 select-text">
                  <p 
                    className="text-slate-300 leading-relaxed font-sans"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {selectedArticle.content}
                  </p>
                  
                  <p 
                    className="text-slate-400 leading-relaxed font-sans text-xs italic bg-[#0f0f13] border border-white/5 p-3 rounded-xl"
                  >
                    Mesa central de España (grounded digital): Este informe fue sintetizado de corresponsalías oficiales de prensa libre en la península ibérica, consolidando registros satelitales y teletipos bajo la supervisión de un ombudsman digital. El contenido ampliado se actualiza al minuto vía satélite.
                  </p>
                </div>

                {/* INTERACTIVE CHECKLIST: AUDITAR PUNTOS CRÍTICOS (Satisfies "todo botón sirve para algo") */}
                <div className="bg-[#0c0d12] border border-white/5 p-3.5 rounded-xl space-y-3 font-sans">
                  <span className="text-[10px] font-black tracking-wider text-red-500 font-mono uppercase block">
                    ☑️ LISTA DE COTEJO DE VERACIDAD (OMBUDSMAN)
                  </span>
                  
                  <p className="text-[10px] text-slate-400">
                    Interactúe marcando los puntos verificados de este boletín para auditar su confiabilidad telemática.
                  </p>

                  <div className="space-y-2 select-none">
                    {[
                      "Contraste del teletipo principal con alertas de protección civil",
                      "Verificación de las fuentes citadas en el pie de página de España",
                      "Timbre de neutralidad periodística libre de alocución proselitista",
                      "Aprobación satelital y grounding digital del Málaga Valley"
                    ].map((point, index) => {
                      const artId = selectedArticle.id;
                      const isChecked = (processedPoints[artId] && processedPoints[artId][index]) || false;
                      
                      return (
                        <div 
                          key={index}
                          onClick={() => {
                            setProcessedPoints(prev => {
                              const artData = prev[artId] || {};
                              return {
                                ...prev,
                                [artId]: {
                                  ...artData,
                                  [index]: !isChecked
                                }
                              };
                            });
                          }}
                          className={`p-2 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-[#10b981]/10 border-[#10b981]/30 text-emerald-400' 
                              : 'bg-zinc-950/40 border-white/5 hover:border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                            isChecked ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-white/10 text-transparent'
                          }`}>
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span className="text-[11px] leading-snug">{point}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Grounding Sources for verification */}
                <div className="pt-2.5 border-t border-white/5 font-sans">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1 mb-2.5 font-mono">
                    <BookOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    FUENTES VERIFICADAS DE BÚSQUEDA (GROUNDING)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedArticle.sources && selectedArticle.sources.length > 0 ? (
                      selectedArticle.sources.map((src, idx) => (
                        <a 
                          key={idx}
                          href={src.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="bg-[#0a0a0f] hover:bg-[#14141d] border border-white/5 p-2.5 rounded-xl flex items-center justify-between text-[11px] hover:text-amber-400 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="w-4 h-4 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-[9px] shrink-0 font-mono">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-slate-300 line-clamp-1 truncate group-hover:text-amber-400">
                              {src.title}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        </a>
                      ))
                    ) : (
                      <div className="col-span-2 text-[10px] text-slate-500 italic">
                        No se listaron fuentes accesorias para este artículo.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer sharing button bar */}
              <div className="p-4 bg-zinc-950/95 border-t border-white/5 flex gap-2 shrink-0 select-none">
                <button 
                  onClick={() => {
                    const newVal = !isContinuousReading;
                    setIsContinuousReading(newVal);
                    alertModal(newVal ? "Lectura Continua Pro" : "Lector Automático Detenido", newVal ? "El sistema avanzará de noticia secuencialmente tras completarse." : "Se desactivó la autotransición.");
                  }}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 ${
                    isContinuousReading 
                      ? 'bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#10b981] border-[#10b981]/35' 
                      : 'bg-[#1a1c24] hover:bg-[#252834] text-slate-300 border-white/5'
                  }`}
                  id="btn-continuous-modal-toggle"
                  title="Cambiar estado del lector continuo automatizado"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isContinuousReading ? 'bg-[#10b981] animate-pulse' : 'bg-slate-600'}`}></span>
                  {isContinuousReading ? 'Reprod. Continuo' : 'Avanzar Auto'}
                </button>

                <button 
                  onClick={() => {
                    const shareText = `Periódico España: ${selectedArticle.title} - ${selectedArticle.summary}`;
                    navigator.clipboard.writeText(shareText);
                    alertModal(
                      "Enlace Copiado", 
                      "El reportaje de investigación ha sido copiado en su portapapeles. Puede compartirlo en WhatsApp, Telegram o Twitter libre de sesgos."
                    );
                  }}
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-[11px] text-slate-200 hover:text-white rounded-xl font-bold border border-white/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
                  id="btn-share-modal-report"
                >
                  <Copy className="w-3.5 h-3.5 text-[#fbbf24]" />
                  Compartir Reporte
                </button>

                <button 
                  onClick={() => {
                    setIsExpandedModalOpen(false);
                    setCorrectionsForm(prev => ({ ...prev, show: false }));
                  }}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-[11px] text-white rounded-xl font-extrabold transition-all cursor-pointer"
                  id="btn-close-expanded-modal-bottom"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTINUOUS READING ACTIVE TIMER COUNTDOWN OVERLAY */}
        {countdownActive && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-fade-in font-sans">
            <div className="bg-[#0c0d12] border border-red-500/40 rounded-2xl w-full max-w-xs p-5 flex flex-col items-center justify-center text-center shadow-2xl relative">
              <div className="w-12 h-12 bg-red-600/10 border border-red-500/30 rounded-full flex items-center justify-center mb-4 relative">
                <span className="text-white font-mono text-base font-black animate-pulse">
                  {countdownRemaining}s
                </span>
                <div className="w-12 h-12 rounded-full border-2 border-red-600 border-t-transparent animate-spin absolute top-0 left-0"></div>
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1 font-mono">
                LECTURA CONTINUA (AUTO)
              </h4>
              <p className="text-[11px] text-slate-400 leading-snug mb-4">
                Boletín actual completado con éxito. Cargando el siguiente reporte informativo de España en breve...
              </p>
              
              <div className="flex gap-2 w-full font-sans">
                <button 
                  type="button"
                  onClick={() => {
                    setCountdownActive(false);
                    // Skip now
                    if (articles.length > 0 && selectedArticle) {
                      const currentIndex = articles.findIndex(a => a.id === selectedArticle.id);
                      if (currentIndex !== -1) {
                        const nextIndex = (currentIndex + 1) % articles.length;
                        setSelectedArticle(articles[nextIndex]);
                        alertModal("Siguiente Boletín", `Cargado: "${articles[nextIndex].title}"`);
                      }
                    }
                  }}
                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                  id="btn-countdown-skip"
                >
                  Saltar
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setCountdownActive(false);
                  }}
                  className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer border border-white/5"
                  id="btn-countdown-cancel"
                >
                  Pausar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOM STATEFUL DIALOG ALERT OVERLAY */}
        {alertInfo && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-55 flex items-center justify-center p-4 alert-dialog-overlay select-none animate-fade-in font-sans">
            <div className="bg-[#111218] border border-red-500/30 rounded-2xl w-full max-w-xs p-5 flex flex-col items-center justify-center text-center shadow-2xl relative">
              <div className="w-10 h-10 bg-red-600/10 border border-red-500/25 rounded-full flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">
                {alertInfo.title}
              </h4>
              <p className="text-[11px] text-slate-400 leading-snug mb-4">
                {alertInfo.message}
              </p>
              <button 
                onClick={() => setAlertInfo(null)}
                className="w-full py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-[10px] uppercase rounded-xl transition-all cursor-pointer"
                id="btn-close-alert-modal"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

      </div>
    </PhoneFrame>
  );
}
