'use client';

import React, { useState } from 'react';
import { AIItineraryItem } from '../types/travel';

interface NavigationAssistantProps {
  currentStep: AIItineraryItem | null;
  nextStep: AIItineraryItem | null;
  stepIndex: number;
  totalSteps: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  onReplanCurrentDay: (reason: string) => void;
  onCloseNavigation: () => void;
}

export default function NavigationAssistant({
  currentStep,
  nextStep,
  stepIndex,
  totalSteps,
  onNextStep,
  onPrevStep,
  onReplanCurrentDay,
  onCloseNavigation
}: NavigationAssistantProps) {
  const [delayMinutes, setDelayMinutes] = useState<number>(0);
  const [isReplanning, setIsReplanning] = useState<boolean>(false);

  if (!currentStep) return null;

  const handleAddDelay = (mins: number) => {
    setDelayMinutes(prev => prev + mins);
  };

  const handleTriggerReplan = (reason: string) => {
    setIsReplanning(true);
    onReplanCurrentDay(reason);
    setTimeout(() => setIsReplanning(false), 1500);
  };

  return (
    <div className="w-full bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-2 border-blue-500/40 rounded-3xl p-5 md:p-6 shadow-2xl text-left space-y-4 animate-fadeIn">
      
      {/* Top Header & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-800/40 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-extrabold shadow-lg shadow-blue-500/40 animate-pulse">
            🧭
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Assistente Navigazione Live
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                Tappa {stepIndex + 1} di {totalSteps}
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-extrabold text-white mt-0.5">
              Portami alla Prossima Tappa
            </h3>
          </div>
        </div>

        <button
          onClick={onCloseNavigation}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 self-start md:self-auto cursor-pointer"
        >
          ❌ Chiudi Navigatore
        </button>
      </div>

      {/* Main Active Step Instruction Box */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative shadow-inner">
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/40">
              🕒 {currentStep.time}
            </span>
            <h4 className="text-xl font-extrabold text-white mt-2">
              {currentStep.placeName || currentStep.activity}
            </h4>
            {(currentStep.placeNameJa || currentStep.activityJa) && (
              <span className="text-xs text-slate-400 block font-semibold mt-0.5">
                {currentStep.placeNameJa || currentStep.activityJa} {currentStep.romaji ? `[${currentStep.romaji}]` : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {delayMinutes > 0 && (
              <span className="px-3 py-1 bg-amber-950/60 text-amber-400 font-bold text-xs rounded-xl border border-amber-800/60">
                ⚠️ Ritardo: +{delayMinutes} min
              </span>
            )}
          </div>
        </div>

        <p className="text-xs md:text-sm text-slate-300 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
          💡 <strong>Istruzione Step-by-Step:</strong> {currentStep.transitDetail || currentStep.description || currentStep.activity}
        </p>

        {/* Step-by-Step Distance & Time Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Durata Stimata</span>
            <strong className="text-emerald-400 font-bold">{currentStep.durationMinutes || 20} minuti</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Distanza Tratta</span>
            <strong className="text-slate-200 font-bold">{currentStep.distanceKm || 3.5} km</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Costo Previsto</span>
            <strong className="text-amber-400 font-bold">¥{currentStep.costEstimateYen?.toLocaleString() || 220}</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Prossima Meta</span>
            <strong className="text-indigo-300 font-bold truncate block">{nextStep ? (nextStep.placeName || nextStep.activity) : 'Rientro Hotel'}</strong>
          </div>
        </div>
      </div>

      {/* Delay & Real-Time Gemini AI Rerouting Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Segnala Ritardo:</span>
          <button
            onClick={() => handleAddDelay(15)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg border border-slate-800 font-bold cursor-pointer"
          >
            +15 min
          </button>
          <button
            onClick={() => handleAddDelay(30)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg border border-slate-800 font-bold cursor-pointer"
          >
            +30 min
          </button>
        </div>

        {/* Dynamic Gemini Reroute Triggers */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleTriggerReplan('Ho accumulato ritardo, ricalcola le tappe rimanenti')}
            disabled={isReplanning}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            ⚡ Ricalcola con AI per Ritardo
          </button>
          <button
            onClick={() => handleTriggerReplan('Destinazione chiusa o inaccessibile')}
            disabled={isReplanning}
            className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-bold border border-rose-800/40 cursor-pointer disabled:opacity-50"
          >
            🚫 Meta Chiusa (Ricalcola)
          </button>
        </div>
      </div>

      {/* Navigation Step Stepper Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={onPrevStep}
          disabled={stepIndex === 0}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all disabled:opacity-40 cursor-pointer"
        >
          ◀️ Tappa Precedente
        </button>

        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentStep.placeName || currentStep.activity)}&travelmode=transit`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-1.5"
        >
          🗺️ Avvia Google Maps GPS
        </a>

        <button
          onClick={onNextStep}
          disabled={stepIndex >= totalSteps - 1}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all disabled:opacity-40 cursor-pointer shadow-md"
        >
          Prossima Tappa ▶️
        </button>
      </div>

    </div>
  );
}
