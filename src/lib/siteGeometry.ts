/**
 * Hình học khu đất — DÙNG CHUNG cho bản vẽ, dự toán, PDF:
 * kích thước đất → khoảng lùi trước/sau → diện tích xây dựng (phần nhà chiếm đất) → mật độ.
 */
import { hasFreeSketch, planFreeLayout } from './sketchFreePlanner.js';
import { specsToSketch } from './roomSpecs.js';

/** Khoảng lùi mặc định (m) khi khách không nhập — giống bộ vẽ mặt bằng */
export function defaultSetbacks(lengthM: number): { front: number; back: number } {
  return lengthM >= 12 ? { front: 2.0, back: 1.0 } : { front: 1.0, back: 0.5 };
}

/** Mật độ xây dựng tối đa nhà ở riêng lẻ (QCVN 01:2021/BXD, nội suy — tham khảo) */
export function maxDensityPct(lotArea: number): number {
  const t: [number, number][] = [[90, 100], [100, 90], [200, 70], [300, 60], [500, 50], [1000, 40]];
  if (lotArea <= t[0][0]) return 100;
  for (let i = 1; i < t.length; i++) {
    if (lotArea <= t[i][0]) {
      const [a0, p0] = t[i - 1], [a1, p1] = t[i];
      return Math.round(p0 + (p1 - p0) * (lotArea - a0) / (a1 - a0));
    }
  }
  return 40;
}

export interface SiteGeometry {
  hasDims: boolean;          // khách nhập dạng "rộng x dài"
  lotWidthM: number;
  lotLengthM: number;
  lotArea: number;
  frontSetbackM: number;
  backSetbackM: number;
  houseLengthM: number;
  footprint: number;         // diện tích xây dựng (m²)
  densityPct: number;
  maxDensityPct: number;
  densityOk: boolean;
  /** false = chưa biết diện tích đất thật (gia chủ nhập kích thước NHÀ, chưa nhập diện tích đất) → không tính mật độ, không cảnh báo */
  densityKnown?: boolean;
  landAreaM2?: number;
  note: string;
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const num = (v: any) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? undefined : n; };

/**
 * @param dimensions  "5x20" (kích thước ĐẤT) hoặc "100m2" (coi là diện tích xây dựng)
 * @param frontSetback / backSetback  khoảng lùi khách nhập (m) — để trống = mặc định
 */
export function computeSite(dimensions?: string, frontSetback?: any, backSetback?: any, leftSetback?: any, rightSetback?: any): SiteGeometry {
  const raw = String(dimensions || '').toLowerCase().replace(/m2|m²|mét vuông/g, '').replace(/,/g, '.').trim();
  const m = raw.match(/(\d+(?:\.\d+)?)\s*(?:m)?\s*[x×*]\s*(\d+(?:\.\d+)?)/);
  if (m && parseFloat(m[1]) > 0 && parseFloat(m[2]) > 0) {
    const W = parseFloat(m[1]), L = parseFloat(m[2]);
    const def = defaultSetbacks(L);
    let fs = num(frontSetback), bs = num(backSetback);
    fs = fs === undefined ? def.front : Math.max(0, fs);
    bs = bs === undefined ? def.back : Math.max(0, bs);
    if (fs + bs > L - 4) { fs = Math.max(0, Math.min(fs, (L - 4) / 2)); bs = Math.max(0, Math.min(bs, L - 4 - fs)); }
    const H = r1(Math.max(4, L - fs - bs));
    const ls = Math.max(0, num(leftSetback) || 0), rs = Math.max(0, num(rightSetback) || 0);
    const Wh = r1(Math.max(2.5, W - ls - rs));          // bề ngang nhà sau khi lùi 2 bên
    const lotArea = r1(W * L);
    const footprint = r1(Wh * H);
    const pct = Math.round(footprint / lotArea * 100);
    const maxPct = maxDensityPct(lotArea);
    return {
      hasDims: true, lotWidthM: W, lotLengthM: L, lotArea, frontSetbackM: r1(fs), backSetbackM: r1(bs),
      houseLengthM: H, footprint, densityPct: pct, maxDensityPct: maxPct, densityOk: pct <= maxPct,
      note: `Đất ${W}×${L}m = ${lotArea}m²; lùi trước ${r1(fs)}m, lùi sau ${r1(bs)}m${ls || rs ? `, lùi trái ${r1(ls)}m, lùi phải ${r1(rs)}m` : ''} → nhà xây ${Wh}×${H}m = ${footprint}m² (mật độ ${pct}%, tối đa ~${maxPct}%).`
    };
  }
  const n = raw.match(/(\d+(?:\.\d+)?)/);
  const area = n && parseFloat(n[1]) > 10 ? parseFloat(n[1]) : 100;
  const w = r1(Math.sqrt(area / 2.5)) || 5;
  return {
    hasDims: false, lotWidthM: w, lotLengthM: r1(area / w), lotArea: area, frontSetbackM: 0, backSetbackM: 0,
    houseLengthM: r1(area / w), footprint: r1(area), densityPct: 100, maxDensityPct: maxDensityPct(area), densityOk: true,
    note: `Khách nhập diện tích ${area}m² (không có kích thước rộng × dài) — tạm coi là diện tích xây dựng. Nên nhập dạng "5x20" để tính khoảng lùi & mật độ chính xác.`
  };
}

/**
 * Hình học khu đất theo TOÀN BỘ thông tin công trình.
 * Khi khách xác nhận "vẽ theo phác thảo tự do" (nhà vườn / nhà rộng), diện tích xây dựng
 * lấy đúng diện tích nhà trên bản vẽ phác thảo → bản vẽ và dự toán luôn cùng một con số.
 */
/** Khách nhập số đo là gì: 'nha' = kích thước NHÀ XÂY (mặc định), 'dat' = kích thước THỬA ĐẤT (sổ đỏ, trừ khoảng lùi) */
export function dimsKindOf(ct: any): 'nha' | 'dat' { return ct?.dimensionsKind === 'dat' ? 'dat' : 'nha'; }
/** Khoảng lùi dùng cho tính toán: nhập kích thước nhà → 0 (nhà = đúng số đo khách nhập) */
export function setbacksFor(ct: any): { front: any; back: any; left: any; right: any } {
  return dimsKindOf(ct) === 'dat'
    ? { front: ct?.frontSetbackM, back: ct?.backSetbackM, left: ct?.leftSetbackM ?? 0, right: ct?.rightSetbackM ?? 0 }
    : { front: 0, back: 0, left: 0, right: 0 };
}
/** rooms gửi bộ vẽ kèm loại số đo (bộ vẽ phác thảo tự do ưu tiên số đo trong mô tả hơn số trên bản vẽ tay) */
export function roomsFor(ct: any): any {
  const r = { ...(ct?.rooms || {}), dimsKind: dimsKindOf(ct), landAreaM2: landAreaOf(ct) };
  // ô "Gara ô tô" trên giao diện là nguồn đúng (trước đây bộ vẽ đọc parkingType mặc định = gara)
  // Chỉ có gara khi gia chủ TÍCH ô "Gara ô tô" — không tích thì không vẽ, kể cả khi ảnh / phác thảo tay có gara
  if (r.garage === true) r.parkingType = 'garage';
  else if (r.parkingType === 'garage') r.parkingType = 'yard';
  // Ô nhập từng phòng của gia chủ ưu tiên hơn ảnh / bản vẽ tay
  const sk = specsToSketch(ct, houseWidthOf(ct));
  if (sk) r.sketchLayout = sk;
  if (r.garage !== true && r.sketchLayout && Array.isArray(r.sketchLayout.tang)) {
    r.sketchLayout = { ...r.sketchLayout, tang: r.sketchLayout.tang.map((t: any) => ({ ...t, phong: (t.phong || []).filter((p: any) => String(p.loai) !== 'gara') })) };
  }
  return r;
}
/** chiều ngang NHÀ (m) theo ô nhập: thửa đất thì trừ lùi 2 bên */
export function houseWidthOf(ct: any): number {
  const m = String(ct?.dimensions || '').toLowerCase().replace(/,/g, '.').match(/(\d+(?:\.\d+)?)\s*(?:m)?\s*[x×*]\s*(\d+(?:\.\d+)?)/);
  if (!m) return 0;
  const W = parseFloat(m[1]);
  const sb = setbacksFor(ct);
  return Math.max(2.5, W - (Number(sb.left) || 0) - (Number(sb.right) || 0));
}
/** chuỗi kích thước đưa cho bộ vẽ: thửa đất có lùi 2 bên → bề ngang đã trừ 2 bên */
export function planDimsFor(ct: any): string {
  const m = String(ct?.dimensions || '').toLowerCase().replace(/,/g, '.').match(/(\d+(?:\.\d+)?)\s*(?:m)?\s*[x×*]\s*(\d+(?:\.\d+)?)/);
  if (!m) return ct?.dimensions || '';
  const sb = setbacksFor(ct);
  const side = (Number(sb.left) || 0) + (Number(sb.right) || 0);
  return side > 0 ? `${Math.round((parseFloat(m[1]) - side) * 10) / 10}x${m[2]}` : ct.dimensions;
}

/** Diện tích đất thật gia chủ nhập (m²) — chỉ dùng khi số đo là kích thước NHÀ */
export function landAreaOf(ct: any): number | undefined {
  if (dimsKindOf(ct) !== 'nha') return undefined;      // ô chỉ hiện khi số đo là kích thước nhà — ẩn thì không dùng
  const v = num(ct?.landAreaM2);
  return v && v > 0 ? r1(v) : undefined;
}
/** Mật độ khi số đo là kích thước NHÀ: chỉ tính khi có diện tích đất thật */
function houseDensity(footprint: number, land?: number) {
  if (!land) return { densityKnown: false, densityPct: 0, maxDensityPct: 0, densityOk: true, landAreaM2: undefined, text: 'Mật độ xây dựng chỉ tính khi nhập diện tích đất thật (ô "Diện tích đất thực tế" ở Điều kiện khu đất).' };
  const pct = Math.round(footprint / land * 100), mx = maxDensityPct(land);
  return { densityKnown: true, densityPct: pct, maxDensityPct: mx, densityOk: pct <= mx, landAreaM2: land, text: `Đất ${land}m² (gia chủ nhập) → mật độ ${pct}%, tối đa ~${mx}%.` };
}

export function computeSiteFor(ct: any): SiteGeometry {
  const sb = setbacksFor(ct);
  const base0 = computeSite(ct?.dimensions, sb.front, sb.back, sb.left, sb.right);
  const isHouse = dimsKindOf(ct) === 'nha';
  const land = isHouse ? landAreaOf(ct) : undefined;
  let base: SiteGeometry = base0;
  if (isHouse && base0.hasDims) {
    const d = houseDensity(base0.footprint, land);
    base = { ...base0, densityKnown: d.densityKnown, densityPct: d.densityPct, maxDensityPct: d.maxDensityPct, densityOk: d.densityOk, landAreaM2: d.landAreaM2,
      note: `Nhà xây ${base0.lotWidthM}×${base0.houseLengthM}m = ${base0.footprint}m² (đúng số đo gia chủ nhập). ${d.text} Nếu số đo là của thửa đất, chọn "Kích thước thửa đất" để tool trừ khoảng lùi.` };
  } else if (!isHouse) base = { ...base0, densityKnown: base0.hasDims };
  try {
    const floors = Math.max(1, Math.round(Number(ct?.floors) || 1));
    if (!hasFreeSketch(roomsFor(ct), 1, floors)) return base;
    const pd = planDimsFor(ct).toLowerCase().match(/(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)/);
    const p = planFreeLayout({ widthM: pd ? parseFloat(pd[1]) : base.lotWidthM, lengthM: pd ? parseFloat(pd[2]) : base.lotLengthM, floor: 1, totalFloors: floors, rooms: roomsFor(ct), desiredDirection: ct?.desiredDirection, frontSetbackM: sb.front, backSetbackM: sb.back });
    // bộ vẽ đã nới ranh đất theo kích thước khách nhập → dùng đúng ranh trên bản vẽ
    const lotW = p.lot ? p.lot.w : base.lotWidthM;
    const lotL = p.lot ? p.lot.h : base.lotLengthM;
    const lotArea = r1(lotW * lotL);
    const footprint = p.density.footprint;
    if (isHouse) {
      // khung quanh nhà trên bản vẽ chỉ là khu vực minh họa (hiên, lối đi, bếp phụ…), KHÔNG phải ranh đất → không tính mật độ theo khung này
      const d = houseDensity(footprint, land);
      return {
        hasDims: true, lotWidthM: r1(lotW), lotLengthM: r1(lotL), lotArea: land || lotArea,
        frontSetbackM: p.frontSetbackM, backSetbackM: p.backSetbackM,
        houseLengthM: p.houseLengthM, footprint, densityPct: d.densityPct, maxDensityPct: d.maxDensityPct, densityOk: d.densityOk, densityKnown: d.densityKnown, landAreaM2: d.landAreaM2,
        note: `Vẽ theo phác thảo: nhà ${p.widthM}×${p.houseLengthM}m, diện tích xây dựng ${footprint}m² (không tính hiên) — đúng số đo gia chủ nhập. Phần quanh nhà trên bản vẽ chỉ là khu vực ngoài nhà minh họa (hiên, lối đi, hạng mục gia chủ yêu cầu), không phải ranh đất. ${d.text}`
      };
    }
    const pct = Math.round(footprint / lotArea * 100);
    const maxPct = maxDensityPct(lotArea);
    return {
      hasDims: true, lotWidthM: r1(lotW), lotLengthM: r1(lotL), lotArea,
      frontSetbackM: p.frontSetbackM, backSetbackM: p.backSetbackM,
      houseLengthM: p.houseLengthM, footprint, densityPct: pct, maxDensityPct: maxPct, densityOk: pct <= maxPct,
      note: `Vẽ theo phác thảo: nhà ${p.widthM}×${p.houseLengthM}m, diện tích xây dựng ${footprint}m² (không tính hiên); đất ~${lotArea}m², phần còn lại làm sân vườn (mật độ ${pct}%, tối đa ~${maxPct}%).`
    };
  } catch {
    return base;
  }
}
