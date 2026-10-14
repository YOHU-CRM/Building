// ══════════════════════════════════════════════════════════════════
// YOHU BUILD AI — APPS SCRIPT v6 FINAL
// Ghép đủ: kiểm tra trùng SĐT + tự tạo tab + chống lỗi unicode
// + đủ hàm video/HH/thống kê/PDF/Gemini
// Deploy: Extensions > Apps Script > Deploy > New deployment > Web App > Anyone
// URL: https://script.google.com/macros/s/AKfycbxMQDwea6SjcHq42sZqFRYORsv6E670ge3B9EE2HC8Sh4mqGGBSAQ4nstUKS3WjJLTs/exec
// ══════════════════════════════════════════════════════════════════

// ── HẰNG SỐ ─────────────────────────────────────────────────────
// Vào Project Settings > Script Properties > thêm key tên GEMINI_KEY_1, giá trị là API key thật của bạn.
const GEMINI_KEYS    = [PropertiesService.getScriptProperties().getProperty('GEMINI_KEY_1')].filter(Boolean);
const SHEET_ID       = '1x3OfkFe0AOWw90b9gS_QuAxG6D5-uPOH6Cg7vuF5oS4';
const TEMPLATE_DOC_ID= '1YF6LNKF3zfSUyTvsiPIT5hyCMZtH7VzcEADQ9oYNRWw';
const DRIVE_FOLDER_ID= '1tVZp3dRta3Z3oBNYoZPKmgVX6udBpuB_';
const ADMIN_EMAIL    = 'Yohu.vn@gmail.com';

function getSS() {
  // 1. Ưu tiên cao nhất: Nếu script chạy gắn với Sheet (Extensions > Apps Script), tự động lấy Sheet hiện tại
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active && active.getId()) return active;
  } catch (e) {
    Logger.log('Không lấy được ActiveSpreadsheet: ' + e.toString());
  }

  // 2. Nếu là script độc lập (standalone), mở theo SHEET_ID
  try {
    if (SHEET_ID && SHEET_ID.trim() !== '') {
      return SpreadsheetApp.openById(SHEET_ID);
    }
  } catch (e) {
    Logger.log('Lỗi mở Sheet theo ID ' + SHEET_ID + ': ' + e.toString());
  }

  return SpreadsheetApp.getActiveSpreadsheet();
}

// ── TÊN TAB (Đã chuyển sang không dấu để tránh lỗi link) ─────────
const SHEET_KH       = 'Khach_Hang';
const SHEET_DT       = 'Doanh_Thu';
const SHEET_CTV      = 'CTV_Affiliate';
const SHEET_VIDEO    = 'Video_DVGTGT';
const SHEET_HOA_HONG = 'HH_Video_CTV';
const SHEET_KT       = 'Ket_Cau_KT';

// ── HEADER MẶC ĐỊNH KHI TỰ TẠO TAB ─────────────────────────────
const HEADERS = {
  'Khach_Hang'      : ['STT','Ngày Tạo','Họ & Tên','Số ĐT','Email','Địa Chỉ CT','Năm Sinh','Giới Tính','Mệnh','Loại CT','Diện Tích','Số Tầng','Ngân Sách','Đơn Vị','Tiêu Chuẩn','Hướng Muốn','Hướng Tốt AI','Gói Mua','D.Thu Gói','Trạng Thái','Kết Quả AI','Việc Làm Tiếp','Ngày Nhắc','Mã CTV','Quốc Gia','Vùng Miền','Loại Đất','Phong Cách','Ngôn Ngữ','TT PDF','Link PDF','Kết Cấu KT','Link Ảnh Phối Cảnh 3D','Link Video Phối Cảnh'],
  'Doanh_Thu'       : ['Ngày GD','Họ Tên','SĐT','Gói DV','Số Tiền','Mã CTV','Doanh Thu','Phương Thức','Trạng Thái','Mã GD'],
  'CTV_Affiliate'   : ['Mã CTV','UTM Source','UTM Medium','UTM Campaign','Ngày Truy Cập','Loại Đối Tác'],
  'Video_DVGTGT'    : ['STT','Ngày Đặt','Họ & Tên KH','SĐT','Gói Video','Số Lượng','Trạng Thái','Mã CTV/B2B','HH (VNĐ)','Ngày Giao','Link Video','Kênh Giao','Ghi Chú KH','Ghi Chú Admin'],
  'HH_Video_CTV'    : ['STT','Ngày','Mã CTV/B2B','Gói Video','KH','Tiền HH (VNĐ)','% HH','Trạng Thái','Tháng TT','Mã Đơn'],
  'Ket_Cau_KT'      : ['STT','Mã KH','Họ & Tên','Địa Chỉ','Quốc Gia','Số Tầng','Diện Tích','Ngân Sách','Loại Móng','Mác BT Móng','Thép Móng','Tiết Diện Cột','Mác BT Khung','Loại Mái','Vật Liệu Tường','Xử Lý Đặc Thù','Lưu Ý Vùng Miền','Trạng Thái','Kỹ Sư Review'],
  'Mau_Thiet_Ke'    : ['STT','Loại Phòng','Phong Cách','Mệnh Phù Hợp','Link Ảnh Mẫu','Link Video YouTube','Tiêu Đề','Ghi Chú'],
};
const HEADER_BG = {
  'Khach_Hang':'#0F3460','Doanh_Thu':'#145A32','CTV_Affiliate':'#4A235A',
  'Video_DVGTGT':'#1A3A5C','HH_Video_CTV':'#6E2C00','Ket_Cau_KT':'#1C2128',
  'Mau_Thiet_Ke':'#2C3E50',
};

// ── VỊ TRÍ CỘT SHEET KH ─────────────────────────────────────────
const COL_KH = {
  STT:1,NGAY_TAO:2,HO_TEN:3,SO_DT:4,EMAIL:5,DIA_CHI:6,NAM_SINH:7,GIOI_TINH:8,
  MENH:9,LOAI_CT:10,DIEN_TICH:11,SO_TANG:12,NGAN_SACH:13,DON_VI:14,TIEU_CHUAN:15,
  HUONG_MUON:16,HUONG_TOT:17,GOI_MUA:18,DT_GOI:19,TRANG_THAI:20,KET_QUA_AI:21,
  VIEC_LAM:22,NGAY_NHAC:23,MA_CTV:24,QUOC_GIA:25,VUNG_MIEN:26,LOAI_DAT:27,
  PHONG_CACH:28,NGON_NGU:29,TT_PDF:30,LINK_PDF:31,KET_CAU_KT:32,
  LINK_ANH_PHOI_CANH:33,LINK_VIDEO_PHOI_CANH:34
};

// ── ROW BẮT ĐẦU DỮ LIỆU ─────────────────────────────────────────
const ROW = { KH:6, DT:10, CTV:8, VID:7, HH:7, KT:5 };

// ── GIÁ & HOA HỒNG VIDEO ────────────────────────────────────────
const GIA_VIDEO = { 'VID-TEASER':200000,'VID-01':500000,'VID-02':1200000,'VID-03':2500000 };
const HH_VIDEO  = { 'VID-TEASER':0.15,'VID-01':0.15,'VID-02':0.20,'VID-03':0.25 };

// ── TEMPLATE PDF THEO GÓI ────────────────────────────────────────
const TEMPLATE_MAP = {
  'Báo cáo cơ bản'      : TEMPLATE_DOC_ID,
  'Báo cáo đầy đủ'      : TEMPLATE_DOC_ID, // ← thay ID template 299K sau khi tạo
  'Báo cáo + Bản vẽ'    : TEMPLATE_DOC_ID, // ← thay ID template 1.5M sau khi tạo
};


// ══════════════════════════════════════════════════════════════════
// ENTRY POINT (Cổng kết nối chuẩn từ File 1 + Robust)
// ══════════════════════════════════════════════════════════════════
function route(body) {
  if (!body) return { ok: false, error: "Thiếu dữ liệu (body rỗng)" };
  const type = body.api_type || body.type;
  if (!type) return { ok: false, error: "Thiếu api_type hoặc type trong dữ liệu" };

  // ── KHÓA BẢO MẬT: chỉ máy chủ Yohu (biết YOHU_SECRET) mới gọi được ──
  // Cài đặt: Project Settings > Script Properties > thêm key YOHU_SECRET (giá trị giống GAS_SECRET trên Vercel)
  const SECRET = PropertiesService.getScriptProperties().getProperty('YOHU_SECRET');
  if (SECRET) {
    if (String(body.secret || '') !== SECRET) return { ok: false, error: 'Unauthorized' };
  }
  delete body.secret;

  switch (type) {
    case 'register_customer':
    case 'khach_hang':
      return { ok: true, msg: luuKhachHang(body) };
    case 'giao_dich':
      return { ok: true, msg: luuGiaoDich(body) };
    case 'xuat_pdf':
      return xuatPDFTheoGoi(body.ma_kh, body.goi_mua);
    case 'video_order':
    case 'video_orders':
      body.goi_video = body.ma_goi || body.goi_video || '';
      return luuDonVideo(body);
    case 'cap_nhat_video':
    case 'update_video_status':
      return capNhatTrangThaiVideo(body.ma_don, body.trang_thai, body.link_video || '');
    case 'kich_hoat_goi':
    case 'update_goi':
      const targetKh = body.ma_kh || body.userInfo?.phone || body.so_dt || body.sdt;
      return kichHoatGoi(targetKh, body.goi_mua);
    case 'get_stats':
      return layThongKe();
    case 'get_tong_hop_ctv':
      return layTongHopCTV();
    case 'get_goi':
      return layGoiKhachHang(body.ma_kh);
    case 'get_mau_thiet_ke':
      return { ok: true, data: layMauThietKe() };
    case 'cap_nhat_anh_phoi_canh':
      return capNhatAnhPhoiCanh(body.ma_kh, body.link_anh, body.link_video);
    case 'ctv_affiliate':
      return { ok: true, msg: luuCTV(body) };
    case 'hoa_hong':
      body.goi_video  = body.ma_goi   || body.goi_video  || '';
      body.so_tien_hh = body.so_tien  || body.so_tien_hh || 0;
      body.ho_ten_kh  = body.ho_ten   || body.ho_ten_kh  || '';
      body.ma_don     = body.ma_don   || ('COM-' + Date.now());
      luuHoaHong(body);
      return { ok: true, msg: 'Đã lưu hoa hồng: ' + body.ma_ctv };
    case 'update_commission_status':
      capNhatHoaHong(body.ma_don);
      return { ok: true, msg: 'Đã cập nhật HH #' + body.ma_don };
    default:
      return { ok: false, error: 'Hành động không hợp lệ: ' + type };
  }
}

function doPost(e) {
  try {
    let body;
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.data) {
      body = JSON.parse(e.parameter.data);
    } else {
      return jsonResponse({ ok: false, error: "Không tìm thấy dữ liệu trong body hoặc URL param 'data'" });
    }
    return jsonResponse(route(body));
  } catch (err) {
    return jsonResponse({ ok: false, error: 'doPost error: ' + err.toString() });
  }
}

function doGet(e) {
  try {
    if (e.parameter && e.parameter.data) {
      const body = JSON.parse(e.parameter.data);
      return jsonResponse(route(body));
    }
    return jsonResponse({ ok: true, message: "YOHU Web App is running. Use POST to sync data." });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'doGet error: ' + err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ══════════════════════════════════════════════════════════════════
// KHỐI 1 — LƯU KHÁCH HÀNG (có kiểm tra trùng SĐT/ID)
// ══════════════════════════════════════════════════════════════════
function luuKhachHang(data) {
  if (!data) data = mockKH();

  const ss  = getSS();
  const ws  = getOrCreate(ss, SHEET_KH);
  const nowStr = fmtDate(new Date());
  const all = ws.getDataRange().getValues();

  // Đồng bộ tên biến từ App (so_dt) sang chuẩn File 1 (sdt)
  const sdt = String(data.sdt || data.so_dt || "").trim();
  const hoten = data.ho_ten || data.name || "Khách hàng mới";

  let foundRow = -1;
  for (let i = ROW.KH - 1; i < all.length; i++) {
    const rowId    = String(all[i][0]);
    const rowPhone = String(all[i][COL_KH.SO_DT - 1]);
    if (data.id    && rowId    === String(data.id))    { foundRow = i + 1; break; }
    if (sdt && rowPhone === String(sdt)) { foundRow = i + 1; break; }
  }

  const stt = foundRow > 0
    ? all[foundRow - 1][0]
    : Math.max(ws.getLastRow() - ROW.KH + 2, 1);

  const rowData = [
    data.id        || stt,                 // 1  STT / ID
    data.ngay_tao  || nowStr,              // 2  Ngày Tạo
    hoten,                                 // 3  Họ & Tên
    sdt,                                   // 4  Số ĐT
    data.email     || '',                  // 5  Email
    data.dia_chi   || data.address || '',  // 6  Địa Chỉ CT
    data.nam_sinh  || '',                  // 7  Năm Sinh
    data.gioi_tinh || '',                  // 8  Giới Tính
    data.menh      || '',                  // 9  Mệnh
    data.loai_ct   || '',                  // 10 Loại CT
    data.dien_tich || '',                  // 11 Diện Tích
    data.so_tang   || '',                  // 12 Số Tầng
    data.ngan_sach || 0,                   // 13 Ngân Sách
    data.don_vi    || 'VNĐ',               // 14 Đơn Vị
    data.tieu_chuan|| 'VN',                // 15 Tiêu Chuẩn
    data.huong_muon|| '',                  // 16 Hướng Muốn
    data.huong_tot || '',                  // 17 Hướng Tốt AI
    data.goi_mua   || 'Báo cáo cơ bản',    // 18 Gói Mua
    data.doanh_thu || 0,                   // 19 D.Thu Gói
    data.trang_thai|| 'Mới',               // 20 Trạng Thái
    '',                                    // 21 Kết Quả AI
    'Gọi điện lần 1',                      // 22 Việc Làm Tiếp
    '',                                    // 23 Ngày Nhắc
    data.ma_ctv    || '',                  // 24 Mã CTV
    data.quoc_gia  || 'Việt Nam',          // 25 Quốc Gia
    data.vung_mien || '',                  // 26 Vùng Miền
    data.loai_dat  || '',                  // 27 Loại Đất
    data.phong_cach|| '',                  // 28 Phong Cách
    data.ngon_ngu  || 'vi',                // 29 Ngôn Ngữ PDF
    'Chưa xuất',                           // 30 TT PDF
    '',                                    // 31 Link PDF
    '',                                    // 32 Kết Cấu KT
    data.link_anh_phoi_canh || '',         // 33 Link Ảnh Phối Cảnh 3D
    data.link_video_phoi_canh || '',       // 34 Link Video Phối Cảnh
  ];

  if (foundRow > 0) {
    // Cập nhật dòng cũ — GIỮ NGUYÊN các cột do admin quản lý (gói, doanh thu, trạng thái, việc làm,
    // ngày nhắc, PDF, link phối cảnh). Khách đồng bộ lại không được ghi đè gói đã mua.
    const old = all[foundRow - 1];
    [COL_KH.GOI_MUA, COL_KH.DT_GOI, COL_KH.TRANG_THAI, COL_KH.VIEC_LAM, COL_KH.NGAY_NHAC,
     COL_KH.TT_PDF, COL_KH.LINK_PDF, COL_KH.KET_CAU_KT].forEach(function (c) {
      if (old[c - 1] !== '' && old[c - 1] !== undefined) rowData[c - 1] = old[c - 1];
    });
    [COL_KH.LINK_ANH_PHOI_CANH, COL_KH.LINK_VIDEO_PHOI_CANH, COL_KH.KET_QUA_AI].forEach(function (c) {
      if (!rowData[c - 1] && old[c - 1]) rowData[c - 1] = old[c - 1];
    });
    ws.getRange(foundRow, 1, 1, 34).setValues([rowData]);
    Logger.log('Cập nhật KH hiện có: ' + data.ho_ten + ' (row ' + foundRow + ')');
  } else {
    const newRow = ws.getLastRow() + 1;
    ws.getRange(newRow, 1, 1, 34).setValues([rowData]);
    foundRow = newRow;
    Logger.log('Thêm KH mới: ' + data.ho_ten + ' (row ' + foundRow + ')');
  }

  // Tô màu trạng thái
  const mauTT = { 'Mới':'#C0392B','Đã chốt':'#27AE60','Đang tư vấn':'#1565C0','Đã mất':'#888888' };
  const tt = String(rowData[19]);
  ws.getRange(foundRow, COL_KH.TRANG_THAI)
    .setFontColor(mauTT[tt] || '#000000').setFontWeight('bold');

  // Ghi kết cấu KT nếu có
  if (data.ket_cau && (data.ket_cau.loai_mong || data.ket_cau.tiet_dien_cot)) {
    luuKetCauKT(stt, data);
  }

  return 'Đã lưu KH: ' + data.ho_ten + ' — ' + (foundRow > 0 ? 'cập nhật' : 'mới');
}

function capNhatAnhPhoiCanh(ma_kh, link_anh, link_video) {
  const ss = getSS();
  const ws = getOrCreate(ss, SHEET_KH);
  const all = ws.getDataRange().getValues();
  for (let i = ROW.KH - 1; i < all.length; i++) {
    if (String(all[i][0]) === String(ma_kh)) {
      const row = i + 1;
      if (link_anh !== undefined) ws.getRange(row, COL_KH.LINK_ANH_PHOI_CANH).setValue(link_anh);
      if (link_video !== undefined) ws.getRange(row, COL_KH.LINK_VIDEO_PHOI_CANH).setValue(link_video);
      return { ok: true, msg: 'Đã cập nhật ảnh/video phối cảnh cho KH: ' + ma_kh };
    }
  }
  return { ok: false, error: 'Không tìm thấy KH: ' + ma_kh };
}


// ══════════════════════════════════════════════════════════════════
// KHỐI 2 — LƯU GIAO DỊCH
// ══════════════════════════════════════════════════════════════════
function luuGiaoDich(data) {
  if (!data) data = mockGD();
  const ss  = getSS();
  const ws  = getOrCreate(ss, SHEET_DT);
  const now = fmtDate(new Date());

  ws.appendRow([
    now,
    data.ho_ten       || '',
    data.so_dt        || '',
    data.goi_dv       || '',
    data.so_tien      || 0,
    data.ma_ctv       || '',
    data.so_tien      || 0,
    data.phuong_thuc  || 'Chuyển khoản',
    'Đã thu',
    data.ma_gd        || '',
  ]);

  if (data.ma_kh) capNhatGoiKH(data.ma_kh, data.goi_dv, data.so_tien);
  return 'Đã lưu GD: ' + fmtSoTien(data.so_tien) + 'đ — ' + data.ho_ten;
}


// ══════════════════════════════════════════════════════════════════
// KHỐI 3 — XUẤT PDF THEO GÓI
// ══════════════════════════════════════════════════════════════════
function xuatPDFTheoGoi(ma_kh, goi_mua) {
  const ss   = getSS();
  const ws   = getOrCreate(ss, SHEET_KH);
  const all  = ws.getDataRange().getValues();

  // Tìm KH theo STT/ID
  let kh = null, khRow = -1;
  for (let i = ROW.KH - 1; i < all.length; i++) {
    if (String(all[i][0]) === String(ma_kh)) { kh = all[i]; khRow = i + 1; break; }
  }
  if (!kh) {
    Logger.log('⚠️ Không tìm thấy KH ' + ma_kh + ' — dùng mock');
    kh = mockKHArray(); khRow = ROW.KH;
  }

  const goiXuat  = goi_mua || kh[COL_KH.GOI_MUA - 1] || 'Báo cáo cơ bản';
  const tmplId   = TEMPLATE_MAP[goiXuat] || TEMPLATE_DOC_ID;
  const folder   = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const now      = fmtDate(new Date());
  const tenFile  = 'YOHU_' + kh[2] + '_' + goiXuat.replace(/ /g,'_') + '_' + fmtDateFile(new Date());

  const newFile  = DriveApp.getFileById(tmplId).makeCopy(tenFile, folder);
  const doc      = DocumentApp.openById(newFile.getId());
  const body     = doc.getBody();

  // Tính toán động
  const cungPhi  = tinhCungPhi(kh[COL_KH.NAM_SINH-1], kh[COL_KH.GIOI_TINH-1]);
  const mauMenh  = mauHopMenh(kh[COL_KH.MENH-1]);
  const ngayDT   = ngayDongTho(kh[COL_KH.NAM_SINH-1]);
  const dtMin    = tinhDuToanSoBo(kh[COL_KH.DIEN_TICH-1], kh[COL_KH.TIEU_CHUAN-1], 'min');
  const dtMax    = tinhDuToanSoBo(kh[COL_KH.DIEN_TICH-1], kh[COL_KH.TIEU_CHUAN-1], 'max');

  const moiVideo = {
    'Báo cáo cơ bản'      :'Chi 200.000đ xem video toàn cảnh căn nhà bạn!',
    'Báo cáo đầy đủ'      :'Nâng cấp Video Nâng Cao 1.200.000đ — nội thất + ánh sáng!',
    'Báo cáo + Bản vẽ'    :'Video Cinematic Premium 4K — toàn bộ không gian sống — 2.500.000đ!',
  };
  const upsell = {
    'Báo cáo cơ bản'      :'Nâng lên Gói Tiêu Chuẩn 299.000đ để xem 3 phương án + kết cấu',
    'Báo cáo đầy đủ'      :'Nâng lên Gói Thiết Kế 1.500.000đ để xem mặt bằng 2D + ảnh 3D',
    'Báo cáo + Bản vẽ'    :'',
  };

  const map = {
    '{{ho_ten}}'        : kh[COL_KH.HO_TEN-1]    ||'',
    '{{nam_sinh}}'      : kh[COL_KH.NAM_SINH-1]   ||'',
    '{{gioi_tinh}}'     : kh[COL_KH.GIOI_TINH-1]  ||'',
    '{{dia_chi}}'       : kh[COL_KH.DIA_CHI-1]    ||'',
    '{{loai_ct}}'       : kh[COL_KH.LOAI_CT-1]    ||'',
    '{{dien_tich}}'     : kh[COL_KH.DIEN_TICH-1]  ||'',
    '{{so_tang}}'       : kh[COL_KH.SO_TANG-1]    ||'',
    '{{ngan_sach}}'     : fmtSoTien(kh[COL_KH.NGAN_SACH-1])+' '+(kh[COL_KH.DON_VI-1]||'VNĐ'),
    '{{goi_mua}}'       : goiXuat,
    '{{menh}}'          : kh[COL_KH.MENH-1]       ||'',
    '{{huong_muon}}'    : kh[COL_KH.HUONG_MUON-1] ||'',
    '{{huong_tot}}'     : kh[COL_KH.HUONG_TOT-1]  ||'',
    '{{quoc_gia}}'      : kh[COL_KH.QUOC_GIA-1]   ||'Việt Nam',
    '{{vung_mien}}'     : kh[COL_KH.VUNG_MIEN-1]  ||'',
    '{{phong_cach}}'    : kh[COL_KH.PHONG_CACH-1] ||'',
    '{{ma_ctv}}'        : kh[COL_KH.MA_CTV-1]     ||'',
    '{{ngay_in}}'       : now,
    '{{hotline}}'       : '+84.973.480.488',
    '{{zalo}}'          : '+84.339.606.969',
    '{{website}}'       : 'app.379ai.io.vn',
    '{{cung_phi}}'      : cungPhi,
    '{{mau_hop_menh}}'  : mauMenh,
    '{{ngay_dong_tho}}' : ngayDT,
    '{{du_toan_min}}'   : dtMin,
    '{{du_toan_max}}'   : dtMax,
    '{{don_gia_vung}}'  : donGiaVungMien(kh[COL_KH.TIEU_CHUAN-1]).label,
    '{{moi_video}}'     : moiVideo[goiXuat] || moiVideo['Báo cáo cơ bản'],
    '{{upsell_goi}}'    : upsell[goiXuat]   || '',
    '{{gia_video}}'     : goiXuat==='Báo cáo cơ bản'?'200.000đ':goiXuat==='Báo cáo đầy đủ'?'1.200.000đ':'2.500.000đ',
  };

  for (const [k, v] of Object.entries(map)) body.replaceText(k, String(v));

  // Gemini sinh nội dung chi tiết (chỉ gói trả phí)
  if (goiXuat !== 'Báo cáo cơ bản') {
    const ai = goiGeminiSinhNoiDungPDF(kh, goiXuat);
    body.replaceText('{{ai_phong_thuy_chi_tiet}}', ai.phong_thuy         || '');
    body.replaceText('{{ai_ket_cau}}'             , ai.ket_cau            || '');
    body.replaceText('{{ai_tien_do}}'             , ai.tien_do            || '');
    body.replaceText('{{ai_du_toan_3_goi}}'       , ai.du_toan            || '');
    if (goiXuat === 'Báo cáo + Bản vẽ') {
      body.replaceText('{{ai_mat_bang}}'        , ai.mat_bang         || '');
      body.replaceText('{{ai_ket_cau_nang_cao}}', ai.ket_cau_nang_cao || '');
      body.replaceText('{{so_do_mat_bang}}', 'Sơ đồ chi tiết được gửi kèm file DXF riêng qua email/Zalo');
      body.replaceText('{{mat_cat_dung}}', 'Sơ đồ chi tiết được gửi kèm file DXF riêng qua email/Zalo');
      body.replaceText('{{ai_ho_so_hoan_cong}}', ai.ho_so_hoan_cong || 'Hồ sơ hoàn công mẫu tiêu chuẩn kỹ thuật xây dựng.');

      const linkAnhPhoiCanh = kh[COL_KH.LINK_ANH_PHOI_CANH - 1] || '';
      const searchResult = body.findText('{{anh_phoi_canh}}');
      if (searchResult) {
        const element = searchResult.getElement();
        const parent = element.getParent().asParagraph();
        parent.clear();
        if (linkAnhPhoiCanh) {
          try {
            let blob = null;
            if (linkAnhPhoiCanh.includes('drive.google.com') || linkAnhPhoiCanh.includes('id=')) {
              const fileId = extractDriveFileId(linkAnhPhoiCanh);
              if (fileId) blob = DriveApp.getFileById(fileId).getBlob();
            }
            if (!blob) blob = UrlFetchApp.fetch(linkAnhPhoiCanh).getBlob();
            parent.insertImage(0, blob);
          } catch (e) {
            parent.appendText('Ảnh phối cảnh đang được xử lý, sẽ gửi bổ sung trong 24h');
          }
        } else {
          parent.appendText('Ảnh phối cảnh đang được xử lý, sẽ gửi bổ sung trong 24h');
        }
      }
    } else {
      body.replaceText('{{ai_mat_bang}}', '');
      body.replaceText('{{ai_ket_cau_nang_cao}}', '');
      body.replaceText('{{so_do_mat_bang}}', '');
      body.replaceText('{{mat_cat_dung}}', '');
      body.replaceText('{{anh_phoi_canh}}', '');
      body.replaceText('{{ai_ho_so_hoan_cong}}', '');
    }
  } else {
    ['{{ai_phong_thuy_chi_tiet}}','{{ai_ket_cau}}','{{ai_tien_do}}',
     '{{ai_du_toan_3_goi}}','{{ai_mat_bang}}','{{ai_ket_cau_nang_cao}}',
     '{{so_do_mat_bang}}','{{mat_cat_dung}}','{{anh_phoi_canh}}','{{ai_ho_so_hoan_cong}}']
      .forEach(p => body.replaceText(p, ''));
  }

  doc.saveAndClose();
  const pdfBlob = DriveApp.getFileById(newFile.getId()).getAs('application/pdf');
  const pdfFile = folder.createFile(pdfBlob.setName(tenFile + '.pdf'));
  newFile.setTrashed(true);

  ws.getRange(khRow, COL_KH.TT_PDF  ).setValue('Đã xuất — ' + now);
  ws.getRange(khRow, COL_KH.LINK_PDF).setValue(pdfFile.getUrl()).setFontColor('#1A73E8');

  return { ok: true, pdf_url: pdfFile.getUrl(), ten_file: tenFile + '.pdf', goi: goiXuat };
}


// ══════════════════════════════════════════════════════════════════
// KHỐI 4 — KÍCH HOẠT GÓI (admin)
// ══════════════════════════════════════════════════════════════════
function kichHoatGoi(ma_kh, goi_mua) {
  const ss   = getSS();
  const ws   = getOrCreate(ss, SHEET_KH);
  const all  = ws.getDataRange().getValues();
  const gia  = { 'Báo cáo cơ bản':0,'Báo cáo đầy đủ':299000,'Báo cáo + Bản vẽ':1500000 };

  for (let i = ROW.KH - 1; i < all.length; i++) {
    if (String(all[i][0]) === String(ma_kh)) {
      const row = i + 1;
      ws.getRange(row, COL_KH.GOI_MUA   ).setValue(goi_mua);
      ws.getRange(row, COL_KH.DT_GOI    ).setValue(gia[goi_mua] || 0);
      ws.getRange(row, COL_KH.TRANG_THAI).setValue('Đã chốt')
        .setFontColor('#27AE60').setFontWeight('bold');
      ws.getRange(row, COL_KH.TT_PDF    ).setValue('Chờ xuất');

      const pdf = xuatPDFTheoGoi(ma_kh, goi_mua);
      return { ok: true, msg: 'Kích hoạt ' + goi_mua + ' cho KH ' + ma_kh, pdf: pdf };
    }
  }
  return { ok: false, msg: 'Không tìm thấy KH: ' + ma_kh };
}


// Tra cứu gói đã kích hoạt của 1 khách (máy chủ dùng để mở khóa báo cáo)
function layGoiKhachHang(ma_kh) {
  if (!ma_kh) return { ok: false, error: 'Thiếu ma_kh' };
  const ws  = getOrCreate(getSS(), SHEET_KH);
  const all = ws.getDataRange().getValues();
  for (let i = ROW.KH - 1; i < all.length; i++) {
    if (String(all[i][0]) === String(ma_kh)) {
      return { ok: true, goi_mua: String(all[i][COL_KH.GOI_MUA - 1] || 'Báo cáo cơ bản') };
    }
  }
  return { ok: true, goi_mua: 'Báo cáo cơ bản', notFound: true };
}

// ══════════════════════════════════════════════════════════════════
// KHỐI 5 — LƯU ĐƠN VIDEO
// ══════════════════════════════════════════════════════════════════
function luuDonVideo(data) {
  if (!data) data = mockVideo();
  const ss  = getSS();
  const ws  = getOrCreate(ss, SHEET_VIDEO);
  const now = fmtDate(new Date());
  const stt = ws.getLastRow() - ROW.VID + 2;

  let loaiDoiTac = "CTV Thường";
  const code = String(data.ma_ctv || '').trim();
  if (code.startsWith("VIP")) {
    loaiDoiTac = "B2B VIP";
  } else if (code.startsWith("B2B")) {
    loaiDoiTac = "B2B Đối Tác";
  }

  let pct = 0.15;
  if (loaiDoiTac === 'CTV Thường') {
    if (data.goi_video === 'VID-02') pct = 0.20;
    else if (data.goi_video === 'VID-03') pct = 0;
    else pct = 0.15;
  } else if (loaiDoiTac === 'B2B Đối Tác') {
    if (data.goi_video === 'VID-03') pct = 0.25;
    else if (data.goi_video === 'VID-02') pct = 0.20;
    else pct = 0.15;
  } else if (loaiDoiTac === 'B2B VIP') {
    pct = 0.25;
  }

  let trangThai = 'Chờ xử lý';
  let hh = 0;
  if (loaiDoiTac === 'CTV Thường' && data.goi_video === 'VID-03') {
    trangThai = 'Cần duyệt thủ công';
    hh = 0;
  } else {
    hh = Math.round((GIA_VIDEO[data.goi_video] || 0) * pct);
  }

  ws.appendRow([
    stt, data.ngay_dat||now, data.ho_ten||'', data.so_dt||'',
    data.goi_video||'', data.so_luong||1, trangThai,
    data.ma_ctv||'', hh, '', '', data.kenh_giao||'Zalo',
    data.ghi_chu||'', '',
  ]);

  const lastRow = ws.getLastRow();
  ws.getRange(lastRow, 7).setFontColor(trangThai === 'Cần duyệt thủ công' ? '#D97706' : '#E65100').setFontWeight('bold');

  if (data.ma_ctv && hh > 0) {
    luuHoaHong({ ma_ctv:data.ma_ctv, goi_video:data.goi_video,
                 so_tien_hh:hh, ho_ten_kh:data.ho_ten, ma_don:stt });
  }
  thongBaoAdmin('Đơn video mới', data.ho_ten, data.goi_video, hh);
  return { ok: true, msg: 'Đã lưu đơn video #' + stt, hoa_hong: hh };
}


// ══════════════════════════════════════════════════════════════════
// KHỐI 6 — CẬP NHẬT TRẠNG THÁI VIDEO (admin)
// ══════════════════════════════════════════════════════════════════
function capNhatTrangThaiVideo(ma_don, trang_thai, link_video) {
  const ss  = getSS();
  const ws  = getOrCreate(ss, SHEET_VIDEO);
  const all = ws.getDataRange().getValues();
  const now = fmtDate(new Date());
  const mau = { 'Chờ xử lý':'#E65100','Đang làm':'#7B1FA2','Hoàn thành':'#2E7D32','Đã giao':'#1565C0' };

  for (let i = ROW.VID - 1; i < all.length; i++) {
    if (String(all[i][0]) === String(ma_don)) {
      const row = i + 1;
      ws.getRange(row, 7).setValue(trang_thai)
        .setFontColor(mau[trang_thai]||'#000').setFontWeight('bold');
      if (trang_thai === 'Hoàn thành' || trang_thai === 'Đã giao') {
        ws.getRange(row, 10).setValue(now);
        if (link_video) ws.getRange(row, 11).setValue(link_video).setFontColor('#1A73E8');
        capNhatHoaHong(ma_don);
      }
      return { ok: true, msg: 'Cập nhật #' + ma_don + ' → ' + trang_thai };
    }
  }
  return { ok: false, msg: 'Không tìm thấy đơn: ' + ma_don };
}


// ══════════════════════════════════════════════════════════════════
// KHỐI 7 — HOA HỒNG
// ══════════════════════════════════════════════════════════════════
function luuHoaHong(data) {
  if (!data) data = { ma_ctv:'CTV001', goi_video:'VID-01', so_tien_hh:75000, ho_ten_kh:'Test', ma_don:'1' };
  const ss  = getSS();
  const ws  = getOrCreate(ss, SHEET_HOA_HONG);
  const now = fmtDate(new Date());
  const stt = ws.getLastRow() - ROW.HH + 2;
  const pct = ((HH_VIDEO[data.goi_video]||0)*100) + '%';

  ws.appendRow([
    stt, now, data.ma_ctv||'', data.goi_video||'', data.ho_ten_kh||'',
    data.so_tien_hh||0, pct, 'Chờ duyệt', '', data.ma_don||'',
  ]);
  ws.getRange(ws.getLastRow(), 8).setFontColor('#C0392B').setFontWeight('bold');
}

function capNhatHoaHong(ma_don) {
  const ss  = getSS();
  const ws  = getOrCreate(ss, SHEET_HOA_HONG);
  if (!ws) return;
  const all = ws.getDataRange().getValues();
  for (let i = ROW.HH - 1; i < all.length; i++) {
    if (String(all[i][9]) === String(ma_don)) {
      ws.getRange(i+1, 8).setValue('Có thể thanh toán')
        .setFontColor('#1B5E20').setFontWeight('bold');
    }
  }
}


// ══════════════════════════════════════════════════════════════════
// KHỐI 8 — KẾT CẤU KỸ THUẬT
// ══════════════════════════════════════════════════════════════════
function luuKetCauKT(stt, data) {
  if (!data) data = mockKetCau();
  const ss  = getSS();
  const ws  = getOrCreate(ss, SHEET_KT);
  const kt  = data.ket_cau || {};

  ws.appendRow([
    stt || (ws.getLastRow() - ROW.KT + 2),
    'KH' + String(stt||1).padStart(3,'0'),
    data.ho_ten||'', data.dia_chi||'', data.quoc_gia||'Việt Nam',
    data.so_tang||'', data.dien_tich||'', fmtSoTien(data.ngan_sach),
    kt.loai_mong||'', kt.mac_bt_mong||'', kt.thep_mong||'',
    kt.tiet_dien_cot||'', kt.mac_bt_khung||'', kt.loai_mai||'',
    kt.vat_lieu_tuong||'', kt.xu_ly_dac_thu||'', kt.luu_y_vung_mien||'',
    'Chờ phân tích', '',
  ]);
}


// ══════════════════════════════════════════════════════════════════
// KHỐI 9 — CTV AFFILIATE
// ══════════════════════════════════════════════════════════════════
function luuCTV(data) {
  if (!data) data = { ma_ctv:'CTV_TEST', utm_source:'facebook', utm_medium:'social', utm_campaign:'spring2026' };
  const ss = getSS();
  const ws = getOrCreate(ss, SHEET_CTV);
  ws.appendRow([
    data.ma_ctv||'', data.utm_source||'', data.utm_medium||'',
    data.utm_campaign||'', fmtDate(new Date()),
  ]);
  return 'Đã lưu CTV: ' + data.ma_ctv;
}


// ══════════════════════════════════════════════════════════════════
// KHỐI 10 — THỐNG KÊ DASHBOARD
// ══════════════════════════════════════════════════════════════════
function layThongKe() {
  const ss   = getSS();
  const ws   = getOrCreate(ss, SHEET_KH);
  const rows = ws.getDataRange().getValues().slice(ROW.KH - 1).filter(r => r[0]);
  const thang = new Date().getMonth() + 1;
  const stats = { tong:rows.length, moi:0, dang_tv:0, da_chot:0, da_mat:0, dt_thang:0 };

  rows.forEach(r => {
    const tt = String(r[COL_KH.TRANG_THAI-1]);
    if (tt==='Mới')          stats.moi++;
    if (tt==='Đang tư vấn')  stats.dang_tv++;
    if (tt==='Đã chốt')      stats.da_chot++;
    if (tt==='Đã mất')       stats.da_mat++;
    try {
      const ng = r[COL_KH.NGAY_TAO-1];
      if (ng && new Date(ng).getMonth()+1===thang && tt==='Đã chốt')
        stats.dt_thang += Number(r[COL_KH.DT_GOI-1])||0;
    } catch(e) {}
  });

  // HH chưa trả
  let hhChuaTra = 0;
  const wsCTV = getOrCreate(ss, SHEET_CTV);
  if (wsCTV) {
    wsCTV.getDataRange().getValues().slice(ROW.CTV-1).forEach(r => {
      if (String(r[13])==='Chưa trả') hhChuaTra += Number(r[10])||0;
    });
  }

  // Video chờ xử lý
  let videoChoXL = 0;
  const wsVid = getOrCreate(ss, SHEET_VIDEO);
  if (wsVid) {
    wsVid.getDataRange().getValues().slice(ROW.VID-1).forEach(r => {
      if (String(r[6])==='Chờ xử lý') videoChoXL++;
    });
  }

  return { ok:true, ...stats, hh_chua_tra:hhChuaTra, video_cho_xl:videoChoXL };
}


// ══════════════════════════════════════════════════════════════════
// GEMINI
// ══════════════════════════════════════════════════════════════════
function goiGeminiSinhNoiDungPDF(kh, goi_mua) {
  if (!kh) kh = mockKHArray();
  const isDesign = (goi_mua === 'Báo cáo + Bản vẽ');
  const loaiKetCau = kh[32] || kh[28] || 'Bê tông cốt thép truyền thống';
  const isSteelFrame = String(loaiKetCau).includes('Khung thép');
  const prompt = `Bạn là chuyên gia phong thủy và kỹ sư xây dựng Yohu Việt Nam.
Trả về JSON THUẦN (không markdown, không backtick).
THÔNG TIN: Họ tên:${kh[2]}, Năm sinh:${kh[6]}, Giới tính:${kh[7]}, Mệnh:${kh[8]}
Cung phi:${tinhCungPhi(kh[6],kh[7])}, Địa chỉ:${kh[5]}, Vùng miền:${kh[25]||''}
Loại CT:${kh[9]}, DT:${kh[10]}, Tầng:${kh[11]}, Ngân sách:${fmtSoTien(kh[12])} ${kh[13]||'VNĐ'}
Hướng muốn:${kh[15]}, Hướng tốt:${kh[16]}, Tiêu chuẩn:${kh[14]}, Phong cách:${kh[27]||''}
Loại kết cấu chính: ${loaiKetCau} ${isSteelFrame ? '(Sử dụng khung thép tiền chế và tấm Cemboard, chi phí tối ưu, thi công nhanh, không áp dụng đơn giá bê tông cốt thép truyền thống)' : ''}
Gói:${goi_mua}
JSON:{"phong_thuy":"300-400 từ phong thủy chi tiết","ket_cau":"200 từ kết cấu kỹ thuật phù hợp ${loaiKetCau}","tien_do":"Gantt 5 giai đoạn","du_toan":"3 phương án giá theo đơn giá ${loaiKetCau}"${isDesign?',"mat_bang":"bố trí mặt bằng","ket_cau_nang_cao":"so sánh vật liệu hệ khung thép Cemboard hoặc BTCT","ho_so_hoan_cong":"nội dung hồ sơ hoàn công mẫu"':''}}`;

  const raw = goiGemini(prompt);
  try { return JSON.parse(raw.replace(/```json|```/g,'').trim()); }
  catch(e) { return { phong_thuy:raw, ket_cau:'', tien_do:'', du_toan:'', mat_bang:'', ket_cau_nang_cao:'', ho_so_hoan_cong:'' }; }
}

function extractDriveFileId(url) {
  if (!url) return null;
  const matchId = url.match(/[-\w]{25,}/);
  if (matchId) return matchId[0];
  return null;
}

function goiGemini(prompt) {
  if (!GEMINI_KEYS || GEMINI_KEYS.length === 0) {
    return '⚠️ Chưa cấu hình Gemini key trong Script Properties';
  }
  for (const key of GEMINI_KEYS) {
    try {
      const res  = UrlFetchApp.fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-latest:generateContent?key='+key,
        { method:'post', contentType:'application/json', muteHttpExceptions:true,
          payload:JSON.stringify({ contents:[{parts:[{text:prompt}]}],
          generationConfig:{temperature:0.5,maxOutputTokens:4096} }) }
      );
      const j = JSON.parse(res.getContentText());
      if (j.error?.code===429) continue;
      const t = j.candidates?.[0]?.content?.parts?.[0]?.text;
      if (t) return t;
    } catch(e) { continue; }
  }
  return '⚠️ Hết quota Gemini';
}


// ══════════════════════════════════════════════════════════════════
// CORE HELPER — TỰ TẠO TAB + HEADER NẾU CHƯA CÓ
// ══════════════════════════════════════════════════════════════════
function getOrCreate(ss, name) {
  // Tìm bằng tên chuẩn hóa unicode (chống lỗi emoji/dấu)
  const target = name.normalize('NFC').trim().toLowerCase();
  const sheets = ss.getSheets();
  for (const sh of sheets) {
    if (sh.getName().normalize('NFC').trim().toLowerCase() === target) return sh;
  }

  // Tạo mới + ghi header
  const sh  = ss.insertSheet(name);
  const hdr = HEADERS[name];
  if (hdr && hdr.length > 0) {
    sh.getRange(1, 1, 1, hdr.length).setValues([hdr]);
    const bg = HEADER_BG[name] || '#1C2128';
    sh.getRange(1, 1, 1, hdr.length)
      .setBackground(bg).setFontColor('#FFFFFF')
      .setFontWeight('bold').setFrozenRows && sh.setFrozenRows(1);
  }
  Logger.log('Đã tạo tab mới: ' + name);
  return sh;
}


// ══════════════════════════════════════════════════════════════════
// HELPERS TÍNH TOÁN
// ══════════════════════════════════════════════════════════════════
function capNhatGoiKH(ma_kh, goi_mua, doanh_thu) {
  const ss  = getSS();
  const ws  = getOrCreate(ss, SHEET_KH);
  const all = ws.getDataRange().getValues();
  for (let i = ROW.KH-1; i < all.length; i++) {
    if (String(all[i][0]) === String(ma_kh)) {
      ws.getRange(i+1, COL_KH.GOI_MUA).setValue(goi_mua);
      ws.getRange(i+1, COL_KH.DT_GOI ).setValue(doanh_thu||0);
      break;
    }
  }
}

function tinhDuToanSoBo(dienTich, tieuChuan, minMax) {
  let m2 = 0;
  const m = String(dienTich).match(/(\d+)[xX×](\d+)/);
  if (m) m2 = parseInt(m[1]) * parseInt(m[2]);
  else m2 = parseInt(String(dienTich).replace(/[^0-9]/g,''))||0;
  if (!m2) return 'Liên hệ báo giá';
  const dg = donGiaVungMien(tieuChuan);
  return (Math.round(m2 * dg[minMax] * 1000000 / 100000000) / 10) + ' tỷ đồng';
}

function donGiaVungMien(tc) {
  const map = {
    'VN':{'min':4.5,'max':6,'label':'Đồng bằng Bắc Bộ / VN chuẩn'},
    'vietnam':{'min':4.5,'max':6,'label':'Đồng bằng Bắc Bộ'},
    'Quốc tế':{'min':6,'max':10,'label':'Tiêu chuẩn quốc tế'},
    'international':{'min':6,'max':10,'label':'Tiêu chuẩn quốc tế'},
    'other':{'min':5,'max':7,'label':'Tiêu chuẩn khác'},
  };
  return map[tc] || map['VN'];
}

function tinhCungPhi(namSinh, gioiTinh) {
  const nam = parseInt(namSinh);
  if (!nam) return 'Không xác định';
  let t = String(nam).split('').reduce((a,b)=>a+parseInt(b),0);
  while (t>9) t = String(t).split('').reduce((a,b)=>a+parseInt(b),0);
  let c = String(gioiTinh).toLowerCase().includes('nam') ? (10-t) : (5+t);
  if (c>9) c = String(c).split('').reduce((a,b)=>a+parseInt(b),0);
  if (c===5) c = String(gioiTinh).toLowerCase().includes('nam') ? 2 : 8;
  const tc = {1:'Cung Khảm 1',2:'Cung Khôn 2',3:'Cung Chấn 3',4:'Cung Tốn 4',
               6:'Cung Càn 6',7:'Cung Đoài 7',8:'Cung Cấn 8',9:'Cung Ly 9'};
  return tc[c] || 'Cung '+c;
}

function mauHopMenh(menh) {
  const map = {'Kim':'Trắng, Vàng, Bạc','Mộc':'Xanh lá, Xanh dương',
               'Thủy':'Đen, Xanh đậm','Hỏa':'Đỏ, Cam, Hồng','Thổ':'Vàng, Nâu, Be'};
  for (const [k,v] of Object.entries(map)) { if (String(menh).includes(k)) return v; }
  return '';
}

function ngayDongTho() {
  return '05/06/2026 (Giờ Thìn 7-9h), 18/06/2026 (Giờ Ngọ 11-13h), 02/07/2026 (Giờ Dần 3-5h)';
}

function thongBaoAdmin(td, ten, goi, hh) {
  try {
    MailApp.sendEmail({ to:ADMIN_EMAIL, subject:'[YOHU] '+td+' — '+ten,
      body:`KH: ${ten}\nGói: ${goi}\nHH: ${fmtSoTien(hh)}đ\nThời gian: ${new Date().toLocaleString('vi-VN')}\napp.379ai.io.vn` });
  } catch(e) { Logger.log('Email lỗi: '+e); }
}

function fmtDate(d) {
  try { return Utilities.formatDate(d instanceof Date?d:new Date(d),'Asia/Ho_Chi_Minh','dd/MM/yyyy'); }
  catch(e) { return Utilities.formatDate(new Date(),'Asia/Ho_Chi_Minh','dd/MM/yyyy'); }
}
function fmtDateFile(d) {
  try { return Utilities.formatDate(d instanceof Date?d:new Date(d),'Asia/Ho_Chi_Minh','ddMMyyyy'); }
  catch(e) { return Utilities.formatDate(new Date(),'Asia/Ho_Chi_Minh','ddMMyyyy'); }
}
function fmtSoTien(n) { return Number(n||0).toLocaleString('vi-VN'); }


// ══════════════════════════════════════════════════════════════════
// MOCK DATA — CHẠY THỦ CÔNG TRONG EDITOR
// ══════════════════════════════════════════════════════════════════
function mockKH() {
  return { id:'', ngay_tao:fmtDate(new Date()), ho_ten:'Nguyễn Test v6', so_dt:'0912345678',
    email:'test@yohu.vn', dia_chi:'Hưng Yên', nam_sinh:1985, gioi_tinh:'Nam', menh:'Đại Lâm Mộc',
    loai_ct:'Nhà mái ngói', dien_tich:'10x15', so_tang:2, ngan_sach:2000000000, don_vi:'VNĐ',
    tieu_chuan:'VN', huong_muon:'Nam', goi_mua:'Báo cáo cơ bản', ma_ctv:'CTV001',
    quoc_gia:'Việt Nam', vung_mien:'Đồng bằng Bắc Bộ', loai_dat:'tot', phong_cach:'hien_dai' };
}
function mockGD() {
  return { ho_ten:'Nguyễn Test', so_dt:'0912345678', goi_dv:'Báo cáo đầy đủ',
    so_tien:299000, ma_ctv:'CTV001', phuong_thuc:'QR Banking', ma_gd:'TXN-'+Date.now(), ma_kh:'1' };
}
function mockVideo() {
  return { ho_ten:'Nguyễn Test', so_dt:'0912345678', goi_video:'VID-01',
    so_luong:1, ma_ctv:'CTV001', kenh_giao:'Zalo', ghi_chu:'' };
}
function mockKetCau() {
  return { ho_ten:'Nguyễn Test', dia_chi:'Hưng Yên', quoc_gia:'Việt Nam',
    so_tang:2, dien_tich:'10x15', ngan_sach:2000000000,
    ket_cau:{ loai_mong:'Móng băng', mac_bt_mong:'B25', thep_mong:'D16',
              tiet_dien_cot:'25x25cm', mac_bt_khung:'B25', loai_mai:'Mái ngói 4 mái',
              vat_lieu_tuong:'Gạch đặc 220mm', xu_ly_dac_thu:'', luu_y_vung_mien:'Đồng bằng' }};
}
function mockKHArray() {
  return [1,'28/05/2026','Nguyễn Test','0912345678','test@yohu.vn','Hưng Yên',
    1985,'Nam','Đại Lâm Mộc','Nhà mái ngói','10x15',2,2000000000,'VNĐ','VN',
    'Nam','Đông Nam, Nam','Báo cáo cơ bản',0,'Mới','','','','CTV001','Việt Nam',
    'Đồng bằng Bắc Bộ','tot','hien_dai','vi','Chưa xuất','',''];
}


// ══════════════════════════════════════════════════════════════════
// HÀM TEST NHANH — BẤM RUN TRỰC TIẾP
// ══════════════════════════════════════════════════════════════════
function Test_01_LuuKhachHang()     { Logger.log(luuKhachHang(null)); }
function Test_02_LuuGiaoDich()      { Logger.log(luuGiaoDich(null)); }
function Test_03_LuuDonVideo()      { Logger.log(JSON.stringify(luuDonVideo(null))); }
function Test_04_KichHoatGoi()      { Logger.log(JSON.stringify(kichHoatGoi('1','Báo cáo đầy đủ'))); }
function Test_05_CapNhatVideo()     { Logger.log(JSON.stringify(capNhatTrangThaiVideo('1','Hoàn thành','https://drive.google.com/...'))); }
function Test_06_ThongKe()          { Logger.log(JSON.stringify(layThongKe())); }
function Test_07_GeminiSinhNDPDF()  { Logger.log(JSON.stringify(goiGeminiSinhNoiDungPDF(null,'Báo cáo đầy đủ'))); }
function Test_08_GeminiDon()        { Logger.log(goiGemini('Chào Yohu, viết 1 câu tiếng Việt ngắn.')); }
function Test_09_LuuKetCau()        { Logger.log(luuKetCauKT(99, null)); }
function Test_10_Trung_SDT() {
  // Test kiểm tra trùng SĐT — gửi 2 lần cùng SĐT
  const d = mockKH(); d.so_dt = '0999999999'; d.ho_ten = 'Lần 1';
  Logger.log(luuKhachHang(d));
  d.ho_ten = 'Lần 2 — cập nhật';
  Logger.log(luuKhachHang(d)); // Phải update dòng cũ, không tạo dòng mới
}

// ══════════════════════════════════════════════════════════════════
// MỤC 8 & MỤC 7 — HÀM TỔNG HỢP CTV & DOANH THU THÁNG
// ══════════════════════════════════════════════════════════════════

function dailyTrigger() {
  try {
    tinhDashboardThang();
    tinhTongHopCTV();
    Logger.log('Đã chạy đồng bộ Daily Trigger thành công.');
  } catch (err) {
    Logger.log('Lỗi chạy Daily Trigger: ' + err.toString());
  }
}

function layTongHopCTV() {
  try {
    const ss = getSS();
    const wsTH = getOrCreate(ss, 'Tong_Hop_CTV');
    const data = wsTH.getDataRange().getValues();
    if (data.length <= 1) {
      // Nếu rỗng, tính toán lần đầu rồi đọc lại
      tinhTongHopCTV();
      return layTongHopCTV();
    }
    const headers = data[0];
    const rows = data.slice(1);
    const result = rows.map(r => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = r[idx];
      });
      return obj;
    });
    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: err.toString() };
  }
}

function layMauThietKe() {
  try {
    const ss = getSS();
    const ws = getOrCreate(ss, 'Mau_Thiet_Ke');
    const data = ws.getDataRange().getValues();
    if (data.length <= 1) {
      return [];
    }
    const rows = data.slice(1);
    const result = rows.map((r, index) => {
      const ytRaw = String(r[5] || '').trim();
      let youtubeId = '';
      if (ytRaw) {
        if (ytRaw.includes('youtu.be/')) {
          youtubeId = ytRaw.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0] || '';
        } else if (ytRaw.includes('watch?v=')) {
          const urlParams = new URLSearchParams(ytRaw.split('?')[1] || '');
          youtubeId = urlParams.get('v') || '';
        } else if (ytRaw.includes('embed/')) {
          youtubeId = ytRaw.split('embed/')[1]?.split('?')[0]?.split('&')[0] || '';
        } else {
          youtubeId = ytRaw;
        }
      }
      return {
        id: String(r[0] || (index + 1)),
        roomType: String(r[1] || ''),
        style: String(r[2] || ''),
        element: String(r[3] || ''),
        imageUrl: String(r[4] || ''),
        youtubeId: youtubeId,
        title: String(r[6] || ''),
        note: String(r[7] || '')
      };
    }).filter(item => item.roomType || item.imageUrl);
    return result;
  } catch (err) {
    Logger.log('layMauThietKe error: ' + err.toString());
    return [];
  }
}

function tinhTongHopCTV() {
  const ss = getSS();
  const wsKH = getOrCreate(ss, SHEET_KH);
  const wsVid = getOrCreate(ss, SHEET_VIDEO);
  const wsHH = getOrCreate(ss, SHEET_HOA_HONG);
  const wsAff = getOrCreate(ss, SHEET_CTV);
  const wsTH = getOrCreate(ss, 'Tong_Hop_CTV');

  const headers = [
    'Mã CTV', 
    'Loại Đối Tác', 
    'Tổng KH Giới Thiệu', 
    'Tổng Đơn Video', 
    'Tổng Doanh Thu Mang Lại (₫)', 
    'Tổng Hoa Hồng Phát Sinh (₫)', 
    'Hoa Hồng Đã Trả (₫)', 
    'Hoa Hồng Còn Nợ (₫)', 
    'Cập Nhật Lần Cuối'
  ];

  // 1. Thu thập tất cả mã CTV từ các tab để không bỏ sót
  const dataAff = wsAff.getDataRange().getValues();
  const ctvCodes = [];
  
  for (let i = 1; i < dataAff.length; i++) {
    const code = String(dataAff[i][0] || '').trim().toUpperCase();
    if (code && ctvCodes.indexOf(code) === -1) {
      ctvCodes.push(code);
    }
  }

  const dataKH = wsKH.getDataRange().getValues();
  for (let i = ROW.KH - 1; i < dataKH.length; i++) {
    const code = String(dataKH[i][COL_KH.MA_CTV - 1] || '').trim().toUpperCase();
    if (code && ctvCodes.indexOf(code) === -1) {
      ctvCodes.push(code);
    }
  }

  const dataVid = wsVid.getDataRange().getValues();
  for (let i = ROW.VID - 1; i < dataVid.length; i++) {
    const code = String(dataVid[i][7] || '').trim().toUpperCase(); // column 8 is Mã CTV/B2B
    if (code && ctvCodes.indexOf(code) === -1) {
      ctvCodes.push(code);
    }
  }

  const dataHH = wsHH.getDataRange().getValues();
  for (let i = ROW.HH - 1; i < dataHH.length; i++) {
    const code = String(dataHH[i][2] || '').trim().toUpperCase(); // column 3 is Mã CTV/B2B
    if (code && ctvCodes.indexOf(code) === -1) {
      ctvCodes.push(code);
    }
  }

  const nowStr = fmtDate(new Date());
  const GIA_VIDEO_MAP = { 'VID-TEASER': 200000, 'VID-01': 500000, 'VID-02': 1200000, 'VID-03': 2500000 };

  // 2. Tính toán số liệu cho từng CTV
  const rowsToWrite = ctvCodes.map(code => {
    // Xác định Loại Đối Tác từ prefix mã hoặc cấu hình
    let loaiDoiTac = "CTV Thường";
    if (code.startsWith("VIP")) {
      loaiDoiTac = "B2B VIP";
    } else if (code.startsWith("B2B")) {
      loaiDoiTac = "B2B Đối Tác";
    }

    // A. Tổng khách giới thiệu & doanh thu từ Khach_Hang
    let totalKH = 0;
    let revenueKH = 0;
    for (let i = ROW.KH - 1; i < dataKH.length; i++) {
      const rowCode = String(dataKH[i][COL_KH.MA_CTV - 1] || '').trim().toUpperCase();
      if (rowCode === code) {
        totalKH++;
        revenueKH += Number(dataKH[i][COL_KH.DT_GOI - 1]) || 0;
      }
    }

    // B. Tổng đơn video & doanh thu video từ Video_DVGTGT
    let totalVideo = 0;
    let revenueVideo = 0;
    for (let i = ROW.VID - 1; i < dataVid.length; i++) {
      const rowCode = String(dataVid[i][7] || '').trim().toUpperCase();
      if (rowCode === code) {
        totalVideo++;
        const pkg = String(dataVid[i][4] || '').trim(); // cột 5 Gói Video
        const price = GIA_VIDEO_MAP[pkg] || 0;
        const qty = Number(dataVid[i][5]) || 1; // cột 6 Số lượng
        revenueVideo += price * qty;
      }
    }

    const totalRevenue = revenueKH + revenueVideo;

    // C. Hoa hồng phát sinh & đã trả/còn nợ từ HH_Video_CTV
    let totalCommission = 0;
    let commissionPaid = 0;
    for (let i = ROW.HH - 1; i < dataHH.length; i++) {
      const rowCode = String(dataHH[i][2] || '').trim().toUpperCase();
      if (rowCode === code) {
        const amt = Number(dataHH[i][5]) || 0; // cột 6 is Tiền HH (VNĐ)
        totalCommission += amt;
        const status = String(dataHH[i][7] || '').trim().toLowerCase(); // cột 8 is Trạng Thái
        if (status.includes('thanh toán') || status.includes('trả') || status.includes('có thể thanh toán')) {
          commissionPaid += amt;
        }
      }
    }

    const commissionDebt = Math.max(0, totalCommission - commissionPaid);

    return [
      code,
      loaiDoiTac,
      totalKH,
      totalVideo,
      totalRevenue,
      totalCommission,
      commissionPaid,
      commissionDebt,
      nowStr
    ];
  });

  // Ghi đè lại toàn bộ tab Tong_Hop_CTV
  wsTH.clearContents();
  wsTH.getRange(1, 1, 1, headers.length).setValues([headers]);
  wsTH.getRange(1, 1, 1, headers.length)
    .setBackground('#117A65').setFontColor('#FFFFFF')
    .setFontWeight('bold');

  if (rowsToWrite.length > 0) {
    wsTH.getRange(2, 1, rowsToWrite.length, headers.length).setValues(rowsToWrite);
  }

  Logger.log('Đã cập nhật bảng Tong_Hop_CTV: ' + rowsToWrite.length + ' CTV.');
}

function tinhDashboardThang() {
  const ss = getSS();
  const wsKH = getOrCreate(ss, SHEET_KH);
  const wsDT = getOrCreate(ss, SHEET_DT);
  const wsHH = getOrCreate(ss, SHEET_HOA_HONG);
  const wsDB = getOrCreate(ss, 'Dashboard_Doanh_Thu');

  const headers = [
    'Tháng', 'Free', 'Tiêu Chuẩn (299K)', 'Thiết Kế (1.5M)', 'Video', 'B2B', 
    'Tổng Đơn', 'Tổng Doanh Thu (₫)', 'HH Đã Trả (₫)', 'Chi Phí AI (₫)', 
    'Lợi Nhuận Ròng (₫)', '% Margin'
  ];

  function getMonthYear(dateStr) {
    try {
      if (!dateStr) return null;
      const parts = String(dateStr).split('/');
      if (parts.length >= 3) {
        return parts[1] + '/' + parts[2]; // MM/yyyy
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
      }
    } catch (e) {}
    return null;
  }

  const dataKH = wsKH.getDataRange().getValues().slice(ROW.KH - 1);
  const dataDT = wsDT.getDataRange().getValues().slice(1);
  const dataHH = wsHH.getDataRange().getValues().slice(ROW.HH - 1);

  const monthsMap = {};

  function getMonthBucket(my) {
    if (!monthsMap[my]) {
      monthsMap[my] = {
        month: my, free: 0, standard: 0, design: 0, video: 0, b2b: 0,
        totalOrders: 0, revenue: 0, commission: 0, aiCost: 0, netProfit: 0, margin: 0
      };
    }
    return monthsMap[my];
  }

  dataKH.forEach(r => {
    const dateStr = r[COL_KH.NGAY_TAO - 1];
    const my = getMonthYear(dateStr);
    if (!my) return;

    const b = getMonthBucket(my);
    const goi = String(r[COL_KH.GOI_MUA - 1] || '').toLowerCase();
    const tt = String(r[COL_KH.TRANG_THAI - 1] || '');

    if (goi.includes('free') || goi.includes('cơ bản')) {
      b.free++;
    } else if (goi.includes('tiêu chuẩn') || goi.includes('299')) {
      b.standard++;
      b.aiCost += 500;
    } else if (goi.includes('thiết kế') || goi.includes('1.5')) {
      b.design++;
      b.aiCost += 500;
    }

    if (tt === 'Đã chốt' || tt === 'Ký thầu' || tt === 'won') {
      b.revenue += Number(r[COL_KH.DT_GOI - 1]) || 0;
      b.totalOrders++;
    }
  });

  dataDT.forEach(r => {
    const dateStr = r[0];
    const my = getMonthYear(dateStr);
    if (!my) return;

    const b = getMonthBucket(my);
    const st = String(r[8] || '').toLowerCase();
    if (st.includes('thu') || st.includes('thành công') || st === '') {
      b.revenue += Number(r[4]) || 0;
      b.totalOrders++;
      const goi = String(r[3] || '').toLowerCase();
      if (goi.includes('video')) b.video++;
      else if (goi.includes('b2b')) b.b2b++;
    }
  });

  dataHH.forEach(r => {
    const dateStr = r[1];
    const my = getMonthYear(dateStr);
    if (!my) return;

    const b = getMonthBucket(my);
    const status = String(r[7] || '').trim().toLowerCase();
    if (status.includes('thanh toán') || status.includes('trả') || status.includes('có thể thanh toán')) {
      b.commission += Number(r[5]) || 0;
    }
  });

  const monthsList = Object.keys(monthsMap).sort((a, b) => {
    const pA = a.split('/');
    const pB = b.split('/');
    return new Date(Number(pA[1]), Number(pA[0])-1).getTime() - new Date(Number(pB[1]), Number(pB[0])-1).getTime();
  });

  const rowsToWrite = monthsList.map(my => {
    const b = monthsMap[my];
    b.netProfit = b.revenue - b.commission - b.aiCost;
    b.margin = b.revenue > 0 ? Math.round((b.netProfit / b.revenue) * 100) : 0;
    return [
      b.month, b.free, b.standard, b.design, b.video, b.b2b,
      b.totalOrders, b.revenue, b.commission, b.aiCost, b.netProfit, b.margin
    ];
  });

  wsDB.clearContents();
  wsDB.getRange(1, 1, 1, headers.length).setValues([headers]);
  wsDB.getRange(1, 1, 1, headers.length)
    .setBackground('#784212').setFontColor('#FFFFFF')
    .setFontWeight('bold');

  if (rowsToWrite.length > 0) {
    wsDB.getRange(2, 1, rowsToWrite.length, headers.length).setValues(rowsToWrite);
  }

  Logger.log('Đã tính toán doanh thu tháng thành công.');
}
