/**
 * Báo lỗi từ trình duyệt khách về máy chủ → admin xem ở tab "🧯 Lỗi gần đây".
 * Không gửi dữ liệu cá nhân: chỉ nguồn lỗi, nội dung lỗi, mã khách, trang đang mở.
 */
let installed = false;
const recent = new Map<string, number>();

export function reportError(source: string, message: unknown, extra: { stack?: string } = {}) {
  try {
    const msg = String((message as any)?.message || message || '').slice(0, 600);
    if (!msg) return;
    const key = source + '|' + msg.slice(0, 120);
    const now = Date.now();
    if (now - (recent.get(key) || 0) < 60_000) return;      // cùng 1 lỗi chỉ báo 1 lần / phút
    recent.set(key, now);
    let clientId = '';
    try { clientId = localStorage.getItem('yohu_client_id') || ''; } catch { /* bỏ qua */ }
    const body = JSON.stringify({ source, message: msg, stack: String(extra.stack || (message as any)?.stack || '').slice(0, 600), clientId, url: location.pathname + location.search.slice(0, 80) });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/log-error', new Blob([body], { type: 'application/json' }));
    else fetch('/api/log-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch { /* không để việc báo lỗi gây lỗi */ }
}

/** Gắn bắt lỗi toàn trang (gọi 1 lần khi mở app) */
export function installErrorReporting() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', e => {
    if (!e.message || /ResizeObserver loop/i.test(e.message)) return;
    reportError('window', e.message, { stack: (e.error as any)?.stack });
  });
  window.addEventListener('unhandledrejection', e => {
    const r: any = e.reason;
    const m = String(r?.message || r || '');
    if (!m || /AbortError|Failed to fetch|NetworkError|Load failed/i.test(m)) return;   // mất mạng phía khách: không tính là lỗi tool
    reportError('promise', m, { stack: r?.stack });
  });
}

/** Mã bí mật của trình duyệt này — chứng minh hồ sơ khách do chính máy này tạo (chống ghi đè hồ sơ) */
export function clientSecret(): string {
  try {
    let s = localStorage.getItem('yohu_client_secret');
    if (!s) {
      const a = new Uint8Array(16); crypto.getRandomValues(a);
      s = Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem('yohu_client_secret', s);
    }
    return s;
  } catch { return ''; }
}
