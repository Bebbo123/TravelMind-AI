export interface LayoverSegment {
  id: string;
  airport: string;
  arrivalTime: string;   // ISO date/time string
  departureTime: string; // ISO date/time string
  notes?: string;
}

export interface FlightTicket {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string; // ISO date/time string
  arrivalTime: string;   // ISO date/time string
  bookingRef: string;    // PNR
  terminal?: string;
  gate?: string;
  seat?: string;
  notes?: string;
  layovers?: LayoverSegment[]; // Up to 3 layover segments
}

export interface Accommodation {
  id: string;
  name: string;
  address: string;
  city: string;
  checkIn: string;   // ISO date string
  checkOut: string;  // ISO date string
  bookingRef?: string;
  cost?: number;
  currency?: string;
  notes?: string;
}

export interface PlaceToVisit {
  id: string;
  name: string;
  category: 'Santuario/Tempio' | 'Ristorante/Cibo' | 'Museo/Cultura' | 'Quartiere/Shopping' | 'Natura/Parco' | 'Altro';
  city: string;
  address?: string;
  priority: 'Alta' | 'Media' | 'Bassa';
  status: 'Da Visitare' | 'Visitato';
  notes?: string;
  estimatedCostYen?: number;
}

export interface TravelData {
  flights: FlightTicket[];
  accommodations: Accommodation[];
  places: PlaceToVisit[];
}

export interface AIItineraryItem {
  id?: string;
  time: string;
  activity: string;
  activityJa?: string;
  romaji?: string;
  type: 'place' | 'transit' | 'meal' | 'break' | 'hotel_return';
  transitType?: 'flight' | 'train' | 'subway' | 'taxi' | 'walk';
  placeName?: string;
  placeNameJa?: string;
  transitDetail?: string;
  mealSuggestion?: string;
  departurePoint?: string;
  destinationPoint?: string;
  durationMinutes?: number;
  distanceKm?: number;
  costEstimateYen?: number;
  lineName?: string;
  stopCount?: number;
  changesCount?: number;
  fastestAlternative?: string;
  cheapestAlternative?: string;
  description?: string;
  history?: string;
  curiosity?: string;
  openingHours?: string;
  admissionPriceYen?: number;
  recommendedDurationMin?: number;
  crowdLevel?: 'Basso' | 'Medio' | 'Alto' | 'Molto Alto';
  interestRating?: 'Imperdibile ⭐' | 'Consigliato ⭐️' | 'Opzionale';
  services?: string[];
  website?: string;
  imageUrl?: string;
  nearbyPlaces?: string[];
  // Master Michelin & Gastronomy Additions
  isAISuggested?: boolean;
  restaurantName?: string;
  cuisineType?: string;
  recommendedDish?: string;
  priceRangeEuros?: number;
  districtFoodSpecialties?: string[];
  fatigueLevel?: 'Basso (1-3)' | 'Medio (4-6)' | 'Intenso (7-9)';
  weatherForecast?: 'Soleggiato ☀️' | 'Nuvoloso ⛅' | 'Pioggia ☔';
}
