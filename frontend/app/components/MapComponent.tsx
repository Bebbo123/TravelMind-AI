'use client';

import React, { useEffect, useRef, useState } from 'react';

// POI / Transit Markers Data
interface MapPoint {
  id: string;
  name: string;
  category: 'transit' | 'attraction' | 'food' | 'hotel';
  lat: number;
  lng: number;
  desc: string;
  lines?: string[];
}

const JAPAN_LOCATIONS: MapPoint[] = [
  {
    id: 'tokyo-station',
    name: 'Stazione di Tokyo (東京駅)',
    category: 'transit',
    lat: 35.681236,
    lng: 139.767125,
    desc: 'Hub centrale del Giappone. Nodo principale per Shinkansen, JR Yamanote e Tokyo Metro.',
    lines: ['JR Yamanote Line', 'Shinkansen (Tokaido/Tohoku)', 'Marunouchi Metro Line'],
  },
  {
    id: 'shibuya-station',
    name: 'Stazione di Shibuya & Incrocio',
    category: 'transit',
    lat: 35.658034,
    lng: 139.701636,
    desc: 'Celebre incrocio pedonale. Collegamenti con JR Yamanote, Fukutoshin e Ginza Line.',
    lines: ['JR Yamanote', 'Tokyo Metro Ginza Line', 'Keio Inokashira Line'],
  },
  {
    id: 'kyoto-station',
    name: 'Stazione Centrale di Kyoto (京都駅)',
    category: 'transit',
    lat: 34.985849,
    lng: 135.758767,
    desc: 'Punto d\'accesso per i templi di Kyoto. Shinkansen per Tokyo/Osaka e Bus Terminal.',
    lines: ['Tokaido Shinkansen', 'Karasuma Subway', 'JR San-in Main Line'],
  },
  {
    id: 'osaka-namba',
    name: 'Stazione Namba - Osaka',
    category: 'transit',
    lat: 34.665809,
    lng: 135.501175,
    desc: 'Cuore di Dotonbori e Namba. Collegamento diretto per Aeroporto Kansai (Nankai Rapi:t).',
    lines: ['Nankai Line (Kansai Airport)', 'Osaka Metro Midosuji', 'Kintetsu Line'],
  },
  {
    id: 'sensoji',
    name: 'Tempio Sensō-ji (Asakusa)',
    category: 'attraction',
    lat: 35.714765,
    lng: 139.796655,
    desc: 'Il tempio buddista più antico di Tokyo. Raggiungibile via Asakusa Metro Line.',
  },
  {
    id: 'fushimi-inari',
    name: 'Santuario Fushimi Inari-taisha',
    category: 'attraction',
    lat: 34.96714,
    lng: 135.772671,
    desc: 'Famoso per i 10.000 torii rossi. Stazione JR Inari (Linea Nara da Kyoto).',
  },
  {
    id: 'mt-fuji',
    name: 'Monte Fuji (Kawaguchiko)',
    category: 'attraction',
    lat: 35.360625,
    lng: 138.727363,
    desc: 'La montagna sacra del Giappone. Raggiungibile con Express Bus da Shinjuku o Fujikyu Railway.',
  }
];

export default function MapComponent() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePoint, setActivePoint] = useState<MapPoint | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Dynamically import Leaflet strictly on client side
    import('leaflet').then((L) => {
      if (leafletMap.current) return; // Prevent double initialization

      // Fix standard marker icon issue in Next.js Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Initialize Map over Japan (centered on Tokyo)
      const map = L.map(mapRef.current!).setView([35.681236, 139.767125], 7);

      // OpenStreetMap standard tile layer (100% Free & Unlimited)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      leafletMap.current = map;

      // Render markers
      JAPAN_LOCATIONS.forEach((point) => {
        const marker = L.marker([point.lat, point.lng]).addTo(map);
        
        const popupContent = `
          <div style="color: #0f172a; font-family: sans-serif; min-width: 180px;">
            <strong style="font-size: 14px; display: block; margin-bottom: 4px;">${point.name}</strong>
            <p style="font-size: 12px; color: #475569; margin: 0 0 6px 0;">${point.desc}</p>
            ${point.lines ? `<div style="font-size: 11px; background: #e2e8f0; padding: 4px 6px; border-radius: 4px;"><strong>Linee:</strong> ${point.lines.join(', ')}</div>` : ''}
          </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.on('click', () => {
          setActivePoint(point);
        });
      });
    });

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  const handleFlyTo = (lat: number, lng: number, zoom = 12) => {
    if (leafletMap.current) {
      leafletMap.current.flyTo([lat, lng], zoom, { duration: 1.5 });
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl">
      {/* Map Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🗺️ Mappa Interattiva OpenStreetMap
          </h2>
          <p className="text-xs text-slate-400">
            Open-source e gratuita al 100% • Nessuna chiave API o carta richiesta
          </p>
        </div>

        {/* Region Fly-To Quick Selector */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => handleFlyTo(35.681236, 139.767125, 11)}
            className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-all"
          >
            📍 Tokyo
          </button>
          <button
            onClick={() => handleFlyTo(34.985849, 135.758767, 12)}
            className="px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 transition-all"
          >
            ⛩️ Kyoto
          </button>
          <button
            onClick={() => handleFlyTo(34.665809, 135.501175, 12)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all"
          >
            🏯 Osaka
          </button>
          <button
            onClick={() => handleFlyTo(35.360625, 138.727363, 10)}
            className="px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30 transition-all"
          >
            🗻 M. Fuji
          </button>
        </div>
      </div>

      {/* Leaflet Map Div Container */}
      <div 
        ref={mapRef} 
        className="w-full h-[400px] md:h-[480px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-inner bg-slate-950 relative"
      />

      {/* Selected Station / POI Details Bar */}
      {activePoint && (
        <div className="mt-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {activePoint.category === 'transit' ? '🚅' : '⛩️'}
              </span>
              <h4 className="font-bold text-white text-base">{activePoint.name}</h4>
            </div>
            <p className="text-xs text-slate-300 mt-1">{activePoint.desc}</p>
            {activePoint.lines && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {activePoint.lines.map((line, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-700 text-blue-300 text-[11px]">
                    {line}
                  </span>
                ))}
              </div>
            )}
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${activePoint.lat},${activePoint.lng}&travelmode=transit`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shrink-0 flex items-center gap-1.5"
          >
            Indicazioni Mezzi 🚌
          </a>
        </div>
      )}
    </div>
  );
}
