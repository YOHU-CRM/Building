/**
 * YÊU CẦU TỪNG PHÒNG do gia chủ nhập trên giao diện (kích thước, tầng, vị trí trước/giữa/sau, trái/giữa/phải, hướng).
 *
 * Thứ tự ưu tiên của tool:
 *   1. Ô gia chủ nhập cho từng phòng (bắt buộc theo)
 *   2. Mô tả văn bản + các ô chung (số phòng, số tầng, kích thước nhà)
 *   3. Phòng gia chủ KHÔNG nhập → tool tự đặt theo công năng + phong thủy (bếp sau, WC hông, thờ phía sau/tầng trên…)
 *   4. Ảnh tham chiếu / bản vẽ tay → chỉ tham chiếu bố trí & kiểu dáng
 *
 * Kết quả: một "phác thảo" dạng lưới (giống AI đọc bản vẽ tay) để bộ vẽ mặt bằng dùng chung.
 */

export type ViTri = 'truoc' | 'giua' | 'sau';
export type Ben = 'trai' | 'giua' | 'phai';
export interface RoomSpec { tang?: number; dai?: number; rong?: number; vi_tri?: ViTri; ben?: Ben; huong?: string; ghi_chu?: string }
export interface RoomSlot { key: string; loai: string; label: string; defaultTang: number }

const n = (v: any) => { const x = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(x) && x > 0 ? x : 0; };

/** Danh sách phòng theo các ô chọn + số phòng ngủ / WC + số tầng */
export function listRoomSlots(ct: any): RoomSlot[] {
  const r = ct?.rooms || {};
  const floors = Math.max(1, Math.round(Number(ct?.floors) || 1));
  const out: RoomSlot[] = [];
  if (r.livingRoom !== false) out.push({ key: 'khach', loai: 'khach', label: 'Phòng khách', defaultTang: 1 });
  if (r.kitchen !== false) out.push({ key: 'bep', loai: 'bep', label: 'Bếp + ăn', defaultTang: 1 });
  if (r.worshipRoom) out.push({ key: 'tho', loai: 'tho', label: 'Phòng thờ', defaultTang: floors });
  if (r.workRoom) out.push({ key: 'lam_viec', loai: 'lam_viec', label: 'Phòng làm việc', defaultTang: floors > 1 ? 2 : 1 });
  const beds = Math.max(0, Math.round(Number(r.bedroomCount) || 0));
  for (let i = 1; i <= beds; i++) out.push({ key: `ngu_${i}`, loai: 'ngu', label: `Phòng ngủ ${i}`, defaultTang: floors === 1 ? 1 : Math.min(floors, 2 + Math.floor((i - 1) / 2)) });
  const wcs = Math.max(0, Math.round(Number(r.bathroomCount) || 0));
  for (let i = 1; i <= wcs; i++) out.push({ key: `wc_${i}`, loai: 'wc', label: `WC ${i}`, defaultTang: Math.min(floors, i) });
  if (r.garage === true) out.push({ key: 'gara', loai: 'gara', label: 'Gara ô tô', defaultTang: 1 });
  return out;
}

export const specOf = (ct: any, key: string): RoomSpec => (ct?.rooms?.details || {})[key] || {};
export const specFilled = (s: RoomSpec) => !!(n(s.dai) || n(s.rong) || s.vi_tri || s.ben || s.huong || s.ghi_chu);

/** Vị trí ưu tiên khi gia chủ không chọn (theo công năng nhà ở Việt Nam) */
const AUTO_CELL: Record<string, [number, number][]> = {
  //            [hàng, cột]: hàng 0 = trước, 2 = sau; cột 0 = trái, 2 = phải
  khach: [[0, 1], [0, 0], [0, 2], [1, 1]],
  gara: [[0, 0], [0, 2]],
  bep: [[2, 1], [2, 0], [2, 2], [1, 1]],
  tho: [[2, 1], [2, 0], [2, 2], [1, 0]],
  wc: [[1, 2], [1, 0], [2, 2], [2, 0]],
  ngu: [[1, 0], [1, 2], [2, 0], [2, 2], [0, 2], [0, 0]],
  lam_viec: [[0, 2], [0, 0], [1, 0], [1, 2]]
};
const ROW: Record<ViTri, number> = { truoc: 0, giua: 1, sau: 2 };
/* "Bên trái / bên phải" của gia chủ = ĐỨNG TRONG NHÀ NHÌN RA CỬA CHÍNH (cách nói phổ biến: tả Thanh Long, hữu Bạch Hổ).
   Lưới bộ vẽ đánh cột theo người đứng NGOÀI nhìn vào (cột 0 = bên trái người đứng ngoài) → bên trái gia chủ = cột 2. */
const COL: Record<Ben, number> = { trai: 2, giua: 1, phai: 0 };
/** bên trái/phải (trong nhà nhìn ra) → cạnh trên lưới bộ vẽ (đứng ngoài nhìn vào) */
export const BEN_TO_CANH: Record<string, string> = { trai: 'phai', phai: 'trai', sau: 'sau', truoc: 'truoc' };

const DIR8 = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
/** Hướng thật của bên trái / phải / phía sau (đứng trong nhà nhìn ra cửa chính hướng `facing`) */
export function sideCompass(facing: string | undefined, ben: 'trai' | 'phai' | 'sau' | 'truoc'): string {
  const f = String(facing || '').trim();
  const i = DIR8.findIndex(d => d.toLowerCase() === f.toLowerCase());
  if (i < 0) return '';
  const off = ben === 'truoc' ? 0 : ben === 'sau' ? 4 : ben === 'trai' ? 6 : 2;   // nhìn ra hướng f: tay trái = f − 90°, tay phải = f + 90°
  return DIR8[(i + off) % 8];
}

/** Bếp phụ đun củi ngoài nhà: ô gia chủ chọn (rooms.outKitchen = 'sau' | 'trai' | 'phai' | 'khong') hoặc mô tả có chữ "bếp củi / bếp phụ / đun củi" */
export const OUT_KITCHEN_RE = /bếp\s*(?:đun\s*)?củi|bếp\s*phụ|đun\s*củi|bếp\s*rơm|bếp\s*ngoài\s*(?:nhà|trời)/i;
export function outKitchenOf(ct: any): { want: boolean; ben: 'sau' | 'trai' | 'phai'; auto: boolean } {
  const v = ct?.rooms?.outKitchen;
  if (v === 'khong') return { want: false, ben: 'sau', auto: false };
  if (v === 'sau' || v === 'trai' || v === 'phai') return { want: true, ben: v, auto: false };
  return { want: OUT_KITCHEN_RE.test(String(ct?.overallDescription || '')), ben: 'sau', auto: true };
}

/**
 * Dựng "phác thảo" từ ô nhập từng phòng. Chỉ dựng khi gia chủ đã chọn vị trí cho ≥ 1 phòng của tầng đó
 * (không có vị trí nào → để bộ vẽ tự động theo phong thủy như cũ).
 * houseW: chiều ngang nhà (m) — nhà hẹp < 7m chỉ ghi vị trí trước/giữa/sau (bộ vẽ nhà ống), không chia 3 cột.
 */
export function specsToSketch(ct: any, houseW: number): any | null {
  const slots = listRoomSlots(ct);
  const floors = Math.max(1, Math.round(Number(ct?.floors) || 1));
  const anyPos = slots.some(s => { const sp = specOf(ct, s.key); return sp.vi_tri || sp.ben; });
  if (!anyPos) return null;
  const narrow = houseW > 0 && houseW < 7 && floors > 1;
  const tang: any[] = [];
  const notes: string[] = [];
  const outK = outKitchenOf(ct);
  // Nhà nhiều tầng: cầu thang cùng 1 ô ở mọi tầng (xếp chồng), tránh ô gia chủ đã chọn, tránh giữa nhà
  let stairCell: [number, number] | null = null;
  if (floors > 1 && !narrow) {
    const userCells = new Set(slots.map(s => { const sp = specOf(ct, s.key); return sp.vi_tri && sp.ben ? `${ROW[sp.vi_tri]},${COL[sp.ben]}` : ''; }).filter(Boolean));
    stairCell = ([[1, 0], [1, 2], [2, 1], [2, 0], [2, 2], [0, 2]] as [number, number][]).find(([r, c]) => !userCells.has(`${r},${c}`)) || [1, 0];
  }
  for (let f = 1; f <= floors; f++) {
    const here = slots.filter(s => (Number(specOf(ct, s.key).tang) || s.defaultTang) === f);
    if (!here.length && !stairCell) continue;   // nhà 1 tầng / nhà ống: tầng trống thì bỏ qua
    if (narrow) {
      tang.push({ tang: f, phong: here.map(s => { const sp = specOf(ct, s.key); return { loai: s.loai, ten_goc: s.label, vi_tri: sp.vi_tri || '', ben: sp.ben === 'giua' ? 'ca_ngang' : sp.ben ? BEN_TO_CANH[sp.ben] : '', dien_tich: n(sp.dai) * n(sp.rong) || null }; }) });
      continue;
    }
    const occ: (string | null)[][] = [[null, null, null], [null, null, null], [null, null, null]];
    const placed: any[] = [];
    const place = (s: RoomSlot, cells: [number, number][], fromUser: boolean) => {
      for (const [r, c] of cells) {
        if (!occ[r][c]) {
          occ[r][c] = s.key;
          const sp = specOf(ct, s.key);
          placed.push({ loai: s.loai, ten_goc: s.label, hang: r, cot: c, so_hang: 1, so_cot: 1, dien_tich: n(sp.dai) * n(sp.rong) || null, rong: n(sp.rong) || null, dai: n(sp.dai) || null, tin_cay: 1, nguon: fromUser ? 'gia_chu' : 'tu_dong' });
          return true;
        }
      }
      return false;
    };
    if (stairCell) { occ[stairCell[0]][stairCell[1]] = 'thang'; placed.push({ loai: 'thang', ten_goc: 'Cầu thang', hang: stairCell[0], cot: stairCell[1], so_hang: 1, so_cot: 1, dien_tich: null, tin_cay: 1, nguon: 'tu_dong' }); }
    // 1. phòng gia chủ chọn vị trí
    here.forEach(s => {
      const sp = specOf(ct, s.key);
      if (!sp.vi_tri && !sp.ben) return;
      const r0 = sp.vi_tri ? ROW[sp.vi_tri] : -1, c0 = sp.ben ? COL[sp.ben] : -1;
      const want: [number, number][] = [];
      if (r0 >= 0 && c0 >= 0) want.push([r0, c0]);
      if (r0 >= 0) [1, 0, 2].forEach(c => want.push([r0, c]));
      if (c0 >= 0) [1, 0, 2].forEach(r => want.push([r, c0]));
      if (!place(s, want, true)) { notes.push(`${s.label}: ô vị trí đã có phòng khác — tool đặt sang ô trống gần nhất.`); place(s, AUTO_CELL[s.loai] || [[1, 1]], true) || place(s, [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], true); }
      else if (r0 >= 0 && c0 >= 0 && !(placed[placed.length - 1].hang === r0 && placed[placed.length - 1].cot === c0)) notes.push(`${s.label}: ô ${sp.vi_tri}–${sp.ben} đã có phòng khác — đặt ô bên cạnh cùng hàng/cột.`);
    });
    // 2. phòng chưa chọn vị trí → tool tự đặt
    here.forEach(s => {
      const sp = specOf(ct, s.key);
      if (sp.vi_tri || sp.ben) return;
      if (!place(s, AUTO_CELL[s.loai] || [[1, 1]], false)) place(s, [[1, 1], [0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]], false) || notes.push(`${s.label}: tầng ${f} đã kín 9 ô — chuyển tầng khác hoặc giảm số phòng.`);
    });
    // Tầng không có phòng nào trong yêu cầu (chỉ có cầu thang) → không để bộ vẽ khác tự thêm phòng trùng tầng dưới:
    // dành cho sinh hoạt chung / không gian đa năng và hỏi lại gia chủ
    if (!here.length) {
      const free = ([[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] as [number, number][]).filter(([r, c]) => !occ[r][c]);
      const colsFull = [0, 1, 2].filter(c => [0, 1, 2].every(r => !occ[r][c]));
      if (colsFull.length >= 2 && colsFull[1] === colsFull[0] + 1) {
        placed.push({ loai: 'sinh_hoat', ten_goc: 'Sinh hoạt chung', hang: 0, cot: colsFull[0], so_hang: 3, so_cot: 2, dien_tich: null, tin_cay: 1, nguon: 'tu_dong' });
        [0, 1, 2].forEach(r => { occ[r][colsFull[0]] = 'sinh_hoat'; occ[r][colsFull[0] + 1] = 'sinh_hoat'; });
      }
      ([[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] as [number, number][]).filter(([r, c]) => !occ[r][c]).forEach(([r, c]) => {
        occ[r][c] = 'da_nang';
        placed.push({ loai: 'sinh_hoat', ten_goc: 'Không gian đa năng', hang: r, cot: c, so_hang: 1, so_cot: 1, dien_tich: null, tin_cay: 1, nguon: 'tu_dong' });
      });
      if (free.length) notes.push(`Tầng ${f}: chưa có phòng nào trong yêu cầu — tool để sinh hoạt chung / không gian đa năng, không tự thêm phòng ngủ, WC. Anh/chị chọn "Tầng ${f}" cho phòng muốn đặt trên tầng này.`);
      tang.push({ tang: f, phong: placed });
      continue;
    }
    // phòng khách chiếm thêm ô trống bên cạnh cùng hàng (phòng lớn) — cả bên trái lẫn bên phải
    const kh = placed.find(p => p.loai === 'khach');
    if (kh && !n(specOf(ct, 'khach').rong)) {
      if (kh.cot + kh.so_cot <= 2 && !occ[kh.hang][kh.cot + kh.so_cot]) { occ[kh.hang][kh.cot + kh.so_cot] = 'khach'; kh.so_cot += 1; }
      else if (kh.cot > 0 && !occ[kh.hang][kh.cot - 1]) { kh.cot -= 1; occ[kh.hang][kh.cot] = 'khach'; kh.so_cot += 1; }
    }
    // Ô trống hàng trước / hàng sau → nhập vào phòng bên cạnh để không bỏ phí diện tích (ô giữa nhà giữ làm sảnh lối đi).
    // Phòng gia chủ đã chọn vị trí nhưng KHÔNG ghi kích thước vẫn được nới sang ô trống (vị trí giữ nguyên); phòng thờ, WC không nới.
    const PRI = ['bep', 'khach', 'ngu', 'lam_viec', 'gara'];
    const grow = (p: any) => !p.rong && !p.dai && !p.dien_tich;
    for (const r of [0, 2]) for (let c = 0; c < 3; c++) {
      if (occ[r][c]) continue;
      // 1. cùng hàng
      const cand = placed.filter(p => p.hang === r && p.so_hang === 1 && grow(p) && PRI.includes(p.loai) && (p.cot + p.so_cot === c || p.cot === c + 1))
        .sort((a, b) => PRI.indexOf(a.loai) - PRI.indexOf(b.loai))[0];
      if (cand) {
        if (cand.cot === c + 1) cand.cot = c;
        cand.so_cot += 1;
        occ[r][c] = cand.loai;
        if (cand.nguon === 'gia_chu') notes.push(`${cand.ten_goc}: nới sang ô trống bên cạnh cho đủ rộng (vẫn giữ vị trí anh/chị chọn).`);
        continue;
      }
      // 2. cùng cột, ô giữa nhà (vd bếp giữa nhà nới ra phía sau, có cửa sau)
      const v = placed.find(p => p.cot === c && p.so_cot === 1 && p.hang === 1 && p.so_hang === 1 && grow(p) && ['bep', 'khach'].includes(p.loai));
      if (v) {
        if (r === 0) v.hang = 0;
        v.so_hang += 1;
        occ[r][c] = v.loai;
        if (v.nguon === 'gia_chu') notes.push(`${v.ten_goc}: nới ra ${r === 0 ? 'phía trước' : 'phía sau'} cho đủ rộng (vẫn giữ vị trí giữa nhà anh/chị chọn).`);
      }
    }
    const clearDims = (p: any) => { const had = !!(p.dai || p.rong || p.dien_tich); p.dai = null; p.rong = null; p.dien_tich = null; return had; };
    // Có bếp phụ đun củi: bếp ở giữa nhà mà ô phía sau cùng cột còn trống → bếp nới ra tường sau
    // (cửa phụ ra lối có mái che → bếp củi, cửa sổ phía sau) — không để bếp kẹt giữa nhà không có tường ngoài
    if (f === 1 && outK.want) {
      const bp = placed.find(p => p.loai === 'bep' && p.so_cot === 1 && p.hang + p.so_hang === 2 && !occ[2][p.cot]);
      if (bp) {
        occ[2][bp.cot] = 'bep'; bp.so_hang += 1;
        notes.push(`${bp.ten_goc}: nới ra tường sau để có cửa phụ đi thẳng ra bếp phụ đun củi${clearDims(bp) ? ' (rộng hơn kích thước anh/chị nhập)' : ''}.`);
      }
    }
    // Ô trống mặt tiền ngay trước phòng khách → phòng khách nới ra mặt tiền, không để thành sảnh trống lớn
    const kh2 = placed.find(p => p.loai === 'khach' && p.hang === 1 && p.so_hang === 1 && p.so_cot === 1 && !occ[0][p.cot]);
    if (kh2) {
      occ[0][kh2.cot] = 'khach'; kh2.hang = 0; kh2.so_hang = 2;
      notes.push(`${kh2.ten_goc}: nới ra ô trống mặt tiền phía trước, không để sảnh trống${clearDims(kh2) ? ' (rộng hơn kích thước anh/chị nhập — muốn giữ đúng kích thước thì chọn thêm 1 phòng vào ô phía trước)' : ''}.`);
    }
    tang.push({ tang: f, phong: placed });
  }
  if (!tang.length) return null;
  return {
    co_phac_thao: true, kieu: narrow ? 'nha_ong' : 'tu_do', nguon: 'o_nhap', luoi: { so_hang: 3, so_cot: 3 },
    tang, ghi_chu_o_nhap: notes,
    // bếp phụ đun củi ngoài nhà + cửa phụ (cạnh theo lưới bộ vẽ: đứng ngoài nhìn vào)
    ...(outK.want ? { ngoai_nha: [{ loai: 'bep_phu', canh: BEN_TO_CANH[outK.ben] }], cua: [{ loai: 'phu', ra: 'bep_phu', canh: BEN_TO_CANH[outK.ben] }] } : {}),
    huong_phong: slots.map(s => ({ ten: s.label, huong: specOf(ct, s.key).huong })).filter(x => x.huong)
  };
}

/**
 * Có ẢNH PHÁC THẢO (AI đã đọc ra lưới phòng): ảnh quyết định BỐ CỤC. Ô nhập từng phòng chỉ BỔ SUNG cho đúng phòng đó:
 *   - dài × rộng → kích thước phòng (thay số ghi tay trên ảnh)
 *   - hướng cửa sổ → yêu cầu hướng
 *   - vị trí khác vị trí trên ảnh → KHÔNG tự di chuyển phòng, ghi câu hỏi để gia chủ xác nhận
 *   - phòng ô nhập có mà ảnh không có → ghi câu hỏi (không tự thêm phòng)
 */
export function mergeSpecsIntoSketch(sk: any, ct: any): any {
  if (!sk || !Array.isArray(sk.tang)) return sk;
  const slots = listRoomSlots(ct).filter(s => specFilled(specOf(ct, s.key)));
  if (!slots.length) return sk;
  const notes: string[] = [];
  const huong: { ten: string; huong: string }[] = Array.isArray(sk.huong_phong) ? sk.huong_phong.slice() : [];
  const tang = sk.tang.map((t: any) => ({ ...t, phong: (t.phong || []).map((p: any) => ({ ...p })) }));
  const used = new Set<any>();
  const POS_VI: Record<string, string> = { truoc: 'phía trước', giua: 'giữa nhà', sau: 'phía sau' };
  const BEN_VI: Record<string, string> = { trai: 'bên trái', giua: 'ở giữa', phai: 'bên phải' };
  slots.forEach(s => {
    const sp = specOf(ct, s.key);
    const f = Number(sp.tang) || s.defaultTang;
    const t = tang.find((x: any) => Number(x.tang) === f) || tang[0];
    if (!t) return;
    const ph: any[] = t.phong;
    const same = ph.filter(p => String(p.loai) === s.loai && !used.has(p));
    // phòng ngủ / WC đánh số: ưu tiên phòng trên ảnh có cùng số ("P. Ngủ 2")
    const num = (s.key.match(/_(\d+)$/) || [])[1];
    const R0 = Math.max(Number(sk.luoi?.so_hang) || 0, ...ph.map(x => Number(x.hang) + (Number(x.so_hang) || 1)));
    const C0 = Math.max(Number(sk.luoi?.so_cot) || 0, ...ph.map(x => Number(x.cot) + (Number(x.so_cot) || 1)));
    const posOf = (x: any) => {
      const rc = (Number(x.hang) + (Number(x.so_hang) || 1) / 2) / (R0 || 1), cc = (Number(x.cot) + (Number(x.so_cot) || 1) / 2) / (C0 || 1);
      // lưới ảnh: cột 0 = bên trái người đứng ngoài → đổi sang cách nói của gia chủ (đứng trong nhà nhìn ra)
      return { viTri: rc < 1 / 3 ? 'truoc' : rc > 2 / 3 ? 'sau' : 'giua', ben: cc < 1 / 3 ? 'phai' : cc > 2 / 3 ? 'trai' : 'giua' };
    };
    const fits = (x: any) => { const q = posOf(x); return (!sp.vi_tri || sp.vi_tri === q.viTri) && (!sp.ben || sp.ben === q.ben); };
    // nhiều phòng cùng loại (2 phòng ngủ): ưu tiên phòng trên ảnh ĐÚNG VỊ TRÍ gia chủ chọn, rồi tới phòng cùng số ("P. Ngủ 2")
    const p = ((sp.vi_tri || sp.ben) ? same.find(fits) : undefined)
      || (num ? same.find(x => new RegExp(`(?<!\\d)${num}(?!\\d)`).test(String(x.ten_goc || ''))) : undefined) || same[0];
    if (!p) { notes.push(`${s.label}: ô nhập từng phòng có, nhưng phác thảo tay không vẽ phòng này — tool không tự thêm; anh/chị bổ sung lên phác thảo hoặc bỏ ô nhập.`); return; }
    used.add(p);
    const ten = String(p.ten_goc || s.label);
    const d = n(sp.dai), r = n(sp.rong);
    if (d && r) { p.dai = d; p.rong = r; p.dien_tich = Math.round(d * r * 10) / 10; p.nguon = 'gia_chu'; }
    if (sp.huong) { const i = huong.findIndex(h => h.ten === ten); if (i >= 0) huong[i] = { ten, huong: sp.huong }; else huong.push({ ten, huong: sp.huong }); }
    // so vị trí ô nhập với vị trí trên ảnh (lưới ảnh: cột 0 = bên trái người đứng ngoài nhìn vào)
    const { viTri, ben } = posOf(p);
    const diff: string[] = [];
    if (sp.vi_tri && sp.vi_tri !== viTri) diff.push(POS_VI[sp.vi_tri]);
    if (sp.ben && sp.ben !== ben) diff.push(BEN_VI[sp.ben]);
    if (diff.length) notes.push(`${ten}: ô nhập chọn ${diff.join(', ')}, phác thảo tay vẽ ở ${POS_VI[viTri]}, ${BEN_VI[ben]} — bản vẽ giữ theo phác thảo; anh/chị xác nhận hoặc sửa phác thảo.`);
  });
  return { ...sk, tang, huong_phong: huong, ghi_chu_o_nhap: [...(Array.isArray(sk.ghi_chu_o_nhap) ? sk.ghi_chu_o_nhap : []), ...notes] };
}
