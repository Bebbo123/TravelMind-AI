'use client';

import React from 'react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-950 text-white">
      <div className="p-4 rounded-full bg-blue-500/10 text-blue-400 mb-6 text-5xl">
        📡
      </div>
      <h1 className="text-3xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
        Sei attualmente Offline
      </h1>
      <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
        Nessuna connessione ad internet rilevata. TravelMind AI sta utilizzando la versione salvata in memoria per permetterti di consultare le tue informazioni di viaggio anche offline.
      </p>
      
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left max-w-md w-full mb-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">💡 Funzionalità disponibili offline:</h2>
        <ul className="text-xs text-slate-400 space-y-2">
          <li>✓ Consultazione itinerari salvati in cache</li>
          <li>✓ Visualizzazione dettagli prenotazioni e documenti</li>
          <li>✓ Strumenti e note locali per il viaggio</li>
        </ul>
      </div>

      <button
        onClick={() => typeof window !== 'undefined' && window.location.reload()}
        className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/30"
      >
        Ricarica Connessione 🔄
      </button>
    </div>
  );
}
