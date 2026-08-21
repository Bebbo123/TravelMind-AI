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
Sei un esperto di viaggi internazionali e concierge turistico per il Giappone.
L'utente sta cercando ${isPlace ? 'un luogo da visitare / un\'attrazione' : 'un alloggio / hotel'}: "${query}".

Fornisci informazioni dettagliate e precise in formato JSON strictly senza markdown extra:
{
  "name": "Nome in italiano o principale",
  "officialNameJa": "Nome in kanji/caratteri locali se applicabile",
  "category": "${isPlace ? 'Santuario/Tempio | Ristorante/Cibo | Museo/Cultura | Quartiere/Shopping | Natura/Parco | Altro' : 'Hotel | Ryokan | Hostel | Appartamento'}",
  "city": "Città (es. Tokyo, Kyoto, Osaka)",
  "address": "Indirizzo completo leggibile",
  "openingHours": "${isPlace ? 'Orari di apertura' : 'N/A'}",
  "checkInTimes": "${!isPlace ? 'Check-in 15:00, Check-out 11:00' : 'N/A'}",
  "estimatedCostYen": 1500,
  "phone": "+81 XX-XXXX-XXXX",
  "website": "https://...",
  "priority": "Alta | Media | Bassa",
  "notes": "Consigli pratici e fermata metro più vicina."
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
Sei un pianificatore di viaggi esperto in Giappone e valutatore di fattibilità.
Organizza un itinerario COMPLETO PER TUTTI I GIORNI compresi tra le date specificate dall'utente.

PREFERENZE UTENTE:
- Data Inizio Viaggio: ${preferences.startDate || 'Non specificata'}
- Data Fine Viaggio: ${preferences.endDate || 'Non specificata'}
- Ritmo di Viaggio desiderato: ${preferences.pace || 'Equilibrato'}
- Interessi principali: ${(preferences.interests || []).join(', ') || 'Tutti'}
- Note & Istruzioni Custom: ${preferences.customInstructions || 'Nessuna'}

DATI REALI SALVATI DALL'UTENTE:
VOLI: ${JSON.stringify(tripData.flights || [])}
ALLOGGI: ${JSON.stringify(tripData.accommodations || [])}
LUOGHI DA VISITARE: ${JSON.stringify(tripData.places || [])}

REGOLE TASSATIVE SGLI SPOSTAMENTI HOTEL & AEROPORTO:
1. SPOSTAMENTO AEROPORTO ➔ HOTEL: Nel giorno di arrivo, includi tassativamente nella timeline l'orario e il mezzo esatto per andare dall'aeroporto di arrivo (es. Haneda/Narita) al primo hotel (es. Keikyu Express, Tokyo Monorail o Narita Express) con durata e costo.
2. SPOSTAMENTO HOTEL ➔ HOTEL (CAMBIO CITTÀ): Nei giorni di cambio alloggio (es. quando si passa da Tokyo a Kyoto), includi nella timeline l'orario esatto di Check-out dall'Hotel 1, il trasferimento alla Stazione dei treni (es. Stazione di Tokyo), il treno Shinkansen/espresso da prendere con la durata esatta (es. 2h15m), l'arrivo alla Stazione di destinazione e il trasferimento al nuovo Hotel 2 con indicazione per il deposito bagagli.
3. SPOSTAMENTO HOTEL ➔ AEROPORTO: Nel giorno di partenza, calcola l'orario di trasferimento dall'ultimo hotel all'aeroporto di partenza con almeno 3 ore di anticipo rispetto all'orario del volo.

Istruzioni di Generazione:
1. Genera l'itinerario per OGNI giorno tra la data inizio e fine (Giorno 1 ... Giorno N).
2. Per ogni giorno includi timeline oraria con:
   - Tappe e luoghi da visitare presenti nella lista.
   - Spostamenti dettagliati con mezzi di trasporto (treni JR, metropolitane, Shinkansen, bus) e tempi in minuti.
   - Pause pranzo e cena in base al ritmo scelto e agli interessi.
   - Avvisi di fattibilità ("feasibilityWarning") se una tappa è troppo stancante, lontana o densa.
3. Fornisci 3 o 4 suggerimenti di "suggestedNewPlaces" extra vicini alle tappe visitate ma non ancora salvati.

Restituisci ESCLUSIVAMENTE un oggetto JSON valido in questo formato:
{
  "globalFeasibilityRating": "Ottima" | "Accettabile" | "Troppo Densa" | "Critica",
  "globalFeasibilityNotes": "Sommario generale della fattibilità.",
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "title": "Giorno 1: ...",
      "city": "Tokyo",
      "accommodationName": "Hotel...",
      "dailyFeasibilitySummary": "...",
      "timeline": [
        {
          "time": "09:00 - 10:00",
          "activity": "...",
          "type": "place | transit | meal | break",
          "placeName": "...",
          "transitDetail": "...",
          "mealSuggestion": "...",
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
Sei un concierge turistico AI in tempo reale per viaggiatori in Giappone.
L'utente si trova a metà giornata durante il viaggio ed ha inviato questa richiesta di MODIFICA AL VOLO per il Giorno ${req.dayNumber} (${req.date}):

RICHESTA UTENTE AL VOLO: "${req.userPrompt}"
SCHEDULE ATTUALE DEL GIORNO: ${JSON.stringify(req.currentDaySchedule)}
DATI VIAGGIO: ${JSON.stringify(req.travelData)}

Istruzioni:
1. Rielabora l'intera timeline della giornata rispettando la richiesta dell'utente (es. se ha finito prima, aggiungi attrazioni flash vicine; se è stanco, alleggerisci il programma; se piove, sostituisci con luoghi al coperto; se chiede di sostituire un luogo, trova un'alternativa eccellente).
2. Mantieni sempre chiari gli spostamenti essenziali verso l'hotel o la stazione.
3. Valuta la nuova fattibilità e aggiorna "dailyFeasibilitySummary" e gli avvisi "feasibilityWarning" nella timeline.

Restituisci ESCLUSIVAMENTE l'oggetto JSON della giornata rielaborata rispettando questo schema:
{
  "dayNumber": ${req.dayNumber},
  "date": "${req.date}",
  "title": "Giorno ${req.dayNumber}: (Titolo aggiornato)",
  "city": "${req.currentDaySchedule.city}",
  "accommodationName": "${req.currentDaySchedule.accommodationName || ''}",
  "dailyFeasibilitySummary": "Nuova valutazione di fattibilità post-modifica...",
  "timeline": [
    {
      "time": "...",
      "activity": "...",
      "type": "place | transit | meal | break",
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
