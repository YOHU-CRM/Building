/**
 * YOHU CONSTECH — Bộ Thuật Toán Phong Thủy Bát Trạch & Lục Thập Hoa Giáp
 * - Năm sinh được quy đổi theo ÂM LỊCH Việt Nam (múi giờ +7): người sinh trước Tết
 *   được tính theo năm âm lịch trước đó (đúng Can Chi, Nạp Âm, Cung Phi).
 * - Năm xét hạn (Tam Tai, Kim Lâu, Hoang Ốc, Thái Tuế) là NĂM DỰ KIẾN KHỞI CÔNG,
 *   không cố định 2026.
 * - Kết quả mang tính tham khảo theo trường phái Bát Trạch phổ biến tại Việt Nam.
 */

export interface DirectionVerdict {
  direction: string;          // Hướng khách chọn (VD: "Đông Nam")
  star: string;               // Sao Bát Trạch (Sinh Khí, Ngũ Quỷ...)
  isGood: boolean;
  level: 'rat_tot' | 'tot' | 'xau' | 'rat_xau' | 'chua_chon';
  summary: string;            // Kết luận 1 câu
  remedy: string[];           // Giải pháp thiết kế / hóa giải
}

export interface FengShuiCalculationResult {
  birthYear: number;            // Năm âm lịch dùng để tính
  canChi: string;              // Ví dụ: Kỷ Mùi
  hanh: 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ';
  elementDetail: string;        // Ví dụ: Thiên Thượng Hỏa (Lửa trên trời)
  cungPhi: string;              // Ví dụ: Chấn Mộc (Đông Tứ Mệnh)
  cungName: string;             // Chấn, Càn, Khảm, Cấn, Tốn, Ly, Khôn, Đoài
  menhQuai: 'Đông Tứ Mệnh' | 'Tây Tứ Mệnh';
  favorableDirections: string[];    // 4 hướng tốt: Sinh Khí, Thiên Y, Diên Niên, Phục Vị
  unfavorableDirections: string[];  // 4 hướng xấu: Tuyệt Mệnh, Ngũ Quỷ, Họa Hại, Lục Sát
  favorableColors: string[];        // Màu tương sinh & tương hợp
  unfavorableColors: string[];      // Màu tương khắc (kỵ)
  luckyNumbers: number[];           // Con số may mắn
  targetYear: number;               // Năm dự kiến khởi công
  targetCanChi: string;             // Can Chi năm khởi công
  ageAtTarget: number;              // Tuổi mụ năm khởi công
  // Giữ tên trường cũ (…2026) để tương thích giao diện, nội dung đã theo targetYear
  tamTai2026: { isPham: boolean; detail: string };
  kimLau2026: { isPham: boolean; detail: string };
  hoangOc2026: { isPham: boolean; detail: string };
  thaiTue: { isPham: boolean; detail: string };
  advice2026: string;               // Lời khuyên động thổ năm khởi công
  favorableDates2026: string[];     // Tháng cát lành (tham khảo)
  borrowAgeCandidates: number[];    // Năm sinh nam giới có thể mượn tuổi
  directionVerdict: DirectionVerdict;
  deepAnalysis: string;             // Luận giải chuyên sâu
}

const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

export function getCanChi(year: number): string {
  return `${CAN[((year - 4) % 10 + 10) % 10]} ${CHI[((year - 4) % 12 + 12) % 12]}`;
}

/* ══════════════════════════════════════════════════════════════════
 * ÂM LỊCH VIỆT NAM (thuật toán Hồ Ngọc Đức, múi giờ +7)
 * ══════════════════════════════════════════════════════════════════ */
const TZ = 7;
function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  return jd;
}
function newMoon(k: number): number {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Jd1 + C1 - deltat;
}
function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = Math.PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return L;
}
const getNewMoonDay = (k: number) => Math.floor(newMoon(k) + 0.5 + TZ / 24);
const getSunLongitude = (d: number) => Math.floor(sunLongitude(d - 0.5 - TZ / 24) / Math.PI * 6);
function getLunarMonth11(yy: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k);
  if (getSunLongitude(nm) >= 9) nm = getNewMoonDay(k - 1);
  return nm;
}
function getLeapMonthOffset(a11: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0, i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i));
  do { last = arc; i++; arc = getSunLongitude(getNewMoonDay(k + i)); } while (arc !== last && i < 14);
  return i - 1;
}

/** Đổi ngày dương → âm lịch Việt Nam */
export function solarToLunar(dd: number, mm: number, yy: number): { day: number; month: number; year: number; leap: boolean } {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k);
  let a11 = getLunarMonth11(yy);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) { lunarYear = yy; a11 = getLunarMonth11(yy - 1); }
  else { lunarYear = yy + 1; b11 = getLunarMonth11(yy + 1); }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let leap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11);
    if (diff >= leapMonthDiff) { lunarMonth = diff + 10; if (diff === leapMonthDiff) leap = true; }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap };
}

/** Ngày Tết Nguyên Đán (dương lịch, YYYY-MM-DD) của năm âm lịch `year` */
export function getTetDate(year: number): string {
  for (let m = 1; m <= 2; m++) {
    for (let d = 1; d <= 31; d++) {
      if (m === 2 && d > 29) break;
      const l = solarToLunar(d, m, year);
      if (l.day === 1 && l.month === 1 && l.year === year) {
        return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  }
  return `${year}-02-01`;
}

/**
 * Năm sinh ÂM LỊCH từ ngày sinh dương lịch "YYYY-MM-DD".
 * Ví dụ: 1990-01-20 (trước Tết Canh Ngọ 27/01/1990) → 1989 (Kỷ Tỵ).
 * Chỉ nhập năm (VD "1979") → giữ nguyên năm đó.
 */
export function getLunarBirthYear(birthDate: string | number | undefined | null): number {
  if (birthDate === undefined || birthDate === null || birthDate === '') return NaN;
  const s = String(birthDate).trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    if (mo > 2) return y; // Tết luôn rơi vào 21/01 – 20/02
    return solarToLunar(d, mo, y).year;
  }
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // DD/MM/YYYY
  if (m2) {
    const d = Number(m2[1]), mo = Number(m2[2]), y = Number(m2[3]);
    if (mo > 2) return y;
    return solarToLunar(d, mo, y).year;
  }
  const y = parseInt(s.slice(0, 4), 10);
  return isNaN(y) ? NaN : y;
}

/** Năm âm lịch hiện tại (theo giờ Việt Nam) — dùng làm năm khởi công mặc định */
export function getCurrentLunarYear(now: Date = new Date()): number {
  const vn = new Date(now.getTime() + (TZ * 60 + now.getTimezoneOffset()) * 60000);
  return solarToLunar(vn.getDate(), vn.getMonth() + 1, vn.getFullYear()).year;
}

/**
 * Năm khởi công mặc định: năm âm lịch hiện tại; nếu đã sang tháng 10 âm trở đi
 * thì gợi ý năm sau (vì thời gian chuẩn bị hồ sơ, xin phép thường 2–4 tháng).
 */
export function getDefaultConstructionYear(now: Date = new Date()): number {
  const vn = new Date(now.getTime() + (TZ * 60 + now.getTimezoneOffset()) * 60000);
  const l = solarToLunar(vn.getDate(), vn.getMonth() + 1, vn.getFullYear());
  return l.month >= 10 ? l.year + 1 : l.year;
}

// 30 Cặp Nạp Âm 60 Hoa Giáp (Bắt đầu từ 1924 Giáp Tý = index 0)
interface NapAmItem {
  hanh: 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ';
  detail: string;
}

const NAP_AM_PAIRS: NapAmItem[] = [
  { hanh: "Kim",  detail: "Hải Trung Kim (Vàng trong biển)" },
  { hanh: "Hỏa",  detail: "Lư Trung Hỏa (Lửa trong lò)" },
  { hanh: "Mộc",  detail: "Đại Lâm Mộc (Gỗ rừng già)" },
  { hanh: "Thổ",  detail: "Lộ Bàng Thổ (Đất ven đường)" },
  { hanh: "Kim",  detail: "Kiếm Phong Kim (Vàng mũi kiếm)" },
  { hanh: "Hỏa",  detail: "Sơn Đầu Hỏa (Lửa trên núi)" },
  { hanh: "Thủy", detail: "Giản Hạ Thủy (Nước dưới khe)" },
  { hanh: "Thổ",  detail: "Thành Đầu Thổ (Đất trên thành)" },
  { hanh: "Kim",  detail: "Bạch Lạp Kim (Vàng sáp ong)" },
  { hanh: "Mộc",  detail: "Dương Liễu Mộc (Gỗ cây dương)" },
  { hanh: "Thủy", detail: "Tuyền Trung Thủy (Nước trong suối)" },
  { hanh: "Thổ",  detail: "Ốc Thượng Thổ (Đất trên nóc nhà)" },
  { hanh: "Hỏa",  detail: "Tích Lịch Hỏa (Lửa sấm sét)" },
  { hanh: "Mộc",  detail: "Tùng Bách Mộc (Gỗ tùng bách)" },
  { hanh: "Thủy", detail: "Trường Lưu Thủy (Nước chảy dài)" },
  { hanh: "Kim",  detail: "Sa Trung Kim (Vàng trong cát)" },
  { hanh: "Hỏa",  detail: "Sơn Hạ Hỏa (Lửa dưới chân núi)" },
  { hanh: "Mộc",  detail: "Bình Địa Mộc (Gỗ đồng bằng)" },
  { hanh: "Thổ",  detail: "Bích Thượng Thổ (Đất trên vách tường)" },
  { hanh: "Kim",  detail: "Kim Bạch Kim (Vàng ánh kim)" },
  { hanh: "Hỏa",  detail: "Phúc Đăng Hỏa (Lửa đèn dầu)" },
  { hanh: "Thủy", detail: "Thiên Hà Thủy (Nước trên trời)" },
  { hanh: "Thổ",  detail: "Đại Trạch Thổ (Đất đầm lầy)" },
  { hanh: "Kim",  detail: "Thoa Xuyến Kim (Vàng trang sức)" },
  { hanh: "Mộc",  detail: "Tang Đố Mộc (Gỗ cây dâu)" },
  { hanh: "Thủy", detail: "Đại Khê Thủy (Nước khe lớn)" },
  { hanh: "Thổ",  detail: "Sa Trung Thổ (Đất pha cát)" },
  { hanh: "Hỏa",  detail: "Thiên Thượng Hỏa (Lửa trên trời)" },
  { hanh: "Mộc",  detail: "Thạch Lựu Mộc (Gỗ cây lựu đá)" },
  { hanh: "Thủy", detail: "Đại Hải Thủy (Nước biển lớn)" }
];

/**
 * Tính Cung Phi Bát Trạch theo năm sinh âm lịch và giới tính
 */
export function calculateCungPhi(year: number, gender: 'nam' | 'nu'): {
  cungName: string;
  cungHanh: string;
  menhQuai: 'Đông Tứ Mệnh' | 'Tây Tứ Mệnh';
  goodDirs: string[];
  badDirs: string[];
} {
  const lastTwo = year % 100;
  let d = Math.floor(lastTwo / 10) + (lastTwo % 10);
  while (d > 9) d = Math.floor(d / 10) + (d % 10);

  let cungNum: number;
  if (gender === 'nam') {
    cungNum = (year < 2000 ? 10 : 9) - d;
    while (cungNum <= 0) cungNum += 9;
    while (cungNum > 9) cungNum -= 9;
    if (cungNum === 5) cungNum = 2; // Nam 5 quy về Khôn
  } else {
    let g = (year < 2000 ? 5 : 6) + d;
    while (g > 9) g = Math.floor(g / 10) + (g % 10);
    cungNum = g;
    if (cungNum === 5) cungNum = 8; // Nữ 5 quy về Cấn
  }

  const CUNG_INFO: Record<number, {
    name: string;
    hanh: string;
    menhQuai: 'Đông Tứ Mệnh' | 'Tây Tứ Mệnh';
    goodDirs: string[];
    badDirs: string[];
  }> = {
    1: {
      name: "Khảm",
      hanh: "Thủy",
      menhQuai: "Đông Tứ Mệnh",
      goodDirs: ["Đông Nam (Sinh Khí)", "Đông (Thiên Y)", "Nam (Diên Niên)", "Bắc (Phục Vị)"],
      badDirs: ["Tây Nam (Tuyệt Mệnh)", "Đông Bắc (Ngũ Quỷ)", "Tây Bắc (Lục Sát)", "Tây (Họa Hại)"]
    },
    2: {
      name: "Khôn",
      hanh: "Thổ",
      menhQuai: "Tây Tứ Mệnh",
      goodDirs: ["Đông Bắc (Sinh Khí)", "Tây (Thiên Y)", "Tây Bắc (Diên Niên)", "Tây Nam (Phục Vị)"],
      badDirs: ["Bắc (Tuyệt Mệnh)", "Đông Nam (Ngũ Quỷ)", "Nam (Lục Sát)", "Đông (Họa Hại)"]
    },
    3: {
      name: "Chấn",
      hanh: "Mộc",
      menhQuai: "Đông Tứ Mệnh",
      goodDirs: ["Nam (Sinh Khí)", "Bắc (Thiên Y)", "Đông Nam (Diên Niên)", "Đông (Phục Vị)"],
      badDirs: ["Tây (Tuyệt Mệnh)", "Tây Bắc (Ngũ Quỷ)", "Đông Bắc (Lục Sát)", "Tây Nam (Họa Hại)"]
    },
    4: {
      name: "Tốn",
      hanh: "Mộc",
      menhQuai: "Đông Tứ Mệnh",
      goodDirs: ["Bắc (Sinh Khí)", "Nam (Thiên Y)", "Đông (Diên Niên)", "Đông Nam (Phục Vị)"],
      badDirs: ["Đông Bắc (Tuyệt Mệnh)", "Tây Nam (Ngũ Quỷ)", "Tây (Lục Sát)", "Tây Bắc (Họa Hại)"]
    },
    6: {
      name: "Càn",
      hanh: "Kim",
      menhQuai: "Tây Tứ Mệnh",
      goodDirs: ["Tây (Sinh Khí)", "Đông Bắc (Thiên Y)", "Tây Nam (Diên Niên)", "Tây Bắc (Phục Vị)"],
      badDirs: ["Nam (Tuyệt Mệnh)", "Đông (Ngũ Quỷ)", "Bắc (Lục Sát)", "Đông Nam (Họa Hại)"]
    },
    7: {
      name: "Đoài",
      hanh: "Kim",
      menhQuai: "Tây Tứ Mệnh",
      goodDirs: ["Tây Bắc (Sinh Khí)", "Tây Nam (Thiên Y)", "Đông Bắc (Diên Niên)", "Tây (Phục Vị)"],
      badDirs: ["Đông (Tuyệt Mệnh)", "Nam (Ngũ Quỷ)", "Đông Nam (Lục Sát)", "Bắc (Họa Hại)"]
    },
    8: {
      name: "Cấn",
      hanh: "Thổ",
      menhQuai: "Tây Tứ Mệnh",
      goodDirs: ["Tây Nam (Sinh Khí)", "Tây Bắc (Thiên Y)", "Tây (Diên Niên)", "Đông Bắc (Phục Vị)"],
      badDirs: ["Đông Nam (Tuyệt Mệnh)", "Bắc (Ngũ Quỷ)", "Đông (Lục Sát)", "Nam (Họa Hại)"]
    },
    9: {
      name: "Ly",
      hanh: "Hỏa",
      menhQuai: "Đông Tứ Mệnh",
      goodDirs: ["Đông (Sinh Khí)", "Đông Nam (Thiên Y)", "Bắc (Diên Niên)", "Nam (Phục Vị)"],
      badDirs: ["Tây Bắc (Tuyệt Mệnh)", "Tây (Ngũ Quỷ)", "Tây Nam (Lục Sát)", "Đông Bắc (Họa Hại)"]
    }
  };

  const item = CUNG_INFO[cungNum] || CUNG_INFO[3];
  return {
    cungName: item.name,
    cungHanh: item.hanh,
    menhQuai: item.menhQuai,
    goodDirs: item.goodDirs,
    badDirs: item.badDirs
  };
}

/* ══════════════════════════════════════════════════════════════════
 * CHẤM HƯỚNG NHÀ THEO CUNG MỆNH — trả lời thẳng "hướng tôi chọn tốt hay xấu"
 * ══════════════════════════════════════════════════════════════════ */
const STAR_INFO: Record<string, { level: DirectionVerdict['level']; meaning: string }> = {
  'Sinh Khí':   { level: 'rat_tot', meaning: 'tốt nhất — chủ về tài lộc, thăng tiến' },
  'Thiên Y':    { level: 'tot',     meaning: 'tốt — chủ về sức khỏe, quý nhân' },
  'Diên Niên':  { level: 'tot',     meaning: 'tốt — chủ về hòa thuận, gia đạo bền lâu' },
  'Phục Vị':    { level: 'tot',     meaning: 'khá — chủ về ổn định, bình an' },
  'Họa Hại':    { level: 'xau',     meaning: 'xấu nhẹ — dễ thị phi, hao tài' },
  'Lục Sát':    { level: 'xau',     meaning: 'xấu — dễ bất hòa, kiện tụng' },
  'Ngũ Quỷ':    { level: 'rat_xau', meaning: 'rất xấu — dễ tai nạn, mất mát' },
  'Tuyệt Mệnh': { level: 'rat_xau', meaning: 'xấu nhất — kỵ sức khỏe, tài sản' }
};

function splitDir(entry: string): { dir: string; star: string } {
  const m = entry.match(/^(.+?)\s*\((.+)\)\s*$/);
  return m ? { dir: m[1].trim(), star: m[2].trim() } : { dir: entry.trim(), star: '' };
}

export function evaluateDirection(desiredDir: string | undefined, goodDirs: string[], badDirs: string[]): DirectionVerdict {
  const dir = (desiredDir || '').trim();
  if (!dir) {
    const best = splitDir(goodDirs[0] || '');
    return {
      direction: '', star: '', isGood: true, level: 'chua_chon',
      summary: `Gia chủ chưa chọn hướng. Nên ưu tiên hướng ${best.dir} (${best.star}) cho cửa chính/mặt tiền.`,
      remedy: []
    };
  }
  const all = [...goodDirs.map(e => ({ ...splitDir(e), good: true })), ...badDirs.map(e => ({ ...splitDir(e), good: false }))];
  const hit = all.find(x => x.dir.toLowerCase() === dir.toLowerCase());
  if (!hit) {
    return { direction: dir, star: '', isGood: false, level: 'chua_chon', summary: `Không xác định được hướng "${dir}".`, remedy: [] };
  }
  const info = STAR_INFO[hit.star] || { level: hit.good ? 'tot' : 'xau', meaning: '' };
  const goodList = goodDirs.map(e => splitDir(e)).map(x => `${x.dir} (${x.star})`).join(', ');
  if (hit.good) {
    return {
      direction: dir, star: hit.star, isGood: true, level: info.level,
      summary: `Hướng ${dir} là cung ${hit.star} — ${info.meaning}. HỢP với gia chủ, giữ nguyên hướng cửa chính.`,
      remedy: [
        'Đặt cửa chính đúng trục hướng này; tránh lệch sang cung xấu kế bên (sai số la bàn ±7,5°).',
        'Bếp: đặt ở góc xấu của nhà, miệng bếp/núm vặn quay về một trong các hướng tốt (tọa hung hướng cát).'
      ]
    };
  }
  return {
    direction: dir, star: hit.star, isGood: false, level: info.level,
    summary: `Hướng ${dir} rơi vào cung ${hit.star} — ${info.meaning}. KHÔNG HỢP với gia chủ.`,
    remedy: [
      `Nếu lô đất bắt buộc mặt tiền hướng ${dir}: xoay/dịch cửa chính sang hướng tốt (${goodList}) bằng sảnh lệch, cửa góc hoặc bậc tam cấp chéo.`,
      'Nếu không xoay được cửa: dùng hướng tốt cho các vị trí "ngồi" — bàn thờ, đầu giường, bàn làm việc, miệng bếp.',
      'Đặt WC, kho, cầu thang vào cung xấu để "trấn" hung khí; tránh đặt phòng ngủ chính ở cung này.',
      'Nếu vợ/chồng hợp hướng này hơn: có thể chọn người đứng tên theo cung mệnh người đó.'
    ]
  };
}

/* Tam Tai: nhóm tuổi (chi % 4) → 3 năm hạn (chỉ số Chi) */
const TAM_TAI: Record<number, number[]> = {
  0: [2, 3, 4],    // Thân - Tý - Thìn → Dần, Mão, Thìn
  2: [8, 9, 10],   // Dần - Ngọ - Tuất → Thân, Dậu, Tuất
  1: [11, 0, 1],   // Tỵ - Dậu - Sửu  → Hợi, Tý, Sửu
  3: [5, 6, 7]     // Hợi - Mão - Mùi → Tỵ, Ngọ, Mùi
};

const HOANG_OC = [
  { name: "Nhất Cát (Tốt)", good: true, desc: "Làm nhà tuổi này được an cư, mọi việc hanh thông." },
  { name: "Nhị Nghi (Tốt)", good: true, desc: "Làm nhà tuổi này có lợi, gia đạo hưng vượng." },
  { name: "Tam Địa Sát (Xấu)", good: false, desc: "Tuổi này làm nhà phạm Địa Sát, dân gian kiêng vì lo ngại sức khỏe gia chủ." },
  { name: "Tứ Tấn Tài (Tốt)", good: true, desc: "Làm nhà tuổi này phúc lộc tới, tài lộc tăng." },
  { name: "Ngũ Thọ Tử (Xấu)", good: false, desc: "Tuổi này làm nhà phạm Thọ Tử, dân gian kiêng vì lo ngại chia ly." },
  { name: "Lục Hoang Ốc (Xấu)", good: false, desc: "Tuổi này làm nhà phạm Hoang Ốc, dân gian kiêng vì lo ngại khó thành đạt." }
];

/** Xét hạn làm nhà cho 1 năm sinh tại 1 năm khởi công */
export function checkBuildYear(birthYear: number, targetYear: number) {
  const birthChi = ((birthYear - 4) % 12 + 12) % 12;
  const targetChi = ((targetYear - 4) % 12 + 12) % 12;
  const age = targetYear - birthYear + 1; // tuổi mụ

  const ttYears = TAM_TAI[birthChi % 4];
  const ttPos = ttYears.indexOf(targetChi);
  const isTamTai = ttPos >= 0;

  const klRem = age % 9;
  const KL: Record<number, string> = { 1: 'Kim Lâu Thân (kỵ bản thân gia chủ)', 3: 'Kim Lâu Thê (kỵ vợ/chồng)', 6: 'Kim Lâu Tử (kỵ con cái)', 8: 'Kim Lâu Lục Súc (kỵ kinh tế, vật nuôi)' };
  const isKimLau = KL[klRem] !== undefined;

  const tens = Math.floor(age / 10);
  const units = age % 10;
  const startIdx = ((tens - 1) % 6 + 6) % 6;
  const ho = HOANG_OC[(startIdx + units) % 6];

  const isXung = (birthChi + 6) % 12 === targetChi;
  const isTruc = birthChi === targetChi;

  return {
    age, isTamTai, ttPos, isKimLau, klText: KL[klRem] || '', hoangOc: ho, isHoangOc: !ho.good, isXung, isTruc,
    clean: !isTamTai && !isKimLau && ho.good && !isXung
  };
}

/** Gợi ý năm sinh nam giới (tuổi mụ 30–70) không phạm hạn nào trong năm khởi công */
export function findBorrowAgeCandidates(targetYear: number, limit = 8): number[] {
  const out: number[] = [];
  for (let age = 40; out.length < limit && age <= 70; age++) {
    const y = targetYear - age + 1;
    const c = checkBuildYear(y, targetYear);
    if (c.clean && !c.isTruc) out.push(y);
  }
  for (let age = 39; out.length < limit && age >= 30; age--) {
    const y = targetYear - age + 1;
    const c = checkBuildYear(y, targetYear);
    if (c.clean && !c.isTruc) out.push(y);
  }
  return out.sort((a, b) => a - b);
}

/**
 * Tính toán đầy đủ ngũ hành, bát trạch, xem tuổi năm khởi công
 * @param year        Năm sinh ÂM LỊCH (dùng getLunarBirthYear(birthDate) để quy đổi)
 * @param targetYear  Năm âm lịch dự kiến khởi công (mặc định: getDefaultConstructionYear())
 */
export function calculateFengShui(
  year: number,
  gender: 'nam' | 'nu' = 'nam',
  desiredDir?: string,
  spouseBirthYear?: number,
  spouseGender?: 'nam' | 'nu',
  birthHour?: string,
  targetYear?: number
): FengShuiCalculationResult {
  const tYear = targetYear && targetYear > 1900 ? targetYear : getDefaultConstructionYear();
  const tCanChi = getCanChi(tYear);

  // 1. Can Chi
  const chiIndex = ((year - 4) % 12 + 12) % 12;
  const canChi = getCanChi(year);

  // 2. Nạp Âm Lục Thập Hoa Giáp
  const cycleIndex = ((year - 1924) % 60 + 60) % 60;
  const napAm = NAP_AM_PAIRS[Math.floor(cycleIndex / 2)] || NAP_AM_PAIRS[0];

  // 3. Cung Phi Bát Trạch
  const cp = calculateCungPhi(year, gender);
  const cungPhiStr = `${cp.cungName} ${cp.cungHanh} (${cp.menhQuai})`;

  // 3b. Chấm hướng nhà khách chọn
  const directionVerdict = evaluateDirection(desiredDir, cp.goodDirs, cp.badDirs);

  // Phối ngẫu
  let spouseAnalysisStr = "";
  if (spouseBirthYear) {
    const sGender = spouseGender || (gender === 'nam' ? 'nu' : 'nam');
    const sCp = calculateCungPhi(spouseBirthYear, sGender);
    const sCanChi = getCanChi(spouseBirthYear);
    const sameGroup = cp.menhQuai === sCp.menhQuai;
    const sVerdict = evaluateDirection(desiredDir, sCp.goodDirs, sCp.badDirs);
    spouseAnalysisStr = `\n\n✦ Phối ngẫu (sinh năm ${sCanChi} - ${spouseBirthYear}, cung ${sCp.cungName} - ${sCp.menhQuai}): ` +
      (sameGroup
        ? `Hai vợ chồng cùng ${cp.menhQuai} — chọn được hướng chung hợp cả hai.`
        : `Hai vợ chồng khác nhóm (${cp.menhQuai} / ${sCp.menhQuai}). Thường chọn hướng nhà theo người trụ cột kinh tế; hướng bếp, giường theo người còn lại.`) +
      (desiredDir ? ` Với hướng ${desiredDir}: ${sVerdict.isGood ? 'hợp' : 'không hợp'} với vợ/chồng (${sVerdict.star}).` : '');
  }

  const hourStr = birthHour ? `\n\n✦ Giờ sinh (${birthHour}): dùng để chọn giờ hoàng đạo làm lễ khởi công.` : "";

  // 4. Màu sắc theo Nạp Âm
  let favorableColors: string[] = [];
  let unfavorableColors: string[] = [];
  let luckyNumbers: number[] = [1, 6];
  switch (napAm.hanh) {
    case 'Hỏa':
      favorableColors = ["Đỏ, Hồng, Tím, Cam (Màu bản mệnh Hỏa)", "Xanh lá cây, Xanh lục (Mộc sinh Hỏa)"];
      unfavorableColors = ["Đen, Xanh nước biển (Thủy khắc Hỏa)"];
      luckyNumbers = [9, 3, 4];
      break;
    case 'Mộc':
      favorableColors = ["Xanh lá cây, Xanh ngọc (Bản mệnh Mộc)", "Đen, Xanh nước biển (Thủy sinh Mộc)"];
      unfavorableColors = ["Trắng, Xám ghi, Vàng ánh kim (Kim khắc Mộc)"];
      luckyNumbers = [3, 4, 1];
      break;
    case 'Kim':
      favorableColors = ["Trắng, Xám ghi, Bạc ánh kim (Bản mệnh Kim)", "Vàng đậm, Nâu đất (Thổ sinh Kim)"];
      unfavorableColors = ["Đỏ, Hồng, Tím, Cam (Hỏa khắc Kim)"];
      luckyNumbers = [6, 7, 2, 8];
      break;
    case 'Thủy':
      favorableColors = ["Đen, Xanh nước biển (Bản mệnh Thủy)", "Trắng, Xám, Ghi, Ánh kim (Kim sinh Thủy)"];
      unfavorableColors = ["Vàng, Nâu đất (Thổ khắc Thủy)"];
      luckyNumbers = [1, 6, 7];
      break;
    case 'Thổ':
      favorableColors = ["Vàng, Nâu đất (Bản mệnh Thổ)", "Đỏ, Hồng, Tím, Cam (Hỏa sinh Thổ)"];
      unfavorableColors = ["Xanh lá cây, Xanh ngọc (Mộc khắc Thổ)"];
      luckyNumbers = [2, 5, 8, 9];
      break;
  }

  // 5. Xét hạn năm khởi công
  const c = checkBuildYear(year, tYear);
  const tamTaiDetail = c.isTamTai
    ? `Tuổi ${canChi} phạm Tam Tai năm thứ ${c.ttPos + 1} vào năm ${tCanChi} ${tYear}.`
    : `Năm ${tCanChi} ${tYear}, tuổi ${canChi} không phạm Tam Tai.`;
  const kimLauDetail = c.isKimLau
    ? `Tuổi mụ ${c.age} phạm ${c.klText}.`
    : `Tuổi mụ ${c.age} không phạm Kim Lâu.`;
  const hoangOcDetail = `Tuổi mụ ${c.age} rơi vào cung ${c.hoangOc.name}. ${c.hoangOc.desc}`;
  const thaiTueDetail = c.isXung
    ? `Tuổi ${canChi} xung Thái Tuế năm ${tCanChi} (lục xung) — dân gian kiêng đứng tên động thổ.`
    : c.isTruc
      ? `Năm ${tYear} là năm tuổi (trực Thái Tuế) của gia chủ — nhiều nơi kiêng, nên cân nhắc mượn tuổi.`
      : `Tuổi ${canChi} không xung Thái Tuế năm ${tCanChi}.`;

  const borrowAgeCandidates = findBorrowAgeCandidates(tYear);
  const borrowStr = borrowAgeCandidates.map(y => `${y} ${getCanChi(y)}`).join(', ');
  const femaleNote = gender === 'nu'
    ? ' Lưu ý: theo tục lệ, Kim Lâu/Hoang Ốc thường xét theo tuổi người nam đứng tên; gia chủ nữ có thể mượn tuổi chồng/người thân nam.'
    : '';

  // 6. Lời khuyên động thổ
  let advice: string;
  const listPham: string[] = [];
  if (c.isTamTai) listPham.push("Tam Tai");
  if (c.isKimLau) listPham.push("Kim Lâu");
  if (c.isHoangOc) listPham.push("Hoang Ốc");
  if (c.isXung) listPham.push("Xung Thái Tuế");
  if (listPham.length === 0) {
    advice = `Năm ${tCanChi} (${tYear}), gia chủ tuổi ${canChi} (${year}, tuổi mụ ${c.age}) không phạm Tam Tai, Kim Lâu, Hoang Ốc${c.isTruc ? '' : ', không xung Thái Tuế'}. Gia chủ có thể tự đứng tên khởi công; cần chọn ngày, giờ hoàng đạo cụ thể hợp tuổi.${c.isTruc ? ' ' + thaiTueDetail : ''}${femaleNote}`;
  } else {
    advice = `Năm ${tCanChi} (${tYear}), gia chủ tuổi ${canChi} (${year}, tuổi mụ ${c.age}) phạm ${listPham.join(", ")}. Phương án thường dùng: (1) lùi năm khởi công, hoặc (2) mượn tuổi người nam không phạm hạn năm ${tYear} đứng tên động thổ, đổ mái. Gợi ý năm sinh có thể mượn: ${borrowStr}. Nên ưu tiên người thân trong gia đình và cùng nhóm ${cp.menhQuai}.${femaleNote}`;
  }

  // 7. Tháng cát lành (tham khảo — tiết khí đầu tháng âm lịch)
  const elementMonths: Record<string, string[]> = {
    Kim:  ["Tháng 2 âm lịch (Tiết Kinh Trập)", "Tháng 4 âm lịch (Tiết Lập Hạ)", "Tháng 8 âm lịch (Tiết Bạch Lộ - Kim vượng)", "Tháng 11 âm lịch (Tiết Đại Tuyết/Đông Chí)"],
    Mộc:  ["Tháng 1 âm lịch (Tiết Lập Xuân - Mộc vượng)", "Tháng 2 âm lịch (Tiết Kinh Trập)", "Tháng 10 âm lịch (Tiết Lập Đông - Thủy sinh Mộc)", "Tháng 11 âm lịch (Tiết Đại Tuyết)"],
    Thủy: ["Tháng 7 âm lịch (Tiết Lập Thu - Kim sinh Thủy)", "Tháng 10 âm lịch (Tiết Lập Đông - Thủy vượng)", "Tháng 11 âm lịch (Tiết Đại Tuyết)", "Tháng 12 âm lịch (Tiết Tiểu Hàn)"],
    Hỏa:  ["Tháng 3 âm lịch (Tiết Thanh Minh - Mộc sinh Hỏa)", "Tháng 4 âm lịch (Tiết Lập Hạ - Hỏa vượng)", "Tháng 5 âm lịch (Tiết Mang Chủng)", "Tháng 6 âm lịch (Tiết Tiểu Thử)"],
    Thổ:  ["Tháng 3 âm lịch (Tiết Thanh Minh)", "Tháng 6 âm lịch (Tiết Tiểu Thử - Hỏa sinh Thổ)", "Tháng 9 âm lịch (Tiết Hàn Lộ)", "Tháng 12 âm lịch (Tiết Tiểu Hàn)"]
  };
  let favorableDates = [...(elementMonths[napAm.hanh] || elementMonths.Kim)];
  if (chiIndex % 3 === 1) favorableDates[1] = "Tháng 3 âm lịch (Tiết Thanh Minh)";
  else if (chiIndex % 3 === 2) favorableDates[2] = "Tháng 9 âm lịch (Tiết Hàn Lộ)";
  favorableDates = Array.from(new Set(favorableDates)).map(m => `${m} năm ${tCanChi} ${tYear}`);
  favorableDates.push("→ Ngày giờ cụ thể: chọn ngày Hoàng đạo hợp tuổi trong các tháng trên, tránh ngày Tam Nương, Nguyệt Kỵ, Sát Chủ.");
  // Tháng mưa bão: lưu ý thi công móng
  const rainNote = `Lưu ý thi công: tránh đào móng, đổ bê tông trong cao điểm mưa bão của địa phương (miền Bắc: tháng 7–9 dương; miền Trung: tháng 9–11 dương; miền Nam: tháng 6–10 dương).`;

  // 8. Luận giải chuyên sâu
  const deepAnalysis = `Gia chủ sinh năm âm lịch ${canChi} (${year}).
Bản mệnh ngũ hành: ${napAm.detail} (Hành ${napAm.hanh}). Cung Phi Bát Trạch: ${cungPhiStr}.
Theo Bát Trạch, gia chủ thuộc ${cp.menhQuai}. Hướng tốt: ${cp.goodDirs.join(', ')}. Hướng xấu: ${cp.badDirs.join(', ')}.
✦ KẾT LUẬN HƯỚNG NHÀ: ${directionVerdict.summary}${directionVerdict.remedy.length ? '\n' + directionVerdict.remedy.map(r => '  • ' + r).join('\n') : ''}
Màu sắc công trình nên ưu tiên ${favorableColors[1]} và ${favorableColors[0]}; hạn chế ${unfavorableColors[0]} ở mảng lớn (mặt tiền, mái).
✦ XEM TUỔI NĂM KHỞI CÔNG ${tYear} (${tCanChi}): ${tamTaiDetail} ${kimLauDetail} ${hoangOcDetail} ${thaiTueDetail}
${advice}
${rainNote}${spouseAnalysisStr}${hourStr}
(Kết quả theo Bát Trạch & tục xem tuổi phổ biến tại Việt Nam, mang tính tham khảo.)`;

  return {
    birthYear: year,
    canChi,
    hanh: napAm.hanh,
    elementDetail: napAm.detail,
    cungPhi: cungPhiStr,
    cungName: cp.cungName,
    menhQuai: cp.menhQuai,
    favorableDirections: cp.goodDirs,
    unfavorableDirections: cp.badDirs,
    favorableColors,
    unfavorableColors,
    luckyNumbers,
    targetYear: tYear,
    targetCanChi: tCanChi,
    ageAtTarget: c.age,
    tamTai2026: { isPham: c.isTamTai, detail: tamTaiDetail },
    kimLau2026: { isPham: c.isKimLau, detail: kimLauDetail },
    hoangOc2026: { isPham: c.isHoangOc, detail: hoangOcDetail },
    thaiTue: { isPham: c.isXung || c.isTruc, detail: thaiTueDetail },
    advice2026: advice,
    favorableDates2026: favorableDates,
    borrowAgeCandidates,
    directionVerdict,
    deepAnalysis
  };
}

export function translateFengShuiAnalysis(analysis: any, lang: string): any {
  if (!analysis || lang === 'vi') return analysis;
  const clone = { ...analysis };
  
  const elMap: Record<string, Record<string, string>> = {
    en: {
      "Kim": "Metal", "Mộc": "Wood", "Thủy": "Water", "Hỏa": "Fire", "Thổ": "Earth",
      "Hải Trung Kim": "Ocean Gold", "Đại Lâm Mộc": "Forest Wood", "Thiên Hà Thủy": "Celestial Water",
      "Thiên Thượng Hỏa": "Celestial Fire", "Lộ Bàng Thổ": "Roadside Earth",
      "Kiếm Phong Kim": "Sword Tip Metal", "Sơn Đầu Hỏa": "Mountain Fire", "Giản Hạ Thủy": "Understream Water",
      "Thành Đầu Thổ": "City Wall Earth", "Bạch Lạp Kim": "Wax Metal", "Dương Liễu Mộc": "Willow Wood",
      "Tuyền Trung Thủy": "Spring Water", "Ốc Thượng Thổ": "Rooftop Earth", "Tích Lịch Hỏa": "Lightning Fire",
      "Tùng Bách Mộc": "Pine Wood", "Trường Lưu Thủy": "Long Flowing Water", "Sa Trung Kim": "Sand Gold",
      "Sơn Hạ Hỏa": "Foot-Mountain Fire", "Bình Địa Mộc": "Plain Wood", "Bích Thượng Thổ": "Wall Earth",
      "Kim Bạch Kim": "White Gold", "Phúc Đăng Hỏa": "Lamp Fire", "Đại Trạch Thổ": "Great Marsh Earth",
      "Thoa Xuyến Kim": "Jewelry Gold", "Tang Đố Mộc": "Mulberry Wood", "Đại Khê Thủy": "Great Stream Water",
      "Sa Trung Thổ": "Sand Earth", "Thạch Lựu Mộc": "Pomegranate Wood", "Đại Hải Thủy": "Ocean Water"
    },
    lo: {
      "Kim": "ທາດເຫຼັກ", "Mộc": "ທາດໄມ້", "Thủy": "ທາດນ້ຳ", "Hỏa": "ທາດໄຟ", "Thổ": "ທາດດິນ",
      "Hải Trung Kim": "ທອງໃນທະເລ", "Đại Lâm Mộc": "ໄມ້ປ່າໃຫຍ່", "Thiên Hà Thủy": "ນ້ຳເທິງທ້ອງຟ້າ",
      "Thiên Thượng Hỏa": "ໄຟເທິງທ້ອງຟ້າ", "Lộ Bàng Thổ": "ດິນແຄມທາງ"
    },
    zh: {
      "Kim": "金", "Mộc": "木", "Thủy": "水", "Hỏa": "火", "Thổ": "土",
      "Hải Trung Kim": "海中金", "Đại Lâm Mộc": "大林木", "Thiên Hà Thủy": "天河水",
      "Thiên Thượng Hỏa": "天上火", "Lộ Bàng Thổ": "路旁土"
    }
  };

  const dirMap: Record<string, Record<string, string>> = {
    en: {
      "Đông Nam": "Southeast", "Nam": "South", "Bắc": "North", "Đông": "East",
      "Tây": "West", "Tây Bắc": "Northwest", "Đông Bắc": "Northeast", "Tây Nam": "Southwest",
      "Sinh Khí": "Sheng Qi", "Thiên Y": "Tian Yi", "Diên Niên": "Yan Nian", "Phục Vị": "Fu Wei",
      "Tuyệt Mệnh": "Jue Ming", "Ngũ Quỷ": "Wu Gui", "Họa Hại": "Huo Hai", "Lục Sát": "Liu Sha"
    },
    lo: {
      "Đông Nam": "ຕາເວັນອອກສຽງໃຕ້", "Nam": "ໃຕ້", "Bắc": "ເໜືອ", "Đông": "ຕາເວັນອອກ",
      "Tây": "ຕາເວັນຕົກ", "Tây Bắc": "ຕາເວັນຕົກສຽງເໜືອ", "Đông Bắc": "ຕາເວັນອອກສຽງເໜືອ", "Tây Nam": "ຕາເວັນຕົກສຽງໃຕ້",
      "Sinh Khí": "ເຊັງຄີ", "Thiên Y": "ທຽນອີ", "Diên Niên": "ຢຽນນຽນ", "Phục Vị": "ຟຸກວີ"
    },
    zh: {
      "Đông Nam": "东南", "Nam": "南", "Bắc": "北", "Đông": "东",
      "Tây": "西", "Tây Bắc": "西北", "Đông Bắc": "东北", "Tây Nam": "西南",
      "Sinh Khí": "生气", "Thiên Y": "天医", "Diên Niên": "延年", "Phục Vị": "伏位"
    }
  };

  const mapLang = elMap[lang] || {};
  const dMap = dirMap[lang] || {};

  if (clone.element) {
    let translated = clone.element;
    for (const [viKey, transVal] of Object.entries(mapLang)) {
      if (translated.includes(viKey)) {
        translated = translated.replace(viKey, transVal);
      }
    }
    clone.element = translated;
  }

  if (Array.isArray(clone.favorableDirections)) {
    clone.favorableDirections = clone.favorableDirections.map((dir: string) => {
      let res = dir;
      for (const [viKey, transVal] of Object.entries(dMap)) {
        res = res.replace(new RegExp(viKey, 'g'), transVal);
      }
      return res;
    });
  }

  if (Array.isArray(clone.unfavorableDirections)) {
    clone.unfavorableDirections = clone.unfavorableDirections.map((dir: string) => {
      let res = dir;
      for (const [viKey, transVal] of Object.entries(dMap)) {
        res = res.replace(new RegExp(viKey, 'g'), transVal);
      }
      return res;
    });
  }

  return clone;
}

