/**
 * Hình học khu đất — DÙNG CHUNG cho bản vẽ, dự toán, PDF:
 * kích thước đất → khoảng lùi trước/sau → diện tích xây dựng (phần nhà chiếm đất) → mật độ.
 */
import { hasFreeSketch, planFreeLayout } from './sketchFreePlanner.js';

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
  note: string;
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const num = (v: any) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? undefined : n; };

/**
 * @param dimensions  "5x20" (kích thước ĐẤT) hoặc "100m2" (coi là diện tích xây dựng)
 * @param frontSetback / backSetback  khoảng lùi khách nhập (m) — để trống = mặc định
 */
export function computeSite(dimensions?: string, frontSetback?: any, backSetback?: any): SiteGeometry {
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
    const lotArea = r1(W * L);
    const footprint = r1(W * H);
    const pct = Math.round(footprint / lotArea * 100);
    const maxPct = maxDensityPct(lotArea);
    return {
      hasDims: true, lotWidthM: W, lotLengthM: L, lotArea, frontSetbackM: r1(fs), backSetbackM: r1(bs),
      houseLengthM: H, footprint, densityPct: pct, maxDensityPct: maxPct, densityOk: pct <= maxPct,
      note: `Đất ${W}×${L}m = ${lotArea}m²; lùi trước ${r1(fs)}m, lùi sau ${r1(bs)}m → nhà xây ${W}×${H}m = ${footprint}m² (mật độ ${pct}%, tối đa ~${maxPct}%).`
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
export function computeSiteFor(ct: any): SiteGeometry {
  const base = computeSite(ct?.dimensions, ct?.frontSetbackM, ct?.backSetbackM);
  try {
    const floors = Math.max(1, Math.round(Number(ct?.floors) || 1));
    if (!hasFreeSketch(ct?.rooms, 1, floors)) return base;
    const p = planFreeLayout({ widthM: base.lotWidthM, lengthM: base.lotLengthM, floor: 1, totalFloors: floors, rooms: ct.rooms, desiredDirection: ct?.desiredDirection });
    // bộ vẽ đã nới ranh đất theo kích thước khách nhập → dùng đúng ranh trên bản vẽ
    const lotW = p.lot ? p.lot.w : base.lotWidthM;
    const lotL = p.lot ? p.lot.h : base.lotLengthM;
    const lotArea = r1(lotW * lotL);
    const footprint = p.density.footprint;
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
