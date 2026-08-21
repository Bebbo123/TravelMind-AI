'use client';

import React, { useState } from 'react';
import { TravelData, PlaceToVisit } from '../types/travel';
import { generateAIItinerary, AIItineraryResponse, AIPlaceSuggestion } from '../utils/aiItinerary';

interface AIItineraryGeneratorProps {
  travelData: TravelData;
  onAddSuggestedPlace: (place: PlaceToVisit) => void;
}

export default function AIItineraryGenerator({ travelData, onAddSuggestedPlace }: AIItineraryGeneratorProps) {
  const [itinerary, setItinerary] = useState<AIItineraryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [addedPlacesMap, setAddedPlacesMap] = useState<Record<string, boolean>>({});

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const result = await generateAIItinerary(travelData);
      setItinerary(result);
      if (result.days && result.days.length > 0) {
        setSelectedDay(result.days[0].dayNumber);
      }
    } catch (err) {
      alert('Impossibile generare l\'itinerario al momento.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuggested = (sug: AIPlaceSuggestion) => {
    const newPlace: PlaceToVisit = {
      id: 'p_sug_' + Date.now(),
      name: sug.name + (sug.officialNameJa ? ` (${sug.officialNameJa})` : ''),
      category: sug.category,
      city: sug.city,
      address: sug.address,
      priority: 'Media',
      status: 'Da Visitare',
      notes: `💡 Consigliato dall'AI: ${sug.reason}`,
      estimatedCostYen: sug.estimatedCostYen
    };

    onAddSuggestedPlace(newPlace);
    setAddedPlacesMap(prev => ({ ...prev, [sug.id]: true }));
  };

  return (
    <div className="w-full rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-indigo-500/30 p-6 md:p-8 shadow-2xl space-y-6 text-left">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <span>✨ AI Itinerary & Feasibility Engine</span>
          </div>
          <h3 className="text-2xl font-extrabold text-white">
            Pianificatore Itinerario & Valutatore di Fattibilità
          </h3>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Genera l'itinerario giorno per giorno con **spostamenti**, **pause pranzo/cena**, **avvisi di fattibilità** e **luoghi extra consigliati**.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-2xl text-xs md:text-sm shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 self-start md:self-auto cursor-pointer"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              Analisi Fattibilità & Spostamenti...
            </>
          ) : (
            <>
              <span>✨ Genera Itinerario AI & Fattibilità</span>
            </>
          )}
        </button>
      </div>

      {/* Initial Prompt State if not generated yet */}
      {!itinerary && !isLoading && (
        <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs md:text-sm space-y-3">
          <div className="text-4xl">🗺️ 🚇 🍜</div>
          <p className="font-semibold text-slate-200">
            Pronto a pianificare le tue giornate in Giappone?
          </p>
          <p className="max-w-xl mx-auto text-slate-400 leading-relaxed text-xs">
            L'AI analizzerà i tuoi voli salvati, i tuoi hotel e la lista dei posti che vuoi vedere per calcolare gli orari dei treni/metropolitane, suggerire i momenti giusti per mangiare e avvisarti se un luogo fa perdere troppo tempo.
          </p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-indigo-500/20 text-slate-300 text-xs md:text-sm space-y-4 animate-pulse">
          <div className="text-3xl animate-bounce">🤖</div>
          <p className="font-bold text-indigo-400">L'AI sta calcolando il piano ottimale...</p>
          <div className="max-w-md mx-auto space-y-2 text-slate-500 text-xs">
            <div>✓ Lettura date volo e alloggi in corso</div>
            <div>✓ Calcolo percorsi treni JR e metropolitana</div>
            <div>✓ Inserimento pause gastronomiche e avvisi di fattibilità</div>
          </div>
        </div>
      )}

      {/* Generated Itinerary Content */}
      {itinerary && !isLoading && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Global Feasibility Banner */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            itinerary.globalFeasibilityRating === 'Ottima'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : itinerary.globalFeasibilityRating === 'Accettabile'
              ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-extrabold uppercase text-xs tracking-wider">
                  Valutazione Fattibilità Globale:
                </span>
                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-black/40 border border-current">
                  {itinerary.globalFeasibilityRating}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-200 mt-1 leading-relaxed">
                {itinerary.globalFeasibilityNotes}
              </p>
            </div>
          </div>

          {/* Days Selection Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
            {itinerary.days.map((day) => (
              <button
                key={day.dayNumber}
                onClick={() => setSelectedDay(day.dayNumber)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                  selectedDay === day.dayNumber
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🗓️ Giorno {day.dayNumber}</span>
                <span className="text-[10px] opacity-75 font-normal">({day.city})</span>
              </button>
            ))}
          </div>

          {/* Active Day Timeline */}
          {itinerary.days
            .filter(d => d.dayNumber === selectedDay)
            .map((day) => (
              <div key={day.dayNumber} className="space-y-6">
                
                {/* Day Header Info */}
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between md:items-center gap-2">
                  <div>
                    <h4 className="text-lg font-bold text-white">{day.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      📅 Data: <strong className="text-slate-200">{day.date}</strong> • Città: <strong className="text-indigo-400">{day.city}</strong> {day.accommodationName ? `• Hotel: ${day.accommodationName}` : ''}
                    </p>
                  </div>
                  <div className="text-xs font-medium text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    💡 {day.dailyFeasibilitySummary}
                  </div>
                </div>

                {/* Timeline Items */}
                <div className="space-y-3 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
                  {day.timeline.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-2xl border relative pl-12 transition-all ${
                        item.type === 'transit'
                          ? 'bg-slate-950/80 border-slate-800/80 text-blue-300'
                          : item.type === 'meal'
                          ? 'bg-slate-900/90 border-amber-500/30 text-amber-200'
                          : item.type === 'break'
                          ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                          : 'bg-slate-900 border-slate-800 text-white'
                      }`}
                    >
                      {/* Timeline Bullet Icon */}
                      <div className="absolute left-4 top-4 text-base">
                        {item.type === 'transit' ? '🚇' :
                         item.type === 'meal' ? '🍜' :
                         item.type === 'break' ? '☕' : '📍'}
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded-md">
                              {item.time}
                            </span>
                            <span className="font-bold text-sm text-slate-100">
                              {item.activity}
                            </span>
                          </div>

                          {/* Details */}
                          {item.transitDetail && (
                            <p className="text-xs text-blue-400 mt-1 font-medium">
                              🚆 Spostamento: {item.transitDetail}
                            </p>
                          )}
                          {item.mealSuggestion && (
                            <p className="text-xs text-amber-300 mt-1 font-medium">
                              🍽️ Suggerimento Cibo: {item.mealSuggestion}
                            </p>
                          )}
                        </div>

                        {item.costEstimateYen !== undefined && (
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40 self-start md:self-auto">
                            ¥{item.costEstimateYen.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Feasibility Warning Warning Box */}
                      {item.feasibilityWarning && (
                        <div className="mt-3 p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/50 text-amber-300 text-xs font-medium flex items-start gap-2">
                          <span>⚠️</span>
                          <span>{item.feasibilityWarning}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {/* Section: Extra AI Suggested Places */}
          {itinerary.suggestedNewPlaces && itinerary.suggestedNewPlaces.length > 0 && (
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>💡 Nuovi Luoghi Imperdibili Consigliati dall'AI</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    L'AI ha selezionato queste attrazioni vicine alle tue tappe. Clicca per aggiungerle alla tua lista desideri.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {itinerary.suggestedNewPlaces.map((sug) => {
                  const isAdded = addedPlacesMap[sug.id];

                  return (
                    <div 
                      key={sug.id} 
                      className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 flex flex-col justify-between space-y-4 shadow-xl"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {sug.category}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            📍 {sug.city}
                          </span>
                        </div>

                        <h5 className="font-bold text-white text-base">
                          {sug.name}
                        </h5>
                        {sug.officialNameJa && (
                          <p className="text-xs text-slate-400 font-mono mb-2">{sug.officialNameJa}</p>
                        )}

                        <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
                          💡 <strong>Perché visitarlo:</strong> {sug.reason}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-emerald-400 font-bold">
                          {sug.estimatedCostYen === 0 ? 'Ingresso Gratuito' : `¥${sug.estimatedCostYen.toLocaleString()}`}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleAddSuggested(sug)}
                          disabled={isAdded}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                            isAdded
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 cursor-default'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 cursor-pointer'
                          }`}
                        >
                          {isAdded ? '✓ Aggiunto' : '➕ Aggiungi alla lista'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
