'use client';

import React, { useState, useEffect } from 'react';
import { TravelData, PlaceToVisit } from '../types/travel';
import { 
  generateAIItinerary, 
  replanSingleDayWithAI,
  inferTripDates,
  AIItineraryResponse, 
  AIDaySchedule,
  AIPlaceSuggestion,
  TripPreferences 
} from '../utils/aiItinerary';

interface AIItineraryGeneratorProps {
  travelData: TravelData;
  onAddSuggestedPlace: (place: PlaceToVisit) => void;
}

const AVAILABLE_INTERESTS = [
  '⛩️ Templi & Cultura',
  '🍱 Cibo & Izakaya',
  '🕹️ Anime & Geek',
  '🌸 Natura & Onsen',
  '🛍️ Shopping',
  '🌃 Vita Notturna'
];

export default function AIItineraryGenerator({ travelData, onAddSuggestedPlace }: AIItineraryGeneratorProps) {
  const [itinerary, setItinerary] = useState<AIItineraryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [addedPlacesMap, setAddedPlacesMap] = useState<Record<string, boolean>>({});

  // Preferences State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pace, setPace] = useState<'Relax' | 'Equilibrato' | 'Intenso' | 'Ultra-Esploratore'>('Equilibrato');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['⛩️ Templi & Cultura', '🍱 Cibo & Izakaya']);
  const [customInstructions, setCustomInstructions] = useState('');

  // On-the-fly Replan States
  const [replanPromptMap, setReplanPromptMap] = useState<Record<number, string>>({});
  const [isReplanningDayMap, setIsReplanningDayMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const inferred = inferTripDates(travelData);
    setStartDate(inferred.startDate);
    setEndDate(inferred.endDate);
  }, [travelData]);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const prefs: TripPreferences = {
        startDate,
        endDate,
        pace,
        interests: selectedInterests,
        customInstructions
      };
      const result = await generateAIItinerary(travelData, prefs);
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

  const handleReplanDay = async (day: AIDaySchedule, customPromptText?: string) => {
    const promptToUse = customPromptText || replanPromptMap[day.dayNumber];
    if (!promptToUse || !promptToUse.trim()) return;

    setIsReplanningDayMap(prev => ({ ...prev, [day.dayNumber]: true }));

    try {
      const updatedDay = await replanSingleDayWithAI(
        day.dayNumber,
        day.date,
        day,
        promptToUse,
        travelData
      );

      if (itinerary) {
        setItinerary({
          ...itinerary,
          days: itinerary.days.map(d => d.dayNumber === day.dayNumber ? updatedDay : d)
        });
      }

      setReplanPromptMap(prev => ({ ...prev, [day.dayNumber]: '' }));
    } catch (err) {
      alert('Impossibile rielaborare la giornata al momento.');
    } finally {
      setIsReplanningDayMap(prev => ({ ...prev, [day.dayNumber]: false }));
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
    <div className="w-full rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-indigo-500/30 p-6 md:p-8 shadow-2xl space-y-8 text-left">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <span>✨ Real-Time AI Concierge & Multi-Day Planner</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white">
            Pianificatore Itinerario, Fattibilità & Concierge al Volo
          </h3>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Personalizza le date del viaggio, imposta il tuo stile e rielabora qualsiasi giornata in tempo reale se sei stanco o hai finito prima.
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
              Generazione Tutti i Giorni...
            </>
          ) : (
            <>
              <span>✨ Genera Itinerario Completo & Fattibilità</span>
            </>
          )}
        </button>
      </div>

      {/* Preferences & Trip Dates Setup Drawer */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
        <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <span>🎛️ Personalizza Date, Ritmo e Istruzioni per la AI</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Dates */}
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Data Inizio Viaggio</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Data Fine Viaggio</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Pace */}
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Ritmo di Viaggio</label>
            <select
              value={pace}
              onChange={e => setPace(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="Relax">Relax 🛋️ (Poche tappe, ritmi calmi)</option>
              <option value="Equilibrato">Equilibrato ⚖️ (Standard consigliato)</option>
              <option value="Intenso">Intenso 🔥 (Molte tappe al giorno)</option>
              <option value="Ultra-Esploratore">Ultra-Esploratore ⚡ (Dall'alba a notte)</option>
            </select>
          </div>
        </div>

        {/* Interest Tags */}
        <div className="space-y-2">
          <label className="block text-slate-400 text-xs font-semibold">Interessi Principali</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_INTERESTS.map(interest => {
              const active = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Prompt Instructions */}
        <div>
          <label className="block text-slate-400 text-xs font-semibold mb-1">
            Istruzioni o Note Speciali per la AI (Opzionale)
          </label>
          <textarea
            rows={2}
            placeholder="es. Viaggio con bambini, vorrei mangiare tanto ramen, poche scalinate faticose, preferisco i templi al mattino presto..."
            value={customInstructions}
            onChange={e => setCustomInstructions(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Initial Prompt State if not generated yet */}
      {!itinerary && !isLoading && (
        <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs md:text-sm space-y-3">
          <div className="text-4xl">🗓️ 🚇 🍱</div>
          <p className="font-semibold text-slate-200">
            Pronto a pianificare tutti i giorni del tuo viaggio in Giappone?
          </p>
          <p className="max-w-xl mx-auto text-slate-400 leading-relaxed text-xs">
            L'AI creerà l'agenda giorno per giorno per l'intera durata dal <strong className="text-indigo-300">{startDate}</strong> al <strong className="text-indigo-300">{endDate}</strong>, valutando la fattibilità e fornendoti l'assistente al volo per le modifiche durante il viaggio!
          </p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-indigo-500/20 text-slate-300 text-xs md:text-sm space-y-4 animate-pulse">
          <div className="text-3xl animate-bounce">🤖</div>
          <p className="font-bold text-indigo-400">L'AI sta calcolando tutti i giorni del tuo viaggio ({startDate} ➔ {endDate})...</p>
          <div className="max-w-md mx-auto space-y-2 text-slate-500 text-xs">
            <div>✓ Lettura voli, alloggi e lista desideri</div>
            <div>✓ Applicazione preferenze di ritmo ({pace})</div>
            <div>✓ Generazione spostamenti treni/metro e pause cibo</div>
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
                  Fattibilità Globale Viaggio ({itinerary.days.length} Giorni):
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

          {/* Active Day Schedule */}
          {itinerary.days
            .filter(d => d.dayNumber === selectedDay)
            .map((day) => {
              const isReplanning = isReplanningDayMap[day.dayNumber];

              return (
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

                  {/* REAL-TIME ON-THE-FLY CONCIERGE ASSISTANT FOR THIS DAY */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-indigo-950/50 border border-purple-500/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-purple-300 font-extrabold text-xs">
                        <span>⚡ Assistente Concierge AI in Tempo Reale (Modifica Giorno {day.dayNumber} al Volo)</span>
                      </div>
                      {isReplanning && (
                        <span className="text-xs text-amber-300 animate-pulse font-bold">
                          Rielaborazione in corso...
                        </span>
                      )}
                    </div>

                    {/* Quick Preset Action Buttons */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleReplanDay(day, 'Ho finito le visite in anticipo! Suggerisci qualcosa nelle vicinanze per le prossime 2 ore.')}
                        disabled={isReplanning}
                        className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-600/40 font-semibold transition-all disabled:opacity-50"
                      >
                        ⚡ Ho finito prima! (+2 ore vicine)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReplanDay(day, 'Sono molto stanco. Rielabora la giornata in modalità Relax rimuovendo tappe faticose.')}
                        disabled={isReplanning}
                        className="px-3 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-600/40 font-semibold transition-all disabled:opacity-50"
                      >
                        🛋️ Sono stanco (Modalità Relax)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReplanDay(day, 'Oggi piove! Sostituisci i luoghi all aperto con tappe al coperto e musei.')}
                        disabled={isReplanning}
                        className="px-3 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-600/40 font-semibold transition-all disabled:opacity-50"
                      >
                        ☔ Oggi piove! (Al coperto)
                      </button>
                    </div>

                    {/* Custom Prompt Text Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="es. Vorrei sostituire il tempio con una lezione di cucina o un cat café..."
                        value={replanPromptMap[day.dayNumber] || ''}
                        onChange={e => setReplanPromptMap({ ...replanPromptMap, [day.dayNumber]: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleReplanDay(day); }}}
                        className="flex-1 bg-slate-950 border border-purple-500/30 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-400"
                      />
                      <button
                        type="button"
                        onClick={() => handleReplanDay(day)}
                        disabled={isReplanning || !replanPromptMap[day.dayNumber]?.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                      >
                        🔄 Rielabora Giorno {day.dayNumber}
                      </button>
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
              );
            })}

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
