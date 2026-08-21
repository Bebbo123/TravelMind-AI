'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AIItineraryResponse, AIDaySchedule, AIItineraryItem } from '../utils/aiItinerary';

interface MapPoint {
  id: string;
  name: string;
  category: 'transit' | 'attraction' | 'food' | 'hotel';
  lat: number;
  lng: number;
  desc: string;
  time?: string;
}

interface MapComponentProps {
  itinerary?: AIItineraryResponse | null;
  selectedDayNumber?: number;
}

const KNOWN_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  'tokyo': { lat: 35.681236, lng: 139.767125 },
  'shinjuku': { lat: 35.6938, lng: 139.7034 },
  'shibuya': { lat: 35.658034, lng: 139.701636 },
  'asakusa': { lat: 35.714765, lng: 139.796655 },
  'harajuku': { lat: 35.6702, lng: 139.7027 },
  'ginza': { lat: 35.6719, lng: 139.7648 },
  'akihabara': { lat: 35.6997, lng: 139.7714 },
  'ueno': { lat: 35.7141, lng: 139.7741 },
  'haneda': { lat: 35.5494, lng: 139.7798 },
  'narita': { lat: 35.7720, lng: 140.3929 },
  'kyoto': { lat: 34.985849, lng: 135.758767 },
  'gion': { lat: 35.0037, lng: 135.7772 },
  'fushimi inari': { lat: 34.96714, lng: 135.772671 },
  'arashiyama': { lat: 35.0117, lng: 135.6777 },
  'osaka': { lat: 34.665809, lng: 135.501175 },
  'dotonbori': { lat: 34.6687, lng: 135.5013 },
  'fuji': { lat: 35.360625, lng: 138.727363 },
};

function getCoordsForPlace(name: string, city?: string): { lat: number; lng: number } {
  const normName = (name + ' ' + (city || '')).toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_LOCATIONS)) {
    if (normName.includes(key)) return coords;
  }
  if (city && city.toLowerCase().includes('kyoto')) return KNOWN_LOCATIONS['kyoto'];
  if (city && city.toLowerCase().includes('osaka')) return KNOWN_LOCATIONS['osaka'];
  return KNOWN_LOCATIONS['tokyo'];
}

export default function MapComponent({ itinerary, selectedDayNumber }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const polylineLayer = useRef<any>(null);

  const [activeDaySchedule, setActiveDaySchedule] = useState<AIDaySchedule | null>(null);
  const [activePoint, setActivePoint] = useState<MapPoint | null>(null);

  useEffect(() => {
    if (itinerary && itinerary.days && itinerary.days.length > 0) {
      const targetDay = selectedDayNumber 
        ? itinerary.days.find(d => d.dayNumber === selectedDayNumber) || itinerary.days[0]
        : itinerary.days[0];
      setActiveDaySchedule(targetDay);
    } else {
      setActiveDaySchedule(null);
    }
  }, [itinerary, selectedDayNumber]);

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

        const map = L.map(mapRef.current!).setView([35.681236, 139.767125], 8);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        leafletMap.current = map;
        markersLayer.current = L.layerGroup().addTo(map);
        polylineLayer.current = L.layerGroup().addTo(map);
      }

      // Clear previous layers
      if (markersLayer.current) markersLayer.current.clearLayers();
      if (polylineLayer.current) polylineLayer.current.clearLayers();

      const pointsToPlot: MapPoint[] = [];

      if (activeDaySchedule && activeDaySchedule.timeline) {
        // Build map points from active day's diary timeline
        activeDaySchedule.timeline.forEach((item, idx) => {
          const name = item.placeName || item.activity;
          const coords = getCoordsForPlace(name, activeDaySchedule.city);
          
          // Slight offset for points with identical coordinates
          const offsetLat = coords.lat + (idx * 0.003);
          const offsetLng = coords.lng + (idx * 0.003);

          pointsToPlot.push({
            id: `p_${idx}`,
            name: `${item.time} - ${item.activity}`,
            category: item.type === 'transit' ? 'transit' : item.type === 'meal' ? 'food' : 'attraction',
            lat: offsetLat,
            lng: offsetLng,
            desc: item.transitDetail || item.mealSuggestion || item.activity,
            time: item.time
          });
        });
      } else {
        // Fallback default points
        pointsToPlot.push(
          { id: 'tokyo', name: 'Stazione Tokyo', category: 'transit', lat: 35.681236, lng: 139.767125, desc: 'Hub centrale Tokyo' },
          { id: 'kyoto', name: 'Stazione Kyoto', category: 'transit', lat: 34.985849, lng: 135.758767, desc: 'Hub centrale Kyoto' },
          { id: 'fushimi', name: 'Fushimi Inari', category: 'attraction', lat: 34.96714, lng: 135.772671, desc: '10.000 torii rossi' }
        );
      }

      // Plot Markers
      const latLngs: [number, number][] = [];
      pointsToPlot.forEach((pt) => {
        latLngs.push([pt.lat, pt.lng]);

        const iconEmoji = pt.category === 'transit' ? '🚇' : pt.category === 'food' ? '🍜' : '📍';
        const marker = L.marker([pt.lat, pt.lng]).addTo(markersLayer.current);
        
        const popupContent = `
          <div style="color: #0f172a; font-family: sans-serif; min-width: 180px;">
            <strong style="font-size: 13px; display: block; margin-bottom: 4px;">${iconEmoji} ${pt.name}</strong>
            <p style="font-size: 11px; color: #475569; margin: 0;">${pt.desc}</p>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.on('click', () => setActivePoint(pt));
      });

      // Draw Polyline connecting itinerary points of the day
      if (latLngs.length > 1) {
        L.polyline(latLngs, {
          color: '#6366f1',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8'
        }).addTo(polylineLayer.current);

        // Fit map bounds to show all day points
        leafletMap.current.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
      } else if (latLngs.length === 1) {
        leafletMap.current.setView(latLngs[0], 12);
      }
    });
  }, [activeDaySchedule]);

  const handleFlyTo = (lat: number, lng: number, zoom = 12) => {
    if (leafletMap.current) {
      leafletMap.current.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-2xl text-left">
      {/* Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🗺️ Mappa Sincronizzata Diario di Viaggio
            </h2>
            {activeDaySchedule && (
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
                Giorno {activeDaySchedule.dayNumber} ({activeDaySchedule.city})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Tracciato del percorso e punti d'interesse ricalcolati in tempo reale dal tuo diario
          </p>
        </div>

        {/* Quick Fly To Buttons */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => handleFlyTo(35.681236, 139.767125, 11)}
            className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-all font-semibold"
          >
            📍 Tokyo
          </button>
          <button
            onClick={() => handleFlyTo(34.985849, 135.758767, 12)}
            className="px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 transition-all font-semibold"
          >
            ⛩️ Kyoto
          </button>
          <button
            onClick={() => handleFlyTo(34.665809, 135.501175, 12)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all font-semibold"
          >
            🏯 Osaka
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-[380px] md:h-[450px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-inner bg-slate-950 relative"
      />

      {/* Active Point Card */}
      {activePoint && (
        <div className="mt-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {activePoint.category === 'transit' ? '🚇' : activePoint.category === 'food' ? '🍜' : '📍'}
              </span>
              <h4 className="font-bold text-white text-base">{activePoint.name}</h4>
            </div>
            <p className="text-xs text-slate-300 mt-1">{activePoint.desc}</p>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${activePoint.lat},${activePoint.lng}&travelmode=transit`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shrink-0 flex items-center gap-1.5"
          >
            Indicazioni Mezzi 🚌
          </a>
        </div>
      )}
    </div>
  );
}
