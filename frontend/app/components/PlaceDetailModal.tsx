'use client';

import React from 'react';
import { AIItineraryItem } from '../types/travel';

interface PlaceDetailModalProps {
  item: AIItineraryItem | null;
  onClose: () => void;
  onNavigateToStep?: (item: AIItineraryItem) => void;
  onToggleFavorite?: (item: AIItineraryItem) => void;
}

export default function PlaceDetailModal({ item, onClose, onNavigateToStep, onToggleFavorite }: PlaceDetailModalProps) {
  if (!item) return null;

  const isTransit = item.type === 'transit';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto animate-fadeIn relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm transition-all cursor-pointer z-10"
        >
          ✕
        </button>

        {/* Hero Header */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {isTransit ? `🚆 Spostamento (${item.transitType || 'Transit'})` : `📍 Attrazione Turistica`}
            </span>
            {item.interestRating && (
              <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {item.interestRating}
              </span>
            )}
            {item.time && (
              <span className="px-3 py-1 text-xs font-mono font-bold bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                🕒 {item.time}
              </span>
            )}
          </div>

          <h3 className="text-2xl md:text-3xl font-extrabold text-white">
            {item.placeName || item.activity}
          </h3>

          {(item.placeNameJa || item.activityJa) && (
            <div className="flex items-center gap-2 mt-1 text-slate-400 font-semibold text-sm">
              <span>{item.placeNameJa || item.activityJa}</span>
              {item.romaji && (
                <span className="text-indigo-400 font-mono text-xs italic">
                  [{item.romaji}]
                </span>
              )}
            </div>
          )}
        </div>

        {/* Image / Visual Header */}
        <div className="w-full h-48 md:h-60 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative shadow-inner">
          <img
            src={item.imageUrl || 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop'}
            alt={item.placeName || item.activity}
            className="w-full h-full object-cover opacity-90 hover:scale-105 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
          <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-xs text-slate-300">
            <span>📷 Immagine Ufficiale & Guida Turistica</span>
            {item.crowdLevel && (
              <span className="bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 font-bold text-amber-400">
                👥 Affollamento: {item.crowdLevel}
              </span>
            )}
          </div>
        </div>

        {/* TRANSIT STEP DETAILS (If transit) */}
        {isTransit && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3">
            <h4 className="font-extrabold text-indigo-300 text-sm flex items-center gap-2">
              🚆 Dettagli Percorso & Spostamento Step-by-Step
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Partenza</span>
                <strong className="text-white font-semibold">{item.departurePoint || 'Origine'}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Destinazione</span>
                <strong className="text-white font-semibold">{item.destinationPoint || 'Destinazione'}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Durata & Distanza</span>
                <strong className="text-emerald-400 font-bold">{item.durationMinutes || 20} min ({item.distanceKm || 4.5} km)</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Costo Biglietto</span>
                <strong className="text-amber-400 font-bold">¥{item.costEstimateYen?.toLocaleString() || 220}</strong>
              </div>
            </div>

            {item.lineName && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 flex items-center justify-between">
                <span>🚇 Linea: <strong>{item.lineName}</strong> ({item.stopCount || 6} fermate • {item.changesCount || 0} cambi)</span>
              </div>
            )}

            {(item.fastestAlternative || item.cheapestAlternative) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {item.fastestAlternative && (
                  <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-blue-300">
                    ⚡ <strong>Più Veloce:</strong> {item.fastestAlternative}
                  </div>
                )}
                {item.cheapestAlternative && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
                    💰 <strong>Più Economico:</strong> {item.cheapestAlternative}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Description & History Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h5 className="font-extrabold text-white text-sm flex items-center gap-1.5">
              📖 Descrizione & Informazioni
            </h5>
            <p className="text-slate-300 leading-relaxed">
              {item.description || item.transitDetail || item.activity || 'Attrazione imperdibile del viaggio con atmosfera unica e ricca di cultura.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h5 className="font-extrabold text-indigo-300 text-sm flex items-center gap-1.5">
              🏛️ Storia & Curiosità
            </h5>
            <p className="text-slate-300 leading-relaxed italic">
              {item.history || item.curiosity || 'Luogo simbolo del quartiere, frequentato da abitanti e visitatori per le sue tradizioni centenarie.'}
            </p>
          </div>
        </div>

        {/* Practical Info Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">🕒 Orari di Apertura</span>
            <strong className="text-slate-200">{item.openingHours || '08:30 - 18:30'}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">🎟️ Ingresso</span>
            <strong className="text-emerald-400">{item.admissionPriceYen === 0 ? 'Gratuito' : `¥${item.admissionPriceYen?.toLocaleString() || 500}`}</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">⏱️ Durata Consigliata</span>
            <strong className="text-slate-200">{item.recommendedDurationMin || 90} minuti</strong>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">♿ Servizi</span>
            <strong className="text-indigo-300">Bagni • Accessibile</strong>
          </div>
        </div>

        {/* Nearby Recommended Places */}
        {item.nearbyPlaces && item.nearbyPlaces.length > 0 && (
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-xs space-y-2">
            <h5 className="font-extrabold text-purple-300 text-sm">
              ✨ Nelle Vicinanze Puoi Visitare:
            </h5>
            <div className="flex flex-wrap gap-2">
              {item.nearbyPlaces.map((place, idx) => (
                <span key={idx} className="px-3 py-1 rounded-xl bg-purple-900/60 border border-purple-700/60 text-purple-200 font-semibold">
                  📍 {place}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          {item.website ? (
            <a
              href={item.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              🌐 Sito Ufficiale
            </a>
          ) : <div />}

          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite(item)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              >
                ⭐ Salva Preferito
              </button>
            )}

            {onNavigateToStep && (
              <button
                onClick={() => {
                  onNavigateToStep(item);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-blue-500/30 cursor-pointer flex items-center gap-1.5"
              >
                🧭 Portami Qui (Navigazione)
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
