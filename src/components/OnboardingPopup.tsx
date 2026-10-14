import React, { useState } from 'react';
import { PROVINCE_NAMES_2025 } from '../lib/vnProvinces';
import { OnboardingData } from '../types';

export const PROVINCE_REGION_MAP: Record<string, { region: string; donGia: { min: number; max: number } }> = {
  // Đồng bằng Bắc Bộ & Thủ đô
  'Hà Nội':          { region: 'Hà Nội',               donGia: { min: 6.5, max: 9.5 } },
  'Hải Phòng':       { region: 'Đồng bằng Bắc Bộ',     donGia: { min: 5.5, max: 7.5 } },
  'Bắc Ninh':        { region: 'Đồng bằng Bắc Bộ',     donGia: { min: 5.2, max: 7.0 } },
  'Hưng Yên':        { region: 'Đồng bằng Bắc Bộ',     donGia: { min: 4.8, max: 6.5 } },
  'Hải Dương':       { region: 'Đồng bằng Bắc Bộ',     donGia: { min: 4.8, max: 6.5 } },
  'Quảng Ninh':      { region: 'Đồng bằng Bắc Bộ',     donGia: { min: 5.5, max: 7.5 } },
  'Hà Nam':          { region: 'Đồng bằng Bắc Bộ',     donGia: { min: 4.5, max: 6.0 } },
  'Nam Định':        { region: 'Đồng bằng Bắc Bộ',     donGia: { min: 4.5, max: 6.0 } },
  'Thái Bình':       { region: 'Đồng bằng Bắc Bộ',     donGia: { min: 4.5, max: 6.0 } },
  'Ninh Bình':       { region: 'Đồng bằng Bắc Bộ',     donGia: { min: 4.5, max: 6.2 } },
  'Vĩnh Phúc':       { region: 'Đồng bằng Bắc Bộ',     donGia: { min: 4.8, max: 6.5 } },
  // Trung du & Miền núi phía Bắc
  'Bắc Giang':       { region: 'Trung du & Miền núi Bắc Bộ', donGia: { min: 4.6, max: 6.2 } },
  'Thái Nguyên':     { region: 'Trung du & Miền núi Bắc Bộ', donGia: { min: 4.8, max: 6.5 } },
  'Phú Thọ':         { region: 'Trung du & Miền núi Bắc Bộ', donGia: { min: 4.6, max: 6.2 } },
  'Hòa Bình':        { region: 'Trung du & Miền núi Bắc Bộ', donGia: { min: 4.5, max: 6.2 } },
  'Lạng Sơn':        { region: 'Trung du & Miền núi Bắc Bộ', donGia: { min: 4.6, max: 6.2 } },
  'Tuyên Quang':     { region: 'Trung du & Miền núi Bắc Bộ', donGia: { min: 4.5, max: 6.0 } },
  'Yên Bái':         { region: 'Trung du & Miền núi Bắc Bộ', donGia: { min: 4.5, max: 6.0 } },
  'Lào Cai':         { region: 'Trung du & Miền núi Bắc Bộ', donGia: { min: 5.0, max: 6.8 } },
  'Sơn La':          { region: 'Trung du & Miền núi Bắc Bộ', donGia: { min: 4.8, max: 6.5 } },
  'Điện Biên':       { region: 'Trung du & Miền núi Bắc Bộ', donGia: { min: 4.8, max: 6.5 } },
  'Lai Châu':        { region: 'Trung du & Miền núi Bắc Bộ', donGia: { min: 4.8, max: 6.5 } },
  'Hà Giang':        { region: 'Trung du & Miền núi Bắc Bộ', donGia: { min: 4.8, max: 6.5 } },
  'Cao Bằng':        { region: 'Trung du & Miền núi Bắc Bộ', donGia: { min: 4.8, max: 6.5 } },
  'Bắc Kạn':         { region: 'Trung du & Miền núi Bắc Bộ', donGia: { min: 4.6, max: 6.2 } },
  // Bắc Trung Bộ & Duyên hải Miền Trung
  'Thanh Hóa':       { region: 'Bắc Trung Bộ',         donGia: { min: 4.5, max: 6.2 } },
  'Nghệ An':         { region: 'Bắc Trung Bộ',         donGia: { min: 4.6, max: 6.2 } },
  'Hà Tĩnh':         { region: 'Bắc Trung Bộ',         donGia: { min: 4.5, max: 6.0 } },
  'Quảng Bình':      { region: 'Bắc Trung Bộ',         donGia: { min: 4.5, max: 6.0 } },
  'Quảng Trị':       { region: 'Bắc Trung Bộ',         donGia: { min: 4.5, max: 6.0 } },
  'Thừa Thiên Huế':  { region: 'Miền Trung',            donGia: { min: 5.0, max: 6.8 } },
  'Huế (TP Trực thuộc TW)': { region: 'Miền Trung',   donGia: { min: 5.2, max: 7.0 } },
  'Đà Nẵng':         { region: 'Miền Trung',            donGia: { min: 5.8, max: 8.0 } },
  'Quảng Nam':       { region: 'Miền Trung',            donGia: { min: 4.6, max: 6.2 } },
  'Quảng Ngãi':      { region: 'Miền Trung',            donGia: { min: 4.6, max: 6.2 } },
  'Bình Định':       { region: 'Duyên hải Nam Trung Bộ', donGia: { min: 4.8, max: 6.5 } },
  'Phú Yên':         { region: 'Duyên hải Nam Trung Bộ', donGia: { min: 4.6, max: 6.2 } },
  'Khánh Hòa':       { region: 'Duyên hải Nam Trung Bộ', donGia: { min: 5.5, max: 7.5 } },
  'Ninh Thuận':      { region: 'Duyên hải Nam Trung Bộ', donGia: { min: 4.6, max: 6.2 } },
  'Bình Thuận':      { region: 'Duyên hải Nam Trung Bộ', donGia: { min: 4.8, max: 6.5 } },
  // Tây Nguyên
  'Đắk Lắk':         { region: 'Tây Nguyên',            donGia: { min: 4.8, max: 6.5 } },
  'Lâm Đồng':        { region: 'Tây Nguyên',            donGia: { min: 5.2, max: 7.0 } },
  'Gia Lai':         { region: 'Tây Nguyên',            donGia: { min: 4.6, max: 6.2 } },
  'Đắk Nông':        { region: 'Tây Nguyên',            donGia: { min: 4.6, max: 6.2 } },
  'Kon Tum':         { region: 'Tây Nguyên',            donGia: { min: 4.6, max: 6.2 } },
  // Đông Nam Bộ & TP.HCM
  'TP. Hồ Chí Minh': { region: 'TP.HCM',               donGia: { min: 7.0, max: 10.5 } },
  'Bình Dương':      { region: 'Đông Nam Bộ',          donGia: { min: 5.8, max: 8.0 } },
  'Đồng Nai':        { region: 'Đông Nam Bộ',          donGia: { min: 5.6, max: 7.8 } },
  'Bà Rịa - Vũng Tàu': { region: 'Đông Nam Bộ',        donGia: { min: 5.8, max: 8.0 } },
  'Tây Ninh':        { region: 'Đông Nam Bộ',          donGia: { min: 4.8, max: 6.5 } },
  'Bình Phước':      { region: 'Đông Nam Bộ',          donGia: { min: 4.8, max: 6.5 } },
  // Đồng bằng Sông Cửu Long (Tây Nam Bộ)
  'Cần Thơ':         { region: 'Đồng bằng Sông Cửu Long', donGia: { min: 5.0, max: 7.0 } },
  'Long An':         { region: 'Đồng bằng Sông Cửu Long', donGia: { min: 4.8, max: 6.5 } },
  'Tiền Giang':      { region: 'Đồng bằng Sông Cửu Long', donGia: { min: 4.6, max: 6.2 } },
  'Bến Tre':         { region: 'Đồng bằng Sông Cửu Long', donGia: { min: 4.6, max: 6.2 } },
  'Đồng Tháp':       { region: 'Đồng bằng Sông Cửu Long', donGia: { min: 4.6, max: 6.2 } },
  'Vĩnh Long':       { region: 'Đồng bằng Sông Cửu Long', donGia: { min: 4.6, max: 6.2 } },
  'An Giang':        { region: 'Đồng bằng Sông Cửu Long', donGia: { min: 4.6, max: 6.2 } },
  'Kiên Giang':      { region: 'Đồng bằng Sông Cửu Long', donGia: { min: 5.0, max: 7.0 } },
  'Hậu Giang':       { region: 'Đồng bằng Sông Cửu Long', donGia: { min: 4.5, max: 6.0 } },
  'Trà Vinh':        { region: 'Đồng bằng Sông Cửu Long', donGia: { min: 4.5, max: 6.0 } },
  'Sóc Trăng':       { region: 'Đồng bằng Sông Cửu Long', donGia: { min: 4.5, max: 6.0 } },
  'Bạc Liêu':        { region: 'Đồng bằng Sông Cửu Long', donGia: { min: 4.6, max: 6.2 } },
  'Cà Mau':          { region: 'Đồng bằng Sông Cửu Long', donGia: { min: 4.8, max: 6.5 } },
  // Đặc khu & Quốc tế
  'Khác (Cập nhật địa giới mới)': { region: 'Toàn quốc', donGia: { min: 4.8, max: 6.8 } },
  'Quốc tế (Lào, Campuchia,...)':  { region: 'Quốc tế',  donGia: { min: 8.0, max: 15.0 } },
};

export const mapProvinceToRegion = (province: string): string => {
  if (!province) return 'Đồng bằng Bắc Bộ';
  if (PROVINCE_REGION_MAP[province]) return PROVINCE_REGION_MAP[province].region;
  // Search partial match in map keys
  const match = Object.keys(PROVINCE_REGION_MAP).find(k => 
    province.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(province.toLowerCase())
  );
  if (match) return PROVINCE_REGION_MAP[match].region;
  return 'Đồng bằng Bắc Bộ';
};

export const getDonGia = (province: string) => {
  if (!province) return { min: 4.8, max: 6.8 };
  if (PROVINCE_REGION_MAP[province]) return PROVINCE_REGION_MAP[province].donGia;
  const match = Object.keys(PROVINCE_REGION_MAP).find(k => 
    province.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(province.toLowerCase())
  );
  if (match) return PROVINCE_REGION_MAP[match].donGia;
  return { min: 4.8, max: 6.8 };
};

const OnboardingPopup: React.FC<{
  onDone: (data: OnboardingData) => void;
  theme: 'dark' | 'light';
  t?: any;
  lang?: string;
}> = ({ onDone, theme, t = {} }) => {
  const [step, setStep] = useState(1);
  const [birthYear, setBirthYear] = useState<number>(1990);
  const [gender, setGender]   = useState<'nam' | 'nu'>('nam');
  const [province, setProvince] = useState<string>('Hà Nội');
  const [soilType, setSoilType] = useState<string>('chua_biet');
  const [archStyle, setArchStyle] = useState<string>('hien_dai');

  const provinces = PROVINCE_NAMES_2025; // 34 tỉnh/thành mới (NQ 202/2025/QH15)
  const years     = Array.from({ length: 70 }, (_, i) => 2005 - i);

  const ob = (t as any).onboarding || {};

  const soilOptions = [
    { id: 'tot',      label: ob.soilGood || 'Đất tốt',      icon: '🟩' },
    { id: 'yeu',      label: ob.soilWeak || 'Đất yếu',      icon: '🟨' },
    { id: 'cat',      label: ob.soilSand || 'Đất cát/pha',  icon: '🟧' },
    { id: 'chua_biet',label: ob.soilUnknown || 'Chưa biết',    icon: '⬜' },
  ];

  const archOptions = [
    { id: 'hien_dai',    label: ob.archModern || 'Hiện đại'      },
    { id: 'tan_co_dien', label: ob.archNeoclassic || 'Tân cổ điển'   },
    { id: 'tropical',    label: ob.archTropical || 'Tropical'       },
    { id: 'truyen_thong',label: ob.archTraditional || 'Truyền thống'   },
    { id: 'toi_gian',    label: ob.archMinimal || 'Tối giản'       },
    { id: 'khac',        label: ob.archOther || 'Khác'           },
  ];

  const handleDone = () => {
    const data: OnboardingData = {
      birthYear,
      gender,
      province,
      soilType,
      architectureStyle: archStyle,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem('yohu_onboarding_done', 'true');
    localStorage.setItem('yohu_onboarding_data', JSON.stringify(data));
    onDone(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border ${
        theme === 'dark' ? 'bg-[#0f1424] text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-200'
      }`}>
        <div className="flex justify-center gap-2 mb-6">
          {[1,2,3,4].map(s => (
            <div key={s} className={`h-2 rounded-full transition-all ${
              s === step ? 'w-8 bg-amber-500' : s < step ? 'w-2 bg-amber-400/60' : 'w-2 bg-slate-700'
            }`} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h3 className="text-lg font-bold mb-1 font-sans">{ob.step1Title || "Năm sinh của bạn?"}</h3>
            <p className="text-xs text-slate-400 mb-4">{ob.step1Sub || "Để tính mệnh phong thủy chính xác"}</p>
            <select value={birthYear} onChange={e => setBirthYear(+e.target.value)}
              className={`w-full p-3 rounded-xl border mb-4 font-sans text-sm focus:outline-none focus:border-amber-500 ${
                theme === 'dark' ? 'bg-slate-800/80 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="flex gap-3 mb-6">
              {(['nam','nu'] as const).map(g => (
                <button key={g} type="button" onClick={() => setGender(g)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all cursor-pointer text-sm ${
                    gender === g ? 'bg-amber-500 text-slate-950 shadow-md' : theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}>
                  {g === 'nam' ? (ob.male || '👨 Nam') : (ob.female || '👩 Nữ')}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setStep(2)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer text-sm">
              {ob.btnNext || "Tiếp theo →"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="text-lg font-bold mb-1 font-sans">{ob.step2Title || "Công trình ở tỉnh/thành nào?"}</h3>
            <p className="text-xs text-slate-400 mb-4">{ob.step2Sub || "Ảnh hưởng đơn giá xây dựng và vật liệu"}</p>
            <select value={province} onChange={e => setProvince(e.target.value)}
              className={`w-full p-3 rounded-xl border mb-6 font-sans text-sm focus:outline-none focus:border-amber-500 ${
                theme === 'dark' ? 'bg-slate-800/80 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}>
              {provinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className={`flex-1 py-3 rounded-xl font-medium transition cursor-pointer text-sm ${
                theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}>{ob.btnBack || "← Quay lại"}</button>
              <button type="button" onClick={() => setStep(3)} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer text-sm">{ob.btnNext || "Tiếp →"}</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 className="text-lg font-bold mb-1 font-sans">{ob.step3Title || "Loại đất xây dựng?"}</h3>
            <p className="text-xs text-slate-400 mb-4">{ob.step3Sub || "Ảnh hưởng đến loại móng phù hợp"}</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {soilOptions.map(o => (
                <button key={o.id} type="button" onClick={() => setSoilType(o.id)}
                  className={`py-3 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    soilType === o.id ? 'bg-amber-500 text-slate-950 shadow-md' : theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}>
                  <span>{o.icon}</span> <span>{o.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className={`flex-1 py-3 rounded-xl font-medium transition cursor-pointer text-sm ${
                theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}>{ob.btnBack || "← Quay lại"}</button>
              <button type="button" onClick={() => setStep(4)} className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer text-sm">{ob.btnNext || "Tiếp →"}</button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h3 className="text-lg font-bold mb-1 font-sans">{ob.step4Title || "Phong cách kiến trúc?"}</h3>
            <p className="text-xs text-slate-400 mb-4">{ob.step4Sub || "AI sẽ tư vấn phù hợp phong thủy"}</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {archOptions.map(o => (
                <button key={o.id} type="button" onClick={() => setArchStyle(o.id)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    archStyle === o.id ? 'bg-amber-500 text-slate-950 shadow-md' : theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}>
                  {o.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(3)} className={`flex-1 py-3 rounded-xl font-medium transition cursor-pointer text-sm ${
                theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}>{ob.btnBack || "← Quay lại"}</button>
              <button type="button" onClick={handleDone}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer text-sm">
                {ob.btnFinish || "✓ Hoàn tất"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OnboardingPopup;
