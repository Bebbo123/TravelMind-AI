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
Sei un esperto di viaggi internazionali e concierge turistico specializzato per il Giappone e destinazioni mondiali.
L'utente sta cercando ${isPlace ? 'un luogo da visitare / un\'attrazione' : 'un alloggio / hotel'}: "${query}".

Fornisci informazioni dettagliate e precise in formato JSON strictly senza markdown extra.

Schema JSON richiesto:
{
  "name": "Nome in italiano o internazionale principale",
  "officialNameJa": "Nome in caratteri kanji/giapponesi se applicabile o lingua locale",
  "category": "${isPlace ? 'Santuario/Tempio | Ristorante/Cibo | Museo/Cultura | Quartiere/Shopping | Natura/Parco | Altro' : 'Hotel | Ryokan | Hostel | Appartamento'}",
  "city": "Città (es. Tokyo, Kyoto, Osaka)",
  "address": "Indirizzo completo leggibile",
  "openingHours": "${isPlace ? 'Orari di apertura dettagliati (es. 09:00 - 17:00 o Aperto 24h)' : 'N/A'}",
  "checkInTimes": "${!isPlace ? 'Orari di check-in e check-out (es. Check-in 15:00, Check-out 11:00)' : 'N/A'}",
  "estimatedCostYen": 1500,
  "phone": "+81 XX-XXXX-XXXX (se disponibile)",
  "website": "URL ufficiale (es. https://...)",
  "priority": "Alta | Media | Bassa",
  "notes": "Consigli di viaggio fondamentali, momento migliore della giornata per la visita, fermata metropolitana o treno più vicina."
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson) as AISearchResult;
  }

  async generateItineraryPlan(tripData: any): Promise<AIItineraryResponse> {
    if (!this.genAI) {
      throw new Error('Gemini API is not configured on backend.');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Sei un pianificatore di itinerari di viaggio altamente qualificato e valutatore di fattibilità per viaggi in Giappone.
Analizza i seguenti dati del viaggio forniti dall'utente:

VOLI: ${JSON.stringify(tripData.flights || [])}
ALLOGGI: ${JSON.stringify(tripData.accommodations || [])}
LUOGHI DA VISITARE: ${JSON.stringify(tripData.places || [])}

Compiti:
1. Organizza un itinerario dettagliato giorno per giorno (Timeline oraria) includendo:
   - Tappe e luoghi da visitare presenti nella lista dell'utente.
   - Spostamenti consigliati e mezzi di trasporto (treni JR, metropolitane, Shinkansen, bus) con stima dei minuti.
   - Pause per pranzo e cena nei quartieri dove si trova l'utente.
2. VALUTA LA FATTIBILITÀ (Feasibility):
   - Se una giornata ha troppe tappe o luoghi distanti tra loro, aggiungi avvisi di fattibilità ("feasibilityWarning") specifici.
   - Se un luogo richiede troppo tempo o è difficile da raggiungere nel tempo disponibile, segnalalo chiaramente.
3. SUGGERISCI NUOVI LUOGHI EXTRA:
   - Identifica 2 o 3 attrazioni o ristoranti imperdibili nei pressi delle zone visitate dall'utente ma NON ancora presenti nella lista dell'utente ("suggestedNewPlaces").

Restituisci ESCLUSIVAMENTE un oggetto JSON valido rispettando questo schema:

{
  "globalFeasibilityRating": "Ottima" | "Accettabile" | "Troppo Densa" | "Critica",
  "globalFeasibilityNotes": "Spiegazione sintetica della fattibilità generale del viaggio.",
  "days": [
    {
      "dayNumber": 1,
      "date": "2026-10-11",
      "title": "Giorno 1: Arrivo a Tokyo & Esplorazione Asakusa",
      "city": "Tokyo",
      "accommodationName": "Shinjuku Prince Hotel",
      "dailyFeasibilitySummary": "Ritmo bilanciato con tempo sufficiente per check-in e pranzo.",
      "timeline": [
        {
          "time": "08:20",
          "activity": "Arrivo a Tokyo Haneda (HND)",
          "type": "place",
          "placeName": "Tokyo Haneda Airport"
        },
        {
          "time": "09:30 - 10:30",
          "activity": "Trasferimento in Hotel con treno Keikyu Line",
          "type": "transit",
          "transitDetail": "Treno Keikyu Airport Line diretto a Yamanote Shinjuku (50 min, ¥620)"
        },
        {
          "time": "12:30 - 13:30",
          "activity": "Pranzo a Shinjuku",
          "type": "meal",
          "mealSuggestion": "Ramen tradizionale vicinissimo all'hotel"
        },
        {
          "time": "14:30 - 17:00",
          "activity": "Visita Tempio Senso-ji",
          "type": "place",
          "placeName": "Senso-ji Temple",
          "feasibilityWarning": null
        }
      ]
    }
  ],
  "suggestedNewPlaces": [
    {
      "id": "sug_1",
      "name": "Parco di Ueno & Mercato Ameyoko",
      "officialNameJa": "上野公園",
      "category": "Quartiere/Shopping",
      "city": "Tokyo",
      "address": "Ueno, Taito-ku, Tokyo",
      "reason": "Si trova a solo 2 fermate di metro dal tempio Senso-ji che visiterai il Giorno 1.",
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
}
