/**
 * YOHU CONSTECH — Bộ lập mặt bằng theo tư duy Kiến trúc sư + Bát Trạch
 *
 * Nguyên tắc (nhà phố / nhà ống / nhà vườn 1 tầng):
 *  1. Lô đất → khoảng lùi trước/sau → kiểm tra mật độ xây dựng (QCVN 01:2021, tham khảo).
 *  2. Chia nhà theo chiều sâu thành các "dải công năng": Khách → Lõi (thang + WC) → Giếng trời → Bếp/Ngủ.
 *  3. Lõi thang + WC xếp chồng thẳng đứng mọi tầng (kết cấu & cấp thoát nước gọn).
 *  4. Nhà sâu > 15m có giếng trời sau lõi thang để lấy sáng – thông gió.
 *  5. Lưới 9 cung (Lạc Thư) phủ lên nhà theo hướng mặt tiền:
 *     WC, bếp (tọa), cầu thang ưu tiên cung xấu; cửa chính, bàn thờ, phòng ngủ chính ưu tiên cung tốt.
 *     Miệng bếp, bàn thờ, đầu giường quay về hướng tốt của gia chủ.
 *  6. Kiểm tra kích thước tối thiểu các phòng, chống thẳng trục cửa chính – cửa sau.
 *
 * Toạ độ: mét. x: ngang nhà (0 = mép trái nhìn từ đường vào). y: chiều sâu (0 = mặt tiền nhà, H = tường sau).
 * Phần sân trước có y < 0, sân sau có y > H.
 */

import { computeArchitecturalLayoutModel } from './architecturalLayoutModel';
import { hasFreeSketch, planFreeLayout } from './sketchFreePlanner';

export type RoomType =
  | 'living' | 'kitchen' | 'bedroom' | 'master' | 'wc' | 'stair' | 'lightwell' | 'corridor'
  | 'worship' | 'common' | 'terrace' | 'parking' | 'yard' | 'balcony' | 'storage' | 'garage'
  // dùng cho chế độ phác thảo tự do (nhà vườn)
  | 'dining' | 'porch' | 'pond' | 'garden' | 'outkitchen' | 'walkway' | 'well';

export type Side = 'front' | 'rear' | 'left' | 'right';

export interface PlanDoor {
  side: Side; at: number; width: number; main?: boolean; rolling?: boolean;
  open?: boolean;     // ô mở thông (không cánh) giữa 2 không gian chung
  service?: boolean;  // cửa phụ ra bếp phụ / vườn
}
export interface PlanItem {
  kind: 'sofa' | 'tv' | 'bed' | 'wardrobe' | 'dining' | 'counter' | 'stove' | 'sink' | 'fridge' | 'toilet' | 'basin'
  | 'shower' | 'altar' | 'car' | 'moto' | 'plant' | 'washer' | 'desk';
  x: number; y: number; w: number; h: number;
  facing?: Side;      // phía mà đồ vật "nhìn" ra (miệng bếp, mặt bàn thờ, chân giường)
  note?: string;
}
export interface PlanRoom {
  id: string;
  type: RoomType;
  name: string;
  x: number; y: number; w: number; h: number;
  outside?: boolean;          // ngoài nhà (sân, ban công)
  open?: boolean;             // thông tầng / không mái (giếng trời, sân thượng)
  doors: PlanDoor[];
  windows: Side[];
  items: PlanItem[];
  blocked?: Side[];           // phía tường đã có đồ cố định (WC riêng...) — không kê giường
  sector?: string;            // hướng của ô 9 cung chứa tâm phòng
  star?: string;              // sao Bát Trạch
  good?: boolean | null;
}
export interface GridCell { col: number; row: number; direction: string; star: string; good: boolean | null; }
export interface PlanCheck { ok: boolean; text: string; }

export interface FloorPlanResult {
  widthM: number; lengthM: number; houseLengthM: number; frontSetbackM: number; backSetbackM: number;
  floor: number; totalFloors: number;
  facing: string; facingDeg: number;
  northPageDeg: number;       // góc mũi tên Bắc trên giấy (0 = hướng lên, theo chiều kim đồng hồ)
  stairSide: 'left' | 'right' | 'none';
  rooms: PlanRoom[];
  grid: GridCell[];
  checks: PlanCheck[];
  fengShuiNotes: string[];
  sketchNotes: string[];          // đã giữ / đã điều chỉnh so với phác thảo của khách
  density: { lotArea: number; footprint: number; pct: number; maxPct: number };
  bedroomsThisFloor: number;
  totalBedroomsPlaced: number;
  totalBedroomsRequested: number;
  /* chế độ phác thảo tự do */
  mode?: 'strip' | 'free';
  lot?: { x: number; y: number; w: number; h: number };            // ranh đất (toạ độ nhà)
  paths?: { pts: [number, number][]; label: string; color: string }[]; // lối vào, lối ra bếp phụ
  road?: { side: Side; label: string };
}

export interface PlannerInput {
  widthM: number;
  lengthM: number;
  floor: number;
  totalFloors: number;
  desiredDirection?: string;
  fengShuiAnalysis?: any;
  rooms?: any;
  requestedBedrooms?: number;
  requestedBathrooms?: number;
  groundFloorArea?: number;
  totalConstructionArea?: number;
  frontSetbackM?: number | string;
  backSetbackM?: number | string;
}

/* ───────────────────────── HƯỚNG & 9 CUNG ───────────────────────── */
const DIRS = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
const DIR_ALIASES: Record<string, string> = {
  north: 'Bắc', northeast: 'Đông Bắc', east: 'Đông', southeast: 'Đông Nam',
  south: 'Nam', southwest: 'Tây Nam', west: 'Tây', northwest: 'Tây Bắc'
};

export function parseDirection(raw?: string): string | null {
  if (!raw) return null;
  const base = String(raw).split('(')[0].trim();
  const lower = base.toLowerCase().replace(/[\s-]/g, '');
  if (DIR_ALIASES[lower]) return DIR_ALIASES[lower];
  // so khớp dài nhất trước ("Đông Nam" trước "Đông")
  const sorted = [...DIRS].sort((a, b) => b.length - a.length);
  for (const d of sorted) if (base.toLowerCase() === d.toLowerCase()) return d;
  for (const d of sorted) if (base.toLowerCase().startsWith(d.toLowerCase())) return d;
  return null;
}
const dirDeg = (d: string) => DIRS.indexOf(d) * 45;
const degDir = (deg: number) => DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

function buildStarMap(fs: any): Record<string, { star: string; good: boolean }> {
  const map: Record<string, { star: string; good: boolean }> = {};
  const add = (arr: any, good: boolean) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((e: string) => {
      const m = String(e).match(/^(.+?)\s*\((.+)\)\s*$/);
      const d = parseDirection(m ? m[1] : e);
      if (d) map[d] = { star: m ? m[2].trim() : '', good };
    });
  };
  add(fs?.favorableDirections, true);
  add(fs?.unfavorableDirections, false);
  return map;
}

/* ───────────────────────── TIỆN ÍCH ───────────────────────── */
const r1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

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

/* Kích thước tối thiểu tham khảo (TCVN 4451:2012 & thực hành thiết kế) */
const MIN: Record<string, { area: number; width: number }> = {
  living: { area: 14, width: 3.0 },
  master: { area: 12, width: 3.0 },
  bedroom: { area: 9, width: 2.6 },
  kitchen: { area: 6, width: 1.8 },
  wc: { area: 2.4, width: 1.2 },
  worship: { area: 4.5, width: 1.8 },
  common: { area: 8, width: 2.6 }
};

/* ───────────────────────── LẬP MẶT BẰNG ───────────────────────── */
export function planFloor(input: PlannerInput): FloorPlanResult {
  // Phác thảo tự do (nhà vườn, nhà rộng, bố cục không theo dải nhà ống) → vẽ đúng vị trí phòng theo lưới phác thảo
  if (hasFreeSketch(input.rooms, Math.round(Number(input.floor) || 1), Math.max(1, Math.round(Number(input.totalFloors) || 1)))) {
    return planFreeLayout(input);
  }
  const W = clamp(Number(input.widthM) || 5, 2.5, 60);
  const L = clamp(Number(input.lengthM) || 20, 5, 120);
  const floors = Math.max(1, Math.round(Number(input.totalFloors) || 1));
  const floor = clamp(Math.round(Number(input.floor) || 1), 1, floors);
  const fs = input.fengShuiAnalysis;
  const roomsCfg = input.rooms || {};

  // Dùng mô hình đếm phòng chung với BOQ để số phòng ngủ / WC khớp dự toán
  const layout = computeArchitecturalLayoutModel({
    widthM: W, lengthM: L, floors, currentFloor: floor,
    groundFloorArea: input.groundFloorArea, totalConstructionArea: input.totalConstructionArea,
    requestedBedrooms: input.requestedBedrooms ?? roomsCfg.bedroomCount,
    requestedBathrooms: input.requestedBathrooms ?? roomsCfg.bathroomCount,
    roomsConfig: roomsCfg, fengShuiAnalysis: fs,
    frontSetbackM: input.frontSetbackM, backSetbackM: input.backSetbackM
  });
  const frontSB = layout.frontSetbackM;
  const backSB = layout.backSetbackM;
  const H = r1(layout.houseLengthM);

  const facing = parseDirection(input.desiredDirection) || parseDirection(fs?.directionVerdict?.direction) || 'Nam';
  const D = dirDeg(facing);
  const northPageDeg = (((180 - D) % 360) + 360) % 360;
  const starMap = buildStarMap(fs);
  const hasFs = Object.keys(starMap).length > 0;

  const cellOf = (x: number, y: number) => ({
    col: clamp(Math.floor(x / (W / 3)), 0, 2),
    row: clamp(Math.floor(y / (H / 3)), 0, 2)
  });
  const cellDir = (col: number, row: number): string => {
    if (col === 1 && row === 1) return 'Trung cung';
    const dc = col - 1, dr = row - 1; // dr > 0 = về phía sau nhà = lên trên giấy
    const p = Math.atan2(dc, dr) * 180 / Math.PI;
    return degDir(p + D - 180);
  };
  const sideBearing = (side: Side): string => {
    // hướng la bàn mà một vật "nhìn" về khi quay mặt ra phía `side`
    const p = side === 'rear' ? 0 : side === 'right' ? 90 : side === 'front' ? 180 : 270;
    return degDir(p + D - 180);
  };
  const info = (dir: string) => dir === 'Trung cung' ? { star: 'Trung cung', good: null as boolean | null }
    : starMap[dir] ? { star: starMap[dir].star, good: starMap[dir].good as boolean | null } : { star: '', good: null as boolean | null };
  const STAR_RANK: Record<string, number> = { 'Sinh Khí': 4, 'Thiên Y': 3, 'Diên Niên': 2, 'Phục Vị': 1, 'Họa Hại': -1, 'Lục Sát': -2, 'Ngũ Quỷ': -3, 'Tuyệt Mệnh': -4 };
  const cellScore = (col: number, row: number) => { const i = info(cellDir(col, row)); if (i.good === null) return 0; return STAR_RANK[i.star] ?? (i.good ? 1 : -1); };

  const grid: GridCell[] = [];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
    const d = cellDir(col, row); const i = info(d);
    grid.push({ col, row, direction: d, star: i.star, good: i.good });
  }

  /* ── Tham số lõi ── */
  const hasStair = floors > 1;
  const sw = hasStair ? (W >= 4.5 ? 2.2 : 1.0) : 0;       // bề rộng thang
  const sl = hasStair ? (W >= 4.5 ? 3.4 : 5.0) : 2.4;     // chiều sâu lõi
  let cw = 1.1;                                          // hành lang
  let wcW = clamp(W - sw - cw, 1.2, 1.8);
  if (W - sw - cw < 1.2) { cw = Math.max(0.9, W - sw - 1.2); wcW = Math.max(1.0, W - sw - cw); }
  const lw = (floors > 1 ? H > 15 : (H > 18 || (H > 15 && W < 8))) ? 1.5 : 0; // giếng trời

  /* ── Phác thảo của khách (AI đọc từ bản vẽ tay) — ưu tiên giữ ý khách nếu hợp lệ ── */
  const sketch: any = roomsCfg.sketchLayout && roomsCfg.sketchLayout.co_phac_thao !== false ? roomsCfg.sketchLayout : null;
  const sketchNotes: string[] = [];
  const skFloor = (f: number): any[] => (sketch?.tang || []).find((t: any) => Number(t.tang) === f)?.phong || [];
  const skHas = (f: number, loai: string) => skFloor(f).filter((r: any) => String(r.loai) === loai);

  // Chọn phía đặt thang: WC (phía còn lại, giữa nhà) ưu tiên cung xấu
  let stairSide: 'left' | 'right' | 'none' = 'none';
  if (hasStair) {
    const scoreSide = (s: 'left' | 'right') => {
      const stairCol = s === 'left' ? 0 : 2, wcCol = s === 'left' ? 2 : 0;
      return -3 * cellScore(wcCol, 1) - 1 * cellScore(stairCol, 1);
    };
    const fsBest: 'left' | 'right' = scoreSide('left') >= scoreSide('right') ? 'left' : 'right';
    stairSide = fsBest;
    const want = String(sketch?.vi_tri_thang || '');
    if (want === 'trai' || want === 'phai') {
      stairSide = want === 'trai' ? 'left' : 'right';
      sketchNotes.push(`✓ Giữ cầu thang bên ${want === 'trai' ? 'trái' : 'phải'} như phác thảo${stairSide !== fsBest && hasFs ? ` (phong thủy gợi ý bên ${fsBest === 'left' ? 'trái' : 'phải'} để WC rơi cung xấu — có thể đổi khi thiết kế chi tiết)` : ''}.`);
    } else if (want === 'giua') {
      sketchNotes.push(`↺ Phác thảo đặt thang giữa nhà: chuyển thang sát tường ${fsBest === 'left' ? 'trái' : 'phải'} để không chia đôi phòng và tránh "trung cung" — giữa nhà dành cho hành lang/giếng trời.`);
    }
  }
  const S = stairSide === 'right';                       // lật trục x nếu thang bên phải
  const X = (x: number, w: number) => S ? r1(W - x - w) : r1(x);   // đổi toạ độ theo phía thang
  const sideX = (s: Side): Side => !S ? s : s === 'left' ? 'right' : s === 'right' ? 'left' : s;
  const corrX0 = sw, corrX1 = sw + cw;                   // hành lang (theo hệ "thang bên trái")

  /* ── Phân bổ phòng ngủ theo tầng (ưu tiên tầng trên, tầng 1 chỉ khi đủ rộng/sâu) ── */
  const totalBeds = layout.totalBedroomCount;
  const totalWcs = layout.totalWcCount;
  const hasWorship = layout.hasWorshipRoom;
  const wide = W >= 7.6;

  const upperDepth = H - sl - lw;
  const upperZones = upperDepth >= 9.6 && W >= 6.2 ? 3 : upperDepth >= 6.0 ? 2 : 1;
  const slotsUpper = (f: number) => {
    let s = (upperZones >= 2 ? 2 : 1) * (wide ? 2 : 1) + (upperZones === 3 ? 1 : 0);
    if (f === floors && hasWorship) s -= 1;
    return Math.max(0, s);
  };
  const gfBedCapacity = floors === 1
    ? 99
    : (W >= 7 && H - sl - lw >= 4.0 + 3.6 + 3.6) ? 1 : (H >= 18 && H - sl - lw >= 4.0 + 3.6 + 3.4) ? 1 : 0;

  const bedsPerFloor: Record<number, number> = {};
  let remaining = totalBeds;
  if (floors === 1) { bedsPerFloor[1] = totalBeds; remaining = 0; }
  else {
    for (let f = 1; f <= floors; f++) bedsPerFloor[f] = 0;
    // Theo phác thảo: số phòng ngủ khách vẽ ở từng tầng (trong giới hạn bố trí đạt chuẩn)
    if (sketch) {
      for (let f = 1; f <= floors && remaining > 0; f++) {
        const want = skHas(f, 'ngu').length;
        if (!want) continue;
        const cap = f === 1 ? gfBedCapacity : slotsUpper(f);
        const take = Math.min(want, cap, remaining);
        bedsPerFloor[f] = take; remaining -= take;
        if (take === want) sketchNotes.push(`✓ Tầng ${f}: ${want} phòng ngủ như phác thảo.`);
        else sketchNotes.push(`↺ Tầng ${f}: phác thảo ${want} phòng ngủ, chỉ xếp được ${take} phòng đạt chuẩn (≥ 9m², cạnh ≥ 2,6m) — phần còn lại chuyển tầng khác.`);
      }
    }
    // rải đều tầng 2..n
    let guard = 0;
    while (remaining > 0 && guard++ < 200) {
      let placedAny = false;
      for (let f = 2; f <= floors && remaining > 0; f++) {
        if (bedsPerFloor[f] < slotsUpper(f)) { bedsPerFloor[f]++; remaining--; placedAny = true; }
      }
      if (!placedAny) break;
    }
    // ông bà ở tầng 1 nếu nhà đủ điều kiện và còn phòng chưa xếp, hoặc nhà ≥ 4 phòng ngủ
    if (!sketch && gfBedCapacity > 0 && (remaining > 0 || (totalBeds >= 4 && bedsPerFloor[floors] > 0))) {
      if (remaining > 0) { bedsPerFloor[1] = 1; remaining--; }
      else { bedsPerFloor[1] = 1; bedsPerFloor[floors]--; }
    }
  }
  const bedsHere = bedsPerFloor[floor] || 0;
  const bedIndexStart = 1 + Object.keys(bedsPerFloor).map(Number).filter(f => f < floor).reduce((s, f) => s + (bedsPerFloor[f] || 0), 0);
  // master: phòng ngủ đầu tiên của tầng 2 (hoặc tầng 1 nếu nhà 1 tầng)
  const masterFloor = floors === 1 ? 1 : (bedsPerFloor[2] > 0 ? 2 : 1);

  // WC: 1 WC lõi mỗi tầng + WC riêng cho phòng master/ phòng lớn nếu còn
  const wcCore: Record<number, number> = {};
  for (let f = 1; f <= floors; f++) wcCore[f] = 1;
  let extraWc = Math.max(0, totalWcs - floors);
  const ensuiteHere = (() => {
    if (floors === 1) return Math.max(0, totalWcs - 1);
    // ưu tiên tầng có master, sau đó các tầng có ≥2 phòng ngủ
    const order = [masterFloor, ...Array.from({ length: floors }, (_, i) => i + 1).filter(f => f !== masterFloor)];
    const alloc: Record<number, number> = {};
    for (const f of order) {
      if (extraWc <= 0) break;
      const can = Math.min(extraWc, Math.max(0, (bedsPerFloor[f] || 0) - (f === masterFloor ? 0 : 1)));
      if (can > 0) { alloc[f] = can; extraWc -= can; }
    }
    return alloc[floor] || 0;
  })();

  const rooms: PlanRoom[] = [];
  const checks: PlanCheck[] = [];
  const notes: string[] = [];
  let bedNo = bedIndexStart;
  let ensuiteLeft = ensuiteHere;

  const add = (r: Omit<PlanRoom, 'doors' | 'windows' | 'items'> & Partial<Pick<PlanRoom, 'doors' | 'windows' | 'items'>>): PlanRoom => {
    const room: PlanRoom = { doors: [], windows: [], items: [], ...r } as PlanRoom;
    room.x = r1(room.x); room.y = r1(room.y); room.w = r1(room.w); room.h = r1(room.h);
    rooms.push(room);
    return room;
  };
  // tạo phòng theo hệ "thang bên trái" rồi lật nếu cần
  const addL = (r: any) => add({ ...r, x: X(r.x, r.w), doors: (r.doors || []).map((d: PlanDoor) => ({ ...d, side: sideX(d.side), at: (d.side === 'front' || d.side === 'rear') && S ? r1(r.w - d.at - d.width) : d.at })), windows: (r.windows || []).map((s: Side) => sideX(s)) });

  const bedroomRoom = (x: number, y: number, w: number, h: number, doorSide: Side, doorAt: number, windows: Side[]) => {
    const isMaster = floor === masterFloor && bedNo === bedIndexStart;
    const room = addL({
      id: `bed_${bedNo}`, type: isMaster ? 'master' : 'bedroom',
      name: isMaster ? `P. Ngủ ${bedNo} (Master)` : `P. Ngủ ${bedNo}`,
      x, y, w, h, doors: [{ side: doorSide, at: doorAt, width: 0.8 }], windows
    });
    bedNo++;
    return room;
  };

  /* ── Sân trước / sân sau ── */
  const parking = skHas(1, 'gara').length ? 'garage' : (roomsCfg.parkingType || 'yard');
  if (floor === 1 && skHas(1, 'bep').some((r: any) => r.vi_tri === 'truoc')) sketchNotes.push('↺ Phác thảo đặt bếp phía trước: chuyển bếp ra sau để thoát khói ra sân sau, tránh bếp nhìn thẳng cửa chính.');
  if (skHas(floor, 'wc').some((r: any) => r.vi_tri === 'giua' && r.ben === 'ca_ngang')) sketchNotes.push('↺ WC giữa nhà trong phác thảo được dời sát tường hông (tránh trung cung, dễ thông gió).');
  let preferredDoorCol: number | null = null;
  if (floor === 1) {
    add({ id: 'front_yard', type: 'yard', name: parking === 'none' ? 'Sân trước' : 'Sân trước · để xe', x: 0, y: -frontSB, w: W, h: frontSB, outside: true });
    add({ id: 'back_yard', type: 'yard', name: 'Sân sau · phơi, thoát khí bếp', x: 0, y: H, w: W, h: backSB, outside: true });
  } else {
    add({ id: 'balcony', type: 'balcony', name: 'Ban công', x: 0, y: -Math.min(1.2, frontSB), w: W, h: Math.min(1.2, frontSB), outside: true });
  }

  /* ── Lõi thang + WC (xếp chồng mọi tầng) ── */
  const placeCore = (yc: number) => {
    if (hasStair) {
      addL({ id: 'stair', type: 'stair', name: W >= 4.5 ? 'Thang chữ U' : 'Thang 1 vế', x: 0, y: yc, w: sw, h: sl });
    }
    addL({ id: 'corr_core', type: 'corridor', name: 'Hành lang', x: corrX0, y: yc, w: cw, h: sl });
    const restW = W - sw - cw;
    const wcH = Math.min(2.4, sl);
    if (restW >= 1.0) {
      const wcWd = restW > 2.4 ? 1.8 : restW;
      addL({ id: 'wc_core', type: 'wc', name: floor === 1 ? 'WC chung' : `WC tầng ${floor}`, x: W - wcWd, y: yc + sl - wcH, w: wcWd, h: wcH,
        doors: [{ side: 'left', at: 0.3, width: 0.7 }] });
      if (sl - wcH >= 0.8) addL({ id: 'storage_core', type: 'storage', name: floor === 1 ? 'Kho / máy giặt' : 'Tủ kỹ thuật', x: W - wcWd, y: yc, w: wcWd, h: sl - wcH, doors: [{ side: 'left', at: 0.1, width: 0.6 }] });
      if (restW > 2.4) addL({ id: 'core_extra', type: 'common', name: floor === 1 ? 'Sảnh · ăn phụ' : 'Sinh hoạt chung', x: corrX1, y: yc, w: restW - 1.8, h: sl });
    }
  };
  const placeLightwell = (y: number) => {
    if (lw <= 0) return;
    addL({ id: 'lightwell', type: 'lightwell', name: floor === 1 ? 'Giếng trời · tiểu cảnh' : 'Giếng trời (thông tầng)', x: 0, y, w: hasStair ? sw : Math.max(1.5, W - cw - 1.5), h: lw, open: true });
    addL({ id: 'corr_lw', type: 'corridor', name: '', x: hasStair ? corrX0 : W - cw - 1.5 > 0 ? Math.max(1.5, W - cw - 1.5) : 0, y, w: hasStair ? W - sw : cw + 1.5, h: lw });
  };

  if (floor === 1 && floors === 1) {
    /* ═════════ NHÀ 1 TẦNG ═════════ */
    const perZone = W >= 7 ? 2 : 1;
    const bedZones = Math.ceil(bedsHere / perZone);
    const kitchenLen = clamp(H * 0.22, 3.6, 5.0);
    const wcZone = 2.4;
    const minNeed = 4.0 + wcZone + bedZones * 3.4 + kitchenLen + lw;
    let zoneLen = bedZones > 0 ? clamp((H - 4.0 - wcZone - kitchenLen - lw) / bedZones, 3.0, 4.2) : 0;
    let livingLen = H - wcZone - kitchenLen - lw - bedZones * zoneLen;
    if (livingLen < 4.0) {
      checks.push({ ok: false, text: `Chiều sâu nhà ${H}m chưa đủ cho ${bedsHere} phòng ngủ đạt chuẩn trên 1 tầng (cần ~${r1(minNeed)}m). Nên giảm phòng hoặc làm thêm tầng.` });
      livingLen = 4.0;
      zoneLen = Math.max(2.8, (H - 4.0 - wcZone - kitchenLen - lw) / Math.max(1, bedZones));
    }
    if (livingLen > 7) livingLen = 7;
    let y = 0;
    // phòng khách (+ phòng thờ ở góc tốt nếu nhà rộng)
    const living = add({ id: 'living', type: 'living', name: 'Phòng khách', x: 0, y, w: W, h: livingLen, windows: ['front'] });
    if (hasWorship && W >= 7) {
      // cửa chính lấy ô mặt tiền tốt nhất; phòng thờ ở góc còn lại (không đối diện / sát cửa chính)
      // xét mọi cặp (ô cửa chính, góc phòng thờ) → tổng điểm cung cao nhất
      let bestPair = { door: 1, wor: 0, sc: -99 };
      for (const dcol of [0, 1, 2]) for (const wcol of [0, 2]) {
        if (dcol === wcol) continue;
        const sc = cellScore(dcol, 0) + cellScore(wcol, 0) + (dcol === 1 ? 0.1 : 0);
        if (sc > bestPair.sc) bestPair = { door: dcol, wor: wcol, sc };
      }
      preferredDoorCol = bestPair.door;
      const onLeft = bestPair.wor === 0;
      const ww = 2.4;
      living.w = r1(W - ww); if (onLeft) living.x = ww;
      add({ id: 'worship', type: 'worship', name: 'Phòng thờ', x: onLeft ? 0 : W - ww, y, w: ww, h: Math.min(3.2, livingLen), windows: ['front'], doors: [{ side: onLeft ? 'right' : 'left', at: 0.3, width: 0.8 }] });
    }
    y += livingLen;
    // dải WC
    const cx = W >= 7 ? r1((W - cw) / 2) : 0;
    add({ id: 'corr_wc', type: 'corridor', name: 'Hành lang', x: cx, y, w: cw, h: wcZone });
    const wcRooms = Math.min(2, 1 + ensuiteLeft);
    const wcSide = cellScore(0, 1) <= cellScore(2, 1) ? 'L' : 'R';
    for (let i = 0; i < wcRooms; i++) {
      const left = (i === 0) === (wcSide === 'L');
      const x0 = left ? 0 : cx + cw;
      const wAvail = left ? cx : W - cx - cw;
      if (wAvail < 1.2) continue;
      add({ id: `wc_${i}`, type: 'wc', name: i === 0 ? 'WC chung' : 'WC 2', x: x0, y, w: Math.min(wAvail, 2.2), h: wcZone, doors: [{ side: left ? 'right' : 'left', at: 0.4, width: 0.7 }] });
      if (wAvail - 2.2 >= 1.0) add({ id: `sto_${i}`, type: 'storage', name: 'Kho / giặt', x: left ? 2.2 : x0 + 2.2, y, w: wAvail - 2.2, h: wcZone });
    }
    if (wcRooms > 1) ensuiteLeft = Math.max(0, ensuiteLeft - 1);
    y += wcZone;
    // các dải phòng ngủ
    for (let z = 0; z < bedZones; z++) {
      add({ id: `corr_b${z}`, type: 'corridor', name: '', x: cx, y, w: cw, h: zoneLen });
      if (perZone === 2) {
        bedroomRoom(0, y, cx, zoneLen, 'right', 0.3, []);
        if (bedNo < bedIndexStart + bedsHere) bedroomRoom(cx + cw, y, W - cx - cw, zoneLen, 'left', 0.3, []);
        else add({ id: `study_${z}`, type: 'common', name: 'Phòng làm việc', x: cx + cw, y, w: W - cx - cw, h: zoneLen, doors: [{ side: 'left', at: 0.3, width: 0.8 }] });
      } else {
        bedroomRoom(cw, y, W - cw, zoneLen, 'left', 0.3, []);
      }
      y += zoneLen;
    }
    if (lw > 0) { add({ id: 'lightwell', type: 'lightwell', name: 'Giếng trời · tiểu cảnh', x: 0, y, w: W - cw - cx > 1.5 ? W - cx - cw : 1.5, h: lw, open: true }); y += lw; }
    add({ id: 'kitchen', type: 'kitchen', name: 'Bếp + Ăn', x: 0, y, w: W, h: H - y, windows: ['rear'], doors: [{ side: 'rear', at: 0, width: 0.8 }] });
  } else if (floor === 1) {
    /* ═════════ TẦNG 1 NHÀ NHIỀU TẦNG ═════════ */
    const kitchenLen = clamp(H * 0.25, 3.6, 5.0);
    const gfBed = bedsHere > 0;
    const bedLen = gfBed ? 3.6 : 0;
    let livingLen = H - sl - lw - kitchenLen - bedLen;
    if (livingLen < 3.6) {
      checks.push({ ok: false, text: `Tầng 1 sâu ${H}m: phòng khách chỉ còn ${r1(livingLen)}m — nên giảm bếp hoặc chuyển phòng ngủ lên tầng.` });
      livingLen = Math.max(3.0, livingLen);
    }
    const extra = Math.max(0, livingLen - 6.5);
    livingLen -= extra;
    let y = 0;
    const garageCar = parking === 'garage' && W >= 3.6 && livingLen + extra >= 5.5 + 3.6;
    if (skHas(1, 'gara').length) sketchNotes.push(garageCar
      ? '✓ Gara ô tô tầng 1 như phác thảo.'
      : '↺ Phác thảo có gara ô tô nhưng nhà không đủ chiều sâu phía trước lõi thang (cần ≥ 9,1m) — bố trí chỗ để xe máy.');
    if (garageCar) {
      const gw = W >= 6.2 ? 3.0 : W;
      const gl = 5.5;
      add({ id: 'garage', type: 'garage', name: 'Gara ô tô', x: W >= 6.2 ? (S ? 0 : W - gw) : 0, y, w: gw, h: gl, doors: [{ side: 'front', at: 0.2, width: gw - 0.4, main: false, rolling: true }],
        items: [{ kind: 'car', x: (W >= 6.2 ? (S ? 0 : W - gw) : 0) + (gw - Math.min(1.8, gw - 0.6)) / 2, y: 0.5, w: Math.min(1.8, gw - 0.6), h: 4.4 }] });
      if (W >= 6.2) {
        add({ id: 'living', type: 'living', name: 'Phòng khách', x: S ? gw : 0, y, w: W - gw, h: livingLen + extra, windows: ['front'] });
        y += livingLen + extra;
      } else {
        y += gl;
        add({ id: 'living', type: 'living', name: 'Phòng khách', x: 0, y, w: W, h: livingLen + extra - gl, windows: [] });
        y += livingLen + extra - gl;
      }
    } else {
      add({ id: 'living', type: 'living', name: 'Phòng khách', x: 0, y, w: W, h: livingLen, windows: ['front'] });
      y += livingLen;
    }
    placeCore(y); y += sl;
    placeLightwell(y); y += lw;
    const kLen = kitchenLen + (garageCar ? 0 : extra);
    if (gfBed && W >= 7) {
      // phòng ngủ ông bà giữa nhà, phía rộng; phía thang: WC riêng / kho
      addL({ id: 'corr_gfb', type: 'corridor', name: '', x: corrX0, y, w: cw, h: bedLen });
      bedroomRoom(corrX1, y, W - corrX1, bedLen, 'left', 0.3, []);
      if (ensuiteLeft > 0) { addL({ id: 'wc_ens_gf', type: 'wc', name: 'WC riêng', x: 0, y, w: sw, h: Math.min(bedLen, 2.4), doors: [{ side: 'right', at: 0.3, width: 0.7 }] }); ensuiteLeft--; }
      else addL({ id: 'sto_gf', type: 'storage', name: 'Kho', x: 0, y, w: sw, h: bedLen });
      y += bedLen;
      add({ id: 'kitchen', type: 'kitchen', name: 'Bếp + Ăn', x: 0, y, w: W, h: H - y, windows: ['rear'], doors: [{ side: 'rear', at: 0, width: 0.8 }] });
    } else if (gfBed) {
      // nhà hẹp & sâu: bếp giữa, phòng ngủ ông bà phía sau (yên tĩnh, gần sân sau)
      add({ id: 'kitchen', type: 'kitchen', name: 'Bếp + Ăn', x: 0, y, w: W, h: kLen, windows: [] });
      y += kLen;
      bedroomRoom(0, y, W, H - y, 'front', W / 2 - 0.4, ['rear']);
    } else {
      add({ id: 'kitchen', type: 'kitchen', name: 'Bếp + Ăn', x: 0, y, w: W, h: H - y, windows: ['rear'], doors: [{ side: 'rear', at: 0, width: 0.8 }] });
    }
  } else {
    /* ═════════ TẦNG TRÊN ═════════ */
    const isTop = floor === floors;
    const zones = upperZones;
    const R = upperDepth;
    const frontLen = zones === 1 ? R : zones === 2 ? r1(R * 0.52) : r1(R / 3);
    const midLen = zones === 3 ? r1(R / 3) : 0;
    const rearLen = zones === 1 ? 0 : r1(R - frontLen - midLen);

    // Phòng thờ tầng trên cùng: chọn dải trước/sau có cung tốt hơn
    let worshipZone: 'front' | 'rear' | null = null;
    if (isTop && hasWorship) {
      const fScore = cellScore(0, 0) + cellScore(1, 0) + cellScore(2, 0);
      const rScore = cellScore(0, 2) + cellScore(1, 2) + cellScore(2, 2);
      worshipZone = zones === 1 ? 'front' : (rScore > fScore ? 'rear' : 'front');
      // Theo phác thảo: phòng thờ khách muốn ở trước hay sau
      let skTho: any = null; let skThoFloor = 0;
      for (let f = 1; f <= floors; f++) { const t = skHas(f, 'tho')[0]; if (t) { skTho = t; skThoFloor = f; } }
      if (skTho) {
        if (zones > 1 && (skTho.vi_tri === 'truoc' || skTho.vi_tri === 'sau')) {
          const z = skTho.vi_tri === 'truoc' ? 'front' : 'rear';
          if (z !== worshipZone) sketchNotes.push(`✓ Phòng thờ phía ${skTho.vi_tri === 'truoc' ? 'trước' : 'sau'} như phác thảo (phong thủy gợi ý phía ${worshipZone === 'front' ? 'trước' : 'sau'} có cung tốt hơn).`);
          else sketchNotes.push(`✓ Phòng thờ phía ${skTho.vi_tri === 'truoc' ? 'trước' : 'sau'} như phác thảo.`);
          worshipZone = z;
        }
        if (skThoFloor !== floors) sketchNotes.push(`↺ Phác thảo đặt phòng thờ ở tầng ${skThoFloor}: chuyển lên tầng ${floors} (tầng trên cùng) để không có phòng ngủ/WC đè lên bàn thờ.`);
      }
    }
    let bedsToPlace = bedsHere;

    const fillZone = (zone: 'front' | 'rear', y: number, h: number) => {
      const facadeSide: Side = zone === 'front' ? 'front' : 'rear';
      const doorSide: Side = zone === 'front' ? 'rear' : 'front';
      if (worshipZone === zone) {
        const row = zone === 'front' ? 0 : 2;
        if (!wide) {
          addL({ id: 'worship', type: 'worship', name: 'Phòng thờ', x: 0, y, w: W, h, windows: [facadeSide], doors: [{ side: doorSide, at: Math.max(0.1, corrX0 + 0.15), width: 0.8 }] });
          return;
        }
        // phòng thờ chiếm nửa có cung tốt hơn (so theo toạ độ thật, đã tính phía thang)
        const split = corrX0 + cw / 2;
        const leftAbsCol = S ? 2 : 0, rightAbsCol = S ? 0 : 2;
        const worshipLeft = cellScore(leftAbsCol, row) >= cellScore(rightAbsCol, row);
        const wx = worshipLeft ? 0 : split, wwid = worshipLeft ? split : W - split;
        addL({ id: 'worship', type: 'worship', name: 'Phòng thờ', x: wx, y, w: wwid, h, windows: [facadeSide], doors: [{ side: doorSide, at: worshipLeft ? Math.max(0.1, split - 1.0) : 0.15, width: 0.8 }] });
        const ox2 = worshipLeft ? split : 0, ow = worshipLeft ? W - split : split;
        if (bedsToPlace > 0) { bedroomRoom(ox2, y, ow, h, doorSide, worshipLeft ? 0.15 : Math.max(0.1, split - 1.0), [facadeSide]); bedsToPlace--; }
        else addL({ id: `terrace_${zone}`, type: 'terrace', name: 'Sân thượng · phơi', x: ox2, y, w: ow, h, open: true, doors: [{ side: doorSide, at: worshipLeft ? 0.15 : Math.max(0.1, split - 1.0), width: 0.8 }] });
        return;
      }
      if (bedsToPlace <= 0) {
        if (isTop) addL({ id: `terrace_${zone}`, type: 'terrace', name: 'Sân thượng · phơi đồ', x: 0, y, w: W, h, open: true, doors: [{ side: doorSide, at: corrX0 + 0.15, width: 0.8 }] });
        else addL({ id: `common_${zone}`, type: 'common', name: 'Sinh hoạt chung', x: 0, y, w: W, h, windows: [facadeSide] });
        return;
      }
      if (wide && bedsToPlace >= 2) {
        const split = corrX0 + cw / 2;
        // phòng lớn (phía không có thang) xếp trước → làm phòng master
        const big = bedroomRoom(split, y, W - split, h, doorSide, 0.15, [facadeSide]); bedsToPlace--;
        bedroomRoom(0, y, split, h, doorSide, Math.max(0.1, split - 1.0), [facadeSide]); bedsToPlace--;
        if (ensuiteLeft > 0 && big.w * big.h >= 15) {
          const ew = Math.min(1.8, (W - split) * 0.4), eh = Math.min(2.2, h - 0.6);
          addL({ id: `wc_ens_${zone}`, type: 'wc', name: 'WC riêng', x: W - ew, y: zone === 'front' ? y + h - eh : y, w: ew, h: eh, doors: [{ side: 'left', at: 0.3, width: 0.7 }] });
          big.blocked = [sideX('right')];
          big.name += ' + WC';
          ensuiteLeft--;
        }
      } else {
        const room = bedroomRoom(0, y, W, h, doorSide, corrX0 + 0.15, [facadeSide]); bedsToPlace--;
        // WC riêng (en-suite) cho phòng lớn, đặt sát tường phía thang (trên WC/kho lõi không chồng lệch)
        if (ensuiteLeft > 0 && room.w * room.h >= 15) {
          const ew = Math.min(1.8, W * 0.35), eh = Math.min(2.2, h - 0.6);
          const ex = W - ew; // phía không có thang (theo hệ trái), tránh cửa phòng
          addL({ id: `wc_ens_${zone}`, type: 'wc', name: 'WC riêng', x: ex, y: zone === 'front' ? y + h - eh : y, w: ew, h: eh, doors: [{ side: 'left', at: 0.3, width: 0.7 }] });
          room.blocked = [sideX('right')];
          room.name += ' + WC riêng';
          ensuiteLeft--;
        }
      }
    };

    let y = 0;
    fillZone('front', y, frontLen); y += frontLen;
    placeCore(y); y += sl;
    placeLightwell(y); y += lw;
    if (zones === 3) {
      addL({ id: 'corr_mid', type: 'corridor', name: '', x: corrX0, y, w: cw, h: midLen });
      if (bedsToPlace > 0 && (worshipZone !== 'rear' || bedsToPlace > (wide ? 1 : 0))) {
        bedroomRoom(corrX1, y, W - corrX1, midLen, 'left', 0.3, []); bedsToPlace--;
        if (ensuiteLeft > 0) { addL({ id: 'wc_ens_mid', type: 'wc', name: 'WC riêng', x: 0, y, w: sw, h: Math.min(2.4, midLen), doors: [{ side: 'right', at: 0.3, width: 0.7 }] }); ensuiteLeft--; }
        else addL({ id: 'closet_mid', type: 'storage', name: 'Tủ âm tường', x: 0, y, w: sw, h: midLen });
      } else {
        addL({ id: 'common_mid', type: 'common', name: 'Sinh hoạt chung', x: 0, y, w: sw, h: midLen });
        addL({ id: 'common_mid2', type: 'common', name: 'Thư viện / đọc sách', x: corrX1, y, w: W - corrX1, h: midLen });
      }
      y += midLen;
    }
    if (rearLen > 0) fillZone('rear', y, rearLen);
    if (bedsToPlace > 0) {
      checks.push({ ok: false, text: `Tầng ${floor} chưa xếp đủ ${bedsHere} phòng ngủ đạt chuẩn (thiếu ${bedsToPlace}). Đề xuất tăng 1 tầng hoặc giảm số phòng.` });
    }
  }

  /* ── Giữ cửa nằm trong cạnh phòng ── */
  rooms.forEach(r => r.doors.forEach(d => {
    const len = d.side === 'front' || d.side === 'rear' ? r.w : r.h;
    d.width = Math.min(d.width, Math.max(0.6, len - 0.2));
    d.at = r1(clamp(d.at, 0.1, Math.max(0.1, len - d.width - 0.1)));
  }));

  /* ── Gán cung cho từng phòng ── */
  rooms.forEach(r => {
    if (r.outside) return;
    const c = cellOf(r.x + r.w / 2, r.y + r.h / 2);
    r.sector = cellDir(c.col, c.row);
    const i = info(r.sector);
    r.star = i.star; r.good = i.good;
  });

  /* ── Phòng master: chọn phòng ngủ đủ lớn ở cung tốt nhất của tầng ── */
  if (floor === masterFloor) {
    const beds = rooms.filter(r => r.type === 'bedroom' || r.type === 'master');
    const cur = beds.find(r => r.type === 'master');
    const scoreOf = (r: PlanRoom) => { const c = cellOf(r.x + r.w / 2, r.y + r.h / 2); return cellScore(c.col, c.row); };
    const ok = beds.filter(r => r.w * r.h >= 12 && Math.min(r.w, r.h) >= 3);
    const pick = ok.sort((a, b) => scoreOf(b) - scoreOf(a) || b.w * b.h - a.w * a.h)[0];
    if (cur && pick && pick !== cur) {
      const suf = (n: string) => (n.match(/ \+ WC.*$/) || [''])[0];
      const base = (n: string) => n.replace(/ \+ WC.*$/, '');
      const curBase = base(cur.name), pickBase = base(pick.name);
      const curSuf = suf(cur.name), pickSuf = suf(pick.name);
      cur.name = pickBase + curSuf; cur.type = 'bedroom';
      pick.name = curBase + pickSuf; pick.type = 'master';
    }
  }

  /* ── Bố trí nội thất + Phong thủy ── */
  const best = (sides: Side[]) => {
    // chọn phía có hướng tốt nhất theo thứ tự ưu tiên sao
    const rank: Record<string, number> = { 'Sinh Khí': 4, 'Thiên Y': 3, 'Diên Niên': 2, 'Phục Vị': 1 };
    let bestSide = sides[0], bestScore = -99;
    for (const s of sides) {
      const d = sideBearing(s); const i = info(d);
      const sc = i.good === true ? 10 + (rank[i.star] || 0) : i.good === false ? -10 : 0;
      if (sc > bestScore) { bestScore = sc; bestSide = s; }
    }
    return bestSide;
  };
  const describe = (side: Side) => { const d = sideBearing(side); const i = info(d); return `${d}${i.star ? ` (${i.star}${i.good === false ? ' – xấu' : i.good ? ' – tốt' : ''})` : ''}`; };
  const opp = (s: Side): Side => s === 'front' ? 'rear' : s === 'rear' ? 'front' : s === 'left' ? 'right' : 'left';

  // Cửa chính: đặt ở ô mặt tiền có cung tốt nhất (trái/giữa/phải)
  const living = rooms.find(r => r.id === 'living');
  let mainDoorCol = 1;
  if (floor === 1 && living) {
    const cols = [0, 1, 2].filter(c => {
      const cx0 = c * W / 3, cx1 = (c + 1) * W / 3;
      return cx1 > living.x + 0.3 && cx0 < living.x + living.w - 0.3;
    });
    mainDoorCol = (preferredDoorCol !== null && cols.includes(preferredDoorCol))
      ? preferredDoorCol
      : (cols.sort((a, b) => cellScore(b, 0) - cellScore(a, 0) || Math.abs(a - 1) - Math.abs(b - 1))[0] ?? 1);
    const dw = clamp(W * 0.45, 1.2, 3.2);
    const colCenter = (mainDoorCol + 0.5) * W / 3;
    const at = clamp(colCenter - dw / 2 - living.x, 0.2, Math.max(0.2, living.w - dw - 0.2));
    living.doors.push({ side: 'front', at: r1(at), width: r1(dw), main: true });
    mainDoorCol = clamp(Math.floor((living.x + at + dw / 2) / (W / 3)), 0, 2);
    const dCell = info(cellDir(mainDoorCol, 0));
    notes.push(`Cửa chính: đặt ở cung ${cellDir(mainDoorCol, 0)}${dCell.star ? ` (${dCell.star})` : ''}, mở ra hướng ${facing}${info(facing).star ? ` (${info(facing).star})` : ''}.`);
    if (info(facing).good === false) {
      const goodDirs = Object.keys(starMap).filter(d => starMap[d].good);
      notes.push(`Hướng mặt tiền ${facing} không hợp gia chủ → đề xuất xoay cánh/sảnh cửa chính lệch về ${goodDirs.slice(0, 2).join(' hoặc ')}; hoặc làm tam cấp, cổng chéo theo hướng tốt.`);
    }
    // nội thất phòng khách: sofa quay ra cửa, kệ TV tựa tường đặc
    const sw2 = Math.min(2.4, living.w - 1.0);
    living.items.push({ kind: 'sofa', x: living.x + 0.3, y: living.y + living.h * 0.35, w: 0.9, h: Math.min(2.4, living.h * 0.5) });
    living.items.push({ kind: 'tv', x: living.x + living.w - 0.5, y: living.y + living.h * 0.35, w: 0.4, h: Math.min(2.0, living.h * 0.45) });
    if (living.w >= 4) living.items.push({ kind: 'plant', x: living.x + living.w - 0.7, y: living.y + 0.3, w: 0.5, h: 0.5 });
    void sw2;
    if (living.h >= 5 && parking !== 'none' && !rooms.find(r => r.id === 'garage')) {
      living.items.push({ kind: 'moto', x: living.x + 0.4, y: living.y + 0.3, w: 0.7, h: 1.8, note: 'xe máy' });
    }
  }
  if (floor === 1) {
    const fy = rooms.find(r => r.id === 'front_yard');
    if (fy && parking !== 'none' && frontSB >= 1.8 && !rooms.find(r => r.id === 'garage')) {
      fy.items.push({ kind: 'moto', x: 0.4, y: fy.y + 0.1, w: 1.8, h: Math.min(0.7, fy.h - 0.2) });
    }
    const by = rooms.find(r => r.id === 'back_yard');
    if (by) by.items.push({ kind: 'washer', x: S ? 0.3 : W - 0.9, y: by.y + 0.1, w: 0.6, h: Math.min(0.6, by.h - 0.2) });
  }

  // Bếp: tọa ở góc sau có cung xấu, miệng bếp quay hướng tốt
  const kitchen = rooms.find(r => r.id === 'kitchen');
  if (kitchen) {
    const cRow = cellOf(kitchen.x + kitchen.w / 2, kitchen.y + kitchen.h / 2).row;
    const leftScore = cellScore(0, cRow), rightScore = cellScore(2, cRow);
    const stoveLeft = leftScore <= rightScore; // ô xấu hơn
    const stoveCol = stoveLeft ? 0 : 2;
    // đường bếp chạy dọc tường bên, bếp ở đầu gần tường sau
    const counterSide: Side = stoveLeft ? 'left' : 'right';
    const faceOptions: Side[] = [opp(counterSide), 'front'];
    const stoveFace = best(faceOptions);
    const cx = stoveLeft ? kitchen.x : kitchen.x + kitchen.w - 0.6;
    const counterLen = Math.min(kitchen.h - 0.6, 3.6);
    kitchen.items.push({ kind: 'counter', x: cx, y: kitchen.y + kitchen.h - counterLen - 0.1, w: 0.6, h: counterLen });
    if (stoveFace === 'front') {
      kitchen.items.push({ kind: 'stove', x: stoveLeft ? kitchen.x + 0.7 : kitchen.x + kitchen.w - 1.5, y: kitchen.y + kitchen.h - 0.65, w: 0.8, h: 0.55, facing: 'front' });
    } else {
      kitchen.items.push({ kind: 'stove', x: cx + 0.02, y: kitchen.y + kitchen.h - 1.6, w: 0.56, h: 0.8, facing: stoveFace });
    }
    kitchen.items.push({ kind: 'sink', x: cx + 0.05, y: kitchen.y + kitchen.h - counterLen + 0.2, w: 0.5, h: 0.7 });
    kitchen.items.push({ kind: 'fridge', x: stoveLeft ? kitchen.x + kitchen.w - 0.8 : kitchen.x + 0.1, y: kitchen.y + 0.2, w: 0.7, h: 0.7 });
    const dtW = Math.min(1.6, kitchen.w - 2.4), dtH = Math.min(0.9, kitchen.h * 0.3);
    if (dtW >= 0.8) kitchen.items.push({ kind: 'dining', x: kitchen.x + (kitchen.w - dtW) / 2, y: kitchen.y + Math.max(0.6, kitchen.h * 0.25), w: dtW, h: dtH });
    const sCell = info(cellDir(stoveCol, cRow));
    notes.push(`Bếp: đặt ở góc ${cellDir(stoveCol, cRow)}${sCell.star ? ` (${sCell.star}${sCell.good === false ? ' – cung xấu: tọa hung ✓' : sCell.good ? ' – cung tốt, cân nhắc' : ''})` : ''}; miệng bếp quay hướng ${describe(stoveFace)}.`);
    // cửa sau lệch trục cửa chính
    const back = kitchen.doors.find(d => d.side === 'rear');
    if (back) {
      // cửa sau: phía đối diện bếp nấu, và lệch khỏi trục cửa chính
      const mainD = living?.doors.find(d => d.main);
      const mainC = living && mainD ? living.x + mainD.at + mainD.width / 2 : W / 2;
      let at2 = stoveLeft ? kitchen.w - 1.1 : 0.3;
      const backC = kitchen.x + at2 + 0.4;
      if (Math.abs(backC - mainC) < 0.6) at2 = stoveLeft ? Math.max(0.3, at2 - 1.2) : at2 + 1.2;
      back.at = r1(at2);
    }
  }

  // Phòng thờ: bàn thờ tựa tường đặc, mặt quay hướng tốt
  const worship = rooms.find(r => r.id === 'worship');
  if (worship) {
    const facade = worship.windows[0] || 'front';
    // Ứng viên vách tựa: vách đặc trước, rồi vách có cửa đi (đặt bàn thờ lệch khỏi cửa). Không tựa vách cửa sổ mặt tiền.
    const solid: Side[] = (['front', 'rear', 'left', 'right'] as Side[]).filter(s => s !== facade && !worship.doors.some(d => d.side === s));
    const doorWalls: Side[] = (['front', 'rear', 'left', 'right'] as Side[]).filter(s => s !== facade && worship.doors.some(d => d.side === s));
    const faceScore = (wall: Side) => { const i = info(sideBearing(opp(wall))); return i.good === null ? 0 : (STAR_RANK[i.star] ?? (i.good ? 1 : -1)); };
    const pick = (list: Side[]) => list.slice().sort((x, y) => faceScore(y) - faceScore(x))[0];
    let altarBack: Side = pick(solid) || opp(facade);
    if (faceScore(altarBack) <= 0 && doorWalls.length) {
      const dw = pick(doorWalls);
      if (faceScore(dw) > faceScore(altarBack)) altarBack = dw;
    }
    if (faceScore(altarBack) < 0) notes.push('Phòng thờ không có vách đặc nào giúp bàn thờ quay hướng tốt → nên làm vách ngăn gỗ/kính mờ sau bàn thờ để xoay mặt bàn thờ về hướng tốt.');
    const aw = Math.min(1.97, worship.w - 0.6), ad = 0.61; // 1m97 x 61cm (cung Lỗ Ban tốt phổ biến)
    const face = opp(altarBack);
    const backDoor = worship.doors.find(d => d.side === altarBack);
    let axCenter = worship.x + (worship.w - aw) / 2;
    if (backDoor && (altarBack === 'front' || altarBack === 'rear')) {
      const doorMid = worship.x + backDoor.at + backDoor.width / 2;
      axCenter = doorMid < worship.x + worship.w / 2 ? worship.x + worship.w - aw - 0.1 : worship.x + 0.1;
    }
    const ax = altarBack === 'left' ? worship.x + 0.05 : altarBack === 'right' ? worship.x + worship.w - ad - 0.05 : axCenter;
    const ay = altarBack === 'front' ? worship.y + 0.05 : altarBack === 'rear' ? worship.y + worship.h - ad - 0.05 : worship.y + (worship.h - aw) / 2;
    const horizontal = altarBack === 'front' || altarBack === 'rear';
    worship.items.push({ kind: 'altar', x: ax, y: ay, w: horizontal ? aw : ad, h: horizontal ? ad : Math.min(aw, worship.h - 0.4), facing: face, note: 'Bàn thờ 197×61' });
    notes.push(`Bàn thờ: tựa tường đặc, mặt quay hướng ${describe(face)}. Không đặt dưới/đối diện WC, không sát bếp.`);
  } else if (floor === floors && floors === 1 && hasWorship && living) {
    notes.push('Bàn thờ: nhà hẹp nên dùng kệ thờ treo trên tường đặc phòng khách, mặt quay hướng tốt của gia chủ.');
  }

  // Phòng ngủ: giường tựa tường đặc, đầu giường hướng tốt; không đặt đầu giường dưới cửa sổ
  rooms.filter(r => r.type === 'bedroom' || r.type === 'master').forEach(r => {
    const blocked = new Set<Side>([...r.windows, ...r.doors.map(d => d.side), ...(r.blocked || [])]);
    const cand: Side[] = (['left', 'right', 'front', 'rear'] as Side[]).filter(s => !blocked.has(s));
    const headSide = cand.length ? best(cand) : (r.windows[0] ? opp(r.windows[0]) : 'left');
    const bw = r.type === 'master' ? 1.8 : 1.6, bl = 2.0;
    const horizontal = headSide === 'left' || headSide === 'right'; // giường nằm ngang
    let bx: number, by: number, w: number, h: number;
    if (horizontal) {
      w = Math.min(bl, r.w - 0.6); h = Math.min(bw, r.h - 0.8);
      bx = headSide === 'left' ? r.x + 0.05 : r.x + r.w - w - 0.05;
      by = r.y + (r.h - h) / 2;
    } else {
      w = Math.min(bw, r.w - 0.8); h = Math.min(bl, r.h - 0.6);
      bx = r.x + (r.w - w) / 2;
      by = headSide === 'front' ? r.y + 0.05 : r.y + r.h - h - 0.05;
    }
    r.items.push({ kind: 'bed', x: bx, y: by, w, h, facing: opp(headSide), note: `đầu giường ${sideBearing(headSide)}` });
    // tủ áo dọc tường còn lại
    // tủ áo: dọc tường bên không có đầu giường / cửa / cửa sổ, có đủ lối đi
    const blockedAll = new Set<Side>([...blocked, headSide]);
    const sideWalls: Side[] = (['left', 'right'] as Side[]).filter(sd => !blockedAll.has(sd));
    const clearW = horizontal ? r.w - w - 0.05 : (r.w - w) / 2;
    if (sideWalls.length && clearW >= 0.55 + 0.7) {
      const ws = sideWalls[0];
      const wl = Math.min(1.8, r.h - 1.4);
      if (wl >= 1.0) r.items.push({ kind: 'wardrobe', x: ws === 'left' ? r.x + 0.05 : r.x + r.w - 0.6, y: r.y + (r.h - wl) / 2, w: 0.55, h: wl });
    }
    if (r.type === 'master') notes.push(`Phòng ngủ master (cung ${r.sector}${r.star ? ' – ' + r.star : ''}): đầu giường hướng ${describe(headSide)}.`);
  });

  // WC: thiết bị
  rooms.filter(r => r.type === 'wc').forEach(r => {
    const long = r.h >= r.w;
    r.items.push({ kind: 'toilet', x: r.x + (long ? (r.w - 0.4) / 2 : r.w - 0.75), y: r.y + (long ? r.h - 0.7 : (r.h - 0.4) / 2), w: long ? 0.4 : 0.65, h: long ? 0.65 : 0.4 });
    r.items.push({ kind: 'basin', x: r.x + 0.1, y: r.y + 0.15, w: 0.45, h: 0.35 });
    if (r.w * r.h >= 3.0) r.items.push({ kind: 'shower', x: r.x + r.w - (long ? 0.9 : 0.9) - 0.02, y: r.y + 0.02, w: 0.85, h: 0.85 });
  });
  rooms.filter(r => r.type === 'lightwell' && floor === 1).forEach(r => {
    r.items.push({ kind: 'plant', x: r.x + r.w / 2 - 0.3, y: r.y + r.h / 2 - 0.3, w: 0.6, h: 0.6 });
  });

  /* ── Ghi chú phong thủy cho WC & thang ── */
  const wcCoreRoom = rooms.find(r => r.id === 'wc_core' || r.id === 'wc_0');
  if (wcCoreRoom) {
    if (wcCoreRoom.sector === 'Trung cung') checks.push({ ok: false, text: 'WC đang nằm trung cung (giữa nhà) — nên dời sát tường hông.' });
    notes.push(`WC: cung ${wcCoreRoom.sector}${wcCoreRoom.star ? ` (${wcCoreRoom.star}${wcCoreRoom.good === false ? ' – cung xấu: "trấn" hung khí ✓' : wcCoreRoom.good ? ' – cung tốt: nên giữ cửa WC luôn đóng, thông gió cưỡng bức' : ''})` : ''}${wcCoreRoom.sector === 'Trung cung' ? '' : '; không nằm trung tâm nhà'}.`);
  }
  if (hasStair) {
    const st = rooms.find(r => r.id === 'stair');
    if (st) notes.push(`Cầu thang: ${st.name} rộng vế ≥ 0,9m, đặt sát tường ${stairSide === 'left' ? 'trái' : 'phải'} (cung ${st.sector}${st.star ? ' – ' + st.star : ''}), không đâm thẳng cửa chính.`);
  }
  if (!hasFs) notes.push('Chưa có dữ liệu cung mệnh gia chủ — bố trí theo công năng; hãy xem phong thủy ở Bước A để tối ưu theo tuổi.');

  /* ── Kiểm tra kỹ thuật ── */
  rooms.forEach(r => {
    const key = r.type === 'master' ? 'master' : r.type;
    const m = MIN[key];
    if (!m || r.outside) return;
    const area = r1(r.w * r.h), minSide = Math.min(r.w, r.h);
    const why: string[] = [];
    if (area < m.area - 0.05) why.push(`diện tích < ${m.area}m²`);
    if (minSide < m.width - 0.05) why.push(`cạnh ngắn < ${m.width}m`);
    if (why.length) checks.push({ ok: false, text: `${r.name}: ${r.w}×${r.h}m = ${area}m² — ${why.join(', ')} (khuyến nghị).` });
  });
  if (H > 15) checks.push({ ok: lw > 0 || (floors === 1 && W >= 8), text: lw > 0 ? `Nhà sâu ${H}m: có giếng trời ${lw}m lấy sáng – thông gió giữa nhà ✓` : floors === 1 && W >= 8 ? `Nhà 1 tầng rộng ${W}m: lấy sáng cửa sổ hông + ô kính mái hành lang ✓` : `Nhà sâu ${H}m nhưng chưa có giếng trời.` });
  else checks.push({ ok: true, text: `Nhà sâu ${H}m: lấy sáng 2 mặt trước/sau${hasStair ? ' + ô kính lấy sáng trên mái thang' : ''} ✓` });
  if (hasStair) checks.push({ ok: true, text: `Lõi thang + WC xếp chồng thẳng đứng các tầng (gọn kết cấu, ống thoát) ✓` });
  checks.push({ ok: true, text: 'Cửa chính và cửa sau không thẳng hàng (tránh gió xuyên nhà, "xuyên tâm") ✓' });

  const lotArea = r1(W * L);
  const footprint = r1(W * H);
  const pct = Math.round(footprint / lotArea * 100);
  const maxPct = maxDensityPct(lotArea);
  checks.push({ ok: pct <= maxPct, text: `Mật độ xây dựng ${pct}% (đất ${lotArea}m², tối đa ~${maxPct}% theo QCVN 01:2021 — cần đối chiếu quy hoạch địa phương)${pct <= maxPct ? ' ✓' : ' ✗ cần tăng khoảng lùi'}.` });

  const placedTotal = Object.values(bedsPerFloor).reduce((a, b) => a + b, 0);
  if (floor === 1 && placedTotal < totalBeds) {
    checks.push({ ok: false, text: `Toàn nhà mới xếp được ${placedTotal}/${totalBeds} phòng ngủ đạt chuẩn với ${floors} tầng trên lô ${W}×${L}m.` });
  }

  return {
    widthM: W, lengthM: L, houseLengthM: H, frontSetbackM: frontSB, backSetbackM: backSB,
    floor, totalFloors: floors, facing, facingDeg: D, northPageDeg, stairSide,
    rooms, grid, checks, fengShuiNotes: notes, sketchNotes,
    density: { lotArea, footprint, pct, maxPct },
    bedroomsThisFloor: bedsHere, totalBedroomsPlaced: placedTotal, totalBedroomsRequested: totalBeds
  };
}
