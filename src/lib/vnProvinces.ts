/**
 * 34 tỉnh/thành phố Việt Nam sau sắp xếp đơn vị hành chính (Nghị quyết 202/2025/QH15, hiệu lực 01/07/2025)
 * + bảng tên cũ → tỉnh mới để địa chỉ ghi theo tên cũ vẫn nhận đúng.
 *
 * Vùng giá (khớp REGIONAL_FACTORS trong boqEngine):
 *  do_thi_dac_biet (Hà Nội, TP.HCM nội đô) · mien_bac · mien_trung · mien_nam · mien_nui_hai_dao
 */
export type PriceRegion = 'mien_bac' | 'mien_trung' | 'mien_nam' | 'do_thi_dac_biet' | 'mien_nui_hai_dao';

export interface ProvinceInfo {
  name: string;          // tên tỉnh/thành mới
  merged: string[];      // các tỉnh cũ hợp nhất vào (rỗng nếu giữ nguyên)
  region: PriceRegion;
  area: 'Bắc' | 'Trung' | 'Nam';
}

export const VN_PROVINCES_2025: ProvinceInfo[] = [
  // 6 thành phố trực thuộc trung ương
  { name: 'Hà Nội', merged: [], region: 'do_thi_dac_biet', area: 'Bắc' },
  { name: 'TP. Hồ Chí Minh', merged: ['Bình Dương', 'Bà Rịa - Vũng Tàu'], region: 'do_thi_dac_biet', area: 'Nam' },
  { name: 'Hải Phòng', merged: ['Hải Dương'], region: 'mien_bac', area: 'Bắc' },
  { name: 'Đà Nẵng', merged: ['Quảng Nam'], region: 'mien_trung', area: 'Trung' },
  { name: 'Huế', merged: [], region: 'mien_trung', area: 'Trung' },
  { name: 'Cần Thơ', merged: ['Sóc Trăng', 'Hậu Giang'], region: 'mien_nam', area: 'Nam' },
  // Miền Bắc
  { name: 'Quảng Ninh', merged: [], region: 'mien_bac', area: 'Bắc' },
  { name: 'Bắc Ninh', merged: ['Bắc Giang'], region: 'mien_bac', area: 'Bắc' },
  { name: 'Hưng Yên', merged: ['Thái Bình'], region: 'mien_bac', area: 'Bắc' },
  { name: 'Ninh Bình', merged: ['Hà Nam', 'Nam Định'], region: 'mien_bac', area: 'Bắc' },
  { name: 'Phú Thọ', merged: ['Vĩnh Phúc', 'Hòa Bình'], region: 'mien_bac', area: 'Bắc' },
  { name: 'Thái Nguyên', merged: ['Bắc Kạn'], region: 'mien_bac', area: 'Bắc' },
  { name: 'Lạng Sơn', merged: [], region: 'mien_nui_hai_dao', area: 'Bắc' },
  { name: 'Cao Bằng', merged: [], region: 'mien_nui_hai_dao', area: 'Bắc' },
  { name: 'Tuyên Quang', merged: ['Hà Giang'], region: 'mien_nui_hai_dao', area: 'Bắc' },
  { name: 'Lào Cai', merged: ['Yên Bái'], region: 'mien_nui_hai_dao', area: 'Bắc' },
  { name: 'Lai Châu', merged: [], region: 'mien_nui_hai_dao', area: 'Bắc' },
  { name: 'Điện Biên', merged: [], region: 'mien_nui_hai_dao', area: 'Bắc' },
  { name: 'Sơn La', merged: [], region: 'mien_nui_hai_dao', area: 'Bắc' },
  // Miền Trung & Tây Nguyên
  { name: 'Thanh Hóa', merged: [], region: 'mien_trung', area: 'Trung' },
  { name: 'Nghệ An', merged: [], region: 'mien_trung', area: 'Trung' },
  { name: 'Hà Tĩnh', merged: [], region: 'mien_trung', area: 'Trung' },
  { name: 'Quảng Trị', merged: ['Quảng Bình'], region: 'mien_trung', area: 'Trung' },
  { name: 'Quảng Ngãi', merged: ['Kon Tum'], region: 'mien_trung', area: 'Trung' },
  { name: 'Gia Lai', merged: ['Bình Định'], region: 'mien_trung', area: 'Trung' },
  { name: 'Đắk Lắk', merged: ['Phú Yên'], region: 'mien_trung', area: 'Trung' },
  { name: 'Khánh Hòa', merged: ['Ninh Thuận'], region: 'mien_trung', area: 'Trung' },
  { name: 'Lâm Đồng', merged: ['Đắk Nông', 'Bình Thuận'], region: 'mien_trung', area: 'Trung' },
  // Miền Nam
  { name: 'Đồng Nai', merged: ['Bình Phước'], region: 'mien_nam', area: 'Nam' },
  { name: 'Tây Ninh', merged: ['Long An'], region: 'mien_nam', area: 'Nam' },
  { name: 'Đồng Tháp', merged: ['Tiền Giang'], region: 'mien_nam', area: 'Nam' },
  { name: 'Vĩnh Long', merged: ['Bến Tre', 'Trà Vinh'], region: 'mien_nam', area: 'Nam' },
  { name: 'An Giang', merged: ['Kiên Giang'], region: 'mien_nam', area: 'Nam' },
  { name: 'Cà Mau', merged: ['Bạc Liêu'], region: 'mien_nam', area: 'Nam' }
];

/** Tên cũ có vùng giá riêng khác tỉnh mới (VD Bình Dương không tính giá nội đô TP.HCM) */
const OLD_NAME_REGION: Record<string, PriceRegion> = {
  'Bình Dương': 'mien_nam',
  'Bà Rịa - Vũng Tàu': 'mien_nam',
  'Hải Dương': 'mien_bac',
  'Quảng Nam': 'mien_trung',
  'Hòa Bình': 'mien_nui_hai_dao',
  'Hà Giang': 'mien_nui_hai_dao',
  'Yên Bái': 'mien_nui_hai_dao',
  'Bắc Kạn': 'mien_nui_hai_dao',
  'Kon Tum': 'mien_nui_hai_dao',
  'Đắk Nông': 'mien_nui_hai_dao',
  'Bình Phước': 'mien_nam'
};

/** Hải đảo / vùng xa (ưu tiên cao nhất khi dò địa chỉ) */
const REMOTE_KEYWORDS = ['phú quốc', 'côn đảo', 'cô tô', 'bạch long vĩ', 'lý sơn', 'phú quý', 'vân đồn', 'cát bà', 'thổ chu', 'trường sa', 'hoàng sa'];

export const PROVINCE_NAMES_2025 = VN_PROVINCES_2025.map(p => p.name);

export function stripDiacritics(s: string): string {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase();
}

const ALIASES: Record<string, string[]> = {
  'TP. Hồ Chí Minh': ['hồ chí minh', 'tp.hcm', 'tphcm', 'tp hcm', 'hcm', 'sài gòn', 'saigon'],
  'Bà Rịa - Vũng Tàu': ['bà rịa', 'vũng tàu', 'brvt'],
  'Huế': ['thừa thiên huế', 'thừa thiên - huế', 'tp huế'],
  'Đắk Lắk': ['đắc lắc', 'dak lak', 'buôn ma thuột'],
  'Đắk Nông': ['đắc nông', 'dak nong']
};

interface Matcher { key: string; province: string; oldName?: string; }
const MATCHERS: Matcher[] = (() => {
  const list: Matcher[] = [];
  VN_PROVINCES_2025.forEach(p => {
    list.push({ key: stripDiacritics(p.name.replace(/^TP\.\s*/, '')), province: p.name });
    (ALIASES[p.name] || []).forEach(a => list.push({ key: stripDiacritics(a), province: p.name }));
    p.merged.forEach(old => {
      list.push({ key: stripDiacritics(old), province: p.name, oldName: old });
      (ALIASES[old] || []).forEach(a => list.push({ key: stripDiacritics(a), province: p.name, oldName: old }));
    });
  });
  // khớp chuỗi dài trước để "Hà Nam" không bị nhận nhầm, "Quảng Nam" trước "Nam"...
  return list.sort((a, b) => b.key.length - a.key.length);
})();

export interface ResolvedLocation {
  province: string | null;     // tỉnh mới
  oldName?: string;            // tên tỉnh cũ (nếu địa chỉ ghi tên cũ)
  region: PriceRegion;
  remote: boolean;
}

/** Nhận tỉnh/thành mới + vùng giá từ tên tỉnh hoặc địa chỉ tự do */
export function resolveLocation(text?: string): ResolvedLocation {
  const raw = String(text || '');
  const norm = ' ' + stripDiacritics(raw).replace(/[,.;\-–/()]+/g, ' ').replace(/\s+/g, ' ') + ' ';
  const lower = raw.toLowerCase();
  const remote = REMOTE_KEYWORDS.some(k => lower.includes(k) || norm.includes(' ' + stripDiacritics(k) + ' '));
  let hit: Matcher | undefined;
  for (const m of MATCHERS) {
    if (m.key.length < 3) continue;
    if (norm.includes(' ' + m.key + ' ')) { hit = m; break; }
  }
  if (!hit) return { province: null, region: remote ? 'mien_nui_hai_dao' : 'mien_bac', remote };
  const info = VN_PROVINCES_2025.find(p => p.name === hit!.province)!;
  let region: PriceRegion = hit.oldName && OLD_NAME_REGION[hit.oldName] ? OLD_NAME_REGION[hit.oldName] : info.region;
  if (remote) region = 'mien_nui_hai_dao';
  return { province: info.name, oldName: hit.oldName, region, remote };
}
