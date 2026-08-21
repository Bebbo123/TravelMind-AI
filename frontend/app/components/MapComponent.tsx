'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AIItineraryResponse, AIDaySchedule, AIItineraryItem } from '../utils/aiItinerary';

interface MapPoint {
  id: string;
  nameIt: string;
  nameJa: string;
  category: 'flight' | 'transit' | 'attraction' | 'food' | 'hotel' | 'walk';
  lat: number;
  lng: number;
  desc: string;
  time?: string;
}

interface MapComponentProps {
  itinerary?: AIItineraryResponse | null;
  selectedDayNumber?: number;
  onSelectDayChange?: (dayNumber: number) => void;
}

const ACCURATE_KNOWN_LOCATIONS: Record<string, { lat: number; lng: number; nameIt: string; nameJa: string }> = {
  'milano': { lat: 45.6306, lng: 8.7281, nameIt: 'Aeroporto Milano Malpensa (MXP)', nameJa: 'ミラノ・マルペンサ空港' },
  'roma': { lat: 41.7999, lng: 12.2462, nameIt: 'Aeroporto Roma Fiumicino (FCO)', nameJa: 'ローマ・フィウミチーノ空港' },
  'abu dhabi': { lat: 24.4330, lng: 54.6511, nameIt: 'Aeroporto Abu Dhabi (AUH)', nameJa: 'アブダビ国際空港' },
  'doha': { lat: 25.2609, lng: 51.6138, nameIt: 'Aeroporto Doha Hamad (DOH)', nameJa: 'ドーハ・ハマド国際空港' },
  'dubai': { lat: 25.2532, lng: 55.3657, nameIt: 'Aeroporto Dubai (DXB)', nameJa: 'ドバイ国際空港' },
  'tokyo': { lat: 35.681236, lng: 139.767125, nameIt: 'Stazione di Tokyo', nameJa: '東京駅' },
  'shinjuku': { lat: 35.6938, lng: 139.7034, nameIt: 'Shinjuku Prince Hotel', nameJa: '新宿プリンスホテル' },
  'shibuya': { lat: 35.658034, lng: 139.701636, nameIt: 'Incrocio di Shibuya', nameJa: '渋谷スクランブル交差点' },
  'asakusa': { lat: 35.714765, lng: 139.796655, nameIt: 'Tempio Sensō-ji (Asakusa)', nameJa: '浅草寺' },
  'harajuku': { lat: 35.6702, lng: 139.7027, nameIt: 'Takeshita Street (Harajuku)', nameJa: '竹下通り' },
  'ginza': { lat: 35.6719, lng: 139.7648, nameIt: 'Quartiere Ginza', nameJa: '銀座' },
  'akihabara': { lat: 35.6997, lng: 139.7714, nameIt: 'Akihabara Electric Town', nameJa: '秋葉原電気街' },
  'ueno': { lat: 35.7141, lng: 139.7741, nameIt: 'Parco di Ueno & Ameyoko', nameJa: '上野恩賜公園' },
  'haneda': { lat: 35.5494, lng: 139.7798, nameIt: 'Aeroporto Tokyo Haneda (HND)', nameJa: '羽田空港' },
  'narita': { lat: 35.7720, lng: 140.3929, nameIt: 'Aeroporto Tokyo Narita (NRT)', nameJa: '成田国際空港' },
  'kyoto': { lat: 34.985849, lng: 135.758767, nameIt: 'Stazione Centrale di Kyoto', nameJa: '京都駅' },
  'gion': { lat: 35.0037, lng: 135.7772, nameIt: 'Quartiere Gion (Kyoto)', nameJa: '祇園' },
  'fushimi inari': { lat: 34.96714, lng: 135.772671, nameIt: 'Santuario Fushimi Inari Taisha', nameJa: '伏見稲荷大社' },
  'arashiyama': { lat: 35.0117, lng: 135.6777, nameIt: 'Foresta di Bambù di Arashiyama', nameJa: '嵐山竹林' },
  'osaka': { lat: 34.665809, lng: 135.501175, nameIt: 'Stazione Namba Osaka', nameJa: '難波駅' },
  'dotonbori': { lat: 34.6687, lng: 135.5013, nameIt: 'Dotonbori (Osaka)', nameJa: '道頓堀' },
  'fuji': { lat: 35.360625, lng: 138.727363, nameIt: 'Monte Fuji', nameJa: '富士山' },
};

const geocodeCache: Record<string, { lat: number; lng: number }> = {};

async function fetchAccurateCoords(name: string, city?: string): Promise<{ lat: number; lng: number; nameIt: string; nameJa: string }> {
  const normName = (name + ' ' + (city || '')).toLowerCase();
  for (const [key, loc] of Object.entries(ACCURATE_KNOWN_LOCATIONS)) {
    if (normName.includes(key)) return loc;
  }

  // Check cache
  if (geocodeCache[normName]) {
    return { ...geocodeCache[normName], nameIt: name, nameJa: name };
  }

  // Geocode dynamically with OpenStreetMap Nominatim
  try {
    const queryStr = encodeURIComponent(`${name} ${city || ''}`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${queryStr}&limit=1`, {
      headers: { 'User-Agent': 'TravelMind-AI-App' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        geocodeCache[normName] = coords;
        return { ...coords, nameIt: name, nameJa: data[0].display_name || name };
      }
    }
  } catch (e) {
    // fallback
  }

  if (city && city.toLowerCase().includes('kyoto')) return ACCURATE_KNOWN_LOCATIONS['kyoto'];
  if (city && city.toLowerCase().includes('osaka')) return ACCURATE_KNOWN_LOCATIONS['osaka'];
  return ACCURATE_KNOWN_LOCATIONS['tokyo'];
}

export default function MapComponent({ itinerary, selectedDayNumber, onSelectDayChange }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const polylinesLayer = useRef<any>(null);

  // States
  const [mapLang, setMapLang] = useState<'IT' | 'JA'>('IT');
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  const [activePoint, setActivePoint] = useState<MapPoint | null>(null);

  const daysList = itinerary?.days || [];
  const activeDaySchedule: AIDaySchedule | null = daysList[currentDayIndex] || daysList[0] || null;

  // Sync with selectedDayNumber prop from parent
  useEffect(() => {
    if (selectedDayNumber && daysList.length > 0) {
      const idx = daysList.findIndex(d => d.dayNumber === selectedDayNumber);
      if (idx !== -1) setCurrentDayIndex(idx);
    }
  }, [selectedDayNumber, daysList]);

  // Strictly Manual Day Stepping Handlers
  const handlePrevDay = () => {
    if (daysList.length === 0) return;
    const newIdx = currentDayIndex > 0 ? currentDayIndex - 1 : daysList.length - 1;
    setCurrentDayIndex(newIdx);
    if (onSelectDayChange && daysList[newIdx]) {
      onSelectDayChange(daysList[newIdx].dayNumber);
    }
  };

  const handleNextDay = () => {
    if (daysList.length === 0) return;
    const newIdx = (currentDayIndex + 1) % daysList.length;
    setCurrentDayIndex(newIdx);
    if (onSelectDayChange && daysList[newIdx]) {
      onSelectDayChange(daysList[newIdx].dayNumber);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    let isMounted = true;

    import('leaflet').then(async (L) => {
      if (!leafletMap.current) {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const map = L.map(mapRef.current!).setView([35.681236, 139.767125], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        leafletMap.current = map;
        markersLayer.current = L.layerGroup().addTo(map);
        polylinesLayer.current = L.layerGroup().addTo(map);
      }

      // Clear previous layers
      if (markersLayer.current) markersLayer.current.clearLayers();
      if (polylinesLayer.current) polylinesLayer.current.clearLayers();

      const pointsToPlot: MapPoint[] = [];

      if (activeDaySchedule && activeDaySchedule.timeline) {
        for (let idx = 0; idx < activeDaySchedule.timeline.length; idx++) {
          const item = activeDaySchedule.timeline[idx];
          const name = item.placeName || item.activity;
          const loc = await fetchAccurateCoords(name, activeDaySchedule.city);
          
          if (!isMounted) return;

          const cat: MapPoint['category'] = 
            item.transitType === 'flight' || item.activity.toLowerCase().includes('volo') || item.activity.toLowerCase().includes('atterraggio')
              ? 'flight'
              : item.transitType === 'walk'
              ? 'walk'
              : item.type === 'transit'
              ? 'transit'
              : item.type === 'meal'
              ? 'food'
              : 'attraction';

          pointsToPlot.push({
            id: `p_${idx}`,
            nameIt: loc.nameIt || item.activity,
            nameJa: loc.nameJa || loc.nameIt || item.activity,
            category: cat,
            lat: loc.lat,
            lng: loc.lng,
            desc: item.transitDetail || item.mealSuggestion || item.activity,
            time: item.time
          });
        }
      } else {
        // Fallback default points
        pointsToPlot.push(
          { id: 'mxp', nameIt: 'Milano Malpensa (MXP)', nameJa: 'ミラノ空港', category: 'flight', lat: 45.6306, lng: 8.7281, desc: 'Partenza Volo' },
          { id: 'tokyo', nameIt: 'Stazione Tokyo', nameJa: '東京駅', category: 'transit', lat: 35.681236, lng: 139.767125, desc: 'Hub centrale Tokyo' },
          { id: 'kyoto', nameIt: 'Stazione Kyoto', nameJa: '京都駅', category: 'transit', lat: 34.985849, lng: 135.758767, desc: 'Hub centrale Kyoto' }
        );
      }

      if (!isMounted) return;

      // Render Markers
      const flightLatLngs: [number, number][] = [];
      const transitLatLngs: [number, number][] = [];
      const walkLatLngs: [number, number][] = [];
      const allLatLngs: [number, number][] = [];

      pointsToPlot.forEach((pt) => {
        const coordPair: [number, number] = [pt.lat, pt.lng];
        allLatLngs.push(coordPair);

        if (pt.category === 'flight') flightLatLngs.push(coordPair);
        else if (pt.category === 'walk') walkLatLngs.push(coordPair);
        else transitLatLngs.push(coordPair);

        const displayName = mapLang === 'JA' ? pt.nameJa : pt.nameIt;

        const iconEmoji = 
          pt.category === 'flight' ? '✈️' :
          pt.category === 'transit' ? '🚆' :
          pt.category === 'walk' ? '🚶' :
          pt.category === 'food' ? '🍜' : '📍';

        const marker = L.marker([pt.lat, pt.lng]).addTo(markersLayer.current);
        
        const popupContent = `
          <div style="color: #0f172a; font-family: sans-serif; min-width: 180px;">
            <strong style="font-size: 13px; display: block; margin-bottom: 4px;">${iconEmoji} ${displayName}</strong>
            ${pt.time ? `<span style="font-size: 11px; color: #4f46e5; font-weight: bold;">${pt.time}</span>` : ''}
            <p style="font-size: 11px; color: #475569; margin: 4px 0 0 0;">${pt.desc}</p>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.on('click', () => setActivePoint(pt));
      });

      // Render Polylines Chronologically in Order of Sequence
      if (allLatLngs.length > 1) {
        // Main chronological route line
        L.polyline(allLatLngs, {
          color: '#6366f1',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 6'
        }).addTo(polylinesLayer.current);
      }

      // Smooth Fly-to Active Region
      if (allLatLngs.length > 1) {
        leafletMap.current.fitBounds(L.latLngBounds(allLatLngs), { padding: [50, 50], maxZoom: 12 });
      } else if (allLatLngs.length === 1) {
        leafletMap.current.setView(allLatLngs[0], 11);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeDaySchedule, mapLang]);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl text-left space-y-4">
      
      {/* Control Header & Language Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🗺️ Mappa Principale Viaggio
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Geocodifica reale ed etichette bilingue per tutti i luoghi ed i voli del viaggio
          </p>
        </div>

        {/* Language Switcher */}
        <button
          onClick={() => setMapLang(prev => prev === 'IT' ? 'JA' : 'IT')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer shadow-md"
          title="Switch tra Italiano e Lingua Locale"
        >
          <span>🌐 Lingua Mappa:</span>
          <span className={mapLang === 'IT' ? 'text-indigo-400 font-extrabold' : 'text-slate-400'}>Italiano 🇮🇹</span>
          <span>/</span>
          <span className={mapLang === 'JA' ? 'text-rose-400 font-extrabold' : 'text-slate-400'}>日本語 🇯🇵</span>
        </button>
      </div>

      {/* Strictly Manual Date Stepper Bar */}
      {daysList.length > 0 && activeDaySchedule && (
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 shadow-inner">
          <button
            onClick={handlePrevDay}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition-all active:scale-95 cursor-pointer"
          >
            ◀️ Giorno Precedente
          </button>

          <div className="text-center">
            <span className="font-extrabold text-sm md:text-base text-indigo-400">
              📅 {activeDaySchedule.formattedDate || activeDaySchedule.date}
            </span>
            <span className="text-xs text-slate-400 block font-medium">
              (Giorno {activeDaySchedule.dayNumber} di {daysList.length} • {activeDaySchedule.city})
            </span>
          </div>

          <button
            onClick={handleNextDay}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition-all active:scale-95 cursor-pointer"
          >
            Giorno Successivo ▶️
          </button>
        </div>
      )}

      {/* Single Clean Leaflet Map Div */}
      <div 
        ref={mapRef} 
        className="w-full h-[400px] md:h-[480px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-inner bg-slate-950 relative"
      />

      {/* Selected Point Info Footer */}
      {activePoint && (
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeIn">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {activePoint.category === 'flight' ? '✈️' : activePoint.category === 'transit' ? '🚆' : activePoint.category === 'food' ? '🍜' : '📍'}
              </span>
              <h4 className="font-bold text-white text-base">
                {mapLang === 'JA' ? activePoint.nameJa : activePoint.nameIt}
              </h4>
            </div>
            <p className="text-xs text-slate-300 mt-1">{activePoint.desc}</p>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${activePoint.lat},${activePoint.lng}&travelmode=transit`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shrink-0 flex items-center gap-1.5"
          >
            Indicazioni Google Maps 🗺️
          </a>
        </div>
      )}
    </div>
  );
}
