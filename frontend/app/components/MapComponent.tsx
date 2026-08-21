'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AIItineraryResponse, AIDaySchedule } from '../utils/aiItinerary';

interface MapPoint {
  id: string;
  nameIt: string;
  nameLocal: string;
  category: 'flight' | 'train' | 'subway' | 'taxi' | 'walk' | 'food' | 'hotel' | 'attraction';
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

const ACCURATE_KNOWN_LOCATIONS: Record<string, { lat: number; lng: number; nameIt: string; nameLocal: string }> = {
  'roma': { lat: 41.7999, lng: 12.2462, nameIt: 'Aeroporto Roma Fiumicino (FCO)', nameLocal: 'Aeroporto di Roma-Fiumicino' },
  'milano': { lat: 45.6306, lng: 8.7281, nameIt: 'Aeroporto Milano Malpensa (MXP)', nameLocal: 'Aeroporto di Milano-Malpensa' },
  'abu dhabi': { lat: 24.4330, lng: 54.6511, nameIt: 'Aeroporto Abu Dhabi (AUH)', nameLocal: 'مطار أبو ظبي الدولي' },
  'taipei': { lat: 25.0797, lng: 121.2342, nameIt: 'Aeroporto Taipei Taoyuan (TPE)', nameLocal: '臺灣桃園國際機場' },
  'sky garden ii': { lat: 25.0478, lng: 121.5170, nameIt: 'Hotel Sky Garden II (Taipei)', nameLocal: 'Sky Garden II 台北' },
  'taipei 101': { lat: 25.0339, lng: 121.5645, nameIt: 'Grattacielo Taipei 101', nameLocal: '臺北101' },
  'shilin': { lat: 25.0888, lng: 121.5244, nameIt: 'Mercato Serale di Shilin (Taipei)', nameLocal: '士林夜市' },
  'tokyo': { lat: 35.681236, lng: 139.767125, nameIt: 'Stazione di Tokyo', nameLocal: '東京駅' },
  'shinjuku': { lat: 35.6938, lng: 139.7034, nameIt: 'Shinjuku Prince Hotel', nameLocal: '新宿プリンスホテル' },
  'shibuya': { lat: 35.658034, lng: 139.701636, nameIt: 'Incrocio di Shibuya', nameLocal: '渋谷スクランブル交差点' },
  'asakusa': { lat: 35.714765, lng: 139.796655, nameIt: 'Tempio Sensō-ji (Asakusa)', nameLocal: '浅草寺' },
  'harajuku': { lat: 35.6702, lng: 139.7027, nameIt: 'Takeshita Street (Harajuku)', nameLocal: '竹下通り' },
  'ginza': { lat: 35.6719, lng: 139.7648, nameIt: 'Quartiere Ginza', nameLocal: '銀座' },
  'akihabara': { lat: 35.6997, lng: 139.7714, nameIt: 'Akihabara Electric Town', nameLocal: '秋葉原電気街' },
  'ueno': { lat: 35.7141, lng: 139.7741, nameIt: 'Parco di Ueno & Ameyoko', nameLocal: '上野恩賜公園' },
  'haneda': { lat: 35.5494, lng: 139.7798, nameIt: 'Aeroporto Tokyo Haneda (HND)', nameLocal: '羽田空港' },
  'narita': { lat: 35.7720, lng: 140.3929, nameIt: 'Aeroporto Tokyo Narita (NRT)', nameLocal: '成田国際空港' },
  'kyoto': { lat: 34.985849, lng: 135.758767, nameIt: 'Stazione Centrale di Kyoto', nameLocal: '京都駅' },
  'gion': { lat: 35.0037, lng: 135.7772, nameIt: 'Quartiere Gion (Kyoto)', nameLocal: '祇園' },
  'fushimi inari': { lat: 34.96714, lng: 135.772671, nameIt: 'Santuario Fushimi Inari Taisha', nameLocal: '伏見稲荷大社' },
  'osaka': { lat: 34.665809, lng: 135.501175, nameIt: 'Stazione Namba Osaka', nameLocal: '難波駅' },
  'dotonbori': { lat: 34.6687, lng: 135.5013, nameIt: 'Dotonbori (Osaka)', nameLocal: '道頓堀' }
};

const geocodeCache: Record<string, { lat: number; lng: number }> = {};

async function fetchAccurateCoords(name: string, city?: string): Promise<{ lat: number; lng: number; nameIt: string; nameLocal: string }> {
  const normName = (name + ' ' + (city || '')).toLowerCase();
  for (const [key, loc] of Object.entries(ACCURATE_KNOWN_LOCATIONS)) {
    if (normName.includes(key)) return loc;
  }

  if (geocodeCache[normName]) {
    return { ...geocodeCache[normName], nameIt: name, nameLocal: name };
  }

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
        return { ...coords, nameIt: name, nameLocal: data[0].display_name || name };
      }
    }
  } catch (e) {
    // fallback
  }

  if (city && city.toLowerCase().includes('taipei')) return ACCURATE_KNOWN_LOCATIONS['taipei'];
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
  const [mapLang, setMapLang] = useState<'IT' | 'LOCAL'>('IT');
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  const [activePoint, setActivePoint] = useState<MapPoint | null>(null);

  const daysList = itinerary?.days || [];
  const activeDaySchedule: AIDaySchedule | null = daysList[currentDayIndex] || daysList[0] || null;

  // Sync with selectedDayNumber prop from parent
  useEffect(() => {
    if (selectedDayNumber && daysList.length > 0) {
      const idx = daysList.findIndex(d => d.dayNumber === selectedDayNumber);
      if (idx !== -1 && idx !== currentDayIndex) {
        setCurrentDayIndex(idx);
      }
    }
  }, [selectedDayNumber, daysList]);

  // Manual Day Stepping Handlers
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

          let cat: MapPoint['category'] = 'attraction';
          if (item.transitType === 'flight' || item.activity.toLowerCase().includes('volo') || item.activity.toLowerCase().includes('atterraggio')) {
            cat = 'flight';
          } else if (item.transitType === 'subway') {
            cat = 'subway';
          } else if (item.transitType === 'train') {
            cat = 'train';
          } else if (item.transitType === 'taxi') {
            cat = 'taxi';
          } else if (item.transitType === 'walk') {
            cat = 'walk';
          } else if (item.type === 'meal') {
            cat = 'food';
          } else if (item.type === 'break' || item.activity.toLowerCase().includes('hotel') || item.activity.toLowerCase().includes('check-in')) {
            cat = 'hotel';
          }

          pointsToPlot.push({
            id: `p_${idx}`,
            nameIt: loc.nameIt || item.activity,
            nameLocal: loc.nameLocal || loc.nameIt || item.activity,
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
          { id: 'fco', nameIt: 'Roma Fiumicino (FCO)', nameLocal: 'Aeroporto Roma Fiumicino', category: 'flight', lat: 41.7999, lng: 12.2462, desc: 'Partenza Volo' },
          { id: 'tpe', nameIt: 'Taipei Taoyuan (TPE)', nameLocal: '桃園國際機場', category: 'flight', lat: 25.0797, lng: 121.2342, desc: 'Scalo / Arrivo Taipei' },
          { id: 'tokyo', nameIt: 'Stazione Tokyo', nameLocal: '東京駅', category: 'train', lat: 35.681236, lng: 139.767125, desc: 'Hub centrale Tokyo' }
        );
      }

      if (!isMounted) return;

      // Render Markers & Color-Coded Polylines by Transport Type
      const allLatLngs: [number, number][] = [];

      for (let i = 0; i < pointsToPlot.length; i++) {
        const pt = pointsToPlot[i];
        const coordPair: [number, number] = [pt.lat, pt.lng];
        allLatLngs.push(coordPair);

        const displayName = mapLang === 'LOCAL' ? pt.nameLocal : pt.nameIt;

        const iconEmoji = 
          pt.category === 'flight' ? '✈️' :
          pt.category === 'train' ? '🚆' :
          pt.category === 'subway' ? '🚇' :
          pt.category === 'taxi' ? '🚕' :
          pt.category === 'walk' ? '🚶' :
          pt.category === 'hotel' ? '🏨' :
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

        // Connect polyline to next point with distinct color and stroke
        if (i < pointsToPlot.length - 1) {
          const nextPt = pointsToPlot[i + 1];
          const segmentCoords: [[number, number], [number, number]] = [coordPair, [nextPt.lat, nextPt.lng]];

          let lineColor = '#6366f1';
          let dashArray = '0';
          let weight = 4;

          if (pt.category === 'flight' || nextPt.category === 'flight') {
            lineColor = '#a855f7'; // Purple for Flight
            dashArray = '10, 10';
            weight = 5;
          } else if (pt.category === 'train' || nextPt.category === 'train') {
            lineColor = '#2563eb'; // Deep Blue for Train/Shinkansen
            weight = 4;
          } else if (pt.category === 'subway' || nextPt.category === 'subway') {
            lineColor = '#06b6d4'; // Cyan for Metro
            weight = 4;
          } else if (pt.category === 'taxi' || nextPt.category === 'taxi') {
            lineColor = '#f59e0b'; // Amber for Taxi
            weight = 4;
          } else if (pt.category === 'walk' || nextPt.category === 'walk') {
            lineColor = '#10b981'; // Emerald Green for Walking
            dashArray = '4, 4';
            weight = 3;
          }

          L.polyline(segmentCoords, {
            color: lineColor,
            weight,
            opacity: 0.85,
            dashArray
          }).addTo(polylinesLayer.current);
        }
      }

      // Smooth Fly-to Active Region for Selected Day
      if (allLatLngs.length > 1) {
        leafletMap.current.fitBounds(L.latLngBounds(allLatLngs), { padding: [50, 50], maxZoom: 12 });
      } else if (allLatLngs.length === 1) {
        leafletMap.current.setView(allLatLngs[0], 11);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeDaySchedule, currentDayIndex, mapLang]);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl text-left space-y-4">
      
      {/* Control Header & Language Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🗺️ Mappa Principale Viaggio
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sincronizzata con il giorno attivo • Scomposizione tratte con codifica colori per mezzo
          </p>
        </div>

        {/* Language Switcher */}
        <button
          onClick={() => setMapLang(prev => prev === 'IT' ? 'LOCAL' : 'IT')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer shadow-md"
          title="Switch tra Italiano e Lingua Locale"
        >
          <span>🌐 Lingua Mappa:</span>
          <span className={mapLang === 'IT' ? 'text-indigo-400 font-extrabold' : 'text-slate-400'}>Italiano 🇮🇹</span>
          <span>/</span>
          <span className={mapLang === 'LOCAL' ? 'text-rose-400 font-extrabold' : 'text-slate-400'}>Lingua Locale 🇹🇼/🇯🇵</span>
        </button>
      </div>

      {/* Transport Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        <span className="text-slate-400">Legenda Mezzi:</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-purple-500 rounded"></span> ✈️ Aereo</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-blue-600 rounded"></span> 🚆 Treno JR/Shinkansen</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-cyan-500 rounded"></span> 🚇 Metro</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-amber-500 rounded"></span> 🚕 Taxi</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-emerald-500 rounded"></span> 🚶 A Piedi</span>
      </div>

      {/* Manual Date Stepper Bar */}
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
                {activePoint.category === 'flight' ? '✈️' : activePoint.category === 'train' ? '🚆' : activePoint.category === 'subway' ? '🚇' : activePoint.category === 'taxi' ? '🚕' : activePoint.category === 'walk' ? '🚶' : '📍'}
              </span>
              <h4 className="font-bold text-white text-base">
                {mapLang === 'LOCAL' ? activePoint.nameLocal : activePoint.nameIt}
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
