import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { WeatherLayerType, LocationItem, StationSnapshot } from '../types';
import { getLayerConfig, getColorForValue } from '../utils/meteorology';
import { Layers, Crosshair, ZoomIn, ZoomOut, Compass, Wind } from 'lucide-react';

interface MapComponentProps {
  currentLocation: LocationItem;
  onSelectCoordinates: (lat: number, lon: number, name?: string) => void;
  activeLayer: WeatherLayerType;
  onChangeLayer: (layer: WeatherLayerType) => void;
  stations: StationSnapshot[];
  selectedStepHour: number;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  currentLocation,
  onSelectCoordinates,
  activeLayer,
  onChangeLayer,
  stations,
  selectedStepHour,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center Vietnam
    const map = L.map(mapContainerRef.current, {
      center: [currentLocation.lat, currentLocation.lon],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark cartographic basemap (clean, high-contrast, free of quota limits)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Click anywhere on map to probe ECMWF coordinates
    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = Number(e.latlng.lat.toFixed(4));
      const lon = Number(e.latlng.lng.toFixed(4));
      onSelectCoordinates(lat, lon, `Tọa độ ECMWF (${lat}°, ${lon}°)`);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Pan to currentLocation when changed
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    map.panTo([currentLocation.lat, currentLocation.lon], { animate: true, duration: 0.8 });

    // Target pin
    if (targetMarkerRef.current) {
      targetMarkerRef.current.remove();
    }

    const pinIcon = L.divIcon({
      className: 'custom-target-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute w-8 h-8 rounded-full bg-cyan-400/30 animate-ping"></span>
          <span class="w-4 h-4 rounded-full bg-cyan-400 border-2 border-slate-950 shadow-lg shadow-cyan-400/50"></span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    targetMarkerRef.current = L.marker([currentLocation.lat, currentLocation.lon], {
      icon: pinIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    targetMarkerRef.current.bindTooltip(
      `<strong>${currentLocation.name}</strong><br/><span style="font-size:11px;color:#94a3b8">${currentLocation.lat.toFixed(2)}°, ${currentLocation.lon.toFixed(2)}°</span>`,
      { direction: 'top', offset: [0, -10], className: 'ecmwf-tooltip' }
    );
  }, [currentLocation]);

  // Update Station Markers when activeLayer, step, or stations change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    const layerConfig = getLayerConfig(activeLayer);

    stations.forEach((st) => {
      let value = 0;
      let displayValue = '';

      switch (activeLayer) {
        case 'temp_2m':
          value = st.temp2m;
          displayValue = `${value.toFixed(1)}°`;
          break;
        case 'cloud_temp_500':
          value = st.temp500hPa;
          displayValue = `${value.toFixed(1)}°`;
          break;
        case 'cloud_temp_850':
          value = st.temp850hPa;
          displayValue = `${value.toFixed(1)}°`;
          break;
        case 'cloud_cover':
          value = st.cloudCover;
          displayValue = `${Math.round(value)}%`;
          break;
        case 'pressure_msl':
          value = st.pressureMsl;
          displayValue = `${Math.round(value)}`;
          break;
        case 'pm25':
          value = st.pm25;
          displayValue = `${Math.round(value)}`;
          break;
        case 'aod':
          value = st.aod;
          displayValue = `${value.toFixed(2)}`;
          break;
        case 'wildfire_dust':
          value = st.dust;
          displayValue = `${Math.round(value)}`;
          break;
      }

      const color = getColorForValue(value, activeLayer);
      const isCurrent = Math.abs(st.location.lat - currentLocation.lat) < 0.05 && Math.abs(st.location.lon - currentLocation.lon) < 0.05;

      const markerHtml = `
        <div class="group cursor-pointer transition-transform hover:scale-110">
          <div class="flex items-center gap-1.5 px-2 py-1 rounded-full shadow-lg border backdrop-blur-md ${
            isCurrent
              ? 'bg-slate-900/95 border-cyan-400 ring-2 ring-cyan-400/40 text-cyan-300'
              : 'bg-slate-900/90 border-slate-700 text-slate-100 hover:border-slate-500'
          }">
            <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style="background-color: ${color}"></span>
            <span class="text-xs font-semibold tracking-tight whitespace-nowrap">${st.location.name}: ${displayValue}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'station-badge-icon',
        html: markerHtml,
        iconSize: [110, 30],
        iconAnchor: [55, 15],
      });

      const marker = L.marker([st.location.lat, st.location.lon], { icon: customIcon });

      marker.on('click', () => {
        onSelectCoordinates(st.location.lat, st.location.lon, st.location.name);
      });

      // Tooltip with comprehensive ECMWF IFS & CAMS metrics
      const popupContent = `
        <div style="min-width: 190px; padding: 4px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #f8fafc;">${st.location.name}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">Dự báo ECMWF IFS & CAMS (${selectedStepHour === 0 ? 'Hiện tại' : `+${selectedStepHour}h`})</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px;">
            <div style="background: #1e293b; padding: 4px 6px; border-radius: 6px;">
              <span style="color:#64748b; display:block; font-size:10px;">Nhiệt độ 2m (2t)</span>
              <strong style="color:#38bdf8">${st.temp2m.toFixed(1)}°C</strong>
            </div>
            <div style="background: #1e293b; padding: 4px 6px; border-radius: 6px;">
              <span style="color:#64748b; display:block; font-size:10px;">Mây 500hPa (t)</span>
              <strong style="color:#818cf8">${st.temp500hPa.toFixed(1)}°C</strong>
            </div>
            <div style="background: #1e293b; padding: 4px 6px; border-radius: 6px;">
              <span style="color:#64748b; display:block; font-size:10px;">Độ phủ mây (tcc)</span>
              <strong style="color:#cbd5e1">${Math.round(st.cloudCover)}%</strong>
            </div>
            <div style="background: #1e293b; padding: 4px 6px; border-radius: 6px;">
              <span style="color:#64748b; display:block; font-size:10px;">Bụi PM2.5 (CAMS)</span>
              <strong style="color:${getColorForValue(st.pm25, 'pm25')}">${Math.round(st.pm25)} µg/m³</strong>
            </div>
          </div>
          <div style="margin-top: 8px; font-size: 11px; color: #38bdf8; text-align: center;">Nhấp để xem bảng phân tích chi tiết</div>
        </div>
      `;

      marker.bindPopup(popupContent, { className: 'ecmwf-custom-popup' });
      marker.addTo(markersLayer);
    });
  }, [stations, activeLayer, selectedStepHour, currentLocation]);

  const activeConfig = getLayerConfig(activeLayer);

  return (
    <div className="relative w-full h-[480px] lg:h-[540px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Map Target Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Layer Switcher */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 flex flex-wrap items-center gap-1.5 max-w-2xl bg-slate-900/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-1.5 px-2 py-1 text-slate-400 text-xs font-medium shrink-0 border-r border-slate-700/60 mr-1">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Lớp bản đồ:</span>
        </div>

        <button
          onClick={() => onChangeLayer('temp_2m')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            activeLayer === 'temp_2m'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
          }`}
        >
          Nhiệt độ 2m (2t)
        </button>

        <button
          onClick={() => onChangeLayer('cloud_temp_500')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            activeLayer === 'cloud_temp_500'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
          }`}
          title="Nhiệt độ tầng mây trung 500hPa (~5,500m) - trích xuất từ t@500hPa trong mã nguồn"
        >
          Mây 500hPa (t)
        </button>

        <button
          onClick={() => onChangeLayer('cloud_cover')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            activeLayer === 'cloud_cover'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
          }`}
          title="Tổng độ phủ mây - tcc * 100 (%)"
        >
          Độ phủ mây (tcc)
        </button>

        <button
          onClick={() => onChangeLayer('pm25')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            activeLayer === 'pm25'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
          }`}
          title="Bụi mịn PM2.5 từ ECMWF CAMS (µg/m³)"
        >
          PM2.5 (CAMS)
        </button>

        <button
          onClick={() => onChangeLayer('aod')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            activeLayer === 'aod'
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
          }`}
          title="Độ dày quang học Aerosol AOD 550nm (CAMS)"
        >
          Aerosol AOD
        </button>

        <button
          onClick={() => onChangeLayer('pressure_msl')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            activeLayer === 'pressure_msl'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
          }`}
        >
          Khí áp (msl)
        </button>
      </div>

      {/* Floating Map Zoom & Reset Controls */}
      <div className="absolute right-3 top-16 z-10 flex flex-col gap-1.5 bg-slate-900/85 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-xl">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Phóng to"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Thu nhỏ"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lon], 7, { animate: true });
            }
          }}
          className="p-2 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          title="Căn giữa vị trí được chọn"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Info Banner & Scale Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800 shadow-2xl text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="font-semibold text-slate-200">{activeConfig.label}</span>
          </div>
          <span className="hidden md:inline text-slate-400 border-l border-slate-700 pl-3">
            Mã biến GRIB/NetCDF: <code className="text-cyan-300 font-mono text-[11px]">{activeConfig.gribName}</code>
          </span>
        </div>

        {/* Dynamic Visual Gradient Legend */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] text-slate-400">Thang đo:</span>
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/60">
            <div className="w-24 sm:w-32 h-2 rounded bg-gradient-to-r from-blue-500 via-amber-400 to-red-500"></div>
            <span className="text-[10px] text-slate-300 font-mono ml-1">
              {activeConfig.min} → {activeConfig.max} {activeConfig.unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
