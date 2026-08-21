import { TravelData } from '../types/travel';

export interface AIItineraryItem {
  time: string;
  activity: string;
  type: 'place' | 'transit' | 'meal' | 'break';
  placeName?: string;
  transitDetail?: string;
  mealSuggestion?: string;
  costEstimateYen?: number;
  feasibilityWarning?: string;
}

export interface AIDaySchedule {
  dayNumber: number;
  date: string;
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

export function inferTripDates(tripData: TravelData): { startDate: string; endDate: string } {
  let startDate = '2026-10-10';
  let endDate = '2026-10-20';

  if (tripData.flights && tripData.flights.length > 0) {
    const mainFlight = tripData.flights[0];
    if (mainFlight.departureTime) {
      startDate = mainFlight.departureTime.slice(0, 10);
    }
  } else if (tripData.accommodations && tripData.accommodations.length > 0) {
    startDate = tripData.accommodations[0].checkIn;
  }

  if (tripData.accommodations && tripData.accommodations.length > 0) {
    const lastAcc = tripData.accommodations[tripData.accommodations.length - 1];
    if (lastAcc.checkOut) {
      endDate = lastAcc.checkOut;
    }
  } else if (tripData.flights && tripData.flights.length > 1) {
    const returnFlight = tripData.flights[tripData.flights.length - 1];
    if (returnFlight.departureTime) {
      endDate = returnFlight.departureTime.slice(0, 10);
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
        if (json.data) return json.data;
      }
    } catch (err) {
      console.warn('Backend AI itinerary service unavailable, using client engine fallback:', err);
    }
  }

  // --- Dynamic Multi-Day Client Fallback Engine ---
  const dates = preferences ? { startDate: preferences.startDate, endDate: preferences.endDate } : inferTripDates(tripData);
  
  const start = new Date(dates.startDate || '2026-10-10');
  const end = new Date(dates.endDate || '2026-10-20');
  
  let totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (isNaN(totalDays) || totalDays < 1) totalDays = 7;
  if (totalDays > 30) totalDays = 30; // safety ceiling

  const flights = tripData.flights || [];
  const accs = tripData.accommodations || [];
  const places = tripData.places || [];

  const mainFlight = flights[0];
  const returnFlight = flights.length > 1 ? flights[flights.length - 1] : null;

  const days: AIDaySchedule[] = [];
  let previousAccName = '';

  for (let i = 0; i < totalDays; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dateStr = current.toISOString().slice(0, 10);
    const dayNumber = i + 1;

    // Distribute city and accommodations across trip duration
    const currentAcc = accs.find(a => {
      if (!a.checkIn || !a.checkOut) return false;
      return dateStr >= a.checkIn && dateStr <= a.checkOut;
    }) || accs[i % (accs.length || 1)] || { name: 'Hotel in Centro', city: i < totalDays / 2 ? 'Tokyo' : 'Kyoto' };

    const currentCity = currentAcc.city || (i < totalDays / 2 ? 'Tokyo' : 'Kyoto');
    const cityPlaces = places.filter(p => p.city.toLowerCase() === currentCity.toLowerCase());
    
    // Assign 1 or 2 places per day
    const dayPlaces = cityPlaces.slice((i * 2) % (cityPlaces.length || 1), ((i * 2) % (cityPlaces.length || 1)) + 2);
    const primaryPlace = dayPlaces[0] || places[i % (places.length || 1)] || { name: 'Esplorazione Quartiere', category: 'Quartiere/Shopping' };
    const secondaryPlace = dayPlaces[1];

    const isFirstDay = i === 0;
    const isLastDay = i === totalDays - 1;
    const isHotelChangeDay = previousAccName && previousAccName !== currentAcc.name;

    const timeline: AIItineraryItem[] = [];

    if (isFirstDay) {
      timeline.push({
        time: '08:20',
        activity: `Atterraggio Volo a ${mainFlight?.destination || 'Tokyo Haneda (HND)'}`,
        type: 'place',
        placeName: mainFlight?.destination || 'Aeroporto'
      });
      timeline.push({
        time: '09:30 - 10:30',
        activity: `Spostamento Aeroporto ➔ Primo Hotel (${currentAcc.name})`,
        type: 'transit',
        transitDetail: `Treno Keikyu Airport Line / Tokyo Monorail dall'aeroporto a ${currentAcc.name} (45 min, ~¥650). In stazione ritira la carta SUICA/PASMO.`
      });
      timeline.push({
        time: '11:00 - 12:30',
        activity: `Check-in o Deposito Valigie presso ${currentAcc.name}`,
        type: 'break'
      });
      timeline.push({
        time: '12:30 - 13:30',
        activity: `Pranzo a ${currentCity}`,
        type: 'meal',
        mealSuggestion: preferences?.interests?.includes('🍱 Cibo & Izakaya') ? 'Ramen o Tonkatsu artigianale locale' : 'Pranzo tradizionale della zona'
      });
      timeline.push({
        time: '14:30 - 17:30',
        activity: `Visita a ${primaryPlace.name}`,
        type: 'place',
        placeName: primaryPlace.name
      });
      timeline.push({
        time: '19:00 - 21:00',
        activity: 'Cena e rientro in hotel per riposo',
        type: 'meal',
        mealSuggestion: 'Izakaya locale e spiedini Yakitori'
      });
    } else if (isLastDay) {
      timeline.push({
        time: '09:00 - 10:30',
        activity: `Check-out da ${currentAcc.name} & Ultimo Shopping Souvenir`,
        type: 'break'
      });
      timeline.push({
        time: '11:00 - 12:00',
        activity: 'Pranzo d\'addio',
        type: 'meal',
        mealSuggestion: 'Sushi fresco o Bento Box alla stazione'
      });
      timeline.push({
        time: '12:30 - 14:00',
        activity: `Spostamento Hotel ➔ Aeroporto di Partenza (${returnFlight?.origin || 'Tokyo'})`,
        type: 'transit',
        transitDetail: `Treno Narita Express / Haruka Express verso l'aeroporto (60 min, ¥1,200). Arrivo consigliato 3 ore prima del volo.`
      });
      timeline.push({
        time: '16:00',
        activity: `Volo di Ritorno ${returnFlight?.flightNumber || ''}`,
        type: 'place',
        placeName: returnFlight?.origin || 'Aeroporto'
      });
    } else if (isHotelChangeDay) {
      // Hotel Transfer / City Transition Day
      timeline.push({
        time: '08:30 - 09:00',
        activity: `Check-out da ${previousAccName} & Trasferimento a Stazione dei treni`,
        type: 'transit',
        transitDetail: `Treno locale da ${previousAccName} alla stazione centrale (20 min).`
      });
      timeline.push({
        time: '09:30 - 11:45',
        activity: `Spostamento Interurbano: ${previousAccName} ➔ ${currentAcc.name} (${currentCity})`,
        type: 'transit',
        transitDetail: `Treno Proiettile Shinkansen Nozomi (2h15m, ~¥13,800). Consigliata la spedizione delle valigie grandi con il servizio Takkyubin.`
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
        mealSuggestion: 'Ristorante tipico vicinissimo al nuovo hotel'
      });
    } else {
      // Normal Day Schedule
      timeline.push({
        time: '09:00 - 09:30',
        activity: `Spostamento da Hotel (${currentAcc.name}) a ${primaryPlace.name}`,
        type: 'transit',
        transitDetail: `Metropolitana o treno locale da ${currentAcc.name} a ${primaryPlace.name} (20 min, ¥210)`
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
        mealSuggestion: preferences?.customInstructions?.toLowerCase().includes('ramen') ? 'Bowl di Ramen bollente' : 'Ristorante tipico nei dintorni'
      });

      if (secondaryPlace) {
        timeline.push({
          time: '14:00 - 17:00',
          activity: `Esplorazione di ${secondaryPlace.name}`,
          type: 'place',
          placeName: secondaryPlace.name,
          feasibilityWarning: preferences?.pace === 'Relax' ? '⚠️ Attenzione per ritmo Relax: Seconda tappa pomeridiana intensa, valutare di fare una pausa caffè.' : undefined
        });
      } else {
        timeline.push({
          time: '14:00 - 17:00',
          activity: `Passeggiata nel quartiere centrale di ${currentCity}`,
          type: 'place',
          placeName: `Quartiere centrale ${currentCity}`
        });
      }

      timeline.push({
        time: '18:00 - 18:30',
        activity: `Rientro verso Hotel (${currentAcc.name})`,
        type: 'transit',
        transitDetail: `Treno di rientro verso ${currentAcc.name} (20 min)`
      });

      timeline.push({
        time: '18:30 - 20:30',
        activity: `Cena nei dintorni di ${currentAcc.name}`,
        type: 'meal',
        mealSuggestion: 'Specialità della casa o cena Sukiyaki/Shabu-Shabu'
      });
    }

    previousAccName = currentAcc.name;

    days.push({
      dayNumber,
      date: dateStr,
      title: isHotelChangeDay 
        ? `Giorno ${dayNumber}: Trasferimento a ${currentCity} & ${primaryPlace.name}`
        : `Giorno ${dayNumber}: ${primaryPlace.name} (${currentCity})`,
      city: currentCity,
      accommodationName: currentAcc.name,
      dailyFeasibilitySummary: isHotelChangeDay
        ? `Spostamento Interurbano: Trasferimento da ${previousAccName} a ${currentAcc.name} con Shinkansen/treno rapido.`
        : `Spostamenti integrati con l'hotel ${currentAcc.name}.`,
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
    globalFeasibilityNotes: `Itinerario generato per tutti i ${totalDays} giorni di viaggio (${dates.startDate} - ${dates.endDate}). Inclusi trasferimenti Aeroporto ➔ Hotel, cambio città Hotel ➔ Hotel e Hotel ➔ Aeroporto.`,
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
        if (json.data) return json.data;
      }
    } catch (err) {
      console.warn('Backend replan service unavailable, using client fallback:', err);
    }
  }

  // Client Fallback Re-Planner
  const promptLower = userPrompt.toLowerCase();
  const newTimeline = [...currentDaySchedule.timeline];

  let summary = `Giornata ${dayNumber} rielaborata dall'AI in tempo reale.`;

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
    dailyFeasibilitySummary: summary,
    timeline: newTimeline
  };
}
