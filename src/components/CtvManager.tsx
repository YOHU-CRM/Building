import React, { useEffect, useMemo, useState } from 'react';

/**
 * ADMIN — CTV / B2B (dữ liệu trên máy chủ, không còn lưu riêng từng trình duyệt)
 *   tab "partners": danh sách CTV, % hoa hồng theo từng sản phẩm, mã PIN cổng CTV, link giới thiệu
 *   tab "ledger"  : sổ hoa hồng — duyệt / đánh dấu đã thanh toán (chỉ ghi sổ, không chuyển tiền)
 */
const PRODUCTS: { key: string; label: string }[] = [
  { key: 'standard', label: 'Báo cáo đầy đủ' }, { key: 'design', label: 'Báo cáo + Bản vẽ' },
  { key: 'VID-TEASER', label: 'Video Teaser' }, { key: 'VID-01', label: 'Video Tiêu chuẩn' }, { key: 'VID-02', label: 'Video Nâng cao' }, { key: 'VID-03', label: 'Video Cinematic' }
];
const TYPES = ['CTV Thường', 'B2B Đối Tác', 'B2B VIP'];
const STATUSES = ['Chờ duyệt', 'Cần duyệt thủ công', 'Đã duyệt', 'Đã thanh toán', 'Hủy'];
const vnd = (n: number) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';

export default function CtvManager({ tab, ledgerOn }: { tab: 'partners' | 'ledger'; ledgerOn: boolean }) {
  const code = () => { try { return sessionStorage.getItem('yohu_admin_code') || ''; } catch { return ''; } };
  const H = () => ({ 'Content-Type': 'application/json', 'x-admin-code': code() });
  const [partners, setPartners] = useState<any[]>([]);
  const [coms, setComs] = useState<any[]>([]);
  const [edit, setEdit] = useState<Record<string, any>>({});
  const [msg, setMsg] = useState('');
  const [nw, setNw] = useState({ ma_ctv: '', ten: '', sdt: '', loai_doi_tac: 'CTV Thường' });
  const [filter, setFilter] = useState('');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const load = () => {
    fetch('/api/ctv-partners', { headers: H() }).then(r => r.json()).then(d => Array.isArray(d) ? setPartners(d) : setMsg(d?.error || 'Không tải được CTV')).catch(e => setMsg(String(e)));
    fetch('/api/commissions', { headers: H() }).then(r => r.json()).then(d => Array.isArray(d) && setComs(d)).catch(() => {});
  };
  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePartner = async (p: any) => {
    setMsg('Đang lưu…');
    const r = await fetch('/api/ctv-partners', { method: 'POST', headers: H(), body: JSON.stringify(p) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg('❌ ' + (d.error || r.status)); return false; }
    setMsg(`✓ Đã lưu ${d.partner?.ma_ctv}`); load(); return true;
  };
  const addPartner = async () => {
    if (!nw.ma_ctv.trim()) return;
    if (partners.some(p => p.ma_ctv === nw.ma_ctv.trim().toUpperCase())) { setMsg('Mã này đã có'); return; }
    if (await savePartner(nw)) setNw({ ma_ctv: '', ten: '', sdt: '', loai_doi_tac: 'CTV Thường' });
  };
  const setStatus = async (c: any, status: string) => {
    if (status === 'Đã thanh toán' && !window.confirm(`Xác nhận ĐÃ CHUYỂN ${vnd(c.amount)} hoa hồng cho ${c.ma_ctv || c.refCode}? (tool chỉ ghi sổ, anh/chị tự chuyển tiền)`)) return;
    if (status === 'Hủy' && !window.confirm('Hủy dòng hoa hồng này?')) return;
    const r = await fetch('/api/commissions', { method: 'POST', headers: H(), body: JSON.stringify({ id: c.id, status }) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? `✓ ${c.id}: ${status}` : '❌ ' + (d.error || r.status)); load();
  };
  const setAmount = async (c: any) => {
    const v = window.prompt(`Sửa số tiền hoa hồng cho ${c.id} (đồng):`, String(c.amount || 0));
    if (v === null) return;
    await fetch('/api/commissions', { method: 'POST', headers: H(), body: JSON.stringify({ id: c.id, amount: Number(v.replace(/\D/g, '')) || 0, note: (c.note ? c.note + ' · ' : '') + 'admin sửa số tiền' }) });
    load();
  };
  const totals = useMemo(() => {
    const m: Record<string, { tong: number; da: number; cho: number; n: number }> = {};
    coms.filter(c => c.status !== 'Hủy').forEach(c => {
      const k = c.ma_ctv || c.refCode; const t = m[k] || (m[k] = { tong: 0, da: 0, cho: 0, n: 0 });
      t.tong += c.amount || 0; t.n++; if (c.status === 'Đã thanh toán') t.da += c.amount || 0; else t.cho += c.amount || 0;
    });
    return m;
  }, [coms]);

  const inp = 'p-1.5 rounded bg-slate-900 border border-slate-700 text-xs';
  const off = !ledgerOn && <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs">Ghi sổ hoa hồng trên máy chủ đang <b>TẮT</b>. Đặt % xong, bật ở tab <b>⚙️ Cài đặt</b>. Khi bật: admin kích hoạt gói có số tiền hoặc đơn video "Hoàn thành" → máy chủ ghi 1 dòng hoa hồng "Chờ duyệt".</div>;

  if (tab === 'ledger') {
    const list = coms.filter(c => !filter || (c.ma_ctv || c.refCode) === filter);
    return (
      <div className="space-y-3 text-slate-100">
        {off}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-400">Lọc CTV:</span>
          <select value={filter} onChange={e => setFilter(e.target.value)} className={inp}><option value="">Tất cả</option>{Object.keys(totals).map(k => <option key={k}>{k}</option>)}</select>
          <button onClick={load} className="px-2.5 py-1.5 rounded bg-slate-700 text-xs cursor-pointer">↻ Tải lại</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.entries(totals) as [string, { tong: number; da: number; cho: number; n: number }][]).map(([k, t]) => (
            <div key={k} className="p-2.5 rounded-lg border border-slate-700 bg-slate-950/60 text-xs"><b className="text-amber-400 font-mono">{k}</b> · {t.n} đơn<div>Tổng {vnd(t.tong)}</div><div className="text-emerald-400">Đã trả {vnd(t.da)}</div><div className="text-rose-300">Còn nợ {vnd(t.cho)}</div></div>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead><tr className="bg-slate-900 text-slate-400"><th className="p-2">Ngày</th><th className="p-2">CTV</th><th className="p-2">Khách</th><th className="p-2">Sản phẩm</th><th className="p-2">Doanh thu</th><th className="p-2">%</th><th className="p-2">Hoa hồng</th><th className="p-2">Trạng thái</th></tr></thead>
            <tbody className="divide-y divide-slate-800">
              {list.map(c => (
                <tr key={c.id}>
                  <td className="p-2 whitespace-nowrap">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : ''}</td>
                  <td className="p-2 font-mono text-amber-400">{c.ma_ctv || c.refCode}<div className="text-[10px] text-slate-500">{c.loai_doi_tac}</div></td>
                  <td className="p-2">{c.customerName || c.clientId}<div className="text-[10px] text-slate-500">{c.customerPhone}</div></td>
                  <td className="p-2">{c.productLabel || c.packageId}</td>
                  <td className="p-2">{c.revenue ? vnd(c.revenue) : '—'}</td>
                  <td className="p-2">{c.rate ?? '—'}</td>
                  <td className="p-2 font-bold text-emerald-400 cursor-pointer underline decoration-dotted" title="Bấm để sửa số tiền" onClick={() => setAmount(c)}>{vnd(c.amount)}</td>
                  <td className="p-2"><select value={c.status} onChange={e => setStatus(c, e.target.value)} className={inp}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>{c.note && <div className="text-[10px] text-slate-500 mt-0.5 max-w-[180px]">{c.note}</div>}</td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={8} className="p-6 text-center text-slate-500">Chưa có hoa hồng phát sinh trên máy chủ.</td></tr>}
            </tbody>
          </table>
        </div>
        {msg && <div className="text-xs">{msg}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-3 text-slate-100">
      {off}
      <div className="p-3 rounded-xl border border-slate-700 bg-slate-950/60">
        <div className="text-sm font-black mb-2">＋ Thêm CTV / đối tác</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <input className={inp} placeholder="Mã (vd CTV002)" value={nw.ma_ctv} onChange={e => setNw({ ...nw, ma_ctv: e.target.value.toUpperCase() })} />
          <input className={inp} placeholder="Họ tên" value={nw.ten} onChange={e => setNw({ ...nw, ten: e.target.value })} />
          <input className={inp} placeholder="Số điện thoại" value={nw.sdt} onChange={e => setNw({ ...nw, sdt: e.target.value })} />
          <select className={inp} value={nw.loai_doi_tac} onChange={e => setNw({ ...nw, loai_doi_tac: e.target.value })}>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
          <button onClick={addPartner} className="px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-black cursor-pointer">Thêm</button>
        </div>
        <div className="mt-2 text-[11px] text-slate-400">Cổng tự xem cho CTV: <span className="font-mono text-slate-200">{origin}/?ctv=portal</span> (CTV nhập mã + PIN anh cấp).</div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead><tr className="bg-slate-900 text-slate-400"><th className="p-2">Mã / Tên</th><th className="p-2">Loại</th>{PRODUCTS.map(p => <th key={p.key} className="p-2 whitespace-nowrap">% {p.label}</th>)}<th className="p-2">PIN cổng CTV</th><th className="p-2">Hoa hồng</th><th className="p-2"></th></tr></thead>
          <tbody className="divide-y divide-slate-800">
            {partners.map(p => {
              const e = edit[p.ma_ctv] || {};
              const val = (k: string) => e.rates?.[k] ?? p.rates?.[k] ?? '';
              const t = totals[p.ma_ctv];
              const link = `${origin}/?ref=${p.ma_ctv}`;
              const setE = (patch: any) => setEdit(x => ({ ...x, [p.ma_ctv]: { ...e, ...patch } }));
              return (
                <tr key={p.ma_ctv} className={p.active === false ? 'opacity-50' : ''}>
                  <td className="p-2"><b className="font-mono text-amber-400">{p.ma_ctv}</b><div>{p.ten}</div><div className="text-slate-500">{p.sdt}</div>
                    <button onClick={() => { navigator.clipboard?.writeText(link); setMsg('✓ Đã chép link: ' + link); }} className="mt-1 text-[10px] underline text-sky-400 cursor-pointer">📋 Chép link giới thiệu</button></td>
                  <td className="p-2"><select className={inp} value={e.loai_doi_tac ?? p.loai_doi_tac} onChange={ev => setE({ loai_doi_tac: ev.target.value })}>{TYPES.map(x => <option key={x}>{x}</option>)}</select></td>
                  {PRODUCTS.map(pr => (
                    <td key={pr.key} className="p-2"><input className={`${inp} w-14`} type="number" min={0} max={100} value={val(pr.key)} placeholder={String(p.effectiveRates?.[pr.key] ?? 0)} onChange={ev => setE({ rates: { ...(e.rates || {}), [pr.key]: ev.target.value } })} /></td>
                  ))}
                  <td className="p-2"><input className={`${inp} w-20`} placeholder={p.pinSet ? '•••• (đã có)' : 'Đặt PIN'} value={e.pin ?? ''} onChange={ev => setE({ pin: ev.target.value })} /></td>
                  <td className="p-2 whitespace-nowrap">{t ? <><div>{vnd(t.tong)}</div><div className="text-rose-300">nợ {vnd(t.cho)}</div></> : '—'}</td>
                  <td className="p-2 whitespace-nowrap">
                    <button disabled={!edit[p.ma_ctv]} onClick={async () => { const ok = await savePartner({ ma_ctv: p.ma_ctv, ...e, rates: { ...(p.rates || {}), ...(e.rates || {}) } }); if (ok) setEdit(x => { const n = { ...x }; delete n[p.ma_ctv]; return n; }); }} className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-black cursor-pointer disabled:opacity-40">Lưu</button>
                    <button onClick={() => savePartner({ ma_ctv: p.ma_ctv, active: p.active === false })} className="ml-1 px-2 py-1 rounded bg-slate-700 cursor-pointer">{p.active === false ? 'Mở lại' : 'Ngừng'}</button>
                  </td>
                </tr>
              );
            })}
            {!partners.length && <tr><td colSpan={PRODUCTS.length + 5} className="p-6 text-center text-slate-500">Chưa có CTV trên máy chủ. Thêm CTV ở trên.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="text-[11px] text-slate-400 leading-relaxed">Ô % để trống = dùng % mặc định (số mờ): video theo bảng cũ (CTV Thường 15/15/20%, Cinematic duyệt tay; B2B 15/15/20/25%; B2B VIP = % thỏa thuận). Gói Báo cáo / Bản vẽ mặc định 0% — anh đặt % nếu muốn trả hoa hồng.</div>
      {msg && <div className="text-xs break-all">{msg}</div>}
    </div>
  );
}
