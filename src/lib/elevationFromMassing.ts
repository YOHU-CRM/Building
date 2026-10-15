/**
 * YOHU CONSTECH — MẶT ĐỨNG & MẶT CẮT DỰNG TỪ CHÍNH MÔ HÌNH 3D (massingModel)
 *
 * Cùng một nguồn với 3D và mặt bằng: số tầng, cao độ sàn, mái, cửa đi, cửa sổ, ban công, hiên đều khớp nhau.
 * Cách vẽ: chiếu vuông góc (orthographic) từng khối lên mặt phẳng nhìn, vẽ từ xa đến gần (khối gần che khối xa),
 * bỏ các khối bị che kín, rồi ghi cao độ (cốt) và kích thước tổng.
 *
 * Kết quả: chuỗi SVG (hiển thị / PDF) + mô hình makerjs (xuất DXF mở bằng AutoCAD).
 */
import makerjs from 'makerjs';
import type { MassingModel, Prim } from './massingModel';

export type ElevView = 'front' | 'rear' | 'left' | 'right' | 'section';
export const ELEV_VIEWS: { key: ElevView; label: string }[] = [
  { key: 'front', label: 'Mặt đứng chính' },
  { key: 'rear', label: 'Mặt đứng sau' },
  { key: 'left', label: 'Mặt đứng bên trái' },
  { key: 'right', label: 'Mặt đứng bên phải' },
  { key: 'section', label: 'Mặt cắt A-A' }
];

type Pt = [number, number];
interface Shape {
  pts?: Pt[];                                 // đa giác (u, y) theo mét
  ell?: { cx: number; cy: number; rx: number; ry: number };
  fill: string; stroke: string; sw: number; op?: number;
  near: number;                               // càng lớn càng gần người nhìn
  opaque: boolean;
  hatch?: 'h' | 'v';                           // vân mái ngói (ngang) / tôn (sóng dọc)
  cut?: boolean;
  mat?: string;
  bb: { u0: number; u1: number; y0: number; y1: number };
}

const STYLE: Record<string, { f: string; s?: string; op?: number; opaque?: boolean; hatch?: 'h' | 'v' }> = {
  wall_ext: { f: '#ffffff', opaque: true }, wall_int: { f: '#f8fafc', opaque: true }, slab: { f: '#e5e7eb', opaque: true }, plinth: { f: '#e7e5e4', opaque: true },
  glass: { f: '#cfe8f7', s: '#4b6584', op: 0.95 }, door_main: { f: '#c49a6c', opaque: true }, door: { f: '#d6b48a', opaque: true }, rolling: { f: '#cbd5e1', opaque: true },
  roof_ton: { f: '#b7c6d6', opaque: true, hatch: 'v' }, roof_ngoi: { f: '#e2a07c', opaque: true, hatch: 'h' }, roof_btct: { f: '#e5e7eb', opaque: true }, roof_thai: { f: '#b9695b', opaque: true, hatch: 'h' },
  porch: { f: '#ece9e4', opaque: true }, column: { f: '#ffffff', opaque: true }, railing: { f: '#e2e8f0', s: '#475569', op: 0.35 },
  trunk: { f: '#a8a29e' }, leaf: { f: '#dcfce7', s: '#16a34a', op: 0.85 }, stair: { f: '#e5e7eb', opaque: true }, stone: { f: '#d6d3d1', opaque: true },
  outkitchen: { f: '#fef3c7', opaque: true }, chimney: { f: '#a8a29e', opaque: true }, walkway_roof: { f: '#cbd5e1', opaque: true }
};
const CUT_FILL = '#475569';

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const fmtLv = (y: number) => (y === 0 ? '±0.000' : `${y > 0 ? '+' : ''}${y.toFixed(3)}`);

/** Chiếu 1 khối lên mặt nhìn. Trả null nếu khối không thấy được ở mặt này. */
function project(p: Prim, view: ElevView, xc: number): Shape[] {
  if (p.t === 'label') return [];
  if (p.t === 'box' && p.tag === 'roomFloor') return [];
  const st = STYLE[(p as any).mat] || { f: '#eeeeee', opaque: true };
  const mk = (pts: Pt[], near: number, cut = false, hatch?: 'h' | 'v'): Shape => {
    const us = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    return {
      pts, fill: cut ? CUT_FILL : st.f, stroke: cut ? '#0f172a' : st.s || '#1f2937', sw: cut ? 1.6 : 1, op: cut ? 1 : st.op,
      near, opaque: cut || !!st.opaque, hatch: cut ? undefined : hatch, cut, mat: String((p as any).mat),
      bb: { u0: Math.min(...us), u1: Math.max(...us), y0: Math.min(...ys), y1: Math.max(...ys) }
    };
  };
  // khung bao 3D của khối
  let x0: number, x1: number, z0: number, z1: number, y0: number, y1: number;
  if (p.t === 'box') { x0 = p.x - p.sx / 2; x1 = p.x + p.sx / 2; z0 = p.z - p.sz / 2; z1 = p.z + p.sz / 2; y0 = p.y - p.sy / 2; y1 = p.y + p.sy / 2; if (p.tag === 'site' && p.sy < 0.13 && y1 < 0.2) return []; }
  else if (p.t === 'cyl') { x0 = p.x - p.r; x1 = p.x + p.r; z0 = p.z - p.r; z1 = p.z + p.r; y0 = p.y - p.h / 2; y1 = p.y + p.h / 2; }
  else if (p.t === 'sphere') { x0 = p.x - p.r; x1 = p.x + p.r; z0 = p.z - p.r; z1 = p.z + p.r; y0 = p.y - p.r * 0.85; y1 = p.y + p.r * 0.85; }
  else { x0 = Math.min(p.x0, p.x1); x1 = Math.max(p.x0, p.x1); z0 = Math.min(p.z0, p.z1); z1 = Math.max(p.z0, p.z1); y0 = p.y; y1 = p.y + p.rise; }

  // trục ngang u, độ gần, và có bị mặt cắt cắt qua không
  let u0: number, u1: number, near: number, cut = false;
  const alongX = view === 'front' || view === 'rear';      // nhìn dọc trục Z → trục ngang là X
  if (view === 'front') { u0 = x0; u1 = x1; near = z1; }
  else if (view === 'rear') { u0 = -x1; u1 = -x0; near = -z0; }
  else if (view === 'left') { u0 = z0; u1 = z1; near = -x0; }
  else if (view === 'right') { u0 = -z1; u1 = -z0; near = x1; }
  else {
    // mặt cắt: mặt phẳng x = xc, người nhìn đứng phía trái (−X) nhìn sang phải; bỏ phần nằm trước mặt cắt
    if (x1 <= xc + 0.001) return [];
    cut = x0 < xc - 0.001 && (p.t === 'box' || p.t === 'gable') && ['wall_ext', 'wall_int', 'slab', 'plinth', 'roof_btct', 'roof_ton', 'roof_ngoi', 'roof_thai', 'stair', 'porch'].includes((p as any).mat);
    u0 = z0; u1 = z1; near = cut ? 1e6 : -Math.max(x0, xc);
  }

  if (p.t === 'sphere') {
    const cu = (u0 + u1) / 2;
    return [{ ell: { cx: cu, cy: p.y, rx: p.r, ry: p.r * 0.85 }, fill: st.f, stroke: st.s || '#1f2937', sw: 1, op: st.op, near, opaque: false, bb: { u0, u1, y0, y1 } }];
  }
  if (p.t === 'gable') {
    // mái dốc: nhìn vuông góc với nóc → hình chữ nhật (mặt mái); nhìn dọc nóc → hình tam giác (đầu hồi)
    const ridgeAlongView = (p.axis === 'x') === alongX;   // nóc song song với trục ngang của bản vẽ → thấy mặt mái
    const isRoof = String(p.mat).startsWith('roof');
    const hatch = isRoof ? STYLE[p.mat]?.hatch : undefined;
    if (view === 'section' && cut) {
      if (ridgeAlongView) {
        // mặt cắt song song nóc: cắt qua mái ở 1 cao độ
        const xm = (x0 + x1) / 2, half = (x1 - x0) / 2;
        const yh = y0 + p.rise * Math.max(0, 1 - Math.abs(xc - xm) / half);
        // phần mái phía sau mặt cắt vẫn nhìn thấy (lên tới nóc)
        const behind = mk([[u0, y0], [u1, y0], [u1, y1], [u0, y1]], -xc - 0.01, false, hatch);
        return [behind, mk([[u0, yh - 0.12], [u1, yh - 0.12], [u1, yh + 0.05], [u0, yh + 0.05]], near, true)];
      }
      const um = (u0 + u1) / 2, t = 0.14;
      return [mk([[u0, y0], [um, y1], [u1, y0], [u1 - t, y0], [um, y1 - t * 1.3], [u0 + t, y0]], near, true)];
    }
    if (ridgeAlongView) return [mk([[u0, y0], [u1, y0], [u1, y1], [u0, y1]], near, false, hatch)];
    const um = (u0 + u1) / 2;
    return [mk([[u0, y0], [u1, y0], [um, y1]], near)];
  }
  return [mk([[u0, y0], [u1, y0], [u1, y1], [u0, y1]], near, cut)];
}

export interface ElevationResult {
  svg: string;
  widthM: number;
  heightM: number;
  maker: makerjs.IModel;
  levels: { y: number; label: string }[];
  title: string;
}

/** Vị trí mặt cắt A-A: qua cầu thang (nếu có) hoặc giữa nhà */
function sectionX(model: MassingModel): number {
  const stair = model.plans.flatMap(pl => pl.rooms).find(r => r.type === 'stair');
  if (stair) return r3(stair.x + stair.w * 0.3);
  const rs = model.plans[0].rooms.filter(r => !r.outside);
  if (!rs.length) return 0;
  const x0 = Math.min(...rs.map(r => r.x)), x1 = Math.max(...rs.map(r => r.x + r.w));
  return r3((x0 + x1) / 2 + 0.05);
}

export function buildElevation(model: MassingModel, view: ElevView, opts: { customerName?: string } = {}): ElevationResult {
  const xc = sectionX(model);
  let shapes: Shape[] = model.prims.flatMap(p => project(p, view, xc));
  // mặt đứng: bỏ các khối nằm sâu bên trong nhà (tường trong, cầu thang, cửa mặt sau) — chỉ thấy qua lỗ cửa, gây rối;
  // lỗ cửa sẽ hiện màu tối như bản vẽ kiến trúc
  let voids: Shape[] = [];
  if (view !== 'section') {
    const ext = shapes.filter(s => s.mat === 'wall_ext' && s.pts);
    const DEEP = new Set(['wall_int', 'stair', 'glass', 'door', 'door_main', 'rolling', 'slab', 'wall_ext']);
    const topY = model.floorBase[model.floors + 1];
    // mặt ngoài của tầng chứa khối (gồm cả lanh tô trên cửa) tại cùng vị trí ngang
    const front = (s: Shape) => {
      const yc = (s.bb.y0 + s.bb.y1) / 2;
      let f = 1; for (let k = 1; k <= model.floors; k++) if (model.floorBase[k] <= yc + 0.01) f = k;
      const b0 = model.floorBase[f], b1 = model.floorBase[f + 1];
      return Math.max(-1e9, ...ext.filter(e => e.bb.u0 < s.bb.u1 - 0.01 && e.bb.u1 > s.bb.u0 + 0.01 && e.bb.y0 < b1 - 0.05 && e.bb.y1 > b0 + 0.05).map(e => e.near));
    };
    shapes = shapes.filter(s => !(s.mat && DEEP.has(s.mat) && (s.bb.y0 + s.bb.y1) / 2 < topY - 0.05 && s.near < front(s) - 0.4));
    // nền tối sau lỗ cửa: theo từng tầng, phủ trong khung tường ngoài
    for (let f = 1; f <= model.floors; f++) {
      const y0 = model.floorBase[f], y1 = model.floorBase[f + 1];
      const band = ext.filter(e => e.bb.y0 < y1 - 0.05 && e.bb.y1 > y0 + 0.05);
      if (!band.length) continue;
      const u0 = Math.min(...band.map(e => e.bb.u0)), u1 = Math.max(...band.map(e => e.bb.u1));
      voids.push({ pts: [[u0, y0], [u1, y0], [u1, y1], [u0, y1]], fill: '#3b4555', stroke: '#3b4555', sw: 0.5, near: -1e9, opaque: false, bb: { u0, u1, y0, y1 } });
    }
  }
  // bỏ khối bị che kín bởi khối đặc ở gần hơn (gọn bản vẽ + DXF không chồng nét)
  const opaques = shapes.filter(s => s.opaque && s.pts && s.pts.length === 4);
  shapes = shapes.filter(s => !opaques.some(o => o !== s && o.near > s.near + 0.01 && o.bb.u0 <= s.bb.u0 + 0.005 && o.bb.u1 >= s.bb.u1 - 0.005 && o.bb.y0 <= s.bb.y0 + 0.005 && o.bb.y1 >= s.bb.y1 - 0.005));
  shapes.sort((a, b) => a.near - b.near);
  shapes = [...voids, ...shapes];

  // phạm vi nhà (không tính cây, sân)
  const build = shapes.filter(s => s.fill !== STYLE.leaf.f && s.fill !== STYLE.trunk.f);
  const U0 = Math.min(...build.map(s => s.bb.u0)), U1 = Math.max(...build.map(s => s.bb.u1));
  const Y1 = Math.max(...shapes.map(s => s.bb.y1), 3);
  const allU0 = Math.min(U0, ...shapes.map(s => s.bb.u0)), allU1 = Math.max(U1, ...shapes.map(s => s.bb.u1));

  // cao độ
  const lv: { y: number; label: string }[] = [{ y: 0, label: 'Sân' }, { y: model.floorBase[1], label: 'Cốt nền T1' }];
  for (let f = 2; f <= model.floors; f++) lv.push({ y: model.floorBase[f], label: `Sàn T${f}` });
  const topY = model.floorBase[model.floors + 1];
  lv.push({ y: topY, label: model.roofKind === 'btct' ? 'Sàn mái' : 'Đỉnh tường' });
  const ridge = Math.max(...shapes.filter(s => !s.ell).map(s => s.bb.y1));
  if (ridge > topY + 0.3) lv.push({ y: r3(ridge), label: model.roofKind === 'btct' ? 'Đỉnh tum / tường chắn' : 'Đỉnh mái' });

  // khung SVG (1m = S px)
  const S = 60, padL = 250, padR = 60, padT = 50, padB = 120;
  const W = (allU1 - allU0) * S + padL + padR, H = Y1 * S + padT + padB;
  const X = (u: number) => r3((u - allU0) * S + padL);
  const Y = (y: number) => r3((Y1 - y) * S + padT);
  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.round(W)} ${Math.round(H)}" width="${Math.round(W)}" height="${Math.round(H)}" font-family="Arial, sans-serif">`);
  out.push(`<rect x="0" y="0" width="${Math.round(W)}" height="${Math.round(H)}" fill="#ffffff"/>`);
  out.push(`<defs><pattern id="cutHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="${CUT_FILL}"/><line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" stroke-width="1.5"/></pattern></defs>`);

  const maker: makerjs.IModel = { paths: {}, models: {} };
  let pid = 0;
  const addLine = (a: Pt, b: Pt, layer = 'net') => { const k = `p${pid++}`; const ln = new makerjs.paths.Line([a[0] * 1000, a[1] * 1000], [b[0] * 1000, b[1] * 1000]); (ln as any).layer = layer; maker.paths![k] = ln; };

  shapes.forEach(s => {
    if (s.ell) {
      const { cx, cy, rx, ry } = s.ell;
      out.push(`<ellipse cx="${X(cx)}" cy="${Y(cy)}" rx="${r3(rx * S)}" ry="${r3(ry * S)}" fill="${s.fill}" fill-opacity="${s.op ?? 1}" stroke="${s.stroke}" stroke-width="${s.sw}"/>`);
      const c = new makerjs.paths.Circle([cx * 1000, cy * 1000], rx * 1000); (c as any).layer = 'cay'; maker.paths![`p${pid++}`] = c;
      return;
    }
    const pts = s.pts!;
    const d = pts.map((q, i) => `${i ? 'L' : 'M'}${X(q[0])},${Y(q[1])}`).join('') + 'Z';
    out.push(`<path d="${d}" fill="${s.cut ? 'url(#cutHatch)' : s.fill}" fill-opacity="${s.op ?? 1}" stroke="${s.stroke}" stroke-width="${s.sw}" stroke-linejoin="round"/>`);
    if (s.hatch && pts.length === 4) {
      const { u0, u1, y0, y1 } = s.bb;
      if (s.hatch === 'h') for (let y = y0 + 0.3; y < y1 - 0.05; y += 0.3) out.push(`<line x1="${X(u0)}" y1="${Y(y)}" x2="${X(u1)}" y2="${Y(y)}" stroke="#7c2d12" stroke-width="0.5" stroke-opacity="0.6"/>`);
      else for (let u = u0 + 0.5; u < u1 - 0.05; u += 0.5) out.push(`<line x1="${X(u)}" y1="${Y(y0)}" x2="${X(u)}" y2="${Y(y1)}" stroke="#334155" stroke-width="0.5" stroke-opacity="0.6"/>`);
    }
    if (s.near > -1e8) pts.forEach((q, i) => addLine(q, pts[(i + 1) % pts.length], s.cut ? "cat" : "net"));
  });

  // đường đất
  out.push(`<line x1="${X(allU0) - 30}" y1="${Y(0)}" x2="${X(allU1) + 30}" y2="${Y(0)}" stroke="#0f172a" stroke-width="3"/>`);
  for (let u = allU0 - 0.4; u < allU1 + 0.4; u += 0.35) out.push(`<line x1="${X(u)}" y1="${Y(0)}" x2="${X(u) - 8}" y2="${Y(0) + 8}" stroke="#64748b" stroke-width="0.8"/>`);
  addLine([allU0 - 0.5, 0], [allU1 + 0.5, 0], 'dat');

  // cốt cao độ (bên trái)
  const lx0 = padL - 20;
  lv.sort((a, b) => a.y - b.y);
  lv.forEach((l, i) => {
    const y = Y(l.y);
    const lx = i > 0 && l.y - lv[i - 1].y < 0.8 && !(lv[i - 1] as any).shift ? ((l as any).shift = true, lx0 - 95) : lx0;
    out.push(`<line x1="${lx - 70}" y1="${y}" x2="${X(U0)}" y2="${y}" stroke="#94a3b8" stroke-width="0.7" stroke-dasharray="5 4"/>`);
    void lx0;
    out.push(`<path d="M${lx},${y} l-7,-10 l14,0 Z" fill="#0f172a"/>`);
    out.push(`<text x="${lx - 10}" y="${y - 13}" font-size="13" font-weight="700" text-anchor="end" fill="#0f172a">${fmtLv(l.y)}</text>`);
    out.push(`<text x="${lx - 10}" y="${y + 14}" font-size="11" text-anchor="end" fill="#475569">${l.label}</text>`);
  });
  // chiều cao từng tầng (đường kích thước dọc)
  const dx = X(U1) + 28;
  const vs = [...new Set(lv.map(l => l.y))].sort((a, b) => a - b);
  out.push(`<line x1="${dx}" y1="${Y(vs[0])}" x2="${dx}" y2="${Y(vs[vs.length - 1])}" stroke="#0f172a" stroke-width="0.8"/>`);
  vs.forEach((v, i) => {
    out.push(`<line x1="${dx - 6}" y1="${Y(v) + 6}" x2="${dx + 6}" y2="${Y(v) - 6}" stroke="#0f172a" stroke-width="1.2"/>`);
    if (i) { const m = (v + vs[i - 1]) / 2, h = v - vs[i - 1]; if (h > 0.2) out.push(`<text x="${dx + 8}" y="${Y(m) + 4}" font-size="11" fill="#0f172a">${Math.round(h * 1000)}</text>`); }
  });
  // kích thước ngang tổng
  const dy = Y(0) + 34;
  out.push(`<line x1="${X(U0)}" y1="${dy}" x2="${X(U1)}" y2="${dy}" stroke="#0f172a" stroke-width="0.8"/>`);
  [U0, U1].forEach(u => out.push(`<line x1="${X(u) - 6}" y1="${dy + 6}" x2="${X(u) + 6}" y2="${dy - 6}" stroke="#0f172a" stroke-width="1.2"/><line x1="${X(u)}" y1="${Y(0) + 6}" x2="${X(u)}" y2="${dy + 10}" stroke="#94a3b8" stroke-width="0.7"/>`));
  out.push(`<text x="${(X(U0) + X(U1)) / 2}" y="${dy - 6}" font-size="13" font-weight="700" text-anchor="middle" fill="#0f172a">${Math.round((U1 - U0) * 1000)}</text>`);

  // tiêu đề
  const meta = ELEV_VIEWS.find(v => v.key === view)!;
  const title = view === 'front' ? `${meta.label} (mặt tiền${model.facing ? ' hướng ' + model.facing : ''})` : view === 'section' ? `${meta.label} (cắt qua ${model.plans.some(pl => pl.rooms.some(r => r.type === 'stair')) ? 'cầu thang' : 'giữa nhà'})` : meta.label;
  out.push(`<text x="${(X(allU0) + X(allU1)) / 2}" y="${H - 42}" font-size="20" font-weight="800" text-anchor="middle" fill="#0f172a">${title.toUpperCase()}</text>`);
  out.push(`<text x="${(X(allU0) + X(allU1)) / 2}" y="${H - 20}" font-size="12" text-anchor="middle" fill="#475569">TL 1:100 · ${model.summary[0]}${opts.customerName ? ' · ' + opts.customerName : ''} · Bản vẽ sơ bộ — KTS/kỹ sư kiểm tra trước khi thi công</text>`);
  out.push('</svg>');

  (maker as any).units = makerjs.unitType.Millimeter;
  return { svg: out.join(''), widthM: r3(U1 - U0), heightM: r3(ridge), maker, levels: lv, title };
}
