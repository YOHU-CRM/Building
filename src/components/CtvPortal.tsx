import React, { useState } from 'react';

/** CỔNG CTV — CTV mở link "?ctv=portal", nhập mã CTV + mã PIN admin cấp để xem khách và hoa hồng của mình (tên khách được che). */
export default function CtvPortal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const vnd = (n: number) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
  const go = async () => {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/ctv/me', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, pin }) });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || `Lỗi ${r.status}`);
      setData(d);
    } catch (e: any) { setErr(String(e?.message || e)); } finally { setBusy(false); }
  };
  const link = data ? `${window.location.origin}/?ref=${data.ma_ctv}` : '';
  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-3" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[92vh] overflow-auto rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 p-4 sm:p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-amber-400">🤝 Cổng Cộng tác viên Yohu ConsTech</h2>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-slate-700 text-xs cursor-pointer">Đóng</button>
        </div>
        {!data ? (
          <div className="space-y-2">
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Mã CTV (vd CTV002)" className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-sm" />
            <input value={pin} onChange={e => setPin(e.target.value)} type="password" placeholder="Mã PIN (admin cấp)" className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-sm" onKeyDown={e => e.key === 'Enter' && go()} />
            <button onClick={go} disabled={busy || !code || !pin} className="w-full p-3 rounded-xl bg-amber-500 text-slate-950 font-black text-sm cursor-pointer disabled:opacity-60">{busy ? 'Đang kiểm tra…' : 'Xem khách & hoa hồng của tôi'}</button>
            {err && <div className="text-xs text-rose-400">{err}</div>}
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div><b className="font-mono text-amber-400">{data.ma_ctv}</b> {data.ten && `· ${data.ten}`} · {data.loai}</div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs break-all">Link giới thiệu của bạn: <b>{link}</b>
              <button onClick={() => navigator.clipboard?.writeText(link)} className="ml-2 underline text-sky-400 cursor-pointer">Chép</button></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-950"><div className="text-xl font-black">{data.so_khach}</div><div className="text-[11px] text-slate-400">khách giới thiệu</div></div>
              <div className="p-2 rounded-lg bg-slate-950"><div className="text-base font-black">{vnd(data.tong)}</div><div className="text-[11px] text-slate-400">tổng hoa hồng</div></div>
              <div className="p-2 rounded-lg bg-slate-950"><div className="text-base font-black text-emerald-400">{vnd(data.da_tra)}</div><div className="text-[11px] text-slate-400">đã nhận</div></div>
              <div className="p-2 rounded-lg bg-slate-950"><div className="text-base font-black text-amber-300">{vnd(data.cho_tra)}</div><div className="text-[11px] text-slate-400">đang chờ</div></div>
            </div>
            <div className="text-xs text-slate-400">Tỷ lệ hoa hồng: {Object.entries(data.rates || {}).map(([k, v]) => `${k} ${v}%`).join(' · ')}</div>
            <table className="w-full text-xs">
              <thead><tr className="text-slate-400 text-left"><th className="p-1.5">Ngày</th><th className="p-1.5">Khách</th><th className="p-1.5">Sản phẩm</th><th className="p-1.5">Hoa hồng</th><th className="p-1.5">Trạng thái</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {(data.hoa_hong || []).map((h: any, i: number) => <tr key={i}><td className="p-1.5">{h.ngay ? new Date(h.ngay).toLocaleDateString('vi-VN') : ''}</td><td className="p-1.5">{h.khach}</td><td className="p-1.5">{h.san_pham}</td><td className="p-1.5 font-bold">{vnd(h.so_tien)}</td><td className="p-1.5">{h.trang_thai}</td></tr>)}
                {!(data.hoa_hong || []).length && <tr><td colSpan={5} className="p-4 text-center text-slate-500">Chưa có hoa hồng.</td></tr>}
              </tbody>
            </table>
            <div className="text-[11px] text-slate-500">Hoa hồng chỉ ghi nhận khi khách đã thanh toán và admin xác nhận. Tên khách được che để bảo mật.</div>
          </div>
        )}
      </div>
    </div>
  );
}
