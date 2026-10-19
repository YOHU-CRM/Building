import React from 'react';
import { PROVINCE_NAMES_2025, resolveLocation } from '../lib/vnProvinces';
import { computeSiteFor, dimsKindOf } from '../lib/siteGeometry';
import { decideFoundation, normalizeRoof } from '../lib/boqEngine';
import { resolveOptionKey } from '../lib/unifiedPricing';

interface Props {
  theme: 'dark' | 'light';
  constructionInfo: any;
  setConstructionInfo: (v: any) => void;
  customerAddress?: string;
}

/**
 * Điều kiện khu đất: tỉnh/thành (34 tỉnh mới), loại đất, khoảng lùi, loại mái.
 * Hiển thị ngay: diện tích xây dựng, mật độ, loại móng dự kiến — đúng số dùng cho dự toán & bản vẽ.
 */
export const SiteConditionsPanel: React.FC<Props> = ({ theme, constructionInfo, setConstructionInfo, customerAddress }) => {
  const dark = theme === 'dark';
  const ct = constructionInfo || {};
  const set = (patch: any) => setConstructionInfo({ ...ct, ...patch });
  const site = computeSiteFor(ct);
  const floors = Math.max(1, Number(ct.floors) || 1);
  const nm = decideFoundation(resolveOptionKey(ct.loai_ket_cau_chinh), ct.soilType, floors, site.footprint, site.lotWidthM, site.houseLengthM);
  const roof = normalizeRoof(ct.loai_mai || ct.constructionType, floors);
  const autoProvince = !ct.province ? resolveLocation(customerAddress).province : null;

  const box = `p-3 rounded-xl border ${dark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`;
  const label = `block text-[11px] sm:text-xs uppercase font-black tracking-wider mb-1 ${dark ? 'text-slate-400' : 'text-slate-700'}`;
  const input = `w-full p-2.5 rounded-lg border text-sm font-bold focus:outline-none focus:border-amber-500 ${dark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`;

  return (
    <div className={`rounded-2xl border p-3.5 sm:p-4 space-y-3 ${dark ? 'border-slate-800 bg-[#121829]/30' : 'border-slate-200 bg-slate-50'}`}>
      <div className={`text-xs sm:text-sm font-black uppercase tracking-wider ${dark ? 'text-amber-400' : 'text-amber-700'}`}>
        📍 Điều kiện khu đất (ảnh hưởng trực tiếp dự toán & bản vẽ)
      </div>
      <div className={box}>
        <label className={label}>Số đo "{ct.dimensions || '—'}" đã nhập là</label>
        <div className="flex flex-wrap gap-2 text-xs sm:text-sm font-bold">
          <button type="button" onClick={() => set({ dimensionsKind: 'nha' })} className={`px-3 py-2 rounded-lg border cursor-pointer ${dimsKindOf(ct) === 'nha' ? 'bg-amber-500 text-slate-950 border-amber-500' : dark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'}`}>🏠 Kích thước nhà xây (mặc định)</button>
          <button type="button" onClick={() => set({ dimensionsKind: 'dat' })} className={`px-3 py-2 rounded-lg border cursor-pointer ${dimsKindOf(ct) === 'dat' ? 'bg-amber-500 text-slate-950 border-amber-500' : dark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'}`}>📜 Kích thước thửa đất (trừ khoảng lùi)</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className={box}>
          <label className={label}>Tỉnh / thành</label>
          <select className={input} value={ct.province || ''} onChange={e => set({ province: e.target.value })}>
            <option value="">{autoProvince ? `Tự nhận: ${autoProvince}` : '-- Chọn --'}</option>
            {PROVINCE_NAMES_2025.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className={box}>
          <label className={label}>Loại đất</label>
          <select className={input} value={ct.soilType || 'chua_biet'} onChange={e => set({ soilType: e.target.value })}>
            <option value="chua_biet">Chưa biết</option>
            <option value="tot">Đất tốt / đồi, liền thổ</option>
            <option value="yeu">Đất yếu / ao, ruộng san lấp</option>
            <option value="cat">Đất cát / pha cát</option>
          </select>
        </div>
        {dimsKindOf(ct) === 'nha' && (
        <div className={`${box} col-span-2`}>
          <label className={label}>Diện tích đất thực tế (m², không bắt buộc)</label>
          <input className={input} inputMode="decimal" placeholder="vd: 500 — để trống nếu chưa cần tính mật độ"
            value={ct.landAreaM2 ?? ''} onChange={e => set({ landAreaM2: e.target.value === '' ? undefined : e.target.value })} />
          <div className="text-[11px] text-slate-400 mt-1">Chỉ dùng để tính mật độ xây dựng. Bản vẽ và dự toán luôn theo đúng kích thước nhà anh/chị nhập; sân vườn không tính trừ khi tích ô "Sân vườn".</div>
        </div>
        )}
        {dimsKindOf(ct) === 'dat' && <>
        <div className={box}>
          <label className={label}>Lùi trước (m)</label>
          <input className={input} inputMode="decimal" placeholder={site.hasDims ? `Tự động: ${site.frontSetbackM}` : '—'}
            value={ct.frontSetbackM ?? ''} onChange={e => set({ frontSetbackM: e.target.value === '' ? undefined : e.target.value })} />
        </div>
        <div className={box}>
          <label className={label}>Lùi sau (m)</label>
          <input className={input} inputMode="decimal" placeholder={site.hasDims ? `Tự động: ${site.backSetbackM}` : '—'}
            value={ct.backSetbackM ?? ''} onChange={e => set({ backSetbackM: e.target.value === '' ? undefined : e.target.value })} />
        </div>
        <div className={box}>
          <label className={label}>Lùi bên trái (m)</label>
          <input className={input} inputMode="decimal" placeholder="0 = xây sát ranh"
            value={ct.leftSetbackM ?? ''} onChange={e => set({ leftSetbackM: e.target.value === '' ? undefined : e.target.value })} />
        </div>
        <div className={box}>
          <label className={label}>Lùi bên phải (m)</label>
          <input className={input} inputMode="decimal" placeholder="0 = xây sát ranh"
            value={ct.rightSetbackM ?? ''} onChange={e => set({ rightSetbackM: e.target.value === '' ? undefined : e.target.value })} />
        </div>
        </>}
        <div className={`${box} col-span-2`}>
          <label className={label}>Loại mái</label>
          <select className={input} value={ct.loai_mai || ''} onChange={e => set({ loai_mai: e.target.value })}>
            <option value="">Tự chọn theo loại nhà</option>
            <option value="Mái bằng BTCT">Mái bằng BTCT</option>
            <option value="Mái tôn">Mái tôn</option>
            <option value="Mái ngói kèo thép">Mái ngói kèo thép</option>
            <option value="Mái Thái/Nhật BTCT dán ngói">Mái Thái / Nhật</option>
          </select>
        </div>
      </div>
      <div className={`text-xs sm:text-sm leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
        <div>🏠 {site.note}</div>
        {site.hasDims && site.densityKnown !== false && !site.densityOk && (
          <div className="text-rose-500 font-bold">⚠️ Mật độ xây dựng vượt mức khuyến nghị — nên tăng khoảng lùi (đối chiếu quy hoạch địa phương).</div>
        )}
        <div>🧱 Móng dự kiến: <b>{nm.foundation === 'coc' ? 'Móng cọc' : nm.foundation === 'be' ? 'Móng bè' : 'Móng băng'}</b> — {nm.reason}. Mái tính: <b>{{ ton: 'tôn', ngoi: 'ngói kèo thép', btct: 'bằng BTCT', thai_nhat: 'Thái/Nhật' }[roof]}</b>.</div>
        {(ct.soilType || 'chua_biet') === 'chua_biet' && (
          <div className="text-amber-500">💡 Chưa biết loại đất: hỏi hàng xóm đã xây (có ép cọc không, cọc dài bao nhiêu) hoặc khoan khảo sát địa chất 1–2 hố trước khi chốt móng.</div>
        )}
      </div>
    </div>
  );
};

export default SiteConditionsPanel;
