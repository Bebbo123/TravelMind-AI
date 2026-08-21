'use client';

import React, { useState, useEffect } from 'react';
import { TravelData, PlaceToVisit, AIItineraryItem } from '../types/travel';
import { 
  generateAIItinerary, 
  replanSingleDayWithAI,
  inferTripDates,
  formatItalianDate,
  AIItineraryResponse, 
  AIDaySchedule,
  AIPlaceSuggestion,
  TripPreferences 
} from '../utils/aiItinerary';
import { loadSavedItinerary, saveSavedItinerary, clearSavedItinerary } from '../utils/travelStorage';
import PlaceDetailModal from './PlaceDetailModal';
import NavigationAssistant from './NavigationAssistant';

interface AIItineraryGeneratorProps {
  travelData: TravelData;
  onAddSuggestedPlace: (place: PlaceToVisit) => void;
  onItineraryChange?: (itinerary: AIItineraryResponse | null) => void;
  onSelectDayChange?: (dayNumber: number) => void;
}

const AVAILABLE_INTERESTS = [
  '⛩️ Templi & Cultura',
  '🍱 Cibo & Izakaya',
  '🕹️ Anime & Geek',
  '🌸 Natura & Onsen',
  '🛍️ Shopping',
  '🌃 Vita Notturna'
];

export default function AIItineraryGenerator({ 
  travelData, 
  onAddSuggestedPlace,
  onItineraryChange,
  onSelectDayChange 
}: AIItineraryGeneratorProps) {
  const [itinerary, setItinerary] = useState<AIItineraryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [addedPlacesMap, setAddedPlacesMap] = useState<Record<string, boolean>>({});
  const [rejectedPlacesMap, setRejectedPlacesMap] = useState<Record<string, boolean>>({});

  // Interactive Modal & Live Navigation Assistant States
  const [activeModalItem, setActiveModalItem] = useState<AIItineraryItem | null>(null);
  const [isNavigatingLive, setIsNavigatingLive] = useState<boolean>(false);
  const [currentNavStepIndex, setCurrentNavStepIndex] = useState<number>(0);

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

    const saved = loadSavedItinerary();
    if (saved) {
      setItinerary(saved);
      if (onItineraryChange) onItineraryChange(saved);
      if (saved.days && saved.days.length > 0) {
        setSelectedDay(saved.days[0].dayNumber);
        if (onSelectDayChange) onSelectDayChange(saved.days[0].dayNumber);
      }
    }
  }, [travelData]);

  const handleSelectDay = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    if (onSelectDayChange) onSelectDayChange(dayNumber);
  };

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
      saveSavedItinerary(result);
      if (onItineraryChange) onItineraryChange(result);

      if (result.days && result.days.length > 0) {
        setSelectedDay(result.days[0].dayNumber);
        if (onSelectDayChange) onSelectDayChange(result.days[0].dayNumber);
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
        const updatedDays = itinerary.days.map(d => d.dayNumber === day.dayNumber ? updatedDay : d);
        const updatedItinerary = { ...itinerary, days: updatedDays };
        setItinerary(updatedItinerary);
        saveSavedItinerary(updatedItinerary);
        if (onItineraryChange) onItineraryChange(updatedItinerary);
      }

      setReplanPromptMap(prev => ({ ...prev, [day.dayNumber]: '' }));
    } catch (err) {
      alert('Impossibile rielaborare la giornata al momento.');
    } finally {
      setIsReplanningDayMap(prev => ({ ...prev, [day.dayNumber]: false }));
    }
  };

  const handleAddItemToDay = (dayNumber: number) => {
    const activityName = prompt('Inserisci la nuova tappa (es. Visita al Santuario Meiji o Aperitivo a Shinjuku):');
    if (!activityName || !activityName.trim()) return;

    const timeStr = prompt('Inserisci l\'orario indicativo (es. 16:30 - 17:30):', '16:30 - 17:30') || '16:30 - 17:30';

    if (!itinerary) return;

    const updatedDays = itinerary.days.map(d => {
      if (d.dayNumber === dayNumber) {
        const newItem: AIItineraryItem = {
          id: `manual_${Date.now()}`,
          time: timeStr,
          activity: activityName,
          type: 'place',
          placeName: activityName,
          description: `Tappa aggiunta manualmente nel Diario per il giorno ${d.formattedDate}.`,
          interestRating: 'Consigliato ⭐️',
          openingHours: '09:00 - 18:00',
          recommendedDurationMin: 60
        };
        return {
          ...d,
          timeline: [...d.timeline, newItem]
        };
      }
      return d;
    });

    const updatedItinerary = { ...itinerary, days: updatedDays };
    setItinerary(updatedItinerary);
    saveSavedItinerary(updatedItinerary);
    if (onItineraryChange) onItineraryChange(updatedItinerary);
  };

  const handleDeleteItemFromDay = (dayNumber: number, itemIndex: number) => {
    if (!itinerary) return;
    if (!confirm('Sei sicuro di voler eliminare questa tappa dal diario?')) return;

    const updatedDays = itinerary.days.map(d => {
      if (d.dayNumber === dayNumber) {
        const newTimeline = [...d.timeline];
        newTimeline.splice(itemIndex, 1);
        return { ...d, timeline: newTimeline };
      }
      return d;
    });

    const updatedItinerary = { ...itinerary, days: updatedDays };
    setItinerary(updatedItinerary);
    saveSavedItinerary(updatedItinerary);
    if (onItineraryChange) onItineraryChange(updatedItinerary);
  };

  const handleClearSaved = () => {
    if (confirm('Sei sicuro di voler cancellare l\'itinerario salvato dal diario?')) {
      clearSavedItinerary();
      setItinerary(null);
      if (onItineraryChange) onItineraryChange(null);
    }
  };

  const handleAddPlaceClick = (suggestion: AIPlaceSuggestion) => {
    const newPlace: PlaceToVisit = {
      id: 'p_' + Date.now(),
      name: suggestion.name + (suggestion.officialNameJa ? ` (${suggestion.officialNameJa})` : ''),
      category: suggestion.category as any,
      city: suggestion.city,
      address: suggestion.address,
      priority: 'Alta',
      status: 'Da Visitare',
      notes: `Suggerimento AI: ${suggestion.reason}`,
      estimatedCostYen: suggestion.estimatedCostYen
    };

    onAddSuggestedPlace(newPlace);
    setAddedPlacesMap(prev => ({ ...prev, [suggestion.id]: true }));
  };

  const handleRejectPlaceClick = (suggestionId: string) => {
    setRejectedPlacesMap(prev => ({ ...prev, [suggestionId]: true }));
  };

  const currentDaySchedule = itinerary?.days.find(d => d.dayNumber === selectedDay) || itinerary?.days[0];

  const handleStartNavigationToStep = (item: AIItineraryItem) => {
    if (!currentDaySchedule) return;
    const idx = currentDaySchedule.timeline.findIndex(t => t === item || t.id === item.id);
    setCurrentNavStepIndex(idx !== -1 ? idx : 0);
    setIsNavigatingLive(true);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-left space-y-8">
      
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-extrabold mb-2">
            <span>✨ Concierge Michelin & Wanderlog AI</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            📖 Diario di Viaggio & Assistente in Tempo Reale
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Clustering geografico dei quartieri, scheda gastronomica regionale e navigazione turn-by-turn.
          </p>
        </div>

        {itinerary && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setIsNavigatingLive(true);
                setCurrentNavStepIndex(0);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/30 cursor-pointer flex items-center gap-1.5"
            >
              🧭 Portami alla Prossima Tappa
            </button>
            <button
              onClick={handleClearSaved}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              🗑️ Elimina Diario
            </button>
          </div>
        )}
      </div>

      {/* Preferences Form Section */}
      <div className="p-5 md:p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          ⚙️ Personalizza le Preferenze del Viaggio
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Data Inizio Viaggio</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Data Fine Viaggio</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Ritmo del Viaggio</label>
            <select
              value={pace}
              onChange={e => setPace(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Relax">Relax ☕ (Meno tappe, più riposo)</option>
              <option value="Equilibrato">Equilibrato ⚖️ (Standard consigliato)</option>
              <option value="Intenso">Intenso 🔥 (Molte attrazioni al giorno)</option>
              <option value="Ultra-Esploratore">Ultra-Esploratore ⚡ (Dall'alba a notte)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <label className="block text-slate-400">Interessi Principali</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_INTERESTS.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-xs">
          <label className="block text-slate-400 mb-1">Note, Desideri ed Istruzioni Custom per Gemini</label>
          <input
            type="text"
            placeholder="es. Vorrei fare una lezione di cucina ramen a Tokyo o visitare la foresta di bambù al mattino presto..."
            value={customInstructions}
            onChange={e => setCustomInstructions(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-indigo-500/25 active:scale-98 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? '🤖 Generazione Diario Step-by-Step con Gemini in corso...' : '✨ Genera Diario di Viaggio Turistico AI'}
        </button>
      </div>

      {/* LIVE NAVIGATION ASSISTANT BAR */}
      {isNavigatingLive && currentDaySchedule && (
        <NavigationAssistant
          currentStep={currentDaySchedule.timeline[currentNavStepIndex] || null}
          nextStep={currentDaySchedule.timeline[currentNavStepIndex + 1] || null}
          stepIndex={currentNavStepIndex}
          totalSteps={currentDaySchedule.timeline.length}
          onNextStep={() => setCurrentNavStepIndex(prev => Math.min(prev + 1, currentDaySchedule.timeline.length - 1))}
          onPrevStep={() => setCurrentNavStepIndex(prev => Math.max(prev - 1, 0))}
          onReplanCurrentDay={(reason) => handleReplanDay(currentDaySchedule, reason)}
          onCloseNavigation={() => setIsNavigatingLive(false)}
        />
      )}

      {/* ITINERARY RESULT DISPLAY */}
      {itinerary && itinerary.days && itinerary.days.length > 0 && (
        <div className="space-y-6">
          
          {/* Global Feasibility Summary Badge */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <span className="font-extrabold uppercase tracking-wider text-[10px] text-emerald-400 bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-700/60 mr-2">
                DIARIO REGISTRATO • FATTIBILITÀ GLOBALE ({itinerary.days.length} GIORNI)
              </span>
              <strong className="text-white font-bold">{itinerary.globalFeasibilityRating}</strong>
              <p className="text-slate-300 text-xs mt-1">{itinerary.globalFeasibilityNotes}</p>
            </div>
          </div>

          {/* DAY SELECTION TABS WITH FORMATTED ITALIAN DATES */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
            {itinerary.days.map((d) => (
              <button
                key={d.dayNumber}
                onClick={() => handleSelectDay(d.dayNumber)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  selectedDay === d.dayNumber
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>📅 {d.formattedDate || formatItalianDate(d.date)}</span>
                <span className="text-[10px] font-normal opacity-80">({d.city})</span>
              </button>
            ))}
          </div>

          {/* ACTIVE DAY TIMELINE */}
          {currentDaySchedule && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Day Header Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-950 text-indigo-300 rounded-md border border-indigo-800/60">
                      📅 {currentDaySchedule.formattedDate || currentDaySchedule.date}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      Giorno {currentDaySchedule.dayNumber}
                    </span>
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-950 text-emerald-300 rounded-md border border-emerald-800/60">
                      🧘 Stanchezza: {currentDaySchedule.fatigueScore || 3}/10 (Ottimale)
                    </span>
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-amber-950 text-amber-300 rounded-md border border-amber-800/60">
                      {currentDaySchedule.weatherForecast || 'Soleggiato ☀️'}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-extrabold text-white">
                    {currentDaySchedule.title}
                  </h3>
                  <p className="text-xs text-indigo-400 font-semibold mt-1">
                    📍 Città: {currentDaySchedule.city} • 🏨 Hotel: {currentDaySchedule.accommodationName || 'Alloggio del Giorno'}
                  </p>
                </div>

                <button
                  onClick={() => handleAddItemToDay(currentDaySchedule.dayNumber)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer"
                >
                  + Aggiungi Tappa Manuale
                </button>
              </div>

              {/* REAL-TIME AI CONCIERGE RE-PLANNER FOR ACTIVE DAY */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-950 to-indigo-950/40 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    ⚡ Assistente Concierge AI in Tempo Reale ({currentDaySchedule.formattedDate})
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleReplanDay(currentDaySchedule, 'Ho finito le cose da vedere in anticipo, suggerisci qualcos\'altro nelle vicinanze (+2 ore)')}
                    disabled={isReplanningDayMap[currentDaySchedule.dayNumber]}
                    className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-semibold border border-purple-700/60 transition-all cursor-pointer"
                  >
                    ⚡ Ho finito prima! (+2 ore vicine)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReplanDay(currentDaySchedule, 'Sono molto stanco oggi, rielabora il programma in Modalità Relax leggero')}
                    disabled={isReplanningDayMap[currentDaySchedule.dayNumber]}
                    className="px-3 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 font-semibold border border-indigo-700/60 transition-all cursor-pointer"
                  >
                    🛋️ Sono stanco (Modalità Relax)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReplanDay(currentDaySchedule, 'Oggi piove! Sostituisci i luoghi all\'aperto con gallerie e musei al coperto')}
                    disabled={isReplanningDayMap[currentDaySchedule.dayNumber]}
                    className="px-3 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-200 font-semibold border border-blue-700/60 transition-all cursor-pointer"
                  >
                    ☔ Oggi piove! (Al coperto)
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="es. Vorrei sostituire il tempio con una lezione di cucina..."
                    value={replanPromptMap[currentDaySchedule.dayNumber] || ''}
                    onChange={e => setReplanPromptMap({ ...replanPromptMap, [currentDaySchedule.dayNumber]: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') handleReplanDay(currentDaySchedule); }}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleReplanDay(currentDaySchedule)}
                    disabled={isReplanningDayMap[currentDaySchedule.dayNumber]}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isReplanningDayMap[currentDaySchedule.dayNumber] ? 'Elaborazione...' : '🔄 Rielabora'}
                  </button>
                </div>
              </div>

              {/* TIMELINE ITEMS LIST WITH CATEGORY COLOR-CODING */}
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-800">
                {currentDaySchedule.timeline.map((item, idx) => {
                  const isPlace = item.type === 'place';
                  const isTransit = item.type === 'transit';
                  const isMeal = item.type === 'meal';
                  const isBreak = item.type === 'break';
                  const isHotelReturn = item.type === 'hotel_return';

                  const badgeBg = 
                    isPlace ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                    isTransit ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                    isMeal ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                    isHotelReturn ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                    'bg-slate-800 text-slate-300 border-slate-700';

                  const iconEmoji = 
                    item.transitType === 'flight' ? '✈️' :
                    item.transitType === 'train' ? '🚆' :
                    item.transitType === 'subway' ? '🚇' :
                    item.transitType === 'taxi' ? '🚕' :
                    item.transitType === 'walk' ? '🚶' :
                    isMeal ? '🍜' :
                    isHotelReturn ? '🏨' :
                    isPlace ? '📍' : '☕';

                  return (
                    <div 
                      key={item.id || idx}
                      onClick={() => setActiveModalItem(item)}
                      className={`p-4 md:p-5 rounded-2xl bg-slate-950 border hover:border-indigo-500/60 transition-all shadow-lg relative flex flex-col md:flex-row justify-between md:items-center gap-3 cursor-pointer group ${
                        isHotelReturn ? 'border-purple-800/40 bg-purple-950/20' : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-sm shrink-0 mt-0.5 shadow-md">
                          {iconEmoji}
                        </span>

                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-mono font-bold text-indigo-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {item.time}
                            </span>
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${badgeBg}`}>
                              {isPlace ? 'Attività Turistica' : isTransit ? 'Spostamento Step-by-Step' : isMeal ? 'Pasto Locale Michelin' : isHotelReturn ? 'Rientro Hotel' : 'Pausa'}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-white text-base group-hover:text-indigo-300 transition-all">
                            {item.activity}
                          </h4>

                          {item.recommendedDish && (
                            <p className="text-xs text-amber-300 font-semibold mt-0.5">
                              😋 Piatto Consigliato: {item.recommendedDish} (~{item.priceRangeEuros || 12}€)
                            </p>
                          )}

                          {item.transitDetail && (
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              💡 {item.transitDetail}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-900">
                        <span className="text-xs text-indigo-400 font-semibold opacity-0 group-hover:opacity-100 transition-all">
                          🔍 Vedi Dettagli ➔
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItemFromDay(currentDaySchedule.dayNumber, idx);
                          }}
                          className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-semibold rounded-lg border border-red-800/40 transition-all cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* SUGGESTED NEW PLACES TO ADD WITH ACCEPT / REJECT BUTTONS */}
          {itinerary.suggestedNewPlaces && itinerary.suggestedNewPlaces.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-950/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="text-lg font-bold text-white">Attrazioni Suggerite dall'AI (Accetta / Snobba)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {itinerary.suggestedNewPlaces.map((sug) => {
                  const isAdded = addedPlacesMap[sug.id];
                  const isRejected = rejectedPlacesMap[sug.id];

                  if (isRejected) return null;

                  return (
                    <div key={sug.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded bg-purple-950 text-purple-300 border border-purple-800">
                            ✨ Suggerito da AI • {sug.category}
                          </span>
                          <span className="text-xs font-bold text-slate-400">📍 {sug.city}</span>
                        </div>

                        <h4 className="font-extrabold text-white text-base mt-2">{sug.name}</h4>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{sug.reason}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => handleAddPlaceClick(sug)}
                          disabled={isAdded}
                          className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                          }`}
                        >
                          {isAdded ? '✅ Aggiunto ai Luoghi' : '✅ Accetta & Aggiungi'}
                        </button>

                        <button
                          onClick={() => handleRejectPlaceClick(sug.id)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                        >
                          ❌ Snobba
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

      {/* DETAILED PLACE MODAL DRAWER */}
      {activeModalItem && (
        <PlaceDetailModal
          item={activeModalItem}
          onClose={() => setActiveModalItem(null)}
          onNavigateToStep={handleStartNavigationToStep}
        />
      )}

    </div>
  );
}
