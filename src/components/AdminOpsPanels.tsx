import React, { useEffect, useState } from 'react';

/**
 * ADMIN — 3 khung vận hành:
 *   PaymentsPanel : khách báo đã chuyển khoản → admin đối chiếu sao kê → "Đã nhận tiền" (mở gói + ghi hoa hồng CTV)
 *   StaffPanel    : tài khoản nhân viên (mã riêng, phân quyền) + nhật ký ai làm gì — chỉ chủ tài khoản
 *   ErrorsPanel   : lỗi gần đây của máy chủ và trình duyệt khách
 */
const code = () => { try { return sessionStorage.getItem('yohu_admin_code') || ''; } catch { return ''; } };
const H = () => ({ 'Content-Type': 'application/json', 'x-admin-code': code() });
const vnd = (n: number) => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const dt = (s?: string) => (s ? new Date(s).toLocaleString('vi-VN') : '');
const box = 'p-4 rounded-xl border border-slate-700 bg-slate-950/60';
const inp = 'p-2 rounded-lg bg-slate-900 border border-slate-700 text-sm';

export function PaymentsPanel() {
  const [list, setList] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const load = () => fetch('/api/admin/payment-requests', { headers: H() }).then(r => r.json()).then(d => d.ok ? setList(d.requests || []) : setMsg(d.error || 'Không tải được')).catch(e => setMsg(String(e)));
  useEffect(() => { load(); }, []);
  const act = async (p: any, action: 'confirm' | 'reject') => {
    let amount = p.amount;
    if (action === 'confirm') {
      const v = window.prompt(`Xác nhận ĐÃ NHẬN TIỀN của ${p.name || p.clientId} cho gói "${p.goiLabel}".\nĐối chiếu sao kê ngân hàng với nội dung "${p.transferNote}".\nSố tiền thực nhận (đồng):`, String(p.amount || 0));
      if (v === null) return;
      amount = Number(v.replace(/\D/g, '')) || 0;
    } else if (!window.confirm(`Từ chối yêu cầu của ${p.name || p.clientId}? (chưa nhận được tiền)`)) return;
    const r = await fetch(`/api/admin/payment-requests/${encodeURIComponent(p.id)}`, { method: 'POST', headers: H(), body: JSON.stringify({ action, amount }) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? (action === 'confirm' ? `✓ Đã mở gói ${p.goiLabel} cho ${p.name || p.clientId}${d.commission?.commission ? ` · ghi hoa hồng ${vnd(d.commission.commission.amount)} cho ${d.commission.commission.ma_ctv}` : ''}` : '✓ Đã từ chối') : '❌ ' + (d.error || r.status));
    load();
  };
  const shown = list.filter(p => filter === 'all' || p.status === 'pending');
  return (
    <div className="space-y-3 text-slate-100">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div><h2 className="text-lg font-black text-amber-400">💳 Thanh toán chờ xác nhận</h2>
          <p className="text-xs text-slate-400">Khách quét QR, chuyển khoản, bấm "Tôi đã chuyển khoản". Anh/chị đối chiếu sao kê rồi bấm <b>Đã nhận tiền</b>: gói mở ngay, hoa hồng CTV tự ghi sổ (nếu đã bật). Tool không tự trừ tiền, không kết nối ngân hàng.</p></div>
        <div className="flex gap-2"><select value={filter} onChange={e => setFilter(e.target.value as any)} className={inp}><option value="pending">Đang chờ</option><option value="all">Tất cả</option></select><button onClick={load} className="px-3 py-2 rounded-lg bg-slate-700 text-xs cursor-pointer">↻</button></div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead><tr className="bg-slate-900 text-slate-400"><th className="p-2">Thời gian</th><th className="p-2">Khách</th><th className="p-2">Gói</th><th className="p-2">Số tiền</th><th className="p-2">Nội dung CK</th><th className="p-2">Trạng thái</th><th className="p-2"></th></tr></thead>
          <tbody className="divide-y divide-slate-800">
            {shown.map(p => (
              <tr key={p.id}>
                <td className="p-2 whitespace-nowrap">{dt(p.createdAt)}</td>
                <td className="p-2">{p.name || '—'}<div className="text-slate-500">{p.phone} · {p.clientId}</div></td>
                <td className="p-2">{p.goiLabel}</td>
                <td className="p-2 font-bold text-emerald-400">{vnd(p.amount)}</td>
                <td className="p-2 font-mono">{p.transferNote}</td>
                <td className="p-2">{p.status === 'pending' ? '⏳ Chờ' : p.status === 'confirmed' ? `✅ Đã nhận (${p.handledBy || ''})` : `✗ Từ chối`}</td>
                <td className="p-2 whitespace-nowrap">{p.status === 'pending' && <>
                  <button onClick={() => act(p, 'confirm')} className="px-2.5 py-1 rounded bg-emerald-600 text-white font-black cursor-pointer">Đã nhận tiền</button>
                  <button onClick={() => act(p, 'reject')} className="ml-1 px-2 py-1 rounded bg-slate-700 cursor-pointer">Từ chối</button></>}</td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={7} className="p-6 text-center text-slate-500">Không có yêu cầu thanh toán.</td></tr>}
          </tbody>
        </table>
      </div>
      {msg && <div className="text-xs">{msg}</div>}
    </div>
  );
}

export function StaffPanel() {
  const [staff, setStaff] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [nw, setNw] = useState<{ name: string; roles: string[] }>({ name: '', roles: ['crm'] });
  const load = () => {
    fetch('/api/admin/staff', { headers: H() }).then(r => r.json()).then(d => { if (d.ok) { setStaff(d.staff || []); setRoles(d.roles || {}); if (!d.firestore) setMsg('Chưa có Firestore — không lưu được tài khoản nhân viên.'); } else setMsg(d.error || 'Chỉ chủ tài khoản xem được mục này'); }).catch(e => setMsg(String(e)));
    fetch('/api/admin/audit', { headers: H() }).then(r => r.json()).then(d => d.ok && setLogs(d.logs || [])).catch(() => {});
  };
  useEffect(() => { load(); }, []);
  const save = async (body: any, label: string) => {
    const r = await fetch('/api/admin/staff', { method: 'POST', headers: H(), body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg('❌ ' + (d.error || r.status)); return; }
    setMsg(d.code ? `✓ ${label}. MÃ ĐĂNG NHẬP: ${d.code} — chỉ hiện 1 lần, gửi riêng cho nhân viên.` : `✓ ${label}`);
    load();
  };
  const toggleRole = (arr: string[], r: string) => arr.includes(r) ? arr.filter(x => x !== r) : [...arr, r];
  return (
    <div className="space-y-4 text-slate-100">
      <div><h2 className="text-lg font-black text-amber-400">👥 Tài khoản nhân viên</h2>
        <p className="text-xs text-slate-400">Mỗi nhân viên một mã đăng nhập riêng và chỉ làm được việc được cấp quyền. Mã ADMIN_CODE trên Vercel là của chủ, có toàn quyền. Nhân viên nghỉ việc: bấm <b>Khóa</b> (không xóa, vẫn giữ nhật ký).</p></div>
      <div className={box}>
        <div className="font-black text-sm mb-2">＋ Thêm nhân viên</div>
        <div className="flex flex-wrap gap-2 items-center">
          <input className={inp} placeholder="Tên nhân viên" value={nw.name} onChange={e => setNw({ ...nw, name: e.target.value })} />
          {Object.entries(roles).map(([k, v]) => <label key={k} className="text-xs flex items-center gap-1"><input type="checkbox" checked={nw.roles.includes(k)} onChange={() => setNw({ ...nw, roles: toggleRole(nw.roles, k) })} />{v}</label>)}
          <button disabled={!nw.name.trim()} onClick={() => { save({ name: nw.name.trim(), roles: nw.roles }, `Đã tạo tài khoản ${nw.name}`); setNw({ name: '', roles: ['crm'] }); }} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-black cursor-pointer disabled:opacity-40">Tạo & cấp mã</button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead><tr className="bg-slate-900 text-slate-400"><th className="p-2">Nhân viên</th>{Object.values(roles).map(v => <th key={v} className="p-2">{v}</th>)}<th className="p-2"></th></tr></thead>
          <tbody className="divide-y divide-slate-800">
            {staff.map(u => (
              <tr key={u.id} className={u.active === false ? 'opacity-50' : ''}>
                <td className="p-2"><b>{u.name}</b><div className="text-slate-500">{u.id}</div></td>
                {Object.keys(roles).map(k => <td key={k} className="p-2"><input type="checkbox" checked={(u.roles || []).includes(k)} onChange={() => save({ id: u.id, roles: toggleRole(u.roles || [], k) }, `Đã đổi quyền ${u.name}`)} /></td>)}
                <td className="p-2 whitespace-nowrap">
                  <button onClick={() => window.confirm(`Cấp mã mới cho ${u.name}? Mã cũ hết hiệu lực ngay.`) && save({ id: u.id, resetCode: true }, `Đã cấp mã mới cho ${u.name}`)} className="px-2 py-1 rounded bg-sky-700 cursor-pointer">Cấp mã mới</button>
                  <button onClick={() => window.confirm(`${u.active === false ? 'Mở khóa' : 'Khóa'} tài khoản ${u.name}?`) && save({ id: u.id, active: u.active === false }, `${u.active === false ? 'Đã mở khóa' : 'Đã khóa'} ${u.name}`)} className="ml-1 px-2 py-1 rounded bg-slate-700 cursor-pointer">{u.active === false ? 'Mở khóa' : 'Khóa'}</button>
                </td>
              </tr>
            ))}
            {!staff.length && <tr><td colSpan={Object.keys(roles).length + 2} className="p-6 text-center text-slate-500">Chưa có nhân viên.</td></tr>}
          </tbody>
        </table>
      </div>
      {msg && <div className="text-xs p-2 rounded bg-slate-800 break-all">{msg}</div>}
      <div>
        <div className="font-black text-sm mb-2">📜 Nhật ký thao tác (200 dòng gần nhất)</div>
        <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[420px] overflow-y-auto">
          <table className="w-full text-left text-[11px]">
            <thead><tr className="bg-slate-900 text-slate-400"><th className="p-2">Lúc</th><th className="p-2">Ai</th><th className="p-2">Việc</th><th className="p-2">Dữ liệu</th><th className="p-2">KQ</th></tr></thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((l, i) => <tr key={i}><td className="p-2 whitespace-nowrap">{dt(l.at)}</td><td className="p-2">{l.who}</td><td className="p-2 font-mono">{l.method} {l.path}</td><td className="p-2 font-mono text-slate-400">{Object.entries(l.data || {}).map(([k, v]) => `${k}=${v}`).join(' ')}</td><td className="p-2">{l.status}</td></tr>)}
              {!logs.length && <tr><td colSpan={5} className="p-4 text-center text-slate-500">Chưa có thao tác.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ErrorsPanel() {
  const [list, setList] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const load = () => fetch('/api/admin/errors', { headers: H() }).then(r => r.json()).then(d => d.ok ? setList(d.errors || []) : setMsg(d.error || '')).catch(e => setMsg(String(e)));
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-3 text-slate-100">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div><h2 className="text-lg font-black text-amber-400">🧯 Lỗi gần đây</h2>
          <p className="text-xs text-slate-400">Lỗi máy chủ (AI hỏng, lưu thất bại, gửi video lỗi…) và lỗi trên trình duyệt khách. Không chứa thông tin cá nhân, chỉ có mã khách để tra.</p></div>
        <button onClick={load} className="px-3 py-2 rounded-lg bg-slate-700 text-xs cursor-pointer">↻ Tải lại</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-[560px] overflow-y-auto">
        <table className="w-full text-left text-[11px]">
          <thead><tr className="bg-slate-900 text-slate-400"><th className="p-2">Lúc</th><th className="p-2">Nguồn</th><th className="p-2">Nội dung</th><th className="p-2">Chi tiết</th></tr></thead>
          <tbody className="divide-y divide-slate-800">
            {list.map((e, i) => <tr key={i}><td className="p-2 whitespace-nowrap">{dt(e.at)}</td><td className="p-2 font-mono">{e.source}</td><td className="p-2 text-rose-300">{e.message}</td><td className="p-2 font-mono text-slate-400">{Object.entries(e.meta || {}).filter(([k]) => k !== 'stack' && k !== 'ua').map(([k, v]) => `${k}=${v}`).join(' ')}</td></tr>)}
            {!list.length && <tr><td colSpan={4} className="p-6 text-center text-slate-500">{msg || 'Chưa ghi nhận lỗi nào. 👍'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
