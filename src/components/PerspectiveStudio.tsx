import React, { useState } from 'react';

/**
 * ẢNH PHỐI CẢNH THEO YÊU CẦU GIA CHỦ
 * AI vẽ dựa trên: (1) khung hình khối 3D dựng từ chính mặt bằng (đúng số tầng, mái, cửa),
 * (2) ảnh tham chiếu gia chủ tải lên (phong cách, vật liệu, màu), (3) dữ liệu công trình.
 * Không có ảnh giả: lỗi thì báo lỗi rõ ràng.
 */
export interface PerspectiveOptions {
  view: 'exterior' | 'interior';
  style: string;
  extra: string;
  useMassing: boolean;
  useReferences: boolean;
}

interface Props {
  theme: string;
  referenceImages: string[];
  massingSnapshot: string;
  imageRendering: boolean;
  renderedConceptImage: string;
  conceptError: string;
  onGenerate: (o: PerspectiveOptions) => void;
  onOpenMassing: () => void;
  setZoomImage: (url: string) => void;
  packageTier?: 'free' | 'standard' | 'design';
}

const STYLES = ['Theo ảnh tham chiếu của gia chủ', 'Hiện đại', 'Tối giản', 'Tân cổ điển', 'Đông Dương (Indochine)', 'Nhà vườn mái ngói truyền thống', 'Nhà mái Thái'];

export default function PerspectiveStudio({ theme, referenceImages, massingSnapshot, imageRendering, renderedConceptImage, conceptError, onGenerate, onOpenMassing, setZoomImage, packageTier }: Props) {
  const dark = theme === 'dark';
  const hasRefs = referenceImages.length > 0;
  const [opt, setOpt] = useState<PerspectiveOptions>({ view: 'exterior', style: hasRefs ? STYLES[0] : 'Hiện đại', extra: '', useMassing: true, useReferences: true });
  const set = (p: Partial<PerspectiveOptions>) => setOpt(o => ({ ...o, ...p }));
  const box = `p-3 rounded-xl border ${dark ? 'bg-[#121829] border-slate-800' : 'bg-white border-slate-200'}`;
  const thumb = 'w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border border-slate-500/30 cursor-pointer';

  return (
    <div className={`mt-6 p-4 rounded-xl border space-y-3 ${dark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
      <h4 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${dark ? 'text-[#FFD700]' : 'text-slate-800'}`}>🎨 Ảnh phối cảnh theo yêu cầu gia chủ</h4>
      <p className="text-[12px] lg:text-xs text-slate-400 leading-relaxed">
        AI vẽ <b>đúng hình khối</b> lấy từ 3D (số tầng, mái, cửa) và <b>đúng phong cách</b> theo ảnh tham chiếu gia chủ tải lên. Gói Thiết kế.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={box}>
          <div className="font-black text-xs mb-2">① Khung hình khối 3D (từ mặt bằng)</div>
          {massingSnapshot ? (
            <div className="flex items-center gap-3">
              <img src={massingSnapshot} className={thumb} onClick={() => setZoomImage(massingSnapshot)} alt="3D" />
              <label className="text-xs flex items-center gap-2 font-bold"><input type="checkbox" checked={opt.useMassing} onChange={e => set({ useMassing: e.target.checked })} /> Giữ đúng hình khối này</label>
            </div>
          ) : (
            <div className="text-xs text-amber-500">
              Chưa có ảnh 3D. Mở tab <b>🧊 3D Hình Khối</b>, xoay góc đẹp, bấm <b>"Dùng làm khung ảnh phối cảnh"</b>.
              <button onClick={onOpenMassing} className="ml-2 underline font-bold cursor-pointer">Mở 3D</button>
            </div>
          )}
        </div>
        <div className={box}>
          <div className="font-black text-xs mb-2">② Ảnh tham chiếu của gia chủ ({referenceImages.length})</div>
          {hasRefs ? (
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">{referenceImages.slice(0, 3).map((u, i) => <img key={i} src={u} className={thumb} onClick={() => setZoomImage(u)} alt={`tham chiếu ${i + 1}`} />)}</div>
              <label className="text-xs flex items-center gap-2 font-bold"><input type="checkbox" checked={opt.useReferences} onChange={e => set({ useReferences: e.target.checked })} /> Vẽ theo phong cách các ảnh này (dùng 3 ảnh đầu)</label>
            </div>
          ) : (
            <div className="text-xs text-slate-400">Chưa có ảnh. Tải ảnh mẫu nhà gia chủ thích ở mục <b>Ảnh tham chiếu</b> (Bước B).</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] uppercase font-black text-slate-400 mb-1">③ Phong cách</label>
          <select value={opt.style} onChange={e => set({ style: e.target.value })} className={`w-full p-2.5 rounded-lg border text-sm font-bold ${dark ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`}>
            {STYLES.filter(s => hasRefs || s !== STYLES[0]).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] uppercase font-black text-slate-400 mb-1">Góc vẽ</label>
          <select value={opt.view} onChange={e => set({ view: e.target.value as any })} className={`w-full p-2.5 rounded-lg border text-sm font-bold ${dark ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`}>
            <option value="exterior">Ngoại thất — mặt tiền</option>
            <option value="interior">Nội thất — phòng khách</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] uppercase font-black text-slate-400 mb-1">Yêu cầu thêm (màu, vật liệu...)</label>
          <input value={opt.extra} onChange={e => set({ extra: e.target.value })} placeholder="vd: sơn trắng, ốp đá xám, cửa gỗ" className={`w-full p-2.5 rounded-lg border text-sm ${dark ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`} />
        </div>
      </div>

      <button onClick={() => onGenerate(opt)} disabled={imageRendering} className="w-full p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm min-h-[46px] cursor-pointer disabled:opacity-60">
        {imageRendering ? '⏳ AI đang vẽ (30–60 giây)…' : packageTier === 'design' ? '🎨 Tạo ảnh phối cảnh' : '🎨 Tạo ảnh phối cảnh (gói Thiết kế)'}
      </button>

      {conceptError && !imageRendering && (
        <div className="p-3 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-500 text-xs sm:text-sm">⚠️ {conceptError}</div>
      )}
      {renderedConceptImage && !imageRendering && (
        <div>
          <img src={renderedConceptImage} alt="Phối cảnh" className="w-full rounded-xl border border-slate-500/30 cursor-zoom-in" onClick={() => setZoomImage(renderedConceptImage)} />
          <p className="mt-1 text-[11px] text-slate-400">Ảnh AI minh họa ý tưởng. Hình khối bám theo 3D; chi tiết vật liệu, kích thước chính xác do kiến trúc sư chốt trong hồ sơ thiết kế.</p>
        </div>
      )}
    </div>
  );
}
