import React from 'react';

/**
 * THÔNG BÁO XỬ LÝ DỮ LIỆU CÁ NHÂN (theo tinh thần Nghị định 13/2023/NĐ-CP).
 * Thông tin pháp nhân lấy từ biến COMPANY_NAME, COMPANY_ADDRESS, COMPANY_EMAIL, COMPANY_TAX_CODE trên Vercel.
 * Nội dung mẫu — doanh nghiệp nên nhờ luật sư rà soát trước khi dùng chính thức.
 */
export interface CompanyInfo { name: string; address: string; email: string; taxCode: string }

export default function PrivacyNotice({ company, hotline, lang = 'vi', onClose }: { company?: CompanyInfo | null; hotline?: string; lang?: string; onClose: () => void }) {
  const c = company || { name: '', address: '', email: '', taxCode: '' };
  const name = c.name || 'Yohu ConsTech';
  const contact = [c.email && `email ${c.email}`, hotline && `hotline ${hotline}`].filter(Boolean).join(', ') || 'hotline trên trang';
  const vi = lang === 'vi';
  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-3" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white text-slate-800 p-5 sm:p-6 text-sm leading-relaxed" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-lg font-black">{vi ? 'Chính sách bảo vệ dữ liệu cá nhân' : 'Personal data policy'}</h2>
          <button onClick={onClose} className="text-2xl leading-none px-2 cursor-pointer" aria-label="Đóng">×</button>
        </div>
        {vi ? (
          <div className="space-y-2">
            <p><b>Bên xử lý dữ liệu:</b> {name}{c.taxCode ? `, MST ${c.taxCode}` : ''}{c.address ? `, địa chỉ ${c.address}` : ''}.</p>
            <p><b>1. Dữ liệu thu thập:</b> họ tên, số điện thoại, email, địa chỉ, ngày giờ sinh, giới tính, năm sinh vợ/chồng, thông tin khu đất và công trình, ảnh/bản vẽ anh/chị tải lên.</p>
            <p><b>2. Mục đích:</b> tính phong thủy, lập dự toán, bản vẽ, ảnh phối cảnh theo yêu cầu; liên hệ tư vấn, báo giá; xác nhận thanh toán và mở gói dịch vụ. Không dùng cho mục đích khác khi chưa hỏi ý kiến anh/chị.</p>
            <p><b>3. Nơi lưu & ai được xem:</b> máy chủ của {name} (dịch vụ đám mây Google Firebase / Google Sheet). Chỉ nhân viên được phân quyền xem. Cộng tác viên giới thiệu chỉ thấy tên đã che (ví dụ "An ***"). <b>Không bán, không chia sẻ</b> dữ liệu cho bên thứ ba vì mục đích quảng cáo. Ảnh/mô tả có thể được gửi tới dịch vụ AI (Google Gemini) chỉ để tạo kết quả cho chính anh/chị.</p>
            <p><b>4. Thời gian lưu:</b> trong thời gian cung cấp dịch vụ và tối đa 24 tháng sau lần dùng cuối, trừ khi pháp luật yêu cầu lâu hơn (ví dụ chứng từ thanh toán).</p>
            <p><b>5. Quyền của anh/chị:</b> được biết, xem, sửa, yêu cầu xóa hoặc ngừng xử lý dữ liệu; rút lại sự đồng ý bất cứ lúc nào. Liên hệ: {contact}. Yêu cầu được xử lý trong 72 giờ làm việc.</p>
            <p><b>6. Bảo mật:</b> truyền dữ liệu qua kết nối mã hóa (HTTPS); tài khoản nhân viên có mã riêng và nhật ký thao tác.</p>
            <p className="text-xs text-slate-500">Kết quả phong thủy mang tính tham khảo theo tục lệ phổ biến; bản vẽ, dự toán là sơ bộ, cần kỹ sư/KTS kiểm tra trước khi thi công.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p><b>Data controller:</b> {name}{c.address ? `, ${c.address}` : ''}.</p>
            <p>We collect your name, phone, email, address, birth date/time, gender, spouse birth year, site and building details and uploaded images, only to produce feng-shui results, estimates, drawings and renderings you request, to contact you and to activate paid packages. Data is stored on our cloud servers (Google Firebase / Google Sheets), seen only by authorised staff, never sold. Images/descriptions may be sent to an AI service (Google Gemini) solely to generate your results. Data is kept up to 24 months after last use. You may access, correct, delete or withdraw consent at any time: {contact}.</p>
          </div>
        )}
        <button onClick={onClose} className="mt-4 w-full py-3 rounded-xl bg-slate-900 text-white font-black cursor-pointer">{vi ? 'Đã hiểu' : 'Close'}</button>
      </div>
    </div>
  );
}
