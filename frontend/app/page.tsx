'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import TransitRouter from './components/TransitRouter';

// Dynamic import for TravelHub component to handle client-side localStorage and synchronized Map
const TravelHub = dynamic(() => import('./components/TravelHub'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-sm animate-pulse">
      Caricamento Travel Planner & Documenti... 🧳
    </div>
  ),
});

export default function Home() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const scrollToTravelHub = () => {
    const element = document.getElementById('travel-hub');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-10 text-center bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white relative overflow-hidden">
      
      {/* Network Status Badge */}
      <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md border transition-all shadow-md">
        {isOnline ? (
          <span className="flex items-center gap-2 text-emerald-400 bg-emerald-950/40 border-emerald-800/60 px-3 py-1.5 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Online • Connesso al Cloud
          </span>
        ) : (
          <span className="flex items-center gap-2 text-amber-400 bg-amber-950/40 border-amber-800/60 px-3 py-1.5 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            Offline • Modalità Viaggio Attiva
          </span>
        )}
      </div>

      {/* Main Hero Header */}
      <div className="max-w-4xl mt-12 mb-8">
        <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium">
          🇯🇵 Assistente Intelligente per il Giappone & Viaggi Internazionali
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
          TravelMind AI
        </h1>
        <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Il tuo concierge personale per organizzare itinerari, esplorare tappe imperdibili e navigare con i **mezzi pubblici** e mappe gratuite OpenStreetMap sia online che offline.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <button 
          onClick={scrollToTravelHub}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold text-white transition-all shadow-lg shadow-blue-500/25 active:scale-95 cursor-pointer"
        >
          Pianifica Nuovo Viaggio ✨
        </button>
        <button 
          onClick={scrollToTravelHub}
          className="px-8 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 font-semibold text-slate-200 transition-all active:scale-95 cursor-pointer"
        >
          Documenti & Prenotazioni 🧳
        </button>
      </div>

      {/* Main Interactive Sections Container (SINGLE CLEAN MAP & HUB) */}
      <div id="travel-hub" className="max-w-6xl w-full space-y-8 mb-12">
        {/* Travel Planner, Documents Hub & Synchronized Map */}
        <TravelHub />

        {/* Public Transit Router Component */}
        <TransitRouter />
      </div>

      {/* Core Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
        <FeatureCard 
          title="Scoperta AI" 
          icon="✨" 
          desc="Suggerimenti personalizzati e creazione dinamica degli itinerari alimentati da Google Gemini." 
        />
        <FeatureCard 
          title="Mappe OpenStreetMap" 
          icon="🗺️" 
          desc="Mappa interattiva 100% gratuita senza chiavi API con punti d'interesse, stazioni e percorsi." 
        />
        <FeatureCard 
          title="Mezzi Pubblici & Treni" 
          icon="🚇" 
          desc="Modulo integrato per il calcolo percorsi di Metropolitana, Treni JR, Shinkansen e Bus locale." 
        />
        <FeatureCard 
          title="Supporto Offline Integrato" 
          icon="📡" 
          desc="Accedi a itinerari, mappe salvate, budget e prenotazioni anche senza connessione dati in viaggio." 
        />
      </div>

      {/* Footer Info */}
      <footer className="mt-16 text-slate-500 text-xs">
        TravelMind AI • OpenStreetMap & PWA Offline Ready
      </footer>
    </div>
  );
}

function FeatureCard({ title, icon, desc }: { title: string, icon: string, desc: string }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-600 transition-all hover:-translate-y-1 text-left backdrop-blur-sm shadow-xl">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-slate-100">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
