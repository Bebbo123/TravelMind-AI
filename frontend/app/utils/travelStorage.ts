import { TravelData, FlightTicket, Accommodation, PlaceToVisit } from '../types/travel';
import { AIItineraryResponse } from './aiItinerary';

const STORAGE_KEY = 'travelmind_trip_data_v1';
const STORAGE_ITINERARY_KEY = 'travelmind_saved_itinerary_v1';

export const initialTravelData: TravelData = {
  flights: [
    {
      id: 'f1',
      airline: 'ITA Airways / ANA',
      flightNumber: 'NH 208',
      origin: 'Milano Malpensa (MXP)',
      destination: 'Tokyo Haneda (HND)',
      departureTime: '2026-10-10T12:40',
      arrivalTime: '2026-10-11T08:20',
      bookingRef: 'ABC123XYZ',
      terminal: 'T1',
      gate: 'B22',
      seat: '14A',
      notes: 'Carta d\'imbarco salvata sul cellulare. bagaglio da stiva 2x23kg incluso.'
    }
  ],
  accommodations: [
    {
      id: 'a1',
      name: 'Shinjuku Prince Hotel',
      address: '1-30-1 Kabukicho, Shinjuku-ku',
      city: 'Tokyo',
      checkIn: '2026-10-11',
      checkOut: '2026-10-16',
      bookingRef: 'HTL-987654',
      cost: 65000,
      currency: 'JPY',
      notes: 'Check-in dalle 15:00. Vicinissimo alla stazione JR Shinjuku.'
    },
    {
      id: 'a2',
      name: 'Kyoto Granbell Hotel',
      address: '27 Gotanda-cho, Yamato-cho, Gion, Higashiyama-ku',
      city: 'Kyoto',
      checkIn: '2026-10-16',
      checkOut: '2026-10-20',
      bookingRef: 'HTL-543210',
      cost: 58000,
      currency: 'JPY',
      notes: 'Colazione tipica inclusa. Onsen interno disponibile.'
    }
  ],
  places: [
    {
      id: 'p1',
      name: 'Santuario Meiji Jingu & Harajuku',
      category: 'Santuario/Tempio',
      city: 'Tokyo',
      address: '1-1 Yoyogikamicho, Shibuya-ku',
      priority: 'Alta',
      status: 'Da Visitare',
      notes: 'Passeggiata nella foresta sacra al mattino, poi Takeshita Street.',
      estimatedCostYen: 0
    },
    {
      id: 'p2',
      name: 'Fushimi Inari Taisha',
      category: 'Santuario/Tempio',
      city: 'Kyoto',
      address: '68 Fukakusa Yabunouchicho, Fushimi-ku',
      priority: 'Alta',
      status: 'Da Visitare',
      notes: 'Salita tra i 10.000 torii rossi. Consigliato all\'alba (ore 06:30) per evitare la folla.',
      estimatedCostYen: 0
    },
    {
      id: 'p3',
      name: 'Mercato di Tsukiji & Ramen a Ginza',
      category: 'Ristorante/Cibo',
      city: 'Tokyo',
      address: 'Tsukiji Outer Market, Chuo-ku',
      priority: 'Media',
      status: 'Da Visitare',
      notes: 'Assaggiare spiedini di wagyu, sushi fresco e tamagoyaki.',
      estimatedCostYen: 3500
    }
  ]
};

export function loadTravelData(): TravelData {
  if (typeof window === 'undefined') return initialTravelData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTravelData));
      return initialTravelData;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading travel data:', err);
    return initialTravelData;
  }
}

export function saveTravelData(data: TravelData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving travel data:', err);
  }
}

export function resetTravelData(): TravelData {
  if (typeof window === 'undefined') return initialTravelData;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTravelData));
  localStorage.removeItem(STORAGE_ITINERARY_KEY);
  return initialTravelData;
}

// --- Travel Diary / Saved Itinerary Storage Functions ---
export function loadSavedItinerary(): AIItineraryResponse | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_ITINERARY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AIItineraryResponse;
  } catch (err) {
    console.error('Error loading saved itinerary:', err);
    return null;
  }
}

export function saveSavedItinerary(itinerary: AIItineraryResponse): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ITINERARY_KEY, JSON.stringify(itinerary));
  } catch (err) {
    console.error('Error saving itinerary:', err);
  }
}

export function clearSavedItinerary(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_ITINERARY_KEY);
  } catch (err) {
    console.error('Error clearing saved itinerary:', err);
  }
}
