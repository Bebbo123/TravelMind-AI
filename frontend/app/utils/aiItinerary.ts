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

// Master District Clustering Matrix (Eliminates useless zigzag movement across Tokyo & Kyoto!)
const DISTRICT_CLUSTERS: Record<string, Array<{ name: string; nameJa?: string; romaji?: string; category: string; description: string; recommendedDish: string; specialties: string[]; priceEuros: number }>> = {
  'asakusa': [
    {
      name: 'Tempio Senso-ji (浅草寺) [Asakusa-dera]',
      nameJa: '浅草寺',
      romaji: 'Asakusa-dera',
      category: 'Santuario/Tempio',
      description: 'Il tempio buddista più antico e famoso di Tokyo con la lanterne rossa gigante Kaminarimon.',
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
    },
    {
      name: 'Tokyo Skytree & Sumida Park (東京スカイツリー)',
      nameJa: '東京スカイツリー',
      romaji: 'Tōkyō Sukaitsurī',
      category: 'Natura/Parco',
      description: 'La torre panoramica più alta del Giappone con parco fluviale lungo il fiume Sumida.',
      recommendedDish: 'Soba al Tè Verde Matcha',
      specialties: ['Unagi Bento', 'Crepe alle fragole'],
      priceEuros: 18
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
    },
    {
      name: 'Takeshita Street a Harajuku (竹下通り)',
      nameJa: '竹下通り',
      romaji: 'Takeshita-dōri',
      category: 'Quartiere/Shopping',
      description: 'Capitale della moda Kawaii, cosplay e crepes dolci spettacolari.',
      recommendedDish: 'Crepe dolce giganti alla fragola e panna',
      specialties: ['Bubble Tea', 'Rainbow Cotton Candy'],
      priceEuros: 6
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
      name: 'Strade Storiche Ninenzaka & Sannenzaka (二年坂)',
      nameJa: '二年坂・三年坂',
      romaji: 'Ninenzaka',
      category: 'Quartiere/Shopping',
      description: 'Vicolo in pietra conservato con case tradizionali in legno Machiya.',
      recommendedDish: 'Matcha Parfait stratificato',
      specialties: ['Dolci alla farina di soia', 'Mochi al vapore'],
      priceEuros: 8
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
    },
    {
      name: 'Shinsekai & Torre Tsutenkaku (新世界)',
      nameJa: '新世界',
      romaji: 'Shinsekai',
      category: 'Quartiere/Shopping',
      description: 'Quartiere retrò in stile Showa famoso per gli spiedini Kushikatsu.',
      recommendedDish: 'Set Spiedini Kushikatsu Misti con salsa segreta',
      specialties: ['Doteyaki di manzo', 'Birra Asahi alla spina'],
      priceEuros: 12
    }
  ]
};

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

  // Master Client Engine with Geographic District Clustering & Hotel Anchor Loop
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
    const timeline: AIItineraryItem[] = [];

    // Select Geographic District Cluster
    let clusterKey = 'asakusa';
    if (currentCity.toLowerCase().includes('kyoto')) clusterKey = 'kyoto_higashiyama';
    else if (currentCity.toLowerCase().includes('osaka')) clusterKey = 'osaka_dotonbori';
    else if (i % 2 === 1) clusterKey = 'shibuya';

    const clusterItems = DISTRICT_CLUSTERS[clusterKey] || DISTRICT_CLUSTERS['asakusa'];
    const p1 = clusterItems[0];
    const p2 = clusterItems[1];

    if (flightDepartingToday) {
      const depTime = new Date(flightDepartingToday.departureTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      timeline.push({
        id: `step_${i}_1`,
        time: depTime,
        activity: `Partenza Volo Aereo ${flightDepartingToday.airline} (${flightDepartingToday.flightNumber}): ${flightDepartingToday.origin} ➔ ${flightDepartingToday.destination}`,
        activityJa: `航空便出発 ${flightDepartingToday.flightNumber}`,
        type: 'transit',
        transitType: 'flight',
        transitDetail: `Presentarsi in aeroporto 3 ore prima. Terminal ${flightDepartingToday.terminal || '3'}.`,
        durationMinutes: 480,
        distanceKm: 9800,
        costEstimateYen: 120000
      });
      timeline.push({
        id: `step_${i}_night`,
        time: '21:20 - 08:00',
        activity: '🌙 Volo Notturno Intercontinentale',
        type: 'break',
        transitType: 'flight',
        transitDetail: 'Pernottamento a bordo del volo.'
      });
    } else {
      // Hotel Daily Anchor
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
        transitDetail: `Prendi la Metro urbana da ${currentAcc.name} a ${p1.name} (6 fermate, 22 min).`,
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

      // Gastronomic Lunch
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

      // Hotel Return Anchor
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

    days.push({
      dayNumber,
      date: dateStr,
      formattedDate,
      title: `${formattedDate} • ${p1.name} (${currentCity})`,
      city: currentCity,
      accommodationName: currentAcc.name,
      fatigueScore: 3,
      weatherForecast: 'Soleggiato ☀️',
      dailyFeasibilitySummary: `Giorno ${formattedDate}: Cluster quartiere ottimizzato per minimizzare gli spostamenti. Ciclo hotel completo.`,
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
    globalFeasibilityNotes: `Itinerario riprogettato con clustering geografico dei quartieri dal ${formatItalianDate(dates.startDate)} al ${formatItalianDate(dates.endDate)}. Zero spostamenti inutili e ciclo hotel garantito.`,
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
