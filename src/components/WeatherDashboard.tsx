import React from 'react';
import {
  CombinedWeatherData,
  WeatherLayerType,
} from '../types';
import {
  Thermometer,
  Cloud,
  Gauge,
  Wind,
  ShieldAlert,
  Layers,
  Activity,
  Calendar,
  Compass,
  AlertTriangle,
  ArrowDown,
  Info,
  Flame,
} from 'lucide-react';
import { getAirQualityEvaluation, getColorForValue } from '../utils/meteorology';

interface WeatherDashboardProps {
  data: CombinedWeatherData;
  selectedStepHour: number;
  onChangeStepHour: (step: number) => void;
  onLayerSelect: (layer: WeatherLayerType) => void;
}

export const WeatherDashboard: React.FC<WeatherDashboardProps> = ({
  data,
  selectedStepHour,
  onChangeStepHour,
  onLayerSelect,
}) => {
  const { ifs, cams, location, elevation, currentStepIndex } = data;

  const idx = Math.min(currentStepIndex, ifs.time.length - 1);
  const currentTimeStr = ifs.time[idx] || new Date().toISOString();
  const formattedTime = new Date(currentTimeStr).toLocaleString('vi-VN', {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Extracted values for current step
  const temp2m = ifs.temperature_2m[idx] ?? 28;
  const cloudCover = ifs.cloud_cover[idx] ?? 50;
  const pressureMsl = ifs.pressure_msl[idx] ?? 1012;
  const temp500 = ifs.temperature_500hPa[idx] ?? -12;
  const temp850 = ifs.temperature_850hPa[idx] ?? 17;
  const windSpeed = ifs.wind_speed_10m?.[idx] ?? 10;
  const windDir = ifs.wind_direction_10m?.[idx] ?? 90;
  const humidity = ifs.relative_humidity_2m?.[idx] ?? 75;

  const pm25 = cams.pm2_5[idx] ?? 25;
  const pm10 = cams.pm10[idx] ?? 40;
  const aod = cams.aerosol_optical_depth[idx] ?? 0.35;
  const dust = cams.dust[idx] ?? 10;

  const aqiEval = getAirQualityEvaluation(pm25);

  // Lapse rate calculation between surface (2m) and 500hPa (~5.5km)
  const tempDiff = temp2m - temp500;
  const approxLapseRate = (tempDiff / 5.5).toFixed(1); // °C / 1000m

  // Approximate 0°C freezing level altitude
  // T(z) = T_surface - lapse * z => z_freeze = T_surface / (lapse / 1000)
  const lapsePerMeter = tempDiff / 5500;
  const freezingLevelMeters = temp2m > 0 && lapsePerMeter > 0 ? Math.round(temp2m / lapsePerMeter) : 0;

  // 24h & 48h slider step values
  const stepOptions = [0, 6, 12, 18, 24, 36, 48];

  return (
    <div className="space-y-6">
      {/* 1. Location Header & Forecast Lead Time Scrubber */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium tracking-wide uppercase">
              <span>ECMWF IFS Open Data 0.25° & CAMS</span>
              <span>•</span>
              <span className="text-slate-400 font-mono">
                {location.lat.toFixed(3)}°N, {location.lon.toFixed(3)}°E • Cao độ: {elevation}m
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
              <span>{location.name}</span>
              {location.country && (
                <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {location.country}
                </span>
              )}
            </h2>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Thời điểm mô hình: <strong className="text-slate-200">{formattedTime}</strong></span>
              <span className="text-cyan-400 font-mono">
                ({selectedStepHour === 0 ? 'Hiện tại' : `Step +${selectedStepHour}h theo mã nguồn`})
              </span>
            </div>
          </div>

          {/* Scrubber Controls */}
          <div className="flex flex-col gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Bước thời gian dự báo (Lead Time):</span>
              <span className="text-cyan-300 font-mono font-bold">
                {selectedStepHour === 0 ? '0h (Real-time)' : `+${selectedStepHour} Giờ`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {stepOptions.map((step) => {
                const isSelected = selectedStepHour === step;
                const isPythonDefault = step === 24;
                return (
                  <button
                    key={step}
                    onClick={() => onChangeStepHour(step)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span>{step === 0 ? 'Hiện tại' : `+${step}h`}</span>
                    {isPythonDefault && (
                      <span className={`text-[10px] px-1 rounded font-mono ${isSelected ? 'bg-black/20 text-slate-950' : 'bg-cyan-500/20 text-cyan-300'}`}>
                        code
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Core ECMWF IFS Variables Cards (Direct from Python Script) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: 2m Temperature (2t) */}
        <div
          onClick={() => onLayerSelect('temp_2m')}
          className="group cursor-pointer bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Thermometer className="w-4 h-4 text-amber-400" />
              Nhiệt độ mặt đất (2t)
            </span>
            <code className="text-[11px] text-amber-400/90 bg-amber-400/10 px-1.5 py-0.5 rounded font-mono">
              2t
            </code>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {temp2m.toFixed(1)}
            </span>
            <span className="text-base text-slate-400 font-medium">°C</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Độ ẩm: {Math.round(humidity)}%</span>
            <span className="text-amber-400 text-[11px] group-hover:translate-x-0.5 transition-transform">
              Xem lớp bản đồ →
            </span>
          </div>
        </div>

        {/* Card 2: Mid-Troposphere Cloud Temp (t @ 500hPa) */}
        <div
          onClick={() => onLayerSelect('cloud_temp_500')}
          className="group cursor-pointer bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-4 h-4 text-blue-400" />
              Mây 500 hPa (t @ 500)
            </span>
            <code className="text-[11px] text-blue-400/90 bg-blue-400/10 px-1.5 py-0.5 rounded font-mono">
              t @ 500hPa
            </code>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {temp500.toFixed(1)}
            </span>
            <span className="text-base text-slate-400 font-medium">°C</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Độ cao: ~5,500m</span>
            <span className="text-blue-400 text-[11px] group-hover:translate-x-0.5 transition-transform">
              Xem tầng mây →
            </span>
          </div>
        </div>

        {/* Card 3: Total Cloud Cover (tcc * 100) */}
        <div
          onClick={() => onLayerSelect('cloud_cover')}
          className="group cursor-pointer bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-sky-500/40 rounded-2xl p-4 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Cloud className="w-4 h-4 text-sky-400" />
              Độ phủ mây (tcc)
            </span>
            <code className="text-[11px] text-sky-400/90 bg-sky-400/10 px-1.5 py-0.5 rounded font-mono">
              tcc * 100
            </code>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {Math.round(cloudCover)}
            </span>
            <span className="text-base text-slate-400 font-medium">%</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>
              {cloudCover < 20 ? 'Trời quang đãng' : cloudCover < 60 ? 'Mây rải rác' : 'Nhiều mây che phủ'}
            </span>
            <span className="text-sky-400 text-[11px] group-hover:translate-x-0.5 transition-transform">
              Xem bản đồ →
            </span>
          </div>
        </div>

        {/* Card 4: Mean Sea Level Pressure (msl) */}
        <div
          onClick={() => onLayerSelect('pressure_msl')}
          className="group cursor-pointer bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Gauge className="w-4 h-4 text-indigo-400" />
              Khí áp mực biển (msl)
            </span>
            <code className="text-[11px] text-indigo-400/90 bg-indigo-400/10 px-1.5 py-0.5 rounded font-mono">
              msl
            </code>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {Math.round(pressureMsl)}
            </span>
            <span className="text-base text-slate-400 font-medium">hPa</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Gió 10m: {windSpeed} km/h</span>
            <span className="text-indigo-400 text-[11px] group-hover:translate-x-0.5 transition-transform">
              Xem đẳng áp →
            </span>
          </div>
        </div>
      </div>

      {/* 3. ECMWF CAMS Air Quality & Wildfire Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Chất lượng không khí & Khói bụi ECMWF CAMS</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Copernicus Global
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Dự báo nồng độ bụi mịn PM2.5, sol khí và khói cháy rừng theo leadtime {selectedStepHour}h
              </p>
            </div>
          </div>

          {/* WHO Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${aqiEval.badgeClass}`}>
              <ShieldAlert className="w-4 h-4" />
              <span>{aqiEval.status}</span>
            </span>
          </div>
        </div>

        {/* Air Quality Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PM2.5 Metric */}
          <div
            onClick={() => onLayerSelect('pm25')}
            className="cursor-pointer bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 hover:border-emerald-500/50 transition-all"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Bụi mịn PM2.5 (CAMS)</span>
              <span className="text-[11px] font-mono text-emerald-400">particulate_matter_2.5um</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="text-3xl font-extrabold tracking-tight"
                style={{ color: getColorForValue(pm25, 'pm25') }}
              >
                {pm25.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-medium">µg/m³</span>
            </div>
            <p className="text-xs text-slate-300 mt-2">{aqiEval.advice}</p>
            <div className="text-[11px] text-slate-400 mt-2 font-mono">
              Tiêu chuẩn WHO: {aqiEval.whoExceedFactor}
            </div>
          </div>

          {/* Aerosol Optical Depth (AOD) */}
          <div
            onClick={() => onLayerSelect('aod')}
            className="cursor-pointer bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 hover:border-orange-500/50 transition-all"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Độ dày Aerosol AOD</span>
              <span className="text-[11px] font-mono text-orange-400">aerosol_optical_depth_550nm</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-orange-300 tracking-tight">
                {aod.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-medium">tại 550nm</span>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              {aod < 0.2
                ? 'Bầu khí quyển trong suốt, độ khuếch tán ánh sáng mặt trời bình thường.'
                : aod < 0.5
                ? 'Mức độ sương mờ quang học nhẹ, có chứa hạt aerosol phân tán.'
                : 'Mật độ hạt sol khí/khói bụi cao, làm giảm tầm nhìn xa và tán xạ bức xạ mặt trời.'}
            </p>
          </div>

          {/* Wildfire Smoke & Mineral Dust */}
          <div
            onClick={() => onLayerSelect('wildfire_dust')}
            className="cursor-pointer bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 hover:border-amber-500/50 transition-all"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Khói Cháy Rừng & Bụi (Dust)
              </span>
              <span className="text-[11px] font-mono text-amber-400">wildfire_flux</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-300 tracking-tight">
                {dust.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-medium">µg/m³</span>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Theo dõi phát thải tro bụi từ cháy rừng thực vật và hạt bụi khoáng di chuyển theo tầng hoàn lưu khí quyển.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Atmospheric Vertical Sounding Profile (Comparing 500hPa, 850hPa, and Surface) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Vertical Atmospheric Profile Diagram */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Mặt Cắt Thẳng Đứng Khí Quyển (Atmospheric Profile)
                </h3>
                <p className="text-xs text-slate-400">
                  Tương quan nhiệt độ giữa mặt đất và các tầng áp suất ECMWF IFS
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 font-mono">
                500 & 850 hPa
              </span>
            </div>

            {/* Vertical Profile Columns */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {/* Level 500 hPa */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/90 border border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-xs">
                    500
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-100">
                      Tầng mây trung (Mid-Troposphere)
                    </div>
                    <div className="text-[11px] text-slate-400">Độ cao ~5,500m (Khí áp 500 hPa)</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-400">{temp500.toFixed(1)}°C</div>
                  <div className="text-[10px] text-slate-400 font-mono">ds_pl['t'] (500)</div>
                </div>
              </div>

              {/* Level 850 hPa */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/90 border border-teal-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
                    850
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-100">
                      Tầng mây thấp (Lower Troposphere)
                    </div>
                    <div className="text-[11px] text-slate-400">Độ cao ~1,500m (Khí áp 850 hPa)</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-teal-300">{temp850.toFixed(1)}°C</div>
                  <div className="text-[10px] text-slate-400 font-mono">ds_pl['t'] (850)</div>
                </div>
              </div>

              {/* Surface Level (2m) */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/90 border border-amber-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                    2m
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-100">
                      Bề mặt mặt đất (Surface 2m)
                    </div>
                    <div className="text-[11px] text-slate-400">Độ cao thực tế trạm: {elevation}m</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-400">{temp2m.toFixed(1)}°C</div>
                  <div className="text-[10px] text-slate-400 font-mono">ds_sfc['2t']</div>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic Metrics */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
            <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Tốc độ suy giảm nhiệt (Lapse Rate):</span>
              <strong className="text-cyan-300 font-mono">{approxLapseRate} °C/km</strong>
            </div>
            <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Độ cao đóng băng 0°C (Freezing Level):</span>
              <strong className="text-sky-300 font-mono">~{freezingLevelMeters} mét</strong>
            </div>
          </div>
        </div>

        {/* Right: 48h ECMWF Forecast Trend Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Diễn Biến 48 Giờ ECMWF IFS (2t vs Mây 500hPa)
              </h3>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> 2t (°C)
                </span>
                <span className="flex items-center gap-1 text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> 500hPa (°C)
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Theo dõi chu kỳ nhật triều của nhiệt độ bề mặt và độ ổn định của tầng mây trung
            </p>

            {/* Custom SVG Trend Line Chart */}
            <div className="h-44 w-full relative bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
              <ForecastTimelineSvg
                times={ifs.time.slice(0, 48)}
                temps2m={ifs.temperature_2m.slice(0, 48)}
                temps500={ifs.temperature_500hPa.slice(0, 48)}
                currentStep={selectedStepHour}
                onSelectStep={onChangeStepHour}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
            <span>Độ phân giải mô hình: <strong>0.25° (~25km)</strong></span>
            <span className="text-cyan-400 font-mono">ECMWF IFS Cycle 48r1/49r1</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Clean, high-precision SVG chart for 48h forecast
interface ForecastTimelineSvgProps {
  times: string[];
  temps2m: number[];
  temps500: number[];
  currentStep: number;
  onSelectStep: (step: number) => void;
}

const ForecastTimelineSvg: React.FC<ForecastTimelineSvgProps> = ({
  times,
  temps2m,
  temps500,
  currentStep,
  onSelectStep,
}) => {
  if (!temps2m.length) return null;

  const width = 500;
  const height = 140;
  const padding = { top: 20, bottom: 25, left: 35, right: 15 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Temperature ranges
  const min2m = Math.min(...temps2m);
  const max2m = Math.max(...temps2m);
  const min500 = Math.min(...temps500);
  const max500 = Math.max(...temps500);

  // Overall min & max for scale
  const overallMin = Math.min(min2m, min500) - 2;
  const overallMax = Math.max(max2m, max500) + 2;
  const range = overallMax - overallMin || 1;

  const getX = (index: number) => padding.left + (index / (temps2m.length - 1)) * plotW;
  const getY = (val: number) => padding.top + plotH - ((val - overallMin) / range) * plotH;

  // Build SVG path points
  const points2m = temps2m.map((val, i) => `${getX(i).toFixed(1)},${getY(val).toFixed(1)}`).join(' ');
  const points500 = temps500.map((val, i) => `${getX(i).toFixed(1)},${getY(val).toFixed(1)}`).join(' ');

  // Current step indicator position
  const stepX = getX(Math.min(currentStep, temps2m.length - 1));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      {/* Horizontal Reference Grid */}
      <line
        x1={padding.left}
        y1={getY(0)}
        x2={width - padding.right}
        y2={getY(0)}
        stroke="#475569"
        strokeDasharray="4 4"
        strokeWidth="1"
      />
      <text x={padding.left - 6} y={getY(0) + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
        0°C
      </text>

      <line
        x1={padding.left}
        y1={getY(25)}
        x2={width - padding.right}
        y2={getY(25)}
        stroke="#334155"
        strokeWidth="1"
      />
      <text x={padding.left - 6} y={getY(25) + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
        25°C
      </text>

      <line
        x1={padding.left}
        y1={getY(-20)}
        x2={width - padding.right}
        y2={getY(-20)}
        stroke="#334155"
        strokeWidth="1"
      />
      <text x={padding.left - 6} y={getY(-20) + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
        -20°C
      </text>

      {/* Polyline for 500hPa Temp (Blue) */}
      <polyline fill="none" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" points={points500} />

      {/* Polyline for 2m Temp (Amber) */}
      <polyline fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points2m} />

      {/* Selected Step Lead Time Marker Line */}
      <line
        x1={stepX}
        y1={padding.top - 5}
        x2={stepX}
        y2={height - padding.bottom}
        stroke="#22d3ee"
        strokeWidth="1.8"
      />
      <circle cx={stepX} cy={getY(temps2m[currentStep] ?? 0)} r="4.5" fill="#22d3ee" stroke="#0f172a" strokeWidth="2" />

      {/* X-axis tick labels every 12 hours */}
      {times.map((t, idx) => {
        if (idx % 12 !== 0 && idx !== 24) return null;
        const x = getX(idx);
        const label = idx === 0 ? 'Hiện tại' : `+${idx}h`;
        const isSelected = idx === currentStep;

        return (
          <g key={idx} className="cursor-pointer" onClick={() => onSelectStep(idx)}>
            <text
              x={x}
              y={height - 6}
              fill={isSelected ? '#22d3ee' : '#94a3b8'}
              fontSize="9"
              textAnchor="middle"
              fontWeight={isSelected ? 'bold' : 'normal'}
              fontFamily="monospace"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
