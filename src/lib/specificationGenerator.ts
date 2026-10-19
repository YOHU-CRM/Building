import { STRUCTURAL_OPTIONS, StructuralOption } from '../data/structuralOptions';
import { 
  calculateCashflowMilestones,
  MATERIAL_LEAD_TIME_SCHEDULE,
  SITE_LOGISTICS_GUIDELINE,
  HIDDEN_WORK_INSPECTION_PROTOCOL,
  SYSTEM_BOQ_TEMPLATE, 
  TECHNICAL_STANDARDS_TABLE, 
  MATERIAL_BRANDING_DISCLAIMER 
} from '../data/boqStandards';
import { StructuralOptionKey } from './boqEngine';
import { getUnifiedEstimate } from './unifiedPricing';
import { UserInfo, ConstructionInfo, FengShuiAnalysis } from '../types';
import { cleanAndNormalizeVietnameseText } from './documentFormatter';
import { computeArchitecturalLayoutModel, ArchitecturalLayoutModel } from './architecturalLayoutModel';

export interface ReportSection {
  id: string; // 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | 'X'
  title: string;
  content: string;
  isSelected: boolean;
  isGenerating?: boolean;
  isCompleted?: boolean;
  error?: string;
}

export const REPORT_SECTIONS_META = [
  { id: 'I', title: 'I. THÔNG TIN CHUNG & CĂN CỨ THIẾT KẾ' },
  { id: 'II', title: 'II. KIẾN TRÚC MẶT TIỀN & HÌNH KHỐI' },
  { id: 'III', title: 'III. GIẢI PHÁP KẾT CẤU (NỀN MÓNG, KHUNG, SÀN, MÁI)' },
  { id: 'IV', title: 'IV. BỐ TRÍ CÔNG NĂNG MẶT BẰNG TRỆT' },
  { id: 'V', title: 'V. BỐ TRÍ KHÔNG GIAN LẦU & MÁI CÔNG TRÌNH' },
  { id: 'VI', title: 'VI. HỆ THỐNG KỸ THUẬT ĐIỆN – NƯỚC – AN TOÀN (M&E)' },
  { id: 'VII', title: 'VII. BẢNG BÓC TÁCH VẬT TƯ – NHÂN CÔNG (BOQ MỞ RỘNG)' },
  { id: 'VIII', title: 'VIII. BẢNG TRA TIÊU CHUẨN XÂY DỰNG (TCVN/QCVN) CỐ ĐỊNH & THƯƠNG HIỆU VẬT TƯ' },
  { id: 'IX', title: 'IX. GÓC NHÌN PHONG THỦY BÁT TRẠCH CHUYÊN SÂU GIA CHỦ' },
  { id: 'X', title: 'X. GHI CHÚ THI CÔNG, GIÁM SÁT VÀ AN TOÀN LAO ĐỘNG' }
];

// Helper to parse numeric floor area and dimensions from dimensions string
export function parseFloorArea(dimensionsStr?: string): { groundArea: number; totalArea: number; widthM: number; lengthM: number } {
  if (!dimensionsStr) return { groundArea: 100, totalArea: 200, widthM: 5, lengthM: 20 };
  
  const clean = dimensionsStr.toLowerCase().replace(/m2|m²|mét vuông/g, '').trim();

  // Try matching e.g. "5x20", "5m x 20m", "5 * 20"
  const multiplyMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:m)?\s*[xX*]\s*(\d+(?:\.\d+)?)/);
  if (multiplyMatch) {
    const w = parseFloat(multiplyMatch[1]);
    const l = parseFloat(multiplyMatch[2]);
    if (!isNaN(w) && !isNaN(l) && w > 0 && l > 0) {
      const g = Math.round(w * l);
      return { groundArea: g, totalArea: g * 2, widthM: w, lengthM: l };
    }
  }

  const numberMatch = clean.match(/(\d+(?:\.\d+)?)/);
  if (numberMatch) {
    const val = parseFloat(numberMatch[1]);
    if (!isNaN(val) && val > 10) {
      const w = Math.round(Math.sqrt(val / 2) * 10) / 10 || 5;
      const l = Math.round((val / w) * 10) / 10 || 20;
      return { groundArea: Math.round(val), totalArea: Math.round(val * 2), widthM: w, lengthM: l };
    }
  }

  return { groundArea: 100, totalArea: 200, widthM: 5, lengthM: 20 };
}

// Generate formatted BOQ Table text from hard-coded system data with real pricing columns & comparison
export function generateHardcodedBOQText(
  sGround: number, 
  sTotal: number, 
  floors: number,
  optionId: 'PA1' | 'PA2' | 'PA3' = 'PA1',
  userBudget?: number,
  budgetUnit: string = 'VNĐ',
  layoutModel?: ArchitecturalLayoutModel,
  co_san_vuon: boolean = false,
  constructionInfoForPrice?: any,
  userInfoForPrice?: any
): string {
  const masterEstimate = getUnifiedEstimate({ constructionInfo: constructionInfoForPrice || { dimensions: `${sGround}`, floors, rooms: { garden: co_san_vuon } }, userInfo: userInfoForPrice, optionKey: optionId as StructuralOptionKey });

  const lines = masterEstimate.lines;
  const totalCostVND = masterEstimate.tong_tron_goi;
  const formattedTotalCostVND = masterEstimate.formatted_tong_tron_goi;
  const costBillion = masterEstimate.costBillion;

  const optName = optionId === 'PA2' 
    ? 'PHƯƠNG ÁN 2: KHUNG THÉP TIỀN CHẾ + SÀN CEMBOARD' 
    : optionId === 'PA3'
    ? 'PHƯƠNG ÁN 3: BÊ TÔNG NHẸ EPS ĐÚC LIỀN KHỐI & GÔNG ĐỊNH HÌNH 3D'
    : 'PHƯƠNG ÁN 1: KHUNG BÊ TÔNG CỐT THÉP (BTCT) TRUYỀN THỐNG';

  let budgetComparisonBlock = '';
  if (userBudget && userBudget > 0) {
    const diff = totalCostVND - userBudget;
    const diffPercent = Math.round((Math.abs(diff) / userBudget) * 100);
    const isHigher = diff > 0;
    let advice = '';
    if (diffPercent <= 10) {
      advice = '✅ Ngân sách dự kiến của gia chủ rất sát với tổng dự toán bóc tách kỹ thuật thực tế (chênh lệch dưới 10%).';
    } else if (isHigher) {
      advice = `⚠️ Tổng dự toán cao hơn ngân sách dự kiến khoảng ${diffPercent}%. Khuyến nghị: Gia chủ có thể lựa chọn gói hoàn thiện phân khúc Tiết kiệm hoặc chuyển đổi sang Phương án 3 (Bê tông nhẹ EPS) để giảm chi phí.`;
    } else {
      advice = `💡 Ngân sách dự kiến của gia chủ dồi dào hơn dự toán bóc tách (${diffPercent}%). Gia chủ có thể nâng cấp vật liệu hoàn thiện sang phân khúc Cao cấp.`;
    }
    budgetComparisonBlock = `\n7.1. ĐỐI CHIẾU NGÂN SÁCH DỰ KIẾN VỚI TỔNG DỰ TOÁN THỰC TẾ:
- Ngân sách gia chủ dự kiến: ${userBudget.toLocaleString('vi-VN')} ${budgetUnit}
- Tổng dự toán bóc tách kỹ thuật (BOQ): ${formattedTotalCostVND} (~ ${costBillion} tỷ VNĐ)
- Mức độ chênh lệch: ${isHigher ? '+' : '-'}${Math.abs(diff).toLocaleString('vi-VN')} VNĐ (${diffPercent}%)
- Nhận xét & Khuyến nghị kỹ sư: ${advice}
`;
  }

  let text = `VII. BẢNG BÓC TÁCH VẬT TƯ – NHÂN CÔNG (BOQ) MỞ RỘNG
(${optName} - Dữ liệu định mức tính tự động theo diện tích sàn S = ${sGround} m²/sàn, Tổng DTXD = ${sTotal} m², Quy mô = ${floors} tầng)
${budgetComparisonBlock}
7.2. BẢNG BÓC TÁCH KHỐI LƯỢNG CHI TIẾT KÈM ĐƠN GIÁ & THÀNH TIỀN:
`;

  const categories: Record<string, typeof lines> = {};
  lines.forEach(line => {
    const catName = line.item.categoryName;
    if (!categories[catName]) categories[catName] = [];
    categories[catName].push(line);
  });

  let itemIndex = 1;
  Object.keys(categories).forEach(catName => {
    text += `\n${catName.toUpperCase()}:\n`;
    categories[catName].forEach(line => {
      text += `${itemIndex}. ${line.item.name}
   - Khối lượng tính toán: ${line.formattedQuantity} (ĐVT: ${line.item.unit})
   - Đơn giá định mức: ${line.formattedUnitPrice}
   - Thành tiền dự kiến: ${line.formattedTotalAmount}
   - Diễn giải kỹ sư: ${line.item.clientExplanation}
`;
      itemIndex++;
    });
  });

  text += `
============================================================
A. DỰ TOÁN TRỌN GÓI CHÌA KHÓA TRAO TAY (Vật tư + Thiết bị + Nhân công + Chi phí chung):
👉 TỔNG CỘNG HỢP ĐỒNG TRỌN GÓI: ${formattedTotalCostVND} (Suất đầu tư: ${masterEstimate.formatted_suat_dau_tu_m2})
(Bằng chữ: Khoảng ${costBillion} tỷ Việt Nam Đồng)

B. BÓC TÁCH KHI GIA CHỦ TỰ MUA VẬT TƯ & THIẾT BỊ (KHOÁN NHÂN CÔNG):
- Tổng giá trị vật tư, vật liệu & thiết bị hoàn thiện: ${masterEstimate.formatted_tong_vat_tu_thiet_bi}
- Tổng chi phí KHOÁN NHÂN CÔNG THI CÔNG & GIÁM SÁT: ${masterEstimate.formatted_tong_khoan_nhan_cong} (Đơn giá nhân công: ${masterEstimate.formatted_suat_khoan_nhan_cong_m2})
* Khi Gia chủ tự cung ứng 100% vật tư & thiết bị, Nhà thầu chỉ thu đúng phần Nhân công thi công (${masterEstimate.formatted_tong_khoan_nhan_cong}).

* Ghi chú: Đơn giá trên áp dụng theo mặt bằng giá vật tư và nhân công xây dựng dân dụng tiêu chuẩn năm 2026. Chưa bao gồm thuế VAT và chi phí hoàn thiện nội thất rời.
============================================================

7.3. KẾ HOẠCH DÒNG TIỀN & LỘ TRÌNH GIẢI NGÂN THEO TUẦN (CASHFLOW MILESTONES):
`;

  const milestones = calculateCashflowMilestones(totalCostVND, optionId);
  milestones.forEach(ms => {
    text += `\n• ${ms.phaseName.toUpperCase()} (${ms.timeframe} — Tỷ lệ: ${ms.percentage}%):
  - Số tiền dự kiến giải ngân: ${ms.formattedAmount}
  - Điều kiện nghiệm thu thanh toán: ${ms.triggerCondition}
  - Hành động của Gia chủ: ${ms.homeownerAction}
`;
  });

  return text;
}

// Resolve Ceiling Specification strictly adhering to homeowner's selection & description
export function resolveCeilingSpecification(constructionInfo?: ConstructionInfo): {
  name: string;
  desc: string;
  rawType: string;
} {
  const customStr = (constructionInfo?.loai_tran || "").trim();
  const overall = (constructionInfo?.overallDescription || "").toLowerCase();
  
  if (customStr.toLowerCase().includes("than tre") || customStr.toLowerCase().includes("bamboo") || overall.includes("than tre") || overall.includes("tấm than tre")) {
    return {
      rawType: 'than_tre',
      name: 'Tấm ốp đa năng sợi than tre (Bamboo Charcoal)',
      desc: 'Trần ốp tấm đa năng sợi than tre cao cấp chống ẩm mốc tuyệt đối, bề mặt vân đá/vân gỗ tinh tế, thân thiện môi trường và cách âm vượt trội'
    };
  }
  if (customStr.toLowerCase().includes("nhom") || customStr.toLowerCase().includes("nhôm") || customStr.toLowerCase().includes("aluminum") || customStr.toLowerCase().includes("clip-in") || customStr.toLowerCase().includes("baffle") || overall.includes("trần nhôm") || overall.includes("nhôm clip-in") || overall.includes("baffle")) {
    return {
      rawType: 'nhom',
      name: 'Trần nhôm hợp kim cao cấp (Clip-in / Baffle)',
      desc: 'Hệ trần nhôm hợp kim sơn tĩnh điện cao cấp chống oxy hóa, kháng ẩm 100%, phong cách hiện đại và bền đẹp vĩnh cửu'
    };
  }
  if (customStr.toLowerCase().includes("nano") || customStr.toLowerCase().includes("nhua") || customStr.toLowerCase().includes("nhựa") || customStr.toLowerCase().includes("lam sóng") || customStr.toLowerCase().includes("lam song") || overall.includes("nhựa nano") || overall.includes("lam sóng") || overall.includes("nano")) {
    return {
      rawType: 'nhua_nano',
      name: 'Trần nhựa Nano PVC / Lam sóng giả gỗ',
      desc: 'Trần tấm nhựa Nano PVC phẳng nguyên sinh kết hợp tấm ốp lam sóng chống ẩm, không mối mọt và dễ vệ sinh lau chùi'
    };
  }
  if (customStr.toLowerCase().includes("go") || customStr.toLowerCase().includes("gỗ") || customStr.toLowerCase().includes("wood") || overall.includes("trần gỗ")) {
    return {
      rawType: 'go',
      name: 'Trần ốp gỗ tự nhiên / gỗ công nghiệp cao cấp',
      desc: 'Trần ốp gỗ cao cấp tiêu chuẩn chống ẩm E1, tôn lên vẻ ấm cúng, sang trọng và đẳng cấp cho không gian'
    };
  }
  if (customStr.toLowerCase().includes("thach cao") || customStr.toLowerCase().includes("thạch cao") || customStr.toLowerCase().includes("gypsum") || overall.includes("thạch cao")) {
    return {
      rawType: 'thach_cao',
      name: 'Trần thạch cao khung xương chìm Vĩnh Tường chống ẩm',
      desc: 'Hệ trần thạch cao khung xương chìm Vĩnh Tường tấm chống ẩm cao cấp sơn bả hoàn thiện'
    };
  }
  if (customStr && customStr !== "Khác" && customStr !== "Khác (Tự nhập)") {
    return {
      rawType: 'custom',
      name: customStr,
      desc: `Hệ trần hoàn thiện vật liệu ${customStr} theo đúng yêu cầu chỉ định của gia chủ`
    };
  }
  return {
    rawType: 'thach_cao',
    name: 'Trần thạch cao khung xương chìm Vĩnh Tường chống ẩm',
    desc: 'Hệ trần thạch cao khung xương chìm Vĩnh Tường tấm chống ẩm cao cấp'
  };
}

// Generate formatted Technical Standards & Branding Text
export function generateHardcodedStandardsText(): string {
  let text = `VIII. BẢNG TRA TIÊU CHUẨN XÂY DỰNG (TCVN/QCVN) CỐ ĐỊNH & THƯƠNG HIỆU VẬT TƯ

1. BẢNG TRA CỨU TIÊU CHUẨN KỸ THUẬT QUỐC GIA (TCVN/QCVN) CỐ ĐỊNH HỆ THỐNG:
`;
  TECHNICAL_STANDARDS_TABLE.forEach((std, idx) => {
    text += `  ${idx + 1}. ${std.item}: ${std.standardCode} (${std.notes})\n`;
  });

  text += `\n2. NGUYÊN TẮC GHI THƯƠNG HIỆU VẬT TƯ (TRÁNH RỦI RO CAM KẾT NGẦM):
${MATERIAL_BRANDING_DISCLAIMER}
  - Gợi ý phân khúc Tiết kiệm: Xi măng Vicem/Nghi Sơn, Thép Việt Sing/Tisco, Gạch Prime/Viglacera tiêu chuẩn, Sơn Maxilite/Kova, Nhôm hệ PMA/Việt Pháp, Trần Thạch cao Vĩnh Tường / Nhựa Nano.
  - Gợi ý phân khúc Tiêu chuẩn: Xi măng Holcim/Insee, Thép Hòa Phát/Pomina, Gạch Viglacera/Taicera, Sơn Dulux Inspire/Jotun Jotaplast, Nhôm hệ Xingfa nhập khẩu tem đỏ, Trần tấm than tre đa năng / Trần nhôm Clip-in, TBVS Inax/Cotto.
  - Gợi ý phân khúc Cao cấp: Thép Việt Nhật (Vina Kyoei), Gạch nhập khẩu Tây Ban Nha/Ấn Độ, Sơn Dulux Weathershield/Jotun Jotashield, Nhôm kính cầu cách nhiệt Schuco/Xingfa Class A, Trần nhôm Baffle / Gỗ tự nhiên / Than tre vân đá cao cấp, TBVS Toto/Grohe/Kohler.`;

  return text;
}

// Fallback Section Generator if API is offline or rate limited
export function generateLocalSectionContent(
  sectionId: string,
  option: StructuralOption,
  userInfo: UserInfo,
  constructionInfo: ConstructionInfo,
  fengShuiAnalysis?: FengShuiAnalysis
): string {
  const name = userInfo?.name || "Chủ Đầu Tư";
  const dim = constructionInfo?.dimensions || "100m²";
  const floors = Math.max(1, constructionInfo?.floors || 1);
  const budget = constructionInfo?.totalBudget 
    ? `${constructionInfo.totalBudget.toLocaleString('vi-VN')} ${constructionInfo.budgetUnit || 'VNĐ'}` 
    : "Chưa nhập (ước tính theo định mức kỹ thuật)";
  const address = userInfo?.address || "Việt Nam";

  const { groundArea, totalArea, widthM, lengthM } = parseFloorArea(dim);
  const sGround = groundArea;
  const sTotal = totalArea * (floors / 2);

  const layout = computeArchitecturalLayoutModel({
    widthM,
    lengthM,
    floors,
    groundFloorArea: sGround,
    totalConstructionArea: sTotal
  });

  const ceilingSpec = resolveCeilingSpecification(constructionInfo);
  const ref = option.referenceDocContent[sectionId] || "";

  switch (sectionId) {
    case 'I':
      return (`THUYẾT MINH KIẾN TRÚC – KẾT CẤU CÔNG TRÌNH
PHƯƠNG ÁN: ${option.name.toUpperCase()}

1.1. Căn cứ pháp lý & Tiêu chuẩn kỹ thuật áp dụng:
- TCVN 5574:2018: Thiết kế kết cấu bê tông và bê tông cốt thép.
- TCVN 2737:2020: Tải trọng và tác động lên công trình.
- TCVN 9362:2012: Tiêu chuẩn thiết kế nền nhà và công trình.
- QCVN 06:2022/BXD: Quy chuẩn kỹ thuật quốc gia về an toàn cháy cho nhà và công trình.

1.2. Thông tin chủ đầu tư & Quy mô xây dựng:
- Chủ đầu tư: ${name} (Năm sinh: ${userInfo?.birthDate || "Chưa nhập"}, Giới tính: ${userInfo?.gender || "Nam"}).
- Địa điểm xây dựng: ${address}.
- Diện tích lô đất & Kích thước: ${dim}.
- Quy mô công trình: ${floors} tầng. Diện tích sàn tầng 1: ≈ ${sGround} m²; Tổng diện tích sàn xây dựng: ≈ ${Math.round(sTotal)} m².
- Ngân sách đầu tư dự kiến: ${budget}.
- Phương án kết cấu chủ đạo: ${option.name} (${option.codeName}).
- Vật liệu hoàn thiện trần chỉ định: ${ceilingSpec.name}.

1.3. Tính chất hồ sơ & Khuyến cáo kỹ thuật:
- Hồ sơ này là bản thuyết minh thiết kế & dự toán sơ bộ được lập tự động bởi hệ thống AI Yohu Build nhằm cung cấp định hướng kỹ thuật và khối lượng vật tư ban đầu cho gia chủ.
- Bản vẽ thi công chi tiết (AutoCAD, bản vẽ móng, cột dầm sàn, MEP) cần được kỹ sư có chứng chỉ hành nghề thẩm định thực địa trước khi triển khai thi công chính thức.`).normalize('NFC');

    case 'II':
      return (`2.1. Ý tưởng hình khối & Phong cách kiến trúc:
- Hình khối công trình: Thiết kế ${floors} tầng hiện đại, đường nét hình học vuông vức khỏe khoắn, tỷ lệ chuẩn với kích thước lô đất ${dim}.
- Nhịp điệu phân vị đứng và ngang tạo cảm giác vững chãi, thanh thoát cho ngôi nhà.

2.2. Giải pháp hoàn thiện mặt tiền & Vật liệu bao che:
- Sơn ngoại thất cao cấp chống kiềm hóa, chống rêu mốc và tia UV.
- Hệ thống cửa đi, cửa sổ nhôm hệ xingfa/thủy lực kết hợp kính dán an toàn 8.38mm hoặc kính hộp cách âm cách nhiệt.
- Ban công đua rộng 0.9m - 1.2m có lan can kính cường lực 12mm hoặc nan thép hộp sơn tĩnh điện an toàn.

2.3. Giải pháp trần hoàn thiện nội thất & Vật tư chỉ định:
- Vật liệu hoàn thiện trần: ${ceilingSpec.name}.
- Đặc tính & Giải pháp thi công: ${ceilingSpec.desc}.

2.4. Giải pháp chống nóng & Thoát nước mái:
- Mái bằng hoặc mái dốc lợp ngói/tôn chống nóng 3 lớp PU dày dặn.
- Hệ rãnh thu nước seno đúc liền khối, phễu thu nước chống rác Φ90 đảm bảo thoát nước triệt để trong mùa mưa bão.`).normalize('NFC');

    case 'III': {
      const framingBlock = option.id === 'PA2'
        ? `3.2. Hệ khung thép chịu tải chính:
- Cột, dầm chính: Sử dụng thép hình hộp/chữ I theo đúng quy cách đã chọn ở Mục II, liên kết bu-lông cường độ cao + bản mã (gusset plate).
- Sàn tầng: Tấm Cemboard chịu lực gác lên dầm phụ thép hộp, không dùng hệ cột-dầm-sàn bê tông cốt thép truyền thống.
- Độ võng và chuyển vị: Kiểm soát độ võng dầm chính không vượt quá L/250 nhịp dầm.`
        : option.id === 'PA3'
        ? `3.2. Hệ cột & vách chịu tải chính:
- Cột chịu lực và vách bê tông nhẹ EPS đúc liền khối trong cùng một mẻ trút, khóa cứng bằng hệ gông định hình 3D — không phải hệ cột-dầm-sàn bê tông cốt thép hay khung thép truyền thống.
- Độ võng và chuyển vị: Kiểm soát theo khuyến nghị quy trình lắp đặt hệ gông 3D.`
        : `3.2. Hệ khung cột dầm chịu tải chính:
- Bê tông cột, dầm, sàn: Sử dụng bê tông thương phẩm mác M250 hoặc M300 đá 1x2.
- Thép chịu lực: Thép thanh vằn CB300-V hoặc CB400-V (Hòa Phát / Pomina / Miền Nam) có đầy đủ chứng chỉ CO/CQ.
- Độ võng và chuyển vị: Kiểm soát độ võng dầm chính không vượt quá L/250 nhịp dầm.`;

      const waterproofingRationale = floors === 1
        ? `3.4. Tính cấp thiết chống thấm khu vệ sinh WC & Sàn ướt đối với Nhà 1 tầng:
- Bản chất kỹ thuật: Nhà 1 tầng tuy không có sàn tầng dưới chịu dột trần, nhưng sàn WC tiếp giáp trực tiếp nền đất và chân tường gạch. Nếu không chống thấm màng đàn hồi, nước sinh hoạt và ẩm ướt sẽ ngấm ngang và mao dẫn ngược lên vách tường phòng khách, phòng ngủ liền kề gây ẩm mốc, ố vàng và bong tróc lớp sơn phủ.
- Giải pháp chống thấm tiêu chuẩn: Quét màng polyme 2 thành phần đàn hồi cao SikaTop Seal 107 dán lưới thủy tinh gia cường bo vén chân tường cao 20 - 30cm và xử lý kín khít cổ ống thoát sàn. Phần sân vườn / hiên trệt đổ bê tông lót láng dốc thoát nước tự nhiên.`
        : `3.4. Giải pháp chống thấm sàn WC, Ban công & Sàn mái:
- Quét 02 lớp màng chống thấm polyme đàn hồi cao SikaTop Seal 107 dán lưới thủy tinh gia cường bo chân tường cao 30cm, nghiệm thu ngâm thử nước 48h tuyệt đối không rò rỉ.`;

      return (`3.1. Đánh giá địa chất & Giải pháp móng chịu lực:
⚠️ CẢNH BÁO KỸ THUẬT VỀ ĐỊA CHẤT: Phương án móng dưới đây là giả định sơ bộ dựa trên loại nền đất phổ biến tại khu vực — cần khảo sát địa chất thực tế lô đất trước khi thi công để chốt phương án chính xác.
- Giải pháp móng đề xuất: Loại móng và chiều sâu đặt móng xác định theo tải trọng thực tế của phương án ${option.name} và kết quả khảo sát địa chất.

${framingBlock}

3.3. Giải pháp vách tường & Sàn công nghệ (${option.badge}):
${ref}

${waterproofingRationale}`).normalize('NFC');
    }

    case 'IV':
      if (floors === 1) {
        return (`4.1. Không gian sinh hoạt chung (Phòng Khách - Sảnh chính):
- Sảnh chính đón khách thông thoáng (${layout.yardFrontArea}m² sân trước), liên thông phòng khách rộng rãi (${layout.livingArea}m²).
- Hướng cửa chính mở chuẩn phương vị đón cung Sinh Khí theo Bát Trạch gia chủ.

4.2. Không gian Bếp & Bàn ăn:
- Bố trí liên hoàn (${layout.kitchenArea}m²) tạo không gian mở ấm cúng cho gia đình.
- Bếp nấu bố trí nguyên tắc Tọa Hung Hướng Cát, có cửa sổ lấy sáng và thoát mùi ra sân sau (${layout.yardBackArea}m²).

4.3. Phân khu phòng ngủ & Khu vệ sinh (${layout.wcCount} WC):
- Phòng ngủ 1 Master (${layout.bed1Area}m²) và Phòng ngủ 2 (${layout.bed2Area}m²) bố trí yên tĩnh, lấy ánh sáng tự nhiên.
- Khu vệ sinh chung (${layout.wcArea}m²) thiết kế kín đáo, chống thấm SikaTop Seal 107 dán lưới bo chân tường cao 30cm chống ẩm mao dẫn sang phòng ngủ/khách.

4.4. Thang gác mái công nghệ mới âm trần (Smart Retractable Ceiling Ladder):
- Đối với nhà 1 tầng, không sử dụng cầu thang sắt hay bê tông cồng kềnh chiếm diện tích phòng khách.
- Thay thế hoàn toàn bằng thang xếp âm trần điều khiển thông minh: khi đóng gập phẳng khít tuyệt đối với mặt trần (như trần thạch cao liền khối), khi cần bảo trì gác kỹ thuật chỉ cần bấm remote hoặc kéo nhẹ tay hạ thang hợp kim nhôm an toàn chịu tải 180kg.

4.5. Bảng cân đối diện tích mặt bằng tầng trệt:
- ${layout.balanceExplanation}`).normalize('NFC');
      }
      return (`4.1. Sảnh đón & Phòng khách Tầng 1:
- Phòng khách rộng rãi (${layout.livingArea}m²) tại vị trí trung tâm, kết nối trực tiếp sảnh đón chính và luồng giao thông cầu thang.
- Chiều cao thông thủy tầng 1: 3.6m - 3.9m tạo không gian thoáng đãng, sang trọng.

4.2. Khu vực Bếp & Bàn ăn:
- Bố trí theo nguyên tắc phong thủy Tọa Hung Hướng Cát (${layout.kitchenArea}m²).
- Bàn ăn đặt cách bếp nấu tối thiểu 1.5m, có cửa thoát gió ra sân sau/giếng trời thông thoáng.

4.3. Cầu thang & Khu vệ sinh Tầng 1:
- Cầu thang bộ bản BTCT, tổng số 21 bậc rơi trọn vào cung SINH.
- Phòng vệ sinh Tầng 1 (${layout.wcArea}m²) bố trí gọn gàng dưới gầm cầu thang hoặc góc khuất, trang bị quạt hút mùi độc lập.

4.4. Bảng cân đối diện tích mặt bằng:
- ${layout.balanceExplanation}`).normalize('NFC');

    case 'V':
      if (floors === 1) {
        return (`5.1. Quy mô & Kết cấu bao che nhà 1 tầng:
- Công trình thiết kế 1 tầng trệt hoàn chỉnh, tối ưu không gian cho gia đình sinh hoạt tập trung.
- Chiều cao thông thủy từ sàn lên đáy trần: 3.6m tạo độ thông thoáng tối đa.

5.2. Hệ thống mái dốc & Chống nóng:
- Kết cấu mái thái / mái Nhật / mái tôn cách nhiệt PU 3 lớp chống nóng kết hợp ${ceilingSpec.desc} kèm lớp xốp XPS 30mm.

5.3. Không gian gác kỹ thuật trung tâm dưới mái (Technical Attic / Service Loft):
- Thiết kế sàn thao tác chịu lực giấu kín trên trần làm trung tâm kỹ thuật tổng của ngôi nhà:
  + Nơi đặt bồn nước Inox 1500L - 2000L kết hợp hệ thống máy lọc nước tổng đầu nguồn.
  + Cụm máy cấp khí tươi & lọc không khí tổng hồi nhiệt (ERV/HRV) phân phối ống gió sạch đến từng phòng.
  + Khu vực kỹ thuật đặt cụm nóng điều hòa multi / giấu trần với hệ cửa chớp louver giải nhiệt đối lưu đầu hồi mái.
  + Tiếp cận an toàn, tiện lợi qua hệ thống thang xếp âm trần điều khiển từ xa thông minh.`).normalize('NFC');
      }
      return (`5.1. Phân khu phòng ngủ tầng lầu (Tầng 2 - Tầng ${floors}):
- Phòng ngủ Master khép kín: Ban công đón gió tự nhiên, phòng thay đồ và WC riêng biệt.
- Các phòng ngủ phụ: Cửa sổ mở rộng hướng Cát đón khí tươi, góc học tập và làm việc yên tĩnh.

5.2. Phòng thờ tâm linh & Không gian sinh hoạt chung:
- Phòng thờ đặt tại tầng cao nhất, tọa Cát hướng Cát, không giáp vách nhà vệ sinh hay trục thoát nước.
- Không gian sinh hoạt chung/phòng đọc sách kết nối ấm cúng giữa các phòng ngủ.

5.3. Sân thượng, khu giặt phơi, hệ kỹ thuật & Cây xanh:
- Sân phơi thông thoáng phía sau nhà, có mái che lấy sáng và nan chớp thoáng khí.
- Khu vực giặt đồ bố trí cấp thoát nước chuyên dụng, chống thấm sàn bằng màng đàn hồi 2 thành phần SikaTop Seal 107.
- Vị trí đặt bồn nước inox, máy nước nóng năng lượng mặt trời và cụm nóng điều hòa được quy hoạch tập trung.`).normalize('NFC');

    case 'VI':
      return (`6.1. Hệ thống cấp - phân phối điện an toàn:
- Tủ điện tổng âm tường trang bị Aptomat tự động chống rò ELCB tiêu chuẩn Schneider / Panasonic.
- Toàn bộ đường dây điện luồn trong ống gen chống cháy cứng chịu lực âm tường và âm sàn.
- Hệ thống tiếp địa an toàn điện trở R < 4 Ohm theo TCVN 9385:2012.

6.2. Hệ thống cấp nước & Trung tâm lọc nước - Bồn nước:
- Đường ống cấp nước nóng lạnh sử dụng ống chịu nhiệt PPR hàn nhiệt đồng bộ, áp lực thử kín 10 bar.
- Bồn chứa nước inox đặt trên mái / gác kỹ thuật trần kết hợp hệ thống phao điện tự động ngắt chống tràn và lọc nước tổng đầu nguồn.

6.3. Hệ thống điều hòa & Máy lọc không khí cấp khí tươi (HVAC & IAQ):
- Quy hoạch cụm nóng điều hòa tập trung (có cửa louver giải nhiệt đối lưu), giảm tiếng ồn và tăng tuổi thọ thiết bị.
- Hệ thống lọc không khí tổng cấp khí tươi sạch qua trần gián tiếp, duy trì đối lưu oxy 24/7 cho toàn bộ không gian sống.

6.4. Hệ thống thoát nước thải & Xử lý nước ngầm:
- Đường ống thoát phân Φ110 và thoát nước sinh hoạt Φ90 riêng biệt bằng ống uPVC Tiền Phong / Bình Minh dày dặn.
- Bể phốt tự hoại 3 ngăn xây gạch đặc hoặc đúc bê tông toàn khối, có ống thông hơi lên đỉnh mái chống mùi hôi triệt để.`).normalize('NFC');

    case 'VII':
      return generateHardcodedBOQText(
        sGround, 
        Math.round(sTotal), 
        floors, 
        option.id, 
        constructionInfo?.totalBudget, 
        constructionInfo?.budgetUnit,
        layout,
        constructionInfo?.rooms?.garden === true,
        constructionInfo,
        userInfo
      ).normalize('NFC');

    case 'VIII':
      return generateHardcodedStandardsText().normalize('NFC');

    case 'IX': {
      const stairFengShui = floors > 1 
        ? `- Cầu thang (Dẫn Khí Long Mạch): Thiết kế 21 bậc rơi trọn vào cung SINH. Cầu thang đặt giữa nhà tụ khí, tránh đâm thẳng ra cửa lớn.`
        : `- Luồng giao thông mặt bằng 1 tầng: Thiết kế hành lang thẳng thoáng kết nối phòng khách - bếp - các phòng ngủ, không bị gấp khúc, không chướng ngại vật cản trở dòng chảy sinh khí.`;

      const loBanDetails = `9.3. Bảng tra kích thước thông thủy cửa chuẩn thước Lỗ Ban 52.2cm (Thông thủy cửa) & 38.8cm (Bàn thờ):
- Cửa chính (Khí Khẩu): Rộng 810 mm (cung Tiến Bảo / Tài Trí) × Cao 2120 mm (cung Phú Quý / Quý Nhân) [hoặc Rộng 1070 mm × Cao 2120 mm cho cửa lớn].
- Cửa phòng ngủ thông phòng: Rộng 810 mm (cung Tiến Bảo) × Cao 2120 mm (cung Quý Nhân).
- Cửa phòng vệ sinh (WC): Rộng 690 mm (cung Phú Quý) × Cao 1980 mm (cung Thiên Khôi) hoặc Cao 2060 mm (cung Phú Quý).
- Cửa sổ lấy sáng 2 cánh/4 cánh: Rộng 1250 mm (cung Thuận Khoa / Lục Hợp) × Cao 1450 mm (cung Thêm Đinh / Phúc Đức).
- Bàn thờ tâm linh (Thước Lỗ Ban 38.8cm): Rộng 1270 mm (cung Tiến Bảo) × Sâu 610 mm (cung Hoạnh Tài) × Cao 1270 mm (cung Tiến Bảo).`;

      return (`9.1. Thông tin bản mệnh gia chủ:
- Gia chủ: ${name} (Sinh năm: ${userInfo?.birthDate || "N/A"}).
- Ngũ hành bản mệnh: ${fengShuiAnalysis?.element || "Kim / Mộc / Thủy / Hỏa / Thổ"}.
- Cung Phi Bát Trạch: Cung ${fengShuiAnalysis?.cungPhi || "Cát"} — Thuộc ${fengShuiAnalysis?.cungPhi?.match(/Khảm|Ly|Chấn|Tốn/) ? "Đông Tứ Mệnh" : "Tây Tứ Mệnh"}.
- Hướng hợp mệnh (Sinh Khí, Diên Niên, Thiên Y, Phục Vị): ${fengShuiAnalysis?.favorableDirections?.join(', ') || userInfo?.desiredDirection || "Đông Nam, Nam, Bắc, Đông"}.
- Hướng cần tránh (Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Họa Hại): Hướng nghịch cung mệnh gia chủ.

9.2. Nguyên tắc định vị không gian Bát Trạch:
- Cửa chính (Khí Khẩu): Mở tại phương vị đón cung Sinh Khí / Diên Niên để chiêu tài tụ khí, tránh trực xung cửa hậu hay chân cầu thang.
- Bếp nấu (Tọa Hung Hướng Cát): Đặt bếp tọa tại cung Hung để trấn áp hung khí và mặt bếp quay về cung Cát để đón sinh khí cho gia đình.
${stairFengShui}
- Gian thờ: Đặt ở vị trí trang nghiêm (Tầng ${floors}), tọa Cát hướng Cát, tựa lưng vững chắc, không giáp vách nhà vệ sinh hay trục nước.
- Giường ngủ Master: Kê đầu giường hướng về Thiên Y / Phục Vị giúp gia chủ an giấc.
- Vị trí Bể Phốt: Bố trí ở cung Hung của ngôi nhà, tuyệt đối KHÔNG đặt dưới gian thờ, phòng bếp hoặc tim nhà.

${loBanDetails}`).normalize('NFC');
    }

    case 'X':
      return (`10.1. LỊCH TRÌNH ĐẶT HÀNG VẬT TƯ & CẢNH BÁO THỜI GIAN CHỜ (LEAD-TIME SCHEDULE):
(Phân định rõ trách nhiệm để tránh tình trạng công trình bị dừng chờ vật tư hoặc mua sớm bị hư hỏng trên công trường)

• Thép xây dựng (D10 - D20): Đặt trước 5 – 7 ngày. Giao trước khi đổ bê tông 1 – 2 ngày để gia công cắt uốn. (Cảnh báo: Không đặt quá sớm >10 ngày ngoài trời sẽ bị rỉ sét giảm bám dính bê tông).
• Xi măng bao (PCB30/PCB40): Đặt trước 2 – 3 ngày, chia nhỏ làm 3 – 4 đợt (đợt móng, đợt sàn, đợt xây, đợt trát). (Cảnh báo: Tuyệt đối không nhập 100% để quá 15 ngày bị hút ẩm vón cục suy giảm mác).
• Cát vàng & Đá 1x2, 4x6: Đặt trước 1 – 2 ngày theo từng chuyến xe ben 3 – 5m³ theo tiến độ từng hạng mục.
• CỬA NHÔM KÍNH (Xingfa/PMA/Kính 8.38mm): BẮT BUỘC ĐẶT TRƯỚC 15 – 20 NGÀY! Thời điểm đo: Ngay khi xây thô và trát phẳng các ô chờ xong (Tuần 8-9). Cửa không có sẵn, phải đo laser thực tế rồi mới cắt kính tôi nhiệt tại nhà máy. Nếu để xong nhà mới gọi thợ cửa thì công trình sẽ bị "đơ" chờ cửa mất 1 tháng.
• Tủ bếp & Nội thất liền tường: Đặt trước 20 – 25 ngày ngay khi trát xong tường bếp và chốt vị trí ổ cắm, cấp thoát nước (Tuần 10).
• Đá Granite cầu thang & Bàn bếp: Đặt trước 5 – 7 ngày, đo rập sau khi đổ bản thang bê tông (Tuần 11).
• Thiết bị vệ sinh & Đèn chiếu sáng: Chốt mẫu Tuần 6 – 8; chỉ giao đến công trường trước khi lắp 2 – 3 ngày (Tuần 14) khi phòng đã có cửa khóa kín để tránh mất mát, vỡ sứ, xước mạ crom.

10.2. GIẢI PHÁP BỐ TRÍ MẶT BẰNG CÔNG TRƯỜNG & KHO BÃI ĐẤT HẸP (~100m²):
• Đất đào móng: Xúc chuyển ngay lên xe ben vận chuyển trong đêm, chỉ giữ lại 30% cát/đất sạch tại góc sân để đầm tôn nền sau khi đổ giằng móng.
• Vị trí máy trộn & máy cắt uốn sắt: Đặt tại khoảng lùi sân trước (3-4m) hoặc vỉa hè có giấy phép tạm.
• Bảo quản xi măng & cốt thép: Xi măng kê trên pallet gỗ/nhựa cao >20cm, cách tường >30cm, phủ bạt kín 2 lớp tại góc khô ráo nhất. Thép cây xếp dọc mép sân trước, có con kê và bạt phủ.
• Bãi cát đá: Quây be bằng ván cốp pha hoặc bao cát xung quanh để tránh chảy tràn làm tắc cống thoát nước đô thị.

10.3. QUY TRÌNH NGHIỆM THU CÔNG TÁC KHUẤT LẤP & CAM KẾT CHỐNG TRÁO VẬT TƯ:
• Định nghĩa công tác khuất lấp: Là các hạng mục kết cấu sau khi thi công sẽ bị che khuất vĩnh viễn (Cốt thép móng/cột/dầm/sàn trước khi đổ bê tông; Đường ống nước, dây điện âm tường sàn; Màng chống thấm sàn mái/WC).
• Quy trình 4 bước bắt buộc trước khi đổ bê tông / trát vữa:
  1. Kiểm tra mác thép & Logo dập nổi trên thân thép (Ví dụ: Thép Hòa Phát dập chữ 'HOA PHAT' + biểu tượng bông lúa; Pomina dập hình trái táo). Đối chiếu đường kính D14, D16, D18, D20 với bản vẽ.
  2. Đo đạc khoảng cách đai thép (a100 ở đầu cột, a150/a200 ở giữa nhịp) và kê con kê bê tông dày 25-30mm bảo vệ thép.
  3. Thử áp lực nước ngầm (ngâm áp 8 – 10 bar trong 24 giờ) và đo thông mạch điện trước khi trát tường.
  4. Chụp ảnh 3 góc có hiển thị ngày giờ GPS và ký 'Biên bản nghiệm thu công tác khuất lấp' 2 bên trước khi phát lệnh đổ bê tông.
• Cam kết chế tài hợp đồng: Nếu phát hiện tráo đổi thép hoặc vật tư sai cam kết, nhà thầu chịu trách nhiệm đập bỏ, tháo dỡ toàn bộ hạng mục sai phạm và thi công lại đúng tiêu chuẩn bằng 100% chi phí của nhà thầu.

10.4. AN TOÀN LAO ĐỘNG, VỆ SINH MÔI TRƯỜNG & BẢO DƯỠNG BÊ TÔNG:
• Dưỡng hộ bê tông: Tưới nước bảo dưỡng liên tục 3-7 ngày đầu (đặc biệt vào mùa hè nắng nóng) để chống rạn nứt nứt chân chim bề mặt.
• An toàn lao động: 100% công nhân trang bị mũ bảo hộ, găng tay, giày chống đinh và dây an toàn khi làm việc trên cao; bao che lưới chống bụi xung quanh công trình.`).normalize('NFC');

    default:
      return ref.normalize('NFC');
  }
}

// Call backend API section by section with chunking, retry & backoff
export async function generateSingleSection(
  sectionMeta: { id: string; title: string },
  option: StructuralOption,
  userInfo: UserInfo,
  constructionInfo: ConstructionInfo,
  fengShuiAnalysis?: FengShuiAnalysis,
  previousSummary: string = "",
  targetLang: string = "vi"
): Promise<string> {
  // If section VII (BOQ) or section VIII (Standards), hardcoded baseline data is always respected
  if (sectionMeta.id === 'VII' || sectionMeta.id === 'VIII') {
    const hardcoded = generateLocalSectionContent(sectionMeta.id, option, userInfo, constructionInfo, fengShuiAnalysis);
    if (targetLang && targetLang !== 'vi') {
      return await translateSectionContent(hardcoded, targetLang, sectionMeta.title);
    }
    return hardcoded;
  }

  const maxRetries = 3;
  let attempt = 0;

  const payload = {
    sectionId: sectionMeta.id,
    sectionTitle: sectionMeta.title,
    structuralOptionId: option.id,
    structuralOptionName: option.name,
    userInfo,
    constructionInfo,
    fengShuiAnalysis,
    // Số liệu chuẩn cố định (móng/cột/dầm/sàn/vách) của phương án đã chọn.
    // Gửi đầy đủ, không cắt bớt, ở MỌI mục — kể cả mục IX, X ở cuối —
    // để AI không tự bịa số khác với mục III.
    structuralFacts: option.structuralFactsSummary,
    previousSectionsSummary: previousSummary,
    referenceContext: option.referenceDocContent[sectionMeta.id] || "",
    lang: targetLang
  };

  while (attempt < maxRetries) {
    try {
      attempt++;
      const res = await fetch("/api/generate-specification-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (data.content && data.content.trim().length > 50) {
        return cleanAndNormalizeVietnameseText(data.content);
      }
      throw new Error("Empty content received from AI engine");
    } catch (err) {
      if (attempt >= maxRetries) {
        console.warn(`[SpecAI] Section ${sectionMeta.id} API fallback to local data:`, err);
        const fallback = generateLocalSectionContent(sectionMeta.id, option, userInfo, constructionInfo, fengShuiAnalysis);
        return cleanAndNormalizeVietnameseText(fallback);
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  return cleanAndNormalizeVietnameseText(
    generateLocalSectionContent(sectionMeta.id, option, userInfo, constructionInfo, fengShuiAnalysis)
  );
}

// Multilingual Translation helper
export async function translateSectionContent(
  content: string, 
  targetLang: string, 
  sectionTitle: string
): Promise<string> {
  if (!content || targetLang === 'vi') return content;
  try {
    const res = await fetch("/api/translate-specification-section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, targetLang, sectionTitle })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.translatedContent) {
        return cleanAndNormalizeVietnameseText(data.translatedContent);
      }
    }
  } catch (err) {
    console.warn("Translation API call failed, falling back to original content", err);
  }
  return content;
}
