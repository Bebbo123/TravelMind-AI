'use client';

import React, { useState, useEffect } from 'react';
import { TravelData, FlightTicket, Accommodation, PlaceToVisit } from '../types/travel';
import { loadTravelData, saveTravelData, resetTravelData } from '../utils/travelStorage';

type ActiveTab = 'flights' | 'accommodations' | 'places';

export default function TravelHub() {
  const [data, setData] = useState<TravelData | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('flights');
  
  // Modal states
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [isAccommodationModalOpen, setIsAccommodationModalOpen] = useState(false);
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);

  // Edit Tracking States
  const [editingFlightId, setEditingFlightId] = useState<string | null>(null);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);

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
    notes: ''
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
    }
  };

  // --- Flight Operations ---
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
      notes: ''
    });
    setIsFlightModalOpen(true);
  };

  const handleOpenEditFlight = (flight: FlightTicket) => {
    setEditingFlightId(flight.id);
    setNewFlight({
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      origin: flight.origin,
      destination: flight.destination,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      bookingRef: flight.bookingRef,
      terminal: flight.terminal || '',
      gate: flight.gate || '',
      seat: flight.seat || '',
      notes: flight.notes || ''
    });
    setIsFlightModalOpen(true);
  };

  const handleSaveFlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !newFlight.flightNumber || !newFlight.origin || !newFlight.destination) return;

    if (editingFlightId) {
      // Editing existing flight
      const updatedFlights = data.flights.map(f => {
        if (f.id === editingFlightId) {
          return {
            ...f,
            airline: newFlight.airline || 'Compagnia Aerea',
            flightNumber: newFlight.flightNumber!,
            origin: newFlight.origin!,
            destination: newFlight.destination!,
            departureTime: newFlight.departureTime || f.departureTime,
            arrivalTime: newFlight.arrivalTime || f.arrivalTime,
            bookingRef: newFlight.bookingRef || 'N/A',
            terminal: newFlight.terminal || '',
            gate: newFlight.gate || '',
            seat: newFlight.seat || '',
            notes: newFlight.notes || ''
          };
        }
        return f;
      });

      updateData({ ...data, flights: updatedFlights });
    } else {
      // Creating new flight
      const flight: FlightTicket = {
        id: 'f_' + Date.now(),
        airline: newFlight.airline || 'Compagnia Aerea',
        flightNumber: newFlight.flightNumber,
        origin: newFlight.origin,
        destination: newFlight.destination,
        departureTime: newFlight.departureTime || new Date().toISOString().slice(0, 16),
        arrivalTime: newFlight.arrivalTime || new Date().toISOString().slice(0, 16),
        bookingRef: newFlight.bookingRef || 'N/A',
        terminal: newFlight.terminal || '',
        gate: newFlight.gate || '',
        seat: newFlight.seat || '',
        notes: newFlight.notes || ''
      };

      updateData({ ...data, flights: [...data.flights, flight] });
    }

    setIsFlightModalOpen(false);
    setEditingFlightId(null);
  };

  const handleDeleteFlight = (id: string) => {
    if (!data) return;
    if (confirm('Sei sicuro di voler eliminare questo volo?')) {
      updateData({
        ...data,
        flights: data.flights.filter(f => f.id !== id)
      });
    }
  };

  // --- Accommodation Operations ---
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
    setNewAcc({
      name: acc.name,
      address: acc.address,
      city: acc.city,
      checkIn: acc.checkIn,
      checkOut: acc.checkOut,
      bookingRef: acc.bookingRef || '',
      cost: acc.cost,
      currency: acc.currency || 'JPY',
      notes: acc.notes || ''
    });
    setIsAccommodationModalOpen(true);
  };

  const handleSaveAccommodation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !newAcc.name || !newAcc.checkIn || !newAcc.checkOut) return;

    if (editingAccId) {
      // Editing existing accommodation
      const updatedAccs = data.accommodations.map(a => {
        if (a.id === editingAccId) {
          return {
            ...a,
            name: newAcc.name!,
            address: newAcc.address || '',
            city: newAcc.city || 'Tokyo',
            checkIn: newAcc.checkIn!,
            checkOut: newAcc.checkOut!,
            bookingRef: newAcc.bookingRef || '',
            cost: newAcc.cost ? Number(newAcc.cost) : undefined,
            currency: 'JPY',
            notes: newAcc.notes || ''
          };
        }
        return a;
      });

      updateData({ ...data, accommodations: updatedAccs });
    } else {
      // Creating new accommodation
      const acc: Accommodation = {
        id: 'a_' + Date.now(),
        name: newAcc.name,
        address: newAcc.address || '',
        city: newAcc.city || 'Tokyo',
        checkIn: newAcc.checkIn,
        checkOut: newAcc.checkOut,
        bookingRef: newAcc.bookingRef || '',
        cost: newAcc.cost ? Number(newAcc.cost) : undefined,
        currency: 'JPY',
        notes: newAcc.notes || ''
      };

      updateData({ ...data, accommodations: [...data.accommodations, acc] });
    }

    setIsAccommodationModalOpen(false);
    setEditingAccId(null);
  };

  const handleDeleteAcc = (id: string) => {
    if (!data) return;
    if (confirm('Sei sicuro di voler eliminare questa prenotazione di alloggio?')) {
      updateData({
        ...data,
        accommodations: data.accommodations.filter(a => a.id !== id)
      });
    }
  };

  // --- Place Operations ---
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
    setNewPlace({
      name: place.name,
      category: place.category,
      city: place.city,
      address: place.address || '',
      priority: place.priority,
      status: place.status,
      notes: place.notes || '',
      estimatedCostYen: place.estimatedCostYen || 0
    });
    setIsPlaceModalOpen(true);
  };

  const handleSavePlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !newPlace.name) return;

    if (editingPlaceId) {
      // Editing existing place
      const updatedPlaces = data.places.map(p => {
        if (p.id === editingPlaceId) {
          return {
            ...p,
            name: newPlace.name!,
            category: newPlace.category || 'Santuario/Tempio',
            city: newPlace.city || 'Tokyo',
            address: newPlace.address || '',
            priority: newPlace.priority || 'Alta',
            notes: newPlace.notes || '',
            estimatedCostYen: newPlace.estimatedCostYen ? Number(newPlace.estimatedCostYen) : 0
          };
        }
        return p;
      });

      updateData({ ...data, places: updatedPlaces });
    } else {
      // Creating new place
      const place: PlaceToVisit = {
        id: 'p_' + Date.now(),
        name: newPlace.name,
        category: newPlace.category || 'Santuario/Tempio',
        city: newPlace.city || 'Tokyo',
        address: newPlace.address || '',
        priority: newPlace.priority || 'Alta',
        status: 'Da Visitare',
        notes: newPlace.notes || '',
        estimatedCostYen: newPlace.estimatedCostYen ? Number(newPlace.estimatedCostYen) : 0
      };

      updateData({ ...data, places: [...data.places, place] });
    }

    setIsPlaceModalOpen(false);
    setEditingPlaceId(null);
  };

  const handleTogglePlaceStatus = (id: string) => {
    if (!data) return;
    updateData({
      ...data,
      places: data.places.map(p => 
        p.id === id 
          ? { ...p, status: p.status === 'Da Visitare' ? 'Visitato' : 'Da Visitare' } 
          : p
      )
    });
  };

  const handleDeletePlace = (id: string) => {
    if (!data) return;
    if (confirm('Sei sicuro di voler eliminare questo luogo dalla tua lista?')) {
      updateData({
        ...data,
        places: data.places.filter(p => p.id !== id)
      });
    }
  };

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-400">
        Caricamento documenti di viaggio... 🧳
      </div>
    );
  }

  return (
    <div id="travel-hub" className="w-full max-w-6xl mx-auto rounded-3xl bg-slate-900/80 border border-slate-800 p-6 md:p-8 backdrop-blur-xl shadow-2xl text-left">
      
      {/* Header & Section Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-blue-400 uppercase tracking-wider">
            <span>🧳 Documenti & Prenotazioni Viaggio</span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px]">
              Offline Sync Attivo
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Travel Planner & Carte d'Imbarco
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Inserisci e modifica tutti i dettagli dei tuoi voli, prenotazioni alloggi e luoghi da esplorare.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="self-start md:self-auto px-4 py-2 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
        >
          🔄 Ripristina Dati Esempio
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-3 mb-8 border-b border-slate-800/80 pb-4">
        <button
          onClick={() => setActiveTab('flights')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'flights'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>✈️ Voli & Carte Imbarco</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-900/60 border border-slate-700">
            {data.flights.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('accommodations')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'accommodations'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>🏨 Alloggi & Hotel</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-900/60 border border-slate-700">
            {data.accommodations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('places')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'places'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>📍 Luoghi da Visitare</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-900/60 border border-slate-700">
            {data.places.length}
          </span>
        </button>
      </div>

      {/* TAB 1: FLIGHTS */}
      {activeTab === 'flights' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-200">I Miei Voli & Carte d'Imbarco</h3>
            <button
              onClick={handleOpenAddFlight}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
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
                  
                  {/* Action Buttons: Edit & Delete */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditFlight(flight)}
                      className="text-slate-400 hover:text-blue-400 text-xs px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-all flex items-center gap-1 border border-slate-700/60"
                      title="Modifica volo"
                    >
                      ✏️ Modifica
                    </button>
                    <button
                      onClick={() => handleDeleteFlight(flight.id)}
                      className="text-slate-500 hover:text-rose-400 text-xs p-1 rounded-lg hover:bg-rose-950/30 transition-all"
                      title="Elimina volo"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pr-24">
                    {/* Airline & Route */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-xs rounded-full">
                          {flight.airline}
                        </span>
                        <span className="text-slate-300 font-mono text-sm font-semibold">
                          Volo {flight.flightNumber}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xl md:text-2xl font-black text-white mt-3">
                        <span>{flight.origin}</span>
                        <span className="text-blue-400 text-base">➔</span>
                        <span>{flight.destination}</span>
                      </div>
                    </div>

                    {/* Flight Times & Boarding Pass Details */}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-300 bg-slate-800/40 p-4 rounded-xl border border-slate-800/80">
                      <div>
                        <span className="block text-slate-500 text-[10px] uppercase font-semibold">Partenza</span>
                        <span className="font-semibold text-slate-200">{new Date(flight.departureTime).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <div className="border-l border-slate-700/60 pl-4">
                        <span className="block text-slate-500 text-[10px] uppercase font-semibold">Arrivo</span>
                        <span className="font-semibold text-slate-200">{new Date(flight.arrivalTime).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <div className="border-l border-slate-700/60 pl-4">
                        <span className="block text-slate-500 text-[10px] uppercase font-semibold">PNR / Booking</span>
                        <span className="font-mono font-bold text-amber-400">{flight.bookingRef}</span>
                      </div>
                      {flight.seat && (
                        <div className="border-l border-slate-700/60 pl-4">
                          <span className="block text-slate-500 text-[10px] uppercase font-semibold">Posto</span>
                          <span className="font-semibold text-emerald-400">{flight.seat}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes / Boarding info */}
                  {flight.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-start gap-2">
                      <span>📌</span>
                      <span>{flight.notes}</span>
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
            <h3 className="text-lg font-bold text-slate-200">Prenotazioni Alloggi & Hotel</h3>
            <button
              onClick={handleOpenAddAcc}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
            >
              + Aggiungi Alloggio 🏨
            </button>
          </div>

          {data.accommodations.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
              Nessun alloggio inserito. Clicca su "+ Aggiungi Alloggio" per registrare le tue soste.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.accommodations.map((acc) => {
                const checkInDate = new Date(acc.checkIn);
                const checkOutDate = new Date(acc.checkOut);
                const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

                return (
                  <div key={acc.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-xl relative flex flex-col justify-between">
                    
                    {/* Action Buttons: Edit & Delete */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditAcc(acc)}
                        className="text-slate-400 hover:text-blue-400 text-xs px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-all flex items-center gap-1 border border-slate-700/60"
                        title="Modifica alloggio"
                      >
                        ✏️ Modifica
                      </button>
                      <button
                        onClick={() => handleDeleteAcc(acc.id)}
                        className="text-slate-500 hover:text-rose-400 text-xs p-1 rounded-lg hover:bg-rose-950/30 transition-all"
                        title="Elimina alloggio"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="pr-24">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-xs rounded-full">
                          📍 {acc.city}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                          🌙 {diffDays} {diffDays === 1 ? 'Notte' : 'Notti'}
                        </span>
                      </div>

                      <h4 className="text-xl font-bold text-white mb-2">{acc.name}</h4>
                      <p className="text-slate-400 text-xs mb-4 flex items-center gap-1">
                        🗺️ {acc.address}
                      </p>

                      <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-xs mb-4">
                        <div>
                          <span className="block text-slate-500 text-[10px] uppercase font-semibold">Check-In</span>
                          <span className="font-semibold text-emerald-400">{acc.checkIn}</span>
                        </div>
                        <div>
                          <span className="block text-slate-500 text-[10px] uppercase font-semibold">Check-Out</span>
                          <span className="font-semibold text-rose-400">{acc.checkOut}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      {acc.bookingRef && (
                        <span>Cod. Prenotazione: <strong className="text-slate-200">{acc.bookingRef}</strong></span>
                      )}
                      {acc.cost !== undefined && (
                        <span className="text-emerald-400 font-bold ml-auto">
                          ¥{acc.cost.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PLACES TO VISIT */}
      {activeTab === 'places' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-200">Lista Luoghi & Tappe da Visitare</h3>
            <button
              onClick={handleOpenAddPlace}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
            >
              + Aggiungi Luogo 📍
            </button>
          </div>

          {data.places.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
              Nessun luogo inserito nella tua lista desideri. Clicca su "+ Aggiungi Luogo".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.places.map((place) => (
                <div 
                  key={place.id} 
                  className={`p-5 rounded-2xl border transition-all shadow-lg flex flex-col justify-between relative group ${
                    place.status === 'Visitato'
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-75'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3 pr-8">
                      <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold text-[11px] rounded-full">
                        {place.category}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        place.priority === 'Alta' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        place.priority === 'Media' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        Priorità {place.priority}
                      </span>
                    </div>

                    <h4 className={`text-lg font-bold mb-1 ${place.status === 'Visitato' ? 'line-through text-slate-400' : 'text-white'}`}>
                      {place.name}
                    </h4>
                    <p className="text-xs text-slate-400 mb-3 font-medium">📍 {place.city} {place.address ? `• ${place.address}` : ''}</p>

                    {place.notes && (
                      <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4 leading-relaxed">
                        {place.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => handleTogglePlaceStatus(place.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        place.status === 'Visitato'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {place.status === 'Visitato' ? '✓ Visitato' : '⭕ Segna come Visitato'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditPlace(place)}
                        className="text-slate-400 hover:text-blue-400 text-xs px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60"
                        title="Modifica luogo"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeletePlace(place.id)}
                        className="text-slate-500 hover:text-rose-400 text-xs p-1 rounded-lg"
                        title="Elimina luogo"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD/EDIT FLIGHT */}
      {isFlightModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingFlightId ? '✏️ Modifica Volo / Carta Imbarco' : '✈️ Aggiungi Volo / Carta Imbarco'}
              </h3>
              <button onClick={() => setIsFlightModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveFlight} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Compagnia Aerea</label>
                  <input
                    type="text"
                    required
                    placeholder="es. ITA Airways / ANA"
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
                    placeholder="es. NH 208"
                    value={newFlight.flightNumber}
                    onChange={e => setNewFlight({ ...newFlight, flightNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Aeroporto Partenza</label>
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
                  <label className="block text-slate-400 mb-1">Aeroporto Arrivo</label>
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
                  <label className="block text-slate-400 mb-1">Data & Ora Partenza</label>
                  <input
                    type="datetime-local"
                    value={newFlight.departureTime}
                    onChange={e => setNewFlight({ ...newFlight, departureTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Data & Ora Arrivo</label>
                  <input
                    type="datetime-local"
                    value={newFlight.arrivalTime}
                    onChange={e => setNewFlight({ ...newFlight, arrivalTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Codice PNR/Booking</label>
                  <input
                    type="text"
                    placeholder="es. XYZ123"
                    value={newFlight.bookingRef}
                    onChange={e => setNewFlight({ ...newFlight, bookingRef: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Terminal/Gate</label>
                  <input
                    type="text"
                    placeholder="es. T1 / B22"
                    value={newFlight.terminal}
                    onChange={e => setNewFlight({ ...newFlight, terminal: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Posto</label>
                  <input
                    type="text"
                    placeholder="es. 14A"
                    value={newFlight.seat}
                    onChange={e => setNewFlight({ ...newFlight, seat: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Note Imbarco / Bagaglio</label>
                <textarea
                  rows={2}
                  placeholder="es. Bagaglio 23kg, QR code salvato nel wallet..."
                  value={newFlight.notes}
                  onChange={e => setNewFlight({ ...newFlight, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFlightModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 shadow-md"
                >
                  {editingFlightId ? 'Salva Modifiche' : 'Salva Volo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT ACCOMMODATION */}
      {isAccommodationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingAccId ? '✏️ Modifica Alloggio / Hotel' : '🏨 Aggiungi Alloggio / Hotel'}
              </h3>
              <button onClick={() => setIsAccommodationModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveAccommodation} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nome Struttura / Hotel</label>
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
                  <label className="block text-slate-400 mb-1">Indirizzo completo</label>
                  <input
                    type="text"
                    placeholder="es. 1-30-1 Kabukicho"
                    value={newAcc.address}
                    onChange={e => setNewAcc({ ...newAcc, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Data Check-In</label>
                  <input
                    type="date"
                    required
                    value={newAcc.checkIn}
                    onChange={e => setNewAcc({ ...newAcc, checkIn: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Data Check-Out</label>
                  <input
                    type="date"
                    required
                    value={newAcc.checkOut}
                    onChange={e => setNewAcc({ ...newAcc, checkOut: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-slate-400 mb-1">Costo (JPY)</label>
                  <input
                    type="number"
                    placeholder="es. 65000"
                    value={newAcc.cost || ''}
                    onChange={e => setNewAcc({ ...newAcc, cost: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Note (es. colazione, orari check-in)</label>
                <textarea
                  rows={2}
                  placeholder="es. Pagato in anticipo. Reception 24h..."
                  value={newAcc.notes}
                  onChange={e => setNewAcc({ ...newAcc, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAccommodationModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 shadow-md"
                >
                  {editingAccId ? 'Salva Modifiche' : 'Salva Alloggio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD/EDIT PLACE TO VISIT */}
      {isPlaceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingPlaceId ? '✏️ Modifica Luogo da Visitare' : '📍 Aggiungi Luogo da Visitare'}
              </h3>
              <button onClick={() => setIsPlaceModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSavePlace} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nome Luogo / Attraction</label>
                <input
                  type="text"
                  required
                  placeholder="es. Santuario Meiji Jingu"
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
                    <option value="Ristorante/Cibo">Ristorante/Cibo 🍣</option>
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
                    placeholder="es. Tokyo"
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
                <label className="block text-slate-400 mb-1">Note e Orari Consigliati</label>
                <textarea
                  rows={2}
                  placeholder="es. Visitare all'alba per scattare foto senza folla..."
                  value={newPlace.notes}
                  onChange={e => setNewPlace({ ...newPlace, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPlaceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 shadow-md"
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
