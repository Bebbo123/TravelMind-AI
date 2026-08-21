'use client';

import React, { useState, useEffect } from 'react';
import { TravelData, FlightTicket, Accommodation, PlaceToVisit, LayoverSegment } from '../types/travel';
import { loadTravelData, saveTravelData, resetTravelData } from '../utils/travelStorage';
import { searchWithAI, AISearchResult } from '../utils/aiSearch';
import { AIItineraryResponse } from '../utils/aiItinerary';
import AIItineraryGenerator from './AIItineraryGenerator';
import MapComponent from './MapComponent';

type ActiveTab = 'flights' | 'accommodations' | 'places' | 'itinerary';

export default function TravelHub() {
  const [data, setData] = useState<TravelData | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('flights');
  
  // Itinerary & Map Sync States
  const [activeItinerary, setActiveItinerary] = useState<AIItineraryResponse | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);

  // Modal states
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [isAccommodationModalOpen, setIsAccommodationModalOpen] = useState(false);
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);

  // Edit Tracking States
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);

  // AI Search & Confirmation States
  const [aiPlaceQuery, setAiPlaceQuery] = useState('');
  const [aiAccQuery, setAiAccQuery] = useState('');
  const [isAISearching, setIsAISearching] = useState(false);
  const [aiPendingPlaceResult, setAiPendingPlaceResult] = useState<AISearchResult | null>(null);
  const [aiPendingAccResult, setAiPendingAccResult] = useState<AISearchResult | null>(null);

  // New/Edit Flight Form State
  const [newFlight, setNewFlight] = useState<Partial<FlightTicket>>({
    airline: '',
    flightNumber: '',
    origin: '',
    destination: '',
    departureTime: '',
    arrivalTime: '',
    bookingRef: '',
    terminal: '',
    gate: '',
    seat: '',
    notes: '',
    layovers: []
  });

  // New/Edit Accommodation Form State
  const [newAcc, setNewAcc] = useState<Partial<Accommodation>>({
    name: '',
    address: '',
    city: 'Tokyo',
    checkIn: '',
    checkOut: '',
    bookingRef: '',
    cost: undefined,
    currency: 'JPY',
    notes: ''
  });

  // New/Edit Place Form State
  const [newPlace, setNewPlace] = useState<Partial<PlaceToVisit>>({
    name: '',
    category: 'Santuario/Tempio',
    city: 'Tokyo',
    address: '',
    priority: 'Alta',
    status: 'Da Visitare',
    notes: '',
    estimatedCostYen: 0
  });

  useEffect(() => {
    const loaded = loadTravelData();
    setData(loaded);
  }, []);

  const updateData = (newData: TravelData) => {
    setData(newData);
    saveTravelData(newData);
  };

  const handleResetData = () => {
    if (confirm('Vuoi ripristinare i dati di esempio iniziali del viaggio in Giappone?')) {
      const res = resetTravelData();
      setData(res);
      setActiveItinerary(null);
    }
  };

  // --- AI Search Handlers ---
  const handleAISearchPlace = async () => {
    if (!aiPlaceQuery.trim()) return;
    setIsAISearching(true);
    setAiPendingPlaceResult(null);
    try {
      const res = await searchWithAI(aiPlaceQuery, 'place');
      setAiPendingPlaceResult(res);
    } catch (err) {
      alert('Impossibile recuperare i dati con l\'AI al momento.');
    } finally {
      setIsAISearching(false);
    }
  };

  const handleConfirmAIPlace = () => {
    if (!aiPendingPlaceResult) return;
    setNewPlace(prev => ({
      ...prev,
      name: aiPendingPlaceResult.name + (aiPendingPlaceResult.officialNameJa ? ` (${aiPendingPlaceResult.officialNameJa})` : ''),
      category: (aiPendingPlaceResult.category as any) || 'Santuario/Tempio',
      city: aiPendingPlaceResult.city || 'Tokyo',
      address: aiPendingPlaceResult.address || '',
      priority: aiPendingPlaceResult.priority || 'Alta',
      notes: [
        aiPendingPlaceResult.notes,
        aiPendingPlaceResult.openingHours ? `Orari: ${aiPendingPlaceResult.openingHours}` : '',
        aiPendingPlaceResult.phone ? `Tel: ${aiPendingPlaceResult.phone}` : '',
        aiPendingPlaceResult.website ? `Sito: ${aiPendingPlaceResult.website}` : ''
      ].filter(Boolean).join('\n'),
      estimatedCostYen: aiPendingPlaceResult.estimatedCostYen || 0
    }));
    setAiPendingPlaceResult(null);
    setAiPlaceQuery('');
  };

  const handleAISearchAcc = async () => {
    if (!aiAccQuery.trim()) return;
    setIsAISearching(true);
    setAiPendingAccResult(null);
    try {
      const res = await searchWithAI(aiAccQuery, 'accommodation');
      setAiPendingAccResult(res);
    } catch (err) {
      alert('Impossibile recuperare i dati con l\'AI al momento.');
    } finally {
      setIsAISearching(false);
    }
  };

  const handleConfirmAIAcc = () => {
    if (!aiPendingAccResult) return;
    setNewAcc(prev => ({
      ...prev,
      name: aiPendingAccResult.name + (aiPendingAccResult.officialNameJa ? ` (${aiPendingAccResult.officialNameJa})` : ''),
      city: aiPendingAccResult.city || 'Tokyo',
      address: aiPendingAccResult.address || '',
      cost: aiPendingAccResult.estimatedCostYen || 50000,
      notes: [
        aiPendingAccResult.notes,
        aiPendingAccResult.checkInTimes ? `Times: ${aiPendingAccResult.checkInTimes}` : '',
        aiPendingAccResult.phone ? `Tel: ${aiPendingAccResult.phone}` : ''
      ].filter(Boolean).join('\n')
    }));
    setAiPendingAccResult(null);
    setAiAccQuery('');
  };

  // --- Flight Handlers ---
  const handleOpenAddFlight = () => {
    setEditingFlightId(null);
    setNewFlight({
      airline: '',
      flightNumber: '',
      origin: '',
      destination: '',
      departureTime: '',
      arrivalTime: '',
      bookingRef: '',
      terminal: '',
      gate: '',
      seat: '',
      notes: '',
      layovers: []
    });
    setIsFlightModalOpen(true);
  };

  const handleOpenEditFlight = (flight: FlightTicket) => {
    setEditingFlightId(flight.id);
    setNewFlight({ ...flight, layovers: flight.layovers || [] });
    setIsFlightModalOpen(true);
  };

  const handleAddLayoverSegment = () => {
    const currentLayovers = newFlight.layovers || [];
    if (currentLayovers.length >= 3) return;
    const newSegment: LayoverSegment = {
      id: 'layover_' + Date.now(),
      airport: '',
      arrivalTime: '',
      departureTime: ''
    };
    setNewFlight({ ...newFlight, layovers: [...currentLayovers, newSegment] });
  };

  const handleRemoveLayoverSegment = (id: string) => {
    const currentLayovers = newFlight.layovers || [];
    setNewFlight({
      ...newFlight,
      layovers: currentLayovers.filter(l => l.id !== id)
    });
  };

  const handleUpdateLayoverSegment = (id: string, field: keyof LayoverSegment, value: string) => {
    const currentLayovers = newFlight.layovers || [];
    setNewFlight({
      ...newFlight,
      layovers: currentLayovers.map(l => l.id === id ? { ...l, [field]: value } : l)
    });
  };

  const handleSaveFlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    let updatedFlights: FlightTicket[];
    if (editingFlightId) {
      updatedFlights = data.flights.map(f => f.id === editingFlightId ? { ...f, ...newFlight } as FlightTicket : f);
    } else {
      const flightToSave: FlightTicket = {
        id: 'f_' + Date.now(),
        airline: newFlight.airline || 'Airlines',
        flightNumber: newFlight.flightNumber || 'FL-100',
        origin: newFlight.origin || 'Origine',
        destination: newFlight.destination || 'Destinazione',
        departureTime: newFlight.departureTime || new Date().toISOString().slice(0, 16),
        arrivalTime: newFlight.arrivalTime || new Date().toISOString().slice(0, 16),
        bookingRef: newFlight.bookingRef || 'PNR123',
        terminal: newFlight.terminal,
        gate: newFlight.gate,
        seat: newFlight.seat,
        notes: newFlight.notes,
        layovers: newFlight.layovers || []
      };
      updatedFlights = [...data.flights, flightToSave];
    }

    updateData({ ...data, flights: updatedFlights });
    setIsFlightModalOpen(false);
  };

  const handleDeleteFlight = (id: string) => {
    if (!data) return;
    if (confirm('Sei sicuro di voler eliminare questo volo?')) {
      updateData({ ...data, flights: data.flights.filter(f => f.id !== id) });
    }
  };

  // --- Accommodation Handlers ---
  const handleOpenAddAcc = () => {
    setEditingAccId(null);
    setNewAcc({
      name: '',
      address: '',
      city: 'Tokyo',
      checkIn: '',
      checkOut: '',
      bookingRef: '',
      cost: undefined,
      currency: 'JPY',
      notes: ''
    });
    setIsAccommodationModalOpen(true);
  };

  const handleOpenEditAcc = (acc: Accommodation) => {
    setEditingAccId(acc.id);
    setNewAcc({ ...acc });
    setIsAccommodationModalOpen(true);
  };

  const handleSaveAcc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    let updatedAccs: Accommodation[];
    if (editingAccId) {
      updatedAccs = data.accommodations.map(a => a.id === editingAccId ? { ...a, ...newAcc } as Accommodation : a);
    } else {
      const accToSave: Accommodation = {
        id: 'a_' + Date.now(),
        name: newAcc.name || 'Hotel',
        address: newAcc.address || 'Indirizzo',
        city: newAcc.city || 'Tokyo',
        checkIn: newAcc.checkIn || new Date().toISOString().slice(0, 10),
        checkOut: newAcc.checkOut || new Date().toISOString().slice(0, 10),
        bookingRef: newAcc.bookingRef,
        cost: newAcc.cost,
        currency: newAcc.currency || 'JPY',
        notes: newAcc.notes
      };
      updatedAccs = [...data.accommodations, accToSave];
    }

    updateData({ ...data, accommodations: updatedAccs });
    setIsAccommodationModalOpen(false);
  };

  const handleDeleteAcc = (id: string) => {
    if (!data) return;
    if (confirm('Sei sicuro di voler eliminare questo alloggio?')) {
      updateData({ ...data, accommodations: data.accommodations.filter(a => a.id !== id) });
    }
  };

  // --- Place Handlers ---
  const handleOpenAddPlace = () => {
    setEditingPlaceId(null);
    setNewPlace({
      name: '',
      category: 'Santuario/Tempio',
      city: 'Tokyo',
      address: '',
      priority: 'Alta',
      status: 'Da Visitare',
      notes: '',
      estimatedCostYen: 0
    });
    setIsPlaceModalOpen(true);
  };

  const handleOpenEditPlace = (place: PlaceToVisit) => {
    setEditingPlaceId(place.id);
    setNewPlace({ ...place });
    setIsPlaceModalOpen(true);
  };

  const handleSavePlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    let updatedPlaces: PlaceToVisit[];
    if (editingPlaceId) {
      updatedPlaces = data.places.map(p => p.id === editingPlaceId ? { ...p, ...newPlace } as PlaceToVisit : p);
    } else {
      const placeToSave: PlaceToVisit = {
        id: 'p_' + Date.now(),
        name: newPlace.name || 'Luogo da Visitare',
        category: newPlace.category || 'Santuario/Tempio',
        city: newPlace.city || 'Tokyo',
        address: newPlace.address,
        priority: newPlace.priority || 'Alta',
        status: newPlace.status || 'Da Visitare',
        notes: newPlace.notes,
        estimatedCostYen: newPlace.estimatedCostYen || 0
      };
      updatedPlaces = [...data.places, placeToSave];
    }

    updateData({ ...data, places: updatedPlaces });
    setIsPlaceModalOpen(false);
  };

  const handleAddSuggestedPlace = (suggestedPlace: PlaceToVisit) => {
    if (!data) return;
    updateData({ ...data, places: [...data.places, suggestedPlace] });
  };

  const handleDeletePlace = (id: string) => {
    if (!data) return;
    if (confirm('Sei sicuro di voler eliminare questo luogo?')) {
      updateData({ ...data, places: data.places.filter(p => p.id !== id) });
    }
  };

  if (!data) {
    return (
      <div className="p-12 text-center text-slate-400">
        Caricamento dati del viaggio...
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 text-left">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Gestore Viaggi AI
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            🇯🇵 TravelMind Hub Giappone & Viaggi
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Organizza voli con scali, alloggi, luoghi da visitare e il Diario di Viaggio AI.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleResetData}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
          >
            🔄 Ripristina Demo
          </button>
        </div>
      </div>

      {/* SINGLE MAIN SYNCHRONIZED MAP */}
      <MapComponent 
        itinerary={activeItinerary} 
        selectedDayNumber={selectedDayNumber} 
        onSelectDayChange={setSelectedDayNumber}
      />

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('flights')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === 'flights'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>✈️ Voli ({data.flights.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('accommodations')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === 'accommodations'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>🏨 Alloggi & Hotel ({data.accommodations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('places')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === 'places'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>📍 Luoghi ({data.places.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('itinerary')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            activeTab === 'itinerary'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>📖 Diario di Viaggio AI</span>
        </button>
      </div>

      {/* TAB 1: FLIGHTS */}
      {activeTab === 'flights' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-200">I Miei Voli & Carte d'Imbarco</h3>
            <button
              onClick={handleOpenAddFlight}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
            >
              + Aggiungi Volo ✈️
            </button>
          </div>

          {data.flights.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
              Nessun volo inserito. Clicca su "+ Aggiungi Volo" per iniziare.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {data.flights.map((flight) => (
                <div key={flight.id} className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 hover:border-slate-700 transition-all shadow-xl relative group">
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditFlight(flight)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer"
                    >
                      ✏️ Modifica
                    </button>
                    <button
                      onClick={() => handleDeleteFlight(flight.id)}
                      className="px-3 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-semibold rounded-lg border border-red-800/40 transition-all cursor-pointer"
                    >
                      🗑️ Elimina
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">✈️</span>
                        <div>
                          <h4 className="font-extrabold text-white text-lg">{flight.airline}</h4>
                          <span className="text-xs font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60">
                            Volo {flight.flightNumber}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-4 text-slate-200 font-semibold text-sm">
                        <span>{flight.origin}</span>
                        <span className="text-slate-500">➔</span>
                        <span>{flight.destination}</span>
                      </div>

                      <div className="mt-2 text-xs text-slate-400 space-y-1">
                        <div>🛫 Partenza Iniziale: <strong className="text-slate-200">{new Date(flight.departureTime).toLocaleString('it-IT')}</strong></div>
                        <div>🛬 Arrivo Finale: <strong className="text-slate-200">{new Date(flight.arrivalTime).toLocaleString('it-IT')}</strong></div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5 self-start md:self-auto min-w-[200px]">
                      <div>🎫 PNR: <strong className="text-indigo-300 font-mono">{flight.bookingRef}</strong></div>
                      {flight.terminal && <div>📍 Terminal: <strong className="text-slate-200">{flight.terminal}</strong></div>}
                      {flight.gate && <div>🚪 Gate: <strong className="text-slate-200">{flight.gate}</strong></div>}
                      {flight.seat && <div>💺 Posto: <strong className="text-emerald-400">{flight.seat}</strong></div>}
                    </div>
                  </div>

                  {/* Layovers Display */}
                  {flight.layovers && flight.layovers.length > 0 && (
                    <div className="mt-4 p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200 space-y-1.5">
                      <strong className="block text-purple-300 font-bold">
                        🔄 Scali Intermedi / Coincidenze ({flight.layovers.length}):
                      </strong>
                      {flight.layovers.map((l, i) => (
                        <div key={l.id} className="flex flex-col md:flex-row md:items-center gap-2">
                          <span className="font-semibold text-purple-200">• Scalo {i + 1}: 📍 {l.airport}</span>
                          <span className="text-[11px] text-slate-300">
                            (Atterraggio: {new Date(l.arrivalTime).toLocaleString('it-IT')} ➔ Ripartenza: {new Date(l.departureTime).toLocaleString('it-IT')})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {flight.notes && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 italic">
                      💡 {flight.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACCOMMODATIONS */}
      {activeTab === 'accommodations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-200">Alloggi & Hotel Prenotati</h3>
            <button
              onClick={handleOpenAddAcc}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
            >
              + Aggiungi Alloggio 🏨
            </button>
          </div>

          {data.accommodations.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
              Nessun alloggio inserito. Clicca su "+ Aggiungi Alloggio" per iniziare.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.accommodations.map((acc) => (
                <div key={acc.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-xl relative flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🏨</span>
                        <div>
                          <h4 className="font-extrabold text-white text-base">{acc.name}</h4>
                          <span className="text-xs text-indigo-400 font-semibold">📍 {acc.city}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditAcc(acc)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold rounded-lg border border-slate-700 cursor-pointer"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteAcc(acc.id)}
                          className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-semibold rounded-lg border border-red-800/40 cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-2">{acc.address}</p>

                    <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                      <div>📅 Check-in: <strong className="text-slate-200">{acc.checkIn}</strong></div>
                      <div>📅 Check-out: <strong className="text-slate-200">{acc.checkOut}</strong></div>
                      {acc.bookingRef && <div>🎫 Prenotazione: <strong className="text-indigo-300 font-mono">{acc.bookingRef}</strong></div>}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-400">{acc.notes}</span>
                    {acc.cost !== undefined && (
                      <span className="text-sm font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-800/40">
                        {acc.cost.toLocaleString()} {acc.currency || 'JPY'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PLACES TO VISIT */}
      {activeTab === 'places' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-200">Luoghi & Attrazioni da Visitare</h3>
            <button
              onClick={handleOpenAddPlace}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
            >
              + Aggiungi Luogo 📍
            </button>
          </div>

          {data.places.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
              Nessun luogo inserito. Clicca su "+ Aggiungi Luogo" per iniziare.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.places.map((place) => (
                <div key={place.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-xl relative flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {place.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditPlace(place)}
                          className="px-2 py-0.5 bg-slate-800 text-blue-300 text-xs font-semibold rounded cursor-pointer"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeletePlace(place.id)}
                          className="px-2 py-0.5 bg-red-950/40 text-red-400 text-xs font-semibold rounded cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <h4 className="font-extrabold text-white text-base mt-2">{place.name}</h4>
                    <p className="text-xs text-indigo-400 font-semibold mt-0.5">📍 {place.city}</p>

                    {place.address && (
                      <p className="text-xs text-slate-400 mt-2">{place.address}</p>
                    )}

                    {place.notes && (
                      <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 mt-3 whitespace-pre-line">
                        {place.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-400">Priorità: {place.priority}</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {place.estimatedCostYen === 0 ? 'Gratuito' : `¥${place.estimatedCostYen?.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AI ITINERARY GENERATOR */}
      {activeTab === 'itinerary' && (
        <AIItineraryGenerator 
          travelData={data} 
          onAddSuggestedPlace={handleAddSuggestedPlace} 
          onItineraryChange={setActiveItinerary}
          onSelectDayChange={setSelectedDayNumber}
        />
      )}

      {/* MODAL 1: FLIGHT WITH MULTI-LAYOVER SUPPORT */}
      {isFlightModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white">
              {editingFlightId ? '✏️ Modifica Volo' : '✈️ Inserisci Nuovo Volo'}
            </h3>

            <form onSubmit={handleSaveFlight} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Compagnia Aerea</label>
                  <input
                    type="text"
                    required
                    placeholder="es. ITA Airways / Etihad"
                    value={newFlight.airline}
                    onChange={e => setNewFlight({ ...newFlight, airline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Numero Volo</label>
                  <input
                    type="text"
                    required
                    placeholder="es. AZ 788"
                    value={newFlight.flightNumber}
                    onChange={e => setNewFlight({ ...newFlight, flightNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Aeroporto Partenza Iniziale</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Milano (MXP)"
                    value={newFlight.origin}
                    onChange={e => setNewFlight({ ...newFlight, origin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Aeroporto Arrivo Finale</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Tokyo Haneda (HND)"
                    value={newFlight.destination}
                    onChange={e => setNewFlight({ ...newFlight, destination: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Data/Ora Partenza Iniziale</label>
                  <input
                    type="datetime-local"
                    required
                    value={newFlight.departureTime}
                    onChange={e => setNewFlight({ ...newFlight, departureTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Data/Ora Arrivo Finale</label>
                  <input
                    type="datetime-local"
                    required
                    value={newFlight.arrivalTime}
                    onChange={e => setNewFlight({ ...newFlight, arrivalTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* DYNAMIC LAYOVERS SECTION (1, 2 or 3 layover segments) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-purple-300 font-bold">
                    🔄 Scali Intermedi / Coincidenze ({newFlight.layovers?.length || 0}/3)
                  </label>
                  {(newFlight.layovers?.length || 0) < 3 && (
                    <button
                      type="button"
                      onClick={handleAddLayoverSegment}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      ➕ Aggiungi Scalo
                    </button>
                  )}
                </div>

                {newFlight.layovers && newFlight.layovers.length > 0 ? (
                  newFlight.layovers.map((layover, index) => (
                    <div key={layover.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 relative">
                      <div className="flex items-center justify-between font-bold text-slate-300">
                        <span>Scalo {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLayoverSegment(layover.id)}
                          className="text-red-400 hover:text-red-300 text-xs cursor-pointer"
                        >
                          🗑️ Rimuovi
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-slate-400 text-[10px]">Aeroporto Scalo</label>
                          <input
                            type="text"
                            placeholder="es. Abu Dhabi (AUH)"
                            value={layover.airport}
                            onChange={e => handleUpdateLayoverSegment(layover.id, 'airport', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[10px]">Ora Atterraggio Scalo</label>
                          <input
                            type="datetime-local"
                            value={layover.arrivalTime}
                            onChange={e => handleUpdateLayoverSegment(layover.id, 'arrivalTime', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[10px]">Ora Ripartenza Scalo</label>
                          <input
                            type="datetime-local"
                            value={layover.departureTime}
                            onChange={e => handleUpdateLayoverSegment(layover.id, 'departureTime', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Nessun volo di scalo aggiunto. Clicca su "+ Aggiungi Scalo" se il tuo volo prevede coincidenze.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Codice PNR</label>
                  <input
                    type="text"
                    placeholder="es. ABC123"
                    value={newFlight.bookingRef}
                    onChange={e => setNewFlight({ ...newFlight, bookingRef: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Terminal</label>
                  <input
                    type="text"
                    placeholder="T1"
                    value={newFlight.terminal}
                    onChange={e => setNewFlight({ ...newFlight, terminal: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Posto</label>
                  <input
                    type="text"
                    placeholder="14A"
                    value={newFlight.seat}
                    onChange={e => setNewFlight({ ...newFlight, seat: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Note e Carte d'Imbarco</label>
                <textarea
                  rows={2}
                  placeholder="es. Bagaglio 23kg incluso..."
                  value={newFlight.notes}
                  onChange={e => setNewFlight({ ...newFlight, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFlightModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 shadow-md cursor-pointer"
                >
                  {editingFlightId ? 'Salva Modifiche' : 'Salva Volo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ACCOMMODATION WITH AI AUTOCOMPLETE */}
      {isAccommodationModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white">
              {editingAccId ? '✏️ Modifica Alloggio' : '🏨 Inserisci Nuovo Alloggio'}
            </h3>

            {/* AI Search Section for Accommodations */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 space-y-3">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                <span>✨ Cerca & Autocompila Hotel con AI</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="es. Shinjuku Prince Hotel Tokyo..."
                  value={aiAccQuery}
                  onChange={e => setAiAccQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAISearchAcc(); }}}
                  className="flex-1 bg-slate-950/80 border border-indigo-500/40 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={handleAISearchAcc}
                  disabled={isAISearching}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isAISearching ? 'Ricerca...' : '🔍 Cerca'}
                </button>
              </div>

              {/* AI Pending Result Confirmation Box */}
              {aiPendingAccResult && (
                <div className="p-4 rounded-xl bg-slate-900 border border-indigo-400/50 space-y-3 text-xs text-slate-200 animate-fadeIn">
                  <div className="flex justify-between items-center text-amber-400 font-bold border-b border-slate-800 pb-2">
                    <span>🤖 Risultato Trovato dall'AI:</span>
                    <span className="text-[10px] text-slate-400 font-normal">Confermi sia questo l'hotel?</span>
                  </div>

                  <div>
                    <h5 className="font-extrabold text-white text-sm">{aiPendingAccResult.name}</h5>
                    <p className="text-slate-400 text-xs mt-0.5">📍 {aiPendingAccResult.city} • {aiPendingAccResult.address}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmAIAcc}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all text-center cursor-pointer"
                    >
                      ✅ Sì, compila modulo
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiPendingAccResult(null)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                    >
                      ❌ No
                    </button>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveAcc} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nome Struttura</label>
                <input
                  type="text"
                  required
                  placeholder="es. Shinjuku Prince Hotel"
                  value={newAcc.name}
                  onChange={e => setNewAcc({ ...newAcc, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Città</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Tokyo"
                    value={newAcc.city}
                    onChange={e => setNewAcc({ ...newAcc, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Costo (JPY)</label>
                  <input
                    type="number"
                    placeholder="65000"
                    value={newAcc.cost || ''}
                    onChange={e => setNewAcc({ ...newAcc, cost: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Indirizzo Completo</label>
                <input
                  type="text"
                  required
                  placeholder="es. Kabukicho, Shinjuku"
                  value={newAcc.address}
                  onChange={e => setNewAcc({ ...newAcc, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Data Check-in</label>
                  <input
                    type="date"
                    required
                    value={newAcc.checkIn}
                    onChange={e => setNewAcc({ ...newAcc, checkIn: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Data Check-out</label>
                  <input
                    type="date"
                    required
                    value={newAcc.checkOut}
                    onChange={e => setNewAcc({ ...newAcc, checkOut: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Codice Prenotazione</label>
                <input
                  type="text"
                  placeholder="es. HTL-987654"
                  value={newAcc.bookingRef}
                  onChange={e => setNewAcc({ ...newAcc, bookingRef: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Note e Orari Check-in</label>
                <textarea
                  rows={2}
                  placeholder="es. Check-in dalle 15:00..."
                  value={newAcc.notes}
                  onChange={e => setNewAcc({ ...newAcc, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAccommodationModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 shadow-md cursor-pointer"
                >
                  {editingAccId ? 'Salva Modifiche' : 'Salva Alloggio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PLACE TO VISIT WITH AI AUTOCOMPLETE */}
      {isPlaceModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white">
              {editingPlaceId ? '✏️ Modifica Luogo da Visitare' : '📍 Inserisci Luogo da Visitare'}
            </h3>

            {/* AI Search Section for Places */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 space-y-3">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                <span>✨ Cerca & Autocompila Luogo con AI</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="es. Tempio Sensoji Asakusa..."
                  value={aiPlaceQuery}
                  onChange={e => setAiPlaceQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAISearchPlace(); }}}
                  className="flex-1 bg-slate-950/80 border border-indigo-500/40 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={handleAISearchPlace}
                  disabled={isAISearching}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isAISearching ? 'Ricerca...' : '🔍 Cerca'}
                </button>
              </div>

              {/* AI Pending Result Confirmation Box */}
              {aiPendingPlaceResult && (
                <div className="p-4 rounded-xl bg-slate-900 border border-indigo-400/50 space-y-3 text-xs text-slate-200 animate-fadeIn">
                  <div className="flex justify-between items-center text-amber-400 font-bold border-b border-slate-800 pb-2">
                    <span>🤖 Risultato Trovato dall'AI:</span>
                    <span className="text-[10px] text-slate-400 font-normal">Confermi sia questo il luogo?</span>
                  </div>

                  <div>
                    <h5 className="font-extrabold text-white text-sm">{aiPendingPlaceResult.name}</h5>
                    <p className="text-slate-400 text-xs mt-0.5">📍 {aiPendingPlaceResult.city} • {aiPendingPlaceResult.address}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmAIPlace}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all text-center cursor-pointer"
                    >
                      ✅ Sì, compila modulo
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiPendingPlaceResult(null)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                    >
                      ❌ No
                    </button>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSavePlace} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nome del Luogo</label>
                <input
                  type="text"
                  required
                  placeholder="es. Fushimi Inari Taisha"
                  value={newPlace.name}
                  onChange={e => setNewPlace({ ...newPlace, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Categoria</label>
                  <select
                    value={newPlace.category}
                    onChange={e => setNewPlace({ ...newPlace, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Santuario/Tempio">Santuario/Tempio ⛩️</option>
                    <option value="Ristorante/Cibo">Ristorante/Cibo 🍜</option>
                    <option value="Museo/Cultura">Museo/Cultura 🏛️</option>
                    <option value="Quartiere/Shopping">Quartiere/Shopping 🛍️</option>
                    <option value="Natura/Parco">Natura/Parco 🌸</option>
                    <option value="Altro">Altro 📍</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Città</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Kyoto"
                    value={newPlace.city}
                    onChange={e => setNewPlace({ ...newPlace, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Priorità</label>
                  <select
                    value={newPlace.priority}
                    onChange={e => setNewPlace({ ...newPlace, priority: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Alta">Alta 🔥</option>
                    <option value="Media">Media ⭐️</option>
                    <option value="Bassa">Bassa 💡</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Indirizzo o Quartiere</label>
                  <input
                    type="text"
                    placeholder="es. Shibuya"
                    value={newPlace.address}
                    onChange={e => setNewPlace({ ...newPlace, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Note, Orari e Dettagli</label>
                <textarea
                  rows={3}
                  placeholder="es. Visitare all'alba..."
                  value={newPlace.notes}
                  onChange={e => setNewPlace({ ...newPlace, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPlaceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 shadow-md cursor-pointer"
                >
                  {editingPlaceId ? 'Salva Modifiche' : 'Salva Luogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
