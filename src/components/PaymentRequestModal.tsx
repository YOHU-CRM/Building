import React, { useState } from 'react';

interface PaymentRequestModalProps {
  theme: 'dark' | 'light';
  tier: 'standard' | 'design';
  clientId: string;
  customerName: string;
  customerPhone: string;
  hotline: string;
  bankInfo?: string; // VD: "Vietcombank - 0123456789 - CONG TY YOHU"
  /** QR VietQR (biến BANK_ID, BANK_ACCOUNT, BANK_ACCOUNT_NAME trên Vercel) */
  bankQr?: { bankId: string; account: string; name: string } | null;
  /** số tiền gói (đồng) — in sẵn trong mã QR */
  amount?: number;
  onClose: () => void;
  onCheckAgain: () => Promise<boolean>;
  onRedeemCode: (code: string) => Promise<boolean>;
}

const TIER_INFO = {
  standard: { name: 'Báo Cáo Đầy Đủ', price: '299.000 đ', items: ['Phong thủy chi tiết + kết luận hướng & hóa giải', 'Dự toán 3 phương án kết cấu × 3 gói hoàn thiện', 'PDF báo cáo đầy đủ'] },
  design: { name: 'Báo Cáo + Bản Vẽ', price: 'từ 1.200.000 đ', items: ['Toàn bộ gói Đầy Đủ', 'Mặt bằng 2D từng tầng theo lưới 9 cung', 'Mặt đứng, file DXF mở bằng AutoCAD'] }
};

/**
 * Hộp hướng dẫn thanh toán. Gói CHỈ được mở khi admin xác nhận trên máy chủ
 * (hoặc khách nhập mã kích hoạt hợp lệ do admin cấp).
 */
export const PaymentRequestModal: React.FC<PaymentRequestModalProps> = ({
  theme, tier, clientId, customerName, customerPhone, hotline, bankInfo, bankQr, amount, onClose, onCheckAgain, onRedeemCode
}) => {
  const [reported, setReported] = useState<'' | 'sending' | 'ok' | 'err'>('');
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [codeMsg, setCodeMsg] = useState<string | null>(null);
  const info = TIER_INFO[tier];
  const dark = theme === 'dark';
  const transferNote = `YOHU ${clientId}`;
  const money = Math.max(0, Math.round(Number(amount) || 0));
  const qrUrl = bankQr ? `https://img.vietqr.io/image/${encodeURIComponent(bankQr.bankId)}-${encodeURIComponent(bankQr.account)}-compact2.png?amount=${money}&addInfo=${encodeURIComponent(transferNote)}&accountName=${encodeURIComponent(bankQr.name || '')}` : '';
  const reportPaid = async () => {
    setReported('sending');
    try {
      const r = await fetch('/api/payment-requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, goi: tier, amount: money, name: customerName, phone: customerPhone, transferNote }) });
      setReported(r.ok ? 'ok' : 'err');
    } catch { setReported('err'); }
  };
  const zaloPhone = hotline.replace(/\D/g, '');

  const copy = (text: string) => {
    try { navigator.clipboard.writeText(text); } catch {}
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border max-h-[92vh] overflow-y-auto ${dark ? 'bg-[#0f1424] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-red-500">Nâng cấp gói</div>
            <div className="text-lg font-black">{info.name} · <span className="text-red-500">{info.price}</span></div>
          </div>
          <button onClick={onClose} className="text-2xl leading-none px-2 cursor-pointer opacity-70 hover:opacity-100" aria-label="Đóng">×</button>
        </div>

        <ul className={`text-sm space-y-1 mb-4 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
          {info.items.map(i => <li key={i}>✓ {i}</li>)}
        </ul>

        {qrUrl && (
          <div className={`rounded-xl p-3 mb-3 border text-center ${dark ? 'bg-white border-slate-700' : 'bg-white border-slate-200'}`}>
            <img src={qrUrl} alt="Mã QR chuyển khoản" className="mx-auto w-56 h-56 object-contain" />
            <div className="text-xs text-slate-700 mt-1">Quét bằng app ngân hàng: đã điền sẵn <b>{money.toLocaleString('vi-VN')}đ</b> và nội dung <b className="font-mono">{transferNote}</b></div>
            {bankQr?.name && <div className="text-[11px] text-slate-500">Chủ tài khoản: {bankQr.name} · STK {bankQr.account}</div>}
          </div>
        )}
        <div className={`rounded-xl p-3.5 mb-3 text-sm border ${dark ? 'bg-slate-900 border-slate-700' : 'bg-amber-50 border-amber-200'}`}>
          <div className="font-black mb-1.5">Cách thanh toán (3 bước)</div>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              {bankInfo ? <>Chuyển khoản tới: <b>{bankInfo}</b></> : <>Gọi/Zalo hotline <b>{hotline}</b> để nhận thông tin chuyển khoản.</>}
            </li>
            <li>
              Nội dung chuyển khoản: <b className="font-mono">{transferNote}</b>{' '}
              <button onClick={() => copy(transferNote)} className="text-xs underline cursor-pointer text-blue-500">sao chép</button>
            </li>
            <li>Chuyển xong bấm <b>"Tôi đã chuyển khoản"</b>. Yohu đối chiếu và mở gói (thường 5–15 phút giờ hành chính), sau đó bấm <b>"Kiểm tra gói"</b>.</li>
          </ol>
          <div className="mt-2 text-xs opacity-80">
            Mã hồ sơ của bạn: <b className="font-mono">{clientId}</b>
            {customerName ? <> · {customerName}</> : null}
            {customerPhone ? <> · {customerPhone}</> : null}
          </div>
        </div>

        <button onClick={reportPaid} disabled={reported === 'sending' || reported === 'ok'} className="w-full mb-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm cursor-pointer disabled:opacity-70">
          {reported === 'ok' ? '✓ Đã báo Yohu — đang chờ xác nhận' : reported === 'sending' ? 'Đang gửi…' : `Tôi đã chuyển khoản${money ? ' ' + money.toLocaleString('vi-VN') + 'đ' : ''}`}
        </button>
        {reported === 'err' && <div className="text-xs text-rose-500 mb-2">Chưa gửi được — vui lòng nhắn Zalo cho Yohu kèm ảnh chuyển khoản.</div>}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <a
            href={`https://zalo.me/${zaloPhone}`}
            target="_blank"
            rel="noreferrer"
            className="text-center py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
          >
            Zalo {hotline}
          </a>
          <button
            disabled={checking}
            onClick={async () => {
              setChecking(true); setCheckMsg(null);
              const ok = await onCheckAgain();
              setChecking(false);
              setCheckMsg(ok ? '✅ Gói đã được kích hoạt!' : '⏳ Chưa thấy xác nhận. Vui lòng chờ thêm hoặc nhắn Zalo cho Yohu.');
            }}
            className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm cursor-pointer"
          >
            {checking ? 'Đang kiểm tra…' : 'Kiểm tra gói'}
          </button>
        </div>
        {checkMsg && <div className="text-sm mb-3">{checkMsg}</div>}

        <div className={`border-t pt-3 ${dark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="text-xs font-bold mb-1.5">Đã có mã kích hoạt?</div>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Nhập mã do Yohu cấp"
              className={`flex-1 min-w-0 px-3 py-2 rounded-xl border text-sm uppercase ${dark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-300'}`}
            />
            <button
              onClick={async () => {
                setCodeMsg(null);
                const ok = await onRedeemCode(code);
                setCodeMsg(ok ? '✅ Kích hoạt thành công!' : '❌ Mã không hợp lệ hoặc đã được dùng.');
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm cursor-pointer"
            >
              Áp dụng
            </button>
          </div>
          {codeMsg && <div className="text-sm mt-2">{codeMsg}</div>}
        </div>
      </div>
    </div>
  );
};

export default PaymentRequestModal;
