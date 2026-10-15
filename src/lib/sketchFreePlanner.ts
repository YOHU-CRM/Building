/**
 * YOHU CONSTECH — VẼ MẶT BẰNG THEO PHÁC THẢO TỰ DO (nhà vườn, nhà cấp 4 rộng, nhà không theo kiểu nhà ống)
 *
 * Đầu vào: bản đọc phác thảo của AI (bo_tri_phac_thao) dạng LƯỚI:
 *   - mỗi phòng có hàng/cột (hàng 0 = phía cửa chính / mặt tiền, cột 0 = bên TRÁI khi đứng ngoài nhìn vào cửa chính),
 *     số hàng/cột chiếm, diện tích ghi tay (m²), chữ gốc.
 *   - cửa chính, cửa phụ (ra bếp phụ / vườn), hiên, lối vào, công trình ngoài nhà (bếp phụ đun củi, giếng, ao, vườn).
 *
 * Bộ vẽ:
 *   1. Suy kích thước từng cột/hàng từ diện tích ghi tay (khớp chiều sâu/chiều rộng nhà nếu có ghi).
 *   2. Giữ ĐÚNG vị trí phòng như phác thảo; ô trống thành sảnh/lối đi.
 *   3. Tự tính vị trí CỬA PHỤ ra bếp phụ + CỬA WC cùng lúc để:
 *        - lối từ bếp chính ra bếp phụ đi thẳng, KHÔNG đi ngang trước cửa WC;
 *        - cửa WC không mở ra bếp / bàn ăn / phòng có cửa chính;
 *        - bếp phụ (khói củi) không nằm đầu hướng gió chính mùa hè, không ở mặt tiền;
 *        - cửa phụ không thẳng trục cửa chính (xuyên tâm).
 *   4. Phong thủy Bát Trạch 9 cung, nội thất cơ bản, kiểm tra kích thước, ghi rõ chỗ giữ / chỗ chỉnh.
 *
 * Toạ độ giống architectPlanner: x ngang nhà (0 = mép trái), y chiều sâu (0 = mặt tiền, H = tường sau).
 */

import type { FloorPlanResult, PlanRoom, PlanDoor, PlanItem, PlanCheck, GridCell, Side, RoomType, PlannerInput } from './architectPlanner';

/* ───────────── hướng & 9 cung (giống architectPlanner) ───────────── */
const DIRS = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
const DIR_ALIASES: Record<string, string> = { north: 'Bắc', northeast: 'Đông Bắc', east: 'Đông', southeast: 'Đông Nam', south: 'Nam', southwest: 'Tây Nam', west: 'Tây', northwest: 'Tây Bắc' };
function parseDir(raw?: string): string | null {
  if (!raw) return null;
  const base = String(raw).split('(')[0].trim();
  const lower = base.toLowerCase().replace(/[\s-]/g, '');
  if (DIR_ALIASES[lower]) return DIR_ALIASES[lower];
  const sorted = [...DIRS].sort((a, b) => b.length - a.length);
  for (const d of sorted) if (base.toLowerCase() === d.toLowerCase()) return d;
  for (const d of sorted) if (base.toLowerCase().startsWith(d.toLowerCase())) return d;
  return null;
}
const dirDeg = (d: string) => DIRS.indexOf(d) * 45;
const degDir = (deg: number) => DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
function starMapOf(fs: any): Record<string, { star: string; good: boolean }> {
  const map: Record<string, { star: string; good: boolean }> = {};
  const add = (arr: any, good: boolean) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((e: string) => {
      const m = String(e).match(/^(.+?)\s*\((.+)\)\s*$/);
      const d = parseDir(m ? m[1] : e);
      if (d) map[d] = { star: m ? m[2].trim() : '', good };
    });
  };
  add(fs?.favorableDirections, true);
  add(fs?.unfavorableDirections, false);
  return map;
}
const STAR_RANK: Record<string, number> = { 'Sinh Khí': 4, 'Thiên Y': 3, 'Diên Niên': 2, 'Phục Vị': 1, 'Họa Hại': -1, 'Lục Sát': -2, 'Ngũ Quỷ': -3, 'Tuyệt Mệnh': -4 };

const r1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const num = (v: any): number | undefined => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) || n <= 0 ? undefined : n; };
const strip = (s: any) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const opp = (s: Side): Side => s === 'front' ? 'rear' : s === 'rear' ? 'front' : s === 'left' ? 'right' : 'left';
const SIDE_VI: Record<Side, string> = { front: 'trước', rear: 'sau', left: 'trái', right: 'phải' };
const CANH: Record<string, Side> = { truoc: 'front', sau: 'rear', trai: 'left', phai: 'right' };
const EPS = 0.05;

/* ───────────── loại phòng từ phác thảo ───────────── */
const LOAI_MAP: Record<string, { type: RoomType; name: string }> = {
  khach: { type: 'living', name: 'Phòng khách' },
  an: { type: 'dining', name: 'Phòng ăn' },
  bep: { type: 'kitchen', name: 'Bếp' },
  ngu: { type: 'bedroom', name: 'P. Ngủ' },
  wc: { type: 'wc', name: 'WC' },
  tho: { type: 'worship', name: 'Phòng thờ' },
  doc_sach: { type: 'common', name: 'P. Đọc sách' },
  lam_viec: { type: 'common', name: 'P. Làm việc' },
  sinh_hoat: { type: 'common', name: 'Sinh hoạt chung' },
  kho: { type: 'storage', name: 'Kho' },
  sanh: { type: 'corridor', name: 'Sảnh' },
  hanh_lang: { type: 'corridor', name: 'Hành lang' },
  hien: { type: 'porch', name: 'Hiên' },
  gara: { type: 'garage', name: 'Gara' },
  thang: { type: 'stair', name: 'Cầu thang' },
  gieng_troi: { type: 'lightwell', name: 'Giếng trời' },
  san: { type: 'porch', name: 'Sân trong' }
};
const HUB: RoomType[] = ['living', 'dining', 'corridor', 'common'];   // common chỉ tính khi là "sinh hoạt chung"

type Seg = { side: Side; a: number; b: number };          // a..b toạ độ tuyệt đối dọc cạnh
interface Rect { x: number; y: number; w: number; h: number; }

/** đoạn tường chung giữa A và B, tính theo cạnh của A */
function shared(A: Rect, B: Rect): Seg | null {
  const ov = (a0: number, a1: number, b0: number, b1: number) => [Math.max(a0, b0), Math.min(a1, b1)];
  if (Math.abs(A.y - (B.y + B.h)) < EPS) { const [a, b] = ov(A.x, A.x + A.w, B.x, B.x + B.w); if (b - a > EPS) return { side: 'front', a, b }; }
  if (Math.abs(A.y + A.h - B.y) < EPS) { const [a, b] = ov(A.x, A.x + A.w, B.x, B.x + B.w); if (b - a > EPS) return { side: 'rear', a, b }; }
  if (Math.abs(A.x - (B.x + B.w)) < EPS) { const [a, b] = ov(A.y, A.y + A.h, B.y, B.y + B.h); if (b - a > EPS) return { side: 'left', a, b }; }
  if (Math.abs(A.x + A.w - B.x) < EPS) { const [a, b] = ov(A.y, A.y + A.h, B.y, B.y + B.h); if (b - a > EPS) return { side: 'right', a, b }; }
  return null;
}
const sideRange = (r: Rect, s: Side): [number, number] => (s === 'front' || s === 'rear') ? [r.x, r.x + r.w] : [r.y, r.y + r.h];
/** điểm giữa cửa (toạ độ tuyệt đối) */
function doorPoint(r: Rect, d: PlanDoor): [number, number] {
  const m = d.at + d.width / 2;
  if (d.side === 'front') return [r.x + m, r.y];
  if (d.side === 'rear') return [r.x + m, r.y + r.h];
  if (d.side === 'left') return [r.x, r.y + m];
  return [r.x + r.w, r.y + m];
}
const outward = (s: Side): [number, number] => s === 'front' ? [0, -1] : s === 'rear' ? [0, 1] : s === 'left' ? [-1, 0] : [1, 0];
function distPointSeg(p: [number, number], a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L2 = dx * dx + dy * dy;
  const t = L2 ? clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2, 0, 1) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
const distPoly = (p: [number, number], pts: [number, number][]) => pts.slice(1).reduce((m, q, i) => Math.min(m, distPointSeg(p, pts[i], q)), 99);
const center = (r: Rect): [number, number] => [r.x + r.w / 2, r.y + r.h / 2];

const MIN: Record<string, { area: number; width: number }> = {
  living: { area: 14, width: 3.0 }, master: { area: 12, width: 3.0 }, bedroom: { area: 9, width: 2.6 },
  kitchen: { area: 6, width: 1.8 }, wc: { area: 2.4, width: 1.2 }, worship: { area: 4.5, width: 1.8 }, common: { area: 6, width: 2.2 }, dining: { area: 6, width: 2.2 }
};

/** Phòng do tool tự đặt (gia chủ không chọn vị trí): đổi chỗ cho hợp phong thủy Bát Trạch trên lưới 3×3.
 *  WC, bếp → cung xấu (tọa hung); phòng ngủ, phòng thờ, làm việc → cung tốt; bếp & thờ ưu tiên phía sau. */
function optimizeAutoCells(srs: { loai: string; r0: number; c0: number; rs: number; cs: number; raw: any }[], R: number, C: number, facingRaw: string | undefined, fs: any): string[] {
  if (R !== 3 || C !== 3) return [];
  const facing = parseDir(facingRaw) || 'Nam';
  const D = dirDeg(facing);
  const sm = starMapOf(fs);
  if (!Object.keys(sm).length) return [];
  const score = (r: number, c: number) => {
    if (r === 1 && c === 1) return 0;
    const d = degDir(Math.atan2(c - 1, r - 1) * 180 / Math.PI + D - 180);
    const i = sm[d]; if (!i) return 0;
    return STAR_RANK[i.star] ?? (i.good ? 1 : -1);
  };
  const auto = srs.filter(s => s.raw?.nguon === 'tu_dong' && s.rs === 1 && s.cs === 1 && ['wc', 'bep', 'ngu', 'tho', 'lam_viec'].includes(s.loai));
  if (auto.length < 2 || auto.length > 7) return [];
  const cells = auto.map(s => [s.r0, s.c0] as [number, number]);
  const val = (loai: string, r: number, c: number) => {
    const sc = score(r, c);
    const base = loai === 'wc' ? -sc * 1.5 : loai === 'bep' ? -sc : loai === 'tho' ? sc * 2.5 : sc;
    return base + ((loai === 'bep' || loai === 'tho') && r === 2 ? 1.5 : 0) + (loai === 'wc' && r === 1 && c === 1 ? -10 : 0);
  };
  let best = cells.map((_, i) => i), bestV = -1e9;
  const perm = (arr: number[], k: number) => {
    if (k === arr.length) {
      let v = arr.reduce((t, ci, i) => t + val(auto[i].loai, cells[ci][0], cells[ci][1]), 0);
      // phòng thờ không chung vách WC
      const pos = (l: string) => auto.map((a, i) => a.loai === l ? cells[arr[i]] : null).filter(Boolean) as [number, number][];
      pos('tho').forEach(([r1_, c1_]) => pos('wc').forEach(([r2, c2]) => { if (Math.abs(r1_ - r2) + Math.abs(c1_ - c2) === 1) v -= 3; }));
      if (v > bestV) { bestV = v; best = arr.slice(); }
      return;
    }
    for (let i = k; i < arr.length; i++) { [arr[k], arr[i]] = [arr[i], arr[k]]; perm(arr, k + 1); [arr[k], arr[i]] = [arr[i], arr[k]]; }
  };
  perm(cells.map((_, i) => i), 0);
  const notes: string[] = [];
  auto.forEach((s, i) => { const [r, c] = cells[best[i]]; if (r !== s.r0 || c !== s.c0) { s.r0 = r; s.c0 = c; } });
  if (bestV > -1e9) notes.push(`✓ ${auto.length} phòng gia chủ chưa chọn vị trí đã được tool xếp theo cung mệnh: WC, bếp vào cung xấu; phòng ngủ, phòng thờ vào cung tốt.`);
  return notes;
}

/** Có dùng chế độ phác thảo tự do cho tầng này không */
export function hasFreeSketch(rooms: any, floor: number, totalFloors: number): boolean {
  const sk = rooms?.sketchLayout;
  if (!sk || sk.co_phac_thao === false) return false;
  const t = (sk.tang || []).find((x: any) => Number(x.tang) === floor);
  const ph = (t?.phong || []).filter((p: any) => Number.isFinite(Number(p.hang)) && Number.isFinite(Number(p.cot)));
  if (ph.length < 2) return false;
  return sk.kieu === 'tu_do' || totalFloors === 1;
}

export function planFreeLayout(input: PlannerInput): FloorPlanResult {
  const sk: any = input.rooms?.sketchLayout || {};
  const floors = Math.max(1, Math.round(Number(input.totalFloors) || 1));
  const floor = clamp(Math.round(Number(input.floor) || 1), 1, floors);
  const fs = input.fengShuiAnalysis;
  const sketchNotes: string[] = [];
  // Mặc định VẼ ĐÚNG Ý GIA CHỦ; đề xuất của KTS ghi riêng (advice). Khách bấm "Theo đề xuất KTS" thì mới áp vào bản vẽ.
  const applyAdvice = !!input.rooms?.applyAdvice;
  const advice: string[] = [];
  const checks: PlanCheck[] = [];
  const notes: string[] = [];

  /* ── 1. Phòng trên lưới ── */
  const tang = (sk.tang || []).find((x: any) => Number(x.tang) === floor) || { phong: [] };
  type SR = { loai: string; ten: string; area?: number; r0: number; c0: number; rs: number; cs: number; conf: number; raw: any };
  let srs: SR[] = (tang.phong || [])
    .filter((p: any) => Number.isFinite(Number(p.hang)) && Number.isFinite(Number(p.cot)))
    .map((p: any) => ({
      loai: String(p.loai || 'sinh_hoat'), ten: String(p.ten_goc || '').trim(), area: num(p.dien_tich),
      r0: Math.max(0, Math.round(Number(p.hang))), c0: Math.max(0, Math.round(Number(p.cot))),
      rs: Math.max(1, Math.round(Number(p.so_hang) || 1)), cs: Math.max(1, Math.round(Number(p.so_cot) || 1)),
      conf: Number(p.tin_cay ?? 1), raw: p
    }));
  const R = Math.max(Number(sk.luoi?.so_hang) || 0, ...srs.map(s => s.r0 + s.rs));
  const C = Math.max(Number(sk.luoi?.so_cot) || 0, ...srs.map(s => s.c0 + s.cs));
  optimizeAutoCells(srs, R, C, input.desiredDirection || sk.huong_mat_tien || fs?.directionVerdict?.direction, fs).forEach(t => sketchNotes.push(t));
  // chống trùng ô: phòng có diện tích lớn giữ trước
  const occ: (number | null)[][] = Array.from({ length: R }, () => Array(C).fill(null));
  const kept: SR[] = [];
  srs.slice().sort((a, b) => (b.area || 0) - (a.area || 0)).forEach(s => {
    let clash = false;
    for (let r = s.r0; r < s.r0 + s.rs; r++) for (let c = s.c0; c < s.c0 + s.cs; c++) if (r >= R || c >= C || occ[r][c] !== null) clash = true;
    if (clash) { sketchNotes.push(`↺ "${s.ten || s.loai}" trùng ô với phòng khác trên phác thảo — tạm bỏ, anh/chị kiểm tra lại phiếu.`); return; }
    for (let r = s.r0; r < s.r0 + s.rs; r++) for (let c = s.c0; c < s.c0 + s.cs; c++) occ[r][c] = kept.length;
    kept.push(s);
  });
  srs = kept;

  /* ── Đối chiếu ô nhập / mô tả của gia chủ với bản vẽ tay: KHÔNG tự thêm bớt phòng, ghi câu hỏi để gia chủ xác nhận ── */
  const ui = input.rooms || {};
  const cnt = (l: string) => srs.filter(s => s.loai === l).length;
  const ask = (t: string) => sketchNotes.push(`? Cần gia chủ xác nhận: ${t}`);
  const uiBeds = Number(input.requestedBedrooms ?? ui.bedroomCount) || 0;
  const uiWc = Number(input.requestedBathrooms ?? ui.bathroomCount) || 0;
  if (uiBeds && uiBeds !== cnt('ngu')) ask(`ô nhập ${uiBeds} phòng ngủ, bản vẽ tay có ${cnt('ngu')} — bản vẽ đang giữ bố trí tay; gia chủ chọn lại số phòng hoặc sửa phác thảo trên Phiếu.`);
  if (uiWc && uiWc !== cnt('wc')) ask(`ô nhập ${uiWc} WC, bản vẽ tay có ${cnt('wc')}.`);
  if (typeof ui.worshipRoom === 'boolean' && ui.worshipRoom !== cnt('tho') > 0) ask(`ô nhập ${ui.worshipRoom ? 'có' : 'không có'} phòng thờ, bản vẽ tay ${cnt('tho') ? 'có' : 'không có'}.`);

  /* ── 2. Kích thước cột / hàng từ diện tích ghi tay ── */
  // Ưu tiên: số đo nhà trong MÔ TẢ / ô nhập của gia chủ > số ghi trên bản vẽ tay (bản vẽ chỉ để tham chiếu bố trí)
  const hasDims = Number(input.widthM) > 0 && Number(input.lengthM) > 0;
  const isLot = input.rooms?.dimsKind === 'dat';
  // thửa đất: nhà = ngang (đã trừ lùi 2 bên) × (dài − lùi trước − lùi sau)
  const Lin = Number(input.lengthM) || 0;
  const fsIn = parseFloat(String(input.frontSetbackM ?? '')), bsIn = parseFloat(String(input.backSetbackM ?? ''));
  const lotH = Math.max(4, Lin - (isFinite(fsIn) ? fsIn : (Lin >= 12 ? 2 : 1)) - (isFinite(bsIn) ? bsIn : (Lin >= 12 ? 1 : 0.5)));
  const dimsHouse = hasDims;
  const Hfix = hasDims ? (isLot ? Math.round(lotH * 10) / 10 : Lin) : num(sk.nha?.sau);
  const Wfix = hasDims ? Number(input.widthM) : num(sk.nha?.rong);
  if (dimsHouse && (num(sk.nha?.sau) || num(sk.nha?.rong)) && (num(sk.nha?.sau) !== Hfix || num(sk.nha?.rong) !== Wfix))
    sketchNotes.push(`✓ Dùng kích thước nhà gia chủ nhập ${Wfix}×${Hfix}m; số đo trên bản vẽ tay (${num(sk.nha?.rong) || '?'}×${num(sk.nha?.sau) || '?'}m) chỉ dùng tham chiếu bố trí.`);
  const withArea = srs.filter(s => s.area);
  // Phòng không ghi diện tích: dùng diện tích tối thiểu hợp lý làm "mục tiêu mềm" để không bị ép mỏng (vd bếp 1,2m)
  const SOFT: Record<string, number> = { bep: 12, an: 12, ngu: 13, khach: 22, tho: 12, wc: 4.5, doc_sach: 12, lam_viec: 10, sinh_hoat: 14, kho: 5, gara: 18, thang: 8 };
  // phòng chiếm nhiều ô: diện tích mềm tăng theo số ô (× 0,8 mỗi ô thêm)
  const fitList = srs.map(s => ({ s, a: s.area || (SOFT[s.loai] ? SOFT[s.loai] * (1 + 0.8 * (s.rs * s.cs - 1)) : 0), w: s.area ? 1 : 0.6 })).filter(x => x.a > 0);
  const coveredCells = srs.reduce((n, s) => n + s.rs * s.cs, 0);
  const areaSum = withArea.reduce((n, s) => n + (s.area || 0), 0);
  const areaCells = withArea.reduce((n, s) => n + s.rs * s.cs, 0);
  const cellA = areaCells ? areaSum / areaCells : 0;
  let H0 = Hfix, W0 = Wfix;
  if (!H0 && !W0) {
    if (cellA) { const s = Math.sqrt(cellA); H0 = R * s; }
    else { W0 = clamp(Number(input.widthM) || 10, 4, 60); H0 = clamp((Number(input.lengthM) || 15) - 3, 4, 60); }
  }
  let rh = Array(R).fill((H0 || (cellA ? (cellA * R * C) / (W0 || 10) : 10)) / R);
  let cw = Array(C).fill(W0 ? W0 / C : (cellA ? cellA / rh[0] : 3.5));
  const MINC = 1.2, MINR = 2.4;   // hàng phòng tối thiểu 2,4m (WC, kho); cột tối thiểu 1,2m
  for (let it = 0; it < 500 && fitList.length; it++) {
    const lc = Array(C).fill(0), nc = Array(C).fill(0), lr = Array(R).fill(0), nr = Array(R).fill(0);
    fitList.forEach(({ s, a, w }) => {
      let sw = 0, sh = 0;
      for (let c = s.c0; c < s.c0 + s.cs; c++) sw += cw[c];
      for (let r = s.r0; r < s.r0 + s.rs; r++) sh += rh[r];
      const g = w * Math.log(a / (sw * sh)) / 2;
      for (let c = s.c0; c < s.c0 + s.cs; c++) { lc[c] += g; nc[c] += w; }
      for (let r = s.r0; r < s.r0 + s.rs; r++) { lr[r] += g; nr[r] += w; }
    });
    // Phòng gia chủ nhập kích thước: kéo bề ngang cột & chiều sâu hàng về đúng số đo (ưu tiên cao).
    // Dài/rộng tự xoay theo dáng ô phòng (cạnh dài theo chiều dài của ô).
    srs.forEach(s => {
      const a = num(s.raw?.dai), b = num(s.raw?.rong);
      if (!a || !b) return;
      let sw = 0, sh = 0;
      for (let c = s.c0; c < s.c0 + s.cs; c++) sw += cw[c];
      for (let r = s.r0; r < s.r0 + s.rs; r++) sh += rh[r];
      const big = Math.max(a, b), small = Math.min(a, b);
      const tw = sw >= sh ? big : small, th = sw >= sh ? small : big;
      const gw = 2 * Math.log(tw / sw), gh = 2 * Math.log(th / sh);
      for (let c = s.c0; c < s.c0 + s.cs; c++) { lc[c] += gw; nc[c] += 2; }
      for (let r = s.r0; r < s.r0 + s.rs; r++) { lr[r] += gh; nr[r] += 2; }
    });
    cw = cw.map((v, c) => Math.max(MINC, nc[c] ? v * Math.exp(0.5 * lc[c] / nc[c]) : v));
    rh = rh.map((v, r) => Math.max(MINR, nr[r] ? v * Math.exp(0.5 * lr[r] / nr[r]) : v));
    if (Hfix) { const k = Hfix / rh.reduce((a, b) => a + b, 0); rh = rh.map(v => v * k); }
    if (Wfix) { const k = Wfix / cw.reduce((a, b) => a + b, 0); cw = cw.map(v => v * k); }
  }
  // ô không có phòng có diện tích → lấy trung bình
  const roundTo = (arr: number[], total?: number) => {
    const out = arr.map(v => r1(v));
    if (total) { const d = r1(total - out.reduce((a, b) => a + b, 0)); out[out.length - 1] = r1(out[out.length - 1] + d); }
    return out;
  };
  cw = roundTo(cw, Wfix); rh = roundTo(rh, Hfix);
  const W = r1(cw.reduce((a, b) => a + b, 0));
  const H = r1(rh.reduce((a, b) => a + b, 0));
  const colX = cw.reduce((acc: number[], v, i) => { acc.push(r1(acc[i] + v)); return acc; }, [0]);
  const rowY = rh.reduce((acc: number[], v, i) => { acc.push(r1(acc[i] + v)); return acc; }, [0]);

  /* ── 3. Hướng & 9 cung ── */
  const facing = parseDir(input.desiredDirection) || parseDir(sk.huong_mat_tien) || parseDir(fs?.directionVerdict?.direction) || 'Nam';
  const D = dirDeg(facing);
  const northPageDeg = (((180 - D) % 360) + 360) % 360;
  const starMap = starMapOf(fs);
  const hasFs = Object.keys(starMap).length > 0;
  const cellOf = (x: number, y: number) => ({ col: clamp(Math.floor(x / (W / 3)), 0, 2), row: clamp(Math.floor(y / (H / 3)), 0, 2) });
  const cellDir = (col: number, row: number): string => {
    if (col === 1 && row === 1) return 'Trung cung';
    const p = Math.atan2(col - 1, row - 1) * 180 / Math.PI;
    return degDir(p + D - 180);
  };
  const sideBearing = (side: Side): string => degDir((side === 'rear' ? 0 : side === 'right' ? 90 : side === 'front' ? 180 : 270) + D - 180);
  const info = (dir: string) => dir === 'Trung cung' ? { star: 'Trung cung', good: null as boolean | null }
    : starMap[dir] ? { star: starMap[dir].star, good: starMap[dir].good as boolean | null } : { star: '', good: null as boolean | null };
  const dirScore = (dir: string) => { const i = info(dir); return i.good === null ? 0 : (STAR_RANK[i.star] ?? (i.good ? 1 : -1)); };
  const describe = (side: Side) => { const d = sideBearing(side); const i = info(d); return `${d}${i.star ? ` (${i.star}${i.good === false ? ' – xấu' : i.good ? ' – tốt' : ''})` : ''}`; };
  const grid: GridCell[] = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) { const d = cellDir(col, row); const i = info(d); grid.push({ col, row, direction: d, star: i.star, good: i.good }); }

  /* ── 4. Dựng phòng ── */
  const rooms: PlanRoom[] = [];
  const meta = new Map<PlanRoom, SR>();
  let bedNo = 0;
  srs.forEach((s, i) => {
    const m = LOAI_MAP[s.loai] || { type: 'common' as RoomType, name: s.ten || 'Phòng' };
    const x = colX[s.c0], y = rowY[s.r0];
    const w = r1(colX[s.c0 + s.cs] - x), h = r1(rowY[s.r0 + s.rs] - y);
    let name = s.ten && s.ten.length <= 26 ? s.ten : m.name;
    if (m.type === 'bedroom' && !s.ten) name = `P. Ngủ ${++bedNo}`;
    const room: PlanRoom = { id: `sk_${i}_${s.loai}`, type: m.type, name, x, y, w, h, doors: [], windows: [], items: [], outside: m.type === 'porch' || undefined };
    rooms.push(room); meta.set(room, s);
  });
  // ô trống → sảnh / lối đi (gộp theo hàng)
  for (let r = 0; r < R; r++) {
    let c = 0;
    while (c < C) {
      if (occ[r][c] !== null) { c++; continue; }
      let c1 = c; while (c1 + 1 < C && occ[r][c1 + 1] === null) c1++;
      rooms.push({ id: `hall_${r}_${c}`, type: 'corridor', name: 'Sảnh · lối đi', x: colX[c], y: rowY[r], w: r1(colX[c1 + 1] - colX[c]), h: r1(rowY[r + 1] - rowY[r]), doors: [], windows: [], items: [] });
      c = c1 + 1;
    }
  }
  const inside = () => rooms.filter(r => !r.outside);
  const isHub = (r: PlanRoom) => r.type === 'living' || r.type === 'dining' || r.type === 'corridor' || (r.type === 'common' && (meta.get(r)?.loai || 'sinh_hoat') === 'sinh_hoat');
  const isExteriorSeg = (room: PlanRoom, s: Side): Seg[] => {
    // phần cạnh nằm trên chu vi nhà hoặc giáp hiên (không tường)
    const [a0, b0] = sideRange(room, s);
    let parts: [number, number][] = [[a0, b0]];
    rooms.filter(o => o !== room && !o.outside).forEach(o => {
      const sh = shared(room, o);
      if (!sh || sh.side !== s) return;
      parts = parts.flatMap(([a, b]) => {
        const out: [number, number][] = [];
        if (sh.a > a + EPS) out.push([a, Math.min(b, sh.a)]);
        if (sh.b < b - EPS) out.push([Math.max(a, sh.b), b]);
        return out;
      });
    });
    return parts.filter(([a, b]) => b - a > 0.6).map(([a, b]) => ({ side: s, a, b }));
  };
  const exteriorSegs = (room: PlanRoom) => (['front', 'rear', 'left', 'right'] as Side[]).flatMap(s => isExteriorSeg(room, s));
  const neighbors = (room: PlanRoom) => rooms.filter(o => o !== room).map(o => ({ o, seg: shared(room, o) })).filter(n => n.seg && n.seg.b - n.seg.a >= 0.75) as { o: PlanRoom; seg: Seg }[];
  const addDoor = (room: PlanRoom, seg: Seg, center: number, width: number, extra: Partial<PlanDoor> = {}): PlanDoor => {
    const wdt = Math.min(width, seg.b - seg.a - 0.2);
    const a = clamp(center - wdt / 2, seg.a + 0.1, seg.b - wdt - 0.1);
    const base = seg.side === 'front' || seg.side === 'rear' ? room.x : room.y;
    const d: PlanDoor = { side: seg.side, at: r1(a - base), width: r1(Math.max(0.6, wdt)), ...extra };
    room.doors.push(d);
    return d;
  };
  const hasDoorBetween = (A: PlanRoom, B: PlanRoom) => {
    const s1 = shared(A, B), s2 = shared(B, A);
    const on = (r: PlanRoom, s: Seg | null) => !!s && r.doors.some(d => { if (d.side !== s.side) return false; const base = s.side === 'front' || s.side === 'rear' ? r.x : r.y; const m = base + d.at + d.width / 2; return m > s.a && m < s.b; });
    return on(A, s1) || on(B, s2);
  };

  /* ── 5. Cửa chính ── */
  const findRoom = (key: any): PlanRoom | undefined => {
    if (!key) return undefined;
    const k = strip(key);
    return rooms.find(r => strip(meta.get(r)?.ten) === k) || rooms.find(r => { const t = strip(meta.get(r)?.ten); return !!t && (t.includes(k) || k.includes(t)); })
      || rooms.find(r => meta.get(r)?.loai === key);
  };
  const cuaList: any[] = Array.isArray(sk.cua) ? sk.cua : [];
  const cuaChinh = cuaList.find(c => c.loai === 'chinh');
  let mainRoom = findRoom(cuaChinh?.phong);
  const mainSide: Side = CANH[cuaChinh?.canh] || 'front';
  if (!mainRoom || mainRoom.outside) {
    const front = inside().filter(r => ['corridor', 'living', 'common'].includes(r.type) && (r.y < EPS || rooms.some(p => p.outside && shared(r, p)?.side === 'front')));
    // ô mặt tiền có cung tốt nhất cho cửa chính (sảnh / phòng khách), rồi mới ưu tiên sảnh
    const frontScore = (r: PlanRoom) => { const c = cellOf(r.x + r.w / 2, 0.1); return dirScore(cellDir(c.col, c.row)); };
    mainRoom = front.sort((a, b) => frontScore(b) - frontScore(a) || (a.type === 'corridor' ? -1 : 0) - (b.type === 'corridor' ? -1 : 0) || b.w - a.w)[0] || inside().find(r => r.type === 'living') || inside()[0];
  }
  let mainDoor: PlanDoor | null = null;
  if (mainRoom) {
    const segs = [...isExteriorSeg(mainRoom, mainSide), ...rooms.filter(p => p.outside).map(p => shared(mainRoom!, p)).filter((s): s is Seg => !!s && s.side === mainSide)];
    const seg = segs.sort((a, b) => (b.b - b.a) - (a.b - a.a))[0];
    if (seg) {
      // vị trí cửa: ô 9 cung mặt tiền tốt nhất trong đoạn tường
      const dw = seg.b - seg.a >= 2.4 ? 1.6 : 1.0;
      const cands = [0.2, 0.5, 0.8].map(t => seg.a + (seg.b - seg.a) * t);
      const fsAt = (x: number) => { const c = cellOf(x, mainSide === 'front' ? 0.1 : H - 0.1); return dirScore(cellDir(c.col, c.row)); };
      const sc = (x: number) => fsAt(x) + (x === cands[1] ? (cuaChinh ? 2.5 : 0.3) : 0);   // có phác thảo → giữ giữa đoạn tường như khách vẽ
      const fsBest = cands.slice().sort((a, b) => fsAt(b) - fsAt(a))[0];
      const cx = cands.sort((a, b) => sc(b) - sc(a))[0];
      if (cuaChinh && fsAt(fsBest) > fsAt(cx) && hasFs) {
        const c2 = cellOf(fsBest, 0.1);
        advice.push(`Dời cửa chính sang phía ${fsBest < cx ? 'trái' : 'phải'} (cung ${cellDir(c2.col, c2.row)}${info(cellDir(c2.col, c2.row)).star ? ' – ' + info(cellDir(c2.col, c2.row)).star : ''}) sẽ hợp tuổi hơn.`);
      }
      mainDoor = addDoor(mainRoom, seg, cx, dw, { main: true });
      const p = doorPoint(mainRoom, mainDoor);
      const c = cellOf(p[0], p[1] < EPS ? 0.1 : p[1]);
      notes.push(`Cửa chính: ở cung ${cellDir(c.col, c.row)}${info(cellDir(c.col, c.row)).star ? ` (${info(cellDir(c.col, c.row)).star})` : ''}, mở ra hướng ${facing}${info(facing).star ? ` (${info(facing).star})` : ''}.`);
      sketchNotes.push(`✓ Cửa chính ${cuaChinh ? 'như phác thảo' : 'đặt'} ở ${mainRoom.name}, mở ra ${mainSide === 'front' ? 'hiên / mặt tiền' : 'phía ' + SIDE_VI[mainSide]} hướng ${facing}.`);
    }
  }
  const mainPt: [number, number] | null = mainRoom && mainDoor ? doorPoint(mainRoom, mainDoor) : null;

  /* ── 6. Cửa phụ ra bếp phụ / vườn + cửa WC: tối ưu cùng lúc ── */
  const outdoor: any[] = Array.isArray(sk.ngoai_nha) ? sk.ngoai_nha : [];
  const bepPhu = outdoor.find(o => o.loai === 'bep_phu');
  const cuaPhuSk = cuaList.find(c => c.loai === 'phu' || c.ra === 'bep_phu' || c.ra === 'vuon');
  const needService = !!bepPhu || !!cuaPhuSk;
  const kitchen = inside().find(r => r.type === 'kitchen');
  const dining = inside().find(r => r.type === 'dining');
  const wcs = inside().filter(r => r.type === 'wc');
  const startRoom = kitchen || dining || inside().find(r => r.type === 'living');

  type WcChoice = { room: PlanRoom; to: PlanRoom; seg: Seg; c: number; pen: number; why: string };
  const wcOptions = (wc: PlanRoom, route: [number, number][] | null): WcChoice[] => {
    const list: WcChoice[] = [];
    neighbors(wc).forEach(({ o, seg }) => {
      if (o.type === 'wc' || o.type === 'stair' || o.type === 'lightwell') return;
      // WC duy nhất của nhà mà mở vào phòng ngủ → cả nhà phải đi qua phòng ngủ: không chấp nhận
      const bedPen = wcs.length >= 2 && wc !== wcs[0] ? 6 : 70;
      let base = o.type === 'corridor' ? 0 : o.type === 'bedroom' || o.type === 'master' ? bedPen : o.type === 'common' ? 12 : o.type === 'storage' ? 30
        : o.type === 'living' ? 18 : o.type === 'dining' ? 25 : o.type === 'kitchen' ? 30 : o.type === 'porch' ? 35 : o.type === 'worship' ? 1000 : 20;
      if (o === mainRoom) base += 15;
      const L = seg.b - seg.a;
      const pos = L < 1.6 ? [(seg.a + seg.b) / 2] : [seg.a + 0.55, (seg.a + seg.b) / 2, seg.b - 0.55];
      pos.forEach(c => {
        const [ox, oy] = outward(seg.side);
        const pt: [number, number] = seg.side === 'front' || seg.side === 'rear' ? [c, seg.side === 'front' ? wc.y : wc.y + wc.h] : [seg.side === 'left' ? wc.x : wc.x + wc.w, c];
        const front: [number, number] = [pt[0] + ox * 0.5, pt[1] + oy * 0.5];
        let pen = base, why = '';
        if (route) {
          const d = distPoly(front, route);
          if (d < 1.4) { pen += 60 + 60 * (1.4 - d); why = 'nằm trên lối ra bếp phụ'; }
        }
        if (mainPt && Math.hypot(front[0] - mainPt[0], front[1] - mainPt[1]) < 3) pen += 20;
        list.push({ room: wc, to: o, seg, c, pen, why });
      });
    });
    if (!list.length) exteriorSegs(wc).forEach(seg => list.push({ room: wc, to: wc, seg, c: (seg.a + seg.b) / 2, pen: 40, why: '' }));
    return list.sort((a, b) => a.pen - b.pen);
  };

  /* Sảnh đệm WC: khi WC chỉ có thể mở ra bếp / bàn ăn / phòng khách / phòng ngủ → cắt 1 dải 1,2m của phòng bên cạnh làm sảnh đệm */
  wcs.forEach(wc => {
    const best = wcOptions(wc, null)[0];
    if (best && best.pen < 18) return;
    const carve = neighbors(wc).filter(n => ['kitchen', 'dining', 'living', 'common'].includes(n.o.type)).map(n => {
      const P = n.o, sd = opp(n.seg.side);            // cạnh của P giáp WC
      const horizCut = sd === 'left' || sd === 'right';   // dải đứng (cắt theo chiều ngang)
      const span = horizCut ? P.w : P.h;
      if (span < 3.4) return null;
      const strip: Rect = horizCut ? { x: sd === 'left' ? P.x : P.x + P.w - 1.2, y: P.y, w: 1.2, h: P.h } : { x: P.x, y: sd === 'front' ? P.y : P.y + P.h - 1.2, w: P.w, h: 1.2 };
      const touchHub = rooms.some(o => o !== P && o !== wc && !o.outside && isHub(o) && (() => { const sh = shared(strip, o); return !!sh && sh.b - sh.a >= 0.9; })());
      const wcSeg = shared(wc, strip);
      if (!wcSeg || wcSeg.b - wcSeg.a < 0.8) return null;
      if (!touchHub && !isHub(P)) return null;
      return { P, sd, strip, pen: (P.type === 'kitchen' ? 0 : 3) + (touchHub ? 0 : 6) };
    }).filter(Boolean).sort((a: any, b: any) => a.pen - b.pen)[0] as any;
    if (!carve) return;
    const { P, sd, strip } = carve;
    const lobbyTxt = `Thêm sảnh đệm 1,2m (lấy từ ${P.name}) trước ${wc.name}: cửa WC không mở thẳng ra ${P.type === 'kitchen' ? 'bếp' : P.type === 'dining' ? 'bàn ăn' : P.name}, cả nhà đi WC không qua phòng ngủ.`;
    if (!applyAdvice) { advice.push(lobbyTxt); return; }
    if (sd === 'left') { P.x = r1(P.x + 1.2); P.w = r1(P.w - 1.2); }
    else if (sd === 'right') { P.w = r1(P.w - 1.2); }
    else if (sd === 'front') { P.y = r1(P.y + 1.2); P.h = r1(P.h - 1.2); }
    else { P.h = r1(P.h - 1.2); }
    rooms.push({ id: `lobby_${wc.id}`, type: 'corridor', name: 'Sảnh đệm WC', x: r1(strip.x), y: r1(strip.y), w: r1(strip.w), h: r1(strip.h), doors: [], windows: [], items: [] });
    sketchNotes.push(`↺ Đã áp dụng đề xuất: ${lobbyTxt}`);
    advice.push(lobbyTxt);
  });

  type SvcChoice = { owner: PlanRoom; seg: Seg; c: number; route: [number, number][]; pen: number; wc: WcChoice[] };
  let svc: SvcChoice | null = null;
  let sketchSvcPen: { pen: number; viaWc: boolean; ownerBad: boolean } | null = null;
  let svcSketch: SvcChoice | null = null, svcOpt: SvcChoice | null = null;
  const svcCands: SvcChoice[] = [];
  const owners = needService && startRoom
    ? inside().filter(r => r === kitchen || r === dining || (r.type === 'corridor' && (!kitchen || shared(r, kitchen))))
    : [];
  const windPen = (s: Side) => { const b = sideBearing(s); return b === 'Nam' || b === 'Đông Nam' ? 6 : b === 'Đông' || b === 'Tây Nam' ? 3 : 0; };
  const pondSide = CANH[outdoor.find(o => o.loai === 'ao')?.canh];
  const skSvcSide: Side | undefined = CANH[cuaPhuSk?.canh] || CANH[bepPhu?.canh];
  const evalSvc = (owner: PlanRoom, seg: Seg, c: number): SvcChoice => {
    const pt: [number, number] = seg.side === 'front' || seg.side === 'rear' ? [c, seg.side === 'front' ? owner.y : owner.y + owner.h] : [seg.side === 'left' ? owner.x : owner.x + owner.w, c];
    const route: [number, number][] = [center(startRoom!)];
    if (owner !== startRoom) {
      const sh = shared(startRoom!, owner);
      if (sh) route.push(sh.side === 'front' || sh.side === 'rear' ? [(sh.a + sh.b) / 2, sh.side === 'front' ? startRoom!.y : startRoom!.y + startRoom!.h] : [sh.side === 'left' ? startRoom!.x : startRoom!.x + startRoom!.w, (sh.a + sh.b) / 2]);
      route.push(center(owner));
    }
    route.push(pt);
    const [ox, oy] = outward(seg.side);
    route.push([pt[0] + ox * 2.5, pt[1] + oy * 2.5]);
    let pen = owner === kitchen ? 0 : owner === dining ? 4 : 6;
    if (seg.side === 'front') pen += 25;
    pen += windPen(seg.side);
    if (pondSide === seg.side) pen += 10;
    for (let i = 1; i < route.length - 1; i++) pen += 0.5 * Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]);
    if (mainPt && seg.side === opp(mainSide) && Math.abs((seg.side === 'front' || seg.side === 'rear' ? pt[0] - mainPt[0] : pt[1] - mainPt[1])) < 0.8) pen += 15;
    if (skSvcSide && skSvcSide === seg.side) pen -= 4;
    const wcPick = wcs.map(w => wcOptions(w, route)[0]).filter(Boolean);
    const total = pen + wcPick.reduce((n, w) => n + w.pen, 0);
    return { owner, seg, c, route, pen: total, wc: wcPick };
  };
  if (needService && startRoom) {
    owners.forEach(owner => exteriorSegs(owner).forEach(seg => {
      for (let c = seg.a + 0.6; c <= seg.b - 0.6 + EPS; c += 0.5) svcCands.push(evalSvc(owner, seg, r1(c)));
    }));
    svc = svcCands.sort((a, b) => a.pen - b.pen)[0] || null;
    // So với ý phác thảo: cửa phụ khách vẽ (phòng + cạnh) có đi qua trước cửa WC không
    const skOwner = findRoom(cuaPhuSk?.phong);
    if (skSvcSide) {
      const route0: [number, number][] = [];
      if (skOwner && !skOwner.outside) {
        const seg0 = isExteriorSeg(skOwner, skSvcSide)[0] || { side: skSvcSide, a: sideRange(skOwner, skSvcSide)[0], b: sideRange(skOwner, skSvcSide)[1] };
        const pt: [number, number] = skSvcSide === 'front' || skSvcSide === 'rear' ? [(seg0.a + seg0.b) / 2, skSvcSide === 'front' ? skOwner.y : skOwner.y + skOwner.h] : [skSvcSide === 'left' ? skOwner.x : skOwner.x + skOwner.w, (seg0.a + seg0.b) / 2];
        route0.push(center(startRoom), center(skOwner), pt);
        const viaWc = skOwner.type === 'wc' || wcs.some(w => { const best = wcOptions(w, null)[0]; if (!best) return false; const pt2: [number, number] = best.seg.side === 'front' || best.seg.side === 'rear' ? [best.c, best.seg.side === 'front' ? w.y : w.y + w.h] : [best.seg.side === 'left' ? w.x : w.x + w.w, best.c]; return distPoly(pt2, route0) < 1.4 || shared(w, skOwner) !== null; });
        sketchSvcPen = { pen: 0, viaWc, ownerBad: ['wc', 'bedroom', 'master', 'worship'].includes(skOwner.type) };
      } else {
        // khách chỉ ghi "cửa ra bên phải/sau" → kiểm tra cạnh đó: có WC nằm sát cạnh trên lối đi không
        const viaWc = wcs.some(w => isExteriorSeg(w, skSvcSide).length > 0 && (!kitchen || isExteriorSeg(kitchen, skSvcSide).length === 0));
        sketchSvcPen = { pen: 0, viaWc, ownerBad: false };
      }
    }
    // Cửa phụ ĐÚNG như gia chủ vẽ (phòng + phía) — dùng khi chưa bấm "Theo đề xuất KTS"
    if (skSvcSide) {
      const ownerList = skOwner && !skOwner.outside ? [skOwner] : owners;
      const cands = ownerList.flatMap(o => isExteriorSeg(o, skSvcSide).map(seg => evalSvc(o, seg, r1((seg.a + seg.b) / 2))));
      svcSketch = cands.sort((a, b) => a.pen - b.pen)[0] || null;
    }
    svcOpt = svc;
    if (!applyAdvice && svcSketch) svc = svcSketch;
  }
  // gắn cửa WC theo phương án chọn (hoặc tốt nhất khi không có bếp phụ)
  const wcChosen: WcChoice[] = svc ? svc.wc : wcs.map(w => wcOptions(w, null)[0]).filter(Boolean);
  wcChosen.forEach(ch => {
    addDoor(ch.room, ch.seg, ch.c, 0.7);
    if (ch.to.type === 'bedroom' || ch.to.type === 'master') { ch.room.name = ch.room.name.match(/riêng/i) ? ch.room.name : `${ch.room.name} (riêng ${ch.to.name})`; }
    const toName = ch.to === ch.room ? 'ra ngoài' : `vào ${ch.to.name}`;
    const bad = ch.to.type === 'kitchen' || ch.to.type === 'dining' || ch.to === mainRoom || ((ch.to.type === 'bedroom' || ch.to.type === 'master') && wcs.length < 2);
    if (bad) {
      checks.push({ ok: false, text: `Cửa ${ch.room.name.split(' (')[0]} đang mở ${toName} (theo bố trí phác thảo) — xem mục TƯ VẤN KTS.` });
      if (!advice.some(a => a.includes('sảnh đệm'))) advice.push(`Cửa ${ch.room.name.split(' (')[0]} đang mở ${toName}: nên làm sảnh đệm hoặc đổi vị trí WC để cửa WC không mở ra bếp, bàn ăn, phòng ngủ.`);
    } else {
      sketchNotes.push(`✓ Cửa ${ch.room.name.split(' (')[0]} mở ${toName}: không mở ra bếp, bàn ăn hay cửa chính${svc ? ', không nằm trên lối ra bếp phụ' : ''}.`);
    }
  });
  if (svc) {
    const d = addDoor(svc.owner, svc.seg, svc.c, 0.9, { service: true });
    const pt = doorPoint(svc.owner, d);
    svc.route[svc.route.length - 2] = pt;
    const wcDist = wcChosen.length ? Math.min(...wcChosen.map(ch => {
      const [ox, oy] = outward(ch.seg.side);
      const p: [number, number] = ch.seg.side === 'front' || ch.seg.side === 'rear' ? [ch.c, ch.seg.side === 'front' ? ch.room.y : ch.room.y + ch.room.h] : [ch.seg.side === 'left' ? ch.room.x : ch.room.x + ch.room.w, ch.c];
      return distPoly([p[0] + ox * 0.5, p[1] + oy * 0.5], svc!.route);
    })) : 99;
    const sideTxt = `tường ${SIDE_VI[svc.seg.side]} của ${svc.owner.name} (hướng ${sideBearing(svc.seg.side)})`;
    const optTxt = svcOpt ? `tường ${SIDE_VI[svcOpt.seg.side]} của ${svcOpt.owner.name} (hướng ${sideBearing(svcOpt.seg.side)})` : '';
    const sketchBad = !!sketchSvcPen && (sketchSvcPen.viaWc || sketchSvcPen.ownerBad);
    const optDiffers = !!svcOpt && !!svcSketch && (svcOpt.owner !== svcSketch.owner || svcOpt.seg.side !== svcSketch.seg.side);
    if (!applyAdvice && svcSketch) {
      sketchNotes.push(`✓ Giữ cửa phụ ra bếp phụ ở ${sideTxt} như phác thảo.`);
      if (optDiffers && (sketchBad || svcOpt!.pen < svcSketch.pen - 3)) advice.push(`Chuyển cửa phụ ra ${optTxt}${sketchBad ? ': lối từ bếp ra bếp phụ hiện đi ngang trước cửa WC' : ': lối đi ngắn hơn'}; đề xuất đi thẳng từ bếp ra, không qua WC, khói bếp củi không theo gió vào nhà.`);
    } else if (applyAdvice && optDiffers) {
      sketchNotes.push(`↺ Đã áp dụng đề xuất: cửa phụ chuyển ra ${sideTxt}${sketchBad ? ' (phác thảo đi ngang trước cửa WC)' : ''}.`);
      advice.push(`Cửa phụ chuyển ra ${sideTxt}: từ bếp đi thẳng ra bếp phụ, không qua trước cửa WC.`);
    } else {
      sketchNotes.push(`✓ Cửa phụ ra bếp phụ ở ${sideTxt}${skSvcSide ? ' như phác thảo' : ' (phác thảo chưa vẽ cửa phụ — tool chọn chỗ tốt nhất)'}.`);
    }
    checks.push({ ok: wcDist >= 1.4, text: wcDist >= 1.4 ? `Lối ra bếp phụ không đi qua trước cửa WC (cách ${r1(wcDist)}m) ✓` : `Lối ra bếp phụ còn gần cửa WC (${r1(wcDist)}m) — nên làm vách ngăn che cửa WC.` });
    const wp = windPen(svc.seg.side);
    checks.push({ ok: wp < 6, text: wp < 6 ? `Bếp phụ đặt phía ${sideBearing(svc.seg.side)}: không nằm đầu hướng gió chính mùa hè (Nam / Đông Nam), khói củi ít bay vào nhà ✓` : `Bếp phụ phía ${sideBearing(svc.seg.side)} nằm đầu hướng gió — cần ống khói cao hơn mái nhà ≥ 0,6m.` });
  }

  /* ── 7. Cửa các phòng còn lại ── */
  const PREF: Record<string, Partial<Record<RoomType, number>>> = {
    bedroom: { corridor: 0, living: 4, common: 5, dining: 6, kitchen: 20, porch: 25 },
    master: { corridor: 0, living: 4, common: 5, dining: 6, kitchen: 20, porch: 25 },
    worship: { living: 0, corridor: 1, common: 4, dining: 6, porch: 20 },
    common: { corridor: 0, living: 2, dining: 4, common: 3, porch: 10 },
    storage: { corridor: 0, kitchen: 1, dining: 3, common: 3, living: 6 },
    kitchen: { dining: 0, corridor: 1, common: 4, living: 6 },
    garage: { corridor: 0, living: 3, common: 3, kitchen: 5 },
    stair: { corridor: 0, living: 0, common: 0, dining: 1 },
    lightwell: { corridor: 0, living: 0, dining: 0, common: 0 }
  };
  const wcDoorPts = () => wcs.flatMap(w => w.doors.map(d => doorPoint(w, d)));
  inside().filter(r => r.type !== 'wc' && !isHub(r)).forEach(r => {
    const pref = PREF[r.type] || PREF.common;
    const opts = neighbors(r).filter(n => pref[n.o.type] !== undefined).map(n => {
      let p = pref[n.o.type] as number;
      const c = (n.seg.a + n.seg.b) / 2;
      const pt: [number, number] = n.seg.side === 'front' || n.seg.side === 'rear' ? [c, n.seg.side === 'front' ? r.y : r.y + r.h] : [n.seg.side === 'left' ? r.x : r.x + r.w, c];
      if (wcDoorPts().some(q => Math.hypot(q[0] - pt[0], q[1] - pt[1]) < 1.5)) p += 8;     // cửa phòng đối diện cửa WC
      if (mainPt && r.type !== 'worship' && Math.hypot(mainPt[0] - pt[0], mainPt[1] - pt[1]) < 1.5) p += 6;
      return { ...n, p, c };
    }).sort((a, b) => a.p - b.p);
    const o = opts[0];
    if (r.type === 'kitchen' && o && o.o.type === 'dining') { addDoor(r, o.seg, o.c, Math.min(2.0, o.seg.b - o.seg.a - 0.4), { open: true }); return; }
    if (o) {
      const offset = o.seg.b - o.seg.a > 2 ? o.seg.a + 0.55 : o.c;
      addDoor(r, o.seg, r.type === 'stair' ? o.c : offset, r.type === 'worship' ? 0.9 : r.type === 'garage' ? 1.0 : 0.8, r.type === 'stair' || r.type === 'lightwell' ? { open: true } : {});
    } else if (r.type !== 'lightwell') {
      const seg = exteriorSegs(r)[0];
      if (seg) { addDoor(r, seg, (seg.a + seg.b) / 2, 0.9); checks.push({ ok: false, text: `${r.name}: không giáp sảnh/phòng khách nên phải mở cửa ra ngoài — nên chừa lối đi trong nhà.` }); }
    }
  });
  // giữa các không gian chung: ô mở rộng (không cánh)
  const hubs = inside().filter(isHub);
  hubs.forEach((a, i) => hubs.slice(i + 1).forEach(b => {
    const sh = shared(a, b);
    if (!sh || sh.b - sh.a < 1.2 || hasDoorBetween(a, b)) return;
    addDoor(a, sh, (sh.a + sh.b) / 2, Math.min(2.4, sh.b - sh.a - 0.3), { open: true });
  }));
  // phòng chung không nối được không gian chung nào → cửa thường
  hubs.forEach(h => {
    if (h === mainRoom) return;
    const linked = hubs.some(o => o !== h && hasDoorBetween(h, o)) || rooms.some(o => o !== h && hasDoorBetween(h, o) && o.type === 'kitchen');
    if (linked) return;
    const n = neighbors(h).filter(x => isHub(x.o) || x.o.type === 'porch')[0];
    if (n) addDoor(h, n.seg, (n.seg.a + n.seg.b) / 2, 0.9);
  });

  /* ── 8. Cửa sổ (chỉ tường ngoài) ── */
  inside().forEach(r => {
    if (r.type === 'corridor' && r.w * r.h < 6) return;
    const sides = (['front', 'rear', 'left', 'right'] as Side[]).filter(s => {
      const ext = isExteriorSeg(r, s).reduce((n, g) => n + (g.b - g.a), 0);
      const len = sideRange(r, s)[1] - sideRange(r, s)[0];
      return ext >= Math.min(1.2, len * 0.6) && !(r.doors.some(d => d.side === s && (d.main || d.service)) && ext < 2.6);
    });
    r.windows = (r.type === 'wc' ? sides.slice(0, 1) : sides.slice(0, 2));
  });

  /* ── 8b. Hướng phòng gia chủ yêu cầu (ô nhập từng phòng) ── */
  (Array.isArray(sk.ghi_chu_o_nhap) ? sk.ghi_chu_o_nhap : []).forEach((t: string) => sketchNotes.push(`? ${t}`));
  (Array.isArray(sk.huong_phong) ? sk.huong_phong : []).forEach((h: any) => {
    const room = rooms.find(r => meta.get(r)?.ten === h.ten);
    if (!room || !h.huong) return;
    const sides = (['front', 'rear', 'left', 'right'] as Side[]).filter(sd => isExteriorSeg(room, sd).length);
    const okSide = sides.find(sd => sideBearing(sd) === h.huong);
    if (okSide) { if (!room.windows.includes(okSide)) room.windows = [...room.windows, okSide].slice(-2); sketchNotes.push(`✓ ${h.ten}: cửa sổ hướng ${h.huong} như yêu cầu.`); }
    else sketchNotes.push(`? ${h.ten}: yêu cầu hướng ${h.huong}, nhưng vị trí hiện tại chỉ có tường ngoài hướng ${sides.map(sideBearing).join(', ') || '(không có)'} — anh/chị đổi vị trí phòng hoặc hướng.`);
  });

  /* ── 9. Hiên trước, bếp phụ, giếng, ao, vườn, lối vào ── */
  const extras: PlanRoom[] = [];
  const hien = sk.hien || {};
  let porchDepth = 0;
  if (hien.co) {
    porchDepth = clamp(num(hien.sau) || 2.0, 1.2, 4);
    const c0 = clamp(Math.round(Number(hien.tu_cot ?? 0)), 0, C - 1), c1 = clamp(Math.round(Number(hien.den_cot ?? C - 1)), c0, C - 1);
    extras.push({ id: 'porch_front', type: 'porch', name: 'Hiên · mái hiên', x: colX[c0], y: -porchDepth, w: r1(colX[c1 + 1] - colX[c0]), h: porchDepth, outside: true, doors: [], windows: [], items: [] });
  }
  const paths: { pts: [number, number][]; label: string; color: string }[] = [];
  let svcSide: Side | null = null;
  if (svc) {
    svcSide = svc.seg.side;
    const d = svc.owner.doors.find(x => x.service)!;
    const [dx, dy] = doorPoint(svc.owner, d);
    const walk = 2.5, kw = 3.2, kd = 3.0;
    const [ox, oy] = outward(svcSide);
    const horiz = svcSide === 'front' || svcSide === 'rear';
    const walkway: PlanRoom = horiz
      ? { id: 'walkway', type: 'walkway', name: 'Lối đi có mái che', x: r1(dx - 0.6), y: svcSide === 'rear' ? H : -walk, w: 1.2, h: walk, outside: true, doors: [], windows: [], items: [] }
      : { id: 'walkway', type: 'walkway', name: 'Lối đi có mái che', x: svcSide === 'right' ? W : -walk, y: r1(dy - 0.6), w: walk, h: 1.2, outside: true, doors: [], windows: [], items: [] };
    const ok: PlanRoom = horiz
      ? { id: 'out_kitchen', type: 'outkitchen', name: 'Bếp phụ (đun củi)', x: r1(dx - kw / 2), y: svcSide === 'rear' ? H + walk : -walk - kd, w: kw, h: kd, outside: true, doors: [], windows: [], items: [] }
      : { id: 'out_kitchen', type: 'outkitchen', name: 'Bếp phụ (đun củi)', x: svcSide === 'right' ? W + walk : -walk - kd, y: r1(dy - kw / 2), w: kd, h: kw, outside: true, doors: [], windows: [], items: [] };
    // bếp củi: tựa vách xa nhà, miệng quay về phía nhà/lối đi
    const far: Side = svcSide;
    ok.items.push(far === 'rear' ? { kind: 'stove', x: ok.x + 0.6, y: ok.y + ok.h - 0.75, w: 1.2, h: 0.6, facing: 'front', note: 'bếp củi' }
      : far === 'front' ? { kind: 'stove', x: ok.x + 0.6, y: ok.y + 0.15, w: 1.2, h: 0.6, facing: 'rear', note: 'bếp củi' }
      : far === 'right' ? { kind: 'stove', x: ok.x + ok.w - 0.75, y: ok.y + 0.6, w: 0.6, h: 1.2, facing: 'left', note: 'bếp củi' }
      : { kind: 'stove', x: ok.x + 0.15, y: ok.y + 0.6, w: 0.6, h: 1.2, facing: 'right', note: 'bếp củi' });
    extras.push(walkway, ok);
    if (outdoor.some(o => o.loai === 'gieng') || bepPhu) {
      const well: PlanRoom = horiz
        ? { id: 'well', type: 'well', name: outdoor.some(o => o.loai === 'gieng') ? 'Giếng · chỗ rửa' : 'Chỗ rửa', x: r1(ok.x + ok.w + 0.5), y: r1(ok.y + 0.9), w: 1.4, h: 1.4, outside: true, doors: [], windows: [], items: [] }
        : { id: 'well', type: 'well', name: outdoor.some(o => o.loai === 'gieng') ? 'Giếng · chỗ rửa' : 'Chỗ rửa', x: r1(ok.x + 0.8), y: r1(ok.y + ok.h + 0.5), w: 1.4, h: 1.4, outside: true, doors: [], windows: [], items: [] };
      extras.push(well);
    }
    paths.push({ pts: [...svc.route.slice(0, -1), center(ok)], label: 'Lối ra bếp phụ', color: '#ea580c' });
    notes.push(`Bếp phụ (đun củi): cách nhà ${walk}m, có mái che lối đi; ống khói cao hơn mái nhà ≥ 0,6m; nền lát gạch, chống cháy lan sang nhà.`);
  }
  const usedSide = new Set<Side>(svcSide ? [svcSide] : []);
  if (hien.co) usedSide.add('front');
  const sideStrip = (id: string, type: RoomType, name: string, s: Side, depth: number) => {
    const gap = usedSide.has(s) ? (svcSide === s ? 2.5 + 3.2 + 2.2 : porchDepth + 1.5) : 1.5;
    usedSide.add(s);
    const room: PlanRoom = s === 'left' ? { id, type, name, x: -gap - depth, y: r1(H * 0.1), w: depth, h: r1(H * 0.8), outside: true, doors: [], windows: [], items: [] }
      : s === 'right' ? { id, type, name, x: W + gap, y: r1(H * 0.1), w: depth, h: r1(H * 0.8), outside: true, doors: [], windows: [], items: [] }
      : s === 'rear' ? { id, type, name, x: r1(W * 0.1), y: H + gap, w: r1(W * 0.8), h: depth, outside: true, doors: [], windows: [], items: [] }
      : { id, type, name, x: r1(W * 0.1), y: -gap - depth, w: r1(W * 0.8), h: depth, outside: true, doors: [], windows: [], items: [] };
    extras.push(room);
  };
  outdoor.forEach((o, i) => {
    const s = CANH[o.canh]; if (!s) return;
    if (o.loai === 'ao') sideStrip(`pond_${i}`, 'pond', 'Ao', s, 3.5);
    else if (o.loai === 'vuon' || o.loai === 'cay_xanh') sideStrip(`garden_${i}`, 'garden', o.loai === 'vuon' ? 'Vườn' : 'Cây xanh', s, 2.5);
    else if (o.loai === 'san') sideStrip(`yard_${i}`, 'yard', 'Sân', s, 4);
    else if (o.loai === 'chuong_trai') sideStrip(`farm_${i}`, 'yard', 'Chuồng trại (cuối hướng gió)', s, 3);
    else if (o.loai === 'gieng' && !svc) sideStrip(`well_${i}`, 'well', 'Giếng', s, 1.4);
  });

  /* ── 10. Ranh đất ── */
  const all = [...rooms, ...extras];
  let minX = Math.min(0, ...all.map(r => r.x)) - 1.0, maxX = Math.max(W, ...all.map(r => r.x + r.w)) + 1.0;
  let minY = Math.min(0, ...all.map(r => r.y)) - 1.5, maxY = Math.max(H, ...all.map(r => r.y + r.h)) + 1.0;
  const loi = sk.loi_vao || {};
  const roadSide: Side = CANH[loi.canh] || 'front';
  if (roadSide === 'left') minX -= 1.8; else if (roadSide === 'right') maxX += 1.8; else if (roadSide === 'rear') maxY += 1.8; else minY -= 1.5;
  const lotWin = Number(input.widthM) || 0, lotLin = Number(input.lengthM) || 0;
  if (lotWin > maxX - minX + 0.5) { const add = lotWin - (maxX - minX); const k = roadSide === 'left' ? 0.65 : roadSide === 'right' ? 0.35 : 0.5; minX -= add * k; maxX += add * (1 - k); }
  if (lotLin > maxY - minY + 0.5) { const add = lotLin - (maxY - minY); minY -= add * 0.5; maxY += add * 0.5; }
  const lot = { x: r1(minX), y: r1(minY), w: r1(maxX - minX), h: r1(maxY - minY) };

  // lối vào khách: từ đường → dọc hông → trước hiên → cửa chính
  if (mainPt) {
    const yFront = -(porchDepth || 0) - 0.8;
    const pts: [number, number][] = [];
    // điểm xuất phát trên đường: tránh cắt qua ao / vườn bên hông
    const sideObs = extras.filter(e => (e.type === 'pond' || e.type === 'garden') && (roadSide === 'left' ? e.x < 0 : roadSide === 'right' ? e.x >= W : false));
    const obsTop = sideObs.length ? Math.max(...sideObs.map(e => e.y + e.h)) : -99;
    const obsBot = sideObs.length ? Math.min(...sideObs.map(e => e.y)) : 99;
    let startY = loi.tu === 'sau' ? H - 1 : loi.tu === 'giua' ? H / 2 : yFront;
    if (startY > obsBot - 0.5 && startY < obsTop + 0.5) startY = loi.tu === 'truoc' ? obsBot - 0.8 : obsTop + 0.8;
    if (roadSide === 'left') pts.push([lot.x, startY], [Math.min(-1.0, ...extras.filter(e => e.type === 'pond' && e.x < 0).map(e => e.x + e.w + 0.8)), startY], [Math.min(-1.0, ...extras.filter(e => e.type === 'pond' && e.x < 0).map(e => e.x + e.w + 0.8)), yFront], [mainPt[0], yFront]);
    else if (roadSide === 'right') pts.push([lot.x + lot.w, startY], [W + 1.0, startY], [W + 1.0, yFront], [mainPt[0], yFront]);
    else if (roadSide === 'rear') pts.push([mainPt[0] < W / 2 ? -1.0 : W + 1.0, lot.y + lot.h], [mainPt[0] < W / 2 ? -1.0 : W + 1.0, yFront], [mainPt[0], yFront]);
    else pts.push([mainPt[0], lot.y]);
    pts.push(mainPt);
    paths.push({ pts, label: 'Lối vào', color: '#2563eb' });
    if (roadSide !== 'front') sketchNotes.push(`✓ Lối vào từ đường phía ${SIDE_VI[roadSide]}, đi dọc hông nhà ra trước hiên rồi vào cửa chính như phác thảo.`);
  }
  rooms.push(...extras);

  /* ── 11. Cung cho từng phòng ── */
  rooms.forEach(r => {
    if (r.outside) return;
    const c = cellOf(r.x + r.w / 2, r.y + r.h / 2);
    r.sector = cellDir(c.col, c.row);
    const i = info(r.sector); r.star = i.star; r.good = i.good;
  });
  // master: phòng ngủ ≥12m² ở cung tốt nhất
  const beds = inside().filter(r => r.type === 'bedroom');
  const master = beds.filter(r => r.w * r.h >= 12 && Math.min(r.w, r.h) >= 3).sort((a, b) => dirScore(b.sector || '') - dirScore(a.sector || '') || b.w * b.h - a.w * a.h)[0];
  if (master) master.type = 'master';

  /* ── 12. Nội thất + phong thủy ── */
  const wallShares = (r: PlanRoom, s: Side, types: RoomType[]) => rooms.some(o => o !== r && !o.outside && types.includes(o.type) && shared(r, o)?.side === s);
  const faceScore = (s: Side) => dirScore(sideBearing(s));
  const solidSides = (r: PlanRoom) => (['front', 'rear', 'left', 'right'] as Side[]).filter(s => !r.windows.includes(s) && !r.doors.some(d => d.side === s));

  // phòng khách
  inside().filter(r => r.type === 'living').forEach(r => {
    const horiz = r.w >= r.h;
    if (horiz) {
      r.items.push({ kind: 'sofa', x: r.x + r.w * 0.3, y: r.y + r.h - 1.3, w: Math.min(2.6, r.w * 0.4), h: 0.9 });
      r.items.push({ kind: 'dining', x: r.x + r.w * 0.33, y: r.y + r.h - 2.6, w: Math.min(1.4, r.w * 0.25), h: 0.7, note: 'bàn trà' });
      r.items.push({ kind: 'tv', x: r.x + r.w * 0.3, y: r.y + 0.5, w: Math.min(2.2, r.w * 0.35), h: 0.4 });
    } else {
      r.items.push({ kind: 'sofa', x: r.x + 0.3, y: r.y + r.h * 0.35, w: 0.9, h: Math.min(2.4, r.h * 0.5) });
      r.items.push({ kind: 'tv', x: r.x + r.w - 0.5, y: r.y + r.h * 0.35, w: 0.4, h: Math.min(2.0, r.h * 0.45) });
    }
    if (r.w >= 4) r.items.push({ kind: 'plant', x: r.x + 0.3, y: r.y + 0.3, w: 0.5, h: 0.5 });
  });
  // phòng ăn
  inside().filter(r => r.type === 'dining').forEach(r => {
    const tw = Math.min(1.8, r.w - 1.4), th = Math.min(1.0, r.h - 1.4);
    if (tw >= 0.8 && th >= 0.6) r.items.push({ kind: 'dining', x: r.x + (r.w - tw) / 2, y: r.y + (r.h - th) / 2, w: tw, h: th });
  });
  // sảnh có tủ giày cạnh cửa chính
  if (mainRoom && mainRoom.type === 'corridor' && mainDoor) {
    const t = meta.get(mainRoom)?.ten || '';
    if (/tu|giay|ao mu/.test(strip(t)) || mainRoom.w * mainRoom.h >= 4) {
      const L = Math.min(1.8, mainRoom.w * 0.4);
      mainRoom.items.push({ kind: 'wardrobe', x: mainDoor.at > mainRoom.w / 2 ? mainRoom.x + 0.1 : mainRoom.x + mainRoom.w - L - 0.1, y: mainRoom.y + mainRoom.h - 0.45, w: L, h: 0.4, note: 'tủ giày · áo mũ' });
    }
  }
  // bếp: bệ bếp tựa tường đặc, không tựa vách WC / phòng thờ, miệng bếp hướng tốt
  const kRoom = inside().find(r => r.type === 'kitchen');
  if (kRoom) {
    // đoạn tường trống dài nhất của mỗi cạnh (trừ cửa) — bệ bếp cần ≥ 2,4m
    const freeRun = (sd: Side): [number, number] => {
      const len = sd === 'front' || sd === 'rear' ? kRoom.w : kRoom.h;
      const ds = kRoom.doors.filter(d => d.side === sd).map(d => [d.at - 0.15, d.at + d.width + 0.15]).sort((p, q) => p[0] - q[0]);
      let best: [number, number] = [0, 0], cur = 0;
      ds.forEach(([a, b]) => { if (a - cur > best[1] - best[0]) best = [cur, a]; cur = Math.max(cur, b); });
      if (len - cur > best[1] - best[0]) best = [cur, len];
      return best;
    };
    const cands = (['front', 'rear', 'left', 'right'] as Side[]).filter(sd => { const [a, b] = freeRun(sd); return b - a >= 2.4; });
    const score = (sd: Side) => (isExteriorSeg(kRoom, sd).length ? 3 : 0) - (wallShares(kRoom, sd, ['worship']) ? 12 : 0) - (wallShares(kRoom, sd, ['wc']) ? 6 : 0) + 1.5 * faceScore(opp(sd)) - (kRoom.doors.some(d => d.side === sd) ? 1 : 0);
    const wallS = cands.sort((a, b) => score(b) - score(a))[0] || 'rear';
    const horiz = wallS === 'front' || wallS === 'rear';
    const [ra, rb] = freeRun(wallS);
    const L = Math.min(rb - ra - 0.2, 3.6);
    const start = ra + (rb - ra - L) / 2;
    const cx = horiz ? kRoom.x + start : wallS === 'left' ? kRoom.x : kRoom.x + kRoom.w - 0.6;
    const cy = horiz ? (wallS === 'front' ? kRoom.y : kRoom.y + kRoom.h - 0.6) : kRoom.y + start;
    kRoom.items.push({ kind: 'counter', x: cx, y: cy, w: horiz ? L : 0.6, h: horiz ? 0.6 : L });
    const face = opp(wallS);
    kRoom.items.push(horiz ? { kind: 'stove', x: cx + 0.2, y: cy + 0.03, w: 0.8, h: 0.55, facing: face } : { kind: 'stove', x: cx + 0.02, y: cy + 0.2, w: 0.56, h: 0.8, facing: face });
    kRoom.items.push(horiz ? { kind: 'sink', x: cx + L - 0.8, y: cy + 0.05, w: 0.7, h: 0.5 } : { kind: 'sink', x: cx + 0.05, y: cy + L - 0.8, w: 0.5, h: 0.7 });
    if (kRoom.w * kRoom.h >= 8) kRoom.items.push({ kind: 'fridge', x: horiz ? (cx > kRoom.x + 0.8 ? kRoom.x + 0.1 : kRoom.x + kRoom.w - 0.8) : kRoom.x + kRoom.w / 2 - 0.35, y: horiz ? kRoom.y + kRoom.h / 2 - 0.35 : (cy > kRoom.y + 0.8 ? kRoom.y + 0.1 : kRoom.y + kRoom.h - 0.8), w: 0.7, h: 0.7 });
    notes.push(`Bếp chính: ở cung ${kRoom.sector}${kRoom.star ? ` (${kRoom.star}${kRoom.good === false ? ' – cung xấu: tọa hung ✓' : kRoom.good ? ' – cung tốt, cân nhắc' : ''})` : ''}; bệ bếp tựa tường ${SIDE_VI[wallS]}${wallShares(kRoom, wallS, ['wc', 'worship']) ? '' : ' (không chung vách WC / phòng thờ)'}, miệng bếp quay hướng ${describe(face)}.`);
    if (mainPt && kRoom.doors.some(d => d.open) && Math.abs(center(kRoom)[0] - mainPt[0]) < kRoom.w / 2 && mainSide === 'front') notes.push('Bếp nằm thẳng trục cửa chính → nên có vách/tủ trang trí che tầm nhìn từ cửa vào bếp.');
  }
  // phòng thờ
  inside().filter(r => r.type === 'worship').forEach(r => {
    const sol = solidSides(r);
    const sc = (s: Side) => faceScore(opp(s)) - (wallShares(r, s, ['wc']) ? 20 : 0) - (wallShares(r, s, ['kitchen']) ? 8 : 0) - (s === 'front' ? 1 : 0);
    const back = (sol.length ? sol : (['rear', 'left', 'right', 'front'] as Side[])).sort((a, b) => sc(b) - sc(a))[0];
    const aw = Math.min(1.97, (back === 'front' || back === 'rear' ? r.w : r.h) - 0.6), ad = 0.61;
    const horiz = back === 'front' || back === 'rear';
    const ax = back === 'left' ? r.x + 0.05 : back === 'right' ? r.x + r.w - ad - 0.05 : r.x + (r.w - aw) / 2;
    const ay = back === 'front' ? r.y + 0.05 : back === 'rear' ? r.y + r.h - ad - 0.05 : r.y + (r.h - aw) / 2;
    r.items.push({ kind: 'altar', x: ax, y: ay, w: horiz ? aw : ad, h: horiz ? ad : aw, facing: opp(back), note: 'Bàn thờ 197×61' });
    notes.push(`Bàn thờ: tựa tường ${SIDE_VI[back]}, mặt quay hướng ${describe(opp(back))}${wallShares(r, back, ['wc', 'kitchen']) ? '' : '; không tựa vách WC/bếp'}.`);
    if (inside().some(o => o.type === 'wc' && shared(r, o))) checks.push({ ok: false, text: `${r.name} chung vách với WC — bàn thờ đã tránh vách đó; tốt nhất đổi WC sang chỗ khác khi thiết kế chi tiết.` });
    const meetsCol = (meta.get(r)?.raw?.ghi_chu || '').toString();
    if (/cot/.test(strip(meetsCol))) notes.push('Phòng thờ có cột giữa phòng (theo phác thảo): đặt bàn thờ lệch khỏi cột, không để cột chắn trước mặt bàn thờ.');
  });
  // phòng ngủ
  inside().filter(r => r.type === 'bedroom' || r.type === 'master').forEach(r => {
    const blocked = new Set<Side>([...r.windows, ...r.doors.map(d => d.side)]);
    const cand = (['left', 'right', 'front', 'rear'] as Side[]).filter(s => !blocked.has(s));
    const sc = (s: Side) => faceScore(s) * 2 - (wallShares(r, s, ['wc']) ? 6 : 0) - (wallShares(r, s, ['kitchen']) ? 6 : 0);
    const head = cand.length ? cand.sort((a, b) => sc(b) - sc(a))[0] : (r.windows[0] ? opp(r.windows[0]) : 'left');
    const bw = r.type === 'master' ? 1.8 : 1.6, bl = 2.0;
    const horiz = head === 'left' || head === 'right';
    let w: number, h: number, bx: number, by: number;
    if (horiz) { w = Math.min(bl, r.w - 0.6); h = Math.min(bw, r.h - 0.8); bx = head === 'left' ? r.x + 0.05 : r.x + r.w - w - 0.05; by = r.y + (r.h - h) / 2; }
    else { w = Math.min(bw, r.w - 0.8); h = Math.min(bl, r.h - 0.6); bx = r.x + (r.w - w) / 2; by = head === 'front' ? r.y + 0.05 : r.y + r.h - h - 0.05; }
    r.items.push({ kind: 'bed', x: bx, y: by, w, h, facing: opp(head), note: `đầu giường ${sideBearing(head)}` });
    const side = (['left', 'right', 'front', 'rear'] as Side[]).find(s => s !== head && !blocked.has(s) && s !== opp(head));
    if (side) {
      const vert = side === 'left' || side === 'right';
      const L = Math.min(1.8, (vert ? r.h : r.w) - 1.4);
      if (L >= 1.0) r.items.push(vert ? { kind: 'wardrobe', x: side === 'left' ? r.x + 0.05 : r.x + r.w - 0.6, y: r.y + (r.h - L) / 2, w: 0.55, h: L } : { kind: 'wardrobe', x: r.x + (r.w - L) / 2, y: side === 'front' ? r.y + 0.05 : r.y + r.h - 0.6, w: L, h: 0.55 });
    }
    if (r.type === 'master') notes.push(`Phòng ngủ chính ${r.name} (cung ${r.sector}${r.star ? ' – ' + r.star : ''}): đầu giường hướng ${describe(head)}${wallShares(r, head, ['wc', 'kitchen']) ? '' : ', không tựa vách WC/bếp'}.`);
  });
  // đọc sách / làm việc
  inside().filter(r => r.type === 'common' && /doc|sach|lam viec/.test(strip(r.name))).forEach(r => {
    r.items.push({ kind: 'desk', x: r.x + 0.3, y: r.y + r.h - 0.9, w: Math.min(1.6, r.w - 0.6), h: 0.6 });
    r.items.push({ kind: 'wardrobe', x: r.x + r.w - 0.5, y: r.y + 0.4, w: 0.4, h: Math.min(2.0, r.h - 0.8), note: 'giá sách' });
  });
  // WC
  inside().filter(r => r.type === 'wc').forEach(r => {
    const long = r.h >= r.w;
    r.items.push({ kind: 'toilet', x: r.x + (long ? (r.w - 0.4) / 2 : r.w - 0.75), y: r.y + (long ? r.h - 0.7 : (r.h - 0.4) / 2), w: long ? 0.4 : 0.65, h: long ? 0.65 : 0.4 });
    r.items.push({ kind: 'basin', x: r.x + 0.1, y: r.y + 0.15, w: 0.45, h: 0.35 });
    if (r.w * r.h >= 3) r.items.push({ kind: 'shower', x: r.x + r.w - 0.92, y: r.y + 0.02, w: 0.85, h: 0.85 });
    if (r.w * r.h >= 6) r.items.push({ kind: 'washer', x: r.x + 0.1, y: r.y + r.h - 0.75, w: 0.6, h: 0.6 });
    if (r.sector === 'Trung cung') checks.push({ ok: false, text: `${r.name} nằm trung cung (giữa nhà) — nên dời sát tường ngoài.` });
    notes.push(`${r.name.split(' (')[0]}: cung ${r.sector}${r.star ? ` (${r.star}${r.good === false ? ' – cung xấu: "trấn" hung khí ✓' : r.good ? ' – cung tốt: luôn đóng cửa, thông gió cưỡng bức' : ''})` : ''}.`);
    if (r.w * r.h > 10) checks.push({ ok: true, text: `${r.name.split(' (')[0]} rộng ${r1(r.w * r.h)}m²: đủ chia khu tắm – vệ sinh – giặt phơi riêng.` });
  });
  inside().filter(r => r.type === 'porch').forEach(r => r.items.push({ kind: 'plant', x: r.x + 0.3, y: r.y + 0.3, w: 0.5, h: 0.5 }));
  extras.filter(r => r.type === 'porch').forEach(r => { r.items.push({ kind: 'plant', x: r.x + 0.2, y: r.y + 0.2, w: 0.5, h: 0.5 }); r.items.push({ kind: 'plant', x: r.x + r.w - 0.7, y: r.y + 0.2, w: 0.5, h: 0.5 }); });
  if (!hasFs) notes.push('Chưa có dữ liệu cung mệnh gia chủ — bố trí theo công năng; xem phong thủy ở Bước A để tối ưu theo tuổi.');

  /* ── 13. Kiểm tra kỹ thuật & đối chiếu diện tích ghi tay ── */
  let keptArea = 0;
  rooms.forEach(r => {
    const s = meta.get(r);
    if (s?.area) {
      const a = r.w * r.h, dev = Math.abs(a - s.area) / s.area;
      if (dev > 0.15) sketchNotes.push(sk.nguon === 'o_nhap'
        ? `? ${r.name.split(' (')[0]}: yêu cầu ${num(s.raw?.rong) && num(s.raw?.dai) ? `${s.raw.dai}×${s.raw.rong}m = ` : ''}${s.area}m², vẽ được ${r.w}×${r.h}m = ${r1(a)}m² (tổng các phòng phải vừa nhà ${W}×${H}m) — anh/chị chỉnh kích thước hoặc vị trí phòng.`
        : `↺ ${r.name.split(' (')[0]}: ghi ${s.area}m², vẽ ra ${r1(a)}m² để khớp các phòng cạnh bên.`);
      else keptArea++;
    }
    const key = r.type === 'master' ? 'master' : r.type;
    const m = MIN[key];
    if (!m || r.outside) return;
    const area = r1(r.w * r.h), minSide = Math.min(r.w, r.h);
    const why: string[] = [];
    if (area < m.area - 0.05) why.push(`diện tích < ${m.area}m²`);
    if (minSide < m.width - 0.05) why.push(`cạnh ngắn < ${m.width}m`);
    if (why.length) checks.push({ ok: false, text: `${r.name}: ${r.w}×${r.h}m = ${area}m² — ${why.join(', ')} (khuyến nghị).` });
  });
  const ratio = W / H;
  if (withArea.length && (ratio > 3 || ratio < 0.33)) sketchNotes.push(`? Nhà ${W} × ${H} m khá ${ratio > 3 ? 'dài ngang' : 'hẹp'}: tổng diện tích ghi tay ~${Math.round(areaSum)}m²${Hfix ? ` với chiều sâu ${Hfix}m` : ''}. Anh/chị kiểm tra lại số đo hoặc diện tích ghi trên bản vẽ.`);
  if (sk.nguon === 'o_nhap') sketchNotes.unshift(`✓ Bố trí theo YÊU CẦU TỪNG PHÒNG của gia chủ: ${srs.filter(s => s.raw?.nguon === 'gia_chu').length} phòng đúng vị trí gia chủ chọn, ${srs.filter(s => s.raw?.nguon === 'tu_dong').length} phòng tool tự đặt.`);
  else sketchNotes.unshift(`✓ Vẽ theo phác thảo tự do: giữ đúng vị trí ${srs.length} phòng (lưới ${R} hàng × ${C} cột)${withArea.length ? `, ${keptArea}/${withArea.length} phòng khớp diện tích ghi tay (±15%)` : ''}.`);
  sketchNotes.unshift(dimsHouse
    ? (sk.nguon === 'o_nhap' ? `✓ Nhà ${W} × ${H} m theo kích thước gia chủ nhập.` : `✓ Nhà ${W} × ${H} m theo kích thước gia chủ nhập; bản vẽ tay chỉ dùng để xếp vị trí phòng${withArea.length ? ' (diện tích ghi tay quy đổi theo tỷ lệ)' : ''}.`)
    : `✓ Nhà ${W} × ${H} m${Hfix ? ` (chiều sâu ${Hfix}m theo phác thảo)` : ''}${Wfix ? ` (chiều ngang ${Wfix}m theo phác thảo)` : ''}${!Hfix && !Wfix && withArea.length ? ' — suy ra từ diện tích ghi trên bản vẽ' : ''}; phần đất còn lại làm sân vườn.`);
  (Array.isArray(sk.doc_khong_ro) ? sk.doc_khong_ro : []).slice(0, 4).forEach((t: any) => sketchNotes.push(`? Chưa đọc rõ: "${t}" — anh/chị kiểm tra lại phiếu.`));
  srs.filter(s => s.conf < 0.6).forEach(s => sketchNotes.push(`? "${s.ten || s.loai}" AI đọc chưa chắc — anh/chị kiểm tra lại.`));

  inside().filter(r => ['bedroom', 'master', 'living', 'kitchen', 'worship', 'common', 'dining'].includes(r.type) && !r.windows.length).forEach(r => {
    const openLit = rooms.some(o => o !== r && !o.outside && o.windows.length && hasDoorBetween(r, o) && (r.doors.some(d => d.open) || o.doors.some(d => d.open)));
    if (openLit && (r.type === 'dining' || r.type === 'living')) { checks.push({ ok: true, text: `${r.name}: lấy sáng qua ô mở thông với phòng bên cạnh; nên thêm ô kính mái.` }); return; }
    checks.push({ ok: false, text: `${r.name}: không có tường ngoài để mở cửa sổ — nên làm ô kính mái / giếng trời nhỏ lấy sáng.` });
  });
  const lotArea = r1(lot.w * lot.h);
  const footprint = r1(inside().filter(r => r.type !== 'porch').reduce((n, r) => n + r.w * r.h, 0));
  const pct = Math.round(footprint / lotArea * 100);
  const maxPct = maxDensity(lotArea);
  checks.push({ ok: pct <= maxPct, text: `Mật độ xây dựng ${pct}% (đất ~${lotArea}m², tối đa ~${maxPct}% theo QCVN 01:2021 — đối chiếu quy hoạch địa phương)${pct <= maxPct ? ' ✓' : ' ✗'}.` });
  if (mainPt && svc) checks.push({ ok: true, text: 'Cửa chính và cửa phụ không thẳng trục (tránh "xuyên tâm") ✓' });

  const totalBeds = inside().filter(r => r.type === 'bedroom' || r.type === 'master').length;
  return {
    widthM: W, lengthM: lot.h, houseLengthM: H, frontSetbackM: r1(-lot.y), backSetbackM: r1(lot.y + lot.h - H),
    floor, totalFloors: floors, facing, facingDeg: D, northPageDeg, stairSide: 'none',
    rooms, grid, checks, fengShuiNotes: notes, sketchNotes,
    density: { lotArea, footprint, pct, maxPct },
    bedroomsThisFloor: totalBeds, totalBedroomsPlaced: totalBeds, totalBedroomsRequested: totalBeds,
    mode: 'free', lot, paths, road: { side: roadSide, label: 'ĐƯỜNG VÀO' },
    advice, adviceApplied: applyAdvice
  };
}

function maxDensity(lotArea: number): number {
  const t: [number, number][] = [[90, 100], [100, 90], [200, 70], [300, 60], [500, 50], [1000, 40]];
  if (lotArea <= t[0][0]) return 100;
  for (let i = 1; i < t.length; i++) if (lotArea <= t[i][0]) { const [a0, p0] = t[i - 1], [a1, p1] = t[i]; return Math.round(p0 + (p1 - p0) * (lotArea - a0) / (a1 - a0)); }
  return 40;
}
