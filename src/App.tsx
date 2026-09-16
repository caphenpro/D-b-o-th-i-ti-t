import React, { useState, useEffect, useCallback } from 'react';
import { LocationItem, CombinedWeatherData, WeatherLayerType, StationSnapshot } from './types';
import { DEFAULT_LOCATION, PRESET_LOCATIONS } from './data/presetLocations';
import { fetchCombinedEcmwfData, fetchStationSnapshots } from './services/ecmwfService';
import { Navbar } from './components/Navbar';
import { MapComponent } from './components/MapComponent';
import { WeatherDashboard } from './components/WeatherDashboard';
import { PythonScriptModal } from './components/PythonScriptModal';
import { AlertCircle, RefreshCw, Layers, ShieldCheck, Terminal, Compass } from 'lucide-react';

export default function App() {
  const [currentLocation, setCurrentLocation] = useState<LocationItem>(DEFAULT_LOCATION);
  const [activeLayer, setActiveLayer] = useState<WeatherLayerType>('temp_2m');
  const [selectedStepHour, setSelectedStepHour] = useState<number>(24); // Default 24h as in user's Python code
  const [weatherData, setWeatherData] = useState<CombinedWeatherData | null>(null);
  const [stations, setStations] = useState<StationSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);

  // Load weather data for the selected location & step
  const loadData = useCallback(async (loc: LocationItem, step: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCombinedEcmwfData(loc, step);
      setWeatherData(data);
    } catch (err: any) {
      console.error('Failed to load weather data:', err);
      setError(err?.message || 'Không thể tải dữ liệu ECMWF IFS / CAMS. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and whenever location or step changes
  useEffect(() => {
    loadData(currentLocation, selectedStepHour);
  }, [currentLocation, selectedStepHour, loadData]);

  // Load regional station snapshots for the map
  useEffect(() => {
    let isMounted = true;
    fetchStationSnapshots(PRESET_LOCATIONS, selectedStepHour).then((res) => {
      if (isMounted) setStations(res);
    });
    return () => {
      isMounted = false;
    };
  }, [selectedStepHour]);

  const handleSelectLocation = (loc: LocationItem) => {
    setCurrentLocation(loc);
  };

  const handleSelectCoordinates = (lat: number, lon: number, name?: string) => {
    setCurrentLocation({
      id: `coord_${lat}_${lon}`,
      name: name || `Tọa độ (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
      country: 'Điểm đo ECMWF',
      lat,
      lon,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Navigation */}
      <Navbar
        currentLocation={currentLocation}
        onSelectLocation={handleSelectLocation}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        selectedStepHour={selectedStepHour}
        onChangeStepHour={setSelectedStepHour}
        isLoading={isLoading}
        onRefresh={() => loadData(currentLocation, selectedStepHour)}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Interactive Map Visualizer */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
                Bản đồ khí tượng trực quan ECMWF (0.25° Resolution)
              </h2>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Nhấp vào bất kỳ điểm nào trên bản đồ để thăm dò dữ liệu tại tọa độ đó
            </span>
          </div>

          <MapComponent
            currentLocation={currentLocation}
            onSelectCoordinates={handleSelectCoordinates}
            activeLayer={activeLayer}
            onChangeLayer={setActiveLayer}
            stations={stations}
            selectedStepHour={selectedStepHour}
          />
        </section>

        {/* Loading Spinner / Error Banner */}
        {isLoading && !weatherData && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="inline-block w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-slate-300">Đang truy xuất mô hình ECMWF IFS & Copernicus CAMS...</p>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Trích xuất biến 2t, tcc, msl, t@500hPa, t@850hPa, PM2.5, AOD...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-200 flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-300">Lỗi kết nối dữ liệu</p>
              <p className="text-red-200/80 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => loadData(currentLocation, selectedStepHour)}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Comprehensive Weather & Air Quality Dashboard */}
        {weatherData && (
          <WeatherDashboard
            data={weatherData}
            selectedStepHour={selectedStepHour}
            onChangeStepHour={setSelectedStepHour}
            onLayerSelect={setActiveLayer}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/80 mt-12 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Dữ liệu nguồn mở chính thức từ <strong>ECMWF IFS (0.25°)</strong> & <strong>Copernicus Atmosphere (CAMS)</strong>.
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsPythonModalOpen(true)}
              className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Đối chiếu mã nguồn Python</span>
            </button>
            <span>•</span>
            <span>Độ trễ cập nhật: Real-time Cycle 00Z / 12Z</span>
          </div>
        </div>
      </footer>

      {/* Python Script & Parameter Mapping Modal */}
      {weatherData && (
        <PythonScriptModal
          isOpen={isPythonModalOpen}
          onClose={() => setIsPythonModalOpen(false)}
          data={weatherData}
        />
      )}
    </div>
  );
}
