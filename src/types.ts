export type WeatherLayerType =
  | 'temp_2m'
  | 'cloud_temp_500'
  | 'cloud_temp_850'
  | 'cloud_cover'
  | 'pressure_msl'
  | 'pm25'
  | 'aod'
  | 'wildfire_dust';

export interface LocationItem {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  elevation?: number;
  category?: 'vietnam' | 'asia' | 'global';
}

export interface EcmwfIfsHourlyData {
  time: string[];
  temperature_2m: number[];
  cloud_cover: number[];
  pressure_msl: number[];
  temperature_850hPa: number[];
  temperature_500hPa: number[];
  relative_humidity_2m?: number[];
  wind_speed_10m?: number[];
  wind_direction_10m?: number[];
  precipitation?: number[];
}

export interface EcmwfCamsHourlyData {
  time: string[];
  pm2_5: number[];
  pm10: number[];
  aerosol_optical_depth: number[];
  dust: number[];
  carbon_monoxide?: number[];
  nitrogen_dioxide?: number[];
}

export interface CombinedWeatherData {
  location: LocationItem;
  generationTimeMs: number;
  timezone: string;
  elevation: number;
  currentStepIndex: number;
  ifs: EcmwfIfsHourlyData;
  cams: EcmwfCamsHourlyData;
  selectedStepHour: number; // e.g., 0, 6, 12, 18, 24, 48
}

export interface StationSnapshot {
  location: LocationItem;
  temp2m: number;
  cloudCover: number;
  pressureMsl: number;
  temp500hPa: number;
  temp850hPa: number;
  pm25: number;
  aod: number;
  dust: number;
  windSpeed: number;
  windDirection: number;
}
