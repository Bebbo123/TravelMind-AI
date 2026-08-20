'use client';

import React, { useState } from 'react';

interface TransitRoutePreset {
  from: string;
  to: string;
  duration: string;
  line: string;
  type: 'shinkansen' | 'express' | 'metro' | 'local';
  price: string;
  transfers: number;
}

const PRESET_ROUTES: TransitRoutePreset[] = [
  {
    from: 'Tokyo Station',
    to: 'Kyoto Station',
    duration: '2h 15m',
    line: 'Tokaido Shinkansen (Nozomi)',
    type: 'shinkansen',
    price: '¥13,970',
    transfers: 0,
  },
  {
    from: 'Aeroporto Narita (NRT)',
    to: 'Tokyo Station',
    duration: '53 min',
    line: 'JR Narita Express (N\'EX)',
    type: 'express',
    price: '¥3,070',
    transfers: 0,
  },
  {
    from: 'Shibuya',
    to: 'Shinjuku',
    duration: '7 min',
    line: 'JR Yamanote Line (Inner Loop)',
    type: 'metro',
    price: '¥170',
    transfers: 0,
  },
  {
    from: 'Kyoto Station',
    to: 'Santuario Fushimi Inari',
    duration: '5 min',
    line: 'JR Nara Line (Stazione Inari)',
    type: 'local',
    price: '¥150',
    transfers: 0,
  },
  {
    from: 'Osaka Namba',
    to: 'Aeroporto Kansai (KIX)',
    duration: '38 min',
    line: 'Nankai Limited Express Rapi:t',
    type: 'express',
    price: '¥1,490',
    transfers: 0,
  },
];

export default function TransitRouter() {
  const [origin, setOrigin] = useState<string>('Tokyo Station');
  const [destination, setDestination] = useState<string>('Kyoto Station');
  const [travelMode, setTravelMode] = useState<string>('transit');

  const handleOpenNavitime = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${travelMode}`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-left">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-2xl">
          🚇
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Calcolatore Mezzi Pubblici & Treni</h3>
          <p className="text-xs text-slate-400">
            Percorsi integrati per Metropolitana, Treni JR, Shinkansen e Bus locale
          </p>
        </div>
      </div>

      {/* Inputs Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Stazione o Luogo di Partenza</label>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Es. Stazione di Tokyo, Aeroporto Narita..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Stazione o Destinazione</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Es. Stazione di Kyoto, Shibuya Crossing..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mezzo di Trasporto</label>
          <select
            value={travelMode}
            onChange={(e) => setTravelMode(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="transit">🚆 Mezzi Pubblici (Metro / Treni)</option>
            <option value="walking">🚶‍♂️ A Piedi</option>
            <option value="bicycling">🚲 Bicicletta</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleOpenNavitime}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mb-8"
      >
        <span>Calcola Orari e Percorso Live</span>
        <span>🔍</span>
      </button>

      {/* Preset Travel Routes Section */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          ⚡ Tratte Principali Suggerite in Giappone:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_ROUTES.map((route, idx) => (
            <div
              key={idx}
              onClick={() => {
                setOrigin(route.from);
                setDestination(route.to);
              }}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex justify-between items-start mb-1.5">
                <span className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                  {route.from} ➔ {route.to}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-800/50">
                  {route.duration}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">{route.line}</p>
              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-900">
                <span>Costo indicativo: <strong className="text-slate-300">{route.price}</strong></span>
                <span className="text-emerald-400 font-medium">Cambi: {route.transfers}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
