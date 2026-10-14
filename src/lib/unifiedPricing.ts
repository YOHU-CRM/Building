/**
 * YOHU CONSTECH — MỘT NGUỒN GIÁ DUY NHẤT
 *
 * Mọi nơi hiển thị tiền (màn hình kết quả, PDF 3 trang, hồ sơ kỹ thuật 10 phần, CRM, máy chủ)
 * PHẢI lấy số từ file này. AI (Gemini) không được tự đặt giá — chỉ viết thuyết minh.
 *
 * Cùng đầu vào (kích thước, số tầng, kết cấu, gói hoàn thiện, địa chỉ, phòng) → cùng một con số.
 */
import {
  calculateMasterProjectEstimate,
  FullProjectEstimateResult,
  StructuralOptionKey,
  FinishingPackageKey
} from './boqEngine.js';

export const PRICING_VERSION = '2026.10';

export interface PricingInput {
  constructionInfo?: any;
  userInfo?: any;
  optionKey?: StructuralOptionKey;      // ép phương án (VD: hồ sơ kỹ thuật đang xem PA2)
  packageKey?: FinishingPackageKey;     // ép gói hoàn thiện
}

/** Diện tích dùng tính giá (m²) từ chuỗi kích thước "5x20", "5m x 20m", "100m2" */
export function parsePricingArea(dimensions?: string): { area: number; widthM: number; lengthM: number } {
  const raw = String(dimensions || '').toLowerCase().replace(/m2|m²|mét vuông/g, '').replace(/,/g, '.').trim();
  const m = raw.match(/(\d+(?:\.\d+)?)\s*(?:m)?\s*[x×*]\s*(\d+(?:\.\d+)?)/);
  if (m) {
    const w = parseFloat(m[1]), l = parseFloat(m[2]);
    if (w > 0 && l > 0) return { area: Math.max(20, Math.round(w * l * 10) / 10), widthM: w, lengthM: l };
  }
  const n = raw.match(/(\d+(?:\.\d+)?)/);
  if (n) {
    const v = parseFloat(n[1]);
    if (v > 10) {
      const w = Math.round(Math.sqrt(v / 2) * 10) / 10 || 5;
      return { area: v, widthM: w, lengthM: Math.round((v / w) * 10) / 10 };
    }
  }
  return { area: 100, widthM: 5, lengthM: 20 };
}

/** Phương án kết cấu từ tên khách chọn — PA1 BTCT · PA2 Khung thép + Cemboard · PA3 EPS */
export function resolveOptionKey(loaiKetCau?: string): StructuralOptionKey {
  const s = String(loaiKetCau || '').toLowerCase().trim();
  if (/^pa[123]$/.test(s)) return s.toUpperCase() as StructuralOptionKey;
  if (s.includes('eps') || s.includes('bê tông nhẹ') || s.includes('gông')) return 'PA3';
  if (s.includes('cốt thép') || s.includes('btct') || s.includes('truyền thống') || s.includes('gạch')) return 'PA1';
  if (s.includes('thép') || s.includes('tiền chế') || s.includes('lắp ghép') || s.includes('cemboard') || s.includes('panel')) return 'PA2';
  return 'PA1';
}

export function resolvePackageKey(v?: string): FinishingPackageKey {
  const s = String(v || '').toLowerCase();
  if (s.includes('tiet_kiem') || s.includes('tiết kiệm') || s === 'economy') return 'tiet_kiem';
  if (s.includes('cao_cap') || s.includes('cao cấp') || s === 'premium') return 'cao_cap';
  return 'tieu_chuan';
}

/** Địa chỉ dùng xác định vùng giá: tỉnh (nếu có) → địa chỉ công trình → địa chỉ khách */
export function resolveAddress(ct?: any, userInfo?: any): string {
  return String(ct?.province || ct?.address || userInfo?.address || '').trim();
}

/** Tính dự toán chuẩn — HÀM DUY NHẤT gọi bộ máy BOQ */
export function getUnifiedEstimate(input: PricingInput): FullProjectEstimateResult & {
  meta: { version: string; areaInput: number; widthM: number; lengthM: number; address: string };
} {
  const ct = input.constructionInfo || {};
  const { area, widthM, lengthM } = parsePricingArea(ct.dimensions);
  const floors = Math.max(1, Math.min(50, Math.round(Number(ct.floors) || 1)));
  const address = resolveAddress(ct, input.userInfo);
  const est = calculateMasterProjectEstimate({
    optionKey: input.optionKey || resolveOptionKey(ct.loai_ket_cau_chinh),
    packageKey: input.packageKey || resolvePackageKey(ct.finishingPackage),
    dien_tich_xay_dung: area,
    so_tang: floors,
    so_phong_ngu: Number(ct.rooms?.bedroomCount) || undefined,
    so_wc: Number(ct.rooms?.bathroomCount) || undefined,
    customerAddress: address || 'Miền Bắc',
    co_san_vuon: ct.rooms?.garden !== false,
    loai_tran: ct.loai_tran
  });
  return Object.assign(est, { meta: { version: PRICING_VERSION, areaInput: area, widthM, lengthM, address } });
}

const vnd = (n: number) => `${Math.round(n).toLocaleString('vi-VN')} đ`;

/** So sánh ngân sách khách với dự toán */
export function compareBudget(budget: number | undefined, unit: string | undefined, total: number) {
  const b = Number(budget) || 0;
  if (!b || (unit && String(unit).toUpperCase() === 'USD')) return null;
  const diff = b - total;
  return {
    budget: b, total, diff,
    ok: diff >= 0,
    text: diff >= 0
      ? `Ngân sách ${vnd(b)} ĐỦ so với dự toán ${vnd(total)} (dư ~${vnd(diff)}, nên giữ 5–10% dự phòng phát sinh).`
      : `Ngân sách ${vnd(b)} THIẾU ~${vnd(-diff)} so với dự toán ${vnd(total)}. Cân nhắc gói hoàn thiện thấp hơn hoặc giảm diện tích.`
  };
}

/**
 * Các trường giá trong báo cáo AI (boq, totalBoqCost, threeOptions, budgetTable)
 * được THAY bằng số của bộ máy chuẩn. Phần chữ của AI giữ nguyên.
 */
export function applyUnifiedPricing<T extends Record<string, any>>(report: T, input: PricingInput): T & Record<string, any> {
  const est = getUnifiedEstimate(input);
  const ct = input.constructionInfo || {};
  const boq = est.lines.map(l => ({
    name: l.item.name,
    brand: '',
    specs: l.spec,
    unit: l.item.unit,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    totalPrice: l.totalAmount,
    category: l.item.categoryName.replace(/^\d+\.\s*/, ''),
    phase: l.item.category
  }));
  const budgetTable = est.lines.map((l, i) => ({
    no: i + 1,
    category: l.item.name,
    material: vnd(l.materialAmount),
    labor: vnd(l.laborAmount),
    unitPrice: `${l.formattedUnitPrice}/${l.item.unit}`,
    total: l.formattedTotalAmount
  }));
  const P = est.allPackages;
  const threeOptions = {
    economy: { title: P.tiet_kiem.title, desc: `${P.tiet_kiem.desc}. Suất đầu tư ${P.tiet_kiem.formatted_suat_dau_tu_m2}.`, estimatedPrice: P.tiet_kiem.formatted_tong_tron_goi },
    standard: { title: P.tieu_chuan.title, desc: `${P.tieu_chuan.desc}. Suất đầu tư ${P.tieu_chuan.formatted_suat_dau_tu_m2}.`, estimatedPrice: P.tieu_chuan.formatted_tong_tron_goi },
    premium: { title: P.cao_cap.title, desc: `${P.cao_cap.desc}. Suất đầu tư ${P.cao_cap.formatted_suat_dau_tu_m2}.`, estimatedPrice: P.cao_cap.formatted_tong_tron_goi }
  };
  const optName = est.optionKey === 'PA1' ? 'Khung BTCT truyền thống' : est.optionKey === 'PA2' ? 'Khung thép + Cemboard' : 'Bê tông nhẹ EPS đúc liền khối';
  const priceSource = {
    version: est.meta.version,
    optionKey: est.optionKey,
    optionName: optName,
    packageKey: est.packageKey,
    region: est.regionName,
    regionFactor: est.regionFactor,
    areaInput: est.meta.areaInput,
    floorAreaConverted: est.dien_tich_san,
    floors: est.so_tang,
    total: est.tong_tron_goi,
    perM2: est.suat_dau_tu_m2,
    note: `Dự toán sơ bộ theo bảng đơn giá Yohu ${est.meta.version} (${optName}, ${est.regionName}). Chưa gồm VAT, xin phép, thiết kế, khảo sát địa chất, ép cọc (nếu cần), phá dỡ, nội thất rời. Sai số ±10–15%.`
  };
  return {
    ...report,
    boq,
    totalBoqCost: est.tong_tron_goi,
    budgetTable,
    threeOptions,
    priceSource,
    budgetCheck: compareBudget(ct.totalBudget, ct.budgetUnit, est.tong_tron_goi)
  };
}
