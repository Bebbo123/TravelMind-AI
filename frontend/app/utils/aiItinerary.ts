import { TravelData, FlightTicket } from '../types/travel';

export interface AIItineraryItem {
  time: string;
  activity: string;
  type: 'place' | 'transit' | 'meal' | 'break';
  placeName?: string;
  transitDetail?: string;
  mealSuggestion?: string;
  costEstimateYen?: number;
  feasibilityWarning?: string;
  transitType?: 'flight' | 'train' | 'bus' | 'walk';
}

export interface AIDaySchedule {
  dayNumber: number;
  date: string;          // ISO YYYY-MM-DD
  formattedDate: string; // Italian formatted DD/MM/YYYY
  title: string;
  city: string;
  accommodationName?: string;
  timeline: AIItineraryItem[];
  dailyFeasibilitySummary: string;
}

export interface AIPlaceSuggestion {
  id: string;
  name: string;
  officialNameJa?: string;
  category: 'Santuario/Tempio' | 'Ristorante/Cibo' | 'Museo/Cultura' | 'Quartiere/Shopping' | 'Natura/Parco' | 'Altro';
  city: string;
  address: string;
  reason: string;
  estimatedCostYen: number;
}

export interface AIItineraryResponse {
  globalFeasibilityRating: 'Ottima' | 'Accettabile' | 'Troppo Densa' | 'Critica';
  globalFeasibilityNotes: string;
  days: AIDaySchedule[];
  suggestedNewPlaces: AIPlaceSuggestion[];
}

export interface TripPreferences {
  startDate: string;
  endDate: string;
  pace: 'Relax' | 'Equilibrato' | 'Intenso' | 'Ultra-Esploratore';
  interests: string[];
  customInstructions: string;
}

export function formatItalianDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function inferTripDates(tripData: TravelData): { startDate: string; endDate: string } {
  let startDate = '2026-10-22';
  let endDate = '2026-11-07';

  const sortedFlights = [...(tripData.flights || [])].sort(
    (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
  );

  if (sortedFlights.length > 0) {
    if (sortedFlights[0].departureTime) {
      startDate = sortedFlights[0].departureTime.slice(0, 10);
    }
    const lastFlight = sortedFlights[sortedFlights.length - 1];
    if (lastFlight.arrivalTime || lastFlight.departureTime) {
      endDate = (lastFlight.arrivalTime || lastFlight.departureTime).slice(0, 10);
    }
  } else if (tripData.accommodations && tripData.accommodations.length > 0) {
    startDate = tripData.accommodations[0].checkIn;
    const lastAcc = tripData.accommodations[tripData.accommodations.length - 1];
    if (lastAcc.checkOut) {
      endDate = lastAcc.checkOut;
    }
  }

  return { startDate, endDate };
}

export async function generateAIItinerary(
  tripData: TravelData,
  preferences?: TripPreferences
): Promise<AIItineraryResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  if (backendUrl) {
    try {
      const response = await fetch(`${backendUrl}/ai/generate-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripData, preferences })
      });
      if (response.ok) {
        const json = await response.json();
        if (json.data) {
          const formattedDays = (json.data.days || []).map((d: any) => ({
            ...d,
            formattedDate: formatItalianDate(d.date)
          }));
          return { ...json.data, days: formattedDays };
        }
      }
    } catch (err) {
      console.warn('Backend AI itinerary service unavailable, using client engine fallback:', err);
    }
  }

  // --- Dynamic Multi-Flight & Multi-City Date Matcher Engine ---
  const dates = preferences ? { startDate: preferences.startDate, endDate: preferences.endDate } : inferTripDates(tripData);
  
  const start = new Date(dates.startDate || '2026-10-22');
  const end = new Date(dates.endDate || '2026-11-07');
  
  let totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (isNaN(totalDays) || totalDays < 1) totalDays = 7;
  if (totalDays > 40) totalDays = 40;

  const flights = [...(tripData.flights || [])].sort(
    (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
  );
  const accs = tripData.accommodations || [];
  const places = tripData.places || [];

  const days: AIDaySchedule[] = [];
  let previousAccName = '';

  for (let i = 0; i < totalDays; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dateStr = current.toISOString().slice(0, 10);
    const formattedDate = formatItalianDate(dateStr);
    const dayNumber = i + 1;

    // 1. Find flights matching this date (departure, arrival, or layover)
    const activeFlightOnDate = flights.find(f => {
      const depDate = f.departureTime ? f.departureTime.slice(0, 10) : '';
      const arrDate = f.arrivalTime ? f.arrivalTime.slice(0, 10) : '';
      if (depDate === dateStr || arrDate === dateStr) return true;
      if (f.layovers) {
        return f.layovers.some(l => 
          (l.arrivalTime && l.arrivalTime.slice(0, 10) === dateStr) || 
          (l.departureTime && l.departureTime.slice(0, 10) === dateStr)
        );
      }
      return false;
    });

    // 2. Find accommodation active on this date
    const currentAcc = accs.find(a => {
      if (!a.checkIn || !a.checkOut) return false;
      return dateStr >= a.checkIn && dateStr <= a.checkOut;
    }) || accs[i % (accs.length || 1)] || { name: 'Hotel in Centro', city: 'Tokyo' };

    const currentCity = currentAcc.city || 'Tokyo';

    // 3. Filter places STRICTLY matching the active city!
    const cityPlaces = places.filter(p => {
      if (!p.city) return true;
      return p.city.toLowerCase().includes(currentCity.toLowerCase()) || 
             currentCity.toLowerCase().includes(p.city.toLowerCase());
    });
    
    const dayPlaces = cityPlaces.slice((i * 2) % (cityPlaces.length || 1), ((i * 2) % (cityPlaces.length || 1)) + 2);
    const primaryPlace = dayPlaces[0] || places[i % (places.length || 1)] || { name: 'Esplorazione Quartiere', category: 'Quartiere/Shopping' };
    const secondaryPlace = dayPlaces[1];

    const isHotelChangeDay = previousAccName && previousAccName !== currentAcc.name && !activeFlightOnDate;

    const timeline: AIItineraryItem[] = [];

    if (activeFlightOnDate) {
      // THIS DAY HAS A FLIGHT!
      const depTime = activeFlightOnDate.departureTime ? new Date(activeFlightOnDate.departureTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '07:00';
      const arrTime = activeFlightOnDate.arrivalTime ? new Date(activeFlightOnDate.arrivalTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '11:00';

      timeline.push({
        time: depTime,
        activity: `🛫 Volo Aereo ${activeFlightOnDate.airline} (${activeFlightOnDate.flightNumber}): ${activeFlightOnDate.origin} ➔ ${activeFlightOnDate.destination}`,
        type: 'transit',
        transitType: 'flight',
        transitDetail: `Compagnia: ${activeFlightOnDate.airline}. Terminal: ${activeFlightOnDate.terminal || '1'}. Presentarsi 3 ore prima.`
      });

      if (activeFlightOnDate.layovers && activeFlightOnDate.layovers.length > 0) {
        activeFlightOnDate.layovers.forEach((l, lIdx) => {
          const lDep = l.departureTime ? new Date(l.departureTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '';
          const lArr = l.arrivalTime ? new Date(l.arrivalTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '';
          timeline.push({
            time: `${lArr} - ${lDep}`,
            activity: `🔄 Scalo ${lIdx + 1}: Aeroporto di ${l.airport}`,
            type: 'break',
            transitDetail: `Attesa coincidenza in aeroporto. Atterraggio: ${lArr} ➔ Ripartenza: ${lDep}`
          });
        });
      }

      timeline.push({
        time: arrTime,
        activity: `🛬 Atterraggio FINALE a ${activeFlightOnDate.destination}`,
        type: 'place',
        placeName: activeFlightOnDate.destination
      });

      timeline.push({
        time: '12:00 - 13:00',
        activity: `Spostamento dall'Aeroporto ad Hotel (${currentAcc.name})`,
        type: 'transit',
        transitType: 'train',
        transitDetail: `Treno Express dall'aeroporto a ${currentAcc.name} (${currentCity}).`
      });

      timeline.push({
        time: '13:00 - 14:00',
        activity: `Check-in / Deposito Valigie presso ${currentAcc.name}`,
        type: 'break'
      });

      timeline.push({
        time: '14:30 - 17:30',
        activity: `Pomeriggio a ${currentCity}: Visita a ${primaryPlace.name}`,
        type: 'place',
        placeName: primaryPlace.name
      });

      timeline.push({
        time: '19:00 - 21:00',
        activity: `Cena nei dintorni di ${currentCity}`,
        type: 'meal',
        mealSuggestion: 'Specialità della cucina locale'
      });

    } else if (isHotelChangeDay) {
      // Hotel Transfer Day
      timeline.push({
        time: '08:30 - 09:00',
        activity: `Check-out da ${previousAccName} & Trasferimento a Stazione`,
        type: 'transit',
        transitType: 'train',
        transitDetail: `Treno locale alla stazione centrale (20 min).`
      });
      timeline.push({
        time: '09:30 - 11:45',
        activity: `Spostamento Interurbano: ${previousAccName} ➔ ${currentAcc.name} (${currentCity})`,
        type: 'transit',
        transitType: 'train',
        transitDetail: `Treno veloce Shinkansen/Express (2h15m). Spedizione bagagli Takkyubin.`
      });
      timeline.push({
        time: '12:00 - 12:45',
        activity: `Arrivo & Deposito Valigie presso ${currentAcc.name}`,
        type: 'break'
      });
      timeline.push({
        time: '13:00 - 14:00',
        activity: `Pranzo a ${currentCity}`,
        type: 'meal',
        mealSuggestion: 'Specialità gastronomica della nuova città'
      });
      timeline.push({
        time: '14:30 - 17:30',
        activity: `Pomeriggio: Visita a ${primaryPlace.name}`,
        type: 'place',
        placeName: primaryPlace.name
      });
      timeline.push({
        time: '18:30 - 20:30',
        activity: `Cena a ${currentCity}`,
        type: 'meal',
        mealSuggestion: 'Ristorante tipico vicino al nuovo hotel'
      });
    } else {
      // Normal Sightseeing Day
      timeline.push({
        time: '09:00 - 09:30',
        activity: `Spostamento in Metropolitana/Mezzi verso ${primaryPlace.name}`,
        type: 'transit',
        transitType: 'train',
        transitDetail: `Metropolitana da ${currentAcc.name} a ${primaryPlace.name} (20 min)`
      });
      timeline.push({
        time: '09:30 - 12:00',
        activity: `Visita a ${primaryPlace.name}`,
        type: 'place',
        placeName: primaryPlace.name
      });
      timeline.push({
        time: '12:30 - 13:30',
        activity: 'Pranzo',
        type: 'meal',
        mealSuggestion: 'Ristorante tipico nei dintorni'
      });

      if (secondaryPlace) {
        timeline.push({
          time: '14:00 - 17:00',
          activity: `Esplorazione di ${secondaryPlace.name}`,
          type: 'place',
          transitType: 'walk',
          placeName: secondaryPlace.name
        });
      } else {
        timeline.push({
          time: '14:00 - 17:00',
          activity: `Passeggiata nel quartiere di ${currentCity}`,
          type: 'place',
          transitType: 'walk',
          placeName: `Quartiere centrale ${currentCity}`
        });
      }

      timeline.push({
        time: '18:00 - 18:30',
        activity: `Rientro in Hotel (${currentAcc.name})`,
        type: 'transit',
        transitType: 'walk',
        transitDetail: `Rientro in hotel (15 min)`
      });

      timeline.push({
        time: '18:30 - 20:30',
        activity: `Cena nei dintorni di ${currentAcc.name}`,
        type: 'meal',
        mealSuggestion: 'Cena Sukiyaki/Shabu-Shabu o Izakaya'
      });
    }

    previousAccName = currentAcc.name;

    days.push({
      dayNumber,
      date: dateStr,
      formattedDate,
      title: activeFlightOnDate 
        ? `${formattedDate} • Volo Aereo ${activeFlightOnDate.flightNumber} (${activeFlightOnDate.origin} ➔ ${activeFlightOnDate.destination})`
        : isHotelChangeDay
        ? `${formattedDate} • Trasferimento a ${currentCity} & ${primaryPlace.name}`
        : `${formattedDate} • ${primaryPlace.name} (${currentCity})`,
      city: currentCity,
      accommodationName: currentAcc.name,
      dailyFeasibilitySummary: activeFlightOnDate
        ? `Giornata con Volo Aereo il ${formattedDate}: ${activeFlightOnDate.origin} ➔ ${activeFlightOnDate.destination}.`
        : isHotelChangeDay
        ? `Spostamento Interurbano il ${formattedDate}: Trasferimento da ${previousAccName} a ${currentAcc.name}.`
        : `Giorno ${formattedDate}: Spostamenti integrati con l'hotel ${currentAcc.name}.`,
      timeline
    });
  }

  const suggestedNewPlaces: AIPlaceSuggestion[] = [
    {
      id: 'sug_ueno',
      name: 'Mercato Aperto di Ameyoko & Parco di Ueno',
      officialNameJa: 'アメ横商店街',
      category: 'Quartiere/Shopping',
      city: 'Tokyo',
      address: 'Ueno, Taito-ku, Tokyo',
      reason: 'Mercato vivacissimo perfetto per souvenir, snack tradizionali e scarpe a prezzi imbattibili.',
      estimatedCostYen: 0
    },
    {
      id: 'sug_arashiyama',
      name: 'Foresta di Bambù di Arashiyama & Tempio Tenryu-ji',
      officialNameJa: '嵐山竹林',
      category: 'Natura/Parco',
      city: 'Kyoto',
      address: 'Ukyo-ku, Kyoto',
      reason: 'Passeggiata magica tra i canneti di bambù giganti all\'alba.',
      estimatedCostYen: 500
    },
    {
      id: 'sug_dotonbori',
      name: 'Dotonbori & Shinsekai (Cibo di strada)',
      officialNameJa: '道頓堀',
      category: 'Ristorante/Cibo',
      city: 'Osaka',
      address: 'Dotonbori, Chuo-ku, Osaka',
      reason: 'Il regno del Takoyaki (polpette di polpo) e delle insegne al neon giganti.',
      estimatedCostYen: 1500
    }
  ];

  return {
    globalFeasibilityRating: preferences?.pace === 'Intenso' ? 'Troppo Densa' : 'Ottima',
    globalFeasibilityNotes: `Itinerario generato dal ${formatItalianDate(dates.startDate)} al ${formatItalianDate(dates.endDate)} (${totalDays} giorni). Tutti i voli e gli scali sono stati inseriti nelle date esatte.`,
    days,
    suggestedNewPlaces
  };
}

export async function replanSingleDayWithAI(
  dayNumber: number,
  date: string,
  currentDaySchedule: AIDaySchedule,
  userPrompt: string,
  travelData: TravelData
): Promise<AIDaySchedule> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  if (backendUrl) {
    try {
      const response = await fetch(`${backendUrl}/ai/replan-day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayNumber, date, currentDaySchedule, userPrompt, travelData })
      });
      if (response.ok) {
        const json = await response.json();
        if (json.data) {
          return { ...json.data, formattedDate: formatItalianDate(json.data.date || date) };
        }
      }
    } catch (err) {
      console.warn('Backend replan service unavailable, using client fallback:', err);
    }
  }

  // Client Fallback Re-Planner
  const promptLower = userPrompt.toLowerCase();
  const newTimeline = [...currentDaySchedule.timeline];

  let summary = `Giornata del ${currentDaySchedule.formattedDate || formatItalianDate(date)} rielaborata dall'AI in tempo reale.`;

  if (promptLower.includes('finito prima') || promptLower.includes('anticipo')) {
    summary = `⚡ Modifica al volo: Aggiunta tappa flash nelle vicinanze per le ore rimanenti.`;
    newTimeline.push({
      time: '17:30 - 18:30',
      activity: 'Tappa Flash: Panorama al Tramonto dal Viewpoint più vicino',
      type: 'place',
      placeName: 'Rooftop Viewpoint / Caffè con vista',
      costEstimateYen: 1000
    });
  } else if (promptLower.includes('stanco') || promptLower.includes('relax')) {
    summary = `🛋️ Modifica al volo: Programma alleggerito in modalità Relax. Rimosse tappe faticose.`;
    const lightTimeline = newTimeline.map(item => {
      if (item.type === 'place') {
        return {
          ...item,
          activity: `${item.activity} (Modalità Relax • Passeggiata calma)`,
          feasibilityWarning: undefined
        };
      }
      return item;
    });
    lightTimeline.push({
      time: '16:00 - 17:30',
      activity: 'Pausa Caffè Tradizionale o Bagno Termale Onsen',
      type: 'break',
      costEstimateYen: 800
    });
    return {
      ...currentDaySchedule,
      dailyFeasibilitySummary: summary,
      timeline: lightTimeline
    };
  } else if (promptLower.includes('piove') || promptLower.includes('pioggia')) {
    summary = `☔ Modifica al volo: Riorganizzazione al coperto (Gallerie commerciali & Musei).`;
    const indoorTimeline = newTimeline.map(item => {
      if (item.type === 'place') {
        return {
          ...item,
          activity: `${item.activity} ➔ Sostituito con Galleria al Coperto / Museo d'Arte`,
          feasibilityWarning: '☔ Coperto per la pioggia'
        };
      }
      return item;
    });
    return {
      ...currentDaySchedule,
      dailyFeasibilitySummary: summary,
      timeline: indoorTimeline
    };
  } else {
    summary = `💬 Modifica al volo su richiesta utente: "${userPrompt}".`;
    newTimeline.push({
      time: '17:30 - 18:30',
      activity: `Attività personalizzata: ${userPrompt}`,
      type: 'place'
    });
  }

  return {
    ...currentDaySchedule,
    formattedDate: currentDaySchedule.formattedDate || formatItalianDate(date),
    dailyFeasibilitySummary: summary,
    timeline: newTimeline
  };
}
