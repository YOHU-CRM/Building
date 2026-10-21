/**
 * Bản vẽ mặt bằng kiến trúc (SVG) — vẽ từ bộ lập mặt bằng architectPlanner
 * Thể hiện: ranh đất, khoảng lùi, tường bao/tường ngăn, cửa đi (cánh mở), cửa sổ, cầu thang,
 * giếng trời, nội thất, lưới 9 cung Bát Trạch, mũi tên Bắc theo hướng nhà, chuỗi kích thước,
 * bảng phòng & kiểm tra kỹ thuật, ghi chú phong thủy.
 */

import { planFloor, FloorPlanResult, PlanRoom, PlanItem, Side } from './architectPlanner';

export interface FloorPlanParams {
  widthM: number;
  lengthM: number;
  floor: number;
  totalFloors: number;
  constructionType: string;
  customerName: string;
  showFurniture: boolean;
  desiredDirection?: string;
  fengShuiAnalysis?: any;
  groundFloorArea?: number;
  totalConstructionArea?: number;
  requestedBedrooms?: number;
  requestedBathrooms?: number;
  rooms?: any;
  lang?: string;
  showSectorGrid?: boolean;
  frontSetbackM?: number | string;
  backSetbackM?: number | string;
  /** 'all' = 1 hình (xem trên màn hình); 'plan' = chỉ mặt bằng phóng to hết khổ A4; 'notes' = chỉ bảng chữ (trang 2 của PDF) */
  part?: 'all' | 'plan' | 'notes';
}

const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f1 = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');
const f2 = (n: number) => n.toFixed(2).replace('.', ',');

const FILL: Record<string, string> = {
  living: '#fff7e6', kitchen: '#ecfdf5', bedroom: '#eff6ff', master: '#e0ecff', wc: '#e0f2fe', stair: '#f1f5f9',
  lightwell: '#dcfce7', corridor: '#fafafa', worship: '#fef3c7', common: '#f5f3ff', terrace: '#f0fdf4',
  parking: '#f8fafc', yard: '#f8fafc', balcony: '#f8fafc', storage: '#f4f4f5', garage: '#f1f5f9',
  dining: '#fff1f2', porch: '#fefce8', pond: '#bfdbfe', garden: '#dcfce7', outkitchen: '#ffedd5', walkway: '#f5f5f4', well: '#e0f2fe'
};

function wrap(text: string, max: number): string[] {
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) { if (cur) lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

const NOTES_PAGE_BREAK = '\n<!--YOHU-PAGE-BREAK-->\n';
/** Trang thuyết minh (bảng phòng, phong thủy, kiểm tra…) — A4 dọc, chữ to, tự chia nhiều trang khi dài */
export function generateArchitecturalNotesPages(params: FloorPlanParams): string[] {
  return generateArchitecturalFloorPlanSvg({ ...params, part: 'notes' }).split(NOTES_PAGE_BREAK);
}

export function generateArchitecturalFloorPlanSvg(params: FloorPlanParams): string {
  const plan: FloorPlanResult = planFloor({
    widthM: params.widthM, lengthM: params.lengthM, floor: params.floor, totalFloors: params.totalFloors,
    desiredDirection: params.desiredDirection, fengShuiAnalysis: params.fengShuiAnalysis, rooms: params.rooms,
    requestedBedrooms: params.requestedBedrooms, requestedBathrooms: params.requestedBathrooms,
    groundFloorArea: params.groundFloorArea, totalConstructionArea: params.totalConstructionArea,
    frontSetbackM: params.frontSetbackM, backSetbackM: params.backSetbackM
  });
  return renderPlanSvg(plan, params);
}

export function renderPlanSvg(plan: FloorPlanResult, params: Partial<FloorPlanParams> = {}): string {
  const { widthM: W, lengthM: L, houseLengthM: H, frontSetbackM: FS, backSetbackM: BS } = plan;
  const showFurniture = params.showFurniture !== false;
  const showGrid = params.showSectorGrid !== false;
  const customer = params.customerName || 'Gia chủ';
  const ctype = params.constructionType || 'Nhà ở';

  /* ── Bố cục trang ── */
  const part = params.part || 'all';
  const free = plan.mode === 'free';
  // Ranh đất: nhà ống = rộng W, từ sân trước đến sân sau; phác thảo tự do = ranh tính theo sân vườn quanh nhà
  const LOT = plan.lot || { x: 0, y: -FS, w: W, h: H + FS + BS };
  // Bố cục tự co giãn: khu đất dáng NGANG → hình vẽ rộng hết khổ phía trên, bảng chữ xếp 2 cột bên dưới (không bỏ trống giấy)
  const wide = LOT.w / LOT.h > 1.25;
  // Trang "plan" của PDF: khu đất ngang → A4 NGANG, khu đất dọc → A4 DỌC; mặt bằng chiếm gần hết trang
  const planLand = LOT.w / LOT.h >= 0.9;
  const VW = part === 'plan' ? (planLand ? 1120 : 800) : part === 'notes' ? 800 : 1120;
  const PAGE_H = part === 'plan' ? Math.round(planLand ? VW / 1.414 : VW * 1.414) : 0;
  const drawL = part === 'plan' ? 40 : 70, drawT = part === 'plan' ? 110 : 130;
  const drawMaxW = part === 'plan' ? VW - 2 * drawL - (planLand ? 0 : 20) : wide ? 990 : 600;
  const drawMaxH = part === 'plan' ? PAGE_H - drawT - 96 : wide ? 640 : 900;
  const sc = Math.min(drawMaxW / (LOT.w + 0.0001), drawMaxH / LOT.h);
  const dW = LOT.w * sc, dH = LOT.h * sc;
  const ox = drawL + (drawMaxW - dW) / 2;
  const oy = drawT;
  const px = (x: number) => ox + (x - LOT.x) * sc;
  const py = (y: number) => oy + (LOT.y + LOT.h - y) * sc; // y = 0 mặt tiền nhà ở phía dưới
  const rx = (r: { x: number; y: number; w: number; h: number }) => ({ X: px(r.x), Y: py(r.y + r.h), Wd: r.w * sc, Ht: r.h * sc });
  const fs = part === 'plan' ? Math.max(13, Math.min(16, sc * 0.36)) : Math.max(10.5, Math.min(14, sc * 0.33));

  const out: string[] = [];
  const pWide = wide && part !== 'notes';
  let panelX = part === 'notes' ? 40 : pWide ? 40 : 720, panelW = part === 'notes' ? VW - 80 : pWide ? 510 : 380;
  // cỡ chữ bảng thuyết minh: trang 2 của PDF to hơn để in A4 vẫn đọc rõ
  const TF = part === 'notes' ? 14 : 12.5, TH = Math.round(TF * 1.38);

  /* ── Header ── */
  out.push(`<rect x="0" y="0" width="${VW}" height="96" fill="#0f172a"/>`);
  out.push(`<text x="28" y="40" fill="#fbbf24" font-size="13" font-weight="800" letter-spacing="2">YOHU CONSTECH · BẢN VẼ KIẾN TRÚC SƠ BỘ</text>`);
  out.push(`<text x="28" y="${part === 'notes' ? 66 : 70}" fill="#fff" font-size="${part === 'notes' ? 20 : 22}" font-weight="900">${part === 'notes' ? 'THUYẾT MINH ' : ''}MẶT BẰNG TẦNG ${plan.floor}/${plan.totalFloors} — ${esc(ctype.toUpperCase())}</text>`);
  const houseMode = (params.rooms as any)?.dimsKind !== 'dat';
  const landIn = Number((params.rooms as any)?.landAreaM2) || 0;
  if (part !== 'notes') out.push(`<text x="${VW - 28}" y="40" fill="#cbd5e1" font-size="12" text-anchor="end">${houseMode
    ? (landIn ? `Đất ${f1(landIn)} m² (gia chủ nhập) · khung vẽ là khu vực quanh nhà, không phải ranh đất` : `Khu vực vẽ ~${f1(LOT.w)} × ${f1(LOT.h)} m — minh họa quanh nhà, không phải ranh đất`)
    : `Lô đất ${free ? '~' : ''}${f1(LOT.w)} × ${f1(LOT.h)} m · ${f1(LOT.w * LOT.h)} m²`}</text>`);
  if (part === 'notes') out.push(`<text x="28" y="88" fill="#cbd5e1" font-size="12">Nhà ${f1(W)} × ${f1(H)} m · sàn ${f1(free ? plan.density.footprint : W * H)} m² · hướng ${esc(plan.facing)} · Gia chủ: ${esc(customer)}</text>`);
  else out.push(`<text x="${VW - 28}" y="62" fill="#cbd5e1" font-size="12" text-anchor="end">Nhà ${f1(W)} × ${f1(H)} m · sàn ${f1(free ? plan.density.footprint : W * H)} m² · hướng ${esc(plan.facing)}</text>`);
  if (part !== 'notes') out.push(`<text x="${VW - 28}" y="84" fill="#94a3b8" font-size="11" text-anchor="end">Gia chủ: ${esc(customer)}</text>`);
  const headerLen = out.length;

  /* ── Ranh đất ── */
  out.push(`<rect x="${px(LOT.x)}" y="${py(LOT.y + LOT.h)}" width="${dW}" height="${dH}" fill="${free && !houseMode ? '#f7fee7' : '#ffffff'}" stroke="#64748b" stroke-width="1.2" stroke-dasharray="8 5"/>`);

  /* ── Phòng ── */
  const inside = plan.rooms.filter(r => !r.outside);
  const outsideRooms = plan.rooms.filter(r => r.outside);
  outsideRooms.forEach(r => {
    const { X, Y, Wd, Ht } = rx(r);
    if (r.type === 'pond') { out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" rx="${Math.min(Wd, Ht) / 3}" fill="${FILL.pond}" stroke="#60a5fa" stroke-width="1.2"/>`); return; }
    const dash = r.type === 'balcony' || r.type === 'porch' || r.type === 'walkway' || r.type === 'garden' ? 'stroke-dasharray="5 4"' : '';
    out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" fill="${FILL[r.type] || '#f8fafc'}" stroke="${r.type === 'outkitchen' ? '#9a3412' : '#94a3b8'}" stroke-width="${r.type === 'outkitchen' ? 1.6 : 1}" ${dash}/>`);
  });
  inside.forEach(r => {
    const { X, Y, Wd, Ht } = rx(r);
    out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" fill="${FILL[r.type] || '#fff'}" stroke="#334155" stroke-width="${r.type === 'corridor' ? 0.6 : 1.6}"/>`);
    if (r.type === 'lightwell' || r.type === 'terrace') {
      const id = `h_${r.id}_${plan.floor}`;
      out.push(`<defs><pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" stroke="#86efac" stroke-width="1.2"/></pattern></defs>`);
      out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" fill="url(#${id})" opacity="0.7"/>`);
    }
  });

  /* ── Cầu thang ── */
  const stair = inside.find(r => r.type === 'stair');
  if (stair) {
    const { X, Y, Wd, Ht } = rx(stair);
    const u = stair.w >= 1.8;
    const flightW = u ? (Wd - 0.15 * sc) / 2 : Wd;
    const landing = u ? 1.0 * sc : 0;
    const treadsLen = Ht - landing;
    const n = Math.max(6, Math.round(treadsLen / (0.27 * sc)));
    for (let i = 1; i < n; i++) {
      const yy = Y + landing + (treadsLen / n) * i;
      out.push(`<line x1="${X}" y1="${yy}" x2="${X + flightW}" y2="${yy}" stroke="#64748b" stroke-width="0.8"/>`);
      if (u) out.push(`<line x1="${X + Wd - flightW}" y1="${yy}" x2="${X + Wd}" y2="${yy}" stroke="#64748b" stroke-width="0.8"/>`);
    }
    if (u) {
      out.push(`<line x1="${X + Wd / 2}" y1="${Y + landing}" x2="${X + Wd / 2}" y2="${Y + Ht}" stroke="#334155" stroke-width="2"/>`);
      out.push(`<line x1="${X}" y1="${Y + landing}" x2="${X + Wd}" y2="${Y + landing}" stroke="#334155" stroke-width="1"/>`);
    }
    // mũi tên đi lên (bắt đầu từ phía mặt tiền)
    const ax = X + flightW / 2;
    out.push(`<path d="M ${ax} ${Y + Ht - 6} L ${ax} ${Y + landing + 8}" stroke="#dc2626" stroke-width="1.6" fill="none" marker-end="url(#arrowR)"/>`);
    if (plan.floor < plan.totalFloors) out.push(`<text x="${ax}" y="${Y + Ht - 10}" font-size="${fs - 2}" fill="#dc2626" font-weight="800" text-anchor="middle">LÊN</text>`);
    if (plan.floor > 1 && (u || plan.floor === plan.totalFloors)) out.push(`<text x="${u ? X + Wd - flightW / 2 : ax}" y="${u ? Y + Ht - 10 : Y + landing + 14}" font-size="${fs - 2}" fill="#2563eb" font-weight="800" text-anchor="middle">XUỐNG</text>`);
  }

  /* ── Nội thất ── */
  const item = (it: PlanItem) => {
    const X = px(it.x), Y = py(it.y + it.h), Wd = it.w * sc, Ht = it.h * sc;
    const st = 'stroke="#475569" stroke-width="1"';
    switch (it.kind) {
      case 'bed': {
        out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" rx="3" fill="#fff" ${st}/>`);
        // gối ở đầu giường (phía ngược với facing)
        const f = it.facing as Side;
        const pw = 0.45 * sc;
        if (f === 'front') out.push(`<rect x="${X + 4}" y="${Y + 3}" width="${Wd - 8}" height="${pw}" rx="3" fill="#e2e8f0" ${st}/>`);
        if (f === 'rear') out.push(`<rect x="${X + 4}" y="${Y + Ht - pw - 3}" width="${Wd - 8}" height="${pw}" rx="3" fill="#e2e8f0" ${st}/>`);
        if (f === 'right') out.push(`<rect x="${X + 3}" y="${Y + 4}" width="${pw}" height="${Ht - 8}" rx="3" fill="#e2e8f0" ${st}/>`);
        if (f === 'left') out.push(`<rect x="${X + Wd - pw - 3}" y="${Y + 4}" width="${pw}" height="${Ht - 8}" rx="3" fill="#e2e8f0" ${st}/>`);
        break;
      }
      case 'sofa': out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" rx="4" fill="#fde68a" ${st}/><rect x="${X + Wd * 0.25}" y="${Y + Ht * 0.15}" width="${Wd * 0.75}" height="${Ht * 0.7}" rx="3" fill="#fef3c7" ${st}/>`); break;
      case 'tv': out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" fill="#cbd5e1" ${st}/><text x="${X + Wd / 2}" y="${Y + Ht / 2}" font-size="${fs - 4}" text-anchor="middle" transform="rotate(-90 ${X + Wd / 2} ${Y + Ht / 2})" fill="#334155">KỆ TV</text>`); break;
      case 'wardrobe': out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" fill="#e7e5e4" ${st}/><line x1="${X}" y1="${Y}" x2="${X + Wd}" y2="${Y + Ht}" stroke="#a8a29e" stroke-width="0.8"/>`); break;
      case 'dining': {
        out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" rx="3" fill="#fff" ${st}/>`);
        const cr = 0.18 * sc;
        [0.25, 0.75].forEach(k => {
          out.push(`<circle cx="${X + Wd * k}" cy="${Y - cr - 2}" r="${cr}" fill="#fff" ${st}/><circle cx="${X + Wd * k}" cy="${Y + Ht + cr + 2}" r="${cr}" fill="#fff" ${st}/>`);
        });
        break;
      }
      case 'counter': out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" fill="#d1fae5" ${st}/>`); break;
      case 'stove': {
        out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" fill="#fff" stroke="#dc2626" stroke-width="1.4"/>`);
        const r = Math.min(Wd, Ht) * 0.22;
        const horiz = Wd >= Ht;
        out.push(`<circle cx="${X + (horiz ? Wd * 0.3 : Wd / 2)}" cy="${Y + (horiz ? Ht / 2 : Ht * 0.3)}" r="${r}" fill="none" stroke="#dc2626"/><circle cx="${X + (horiz ? Wd * 0.7 : Wd / 2)}" cy="${Y + (horiz ? Ht / 2 : Ht * 0.7)}" r="${r}" fill="none" stroke="#dc2626"/>`);
        // mũi tên miệng bếp
        const cx = X + Wd / 2, cy = Y + Ht / 2, L2 = 0.7 * sc;
        const d = it.facing === 'front' ? [0, L2] : it.facing === 'rear' ? [0, -L2] : it.facing === 'left' ? [-L2, 0] : [L2, 0];
        out.push(`<path d="M ${cx} ${cy} L ${cx + d[0]} ${cy + d[1]}" stroke="#dc2626" stroke-width="1.6" marker-end="url(#arrowR)"/>`);
        break;
      }
      case 'sink': out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" rx="3" fill="#e0f2fe" ${st}/>`); break;
      case 'fridge': out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" fill="#f1f5f9" ${st}/><text x="${X + Wd / 2}" y="${Y + Ht / 2 + 3}" font-size="${fs - 5}" text-anchor="middle" fill="#475569">TL</text>`); break;
      case 'toilet': out.push(`<ellipse cx="${X + Wd / 2}" cy="${Y + Ht / 2}" rx="${Wd / 2}" ry="${Ht / 2}" fill="#fff" ${st}/>`); break;
      case 'basin': out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" rx="6" fill="#fff" ${st}/>`); break;
      case 'shower': out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" fill="none" stroke="#38bdf8" stroke-dasharray="3 2"/><line x1="${X}" y1="${Y}" x2="${X + Wd}" y2="${Y + Ht}" stroke="#bae6fd"/><line x1="${X + Wd}" y1="${Y}" x2="${X}" y2="${Y + Ht}" stroke="#bae6fd"/>`); break;
      case 'altar': {
        out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" fill="#fcd34d" stroke="#b45309" stroke-width="1.4"/>`);
        const cx = X + Wd / 2, cy = Y + Ht / 2, L2 = 0.6 * sc;
        const d = it.facing === 'front' ? [0, L2] : it.facing === 'rear' ? [0, -L2] : it.facing === 'left' ? [-L2, 0] : [L2, 0];
        out.push(`<path d="M ${cx} ${cy} L ${cx + d[0]} ${cy + d[1]}" stroke="#b45309" stroke-width="1.6" marker-end="url(#arrowA)"/>`);
        break;
      }
      case 'car': out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" rx="8" fill="#e2e8f0" ${st}/><rect x="${X + Wd * 0.15}" y="${Y + Ht * 0.12}" width="${Wd * 0.7}" height="${Ht * 0.18}" rx="3" fill="#cbd5e1"/>`); break;
      case 'moto': out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" rx="4" fill="#e2e8f0" ${st}/><text x="${X + Wd / 2}" y="${Y + Ht / 2 + 3}" font-size="${fs - 5}" text-anchor="middle" fill="#475569">XE MÁY</text>`); break;
      case 'plant': out.push(`<circle cx="${X + Wd / 2}" cy="${Y + Ht / 2}" r="${Math.min(Wd, Ht) / 2}" fill="#86efac" stroke="#16a34a"/>`); break;
      case 'desk': out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" fill="#fef9c3" ${st}/>`); break;
      case 'washer': out.push(`<rect x="${X}" y="${Y}" width="${Wd}" height="${Ht}" fill="#fff" ${st}/><circle cx="${X + Wd / 2}" cy="${Y + Ht / 2}" r="${Math.min(Wd, Ht) / 3}" fill="none" ${st}/>`); break;
      default: break;
    }
  };
  if (showFurniture) plan.rooms.forEach(r => r.items.forEach(item));

  /* ── Tường bao ── */
  if (!free) out.push(`<rect x="${px(0)}" y="${py(H)}" width="${W * sc}" height="${H * sc}" fill="none" stroke="#0f172a" stroke-width="5"/>`);
  else {
    // tường ngoài: phần cạnh phòng không giáp phòng trong nhà khác (hiên không tường)
    const walled = inside.filter(r => r.type !== 'porch');
    walled.forEach(r => {
      (['front', 'rear', 'left', 'right'] as Side[]).forEach(sd => {
        const horiz = sd === 'front' || sd === 'rear';
        let parts: [number, number][] = [horiz ? [r.x, r.x + r.w] : [r.y, r.y + r.h]];
        walled.forEach(o => {
          if (o === r) return;
          const touch = sd === 'front' ? Math.abs(r.y - (o.y + o.h)) < 0.05 : sd === 'rear' ? Math.abs(r.y + r.h - o.y) < 0.05 : sd === 'left' ? Math.abs(r.x - (o.x + o.w)) < 0.05 : Math.abs(r.x + r.w - o.x) < 0.05;
          if (!touch) return;
          const a = horiz ? o.x : o.y, b = horiz ? o.x + o.w : o.y + o.h;
          parts = parts.flatMap(([p0, p1]) => { const res: [number, number][] = []; if (a > p0) res.push([p0, Math.min(p1, a)]); if (b < p1) res.push([Math.max(p0, b), p1]); return res; }).filter(([p0, p1]) => p1 - p0 > 0.01);
        });
        parts.forEach(([p0, p1]) => {
          if (horiz) { const yy = py(sd === 'front' ? r.y : r.y + r.h); out.push(`<line x1="${px(p0)}" y1="${yy}" x2="${px(p1)}" y2="${yy}" stroke="#0f172a" stroke-width="5" stroke-linecap="square"/>`); }
          else { const xx = px(sd === 'left' ? r.x : r.x + r.w); out.push(`<line x1="${xx}" y1="${py(p0)}" x2="${xx}" y2="${py(p1)}" stroke="#0f172a" stroke-width="5" stroke-linecap="square"/>`); }
        });
      });
    });
  }

  /* ── Cửa sổ ── */
  const winSeg = (r: PlanRoom, side: Side) => {
    const { X, Y, Wd, Ht } = rx(r);
    const len = Math.min((side === 'front' || side === 'rear' ? Wd : Ht) * 0.6, 2.4 * sc);
    if (side === 'front' || side === 'rear') {
      const yy = side === 'front' ? Y + Ht : Y;
      const x0 = X + (Wd - len) / 2;
      out.push(`<rect x="${x0}" y="${yy - 3}" width="${len}" height="6" fill="#fff" stroke="#0f172a" stroke-width="1"/><line x1="${x0}" y1="${yy}" x2="${x0 + len}" y2="${yy}" stroke="#0ea5e9" stroke-width="1.4"/>`);
    } else {
      const xx = side === 'left' ? X : X + Wd;
      const y0 = Y + (Ht - len) / 2;
      out.push(`<rect x="${xx - 3}" y="${y0}" width="6" height="${len}" fill="#fff" stroke="#0f172a" stroke-width="1"/><line x1="${xx}" y1="${y0}" x2="${xx}" y2="${y0 + len}" stroke="#0ea5e9" stroke-width="1.4"/>`);
    }
  };
  inside.forEach(r => r.windows.forEach(s => winSeg(r, s)));

  const halo = 'stroke="#ffffff" stroke-width="3" paint-order="stroke" stroke-linejoin="round"';
  /* ── Cửa đi (khoảng hở + cánh mở) ── */
  const doorDraw = (r: PlanRoom) => {
    const { X, Y, Wd, Ht } = rx(r);
    r.doors.forEach(d => {
      const w = d.width * sc, at = d.at * sc;
      const col = d.main ? '#dc2626' : d.service ? '#ea580c' : '#0f172a';
      if (d.open) {
        // ô mở thông: chỉ khoét tường, vẽ nét đứt
        if (d.side === 'front' || d.side === 'rear') { const yy = d.side === 'front' ? Y + Ht : Y; out.push(`<line x1="${X + at}" y1="${yy}" x2="${X + at + w}" y2="${yy}" stroke="${FILL[r.type] || '#fff'}" stroke-width="5"/><line x1="${X + at}" y1="${yy}" x2="${X + at + w}" y2="${yy}" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="3 3"/>`); }
        else { const xx = d.side === 'left' ? X : X + Wd; const y0 = Y + Ht - at - w; out.push(`<line x1="${xx}" y1="${y0}" x2="${xx}" y2="${y0 + w}" stroke="${FILL[r.type] || '#fff'}" stroke-width="5"/><line x1="${xx}" y1="${y0}" x2="${xx}" y2="${y0 + w}" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="3 3"/>`); }
        return;
      }
      if (d.side === 'front' || d.side === 'rear') {
        const yy = d.side === 'front' ? Y + Ht : Y;
        const x0 = X + at;
        out.push(`<line x1="${x0}" y1="${yy}" x2="${x0 + w}" y2="${yy}" stroke="#fff" stroke-width="${d.main ? 7 : 6}"/>`);
        if (d.rolling) {
          out.push(`<line x1="${x0}" y1="${yy}" x2="${x0 + w}" y2="${yy}" stroke="#475569" stroke-width="2" stroke-dasharray="6 4"/>`);
          out.push(`<text x="${x0 + w / 2}" y="${yy + 14}" font-size="${fs - 3}" fill="#475569" text-anchor="middle">cửa cuốn</text>`);
          return;
        }
        const dir = d.side === 'front' ? -1 : 1; // mở vào trong phòng
        if (d.main && w > 1.4 * sc) {
          const hw = w / 2;
          out.push(`<path d="M ${x0} ${yy} L ${x0} ${yy + dir * hw} A ${hw} ${hw} 0 0 ${dir > 0 ? 0 : 1} ${x0 + hw} ${yy}" fill="none" stroke="${col}" stroke-width="1"/>`);
          out.push(`<path d="M ${x0 + w} ${yy} L ${x0 + w} ${yy + dir * hw} A ${hw} ${hw} 0 0 ${dir > 0 ? 1 : 0} ${x0 + hw} ${yy}" fill="none" stroke="${col}" stroke-width="1"/>`);
        } else {
          out.push(`<path d="M ${x0} ${yy} L ${x0} ${yy + dir * w} A ${w} ${w} 0 0 ${dir > 0 ? 0 : 1} ${x0 + w} ${yy}" fill="none" stroke="${col}" stroke-width="1"/>`);
        }
        if (d.main) out.push(`<text x="${x0 + w / 2}" y="${d.side === 'front' ? yy + 16 : yy - 8}" font-size="${fs - 1}" fill="#dc2626" font-weight="900" text-anchor="middle" ${halo}>CỬA CHÍNH</text>`);
        if (d.service) out.push(`<text x="${x0 + w / 2}" y="${d.side === 'front' ? yy + 14 : yy - 6}" font-size="${fs - 3}" fill="#ea580c" font-weight="800" text-anchor="middle" ${halo}>CỬA PHỤ</text>`);
      } else {
        const xx = d.side === 'left' ? X : X + Wd;
        const y0 = Y + Ht - at - w; // `at` tính từ phía mặt tiền của phòng
        out.push(`<line x1="${xx}" y1="${y0}" x2="${xx}" y2="${y0 + w}" stroke="#fff" stroke-width="6"/>`);
        const dir = d.side === 'left' ? 1 : -1;
        out.push(`<path d="M ${xx} ${y0 + w} L ${xx + dir * w} ${y0 + w} A ${w} ${w} 0 0 ${dir > 0 ? 0 : 1} ${xx} ${y0}" fill="none" stroke="${col}" stroke-width="1"/>`);
        if (d.main || d.service) out.push(`<text x="${xx - dir * 6}" y="${y0 + w / 2}" font-size="${fs - 3}" fill="${col}" font-weight="900" text-anchor="middle" transform="rotate(-90 ${xx - dir * 6} ${y0 + w / 2})" ${halo}>${d.main ? 'CỬA CHÍNH' : 'CỬA PHỤ'}</text>`);
      }
    });
  };
  inside.forEach(doorDraw);

  /* ── Lối đi (lối vào khách, lối ra bếp phụ) ── */
  (plan.paths || []).forEach((p, i) => {
    if (p.pts.length < 2) return;
    const d = p.pts.map((q, k) => `${k ? 'L' : 'M'} ${px(q[0])} ${py(q[1])}`).join(' ');
    const mid = `pm_${plan.floor}_${i}`;
    out.push(`<defs><marker id="${mid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${p.color}"/></marker></defs>`);
    out.push(`<path d="${d}" fill="none" stroke="${p.color}" stroke-width="2.2" stroke-dasharray="7 5" stroke-linecap="round" marker-end="url(#${mid})" opacity="0.9"/>`);
    const q = p.pts[Math.max(0, Math.floor((p.pts.length - 1) / 2))], q2 = p.pts[Math.max(1, Math.floor((p.pts.length - 1) / 2) + 1)];
    out.push(`<text x="${(px(q[0]) + px(q2[0])) / 2 + 8}" y="${(py(q[1]) + py(q2[1])) / 2 - 6}" font-size="${fs - 2}" font-weight="800" fill="${p.color}" text-anchor="start" ${halo}>${esc(p.label)}</text>`);
  });

  /* ── Lưới 9 cung ── */
  if (showGrid) {
    for (let i = 1; i < 3; i++) {
      out.push(`<line x1="${px((W / 3) * i)}" y1="${py(H)}" x2="${px((W / 3) * i)}" y2="${py(0)}" stroke="#a855f7" stroke-width="0.8" stroke-dasharray="4 4" opacity="0.7"/>`);
      out.push(`<line x1="${px(0)}" y1="${py((H / 3) * i)}" x2="${px(W)}" y2="${py((H / 3) * i)}" stroke="#a855f7" stroke-width="0.8" stroke-dasharray="4 4" opacity="0.7"/>`);
    }
    plan.grid.forEach(c => {
      const x = px((W / 3) * c.col) + 3, y = py((H / 3) * (c.row + 1)) + 10;
      const color = c.good === true ? '#15803d' : c.good === false ? '#dc2626' : '#7c3aed';
      const gfs = Math.max(9, Math.min(11, (W / 3) * sc / 9));
      if (free) {
        // nhà vườn: phòng thấp → ghi 1 dòng nhỏ, mờ ở góc ô để không đè tên phòng
        out.push(`<text x="${x}" y="${y - 1}" font-size="${part === 'plan' ? 11.5 : Math.max(9.5, Math.min(10, gfs))}" font-weight="700" fill="${color}" opacity="0.9" ${halo}>${esc(c.direction)}${c.star && c.direction !== 'Trung cung' ? ' · ' + esc(c.star) : ''}</text>`);
        return;
      }
      out.push(`<text x="${x}" y="${y}" font-size="${gfs}" font-weight="800" fill="${color}" ${halo}>${esc(c.direction)}</text>`);
      if (c.star && c.direction !== 'Trung cung') out.push(`<text x="${x}" y="${y + gfs + 1}" font-size="${gfs - 0.5}" font-weight="600" fill="${color}" ${halo}>${esc(c.star)}</text>`);
    });
  }

  /* ── Nhãn phòng (tự co chữ / xuống dòng cho vừa phòng) ── */
  inside.forEach(r => {
    if (!r.name) return;
    const { X, Y, Wd, Ht } = rx(r);
    const cx = X + Wd / 2, cy = Y + Ht / 2 + 6;
    const vertical = Wd < 60 && Ht > Wd * 1.6;
    const avail = (vertical ? Ht : Wd) - 8;
    let f = fs;
    const est = (t: string, size: number) => t.length * size * 0.56;
    let lines = [r.name];
    while (est(r.name, f) > avail && f > 8) f -= 0.5;
    if (est(r.name, f) > avail) {
      const parts = r.name.includes(' · ') ? r.name.split(' · ') : r.name.includes(' + ') ? r.name.split(' + ').map((p, i) => i ? '+ ' + p : p) : wrap(r.name, Math.max(6, Math.floor(avail / (f * 0.56))));
      lines = parts;
    }
    const sub = r.type === 'corridor' ? '' : `${f1(r.w)}×${f1(r.h)}m · ${f1(r.w * r.h)}m²`;
    let fsub = f - 2;
    while (sub && est(sub, fsub) > avail && fsub > 7) fsub -= 0.5;
    const tr = vertical ? ` transform="rotate(-90 ${cx} ${cy})"` : '';
    const total = lines.length * (f + 2) + (sub ? fsub + 2 : 0);
    let ty = cy - total / 2 + f;
    out.push(`<g${tr}>`);
    lines.forEach(l => { out.push(`<text x="${cx}" y="${ty}" font-size="${f}" font-weight="800" fill="#0f172a" text-anchor="middle" ${halo}>${esc(l)}</text>`); ty += f + 2; });
    if (sub) out.push(`<text x="${cx}" y="${ty}" font-size="${fsub}" fill="#475569" text-anchor="middle" ${halo}>${sub}</text>`);
    out.push(`</g>`);
  });
  outsideRooms.forEach(r => {
    const { X, Y, Wd, Ht } = rx(r);
    if (Ht < 14 || !r.name) return;
    if (free) {
      if (r.type === 'walkway') return;
      const big = r.type === 'outkitchen';
      const size = fs - (big ? 2 : 3);
      const est = (t: string) => t.length * size * 0.55;
      const small = Math.max(Wd, Ht) < est(r.name) * 0.6;       // ô quá nhỏ (giếng) → ghi chữ dưới ô
      const vertical = !small && Wd < 50 && Ht > Wd * 1.6;
      const lines = !small && !vertical && est(r.name) > Wd - 6 && r.name.includes(' (') ? [r.name.split(' (')[0], '(' + r.name.split(' (').slice(1).join(' (')] : [r.name];
      const cx = X + Wd / 2, cy = small ? Y + Ht + size + 2 : Y + Ht / 2 + 4 - (lines.length - 1) * (size / 2);
      const tr = vertical ? ` transform="rotate(-90 ${cx} ${cy})"` : '';
      lines.forEach((l, k) => out.push(`<text x="${cx}" y="${cy + k * (size + 1)}" font-size="${size}" fill="${big ? '#9a3412' : '#475569'}" font-weight="${big ? 800 : 600}" text-anchor="middle" font-style="italic" ${halo}${tr}>${esc(l)}</text>`));
      if (big) out.push(`<text x="${cx}" y="${cy + lines.length * (size + 1)}" font-size="${size - 2}" fill="#9a3412" text-anchor="middle" ${halo}>${f1(r.w)}×${f1(r.h)}m</text>`);
      return;
    }
    out.push(`<text x="${X + Wd / 2}" y="${Y + Ht / 2 + 4}" font-size="${fs - 2}" fill="#64748b" text-anchor="middle" font-style="italic">${esc(r.name)} (${f1(r.h)}m)</text>`);
  });

  /* ── Kích thước ── */
  const dimH = (x1: number, x2: number, y: number, label: string) => {
    out.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#334155" stroke-width="0.8"/>`);
    out.push(`<line x1="${x1}" y1="${y - 5}" x2="${x1}" y2="${y + 5}" stroke="#334155"/><line x1="${x2}" y1="${y - 5}" x2="${x2}" y2="${y + 5}" stroke="#334155"/>`);
    out.push(`<text x="${(x1 + x2) / 2}" y="${y - 4}" font-size="${fs - 2}" fill="#0f172a" text-anchor="middle">${label}</text>`);
  };
  const dimV = (y1: number, y2: number, x: number, label: string) => {
    out.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#334155" stroke-width="0.8"/>`);
    out.push(`<line x1="${x - 5}" y1="${y1}" x2="${x + 5}" y2="${y1}" stroke="#334155"/><line x1="${x - 5}" y1="${y2}" x2="${x + 5}" y2="${y2}" stroke="#334155"/>`);
    if (Math.abs(y2 - y1) > 16) out.push(`<text x="${x + 4}" y="${(y1 + y2) / 2}" font-size="${fs - 3}" fill="#0f172a" transform="rotate(90 ${x + 4} ${(y1 + y2) / 2})" text-anchor="middle">${label}</text>`);
  };
  const bottom = py(LOT.y);
  if (free) {
    // chuỗi kích thước theo cột (ngang) & hàng (sâu) của lưới phác thảo
    const xs = [...new Set(inside.flatMap(r => [Math.round(r.x * 10) / 10, Math.round((r.x + r.w) * 10) / 10]))].sort((a, b) => a - b);
    for (let i = 0; i < xs.length - 1; i++) if (xs[i + 1] - xs[i] >= 0.6) dimH(px(xs[i]), px(xs[i + 1]), bottom + 12, `${f1(xs[i + 1] - xs[i])}`);
    dimH(px(0), px(W), bottom + 26, `Nhà ${f2(W)} m`);
    const ys2 = [...new Set(inside.flatMap(r => [Math.round(r.y * 10) / 10, Math.round((r.y + r.h) * 10) / 10]))].sort((a, b) => a - b);
    for (let i = 0; i < ys2.length - 1; i++) if (ys2[i + 1] - ys2[i] >= 0.6) dimV(py(ys2[i + 1]), py(ys2[i]), px(LOT.x) - 22, `${f2(ys2[i + 1] - ys2[i])}`);
    dimV(py(H), py(0), px(LOT.x) - 48, `Nhà ${f2(H)} m`);
  } else {
  dimH(px(0), px(W), bottom + 22, `${f2(W)} m`);
  // chuỗi chiều sâu bên trái: sân sau | các dải | sân trước
  const ys = new Set<number>([-FS, 0, H, H + BS]);
  inside.filter(r => r.w >= W * 0.45 || r.type === 'stair').forEach(r => { ys.add(Math.round(r.y * 10) / 10); ys.add(Math.round((r.y + r.h) * 10) / 10); });
  const sorted = [...ys].filter(v => v >= -FS - 0.01 && v <= H + BS + 0.01).sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1];
    if (b - a < 0.3) continue;
    dimV(py(b), py(a), px(0) - 22, `${f2(b - a)}`);
  }
  dimV(py(H + BS), py(-FS), px(0) - 48, `${f2(L)} m`);
  }

  /* ── Đường / mặt tiền ── */
  const roadSide = plan.road?.side || 'front';
  if (!free || roadSide === 'front') {
    out.push(`<rect x="${px(LOT.x) - 20}" y="${bottom + 34}" width="${dW + 40}" height="26" fill="#e2e8f0"/>`);
    out.push(`<text x="${px(LOT.x + LOT.w / 2)}" y="${bottom + 52}" font-size="12" font-weight="800" fill="#334155" text-anchor="middle">ĐƯỜNG / LỐI VÀO — MẶT TIỀN HƯỚNG ${esc(plan.facing.toUpperCase())}</text>`);
  } else {
    const top = py(LOT.y + LOT.h);
    if (roadSide === 'left' || roadSide === 'right') {
      const xr = roadSide === 'left' ? px(LOT.x) - 70 : px(LOT.x + LOT.w) + 4;
      out.push(`<rect x="${xr}" y="${top}" width="16" height="${dH}" fill="#e2e8f0"/>`);
      out.push(`<text x="${xr + 12}" y="${top + dH / 2}" font-size="11" font-weight="800" fill="#334155" text-anchor="middle" transform="rotate(-90 ${xr + 12} ${top + dH / 2})">${esc(plan.road?.label || 'ĐƯỜNG VÀO')}</text>`);
    } else {
      out.push(`<rect x="${px(LOT.x)}" y="${top - 22}" width="${dW}" height="18" fill="#e2e8f0"/><text x="${px(LOT.x + LOT.w / 2)}" y="${top - 9}" font-size="11" font-weight="800" fill="#334155" text-anchor="middle">${esc(plan.road?.label || 'ĐƯỜNG VÀO')}</text>`);
    }
    out.push(`<text x="${px(W / 2)}" y="${bottom + 50}" font-size="12" font-weight="800" fill="#334155" text-anchor="middle">MẶT TIỀN (CỬA CHÍNH) HƯỚNG ${esc(plan.facing.toUpperCase())}</text>`);
  }

  /* ── Mũi tên Bắc ── */
  const nx = part === 'plan' ? VW - 46 : wide ? Math.min(px(LOT.x + LOT.w) - 34, VW - 40) : (px(LOT.x + LOT.w) + 50 > panelX - 40 ? drawL + drawMaxW - 30 : px(LOT.x + LOT.w) + 50), ny = drawT + 40;
  out.push(`<g transform="translate(${nx} ${ny}) rotate(${plan.northPageDeg})"><circle r="24" fill="#fff" stroke="#0f172a" stroke-width="1.2"/><path d="M 0 -20 L 7 8 L 0 3 L -7 8 Z" fill="#dc2626"/><text y="-26" font-size="12" font-weight="900" text-anchor="middle" fill="#0f172a">B</text></g>`);

  /* ── Bảng bên phải ── */
  const panelTop = part === 'notes' ? 124 : wide ? bottom + 84 : drawT;
  let y = panelTop;
  let col1Bottom = 0;
  const P: string[] = [];
  // Trang thuyết minh A4 dọc: tự sang trang khi hết chỗ (không cắt đôi dòng chữ)
  const NPH = Math.round(VW * 1.414);
  const ensure = (h: number) => { if (part !== 'notes') return; const k = Math.floor(y / NPH); if (y + h > (k + 1) * NPH - 56) y = (k + 1) * NPH + 56; };
  const head = (t: string) => { ensure(TF + 32 + TH); P.push(`<rect x="${panelX}" y="${y}" width="${panelW}" height="${TF + 14}" fill="#0f172a"/><text x="${panelX + 10}" y="${y + TF + 4}" font-size="${TF + 1}" font-weight="800" fill="#fbbf24">${esc(t)}</text>`); y += TF + 32; };
  const line = (t: string, color = '#0f172a', bold = false, max = Math.floor(panelW / (TF * (part === 'notes' ? 0.5 : 0.56)))) => {
    wrap(t, max).forEach(l => { ensure(TH); P.push(`<text x="${panelX + 10}" y="${y}" font-size="${TF}" fill="${color}" ${bold ? 'font-weight="700"' : ''}>${esc(l)}</text>`); y += TH; });
  };

  head('BẢNG PHÒNG');
  const sched = inside.filter(r => r.name && r.type !== 'corridor');
  sched.forEach(r => {
    ensure(TH);
    const mark = r.good === true ? '●' : r.good === false ? '●' : '○';
    const col = r.good === true ? '#15803d' : r.good === false ? '#dc2626' : '#7c3aed';
    P.push(`<text x="${panelX + 10}" y="${y}" font-size="${TF}" fill="${col}">${mark}</text>`);
    P.push(`<text x="${panelX + 24}" y="${y}" font-size="${TF}" fill="#0f172a">${esc(r.name)}</text>`);
    P.push(`<text x="${panelX + (part === 'notes' ? 420 : 240)}" y="${y}" font-size="${TF}" fill="#475569">${f1(r.w * r.h)} m²</text>`);
    P.push(`<text x="${panelX + panelW - 8}" y="${y}" font-size="${TF - 1}" fill="${col}" text-anchor="end">${esc(r.sector === 'Trung cung' ? 'Trung cung' : (r.star || r.sector || ''))}</text>`);
    y += TH;
  });
  y += 8;
  if (plan.sketchNotes && plan.sketchNotes.length) {
    head('THEO YÊU CẦU / PHÁC THẢO CỦA GIA CHỦ');
    plan.sketchNotes.forEach(n => { line(n, n.startsWith('↺') ? '#b45309' : n.startsWith('?') ? '#7c3aed' : '#15803d'); y += 2; });
    y += 6;
  }
  if (plan.advice && plan.advice.length) {
    head(plan.adviceApplied ? 'TƯ VẤN KTS — ĐÃ ÁP DỤNG VÀO BẢN VẼ' : 'TƯ VẤN KTS — CHƯA ÁP DỤNG (bản vẽ giữ ý gia chủ)');
    plan.advice.forEach((n, k) => { line(`${k + 1}. ${n}`, plan.adviceApplied ? '#15803d' : '#1d4ed8'); y += 2; });
    y += 6;
  }
  if (pWide) { col1Bottom = y; panelX = 580; y = panelTop; }   // sang cột 2
  head('PHONG THỦY BỐ TRÍ');
  plan.fengShuiNotes.forEach(n => { line('• ' + n); y += 2; });
  y += 6;
  head('KIỂM TRA KỸ THUẬT');
  plan.checks.forEach(c => { line(`${c.ok ? '✓' : '✗'} ${c.text}`, c.ok ? '#15803d' : '#dc2626'); y += 2; });
  y += 6;
  head('CHÚ THÍCH');
  line('● xanh: cung tốt · ● đỏ: cung xấu · đường tím: lưới 9 cung', '#334155');
  line('Mũi tên đỏ tại bếp: hướng miệng bếp. Mũi tên vàng: hướng bàn thờ.', '#334155');
  if (free) line('Nét đứt xanh: lối vào của khách · nét đứt cam: lối ra bếp phụ · nét đứt xám: ô mở thông giữa các không gian chung.', '#334155');
  line('Bản vẽ sơ bộ phục vụ tư vấn. Cần KTS/KS lập hồ sơ thiết kế kỹ thuật, khảo sát hiện trạng trước khi thi công & xin phép xây dựng.', '#64748b');

  const contentBottom = part === 'plan' ? bottom + 70 : part === 'notes' ? Math.max(y + 10, col1Bottom + 10) : Math.max(bottom + 70, y + 10, col1Bottom + 10);
  const VH = part === 'plan' ? Math.max(PAGE_H, Math.ceil(contentBottom + 40)) : Math.ceil(contentBottom + 40);
  const footer = `<rect x="0" y="${VH - 30}" width="${VW}" height="30" fill="#f1f5f9"/><text x="28" y="${VH - 11}" font-size="11.5" fill="#475569">Yohu ConsTech · ${new Date().toLocaleDateString('vi-VN')} · Tỷ lệ minh họa (1 ô lưới = 1/3 chiều nhà) · Kích thước tính theo tim tường, đơn vị m</text>`;

  if (part === 'notes') {
    const pages = Math.floor((y + 10) / NPH) + 1;
    const foot = (k: number) => `<rect x="0" y="${(k + 1) * NPH - 30}" width="${VW}" height="30" fill="#f1f5f9"/><text x="28" y="${(k + 1) * NPH - 11}" font-size="11.5" fill="#475569">Yohu ConsTech · ${new Date().toLocaleDateString('vi-VN')} · Thuyết minh tầng ${plan.floor}${pages > 1 ? ` · trang ${k + 1}/${pages}` : ''}</text>`;
    return Array.from({ length: pages }, (_, k) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${k * NPH} ${VW} ${NPH}" width="${VW}" height="${NPH}" font-family="Arial, 'Helvetica Neue', sans-serif">
<rect x="0" y="${k * NPH}" width="${VW}" height="${NPH}" fill="#ffffff"/>
${k === 0 ? out.slice(0, headerLen).join('\n') : ''}
${P.join('\n')}
${foot(k)}
</svg>`).join(NOTES_PAGE_BREAK);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" font-family="Arial, 'Helvetica Neue', sans-serif">
<defs>
  <marker id="arrowR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626"/></marker>
  <marker id="arrowA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#b45309"/></marker>
</defs>
<rect x="0" y="0" width="${VW}" height="${VH}" fill="#ffffff"/>
${out.join('\n')}
${part === 'plan' ? '' : P.join('\n')}
${footer}
</svg>`;
}
