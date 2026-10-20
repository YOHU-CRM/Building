/**
 * MÀU NGOẠI THẤT (mái, tường, khung cửa, cửa chính) cho 3D, mặt đứng và ảnh phối cảnh.
 *
 * Thứ tự ưu tiên (đúng nguyên tắc của tool):
 *   1. Màu gia chủ GHI trong mô tả ("mái tôn màu xanh rêu", "cửa nhôm màu đen", "sơn tường màu kem"…)
 *   2. Gia chủ không ghi màu → ĐỀ XUẤT theo ngũ hành bản mệnh (màu tương sinh / bản mệnh, tránh màu tương khắc)
 *   3. Chưa có tuổi gia chủ → màu trung tính phổ biến
 * Mỗi màu đều ghi rõ nguồn để giao diện nói cho khách biết (không âm thầm tự chọn).
 */

export type PaletteSource = 'mo_ta' | 'phong_thuy' | 'mac_dinh';
export interface PaletteItem { hex: string; name: string; source: PaletteSource }
export interface ExteriorPalette {
  roof: PaletteItem; wall: PaletteItem; frame: PaletteItem; door: PaletteItem; accent: PaletteItem;
  element?: string;               // hành bản mệnh dùng để đề xuất
  notes: string[];                // giải thích ngắn cho khách
}

/* Tên màu tiếng Việt → mã màu (ưu tiên cụm dài trước) */
/** từ nguyên vẹn (không dính chữ cái tiếng Việt hai bên) */
const W = (p: string) => new RegExp(`(?<!\\p{L})(?:${p})(?!\\p{L})`, 'u');
const COLORS: [RegExp, string, string][] = [
  [W('đỏ\\s*đô|đỏ\\s*mận|đỏ\\s*rượu'), '#7f1d1d', 'đỏ đô'], [W('đỏ\\s*gạch|đỏ\\s*đất'), '#a3442a', 'đỏ gạch'], [W('đỏ\\s*tươi'), '#c62828', 'đỏ tươi'], [W('đỏ'), '#a52a2a', 'đỏ'],
  [W('xanh\\s*rêu'), '#3f5b3a', 'xanh rêu'], [W('xanh\\s*lá|xanh\\s*lục'), '#2e7d32', 'xanh lá'], [W('xanh\\s*ngọc'), '#0f766e', 'xanh ngọc'],
  [W('xanh\\s*dương|xanh\\s*biển|xanh\\s*nước\\s*biển'), '#1e3a8a', 'xanh dương'], [W('xanh\\s*da\\s*trời'), '#38bdf8', 'xanh da trời'], [W('xanh\\s*đen'), '#1e293b', 'xanh đen'],
  [W('xám\\s*ghi|ghi\\s*xám|màu\\s*ghi'), '#6b7280', 'xám ghi'], [W('xám\\s*đậm'), '#374151', 'xám đậm'], [W('xám\\s*nhạt|ghi\\s*sáng'), '#9ca3af', 'xám nhạt'], [W('xám'), '#6b7280', 'xám'],
  [W('đen'), '#1f2937', 'đen'], [W('trắng\\s*sữa|trắng\\s*ngà'), '#f5f0e1', 'trắng ngà'], [W('trắng'), '#fafafa', 'trắng'],
  [W('kem'), '#f1e4c3', 'kem'], [W('vàng\\s*kem'), '#f3e3b0', 'vàng kem'], [W('vàng\\s*nhạt'), '#f6e7a6', 'vàng nhạt'], [W('vàng'), '#e5b93c', 'vàng'],
  [W('nâu\\s*gỗ|vân\\s*gỗ|màu\\s*gỗ|gỗ'), '#8b5a2b', 'nâu vân gỗ'], [W('nâu\\s*đỏ'), '#7b3f2a', 'nâu đỏ'], [W('nâu\\s*đất|nâu\\s*đậm'), '#5d4037', 'nâu đất'], [W('nâu'), '#795548', 'nâu'],
  [W('cam'), '#d9772b', 'cam'], [W('tím'), '#6d28d9', 'tím'], [W('hồng'), '#d98a9a', 'hồng'], [W('bạc|ánh\\s*kim'), '#c0c4c8', 'bạc']
];

function colorIn(text: string): { hex: string; name: string } | null {
  const t = text.toLowerCase();
  for (const [re, hex, name] of COLORS) if (re.test(t)) return { hex, name };
  return null;
}

/** Tìm màu trong đoạn mô tả quanh từ khoá (vd "mái … màu xanh rêu") — trong cùng một câu / vế câu */
function colorNear(desc: string, keys: RegExp): { hex: string; name: string } | null {
  const parts = String(desc || '').toLowerCase().split(/[.;\n]|,(?=\s*(?:mái|tường|cửa|khung|sơn))/);
  for (const p of parts) {
    if (!keys.test(p)) continue;
    const m = p.match(/màu\s+([^,.;]{2,30})/);
    const c = colorIn(m ? m[1] : p);
    if (c) return c;
  }
  return null;
}

/* Đề xuất theo ngũ hành (bản mệnh + màu tương sinh; tránh màu tương khắc) */
const BY_ELEMENT: Record<string, { roof: [string, string]; wall: [string, string]; frame: [string, string]; door: [string, string]; accent: [string, string]; why: string }> = {
  'Hỏa': { roof: ['#7f1d1d', 'đỏ đô'], wall: ['#f5f0e1', 'trắng ngà'], frame: ['#5d4037', 'nâu gỗ'], door: ['#8b5a2b', 'nâu vân gỗ'], accent: ['#2e7d32', 'xanh lá (cây xanh)'], why: 'mệnh Hỏa hợp đỏ (bản mệnh), xanh lá (Mộc sinh Hỏa); tránh mảng lớn đen, xanh nước biển (Thủy khắc Hỏa)' },
  'Thổ': { roof: ['#a3442a', 'đỏ gạch'], wall: ['#f1e4c3', 'vàng kem'], frame: ['#5d4037', 'nâu đất'], door: ['#795548', 'nâu'], accent: ['#c62828', 'đỏ'], why: 'mệnh Thổ hợp vàng, nâu đất (bản mệnh), đỏ (Hỏa sinh Thổ); tránh mảng lớn xanh lá (Mộc khắc Thổ)' },
  'Kim': { roof: ['#6b7280', 'xám ghi'], wall: ['#fafafa', 'trắng'], frame: ['#9ca3af', 'ghi bạc'], door: ['#8b6b3a', 'vàng nâu'], accent: ['#f1e4c3', 'vàng kem (Thổ sinh Kim)'], why: 'mệnh Kim hợp trắng, ghi, bạc (bản mệnh), vàng, nâu đất (Thổ sinh Kim); tránh mảng lớn đỏ (Hỏa khắc Kim)' },
  'Thủy': { roof: ['#1e3a8a', 'xanh dương đậm'], wall: ['#fafafa', 'trắng'], frame: ['#1f2937', 'đen'], door: ['#374151', 'xám đậm'], accent: ['#c0c4c8', 'ghi bạc (Kim sinh Thủy)'], why: 'mệnh Thủy hợp đen, xanh nước biển (bản mệnh), trắng, ghi (Kim sinh Thủy); tránh mảng lớn vàng, nâu đất (Thổ khắc Thủy)' },
  'Mộc': { roof: ['#3f5b3a', 'xanh rêu'], wall: ['#f5f0e1', 'trắng ngà'], frame: ['#1f2937', 'đen'], door: ['#8b5a2b', 'nâu vân gỗ'], accent: ['#1e3a8a', 'xanh dương (Thủy sinh Mộc)'], why: 'mệnh Mộc hợp xanh lá (bản mệnh), đen, xanh nước biển (Thủy sinh Mộc); tránh mảng lớn trắng ánh kim (Kim khắc Mộc)' }
};

const NEUTRAL = { roof: ['#6b7280', 'xám ghi'], wall: ['#f5f2ea', 'trắng kem'], frame: ['#6b7280', 'nhôm xám'], door: ['#8b5a2b', 'nâu vân gỗ'], accent: ['#9ca3af', 'xám nhạt'] } as const;

/** Hành bản mệnh từ kết quả phong thủy ("Thiên Thượng Hỏa (Lửa trên trời)" / hanh) */
export function elementOf(fs: any): string | undefined {
  const s = String(fs?.hanh || fs?.element || fs?.elementDetail || '');
  return ['Hỏa', 'Thổ', 'Kim', 'Thủy', 'Mộc'].find(h => s.includes(h));
}

export function resolveExteriorPalette(opts: { description?: string; fengShuiAnalysis?: any; roofKind?: string }): ExteriorPalette {
  const d = String(opts.description || '');
  const el = elementOf(opts.fengShuiAnalysis);
  const fs = el ? BY_ELEMENT[el] : null;
  const pick = (key: 'roof' | 'wall' | 'frame' | 'door' | 'accent', found: { hex: string; name: string } | null): PaletteItem =>
    found ? { ...found, source: 'mo_ta' } : fs ? { hex: fs[key][0], name: fs[key][1], source: 'phong_thuy' } : { hex: NEUTRAL[key][0], name: NEUTRAL[key][1], source: 'mac_dinh' };
  const roof = pick('roof', colorNear(d, /mái|tôn|ngói/));
  const wall = pick('wall', colorNear(d, /tường|sơn ngoài|sơn nhà|ngoại thất|mặt tiền/));
  const frame = pick('frame', colorNear(d, /khung|cửa sổ|nhôm|kính/));
  const door = pick('door', colorNear(d, /cửa chính|cửa đi|cửa gỗ/));
  const accent = pick('accent', null);
  const notes: string[] = [];
  const said = [roof, wall, frame, door].filter(x => x.source === 'mo_ta');
  if (said.length) notes.push(`Theo mô tả của gia chủ: ${[['mái', roof], ['tường', wall], ['khung cửa', frame], ['cửa chính', door]].filter(([, x]: any) => x.source === 'mo_ta').map(([k, x]: any) => `${k} ${x.name}`).join(', ')}.`);
  const auto = [['mái', roof], ['tường', wall], ['khung cửa', frame], ['cửa chính', door]].filter(([, x]: any) => x.source !== 'mo_ta');
  if (auto.length) notes.push(fs
    ? `Mô tả chưa ghi màu ${auto.map(([k]) => k).join(', ')} → đề xuất theo bản mệnh ${el}: ${auto.map(([k, x]: any) => `${k} ${x.name}`).join(', ')} (${fs.why}). Gia chủ ghi màu khác trong mô tả thì tool vẽ theo màu đó.`
    : `Mô tả chưa ghi màu ${auto.map(([k]) => k).join(', ')} và chưa có tuổi gia chủ → vẽ tạm màu trung tính (${auto.map(([k, x]: any) => `${k} ${x.name}`).join(', ')}).`);
  return { roof, wall, frame, door, accent, element: el, notes };
}

/** Mô tả có hệ điện mặt trời áp mái không */
export const wantsSolar = (description?: string) => /điện\s*mặt\s*trời|pin\s*mặt\s*trời|năng\s*lượng\s*mặt\s*trời|solar/i.test(String(description || ''));
