/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Flame, Radio } from 'lucide-react';

export function NewsTicker() {
  const tickerItems = [
    { text: "CRISIS CLIMÁTICA: Récord absoluto de energía verde generada en Europa central", type: "breaking" },
    { text: "MERCADOS EN VIVO: Nasdaq sube +1.24% • Ibex35 estable • Oro roza máximos", type: "finance" },
    { text: "DEPORTES: Anunciada la alineación para el partido de selecciones internacionales", type: "sports" },
    { text: "TECNOLOGÍA: Lanzamiento mundial del nuevo chip cuántico de consumo hogareño", type: "tech" },
    { text: "ÚLTIMA HORA: Se esperan lluvias torrenciales en el litoral durante las próximas horas", type: "alert" }
  ];

  // Concatenate multiple times to ensure continuous gapless looping in large screens
  const repeatedItems = [...tickerItems, ...tickerItems, ...tickerItems];

  return (
    <div className="bg-red-950/95 border-t border-red-900/40 text-red-100 flex items-center h-8 font-mono overflow-hidden select-none shrink-0 text-[11px] relative z-20">
      {/* Fixed EN VIVO Label */}
      <div className="bg-red-600 px-3 py-1 text-white font-bold flex items-center gap-1 shrink-0 animate-pulse text-[11px] uppercase tracking-wider h-full z-10 border-r border-red-700 shadow-[2px_0_10px_rgba(0,0,0,0.3)]">
        <Radio className="w-3.5 h-3.5" />
        <span>EN VIVO</span>
      </div>

      {/* Infinite Scrolling Ticker Track */}
      <div className="flex-1 overflow-hidden relative flex items-center h-full">
        <motion.div
          className="flex whitespace-nowrap gap-12 pl-4 pr-12 items-center"
          animate={{ x: [0, -1200] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 32,
          }}
        >
          {repeatedItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {item.type === 'breaking' && <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />}
              {item.type === 'finance' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="font-semibold">{item.text}</span>
              <span className="text-red-500 font-bold">•</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Clock Indicator on Ticker right limit */}
      <div className="hidden sm:flex bg-slate-900 px-3 items-center h-full text-xs font-bold text-slate-300 border-l border-slate-800 z-10 shrink-0">
        24H AUDIO FEED
      </div>
    </div>
  );
}
