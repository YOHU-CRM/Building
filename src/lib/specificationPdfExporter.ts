import jsPDF from 'jspdf';
import { setbacksFor, roomsFor } from './siteGeometry';
import html2canvas from 'html2canvas';
import { UserInfo, ConstructionInfo } from '../types';
import { StructuralOption } from '../data/structuralOptions';
import { ReportSection, parseFloorArea } from './specificationGenerator';
import { 
  getBoqTemplateForOption, 
  calculateFullBOQ, 
  calculateCashflowMilestones, 
  TECHNICAL_STANDARDS_TABLE,
  REPORT_TOC_TABLE
} from '../data/boqStandards';
import { StructuralOptionKey } from './boqEngine';
import { getUnifiedEstimate } from './unifiedPricing';
import { generateArchitecturalFloorPlanSvg } from './architecturalFloorPlan';
import { computeArchitecturalLayoutModel } from './architecturalLayoutModel';
import { cleanAndNormalizeVietnameseText } from './documentFormatter';

interface ExportSpecPdfOptions {
  userInfo: UserInfo;
  constructionInfo: ConstructionInfo;
  currentOption: StructuralOption;
  sections: ReportSection[];
  fengShuiAnalysis?: any;
  lang?: string;
  onProgress?: (msg: string) => void;
}

export async function exportSpecificationToPdf({
  userInfo,
  constructionInfo,
  currentOption,
  sections,
  fengShuiAnalysis,
  lang = 'vi',
  onProgress
}: ExportSpecPdfOptions): Promise<void> {
  if (onProgress) onProgress('Đang chuẩn bị dữ liệu báo cáo kỹ thuật chuẩn A4...');

  const clientName = cleanAndNormalizeVietnameseText(userInfo?.name || 'Gia Chủ');
  const clientAddress = cleanAndNormalizeVietnameseText(userInfo?.address || 'Việt Nam');
  const birthYear = userInfo?.birthDate ? new Date(userInfo.birthDate).getFullYear() : 1979;
  const gender = userInfo?.gender || 'nam';
  const desiredDirection = userInfo?.desiredDirection || 'Nam';
  const dim = constructionInfo?.dimensions || '10x18.6';
  const floors = Math.max(1, constructionInfo?.floors || 1);
  const userBudget = constructionInfo?.totalBudget;
  const budgetUnit = constructionInfo?.budgetUnit || 'VNĐ';

  const { groundArea, widthM, lengthM } = parseFloorArea(dim);
  const sGround = groundArea;
  const dateStr = new Date().toLocaleDateString('vi-VN');

  // Master Engine calculation for option
  const optKey: StructuralOptionKey = (currentOption?.id as StructuralOptionKey) || 'PA1';
  const masterEstimate = getUnifiedEstimate({ constructionInfo, userInfo, optionKey: optKey });

  const sTotal = masterEstimate.dien_tich_san;
  const totalCostVND = masterEstimate.tong_tron_goi;
  const formattedTotalCostVND = masterEstimate.formatted_tong_tron_goi;
  const costBillion = (totalCostVND / 1000000000).toFixed(2);
  const formattedCostPerSqm = masterEstimate.formatted_suat_dau_tu_m2;

  // Architectural Layout model
  const layout = computeArchitecturalLayoutModel({
    widthM: widthM || 5,
    lengthM: lengthM || 20,
    floors,
    groundFloorArea: sGround,
    totalConstructionArea: sTotal,
    requestedBedrooms: constructionInfo?.rooms?.bedroomCount,
    requestedBathrooms: constructionInfo?.rooms?.bathroomCount,
    roomsConfig: constructionInfo?.rooms,
    fengShuiAnalysis
  });

  // Calculate full BOQ lines with regional adjustments and exact alignment
  const regionalAdjustment = {
    regionName: masterEstimate.regionName,
    overallMultiplier: masterEstimate.regionFactor,
    roughCostPerSqmRange: "3.8 - 4.5 tr/m²",
    turnkeyCostPerSqmRange: "4.8 - 6.5 tr/m²"
  };
  const lines = masterEstimate.lines;

  const cashflowMilestones = calculateCashflowMilestones(totalCostVND, currentOption.id);

  const timeEstimateWeeks = currentOption.id === 'PA1' ? '4 - 5 tuần' : currentOption.id === 'PA2' ? '12 - 16 tuần' : '6 - 8 tuần';

  // Budget comparison block
  let budgetComparisonHtml = '';
  if (userBudget && userBudget > 0) {
    const diff = totalCostVND - userBudget;
    const diffPercent = Math.round((Math.abs(diff) / userBudget) * 100);
    const isHigher = diff > 0;
    budgetComparisonHtml = `
      <div style="margin-top: 5px; margin-bottom: 5px; padding: 5px 8px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 5px; font-size: 8px; line-height: 1.4;">
        <span style="font-weight: 700; color: #166534;">📊 ĐỐI CHIẾU NGÂN SÁCH DỰ KIẾN VÀ DỰ TOÁN BOQ:</span>
        Ngân sách dự kiến: <b>${userBudget.toLocaleString('vi-VN')} ${budgetUnit}</b> | 
        Dự toán bóc tách: <b>${formattedTotalCostVND}</b> | 
        Chênh lệch: <b style="color:${isHigher ? '#b91c1c' : '#15803d'};">${isHigher ? '+' : '-'}${Math.abs(diff).toLocaleString('vi-VN')} đ (${diffPercent}%)</b>.
      </div>
    `;
  }

  // Generate architectural floor plan SVG
  const floorPlanSvg = generateArchitecturalFloorPlanSvg({
    widthM: widthM || 5,
    lengthM: lengthM || 20,
    floor: 1,
    totalFloors: floors,
    constructionType: constructionInfo?.constructionType || 'Nhà phố',
    customerName: clientName,
    showFurniture: true,
    desiredDirection: desiredDirection,
    fengShuiAnalysis,
    groundFloorArea: sGround,
    totalConstructionArea: sTotal,
    requestedBedrooms: constructionInfo?.rooms?.bedroomCount,
    requestedBathrooms: constructionInfo?.rooms?.bathroomCount,
    rooms: roomsFor(constructionInfo),
    frontSetbackM: setbacksFor(constructionInfo).front,
    backSetbackM: setbacksFor(constructionInfo).back
  });
  const floorPlanSvgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(floorPlanSvg)}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Thuyet Minh Ky Thuat Yohu Build</title>
<style>
@page { size: auto; margin: 0mm; }
  * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust: exact; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 10px; color: #1e293b; background: #fff; line-height: 1.4; }
  .pdf-page { width: 794px; height: 1123px; max-height: 1123px; padding: 20px 28px; background: #ffffff; position: relative; overflow: hidden; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; }
  
  /* Header */
  .header { background: linear-gradient(135deg, #0b1329 0%, #1e293b 100%); color: #f8fafc; padding: 12px 18px; border-radius: 7px; border-bottom: 3px solid #f59e0b; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { font-size: 9px; font-weight: 800; letter-spacing: 1.5px; color: #f59e0b; text-transform: uppercase; }
  .title { font-size: 15px; font-weight: 900; color: #ffffff; margin-top: 2px; letter-spacing: -0.3px; }
  .badge { display: inline-block; background: #f59e0b; color: #0f172a; font-weight: 800; font-size: 9px; padding: 2px 9px; border-radius: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.15); font-size: 8.5px; color: #cbd5e1; }
  
  /* Sections */
  .section { margin-top: 8px; }
  .section-title { font-size: 10.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .section-title::before { content: ""; display: inline-block; width: 4px; height: 11px; background: #f59e0b; border-radius: 2px; }

  /* Info Grid */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; }
  .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 5px; }
  .cell { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 4px 7px; }
  .cell-label { font-size: 7.5px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
  .cell-value { font-size: 9.5px; font-weight: 700; color: #0f172a; margin-top: 1px; }

  /* Content Cards */
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 5px 8px; font-size: 8.5px; line-height: 1.4; }
  .card-gold { background: #fffbeb; border: 1px solid #fde68a; border-radius: 5px; padding: 5px 8px; }
  .card-blue { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 5px; padding: 5px 8px; }
  
  /* Tables */
  .table-custom { width: 100%; border-collapse: collapse; margin-top: 3px; font-size: 8px; }
  .table-custom th { background: #0f172a; color: #f8fafc; padding: 3.5px 5px; text-align: left; font-weight: 700; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.3px; }
  .table-custom td { padding: 3px 5px; border-bottom: 1px solid #e2e8f0; color: #334155; }
  .table-custom tr:nth-child(even) { background: #f8fafc; }
  .table-custom .col-num { text-align: center; width: 22px; font-weight: 700; }
  .table-custom .col-right { text-align: right; }
  
  /* Footer */
  .footer { margin-top: auto; padding-top: 6px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 7.5px; color: #64748b; }
  .signature-box { display: flex; justify-content: space-between; margin-top: 5px; padding: 5px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; }
  .sign-col { text-align: center; width: 45%; }
  .sign-role { font-weight: 700; color: #0f172a; font-size: 8.5px; text-transform: uppercase; }
  .sign-space { height: 32px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-style: italic; font-size: 7.5px; }
  .sign-name { font-weight: 700; color: #1e293b; font-size: 9px; }
</style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="pdf-page">
    <div>
      <div class="header">
        <div class="header-top">
          <div>
            <div class="brand">Yohu Build AI · Hồ Sơ Kỹ Thuật Chi Tiết</div>
            <div class="title">THUYẾT MINH KIẾN TRÚC – KẾT CẤU & PHONG THỦY</div>
          </div>
          <div class="badge">${currentOption.id} · Chuẩn TCVN</div>
        </div>
        <div class="meta-bar">
          <div><b>Chủ đầu tư:</b> ${clientName} (${clientAddress})</div>
          <div><b>Quy mô:</b> ${floors} Tầng · S=${sGround}m² (Tổng ${Math.round(sTotal)}m²)</div>
          <div><b>Ngân sách:</b> ${userBudget ? `${userBudget.toLocaleString('vi-VN')} ${budgetUnit}` : 'Theo dự toán'}</div>
          <div><b>Ngày xuất:</b> ${dateStr}</div>
        </div>
      </div>

      <!-- Section 1: Thông tin công trình & Phương án -->
      <div class="section">
        <div class="section-title">1. Thông Tin Tổng Quan & Quy Mô Xây Dựng</div>
        <div class="grid-4">
          <div class="cell"><div class="cell-label">Loại Công Trình</div><div class="cell-value">${constructionInfo?.constructionType || 'Nhà phố dân dụng'}</div></div>
          <div class="cell"><div class="cell-label">Kích Thước Khu Đất</div><div class="cell-value">${dim}</div></div>
          <div class="cell"><div class="cell-label">Quy Mô Tầng</div><div class="cell-value">${floors} Tầng</div></div>
          <div class="cell"><div class="cell-label">Địa Điểm / Khu Vực</div><div class="cell-value">${regionalAdjustment.regionName}</div></div>
        </div>
      </div>

      <!-- BẢNG MỤC LỤC VĂN BẢN (10 CHƯƠNG MỤC) - YÊU CẦU CỦA KHÁCH HÀNG -->
      <div class="section">
        <div class="section-title">📋 Bảng Mục Lục Văn Bản (10 Chương Mục Thuyết Minh)</div>
        <table class="table-custom">
          <thead>
            <tr>
              <th style="width:45px; text-align:center;">Mục</th>
              <th style="width:170px;">Tên Chương Mục</th>
              <th>Nội Dung Trọng Tâm & Pháp Lý Nghiệm Thu</th>
              <th style="width:130px;">Tiêu Chuẩn Áp Dụng</th>
              <th style="width:45px; text-align:center;">Vị Trí</th>
            </tr>
          </thead>
          <tbody>
            ${REPORT_TOC_TABLE.map(toc => `
              <tr>
                <td style="text-align:center; font-weight:700; color:#b91c1c;">${toc.romanNumber}</td>
                <td><b>${toc.title}</b></td>
                <td style="font-size:7.5px; color:#475569;">${toc.keyFocus}</td>
                <td style="font-size:7.5px; color:#0369a1; font-weight:600;">${toc.standardsApplied}</td>
                <td style="text-align:center; font-weight:700; color:#0f172a;">${toc.pageReference}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Section 2: So sánh & Lựa chọn kết cấu -->
      <div class="section">
        <div class="section-title">2. Phương Án Kết Cấu Lựa Chọn: ${currentOption.name}</div>
        <div class="card-gold">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2px;">
            <b style="font-size:9.5px; color:#b45309;">Mã Giải Pháp: ${currentOption.id} — ${currentOption.shortDescription}</b>
            <span style="font-size:8.5px; font-weight:700; color:#0f172a;">Thời gian thi công: ~${timeEstimateWeeks} tuần</span>
          </div>
          <div style="font-size:8.5px; color:#334155; line-height:1.35;">
            <b>Đặc tính kỹ thuật chính:</b> ${currentOption.highlights.join(' · ')}
          </div>
        </div>
      </div>

      <!-- Section 3: Căn cứ thiết kế & Tiêu chuẩn pháp lý -->
      <div class="section">
        <div class="section-title">3. Căn Cứ Pháp Lý & Tiêu Chuẩn Kỹ Thuật Áp Dụng</div>
        <div class="card" style="font-size:8.5px; line-height:1.4;">
          • <b>TCVN 5574:2018:</b> Thiết kế kết cấu bê tông và bê tông cốt thép toàn khối.<br/>
          • <b>QCVN 06:2022/BXD:</b> Quy chuẩn kỹ thuật quốc gia về An toàn cháy cho nhà và công trình.<br/>
          • <b>TCVN 2737:2020:</b> Tải trọng và tác động (áp lực gió khu vực, hoạt tải sử dụng sàn tiêu chuẩn).<br/>
          • <b>TCVN 9362:2012:</b> Tiêu chuẩn thiết kế nền nhà và công trình xây dựng dân dụng.
        </div>
      </div>

      <!-- Section 4: Phong thủy Bát Trạch & Thước Lỗ Ban -->
      <div class="section">
        <div class="section-title">4. Định Hướng Phong Thủy Bát Trạch & Thước Lỗ Ban 52.2cm</div>
        <div class="card-blue">
          <div class="grid-2" style="margin-bottom:2px;">
            <div><b>Gia chủ:</b> ${clientName} (Năm sinh: ${birthYear} - Giới tính: ${gender.toUpperCase()})</div>
            <div><b>Hướng đất:</b> <span style="color:#0284c7; font-weight:700;">${desiredDirection}</span></div>
          </div>
          <div style="font-size:8.5px; color:#1e293b; line-height:1.35;">
            • <b>Cửa chính (Minh Đường):</b> Rộng 810mm × Cao 2120mm (Cung Tiến Bảo / Phú Quý).<br/>
            • <b>Cửa phòng ngủ & WC:</b> Cửa phòng ngủ 810x2120mm, cửa WC 690x1980mm chuẩn Lỗ Ban 52.2cm.<br/>
            • <b>Bếp nấu (Táo Quân):</b> Tọa Hung Hướng Cát, không đối diện trực tiếp cửa vệ sinh.<br/>
            ${floors > 1 ? '• <b>Cầu thang:</b> Tổng 21 bậc rơi trọn vào cung SINH theo chu kỳ Sinh - Lão - Bệnh - Tử.<br/>' : '• <b>Giao thông & Thang gác mái:</b> Mặt bằng 1 tầng thông thoáng; ứng dụng Thang gác mái thông minh âm trần đóng mở tự động (khi đóng phẳng khít đồng màu trần, không chiếm diện tích sàn sinh hoạt).<br/>'}
            • <b>Bàn thờ tâm linh:</b> Kích thước 1270 × 610 × 1270 mm chuẩn thước Lỗ Ban 38.8cm (Cung Tiến Bảo).
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Page 1 -->
    <div class="footer">
      <div>Hồ sơ kỹ thuật Yohu Build AI · Trang 1/5</div>
      <div>Xác thực tiêu chuẩn TCVN & Bát Trạch 2026</div>
    </div>
  </div>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="pdf-page">
    <div>
      <div class="header" style="padding: 10px 18px;">
        <div class="header-top">
          <div>
            <div class="brand">Phần Kỹ Thuật Chuyên Sâu · Trang 2</div>
            <div class="title" style="font-size: 15px;">THUYẾT MINH GIẢI PHÁP KẾT CẤU & HỆ THỐNG M&E</div>
          </div>
          <div class="badge">${currentOption.name}</div>
        </div>
      </div>

      <!-- Section 5: Giải pháp Móng & Khung kèm Cảnh Báo Địa Chất -->
      <div class="section">
        <div class="section-title">5. Thuyết Minh Giải Pháp Nền Móng & Khung Chịu Lực</div>
        <div style="padding: 4px 7px; background: #fef2f2; border: 1px solid #f87171; border-radius: 5px; font-size: 8px; color: #991b1b; line-height: 1.35; margin-bottom: 4px;">
          <b>⚠️ CẢNH BÁO KỸ THUẬT VỀ ĐỊA CHẤT:</b> Phác thảo kết cấu móng dưới đây là giả định sơ bộ dựa trên điều kiện đất tốt trung bình của địa phương — Chủ đầu tư bắt buộc phải khảo sát địa chất thực tế tại hiện trường công trình trước khi chế tạo bản vẽ thi công chính thức để đảm bảo tính an toàn chịu lực.
        </div>
        <div class="grid-2">
          <div class="cell">
            <div class="cell-label">Phần Ngầm & Nền Móng</div>
            <div class="cell-value" style="font-size:9px; font-weight:600; color:#334155; margin-top:2px;">
              Móng đơn / móng băng chịu lực BTCT mác M250 chôn sâu ổn định, liên kết chặt chẽ bằng đà kiềng khung chống sụt lún và lún lệch góc nhà.
            </div>
          </div>
          <div class="cell">
            <div class="cell-label">Cột - Dầm - Sàn Chịu Lực</div>
            <div class="cell-value" style="font-size:9px; font-weight:600; color:#334155; margin-top:2px;">
              Hệ thống cột dầm khung chịu lực đồng bộ mác bê tông M250 trở lên, cốt thép cường độ chuẩn CB400-V đan so le liên kết cứng toàn khối.
            </div>
          </div>
        </div>
      </div>

      <!-- Section 6: Giải pháp Tường, Cách Âm & Chống Cháy -->
      <div class="section">
        <div class="section-title">6. Giải Pháp Bao Che, Cách Âm, Cách Nhiệt & Phòng Cháy</div>
        <div class="card" style="font-size:8.5px; line-height:1.4;">
          • <b>Tường bao che &amp; vách ngăn:</b> ${currentOption.id === 'PA3' ? 'Vách bê tông nhẹ EPS đúc liền khuôn gông 3D dày 12-15cm, chống thấm dột hướng mưa bão cực tốt và không co ngót rạn nứt.' : currentOption.id === 'PA2' ? 'Khung cột thép dầm chịu lực H/I liên kết sàn nhẹ Cemboard SCG Thái Lan chống co móp nứt bề mặt.' : 'Xây tường gạch tuynel nung đỏ dày 220mm bao ngoài ngăn thấm ẩm mặt trước, trát vữa mác M75 mịn màng phẳng bóng.'}<br/>
          • <b>Chỉ số cách âm STC:</b> Đạt từ 42dB - 48dB, giảm thiểu tối đa tiếng ồn sinh hoạt nội khu và tác động xe cộ ngoài phố.<br/>
          • <b>Khả năng chống cháy chịu lửa:</b> Đạt chuẩn EI120 (chống sập vách, chịu nhiệt lên đến 120 phút liên tục) theo đúng Quy chuẩn QCVN 06:2022/BXD.<br/>
          • <b>Chống thấm sàn WC &amp; Chân tường (${floors === 1 ? 'Nhà 1 tầng' : 'Sàn tầng & Mái'}):</b> ${floors === 1 ? 'Quét màng đàn hồi SikaTop Seal 107 dán lưới thủy tinh bo chân tường cao 30cm nhằm ngăn chặn triệt để hiện tượng ẩm mao dẫn ngấm ngang sang phòng ngủ/khách liền kề.' : 'Vách WC & Sàn ẩm được xử lý quét màng chống thấm polyme 2 thành phần đàn hồi cao SikaTop Seal 107 dán lưới thủy tinh gia cường bo chân tường cao 30cm, nghiệm thu ngâm thử nước 48h tuyệt đối không rò rỉ.'}
        </div>
      </div>

      <!-- Section 7: Hệ thống Cơ Điện M&E -->
      <div class="section">
        <div class="section-title">7. Thiết Kế Hệ Thống Kỹ Thuật Điện – Nước (M&E) & Không Gian Kỹ Thuật Trần</div>
        <div class="grid-2">
          <div class="cell">
            <div class="cell-label">Hệ Thống Điện An Toàn & Khí Tươi</div>
            <div class="cell-value" style="font-size:8.5px; font-weight:500; color:#334155; margin-top:2px;">
              Dây đồng mềm Cadisun âm tường luồn ống cứng SP chống cháy, Aptomat RCBO chống giật. Dự phòng không gian trần cho máy lọc khí tươi tổng hồi nhiệt ERV và tủ điều khiển Smart Home.
            </div>
          </div>
          <div class="cell">
            <div class="cell-label">Cấp Thoát Nước & Cụm Lọc - Bồn Nước Trần</div>
            <div class="cell-value" style="font-size:8.5px; font-weight:500; color:#334155; margin-top:2px;">
              Ống PPR hàn nhiệt PN16, thoát uPVC Tiền Phong i=2%. Gác kỹ thuật trần/mái quy hoạch chịu lực cho bồn Inox, máy lọc nước tổng đầu nguồn và cụm nóng điều hòa có cửa chớp louver giải nhiệt.
            </div>
          </div>
        </div>
      </div>

      <!-- Section 8: Quy trình Giám Sát -->
      <div class="section">
        <div class="section-title">8. Quy Trình Thi Công & Giám Sát Nghiệm Thu Kỹ Thuật</div>
        <div class="card-gold" style="font-size:8.5px; line-height:1.4;">
          <b>Nghiệm thu 5 chặng then chốt:</b> (1) Tim mốc & Hố móng; (2) Cốt thép móng & Giằng chân cột; (3) Cốt thép cột dầm sàn trước khi đổ bê tông; (4) Thử áp lực ống nước ngầm & Chống thấm sàn 48h; (5) Nghiệm thu thẩm mỹ bàn giao đưa vào sử dụng.
        </div>
      </div>
    </div>

    <!-- Footer Page 2 -->
    <div class="footer">
      <div>Hồ sơ kỹ thuật Yohu Build AI · Trang 2/5</div>
      <div>Bảo hành kết cấu 10 năm · Chống thấm 03 năm</div>
    </div>
  </div>

  <!-- ==================== PAGE 3 ==================== -->
  <div class="pdf-page">
    <div>
      <div class="header" style="padding: 10px 18px;">
        <div class="header-top">
          <div>
            <div class="brand">Phần Dự Toán Khối Lượng · Trang 3</div>
            <div class="title" style="font-size: 15px;">BẢNG DỰ TOÁN KHỐI LƯỢNG BOQ MỞ RỘNG (KÈM ĐƠN GIÁ & THÀNH TIỀN)</div>
          </div>
          <div class="badge">S=${sGround}m² · ${floors} Tầng</div>
        </div>
      </div>

      <!-- Section 9: Bảng BOQ Kèm Đơn Giá và Thành Tiền -->
      <div class="section">
        <div class="section-title">9. Bóc Tách Khối Lượng Vật Tư – Nhân Công Kèm Đơn Giá Thị Trường</div>
        
        <!-- REGIONAL PRICE ADJUSTMENT MARKET BANNER -->
        <div style="margin-bottom: 5px; padding: 5px 8px; background: #eff6ff; border: 1px solid #93c5fd; border-radius: 5px; font-size: 8px; color: #1e3a8a; line-height: 1.35; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <b>📍 ĐIỀU CHỈNH GIÁ THỊ TRƯỜNG KHU VỰC:</b> <span>${regionalAdjustment.regionName} (Hệ số: x${regionalAdjustment.overallMultiplier})</span><br/>
            <span>Mặt bằng đơn giá khu vực: Xây thô ${regionalAdjustment.roughCostPerSqmRange} · Trọn gói ${regionalAdjustment.turnkeyCostPerSqmRange}</span>
          </div>
          <div style="text-align: right; font-weight: 700; color: #1d4ed8;">
            Đơn giá tính toán: ${formattedCostPerSqm}
          </div>
        </div>

        ${budgetComparisonHtml}

        <!-- GIẢI TRÌNH DIỆN TÍCH SỬ DỤNG VS DIỆN TÍCH XÂY DỰNG -->
        <div style="margin-top: 4px; margin-bottom: 5px; padding: 6px 10px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 5px; font-size: 8px; line-height: 1.4; color: #78350f;">
          <b>📐 GIẢI TRÌNH DIỆN TÍCH THI CÔNG CHI TIẾT (Tránh hiểu nhầm về hao hụt diện tích):</b><br/>
          • <b>Diện tích sàn sử dụng thực tế (thông thủy sàn trệt):</b> <b>${sGround} m²</b> (Toàn bộ phần diện tích sử dụng bên trong các phòng chức năng sinh hoạt hàng ngày).<br/>
          • <b>Diện tích quy đổi kết cấu móng &amp; hạ tầng kỹ thuật (Hệ số quy đổi 30%):</b> <b>${(sGround * 0.3).toFixed(1)} m²</b> (Quy đổi chi phí đào đắp móng, bê tông lót, bê tông móng băng/móng cọc ngầm, cốp pha ngầm và hệ thống bể tự hoại bảo vệ nền nhà không lún lệch).<br/>
          • <b>Tổng diện tích sàn tính toán dự toán (BOQ trọn gói):</b> ${sGround} m² + ${(sGround * 0.3).toFixed(1)} m² = <b>${Math.round(sTotal)} m²</b>. Đây là diện tích chuẩn được áp dụng để tính toán chính xác tuyệt đối định mức vật liệu &amp; nhân công, đảm bảo tính minh bạch tối đa cho Chủ đầu tư.
        </div>

        <table class="table-custom" style="font-size: 6.8px; line-height: 1.2;">
          <thead>
            <tr>
              <th class="col-num" style="width:20px;">STT</th>
              <th style="width:190px;">Hạng Mục Vật Tư / Nhân Công</th>
              <th style="width:25px; text-align:center;">ĐVT</th>
              <th style="width:70px; text-align:right;">Khối Lượng</th>
              <th style="width:60px; text-align:right;">Đơn Giá</th>
              <th style="width:65px; text-align:right;">Vật Tư</th>
              <th style="width:60px; text-align:right;">Nhân Công</th>
              <th style="width:70px; text-align:right;">Thành Tiền</th>
              <th>Ghi Chú Kỹ Thuật / Chi Tiết Ứng Dụng</th>
            </tr>
          </thead>
          <tbody>
            ${lines.map((line, idx) => `
              <tr>
                <td class="col-num">${idx + 1}</td>
                <td><b>${cleanAndNormalizeVietnameseText(line.item.name)}</b><br/><span style="font-size:6px; color:#475569;">${cleanAndNormalizeVietnameseText(line.spec || '')}</span></td>
                <td style="text-align:center;">${line.item.unit}</td>
                <td class="col-right" style="font-weight:600; color:#0f172a;">${line.formattedQuantity}</td>
                <td class="col-right" style="color:#475569;">${line.unitPrice.toLocaleString('vi-VN')} đ</td>
                <td class="col-right" style="color:#047857;">${Math.round(line.materialAmount || 0).toLocaleString('vi-VN')} đ</td>
                <td class="col-right" style="color:#b45309;">${Math.round(line.laborAmount || 0).toLocaleString('vi-VN')} đ</td>
                <td class="col-right" style="font-weight:700; color:#0f172a;">${line.formattedTotalAmount}</td>
                <td style="font-size: 6.2px; color: #475569;">
                  <i>${cleanAndNormalizeVietnameseText(line.item.clientExplanation)}</i><br/>
                  <span style="color: #0284c7;">Ref: ${cleanAndNormalizeVietnameseText(line.item.technicalNote)}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <!-- Tổng dự toán BOQ & Bóc tách Khoán Nhân Công -->
        <div style="margin-top: 5px; padding: 7px 10px; background: #0f172a; color: #ffffff; border-radius: 5px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 5px; margin-bottom: 5px;">
            <div>
              <div style="font-size: 8px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">1. TỔNG TRỌN GÓI CHÌA KHÓA TRAO TAY (Vật tư + Thiết bị + Nhân công)</div>
              <div style="font-size: 8px; color: #f59e0b; margin-top: 1px;">Quy mô: ${Math.round(sTotal)} m² sàn xây dựng (${floors} tầng) · Đơn giá trọn gói: ${formattedCostPerSqm}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 13px; font-weight: 900; color: #f59e0b;">${formattedTotalCostVND}</div>
              <div style="font-size: 7.5px; color: #94a3b8;">(~ ${costBillion} tỷ VNĐ)</div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 8px; line-height: 1.3;">
            <div>
              <span style="color: #38bdf8; font-weight: 700;">2. PHƯƠNG ÁN GIA CHỦ TỰ MUA VẬT TƯ (KHOÁN NHÂN CÔNG):</span><br/>
              <span style="color: #cbd5e1;">- Khấu trừ Vật tư & Thiết bị gia chủ mua: <b>${masterEstimate.formatted_tong_vat_tu_thiet_bi}</b></span><br/>
              <span style="color: #4ade80;">- Chi phí KHOÁN NHÂN CÔNG THI CÔNG & GIÁM SÁT: <b>${masterEstimate.formatted_tong_khoan_nhan_cong}</b> (${masterEstimate.formatted_suat_khoan_nhan_cong_m2})</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Page 3 -->
    <div class="footer">
      <div>Hồ sơ kỹ thuật Yohu Build AI · Trang 3/5</div>
      <div>Đơn giá bám sát thực tế thị trường xây dựng 2026</div>
    </div>
  </div>

  <!-- ==================== PAGE 4 ==================== -->
  <div class="pdf-page">
    <div>
      <div class="header" style="padding: 10px 18px;">
        <div class="header-top">
          <div>
            <div class="brand">Kế Hoạch Tài Chính & Giải Ngân · Trang 4</div>
            <div class="title" style="font-size: 15px;">DÒNG TIỀN THANH TOÁN & TIÊU CHUẨN NGHIỆM THU VẬT TƯ</div>
          </div>
          <div class="badge">An Toàn Tài Chính</div>
        </div>
      </div>

      <!-- Kế hoạch dòng tiền giải ngân theo tuần -->
      <div class="section" style="margin-top: 5px;">
        <div class="section-title">💰 Kế Hoạch Dòng Tiền & Lộ Trình Giải Ngân Theo Tuần (Biên an toàn +20%)</div>
        <table class="table-custom">
          <thead>
            <tr>
              <th style="width:25px; text-align:center;">Đợt</th>
              <th style="width:145px;">Tiến độ & Thời gian (Tuần)</th>
              <th style="width:40px; text-align:center;">Tỷ lệ</th>
              <th style="width:85px; text-align:right;">Số tiền</th>
              <th>Điều kiện nghiệm thu kích hoạt thanh toán</th>
            </tr>
          </thead>
          <tbody>
            ${cashflowMilestones.map(m => `
              <tr>
                <td style="text-align:center; font-weight:700;">${m.stage}</td>
                <td><b>${m.phaseName}</b> <span style="font-size:7.5px; color:#d97706;">(${m.timeframe})</span></td>
                <td style="text-align:center; font-weight:700;">${m.percentage}%</td>
                <td class="col-right" style="font-weight:700; color:#15803d;">${m.formattedAmount}</td>
                <td style="font-size:7.5px; color:#475569;">${m.triggerCondition} <br/> <span style="color:#d97706; font-style:italic;">👉 HD: ${m.homeownerAction}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- WEATHER RISK PROGRESS WARNING -->
        <div style="margin-top: 6px; padding: 5px 10px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 5px; font-size: 8px; color: #991b1b; line-height: 1.4;">
          ⚠️ <b>CẢNH BÁO RỦI RO THỜI TIẾT &amp; TIẾN ĐỘ THỰC TẾ:</b> Tiến độ hoàn thành thực tế từng hạng mục công việc đã được chúng tôi chủ động cộng thêm <b>20% biên thời gian dự phòng</b> chống trễ nải. Tuy nhiên, thời gian bàn giao thực tế vẫn có thể dao động tùy thuộc vào các điều kiện thời tiết bất lợi cực đoan (mưa lớn kéo dài liên tục, bão lũ thiên tai, ngập lụt vùng miền) hoặc sự kiện bất khả kháng tại địa phương thi công. Kính mong Quý chủ đầu tư lưu ý sắp xếp kế hoạch tài chính và chuẩn bị mặt bằng phù hợp.
        </div>
      </div>

      <!-- Section 10: Bảng tra TCVN vật tư -->
      <div class="section" style="margin-top: 10px;">
        <div class="section-title">10. Bảng Tra Tiêu Chuẩn Kỹ Thuật (TCVN/QCVN) & Nguyên Tắc Vật Liệu</div>
        <table class="table-custom">
          <thead>
            <tr>
              <th style="width:130px;">Hạng mục / Cấu kiện</th>
              <th>Tiêu chuẩn kỹ thuật TCVN</th>
              <th style="width:180px;">Ghi chú nghiệm thu</th>
            </tr>
          </thead>
          <tbody>
            ${TECHNICAL_STANDARDS_TABLE.slice(0, 4).map(t => `
              <tr>
                <td><b>${t.item}</b></td>
                <td>${t.standardCode}</td>
                <td style="color:#0284c7; font-weight:600;">${t.notes}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="font-size: 7.5px; color: #64748b; margin-top: 4px; font-style: italic;">
          * Nguyên tắc ghi vật tư: Thương hiệu (Hòa Phát, Viglacera, Dulux, Xingfa...) luôn mang tính chất gợi ý định hướng theo phân khúc kèm cụm "hoặc tương đương", không cấu thành cam kết bắt buộc khi chưa có phụ lục hợp đồng.
        </div>
      </div>
    </div>

    <!-- Footer Page 4 -->
    <div class="footer">
      <div>Hồ sơ kỹ thuật Yohu Build AI · Trang 4/5</div>
      <div>Đơn giá bám sát thực tế thị trường xây dựng 2026</div>
    </div>
  </div>

  <!-- ==================== PAGE 5 ==================== -->
  <div class="pdf-page">
    <div>
      <div class="header" style="padding: 10px 18px;">
        <div class="header-top">
          <div>
            <div class="brand">Bản Vẽ Kiến Trúc Sơ Phác · Trang 5</div>
            <div class="title" style="font-size: 15px;">SƠ ĐỒ MẶT BẰNG KIẾN TRÚC & PHÂN KHU CÔNG NĂNG</div>
          </div>
          <div class="badge">Bản In Độ Nét Cao · Tỉ Lệ 1:100</div>
        </div>
      </div>

      <!-- Section 11: Bản vẽ mặt bằng SVG & Cân Đối Diện Tích -->
      <div class="section">
        <div class="section-title">11. Mặt Bằng Kiến Trúc Sơ Phác (Đồng bộ số liệu phòng & cửa với BOQ)</div>
        <div style="text-align: center; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <img src="${floorPlanSvgDataUrl}" style="max-width: 100%; height: 470px; object-fit: contain;" />
        </div>
        
        <!-- Bảng giải trình cân đối diện tích (Lỗi 7 fix) -->
        <div style="margin-top: 5px; padding: 5px 8px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 5px; font-size: 8px; color: #334155; line-height: 1.4;">
          <b>📐 BẢNG CÂN ĐỐI DIỆN TÍCH MẶT BẰNG:</b> ${layout.balanceExplanation}
        </div>

        <div style="margin-top: 4px; padding: 5px 8px; background: #fffbeb; border: 1px solid #d97706; border-radius: 5px; font-size: 8px; color: #78350f; line-height: 1.4;">
          <b>⚡ THÔNG BÁO KỸ THUẬT:</b> Sơ đồ trên thể hiện ý tưởng phân khu công năng &amp; hướng Bát Trạch sơ phác. Toàn bộ hồ sơ bản vẽ thiết kế thi công chi tiết (AutoCAD kiến trúc, kết cấu móng, cột dầm sàn, điện nước MEP) sẽ được đội ngũ kỹ sư thẩm định và bàn giao cho Quý khách hàng trong vòng 24 giờ làm việc.
        </div>
      </div>

      <!-- Section 12: Chữ ký & Disclaimer -->
      <div class="section" style="margin-top: 6px;">
        <div class="signature-box">
          <div class="sign-col">
            <div class="sign-role">ĐẠI DIỆN CHỦ ĐẦU TƯ</div>
            <div class="sign-space">(Ký & Ghi rõ họ tên)</div>
            <div class="sign-name">${clientName}</div>
          </div>
          <div class="sign-col">
            <div class="sign-role">ĐƠN VỊ LẬP HỒ SƠ (YOHU BUILD AI)</div>
            <div class="sign-space" style="color:#0284c7; font-weight:700;">HỒ SƠ THIẾT KẾ SƠ BỘ TỰ ĐỘNG</div>
            <div class="sign-name">HỆ THỐNG YOHU BUILD AI ENGINE</div>
          </div>
        </div>
        <div style="margin-top: 4px; font-size: 7.5px; color: #94a3b8; text-align: center; font-style: italic;">
          * Ghi chú: Thuyết minh và dự toán được tính toán tự động bằng AI phục vụ công tác lập kế hoạch ban đầu. Cần kỹ sư có chứng chỉ hành nghề thẩm định trước khi triển khai thi công.
        </div>
      </div>
    </div>

    <!-- Footer Page 5 -->
    <div class="footer">
      <div>Hồ sơ kỹ thuật Yohu Build AI · Trang 5/5 (Hoàn tất)</div>
      <div>Bản quyền thiết kế thuộc Yohu Build & Gia chủ</div>
    </div>
  </div>

</body>
</html>
  `;

  // Render to PDF using exact 794x1123 canvas and 210x297mm A4 sizing
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pages = container.querySelectorAll('.pdf-page');

    for (let i = 0; i < pages.length; i++) {
      if (onProgress) onProgress(`Đang xử lý trang ${i + 1}/${pages.length} chuẩn in A4 sắc nét...`);
      const pageEl = pages[i] as HTMLElement;
      
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    const cleanName = clientName.replace(/[^a-zA-Z0-9_]/g, '_');
    pdf.save(`Thuyet_Minh_Ky_Thuat_${cleanName}_${currentOption.id}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
