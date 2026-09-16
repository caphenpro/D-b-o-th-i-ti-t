import { WeatherLayerType } from '../types';

export function getLayerConfig(layer: WeatherLayerType) {
  switch (layer) {
    case 'temp_2m':
      return {
        label: 'Nhiệt độ mặt đất (2t)',
        unit: '°C',
        gribName: '2t (Surface 2m Temperature)',
        description: 'Nhiệt độ không khí ở độ cao 2m so với mặt đất (ECMWF IFS 0.25°)',
        pythonCode: "ds_sfc['2t'] - 273.15",
        cmap: 'Nhiệt sắc (Xanh lơ → Vàng → Cam → Đỏ)',
        min: 0,
        max: 42,
      };
    case 'cloud_temp_500':
      return {
        label: 'Nhiệt độ tầng mây 500 hPa',
        unit: '°C',
        gribName: 't @ 500hPa (~5,500m)',
        description: 'Nhiệt độ tầng đối lưu trung bình / mây đóng băng (tương ứng biến t ở 500hPa)',
        pythonCode: "ds_pl['t'].sel(isobaricInhPa=500) - 273.15",
        cmap: 'CoolWarm (-35°C đến 0°C)',
        min: -35,
        max: 5,
      };
    case 'cloud_temp_850':
      return {
        label: 'Nhiệt độ tầng mây 850 hPa',
        unit: '°C',
        gribName: 't @ 850hPa (~1,500m)',
        description: 'Nhiệt độ tầng mây thấp và đường chân mây đối lưu',
        pythonCode: "ds_pl['t'].sel(isobaricInhPa=850) - 273.15",
        cmap: 'CoolWarm (-10°C đến 25°C)',
        min: -10,
        max: 30,
      };
    case 'cloud_cover':
      return {
        label: 'Tổng độ phủ mây (tcc)',
        unit: '%',
        gribName: 'tcc (Total Cloud Cover)',
        description: 'Tỷ lệ % bầu trời bị mây che phủ (0% trời quang → 100% nhiều mây)',
        pythonCode: "ds_sfc['tcc'] * 100",
        cmap: 'Trắng/Xám mờ (0% - 100%)',
        min: 0,
        max: 100,
      };
    case 'pressure_msl':
      return {
        label: 'Áp suất khí quyển (msl)',
        unit: 'hPa',
        gribName: 'msl (Mean Sea Level Pressure)',
        description: 'Áp suất khí quyển mực nước biển trung bình (hPa)',
        pythonCode: "ds_sfc['msl'] / 100",
        cmap: 'Isobaric Gradient (995 - 1030 hPa)',
        min: 990,
        max: 1030,
      };
    case 'pm25':
      return {
        label: 'Bụi mịn PM2.5 (CAMS)',
        unit: 'µg/m³',
        gribName: 'particulate_matter_2.5um (CAMS)',
        description: 'Nồng độ bụi mịn PM2.5, khói cháy rừng từ mô hình ECMWF CAMS',
        pythonCode: "ds_cams['pm25'][0] * 1e9",
        cmap: 'YlOrRd / AQI (0 - 150+ µg/m³)',
        min: 0,
        max: 150,
      };
    case 'aod':
      return {
        label: 'Độ dày quang học Aerosol (AOD)',
        unit: '550nm',
        gribName: 'aerosol_optical_depth_550nm (CAMS)',
        description: 'Mức độ suy giảm ánh sáng mặt trời do khói, sol khí và bụi ô nhiễm',
        pythonCode: "ds_cams['aerosol_optical_depth_550nm']",
        cmap: 'Quang học (0.05 - 1.2)',
        min: 0.05,
        max: 1.5,
      };
    case 'wildfire_dust':
      return {
        label: 'Khói cháy rừng & Bụi khoáng',
        unit: 'µg/m³',
        gribName: 'wildfire_flux & dust (CAMS)',
        description: 'Dòng phát thải bụi từ cháy rừng và bụi sa mạc/khoáng sản',
        pythonCode: "ds_cams['wildfire_flux_of_particulate_matter']",
        cmap: 'Hổ phách - Nâu đỏ',
        min: 0,
        max: 80,
      };
  }
}

export function getColorForValue(val: number, layer: WeatherLayerType): string {
  switch (layer) {
    case 'temp_2m':
      if (val < 10) return '#38bdf8'; // light blue
      if (val < 20) return '#34d399'; // green
      if (val < 26) return '#a3e635'; // lime
      if (val < 31) return '#facc15'; // yellow
      if (val < 36) return '#fb923c'; // orange
      return '#ef4444'; // red hot

    case 'cloud_temp_500':
      // Mid troposphere: typically -30°C to 0°C (coolwarm)
      if (val < -25) return '#1e40af'; // deep blue
      if (val < -18) return '#3b82f6'; // blue
      if (val < -12) return '#60a5fa'; // light blue
      if (val < -6) return '#93c5fd';  // pale blue
      if (val < 0) return '#fed7aa';   // warm pale
      return '#f97316'; // warm orange

    case 'cloud_temp_850':
      if (val < 5) return '#0284c7';
      if (val < 14) return '#06b6d4';
      if (val < 20) return '#10b981';
      if (val < 26) return '#f59e0b';
      return '#ef4444';

    case 'cloud_cover':
      if (val < 20) return '#38bdf8'; // clear sky
      if (val < 50) return '#94a3b8'; // scattered
      if (val < 80) return '#cbd5e1'; // overcast
      return '#f8fafc'; // dense overcast

    case 'pressure_msl':
      if (val < 1000) return '#ef4444'; // low pressure (typhoon/cyclone)
      if (val < 1008) return '#f97316';
      if (val < 1014) return '#3b82f6'; // normal
      if (val < 1022) return '#10b981';
      return '#6366f1'; // high pressure

    case 'pm25':
      // WHO & US AQI scale (µg/m³)
      if (val <= 12) return '#22c55e'; // Tốt (Green)
      if (val <= 35.4) return '#eab308'; // Trung bình (Yellow)
      if (val <= 55.4) return '#f97316'; // Kém (Orange)
      if (val <= 150) return '#ef4444';  // Xấu (Red)
      if (val <= 250) return '#a855f7';  // Rất xấu (Purple)
      return '#7e22ce'; // Nguy hại (Maroon)

    case 'aod':
      if (val < 0.15) return '#22c55e'; // Trong lành
      if (val < 0.35) return '#eab308'; // Trung bình
      if (val < 0.6) return '#f97316';  // Bụi mờ
      if (val < 1.0) return '#ef4444';  // Khói bụi dày
      return '#991b1b'; // Khói đậm đặc

    case 'wildfire_dust':
      if (val < 10) return '#10b981';
      if (val < 25) return '#f59e0b';
      if (val < 50) return '#ea580c';
      return '#dc2626';
  }
}

export function getAirQualityEvaluation(pm25: number): {
  status: string;
  badgeClass: string;
  advice: string;
  whoExceedFactor: string;
} {
  const whoStandard = 15; // WHO 24-hour guideline: 15 µg/m³
  const factor = (pm25 / whoStandard).toFixed(1);

  if (pm25 <= 12) {
    return {
      status: 'Tuyệt vời / Trong lành',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      advice: 'Chất lượng không khí lý tưởng, rất thích hợp cho mọi hoạt động ngoài trời và thể thao.',
      whoExceedFactor: 'Đạt chuẩn WHO',
    };
  }
  if (pm25 <= 35.4) {
    return {
      status: 'Trung bình / Chấp nhận được',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      advice: 'Chất lượng chấp nhận được. Người cực kỳ nhạy cảm với bụi mịn nên chú ý theo dõi.',
      whoExceedFactor: `${factor}x chuẩn WHO`,
    };
  }
  if (pm25 <= 55.4) {
    return {
      status: 'Kém (Không tốt cho nhóm nhạy cảm)',
      badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      advice: 'Trẻ em, người già và người mắc bệnh hô hấp nên hạn chế hoạt động mạnh ngoài trời.',
      whoExceedFactor: `${factor}x chuẩn WHO`,
    };
  }
  if (pm25 <= 150) {
    return {
      status: 'Xấu / Ô nhiễm cao',
      badgeClass: 'bg-red-500/20 text-red-300 border-red-500/30',
      advice: 'Mọi người có thể cảm thấy khó thở hoặc cay mắt. Nên đeo khẩu trang lọc bụi mịn N95 khi ra đường.',
      whoExceedFactor: `${factor}x chuẩn WHO`,
    };
  }
  return {
    status: 'Rất Xấu / Cảnh báo nguy hại',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    advice: 'Cảnh báo khẩn cấp về ô nhiễm khói bụi. Hạn chế tối đa ra ngoài, sử dụng máy lọc không khí trong nhà.',
    whoExceedFactor: `${factor}x chuẩn WHO`,
  };
}
