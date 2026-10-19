import React, { useState } from 'react';
import { listRoomSlots, specOf, specFilled, RoomSpec } from '../lib/roomSpecs';
import { tx, txRoom } from '../lib/i18nExtra';

/**
 * YÊU CẦU TỪNG PHÒNG — gia chủ bấm vào phòng, điền kích thước / tầng / vị trí / hướng; bấm "Xong" là đóng (đã tự lưu).
 * Phòng không điền: tool tự bố trí theo công năng + phong thủy.
 */
interface Props {
  theme: string;
  constructionInfo: any;
  setConstructionInfo: (fn: (prev: any) => any) => void;
  lang?: string;
}

const DIRS = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];

export default function RoomRequirementsPanel({ theme, constructionInfo, setConstructionInfo, lang = 'vi' }: Props) {
  const T = (v: string, vars?: Record<string, string | number>) => tx(lang, v, vars);
  const dark = theme === 'dark';
  const ct = constructionInfo || {};
  const slots = listRoomSlots(ct);
  const floors = Math.max(1, Math.round(Number(ct.floors) || 1));
  const [open, setOpen] = useState<string | null>(null);

  const update = (key: string, patch: Partial<RoomSpec> | null) => {
    setConstructionInfo((prev: any) => {
      const details = { ...((prev.rooms || {}).details || {}) };
      if (patch === null) delete details[key];
      else details[key] = { ...(details[key] || {}), ...patch };
      return { ...prev, rooms: { ...(prev.rooms || {}), details } };
    });
  };

  const summary = (s: RoomSpec, defTang: number) => {
    if (!specFilled(s) && !s.tang) return T('Tự động theo phong thủy');
    const parts: string[] = [];
    parts.push(`T${s.tang || defTang}`);
    const d = parseFloat(String(s.dai || '')), r = parseFloat(String(s.rong || ''));
    if (d > 0 && r > 0) parts.push(`${d}×${r}m (${Math.round(d * r * 10) / 10}m²)`);
    if (s.vi_tri || s.ben) parts.push(`${{ truoc: 'trước', giua: 'giữa', sau: 'sau' }[s.vi_tri || ''] || ''}${s.vi_tri && s.ben ? '–' : ''}${{ trai: 'trái', giua: 'giữa', phai: 'phải' }[s.ben || ''] || ''}`);
    if (s.huong) parts.push(lang === 'vi' ? `hướng ${s.huong}` : T(s.huong));
    return parts.join(' · ');
  };

  const chip = (active: boolean, filled: boolean) => `text-left p-2.5 rounded-xl border text-xs sm:text-sm transition cursor-pointer min-h-[52px] ${active ? 'border-amber-500 ring-2 ring-amber-500/30' : filled ? (dark ? 'border-emerald-600/60 bg-emerald-900/20' : 'border-emerald-400 bg-emerald-50') : (dark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-white')}`;
  const input = `w-full p-2 rounded-lg border text-sm font-bold ${dark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`;
  const seg = (on: boolean) => `px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${on ? 'bg-amber-500 text-slate-950 border-amber-500' : dark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'}`;

  if (!slots.length) return null;
  const filledCount = slots.filter(s => specFilled(specOf(ct, s.key))).length;

  return (
    <div className={`mt-3 p-3 rounded-2xl border ${dark ? 'border-slate-800 bg-[#121829]/40' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className={`text-xs sm:text-sm font-black ${dark ? 'text-amber-400' : 'text-amber-700'}`}>{T('📐 Yêu cầu từng phòng (không bắt buộc)')}</div>
        <div className="text-[11px] text-slate-400">{T('Đã nhập {a}/{b} phòng · phòng chưa nhập: tool tự bố trí theo phong thủy', { a: filledCount, b: slots.length })}</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {slots.map(s => {
          const sp = specOf(ct, s.key);
          return (
            <button key={s.key} type="button" onClick={() => setOpen(open === s.key ? null : s.key)} className={chip(open === s.key, specFilled(sp))}>
              <div className="font-black">{specFilled(sp) ? '✓ ' : ''}{txRoom(lang, s.label)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{summary(sp, s.defaultTang)}</div>
            </button>
          );
        })}
      </div>

      {open && (() => {
        const s = slots.find(x => x.key === open);
        if (!s) return null;
        const sp = specOf(ct, s.key);
        const d = parseFloat(String(sp.dai || '')), r = parseFloat(String(sp.rong || ''));
        return (
          <div className={`mt-3 p-3 rounded-xl border space-y-3 ${dark ? 'border-amber-500/40 bg-slate-950/60' : 'border-amber-300 bg-white'}`}>
            <div className="flex items-center justify-between">
              <b className="text-sm">{txRoom(lang, s.label)}</b>
              <span className="text-[11px] text-emerald-500">{T('Tự lưu khi nhập')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="block text-[11px] font-bold text-slate-400 mb-1">{T('Tầng')}</label>
                <select className={input} value={sp.tang || s.defaultTang} onChange={e => update(s.key, { tang: Number(e.target.value) })}>
                  {Array.from({ length: floors }, (_, i) => i + 1).map(f => <option key={f} value={f}>{T('Tầng {f}', { f })}</option>)}
                </select></div>
              <div><label className="block text-[11px] font-bold text-slate-400 mb-1">{T('Dài (m)')}</label>
                <input className={input} inputMode="decimal" placeholder={T('tự động')} value={sp.dai ?? ''} onChange={e => update(s.key, { dai: e.target.value as any })} /></div>
              <div><label className="block text-[11px] font-bold text-slate-400 mb-1">{T('Rộng (m)')}</label>
                <input className={input} inputMode="decimal" placeholder={T('tự động')} value={sp.rong ?? ''} onChange={e => update(s.key, { rong: e.target.value as any })} /></div>
            </div>
            {d > 0 && r > 0 && <div className="text-xs text-slate-400">{T('Diện tích yêu cầu:')} <b>{Math.round(d * r * 10) / 10} m²</b></div>}
            <div>
              <div className="text-[11px] font-bold text-slate-400 mb-1">{T('Vị trí trong nhà (đứng ngoài đường nhìn vào cửa chính)')}</div>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {(['truoc', 'giua', 'sau'] as const).map(v => <button key={v} type="button" className={seg(sp.vi_tri === v)} onClick={() => update(s.key, { vi_tri: sp.vi_tri === v ? undefined : v })}>{T({ truoc: 'Phía trước', giua: 'Giữa nhà', sau: 'Phía sau' }[v])}</button>)}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['trai', 'giua', 'phai'] as const).map(v => <button key={v} type="button" className={seg(sp.ben === v)} onClick={() => update(s.key, { ben: sp.ben === v ? undefined : v })}>{T({ trai: 'Bên trái', giua: 'Ở giữa', phai: 'Bên phải' }[v])}</button>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-[11px] font-bold text-slate-400 mb-1">{T('Hướng cửa sổ / hướng nhìn')}</label>
                <select className={input} value={sp.huong || ''} onChange={e => update(s.key, { huong: e.target.value || undefined })}>
                  <option value="">{T('Không yêu cầu')}</option>
                  {DIRS.map(x => <option key={x} value={x}>{T(x)}</option>)}
                </select></div>
              <div><label className="block text-[11px] font-bold text-slate-400 mb-1">{T('Ghi chú')}</label>
                <input className={input} placeholder={T('vd: có WC riêng, tủ âm tường')} value={sp.ghi_chu ?? ''} onChange={e => update(s.key, { ghi_chu: e.target.value })} /></div>
            </div>
            <div className="flex justify-between gap-2">
              <button type="button" onClick={() => { update(s.key, null); }} className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer ${dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>{T('↺ Để tool tự động')}</button>
              <button type="button" onClick={() => setOpen(null)} className="px-4 py-2 rounded-lg text-xs font-black bg-amber-500 text-slate-950 cursor-pointer">{T('✓ Xong')}</button>
            </div>
          </div>
        );
      })()}
      <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
        {lang === 'vi' ? <>Thứ tự tool làm theo: <b>ô anh/chị nhập ở đây</b> → mô tả & các ô chung → phòng không nhập do tool tự đặt theo phong thủy → ảnh tham chiếu chỉ để lấy kiểu dáng. Kích thước phòng không khớp tổng diện tích nhà thì bản vẽ ghi rõ để anh/chị chỉnh.</>
          : T('Thứ tự tool làm theo: ô anh/chị nhập ở đây → mô tả & các ô chung → phòng không nhập do tool tự đặt theo phong thủy → ảnh tham chiếu chỉ để lấy kiểu dáng. Kích thước phòng không khớp tổng diện tích nhà thì bản vẽ ghi rõ để anh/chị chỉnh.')}
      </p>
    </div>
  );
}
