/**
 * Gọi Google Sheet (Apps Script) THÔNG QUA máy chủ Yohu.
 * Trình duyệt không còn biết địa chỉ Apps Script; máy chủ tự kiểm tra quyền:
 *  - Lệnh khách (lưu khách hàng, đơn video, CTV...) → gửi bình thường
 *  - Lệnh quản trị (kích hoạt gói, thống kê, hoa hồng...) → cần mã admin đã đăng nhập
 */
export type GoiKey = 'free' | 'standard' | 'design';

export async function callGas(input: URLSearchParams | Record<string, any>): Promise<any> {
  let payload: any = input;
  if (input instanceof URLSearchParams) {
    const raw = input.get('data');
    try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = {}; }
  }
  let adminCode = '';
  try { adminCode = sessionStorage.getItem('yohu_admin_code') || ''; } catch {}
  const res = await fetch('/api/gas-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(adminCode ? { 'x-admin-code': adminCode } : {}) },
    body: JSON.stringify(payload)
  });
  try { return await res.json(); } catch { return { ok: res.ok }; }
}

/** Gói đã được máy chủ xác nhận cho khách này */
export async function fetchVerifiedPackage(clientId: string): Promise<GoiKey> {
  if (!clientId) return 'free';
  try {
    const res = await fetch(`/api/package/${encodeURIComponent(clientId)}`);
    const data = await res.json();
    return (['free', 'standard', 'design'].includes(data?.goi) ? data.goi : 'free') as GoiKey;
  } catch {
    return 'free';
  }
}

/** Admin kích hoạt gói (cần mã admin trong phiên đăng nhập) */
export async function adminActivatePackage(clientId: string, goi: GoiKey, soTien = 0): Promise<{ ok: boolean; error?: string }> {
  let adminCode = '';
  try { adminCode = sessionStorage.getItem('yohu_admin_code') || ''; } catch {}
  try {
    const res = await fetch('/api/admin/activate-package', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-code': adminCode },
      body: JSON.stringify({ clientId, goi, so_tien: soTien })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error || `Lỗi ${res.status}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Không kết nối được máy chủ' };
  }
}

export function labelToGoi(label: string): GoiKey {
  const l = String(label || '').toLowerCase();
  if (l.includes('bản vẽ') || l === 'design') return 'design';
  if (l.includes('đầy đủ') || l === 'standard') return 'standard';
  return 'free';
}
