/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Newspaper, Radio, Calendar, Globe, Sparkles } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
  isSimulatedMobile: boolean;
  setIsSimulatedMobile: (val: boolean) => void;
  statusText?: string;
}

export function PhoneFrame({ children, statusText }: PhoneFrameProps) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    const getSpanishDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      
      const dateString = now.toLocaleDateString('es-ES', options);
      // Capitalize first letter
      return dateString.charAt(0).toUpperCase() + dateString.slice(1);
    };

    setFormattedDate(getSpanishDate());
  }, []);

  return (
    <div className="min-h-screen bg-[#06060a] text-slate-100 flex flex-col font-sans selection:bg-red-500/35 leading-normal relative antialiased">
      
      {/* High-End Modern Newspaper Header Branding */}
      <header className="bg-zinc-950/90 border-b border-white/10 sticky top-0 z-50 backdrop-blur-md px-4 sm:px-6 py-4 shadow-xl">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Headline News Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20 antialiased shrink-0">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tighter text-white uppercase font-sans">
                  El Diario <span className="text-red-500">Digital</span>
                </span>
                <span className="bg-red-600/15 text-red-500 border border-red-500/20 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                  NACIONAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {statusText || 'Prensa libre e información contrastada las 24 horas del día en España.'}
              </p>
            </div>
          </div>

          {/* Center/Right newspaper metainfo: local time, location, live feed status */}
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3.5 sm:gap-5 text-xs text-slate-400">
            {/* Live Feed indicator */}
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-[10px] text-red-400 font-extrabold tracking-wider select-none animate-pulse">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              TELETIPOS EN VIVO / ESPAÑA
            </div>

            {/* Current Calendar day */}
            <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-slate-300 border-l border-white/10 pl-3.5 hidden sm:flex select-none">
              <Calendar className="w-3.5 h-3.5 text-red-500" />
              <span>{formattedDate || 'Cargando fecha...'}</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Full-Width Responsive Area */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col overflow-hidden px-0 sm:px-4 md:px-6 py-4 md:py-6">
        
        {/* Full Desktop Responsive Grid */}
        <div className="w-full flex-1 flex flex-col bg-zinc-950/70 overflow-hidden rounded-2xl border border-white/5 shadow-2xl relative">
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </div>

      </main>

    </div>
  );
}
