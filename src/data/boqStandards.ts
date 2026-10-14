import { ArchitecturalLayoutModel } from '../lib/architecturalLayoutModel';
import { DETAILED_PA1_BOQ, DETAILED_PA2_BOQ, DETAILED_PA3_BOQ } from './detailedBoqData';

export interface BOQItem {
  id: string;
  category: 'foundation' | 'frame' | 'wall' | 'roof' | 'finishing' | 'mep' | 'labor';
  categoryName: string;
  name: string;
  unit: string;
  unitPrice: number; // Đơn giá vật tư/nhân công chuẩn thị trường 2026 (VNĐ)
  formulaDescription: string;
  clientExplanation: string;
  technicalNote: string; // Ghi chú chi tiết: sắt nào làm gì, dây đơn hay đôi, quy cách kỹ thuật
  roofTypeTag?: 'tiled' | 'metal' | 'flat' | 'all'; // Đánh dấu mái ngói / mái tôn / mái bằng
  multiFloorOnly?: boolean; // Chỉ hiển thị khi nhà ≥ 2 tầng
  calculateQuantity: (
    sGround: number, 
    sTotal: number, 
    floors: number, 
    layout?: ArchitecturalLayoutModel,
    roofType?: string
  ) => { qtyMin: number; qtyMax: number; qtyAverage: number; formatted: string };
}

export interface CalculatedBOQLine {
  item: BOQItem;
  qtyAverage: number;
  unitPrice: number;
  totalAmount: number;
  formattedQty: string;
  formattedUnitPrice: string;
  formattedTotalAmount: string;
  technicalNote: string;
}

export interface TechnicalStandard {
  item: string;
  standardCode: string;
  notes: string;
  isConfirmed: boolean;
}

// BẢNG MỤC LỤC VĂN BẢN (10 CHƯƠNG MỤC TIÊU CHUẨN)
export interface TocItem {
  id: string;
  romanNumber: string;
  title: string;
  keyFocus: string;
  standardsApplied: string;
  pageReference: string;
}

export const REPORT_TOC_TABLE: TocItem[] = [
  { 
    id: 'I', 
    romanNumber: 'Mục I', 
    title: 'Thông Tin Tổng Quan & Căn Cứ Thiết Kế', 
    keyFocus: 'Quy mô công trình, diện tích đất, phân tích hiện trạng & đối chiếu ngân sách', 
    standardsApplied: 'TCVN 9362:2012, Luật Xây Dựng', 
    pageReference: 'Trang 1' 
  },
  { 
    id: 'II', 
    romanNumber: 'Mục II', 
    title: 'Kiến Trúc Mặt Tiền & Định Hình Không Gian', 
    keyFocus: 'Hình khối kiến trúc, tỷ lệ mảng kính, lấy sáng tự nhiên & thẩm mỹ ngoại thất', 
    standardsApplied: 'Tiêu chuẩn thẩm mỹ đô thị hiện đại', 
    pageReference: 'Trang 1' 
  },
  { 
    id: 'III', 
    romanNumber: 'Mục III', 
    title: 'Thuyết Minh Giải Pháp Kết Cấu Chịu Lực', 
    keyFocus: 'Quy cách móng, dầm, cột, sàn, tường bao che, mác bê tông & mác thép chịu lực', 
    standardsApplied: 'TCVN 5574:2018 / TCVN 5575:2012', 
    pageReference: 'Trang 2' 
  },
  { 
    id: 'IV', 
    romanNumber: 'Mục IV', 
    title: 'Bố Trí Công Năng Mặt Bằng Tầng Trệt (T1)', 
    keyFocus: 'Giao thông hành lang, phòng khách, bếp ăn, vệ sinh, giếng trời & sân vườn', 
    standardsApplied: 'Công thái học kiến trúc nhà ở', 
    pageReference: 'Trang 2' 
  },
  { 
    id: 'V', 
    romanNumber: 'Mục V', 
    title: 'Bố Trí Không Gian Lầu & Mái Công Trình', 
    keyFocus: 'Phòng ngủ master, phòng thờ tôn nghiêm, ban công lấy gió & sân phơi thoáng', 
    standardsApplied: 'QCVN Thông gió & Chiếu sáng tự nhiên', 
    pageReference: 'Trang 2' 
  },
  { 
    id: 'VI', 
    romanNumber: 'Mục VI', 
    title: 'Hệ Thống Kỹ Thuật M&E, Cấp Thoát Nước & PCCC', 
    keyFocus: 'Dây cáp Cadisun luồn gen chống cháy SP, ống PPR 10 bar, chống sét & CB an toàn', 
    standardsApplied: 'QCVN 06:2022/BXD, TCVN 9385:2012', 
    pageReference: 'Trang 3' 
  },
  { 
    id: 'VII', 
    romanNumber: 'Mục VII', 
    title: 'Bóc Tách Khối Lượng BOQ & Kế Hoạch Dòng Tiền', 
    keyFocus: 'Dự toán 7 nhóm vật tư - nhân công bám giá thị trường địa phương & Lộ trình giải ngân', 
    standardsApplied: 'Định mức BXD & Khảo sát giá thị trường 2026', 
    pageReference: 'Trang 3' 
  },
  { 
    id: 'VIII', 
    romanNumber: 'Mục VIII', 
    title: 'Bảng Tra Tiêu Chuẩn Kỹ Thuật & Thương Hiệu Vật Tư', 
    keyFocus: 'Danh mục TCVN cốt lõi & khuyến nghị 3 phân khúc vật tư tránh cam kết ngầm', 
    standardsApplied: 'TCVN / Chứng nhận xuất xưởng CO/CQ', 
    pageReference: 'Trang 4' 
  },
  { 
    id: 'IX', 
    romanNumber: 'Mục IX', 
    title: 'Tư Vấn Phong Thủy Bát Trạch & Thước Lỗ Ban', 
    keyFocus: 'Bát quái cung mệnh, hướng bếp Tọa Hung Hướng Cát, thước Lỗ Ban 52.2cm & 38.8cm', 
    standardsApplied: 'Bát Trạch Minh Cảnh & Thước Lỗ Ban', 
    pageReference: 'Trang 4' 
  },
  { 
    id: 'X', 
    romanNumber: 'Mục X', 
    title: 'Quy Trình Nghiệm Thu & Cảnh Báo Lead-Time Vật Tư', 
    keyFocus: '4 chặng nghiệm thu khuất lấp chống tráo vật tư & Lịch đặt hàng tránh gián đoạn', 
    standardsApplied: 'Quy chuẩn quản lý chất lượng thi công', 
    pageReference: 'Trang 4' 
  }
];

// ENGINE ĐIỀU CHỈNH ĐƠN GIÁ THEO THỊ TRƯỜNG KHU VỰC CỦA KHÁCH HÀNG (2026 MARKET INDEX)
export interface RegionalMarketAdjustment {
  regionCode: string;
  regionName: string;
  detectedLocation: string;
  materialMultiplier: number;
  laborMultiplier: number;
  overallMultiplier: number;
  roughCostPerSqmRange: string;      // Đơn giá xây thô thị trường (VNĐ/m²)
  turnkeyCostPerSqmRange: string;    // Đơn giá trọn gói hoàn thiện (VNĐ/m²)
  calculatedAveragePerSqm: number;   // Đơn giá tính toán thực tế trên m² sàn
  formattedAveragePerSqm: string;
  marketNotes: string;
}

/**
 * Tự động rà soát vị trí khách hàng (tỉnh/thành phố) để áp dụng hệ số thị trường thực tế
 */
export function getRegionalMarketAdjustment(
  addressOrProvince?: string,
  totalCostVND: number = 0,
  sTotal: number = 100
): RegionalMarketAdjustment {
  const loc = (addressOrProvince || '').toLowerCase().trim();

  // 1. Đô thị loại Đặc biệt (Hà Nội, TP. Hồ Chí Minh) - Chi phí nhân công cao, vận chuyển hạn chế giờ cấm tải
  if (/hà nội|ha noi|hồ chí minh|ho chi minh|tphcm|tp hcm|sài gòn|sai gon/.test(loc)) {
    const matMul = 1.08;
    const labMul = 1.15;
    const avgMul = 1.11;
    const avgPerSqm = sTotal > 0 && totalCostVND > 0 ? Math.round(totalCostVND / sTotal) : 6950000;
    return {
      regionCode: 'METRO_SPECIAL',
      regionName: 'Khu Vực Đô Thị Loại Đặc Biệt (Hà Nội & TP. Hồ Chí Minh)',
      detectedLocation: addressOrProvince || 'Hà Nội / TP.HCM',
      materialMultiplier: matMul,
      laborMultiplier: labMul,
      overallMultiplier: avgMul,
      roughCostPerSqmRange: '3.800.000 – 4.500.000 đ/m²',
      turnkeyCostPerSqmRange: '6.800.000 – 8.800.000 đ/m²',
      calculatedAveragePerSqm: avgPerSqm,
      formattedAveragePerSqm: `${avgPerSqm.toLocaleString('vi-VN')} đ/m²`,
      marketNotes: 'Đã tự động điều chỉnh theo mặt bằng giá thị trường 2026 tại Hà Nội/TP.HCM (Nhân công tay nghề cao đô thị, xe chở vật tư vào ban đêm, cấm tải giờ cao điểm).'
    };
  }

  // 2. Vùng kinh tế trọng điểm & Đô thị loại 1 (Bình Dương, Đồng Nai, Vũng Tàu, Hải Phòng, Quảng Ninh, Đà Nẵng, Cần Thơ)
  if (/bình dương|binh duong|đồng nai|dong nai|bà rịa|vũng tàu|vung tau|hải phòng|hai phong|quảng ninh|quang ninh|đà nẵng|da nang|cần thơ|can tho/.test(loc)) {
    const matMul = 1.05;
    const labMul = 1.08;
    const avgMul = 1.06;
    const avgPerSqm = sTotal > 0 && totalCostVND > 0 ? Math.round(totalCostVND / sTotal) : 6600000;
    return {
      regionCode: 'TIER1_CITIES',
      regionName: 'Khu Vực Trung Tâm Đô Thị & Vùng Kinh Tế Trọng Điểm',
      detectedLocation: addressOrProvince || 'Đô thị loại 1',
      materialMultiplier: matMul,
      laborMultiplier: labMul,
      overallMultiplier: avgMul,
      roughCostPerSqmRange: '3.600.000 – 4.200.000 đ/m²',
      turnkeyCostPerSqmRange: '6.500.000 – 8.000.000 đ/m²',
      calculatedAveragePerSqm: avgPerSqm,
      formattedAveragePerSqm: `${avgPerSqm.toLocaleString('vi-VN')} đ/m²`,
      marketNotes: 'Đã tự động điều chỉnh theo mặt bằng giá thị trường 2026 tại vùng kinh tế phát triển.'
    };
  }

  // 3. Vùng Miền núi, Tây Bắc & Tây Nguyên (Lâm Đồng/Đà Lạt, Đắk Lắk, Gia Lai, Kon Tum, Lào Cai, Sơn La, Điện Biên, Lai Châu, Hà Giang...)
  if (/lâm đồng|lam dong|đà lạt|da lat|đắk lắk|dak lak|đắc lắc|gia lai|kon tum|đắk nông|dak nong|lào cai|sapa|sa pa|sơn la|lai châu|điện biên|hà giang|cao bằng|bắc kạn|lạng sơn|yên bái|hòa bình|tuyên quang/.test(loc)) {
    const matMul = 1.15; // Cước xe tải đèo dốc đường xa
    const labMul = 1.06;
    const avgMul = 1.11;
    const avgPerSqm = sTotal > 0 && totalCostVND > 0 ? Math.round(totalCostVND / sTotal) : 6900000;
    return {
      regionCode: 'HIGHLANDS_NORTH',
      regionName: 'Khu Vực Miền Núi & Tây Nguyên',
      detectedLocation: addressOrProvince || 'Khu vực Miền núi / Tây Nguyên',
      materialMultiplier: matMul,
      laborMultiplier: labMul,
      overallMultiplier: avgMul,
      roughCostPerSqmRange: '3.800.000 – 4.600.000 đ/m²',
      turnkeyCostPerSqmRange: '6.800.000 – 8.500.000 đ/m²',
      calculatedAveragePerSqm: avgPerSqm,
      formattedAveragePerSqm: `${avgPerSqm.toLocaleString('vi-VN')} đ/m²`,
      marketNotes: 'Đã tự động cộng phụ phí vận chuyển vật liệu đường đèo dốc và cung ứng phân tán tại địa phương.'
    };
  }

  // 4. Vùng Hải đảo (Phú Quốc, Côn Đảo, Cát Bà, Lý Sơn, Cô Tô...)
  if (/phú quốc|phu quoc|côn đảo|con dao|cát bà|cat ba|lý sơn|ly son|cô tô|co to|bạch long vĩ/.test(loc)) {
    const matMul = 1.35; // Cước tàu biển & bốc dỡ 2 đầu cảng
    const labMul = 1.25;
    const avgMul = 1.30;
    const avgPerSqm = sTotal > 0 && totalCostVND > 0 ? Math.round(totalCostVND / sTotal) : 8500000;
    return {
      regionCode: 'ISLAND_DISTRICT',
      regionName: 'Khu Vực Hải Đảo & Đặc Khu Biển',
      detectedLocation: addressOrProvince || 'Khu vực Hải đảo',
      materialMultiplier: matMul,
      laborMultiplier: labMul,
      overallMultiplier: avgMul,
      roughCostPerSqmRange: '4.500.000 – 5.500.000 đ/m²',
      turnkeyCostPerSqmRange: '8.500.000 – 11.500.000 đ/m²',
      calculatedAveragePerSqm: avgPerSqm,
      formattedAveragePerSqm: `${avgPerSqm.toLocaleString('vi-VN')} đ/m²`,
      marketNotes: 'Đã tự động cộng phụ phí trung chuyển đường biển, bốc dỡ 2 đầu cảng và vật liệu chuyên dụng chống muối mặn.'
    };
  }

  // 5. Mặc định: Khu vực Đồng bằng Sông Hồng & Nam Trung Bộ / Miền Tây (Bắc Ninh, Hưng Yên, Hải Dương, Nam Định, Thanh Hóa, Nghệ An, Long An, Tiền Giang, An Giang...)
  const matMul = 1.02;
  const labMul = 1.02;
  const avgMul = 1.02;
  const avgPerSqm = sTotal > 0 && totalCostVND > 0 ? Math.round(totalCostVND / sTotal) : 6350000;
  return {
    regionCode: 'STANDARD_PROVINCES',
    regionName: 'Khu Vực Đồng Bằng & Duyên Hải (Giá Tiêu Chuẩn Thị Trường 2026)',
    detectedLocation: addressOrProvince || 'Khu vực Tỉnh / Thành phố Tiêu Chuẩn',
    materialMultiplier: matMul,
    laborMultiplier: labMul,
    overallMultiplier: avgMul,
    roughCostPerSqmRange: '3.400.000 – 4.000.000 đ/m²',
    turnkeyCostPerSqmRange: '6.000.000 – 7.500.000 đ/m²',
    calculatedAveragePerSqm: avgPerSqm,
    formattedAveragePerSqm: `${avgPerSqm.toLocaleString('vi-VN')} đ/m²`,
    marketNotes: 'Đã tự động chuẩn hóa theo mặt bằng giá cung ứng vật tư & nhân công xây dựng 2026 tại khu vực.'
  };
}

// BẢNG BÓC TÁCH VẬT TƯ – NHÂN CÔNG (BOQ) ĐẦY ĐỦ CHO 3 PHƯƠNG ÁN (GIÁ 2026)
export const PA1_BOQ_TEMPLATE: BOQItem[] = DETAILED_PA1_BOQ;
export const PA2_BOQ_TEMPLATE: BOQItem[] = DETAILED_PA2_BOQ;
export const PA3_BOQ_TEMPLATE: BOQItem[] = DETAILED_PA3_BOQ;

// Giữ lại alias tương thích ngược
export const SYSTEM_BOQ_TEMPLATE: BOQItem[] = PA1_BOQ_TEMPLATE;

// Helper: Calculate detailed line item with regional pricing
export function calculateBOQLineItem(
  item: BOQItem,
  sGround: number,
  sTotal: number,
  floors: number,
  layout?: ArchitecturalLayoutModel,
  regionalMultiplier: { material: number; labor: number } = { material: 1.0, labor: 1.0 },
  roofType?: string
): CalculatedBOQLine {
  const q = item.calculateQuantity(sGround, sTotal, floors, layout, roofType);
  const qty = q.qtyAverage > 0 ? q.qtyAverage : 0;
  const multiplier = item.category === 'labor' ? regionalMultiplier.labor : regionalMultiplier.material;
  const rawUnitPrice = item.unitPrice || 0;
  const unitPrice = Math.round(rawUnitPrice * multiplier);
  const totalAmount = Math.round(qty * unitPrice);

  return {
    item: {
      ...item,
      unitPrice
    },
    qtyAverage: qty,
    unitPrice,
    totalAmount,
    formattedQty: q.formatted,
    formattedUnitPrice: `${unitPrice.toLocaleString('vi-VN')} đ/${item.unit}`,
    formattedTotalAmount: `${totalAmount.toLocaleString('vi-VN')} đ`,
    technicalNote: item.technicalNote || ''
  };
}

// Helper: Calculate all items and sum total BOQ with automatic regional market price adjustment
export function calculateFullBOQ(
  boqList: BOQItem[],
  sGround: number,
  sTotal: number,
  floors: number,
  layout?: ArchitecturalLayoutModel,
  customerAddressOrProvince?: string,
  roofType?: string
): {
  lines: CalculatedBOQLine[];
  totalCostVND: number;
  formattedTotalCostVND: string;
  costBillion: string;
  costPerSqm: number;
  formattedCostPerSqm: string;
  regionalAdjustment: RegionalMarketAdjustment;
} {
  // Filter items based on roofType selection
  const isMetalRoofSelected = roofType === 'mai_ton' || roofType === 'ton';
  const isTiledRoofSelected = roofType === 'mai_ngoi' || roofType === 'mai_thai' || roofType === 'mai_nhat' || roofType === 'ngoi';
  
  const filteredList = boqList.filter(item => {
    // If user explicitly picked metal roof, hide tiled-only lines
    if (isMetalRoofSelected && item.roofTypeTag === 'tiled') return false;
    // If user explicitly picked tiled roof, hide metal-only lines
    if (isTiledRoofSelected && item.roofTypeTag === 'metal') return false;
    // Multi-floor check
    if (item.multiFloorOnly && floors < 2) return false;
    return true;
  });

  // First calculate base lines to get initial cost
  const baseLines = filteredList.map(item => calculateBOQLineItem(item, sGround, sTotal, floors, layout, { material: 1.0, labor: 1.0 }, roofType));
  const baseTotal = baseLines.reduce((sum, line) => sum + line.totalAmount, 0);

  // Compute regional adjustment based on user address / region
  const regionalAdjustment = getRegionalMarketAdjustment(customerAddressOrProvince, baseTotal, sTotal);

  // Apply regional multipliers
  const lines = filteredList.map(item => calculateBOQLineItem(
    item, 
    sGround, 
    sTotal, 
    floors, 
    layout, 
    { material: regionalAdjustment.materialMultiplier, labor: regionalAdjustment.laborMultiplier },
    roofType
  ));

  const totalCostVND = lines.reduce((sum, line) => sum + line.totalAmount, 0);
  const costBillion = (totalCostVND / 1000000000).toFixed(2);
  const costPerSqm = sTotal > 0 ? Math.round(totalCostVND / sTotal) : 0;
  const formattedCostPerSqm = `${costPerSqm.toLocaleString('vi-VN')} đ/m²`;

  // Update calculated average per sqm on regional adjustment
  regionalAdjustment.calculatedAveragePerSqm = costPerSqm;
  regionalAdjustment.formattedAveragePerSqm = formattedCostPerSqm;

  return {
    lines,
    totalCostVND,
    formattedTotalCostVND: `${totalCostVND.toLocaleString('vi-VN')} đ`,
    costBillion,
    costPerSqm,
    formattedCostPerSqm,
    regionalAdjustment
  };
}

// Hàm trả về template BOQ tương ứng theo đúng phương án kết cấu
export function getBoqTemplateForOption(optionId: 'PA1' | 'PA2' | 'PA3' = 'PA1'): BOQItem[] {
  if (optionId === 'PA2') return PA2_BOQ_TEMPLATE;
  if (optionId === 'PA3') return PA3_BOQ_TEMPLATE;
  return PA1_BOQ_TEMPLATE;
}

// PHẦN B — BẢNG TRA TIÊU CHUẨN (TCVN/QCVN) CỐ ĐỊNH HỆ THỐNG
export const TECHNICAL_STANDARDS_TABLE: TechnicalStandard[] = [
  {
    item: 'Kết cấu bê tông cốt thép',
    standardCode: 'TCVN 5574:2018',
    notes: 'Thay thế phiên bản cũ TCVN 5574:2012',
    isConfirmed: true
  },
  {
    item: 'Tải trọng và tác động',
    standardCode: 'TCVN 2737:2020',
    notes: 'Thay thế phiên bản cũ TCVN 2737:1995',
    isConfirmed: true
  },
  {
    item: 'Nền móng công trình',
    standardCode: 'TCVN 9362:2012',
    notes: 'Tiêu chuẩn thiết kế nền nhà và công trình',
    isConfirmed: true
  },
  {
    item: 'An toàn cháy cho nhà và công trình',
    standardCode: 'QCVN 06:2022/BXD',
    notes: 'Quy chuẩn kỹ thuật quốc gia bắt buộc (không phải TCVN)',
    isConfirmed: true
  },
  {
    item: 'Gạch gốm ốp lát ép bán khô',
    standardCode: 'TCVN 7745:2007',
    notes: 'Tiêu chuẩn kỹ thuật nghiệm thu gạch ốp lát',
    isConfirmed: true
  },
  {
    item: 'Chống sét và tiếp địa công trình',
    standardCode: 'TCVN 9385:2012',
    notes: 'Hướng dẫn thiết kế, kiểm tra và bảo trì hệ thống chống sét',
    isConfirmed: true
  },
  {
    item: 'Sơn tường ngoài trời / trong nhà',
    standardCode: 'Theo chứng nhận xuất xưởng của nhà sản xuất (hoặc tương đương)',
    notes: 'Không gắn cứng 1 mã TCVN duy nhất cho mọi dòng sơn (Dulux, Jotun, Kova...)',
    isConfirmed: true
  },
  {
    item: 'Cửa nhôm kính & hệ khung nhôm',
    standardCode: 'Theo TCVN / Tiêu chuẩn nhà sản xuất (hoặc tương đương)',
    notes: 'Tránh chỉ định cứng 1 thương hiệu duy nhất (Xingfa, PMA...) kèm mã nếu chưa xác nhận hợp đồng',
    isConfirmed: true
  }
];

// PHẦN C — NGUYÊN TẮC GHI THƯƠNG HIỆU VẬT TƯ (TRÁNH RỦI RO CAM KẾT NGẦM)
export const MATERIAL_BRANDING_DISCLAIMER = `NGUYÊN TẮC GHI THƯƠNG HIỆU VẬT TƯ (TRÁNH RỦI RO CAM KẾT NGẦM):
Khi liệt kê vật tư có thương hiệu cụ thể (Hòa Phát, Viglacera, Dulux, Xingfa, Toto, INAX, Việt Nhật...), hệ thống luôn đính kèm cụm từ "hoặc tương đương" phía sau. Bảng danh mục này là gợi ý định hướng theo phân khúc chất lượng và giá thành (Tiết kiệm / Tiêu chuẩn / Cao cấp), không cấu thành cam kết hợp đồng bắt buộc phải cung ứng đích danh thương hiệu nếu hai bên chưa có phụ lục thỏa thuận vật tư chính thức.`;

// PHẦN D — KẾ HOẠCH DÒNG TIỀN & LỘ TRÌNH GIẢI NGÂN THEO TUẦN (CASHFLOW MILESTONES)
export interface CashflowMilestone {
  stage: number;
  timeframe: string; // ví dụ: "Tuần 1 – Tuần 3"
  phaseName: string; // ví dụ: "Đợt 1: Ký HĐ & Thi công phần móng"
  percentage: number; // ví dụ: 20
  estimatedAmountVND: number;
  formattedAmount: string;
  triggerCondition: string; // Điều kiện nghiệm thu để thanh toán
  homeownerAction: string; // Hành động của chủ nhà (chuẩn bị tiền, rút tiết kiệm...)
}

export function calculateCashflowMilestones(
  totalCostVND: number,
  optionId: 'PA1' | 'PA2' | 'PA3' = 'PA1'
): CashflowMilestone[] {
  const isFastTrack = optionId === 'PA2' || optionId === 'PA3';
  
  if (isFastTrack) {
    // Tiến độ nhanh cho Khung thép & Bê tông nhẹ (8-10 tuần + 20% = 10-12 tuần)
    const p1 = Math.round(totalCostVND * 0.25);
    const p2 = Math.round(totalCostVND * 0.30);
    const p3 = Math.round(totalCostVND * 0.25);
    const p4 = Math.round(totalCostVND * 0.15);
    const p5 = totalCostVND - p1 - p2 - p3 - p4;

    return [
      {
        stage: 1,
        timeframe: 'Tuần 1 – Tuần 3',
        phaseName: 'Đợt 1: Ký HĐ, Đào móng & Đổ đà kiềng móng',
        percentage: 25,
        estimatedAmountVND: p1,
        formattedAmount: `${p1.toLocaleString('vi-VN')} đ`,
        triggerCondition: 'Hoàn tất nghiệm thu hố móng, đan thép & đổ bê tông đà kiềng móng (Đã cộng 20% biên thời gian chống trễ)',
        homeownerAction: 'Chuẩn bị rút tiền đợt 1 ngay khi ký hợp đồng thi công.'
      },
      {
        stage: 2,
        timeframe: 'Tuần 4 – Tuần 6',
        phaseName: 'Đợt 2: Dựng khung kết cấu & Lắp tấm sàn/tường',
        percentage: 30,
        estimatedAmountVND: p2,
        formattedAmount: `${p2.toLocaleString('vi-VN')} đ`,
        triggerCondition: 'Khung cột dầm thép/vách EPS đã dựng xong và liên kết bu lông/neo chịu lực (Đã cộng 20% bù trừ thời gian)',
        homeownerAction: 'Rút sổ tiết kiệm hoặc giải ngân ngân hàng đợt 2 trước tuần 4.'
      },
      {
        stage: 3,
        timeframe: 'Tuần 7 – Tuần 9',
        phaseName: 'Đợt 3: Thi công MEP ngầm, chống thấm & Trát/xử lý mối nối',
        percentage: 25,
        estimatedAmountVND: p3,
        formattedAmount: `${p3.toLocaleString('vi-VN')} đ`,
        triggerCondition: 'Ống điện nước ngâm áp 24h đạt chuẩn, xử lý mối nối phẳng và chống thấm sàn mái/WC',
        homeownerAction: 'Kiểm tra đường ống ngầm và thanh toán khi có biên bản nghiệm thu.'
      },
      {
        stage: 4,
        timeframe: 'Tuần 10 – Tuần 11',
        phaseName: 'Đợt 4: Lắp cửa nhôm kính, sơn hoàn thiện & Thiết bị',
        percentage: 15,
        estimatedAmountVND: p4,
        formattedAmount: `${p4.toLocaleString('vi-VN')} đ`,
        triggerCondition: 'Lắp xong cửa nhôm kính, sơn hoàn thiện và gắn thiết bị vệ sinh, đèn chiếu sáng',
        homeownerAction: 'Cùng giám sát kiểm tra vận hành thử thiết bị điện nước.'
      },
      {
        stage: 5,
        timeframe: 'Tuần 12 (Bàn giao)',
        phaseName: 'Đợt 5: Nghiệm thu bàn giao & Giữ tiền bảo hành',
        percentage: 5,
        estimatedAmountVND: p5,
        formattedAmount: `${p5.toLocaleString('vi-VN')} đ`,
        triggerCondition: 'Bàn giao chìa khóa bàn giao; giữ lại 5% bảo hành trong 12 tháng theo cam kết',
        homeownerAction: 'Thanh toán phần quyết toán cuối; lưu giữ cam kết bảo hành.'
      }
    ];
  }

  // Phương án 1: BTCT truyền thống (12-16 tuần + 20% = 15-20 tuần)
  const p1 = Math.round(totalCostVND * 0.20);
  const p2 = Math.round(totalCostVND * 0.25);
  const p3 = Math.round(totalCostVND * 0.20);
  const p4 = Math.round(totalCostVND * 0.20);
  const p5 = Math.round(totalCostVND * 0.10);
  const p6 = totalCostVND - p1 - p2 - p3 - p4 - p5;

  return [
    {
      stage: 1,
      timeframe: 'Tuần 1 – Tuần 4',
      phaseName: 'Đợt 1: Ký HĐ & Thi công phần móng, đà kiềng',
      percentage: 20,
      estimatedAmountVND: p1,
      formattedAmount: `${p1.toLocaleString('vi-VN')} đ`,
      triggerCondition: 'Nghiệm thu tim mốc, cốt thép móng, đổ bê tông móng và giằng móng hoàn tất (Đã cộng 20% thời gian dự phòng)',
      homeownerAction: 'Chuẩn bị sẵn nguồn tiền mặt hoặc chuyển khoản đợt 1 ngay khi ký hợp đồng.'
    },
    {
      stage: 2,
      timeframe: 'Tuần 5 – Tuần 8',
      phaseName: 'Đợt 2: Đổ bê tông cột, dầm, sàn Tầng 1 và Tầng 2',
      percentage: 25,
      estimatedAmountVND: p2,
      formattedAmount: `${p2.toLocaleString('vi-VN')} đ`,
      triggerCondition: 'Đổ xong sàn bê tông tầng trên, đạt độ ninh kết và tháo dỡ cốp pha một phần',
      homeownerAction: 'Rút sổ tiết kiệm hoặc hẹn ngân hàng giải ngân đợt 2 vào đầu tuần 5.'
    },
    {
      stage: 3,
      timeframe: 'Tuần 9 – Tuần 11',
      phaseName: 'Đợt 3: Đổ sàn mái/tum & Xây tường gạch bao che thô',
      percentage: 20,
      estimatedAmountVND: p3,
      formattedAmount: `${p3.toLocaleString('vi-VN')} đ`,
      triggerCondition: 'Hoàn thành đổ sàn mái, xây xong toàn bộ tường bao che và tường ngăn phòng',
      homeownerAction: 'Thanh toán sau khi nghiệm thu độ thẳng đứng của tường và sàn mái.'
    },
    {
      stage: 4,
      timeframe: 'Tuần 12 – Tuần 16',
      phaseName: 'Đợt 4: Trát tường, đi điện nước MEP ngầm, trần & ốp lát gạch',
      percentage: 20,
      estimatedAmountVND: p4,
      formattedAmount: `${p4.toLocaleString('vi-VN')} đ`,
      triggerCondition: 'Đường điện nước ngầm test áp 24h xong, trát tường phẳng, ốp lát gạch xong',
      homeownerAction: 'Chuẩn bị kinh phí đợt 4 và kiểm tra kỹ hệ thống đường ống trước khi trát kín.'
    },
    {
      stage: 5,
      timeframe: 'Tuần 17 – Tuần 18',
      phaseName: 'Đợt 5: Lắp cửa nhôm kính, sơn bả nước & Thiết bị vệ sinh',
      percentage: 10,
      estimatedAmountVND: p5,
      formattedAmount: `${p5.toLocaleString('vi-VN')} đ`,
      triggerCondition: 'Lắp toàn bộ hệ cửa, sơn hoàn thiện 2 lớp phủ, gắn đủ thiết bị vệ sinh, đèn chiếu sáng',
      homeownerAction: 'Kiểm tra độ khít của cửa kính, độ bóng mịn của sơn và thoát nước bồn cầu/chậu rửa.'
    },
    {
      stage: 6,
      timeframe: 'Tuần 20 (Bàn giao)',
      phaseName: 'Đợt 6: Nghiệm thu hoàn công bàn giao & Giữ tiền bảo hành',
      percentage: 5,
      estimatedAmountVND: p6,
      formattedAmount: `${p6.toLocaleString('vi-VN')} đ`,
      triggerCondition: 'Vệ sinh công nghiệp sạch sẽ, bàn giao chìa khóa; giữ lại 5% bảo hành 12 tháng theo đúng hợp đồng',
      homeownerAction: 'Ký biên bản bàn giao nhà, nhận hồ sơ hoàn công và giữ lại 5% tiền bảo hành.'
    }
  ];
}

// PHẦN E — LỊCH TRÌNH ĐẶT HÀNG VẬT TƯ & CẢNH BÁO LEAD-TIME (MATERIAL LEAD-TIME MASTER)
export interface MaterialLeadTimeItem {
  id: string;
  materialName: string;
  orderLeadTimeDays: string; // ví dụ: "Đặt trước 15 – 20 ngày"
  orderTriggerMilestone: string; // ví dụ: "Ngay khi xây thô & trát ô chờ xong (Tuần 8-9)"
  responsibleParty: 'Nhà thầu (Trọn gói)' | 'Gia chủ (Khoán nhân công)';
  criticalRiskWarning: string; // Rủi ro thực tế nếu đặt sai thời điểm
  storageCondition: string; // Cách bảo quản tại công trường
}

export const MATERIAL_LEAD_TIME_SCHEDULE: MaterialLeadTimeItem[] = [
  {
    id: 'lead_thep',
    materialName: 'Thép thanh vằn & Thép cuộn xây dựng (D10, D12, D14, D16, D18...)',
    orderLeadTimeDays: 'Đặt trước 5 – 7 ngày',
    orderTriggerMilestone: 'Giao hàng trước ngày đổ móng/sàn 1 – 2 ngày để kịp cắt uốn đai thép',
    responsibleParty: 'Nhà thầu (Trọn gói)',
    criticalRiskWarning: 'NẾU ĐẶT QUÁ SỚM: Thép để mưa nắng ngoài trời >10 ngày sẽ bị hoen gỉ, rỉ sét bám vảy làm giảm độ bám dính với bê tông, chiếm diện tích đi lại. NẾU ĐẶT MUỘN: Thợ sắt không có thép làm, phải trả tiền công chờ.',
    storageCondition: 'Kê cao cách mặt đất >20cm bằng con kê gỗ/gạch, phủ bạt kín chống mưa nếu chưa dùng ngay.'
  },
  {
    id: 'lead_ximang',
    materialName: 'Xi măng bao xây trát & Đổ bê tông (PCB30 / PCB40)',
    orderLeadTimeDays: 'Đặt trước 2 – 3 ngày (Nhập chia nhỏ làm 3 – 4 đợt)',
    orderTriggerMilestone: 'Nhập theo từng đợt công việc (đợt móng, đợt đổ sàn, đợt xây, đợt trát)',
    responsibleParty: 'Nhà thầu (Trọn gói)',
    criticalRiskWarning: 'NẾU NHẬP 100% MỘT LẦN: Xi măng để lâu trên công trường quá 15 – 20 ngày gặp độ ẩm cao sẽ bị vón cục, suy giảm mác xi măng, đổ vào công trình dễ gây nứt gãy và bột bở.',
    storageCondition: 'Xếp trong kho kín hoặc góc có mái che, kê trên pallet gỗ cao >20cm, cách tường >30cm, phủ bạt kín 2 lớp.'
  },
  {
    id: 'lead_catda',
    materialName: 'Cát vàng bê tông, Cát mịn xây trát & Đá 1x2, Đá 4x6',
    orderLeadTimeDays: 'Đặt trước 1 – 2 ngày (Theo từng chuyến xe ben 3 – 5m³)',
    orderTriggerMilestone: 'Nhập theo tiến độ từng hạng mục, không đổ ồ ạt',
    responsibleParty: 'Nhà thầu (Trọn gói)',
    criticalRiskWarning: 'NẾU ĐỔ TRÀN LAN: Lô đất hẹp không có chỗ đi lại, cát đá bị xe cộ cán lẫn bùn đất rác bẩn làm giảm cường độ bê tông; trời mưa lớn bị nước cuốn trôi làm tắc cống thoát nước đô thị.',
    storageCondition: 'Quây be bằng ván cốp pha hoặc bao cát xung quanh bãi chứa để giữ cát đá sạch sẽ.'
  },
  {
    id: 'lead_cuanhomkinh',
    materialName: 'Cửa nhôm kính hệ Xingfa / PMA / Kính an toàn 8.38mm',
    orderLeadTimeDays: 'BẮT BUỘC ĐẶT TRƯỚC 15 – 20 NGÀY (CỰC KỲ QUAN TRỌNG)',
    orderTriggerMilestone: 'Ngay khi xây thô và trát phẳng các ô chờ cửa xong (Khoảng Tuần 8 – 9)',
    responsibleParty: 'Gia chủ (Khoán nhân công)',
    criticalRiskWarning: 'CỬA NHÔM KÍNH KHÔNG CÓ SẴN! Phải đo đạc laser thực tế từng ô tường đã trát xong rồi mới cắt thanh nhôm và đặt kính cường lực tôi nhiệt tại nhà máy (mất 15-20 ngày). NẾU ĐỢI XÂY XONG HẲN MỚI GỌI THỢ: Toàn bộ công trình sẽ bị "đơ" chờ cửa mất 1 tháng, không thể sơn bả hay lắp thiết bị bên trong!',
    storageCondition: 'Sau khi xưởng gia công xong, chở đến công trình dựng đứng nghiêng góc 75-80 độ, kê đệm cao su dưới chân.'
  },
  {
    id: 'lead_tubep',
    materialName: 'Tủ bếp trên / dưới (Gỗ công nghiệp MDF chống ẩm / Gỗ tự nhiên / Nhôm kính)',
    orderLeadTimeDays: 'Đặt trước 20 – 25 ngày',
    orderTriggerMilestone: 'Ngay khi trát tường bếp và chốt vị trí ổ cắm, đường cấp thoát nước chậu rửa (Tuần 10)',
    responsibleParty: 'Gia chủ (Khoán nhân công)',
    criticalRiskWarning: 'Cần đo đạc chuẩn theo kích thước rập tường thực tế và bản vẽ phong thủy Lỗ Ban bàn bếp.',
    storageCondition: 'Bảo quản khô ráo trong nhà đã có cửa kín, tránh ẩm ướt.'
  },
  {
    id: 'lead_dahoacuong',
    materialName: 'Đá Granite / Marble ốp mặt bậc cầu thang & Mặt bàn bếp',
    orderLeadTimeDays: 'Đặt trước 5 – 7 ngày',
    orderTriggerMilestone: 'Đo rập thực tế sau khi đổ bản thang bê tông và xây gờ bậc xong (Tuần 11)',
    responsibleParty: 'Nhà thầu (Trọn gói)',
    criticalRiskWarning: 'Đo kích thước bậc thực tế để cắt mài vát cạnh (bo mòi) chính xác tại xưởng đá.',
    storageCondition: 'Dựng nghiêng trên giá chữ A tại chân cầu thang.'
  },
  {
    id: 'lead_tbvs',
    materialName: 'Thiết bị vệ sinh (Bồn cầu, lavabo, sen vòi) & Thiết bị chiếu sáng',
    orderLeadTimeDays: 'Chốt mẫu Tuần 6 – 8; Giao hàng trước ngày lắp 2 – 3 ngày',
    orderTriggerMilestone: 'Chỉ giao đến công trình khi phòng WC đã ốp lát gạch và lắp xong cửa khóa an toàn (Tuần 14)',
    responsibleParty: 'Gia chủ (Khoán nhân công)',
    criticalRiskWarning: 'NẾU CHỞ ĐẾN QUÁ SỚM: Công trường lộn xộn rất dễ bị va quệt làm nứt mẻ đồ sứ, xước sen vòi mạ crom hoặc bị thất thoát mất cắp thiết bị đắt tiền.',
    storageCondition: 'Cất trong phòng kín đã có khóa cửa, nguyên hộp carton của nhà sản xuất.'
  }
];

// PHẦN F — GIẢI PHÁP MẶT BẰNG CÔNG TRƯỜNG & KHO BÃI ĐẤT HẸP (~100m²)
export const SITE_LOGISTICS_GUIDELINE = `GIẢI PHÁP BỐ TRÍ MẶT BẰNG CÔNG TRƯỜNG & KHO BÃI CHO KHU ĐẤT HẸP (≈ 100m²: 5x20m hoặc 7x14m):

1. GIAI ĐOẠN ĐÀO MÓNG (TUẦN 1 – 3):
- Đất đào móng: Xúc chuyển ngay lên xe ben vận chuyển ra bãi tập kết trong đêm. Chỉ giữ lại 30% đất/cát sạch tại góc sân để lấp đầm tôn nền sau khi đổ giằng móng.
- Vị trí máy trộn & máy cắt uốn thép: Đặt tại khoảng lùi sân trước (rộng 3-4m) hoặc vỉa hè (đã xin giấy phép sử dụng tạm lòng lề đường của chính quyền địa phương).

2. BẢO QUẢN XI MĂNG & THÉP:
- Kho xi măng dã chiến: Bố trí tại góc khô ráo nhất trong nhà, kê pallet gỗ/nhựa cao >20cm so với mặt nền, cách tường >30cm, phủ bạt 2 lớp chống hắt mưa.
- Bãi thép cây: Xếp dọc theo chiều dài sân trước có mái che bạt tạm. Thép cắt đai đưa vào bàn uốn ngay, không để thép đai nằm rải rác dưới bùn đất.

3. TẬP KẾT CÁT ĐÁ THEO ĐỢT:
- Nhập cát đá bằng xe tải nhỏ 3-5m³ theo từng đợt đổ bê tông / xây trát, đổ vào ô quây be bằng ván cốp pha để tránh cát tràn ra đường gây ô nhiễm môi trường và phạt vi phạm trật tự đô thị.`;

// PHẦN G — QUY TRÌNH NGHIỆM THU CÔNG TÁC KHUẤT LẤP & CHỐNG TRÁO VẬT TƯ (HIDDEN WORK INSPECTION)
export const HIDDEN_WORK_INSPECTION_PROTOCOL = `QUY TRÌNH NGHIỆM THU CÔNG TÁC KHUẤT LẤP & CAM KẾT CHỐNG TRÁO ĐỔI VẬT TƯ:

1. ĐỊNH NGHĨA CÔNG TÁC KHUẤT LẤP (HIDDEN WORK):
Là các hạng mục kết cấu sau khi thi công sẽ bị che khuất vĩnh viễn (Cốt thép móng, dầm, sàn trước khi đổ bê tông; Đường ống nước, dây điện âm tường âm sàn; Lớp màng chống thấm trước khi cán vữa ốp gạch). Nếu làm sai hoặc tráo vật tư rẻ tiền thì sau này không thể nhìn thấy bằng mắt thường, gây nguy cơ nứt gãy sập nhà hoặc chập cháy nổ!

2. QUY TRÌNH 4 BƯỚC BẮT BUỘC TRƯỚC KHI ĐƯỢC PHÉP ĐỔ BÊ TÔNG / TRÁT TƯỜNG:
- Bước 1 (Kiểm tra mác thép & Logo dập nổi): Chủ nhà/Giám sát trực tiếp kiểm tra logo dập nổi trên thân thép (Ví dụ: Thép Hòa Phát dập chữ 'HOA PHAT' + biểu tượng bông lúa; Thép Việt Nhật dập hình hoa mai; Thép Pomina dập hình trái táo). Đối chiếu đường kính D14, D16, D18, D20 với bản vẽ thiết kế.
- Bước 2 (Đo đạc khoảng cách đai & Lớp bảo vệ): Dùng thước cuộn kiểm tra khoảng cách đai cột/dầm (a100 ở đầu cột, a150/a200 ở giữa nhịp); kiểm tra con kê bê tông dày 25-30mm để đảm bảo thép không bị lộ ra ngoài gây rỉ sét.
- Bước 3 (Thử áp lực nước ngầm & Đo thông mạch điện): Bơm nước ngâm áp lực 8 – 10 bar trong 24 giờ đối với đường ống nước nóng lạnh; dùng đồng hồ đo thông mạch và điện trở cách điện dây điện trước khi trát vữa.
- Bước 4 (Chụp ảnh 3 góc có GPS & Ký biên bản 2 bên): Chụp ảnh rõ nét 3 góc chụp cận cảnh có đặt thước đo kèm ngày giờ thực tế lưu trữ vào hồ sơ số của công trình. Hai bên (Chủ nhà & Kỹ sư trưởng) cùng ký vào 'Biên bản nghiệm thu công tác khuất lấp' mới được phép phát lệnh đổ bê tông.

3. CAM KẾT BẢO ĐẢM & CHẾ TÀI HỢP ĐỒNG:
- Nhà thầu cam kết 100% vật tư đưa vào công trình đúng chủng loại, nguồn gốc CO/CQ như phụ lục hợp đồng.
- NẾU PHÁT HIỆN TRÁO ĐỔI THÉP HOẶC VẬT TƯ KÉM CHẤT LƯỢNG: Nhà thầu có trách nhiệm đập bỏ, tháo dỡ toàn bộ hạng mục sai phạm và thi công lại đúng tiêu chuẩn bằng 100% chi phí của nhà thầu, đồng thời chịu phạt vi phạm hợp đồng theo mức quy định.`;
