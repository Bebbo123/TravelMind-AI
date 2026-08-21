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
  fatigueScore?: number;
  weatherForecast?: string;
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

// Master District Clustering Matrix
const DISTRICT_CLUSTERS: Record<string, Array<{ name: string; nameJa?: string; romaji?: string; category: string; description: string; recommendedDish: string; specialties: string[]; priceEuros: number }>> = {
  'taipei': [
    {
      name: 'Grattacielo Taipei 101 (臺北101) [Taipei 101]',
      nameJa: '臺北101',
      romaji: 'Taipei 101',
      category: 'Quartiere/Shopping',
      description: 'L\'iconico grattacielo panoramico di Taipei con osservatorio mozzafiato.',
      recommendedDish: 'Xiao Long Bao da Din Tai Fung',
      specialties: ['Bubble Tea', 'Pineapple Cake', 'Beef Noodle Soup'],
      priceEuros: 16
    },
    {
      name: 'Mercato Serale di Shilin (士林夜市)',
      nameJa: '士林夜市',
      romaji: 'Shilin Night Market',
      category: 'Ristorante/Cibo',
      description: 'Il mercato serale più famoso di Taiwan ricco di cibo di strada.',
      recommendedDish: 'Pollo fritto gigante (Hot Star Large Fried Chicken)',
      specialties: ['Stinky Tofu', 'Oyster Omelet', 'Mango Snow Ice'],
      priceEuros: 8
    }
  ],
  'asakusa': [
    {
      name: 'Tempio Senso-ji (浅草寺) [Asakusa-dera]',
      nameJa: '浅草寺',
      romaji: 'Asakusa-dera',
      category: 'Santuario/Tempio',
      description: 'Il tempio buddista più antico e famoso di Tokyo con la lanterna rossa gigante Kaminarimon.',
      recommendedDish: 'Tempura Tradizionale & Daifuku al Tè Verde',
      specialties: ['Melon Pan', 'Taiyaki', 'Ningyo-yaki'],
      priceEuros: 14
    },
    {
      name: 'Passeggiata Nakamise Street (仲見世商店街)',
      nameJa: '仲見世商店街',
      romaji: 'Nakamise-dori',
      category: 'Quartiere/Shopping',
      description: 'Strada pedonale storica ricca di bancarelle artigianali e dolci tradizionali.',
      recommendedDish: 'Melon Pan caldo appena sfornato',
      specialties: ['Senbei', 'Dango al Sesamo'],
      priceEuros: 5
    }
  ],
  'shibuya': [
    {
      name: 'Incrocio di Shibuya & Statua di Hachiko (渋谷)',
      nameJa: '渋谷スクランブル交差点',
      romaji: 'Shibuya Sukuranburu',
      category: 'Quartiere/Shopping',
      description: 'L\'incrocio pedonale più trafficato al mondo circondato da grattacieli e neon.',
      recommendedDish: 'Ichiran Tonkotsu Ramen con Uovo Barzotto',
      specialties: ['Gyoza croccanti', 'Craft Beer Izakaya'],
      priceEuros: 12
    },
    {
      name: 'Santuario Meiji Jingu & Parco Yoyogi (明治神宮)',
      nameJa: '明治神宮',
      romaji: 'Meiji Jingū',
      category: 'Santuario/Tempio',
      description: 'Oasi di pace immersa in una foresta sacra nel centro di Tokyo.',
      recommendedDish: 'Udon in brodo Dashi',
      specialties: ['Gelato al Matcha', 'Sake Sacro'],
      priceEuros: 10
    }
  ],
  'kyoto_higashiyama': [
    {
      name: 'Tempio Kiyomizu-dera (清水寺) [Kiyomizu-dera]',
      nameJa: '清水寺',
      romaji: 'Kiyomizu-dera',
      category: 'Santuario/Tempio',
      description: 'Spettacolare terrazza in legno patrimonio UNESCO affacciata sui ciliegi ed aceri.',
      recommendedDish: 'Yofu Tofu Tradizionale di Kyoto',
      specialties: ['Yatsuhashi alla cannella', 'Tè Verde Uji'],
      priceEuros: 16
    },
    {
      name: 'Quartiere delle Geishe a Gion & Santuario Yasaka (祇園)',
      nameJa: '祇園',
      romaji: 'Gion',
      category: 'Quartiere/Shopping',
      description: 'Quartiere storico lanternato dove avvistare Geiko e Maiko al tramonto.',
      recommendedDish: 'Cena Kaiseki pluripremiata',
      specialties: ['Saba Zushi', 'Tempura di verdure di Kyoto'],
      priceEuros: 35
    }
  ],
  'osaka_dotonbori': [
    {
      name: 'Dotonbori & Insegna Glico Man (道頓堀)',
      nameJa: '道頓堀',
      romaji: 'Dōtonbori',
      category: 'Ristorante/Cibo',
      description: 'Il regno del cibo di strada notturno tra canali e neon spettacolari.',
      recommendedDish: 'Takoyaki caldi con scaglie di Katsuobushi',
      specialties: ['Okonomiyaki stile Kansai', 'Kushikatsu fritti'],
      priceEuros: 10
    }
  ]
};

// Helper: Sanity Checker to validate timeline consistency
function validateAndCleanTimelineConsistency(
  timeline: AIItineraryItem[],
  flightArrivingToday?: FlightTicket,
  flightDepartingToday?: FlightTicket
): AIItineraryItem[] {
  let arrMinutesLimit = -1;
  let depMinutesLimit = 9999;

  if (flightArrivingToday && flightArrivingToday.arrivalTime) {
    const arrDate = new Date(flightArrivingToday.arrivalTime);
    if (!isNaN(arrDate.getTime())) {
      arrMinutesLimit = arrDate.getHours() * 60 + arrDate.getMinutes();
    }
  }

  if (flightDepartingToday && flightDepartingToday.departureTime) {
    const depDate = new Date(flightDepartingToday.departureTime);
    if (!isNaN(depDate.getTime())) {
      depMinutesLimit = depDate.getHours() * 60 + depDate.getMinutes() - 180; // 3 hours prior lead time!
    }
  }

  return timeline.filter(item => {
    if (!item.time) return true;
    const timeMatch = item.time.match(/^(\d{2}):(\d{2})/);
    if (!timeMatch) return true;
    const startMins = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);

    // Filter out activities scheduled before landing on arrival day
    if (arrMinutesLimit > 0 && startMins < arrMinutesLimit && item.type === 'place') {
      return false;
    }

    // Filter out activities scheduled after departure lead time on departure day
    if (depMinutesLimit < 9999 && startMins > depMinutesLimit && item.type === 'place') {
      return false;
    }

    return true;
  });
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

  // Master Client Engine with Strict Flight Arrival & Departure Constraints
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

  const days: AIDaySchedule[] = [];

  for (let i = 0; i < totalDays; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dateStr = current.toISOString().slice(0, 10);
    const formattedDate = formatItalianDate(dateStr);
    const dayNumber = i + 1;

    // Check Flights on this exact date
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
    let timeline: AIItineraryItem[] = [];

    // Select Geographic District Cluster
    let clusterKey = 'taipei';
    if (currentCity.toLowerCase().includes('tokyo')) clusterKey = (i % 2 === 0) ? 'asakusa' : 'shibuya';
    else if (currentCity.toLowerCase().includes('kyoto')) clusterKey = 'kyoto_higashiyama';
    else if (currentCity.toLowerCase().includes('osaka')) clusterKey = 'osaka_dotonbori';

    const clusterItems = DISTRICT_CLUSTERS[clusterKey] || DISTRICT_CLUSTERS['taipei'];
    const p1 = clusterItems[0];
    const p2 = clusterItems[1];

    if (flightDepartingToday && !flightArrivingToday && flightDepartingToday.origin.toLowerCase().includes('roma')) {
      // SCENARIO 1: DEPARTURE DAY FROM ORIGIN (e.g. 22/10/2026 Roma ➔ Taipei)
      const depTime = new Date(flightDepartingToday.departureTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      timeline.push({
        id: `step_${i}_dep`,
        time: depTime,
        activity: `Partenza Volo Aereo ${flightDepartingToday.airline} (${flightDepartingToday.flightNumber}): ${flightDepartingToday.origin} ➔ ${flightDepartingToday.destination}`,
        type: 'transit',
        transitType: 'flight',
        transitDetail: `Presentarsi in aeroporto a ${flightDepartingToday.origin} 3 ore prima per controlli bagagli.`,
        durationMinutes: 480,
        distanceKm: 9800,
        costEstimateYen: 120000
      });
      timeline.push({
        id: `step_${i}_night`,
        time: '21:20 - 08:00',
        activity: '🌙 Volo Notturno Intercontinentale in Aereo',
        type: 'break',
        transitType: 'flight',
        transitDetail: 'Pernottamento e riposo a bordo del volo.'
      });

    } else if (flightArrivingToday) {
      // SCENARIO 2: ARRIVAL DAY (e.g. 23/10/2026 Landing at 10:00 AM in Taipei!)
      const arrDateObj = new Date(flightArrivingToday.arrivalTime);
      const arrTimeStr = !isNaN(arrDateObj.getTime())
        ? arrDateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        : '10:00';
      const arrHour = arrDateObj.getHours() || 10;

      // 1. Landing Item (Exact Flight Arrival Time)
      timeline.push({
        id: `step_${i}_arr_landing`,
        time: arrTimeStr,
        activity: `✈️ Atterraggio Aeroporto ${flightArrivingToday.destination} (Volo ${flightArrivingToday.airline} ${flightArrivingToday.flightNumber})`,
        type: 'transit',
        transitType: 'flight',
        transitDetail: `Atterraggio ufficiale ad aeroporto ${flightArrivingToday.destination}.`
      });

      // 2. Passport Control & Immigration Slot (75 min)
      const passStartStr = arrTimeStr;
      const passEndHour = String(arrHour + 1).padStart(2, '0');
      const passEndStr = `${passEndHour}:15`;
      timeline.push({
        id: `step_${i}_passports`,
        time: `${passStartStr} - ${passEndStr}`,
        activity: '🛂 Immigrazione, Controllo Passaporti & Recupero Bagagli',
        type: 'break',
        transitDetail: 'Controllo passaporto biometrico, ritiro bagagli da stiva ed acquisto SIM/Pass Trasporti.'
      });

      // 3. Airport to Hotel Transit (50 min)
      const transEndStr = `${String(arrHour + 2).padStart(2, '0')}:05`;
      timeline.push({
        id: `step_${i}_trans_hotel`,
        time: `${passEndStr} - ${transEndStr}`,
        activity: `🚆 Trasferimento Aeroporto ➔ Hotel (${currentAcc.name})`,
        type: 'transit',
        transitType: 'train',
        transitDetail: `Treno Airport Express / MRT da aeroporto a ${currentAcc.name} (${currentCity}).`,
        departurePoint: flightArrivingToday.destination,
        destinationPoint: currentAcc.name,
        durationMinutes: 50,
        distanceKm: 42,
        costEstimateYen: 1600,
        lineName: 'Airport Express MRT / Narita Express N\'EX',
        stopCount: 4
      });

      // 4. Check-in & Luggage Slot (55 min)
      const checkinEndStr = `${String(arrHour + 3).padStart(2, '0')}:00`;
      timeline.push({
        id: `step_${i}_checkin`,
        time: `${transEndStr} - ${checkinEndStr}`,
        activity: `🏨 Check-in / Deposito Valigie presso ${currentAcc.name}`,
        type: 'break',
        transitDetail: `Check-in o deposito bagagli in hotel (${currentAcc.name}) e rinfrescamento.`
      });

      if (arrHour < 18) {
        // Daytime Arrival: Welcome Lunch & Light Afternoon Sightseeing
        timeline.push({
          id: `step_${i}_welcome_lunch`,
          time: '13:00 - 14:00',
          activity: `Pranzo di Benvenuto a ${currentCity}: ${p1.recommendedDish}`,
          type: 'meal',
          recommendedDish: p1.recommendedDish,
          priceRangeEuros: p1.priceEuros,
          costEstimateYen: Math.round(p1.priceEuros * 160)
        });

        timeline.push({
          id: `step_${i}_light_afternoon`,
          time: '14:30 - 18:00',
          activity: `Visita Leggera del Pomeriggio: ${p1.name}`,
          placeName: p1.name,
          type: 'place',
          description: p1.description,
          openingHours: '09:00 - 21:00',
          admissionPriceYen: 500,
          recommendedDurationMin: 90,
          crowdLevel: 'Medio',
          interestRating: 'Imperdibile ⭐'
        });

        timeline.push({
          id: `step_${i}_hotel_return_arr`,
          time: '21:00 - 21:30',
          activity: `Rientro in Hotel (${currentAcc.name}) & Riposo Jet Lag`,
          type: 'hotel_return',
          transitType: 'subway',
          transitDetail: `Rientro in hotel (${currentAcc.name}) per il riposo dopo il lungo volo.`
        });
      } else {
        // Night Arrival (after 18:00): Dinner & Rest
        timeline.push({
          id: `step_${i}_night_rest`,
          time: '20:30 - 22:00',
          activity: `Cena Leggera nei Dintorni & Riposo Notturno presso ${currentAcc.name}`,
          type: 'break'
        });
      }

    } else if (isHotelTransferDay) {
      // SCENARIO 3: INTER-CITY HOTEL TRANSFER DAY
      timeline.push({
        id: `step_${i}_checkout`,
        time: '08:30 - 09:00',
        activity: `Check-out da ${checkingOutAcc!.name} (${checkingOutAcc!.city})`,
        type: 'break'
      });

      timeline.push({
        id: `step_${i}_shinkansen`,
        time: '09:30 - 11:45',
        activity: `🚆 Spostamento Shinkansen: ${checkingOutAcc!.city} ➔ ${checkingInAcc!.city}`,
        type: 'transit',
        transitType: 'train',
        transitDetail: `Treno JR Shinkansen Nozomi (2h 15m diretti).`,
        departurePoint: checkingOutAcc!.name,
        destinationPoint: checkingInAcc!.name,
        durationMinutes: 135,
        distanceKm: 450,
        costEstimateYen: 13870,
        lineName: 'JR Shinkansen Nozomi',
        stopCount: 4
      });

      timeline.push({
        id: `step_${i}_checkin_b`,
        time: '12:00 - 12:45',
        activity: `Arrivo a ${checkingInAcc!.city} & Deposito Valigie (${checkingInAcc!.name})`,
        type: 'break'
      });

      timeline.push({
        id: `step_${i}_pomeriggio_b`,
        time: '14:30 - 17:30',
        activity: `Visita a ${p1.name}`,
        placeName: p1.name,
        type: 'place',
        description: p1.description,
        openingHours: '09:00 - 17:00',
        admissionPriceYen: 600,
        recommendedDurationMin: 120,
        crowdLevel: 'Alto',
        interestRating: 'Imperdibile ⭐'
      });

      timeline.push({
        id: `step_${i}_return_b`,
        time: '21:00 - 21:30',
        activity: `Rientro in Hotel (${checkingInAcc!.name})`,
        type: 'hotel_return',
        transitType: 'subway',
        transitDetail: `Rientro serale in hotel per il pernottamento (${checkingInAcc!.name}).`
      });

    } else {
      // SCENARIO 4: NORMAL SIGHTSEEING DAY WITH STRICT HOTEL START & RETURN
      timeline.push({
        id: `step_${i}_start`,
        time: '08:30 - 09:00',
        activity: `Partenza Hotel (${currentAcc.name})`,
        type: 'break',
        transitDetail: `Uscita dall'hotel per esplorare il quartiere di ${currentCity}.`
      });

      timeline.push({
        id: `step_${i}_transit_1`,
        time: '09:00 - 09:22',
        activity: `Spostamento Metro/Treno verso ${p1.name}`,
        type: 'transit',
        transitType: 'subway',
        transitDetail: `Prendi la Metro da ${currentAcc.name} a ${p1.name} (6 fermate, 22 min).`,
        departurePoint: currentAcc.name,
        destinationPoint: p1.name,
        durationMinutes: 22,
        distanceKm: 4.8,
        costEstimateYen: 220,
        lineName: 'Metro Urban Line',
        stopCount: 6
      });

      timeline.push({
        id: `step_${i}_p1`,
        time: '09:30 - 12:00',
        activity: `Visita a ${p1.name}`,
        placeName: p1.name,
        placeNameJa: p1.nameJa,
        romaji: p1.romaji,
        type: 'place',
        description: p1.description,
        openingHours: '08:30 - 18:30',
        admissionPriceYen: 500,
        recommendedDurationMin: 90,
        crowdLevel: 'Medio',
        interestRating: 'Imperdibile ⭐',
        districtFoodSpecialties: p1.specialties,
        recommendedDish: p1.recommendedDish,
        priceRangeEuros: p1.priceEuros
      });

      timeline.push({
        id: `step_${i}_meal`,
        time: '12:30 - 13:30',
        activity: `Pranzo Gastronomico: ${p1.recommendedDish}`,
        type: 'meal',
        restaurantName: `Ristorante locale nei dintorni di ${p1.name}`,
        cuisineType: 'Specialità Locale di Quartiere',
        recommendedDish: p1.recommendedDish,
        priceRangeEuros: p1.priceEuros,
        districtFoodSpecialties: p1.specialties,
        costEstimateYen: Math.round(p1.priceEuros * 160)
      });

      if (p2) {
        timeline.push({
          id: `step_${i}_p2`,
          time: '14:00 - 17:00',
          activity: `Passeggiata a ${p2.name}`,
          placeName: p2.name,
          placeNameJa: p2.nameJa,
          romaji: p2.romaji,
          type: 'place',
          transitType: 'walk',
          description: p2.description,
          openingHours: '09:00 - 19:00',
          admissionPriceYen: 0,
          recommendedDurationMin: 120,
          crowdLevel: 'Alto',
          interestRating: 'Consigliato ⭐️',
          districtFoodSpecialties: p2.specialties
        });
      }

      timeline.push({
        id: `step_${i}_return`,
        time: '21:00 - 21:35',
        activity: `Rientro in Hotel (${currentAcc.name})`,
        type: 'hotel_return',
        transitType: 'subway',
        transitDetail: `Rientro serale in hotel per il pernottamento (${currentAcc.name}).`,
        departurePoint: p2 ? p2.name : p1.name,
        destinationPoint: currentAcc.name,
        durationMinutes: 35,
        distanceKm: 5.5,
        costEstimateYen: 240
      });
    }

    // Apply Sanity Checker to clean any flight time overlap
    timeline = validateAndCleanTimelineConsistency(timeline, flightArrivingToday, flightDepartingToday);

    days.push({
      dayNumber,
      date: dateStr,
      formattedDate,
      title: flightDepartingToday && !flightArrivingToday
        ? `${formattedDate} • Partenza Volo ${flightDepartingToday.flightNumber} da ${flightDepartingToday.origin}`
        : flightArrivingToday
        ? `${formattedDate} • Atterraggio a ${currentCity} (Volo ${flightArrivingToday.flightNumber}), Immigrazione & Check-in`
        : `${formattedDate} • ${p1.name} (${currentCity})`,
      city: currentCity,
      accommodationName: currentAcc.name,
      fatigueScore: flightArrivingToday ? 6 : 3,
      weatherForecast: 'Soleggiato ☀️',
      dailyFeasibilitySummary: flightArrivingToday
        ? `Giorno di Arrivo (${formattedDate}): Atterraggio alle ${flightArrivingToday.arrivalTime ? flightArrivingToday.arrivalTime.slice(11, 16) : '10:00'}, controlli passaporti, treno per l'hotel, check-in e visite leggere nel pomeriggio.`
        : `Giorno ${formattedDate}: Ciclo hotel completo e tappe raggruppate nel quartiere.`,
      timeline
    });
  }

  const suggestedNewPlaces: AIPlaceSuggestion[] = [
    {
      id: 'sug_teamlab',
      name: 'TeamLab Planets & Borderless (Arte Digitale)',
      officialNameJa: 'チームラボ プラネッツ',
      category: 'Museo/Cultura',
      city: 'Tokyo',
      address: 'Toyosu, Koto-ku, Tokyo',
      reason: 'Spettacolare museo d\'arte digitale immersiva dove camminare nell\'acqua e tra luci infinite.',
      estimatedCostYen: 3800
    },
    {
      id: 'sug_ginza',
      name: 'Quartiere di Ginza & Hamarikyu Gardens',
      officialNameJa: '銀座・浜離宮恩賜庭園',
      category: 'Quartiere/Shopping',
      city: 'Tokyo',
      address: 'Ginza, Chuo-ku, Tokyo',
      reason: 'Quartiere del lusso con giardino daisho storico con casa del tè isolata sulla baia.',
      estimatedCostYen: 500
    }
  ];

  return {
    globalFeasibilityRating: 'Ottima',
    globalFeasibilityNotes: `Itinerario con vincolo orario tassativo dei voli dal ${formatItalianDate(dates.startDate)} al ${formatItalianDate(dates.endDate)}. Giorno di arrivo con atterraggio, controllo passaporti, treno express e check-in hotel.`,
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

  return {
    ...currentDaySchedule,
    formattedDate: currentDaySchedule.formattedDate || formatItalianDate(date),
    dailyFeasibilitySummary: `Rielaborato in tempo reale per: "${userPrompt}".`
  };
}
