import React, { useEffect, useState } from 'react';
import { addDesignSample, getDesignSamples, DesignSample } from '../lib/designSamples';

/**
 * ADMIN — QUẢN LÝ MẪU THIẾT KẾ: tải ảnh trực tiếp (hoặc dán link ảnh / Google Drive), dán link YouTube (xem trước),
 * chọn loại phòng, phong cách, ngũ hành. Mẫu hiện ngay ở mục "Mẫu thiết kế" của khách.
 */
const ROOMS = ['Phòng khách', 'Phòng ngủ', 'Phòng bếp', 'Phòng tắm', 'Phòng thờ', 'Mặt tiền', 'Sân vườn', 'Hồ cá Koi', 'Cầu thang'];
const STYLES = ['Hiện đại', 'Tối giản', 'Tân cổ điển', 'Indochine', 'Truyền thống', 'Nhật Bản', 'Bắc Âu', 'Tropical', 'Luxury'];
const ELEMENTS = ['', 'Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];

const ytId = (s?: string) => {
  const m = String(s || '').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return m ? m[1] : (/^[\w-]{11}$/.test(String(s || '').trim()) ? String(s).trim() : '');
};
/** Google Drive "file/d/ID/view" → link ảnh hiển thị được */
const driveToImage = (u: string) => {
  const m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || u.match(/drive\.google\.com\/open\?id=([\w-]+)/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1600` : u;
};

export const AdminDesignManager: React.FC = () => {
  const empty: DesignSample = { name: '', imageUrl: '', constructionType: 'Nhà ở', roomType: 'Phòng khách', style: 'Hiện đại', element: '', areaRange: '50-100', prompt: '', videoUrl: '', referenceUrl: '' };
  const [sample, setSample] = useState<DesignSample>(empty);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [list, setList] = useState<DesignSample[]>([]);
  const reload = () => { getDesignSamples().then(d => setList(d as DesignSample[])).catch(() => {}); };
  useEffect(() => { reload(); }, []);

  const set = (p: Partial<DesignSample>) => setSample(s => ({ ...s, ...p }));
  // tải ảnh từ máy: thu nhỏ ≤ 1280px JPEG (vừa giới hạn lưu trữ 1MB/mẫu)
  const onFile = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1280 / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        let q = 0.82, url = c.toDataURL('image/jpeg', q);
        while (url.length > 900_000 && q > 0.4) { q -= 0.1; url = c.toDataURL('image/jpeg', q); }
        set({ imageUrl: url });
      };
      img.src = r.result as string;
    };
    r.readAsDataURL(f);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sample.imageUrl) { setMsg('Cần ảnh (tải lên hoặc dán link).'); return; }
    setLoading(true); setMsg('');
    try {
      const id = ytId(sample.videoUrl);
      await addDesignSample({ ...sample, imageUrl: driveToImage(sample.imageUrl), constructionType: sample.roomType || sample.constructionType, ...(id ? { youtubeId: id } as any : {}) });
      setMsg('✓ Đã thêm mẫu — khách thấy ngay ở mục Mẫu thiết kế.');
      setSample(empty);
      reload();
    } catch (err: any) {
      setMsg(`❌ Chưa lưu được: ${err?.message || err}`);
    } finally { setLoading(false); }
  };

  const inp = 'w-full p-2.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-100 text-sm';
  const id = ytId(sample.videoUrl);
  return (
    <div className="p-4 sm:p-6 rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 space-y-5">
      <div>
        <h2 className="text-lg font-black text-amber-400">🖼️ Quản lý Mẫu Thiết Kế</h2>
        <p className="text-xs text-slate-400">Mẫu hiện ở mục "Mẫu thiết kế" phía khách, lọc theo loại phòng / phong cách / ngũ hành.</p>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <input className={inp} placeholder="Tên mẫu (vd: Phòng khách hiện đại 5x20)" value={sample.name} onChange={e => set({ name: e.target.value })} required />
          <div className="grid grid-cols-3 gap-2">
            <select className={inp} value={sample.roomType} onChange={e => set({ roomType: e.target.value })}>{ROOMS.map(x => <option key={x}>{x}</option>)}</select>
            <select className={inp} value={sample.style} onChange={e => set({ style: e.target.value })}>{STYLES.map(x => <option key={x}>{x}</option>)}</select>
            <select className={inp} value={sample.element} onChange={e => set({ element: e.target.value })}>{ELEMENTS.map(x => <option key={x} value={x}>{x || 'Ngũ hành: mọi mệnh'}</option>)}</select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Ảnh mẫu — tải từ máy</label>
            <input type="file" accept="image/*" onChange={e => onFile(e.target.files?.[0])} className="text-xs" />
            <input className={`${inp} mt-2`} placeholder="…hoặc dán link ảnh / Google Drive" value={sample.imageUrl.startsWith('data:') ? '' : sample.imageUrl} onChange={e => set({ imageUrl: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Link YouTube (không bắt buộc)</label>
            <input className={inp} placeholder="https://www.youtube.com/watch?v=… hoặc youtu.be/…" value={sample.videoUrl} onChange={e => set({ videoUrl: e.target.value })} />
            {sample.videoUrl && <div className={`text-xs mt-1 ${id ? 'text-emerald-400' : 'text-rose-400'}`}>{id ? `✓ Nhận được video ${id}` : '❌ Link YouTube không đúng'}</div>}
          </div>
          <input className={inp} placeholder="Ghi chú / mô tả ngắn (hiện cho khách)" value={sample.prompt} onChange={e => set({ prompt: e.target.value })} />
          <button type="submit" disabled={loading} className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm cursor-pointer disabled:opacity-60">{loading ? 'Đang lưu…' : '＋ Thêm mẫu'}</button>
          {msg && <div className="text-xs">{msg}</div>}
        </div>
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400">Xem trước</div>
          {sample.imageUrl ? <img src={driveToImage(sample.imageUrl)} alt="xem trước" className="w-full rounded-xl border border-slate-700 object-cover max-h-60" /> : <div className="h-40 rounded-xl border border-dashed border-slate-700 flex items-center justify-center text-xs text-slate-500">Chưa có ảnh</div>}
          {id && <iframe title="YouTube" className="w-full aspect-video rounded-xl border border-slate-700" src={`https://www.youtube.com/embed/${id}`} allowFullScreen />}
        </div>
      </form>
      <div>
        <div className="text-sm font-black mb-2">Mẫu đang có ({list.length})</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {list.map((m: any) => (
            <div key={m.id} className="rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
              <img src={m.imageUrl} alt={m.name} className="w-full aspect-[4/3] object-cover" />
              <div className="p-1.5 text-[11px]"><b>{m.name}</b><div className="text-slate-400">{m.roomType || m.constructionType} · {m.style}{(m.youtubeId || m.videoUrl) ? ' · ▶ YouTube' : ''}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDesignManager;
