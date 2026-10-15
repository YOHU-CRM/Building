import React from 'react';

/**
 * KẾT QUẢ THIẾT KẾ CỦA KHÁCH (gói Thiết kế) — đặt ở ĐẦU phần báo cáo để khách trả phí thấy ngay, không phải đi tìm:
 * ảnh phối cảnh đã tạo, nút mở 3D hình khối, mặt bằng, video (khi admin đã gắn link).
 */
export interface PerspectiveShot { url: string; style: string; view: string; at: string }

interface Props {
  theme: string;
  customerName?: string;
  shots: PerspectiveShot[];
  videoUrl?: string;
  onOpen3D: () => void;
  onOpenPlan: () => void;
  onOpenStudio: () => void;
  setZoomImage: (url: string) => void;
}

export default function CustomerResultsCard({ theme, customerName, shots, videoUrl, onOpen3D, onOpenPlan, onOpenStudio, setZoomImage }: Props) {
  const dark = theme === 'dark';
  const btn = 'px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black cursor-pointer min-h-[44px]';
  return (
    <div className={`mb-5 p-4 sm:p-5 rounded-2xl border-2 ${dark ? 'border-amber-500/40 bg-gradient-to-br from-[#1a1606] to-[#0c101d]' : 'border-amber-300 bg-gradient-to-br from-amber-50 to-white'}`}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <div className={`text-sm sm:text-lg font-black ${dark ? 'text-amber-300' : 'text-amber-800'}`}>🏠 Kết quả thiết kế của {customerName || 'anh/chị'}</div>
          <div className="text-xs text-slate-400">Gói Thiết kế — tất cả kết quả của anh/chị ở đây</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onOpen3D} className={`${btn} bg-emerald-600 text-white`}>🧊 Xem 3D nhà của tôi</button>
          <button onClick={onOpenPlan} className={`${btn} ${dark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>📐 Mặt bằng</button>
          {videoUrl && <a href={videoUrl} target="_blank" rel="noreferrer" className={`${btn} bg-purple-600 text-white`}>🎬 Xem video</a>}
        </div>
      </div>
      {shots.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {shots.slice(0, 6).map((s, i) => (
            <figure key={i} className="relative rounded-xl overflow-hidden border border-slate-500/30 cursor-zoom-in" onClick={() => setZoomImage(s.url)}>
              <img src={s.url} alt={`Phối cảnh ${i + 1}`} className="w-full aspect-[16/9] object-cover" />
              <figcaption className="absolute bottom-0 inset-x-0 px-2 py-1 bg-black/55 text-white text-[10px] sm:text-[11px]">{s.view === 'interior' ? 'Nội thất' : 'Ngoại thất'} · {s.style}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className={`p-4 rounded-xl border border-dashed text-xs sm:text-sm ${dark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'}`}>
          Chưa có ảnh phối cảnh. <button onClick={onOpenStudio} className="underline font-bold text-amber-500 cursor-pointer">Tạo ảnh phối cảnh từ 3D nhà của anh/chị</button>.
        </div>
      )}
    </div>
  );
}
