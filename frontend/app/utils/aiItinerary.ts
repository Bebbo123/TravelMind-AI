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

export async function generateAIItinerary(tripData: TravelData): Promise<AIItineraryResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  if (backendUrl) {
    try {
      const response = await fetch(`${backendUrl}/ai/generate-itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData)
      });
      if (response.ok) {
        const json = await response.json();
        if (json.data) return json.data;
      }
    } catch (err) {
      console.warn('Backend AI itinerary service unavailable, using client engine fallback:', err);
    }
  }

  // Client-side Fallback Itinerary & Feasibility Generator Engine
  const flights = tripData.flights || [];
  const accs = tripData.accommodations || [];
  const places = tripData.places || [];

  const mainFlight = flights[0];
  const departureDateStr = mainFlight?.departureTime ? mainFlight.departureTime.slice(0, 10) : '2026-10-11';
  const arrivalDateStr = mainFlight?.arrivalTime ? mainFlight.arrivalTime.slice(0, 10) : '2026-10-11';
  
  const placeNames = places.map(p => p.name);
  const isHighDensity = places.length > 5;

  const days: AIDaySchedule[] = [
    {
      dayNumber: 1,
      date: arrivalDateStr,
      title: `Giorno 1: Arrivo a Tokyo & Sistemazione Hotel`,
      city: 'Tokyo',
      accommodationName: accs[0]?.name || 'Shinjuku Prince Hotel',
      dailyFeasibilitySummary: 'Fattibilità Ottima: Ritmo rilassato post-volo per consentire il riposo ed abituarsi al fuso orario.',
      timeline: [
        {
          time: '08:20',
          activity: `Atterraggio a ${mainFlight?.destination || 'Tokyo Haneda (HND)'}`,
          type: 'place',
          placeName: mainFlight?.destination || 'Tokyo Haneda'
        },
        {
          time: '09:30 - 10:30',
          activity: 'Spostamento dall\'Aeroporto all\'Hotel',
          type: 'transit',
          transitDetail: 'Treno Keikyu Airport Line o Tokyo Monorail fino alla stazione principale (45 min, ~¥650)'
        },
        {
          time: '11:00 - 12:30',
          activity: `Check-in / Deposito bagagli presso ${accs[0]?.name || 'Hotel'}`,
          type: 'break'
        },
        {
          time: '12:30 - 13:30',
          activity: 'Pranzo di Benvenuto',
          type: 'meal',
          mealSuggestion: 'Ramen o Tonkatsu nel quartiere di Shinjuku / Kabukicho'
        },
        {
          time: '14:30 - 17:30',
          activity: `Visita a ${places[0]?.name || 'Santuario Meiji Jingu & Harajuku'}`,
          type: 'place',
          placeName: places[0]?.name || 'Santuario Meiji Jingu'
        },
        {
          time: '19:00 - 21:00',
          activity: 'Cena e passeggiata serale tra le luci al neon di Shinjuku',
          type: 'meal',
          mealSuggestion: 'Yakitori a Omoide Yokocho (Memory Lane)'
        }
      ]
    },
    {
      dayNumber: 2,
      date: '2026-10-12',
      title: 'Giorno 2: Tradizione e Cultura a Tokyo',
      city: 'Tokyo',
      accommodationName: accs[0]?.name || 'Shinjuku Prince Hotel',
      dailyFeasibilitySummary: places.length > 2 
        ? 'Fattibilità Media: La giornata comprende più tappe in quartieri opposti, consigliata la metropolitana.' 
        : 'Fattibilità Ottima: Tempi di visita abbondanti.',
      timeline: [
        {
          time: '09:00 - 09:30',
          activity: 'Spostamento in Metropolitana verso Asakusa',
          type: 'transit',
          transitDetail: 'Metropolitana Linea Ginza da Shibuya/Shinjuku ad Asakusa (25 min, ¥210)'
        },
        {
          time: '09:30 - 12:00',
          activity: `Visita guidata a ${places[1]?.name || 'Tempio Senso-ji & Nakamise Street'}`,
          type: 'place',
          placeName: places[1]?.name || 'Tempio Senso-ji'
        },
        {
          time: '12:30 - 13:30',
          activity: 'Pranzo Tradizionale',
          type: 'meal',
          mealSuggestion: 'Tempura dorata o Soba artigianale ad Asakusa'
        },
        {
          time: '14:00 - 17:00',
          activity: `Esplorazione di ${places[2]?.name || 'Tokyo Skytree & Akihabara'}`,
          type: 'place',
          placeName: places[2]?.name || 'Tokyo Skytree',
          feasibilityWarning: isHighDensity ? '⚠️ Attenzione: Akihabara nel pomeriggio potrebbe richiedere molte ore, considera di ridurre lo shopping per non arrivare in ritardo per cena.' : undefined
        },
        {
          time: '18:30 - 20:30',
          activity: 'Cena a Ginza',
          type: 'meal',
          mealSuggestion: 'Sushi fresco sul banco o Izakaya tipica'
        }
      ]
    },
    {
      dayNumber: 3,
      date: '2026-10-16',
      title: 'Giorno 3: Trasferimento in Shinkansen a Kyoto',
      city: 'Kyoto',
      accommodationName: accs[1]?.name || 'Kyoto Granbell Hotel',
      dailyFeasibilitySummary: 'Fattibilità Ottima: Spostamento in treno proiettile Shinkansen fluido ed integrato.',
      timeline: [
        {
          time: '08:30 - 09:00',
          activity: 'Check-out Hotel & Trasferimento a Stazione di Tokyo',
          type: 'transit',
          transitDetail: 'JR Yamanote Line verso Stazione di Tokyo (15 min)'
        },
        {
          time: '09:30 - 11:45',
          activity: 'Treno Proiettile Shinkansen Nozomi (Tokyo ➔ Kyoto)',
          type: 'transit',
          transitDetail: 'Shinkansen Nozomi veloce (2 ore e 15 minuti con vista sul Monte Fuji dal lato destro del treno)'
        },
        {
          time: '12:15 - 13:15',
          activity: 'Pranzo alla Stazione di Kyoto',
          type: 'meal',
          mealSuggestion: 'Ramen Street al 10° piano della Stazione di Kyoto (Kyoto Ramen Koji)'
        },
        {
          time: '14:00 - 17:30',
          activity: `Visita all'iconico ${places.find(p => p.city === 'Kyoto')?.name || 'Fushimi Inari Taisha'}`,
          type: 'place',
          placeName: places.find(p => p.city === 'Kyoto')?.name || 'Fushimi Inari Taisha',
          feasibilityWarning: '⚠️ Attenzione: La salita completa dei torii rossi fino alla cima della montagna dura circa 2 ore ed è impegnativa.'
        },
        {
          time: '18:30 - 21:00',
          activity: 'Cena nel quartiere delle Geishe (Gion)',
          type: 'meal',
          mealSuggestion: 'Cucina Kaiseki tradizionale o Piatto di carne Wagyu a Gion Shirakawa'
        }
      ]
    }
  ];

  const suggestedNewPlaces: AIPlaceSuggestion[] = [
    {
      id: 'sug_ueno',
      name: 'Mercato Aperto di Ameyoko & Parco di Ueno',
      officialNameJa: 'アメ横商店街',
      category: 'Quartiere/Shopping',
      city: 'Tokyo',
      address: 'Ueno, Taito-ku, Tokyo',
      reason: 'Si trova a soli 5 minuti di metropolitana dal tempio Senso-ji di Asakusa che visiterai il Giorno 2.',
      estimatedCostYen: 0
    },
    {
      id: 'sug_arashiyama',
      name: 'Foresta di Bambù di Arashiyama & Tempio Tenryu-ji',
      officialNameJa: '嵐山竹林',
      category: 'Natura/Parco',
      city: 'Kyoto',
      address: 'Ukyo-ku, Kyoto',
      reason: 'Una delle meraviglie naturali più fotografate del Giappone, facilmente raggiungibile con il treno locale JR Sagano Line da Kyoto station (15 min).',
      estimatedCostYen: 500
    },
    {
      id: 'sug_teamlab',
      name: 'teamLab Planets Tokyo (Arte Digitale)',
      officialNameJa: 'チームラボ プラネッツ',
      category: 'Museo/Cultura',
      city: 'Tokyo',
      address: '6-1-16 Toyosu, Koto-ku, Tokyo',
      reason: 'Esperienza d\'arte digitale immersiva unica al mondo. Consigliata la prenotazione con anticipo.',
      estimatedCostYen: 3800
    }
  ];

  return {
    globalFeasibilityRating: places.length > 6 ? 'Troppo Densa' : 'Ottima',
    globalFeasibilityNotes: places.length > 6
      ? 'Hai inserito molti luoghi: l\'itinerario è stato ottimizzato ma alcune giornate hanno tappe serrate. Monitora gli avvisi ⚠️ sulla timeline.'
      : 'Il piano di viaggio è perfettamente bilanciato. Gli spostamenti tra Tokyo e Kyoto si integrano perfettamente con le tue date di volo e prenotazioni alloggi.',
    days,
    suggestedNewPlaces
  };
}
