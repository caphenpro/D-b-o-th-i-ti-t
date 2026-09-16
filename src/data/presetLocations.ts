import { LocationItem } from '../types';

export const PRESET_LOCATIONS: LocationItem[] = [
  // Vietnam
  { id: 'hanoi', name: 'Hà Nội', country: 'Việt Nam', lat: 21.0285, lon: 105.8542, elevation: 19, category: 'vietnam' },
  { id: 'hcmc', name: 'TP. Hồ Chí Minh', country: 'Việt Nam', lat: 10.8231, lon: 106.6297, elevation: 10, category: 'vietnam' },
  { id: 'danang', name: 'Đà Nẵng', country: 'Việt Nam', lat: 16.0544, lon: 108.2022, elevation: 12, category: 'vietnam' },
  { id: 'haiphong', name: 'Hải Phòng', country: 'Việt Nam', lat: 20.8449, lon: 106.6881, elevation: 6, category: 'vietnam' },
  { id: 'cantho', name: 'Cần Thơ', country: 'Việt Nam', lat: 10.0452, lon: 105.7469, elevation: 4, category: 'vietnam' },
  { id: 'hue', name: 'Thừa Thiên Huế', country: 'Việt Nam', lat: 16.4637, lon: 107.5909, elevation: 15, category: 'vietnam' },
  { id: 'nhatrang', name: 'Nha Trang', country: 'Việt Nam', lat: 12.2388, lon: 109.1967, elevation: 8, category: 'vietnam' },
  { id: 'sapa', name: 'Sa Pa', country: 'Việt Nam', lat: 22.3364, lon: 103.8438, elevation: 1500, category: 'vietnam' },
  { id: 'quangninh', name: 'Hạ Long', country: 'Việt Nam', lat: 20.9505, lon: 107.0734, elevation: 10, category: 'vietnam' },
  { id: 'vinh', name: 'TP. Vinh (Nghệ An)', country: 'Việt Nam', lat: 18.6734, lon: 105.6813, elevation: 7, category: 'vietnam' },
  { id: 'dalat', name: 'Đà Lạt', country: 'Việt Nam', lat: 11.9404, lon: 108.4583, elevation: 1500, category: 'vietnam' },
  { id: 'pleiku', name: 'Pleiku (Gia Lai)', country: 'Việt Nam', lat: 13.9833, lon: 108.0000, elevation: 740, category: 'vietnam' },
  { id: 'camau', name: 'Cà Mau', country: 'Việt Nam', lat: 9.1769, lon: 105.1524, elevation: 2, category: 'vietnam' },
  { id: 'hoangsa', name: 'Quần đảo Hoàng Sa', country: 'Việt Nam', lat: 16.5333, lon: 112.0000, elevation: 5, category: 'vietnam' },
  { id: 'truongsa', name: 'Quần đảo Trường Sa', country: 'Việt Nam', lat: 8.6444, lon: 111.9186, elevation: 3, category: 'vietnam' },

  // Asia & World
  { id: 'bangkok', name: 'Bangkok', country: 'Thái Lan', lat: 13.7563, lon: 100.5018, elevation: 2, category: 'asia' },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198, elevation: 15, category: 'asia' },
  { id: 'tokyo', name: 'Tokyo', country: 'Nhật Bản', lat: 35.6762, lon: 139.6503, elevation: 44, category: 'asia' },
  { id: 'beijing', name: 'Bắc Kinh', country: 'Trung Quốc', lat: 39.9042, lon: 116.4074, elevation: 54, category: 'asia' },
  { id: 'seoul', name: 'Seoul', country: 'Hàn Quốc', lat: 37.5665, lon: 126.9780, elevation: 38, category: 'asia' },
  { id: 'paris', name: 'Paris', country: 'Pháp (ECMWF CAMS Europe)', lat: 48.8566, lon: 2.3522, elevation: 35, category: 'global' },
  { id: 'london', name: 'London (Reading - Trụ sở ECMWF)', country: 'Vương Quốc Anh', lat: 51.4543, lon: -0.9781, elevation: 61, category: 'global' },
  { id: 'newyork', name: 'New York', country: 'Hoa Kỳ', lat: 40.7128, lon: -74.0060, elevation: 10, category: 'global' },
];

export const DEFAULT_LOCATION = PRESET_LOCATIONS[0]; // Hanoi
