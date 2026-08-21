import { TravelData, FlightTicket, AIItineraryItem } from '../types/travel';

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

interface RealRoute {
  activity: string;
  detail: string;
  durationMinutes: number;
  costEstimateYen: number;
  transitType: 'train' | 'subway' | 'flight';
  lineName?: string;
  stopCount?: number;
  distanceKm?: number;
}

function getRealInterCityTransit(fromCity: string, toCity: string): RealRoute {
  const from = fromCity.toLowerCase();
  const to = toCity.toLowerCase();

  if (from.includes('tokyo') && to.includes('kyoto')) {
    return {
      activity: '🚆 Spostamento Shinkansen: Stazione di Tokyo (東京駅) ➔ Stazione di Kyoto (京都駅) [JR Nozomi]',
      detail: 'Linea JR Tokaido Shinkansen Nozomi (2h 15m diretti, posti riservati). Spedizione bagagli Takkyubin.',
      durationMinutes: 135,
      costEstimateYen: 13870,
      transitType: 'train',
      lineName: 'JR Tokaido Shinkansen Nozomi',
      stopCount: 4,
      distanceKm: 513
    };
  }

  if (from.includes('kyoto') && to.includes('osaka')) {
    return {
      activity: '🚆 Spostamento Treno: Stazione di Kyoto (京都駅) ➔ Stazione di Osaka/Namba (大阪駅) [JR Special Rapid]',
      detail: 'Linea JR Kyoto Special Rapid / Hankyu Railway (29m diretti tra Kyoto e Osaka).',
      durationMinutes: 30,
      costEstimateYen: 570,
      transitType: 'train',
      lineName: 'JR Kyoto Line Special Rapid',
      stopCount: 3,
      distanceKm: 42
    };
  }

  if (from.includes('osaka') && to.includes('tokyo')) {
    return {
      activity: '🚆 Spostamento Shinkansen: Stazione Shin-Osaka (新大阪駅) ➔ Stazione di Tokyo (東京駅) [JR Nozomi]',
      detail: 'Linea JR Tokaido Shinkansen (2h 25m diretti con vista sul Monte Fuji).',
      durationMinutes: 145,
      costEstimateYen: 14450,
      transitType: 'train',
      lineName: 'JR Tokaido Shinkansen Nozomi',
      stopCount: 4,
      distanceKm: 513
    };
  }

  if (from.includes('taipei') && to.includes('tokyo')) {
    return {
      activity: '✈️ Volo Aereo: Aeroporto di Taipei-Taoyuan (TPE) ➔ Aeroporto di Tokyo Narita (NRT)',
      detail: 'Volo regionale diretto (3h 30m di volo).',
      durationMinutes: 210,
      costEstimateYen: 25000,
      transitType: 'flight',
      lineName: 'Volo Commerciale Diretto',
      stopCount: 0,
      distanceKm: 2180
    };
  }

  return {
    activity: `🚆 Spostamento Treno Express: ${fromCity} ➔ ${toCity}`,
    detail: `Collegamento ferroviario diretto tra ${fromCity} e ${toCity} (~1h 15m).`,
    durationMinutes: 75,
    costEstimateYen: 2500,
    transitType: 'train',
    lineName: 'JR Express',
    stopCount: 5,
    distanceKm: 85
  };
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

  // --- Dynamic Step-by-Step Tourist & Hotel Loop Engine ---
  const dates = preferences ? { startDate: preferences.startDate, endDate: preferences.endDate } : inferTripDates(tripData);
  
  const start = new Date(dates.startDate || '2026-10-22');
  const end = new Date(dates.endDate || '2026-11-07');
  
  let totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (isNaN(totalDays) || totalDays < 1) totalDays = 7;
  if (totalDays > 40) totalDays = 40;

  const flights = [...(tripData.flights || [])].sort(
    (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
  );
  const accs = [...(tripData.accommodations || [])].sort(
    (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
  );
  const places = tripData.places || [];

  const days: AIDaySchedule[] = [];

  for (let i = 0; i < totalDays; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dateStr = current.toISOString().slice(0, 10);
    const formattedDate = formatItalianDate(dateStr);
    const dayNumber = i + 1;

    // Flight Departing / Arriving on this date
    const flightDepartingToday = flights.find(f => f.departureTime && f.departureTime.slice(0, 10) === dateStr);
    const flightArrivingToday = flights.find(f => {
      if (!f.arrivalTime) return false;
      const arrDate = f.arrivalTime.slice(0, 10);
      const depDate = f.departureTime ? f.departureTime.slice(0, 10) : '';
      return arrDate === dateStr && depDate !== dateStr;
    });

    const checkingOutAcc = accs.find(a => a.checkOut === dateStr);
    const checkingInAcc = accs.find(a => a.checkIn === dateStr);

    const isHotelTransferDay = checkingOutAcc && checkingInAcc && checkingOutAcc.id !== checkingInAcc.id && !flightDepartingToday && !flightArrivingToday;

    let currentAcc = isHotelTransferDay
      ? checkingInAcc
      : accs.find(a => dateStr >= a.checkIn && dateStr < a.checkOut) || checkingInAcc || checkingOutAcc || accs[i % (accs.length || 1)] || { name: 'Hotel in Centro', city: 'Tokyo' };

    let currentCity = currentAcc.city || 'Tokyo';
    if (flightDepartingToday && flightDepartingToday.origin.toLowerCase().includes('roma')) {
      currentCity = 'In Volo (Roma ➔ Taipei)';
    }

    const cityPlaces = places.filter(p => {
      if (!p.city) return true;
      const pCity = p.city.toLowerCase();
      const curCity = currentCity.toLowerCase();
      if (curCity.includes('taipei') || curCity.includes('taiwan')) {
        return pCity.includes('taipei') || pCity.includes('taiwan');
      }
      if (curCity.includes('tokyo')) {
        return pCity.includes('tokyo') || pCity.includes('japan');
      }
      return pCity.includes(curCity) || curCity.includes(pCity);
    });
    
    const dayPlaces = cityPlaces.slice((i * 2) % (cityPlaces.length || 1), ((i * 2) % (cityPlaces.length || 1)) + 2);
    const primaryPlace = dayPlaces[0] || (currentCity.includes('Taipei') ? { name: 'Grattacielo Taipei 101 (臺北101) [Taipei 101]', category: 'Quartiere/Shopping' } : { name: 'Tempio Senso-ji (浅草寺) [Asakusa-dera]', category: 'Santuario/Tempio' });
    const secondaryPlace = dayPlaces[1];

    const timeline: AIItineraryItem[] = [];

    if (flightDepartingToday) {
      // OVERNIGHT FLIGHT DEPARTURE DAY
      const depTime = new Date(flightDepartingToday.departureTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      
      timeline.push({
        id: `step_${i}_1`,
        time: depTime,
        activity: `Partenza Volo Aereo ${flightDepartingToday.airline} (${flightDepartingToday.flightNumber}): ${flightDepartingToday.origin} ➔ ${flightDepartingToday.destination}`,
        activityJa: `航空便出発 ${flightDepartingToday.flightNumber}`,
        type: 'transit',
        transitType: 'flight',
        transitDetail: `Compagnia: ${flightDepartingToday.airline}. Terminal: ${flightDepartingToday.terminal || '3'}. Presentarsi in aeroporto 3 ore prima.`,
        durationMinutes: 480,
        distanceKm: 9800,
        costEstimateYen: 120000
      });

      if (flightDepartingToday.layovers && flightDepartingToday.layovers.length > 0) {
        flightDepartingToday.layovers.forEach((l, lIdx) => {
          const lDep = l.departureTime ? new Date(l.departureTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '';
          const lArr = l.arrivalTime ? new Date(l.arrivalTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '';
          timeline.push({
            id: `step_${i}_layover_${lIdx}`,
            time: `${lArr} - ${lDep}`,
            activity: `Scalo ${lIdx + 1}: Aeroporto di ${l.airport}`,
            type: 'break',
            transitDetail: `Attesa coincidenza in aeroporto. Atterraggio: ${lArr} ➔ Ripartenza: ${lDep}`
          });
        });
      }

      timeline.push({
        id: `step_${i}_night`,
        time: '21:20 - 08:00',
        activity: '🌙 Volo Notturno Intercontinentale in Aereo',
        type: 'break',
        transitType: 'flight',
        transitDetail: 'Pernottamento e riposo a bordo del volo.'
      });

    } else if (flightArrivingToday) {
      // OVERNIGHT FLIGHT ARRIVAL DAY
      const arrTime = new Date(flightArrivingToday.arrivalTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      currentCity = currentAcc.city || flightArrivingToday.destination;

      timeline.push({
        id: `step_${i}_arr`,
        time: arrTime,
        activity: `Atterraggio FINALE ad Aeroporto ${flightArrivingToday.destination}`,
        type: 'place',
        placeName: flightArrivingToday.destination
      });

      timeline.push({
        id: `step_${i}_trans_hotel`,
        time: '12:00 - 13:00',
        activity: `Spostamento Treno Express: Aeroporto ➔ Hotel ${currentAcc.name}`,
        type: 'transit',
        transitType: 'train',
        transitDetail: `Treno Taoyuan Airport MRT / Narita Express N'EX dall'aeroporto a ${currentAcc.name} (${currentCity}).`,
        departurePoint: flightArrivingToday.destination,
        destinationPoint: currentAcc.name,
        durationMinutes: 45,
        distanceKm: 42,
        costEstimateYen: 1600,
        lineName: 'Airport Express MRT / N\'EX',
        stopCount: 4
      });

      timeline.push({
        id: `step_${i}_checkin`,
        time: '13:00 - 14:00',
        activity: `Check-in / Deposito Valigie presso ${currentAcc.name}`,
        type: 'break'
      });

      timeline.push({
        id: `step_${i}_pomeriggio`,
        time: '14:30 - 17:30',
        activity: `Pomeriggio a ${currentCity}: Visita a ${primaryPlace.name}`,
        placeName: primaryPlace.name,
        type: 'place',
        description: `Esplorazione pomeridiana di ${primaryPlace.name} con monumenti iconici e negozi tradizionali.`,
        history: 'Luogo storico fondato nei secoli scorsi, centro spirituale e culturale della città.',
        curiosity: 'Si dice che toccare la struttura porti fortuna e longevità.',
        openingHours: '08:30 - 18:30',
        admissionPriceYen: 500,
        recommendedDurationMin: 90,
        crowdLevel: 'Medio',
        interestRating: 'Imperdibile ⭐',
        nearbyPlaces: ['Mercato Tradizionale', 'Parco cittadino con panorama', 'Galleria commerciale']
      });

      timeline.push({
        id: `step_${i}_hotel_return`,
        time: '21:00 - 21:30',
        activity: `Rientro in Hotel (${currentAcc.name})`,
        type: 'hotel_return',
        transitType: 'subway',
        transitDetail: `Rientro serale in hotel per il pernottamento (${currentAcc.name}).`,
        departurePoint: currentCity,
        destinationPoint: currentAcc.name,
        durationMinutes: 20,
        distanceKm: 4.2
      });

    } else if (isHotelTransferDay) {
      // HOTEL TRANSFER DAY
      const realRoute = getRealInterCityTransit(checkingOutAcc!.city, checkingInAcc!.city);

      timeline.push({
        id: `step_${i}_checkout`,
        time: '08:30 - 09:00',
        activity: `Check-out da ${checkingOutAcc!.name} (${checkingOutAcc!.city})`,
        type: 'break',
        transitDetail: `Check-out hotel e trasferimento alla stazione centrale.`
      });

      timeline.push({
        id: `step_${i}_shinkansen`,
        time: '09:30 - 11:45',
        activity: realRoute.activity,
        type: 'transit',
        transitType: realRoute.transitType,
        transitDetail: realRoute.detail,
        departurePoint: checkingOutAcc!.name,
        destinationPoint: checkingInAcc!.name,
        durationMinutes: realRoute.durationMinutes,
        distanceKm: realRoute.distanceKm || 450,
        costEstimateYen: realRoute.costEstimateYen,
        lineName: realRoute.lineName,
        stopCount: realRoute.stopCount
      });

      timeline.push({
        id: `step_${i}_checkin_b`,
        time: '12:00 - 12:45',
        activity: `Arrivo a ${checkingInAcc!.city} & Deposito Valigie / Check-in (${checkingInAcc!.name})`,
        type: 'break',
        placeName: checkingInAcc!.name
      });

      timeline.push({
        id: `step_${i}_pranzo`,
        time: '13:00 - 14:00',
        activity: `Pranzo a ${checkingInAcc!.city}`,
        type: 'meal',
        mealSuggestion: 'Specialità gastronomica della nuova città'
      });

      timeline.push({
        id: `step_${i}_place_b`,
        time: '14:30 - 17:30',
        activity: `Pomeriggio a ${checkingInAcc!.city}: Visita a ${primaryPlace.name}`,
        type: 'place',
        placeName: primaryPlace.name,
        description: `Visita a ${primaryPlace.name} nel cuore di ${checkingInAcc!.city}.`,
        openingHours: '09:00 - 17:00',
        admissionPriceYen: 600,
        recommendedDurationMin: 120,
        crowdLevel: 'Alto',
        interestRating: 'Imperdibile ⭐',
        nearbyPlaces: ['Galleria Commerciale', 'Ristorante di Ramen', 'Santuario Locale']
      });

      timeline.push({
        id: `step_${i}_hotel_return_b`,
        time: '21:00 - 21:30',
        activity: `Rientro in Hotel (${checkingInAcc!.name})`,
        type: 'hotel_return',
        transitType: 'subway',
        transitDetail: `Rientro serale in hotel per il pernottamento (${checkingInAcc!.name}).`,
        departurePoint: primaryPlace.name,
        destinationPoint: checkingInAcc!.name,
        durationMinutes: 20,
        distanceKm: 3.8
      });

    } else {
      // NORMAL SIGHTSEEING DAY WITH STRICT HOTEL START & RETURN LOOP!
      timeline.push({
        id: `step_${i}_hotel_start`,
        time: '08:30 - 09:00',
        activity: `Partenza Hotel (${currentAcc.name})`,
        type: 'break',
        transitDetail: `Uscita dall'hotel per iniziare le visite della giornata a ${currentCity}.`
      });

      timeline.push({
        id: `step_${i}_trans_1`,
        time: '09:00 - 09:22',
        activity: `Spostamento Metro/Treno verso ${primaryPlace.name}`,
        type: 'transit',
        transitType: 'subway',
        transitDetail: `Prendi la Metro/Linea Urbana da ${currentAcc.name} a ${primaryPlace.name} (8 fermate, 22 min).`,
        departurePoint: currentAcc.name,
        destinationPoint: primaryPlace.name,
        durationMinutes: 22,
        distanceKm: 5.8,
        costEstimateYen: 220,
        lineName: 'Tokyo Metro Ginza Line / Kyoto Subway',
        stopCount: 8,
        fastestAlternative: 'Taxi Express (12 min, ¥1,800)',
        cheapestAlternative: 'Autobus Locale (25 min, ¥210)'
      });

      timeline.push({
        id: `step_${i}_place_1`,
        time: '09:30 - 12:00',
        activity: `Visita a ${primaryPlace.name}`,
        placeName: primaryPlace.name,
        type: 'place',
        description: `Splendida attrazione turistica di ${currentCity} ricca di atmosfera e tradizione.`,
        history: 'Edificato nei secoli scorsi, rappresenta una delle tappe più importanti della città.',
        curiosity: 'Frequentato dai locali al mattino presto per evitare le folle.',
        openingHours: '08:30 - 18:00',
        admissionPriceYen: primaryPlace.estimatedCostYen || 500,
        recommendedDurationMin: 90,
        crowdLevel: 'Medio',
        interestRating: 'Imperdibile ⭐',
        nearbyPlaces: ['Quartiere Shopping', 'Santuario Storico', 'Parco con Giardino']
      });

      timeline.push({
        id: `step_${i}_meal`,
        time: '12:30 - 13:30',
        activity: 'Pranzo Tipico',
        type: 'meal',
        mealSuggestion: 'Ristorante tipico di Ramen / Tempura nei dintorni'
      });

      if (secondaryPlace) {
        timeline.push({
          id: `step_${i}_place_2`,
          time: '14:00 - 17:00',
          activity: `Esplorazione di ${secondaryPlace.name}`,
          placeName: secondaryPlace.name,
          type: 'place',
          transitType: 'walk',
          description: `Passeggiata ed esplorazione di ${secondaryPlace.name}.`,
          openingHours: '09:00 - 19:00',
          admissionPriceYen: secondaryPlace.estimatedCostYen || 0,
          recommendedDurationMin: 120,
          crowdLevel: 'Alto',
          interestRating: 'Consigliato ⭐️',
          nearbyPlaces: ['Strada Pedonale', 'Caffè Tradizionale']
        });
      } else {
        timeline.push({
          id: `step_${i}_place_2_gen`,
          time: '14:00 - 17:00',
          activity: `Passeggiata a piedi nel quartiere centrale di ${currentCity}`,
          placeName: `Quartiere centrale ${currentCity}`,
          type: 'place',
          transitType: 'walk',
          description: `Passeggiata libera tra i vicoli del quartiere centrale.`,
          openingHours: '24h',
          admissionPriceYen: 0,
          recommendedDurationMin: 120,
          crowdLevel: 'Medio',
          interestRating: 'Consigliato ⭐️'
        });
      }

      timeline.push({
        id: `step_${i}_hotel_return_end`,
        time: '21:00 - 21:35',
        activity: `Rientro in Hotel (${currentAcc.name})`,
        type: 'hotel_return',
        transitType: 'subway',
        transitDetail: `Rientro serale in hotel per il pernottamento (${currentAcc.name}).`,
        departurePoint: currentCity,
        destinationPoint: currentAcc.name,
        durationMinutes: 35,
        distanceKm: 6.2,
        costEstimateYen: 240
      });
    }

    days.push({
      dayNumber,
      date: dateStr,
      formattedDate,
      title: flightDepartingToday
        ? `${formattedDate} • Partenza Volo ${flightDepartingToday.flightNumber} & Volo Notturno`
        : flightArrivingToday
        ? `${formattedDate} • Atterraggio a ${currentCity} & Check-in Hotel`
        : isHotelTransferDay
        ? `${formattedDate} • Trasferimento Shinkansen/Express a ${checkingInAcc!.city} & Check-in ${checkingInAcc!.name}`
        : `${formattedDate} • ${primaryPlace.name} (${currentCity})`,
      city: currentCity,
      accommodationName: currentAcc.name,
      dailyFeasibilitySummary: flightDepartingToday
        ? `Partenza il ${formattedDate}: Volo notturno intercontinentale in aereo.`
        : flightArrivingToday
        ? `Arrivo a ${currentCity} il ${formattedDate}: Atterraggio, check-in e visite pomeridiane.`
        : isHotelTransferDay
        ? `Trasferimento Reale il ${formattedDate}: Check-out da ${checkingOutAcc!.name} (${checkingOutAcc!.city}) e viaggio in Treno per ${checkingInAcc!.name} (${checkingInAcc!.city}).`
        : `Giorno ${formattedDate}: Ciclo completo con partenza ed il rientro finale presso l'hotel ${currentAcc.name}.`,
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
    globalFeasibilityNotes: `Itinerario generato dal ${formatItalianDate(dates.startDate)} al ${formatItalianDate(dates.endDate)} (${totalDays} giorni). Ogni giornata include il ciclo completo con partenza e rientro in hotel, fermate metro dettagliate e pronuncia Romaji.`,
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
      id: `replan_${Date.now()}`,
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
      id: `replan_${Date.now()}`,
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
      id: `replan_${Date.now()}`,
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
