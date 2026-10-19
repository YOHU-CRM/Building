import React, { useEffect, useState } from 'react';
import type { MassingShot } from './Massing3DViewer';
import { tx, txRoom } from '../lib/i18nExtra';

/**
 * BỘ ẢNH PHỐI CẢNH NHẤT QUÁN — 3 bước:
 *   ① Chốt hình khối (5 góc chụp từ 3D, đúng số tầng / mái / cửa)
 *   ② AI vẽ 3 phương án phong cách từ CÙNG 1 góc → gia chủ bấm "Chốt phong cách"
 *   ③ AI vẽ bộ 4–6 ảnh (các góc ngoại thất + nội thất) theo đúng phong cách đã chốt (ảnh đã chốt làm mẫu vật liệu, màu)
 * Mỗi bộ được vẽ lại tối đa 2 lần. Máy chủ giới hạn tổng số lượt vẽ / khách để không tốn tín dụng API.
 * Không có ảnh giả: lỗi thì báo lỗi rõ ràng.
 */
export interface PerspectiveOptions {
  view: 'exterior' | 'interior';
  style: string;
  extra: string;
  useMassing: boolean;
  useReferences: boolean;
}

export interface RenderRequest {
  view: 'exterior' | 'interior';
  style: string;
  extra: string;
  massingImage?: string;       // data URL khung 3D góc này
  styleImage?: string;         // ảnh phong cách đã chốt (giữ vật liệu, màu)
  useReferences: boolean;
  shotLabel: string;
  roomBrief?: string;          // nội thất: tên phòng, kích thước
}
export interface RenderResult { url: string; quota?: { used: number; limit: number } }
export interface StudioShot { key: string; label: string; url: string; style: string; view: 'exterior' | 'interior' }
export interface InteriorRoom { key: string; label: string; brief: string }

interface StudioState {
  candidates: StudioShot[];
  locked: StudioShot | null;
  set: StudioShot[];
  redoLeft: number;
}

interface Props {
  theme: string;
  referenceImages: string[];
  massingShots: MassingShot[];
  interiorRooms: InteriorRoom[];
  storageKey: string;
  packageTier?: 'free' | 'standard' | 'design';
  requestImage: (r: RenderRequest) => Promise<RenderResult>;
  onShot: (s: StudioShot) => void;
  onOpenMassing: () => void;
  setZoomImage: (url: string) => void;
  lang?: string;
}

const STYLES = ['Theo ảnh tham chiếu của gia chủ', 'Hiện đại', 'Tối giản', 'Tân cổ điển', 'Đông Dương (Indochine)', 'Nhà vườn mái ngói truyền thống', 'Nhà mái Thái', 'Nhiệt đới (Tropical)'];
const MAX_REDO = 2;
const EMPTY: StudioState = { candidates: [], locked: null, set: [], redoLeft: MAX_REDO };

export default function PerspectiveStudio({ theme, referenceImages, massingShots, interiorRooms, storageKey, packageTier, requestImage, onShot, onOpenMassing, setZoomImage, lang = 'vi' }: Props) {
  const T = (v: string, vars?: Record<string, string | number>) => tx(lang, v, vars);
  const dark = theme === 'dark';
  const hasRefs = referenceImages.length > 0;
  const [st, setSt] = useState<StudioState>(EMPTY);
  const [styles, setStyles] = useState<string[]>(hasRefs ? [STYLES[0], 'Hiện đại', 'Đông Dương (Indochine)'] : ['Hiện đại', 'Tân cổ điển', 'Nhà vườn mái ngói truyền thống']);
  const [extra, setExtra] = useState('');
  const [useRefs, setUseRefs] = useState(true);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [quota, setQuota] = useState<{ used: number; limit: number } | null>(null);
  const exteriorKeys = massingShots.map(s => s.key).filter(k => k !== 'corner_l');
  const [pick, setPick] = useState<string[]>([]);

  // tải / lưu tiến độ theo từng khách
  useEffect(() => {
    try { const raw = localStorage.getItem(storageKey); setSt(raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY); } catch { setSt(EMPTY); }
  }, [storageKey]);
  const save = (next: StudioState) => { setSt(next); try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* đầy bộ nhớ: giữ trong phiên */ } };
  useEffect(() => { setPick([...exteriorKeys.filter(k => k !== 'aerial'), ...interiorRooms.slice(0, 2).map(r => 'in_' + r.key)]); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [massingShots.length, interiorRooms.length]);

  const shot = (k: string) => massingShots.find(s => s.key === k);
  const base = shot('corner_l') || massingShots[0];
  const run = async (r: RenderRequest): Promise<string | null> => {
    try {
      const res = await requestImage(r);
      if (res.quota) setQuota(res.quota);
      return res.url;
    } catch (e: any) {
      setErr(String(e?.message || e));
      return null;
    }
  };

  /* ② 3 phương án phong cách từ cùng 1 góc */
  const genStyles = async () => {
    setErr('');
    const out: StudioShot[] = [];
    for (let i = 0; i < styles.length; i++) {
      setBusy(`Đang vẽ phương án ${i + 1}/${styles.length} (${styles[i]})…`);
      const url = await run({ view: 'exterior', style: styles[i], extra, massingImage: base?.url, useReferences: useRefs, shotLabel: base?.label || 'Góc chéo' });
      if (!url) break;
      const s: StudioShot = { key: `cand_${i}`, label: `Phương án ${i + 1}`, url, style: styles[i], view: 'exterior' };
      out.push(s); onShot(s);
      save({ ...st, candidates: [...out] });
    }
    setBusy('');
  };

  /* ③ bộ ảnh theo phong cách đã chốt */
  const one = async (key: string): Promise<StudioShot | null> => {
    const locked = st.locked!;
    if (key.startsWith('in_')) {
      const room = interiorRooms.find(r => 'in_' + r.key === key);
      if (!room) return null;
      const url = await run({ view: 'interior', style: locked.style, extra, styleImage: locked.url, useReferences: useRefs, shotLabel: room.label, roomBrief: room.brief });
      return url ? { key, label: `Nội thất ${room.label}`, url, style: locked.style, view: 'interior' } : null;
    }
    const m = shot(key);
    if (!m) return null;
    const url = await run({ view: 'exterior', style: locked.style, extra, massingImage: m.url, styleImage: locked.url, useReferences: useRefs, shotLabel: m.label });
    return url ? { key, label: m.label, url, style: locked.style, view: 'exterior' } : null;
  };
  const genSet = async () => {
    setErr('');
    let set = [...st.set];
    for (let i = 0; i < pick.length; i++) {
      if (set.some(s => s.key === pick[i])) continue;
      setBusy(`Đang vẽ ảnh ${i + 1}/${pick.length}…`);
      const s = await one(pick[i]);
      if (!s) break;
      set = [...set, s]; onShot(s);
      save({ ...st, set });
    }
    setBusy('');
  };
  const redo = async (key: string) => {
    if (st.redoLeft <= 0) return;
    setErr(''); setBusy('Đang vẽ lại…');
    const s = await one(key);
    if (s) { onShot(s); save({ ...st, set: st.set.map(x => x.key === key ? s : x), redoLeft: st.redoLeft - 1 }); }
    setBusy('');
  };

  const box = `p-3 rounded-xl border ${dark ? 'bg-[#121829] border-slate-800' : 'bg-white border-slate-200'}`;
  const inp = `w-full p-2.5 rounded-lg border text-sm ${dark ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`;
  const big = 'w-full p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm min-h-[46px] cursor-pointer disabled:opacity-60';
  const step = (n: string, t: string, done: boolean) => <div className="font-black text-xs sm:text-sm mb-2 flex items-center gap-2"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${done ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950'}`}>{done ? '✓' : n}</span>{t}</div>;
  const toggle = (arr: string[], v: string, max = 99) => arr.includes(v) ? arr.filter(x => x !== v) : arr.length >= max ? arr : [...arr, v];
  const locked = st.locked;

  return (
    <div id="yohu-perspective" className={`mt-6 p-4 rounded-xl border space-y-3 ${dark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${dark ? 'text-[#FFD700]' : 'text-slate-800'}`}>{T('🎨 Bộ ảnh phối cảnh theo yêu cầu gia chủ')}</h4>
        {quota && <span className="text-[11px] text-slate-400">{T('Đã dùng {a}/{b} lượt vẽ AI', { a: quota.used, b: quota.limit })}</span>}
      </div>
      <p className="text-[12px] lg:text-xs text-slate-400 leading-relaxed">
        {lang === 'vi' ? <>Hình khối lấy đúng từ 3D (số tầng, mái, cửa). Gia chủ chọn 1 phong cách, tool vẽ cả bộ ảnh <b>cùng màu, cùng vật liệu</b> từ nhiều góc. {packageTier === 'design' ? '' : 'Gói Thiết kế.'}</> : T('Hình khối lấy đúng từ 3D (số tầng, mái, cửa). Gia chủ chọn 1 phong cách, tool vẽ cả bộ ảnh cùng màu, cùng vật liệu từ nhiều góc.')}
      </p>

      {/* ① hình khối */}
      <div className={box}>
        {step('1', T('Chốt hình khối 3D'), massingShots.length > 0)}
        {massingShots.length ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {massingShots.map(s => (
              <figure key={s.key} className="shrink-0 w-28 sm:w-32 cursor-zoom-in" onClick={() => setZoomImage(s.url)}>
                <img src={s.url} alt={s.label} className="w-full aspect-video object-cover rounded-lg border border-slate-500/30" />
                <figcaption className="text-[10px] text-slate-400 mt-0.5">{T(s.label)}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="text-xs text-amber-500">
            Mở tab <b>🧊 3D Hình Khối</b>, kiểm tra nhà đúng ý rồi bấm <b>"✅ Chốt hình khối (5 góc)"</b>.
            <button onClick={onOpenMassing} className="ml-2 underline font-bold cursor-pointer">{T('Mở 3D')}</button>
          </div>
        )}
      </div>

      {/* ② phong cách */}
      <div className={`${box} ${massingShots.length ? '' : 'opacity-50 pointer-events-none'}`}>
        {step('2', T('Chọn phong cách — AI vẽ 3 phương án cùng 1 góc'), !!locked)}
        {locked ? (
          <div className="flex items-center gap-3 flex-wrap">
            <img src={locked.url} alt="phong cách đã chốt" className="w-36 aspect-video object-cover rounded-lg border-2 border-emerald-500 cursor-zoom-in" onClick={() => setZoomImage(locked.url)} />
            <div className="text-xs"><div className="font-black text-emerald-500">{T('✓ Đã chốt: {s}', { s: locked.style })}</div>
              <button onClick={() => save({ ...st, locked: null, set: [], redoLeft: MAX_REDO })} className="mt-1 underline text-slate-400 cursor-pointer">{T('Đổi phong cách (vẽ lại bộ ảnh)')}</button></div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {STYLES.filter(x => hasRefs || x !== STYLES[0]).map(x => (
                <button key={x} onClick={() => setStyles(a => toggle(a, x, 3))} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border ${styles.includes(x) ? 'bg-amber-500 text-slate-950 border-amber-500' : dark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'}`}>{styles.includes(x) ? '✓ ' : ''}{x}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input value={extra} onChange={e => setExtra(e.target.value)} placeholder={T('Yêu cầu thêm: sơn trắng, ốp đá xám, cửa gỗ…')} className={inp} />
              {hasRefs && <label className="text-xs flex items-center gap-2 font-bold"><input type="checkbox" checked={useRefs} onChange={e => setUseRefs(e.target.checked)} /> {T('Bám theo {n} ảnh tham chiếu của gia chủ', { n: Math.min(3, referenceImages.length) })}</label>}
            </div>
            <button onClick={genStyles} disabled={!!busy || !styles.length} className={big}>{busy || T('🎨 Vẽ {n} phương án phong cách', { n: styles.length })}</button>
            {st.candidates.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {st.candidates.map(c => (
                  <div key={c.key} className="rounded-xl overflow-hidden border border-slate-500/30">
                    <img src={c.url} alt={c.style} className="w-full aspect-video object-cover cursor-zoom-in" onClick={() => setZoomImage(c.url)} />
                    <div className="p-2 flex items-center justify-between gap-2"><span className="text-[11px] font-bold">{c.style}</span>
                      <button onClick={() => save({ ...st, locked: c, set: [], redoLeft: MAX_REDO })} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black cursor-pointer">{T('✓ Chốt phong cách này')}</button></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ③ bộ ảnh */}
      <div className={`${box} ${locked ? '' : 'opacity-50 pointer-events-none'}`}>
        {step('3', T('Bộ ảnh hoàn chỉnh theo phong cách đã chốt'), st.set.length > 0 && pick.every(k => st.set.some(s => s.key === k)))}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {exteriorKeys.map(k => <button key={k} onClick={() => setPick(a => toggle(a, k))} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border ${pick.includes(k) ? 'bg-sky-600 text-white border-sky-600' : dark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'}`}>{pick.includes(k) ? '✓ ' : ''}{T(shot(k)?.label || '')}</button>)}
          {interiorRooms.map(r => <button key={r.key} onClick={() => setPick(a => toggle(a, 'in_' + r.key))} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border ${pick.includes('in_' + r.key) ? 'bg-violet-600 text-white border-violet-600' : dark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-700'}`}>{pick.includes('in_' + r.key) ? '✓ ' : ''}{T('Nội thất {r}', { r: txRoom(lang, r.label) })}</button>)}
        </div>
        <button onClick={genSet} disabled={!!busy || !pick.length} className={big}>{busy || T('🖼️ Vẽ bộ {n} ảnh còn thiếu', { n: pick.filter(k => !st.set.some(s => s.key === k)).length })}</button>
        {st.set.length > 0 && (
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {st.set.map(s => (
              <div key={s.key} className="rounded-xl overflow-hidden border border-slate-500/30">
                <img src={s.url} alt={s.label} className="w-full aspect-video object-cover cursor-zoom-in" onClick={() => setZoomImage(s.url)} />
                <div className="p-1.5 flex items-center justify-between gap-1"><span className="text-[11px] font-bold">{s.label}</span>
                  <button onClick={() => redo(s.key)} disabled={!!busy || st.redoLeft <= 0} className="text-[11px] underline cursor-pointer disabled:opacity-40">{T('↻ Vẽ lại')}</button></div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-1 text-[11px] text-slate-400">{T('Còn {a}/{b} lần vẽ lại cho bộ ảnh này.', { a: st.redoLeft, b: MAX_REDO })}</div>
      </div>

      {err && !busy && <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-500 text-xs sm:text-sm">⚠️ {err}</div>}
      <p className="text-[11px] text-slate-400">{T('Ảnh AI minh họa ý tưởng. Hình khối bám theo 3D; chi tiết vật liệu, kích thước chính xác do kiến trúc sư chốt trong hồ sơ thiết kế.')}</p>
    </div>
  );
}
