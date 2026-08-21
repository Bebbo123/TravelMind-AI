'use client';

import React, { useState } from 'react';
import { AIItineraryItem } from '../types/travel';

interface PlaceDetailModalProps {
  item: AIItineraryItem | null;
  onClose: () => void;
  onNavigateToStep?: (item: AIItineraryItem) => void;
  onToggleFavorite?: (item: AIItineraryItem) => void;
}

export default function PlaceDetailModal({ item, onClose, onNavigateToStep, onToggleFavorite }: PlaceDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'guide' | 'food' | 'map'>('guide');

  if (!item) return null;

  const isTransit = item.type === 'transit';
  const isMeal = item.type === 'meal';

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
              {isTransit ? `🚆 Spostamento (${item.transitType || 'Transit'})` : isMeal ? `🍜 Gastronomia & Ristorante` : `📍 Attrazione Turistica`}
            </span>
            {item.interestRating && (
              <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {item.interestRating}
              </span>
            )}
            {item.isAISuggested && (
              <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                ✨ Suggerito da AI
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

        {/* Visual Image Header */}
        <div className="w-full h-48 md:h-56 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative shadow-inner">
          <img
            src={item.imageUrl || 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop'}
            alt={item.placeName || item.activity}
            className="w-full h-full object-cover opacity-90 hover:scale-105 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
          <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-xs text-slate-300">
            <span>⭐ Guida Michelin & Wanderlog Travelmind</span>
            {item.crowdLevel && (
              <span className="bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700 font-bold text-amber-400">
                👥 Affollamento: {item.crowdLevel}
              </span>
            )}
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'border-indigo-500 text-indigo-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            🏛️ Guida Turistica & Storia
          </button>

          <button
            onClick={() => setActiveTab('food')}
            className={`pb-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'food'
                ? 'border-amber-500 text-amber-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            🍜 Gastronomia & Cibo Locale
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`pb-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'map'
                ? 'border-emerald-500 text-emerald-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            📍 Mappa & Posti Vicini
          </button>
        </div>

        {/* TAB 1: GUIDA TURISTICA */}
        {activeTab === 'guide' && (
          <div className="space-y-4 animate-fadeIn">
            {isTransit && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3">
                <h4 className="font-extrabold text-indigo-300 text-sm flex items-center gap-2">
                  🚆 Dettagli Spostamento Step-by-Step
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Partenza</span>
                    <strong className="text-white font-semibold">{item.departurePoint || 'Origine'}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Arrivo</span>
                    <strong className="text-white font-semibold">{item.destinationPoint || 'Destinazione'}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Durata & Distanza</span>
                    <strong className="text-emerald-400 font-bold">{item.durationMinutes || 20} min ({item.distanceKm || 4.5} km)</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Costo Biglietto</span>
                    <strong className="text-amber-400 font-bold">¥{item.costEstimateYen?.toLocaleString() || 220}</strong>
                  </div>
                </div>

                {item.lineName && (
                  <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200">
                    🚇 Linea: <strong>{item.lineName}</strong> ({item.stopCount || 6} fermate • {item.changesCount || 0} cambi)
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h5 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                  📖 Descrizione & Atmosfera
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">🕒 Orari Apertura</span>
                <strong className="text-slate-200">{item.openingHours || '08:30 - 18:30'}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">🎟️ Ingresso</span>
                <strong className="text-emerald-400">{item.admissionPriceYen === 0 ? 'Gratuito' : `¥${item.admissionPriceYen?.toLocaleString() || 500}`}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">⏱️ Tempo Consigliato</span>
                <strong className="text-slate-200">{item.recommendedDurationMin || 90} minuti</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">♿ Servizi</span>
                <strong className="text-indigo-300">Bagni • Accessibile</strong>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GASTRONOMIA & CIBO LOCALE */}
        {activeTab === 'food' && (
          <div className="space-y-4 text-xs animate-fadeIn">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 to-slate-950 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-800/40 pb-2">
                <h4 className="font-extrabold text-amber-300 text-sm flex items-center gap-2">
                  🍱 Ristorante & Esperienza Gastronomica Consigliata
                </h4>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-900/60 text-amber-200 font-bold">
                  Prezzo Medio: ~{item.priceRangeEuros || 12}€
                </span>
              </div>

              <div>
                <strong className="text-white text-base block font-extrabold">
                  {item.restaurantName || item.mealSuggestion || 'Ichiran Ramen / Izakaya Tradizionale'}
                </strong>
                <span className="text-slate-400 text-xs">Cucina: {item.cuisineType || 'Ramen & Specialità Giapponesi'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold block">⭐ Piatto Imperdibile da Ordinare:</span>
                <p className="text-slate-200 font-semibold">
                  {item.recommendedDish || 'Classic Tonkotsu Ramen con Uovo Barzotto (Ajitama) e Chashu'}
                </p>
              </div>
            </div>

            {/* District Street Food Specialties */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h5 className="font-extrabold text-white text-sm flex items-center gap-2">
                🍡 Cibo di Strada & Specialità Tipiche da Provare nel Quartiere:
              </h5>
              <div className="flex flex-wrap gap-2 pt-1">
                {(item.districtFoodSpecialties || ['Melon Pan', 'Taiyaki', 'Takoyaki', 'Kushikatsu', 'Matcha Soft Serve']).map((snack, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-bold">
                    😋 {snack}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MAPPA & POSTI VICINI */}
        {activeTab === 'map' && (
          <div className="space-y-4 text-xs animate-fadeIn">
            {item.nearbyPlaces && item.nearbyPlaces.length > 0 && (
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 space-y-2">
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

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h5 className="font-extrabold text-white text-sm">🗺️ Posizione & Indicazioni GPS</h5>
              <p className="text-slate-400">
                Apri la navigazione GPS con Google Maps per ottenere le indicazioni stradali per trasporti pubblici o a piedi.
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.placeName || item.activity)}&travelmode=transit`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold transition-all shadow-md"
              >
                🗺️ Indicazioni Google Maps GPS
              </a>
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
