import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Code2, Navigation, Layers, Check, Sparkles, RefreshCw } from 'lucide-react';
import { LocationItem } from '../types';
import { PRESET_LOCATIONS } from '../data/presetLocations';
import { searchGeocoding } from '../services/ecmwfService';

interface NavbarProps {
  currentLocation: LocationItem;
  onSelectLocation: (loc: LocationItem) => void;
  onOpenPythonModal: () => void;
  selectedStepHour: number;
  onChangeStepHour: (step: number) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLocation,
  onSelectLocation,
  onOpenPythonModal,
  selectedStepHour,
  onChangeStepHour,
  isLoading,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchGeocoding(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
      setIsDropdownOpen(true);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCurrentPosition = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ Geolocation.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSelectLocation({
          id: 'my_pos',
          name: 'Vị trí hiện tại',
          country: 'GPS Tọa độ',
          lat: Number(pos.coords.latitude.toFixed(4)),
          lon: Number(pos.coords.longitude.toFixed(4)),
        });
      },
      (err) => {
        console.warn('Geolocation denied:', err);
      }
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Badges */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold tracking-tight">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white">
                  ECMWF IFS & CAMS Weather
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  IFS 0.25° + CAMS
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Chuẩn OpenData GRIB2 & NetCDF Copernicus
              </p>
            </div>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenPythonModal}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 text-xs flex items-center gap-1"
              title="Xem mã nguồn Python & GRIB2"
            >
              <Code2 className="w-4 h-4" />
              <span>Code</span>
            </button>
          </div>
        </div>

        {/* Search & Location Bar */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
          <div ref={searchRef} className="relative flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setIsDropdownOpen(true);
                }}
                placeholder="Tìm thành phố (Hà Nội, TP.HCM, Sa Pa...)"
                className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-slate-100"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Dropdown Suggestions */}
            {isDropdownOpen && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-700/50 max-h-72 overflow-y-auto">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectLocation(item);
                      setIsDropdownOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-700/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <div>
                        <div className="font-medium text-slate-200">{item.name}</div>
                        <div className="text-slate-400 text-[11px]">{item.country}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {item.lat.toFixed(2)}°, {item.lon.toFixed(2)}°
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleCurrentPosition}
            title="Sử dụng GPS vị trí của bạn"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors shrink-0"
          >
            <Navigation className="w-4 h-4" />
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Làm mới dữ liệu ECMWF"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-cyan-400 transition-colors shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Step 24h indicator & Python Script Button */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Step Selector (0h vs 24h as requested in user's python step:24) */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => onChangeStepHour(0)}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                selectedStepHour === 0
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hiện tại (0h)
            </button>
            <button
              onClick={() => onChangeStepHour(24)}
              className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
                selectedStepHour === 24
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Dự báo 24h</span>
              <span className="text-[10px] px-1 rounded bg-black/20 font-mono">step=24</span>
            </button>
          </div>

          {/* Python script modal trigger */}
          <button
            onClick={onOpenPythonModal}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Mã nguồn ECMWF Python</span>
          </button>
        </div>
      </div>

      {/* Quick location chips */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-800/60 text-xs">
        <span className="text-slate-400 text-[11px] shrink-0">Trạm tiêu biểu:</span>
        {PRESET_LOCATIONS.slice(0, 9).map((loc) => {
          const isSelected = currentLocation.name === loc.name;
          return (
            <button
              key={loc.id}
              onClick={() => onSelectLocation(loc)}
              className={`px-2.5 py-0.5 rounded-full shrink-0 transition-colors text-[11px] flex items-center gap-1 ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-medium'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
              }`}
            >
              {isSelected && <Check className="w-2.5 h-2.5 text-cyan-400" />}
              {loc.name}
            </button>
          );
        })}
      </div>
    </header>
  );
};
