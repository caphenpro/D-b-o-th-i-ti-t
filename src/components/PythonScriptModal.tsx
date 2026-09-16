import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FileCode, Database, ExternalLink, Code2 } from 'lucide-react';
import { CombinedWeatherData } from '../types';

interface PythonScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CombinedWeatherData;
}

export const PythonScriptModal: React.FC<PythonScriptModalProps> = ({ isOpen, onClose, data }) => {
  const [activeTab, setActiveTab] = useState<'source' | 'mapping' | 'raw_json'>('source');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pythonScript = `import os
from ecmwf.opendata import Client
import xarray as xr
import matplotlib.pyplot as plt

# ==========================================================
# 1. TẢI DỮ LIỆU KHÍ TƯỢNG ECMWF IFS (Nhiệt độ mây, Mây phủ)
# ==========================================================
def download_ecmwf_ifs_data():
    print("--- Đang tải dữ liệu ECMWF IFS Open Data (Real-time) ---")
    client = Client(source="ecmwf", model="ifs", resol="0p25")
    
    # Tải dữ liệu dự báo cho 24 giờ tới
    # '2t': Nhiệt độ 2m, 'tcc': Tổng độ phủ mây (Total Cloud Cover)
    # 't': Nhiệt độ theo tầng áp suất (dùng cho mây ở tầng 500hPa (~5500m) hoặc 850hPa (~1500m))
    request_sfc = {
        "type": "fc",
        "step": 24,
        "param": ["2t", "tcc", "msl"],
        "target": "ifs_surface.grib2"
    }
    client.retrieve(request_sfc)
    
    # Tải nhiệt độ tầng mây trung (500 hPa)
    request_pl = {
        "type": "fc",
        "step": 24,
        "levtype": "pl",
        "levelist": [500, 850],
        "param": ["t"],
        "target": "ifs_pressure.grib2"
    }
    client.retrieve(request_pl)
    print("--> Hoàn tất tải dữ liệu IFS (GRIB2).")

# ==========================================================
# 2. TẢI DỮ LIỆU KHÓI BỤI & Ô NHIỄM (CAMS - ECMWF Air Quality)
# ==========================================================
def download_cams_air_quality():
    """
    Lưu ý: Để chạy CAMS API, bạn cần tài khoản miễn phí tại Copernicus Climate Data Store (CDS)
    và file cấu hình ~/.cdsapirc chứa URL và API Key.
    """
    print("\\n--- Đang tải dữ liệu khói bụi & ô nhiễm từ ECMWF CAMS ---")
    import cdsapi
    
    c = cdsapi.Client()
    c.retrieve(
        'cams-global-atmospheric-composition-forecasts',
        {
            'variable': [
                'particulate_matter_2.5um',        # Bụi mịn PM2.5 (cháy rừng, ô nhiễm)
                'wildfire_flux_of_particulate_matter', # Lượng bụi từ cháy rừng
                'volcanic_ash_column_mass_density',   # Tro núi lửa
                'aerosol_optical_depth_550nm',      # Độ dày quang học Aerosol (khói bụi tổng hợp)
            ],
            'date': '2026-09-15/2026-09-16',
            'time': '00:00',
            'leadtime_hour': '24',
            'type': 'forecast',
            'format': 'netcdf',
        },
        'cams_forecast.nc'
    )
    print("--> Hoàn tất tải dữ liệu CAMS (NetCDF).")

# ==========================================================
# 3. ĐỌC VÀ TRỰC QUAN HÓA DỮ LIỆU VỚI XARRAY & MATPLOTLIB
# ==========================================================
def plot_ifs_cloud_temp():
    print("\\n--- Đang trích xuất & đọc file dữ liệu ---")
    # Sử dụng engine cfgrib để mở file GRIB2
    ds_sfc = xr.open_dataset("ifs_surface.grib2", engine="cfgrib")
    ds_pl = xr.open_dataset("ifs_pressure.grib2", engine="cfgrib")
    
    # Chuyển Kelvin sang Celsius cho nhiệt độ tầng mây 500hPa
    cloud_temp_c = ds_pl['t'].sel(isobaricInhPa=500) - 273.15
    cloud_cover = ds_sfc['tcc'] * 100 # % Độ phủ mây
    
    # Vẽ biểu đồ nhiệt độ tầng mây
    fig, ax = plt.subplots(figsize=(10, 5))
    cloud_temp_c.plot(ax=ax, cmap='coolwarm')
    ax.set_title("Nhiệt độ tầng mây trung (500 hPa) - ECMWF IFS (°C)")
    plt.savefig("cloud_temperature.png")
    print("--> Đã lưu biểu đồ nhiệt độ mây: cloud_temperature.png")

    # Vẽ biểu đồ khói bụi CAMS nếu đã tải file
    if os.path.exists("cams_forecast.nc"):
        ds_cams = xr.open_dataset("cams_forecast.nc")
        pm25 = ds_cams['pm25'][0] * 1e9 # Đổi đơn vị sang kg/m3 -> ug/m3
        
        fig, ax = plt.subplots(figsize=(10, 5))
        pm25.plot(ax=ax, cmap='YlOrRd')
        ax.set_title("Dự báo nồng độ bụi PM2.5 / Khói cháy rừng - ECMWF CAMS (µg/m³)")
        plt.savefig("pm25_forecast.png")
        print("--> Đã lưu biểu đồ ô nhiễm CAMS: pm25_forecast.png")

if __name__ == "__main__":
    download_ecmwf_ifs_data()
    plot_ifs_cloud_temp()
    # download_cams_air_quality()
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const idx = data.currentStepIndex;
  const sampleSnapshot = {
    location: data.location.name,
    coordinates: [data.location.lat, data.location.lon],
    elevation_meters: data.elevation,
    step_hour: data.selectedStepHour,
    ifs_open_data_0p25: {
      "2t_temperature_celsius": data.ifs.temperature_2m[idx],
      "tcc_cloud_cover_percent": data.ifs.cloud_cover[idx],
      "msl_mean_sea_level_pressure_hpa": data.ifs.pressure_msl[idx],
      "t_500hPa_mid_cloud_temperature_celsius": data.ifs.temperature_500hPa[idx],
      "t_850hPa_low_cloud_temperature_celsius": data.ifs.temperature_850hPa[idx],
    },
    cams_atmospheric_composition: {
      "pm25_ug_per_m3": data.cams.pm2_5[idx],
      "aerosol_optical_depth_550nm": data.cams.aerosol_optical_depth[idx],
      "dust_wildfire_flux_ug_per_m3": data.cams.dust[idx],
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Mã Nguồn ECMWF Python & Đối Chiếu Dữ Liệu</h3>
              <p className="text-xs text-slate-400">
                Toàn bộ dữ liệu web tĩnh này ánh xạ trực tiếp từ mã nguồn Python ECMWF IFS & CAMS của bạn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-800 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('source')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'source'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Mã nguồn Python bạn cung cấp</span>
          </button>

          <button
            onClick={() => setActiveTab('mapping')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'mapping'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Bảng đối chiếu biến GRIB2 & NetCDF</span>
          </button>

          <button
            onClick={() => setActiveTab('raw_json')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'raw_json'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Dữ liệu JSON Real-time trạm hiện tại</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {activeTab === 'source' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950/70 px-3.5 py-2 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px]">
                  Mô hình: <code className="text-cyan-300 font-mono">ecmwf.opendata (IFS 0.25°)</code> + <code className="text-emerald-300 font-mono">CAMS Global</code>
                </span>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 text-xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép mã Python'}</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-[12px] leading-relaxed text-slate-200 overflow-x-auto selection:bg-cyan-500/30">
                <pre>{pythonScript}</pre>
              </div>
            </div>
          )}

          {activeTab === 'mapping' && (
            <div className="space-y-4">
              <p className="text-slate-300 text-sm">
                Ứng dụng này sử dụng API nguồn mở chuẩn Open-Meteo ECMWF kết nối trực tiếp với trung tâm dự báo ECMWF Reading, UK và Copernicus Atmosphere Monitoring Service (CAMS), cung cấp chính xác các biến số sau:
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                      <th className="p-3">Biến Python (User Code)</th>
                      <th className="p-3">Tầng khí quyển</th>
                      <th className="p-3">Công thức chuyển đổi</th>
                      <th className="p-3">Hiển thị trên Web</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200 font-mono text-[11px]">
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-amber-300">param: ["2t"]</td>
                      <td className="p-3 text-slate-400">Surface (2m)</td>
                      <td className="p-3 text-slate-300">Kelvin - 273.15</td>
                      <td className="p-3 text-cyan-300">Nhiệt độ mặt đất (2t)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-blue-300">levelist: [500], param: ["t"]</td>
                      <td className="p-3 text-slate-400">500 hPa (~5,500m)</td>
                      <td className="p-3 text-slate-300">ds_pl['t'].sel(500) - 273.15</td>
                      <td className="p-3 text-cyan-300">Nhiệt độ tầng mây trung 500hPa</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-teal-300">levelist: [850], param: ["t"]</td>
                      <td className="p-3 text-slate-400">850 hPa (~1,500m)</td>
                      <td className="p-3 text-slate-300">ds_pl['t'].sel(850) - 273.15</td>
                      <td className="p-3 text-cyan-300">Nhiệt độ chân mây 850hPa</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-sky-300">param: ["tcc"]</td>
                      <td className="p-3 text-slate-400">Surface Total</td>
                      <td className="p-3 text-slate-300">ds_sfc['tcc'] * 100 (%)</td>
                      <td className="p-3 text-cyan-300">Tổng độ phủ mây (%)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-indigo-300">param: ["msl"]</td>
                      <td className="p-3 text-slate-400">Mực biển trung bình</td>
                      <td className="p-3 text-slate-300">Pa / 100 = hPa</td>
                      <td className="p-3 text-cyan-300">Khí áp mực biển (msl)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-emerald-300">particulate_matter_2.5um</td>
                      <td className="p-3 text-slate-400">CAMS Atmospheric</td>
                      <td className="p-3 text-slate-300">kg/m³ * 1e9 = µg/m³</td>
                      <td className="p-3 text-cyan-300">Bụi mịn PM2.5 (CAMS)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-orange-300">aerosol_optical_depth_550nm</td>
                      <td className="p-3 text-slate-400">CAMS Optical</td>
                      <td className="p-3 text-slate-300">AOD tại bước sóng 550nm</td>
                      <td className="p-3 text-cyan-300">Độ dày quang học Sol khí</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-rose-300">wildfire_flux_of_pm</td>
                      <td className="p-3 text-slate-400">CAMS Wildfire</td>
                      <td className="p-3 text-slate-300">Đo dòng phát thải khói cháy</td>
                      <td className="p-3 text-cyan-300">Khói cháy rừng & Bụi khoáng</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'raw_json' && (
            <div className="space-y-3">
              <p className="text-slate-300 text-xs">
                Trích xuất thời gian thực cho trạm <strong>{data.location.name}</strong> tại bước dự báo step={data.selectedStepHour}h:
              </p>
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-[11px] leading-relaxed text-cyan-300 overflow-x-auto max-h-96">
                <pre>{JSON.stringify(sampleSnapshot, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>ECMWF Integrated Forecasting System (IFS) • Copernicus Atmosphere</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
