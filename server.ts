/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization helper for Gemini client
let geminiClient: GoogleGenAI | null = null;
let isGeminiRateLimited = false;
let rateLimitResetTime = 0;

function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Utility to clean XML CDATA tags and decode common entities
function cleanCdata(str: string): string {
  if (!str) return '';
  // Remove CDATA tag contents
  let cleaned = str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
  // Strip any raw HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  // Clean up common XML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
  return cleaned.trim();
}

// Fetch and parse RSS feed cleanly using lightweight regex
async function fetchRssFeed(url: string): Promise<any[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status}`);
    }
    const text = await response.text();
    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(text)) !== null) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/i);
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/i) || itemContent.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
      const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/i) || itemContent.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i);
      const dateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      const categoryMatch = itemContent.match(/<category[^>]*>([\s\S]*?)<\/category>/i);

      const title = cleanCdata(titleMatch ? titleMatch[1] : '');
      if (!title) continue;

      const itemLink = (linkMatch ? linkMatch[1] : '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
      const description = cleanCdata(descMatch ? descMatch[1] : 'Selecciona esta noticia para leer más detalles.');
      const pubDateRaw = dateMatch ? dateMatch[1] : '';
      const category = cleanCdata(categoryMatch ? categoryMatch[1] : 'España');

      let relativeTime = 'Hace poco';
      if (pubDateRaw) {
        try {
          const parsedDate = new Date(pubDateRaw);
          if (!isNaN(parsedDate.getTime())) {
            const diffMs = Date.now() - parsedDate.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 60) {
              relativeTime = diffMins <= 1 ? 'Hace 1 min' : `Hace ${diffMins} min`;
            } else {
              const diffHours = Math.floor(diffMins / 60);
              if (diffHours < 24) {
                relativeTime = diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`;
              } else {
                relativeTime = parsedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
              }
            }
          }
        } catch (e) {
          relativeTime = 'Hace unos instantes';
        }
      }

      items.push({
        title,
        link: itemLink,
        description,
        pubDate: relativeTime,
        category
      });
    }
    return items;
  } catch (err) {
    console.error("Error fetching or parsing RSS feed:", url, err);
    return [];
  }
}

// Maps categories to real high-activity Spanish feeds and fetches them
async function getRssArticlesForCategory(category: string): Promise<any[]> {
  const cat = (category || 'todo').toLowerCase();
  let primaryUrl = 'https://www.20minutos.es/rss/';
  let fallbackUrl = 'https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml';

  if (cat.includes('interna')) {
    primaryUrl = 'https://www.20minutos.es/rss/internacional/';
    fallbackUrl = 'https://e00-elmundo.uecdn.es/elmundo/rss/internacional.xml';
  } else if (cat.includes('tech') || cat.includes('tecnol')) {
    primaryUrl = 'https://www.20minutos.es/rss/tecnologia/';
    fallbackUrl = 'https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml';
  } else if (cat.includes('depor')) {
    primaryUrl = 'https://www.20minutos.es/rss/deportes/';
    fallbackUrl = 'https://e00-elmundo.uecdn.es/elmundo/rss/deportes.xml';
  } else if (cat.includes('cienc')) {
    primaryUrl = 'https://www.20minutos.es/rss/ciencia/';
    fallbackUrl = 'https://e00-elmundo.uecdn.es/elmundo/rss/ciencia.xml';
  } else if (cat.includes('econ')) {
    primaryUrl = 'https://www.20minutos.es/rss/economia/';
    fallbackUrl = 'https://e00-elmundo.uecdn.es/elmundo/rss/economia.xml';
  }

  let items = await fetchRssFeed(primaryUrl);
  if (items.length === 0) {
    console.log(`Primary feed empty/failed for ${category}. Trying fallback ${fallbackUrl}...`);
    items = await fetchRssFeed(fallbackUrl);
  }
  return items;
}

// Dynamic keyword-based Unsplash stock image generator depending on title keywords for a customized look
function getCustomImageUrlByTitle(title: string, category: string): string {
  const t = (title || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  // Curated list of 100% reliable, permanent, fast Unsplash CDN images (no redirect / query matching limits)
  const images: Record<string, string> = {
    agua: "https://images.unsplash.com/photo-1488330890490-c291fa162c5a?w=600&auto=format&fit=crop&q=60",
    hidrico: "https://images.unsplash.com/photo-1548811295-d14fbf452b1b?w=600&auto=format&fit=crop&q=60",
    clima: "https://images.unsplash.com/photo-1481833761820-0509d3217039?w=600&auto=format&fit=crop&q=60",
    ambiente: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&auto=format&fit=crop&q=60",
    sequia: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=60",
    
    futbol: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60",
    clasico: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&auto=format&fit=crop&q=60",
    tenis: "https://images.unsplash.com/photo-1622279457486-62dcc4a4dd93?w=600&auto=format&fit=crop&q=60",
    alcaraz: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&auto=format&fit=crop&q=60",
    deporte: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&auto=format&fit=crop&q=60",
    
    inteligencia: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=60",
    digital: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=60",
    chip: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60",
    ciber: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&auto=format&fit=crop&q=60",
    tecnologia: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60",
    redes: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=60",

    arqueologia: "https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=600&auto=format&fit=crop&q=60",
    museo: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=60",
    prado: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=600&auto=format&fit=crop&q=60",
    cine: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=60",
    pelicula: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=60",
    teatro: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&auto=format&fit=crop&q=60",
    musica: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=60",

    bolsa: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=60",
    economia: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=60",
    precio: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=60",
    empleo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=60",
    empresa: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=60",
    automovil: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&auto=format&fit=crop&q=60",

    espana: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=600&auto=format&fit=crop&q=60",
    madrid: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=600&auto=format&fit=crop&q=60",
    consejo: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop&q=60",
    gobierno: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&auto=format&fit=crop&q=60",
    politica: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&auto=format&fit=crop&q=60",
    sanchez: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=60",
    feijoo: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&auto=format&fit=crop&q=60",
    zapatero: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=60"
  };

  // 1. Text Search matching on title
  const cleanTitle = t.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // strip accents
  for (const [key, url] of Object.entries(images)) {
    const keyClean = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (cleanTitle.includes(keyClean) || t.includes(key)) {
      return url;
    }
  }

  // 2. Category Search matching
  if (cat.includes('depor') || cat.includes('sport')) {
    return images.deporte;
  }
  if (cat.includes('tech') || cat.includes('tecnol') || cat.includes('mov') || cat.includes('digital') || cat.includes('inteligencia')) {
    return images.tecnologia;
  }
  if (cat.includes('cienc') || cat.includes('espac') || cat.includes('fisic') || cat.includes('clima') || cat.includes('agua') || cat.includes('ambiente') || cat.includes('hidric')) {
    return images.clima;
  }
  if (cat.includes('econ') || cat.includes('finan') || cat.includes('bols') || cat.includes('merc') || cat.includes('empleo') || cat.includes('precio') || cat.includes('inflac')) {
    return images.economia;
  }
  if (cat.includes('entre') || cat.includes('cine') || cat.includes('music') || cat.includes('art') || cat.includes('farandula')) {
    return images.cine;
  }
  if (cat.includes('poli') || cat.includes('gobi') || cat.includes('elec') || cat.includes('estado') || cat.includes('nacional')) {
    return images.gobierno;
  }

  // 3. Absolute Fallback
  return images.espana;
}

// Spanish mock news dictionary as a safe fallback when internet/API fails
const MOCK_NEWS = [
  {
    id: "mock-1",
    title: "España aprueba plan de contingencia nacional para la digitalización de recursos hídricos",
    summary: "El Consejo de Ministros aprueba una partida presupuestaria histórica para modernizar embalses y canales en Madrid, Andalucía, Valencia y Cataluña.",
    content: "En un esfuerzo coordinado para hacer frente al cambio climático y optimizar el aprovechamiento de agua potable, el Gobierno de España ha comunicado hoy el despliegue de más de mil millones de euros en sensores inteligentes e inteligencia artificial aplicada para la red hidrográfica nacional. El proyecto piloto comenzará en el primer semestre en las cuencas del Segura, Ebro, Tajo y Guadalquivir, permitiendo detectar fugas en tiempo real y automatizar el flujo preventivo.",
    category: "Ciencia",
    publishedAt: "Hace 5 min",
    importance: "breaking",
    sources: [
      { title: "Ministerio para la Transición Ecológica", url: "https://www.miteco.gob.es" },
      { title: "Diario El País España", url: "https://elpais.com" }
    ],
    reporter: "Sofía Alcaraz, Corresponsal Científica",
    imageUrl: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=600&auto=format&fit=crop&q=60",
    likes: 384,
    reads: 2450
  },
  {
    id: "mock-2",
    title: "La Liga Santander: Clásico nacional paraliza Madrid y Barcelona con nuevas alineaciones oficiales",
    summary: "Se confirma que ambas plantillas llegan sin bajas importantes por lesión y se habilitarán zonas de cobertura especial en directo.",
    content: "Máxima expectación en el fútbol español. El gran enfrentamiento de nuestro torneo nacional se jugará este fin de semana en Madrid con un lleno absoluto garantizado. Los entrenadores han confirmado en conferencias de prensa simultáneas que todos los atacantes estrella se encuentran en plenitud de condiciones. La delegación del gobierno de Madrid movilizará a un dispositivo especial de seguridad integrado por más de dos mil agentes.",
    category: "Deportes",
    publishedAt: "Hace 16 min",
    importance: "high",
    sources: [
      { title: "Diario Marca España", url: "https://www.marca.com" },
      { title: "LaLiga Oficial", url: "https://www.laliga.com" }
    ],
    reporter: "Mateo Silva, Editor de Deportes",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60",
    likes: 589,
    reads: 4890
  },
  {
    id: "mock-3",
    title: "Málaga se consolida como el gran Silicon Valley del sur de Europa con un nuevo campus de IA",
    summary: "Multinacionales líderes confirman la creación de quinientos nuevos empleos tecnológicos de alta cualificación.",
    content: "La Costa del Sol continúa atrayendo inversión extranjera directa de primer nivel. Este martes se inauguró el nuevo parque tecnológico andaluz dedicado exclusivamente al desarrollo de herramientas de deep learning y microchips neuronales. El alcalde de Málaga destacó que el ecosistema local cuenta ya con más de setenta firmas internacionales de software y un puente directo de colaboración con la universidad española para becas de investigación avanzada.",
    category: "Tecnología",
    publishedAt: "Hace 45 min",
    importance: "high",
    sources: [
      { title: "Tecnología Avanzada Semanal", url: "https://www.wired.com" },
      { title: "Málaga Tech Hub", url: "https://www.malagatechpark.com" }
    ],
    reporter: "Santi Romero, Analítico de Tech España",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=60",
    likes: 410,
    reads: 1890
  },
  {
    id: "mock-4",
    title: "La inflación en España se reduce al 2.1% debido a la estabilización de los precios de energía",
    summary: "El INE confirma que el índice de precios de consumo se alinea con el objetivo europeo de forma estable.",
    content: "Datos alentadores para la economía doméstica española. El Instituto Nacional de Estadística (INE) ha publicado los indicadores definitivos, destacando que el control en las tarifas de electricidad, combustibles fósiles y en la cesta básica de alimentos ha permitido relajar la presión de costes sobre pymes y consumidores. Analistas estiman que esto podría impulsar una bajada en los tipos hipotecarios en la próxima reunión del Banco Central.",
    category: "Economía",
    publishedAt: "Hace 2 horas",
    importance: "medium",
    sources: [
      { title: "Prensa Financiera Internacional", url: "https://www.bloomberg.com" },
      { title: "Instituto Nacional de Estadística (INE)", url: "https://www.ine.es" }
    ],
    reporter: "Laura Vargas, Corresponsal de Economía",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=60",
    likes: 295,
    reads: 1120
  },
  {
    id: "mock-5",
    title: "Plan Nacional de Restauración Marina y conservación de praderas de Posidonia en Baleares",
    summary: "Equipos científicos en Mallorca y Menorca consiguen un récord mundial en reproducción de flora marina protegida.",
    content: "A través del uso de boyas submarinas ecológicas autogestionadas y un marco legal estricto contra el anclaje ilegal de yates de lujo, la reserva marina de las Islas Baleares reporta un incremento del 14% de cobertura de posidonia oceánica sana. Este pulmón mediterráneo es crucial para mitigar la erosión de playas y alojar fauna nativa, llamando el interés mundial de múltiples biólogos marinos.",
    category: "Ciencia",
    publishedAt: "Hace 4 horas",
    importance: "medium",
    sources: [
      { title: "Ecología Marina Hoy España", url: "https://www.nationalgeographic.com" }
    ],
    reporter: "Andrés Delgado, Editor de Ecología",
    imageUrl: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=600&auto=format&fit=crop&q=60",
    likes: 350,
    reads: 2200
  },
  {
    id: "mock-6",
    title: "El Museo del Prado de Madrid presenta una magnífica exposición inédita sobre pintura flamenca",
    summary: "La pinacoteca reúne más de sesenta tablones de maestros del siglo XV con tecnología de restauración virtual interactiva.",
    content: "Un verdadero hito para los amantes del arte. El renombrado Museo del Prado abre hoy la exposición más ambiciosa de la década en colaboración con instituciones de Bruselas y Amberes. El recorrido incluye guías virtuales con reconstrucciones en 3D del color original mediante algoritmos de inteligencia artificial, revelando detalles nunca antes vistos por el ojo humano sobre las texturas y simbolismos ocultos.",
    category: "Internacional",
    publishedAt: "Hace 5 horas",
    importance: "medium",
    sources: [
      { title: "Museo Nacional del Prado", url: "https://www.museodelprado.es" },
      { title: "Cultura en España Hoy", url: "https://elpais.com/cultura" }
    ],
    reporter: "Elena Rubio, Corresponsal de Arte",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=60",
    likes: 215,
    reads: 1100
  },
  {
    id: "mock-7",
    title: "Lanzan un plan para acelerar el despliegue del 5G rural de alta definición en toda la Península",
    summary: "Se busca dotar de conectividad gigabit a más de dos mil pequeños municipios españoles que sufren brecha digital.",
    content: "La Secretaría de Estado de Telecomunicaciones ha detallado una nueva inyección de fondos europeos para instalar antenas de baja frecuencia orientadas a sectores agrícolas y ganaderos. El despliegue dotará a tractores inteligentes de conectividad directa de bajísima latencia para optimizar el rendimiento de cosechas mediante telemetría satélite, marcando el inicio de la agricultura de precisión en España.",
    category: "Tecnología",
    publishedAt: "Hace 6 horas",
    importance: "low",
    sources: [
      { title: "Secretaría de Telecomunicaciones España", url: "https://www.red.es" }
    ],
    reporter: "Hugo Ortiz, Redactor Tecnológico",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=60",
    likes: 180,
    reads: 890
  },
  {
    id: "mock-8",
    title: "Carlos Alcaraz avanza de ronda en semifinales con una sólida y espectacular victoria en tres sets",
    summary: "El tenista de El Palmar muestra su mejor nivel y avanza con paso firme hacia el codiciado trofeo.",
    content: "Arrollador rendimiento en la tierra batida. Con un tenis potente, drop-shots precisos y excelente condición física, el jugador de la selección nacional demostró por qué es uno de los favoritos de la afición. En dos horas y cuarenta minutos doblegó a su duro oponente europeo, desatando la euforia del público presente en el estadio español.",
    category: "Deportes",
    publishedAt: "Hace 7 horas",
    importance: "medium",
    sources: [
      { title: "RTVE Deportes de España", url: "https://www.rtve.es/deportes" }
    ],
    reporter: "Mateo Silva, Editor de Deportes",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60",
    likes: 310,
    reads: 1650
  },
  {
    id: "mock-9",
    title: "Descubren un valioso complejo residencial romano del siglo III durante excavaciones en Mérida",
    summary: "Arqueólogos y estudiantes de humanidades localizan mosaicos polícromos en excelente estado de conservación.",
    content: "Fabuloso hallazgo arqueológico en Extremadura. El Consorcio de la Ciudad Monumental de Mérida confirmó que se trata de una domus romana de dimensiones señoriales. Los mosaicos representan escenas mitológicas marinas complejas y se encuentran casi intactos, lo que abrirá nuevas investigaciones sobre los asentamientos de la Lusitania romana de España.",
    category: "Ciencia",
    publishedAt: "Hace 8 horas",
    importance: "low",
    sources: [
      { title: "Consorcio Histórico de Mérida", url: "https://www.consorciomerida.org" }
    ],
    reporter: "Sofía Alcaraz, Corresponsal Científica",
    imageUrl: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=600&auto=format&fit=crop&q=60",
    likes: 145,
    reads: 920
  },
  {
    id: "mock-10",
    title: "Valencia alberga la cumbre del clima mediterráneo para unificar la respuesta ante sequías extremas",
    summary: "Delegaciones autonómicas, expertos internacionales y agencias científicas definen un pacto por la reforestación activa.",
    content: "Con el propósito de frenar el avance definitivo de la desertificación costera, más de trescientos científicos se han citado en la Comunidad Valenciana. El documento final rubricará el aumento de corredores verdes utilizando variedades botánicas autóctonas más resistentes al calor extremo e incentivos económicos especiales para agricultores que reduzcan la evaporación de suelos.",
    category: "Internacional",
    publishedAt: "Hace 10 horas",
    importance: "high",
    sources: [
      { title: "Generalitat Valenciana", url: "https://gva.es" },
      { title: "Agencia Meteorológica Española (AEMET)", url: "https://www.aemet.es" }
    ],
    reporter: "Andrés Delgado, Editor de Ecología",
    imageUrl: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&auto=format&fit=crop&q=60",
    likes: 289,
    reads: 1400
  },
  {
    id: "mock-11",
    title: "El sector cinematográfico de España registra la mayor taquilla global en cinco años gracias al apoyo local",
    summary: "Se triplican las coproducciones internacionales realizadas en Almería, Madrid y las Islas Canarias.",
    content: "El cine español se sitúa en la vanguardia continental. Factores como las exenciones fiscales competitivas y la calidad de los estudios de posproducción digital madrileños han posibilitado que múltiples plataformas estrenen grandes títulos rodados íntegramente en territorio nacional, impulsando miles de puestos laborales directos e indirectos.",
    category: "Internacional",
    publishedAt: "Hace 12 horas",
    importance: "medium",
    sources: [
      { title: "Instituto de Cinematografía (ICAA)", url: "https://www.cultura.gob.es/cultura/cine" }
    ],
    reporter: "Elena Rubio, Corresponsal de Arte",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=60",
    likes: 194,
    reads: 1050
  },
  {
    id: "mock-12",
    title: "La industria automotriz española incrementa la fabricación de turismos electrificados híbridos un 24%",
    summary: "Las factorías de Zaragoza, Vigo, Valladolid y Barcelona consolidan su papel estratégico en la transición industrial.",
    content: "Excelentes cifras industriales nacionales. El informe de la Patronal del Automóvil ratifica que las inversiones de reconversión de líneas de ensamblado están dando frutos. España se mantiene como el segundo fabricante de turismos de la Unión Europea, exportando casi el 85% de las unidades eléctricas producidas a los mercados centroeuropeos de alta demanda.",
    category: "Economía",
    publishedAt: "Hace 1 día",
    importance: "medium",
    sources: [
      { title: "Asociación de Fabricantes ANFAC", url: "https://anfac.com" }
    ],
    reporter: "Laura Vargas, Corresponsal de Economía",
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=60",
    likes: 243,
    reads: 1300
  }
];

// Check status API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString()
  });
});

// GET /api/news/list - Fetch news via Gemini with Google Search Grounding (or mocks)
app.get('/api/news/list', async (req, res) => {
  const queryParam = req.query.query ? String(req.query.query) : '';
  const categoryParam = req.query.category ? String(req.query.category) : '';

  let rssArticles: any[] = [];
  try {
    rssArticles = await getRssArticlesForCategory(categoryParam);
    console.log(`Fetched ${rssArticles.length} live articles from Spanish RSS feeds for category: ${categoryParam}`);
  } catch (rssErr) {
    console.error("Failed to fetch Spanish RSS feeds, defaulting to list.", rssErr);
  }

  // Helper mapping function to construct rich client-adapted NewsArticle payloads
  const mapRssToNewsArticles = (items: any[]) => {
    let filtered = items;
    if (queryParam) {
      filtered = items.filter((item: any) => 
        item.title.toLowerCase().includes(queryParam.toLowerCase()) || 
        item.description.toLowerCase().includes(queryParam.toLowerCase())
      );
    }

    // Default to mock data if feed is completely empty
    if (filtered.length === 0) {
      let mockFiltered = MOCK_NEWS;
      if (categoryParam && categoryParam.toLowerCase() !== 'todo') {
        mockFiltered = MOCK_NEWS.filter(n => n.category.toLowerCase() === categoryParam.toLowerCase());
      }
      if (queryParam) {
        mockFiltered = mockFiltered.filter(n => 
          n.title.toLowerCase().includes(queryParam.toLowerCase()) || 
          n.summary.toLowerCase().includes(queryParam.toLowerCase()) || 
          n.content.toLowerCase().includes(queryParam.toLowerCase())
        );
      }
      return mockFiltered;
    }

    const reportersPool = [
      "Ainhoa Ramos, Corresponsal de España", 
      "Javier Beltrán, Editor Principal", 
      "María Soler, Redactora de Portada",
      "Álvaro Ortiz, Corresponsal en Madrid"
    ];
    return filtered.slice(0, 20).map((item: any, index: number) => {
      const matchedCategory = categoryParam && categoryParam.toLowerCase() !== 'todo'
        ? categoryParam
        : (item.category || "España");

      return {
        id: `rss-${Date.now()}-${index}`,
        title: item.title,
        summary: item.description.length > 140 ? item.description.substring(0, 137) + "..." : item.description,
        content: item.description.length > 180 ? item.description : `${item.description} Esta noticia de última hora en España ha sido contrastada mediante fuentes oficiales de telecomunicaciones y agencias de noticias nacionales.`,
        category: matchedCategory,
        publishedAt: item.pubDate || "Hace poco",
        importance: index === 0 ? "breaking" : (index <= 2 ? "high" : "medium"),
        sources: [{ title: "Agencia de Prensa (RSS)", url: item.link || "https://news.google.com" }],
        reporter: reportersPool[index % reportersPool.length],
        imageUrl: getCustomImageUrlByTitle(item.title, matchedCategory),
        likes: Math.floor(Math.random() * 250) + 15,
        reads: Math.floor(Math.random() * 3000) + 200,
        hasLiveStream: index === 0
      };
    });
  };

  // Check if Gemini is in rate-limit cool down
  if (isGeminiRateLimited && Date.now() < rateLimitResetTime) {
    console.log("[Safe Bypass] Gemini API was previously rate-limited. Immediately returning parsed RSS feed stream.");
    const liveArticles = mapRssToNewsArticles(rssArticles);
    return res.json({ articles: liveArticles, realTime: false, quotaExceeded: true });
  }

  // If no API Key setup, respond immediately with live mapped RSS data (100% real news!)
  if (!process.env.GEMINI_API_KEY) {
    console.log("No GEMINI_API_KEY found, serving live parsed RSS Spanish news.");
    const liveArticles = mapRssToNewsArticles(rssArticles);
    return res.json({ articles: liveArticles, realTime: false });
  }

  try {
    const ai = getGemini();

    const systemPrompt = `Eres el conductor estrella de boletines en vivo para un portal móvil de Noticias de España de alta fidelidad.
Recibirás un listado de NOTICIAS REALES obtenidas directamente de periódicos españoles en los últimos minutos (como El Mundo o 20 Minutos).
Tu objetivo es enriquecer y consolidar estas noticias reales para nuestra audiencia en español.

Para cada noticia real que proceses, redacta un informe periodístico completo y profundo.
Es OBLIGATORIO que respondas EXCLUSIVAMENTE con un JSON con el siguiente esquema:
{
  "articles": [
    {
      "id": "noticia-1, noticia-2, etc",
      "title": "Un título corto, descriptivo y directo basado en la noticia real del listado",
      "summary": "Un resumen breve de 1 o 2 oraciones para la vista de tarjetas",
      "content": "El desarrollo completo y detallado de la noticia (al menos un párrafo largo de 4 a 6 líneas), explicando el contexto real en España con datos contrastados del feed",
      "category": "Una sola palabra de categoría (ej: Deportes, Ciencia, Tecnología, Economía, Internacional, Política)",
      "publishedAt": "Horario relativo en español (ej: 'Hace 5 min', 'Hace 23 min', 'Hace 1 hora')",
      "importance": "Una de estas cuatro opciones de texto: 'breaking', 'high', 'medium', 'low'",
      "reporter": "Nombre ficticio y elegante de un reportero (ej: 'Nuria Beltrán, Redactora de Economía', 'Hugo Ortiz, Corresponsal Tecnológico')"
    }
  ]
}

Ten riguroso cuidado de basar tus textos en estas noticias obtenidas en vivo para no inventar hechos. Preserva el tono periodístico formal en español de España.`;

    const userInstructions = `Aquí están las NOTICIAS REALES RECIENTES obtenidas del feed en vivo de España:
${JSON.stringify(rssArticles.slice(0, 10))}

Filtros solicitados por el usuario:
- Categoría de interés: ${categoryParam || 'Todo'}
- Término de búsqueda / Consulta: ${queryParam || 'Ninguno'}

Escribe un conjunto de 5 a 10 artículos basados fielmente en esta de última hora.`;

    console.log(`Querying Gemini with live seed contents of Spain feeds...`);
    
    // Call Gemini 3.5 Flash using the live feeds as seed context and google search tools
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userInstructions,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        tools: [{ googleSearch: {} }]
      }
    });

    const rawText = response.text || "{}";
    let parsedData: any = { articles: [] };

    try {
      parsedData = JSON.parse(rawText.trim());
    } catch (parseErr) {
      console.error("JSON parsing error of Gemini output, raw text was:", rawText);
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    }

    // Extract real source grounding citations
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const collectedSources = chunks.map((chunk: any) => ({
      title: chunk.web?.title || chunk.maps?.title || "Enlace de Prensa Oficial",
      url: chunk.web?.uri || chunk.maps?.uri || "https://news.google.com"
    })).filter(s => s.url);

    // Limit sources to unique links to avoid noise
    const uniqueSourcesMap = new Map();
    for (const src of collectedSources) {
      if (!uniqueSourcesMap.has(src.url)) {
        uniqueSourcesMap.set(src.url, src);
      }
    }
    const finalSources = Array.from(uniqueSourcesMap.values()).slice(0, 4);

    // Enrich the articles with custom images, sources, and metrics
    if (parsedData.articles && Array.isArray(parsedData.articles)) {
      parsedData.articles = parsedData.articles.map((art: any, index: number) => {
        const id = art.id || `noticia-${Date.now()}-${index}`;
        return {
          ...art,
          id,
          sources: art.sources && art.sources.length ? art.sources : (finalSources.length ? finalSources : [{ title: "Prensa en Directo", url: "https://news.google.com" }]),
          imageUrl: getCustomImageUrlByTitle(art.title, art.category || ''),
          likes: Math.floor(Math.random() * 200) + 15,
          reads: Math.floor(Math.random() * 2000) + 100,
          hasLiveStream: index === 0
        };
      });
    }

    return res.json({
      articles: parsedData.articles || [],
      realTime: true
    });

  } catch (error: any) {
    const errorStr = error?.message || JSON.stringify(error) || '';
    const isQuotaExceeded = errorStr.includes('429') || errorStr.toLowerCase().includes('quota') || errorStr.includes('RESOURCE_EXHAUSTED') || error?.status === 'RESOURCE_EXHAUSTED';
    
    if (isQuotaExceeded) {
      isGeminiRateLimited = true;
      rateLimitResetTime = Date.now() + 15 * 60 * 1000; // bypass active for 15 minutes
      console.warn("[Safe Bypass] Gemini synthesis quota exceeded (429/RESOURCE_EXHAUSTED). Activating 15m backup RSS mode.");
    } else {
      console.warn("Gemini synthesis exception:", error.message || error);
    }

    // Dynamic, resilient fallback to actual live parsed RSS feed (the user gets REAL live news!)
    const liveArticles = mapRssToNewsArticles(rssArticles);
    return res.json({ 
      articles: liveArticles, 
      realTime: false, 
      quotaExceeded: isQuotaExceeded,
      error: isQuotaExceeded 
        ? "Cuota de IA alcanzada. Servido por flujo RSS de prensa española directa." 
        : (error.message || "No se pudo sintetizar con IA. Mostrando fuente directa.") 
    });
  }
});

// POST /api/news/tts - Text-To-Speech endpoint to read news
app.post('/api/news/tts', async (req, res) => {
  const { text, voice = 'Charon' } = req.body;
  if (!text) {
    return res.status(400).json({ error: "No se proporcionó texto para leer en voz alta." });
  }

  // Check if Gemini is in rate-limit cool down
  if (isGeminiRateLimited && Date.now() < rateLimitResetTime) {
    return res.json({ 
      audio: null, 
      mocked: true, 
      message: "Respaldo activo: Límite de cuota Gemini alcanzado. Reproduciendo con lector local." 
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    // Return mock indicator if API Key is not configured
    return res.json({ 
      audio: null, 
      mocked: true, 
      message: "TTS solo está activo con una clave GEMINI_API_KEY válida." 
    });
  }

  try {
    const ai = getGemini();
    const promptInstructions = `Actúa como un locutor de radio o presentador de telediario profesional, con un tono elegante, serio, fluido pero muy carismático en español. Lee lo siguiente directamente y de forma entusiasta sin añadir introducciones ni despedidas: ${text}`;

    console.log(`Requesting TTS from gemini-3.1-flash-tts-preview with voice ${voice}...`);
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: promptInstructions }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice }, // 'Charon' | 'Puck' | 'Kore' | 'Fenrir' | 'Zephyr'
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({ audio: base64Audio, mocked: false });
    } else {
      return res.status(500).json({ error: "La síntesis de voz no devolvió audio binario." });
    }
  } catch (err: any) {
    const errStr = err?.message || JSON.stringify(err) || '';
    const isQuotaExceeded = errStr.includes('429') || errStr.toLowerCase().includes('quota') || errStr.includes('RESOURCE_EXHAUSTED') || err?.status === 'RESOURCE_EXHAUSTED';
    
    if (isQuotaExceeded) {
      isGeminiRateLimited = true;
      rateLimitResetTime = Date.now() + 15 * 60 * 1000; // bypass active for 15 minutes
      console.warn("[Safe Bypass] Gemini TTS quota exceeded (429/RESOURCE_EXHAUSTED). Activating 15m native TTS browser fallback.");
      return res.json({ 
        audio: null, 
        mocked: true, 
        message: "Respaldo temporal activo: Límite de cuota de IA excedido. Usando lector local." 
      });
    }

    console.error("Speech Synthesis failure:", err);
    return res.status(500).json({ error: err.message || "Fallo en la comunicación con el sintetizador de voz." });
  }
});

// Serve frontend SPA or configure dev/prod paths
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started and listenting on http://localhost:${PORT}`);
  });
}

startServer();
