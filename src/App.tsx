/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * NoticiasVIVO 2.0 — Rediseño completo
 * App de noticias de España de clase mundial
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Radio, Send, Heart, BookOpen, ExternalLink,
  RefreshCw, Sparkles, Volume2, TrendingUp, MessageSquare,
  AlertTriangle, X, Copy, Check, ChevronLeft, ChevronRight,
  Flame, Zap, Globe, Tv, Bookmark, Bell, Share2, Eye,
  Clock, User, Award, BarChart2, Layers, Filter
} from 'lucide-react';
import { PhoneFrame } from './components/PhoneFrame';
import { AIAudioAnchor } from './components/AIAudioAnchor';
import { NewsArticle, LiveChatComment } from './types';
import { motion, AnimatePresence } from 'motion/react';

// ─── UTILIDADES ────────────────────────────────────────────────────────────────

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, cat = '') => {
  const c = cat.toLowerCase();
  const fallbacks: Record<string, string> = {
    depor: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=700&auto=format&fit=crop&q=70',
    tech:  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=700&auto=format&fit=crop&q=70',
    econ:  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=700&auto=format&fit=crop&q=70',
    cien:  'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=700&auto=format&fit=crop&q=70',
    poli:  'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=700&auto=format&fit=crop&q=70',
  };
  const key = Object.keys(fallbacks).find(k => c.includes(k));
  const url = key ? fallbacks[key] : 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=700&auto=format&fit=crop&q=70';
  if (e.currentTarget.src !== url) e.currentTarget.src = url;
};

const getCatConfig = (cat: string) => {
  const c = cat.toLowerCase();
  if (c.includes('depor') || c.includes('fútbol')) return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: '⚽ Deportes' };
  if (c.includes('tech') || c.includes('tecnol'))  return { color: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: '💡 Tecnología' };
  if (c.includes('econ') || c.includes('finan'))   return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: '📈 Economía' };
  if (c.includes('cienc') || c.includes('clima'))  return { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', label: '🔬 Ciencia' };
  if (c.includes('inter') || c.includes('mundo'))  return { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: '🌍 Internacional' };
  return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: '📰 Nacional' };
};

const formatNum = (n = 0) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

// ─── ESTILOS GLOBALES (inyectados en <head>) ──────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700;800;900&display=swap');

  :root {
    --bg:        #08090d;
    --surface:   #0f1117;
    --surface2:  #151820;
    --border:    rgba(255,255,255,0.07);
    --border2:   rgba(255,255,255,0.12);
    --text:      #f1f5f9;
    --text2:     #94a3b8;
    --text3:     #475569;
    --red:       #ef4444;
    --red-glow:  rgba(239,68,68,0.25);
  }

  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Geist', system-ui, sans-serif;
    overscroll-behavior: none;
  }

  .serif { font-family: 'Instrument Serif', Georgia, serif; }

  /* Scrollbar minimalista */
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

  /* Ocultar scrollbar en pistas horizontales */
  .no-bar { scrollbar-width: none; }
  .no-bar::-webkit-scrollbar { display: none; }

  /* Animaciones */
  @keyframes ping  { 75%,100% { transform: scale(2.2); opacity: 0; } }
  @keyframes spin  { to { transform: rotate(360deg); } }
  @keyframes slide-up   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fade-in    { from { opacity:0; } to { opacity:1; } }
  @keyframes ticker { from { transform:translateX(0); } to { transform:translateX(-50%); } }
  @keyframes pulse-glow { 0%,100% { box-shadow:0 0 0 0 var(--red-glow); } 50% { box-shadow:0 0 0 8px transparent; } }
  @keyframes card-in { from { opacity:0; transform:scale(0.97) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }

  .slide-up  { animation: slide-up  0.32s cubic-bezier(0.16,1,0.3,1) both; }
  .fade-in   { animation: fade-in   0.22s ease both; }
  .card-in   { animation: card-in   0.28s cubic-bezier(0.16,1,0.3,1) both; }

  input::placeholder { color: var(--text3); }
  input:focus { outline: none; }
  button { cursor: pointer; }
  a { text-decoration: none; }

  /* Gradiente inferior en listas */
  .fade-bottom::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 60px;
    background: linear-gradient(to top, var(--surface), transparent);
    pointer-events: none;
  }
`;

// ─── COMPONENTES ATÓMICOS ─────────────────────────────────────────────────────

const LiveDot = ({ size = 8, color = '#ef4444', animate = true }) => (
  <span style={{ position:'relative', display:'inline-flex', width:size, height:size, flexShrink:0 }}>
    {animate && (
      <span style={{
        position:'absolute', inset:0, borderRadius:'50%', background:color,
        opacity:.7, animation:'ping 1.4s ease infinite'
      }} />
    )}
    <span style={{ position:'relative', width:size, height:size, borderRadius:'50%', background:color, display:'block' }} />
  </span>
);

const Pill = ({ children, color = '#ef4444', small = false }: any) => (
  <span style={{
    display:'inline-flex', alignItems:'center', gap:4,
    padding: small ? '2px 7px' : '3px 9px',
    borderRadius:99, fontSize: small ? 9 : 10, fontWeight:800,
    letterSpacing:'0.06em', textTransform:'uppercase',
    background:`${color}18`, border:`1px solid ${color}35`, color,
  }}>
    {children}
  </span>
);

const ImportancePill = ({ importance }: { importance: string }) => {
  const map: Record<string, { label: string; color: string }> = {
    breaking: { label: '🔴 Urgente',    color: '#ef4444' },
    high:     { label: '⚡ Relevante',  color: '#f59e0b' },
    medium:   { label: '📌 Destacado',  color: '#6366f1' },
    low:      { label: '📄 Info',       color: '#64748b' },
  };
  const cfg = map[importance] || map.low;
  return <Pill color={cfg.color} small>{cfg.label}</Pill>;
};

// ─── TICKER SUPERIOR ──────────────────────────────────────────────────────────

const BreakingTicker = ({ articles }: { articles: NewsArticle[] }) => {
  const items = articles.filter(a => a.importance === 'breaking' || a.importance === 'high');
  if (!items.length) return null;
  const text = [...items, ...items].map(a => `🚨 ${a.title}`).join('     ·     ');
  return (
    <div style={{
      background:'rgba(239,68,68,0.06)', borderBottom:'1px solid rgba(239,68,68,0.15)',
      height:32, display:'flex', alignItems:'center', overflow:'hidden', flexShrink:0
    }}>
      <div style={{
        background:'#ef4444', padding:'0 14px', height:'100%',
        display:'flex', alignItems:'center', gap:6, flexShrink:0,
        fontSize:9, fontWeight:900, letterSpacing:'0.14em', color:'#fff',
        borderRight:'1px solid rgba(255,255,255,0.1)'
      }}>
        <LiveDot size={6} color="#fff" /> ALERTA
      </div>
      <div style={{
        flex:1, overflow:'hidden',
        maskImage:'linear-gradient(90deg,transparent,black 5%,black 95%,transparent)'
      }}>
        <div style={{
          display:'inline-flex', whiteSpace:'nowrap',
          animation:'ticker 45s linear infinite',
          fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.7)', gap:0
        }}>
          <span style={{ paddingRight:40 }}>{text}</span>
          <span>{text}</span>
        </div>
      </div>
    </div>
  );
};

// ─── CABECERA PRINCIPAL ───────────────────────────────────────────────────────

const TopBar = ({
  query, onQuery, onSearch, onRefresh, loading, viewers
}: any) => {
  const [focused, setFocused] = useState(false);
  const [localQ, setLocalQ] = useState(query);
  const submit = (e: React.FormEvent) => { e.preventDefault(); onSearch(localQ); };

  return (
    <div style={{
      padding:'0 16px', height:58,
      display:'flex', alignItems:'center', gap:12,
      background:'rgba(8,9,13,0.95)', backdropFilter:'blur(16px)',
      borderBottom:'1px solid var(--border)', flexShrink:0, position:'sticky', top:0, zIndex:80
    }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{
          width:30, height:30, background:'#ef4444', borderRadius:8,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 0 16px rgba(239,68,68,0.4)', animation:'pulse-glow 2s ease infinite'
        }}>
          <Radio size={15} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:900, color:'#fff', letterSpacing:'-0.03em', lineHeight:1 }}>
            NOTICIAS<span style={{ color:'#ef4444' }}>VIVO</span>
          </div>
          <div style={{ fontSize:8, color:'rgba(255,255,255,0.3)', fontWeight:600, letterSpacing:'0.1em' }}>
            ESPAÑA · 24H
          </div>
        </div>
      </div>

      {/* Buscador */}
      <form onSubmit={submit} style={{ flex:1, position:'relative' }}>
        <Search size={13} style={{
          position:'absolute', left:10, top:'50%', transform:'translateY(-50%)',
          color: focused ? '#ef4444' : 'var(--text3)', transition:'color 0.18s'
        }} />
        <input
          value={localQ}
          onChange={e => setLocalQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Buscar en España…"
          style={{
            width:'100%', paddingLeft:30, paddingRight:10, height:34,
            background: focused ? 'var(--surface2)' : 'var(--surface)',
            border:`1px solid ${focused ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
            borderRadius:10, color:'var(--text)', fontSize:12, fontWeight:500,
            transition:'all 0.18s', fontFamily:'inherit'
          }}
        />
      </form>

      {/* Viewers + Refresh */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <LiveDot size={6} color="#10b981" />
          <span style={{ fontSize:10, color:'#10b981', fontWeight:700, fontFamily:'monospace' }}>
            {viewers.toLocaleString('es-ES')}
          </span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            width:30, height:30, background:'var(--surface)', border:'1px solid var(--border)',
            borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
            color:'var(--text2)', transition:'all 0.18s', flexShrink:0
          }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>
    </div>
  );
};

// ─── BARRA DE CATEGORÍAS ──────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'Todo',          emoji: '🌐', label: 'Todo' },
  { key: 'Internacional', emoji: '🌍', label: 'Internacional' },
  { key: 'Tecnología',    emoji: '💡', label: 'Tecnología' },
  { key: 'Deportes',      emoji: '⚽', label: 'Deportes' },
  { key: 'Ciencia',       emoji: '🔬', label: 'Ciencia' },
  { key: 'Economía',      emoji: '📈', label: 'Economía' },
];

const CategoryBar = ({ active, onSelect }: { active: string; onSelect: (k: string) => void }) => (
  <div className="no-bar" style={{
    display:'flex', gap:6, padding:'10px 16px',
    overflowX:'auto', flexShrink:0,
    borderBottom:'1px solid var(--border)',
    background:'var(--bg)'
  }}>
    {CATEGORIES.map(c => {
      const isActive = active === c.key;
      return (
        <button
          key={c.key}
          onClick={() => onSelect(c.key)}
          style={{
            padding:'6px 14px', borderRadius:99, flexShrink:0, border:'none',
            fontSize:11, fontWeight:700, fontFamily:'inherit',
            background: isActive ? '#ef4444' : 'var(--surface2)',
            color: isActive ? '#fff' : 'var(--text2)',
            boxShadow: isActive ? '0 2px 14px rgba(239,68,68,0.35)' : 'none',
            transform: isActive ? 'scale(1.04)' : 'scale(1)',
            transition:'all 0.18s'
          }}
        >
          {c.emoji} {c.label}
        </button>
      );
    })}
  </div>
);

// ─── TARJETA HERO ─────────────────────────────────────────────────────────────

const HeroCard = ({ article, onClick }: { article: NewsArticle; onClick: () => void }) => {
  const cfg = getCatConfig(article.category);
  return (
    <motion.div
      className="card-in"
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      style={{
        borderRadius:20, overflow:'hidden', cursor:'pointer',
        border:'1px solid var(--border)',
        background:'var(--surface)', flexShrink:0
      }}
    >
      {/* Imagen con gradiente */}
      <div style={{ position:'relative', aspectRatio:'16/9' }}>
        <img
          src={article.imageUrl || ''}
          alt=""
          onError={e => handleImageError(e, article.category)}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', filter:'brightness(0.7)' }}
        />
        {/* Gradiente */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(to top, rgba(15,17,23,1) 0%, rgba(15,17,23,0.2) 55%, transparent 100%)'
        }} />
        {/* Badges */}
        <div style={{ position:'absolute', top:14, left:14, display:'flex', gap:7 }}>
          <ImportancePill importance={article.importance} />
        </div>
        {/* Viewers */}
        <div style={{
          position:'absolute', top:14, right:14,
          background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)',
          borderRadius:8, padding:'4px 10px',
          fontSize:10, color:'rgba(255,255,255,0.8)', fontWeight:600,
          display:'flex', alignItems:'center', gap:5
        }}>
          <Eye size={11} /> {formatNum(article.reads)}
        </div>
        {/* LIVE badge si aplica */}
        {article.importance === 'breaking' && (
          <div style={{
            position:'absolute', bottom:16, left:16,
            background:'#ef4444', borderRadius:6, padding:'3px 9px',
            fontSize:9, fontWeight:900, color:'#fff', letterSpacing:'0.1em',
            display:'flex', alignItems:'center', gap:5
          }}>
            <LiveDot size={5} color="#fff" /> DIRECTO
          </div>
        )}
      </div>

      {/* Contenido */}
      <div style={{ padding:'16px 18px 18px' }}>
        {/* Categoría + tiempo */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <span style={{ fontSize:10, fontWeight:800, color:cfg.color, letterSpacing:'0.06em' }}>
            {article.category.toUpperCase()}
          </span>
          <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--text3)', display:'block' }} />
          <span style={{ fontSize:10, color:'var(--text3)', fontWeight:500, display:'flex', alignItems:'center', gap:4 }}>
            <Clock size={10} /> {article.publishedAt}
          </span>
        </div>

        {/* Titular */}
        <h2 className="serif" style={{
          fontSize:20, fontWeight:700, color:'var(--text)',
          lineHeight:1.28, marginBottom:10, letterSpacing:'-0.01em'
        }}>
          {article.title}
        </h2>

        {/* Sumario */}
        <p style={{
          fontSize:13, color:'var(--text2)', lineHeight:1.65,
          marginBottom:14, fontWeight:400,
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'
        }}>
          {article.summary}
        </p>

        {/* Footer */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          paddingTop:12, borderTop:'1px solid var(--border)'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{
              width:24, height:24, background:'var(--surface2)', borderRadius:'50%',
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              <User size={11} color="var(--text3)" />
            </div>
            <span style={{ fontSize:11, color:'var(--text3)', fontWeight:500 }}>
              {article.reporter.split(',')[0]}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:11, color:'var(--text3)', display:'flex', alignItems:'center', gap:4 }}>
              <Heart size={11} fill="currentColor" color="#ef4444" /> {formatNum(article.likes)}
            </span>
            <div style={{
              padding:'4px 12px', background:'#ef4444', borderRadius:8,
              fontSize:10, fontWeight:800, color:'#fff'
            }}>
              Leer →
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── TARJETA COMPACTA ─────────────────────────────────────────────────────────

const CompactCard = ({
  article, onClick, isActive, index
}: { article: NewsArticle; onClick: () => void; isActive: boolean; index: number }) => {
  const cfg = getCatConfig(article.category);
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        display:'flex', gap:12, padding:'12px 16px', cursor:'pointer',
        borderRadius:14, border:`1px solid ${isActive ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`,
        background: isActive ? 'rgba(239,68,68,0.06)' : 'transparent',
        transition:'all 0.18s', alignItems:'center'
      }}
    >
      {/* Número */}
      <span style={{
        fontFamily:'monospace', fontSize:11, color:'var(--text3)', fontWeight:700, minWidth:20
      }}>
        {String(index).padStart(2,'0')}
      </span>

      {/* Thumbnail */}
      <div style={{
        width:60, height:60, borderRadius:10, overflow:'hidden',
        flexShrink:0, background:'var(--surface2)'
      }}>
        <img
          src={article.imageUrl || ''}
          alt=""
          onError={e => handleImageError(e, article.category)}
          style={{ width:'100%', height:'100%', objectFit:'cover' }}
        />
      </div>

      {/* Texto */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
          <span style={{ fontSize:9, fontWeight:800, color:cfg.color, letterSpacing:'0.06em', textTransform:'uppercase' }}>
            {article.category}
          </span>
          <span style={{ fontSize:9, color:'var(--text3)', fontFamily:'monospace' }}>
            · {article.publishedAt}
          </span>
        </div>
        <h5 className="serif" style={{
          fontSize:13, fontWeight:700, color:'var(--text)', lineHeight:1.35,
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'
        }}>
          {article.title}
        </h5>
      </div>

      {/* Likes */}
      <div style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
        <Heart size={10} fill="#ef4444" color="#ef4444" />
        <span style={{ fontSize:10, color:'var(--text3)', fontWeight:600 }}>{formatNum(article.likes)}</span>
      </div>
    </motion.div>
  );
};

// ─── GRID 2×2 ─────────────────────────────────────────────────────────────────

const MiniCard = ({ article, onClick }: { article: NewsArticle; onClick: () => void }) => {
  const cfg = getCatConfig(article.category);
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        borderRadius:14, overflow:'hidden', cursor:'pointer',
        border:'1px solid var(--border)', background:'var(--surface)'
      }}
    >
      <div style={{ position:'relative', aspectRatio:'3/2' }}>
        <img
          src={article.imageUrl || ''}
          alt=""
          onError={e => handleImageError(e, article.category)}
          style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.65)' }}
        />
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(to top, rgba(15,17,23,0.95) 0%, transparent 60%)'
        }} />
        <div style={{ position:'absolute', bottom:8, left:8, right:8 }}>
          <span style={{
            fontSize:8, fontWeight:800, color:cfg.color, letterSpacing:'0.08em',
            textTransform:'uppercase', display:'block', marginBottom:4
          }}>
            {article.category}
          </span>
          <h6 className="serif" style={{
            fontSize:12, fontWeight:700, color:'#fff', lineHeight:1.3,
            display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden'
          }}>
            {article.title}
          </h6>
        </div>
      </div>
      <div style={{ padding:'8px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:9, color:'var(--text3)', fontFamily:'monospace' }}>{article.publishedAt}</span>
        <span style={{ fontSize:9, color:'var(--text3)', display:'flex', alignItems:'center', gap:3 }}>
          <Eye size={9} /> {formatNum(article.reads)}
        </span>
      </div>
    </motion.div>
  );
};

// ─── SECCIÓN ENCABEZADO ───────────────────────────────────────────────────────

const SectionTitle = ({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{
        width:24, height:24, background:'rgba(239,68,68,0.12)', borderRadius:6,
        display:'flex', alignItems:'center', justifyContent:'center'
      }}>
        {icon}
      </div>
      <span style={{ fontSize:11, fontWeight:900, color:'var(--text)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
        {title}
      </span>
    </div>
    {sub && <span style={{ fontSize:10, color:'var(--text3)' }}>{sub}</span>}
  </div>
);

// ─── TICKER INFERIOR ──────────────────────────────────────────────────────────

const BottomTicker = () => {
  const items = [
    '📊 IBEX-35 +1.87% · 13.240pts', '⚡ NASDAQ +0.94%', '💛 Oro 2.441$/oz',
    '🌡 Madrid 27°C · Despejado', '⚽ España 2-1 Francia (FT)',
    '🔬 ITER: 6min plasma sostenido', '✈ Barajas: operación normal',
    '📉 IPC España +2.1% interanual', '🌊 Alerta naranja litoral levantino'
  ];
  const doubled = [...items, ...items];
  return (
    <div style={{
      background:'#090a0e', borderTop:'1px solid var(--border)',
      height:34, display:'flex', alignItems:'center', overflow:'hidden',
      flexShrink:0
    }}>
      <div style={{
        background:'var(--surface2)', padding:'0 12px', height:'100%',
        display:'flex', alignItems:'center', gap:5, flexShrink:0,
        fontSize:8, fontWeight:900, letterSpacing:'0.12em', color:'var(--text2)',
        borderRight:'1px solid var(--border)'
      }}>
        EN VIVO
      </div>
      <div style={{ flex:1, overflow:'hidden', maskImage:'linear-gradient(90deg,transparent,black 3%,black 97%,transparent)' }}>
        <div style={{
          display:'inline-flex', whiteSpace:'nowrap',
          animation:'ticker 50s linear infinite',
        }}>
          {doubled.map((t, i) => (
            <span key={i} style={{
              padding:'0 24px', fontSize:11, fontWeight:500,
              color:'rgba(255,255,255,0.5)', whiteSpace:'nowrap'
            }}>
              {t} <span style={{ color:'rgba(239,68,68,0.4)', marginLeft:12 }}>|</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── CHAT EN VIVO ─────────────────────────────────────────────────────────────

const INIT_COMMENTS: LiveChatComment[] = [
  { id:'c1', username:'juan_esp99',    comment:'Cobertura impecable. La fusión nuclear cambia todo.',           timestamp:'Hace 1 min' },
  { id:'c2', username:'tech_málaga',   comment:'420M€ para el hub de Málaga 🚀 el futuro del sur de Europa.',   timestamp:'Hace 3 min' },
  { id:'c3', username:'sofia_libre',   comment:'¿Alguien tiene más fuentes sobre Atapuerca?',                  timestamp:'Hace 5 min' },
  { id:'c4', username:'econ_analyst',  comment:'El Ibex en máximos históricos, buen momento para SAN y BBVA.', timestamp:'Hace 8 min' },
  { id:'c5', username:'reporter_live', comment:'¡Excelente trabajo de la mesa editorial hoy! Sigue así.',      timestamp:'Hace 12 min' },
];

const LiveChat = ({ articleTitle }: { articleTitle: string }) => {
  const [comments, setComments] = useState<LiveChatComment[]>(INIT_COMMENTS);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const c: LiveChatComment = {
      id: `u-${Date.now()}`, username:'usuario_vivo',
      comment: text.trim(), timestamp:'Ahora mismo'
    };
    setComments(p => [c, ...p]);
    setText('');
    // Auto-respuesta simulada
    const replies = [
      '¡Completamente de acuerdo! Gran apunte.',
      'Interesante perspectiva, gracias por compartirlo.',
      '¿Tienen el enlace oficial? Me interesa profundizar.',
      'España avanza a pasos agigantados en esto 💪',
      'Gran cobertura de la redacción hoy 👏'
    ];
    const users = ['m_gonzalez', 'reporter_esp', 'clara_vivo', 'periodista_mx'];
    setTimeout(() => {
      setComments(p => [{
        id:`r-${Date.now()}`,
        username: users[Math.floor(Math.random()*users.length)],
        comment: replies[Math.floor(Math.random()*replies.length)],
        timestamp:'Ahora mismo'
      }, ...p]);
    }, 2800);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* Cabecera */}
      <div style={{
        padding:'10px 16px', borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <LiveDot size={7} color="#10b981" />
          <span style={{ fontSize:11, fontWeight:800, color:'var(--text2)', letterSpacing:'0.06em' }}>
            REACCIONES · {comments.length}
          </span>
        </div>
        <button
          onClick={() => {
            const u = ['noticias_fan','esp_hoy','live_reader','abc_digital'];
            const m = [
              'Fuente confirmada: el dato está en el BOE.',
              'Impresionante la velocidad de cobertura.',
              '¿Habrá rueda de prensa oficial?',
              'Comparto esto en Twitter ahora mismo.',
            ];
            setComments(p => [{
              id:`sim-${Date.now()}`,
              username: u[Math.floor(Math.random()*u.length)],
              comment: m[Math.floor(Math.random()*m.length)],
              timestamp:'Ahora mismo'
            }, ...p]);
          }}
          style={{
            fontSize:9, fontWeight:800, color:'#ef4444',
            background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)',
            padding:'3px 9px', borderRadius:6, letterSpacing:'0.04em'
          }}
        >
          + Simular
        </button>
      </div>

      {/* Lista */}
      <div style={{ flex:1, overflowY:'auto', padding:'10px 14px', display:'flex', flexDirection:'column', gap:8 }}>
        {comments.map(c => (
          <div key={c.id} style={{
            background:'var(--surface2)', borderRadius:12,
            border:'1px solid var(--border)', padding:'10px 12px'
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:10, fontWeight:800, color:'#ef4444' }}>@{c.username}</span>
              <span style={{ fontSize:9, color:'var(--text3)', fontFamily:'monospace' }}>{c.timestamp}</span>
            </div>
            <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5 }}>{c.comment}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} style={{
        padding:'10px 14px', borderTop:'1px solid var(--border)',
        display:'flex', gap:8, flexShrink:0, background:'var(--bg)'
      }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Tu reacción al boletín…"
          maxLength={120}
          style={{
            flex:1, padding:'9px 12px', background:'var(--surface2)',
            border:'1px solid var(--border)', borderRadius:10,
            color:'var(--text)', fontSize:12, fontFamily:'inherit'
          }}
        />
        <button type="submit" style={{
          width:36, height:36, background:'#ef4444', border:'none',
          borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
        }}>
          <Send size={14} color="#fff" />
        </button>
      </form>
    </div>
  );
};

// ─── MODAL DETALLE ────────────────────────────────────────────────────────────

const ArticleModal = ({
  article, onClose, onLike, liked, onVoice
}: {
  article: NewsArticle; onClose: () => void;
  onLike: (id: string) => void; liked: boolean;
  onVoice: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showVoice, setShowVoice] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const cfg = getCatConfig(article.category);

  const copy = () => {
    navigator.clipboard.writeText(`${article.title} — ${article.summary}`).catch(()=>{});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{
        position:'fixed', inset:0, zIndex:200,
        background:'rgba(0,0,0,0.85)', backdropFilter:'blur(16px)',
        display:'flex', alignItems:'flex-end', justifyContent:'center',
        padding:12
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y:40, opacity:0 }} animate={{ y:0, opacity:1 }}
        exit={{ y:40, opacity:0 }}
        transition={{ type:'spring', damping:26, stiffness:320 }}
        onClick={e => e.stopPropagation()}
        style={{
          background:'var(--surface)', borderRadius:24,
          border:'1px solid var(--border2)',
          width:'100%', maxWidth:540, maxHeight:'94vh',
          display:'flex', flexDirection:'column', overflow:'hidden',
          boxShadow:'0 24px 80px rgba(0,0,0,0.7)'
        }}
      >
        {/* Handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
          <div style={{ width:40, height:4, borderRadius:99, background:'var(--border2)' }} />
        </div>

        {/* Header */}
        <div style={{
          padding:'12px 18px 14px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <ImportancePill importance={article.importance} />
            <Pill color={cfg.color} small>{article.category}</Pill>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button onClick={() => setBookmarked(b => !b)} style={{
              width:32, height:32, background:'var(--surface2)', border:'1px solid var(--border)',
              borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center',
              color: bookmarked ? '#f59e0b' : 'var(--text3)'
            }}>
              <Bookmark size={13} fill={bookmarked ? '#f59e0b' : 'none'} />
            </button>
            <button onClick={onClose} style={{
              width:32, height:32, background:'var(--surface2)', border:'1px solid var(--border)',
              borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center',
              color:'var(--text2)', fontSize:18
            }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scroll body */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 18px' }}>
          {/* Imagen */}
          <div style={{ borderRadius:16, overflow:'hidden', marginBottom:18, aspectRatio:'16/8' }}>
            <img
              src={article.imageUrl || ''}
              alt=""
              onError={e => handleImageError(e, article.category)}
              style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.88)' }}
            />
          </div>

          {/* Metadata row */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <span style={{ fontSize:11, color:'var(--text3)', display:'flex', alignItems:'center', gap:4 }}>
              <User size={10} /> {article.reporter.split(',')[0]}
            </span>
            <span style={{ width:3, height:3, background:'var(--text3)', borderRadius:'50%', display:'block' }} />
            <span style={{ fontSize:11, color:'var(--text3)', display:'flex', alignItems:'center', gap:4 }}>
              <Clock size={10} /> {article.publishedAt}
            </span>
            <span style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, color:'var(--text3)', display:'flex', alignItems:'center', gap:3 }}>
                <Eye size={10} /> {formatNum(article.reads)}
              </span>
            </span>
          </div>

          {/* Titular */}
          <h2 className="serif" style={{
            fontSize:22, fontWeight:700, color:'var(--text)',
            lineHeight:1.28, marginBottom:14, letterSpacing:'-0.02em'
          }}>
            {article.title}
          </h2>

          {/* Control tamaño fuente */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'8px 12px', background:'var(--surface2)',
            borderRadius:10, marginBottom:14, border:'1px solid var(--border)'
          }}>
            <span style={{ fontSize:10, fontWeight:700, color:'var(--text3)', letterSpacing:'0.06em' }}>TAMAÑO</span>
            <div style={{ display:'flex', gap:6 }}>
              {[12,14,16,18].map(s => (
                <button key={s} onClick={() => setFontSize(s)} style={{
                  width:28, height:28, borderRadius:7, border:'none',
                  background: fontSize === s ? '#ef4444' : 'var(--surface)',
                  color: fontSize === s ? '#fff' : 'var(--text3)',
                  fontSize:10, fontWeight:800, fontFamily:'inherit'
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Sumario */}
          <blockquote style={{
            borderLeft:'3px solid #ef4444',
            background:'rgba(239,68,68,0.05)', borderRadius:'0 10px 10px 0',
            padding:'12px 16px', marginBottom:16
          }}>
            <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.65, fontStyle:'italic' }}>
              "{article.summary}"
            </p>
          </blockquote>

          {/* Cuerpo */}
          <p style={{
            fontSize, color:'rgba(241,245,249,0.7)', lineHeight:1.85,
            marginBottom:20, fontFamily:'inherit', fontWeight:400
          }}>
            {article.content}
          </p>

          {/* Panel de voz IA */}
          <div style={{
            background:'var(--surface2)', borderRadius:14,
            border:'1px solid var(--border)', padding:'12px 14px', marginBottom:16
          }}>
            <button
              onClick={() => setShowVoice(v => !v)}
              style={{
                display:'flex', alignItems:'center', gap:8, width:'100%',
                background:'none', border:'none', color:'var(--text)',
                fontSize:12, fontWeight:700, fontFamily:'inherit', padding:0
              }}
            >
              <div style={{
                width:28, height:28, background:'rgba(239,68,68,0.12)', borderRadius:8,
                display:'flex', alignItems:'center', justifyContent:'center'
              }}>
                <Volume2 size={13} color="#ef4444" />
              </div>
              Escuchar este boletín (Voz IA)
              <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text3)' }}>
                {showVoice ? '▲' : '▼'}
              </span>
            </button>
            {showVoice && (
              <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)' }}>
                <AIAudioAnchor
                  newsTitle={article.title}
                  newsSummary={article.summary}
                  newsContent={article.content}
                  autoPlay={false}
                />
              </div>
            )}
          </div>

          {/* Fuentes */}
          {article.sources?.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{
                display:'flex', alignItems:'center', gap:6, marginBottom:10,
                fontSize:10, fontWeight:800, color:'#f59e0b', letterSpacing:'0.08em', textTransform:'uppercase'
              }}>
                <BookOpen size={12} color="#f59e0b" /> Fuentes Verificadas
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {article.sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'9px 12px', background:'rgba(245,158,11,0.06)',
                    border:'1px solid rgba(245,158,11,0.15)',
                    borderRadius:10, color:'rgba(241,245,249,0.6)', fontSize:12
                  }}>
                    <span>#{i+1} · {s.title}</span>
                    <ExternalLink size={12} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Nota editorial */}
          <div style={{
            padding:'10px 14px', background:'var(--surface2)',
            borderRadius:10, border:'1px solid var(--border)',
            fontSize:11, color:'var(--text3)', lineHeight:1.6, fontStyle:'italic'
          }}>
            Mesa editorial España — Información contrastada con corresponsalías oficiales.
            Actualización continua vía API de agencias de prensa nacionales.
          </div>
        </div>

        {/* Acciones */}
        <div style={{
          padding:'12px 18px', borderTop:'1px solid var(--border)',
          display:'flex', gap:8, flexShrink:0, background:'var(--surface)'
        }}>
          <button onClick={() => onLike(article.id)} style={{
            flex:1, height:40, borderRadius:12, border:'none', fontFamily:'inherit',
            background: liked ? 'rgba(239,68,68,0.15)' : 'var(--surface2)',
            color: liked ? '#f87171' : 'var(--text2)',
            fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            transition:'all 0.18s'
          }}>
            <Heart size={13} fill={liked ? '#f87171' : 'none'} color={liked ? '#f87171' : 'currentColor'} />
            {liked ? 'Con Amor' : 'Me Gusta'}
          </button>
          <button onClick={copy} style={{
            flex:1, height:40, borderRadius:12, border:'none', fontFamily:'inherit',
            background: copied ? 'rgba(16,185,129,0.15)' : 'var(--surface2)',
            color: copied ? '#10b981' : 'var(--text2)',
            fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            transition:'all 0.18s'
          }}>
            {copied ? <Check size={13} /> : <Share2 size={13} />}
            {copied ? '¡Copiado!' : 'Compartir'}
          </button>
          <button onClick={onClose} style={{
            padding:'0 20px', height:40, background:'#ef4444', border:'none',
            borderRadius:12, color:'#fff', fontSize:12, fontWeight:800, fontFamily:'inherit'
          }}>
            Cerrar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── NAV INFERIOR ─────────────────────────────────────────────────────────────

const NAV_TABS = [
  { key:'feed',     icon: <Globe size={18} />,       label:'Inicio' },
  { key:'trending', icon: <Flame size={18} />,       label:'Tendencias' },
  { key:'live',     icon: <Radio size={18} />,       label:'En Vivo' },
  { key:'saved',    icon: <Bookmark size={18} />,    label:'Guardados' },
];

const BottomNav = ({ tab, onTab }: { tab: string; onTab: (k: string) => void }) => (
  <nav style={{
    background:'rgba(8,9,13,0.97)', backdropFilter:'blur(16px)',
    borderTop:'1px solid var(--border)',
    display:'flex', height:62, flexShrink:0,
    paddingBottom:'env(safe-area-inset-bottom, 0px)'
  }}>
    {NAV_TABS.map(t => {
      const active = tab === t.key;
      return (
        <button key={t.key} onClick={() => onTab(t.key)} style={{
          flex:1, background:'none', border:'none', padding:'8px 0',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3,
          color: active ? '#ef4444' : 'var(--text3)',
          transition:'color 0.18s', fontFamily:'inherit'
        }}>
          {t.icon}
          <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase' }}>
            {t.label}
          </span>
        </button>
      );
    })}
  </nav>
);

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────

export default function App() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [category, setCategory] = useState('Todo');
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState<NewsArticle | null>(null);
  const [liked, setLiked]       = useState<Record<string, boolean>>({});
  const [navTab, setNavTab]     = useState('feed');
  const [mainTab, setMainTab]   = useState<'news'|'chat'>('news');
  const [viewers, setViewers]   = useState(142050);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Contador de viewers dinámico
  useEffect(() => {
    const id = setInterval(() => {
      setViewers(v => Math.max(90000, v + Math.floor(Math.random()*160) - 78));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const fetchNews = useCallback(async (cat = 'Todo', q = '') => {
    setLoading(true); setError(null);
    try {
      let url = `/api/news/list?category=${encodeURIComponent(cat)}`;
      if (q) url += `&query=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error de conexión con el servidor.');
      const data = await res.json();
      if (data.articles?.length) {
        setArticles(data.articles);
        setSelected(data.articles[0]);
      } else {
        setArticles([]); setSelected(null);
        setError('No se encontraron artículos. Prueba otro término.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de red desconocido.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const handleCategory = (cat: string) => {
    setCategory(cat); setQuery('');
    fetchNews(cat);
    scrollRef.current?.scrollTo({ top:0, behavior:'smooth' });
  };

  const handleSearch = (q: string) => {
    setQuery(q); setCategory('Todo');
    if (q.trim()) fetchNews('Todo', q);
  };

  const handleLike = (id: string) => {
    setLiked(p => ({ ...p, [id]: !p[id] }));
    setArticles(p => p.map(a => a.id === id ? { ...a, likes:(a.likes||0)+1 } : a));
  };

  const heroArticle = articles[0];
  const gridArticles = articles.slice(1, 5);
  const listArticles = articles.slice(5);

  return (
    <>
      {/* Inyectar estilos globales */}
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />

      <PhoneFrame
        isSimulatedMobile={true}
        setIsSimulatedMobile={() => {}}
        statusText={`${loading ? 'Indexando noticias…' : `${articles.length} boletines · ${viewers.toLocaleString('es-ES')} lectores en vivo`}`}
      >
        <div style={{
          display:'flex', flexDirection:'column', height:'100%', overflow:'hidden',
          background:'var(--bg)'
        }}>
          {/* ── TICKER ALERTA ── */}
          {!loading && <BreakingTicker articles={articles} />}

          {/* ── CABECERA ── */}
          <TopBar
            query={query}
            onQuery={setQuery}
            onSearch={handleSearch}
            onRefresh={() => fetchNews(category, query)}
            loading={loading}
            viewers={viewers}
          />

          {/* ── CATEGORÍAS ── */}
          <CategoryBar active={category} onSelect={handleCategory} />

          {/* ── TABS NOTICIAS / CHAT ── */}
          <div style={{
            display:'flex', borderBottom:'1px solid var(--border)',
            background:'var(--bg)', flexShrink:0
          }}>
            {(['news','chat'] as const).map((t) => {
              const active = mainTab === t;
              return (
                <button key={t} onClick={() => setMainTab(t)} style={{
                  flex:1, height:38, background:'none', border:'none',
                  fontFamily:'inherit', fontSize:11, fontWeight:800,
                  letterSpacing:'0.06em', textTransform:'uppercase',
                  color: active ? '#ef4444' : 'var(--text3)',
                  borderBottom:`2px solid ${active ? '#ef4444' : 'transparent'}`,
                  transition:'all 0.18s', display:'flex', alignItems:'center', justifyContent:'center', gap:6
                }}>
                  {t === 'news' ? <><Layers size={12} /> Boletines</> : <><MessageSquare size={12} /> Chat en Vivo</>}
                </button>
              );
            })}
          </div>

          {/* ── CONTENIDO ── */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

            {/* FEED */}
            {mainTab === 'news' && (
              <div ref={scrollRef} style={{ flex:1, overflowY:'auto', padding:'16px 14px' }}>

                {/* Estado: cargando */}
                {loading && (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'64px 0', gap:16 }}>
                    <div style={{
                      width:42, height:42, borderRadius:'50%',
                      border:'3px solid var(--surface2)', borderTopColor:'#ef4444',
                      animation:'spin 0.8s linear infinite'
                    }} />
                    <p style={{ fontSize:13, color:'var(--text2)', fontWeight:500 }}>
                      Indexando noticias de España…
                    </p>
                  </div>
                )}

                {/* Estado: error */}
                {error && !loading && (
                  <div style={{
                    padding:20, background:'rgba(239,68,68,0.06)',
                    border:'1px solid rgba(239,68,68,0.2)', borderRadius:16,
                    display:'flex', flexDirection:'column', alignItems:'center', gap:12
                  }}>
                    <AlertTriangle size={28} color="#ef4444" />
                    <p style={{ fontSize:13, color:'#f87171', textAlign:'center' }}>{error}</p>
                    <button onClick={() => fetchNews()} style={{
                      padding:'8px 20px', background:'#ef4444', border:'none',
                      borderRadius:10, color:'#fff', fontSize:12, fontWeight:700, fontFamily:'inherit'
                    }}>
                      Reintentar
                    </button>
                  </div>
                )}

                {/* Estado: sin resultados */}
                {!loading && !error && articles.length === 0 && (
                  <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text3)' }}>
                    <div style={{ fontSize:40, marginBottom:16 }}>🔍</div>
                    <p style={{ fontSize:13, fontWeight:600 }}>Sin resultados para "{query}"</p>
                    <button onClick={() => { setQuery(''); setCategory('Todo'); fetchNews(); }} style={{
                      marginTop:16, padding:'8px 20px', background:'#ef4444', border:'none',
                      borderRadius:10, color:'#fff', fontSize:12, fontWeight:700, fontFamily:'inherit'
                    }}>
                      Volver al inicio
                    </button>
                  </div>
                )}

                {/* CONTENIDO PRINCIPAL */}
                {!loading && !error && articles.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

                    {/* Hero */}
                    {heroArticle && (
                      <div>
                        <SectionTitle
                          icon={<Award size={13} color="#ef4444" />}
                          title="Portada · Bajo Foco"
                          sub={`${articles.length} boletines`}
                        />
                        <HeroCard article={heroArticle} onClick={() => setSelected(heroArticle)} />
                      </div>
                    )}

                    {/* Grid 2×2 */}
                    {gridArticles.length > 0 && (
                      <div>
                        <SectionTitle icon={<Zap size={13} color="#ef4444" />} title="Noticias Destacadas" />
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                          {gridArticles.map(a => (
                            <MiniCard key={a.id} article={a} onClick={() => setSelected(a)} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lista teletipos */}
                    {listArticles.length > 0 && (
                      <div>
                        <SectionTitle
                          icon={<BarChart2 size={13} color="#ef4444" />}
                          title="Teletipos en Vivo"
                          sub="Actualización continua"
                        />
                        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                          {listArticles.map((a, i) => (
                            <CompactCard
                              key={a.id} article={a}
                              onClick={() => setSelected(a)}
                              isActive={selected?.id === a.id}
                              index={i + 6}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ textAlign:'center', padding:'12px 0', color:'var(--text3)', fontSize:10 }}>
                      NoticiasVIVO · Prensa libre · España 24H
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CHAT */}
            {mainTab === 'chat' && (
              <div style={{ flex:1, overflow:'hidden' }}>
                <LiveChat articleTitle={selected?.title || 'España en vivo'} />
              </div>
            )}
          </div>

          {/* ── TICKER INFERIOR ── */}
          <BottomTicker />

          {/* ── NAV ── */}
          <BottomNav tab={navTab} onTab={setNavTab} />

          {/* ── MODAL ── */}
          <AnimatePresence>
            {selected && (
              <ArticleModal
                article={selected}
                onClose={() => setSelected(null)}
                onLike={handleLike}
                liked={!!liked[selected.id]}
                onVoice={() => {}}
              />
            )}
          </AnimatePresence>
        </div>
      </PhoneFrame>
    </>
  );
}
