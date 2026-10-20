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
import { computeSiteFor, SiteGeometry, roomsFor, planDimsFor, setbacksFor } from './siteGeometry.js';
import { hasFreeSketch, planFreeLayout } from './sketchFreePlanner.js';

export const PRICING_VERSION = '2026.10c';

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
  meta: { version: string; areaInput: number; widthM: number; lengthM: number; address: string; site: SiteGeometry };
  yeuCauGiaChu: ChoiceRow[];
} {
  const ct = input.constructionInfo || {};
  // Kích thước khách nhập là kích thước ĐẤT → trừ khoảng lùi ra diện tích xây dựng (giống bản vẽ)
  // Vẽ theo phác thảo tự do (nhà vườn) → diện tích xây dựng = diện tích nhà trên bản vẽ phác thảo
  const site = computeSiteFor(ct);
  const floors = Math.max(1, Math.min(50, Math.round(Number(ct.floors) || 1)));
  const address = resolveAddress(ct, input.userInfo);
  // Sàn sử dụng từng tầng + hiên có mái lấy từ CHÍNH mặt bằng tool vẽ (vẽ theo phác thảo / yêu cầu từng phòng):
  // phần nhô chỉ ở tầng 1, tầng trên nhỏ hơn… → dự toán khớp bản vẽ. Nhà ống tự động: diện tích xây dựng × số tầng.
  const planAreas = (() => {
    try {
      const rooms = roomsFor(ct);
      if (!hasFreeSketch(rooms, 1, floors)) return null;
      const pd = planDimsFor(ct).toLowerCase().match(/(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)/);
      const sb = setbacksFor(ct);
      const san: number[] = []; let hien = 0;
      for (let f = 1; f <= floors; f++) {
        const p = planFreeLayout({ widthM: pd ? parseFloat(pd[1]) : site.lotWidthM, lengthM: pd ? parseFloat(pd[2]) : site.lotLengthM, floor: f, totalFloors: floors, rooms, desiredDirection: ct?.desiredDirection, frontSetbackM: sb.front, backSetbackM: sb.back });
        san.push(Math.round(p.rooms.filter(r => !r.outside && !r.open).reduce((n, r) => n + r.w * r.h, 0) * 10) / 10);
        hien += p.rooms.filter(r => (r.outside && r.type === 'porch' && r.roofed) || r.type === 'balcony').reduce((n, r) => n + r.w * r.h, 0);
      }
      return san.every(v => v > 5) ? { san, hien: Math.round(hien * 10) / 10 } : null;
    } catch { return null; }
  })();
  const est = calculateMasterProjectEstimate({
    san_tang: planAreas?.san,
    dien_tich_hien: planAreas?.hien,
    optionKey: input.optionKey || resolveOptionKey(ct.loai_ket_cau_chinh),
    packageKey: input.packageKey || resolvePackageKey(ct.finishingPackage),
    dien_tich_xay_dung: site.footprint,
    so_tang: floors,
    so_phong_ngu: Number(ct.rooms?.bedroomCount) || undefined,
    so_wc: Number(ct.rooms?.bathroomCount) || undefined,
    customerAddress: address || 'Miền Bắc',
    // Sân vườn chỉ tính khi gia chủ tích ô "Sân vườn" hoặc phác thảo / mô tả có vườn, sân
    co_san_vuon: ct.rooms?.garden === true || (ct.rooms?.sketchLayout?.ngoai_nha || []).some((o: any) => ['vuon', 'san', 'san_vuon'].includes(String(o?.loai))),
    loai_tran: ct.loai_tran,
    soilType: ct.soilType,
    roofType: ct.loai_mai || ct.constructionType,
    widthM: site.lotWidthM,
    houseLengthM: site.houseLengthM,
    floorHeight1: Number((ct as any).floorHeight1) || undefined,
    floorHeightUpper: Number((ct as any).floorHeightUpper) || undefined,
    yeuCau: {
      mac_be_tong: ct.mac_be_tong, mac_thep: ct.mac_thep, loai_gach: ct.loai_gach, bien_phap_cop_pha: ct.bien_phap_cop_pha,
      ty_trong_eps: ct.ty_trong_eps, do_day_vach_eps: ct.do_day_vach_eps, loai_san: ct.loai_san, loai_vach: ct.loai_vach,
      thep_hop_cot: ct.thep_hop_cot, loai_mai: ct.loai_mai
    }
  });
  return Object.assign(est, { meta: { version: PRICING_VERSION, areaInput: site.footprint, widthM: site.lotWidthM, lengthM: site.lotLengthM, address, site }, yeuCauGiaChu: summarizeChoices(ct, est) });
}

/* ══ 3 CÁCH TÍNH GIÁ THEO m² — cùng 1 bộ số liệu diện tích (lấy từ mặt bằng tool vẽ) ══
 * Cách 1: m² SÀN SỬ DỤNG × đơn giá/m² sàn sử dụng      (cách người dân hay hiểu; Bộ XD công bố suất vốn theo cách này)
 * Cách 2: m² QUY ĐỔI (móng, sàn, mái, hiên × hệ số) × đơn giá/m² quy đổi   (cách nhà thầu tư nhân báo giá)
 * Cách 3: m² XÂY DỰNG (phần nhà chiếm đất) × đơn giá KHOÁN của công ty   — CHỈ nhà 1 tầng, móng băng nền thường
 * Cách 1 và 2 cùng 1 tổng (bóc tách khối lượng). Cách 3 là giá khoán gọn do công ty đặt trong Admin → có thể khác.
 */
export type DonGiaKhoan = Partial<Record<FinishingPackageKey, number>>;   // đ/m² xây dựng, 0 = chưa đặt
let DON_GIA_KHOAN: DonGiaKhoan = {};
export function setDonGiaKhoan(o: any) {
  const n: DonGiaKhoan = {};
  (['tiet_kiem', 'tieu_chuan', 'cao_cap'] as FinishingPackageKey[]).forEach(k => { const v = Number(o?.[k]); if (isFinite(v) && v >= 0 && v <= 100000000) n[k] = Math.round(v); });
  DON_GIA_KHOAN = n;
}
export const getDonGiaKhoan = (): DonGiaKhoan => ({ ...DON_GIA_KHOAN });

export interface PriceMethod { key: 'su_dung' | 'quy_doi' | 'xay_dung'; title: string; area: number; areaLabel: string; rate: number; total: number; applicable: boolean; note: string; source?: 'boc_tach' | 'cong_ty' }
export function priceMethods(est: FullProjectEstimateResult & { meta?: any }): PriceMethod[] {
  const total = est.tong_tron_goi;
  const m1: PriceMethod = {
    key: 'su_dung', title: 'Cách 1 · Theo m² sàn sử dụng', area: est.dien_tich_san, areaLabel: 'm² sàn sử dụng', rate: est.suat_san_su_dung_m2, total, applicable: true, source: 'boc_tach',
    note: 'Diện tích các phòng, hành lang có mái che mà gia đình ở được, cộng tất cả các tầng (lấy từ mặt bằng). Đơn giá = tổng dự toán bóc tách ÷ m² sàn sử dụng. Đây là cách người dân hay tính.'
  };
  const m2: PriceMethod = {
    key: 'quy_doi', title: 'Cách 2 · Theo m² quy đổi', area: est.dien_tich_quy_doi, areaLabel: 'm² quy đổi', rate: est.suat_dau_tu_m2, total, applicable: true, source: 'boc_tach',
    note: `Nhà thầu cộng thêm ${est.quy_doi_chi_tiet.filter(l => l.pct !== 100).map(l => `${l.label.toLowerCase()} ${l.pct}%`).join(', ')} vào diện tích, nên số m² lớn hơn, đơn giá nhỏ hơn — CÙNG tổng tiền với cách 1. Khi so báo giá: đơn giá nhà thầu báo thường là đơn giá quy đổi, KHÔNG nhân với m² sử dụng.`
  };
  // Cách 3: chỉ nhà 1 tầng, móng băng (nền thường) — nhà nhiều tầng / móng cọc / móng bè: khối lượng không tỷ lệ theo m² → dễ lỗ
  const simple = est.so_tang === 1 && est.nen_mong.foundation === 'bang';
  const why = est.so_tang > 1 ? `nhà ${est.so_tang} tầng` : est.nen_mong.foundation === 'coc' ? 'móng cọc (đất yếu)' : est.nen_mong.foundation === 'be' ? 'móng bè' : '';
  const dg = DON_GIA_KHOAN[est.packageKey] || 0;
  const fp = est.dien_tich_xay_dung;
  const rate3 = dg > 0 ? dg : Math.round(total / Math.max(1, fp));
  const m3: PriceMethod = {
    key: 'xay_dung', title: 'Cách 3 · Khoán theo m² xây dựng', area: fp, areaLabel: 'm² xây dựng', rate: simple ? rate3 : 0, total: simple ? (dg > 0 ? Math.round(fp * dg) : total) : 0, applicable: simple, source: dg > 0 ? 'cong_ty' : 'boc_tach',
    note: simple
      ? `${fp} m² phần nhà chiếm đất (không tính hiên, sân) × ${dg > 0 ? 'đơn giá khoán của công ty' : 'đơn giá suy từ bóc tách (công ty chưa đặt đơn giá khoán trong Admin)'}. CHỈ áp dụng nhà 1 tầng, móng băng trên nền đất thường. Chưa gồm: ép cọc / gia cố nền nếu khảo sát ra đất yếu, sân, tường rào, hạng mục báo giá riêng.${est.nen_mong.soil === 'chua_biet' ? ' Chưa biết loại đất — giá khoán chỉ giữ nếu khảo sát ra đất tốt.' : ''}`
      : `Không áp dụng cho ${why}: khối lượng móng, kết cấu, mái tăng không theo tỷ lệ m² nên khoán theo m² dễ lỗ. Dùng cách 1 hoặc 2.`
  };
  return [m1, m2, m3];
}

/** Bảng "Yêu cầu của gia chủ đã đưa vào dự toán" — từng lựa chọn: dòng nào nhận, có đổi tiền không */
export interface ChoiceRow { label: string; value: string; appliedTo: string[]; note: string }
function summarizeChoices(ct: any, est: FullProjectEstimateResult): ChoiceRow[] {
  const fields: [string, string][] = [
    ['loai_ket_cau_chinh', 'Phương án kết cấu'], ['finishingPackage', 'Gói hoàn thiện'], ['loai_tran', 'Loại trần'], ['loai_mai', 'Loại mái'],
    ['mac_be_tong', 'Mác bê tông'], ['mac_thep', 'Mác thép'], ['loai_gach', 'Gạch xây'], ['bien_phap_cop_pha', 'Cốp pha'],
    ['loai_san', 'Loại sàn'], ['loai_vach', 'Loại vách'], ['thep_hop_cot', 'Thép hộp cột'], ['ty_trong_eps', 'Tỷ trọng bê tông EPS'], ['do_day_vach_eps', 'Độ dày vách EPS'],
    ['soilType', 'Loại đất nền'], ['province', 'Tỉnh / thành']
  ];
  const rows: ChoiceRow[] = [];
  fields.forEach(([k, label]) => {
    const v = String(ct?.[k] ?? '').trim();
    if (!v) return;
    let appliedTo: string[] = [];
    let note = '';
    if (k === 'loai_ket_cau_chinh') { appliedTo = ['Toàn bộ dự toán']; note = 'Đổi bộ hạng mục kết cấu'; }
    else if (k === 'finishingPackage') { appliedTo = ['Đơn giá mọi dòng']; note = 'Đổi đơn giá & quy cách vật tư'; }
    else if (k === 'soilType') { appliedTo = est.lines.filter(l => /MONG|COC/.test(l.item.id)).map(l => l.item.name); note = est.nen_mong.reason; }
    else if (k === 'province') { appliedTo = ['Đơn giá mọi dòng']; note = `Hệ số vùng ${est.regionName} ×${est.regionFactor}`; }
    else if (k === 'loai_tran') { appliedTo = est.lines.filter(l => l.item.id === 'HT_TRAN').map(l => l.item.name); note = 'Đổi đơn giá & quy cách trần'; }
    else if (k === 'loai_mai') { appliedTo = est.lines.filter(l => l.item.id === 'HT_MAI').map(l => l.item.name); note = 'Đổi đơn giá & quy cách mái'; }
    else {
      appliedTo = est.lines.filter(l => (l.yeuCau || []).some(x => x.startsWith(label))).map(l => l.item.name);
      note = !appliedTo.length ? 'Không thuộc phương án kết cấu đang chọn' : k === 'do_day_vach_eps' ? 'Đổi khối lượng bê tông vách' : 'Ghi vào quy cách; đơn giá theo gói (đội dự toán chốt khi báo giá chi tiết)';
    }
    rows.push({ label, value: v, appliedTo, note });
  });
  return rows;
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
    material: l.materialAmount || 0,
    labor: l.laborAmount || 0,
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
    floorAreaConverted: est.dien_tich_quy_doi,
    floorAreaReal: est.dien_tich_san,
    perM2Usable: est.suat_san_su_dung_m2,       // giá / m² sàn sử dụng
    methods: priceMethods(est),                 // 3 cách tính giá theo m²
    quyDoiDetail: est.quy_doi_chi_tiet,         // bảng tính diện tích quy đổi
    footprint: est.dien_tich_xay_dung,
    siteNote: est.meta.site.note,
    foundation: est.nen_mong.reason,
    floors: est.so_tang,
    total: est.tong_tron_goi,
    perM2: est.suat_dau_tu_m2,
    totalMaterial: est.tong_vat_tu_thiet_bi,
    totalLabor: est.tong_khoan_nhan_cong,
    yeuCau: est.yeuCauGiaChu,
    note: `${est.meta.site.note} Móng: ${est.nen_mong.reason}. Dự toán sơ bộ theo bảng đơn giá Yohu ${est.meta.version} (${optName}, ${est.regionName}). Chưa gồm VAT, xin phép, thiết kế, khảo sát địa chất, phá dỡ, nội thất rời. Sai số ±10–15%.`
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
