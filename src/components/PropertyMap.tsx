import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Property } from '../types';
import { MapPin } from 'lucide-react';

interface PropertyMapProps {
  properties: Property[];
  selectedProperty?: Property | null;
  onSelectProperty?: (property: Property) => void;
  pickerMode?: boolean;
  onPickCoordinates?: (lat: number, lng: number) => void;
  height?: string;
  centerCoordinates?: [number, number];
}

// BUKAVU Center Default
const BUKAVU_CENTER: [number, number] = [-2.5000, 28.8600];

export const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  selectedProperty,
  onSelectProperty,
  pickerMode = false,
  onPickCoordinates,
  height = '500px',
  centerCoordinates
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const pickedMarkerRef = useRef<L.Marker | null>(null);

  // Helper to create high-visibility GPS picker icon
  const createPickerIcon = () =>
    L.divIcon({
      className: 'custom-gps-picker-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -100%); pointer-events: none;">
          <div style="background: #FF385C; color: #ffffff; padding: 4px 8px; border-radius: 9999px; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 12px rgba(255, 56, 92, 0.4); border: 2px solid #ffffff; margin-bottom: 3px; display: flex; align-items: center; gap: 4px;">
            <span>📍 Repère GPS</span>
          </div>
          <div style="width: 28px; height: 28px; background: #FF385C; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35); display: flex; align-items: center; justify-content: center;">
            <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
          <div style="width: 12px; height: 4px; background: rgba(0,0,0,0.35); border-radius: 50%; margin-top: 2px; filter: blur(1px);"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter = centerCoordinates || BUKAVU_CENTER;
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: pickerMode ? 15 : 14,
        zoomControl: true
      });

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | NyumbaLink Bukavu'
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Invalidate size on multiple animation intervals for modal popups
      const timers = [100, 300, 600].map((delay) =>
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, delay)
      );

      return () => {
        timers.forEach(clearTimeout);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, []);

  // Handle Coordinates Picker Mode & Click Updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !pickerMode) return;

    map.invalidateSize();

    const targetCoords: [number, number] =
      centerCoordinates && typeof centerCoordinates[0] === 'number' && typeof centerCoordinates[1] === 'number'
        ? centerCoordinates
        : BUKAVU_CENTER;

    if (pickedMarkerRef.current) {
      pickedMarkerRef.current.setLatLng(targetCoords);
    } else {
      pickedMarkerRef.current = L.marker(targetCoords, {
        icon: createPickerIcon(),
        zIndexOffset: 1000
      }).addTo(map);
    }

    map.panTo(targetCoords, { animate: true, duration: 0.4 });

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (onPickCoordinates) {
        onPickCoordinates(lat, lng);
      }

      if (pickedMarkerRef.current) {
        pickedMarkerRef.current.setLatLng([lat, lng]);
      } else {
        pickedMarkerRef.current = L.marker([lat, lng], {
          icon: createPickerIcon(),
          zIndexOffset: 1000
        }).addTo(map);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [pickerMode, onPickCoordinates, centerCoordinates?.[0], centerCoordinates?.[1]]);

  // Update Markers when Properties change (with strict validation against undefined/NaN coordinates)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup || pickerMode) return;

    markersGroup.clearLayers();

    // Filter properties to guarantee valid numeric latitude and longitude
    const validProperties = properties.filter(
      (prop) =>
        prop &&
        typeof prop.latitude === 'number' &&
        !isNaN(prop.latitude) &&
        typeof prop.longitude === 'number' &&
        !isNaN(prop.longitude)
    );

    validProperties.forEach((prop) => {
      const isSelected = selectedProperty?.id === prop.id;

      // Custom HTML Marker Pin (Clean - Neighborhood only)
      const pinColor = isSelected ? '#FF385C' : '#222222';
      const customIcon = L.divIcon({
        className: 'custom-property-pin',
        html: `
          <div style="
            background-color: ${pinColor};
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid white;
            display: flex;
            align-items: center;
            gap: 4px;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
            transition: transform 0.2s;
          ">
            <span>📍 ${prop.neighborhood || 'Bukavu'}</span>
          </div>
        `,
        iconSize: [110, 28],
        iconAnchor: [55, 14]
      });

      const marker = L.marker([prop.latitude, prop.longitude], { icon: customIcon });

      const firstImage = prop.images && prop.images.length > 0 ? prop.images[0] : '';

      // Popup Content (Cleaned)
      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <div style="font-family: 'Inter', sans-serif; max-width: 200px;">
          ${
            firstImage
              ? `<img src="${firstImage}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px 8px 0 0;" />`
              : ''
          }
          <div style="padding: 10px;">
            <div style="font-size: 10px; font-weight: 800; color: #FF385C; text-transform: uppercase;">📍 Quartier ${prop.neighborhood || 'Bukavu'}</div>
            <div style="font-size: 12px; font-weight: 700; color: #222222; margin: 4px 0 8px 0; line-height: 1.3;">${prop.title || 'Propriété'}</div>
            <button id="view-details-${prop.id}" style="
              width: 100%;
              background-color: #222222;
              color: white;
              border: none;
              padding: 7px 0;
              border-radius: 8px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
            ">
              Voir Fiche Complète
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectProperty) onSelectProperty(prop);
      });

      // Handle Popup Button Click
      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-details-${prop.id}`);
        if (btn && onSelectProperty) {
          btn.onclick = () => onSelectProperty(prop);
        }
      });

      markersGroup.addLayer(marker);
    });

    if (centerCoordinates && typeof centerCoordinates[0] === 'number' && typeof centerCoordinates[1] === 'number') {
      map.setView(centerCoordinates, 15);
    } else if (
      selectedProperty &&
      typeof selectedProperty.latitude === 'number' &&
      !isNaN(selectedProperty.latitude) &&
      typeof selectedProperty.longitude === 'number' &&
      !isNaN(selectedProperty.longitude)
    ) {
      map.setView([selectedProperty.latitude, selectedProperty.longitude], 15);
    }
  }, [properties, selectedProperty, centerCoordinates, pickerMode]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-[#2e2e2e] shadow-md">
      {pickerMode && (
        <div className="absolute bottom-3 right-3 z-[400] pointer-events-none bg-slate-900/90 dark:bg-black/90 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-[#FF385C]" />
          <span>Cliquez sur la carte pour déplacer le repère GPS</span>
        </div>
      )}

      <div ref={mapContainerRef} style={{ height, width: '100%' }} />
    </div>
  );
};