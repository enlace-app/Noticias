/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * NoticiasVIVO 3.0 — Diseño minimalista de clase mundial
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Radio, Send, Heart, BookOpen, ExternalLink,
  RefreshCw, Volume2, MessageSquare, AlertTriangle,
  X, Share2, Eye, Clock, Bookmark, Check,
  Flame, Zap, Globe, BarChart2, ChevronRight, Bell
} from 'lucide-react';
import { PhoneFrame } from './components/PhoneFrame';
import { AIAudioAnchor } from './components/AIAudioAnchor';
import { NewsArticle, LiveChatComment } from './types';
import { motion, AnimatePresence } from 'motion/react';

// ─── UTILIDADES ───────────────────────────────────────────────────────────────

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, cat = '') => {
  const c = cat.toLowerCase();
  const map: Record<string, string> = {
    depor:  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=70&auto=format&fit=crop',
    tech:   'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=70&auto=format&fit=crop',
    econ:   'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=70&auto=format&fit=crop',
    cien:   'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&q=70&auto=format&fit=crop',
    inter:  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=70&auto=format&fit=crop',
  };
  const key = Object.keys(map).find(k => c.includes(k));
  const url = key ? map[key] : 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&q=70&auto=format&fit=crop';
  if (e.currentTarget.src !== url) e.currentTarget.src = url;
};

const fmt = (n = 0) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

const CAT_MAP: Record<string, { color: string; accent: string; emoji: string }> = {
  'Internacional': { color: '#3b82f6', accent: '#1d4ed8', emoji: '🌍' },
  'Tecnología':    { color: '#8b5cf6', accent: '#6d28d9', emoji: '💡' },
  'Deportes':      { color: '#10b981', accent: '#047857', emoji: '⚽' },
  'Ciencia':       { color: '#06b6d4', accent: '#0e7490', emoji: '🔬' },
  'Economía':      { color: '#f59e0b', accent: '#b45309', emoji: '📈' },
  'Nacional':      { color: '#ef4444', accent: '#b91c1c', emoji: '🇪🇸' },
};

const getCat = (cat: string) => {
  const c = cat?.toLowerCase() || '';
  if (c.includes('depor') || c.includes('fútbol')) return CAT_MAP['Deportes'];
  if (c.includes('tech') || c.includes('tecnol'))  return CAT_MAP['Tecnología'];
  if (c.includes('econ') || c.includes('finan'))   return CAT_MAP['Economía'];
  if (c.includes('cien') || c.includes('clima'))   return CAT_MAP['Ciencia'];
  if (c.includes('inter') || c.includes('mundo'))  return CAT_MAP['Internacional'];
  return CAT_MAP['Nacional'];
};

// ─── ESTILOS GLOBALES ─────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

  :root {
    --bg:       #f8f7f4;
    --bg2:      #f0ede8;
    --card:     #ffffff;
    --border:   #e8e3dc;
    --border2:  #d5cec5;
    --ink:      #1a1814;
    --ink2:     #6b6560;
    --ink3:     #a8a39c;
    --red:      #d93025;
    --red-bg:   #fef2f1;
  }

  body {
    background: var(--bg);
    color: var(--ink);
    font-family: 'Inter', system-ui, sans-serif;
    overscroll-behavior: none;
  }

  .serif { font-family: 'Fraunces', Georgia, serif; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }
  .no-bar::-webkit-scrollbar { display: none; }
  .no-bar { scrollbar-width: none; }

  input, button { font-family: inherit; }
  input:focus { outline: none; }
  a { text-decoration: none; color: inherit; }

  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes fadeUp   { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
  @keyframes ticker   { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes ping     { 0% { transform: scale(1); opacity: .8; } 100% { transform: scale(2.4); opacity: 0; } }

  .fade-up { animation: fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) both; }
`;

// ─── ÁTOMO: PUNTO VIVO ────────────────────────────────────────────────────────

const Dot = ({ color = '#d93025', size = 7 }) => (
  <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size, flexShrink: 0 }}>
    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: .5, animation: 'ping 1.5s ease infinite' }} />
    <span style={{ position: 'relative', width: size, height: size, borderRadius: '50%', background: color, display: 'block' }} />
  </span>
);

// ─── ETIQUETA DE CATEGORÍA ────────────────────────────────────────────────────

const CatTag = ({ category, small = false }: { category: string; small?: boolean }) => {
  const cfg = getCat(category);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: small ? '2px 8px' : '3px 10px',
      borderRadius: 99,
      fontSize: small ? 9 : 10,
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: cfg.color,
      background: `${cfg.color}14`,
    }}>
      {cfg.emoji} {category}
    </span>
  );
};

// ─── ETIQUETA DE URGENCIA ─────────────────────────────────────────────────────

const UrgencyTag = ({ importance }: { importance: string }) => {
  if (importance !== 'breaking') return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 99,
      fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
      color: '#d93025', background: '#fef2f1',
      textTransform: 'uppercase'
    }}>
      <Dot size={5} /> Urgente
    </span>
  );
};

// ─── TICKER ───────────────────────────────────────────────────────────────────

const Ticker = ({ articles }: { articles: NewsArticle[] }) => {
  const breaking = articles.filter(a => a.importance === 'breaking' || a.importance === 'high');
  if (!breaking.length) return null;
  const text = [...breaking, ...breaking].map(a => `  ·  🔴 ${a.title}`).join('');
  return (
    <div style={{
      background: '#d93025', height: 30,
      display: 'flex', alignItems: 'center', overflow: 'hidden', flexShrink: 0
    }}>
      <div style={{
        padding: '0 14px', flexShrink: 0, height: '100%',
        display: 'flex', alignItems: 'center',
        fontSize: 9, fontWeight: 900, letterSpacing: '.14em', color: '#fff',
        borderRight: '1px solid rgba(255,255,255,.2)'
      }}>
        ALERTA
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          display: 'inline-block', whiteSpace: 'nowrap',
          animation: 'ticker 40s linear infinite',
          fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.9)'
        }}>
          <span>{text}</span><span>{text}</span>
        </div>
      </div>
    </div>
  );
};

// ─── CABECERA ─────────────────────────────────────────────────────────────────

const Header = ({ onRefresh, loading, viewers, onSearch }: any) => {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const now = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const dateStr = now.charAt(0).toUpperCase() + now.slice(1);

  const submit = (e: React.FormEvent) => { e.preventDefault(); onSearch(q); setOpen(false); };

  return (
    <header style={{
      background: 'var(--card)', borderBottom: '1px solid var(--border)',
      padding: '0 18px', flexShrink: 0, position: 'sticky', top: 0, zIndex: 90
    }}>
      {/* Fila principal */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {/* Logo */}
        <div>
          <div className="serif" style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.03em' }}>
            Noticias<span style={{ color: '#d93025' }}>.</span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--ink3)', letterSpacing: '.08em', fontWeight: 600 }}>
            ESPAÑA · {dateStr}
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Viewers */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', background: 'var(--bg2)',
            borderRadius: 99, border: '1px solid var(--border)'
          }}>
            <Dot color="#10b981" size={6} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink2)', fontFamily: 'monospace' }}>
              {viewers.toLocaleString('es-ES')}
            </span>
          </div>

          <button onClick={() => setOpen(o => !o)} style={{
            width: 34, height: 34, background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)'
          }}>
            <Search size={15} />
          </button>

          <button onClick={onRefresh} disabled={loading} style={{
            width: 34, height: 34, background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)'
          }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 0.9s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Buscador expandible */}
      {open && (
        <form onSubmit={submit} style={{ paddingBottom: 12 }}>
          <div style={{
            display: 'flex', gap: 8, padding: '8px 12px',
            background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border2)'
          }}>
            <Search size={14} color="var(--ink3)" />
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar en España…"
              style={{
                flex: 1, background: 'none', border: 'none',
                fontSize: 13, color: 'var(--ink)', fontWeight: 500
              }}
            />
            {q && (
              <button type="button" onClick={() => setQ('')} style={{ background: 'none', border: 'none', color: 'var(--ink3)' }}>
                <X size={14} />
              </button>
            )}
          </div>
        </form>
      )}
    </header>
  );
};

// ─── BARRA DE CATEGORÍAS ──────────────────────────────────────────────────────

const CATS = [
  { key: 'Todo',          label: 'Todo',          emoji: '📰' },
  { key: 'Internacional', label: 'Internacional',  emoji: '🌍' },
  { key: 'Tecnología',    label: 'Tecnología',     emoji: '💡' },
  { key: 'Deportes',      label: 'Deportes',       emoji: '⚽' },
  { key: 'Ciencia',       label: 'Ciencia',        emoji: '🔬' },
  { key: 'Economía',      label: 'Economía',       emoji: '📈' },
];

const CatBar = ({ active, onSelect }: { active: string; onSelect: (k: string) => void }) => (
  <div className="no-bar" style={{
    display: 'flex', gap: 0,
    background: 'var(--card)', borderBottom: '1px solid var(--border)',
    overflowX: 'auto', flexShrink: 0
  }}>
    {CATS.map(c => {
      const isActive = active === c.key;
      const cfg = c.key !== 'Todo' ? getCat(c.key) : null;
      return (
        <button
          key={c.key}
          onClick={() => onSelect(c.key)}
          style={{
            flexShrink: 0, padding: '0 16px', height: 42,
            background: 'none', border: 'none',
            fontSize: 12, fontWeight: isActive ? 700 : 500,
            color: isActive ? (cfg?.color || '#d93025') : 'var(--ink2)',
            borderBottom: `2px solid ${isActive ? (cfg?.color || '#d93025') : 'transparent'}`,
            transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 5,
            whiteSpace: 'nowrap'
          }}
        >
          {c.emoji} {c.label}
        </button>
      );
    })}
  </div>
);

// ─── SEPARADOR DE SECCIÓN ─────────────────────────────────────────────────────

const Divider = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '18px 0 12px'
  }}>
    <span style={{ color: '#d93025' }}>{icon}</span>
    <span style={{
      fontSize: 11, fontWeight: 800, color: 'var(--ink)',
      letterSpacing: '.08em', textTransform: 'uppercase'
    }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
  </div>
);

// ─── TARJETA HERO ─────────────────────────────────────────────────────────────

const HeroCard = ({ article, onClick }: { article: NewsArticle; onClick: () => void }) => {
  const cfg = getCat(article.category);
  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      style={{
        background: 'var(--card)', borderRadius: 18,
        border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)'
      }}
    >
      {/* Imagen */}
      <div style={{ position: 'relative', aspectRatio: '16/9' }}>
        <img
          src={article.imageUrl || ''}
          alt=""
          onError={e => handleImageError(e, article.category)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* Gradiente sutil */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.55) 100%)'
        }} />
        {/* Badge urgente */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
          <UrgencyTag importance={article.importance} />
        </div>
        {/* Readers */}
        <div style={{
          position: 'absolute', bottom: 10, right: 12,
          fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.85)',
          display: 'flex', alignItems: 'center', gap: 4
        }}>
          <Eye size={10} /> {fmt(article.reads)}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: '16px 18px 18px' }}>
        {/* Categoría + tiempo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <CatTag category={article.category} small />
          <span style={{ fontSize: 10, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={9} /> {article.publishedAt}
          </span>
        </div>

        {/* Titular */}
        <h2 className="serif" style={{
          fontSize: 21, fontWeight: 900, color: 'var(--ink)',
          lineHeight: 1.25, marginBottom: 10, letterSpacing: '-0.02em'
        }}>
          {article.title}
        </h2>

        {/* Sumario */}
        <p style={{
          fontSize: 13, color: 'var(--ink2)', lineHeight: 1.65, marginBottom: 14,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {article.summary}
        </p>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 12, borderTop: '1px solid var(--border)'
        }}>
          <span style={{ fontSize: 11, color: 'var(--ink3)', fontWeight: 500 }}>
            {article.reporter.split(',')[0]}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Heart size={10} color="#d93025" fill="#d93025" /> {fmt(article.likes)}
            </span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 700, color: '#d93025'
            }}>
              Leer <ChevronRight size={12} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── TARJETA HORIZONTAL (lista) ───────────────────────────────────────────────

const RowCard = ({
  article, onClick, index, showDivider
}: {
  article: NewsArticle; onClick: () => void; index: number; showDivider: boolean;
}) => {
  const cfg = getCat(article.category);
  return (
    <>
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        style={{
          display: 'flex', gap: 12, padding: '14px 0', cursor: 'pointer', alignItems: 'flex-start'
        }}
      >
        {/* Número */}
        <span style={{
          fontFamily: 'monospace', fontSize: 11, color: 'var(--ink3)',
          fontWeight: 700, paddingTop: 2, minWidth: 20, flexShrink: 0
        }}>
          {String(index).padStart(2, '0')}
        </span>

        {/* Texto */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <CatTag category={article.category} small />
            {article.importance === 'breaking' && <UrgencyTag importance={article.importance} />}
          </div>
          <h5 className="serif" style={{
            fontSize: 14, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            marginBottom: 6
          }}>
            {article.title}
          </h5>
          <span style={{ fontSize: 10, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={9} /> {article.publishedAt}
            <span style={{ margin: '0 4px' }}>·</span>
            <Eye size={9} /> {fmt(article.reads)}
          </span>
        </div>

        {/* Imagen */}
        <div style={{
          width: 72, height: 72, borderRadius: 10, overflow: 'hidden',
          background: 'var(--bg2)', flexShrink: 0
        }}>
          <img
            src={article.imageUrl || ''}
            alt=""
            onError={e => handleImageError(e, article.category)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </motion.div>
      {showDivider && <div style={{ height: 1, background: 'var(--border)' }} />}
    </>
  );
};

// ─── TARJETA MINI (grid) ──────────────────────────────────────────────────────

const MiniCard = ({ article, onClick }: { article: NewsArticle; onClick: () => void }) => {
  const cfg = getCat(article.category);
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        background: 'var(--card)', borderRadius: 14,
        border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer'
      }}
    >
      <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
        <img
          src={article.imageUrl || ''}
          alt=""
          onError={e => handleImageError(e, article.category)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <div style={{ padding: '10px 11px 12px' }}>
        <CatTag category={article.category} small />
        <h6 className="serif" style={{
          fontSize: 13, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3,
          margin: '7px 0 5px',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {article.title}
        </h6>
        <span style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'monospace' }}>
          {article.publishedAt}
        </span>
      </div>
    </motion.div>
  );
};

// ─── TICKER INFERIOR ──────────────────────────────────────────────────────────

const BottomTicker = () => {
  const items = [
    '📊 IBEX-35 +1.87% · 13.240pts',
    '⚡ Nasdaq +0.94%',
    '⚽ España 2-1 Francia (FT)',
    '🌡 Madrid 27°C Despejado',
    '🔬 ITER: 6min plasma sostenido',
    '📉 IPC España +2.1% interanual',
    '✈ Barajas: operación normal',
    '🌊 Alerta naranja litoral valenciano',
  ];
  const rep = [...items, ...items];
  return (
    <div style={{
      background: 'var(--card)', borderTop: '2px solid #d93025',
      height: 34, display: 'flex', alignItems: 'center', overflow: 'hidden', flexShrink: 0
    }}>
      <div style={{
        padding: '0 12px', height: '100%', display: 'flex', alignItems: 'center',
        fontSize: 8, fontWeight: 900, letterSpacing: '.12em', color: '#d93025',
        borderRight: '1px solid var(--border)', flexShrink: 0
      }}>
        EN VIVO
      </div>
      <div style={{ flex: 1, overflow: 'hidden', maskImage: 'linear-gradient(90deg,transparent,black 4%,black 96%,transparent)' }}>
        <div style={{ display: 'inline-block', whiteSpace: 'nowrap', animation: 'ticker 48s linear infinite' }}>
          {rep.map((t, i) => (
            <span key={i} style={{
              padding: '0 22px', fontSize: 11, fontWeight: 500, color: 'var(--ink2)'
            }}>
              {t} <span style={{ color: 'var(--border2)', marginLeft: 10 }}>·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── CHAT EN VIVO ─────────────────────────────────────────────────────────────

const INIT_CHAT: LiveChatComment[] = [
  { id:'c1', username:'juan_esp99',    comment:'Cobertura impecable. La mejor app de noticias en español.',       timestamp:'1 min' },
  { id:'c2', username:'tech_malaga',   comment:'420M€ para Málaga 🚀 el sur de Europa cambia para siempre.',       timestamp:'3 min' },
  { id:'c3', username:'sofia_libre',   comment:'¿Hay más fuentes sobre el yacimiento de Atapuerca?',              timestamp:'5 min' },
  { id:'c4', username:'economista_es', comment:'Ibex en máximos históricos. Buen momento para SAN y BBVA.',        timestamp:'8 min' },
];

const ChatPanel = () => {
  const [msgs, setMsgs] = useState<LiveChatComment[]>(INIT_CHAT);
  const [text, setText] = useState('');

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setMsgs(p => [{ id: `u${Date.now()}`, username: 'usuario_vivo', comment: text.trim(), timestamp: 'ahora' }, ...p]);
    setText('');
    const replies = ['¡De acuerdo!', 'Muy buen apunte.', '¿Tienes el enlace oficial?', 'España avanza 💪', 'Gran cobertura 👏'];
    const users = ['reporter_esp', 'clara_vivo', 'periodista_mx', 'noticias_fan'];
    setTimeout(() => {
      setMsgs(p => [{
        id: `r${Date.now()}`,
        username: users[Math.floor(Math.random() * users.length)],
        comment: replies[Math.floor(Math.random() * replies.length)],
        timestamp: 'ahora'
      }, ...p]);
    }, 2600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header chat */}
      <div style={{
        padding: '12px 18px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        background: 'var(--card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Dot color="#10b981" size={7} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
            Chat en directo · {msgs.length} mensajes
          </span>
        </div>
        <button
          onClick={() => {
            const u = ['lector_es','noticias24','esp_press','live_reader'];
            const m = ['Gran noticia para España.','¿Cuándo habrá rueda de prensa?','Fuente confirmada en el BOE.','Lo comparto ahora mismo.'];
            setMsgs(p => [{ id:`s${Date.now()}`, username:u[Math.floor(Math.random()*u.length)], comment:m[Math.floor(Math.random()*m.length)], timestamp:'ahora'}, ...p]);
          }}
          style={{
            fontSize: 10, fontWeight: 700, color: '#d93025',
            background: '#fef2f1', border: '1px solid #fde8e7',
            padding: '4px 10px', borderRadius: 8
          }}
        >
          + Simular
        </button>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map(m => (
          <div key={m.id} style={{
            padding: '10px 14px', background: 'var(--card)',
            borderRadius: 12, border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#d93025' }}>@{m.username}</span>
              <span style={{ fontSize: 9, color: 'var(--ink3)', fontFamily: 'monospace' }}>Hace {m.timestamp}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.5 }}>{m.comment}</p>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={send} style={{
        padding: '12px 18px', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 8, flexShrink: 0, background: 'var(--card)'
      }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Tu reacción…"
          maxLength={120}
          style={{
            flex: 1, padding: '10px 14px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 10, fontSize: 13, color: 'var(--ink)'
          }}
        />
        <button type="submit" style={{
          width: 40, height: 40, background: '#d93025', border: 'none',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          <Send size={15} color="#fff" />
        </button>
      </form>
    </div>
  );
};

// ─── MODAL ARTÍCULO ───────────────────────────────────────────────────────────

const Modal = ({
  article, onClose, onLike, liked
}: {
  article: NewsArticle; onClose: () => void;
  onLike: (id: string) => void; liked: boolean;
}) => {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(15);
  const [showVoice, setShowVoice] = useState(false);
  const [saved, setSaved] = useState(false);

  const share = () => {
    navigator.clipboard.writeText(`${article.title} — ${article.summary}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 8
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)', borderRadius: 24,
          border: '1px solid var(--border)',
          width: '100%', maxWidth: 540, maxHeight: '95vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)'
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--border2)' }} />
        </div>

        {/* Header modal */}
        <div style={{
          padding: '12px 18px 14px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <CatTag category={article.category} />
            <UrgencyTag importance={article.importance} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setSaved(s => !s)} style={{
              width: 32, height: 32, background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: saved ? '#f59e0b' : 'var(--ink3)'
            }}>
              <Bookmark size={13} fill={saved ? '#f59e0b' : 'none'} />
            </button>
            <button onClick={onClose} style={{
              width: 32, height: 32, background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink2)'
            }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scroll body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 18px' }}>

          {/* Imagen */}
          <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 18, aspectRatio: '16/9' }}>
            <img
              src={article.imageUrl || ''}
              alt=""
              onError={e => handleImageError(e, article.category)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Titular */}
          <h2 className="serif" style={{
            fontSize: 23, fontWeight: 900, color: 'var(--ink)',
            lineHeight: 1.25, marginBottom: 12, letterSpacing: '-0.02em'
          }}>
            {article.title}
          </h2>

          {/* Meta */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 16, paddingBottom: 14,
            borderBottom: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: 11, color: 'var(--ink3)' }}>{article.reporter.split(',')[0]}</span>
            <span style={{ width: 3, height: 3, background: 'var(--border2)', borderRadius: '50%' }} />
            <span style={{ fontSize: 11, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={9} /> {article.publishedAt}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink3)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Eye size={9} /> {fmt(article.reads)}
            </span>
          </div>

          {/* Control tamaño */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', background: 'var(--bg2)',
            borderRadius: 10, marginBottom: 14, border: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink3)', letterSpacing: '.06em' }}>TAMAÑO</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[13, 15, 17, 19].map(s => (
                <button key={s} onClick={() => setFontSize(s)} style={{
                  width: 30, height: 28, borderRadius: 7, border: 'none',
                  background: fontSize === s ? '#d93025' : 'var(--card)',
                  color: fontSize === s ? '#fff' : 'var(--ink2)',
                  fontSize: 10, fontWeight: 800,
                  boxShadow: fontSize === s ? 'none' : '0 1px 3px rgba(0,0,0,0.08)'
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Sumario destacado */}
          <div style={{
            borderLeft: '3px solid #d93025', paddingLeft: 14, marginBottom: 16
          }}>
            <p className="serif" style={{
              fontSize: 15, fontStyle: 'italic', color: 'var(--ink2)', lineHeight: 1.6
            }}>
              "{article.summary}"
            </p>
          </div>

          {/* Cuerpo */}
          <p style={{
            fontSize, color: 'var(--ink2)', lineHeight: 1.85,
            marginBottom: 20, fontWeight: 400
          }}>
            {article.content}
          </p>

          {/* Voz IA */}
          <div style={{
            border: '1px solid var(--border)', borderRadius: 14,
            marginBottom: 16, overflow: 'hidden'
          }}>
            <button
              onClick={() => setShowVoice(v => !v)}
              style={{
                width: '100%', padding: '12px 16px', background: 'none',
                border: 'none', display: 'flex', alignItems: 'center', gap: 10,
                color: 'var(--ink)', fontSize: 13, fontWeight: 700, textAlign: 'left'
              }}
            >
              <div style={{
                width: 32, height: 32, background: '#fef2f1', borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Volume2 size={14} color="#d93025" />
              </div>
              Escuchar con Voz IA
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink3)' }}>
                {showVoice ? '▲' : '▼'}
              </span>
            </button>
            {showVoice && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
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
            <div style={{ marginBottom: 16 }}>
              <p style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '.08em',
                color: 'var(--ink3)', textTransform: 'uppercase', marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <BookOpen size={11} /> Fuentes verificadas
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {article.sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', background: 'var(--bg2)',
                    border: '1px solid var(--border)', borderRadius: 10,
                    fontSize: 12, color: 'var(--ink2)', fontWeight: 500
                  }}>
                    <span>#{i + 1} · {s.title}</span>
                    <ExternalLink size={12} color="var(--ink3)" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Nota */}
          <p style={{
            fontSize: 11, color: 'var(--ink3)', lineHeight: 1.6,
            fontStyle: 'italic', padding: '10px 14px',
            background: 'var(--bg2)', borderRadius: 10
          }}>
            Mesa editorial España · Información contrastada con corresponsalías oficiales y agencias de prensa nacionales.
          </p>
        </div>

        {/* Acciones */}
        <div style={{
          padding: '12px 18px', borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, background: 'var(--card)'
        }}>
          <button onClick={() => onLike(article.id)} style={{
            flex: 1, height: 42, borderRadius: 12, border: '1px solid var(--border)',
            background: liked ? '#fef2f1' : 'var(--bg2)',
            color: liked ? '#d93025' : 'var(--ink2)',
            fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            <Heart size={13} fill={liked ? '#d93025' : 'none'} color={liked ? '#d93025' : 'currentColor'} />
            {liked ? 'Con Amor' : 'Me Gusta'}
          </button>
          <button onClick={share} style={{
            flex: 1, height: 42, borderRadius: 12, border: '1px solid var(--border)',
            background: copied ? '#f0fdf4' : 'var(--bg2)',
            color: copied ? '#10b981' : 'var(--ink2)',
            fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            {copied ? <Check size={13} /> : <Share2 size={13} />}
            {copied ? 'Copiado' : 'Compartir'}
          </button>
          <button onClick={onClose} style={{
            padding: '0 20px', height: 42, background: '#d93025',
            border: 'none', borderRadius: 12, color: '#fff', fontSize: 12, fontWeight: 800
          }}>
            Cerrar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── NAV INFERIOR ─────────────────────────────────────────────────────────────

const NAV = [
  { key: 'feed',     icon: Globe,       label: 'Inicio' },
  { key: 'trending', icon: Flame,       label: 'Tendencias' },
  { key: 'live',     icon: Radio,       label: 'En Vivo' },
  { key: 'saved',    icon: Bookmark,    label: 'Guardados' },
];

const BottomNav = ({ tab, onTab }: { tab: string; onTab: (k: string) => void }) => (
  <nav style={{
    background: 'var(--card)', borderTop: '1px solid var(--border)',
    display: 'flex', height: 60, flexShrink: 0
  }}>
    {NAV.map(({ key, icon: Icon, label }) => {
      const active = tab === key;
      return (
        <button key={key} onClick={() => onTab(key)} style={{
          flex: 1, background: 'none', border: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
          color: active ? '#d93025' : 'var(--ink3)', transition: 'color 0.18s'
        }}>
          <Icon size={19} />
          <span style={{ fontSize: 9, fontWeight: active ? 800 : 600, letterSpacing: '.04em' }}>
            {label.toUpperCase()}
          </span>
        </button>
      );
    })}
  </nav>
);

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [category, setCategory] = useState('Todo');
  const [selected, setSelected] = useState<NewsArticle | null>(null);
  const [liked, setLiked]       = useState<Record<string, boolean>>({});
  const [navTab, setNavTab]     = useState('feed');
  const [mainTab, setMainTab]   = useState<'feed' | 'chat'>('feed');
  const [viewers, setViewers]   = useState(142050);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setViewers(v => Math.max(90000, v + Math.floor(Math.random() * 160) - 78));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const fetchNews = useCallback(async (cat = 'Todo', q = '') => {
    setLoading(true); setError(null);
    try {
      const url = q
        ? `/api/news/list?category=${encodeURIComponent(cat)}&query=${encodeURIComponent(q)}`
        : `/api/news/list?category=${encodeURIComponent(cat)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error de conexión.');
      const data = await res.json();
      if (data.articles?.length) {
        setArticles(data.articles);
        setSelected(data.articles[0]);
      } else {
        setArticles([]); setSelected(null);
        setError('Sin artículos para esta búsqueda.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const handleCat = (cat: string) => {
    setCategory(cat);
    fetchNews(cat);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (q: string) => {
    if (q.trim()) { setCategory('Todo'); fetchNews('Todo', q); }
  };

  const handleLike = (id: string) => {
    setLiked(p => ({ ...p, [id]: !p[id] }));
    setArticles(p => p.map(a => a.id === id ? { ...a, likes: (a.likes || 0) + 1 } : a));
  };

  const hero   = articles[0];
  const grid   = articles.slice(1, 5);
  const list   = articles.slice(5);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <PhoneFrame
        isSimulatedMobile={true}
        setIsSimulatedMobile={() => {}}
        statusText={loading ? 'Cargando noticias…' : `${articles.length} boletines · ${viewers.toLocaleString('es-ES')} lectores`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>

          {/* Ticker urgente */}
          {!loading && <Ticker articles={articles} />}

          {/* Cabecera */}
          <Header onRefresh={() => fetchNews(category)} loading={loading} viewers={viewers} onSearch={handleSearch} />

          {/* Categorías */}
          <CatBar active={category} onSelect={handleCat} />

          {/* Tabs feed / chat */}
          <div style={{
            display: 'flex', background: 'var(--card)',
            borderBottom: '1px solid var(--border)', flexShrink: 0
          }}>
            {(['feed', 'chat'] as const).map(t => {
              const active = mainTab === t;
              return (
                <button key={t} onClick={() => setMainTab(t)} style={{
                  flex: 1, height: 38, background: 'none', border: 'none',
                  fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: active ? '#d93025' : 'var(--ink3)',
                  borderBottom: `2px solid ${active ? '#d93025' : 'transparent'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.18s'
                }}>
                  {t === 'feed'
                    ? <><BarChart2 size={12} /> Boletines</>
                    : <><MessageSquare size={12} /> Chat en Vivo</>}
                </button>
              );
            })}
          </div>

          {/* Contenido */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* FEED */}
            {mainTab === 'feed' && (
              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>

                {/* Cargando */}
                {loading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      border: '3px solid var(--border2)', borderTopColor: '#d93025',
                      animation: 'spin 0.9s linear infinite'
                    }} />
                    <p style={{ fontSize: 13, color: 'var(--ink2)', fontWeight: 500 }}>Cargando noticias de España…</p>
                  </div>
                )}

                {/* Error */}
                {error && !loading && (
                  <div style={{
                    padding: 20, background: '#fef2f1',
                    border: '1px solid #fde8e7', borderRadius: 16,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
                  }}>
                    <AlertTriangle size={28} color="#d93025" />
                    <p style={{ fontSize: 13, color: '#d93025', textAlign: 'center' }}>{error}</p>
                    <button onClick={() => fetchNews()} style={{
                      padding: '8px 20px', background: '#d93025', border: 'none',
                      borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 700
                    }}>Reintentar</button>
                  </div>
                )}

                {/* Vacío */}
                {!loading && !error && !articles.length && (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink3)' }}>
                    <div style={{ fontSize: 36, marginBottom: 14 }}>🔍</div>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Sin resultados</p>
                    <button onClick={() => { setCategory('Todo'); fetchNews(); }} style={{
                      padding: '8px 20px', background: '#d93025', border: 'none',
                      borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 700
                    }}>Volver al inicio</button>
                  </div>
                )}

                {/* Artículos */}
                {!loading && !error && articles.length > 0 && (
                  <>
                    {/* Hero */}
                    {hero && (
                      <>
                        <Divider icon={<Zap size={12} />} label="Portada" />
                        <HeroCard article={hero} onClick={() => setSelected(hero)} />
                      </>
                    )}

                    {/* Grid destacadas */}
                    {grid.length > 0 && (
                      <>
                        <Divider icon={<Flame size={12} />} label="Noticias Destacadas" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {grid.map(a => <MiniCard key={a.id} article={a} onClick={() => setSelected(a)} />)}
                        </div>
                      </>
                    )}

                    {/* Lista */}
                    {list.length > 0 && (
                      <>
                        <Divider icon={<Globe size={12} />} label="Más Noticias" />
                        {list.map((a, i) => (
                          <RowCard
                            key={a.id} article={a}
                            onClick={() => setSelected(a)}
                            index={i + 6}
                            showDivider={i < list.length - 1}
                          />
                        ))}
                      </>
                    )}

                    {/* Pie */}
                    <div style={{ padding: '20px 0 16px', textAlign: 'center' }}>
                      <p style={{ fontSize: 10, color: 'var(--ink3)', letterSpacing: '.04em' }}>
                        Noticias. · Prensa libre · España 24H
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* CHAT */}
            {mainTab === 'chat' && (
              <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg)' }}>
                <ChatPanel />
              </div>
            )}
          </div>

          {/* Ticker inferior */}
          <BottomTicker />

          {/* Nav inferior */}
          <BottomNav tab={navTab} onTab={setNavTab} />

          {/* Modal */}
          <AnimatePresence>
            {selected && (
              <Modal
                article={selected}
                onClose={() => setSelected(null)}
                onLike={handleLike}
                liked={!!liked[selected.id]}
              />
            )}
          </AnimatePresence>
        </div>
      </PhoneFrame>
    </>
  );
}
