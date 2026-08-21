import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AISearchRequest {
  query: string;
  type: 'place' | 'accommodation';
}

export interface AISearchResult {
  name: string;
  officialNameJa?: string;
  category: string;
  city: string;
  address: string;
  openingHours?: string;
  checkInTimes?: string;
  estimatedCostYen?: number;
  phone?: string;
  website?: string;
  priority?: 'Alta' | 'Media' | 'Bassa';
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export interface AIItineraryItem {
  time: string;
  activity: string;
  type: 'place' | 'transit' | 'meal' | 'break';
  placeName?: string;
  transitDetail?: string;
  mealSuggestion?: string;
  costEstimateYen?: number;
  feasibilityWarning?: string;
  transitType?: 'flight' | 'train' | 'subway' | 'taxi' | 'walk';
  isAISuggested?: boolean;
  restaurantName?: string;
  cuisineType?: string;
  recommendedDish?: string;
  priceRangeEuros?: number;
  districtFoodSpecialties?: string[];
  fatigueLevel?: 'Basso (1-3)' | 'Medio (4-6)' | 'Intenso (7-9)';
  weatherForecast?: 'Soleggiato ☀️' | 'Nuvoloso ⛅' | 'Pioggia ☔';
}

export interface AIDaySchedule {
  dayNumber: number;
  date: string;
  formattedDate: string;
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
  category: string;
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

export interface ReplanDayRequest {
  dayNumber: number;
  date: string;
  currentDaySchedule: AIDaySchedule;
  userPrompt: string;
  travelData: any;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('GEMINI_API_KEY is not configured in environment variables.');
    }
  }

  async searchPlace(req: AISearchRequest): Promise<AISearchResult> {
    const { query, type } = req;
    if (!this.genAI) {
      throw new Error('Gemini API is not configured on backend.');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const isPlace = type === 'place';
    const prompt = `
Sei un esperto di viaggi internazionali e concierge turistico.
L'utente sta cercando ${isPlace ? 'un luogo da visitare / un\'attrazione' : 'un alloggio / hotel'}: "${query}".

Fornisci informazioni dettagliate e precise in formato JSON strictly senza markdown extra:
{
  "name": "Nome in italiano o principale",
  "officialNameJa": "Nome in kanji/caratteri locali se applicabile",
  "category": "${isPlace ? 'Santuario/Tempio | Ristorante/Cibo | Museo/Cultura | Quartiere/Shopping | Natura/Parco | Altro' : 'Hotel | Ryokan | Hostel | Appartamento'}",
  "city": "Città (es. Tokyo, Kyoto, Taipei, Osaka)",
  "address": "Indirizzo completo leggibile",
  "openingHours": "${isPlace ? 'Orari di apertura' : 'N/A'}",
  "checkInTimes": "${!isPlace ? 'Check-in 15:00, Check-out 11:00' : 'N/A'}",
  "estimatedCostYen": 1500,
  "phone": "+81 XX-XXXX-XXXX",
  "website": "https://...",
  "priority": "Alta | Media | Bassa",
  "notes": "Consigli pratici e fermata più vicina."
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson) as AISearchResult;
  }

  async generateItineraryPlan(payload: any): Promise<AIItineraryResponse> {
    if (!this.genAI) {
      throw new Error('Gemini API is not configured on backend.');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const tripData = payload.tripData || payload;
    const preferences = payload.preferences || {};

    const prompt = `
Sei un pianificatore di viaggi esperto, guida Michelin e concierge turistico internazionale.
Organizza un itinerario PROFESSIONALE E DETTAGLIATO PER TUTTI I GIORNI tra le date specificate.

PREFERENZE UTENTE:
- Data Inizio Viaggio: ${preferences.startDate || 'Non specificata'}
- Data Fine Viaggio: ${preferences.endDate || 'Non specificata'}
- Ritmo di Viaggio desiderato: ${preferences.pace || 'Equilibrato'}
- Interessi principali: ${(preferences.interests || []).join(', ') || 'Tutti'}
- Note & Istruzioni Custom: ${preferences.customInstructions || 'Nessuna'}

DATI REALI SALVATI DALL'UTENTE:
VOLI SALVATI: ${JSON.stringify(tripData.flights || [])}
ALLOGGI SALVATI: ${JSON.stringify(tripData.accommodations || [])}
LUOGHI DA VISITARE SALVATI: ${JSON.stringify(tripData.places || [])}

REGOLE TASSATIVE SULLE DATE ED ORARI DEI VOLI:
1. GIORNO DI ARRIVO VOLO: Se un volo atterra in un giorno (es. 23/10 alle 10:00 AM), È VIETATO PANIFICARE QUALSIASI VISITA O PARTENZA DA HOTEL PRIMA DELL'ORARIO DI ATTERRAGGIO (10:00).
   La timeline del giorno di arrivo DEVE iniziare tassativamente con:
   - Orario Atterraggio (es. 10:00): Atterraggio Aeroporto
   - 10:00 - 11:15: 🛂 Immigrazione, Controllo Passaporti & Recupero Bagagli
   - 11:15 - 12:05: 🚆 Trasferimento Treno Airport Express ➔ Hotel
   - 12:05 - 13:00: 🏨 Check-in / Deposito Valigie presso Hotel
   - 13:00 - 14:00: 🍜 Pranzo di Benvenuto
   - 14:30 in poi: Prime visite leggere del pomeriggio.
2. GIORNO DI PARTENZA VOLO: Presentarsi 3 ore prima in aeroporto per voli internazionali. Bloccare qualsiasi visita turistica dopo l'orario di trasferimento.
3. CLUSTERING GEOGRAFICO QUARTIERI: Raggruppa le attrazioni della stessa zona nella stessa giornata.

Restituisci ESCLUSIVAMENTE un oggetto JSON valido in questo formato:
{
  "globalFeasibilityRating": "Ottima" | "Accettabile" | "Troppo Densa" | "Critica",
  "globalFeasibilityNotes": "Sommario generale della fattibilità.",
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "formattedDate": "DD/MM/YYYY",
      "title": "...",
      "city": "...",
      "accommodationName": "...",
      "dailyFeasibilitySummary": "...",
      "fatigueScore": 3,
      "weatherForecast": "Soleggiato ☀️",
      "timeline": [
        {
          "time": "10:00 - 11:15",
          "activity": "...",
          "type": "place | transit | meal | break",
          "transitType": "flight | train | subway | taxi | walk",
          "placeName": "...",
          "transitDetail": "...",
          "mealSuggestion": "...",
          "recommendedDish": "...",
          "priceRangeEuros": 12,
          "districtFoodSpecialties": ["Xiao Long Bao"],
          "costEstimateYen": 0,
          "feasibilityWarning": null
        }
      ]
    }
  ],
  "suggestedNewPlaces": [
    {
      "id": "sug_1",
      "name": "...",
      "officialNameJa": "...",
      "category": "...",
      "city": "...",
      "address": "...",
      "reason": "...",
      "estimatedCostYen": 0
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson) as AIItineraryResponse;
  }

  async replanDayWithAI(req: ReplanDayRequest): Promise<AIDaySchedule> {
    if (!this.genAI) {
      throw new Error('Gemini API is not configured on backend.');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Sei un concierge turistico AI in tempo reale.
L'utente si trova durante il viaggio ed ha inviato questa richiesta di MODIFICA AL VOLO per il giorno ${req.date}:

RICHESTA UTENTE AL VOLO: "${req.userPrompt}"
SCHEDULE ATTUALE DEL GIORNO: ${JSON.stringify(req.currentDaySchedule)}
DATI VIAGGIO: ${JSON.stringify(req.travelData)}

Istruzioni:
1. Rielabora la timeline della giornata rispettando i vincoli di arrivo volo ed immigrazione.
2. Inserisci alternative gastronomiche locali coerenti con la nuova zona.

Restituisci ESCLUSIVAMENTE l'oggetto JSON della giornata rielaborata rispettando questo schema:
{
  "dayNumber": ${req.dayNumber},
  "date": "${req.date}",
  "formattedDate": "${req.currentDaySchedule.formattedDate || req.date}",
  "title": "...",
  "city": "${req.currentDaySchedule.city}",
  "accommodationName": "${req.currentDaySchedule.accommodationName || ''}",
  "dailyFeasibilitySummary": "...",
  "timeline": [
    {
      "time": "...",
      "activity": "...",
      "type": "place | transit | meal | break",
      "transitType": "flight | train | subway | taxi | walk",
      "placeName": "...",
      "transitDetail": "...",
      "mealSuggestion": "...",
      "costEstimateYen": 0,
      "feasibilityWarning": null
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson) as AIDaySchedule;
  }
}
