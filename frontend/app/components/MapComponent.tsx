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

const KNOWN_LOCATIONS: Record<string, { lat: number; lng: number; nameIt: string; nameJa: string }> = {
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

function getCoordsForPlace(name: string, city?: string): { lat: number; lng: number; nameIt: string; nameJa: string } {
  const normName = (name + ' ' + (city || '')).toLowerCase();
  for (const [key, loc] of Object.entries(KNOWN_LOCATIONS)) {
    if (normName.includes(key)) return loc;
  }
  if (city && city.toLowerCase().includes('kyoto')) return KNOWN_LOCATIONS['kyoto'];
  if (city && city.toLowerCase().includes('osaka')) return KNOWN_LOCATIONS['osaka'];
  return KNOWN_LOCATIONS['tokyo'];
}

export default function MapComponent({ itinerary, selectedDayNumber, onSelectDayChange }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const polylinesLayer = useRef<any>(null);

  // States
  const [mapLang, setMapLang] = useState<'IT' | 'JA'>('IT');
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  const [isPlayingTimeLapse, setIsPlayingTimeLapse] = useState<boolean>(false);
  const [activePoint, setActivePoint] = useState<MapPoint | null>(null);

  const daysList = itinerary?.days || [];
  const activeDaySchedule: AIDaySchedule | null = daysList[currentDayIndex] || daysList[0] || null;

  // Sync with selectedDayNumber prop
  useEffect(() => {
    if (selectedDayNumber && daysList.length > 0) {
      const idx = daysList.findIndex(d => d.dayNumber === selectedDayNumber);
      if (idx !== -1) setCurrentDayIndex(idx);
    }
  }, [selectedDayNumber, daysList]);

  // Time-lapse Auto Play Effect
  useEffect(() => {
    let interval: any = null;
    if (isPlayingTimeLapse && daysList.length > 0) {
      interval = setInterval(() => {
        setCurrentDayIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % daysList.length;
          if (onSelectDayChange && daysList[nextIndex]) {
            onSelectDayChange(daysList[nextIndex].dayNumber);
          }
          return nextIndex;
        });
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingTimeLapse, daysList, onSelectDayChange]);

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

    import('leaflet').then((L) => {
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

      // Clear layers
      if (markersLayer.current) markersLayer.current.clearLayers();
      if (polylinesLayer.current) polylinesLayer.current.clearLayers();

      const pointsToPlot: MapPoint[] = [];
      const flightLatLngs: [number, number][] = [];
      const transitLatLngs: [number, number][] = [];
      const walkLatLngs: [number, number][] = [];

      if (activeDaySchedule && activeDaySchedule.timeline) {
        activeDaySchedule.timeline.forEach((item, idx) => {
          const name = item.placeName || item.activity;
          const loc = getCoordsForPlace(name, activeDaySchedule.city);
          
          const offsetLat = loc.lat + (idx * 0.002);
          const offsetLng = loc.lng + (idx * 0.002);

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

          const point: MapPoint = {
            id: `p_${idx}`,
            nameIt: loc.nameIt || item.activity,
            nameJa: loc.nameJa || loc.nameIt || item.activity,
            category: cat,
            lat: offsetLat,
            lng: offsetLng,
            desc: item.transitDetail || item.mealSuggestion || item.activity,
            time: item.time
          };

          pointsToPlot.push(point);

          const coordPair: [number, number] = [offsetLat, offsetLng];
          if (cat === 'flight') flightLatLngs.push(coordPair);
          else if (cat === 'walk') walkLatLngs.push(coordPair);
          else transitLatLngs.push(coordPair);
        });
      } else {
        // Fallback default points
        pointsToPlot.push(
          { id: 'mxp', nameIt: 'Milano Malpensa (MXP)', nameJa: 'ミラノ空港', category: 'flight', lat: 45.6306, lng: 8.7281, desc: 'Partenza Volo' },
          { id: 'tokyo', nameIt: 'Stazione Tokyo', nameJa: '東京駅', category: 'transit', lat: 35.681236, lng: 139.767125, desc: 'Hub centrale Tokyo' },
          { id: 'kyoto', nameIt: 'Stazione Kyoto', nameJa: '京都駅', category: 'transit', lat: 34.985849, lng: 135.758767, desc: 'Hub centrale Kyoto' }
        );
      }

      // Render Markers with language support
      const allLatLngs: [number, number][] = [];
      pointsToPlot.forEach((pt) => {
        allLatLngs.push([pt.lat, pt.lng]);
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

      // Render Distinct Transport Lines (Flight = Purple/Cyan, Transit = Blue, Walk = Green)
      if (flightLatLngs.length > 1) {
        L.polyline(flightLatLngs, {
          color: '#a855f7',
          weight: 4,
          opacity: 0.9,
          dashArray: '10, 10'
        }).addTo(polylinesLayer.current);
      }

      if (transitLatLngs.length > 1) {
        L.polyline(transitLatLngs, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.85
        }).addTo(polylinesLayer.current);
      }

      if (walkLatLngs.length > 1) {
        L.polyline(walkLatLngs, {
          color: '#10b981',
          weight: 3,
          opacity: 0.8,
          dashArray: '4, 4'
        }).addTo(polylinesLayer.current);
      }

      // Smooth Fly-to Active Region
      if (allLatLngs.length > 1) {
        leafletMap.current.fitBounds(L.latLngBounds(allLatLngs), { padding: [50, 50], maxZoom: 12 });
      } else if (allLatLngs.length === 1) {
        leafletMap.current.setView(allLatLngs[0], 11);
      }
    });
  }, [activeDaySchedule, mapLang]);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl text-left space-y-4">
      
      {/* Time Navigation & Language Control Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🗺️ Mappa Principale Viaggio & Scorrimento Tempo
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Linee distinte per ✈️ Aerei (Viola), 🚆 Treni/Mezzi (Blu), 🚶 A Piedi (Verde)
          </p>
        </div>

        {/* Controls: Language Switcher & Time Playback */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Switch Button */}
          <button
            onClick={() => setMapLang(prev => prev === 'IT' ? 'JA' : 'IT')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Cambia Lingua Mappa"
          >
            <span>🌐 Lingua:</span>
            <span className={mapLang === 'IT' ? 'text-indigo-400 font-extrabold' : 'text-slate-400'}>IT 🇮🇹</span>
            <span>/</span>
            <span className={mapLang === 'JA' ? 'text-rose-400 font-extrabold' : 'text-slate-400'}>日本語 🇯🇵</span>
          </button>

          {/* Time-lapse Play/Pause Button */}
          <button
            onClick={() => setIsPlayingTimeLapse(!isPlayingTimeLapse)}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
              isPlayingTimeLapse
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <span>{isPlayingTimeLapse ? '⏸️ Pausa Time-Lapse' : '▶️ Play Scorrimento Tempo'}</span>
          </button>
        </div>
      </div>

      {/* Date Stepper Bar (◀️ Date 22/11/2026 ▶️) */}
      {daysList.length > 0 && activeDaySchedule && (
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={handlePrevDay}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition-all"
          >
            ◀️ Giorno Precedente
          </button>

          <div className="text-center">
            <span className="font-extrabold text-sm text-indigo-400">
              📅 {activeDaySchedule.formattedDate || activeDaySchedule.date}
            </span>
            <span className="text-xs text-slate-400 block font-medium">
              (Giorno {activeDaySchedule.dayNumber} di {daysList.length} • {activeDaySchedule.city})
            </span>
          </div>

          <button
            onClick={handleNextDay}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition-all"
          >
            Giorno Successivo ▶️
          </button>
        </div>
      )}

      {/* Leaflet Map Div */}
      <div 
        ref={mapRef} 
        className="w-full h-[400px] md:h-[480px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-inner bg-slate-950 relative"
      />

      {/* Legend & Active Point Card */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800 gap-2">
        <div className="flex flex-wrap gap-4 font-semibold">
          <span className="flex items-center gap-1.5 text-purple-400">
            <span className="w-3 h-1 bg-purple-500 rounded inline-block"></span> ✈️ Volo Aereo
          </span>
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-3 h-1 bg-blue-500 rounded inline-block"></span> 🚆 Treni / Mezzi Pubblici
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-3 h-1 bg-emerald-500 rounded inline-block"></span> 🚶 A Piedi / Passeggiata
          </span>
        </div>

        {activePoint && (
          <div className="text-right font-bold text-slate-200">
            Selezionato: {mapLang === 'JA' ? activePoint.nameJa : activePoint.nameIt}
          </div>
        )}
      </div>
    </div>
  );
}
