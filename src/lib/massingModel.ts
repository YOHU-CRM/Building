/**
 * YOHU CONSTECH — MÔ HÌNH 3D HÌNH KHỐI từ chính mặt bằng (architectPlanner / sketchFreePlanner)
 *
 * Chỉ tính toán (không vẽ): trả về danh sách khối hộp / mái / cột / nhãn để Massing3DViewer dựng bằng three.js.
 * Không gọi API, chạy ngay trên điện thoại.
 *
 * Hệ trục 3D: X = ngang nhà (như mặt bằng), Y = độ cao, Z = −(chiều sâu mặt bằng) → mặt tiền nhìn về +Z.
 */

import { planFloor, FloorPlanResult, PlanRoom, PlanDoor, Side, PlannerInput } from './architectPlanner';
import { normalizeRoof, RoofKind } from './boqEngine';

export type MatKey =
  | 'wall_ext' | 'wall_int' | 'slab' | 'plinth' | 'glass' | 'door_main' | 'door' | 'rolling'
  | 'roof_ton' | 'roof_ngoi' | 'roof_btct' | 'roof_thai' | 'ground' | 'lot' | 'pond' | 'garden' | 'yard'
  | 'porch' | 'column' | 'railing' | 'trunk' | 'leaf' | 'stair' | 'stone' | 'outkitchen' | 'chimney' | 'walkway_roof'
  | 'frame' | 'ridge' | 'fascia' | 'solar' | 'paving' | 'shrub'
  | `floor_${string}`;

export type Prim =
  | { t: 'box'; x: number; y: number; z: number; sx: number; sy: number; sz: number; mat: MatKey; floor: number; tag?: 'roof' | 'roomFloor' | 'site'; rx?: number; rz?: number }
  | { t: 'gable'; x0: number; z0: number; x1: number; z1: number; y: number; rise: number; axis: 'x' | 'z'; mat: MatKey; floor: number; tag: 'roof' | 'site' }
  | { t: 'cyl'; x: number; y: number; z: number; r: number; h: number; mat: MatKey; floor: number; tag?: 'site' | 'roof' }
  | { t: 'sphere'; x: number; y: number; z: number; r: number; mat: MatKey; floor: number; tag?: 'site' }
  | { t: 'label'; x: number; y: number; z: number; text: string; color: string; floor: number; tag?: 'roomLabel' | 'site' };

export interface MassingModel {
  prims: Prim[];
  floors: number;
  floorBase: number[];        // cao độ sàn từng tầng (index 1..n)
  floorHeight: number[];
  roofKind: RoofKind;
  bbox: { x0: number; x1: number; z0: number; z1: number; yMax: number };
  facing: string;
  facingDeg: number;
  plans: FloorPlanResult[];
  summary: string[];
}

export interface MassingInput extends Omit<PlannerInput, 'floor'> {
  roofType?: string;          // "Tôn lạnh", "Mái ngói", "Mái bằng", "Mái Thái"...
  floorHeight1?: number | string;      // chiều cao tầng 1 (m), mặc định 3,6
  floorHeightUpper?: number | string;  // chiều cao tầng trên (m), mặc định 3,3
  solar?: boolean;            // mô tả có điện mặt trời áp mái → đặt tấm pin trên mái hướng Nam nhất
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const PLINTH = 0.45;          // cốt nền +0.45 so với sân
const SLAB = 0.15;
const FLOOR_COLOR: Record<string, string> = {
  living: '#f3e3c3', kitchen: '#d9f2e6', dining: '#f8dfe3', bedroom: '#dbe7fb', master: '#cddcfa', wc: '#d4ecf7', stair: '#e2e8f0',
  corridor: '#ececec', worship: '#f7e2a8', common: '#e6e0f7', storage: '#e4e4e7', garage: '#dfe3e8', terrace: '#d9f0d9', lightwell: '#bfe8c8'
};
export const floorColor = (type: string) => FLOOR_COLOR[type] || '#eeeeee';

/** "9x14" / "9 x 14 m" / "120m2" → rộng × dài (m) — dùng chung cho 3D và mặt đứng */
export function parseDimsWL(d?: string) {
  const s = String(d || '').toLowerCase().replace(/m2|m²/g, '').replace(/,/g, '.');
  const m = s.match(/(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)/);
  if (m) return { w: parseFloat(m[1]), l: parseFloat(m[2]) };
  const a = parseFloat(s) || 100; const w = Math.round(Math.sqrt(a / 2.5)) || 5;
  return { w, l: Math.round(a / w) };
}

/** Toạ độ mặt bằng → thế giới 3D */
const WX = (x: number) => x;
const WZ = (y: number) => -y;

export function buildMassing(input: MassingInput): MassingModel {
  const floors = Math.max(1, Math.round(Number(input.totalFloors) || 1));
  const plans: FloorPlanResult[] = [];
  for (let f = 1; f <= floors; f++) plans.push(planFloor({ ...input, floor: f, totalFloors: floors }));
  const free = plans[0].mode === 'free';
  const roofKind = normalizeRoof(input.roofType, floors);
  const prims: Prim[] = [];
  const floorBase: number[] = [0, PLINTH];
  const floorHeight: number[] = [0];
  for (let f = 1; f <= floors; f++) {
    const hv = (v: any, d: number) => { const x = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(x) && x >= 2.4 && x <= 6 ? x : d; };
    floorHeight[f] = f === 1 ? hv(input.floorHeight1, 3.6) : hv(input.floorHeightUpper, 3.3);
    floorBase[f + 1] = r2(floorBase[f] + floorHeight[f]);
  }
  const topY = floorBase[floors + 1];
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: MatKey, floor: number, tag?: 'roof' | 'roomFloor' | 'site') => {
    const sx = Math.abs(x1 - x0), sy = Math.abs(y1 - y0), sz = Math.abs(z1 - z0);
    if (sx < 0.01 || sy < 0.005 || sz < 0.01) return;
    prims.push({ t: 'box', x: r2((x0 + x1) / 2), y: r2((y0 + y1) / 2), z: r2((z0 + z1) / 2), sx: r2(sx), sy: r2(sy), sz: r2(sz), mat, floor, tag });
  };
  /** khối nằm trên mặt bằng (x, y mặt bằng) */
  const pbox = (x: number, y: number, w: number, d: number, e0: number, e1: number, mat: MatKey, floor: number, tag?: 'roof' | 'roomFloor' | 'site') =>
    box(WX(x), WX(x + w), e0, e1, WZ(y + d), WZ(y), mat, floor, tag);

  /* ── Khu đất ── */
  const p1 = plans[0];
  const lot = p1.lot || { x: 0, y: -p1.frontSetbackM, w: p1.widthM, h: p1.lengthM };
  pbox(lot.x - 3, lot.y - 3, lot.w + 6, lot.h + 6, -0.06, -0.02, 'ground', 0, 'site');
  pbox(lot.x, lot.y, lot.w, lot.h, -0.02, 0, 'lot', 0, 'site');

  const walledOf = (p: FloorPlanResult) => p.rooms.filter(r => !r.outside && !r.open && r.type !== 'porch');
  const OPEN_STRIP = new Set(['living', 'kitchen', 'dining', 'corridor', 'stair', 'common', 'garage']);

  for (let f = 1; f <= floors; f++) {
    const plan = plans[f - 1];
    const e0 = floorBase[f], fh = floorHeight[f], wallTop = e0 + fh - SLAB;
    const walled = walledOf(plan);
    const insideAll = plan.rooms.filter(r => !r.outside);

    /* nền / sàn */
    if (f === 1) {
      walled.forEach(r => pbox(r.x, r.y, r.w, r.h, 0, PLINTH, 'plinth', 1));
      insideAll.filter(r => r.open).forEach(r => pbox(r.x, r.y, r.w, r.h, 0, PLINTH - 0.15, 'plinth', 1));
    }
    // màu sàn từng phòng (thấy khi bóc mái / xem từng tầng)
    insideAll.forEach(r => {
      if (r.type === 'lightwell' && f > 1) return;
      pbox(r.x + 0.02, r.y + 0.02, r.w - 0.04, r.h - 0.04, e0, e0 + 0.02, `floor_${r.type}`, f, 'roomFloor');
      if (r.name && r.type !== 'corridor') prims.push({ t: 'label', x: WX(r.x + r.w / 2), y: e0 + 0.9, z: WZ(r.y + r.h / 2), text: r.name.split(' (')[0].split(' · ')[0], color: '#0f172a', floor: f, tag: 'roomLabel' });
    });
    // sàn tầng trên (đáy sàn của tầng f+1) — bỏ chỗ giếng trời
    const slabRooms = f < floors ? plans[f].rooms.filter(r => !r.outside && !r.open) : [];
    slabRooms.forEach(r => pbox(r.x, r.y, r.w, r.h, wallTop, e0 + fh, 'slab', f + 1));

    /* tường + lỗ cửa */
    buildWalls(plan, walled, insideAll, f, e0, wallTop, free, OPEN_STRIP, pbox);

    /* cầu thang */
    plan.rooms.filter(r => r.type === 'stair' && f < floors).forEach(st => buildStair(st, e0, fh, f, pbox));

    /* ban công tầng trên */
    plan.rooms.filter(r => r.type === 'balcony').forEach(b => {
      pbox(b.x, b.y, b.w, b.h, e0 - SLAB, e0, 'slab', f);
      pbox(b.x, b.y, 0.06, b.h, e0, e0 + 1.1, 'railing', f);
      pbox(b.x + b.w - 0.06, b.y, 0.06, b.h, e0, e0 + 1.1, 'railing', f);
      pbox(b.x, b.y, b.w, 0.06, e0, e0 + 1.1, 'railing', f);
    });
    /* sân thượng (tầng trên cùng) — lan can */
    insideAll.filter(r => r.type === 'terrace').forEach(t => {
      pbox(t.x, t.y, t.w, t.h, e0 - SLAB, e0, 'slab', f);
      edgesNotShared(t, walled).forEach(([x, y, w, d]) => pbox(x, y, w, d, e0, e0 + 1.0, 'wall_ext', f));
    });
    /* giếng trời: lan can tầng trên */
    if (f > 1) insideAll.filter(r => r.type === 'lightwell').forEach(l => edgesNotShared(l, []).forEach(([x, y, w, d]) => pbox(x, y, w, d, e0, e0 + 1.0, 'railing', f)));
  }

  /* ── Mái ── */
  const top = plans[floors - 1];
  const topWalled = walledOf(top);
  const bb = bboxOf(topWalled);
  const roofMat: MatKey = roofKind === 'ton' ? 'roof_ton' : roofKind === 'ngoi' ? 'roof_ngoi' : roofKind === 'thai_nhat' ? 'roof_thai' : 'roof_btct';
  if (bb) {
    if (roofKind === 'btct') {
      topWalled.forEach(r => pbox(r.x, r.y, r.w, r.h, topY - SLAB, topY, 'roof_btct', floors + 1, 'roof'));
      // tường chắn mái 0,9m
      edgesNotShared({ x: bb.x0, y: bb.y0, w: bb.x1 - bb.x0, h: bb.y1 - bb.y0 } as PlanRoom, []).forEach(([x, y, w, d]) => pbox(x, y, w, d, topY, topY + 0.9, 'wall_ext', floors + 1, 'roof'));
      // tum thang
      const st = top.rooms.find(r => r.type === 'stair');
      if (st && floors > 1) {
        edgesNotShared(st, []).forEach(([x, y, w, d]) => pbox(x, y, w, d, topY, topY + 2.8, 'wall_ext', floors + 1, 'roof'));
        pbox(st.x - 0.3, st.y - 0.3, st.w + 0.6, st.h + 0.6, topY + 2.8, topY + 2.95, 'roof_btct', floors + 1, 'roof');
      }
    } else {
      const ov = 0.6;
      const pitchDeg = roofKind === 'ton' ? 15 : roofKind === 'ngoi' ? 30 : 35;
      const tg = Math.tan(pitchDeg * Math.PI / 180);
      topWalled.forEach(r => pbox(r.x, r.y, r.w, r.h, topY - SLAB, topY, 'slab', floors + 1, 'roof'));
      // Nhà chữ L / chữ T (phần nhô, khối phụ): mỗi khối 1 mái riêng, khối phụ đâm vào mái chính — không trùm mái lên sân trống
      const blocks = roofBlocks(topWalled);
      const main = blocks.slice().sort((a, b) => b.w * b.h - a.w * a.h)[0];
      blocks.forEach(bk => {
        let along: 'x' | 'z' = bk.w >= bk.h ? 'x' : 'z';      // nóc chạy theo cạnh dài
        if (bk !== main) {                                     // khối phụ giáp khối chính: nóc vuông góc với cạnh giáp
          if (Math.abs(bk.y + bk.h - main.y) < 0.05 || Math.abs(bk.y - (main.y + main.h)) < 0.05) along = 'z';
          else if (Math.abs(bk.x + bk.w - main.x) < 0.05 || Math.abs(bk.x - (main.x + main.w)) < 0.05) along = 'x';
        }
        const span = (along === 'x' ? bk.h : bk.w) / 2 + ov;
        const rise = r2(span * tg), ovRise = r2(ov * tg);
        // khối phụ: mép giáp khối chính kéo vào trong mái chính 1 m để 2 mái liền nhau
        let x0 = bk.x - ov, x1 = bk.x + bk.w + ov, y0 = bk.y - ov, y1 = bk.y + bk.h + ov;
        if (bk !== main) {
          if (Math.abs(bk.y + bk.h - main.y) < 0.05) y1 = bk.y + bk.h + 1.0; if (Math.abs(bk.y - (main.y + main.h)) < 0.05) y0 = bk.y - 1.0;
          if (Math.abs(bk.x + bk.w - main.x) < 0.05) x1 = bk.x + bk.w + 1.0; if (Math.abs(bk.x - (main.x + main.w)) < 0.05) x0 = bk.x - 1.0;
        }
        prims.push({ t: 'gable', x0: WX(x0), x1: WX(x1), z0: WZ(y1), z1: WZ(y0), y: r2(topY - ovRise), rise, axis: along, mat: roofMat, floor: floors + 1, tag: 'roof' });
        // nóc mái (úp nóc) + diềm mái
        if (along === 'x') {
          pbox(x0, bk.y + bk.h / 2 - 0.13, x1 - x0, 0.26, topY - ovRise + rise - 0.02, topY - ovRise + rise + 0.1, 'ridge', floors + 1, 'roof');
          [y0, y1 - 0.04].forEach(yy => pbox(x0, yy, x1 - x0, 0.04, topY - ovRise - 0.18, topY - ovRise, 'fascia', floors + 1, 'roof'));
          [bk.x, bk.x + bk.w - 0.2].forEach(x => { if (bk === main || !touchesX(bk, main, x)) prims.push({ t: 'gable', x0: WX(x), x1: WX(x + 0.2), z0: WZ(bk.y + bk.h), z1: WZ(bk.y), y: topY, rise: r2(rise - ovRise), axis: 'x', mat: 'wall_ext', floor: floors + 1, tag: 'roof' }); });
        } else {
          pbox(bk.x + bk.w / 2 - 0.13, y0, 0.26, y1 - y0, topY - ovRise + rise - 0.02, topY - ovRise + rise + 0.1, 'ridge', floors + 1, 'roof');
          [x0, x1 - 0.04].forEach(xx => pbox(xx, y0, 0.04, y1 - y0, topY - ovRise - 0.18, topY - ovRise, 'fascia', floors + 1, 'roof'));
          [bk.y, bk.y + bk.h - 0.2].forEach(y => { if (bk === main || !touchesY(bk, main, y)) prims.push({ t: 'gable', x0: WX(bk.x), x1: WX(bk.x + bk.w), z0: WZ(y + 0.2), z1: WZ(y), y: topY, rise: r2(rise - ovRise), axis: 'z', mat: 'wall_ext', floor: floors + 1, tag: 'roof' }); });
        }
        // Điện mặt trời áp mái (theo mô tả): tấm pin trên mặt mái của khối chính quay về phía Nam nhất
        if (input.solar && bk === main) {
          const southSide = (side: 'front' | 'rear' | 'left' | 'right') => { const b = { rear: 0, right: 90, front: 180, left: 270 }[side]; const brg = (((b + plans[0].facingDeg - 180) % 360) + 360) % 360; return Math.abs(((brg - 180 + 540) % 360) - 180); };
          const sides = (along === 'x' ? ['front', 'rear'] : ['left', 'right']) as ('front' | 'rear' | 'left' | 'right')[];
          const side = sides.sort((a, b) => southSide(a) - southSide(b))[0];
          const slopeLen = span / Math.cos(Math.atan(tg)), ang = Math.atan(tg);
          const pw = 1.05, pl = 1.75, gap = 0.05;
          // đoạn mặt mái còn trống (không bị mái khối phụ đâm vào) — đặt pin ở đoạn dài nhất
          const s0 = along === 'x' ? bk.x + 0.6 : bk.y + 0.6, s1 = along === 'x' ? bk.x + bk.w - 0.6 : bk.y + bk.h - 0.6;
          let free: [number, number][] = [[s0, s1]];
          blocks.filter(o => o !== bk).forEach(o => {
            const onSide = along === 'x' ? (side === 'front' ? Math.abs(o.y + o.h - bk.y) < 0.05 : Math.abs(o.y - bk.y - bk.h) < 0.05) : (side === 'left' ? Math.abs(o.x + o.w - bk.x) < 0.05 : Math.abs(o.x - bk.x - bk.w) < 0.05);
            if (!onSide) return;
            const a = (along === 'x' ? o.x : o.y) - 0.8, b = (along === 'x' ? o.x + o.w : o.y + o.h) + 0.8;
            free = free.flatMap(([p0, p1]) => { const r: [number, number][] = []; if (a > p0) r.push([p0, Math.min(p1, a)]); if (b < p1) r.push([Math.max(p0, b), p1]); return r; });
          });
          const seg0 = free.sort((u, v) => (v[1] - v[0]) - (u[1] - u[0]))[0] || [s0, s1];
          const runLen = seg0[1] - seg0[0], runMid = (seg0[0] + seg0[1]) / 2;
          const nAlong = Math.max(0, Math.min(12, Math.floor(runLen * 0.85 / (pw + gap))));
          const nRows = slopeLen > 4.4 ? 2 : 1;
          for (let rI = 0; rI < nRows; rI++) for (let i = 0; i < nAlong; i++) {
            const t = 0.9 + rI * (pl + 0.1) + pl / 2;                       // khoảng cách từ nóc xuống theo mặt dốc
            const dh = t * Math.cos(ang), dy = t * Math.sin(ang);
            const yy = topY - ovRise + rise - dy + 0.06;
            const off = -((nAlong - 1) * (pw + gap)) / 2 + i * (pw + gap);
            if (along === 'x') {
              const cxp = runMid + off, cyp = side === 'front' ? bk.y + bk.h / 2 - dh : bk.y + bk.h / 2 + dh;
              prims.push({ t: 'box', x: WX(cxp), y: r2(yy), z: WZ(cyp), sx: pw, sy: 0.04, sz: pl, mat: 'solar', floor: floors + 1, tag: 'roof', rx: side === 'front' ? ang : -ang });
            } else {
              const cyp = runMid + off, cxp = side === 'left' ? bk.x + bk.w / 2 - dh : bk.x + bk.w / 2 + dh;
              prims.push({ t: 'box', x: WX(cxp), y: r2(yy), z: WZ(cyp), sx: pl, sy: 0.04, sz: pw, mat: 'solar', floor: floors + 1, tag: 'roof', rz: side === 'left' ? ang : -ang });
            }
          }
        }
      });
    }
  }

  const roofBlocksTop = roofKind === 'btct' ? [] : roofBlocks(walledOf(plans[floors - 1]));
  /* ── Ngoài nhà (tầng 1) ── */
  const eave1 = floors === 1 ? topY : floorBase[2];
  p1.rooms.filter(r => r.outside).forEach(r => {
    switch (r.type) {
      case 'yard': pbox(r.x, r.y, r.w, r.h, 0, 0.03, 'yard', 0, 'site'); break;
      case 'pond': pbox(r.x, r.y, r.w, r.h, -0.01, 0.04, 'pond', 0, 'site'); break;
      case 'garden': {
        pbox(r.x, r.y, r.w, r.h, 0, 0.04, 'garden', 0, 'site');
        const n = Math.max(1, Math.floor(Math.max(r.w, r.h) / 3.2));
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          const x = r.w >= r.h ? r.x + r.w * t : r.x + r.w / 2, y = r.w >= r.h ? r.y + r.h / 2 : r.y + r.h * t;
          prims.push({ t: 'cyl', x: WX(x), y: 0.9, z: WZ(y), r: 0.12, h: 1.8, mat: 'trunk', floor: 0, tag: 'site' });
          prims.push({ t: 'sphere', x: WX(x), y: 2.4, z: WZ(y), r: 1.1, mat: 'leaf', floor: 0, tag: 'site' });
        }
        break;
      }
      case 'porch': {
        // hiên nằm dưới mái chính (trong khối nhà) hay ở ngoài khối (mái hiên riêng / sân trống)
        const covered = roofBlocksTop.some(b => r.x >= b.x - 0.05 && r.x + r.w <= b.x + b.w + 0.05 && r.y >= b.y - 0.05 && r.y + r.h <= b.y + b.h + 0.05);
        if (!covered && r.roofed === false) { pbox(r.x, r.y, r.w, r.h, 0, 0.06, 'paving', 0, 'site'); break; }
        const inGrid = covered;
        pbox(r.x, r.y, r.w, r.h, 0, inGrid ? PLINTH : PLINTH - 0.15, 'porch', 1);
        if (!inGrid) {
          // mái hiên dốc nhẹ ra phía ngoài + cột ở góc không tựa tường
          const walledG = walledOf(p1);
          const touch = (s0: Side) => walledG.some(o => s0 === 'rear' ? Math.abs(o.y - (r.y + r.h)) < 0.05 && o.x < r.x + r.w && o.x + o.w > r.x : s0 === 'front' ? Math.abs(o.y + o.h - r.y) < 0.05 && o.x < r.x + r.w && o.x + o.w > r.x : s0 === 'left' ? Math.abs(o.x + o.w - r.x) < 0.05 && o.y < r.y + r.h && o.y + o.h > r.y : Math.abs(o.x - (r.x + r.w)) < 0.05 && o.y < r.y + r.h && o.y + o.h > r.y);
          const back: Side = (['rear', 'left', 'right', 'front'] as Side[]).find(touch) || 'rear';
          const hi = eave1 - 0.2, lo = hi - Math.max(0.25, (back === 'rear' || back === 'front' ? r.h : r.w) * 0.17);
          const ang = Math.atan((hi - lo) / Math.max(0.5, back === 'rear' || back === 'front' ? r.h : r.w));
          const len = (back === 'rear' || back === 'front' ? r.h : r.w) + 0.5;
          const cxp = back === 'left' ? r.x + r.w / 2 + 0.25 : back === 'right' ? r.x + r.w / 2 - 0.25 : r.x + r.w / 2;
          const cyp = back === 'rear' ? r.y + r.h / 2 - 0.25 : back === 'front' ? r.y + r.h / 2 + 0.25 : r.y + r.h / 2;
          if (back === 'rear' || back === 'front') prims.push({ t: 'box', x: WX(cxp), y: r2((hi + lo) / 2), z: WZ(cyp), sx: r.w + 0.6, sy: 0.07, sz: r2(len / Math.cos(ang)), mat: roofMat === 'roof_btct' ? 'roof_btct' : roofMat, floor: 1, tag: 'roof', rx: back === 'rear' ? ang : -ang });
          else prims.push({ t: 'box', x: WX(cxp), y: r2((hi + lo) / 2), z: WZ(cyp), sx: r2(len / Math.cos(ang)), sy: 0.07, sz: r.h + 0.6, mat: roofMat === 'roof_btct' ? 'roof_btct' : roofMat, floor: 1, tag: 'roof', rz: back === 'left' ? -ang : ang });
          const corners: [number, number][] = [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]];
          corners.filter(([cx2, cy2]) => !walledG.some(o => cx2 >= o.x - 0.05 && cx2 <= o.x + o.w + 0.05 && cy2 >= o.y - 0.05 && cy2 <= o.y + o.h + 0.05))
            .forEach(([cx2, cy2]) => prims.push({ t: 'cyl', x: WX(cx2 + (cx2 > r.x + r.w / 2 ? -0.18 : 0.18)), y: (PLINTH + lo) / 2, z: WZ(cy2 + (cy2 > r.y + r.h / 2 ? -0.18 : 0.18)), r: 0.12, h: lo - PLINTH + 0.05, mat: 'column', floor: 1 }));
        } else {
          // hiên nằm trong mái chính: cột ở góc tự do
          const walledG = walledOf(p1);
          const corners: [number, number][] = [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]];
          corners.filter(([cx, cy]) => !walledG.some(o => cx >= o.x - 0.05 && cx <= o.x + o.w + 0.05 && cy >= o.y - 0.05 && cy <= o.y + o.h + 0.05))
            .forEach(([cx, cy]) => prims.push({ t: 'cyl', x: WX(cx + (cx > r.x + r.w / 2 ? -0.2 : 0.2)), y: (PLINTH + eave1) / 2, z: WZ(cy + (cy > r.y + r.h / 2 ? -0.2 : 0.2)), r: 0.13, h: eave1 - PLINTH, mat: 'column', floor: 1 }));
        }
        break;
      }
      case 'walkway': {
        pbox(r.x, r.y, r.w, r.h, 0, 0.12, 'porch', 0, 'site');
        pbox(r.x - 0.2, r.y - 0.2, r.w + 0.4, r.h + 0.4, 2.45, 2.52, 'walkway_roof', 0, 'site');
        [[r.x + 0.1, r.y + 0.1], [r.x + r.w - 0.1, r.y + 0.1], [r.x + 0.1, r.y + r.h - 0.1], [r.x + r.w - 0.1, r.y + r.h - 0.1]]
          .forEach(([x, y]) => prims.push({ t: 'cyl', x: WX(x), y: 1.22, z: WZ(y), r: 0.05, h: 2.45, mat: 'column', floor: 0, tag: 'site' }));
        break;
      }
      case 'outkitchen': {
        pbox(r.x, r.y, r.w, r.h, 0, 0.2, 'plinth', 0, 'site');
        // 3 mặt tường (mặt quay về lối đi để trống)
        const walk = p1.rooms.find(o => o.type === 'walkway');
        const openSide: Side = !walk ? 'front' : walk.y + walk.h <= r.y + 0.01 ? 'front' : walk.y >= r.y + r.h - 0.01 ? 'rear' : walk.x + walk.w <= r.x + 0.01 ? 'left' : 'right';
        const t = 0.15;
        (['front', 'rear', 'left', 'right'] as Side[]).filter(s => s !== openSide).forEach(s => {
          if (s === 'front') pbox(r.x, r.y, r.w, t, 0.2, 2.6, 'outkitchen', 0, 'site');
          if (s === 'rear') pbox(r.x, r.y + r.h - t, r.w, t, 0.2, 2.6, 'outkitchen', 0, 'site');
          if (s === 'left') pbox(r.x, r.y, t, r.h, 0.2, 2.6, 'outkitchen', 0, 'site');
          if (s === 'right') pbox(r.x + r.w - t, r.y, t, r.h, 0.2, 2.6, 'outkitchen', 0, 'site');
        });
        prims.push({ t: 'gable', x0: WX(r.x - 0.4), x1: WX(r.x + r.w + 0.4), z0: WZ(r.y + r.h + 0.4), z1: WZ(r.y - 0.4), y: 2.6, rise: 0.9, axis: r.w >= r.h ? 'x' : 'z', mat: 'roof_ton', floor: 0, tag: 'site' });
        const stove = r.items.find(i => i.kind === 'stove');
        if (stove) {
          pbox(stove.x, stove.y, stove.w, stove.h, 0.2, 0.9, 'stone', 0, 'site');
          // ống khói cao hơn mái nhà
          const ch = Math.max(4.2, topY + (roofKind === 'btct' ? 1.5 : 0.8));
          pbox(stove.x + stove.w / 2 - 0.2, stove.y + stove.h / 2 - 0.2, 0.4, 0.4, 0.9, Math.min(ch, 6), 'chimney', 0, 'site');
        }
        prims.push({ t: 'label', x: WX(r.x + r.w / 2), y: 4.0, z: WZ(r.y + r.h / 2), text: 'Bếp phụ (đun củi)', color: '#9a3412', floor: 0, tag: 'site' });
        break;
      }
      case 'well': prims.push({ t: 'cyl', x: WX(r.x + r.w / 2), y: 0.4, z: WZ(r.y + r.h / 2), r: Math.min(r.w, r.h) / 2 - 0.1, h: 0.8, mat: 'stone', floor: 0, tag: 'site' }); break;
      default: break;
    }
  });
  // cửa chính
  const mainRoom = p1.rooms.find(r => r.doors.some(d => d.main));
  if (mainRoom) {
    const d = mainRoom.doors.find(x => x.main)!;
    const [px, py] = doorAbs(mainRoom, d);
    const out = outwardV(d.side);
    prims.push({ t: 'label', x: WX(px + out[0] * 1.2), y: 3.1, z: WZ(py + out[1] * 1.2), text: 'CỬA CHÍNH', color: '#dc2626', floor: 0, tag: 'site' });
  }
  // lối đi lát đá từ cửa chính ra sân trước + cây xanh minh họa ở góc sau khu đất (không phải hạng mục thiết kế)
  if (mainRoom) {
    const d = mainRoom.doors.find(x => x.main)!;
    const [px, py] = doorAbs(mainRoom, d);
    if (d.side === 'front') { const yEnd = lot.y; const yStart = Math.min(py, ...p1.rooms.filter(r => r.outside && r.roofed && px > r.x && px < r.x + r.w).map(r => r.y)); if (yStart - yEnd > 0.3) pbox(px - 0.75, yEnd, 1.5, yStart - yEnd, 0, 0.05, 'paving', 0, 'site'); }
  }
  if (!p1.rooms.some(r => r.type === 'garden')) {
    const bbH = bboxOf(walledOf(p1));
    if (bbH) [[bbH.x0 - 2.0, bbH.y1 + 1.5], [bbH.x1 + 2.0, bbH.y1 + 1.5], [bbH.x1 + 2.2, bbH.y0 - 1.0]].forEach(([x, y], i) => {
      prims.push({ t: 'cyl', x: WX(x), y: 0.9, z: WZ(y), r: 0.12, h: 1.8, mat: 'trunk', floor: 0, tag: 'site' });
      prims.push({ t: 'sphere', x: WX(x), y: 2.5, z: WZ(y), r: i === 2 ? 1.0 : 1.3, mat: 'leaf', floor: 0, tag: 'site' });
    });
  }
  // la bàn trên mặt đất
  const D = p1.facingDeg;
  const cx = lot.x + lot.w / 2, cy = lot.y + lot.h / 2, R = Math.max(lot.w, lot.h) / 2 + 2.5;
  ([['B', 0], ['Đ', 90], ['N', 180], ['T', 270]] as [string, number][]).forEach(([t, b]) => {
    const phi = (b - D) * Math.PI / 180;
    const vx = -Math.sin(phi), vy = -Math.cos(phi);       // vector mặt bằng của hướng b
    prims.push({ t: 'label', x: WX(cx + vx * R), y: 0.6, z: WZ(cy + vy * R), text: t, color: t === 'B' ? '#dc2626' : '#334155', floor: 0, tag: 'site' });
  });

  /* ── Khung bao ── */
  const xs = prims.filter(p => p.t === 'box').map(p => p as any);
  const bbox = {
    x0: Math.min(lot.x - 3, ...xs.map(p => p.x - p.sx / 2)), x1: Math.max(lot.x + lot.w + 3, ...xs.map(p => p.x + p.sx / 2)),
    z0: Math.min(-(lot.y + lot.h) - 3, ...xs.map(p => p.z - p.sz / 2)), z1: Math.max(-lot.y + 3, ...xs.map(p => p.z + p.sz / 2)),
    yMax: topY + 3
  };
  const yTop = Math.max(...prims.filter(p => p.tag === 'roof').map(p => p.t === 'gable' ? p.y + p.rise : p.t === 'box' ? p.y + p.sy / 2 : 0), topY);
  const summary = [
    `${floors} tầng · cốt nền +${PLINTH}m · tầng 1 cao ${floorHeight[1]}m${floors > 1 ? ` · tầng trên ${floorHeight[2]}m` : ''} · tổng cao ~${r2(yTop)}m`,
    `Mái: ${roofKind === 'ton' ? 'tôn dốc 15°' : roofKind === 'ngoi' ? 'ngói dốc 30°' : roofKind === 'thai_nhat' ? 'mái Thái dốc 35°' : 'mái bằng BTCT + tường chắn 0,9m'}`
  ];
  return { prims, floors, floorBase, floorHeight, roofKind, bbox, facing: p1.facing, facingDeg: D, plans, summary };
}

/* ───────────── tiện ích hình học ───────────── */
type Blk = { x: number; y: number; w: number; h: number };
/** Chia mặt bằng (các phòng có tường) thành các khối chữ nhật để lợp mái: nhà chữ nhật = 1 khối; chữ L/T = khối chính + khối phụ */
export function roofBlocks(rs: PlanRoom[], depth = 0): Blk[] {
  const bb = bboxOf(rs);
  if (!bb) return [];
  const blk = { x: bb.x0, y: bb.y0, w: bb.x1 - bb.x0, h: bb.y1 - bb.y0 };
  const area = rs.reduce((n, r) => n + r.w * r.h, 0);
  if (depth >= 2 || area >= 0.9 * blk.w * blk.h || rs.length < 2) return [blk];
  let best: { a: PlanRoom[]; b: PlanRoom[]; score: number } | null = null;
  const tryCut = (horiz: boolean, c: number) => {
    const a = rs.filter(r => horiz ? r.y + r.h <= c + 0.01 : r.x + r.w <= c + 0.01), b = rs.filter(r => horiz ? r.y >= c - 0.01 : r.x >= c - 0.01);
    if (!a.length || !b.length || a.length + b.length !== rs.length) return;
    const cov = (g: PlanRoom[]) => { const q = bboxOf(g)!; return g.reduce((n, r) => n + r.w * r.h, 0) / ((q.x1 - q.x0) * (q.y1 - q.y0)); };
    // ưu tiên giữ khối chính lớn nhất nguyên vẹn (nhà chữ L = khối chính + phần nhô), rồi mới tới độ kín của từng khối
    const ar = (g: PlanRoom[]) => g.reduce((n, r) => n + r.w * r.h, 0);
    const score = 0.5 * Math.min(cov(a), cov(b)) + 0.5 * Math.max(ar(a), ar(b)) / area;
    if (!best || score > best.score) best = { a, b, score };
  };
  [...new Set(rs.flatMap(r => [r.y, r.y + r.h]))].forEach(c => tryCut(true, c));
  [...new Set(rs.flatMap(r => [r.x, r.x + r.w]))].forEach(c => tryCut(false, c));
  if (!best) return [blk];
  const B = best as { a: PlanRoom[]; b: PlanRoom[]; score: number };
  return [...roofBlocks(B.a, depth + 1), ...roofBlocks(B.b, depth + 1)];
}
const touchesX = (b: Blk, m: Blk, x: number) => (Math.abs(x - m.x - m.w) < 0.25 || Math.abs(x + 0.2 - m.x) < 0.25) && b.y < m.y + m.h && b.y + b.h > m.y;
const touchesY = (b: Blk, m: Blk, y: number) => (Math.abs(y - m.y - m.h) < 0.25 || Math.abs(y + 0.2 - m.y) < 0.25) && b.x < m.x + m.w && b.x + b.w > m.x;

function bboxOf(rs: PlanRoom[]) {
  if (!rs.length) return null;
  return { x0: Math.min(...rs.map(r => r.x)), x1: Math.max(...rs.map(r => r.x + r.w)), y0: Math.min(...rs.map(r => r.y)), y1: Math.max(...rs.map(r => r.y + r.h)) };
}
function doorAbs(r: PlanRoom, d: PlanDoor): [number, number] {
  const m = d.at + d.width / 2;
  if (d.side === 'front') return [r.x + m, r.y];
  if (d.side === 'rear') return [r.x + m, r.y + r.h];
  if (d.side === 'left') return [r.x, r.y + m];
  return [r.x + r.w, r.y + m];
}
const outwardV = (s: Side): [number, number] => s === 'front' ? [0, -1] : s === 'rear' ? [0, 1] : s === 'left' ? [-1, 0] : [1, 0];

/** các cạnh của r không giáp phòng nào trong `others` → [x, y, w, d] dải tường 0,15m */
function edgesNotShared(r: PlanRoom, others: PlanRoom[]): [number, number, number, number][] {
  const t = 0.15, out: [number, number, number, number][] = [];
  const sides: [Side, number, number][] = [['front', r.x, r.x + r.w], ['rear', r.x, r.x + r.w], ['left', r.y, r.y + r.h], ['right', r.y, r.y + r.h]];
  sides.forEach(([s, a0, b0]) => {
    let parts: [number, number][] = [[a0, b0]];
    others.forEach(o => {
      if (o === r) return;
      const touch = s === 'front' ? Math.abs(r.y - (o.y + o.h)) < 0.05 : s === 'rear' ? Math.abs(r.y + r.h - o.y) < 0.05 : s === 'left' ? Math.abs(r.x - (o.x + o.w)) < 0.05 : Math.abs(r.x + r.w - o.x) < 0.05;
      if (!touch) return;
      const a = s === 'front' || s === 'rear' ? o.x : o.y, b = s === 'front' || s === 'rear' ? o.x + o.w : o.y + o.h;
      parts = parts.flatMap(([p0, p1]) => { const res: [number, number][] = []; if (a > p0) res.push([p0, Math.min(p1, a)]); if (b < p1) res.push([Math.max(p0, b), p1]); return res; }).filter(([p0, p1]) => p1 - p0 > 0.05);
    });
    parts.forEach(([a, b]) => {
      if (s === 'front') out.push([a, r.y, b - a, t]);
      if (s === 'rear') out.push([a, r.y + r.h - t, b - a, t]);
      if (s === 'left') out.push([r.x, a, t, b - a]);
      if (s === 'right') out.push([r.x + r.w - t, a, t, b - a]);
    });
  });
  return out;
}

type PBox = (x: number, y: number, w: number, d: number, e0: number, e1: number, mat: MatKey, floor: number, tag?: 'roof' | 'roomFloor' | 'site') => void;

/** Tường: gom mọi cạnh phòng thành các đường tường duy nhất, phân trong/ngoài, khoét cửa đi & cửa sổ */
function buildWalls(plan: FloorPlanResult, walled: PlanRoom[], insideAll: PlanRoom[], f: number, e0: number, wallTop: number, free: boolean, OPEN_STRIP: Set<string>, pbox: PBox) {
  type Line = { horiz: boolean; c: number; iv: [number, number][] };
  const lines = new Map<string, Line>();
  const addLine = (horiz: boolean, c: number, a: number, b: number) => {
    const k = `${horiz ? 'h' : 'v'}${Math.round(c * 100)}`;
    if (!lines.has(k)) lines.set(k, { horiz, c: Math.round(c * 100) / 100, iv: [] });
    lines.get(k)!.iv.push([a, b]);
  };
  walled.forEach(r => {
    addLine(true, r.y, r.x, r.x + r.w); addLine(true, r.y + r.h, r.x, r.x + r.w);
    addLine(false, r.x, r.y, r.y + r.h); addLine(false, r.x + r.w, r.y, r.y + r.h);
  });
  const at = (x: number, y: number, list: PlanRoom[]) => list.find(r => x > r.x + 0.001 && x < r.x + r.w - 0.001 && y > r.y + 0.001 && y < r.y + r.h - 0.001);

  // lỗ mở trên từng đường tường
  type Op = { a: number; b: number; y0: number; y1: number; mat?: 'glass' | 'door_main' | 'rolling' };
  const ops = new Map<string, Op[]>();
  const addOp = (horiz: boolean, c: number, op: Op) => { const k = `${horiz ? 'h' : 'v'}${Math.round(c * 100)}`; if (!ops.has(k)) ops.set(k, []); ops.get(k)!.push(op); };
  const H = wallTop - e0;
  insideAll.forEach(r => {
    r.doors.forEach(d => {
      const horiz = d.side === 'front' || d.side === 'rear';
      const c = d.side === 'front' ? r.y : d.side === 'rear' ? r.y + r.h : d.side === 'left' ? r.x : r.x + r.w;
      const base = horiz ? r.x : r.y;
      const top = d.open ? Math.min(H - 0.3, 2.6) : d.rolling ? Math.min(H - 0.4, 3.0) : d.main ? Math.min(H - 0.5, 2.7) : 2.2;
      addOp(horiz, c, { a: base + d.at, b: base + d.at + d.width, y0: 0, y1: top, mat: d.main ? 'door_main' : d.rolling ? 'rolling' : undefined });
    });
  });
  insideAll.forEach(r => {
    r.windows.forEach(s => {
      const horiz = s === 'front' || s === 'rear';
      const c = s === 'front' ? r.y : s === 'rear' ? r.y + r.h : s === 'left' ? r.x : r.x + r.w;
      const sideLen = horiz ? r.w : r.h;
      const len = Math.min(sideLen * 0.6, 2.4);
      const base = (horiz ? r.x : r.y) + (sideLen - len) / 2;
      const wc = r.type === 'wc';
      // cửa sổ không được chồng lên lỗ cửa đi cùng bức tường → dời sang đoạn tường trống rộng hơn, không đủ chỗ thì bỏ
      const k = `${horiz ? 'h' : 'v'}${Math.round(c * 100)}`;
      const doorsHere = (ops.get(k) || []).filter(o => o.y0 === 0);
      let a = base, b = base + len;
      const hit = doorsHere.find(o => o.b > a + 0.05 && o.a < b - 0.05);
      if (hit) {
        const s0 = horiz ? r.x : r.y, s1 = s0 + sideLen;
        const leftSpace = hit.a - 0.3 - (s0 + 0.3), rightSpace = (s1 - 0.3) - (hit.b + 0.3);
        const L = Math.min(len, Math.max(leftSpace, rightSpace));
        if (L < 0.6) return;
        if (leftSpace >= rightSpace) { b = hit.a - 0.3; a = b - L; } else { a = hit.b + 0.3; b = a + L; }
        if (doorsHere.some(o => o !== hit && o.b > a + 0.05 && o.a < b - 0.05)) return;
      }
      addOp(horiz, c, { a, b, y0: wc ? 1.5 : 0.9, y1: wc ? 2.1 : 2.3, mat: 'glass' });
    });
  });

  lines.forEach((L, k) => {
    const pts = [...new Set(L.iv.flatMap(([a, b]) => [Math.round(a * 100) / 100, Math.round(b * 100) / 100]))].sort((a, b) => a - b);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      if (b - a < 0.02) continue;
      const m = (a + b) / 2;
      const A = L.horiz ? at(m, L.c - 0.05, walled) : at(L.c - 0.05, m, walled);
      const B = L.horiz ? at(m, L.c + 0.05, walled) : at(L.c + 0.05, m, walled);
      if (!A && !B) continue;
      let kind: 'ext' | 'int' | 'rail' | 'none' = A && B ? 'int' : 'ext';
      if (kind === 'int' && !free && OPEN_STRIP.has(A!.type) && OPEN_STRIP.has(B!.type)) kind = 'none';  // nhà ống: khách – hành lang – bếp thông nhau
      if (kind === 'ext') {
        const one = (A || B)!;
        const otherPt = L.horiz ? (A ? [m, L.c + 0.05] : [m, L.c - 0.05]) : (A ? [L.c + 0.05, m] : [L.c - 0.05, m]);
        const openNb = at(otherPt[0], otherPt[1], insideAll.filter(r => r.open));
        if (openNb && (one.type === 'corridor' || one.type === 'stair')) kind = 'rail';
      }
      if (kind === 'none') continue;
      const t = kind === 'ext' ? 0.2 : 0.1;
      const mat: MatKey = kind === 'ext' ? 'wall_ext' : 'wall_int';
      const seg = (s0: number, s1: number, y0: number, y1: number, mt: MatKey, thick = t) => {
        if (s1 - s0 < 0.01 || y1 - y0 < 0.01) return;
        if (L.horiz) pbox(s0, L.c - thick / 2, s1 - s0, thick, e0 + y0, e0 + y1, mt, f);
        else pbox(L.c - thick / 2, s0, thick, s1 - s0, e0 + y0, e0 + y1, mt, f);
      };
      if (kind === 'rail') { seg(a, b, 0, 1.0, 'railing', 0.06); continue; }
      const here = (ops.get(k) || []).filter(o => o.b > a + 0.01 && o.a < b - 0.01).map(o => ({ ...o, a: Math.max(a, o.a), b: Math.min(b, o.b) })).sort((p, q) => p.a - q.a);
      let cur = a;
      here.forEach(o => {
        if (o.a > cur) seg(cur, o.a, 0, H, mat);
        seg(o.a, o.b, 0, o.y0, mat);
        seg(o.a, o.b, o.y1, H, mat);
        if (o.mat === 'glass') {
          seg(o.a, o.b, o.y0, o.y1, 'glass', 0.03);
          if (kind === 'ext') {                     // khung cửa sổ + đố giữa (màu khung theo mô tả / đề xuất)
            const fw = 0.06, fd = 0.12;
            seg(o.a, o.b, o.y0, o.y0 + fw, 'frame', fd); seg(o.a, o.b, o.y1 - fw, o.y1, 'frame', fd);
            seg(o.a, o.a + fw, o.y0, o.y1, 'frame', fd); seg(o.b - fw, o.b, o.y0, o.y1, 'frame', fd);
            const n = Math.max(1, Math.round((o.b - o.a) / 0.9));
            for (let i = 1; i < n; i++) { const xm = o.a + (o.b - o.a) * i / n; seg(xm - 0.025, xm + 0.025, o.y0, o.y1, 'frame', fd); }
            seg(o.a - 0.05, o.b + 0.05, o.y0 - 0.05, o.y0, 'stone', 0.26);     // bậu cửa
          }
        }
        if (o.mat === 'door_main') {               // cửa chính nhiều cánh + khung
          const w = o.b - o.a, n = w >= 2 ? 4 : 2;
          for (let i = 0; i < n; i++) seg(o.a + w * i / n + 0.02, o.a + w * (i + 1) / n - 0.02, 0, o.y1, 'door_main', 0.06);
          seg(o.a - 0.06, o.b + 0.06, o.y1, o.y1 + 0.08, 'frame', 0.14); seg(o.a - 0.06, o.a, 0, o.y1, 'frame', 0.14); seg(o.b, o.b + 0.06, 0, o.y1, 'frame', 0.14);
        }
        if (o.mat === 'rolling') seg(o.a, o.b, o.y1 - 0.35, o.y1, 'rolling', 0.12);
        cur = Math.max(cur, o.b);
      });
      if (cur < b) seg(cur, b, 0, H, mat);
    }
  });
}

/** Cầu thang: chữ U (2 vế + chiếu nghỉ) hoặc 1 vế */
function buildStair(st: PlanRoom, e0: number, fh: number, f: number, pbox: PBox) {
  const riser = 0.165;
  const n = Math.max(8, Math.round(fh / riser));
  if (st.w >= 1.8) {
    const fw = (st.w - 0.1) / 2, land = 1.0, run = st.h - land;
    const n1 = Math.ceil(n / 2), n2 = n - n1;
    const tr1 = run / n1, tr2 = run / n2;
    for (let i = 0; i < n1; i++) pbox(st.x, st.y + i * tr1, fw, tr1, e0, e0 + (i + 1) * riser, 'stair', f);
    pbox(st.x, st.y + run, st.w, land, e0 + n1 * riser - 0.15, e0 + n1 * riser, 'stair', f);
    for (let i = 0; i < n2; i++) pbox(st.x + st.w - fw, st.y + run - (i + 1) * tr2, fw, tr2, e0 + n1 * riser, e0 + n1 * riser + (i + 1) * riser, 'stair', f);
  } else {
    const tr = st.h / n;
    for (let i = 0; i < n; i++) pbox(st.x, st.y + i * tr, st.w, tr, e0, e0 + (i + 1) * riser, 'stair', f);
  }
}
