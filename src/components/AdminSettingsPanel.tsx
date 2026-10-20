import React, { useEffect, useState } from 'react';

/**
 * ADMIN — CÀI ĐẶT VẬN HÀNH (lưu trên máy chủ, áp dụng cho mọi khách).
 * Các mục liên quan tiền / quyền / chi phí mặc định TẮT; bật lên luôn hỏi xác nhận.
 */
type Settings = {
  videoOrderEnabled: boolean; videoAutoDispatch: boolean; freePreview3D: boolean;
  serverImageStorage: boolean; ctvCommissionEnabled: boolean; renderLimitPerClient: number; aiLimitPerHour: number; aiLimitPerDay: number;
  quyDoi?: Record<string, number>; donGiaKhoan?: Record<string, number>;
};
const ITEMS: { key: keyof Settings; title: string; on: string; off: string; confirmOn?: string }[] = [
  { key: 'videoOrderEnabled', title: '🎬 Mục đặt video với khách', on: 'Khách thấy & đặt được gói video', off: 'Ẩn mục video với khách' },
  { key: 'videoAutoDispatch', title: '🟣 Gửi video tự động sang Video Studio', on: 'Tự động gửi (TỐN tín dụng API)', off: 'Thủ công — admin dựng video rồi dán link (không tốn tín dụng)', confirmOn: 'Bật gửi tự động sẽ dùng tín dụng API của Video Studio cho mỗi đơn. Anh/chị chắc chắn bật?' },
  { key: 'freePreview3D', title: '🧊 Cho khách chưa mua xem thử 3D', on: 'Khách gói miễn phí / tiêu chuẩn được xoay xem 3D (không tải, không quay, không chốt)', off: 'Chỉ khách gói Thiết kế xem 3D', confirmOn: 'Bật xem thử 3D là ĐỔI QUYỀN: khách chưa trả phí xem được hình khối nhà của mình. Anh/chị chắc chắn bật?' },
  { key: 'serverImageStorage', title: '☁️ Lưu ảnh phối cảnh trên máy chủ', on: 'Ảnh lưu Firebase Storage — khách đổi máy vẫn còn, admin xem được', off: 'Ảnh chỉ lưu trên máy của khách', confirmOn: 'Lưu ảnh lên Firebase Storage: miễn phí 5GB đầu, dùng nhiều hơn Google tính phí theo dung lượng. Anh/chị chắc chắn bật?' },
  { key: 'ctvCommissionEnabled', title: '💰 Ghi sổ hoa hồng CTV trên máy chủ', on: 'Admin kích hoạt gói có số tiền / đơn video hoàn thành → máy chủ ghi 1 dòng hoa hồng "Chờ duyệt"', off: 'Không ghi sổ (giữ cách cũ)', confirmOn: 'Bật ghi sổ hoa hồng: máy chủ tự tính tiền hoa hồng theo % từng CTV (CHỈ GHI SỔ, không chuyển tiền). Anh/chị đã kiểm tra % ở tab CTV và chắc chắn bật?' }
];

export default function AdminSettingsPanel() {
  const [st, setSt] = useState<Settings | null>(null);
  const [status, setStatus] = useState<{ firestore: boolean; storageBucket: string | null; gas: boolean } | null>(null);
  const [msg, setMsg] = useState('');
  const [cid, setCid] = useState('');
  const [limit, setLimit] = useState('');
  const [aiH, setAiH] = useState('');
  const [aiD, setAiD] = useState('');
  const [qd, setQd] = useState<Record<string, string>>({});
  const [dgk, setDgk] = useState<Record<string, string>>({});
  const code = () => { try { return sessionStorage.getItem('yohu_admin_code') || ''; } catch { return ''; } };
  const load = () => fetch('/api/admin/settings', { headers: { 'x-admin-code': code() } }).then(r => r.json()).then(d => {
    if (d?.settings) { setSt(d.settings); setLimit(String(d.settings.renderLimitPerClient ?? 15)); setAiH(String(d.settings.aiLimitPerHour ?? 40)); setAiD(String(d.settings.aiLimitPerDay ?? 150)); setQd(Object.fromEntries(Object.entries(d.settings.quyDoi || {}).map(([k, v]) => [k, String(v)]))); setDgk(Object.fromEntries(Object.entries(d.settings.donGiaKhoan || {}).map(([k, v]) => [k, String(v)]))); }
    if (d?.status) setStatus(d.status);
    if (!d?.ok) setMsg(d?.error || 'Không đọc được cài đặt (mã admin?)');
  }).catch(e => setMsg(String(e)));
  useEffect(() => { load(); }, []);

  const save = async (patch: Partial<Settings>) => {
    setMsg('Đang lưu…');
    try {
      const r = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-code': code() }, body: JSON.stringify(patch) });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || `Lỗi ${r.status}`);
      setSt(d.settings);
      setMsg(d.persisted ? '✓ Đã lưu trên máy chủ' : `✓ Đã áp dụng. ${d.note || ''}`);
    } catch (e: any) { setMsg('❌ ' + (e?.message || e)); }
  };
  const flip = (it: typeof ITEMS[number]) => {
    if (!st) return;
    const next = !st[it.key];
    if (next && it.confirmOn && !window.confirm(it.confirmOn)) return;
    save({ [it.key]: next } as any);
  };
  const resetQuota = async () => {
    if (!cid.trim()) return;
    if (!window.confirm(`Đặt lại lượt vẽ ảnh AI về 0 cho khách ${cid.trim()}? (khách được vẽ thêm, tốn tín dụng API)`)) return;
    const r = await fetch('/api/admin/render-usage', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-code': code() }, body: JSON.stringify({ clientId: cid.trim(), reset: true }) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? `✓ Khách ${cid.trim()}: đã dùng ${d.before} lượt → đặt lại 0 (giới hạn ${d.limit})` : '❌ ' + (d.error || r.status));
  };

  const card = 'p-4 rounded-xl border border-slate-700 bg-slate-950/60';
  return (
    <div className="space-y-4 text-slate-100">
      <div>
        <h2 className="text-lg font-black text-amber-400">⚙️ Cài đặt vận hành</h2>
        <p className="text-xs text-slate-400">Áp dụng cho mọi khách ngay lập tức. Mục liên quan tiền, quyền, chi phí mặc định TẮT và luôn hỏi xác nhận khi bật.</p>
      </div>
      {status && (
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className={`px-2 py-1 rounded ${status.firestore ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>{status.firestore ? '✓ Firestore đã kết nối' : '✗ Chưa có Firestore — cài đặt mất khi máy chủ khởi động lại'}</span>
          <span className={`px-2 py-1 rounded ${status.storageBucket ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>{status.storageBucket ? `✓ Storage: ${status.storageBucket}` : '✗ Chưa có Firebase Storage (cần cho "Lưu ảnh trên máy chủ")'}</span>
          <span className={`px-2 py-1 rounded ${status.gas ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>{status.gas ? '✓ Google Sheet đã nối' : '✗ Chưa nối Google Sheet'}</span>
        </div>
      )}
      {!st ? <div className="text-sm text-slate-400">{msg || 'Đang tải…'}</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ITEMS.map(it => (
            <div key={it.key} className={card}>
              <div className="flex items-center justify-between gap-3">
                <div className="font-black text-sm">{it.title}</div>
                <button onClick={() => flip(it)} className={`relative w-14 h-7 rounded-full transition cursor-pointer shrink-0 ${st[it.key] ? 'bg-emerald-500' : 'bg-slate-600'}`} aria-label={it.title}>
                  <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all ${st[it.key] ? 'left-7' : 'left-0.5'}`} />
                </button>
              </div>
              <div className={`mt-1 text-xs ${st[it.key] ? 'text-emerald-300' : 'text-slate-400'}`}>{st[it.key] ? 'BẬT: ' + it.on : 'TẮT: ' + it.off}</div>
              {it.key === 'serverImageStorage' && st.serverImageStorage && status && !status.storageBucket && <div className="mt-1 text-[11px] text-amber-300">Đang bật nhưng chưa có Storage → ảnh vẫn lưu trên máy khách. Xem hướng dẫn bật Storage.</div>}
            </div>
          ))}
          <div className={card}>
            <div className="font-black text-sm">📐 Hệ số diện tích quy đổi (%) — cách tính giá theo m² quy đổi</div>
            <div className="text-xs text-slate-400 mb-2">Chỉ đổi cách thể hiện "đơn giá / m² quy đổi" để khách so với báo giá nhà thầu khác. Tổng dự toán bóc tách khối lượng KHÔNG đổi. Sàn mỗi tầng luôn tính 100%.</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {([['mong_bang', 'Móng băng'], ['mong_coc', 'Móng cọc'], ['mong_be', 'Móng bè'], ['mai_ton', 'Mái tôn'], ['mai_btct', 'Mái bằng BTCT'], ['mai_ngoi', 'Mái ngói kèo thép'], ['mai_thai', 'Mái Thái / Nhật'], ['hien', 'Hiên có mái, ban công']] as const).map(([k, label]) => (
                <label key={k} className="flex flex-col gap-1"><span>{label}</span>
                  <input type="number" min={0} max={300} value={qd[k] ?? ''} onChange={e => setQd({ ...qd, [k]: e.target.value })} className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
                </label>
              ))}
            </div>
            <button onClick={() => save({ quyDoi: Object.fromEntries(Object.entries(qd).map(([k, v]) => [k, Number(v)])) } as any)} className="mt-2 px-3 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-black cursor-pointer">Lưu hệ số</button>
          </div>
          <div className={card}>
            <div className="font-black text-sm">🏷️ Đơn giá KHOÁN theo m² xây dựng (cách 3)</div>
            <div className="text-xs text-slate-400 mb-2">Giá khoán gọn của công ty, đ/m² xây dựng (phần nhà chiếm đất). Tool CHỈ áp cho nhà 1 tầng, móng băng nền thường; nhà nhiều tầng, móng cọc / bè không áp (dễ lỗ). Để 0 = chưa đặt (tool tạm suy từ bóc tách).</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {([['tiet_kiem', 'Gói tiết kiệm'], ['tieu_chuan', 'Gói tiêu chuẩn'], ['cao_cap', 'Gói cao cấp']] as const).map(([k, label]) => (
                <label key={k} className="flex flex-col gap-1"><span>{label} (đ/m²)</span>
                  <input type="number" min={0} step={50000} value={dgk[k] ?? ''} onChange={e => setDgk({ ...dgk, [k]: e.target.value })} placeholder="vd 6500000" className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
                </label>
              ))}
            </div>
            <button onClick={() => { if (!window.confirm('Đổi đơn giá khoán sẽ đổi số tiền "Cách 3" khách nhìn thấy trên báo cáo, PDF và Google Sheet. Anh/chị chắc chắn lưu?')) return; save({ donGiaKhoan: Object.fromEntries(Object.entries(dgk).map(([k, v]) => [k, Number(v) || 0])) } as any); }} className="mt-2 px-3 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-black cursor-pointer">Lưu đơn giá khoán</button>
          </div>
          <div className={card}>
            <div className="font-black text-sm">🛡️ Giới hạn gọi AI (chống tốn tín dụng)</div>
            <div className="text-xs text-slate-400 mb-2">Áp dụng cho phân tích phong thủy, công trình, hỏi đáp, đọc bản vẽ, thuyết minh, ảnh — tính theo từng máy (IP). Admin không bị giới hạn. Đặt 0 = không giới hạn.</div>
            <div className="flex gap-2 items-center flex-wrap text-xs">
              <span>Mỗi giờ</span><input type="number" min={0} max={500} value={aiH} onChange={e => setAiH(e.target.value)} className="w-20 p-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
              <span>Mỗi ngày</span><input type="number" min={0} max={500} value={aiD} onChange={e => setAiD(e.target.value)} className="w-20 p-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
              <button onClick={() => save({ aiLimitPerHour: Number(aiH) || 0, aiLimitPerDay: Number(aiD) || 0 })} className="px-3 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-black cursor-pointer">Lưu</button>
            </div>
          </div>
          <div className={card}>
            <div className="font-black text-sm">🎨 Số lượt AI vẽ ảnh tối đa / khách</div>
            <div className="text-xs text-slate-400 mb-2">Bộ đầy đủ ≈ 3 phương án + 5 ảnh + 2 lần vẽ lại = 10 lượt. Đặt 0 = không giới hạn.</div>
            <div className="flex gap-2">
              <input type="number" min={0} max={500} value={limit} onChange={e => setLimit(e.target.value)} className="w-24 p-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
              <button onClick={() => save({ renderLimitPerClient: Number(limit) || 0 })} className="px-3 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-black cursor-pointer">Lưu</button>
            </div>
            <div className="mt-3 text-xs text-slate-400">Mở thêm lượt cho 1 khách (mã khách xem ở CRM):</div>
            <div className="flex gap-2 mt-1">
              <input value={cid} onChange={e => setCid(e.target.value)} placeholder="Mã khách" className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-sm" />
              <button onClick={resetQuota} className="px-3 py-2 rounded-lg bg-slate-700 text-white text-xs font-black cursor-pointer">Đặt lại 0</button>
            </div>
          </div>
        </div>
      )}
      {msg && <div className="text-xs">{msg}</div>}
    </div>
  );
}
