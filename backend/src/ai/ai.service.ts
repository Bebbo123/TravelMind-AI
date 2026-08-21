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
  "estimatedCostYen": 1500, // Costo di ingresso o prezzo indicativo a notte in Yen giapponesi (numero intero o 0 se gratuito)
  "phone": "+81 XX-XXXX-XXXX (se disponibile)",
  "website": "URL ufficiale (es. https://...)",
  "priority": "Alta | Media | Bassa",
  "notes": "Consigli di viaggio fondamentali, momento migliore della giornata per la visita, fermata metropolitana o treno più vicina."
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean response JSON block if wrapped in ```json ... ```
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedJson) as AISearchResult;
  }
}
