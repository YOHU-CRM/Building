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
const COL: Record<Ben, number> = { trai: 0, giua: 1, phai: 2 };

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
  // Nhà nhiều tầng: cầu thang cùng 1 ô ở mọi tầng (xếp chồng), tránh ô gia chủ đã chọn, tránh giữa nhà
  let stairCell: [number, number] | null = null;
  if (floors > 1 && !narrow) {
    const userCells = new Set(slots.map(s => { const sp = specOf(ct, s.key); return sp.vi_tri && sp.ben ? `${ROW[sp.vi_tri]},${COL[sp.ben]}` : ''; }).filter(Boolean));
    stairCell = ([[1, 0], [1, 2], [2, 1], [2, 0], [2, 2], [0, 2]] as [number, number][]).find(([r, c]) => !userCells.has(`${r},${c}`)) || [1, 0];
  }
  for (let f = 1; f <= floors; f++) {
    const here = slots.filter(s => (Number(specOf(ct, s.key).tang) || s.defaultTang) === f);
    if (!here.length && !stairCell) continue;
    if (narrow) {
      tang.push({ tang: f, phong: here.map(s => { const sp = specOf(ct, s.key); return { loai: s.loai, ten_goc: s.label, vi_tri: sp.vi_tri || '', ben: sp.ben === 'giua' ? 'ca_ngang' : sp.ben || '', dien_tich: n(sp.dai) * n(sp.rong) || null }; }) });
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
    // phòng khách chiếm thêm ô trống bên cạnh cùng hàng (phòng lớn)
    const kh = placed.find(p => p.loai === 'khach');
    if (kh && kh.cot < 2 && !occ[kh.hang][kh.cot + 1] && !n(specOf(ct, 'khach').rong)) { occ[kh.hang][kh.cot + 1] = 'khach'; kh.so_cot = 2; }
    // Ô trống hàng trước / hàng sau → nhập vào phòng bên cạnh (không bỏ phí diện tích); ô giữa nhà giữ làm sảnh lối đi
    const PRI = ['bep', 'khach', 'ngu', 'lam_viec', 'tho', 'gara'];
    for (const r of [0, 2]) for (let c = 0; c < 3; c++) {
      if (occ[r][c]) continue;
      const cand = placed.filter(p => p.hang === r && p.so_hang === 1 && !p.rong && p.nguon !== 'gia_chu' && PRI.includes(p.loai) && (p.cot + p.so_cot === c || p.cot === c + 1))
        .sort((a, b) => PRI.indexOf(a.loai) - PRI.indexOf(b.loai))[0];
      if (!cand) continue;
      if (cand.cot === c + 1) cand.cot = c;
      cand.so_cot += 1;
      occ[r][c] = cand.loai;
    }
    tang.push({ tang: f, phong: placed });
  }
  if (!tang.length) return null;
  return {
    co_phac_thao: true, kieu: narrow ? 'nha_ong' : 'tu_do', nguon: 'o_nhap', luoi: { so_hang: 3, so_cot: 3 },
    tang, ghi_chu_o_nhap: notes,
    huong_phong: slots.map(s => ({ ten: s.label, huong: specOf(ct, s.key).huong })).filter(x => x.huong)
  };
}
