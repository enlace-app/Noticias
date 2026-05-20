/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Disc, Sparkles, Volume2, Info, UserCheck } from 'lucide-react';

interface AIAudioAnchorProps {
  newsTitle: string;
  newsSummary: string;
  newsContent: string;
  onEnded?: () => void;
  autoPlay?: boolean;
}

export function AIAudioAnchor({ newsTitle, newsSummary, newsContent, onEnded, autoPlay }: AIAudioAnchorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voiceAnchor, setVoiceAnchor] = useState<'Charon' | 'Kore' | 'Zephyr' | 'Puck'>('Charon');
  const [statusText, setStatusText] = useState('Ancla listo para leer.');
  const [isUsingNative, setIsUsingNative] = useState(false);
  
  // Audio references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Equalizer wave counts
  const eqBars = Array.from({ length: 14 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stopPlayback();
    };
  }, []);

  const stopPlayback = () => {
    // Stop server audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Stop native voice
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
  };

  const getVoiceLabels = (v: string) => {
    switch (v) {
      case 'Charon': return { name: 'Víctor Soler', role: 'Presentador Principal', accent: 'Locutor Formal' };
      case 'Kore': return { name: 'Elena Restrepo', role: 'Deportes y Cultura', accent: 'Locución Dinámica' };
      case 'Zephyr': return { name: 'Carlos Ortiz', role: 'Economía y Tecnología', accent: 'Análisis Serio' };
      case 'Puck': return { name: 'Susi Delgado', role: 'Ciencia y Astronomía', accent: 'Tono Informativo' };
      default: return { name: 'Ancla AI', role: 'Virtual', accent: 'Estándar' };
    }
  };

  const handleSpeech = async () => {
    if (isPlaying) {
      stopPlayback();
      setStatusText('Lectura pausada por el usuario.');
      return;
    }

    setLoading(true);
    setStatusText('Preparando lectura de boletín con IA...');
    const speechText = `Atención, boletín informativo de última hora. Titulado: ${newsTitle}. El resumen indica lo siguiente: ${newsSummary}. Desarrollo de los hechos: ${newsContent}`;

    try {
      const response = await fetch('/api/news/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speechText, voice: voiceAnchor })
      });

      if (!response.ok) {
        throw new Error('TTS network error');
      }

      const data = await response.json();

      if (data.audio) {
        // High fidelity audio returned from Gemini Server
        const playUri = `data:audio/wav;base64,${data.audio}`;
        const audio = new Audio(playUri);
        audioRef.current = audio;
        
        setIsUsingNative(false);
        setStatusText(`Leyendo en vivo vía Gemini TTS (Voz: ${getVoiceLabels(voiceAnchor).name})...`);
        
        audio.onended = () => {
          setIsPlaying(false);
          setStatusText('Boletín completado.');
          if (onEnded) onEnded();
        };
        
        audio.onerror = () => {
          // Fallback to native synthesis if decoding failed
          playNativeVoice(speechText);
        };

        setIsPlaying(true);
        setLoading(false);
        await audio.play();
      } else {
        // Fallback or Mock mode - use browser Speech Synthesis
        console.log("Serving voice synthesis via standard native browsers SpeechSynthesis.");
        playNativeVoice(speechText);
      }
    } catch (err) {
      console.warn("Express server TTS failed, falling back to local client SpeechSynthesis:", err);
      // Native fallback
      playNativeVoice(speechText);
    }
  };

  const playNativeVoice = (text: string) => {
    if (!synthRef.current) {
      setLoading(false);
      setStatusText('Sintetizador de voz del navegador no soportado.');
      return;
    }

    // Cancel current playings
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    
    // Attempt to match voices in Spanish
    const voices = synthRef.current.getVoices();
    let esVoice = voices.find(v => v.lang.includes('es') && v.name.toLowerCase().includes(voiceAnchor === 'Charon' || voiceAnchor === 'Zephyr' ? 'masculine' : 'female'));
    if (!esVoice) {
      esVoice = voices.find(v => v.lang.includes('es'));
    }
    if (esVoice) {
      utterance.voice = esVoice;
    }

    // Adapt rate slightly for maximum journalism effect
    utterance.rate = 1.0;
    utterance.pitch = voiceAnchor === 'Charon' ? 0.9 : voiceAnchor === 'Puck' ? 1.15 : 1.05;

    utterance.onstart = () => {
      setIsPlaying(true);
      setLoading(false);
      setIsUsingNative(true);
      setStatusText(`Leyendo en vivo vía Voz Nativa (${getVoiceLabels(voiceAnchor).name})...`);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setStatusText('Lectura finalizada.');
      if (onEnded) onEnded();
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setLoading(false);
      setStatusText('No se pudo verbalizar este artículo en este dispositivo.');
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  useEffect(() => {
    if (autoPlay && newsTitle) {
      const timer = setTimeout(() => {
        handleSpeech();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [newsTitle, autoPlay]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md mt-4">
      <div className="flex items-center justify-between mb-3 text-xs font-semibold uppercase tracking-wider text-amber-500">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          Módulo Ancla de Voz AI
        </span>
        <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono text-[10px]">
          Live-Audio
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Left: Anchor details */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
          <div className="relative w-12 h-12 bg-gradient-to-tr from-amber-600 to-red-600 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-lg select-none ring-2 ring-slate-800">
            {voiceAnchor === 'Charon' && 'VS'}
            {voiceAnchor === 'Kore' && 'ER'}
            {voiceAnchor === 'Zephyr' && 'CO'}
            {voiceAnchor === 'Puck' && 'SD'}
            {isPlaying && (
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full animate-ping">
                <Disc className="w-3 h-3" />
              </span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">{getVoiceLabels(voiceAnchor).name}</h4>
            <p className="text-[11px] text-amber-400 font-medium">{getVoiceLabels(voiceAnchor).role}</p>
            <p className="text-[10px] text-slate-400 italic">{getVoiceLabels(voiceAnchor).accent}</p>
          </div>
        </div>

        {/* Right: Controller button and dynamic equalizer bars */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 justify-between">
            <button
              onClick={handleSpeech}
              disabled={loading}
              className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                isPlaying
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              } disabled:opacity-50`}
              id={`btn-tts-${voiceAnchor}`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>Generando Audio...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pausar Lectura</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Escuchar Noticia</span>
                </>
              )}
            </button>
          </div>

          {/* Equalizer Wave Feedback */}
          <div className="h-6 bg-slate-950/80 rounded-lg flex items-center justify-center gap-1.5 px-3 border border-slate-800/80 overflow-hidden relative">
            {isPlaying ? (
              <div className="flex items-end h-4 gap-[2px]">
                {eqBars.map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] bg-gradient-to-t from-amber-500 to-red-500 rounded-sm"
                    animate={{ height: ['4px', '16px', '3px', '12px', '4px'] }}
                    transition={{
                      duration: 0.6 + (i % 5) * 0.1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-slate-500 tracking-tight font-mono">
                {statusText}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Anchor voice Picker Grid */}
      <div className="mt-3.5 border-t border-slate-800/70 pt-2.5">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 select-none">Seleccionar Ancla Virtual:</p>
        <div className="grid grid-cols-4 gap-1.5">
          {(['Charon', 'Kore', 'Zephyr', 'Puck'] as const).map((v) => (
            <button
              key={v}
              onClick={() => {
                if (isPlaying) stopPlayback();
                setVoiceAnchor(v);
              }}
              className={`py-1.5 text-[10px] font-bold rounded-lg border cursor-pointer transition-all ${
                voiceAnchor === v
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                  : 'bg-slate-950/50 hover:bg-slate-800 text-slate-400 border-transparent'
              }`}
              id={`anchor-voice-${v}`}
            >
              {getVoiceLabels(v).name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
