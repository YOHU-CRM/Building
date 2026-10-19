/**
 * YOHU BUILD AI — Master BOQ Calculation Engine & Pricing Book
 * Version: 2026.09.16
 * Currency: VND
 * 
 * Ensures 100% mathematical consistency across:
 * - Admin CRM Reports
 * - UI Estimation Preview (3 Packages: Tiết Kiệm, Tiêu Chuẩn, Cao Cấp)
 * - 3-Page Customer PDF Export
 * - 10-Section Architectural & BOQ Technical Specification PDF Export
 */

import { resolveLocation } from './vnProvinces.js';

export type RegionKey = 'mien_bac' | 'mien_trung' | 'mien_nam' | 'do_thi_dac_biet' | 'mien_nui_hai_dao';
export type StructuralOptionKey = 'PA1' | 'PA2' | 'PA3';
export type FinishingPackageKey = 'tiet_kiem' | 'tieu_chuan' | 'cao_cap';

/**
 * HỆ SỐ HIỆU CHỈNH GIÁ THỊ TRƯỜNG — nút chỉnh DUY NHẤT để nâng/hạ toàn bộ đơn giá.
 * 1.00 = giữ nguyên bảng đơn giá gốc. Ví dụ 1.15 = tăng tất cả 15%.
 * Đội dự toán Yohu rà giá thị trường rồi chỉnh số này (màn hình, PDF, CRM cùng đổi).
 */
export const MARKET_CALIBRATION = 1.15; // tạm tăng 15% (14/10/2026) — chờ đội dự toán rà lại

export const REGIONAL_FACTORS: Record<RegionKey, { name: string; factor: number }> = {
  mien_bac: { name: 'Miền Bắc', factor: 1.0 },
  mien_trung: { name: 'Miền Trung', factor: 0.96 },
  mien_nam: { name: 'Miền Nam', factor: 1.05 },
  do_thi_dac_biet: { name: 'Đô Thị Đặc Biệt (Hà Nội, TP.HCM)', factor: 1.12 },
  mien_nui_hai_dao: { name: 'Miền Núi / Hải Đảo / Vùng Xa', factor: 1.18 }
};

export interface MasterBOQItemDef {
  id: string;
  category: 'foundation' | 'frame' | 'wall' | 'roof' | 'finishing' | 'mep' | 'overhead';
  categoryName: string;
  name: string;
  unit: string;
  options: StructuralOptionKey[]; // Which options include this item
  laborRatio?: number; // 0.0 to 1.0 (proportion of unit price allocated to labor)
  formulaDescription: string;
  computeQuantity: (params: {
    dien_tich_san: number;
    dien_tich_xay_dung: number;
    so_tang: number;
    so_wc: number;
    so_phong_ngu?: number;
    co_san_vuon: boolean;
  }) => { quantity: number; formattedQuantity: string };
  unitPrices: Record<FinishingPackageKey, number>;
  specs: Record<FinishingPackageKey, string>;
  technicalNote: string;
  clientExplanation: string;
}

export const MASTER_BOQ_ITEMS: MasterBOQItemDef[] = [
  // 1. KC_MONG_BTCT (PA1: BTCT Truyền Thống)
  {
    id: 'KC_MONG_BTCT',
    category: 'foundation',
    categoryName: '1. Kết Cấu Móng & Phần Thô',
    name: 'Bê tông móng băng/móng bè M250 đá 1x2 & Cốt thép móng theo thiết kế',
    unit: 'm²',
    options: ['PA1', 'PA2', 'PA3'],
    laborRatio: 0.35,
    formulaDescription: '= diện tích xây dựng × 1,0 m²',
    computeQuantity: ({ dien_tich_xay_dung }) => {
      const q = Math.round(dien_tich_xay_dung);
      return { quantity: q, formattedQuantity: `${q} m²` };
    },
    unitPrices: { tiet_kiem: 1150000, tieu_chuan: 1380000, cao_cap: 1720000 },
    specs: {
      tiet_kiem: 'Bê tông trộn tay mác 200, thép TCVN',
      tieu_chuan: 'Bê tông thương phẩm mác 250, thép Hòa Phát CB400',
      cao_cap: 'Bê tông tươi mác 300 phụ gia chống thấm, thép Vina Kyoei CB500'
    },
    technicalNote: 'Móng BTCT đổ toàn khối theo TCVN 9362:2012',
    clientExplanation: 'Phần móng vững chắc truyền tải trọng công trình an toàn xuống nền đất'
  },

  // 2. KC_KHUNG_BTCT (PA1: BTCT Truyền Thống)
  {
    id: 'KC_KHUNG_BTCT',
    category: 'frame',
    categoryName: '1. Kết Cấu Móng & Phần Thô',
    name: 'Bê tông cột, dầm, sàn mác M250/M300 & Cốp pha ván ép phủ phim',
    unit: 'm² sàn',
    options: ['PA1'],
    laborRatio: 0.35,
    formulaDescription: '= diện tích sàn × 1,0 m²',
    computeQuantity: ({ dien_tich_san }) => {
      const q = Math.round(dien_tich_san);
      return { quantity: q, formattedQuantity: `${q} m² sàn` };
    },
    unitPrices: { tiet_kiem: 1250000, tieu_chuan: 1480000, cao_cap: 1850000 },
    specs: {
      tiet_kiem: 'Bê tông thương phẩm mác 250, cốp pha ván gỗ',
      tieu_chuan: 'Bê tông thương phẩm mác 250/300, cốp pha phủ phim 18mm',
      cao_cap: 'Bê tông thương phẩm mác 350 phụ gia đông kết nhanh, cốp pha phủ phim chất lượng cao'
    },
    technicalNote: 'Khung dầm cột BTCT chịu tải trọng uốn cắt chính',
    clientExplanation: 'Khung xương bê tông cốt thép truyền thống kiên cố'
  },

  // 3. KC_XAY_TO_GACH (PA1: BTCT Truyền Thống)
  {
    id: 'KC_XAY_TO_GACH',
    category: 'wall',
    categoryName: '1. Kết Cấu Móng & Phần Thô',
    name: 'Xây tường gạch Tuynel & Trát vữa xi măng mác 75 hai mặt hoàn thiện',
    unit: 'm²',
    options: ['PA1'],
    laborRatio: 0.40,
    formulaDescription: '= diện tích sàn × 1,28 m²',
    computeQuantity: ({ dien_tich_san }) => {
      const q = Number((dien_tich_san * 1.28).toFixed(1));
      return { quantity: q, formattedQuantity: `${q} m²` };
    },
    unitPrices: { tiet_kiem: 310000, tieu_chuan: 380000, cao_cap: 490000 },
    specs: {
      tiet_kiem: 'Gạch thủ công / Tuynel loại 2, cát xây trát mịn vừa',
      tieu_chuan: 'Gạch Tuynel loại 1 nung chuẩn, vữa xi măng mác 75 cát vàng sàng sạch',
      cao_cap: 'Gạch Tuynel đặc biệt cao cấp, vữa trộn phụ gia chống thấm và chống nứt chân chim'
    },
    technicalNote: 'Xây tường 220 bao che và tường 110 ngăn phòng, đóng lưới chống nứt góc',
    clientExplanation: 'Hệ tường gạch kiên cố ngăn phòng và chống nóng cho căn nhà'
  },

  // 4. KC_KHUNG_THEP_TC (PA2: Khung Thép Tiền Chế)
  {
    id: 'KC_KHUNG_THEP_TC',
    category: 'frame',
    categoryName: '1. Kết Cấu Khung Thép & Sàn Nhẹ',
    name: 'Hệ khung cột dầm thép tiền chế I/H định hình & Thép hộp mạ kẽm chịu lực',
    unit: 'm² sàn',
    options: ['PA2'],
    laborRatio: 0.20,
    formulaDescription: '= diện tích sàn × 1,0 m²',
    computeQuantity: ({ dien_tich_san }) => {
      const q = Math.round(dien_tich_san);
      return { quantity: q, formattedQuantity: `${q} m² sàn` };
    },
    unitPrices: { tiet_kiem: 900000, tieu_chuan: 1110000, cao_cap: 1410000 }, // định vị Yohu: PA2 giá giữa PA1 & PA3,
    specs: {
      tiet_kiem: 'Thép hình tổ hợp trong nước, sơn chống rỉ 1 lớp',
      tieu_chuan: 'Thép hình Posco/An Khánh tiêu chuẩn SS400, sơn Epoxy 2 lớp chống rỉ',
      cao_cap: 'Thép hình nhập khẩu SS400/Q345B mạ kẽm nhúng nóng hoặc sơn phủ chống cháy 60 phút'
    },
    technicalNote: 'Khung thép liên kết bản mã bu-lông cường độ cao cấp bền 8.8',
    clientExplanation: 'Khung thép chịu lực tốt, lắp dựng nhanh hơn đổ bê tông tại chỗ'
  },

  // 5. KC_PANEL_EPS (PA2: Khung Thép Tiền Chế)
  {
    id: 'KC_PANEL_EPS',
    category: 'wall',
    categoryName: '1. Kết Cấu Khung Thép & Sàn Nhẹ',
    name: 'Vách ngăn & Tường bao Panel EPS cách âm cách nhiệt (2 mặt tôn mạ màu dày 0.4mm)',
    unit: 'm²',
    options: ['PA2'],
    laborRatio: 0.20,
    formulaDescription: '= diện tích sàn × 1,28 m²',
    computeQuantity: ({ dien_tich_san }) => {
      const q = Number((dien_tich_san * 1.28).toFixed(1));
      return { quantity: q, formattedQuantity: `${q} m²` };
    },
    unitPrices: { tiet_kiem: 190000, tieu_chuan: 240000, cao_cap: 310000 }, // định vị Yohu: PA2 giá giữa PA1 & PA3,
    specs: {
      tiet_kiem: 'Panel EPS dày 50mm, tôn 0.35mm, xốp thường',
      tieu_chuan: 'Panel EPS dày 75mm, tôn mạ màu Nam Kim/Hoa Sen 0.40mm, xốp EPS chống cháy lan',
      cao_cap: 'Panel PU/PIR cách nhiệt dày 75-100mm, tôn mạ vân gỗ kháng khuẩn cao cấp'
    },
    technicalNote: 'Ghép ngàm âm dương kín khít, bắn vít liên kết vào khung thép',
    clientExplanation: 'Vách lắp ghép nhẹ, cách nhiệt tuyệt vời làm nhà luôn mát mẻ'
  },

  // 6. NC_LAP_GHEP (PA2: Khung Thép Tiền Chế)
  {
    id: 'NC_LAP_GHEP',
    category: 'overhead',
    categoryName: '2. Nhân Công & Lắp Dựng Cơ Khí',
    name: 'Nhân công thợ cơ khí cẩu dựng khung thép, bắn sàn Cemboard & ghép vách Panel',
    unit: 'm² sàn',
    options: ['PA2'],
    laborRatio: 1.0,
    formulaDescription: '= diện tích sàn × 1,0 m²',
    computeQuantity: ({ dien_tich_san }) => {
      const q = Math.round(dien_tich_san);
      return { quantity: q, formattedQuantity: `${q} m² sàn` };
    },
    unitPrices: { tiet_kiem: 500000, tieu_chuan: 590000, cao_cap: 700000 }, // định vị Yohu: PA2 giá giữa PA1 & PA3,
    specs: {
      tiet_kiem: 'Đội thợ cơ khí phổ thông lắp ghép',
      tieu_chuan: 'Tổ thợ chuyên nghiệp siết bu-lông bằng máy cân lực, thợ bắn Cemboard lành nghề',
      cao_cap: 'Đội thợ cơ khí kết cấu bậc cao, xe cẩu chuyên dụng, kiểm định mối hàn siêu âm'
    },
    technicalNote: 'Kiểm tra độ thẳng đứng cột bằng máy thủy bình laser',
    clientExplanation: 'Thợ lắp dựng cơ khí nhanh chóng, sạch sẽ, không bụi bặm vữa ướt'
  },

  // 7. KC_BETONG_EPS (PA3: Bê Tông Nhẹ EPS & Gông 3D)
  {
    id: 'KC_BETONG_EPS',
    category: 'frame',
    categoryName: '1. Kết Cấu Bê Tông Nhẹ & Vách Đúc Liền Khối',
    name: 'Bê tông nhẹ hạt xốp EPS vách & cột đúc liền khối (Xi măng, cát mịn, hạt xốp EPS)',
    unit: 'm³',
    options: ['PA3'],
    laborRatio: 0.15,
    formulaDescription: '= diện tích sàn × 0,35 m³/m²',
    computeQuantity: ({ dien_tich_san }) => {
      const q = Number((dien_tich_san * 0.35).toFixed(1));
      return { quantity: q, formattedQuantity: `${q} m³` };
    },
    unitPrices: { tiet_kiem: 880000, tieu_chuan: 980000, cao_cap: 1120000 },
    specs: {
      tiet_kiem: 'Xi măng PCB30, hạt EPS tái sinh tuyển chọn, cát đen mịn sàng lọc',
      tieu_chuan: 'Xi măng Nghi Sơn/Vicem PCB40, hạt EPS nguyên sinh 2-4mm, cát vàng mịn sàng sạch',
      cao_cap: 'Xi măng Holcim/Insee PCB40, hạt EPS nguyên sinh tỷ trọng cao chống cháy lan, cát thạch anh'
    },
    technicalNote: 'Bê tông hạt xốp EPS đúc liền khối nguyên khối không mạch ngừng, cách âm >45dB, mát hơn 4-6°C',
    clientExplanation: 'Vách đúc nguyên khối chống ồn, chống nóng vượt trội và hạn chế nồm ẩm'
  },

  // 8. KC_COT_THEP (PA1 & PA3)
  {
    id: 'KC_COT_THEP',
    category: 'frame',
    categoryName: '1. Kết Cấu Móng & Thân Công Trình',
    name: 'Cốt thép cột chịu lực D14 & Lưới thép liên kết gia cường vách/sàn',
    unit: 'kg',
    options: ['PA1', 'PA3'],
    laborRatio: 0.20,
    formulaDescription: '= diện tích sàn × 18 kg/m²',
    computeQuantity: ({ dien_tich_san }) => {
      const q = Math.round(dien_tich_san * 18);
      return { quantity: q, formattedQuantity: `${q.toLocaleString('vi-VN')} kg` };
    },
    unitPrices: { tiet_kiem: 16200, tieu_chuan: 17500, cao_cap: 18900 },
    specs: {
      tiet_kiem: 'Thép tổ hợp đạt chuẩn TCVN 1651:2018 (Việt Sing/Việt Mỹ)',
      tieu_chuan: 'Thép Hòa Phát/Pomina CB400-V, lưới thép hàn D4 a100x100 gia cường 2 mặt vách',
      cao_cap: 'Thép Nhật Việt (Vina Kyoei) CB500-V mạ kẽm nhúng nóng, lưới inox 304 gia cường góc chịu lực'
    },
    technicalNote: 'Thép chịu lực dọc bẻ mỏ neo ngàm vào móng và giằng theo TCVN 5574:2018',
    clientExplanation: 'Khung cốt thép chuẩn cường độ cao tạo khung xương vững chãi cho căn nhà'
  },

  // 9. KC_CEMBOARD (PA2 & PA3)
  {
    id: 'KC_CEMBOARD',
    category: 'wall',
    categoryName: '1. Kết Cấu & Thân Công Trình',
    name: 'Tấm Cemboard 8mm dẫn hướng định hình phẳng bề mặt thành vách',
    unit: 'm²',
    options: ['PA2', 'PA3'],
    laborRatio: 0.15,
    formulaDescription: '= diện tích sàn × 1,6 m²/m²',
    computeQuantity: ({ dien_tich_san }) => {
      const q = Number((dien_tich_san * 1.6).toFixed(1));
      return { quantity: q, formattedQuantity: `${q} m²` };
    },
    unitPrices: { tiet_kiem: 162000, tieu_chuan: 185000, cao_cap: 215000 },
    specs: {
      tiet_kiem: 'Tấm xi măng Duralex/BKT 8mm sản xuất trong nước',
      tieu_chuan: 'Tấm SCG Smartboard Thái Lan 8mm chịu ẩm, chịu nước tốt',
      cao_cap: 'Tấm Duraflex Vĩnh Tường 9mm sợi cellulose tự nhiên tiêu chuẩn xanh'
    },
    technicalNote: 'Bắn vít liên kết khung xương dẫn hướng, chống rỗ bề mặt khi bơm vữa nhẹ',
    clientExplanation: 'Tấm định hình phẳng giúp bề mặt vách nhẵn bóng, không cần trát vữa xi măng dày'
  },

  // 10. KC_PHU_GIA (PA3)
  {
    id: 'KC_PHU_GIA',
    category: 'frame',
    categoryName: '1. Kết Cấu Bê Tông Nhẹ & Vách Đúc Liền Khối',
    name: 'Bộ phụ gia hóa dẻo tự lèn ViscoCrete + Sikament R7 đông kết nhanh 24h + HPMC',
    unit: 'kg/lít',
    options: ['PA3'],
    laborRatio: 0.0,
    formulaDescription: '= diện tích sàn × 1,1 kg-lít/m²',
    computeQuantity: ({ dien_tich_san }) => {
      const q = Number((dien_tich_san * 1.1).toFixed(1));
      return { quantity: q, formattedQuantity: `${q} kg/lít` };
    },
    unitPrices: { tiet_kiem: 105000, tieu_chuan: 120000, cao_cap: 142000 },
    specs: {
      tiet_kiem: 'Phụ gia hóa dẻo nội địa đạt ASTM C494 Type A, hỗ trợ tháo gông 48h',
      tieu_chuan: 'Sika ViscoCrete-3000 + Sikament R7 đông kết nhanh 24h, tháo gông định hình an toàn',
      cao_cap: 'Grace ADVA cao cấp nhập khẩu Thụy Sỹ, tự lèn tốt, chống thấm thẩm thấu tinh thể'
    },
    technicalNote: 'Phụ gia hóa dẻo giúp bê tông EPS tự chảy lèn kín mọi ngóc ngách không cần đầm dùi',
    clientExplanation: 'Giúp vách đạt cường độ nhanh, tháo dỡ gông sau 24h để hoàn thiện siêu tốc'
  },

  // 11. KC_GONG_3D (PA3)
  {
    id: 'KC_GONG_3D',
    category: 'frame',
    categoryName: '1. Kết Cấu Bê Tông Nhẹ & Vách Đúc Liền Khối',
    name: 'Khấu hao bộ Gông định hình 3D bản quyền YOHU & Xe tời máy bơm chuyên dụng',
    unit: 'Gói',
    options: ['PA3'],
    laborRatio: 0.10,
    formulaDescription: '1 Gói luân chuyển trọn gói',
    computeQuantity: () => ({ quantity: 1, formattedQuantity: '1 Gói' }),
    unitPrices: { tiet_kiem: 5200000, tieu_chuan: 6000000, cao_cap: 7000000 },
    specs: {
      tiet_kiem: 'Gông thép hộp tiêu chuẩn định hình phẳng 95%',
      tieu_chuan: 'Hệ Gông định hình 3D bản quyền YOHU, ti ren D12 tán chuồn, phẳng nhẵn 99%',
      cao_cap: 'Hệ Gông hợp kim nhôm định hình cao cấp CNC sai số dưới 1mm, bề mặt láng mịn'
    },
    technicalNote: 'Hệ gông khóa phẳng 2 mặt vách, chịu áp lực vữa bơm không bị phình cong',
    clientExplanation: 'Bộ khuôn gông cơ khí bản quyền giữ vách thẳng đứng, hạn chế xô lệch khi đổ'
  },

  // 12. NC_LAP_DUNG_EPS (PA3)
  {
    id: 'NC_LAP_DUNG_EPS',
    category: 'overhead',
    categoryName: '2. Nhân Công & Thi Công',
    name: 'Nhân công thợ cơ khí lắp dựng gông 3D & vận hành bơm bê tông nhẹ đúc liền khối',
    unit: 'm² sàn',
    options: ['PA3'],
    laborRatio: 1.0,
    formulaDescription: '= diện tích sàn × 1,0 m²',
    computeQuantity: ({ dien_tich_san }) => {
      const q = Math.round(dien_tich_san);
      return { quantity: q, formattedQuantity: `${q} m² sàn` };
    },
    unitPrices: { tiet_kiem: 820000, tieu_chuan: 920000, cao_cap: 1050000 },
    specs: {
      tiet_kiem: 'Đội thợ thi công theo quy trình phổ thông, giám sát bán thời gian',
      tieu_chuan: 'Tổ thợ chuyên nghiệp được YOHU cấp chứng chỉ vận hành máy bơm & gông 3D, kỹ sư giám sát thường xuyên',
      cao_cap: 'Đội ngũ nghệ nhân thi công cao cấp, giám sát trưởng túc trực 24/7, nghiệm thu laser 3D'
    },
    technicalNote: 'Đội thợ đào tạo kỹ thuật đúc liền khối và căn chỉnh nivo laser chuẩn xác',
    clientExplanation: 'Đội ngũ thợ tay nghề cao thi công nhanh chóng, an toàn và đảm bảo kỹ thuật'
  },

  // 13. ME_AM_TUONG (All Options)
  {
    id: 'ME_AM_TUONG',
    category: 'mep',
    categoryName: '3. Cơ Điện M&E & Cấp Thoát Nước',
    name: 'Hệ thống điện nước M&E âm tường (Dây điện Cadisun, ống gen SP, ống cấp hàn nhiệt PPR PN16)',
    unit: 'm² sàn',
    options: ['PA1', 'PA2', 'PA3'],
    laborRatio: 0.35,
    formulaDescription: '= diện tích sàn × 1,0 m²',
    computeQuantity: ({ dien_tich_san }) => {
      const q = Math.round(dien_tich_san);
      return { quantity: q, formattedQuantity: `${q} m² sàn` };
    },
    unitPrices: { tiet_kiem: 640000, tieu_chuan: 750000, cao_cap: 920000 },
    specs: {
      tiet_kiem: 'Dây điện Trần Phú, ống luồn PVC Sino, ống nước Tiền Phong C2',
      tieu_chuan: 'Dây điện Cadisun đôi 2x4mm² & 2x2.5mm² luồn ống gen SP chống cháy, ống nước PPR hàn nhiệt Tiền Phong PN16',
      cao_cap: 'Dây điện Cadivi ruột đồng 99.99% vỏ XLPE chậm cháy, ống cấp PPR Vesbo/Rehau Đức kháng khuẩn'
    },
    technicalNote: 'Phân tách lộ dây đôi chịu tải và dây đơn chiếu sáng, test áp lực nước 10 bar trước khi đóng vách',
    clientExplanation: 'Đường điện nước âm thẩm mỹ, đi trong ống bảo vệ, giảm nguy cơ chập cháy và rò rỉ'
  },

  // 14. HT_MAI (All Options)
  {
    id: 'HT_MAI',
    category: 'roof',
    categoryName: '4. Mái & Chống Thấm',
    name: 'Hệ mái vì kèo thép nhẹ + Lợp ngói sóng tráng men / Tôn PU 3 lớp & Chống thấm',
    unit: 'm² mái',
    options: ['PA1', 'PA2', 'PA3'],
    laborRatio: 0.30,
    formulaDescription: '= diện tích xây dựng × 1,13 m²',
    computeQuantity: ({ dien_tich_xay_dung }) => {
      const q = Number((dien_tich_xay_dung * 1.13).toFixed(1));
      return { quantity: q, formattedQuantity: `${q} m² mái` };
    },
    unitPrices: { tiet_kiem: 340000, tieu_chuan: 420000, cao_cap: 580000 },
    specs: {
      tiet_kiem: 'Tôn lạnh Đông Á/Nam Kim 0.40mm, xà gồ mạ kẽm hộp 40x80',
      tieu_chuan: 'Ngói lợp Prime/Fuji tráng men cao cấp hoặc Tôn PU Hoa Sen 3 lớp cách nhiệt 50mm, xà gồ Smartruss',
      cao_cap: 'Ngói gốm phẳng tráng men nhập khẩu Thái Lan SCG/Fuji hoặc Tôn phủ nhựa ASA 4 lớp cao cấp'
    },
    technicalNote: 'Độ dốc thoát nước chuẩn, vít inox gioăng cao su EPDM chống rò rỉ nước mưa',
    clientExplanation: 'Mái nhà che mưa chắn nắng bền đẹp, cách nhiệt và thoát nước mưa siêu nhanh'
  },

  // 15. HT_CUA (All Options)
  {
    id: 'HT_CUA',
    category: 'finishing',
    categoryName: '5. Hoàn Thiện Kiến Trúc & Cửa',
    name: 'Hệ cửa đi & cửa sổ nhôm kính Xingfa hệ 55 + Kính an toàn dán 2 lớp',
    unit: 'm² cửa',
    options: ['PA1', 'PA2', 'PA3'],
    laborRatio: 0.15,
    formulaDescription: '= bóc tách theo số phòng ngủ, phòng vệ sinh & diện tích sàn',
    computeQuantity: ({ dien_tich_san, so_tang, so_phong_ngu, so_wc }) => {
      const numBeds = Math.max(1, so_phong_ngu || (so_tang === 1 ? 3 : Math.max(3, so_tang + 1)));
      const numWc = Math.max(1, so_wc || (so_tang === 1 ? 2 : so_tang));
      const mainDoorArea = 5.0;
      const roomDoorsArea = numBeds * 1.8;
      const wcDoorsArea = numWc * 1.4;
      const backDoorsArea = Math.max(1, so_tang) * 1.8;
      const windowsArea = (1 + numBeds + 1 + Math.max(0, so_tang - 1)) * 2.0;
      const calcDoorArea = mainDoorArea + roomDoorsArea + wcDoorsArea + backDoorsArea + windowsArea;
      
      const q = Number((Math.max(calcDoorArea, dien_tich_san * 0.1736)).toFixed(1));
      return { quantity: q, formattedQuantity: `${q} m² cửa` };
    },
    unitPrices: { tiet_kiem: 1580000, tieu_chuan: 2150000, cao_cap: 3000000 },
    specs: {
      tiet_kiem: 'Nhôm hệ 700/1000 sơn tĩnh điện, kính trắng dán an toàn 6.38mm',
      tieu_chuan: 'Nhôm Xingfa hệ 55 nhập khẩu chính hãng tem đỏ, phụ kiện Kinlong đồng bộ, kính an toàn 8.38mm',
      cao_cap: 'Nhôm cầu cách nhiệt Schuco/Civro cao cấp, phụ kiện Roto/Hopo Đức, kính hộp phản quang low-e 19mm'
    },
    technicalNote: 'Khuôn cửa chèn dưỡng chuẩn Lỗ Ban 52.2cm, bơm keo foam nở và silicone A500',
    clientExplanation: 'Cửa nhôm kính sang trọng, cách âm cách nhiệt kín khít, đóng mở êm ái'
  },

  // 16. HT_GACH_DA (All Options)
  {
    id: 'HT_GACH_DA',
    category: 'finishing',
    categoryName: '5. Hoàn Thiện Kiến Trúc & Cửa',
    name: 'Gạch ốp lát nền Porcelain & Tường WC, đá bậc tam cấp Granite tự nhiên',
    unit: 'm² nền',
    options: ['PA1', 'PA2', 'PA3'],
    laborRatio: 0.35,
    formulaDescription: '= diện tích sàn × 0,8264 m²',
    computeQuantity: ({ dien_tich_san }) => {
      const q = Number((dien_tich_san * 0.8264).toFixed(1));
      return { quantity: q, formattedQuantity: `${q} m² nền` };
    },
    unitPrices: { tiet_kiem: 235000, tieu_chuan: 300000, cao_cap: 470000 },
    specs: {
      tiet_kiem: 'Gạch Ceramic Viglacera 600x600, đá tam cấp granite tím mông cổ',
      tieu_chuan: 'Gạch Porcelain Prime/Taicera 800x800 xương bán sứ, đá tam cấp & cầu thang Granite Kim Sa Trung',
      cao_cap: 'Gạch Granite nhập khẩu Ấn Độ/Ý 600x1200 bóng kiếng nano, đá Marble tự nhiên ốp sảnh & bậc cấp'
    },
    technicalNote: 'Lát gạch dùng ke cân bằng nẹp góc phẳng đều, chà ron keo epoxy chống ố mốc',
    clientExplanation: 'Nền nhà sáng bóng, chống trơn trượt, dễ dàng lau chùi vệ sinh'
  },

  // 17. HT_SON (All Options)
  {
    id: 'HT_SON',
    category: 'finishing',
    categoryName: '5. Hoàn Thiện Kiến Trúc & Cửa',
    name: 'Sơn bả dẻo acrylic chống nứt + 1 lớp lót kiềm + 2 lớp phủ Dulux Weathershield / EasyClean',
    unit: 'm² tường',
    options: ['PA1', 'PA2', 'PA3'],
    laborRatio: 0.40,
    formulaDescription: '= diện tích sàn × 2,56 m²',
    computeQuantity: ({ dien_tich_san }) => {
      const q = Number((dien_tich_san * 2.56).toFixed(1));
      return { quantity: q, formattedQuantity: `${q} m² tường` };
    },
    unitPrices: { tiet_kiem: 62000, tieu_chuan: 82000, cao_cap: 115000 },
    specs: {
      tiet_kiem: 'Bột bả Việt Mỹ, sơn nội ngoại thất Maxilite lau chùi',
      tieu_chuan: 'Bột bả dẻo acrylic chống nứt, sơn lót kháng kiềm + sơn phủ Dulux Weathershield / EasyClean 5in1',
      cao_cap: 'Bột bả cao cấp Jotun, sơn ngoại thất Jotun Jotashield bền màu 12 năm, sơn nội thất Jotun Majestic'
    },
    technicalNote: 'Xả nhám phẳng mịn bề mặt, quét lót kiềm chuyên dụng trước khi sơn màu 2 nước',
    clientExplanation: 'Nước sơn màu sắc tươi sáng, chống thấm nước, chống rêu mốc và dễ lau sạch vết bẩn'
  },

  // 18. HT_TBVS (All Options)
  {
    id: 'HT_TBVS',
    category: 'finishing',
    categoryName: '6. Thiết Bị Hoàn Thiện & Tiện Ích',
    name: 'Thiết bị vệ sinh trọn bộ phòng tắm (Bệt Inax liền khối, sen cây đứng, lavabo âm bàn)',
    unit: 'Bộ',
    options: ['PA1', 'PA2', 'PA3'],
    laborRatio: 0.15,
    formulaDescription: '= số phòng vệ sinh thực tế (bộ)',
    computeQuantity: ({ so_wc }) => ({ quantity: so_wc, formattedQuantity: `${so_wc} Bộ WC` }),
    unitPrices: { tiet_kiem: 12500000, tieu_chuan: 17500000, cao_cap: 32000000 },
    specs: {
      tiet_kiem: 'Bệt liền khối Viglacera, sen vòi đồng mạ crom nội địa',
      tieu_chuan: 'Bệt liền khối Inax nắp êm, vòi sen tắm cây đứng Inax đồng thau mạ niken-crom 3 lớp, chậu lavabo âm bàn',
      cao_cap: 'Trọn bộ thiết bị Toto/Kohler cao cấp, bệt thông minh nắp điện tử, sen tắm điều nhiệt massage'
    },
    technicalNote: 'Phụ kiện van khóa đồng, xiphong thoát nước ngăn mùi hôi',
    clientExplanation: 'Trọn bộ thiết bị vệ sinh sang trọng, men sứ Aqua Ceramic chống bám bẩn'
  },

  // 19. HT_DEN_TB (All Options)
  {
    id: 'HT_DEN_TB',
    category: 'finishing',
    categoryName: '6. Thiết Bị Hoàn Thiện & Tiện Ích',
    name: 'Thiết bị điện rời hoàn thiện (Đèn LED âm trần Panasonic, công tắc ổ cắm an toàn, quạt hút)',
    unit: 'Gói',
    options: ['PA1', 'PA2', 'PA3'],
    laborRatio: 0.15,
    formulaDescription: '1 Gói trọn bộ công trình',
    computeQuantity: () => ({ quantity: 1, formattedQuantity: '1 Gói' }),
    unitPrices: { tiet_kiem: 17000000, tieu_chuan: 26000000, cao_cap: 52000000 },
    specs: {
      tiet_kiem: 'Đèn LED Rạng Đông âm trần 7W, công tắc Sino/Vanlock',
      tieu_chuan: 'Đèn LED Kingled/Panasonic 9W tiết kiệm điện, công tắc ổ cắm Panasonic dòng Wide Series an toàn trẻ nhỏ',
      cao_cap: 'Hệ thống chiếu sáng thông minh Philips Hue/Schneider, công tắc cảm ứng mặt kính SmartHome điều khiển qua điện thoại'
    },
    technicalNote: 'Thiết bị bảo vệ Aptomat chống giật RCBO Panasonic cho từng tầng và từng lộ ẩm ướt',
    clientExplanation: 'Hệ thống đèn LED tiết kiệm điện năng và công tắc ổ cắm an toàn cho gia đình'
  },

  // 20. HT_TRAN (All Options)
  {
    id: 'HT_TRAN',
    category: 'finishing',
    categoryName: '5. Hoàn Thiện Kiến Trúc & Cửa',
    name: 'Trần thạch cao khung xương chìm Vĩnh Tường chịu ẩm & Trần nhựa Nano phòng bếp/WC',
    unit: 'm²',
    options: ['PA1', 'PA2', 'PA3'],
    laborRatio: 0.30,
    formulaDescription: '= diện tích sàn các tầng × 0,9 (trừ ô thang, giếng trời, ban công)',
    computeQuantity: ({ dien_tich_san }) => {
      const q = Math.round(dien_tich_san * 0.9);
      return { quantity: q, formattedQuantity: `${q} m²` };
    },
    unitPrices: { tiet_kiem: 135000, tieu_chuan: 175000, cao_cap: 285000 },
    specs: {
      tiet_kiem: 'Khung xương thạch cao Hà Nội, tấm thạch cao tiêu chuẩn 9mm',
      tieu_chuan: 'Khung xương chìm Vĩnh Tường Basi, tấm thạch cao Gyproc 9mm chịu ẩm hoặc Tấm ốp Nano phẳng',
      cao_cap: 'Trần thạch cao tiêu âm Vĩnh Tường Siêu Bền + giật cấp 3 lớp đèn hắt hiện đại, phào chỉ PVC hoa văn cao cấp'
    },
    technicalNote: 'Ty treo mạ kẽm bắt nở đạn chắc chắn, xử lý mối nối băng keo lưới chống nứt trần',
    clientExplanation: 'Trần nhà phẳng đẹp, che giấu đường ống kỹ thuật và tạo điểm nhấn đèn hắt ấm cúng'
  },

  // 21. HT_TU_BEP (All Options)
  {
    id: 'HT_TU_BEP',
    category: 'finishing',
    categoryName: '6. Thiết Bị Hoàn Thiện & Tiện Ích',
    name: 'Tủ bếp trên + dưới MDF lõi xanh An Cường chống ẩm, mặt đá Granite, chậu vòi Inox 304',
    unit: 'Gói',
    options: ['PA1', 'PA2', 'PA3'],
    laborRatio: 0.15,
    formulaDescription: '1 Gói hoàn thiện gian bếp',
    computeQuantity: () => ({ quantity: 1, formattedQuantity: '1 Gói' }),
    unitPrices: { tiet_kiem: 24000000, tieu_chuan: 38000000, cao_cap: 78000000 },
    specs: {
      tiet_kiem: 'Tủ bếp nhôm kính Omega/MDF phủ melamine chống ẩm, đá đen Huế',
      tieu_chuan: 'Tủ bếp MDF lõi xanh chống ẩm An Cường phủ Acrylic bóng gương, đá Granite bàn bếp, chậu đúc Inox 304 2 hố',
      cao_cap: 'Tủ bếp hợp kim nhôm cánh kính cường lực bền, không mối mọt, phụ kiện Hafele/Blum giảm chấn tự động'
    },
    technicalNote: 'Phụ kiện bản lề giảm chấn inox 304 chống rỉ sét trong môi trường ẩm mặn',
    clientExplanation: 'Gian bếp tiện nghi, ngăn nắp, bề mặt đá bền chắc dễ lau chùi dầu mỡ'
  },

  // 22. HT_BE_PHOT (All Options)
  {
    id: 'HT_BE_PHOT',
    category: 'foundation',
    categoryName: '1. Kết Cấu & Thân Công Trình',
    name: 'Bể tự hoại 3 ngăn bê tông đúc liền khối thể tích 4.5m³ & Hố ga thoát nước ngăn mùi',
    unit: 'Gói',
    options: ['PA1', 'PA2', 'PA3'],
    laborRatio: 0.35,
    formulaDescription: '1 Gói công trình ngầm',
    computeQuantity: () => ({ quantity: 1, formattedQuantity: '1 Gói' }),
    unitPrices: { tiet_kiem: 13000000, tieu_chuan: 18000000, cao_cap: 26000000 },
    specs: {
      tiet_kiem: 'Bể phốt xây gạch đặc trát chống thấm 3 lớp, thể tích 3m³',
      tieu_chuan: 'Bể tự hoại 3 ngăn đúc bê tông liền khối chống nứt rò rỉ rác thải sinh hoạt thể tích 4.5m³, hố ga ngăn mùi',
      cao_cap: 'Bể tự hoại thông minh đúc sẵn kết hợp hệ vi sinh xử lý nước thải sinh hoạt đạt chuẩn xả thải môi trường'
    },
    technicalNote: 'Xử lý chống thấm kỹ bằng sika latex, ống thông hơi phi 60 thoát khí an toàn',
    clientExplanation: 'Hệ thống tự hoại xử lý sạch sẽ chất thải sinh hoạt, ngăn mùi hôi triệt để'
  },

  // 23. HT_SAN_VUON (Optional when co_san_vuon = true)
  {
    id: 'HT_SAN_VUON',
    category: 'finishing',
    categoryName: '6. Thiết Bị Hoàn Thiện & Tiện Ích',
    name: 'Đổ bê tông nền sân, đan lưới thép D6 & Lát gạch sân vườn chống trơn Prime 400x400',
    unit: 'Gói',
    options: ['PA1', 'PA2', 'PA3'],
    laborRatio: 0.35,
    formulaDescription: '1 Gói hoàn thiện ngoại cảnh',
    computeQuantity: ({ co_san_vuon }) => ({ quantity: co_san_vuon ? 1 : 0, formattedQuantity: co_san_vuon ? '1 Gói' : '0' }),
    unitPrices: { tiet_kiem: 15000000, tieu_chuan: 22000000, cao_cap: 38000000 },
    specs: {
      tiet_kiem: 'Đổ bê tông sân dày 7cm mác 150, đánh màu xi măng',
      tieu_chuan: 'Đổ bê tông lót nền đan lưới thép D6 và lát gạch men sân vườn chống trơn Prime/Viglacera 400x400',
      cao_cap: 'Lát đá bazan khò lửa tự nhiên hoặc đá cubic chống trơn, tiểu cảnh bồn hoa tam cấp ốp đá cao cấp'
    },
    technicalNote: 'Tạo dốc 1.5% thoát nước mưa ra cống ngoài đường, chống đọng vũng',
    clientExplanation: 'Sân nhà sạch sẽ, lát gạch chống trơn an toàn cho người già và trẻ nhỏ'
  }
];

export interface BOQCalculatedLine {
  item: MasterBOQItemDef;
  quantity: number;
  formattedQuantity: string;
  formattedQty?: string;
  unitPrice: number;
  formattedUnitPrice: string;
  totalAmount: number;
  formattedTotalAmount: string;
  materialAmount?: number;
  laborAmount?: number;
  spec: string;
  yeuCau?: string[];          // yêu cầu gia chủ đã áp vào dòng này
}

export interface FullProjectEstimateResult {
  optionKey: StructuralOptionKey;
  packageKey: FinishingPackageKey;
  regionKey: RegionKey;
  regionName: string;
  regionFactor: number;
  dien_tich_san: number;            // sàn thực = diện tích xây dựng × số tầng
  dien_tich_xay_dung: number;       // phần nhà chiếm đất
  dien_tich_quy_doi: number;        // sàn + móng + mái quy đổi (để so sánh báo giá)
  he_so_quy_doi: { mong: number; mai: number };
  nen_mong: FoundationDecision;
  loai_mai_tinh: RoofKind;
  so_tang: number;
  so_wc: number;
  so_phong_ngu?: number;
  co_san_vuon: boolean;
  
  lines: BOQCalculatedLine[];
  tong_boq: number;
  formatted_tong_boq: string;
  
  chi_phi_chung: number;
  formatted_chi_phi_chung: string;
  ty_le_chi_phi_chung: number;
  
  // Trọn gói chìa khóa trao tay (Vật tư + Thiết bị + Nhân công + Chi phí chung)
  tong_tron_goi: number;
  formatted_tong_tron_goi: string;
  costBillion: string;
  suat_dau_tu_m2: number;
  formatted_suat_dau_tu_m2: string;

  // Bóc tách trường hợp Gia chủ khoán nhân công (Gia chủ tự mua vật tư & thiết bị)
  tong_vat_tu_thiet_bi: number;
  formatted_tong_vat_tu_thiet_bi: string;
  tong_khoan_nhan_cong: number;
  formatted_tong_khoan_nhan_cong: string;
  suat_khoan_nhan_cong_m2: number;
  formatted_suat_khoan_nhan_cong_m2: string;

  // Comparison for all 3 packages under current option & region
  allPackages: Record<FinishingPackageKey, {
    packageKey: FinishingPackageKey;
    title: string;
    desc: string;
    suat_dau_tu_m2: number;
    formatted_suat_dau_tu_m2: string;
    tong_tron_goi: number;
    formatted_tong_tron_goi: string;
    tong_khoan_nhan_cong: number;
    formatted_tong_khoan_nhan_cong: string;
    tong_vat_tu_thiet_bi: number;
    formatted_tong_vat_tu_thiet_bi: string;
    costBillion: string;
  }>;
}

export type RoofKind = 'ton' | 'ngoi' | 'btct' | 'thai_nhat';

/** Lựa chọn vật tư / kỹ thuật gia chủ chọn ở Bước B (StructuralOptionsSection) */
export interface CustomerChoices {
  mac_be_tong?: string; mac_thep?: string; loai_gach?: string; bien_phap_cop_pha?: string;
  ty_trong_eps?: string; do_day_vach_eps?: string; loai_san?: string; loai_vach?: string;
  thep_hop_cot?: string; loai_mai?: string;
}
export const CHOICE_LABEL: Record<keyof CustomerChoices | 'loai_tran', string> = {
  mac_be_tong: 'Mác bê tông', mac_thep: 'Mác thép', loai_gach: 'Gạch xây', bien_phap_cop_pha: 'Cốp pha',
  ty_trong_eps: 'Tỷ trọng bê tông EPS', do_day_vach_eps: 'Độ dày vách EPS', loai_san: 'Loại sàn', loai_vach: 'Loại vách',
  thep_hop_cot: 'Thép hộp cột', loai_mai: 'Loại mái', loai_tran: 'Loại trần'
};
/** Dòng dự toán chịu ảnh hưởng của từng lựa chọn */
const CHOICE_TARGET: Record<keyof CustomerChoices, string[]> = {
  mac_be_tong: ['KC_MONG_BTCT', 'KC_KHUNG_BTCT'], mac_thep: ['KC_MONG_BTCT', 'KC_COT_THEP'], loai_gach: ['KC_XAY_TO_GACH'],
  bien_phap_cop_pha: ['KC_KHUNG_BTCT'], ty_trong_eps: ['KC_BETONG_EPS'], do_day_vach_eps: ['KC_BETONG_EPS'],
  loai_san: ['KC_CEMBOARD'], loai_vach: ['KC_PANEL_EPS'], thep_hop_cot: ['KC_KHUNG_THEP_TC'], loai_mai: ['HT_MAI']
};

/** Ghi lựa chọn của gia chủ vào TÊN + QUY CÁCH (và khối lượng nếu lựa chọn làm đổi khối lượng) của đúng dòng dự toán.
 *  Thay đúng chữ trong quy cách gốc (vd "mác 250" → "M300") để không còn mâu thuẫn với yêu cầu của gia chủ. */
function applyChoices(item: MasterBOQItemDef, spec0: string, quantity: number, formattedQuantity: string, yc?: CustomerChoices, loaiTran?: string) {
  let spec = spec0, q = quantity, fq = formattedQuantity;
  const applied: string[] = [];
  if (item.id === 'HT_TRAN' && loaiTran && String(loaiTran).trim()) applied.push(`${CHOICE_LABEL.loai_tran}: ${String(loaiTran).trim()}`);
  if (!yc) return { spec, quantity: q, formattedQuantity: fq, applied };
  const MAC = /(?:bê tông\s*(?:thương phẩm\s*)?)?mác\s*\d{3}(?:\s*\/\s*\d{3})?|\bM\d{3}(?:\s*\/\s*M?\d{3})?/gi;
  (Object.keys(CHOICE_TARGET) as (keyof CustomerChoices)[]).forEach(k => {
    const v = String(yc[k] ?? '').trim();
    if (!v || /^khác/i.test(v) || !CHOICE_TARGET[k].includes(item.id)) return;
    if (k === 'loai_mai') return;   // mái: đã đổi đơn giá & tên dòng theo loại mái
    switch (k) {
      case 'mac_be_tong': {
        const m = (v.match(/\bM\s?\d{3}\b|\bB\d{2}\b/i) || [v])[0].replace(/\s/g, '');
        const rep = `bê tông ${m}`;
        if (MAC.test(spec)) spec = spec.replace(MAC, rep); else spec = `${rep.charAt(0).toUpperCase() + rep.slice(1)}; ${spec}`;
        item.name = item.name.replace(MAC, m);
        break;
      }
      case 'mac_thep': {
        const STEEL = /CB\s?\d{3}(?:-?V)?(?:\s*\/\s*CB\s?\d{3}(?:-?V)?)?/gi;
        if (STEEL.test(spec)) spec = spec.replace(STEEL, v); else spec = `Thép ${v}; ${spec}`;
        break;
      }
      case 'loai_gach':
        item.name = `Xây tường ${v.charAt(0).toLowerCase() + v.slice(1)} & trát vữa xi măng mác 75 hai mặt`;
        spec = `${v}; vữa xi măng mác 75 cát vàng sàng sạch, trát 2 mặt dày 1,5cm`;
        break;
      case 'bien_phap_cop_pha':
        spec = /cốp pha[^,;.]*/i.test(spec) ? spec.replace(/cốp pha[^,;.]*/i, v) : `${spec}; ${v}`;
        item.name = item.name.replace(/Cốp pha.*$/i, v);
        break;
      case 'loai_vach':
        if (/panel\s*eps/i.test(item.name) || /panel\s*eps/i.test(spec)) { item.name = item.name.replace(/Panel EPS/gi, v); spec = spec.replace(/Panel EPS/gi, v); }
        else spec = `${v}; ${spec}`;
        break;
      case 'loai_san': spec = `Sàn ${v}; ${spec}`; break;
      case 'thep_hop_cot': spec = `Cột thép hộp ${v}; ${spec}`; break;
      case 'ty_trong_eps': spec = `Tỷ trọng ${v}; ${spec}`; break;
      case 'do_day_vach_eps': {
        const mm = parseFloat(v.replace(',', '.'));
        if (mm > 50 && mm < 400 && Math.abs(mm - 150) > 1) {
          q = Math.round(quantity * mm / 150 * 10) / 10;          // khối lượng bê tông vách tỷ lệ độ dày (gốc 150mm)
          fq = `${q} m³`;
        }
        spec = `Vách dày ${v}; ${spec}`;
        break;
      }
    }
    applied.push(`${CHOICE_LABEL[k]}: ${v}`);
  });
  if (applied.length && item.id !== 'HT_TRAN') spec = `${spec} (theo yêu cầu gia chủ)`;
  spec = spec.charAt(0).toUpperCase() + spec.slice(1);
  return { spec, quantity: q, formattedQuantity: fq, applied };
}
export interface FoundationDecision {
  soil: 'tot' | 'yeu' | 'cat' | 'chua_biet';
  foundation: 'bang' | 'coc' | 'be';
  reason: string;
  pile: { needed: boolean; caps: number; perCap: number; count: number; lengthM: number; meters: number };
}

function scalePrices(p: Record<FinishingPackageKey, number>, k: number): Record<FinishingPackageKey, number> {
  return { tiet_kiem: Math.round(p.tiet_kiem * k), tieu_chuan: Math.round(p.tieu_chuan * k), cao_cap: Math.round(p.cao_cap * k) };
}

export function normalizeSoil(v?: string): FoundationDecision['soil'] {
  const s = String(v || '').toLowerCase();
  if (s === 'yeu' || s.includes('yếu') || s.includes('ao hồ') || s.includes('ruộng') || s.includes('san lấp')) return 'yeu';
  if (s === 'cat' || s.includes('cát')) return 'cat';
  if (s === 'tot' || s.includes('tốt') || s.includes('cứng') || s.includes('đồi')) return 'tot';
  return 'chua_biet';
}

export function normalizeRoof(v: string | undefined, floors: number): RoofKind {
  const s = String(v || '').toLowerCase();
  if (s.includes('thái') || s.includes('nhật') || s.includes('thai') || s.includes('nhat')) return 'thai_nhat';
  if (s.includes('tôn') || s.includes('ton') || s.includes('cấp 4') || s.includes('xưởng') || s.includes('tiền chế')) return 'ton';
  if (s.includes('ngói') || s.includes('ngoi')) return 'ngoi';
  if (s.includes('bằng') || s.includes('btct')) return 'btct';
  return floors <= 1 ? 'ton' : 'btct';
}

/** Quyết định loại móng & ước lượng cọc (sơ bộ — chốt sau khảo sát địa chất) */
export function decideFoundation(optionKey: StructuralOptionKey, soilRaw: string | undefined, floors: number, footprint: number, widthM?: number, houseLengthM?: number): FoundationDecision {
  const soil = normalizeSoil(soilRaw);
  const heavy = optionKey === 'PA1';
  const needed =
    soil === 'yeu' ? (heavy ? floors >= 2 : floors >= 3)
    : soil === 'cat' ? (heavy ? floors >= 3 : floors >= 4)
    : soil === 'tot' ? floors >= 6
    : (heavy ? floors >= 4 : floors >= 5);
  const W = widthM && widthM > 0 ? widthM : Math.max(4, Math.sqrt(footprint / 3));
  const H = houseLengthM && houseLengthM > 0 ? houseLengthM : footprint / W;
  const nx = Math.max(2, Math.ceil(W / 5.5) + 1);
  const ny = Math.max(2, Math.ceil(H / 5) + 1);
  const caps = nx * ny;
  let perCap = floors <= 2 ? 1 : floors <= 4 ? 2 : floors <= 6 ? 3 : 4;
  if (!heavy && floors >= 3) perCap = Math.max(1, perCap - 1);
  const lengthM = soil === 'yeu' ? 18 : soil === 'cat' ? 12 : soil === 'tot' ? 10 : 15;
  const count = needed ? caps * perCap : 0;
  const foundation: FoundationDecision['foundation'] = needed ? 'coc' : soil === 'yeu' ? 'be' : 'bang';
  const soilName = { tot: 'đất tốt', yeu: 'đất yếu', cat: 'đất cát', chua_biet: 'chưa khảo sát địa chất' }[soil];
  const reason = needed
    ? `${soilName}, ${floors} tầng → dự kiến móng cọc (${count} cọc × ${lengthM}m)`
    : foundation === 'be' ? `${soilName}, tải trọng nhẹ → móng bè` : `${soilName}, ${floors} tầng → móng băng`;
  return { soil, foundation, reason, pile: { needed, caps, perCap, count, lengthM, meters: count * lengthM } };
}

/**
 * Master Pricing Calculator
 */
export function calculateMasterProjectEstimate(params: {
  optionKey?: StructuralOptionKey;
  packageKey?: FinishingPackageKey;
  regionKey?: RegionKey;
  customerAddress?: string;
  dien_tich_san?: number;
  dien_tich_xay_dung?: number;
  so_tang?: number;
  so_wc?: number;
  so_phong_ngu?: number;
  co_san_vuon?: boolean;
  loai_tran?: string;
  soilType?: string;          // tot | yeu | cat | set | chua_biet (hoặc nhãn tiếng Việt)
  roofType?: string;          // loại mái khách chọn / loại công trình (Tôn, Ngói, Mái Thái, Mái bằng...)
  widthM?: number;            // chiều rộng nhà (để ước số cột/đài cọc)
  houseLengthM?: number;      // chiều sâu nhà
  yeuCau?: CustomerChoices;   // các lựa chọn vật tư / kỹ thuật gia chủ đã chọn
  floorHeight1?: number;      // chiều cao tầng 1 (m) gia chủ nhập — mặc định 3,6
  floorHeightUpper?: number;  // chiều cao các tầng trên (m) — mặc định 3,3
}): FullProjectEstimateResult {
  const optionKey: StructuralOptionKey = params.optionKey || 'PA1';
  const packageKey: FinishingPackageKey = params.packageKey || 'tieu_chuan';
  
  // Resolve Region
  let regionKey: RegionKey = params.regionKey || 'mien_bac';
  if (!params.regionKey && params.customerAddress) {
    // 34 tỉnh/thành mới (NQ 202/2025/QH15) + tên tỉnh cũ + hải đảo
    regionKey = resolveLocation(params.customerAddress).region;
  }

  const regionInfo = REGIONAL_FACTORS[regionKey];
  const regionFactor = regionInfo.factor;
  const nTang = Math.max(1, Math.round(Number(params.so_tang) || 1));
  const hIn = (v: any, d: number) => { const x = Number(v); return isFinite(x) && x >= 2.4 && x <= 6 ? x : d; };
  const h1 = hIn(params.floorHeight1, 3.6), hu = hIn(params.floorHeightUpper, 3.3);
  const heightFactor = Number((((h1 + (nTang - 1) * hu) / nTang) / ((3.6 + (nTang - 1) * 3.3) / nTang)).toFixed(3));

  const so_tang = Math.max(1, params.so_tang || 1);
  const dien_tich_xay_dung = Math.max(20, params.dien_tich_xay_dung || 186.0);
  
  // S sàn quy đổi = diện tích xây dựng × (1.3 nếu 1 tầng, 2.2 nếu 2 tầng, 3.1 nếu 3 tầng, hoặc floors + 0.3)
  // ── Nền đất, móng, mái ──
  const nenMong = decideFoundation(optionKey, params.soilType, so_tang, dien_tich_xay_dung, params.widthM, params.houseLengthM);
  const roof = normalizeRoof(params.roofType, so_tang);
  const K_MONG = { bang: 0.3, coc: 0.4, be: 0.5 }[nenMong.foundation];
  const K_MAI = { ton: 0.3, ngoi: 0.7, btct: 0.5, thai_nhat: 0.7 }[roof];
  // Sàn thực = diện tích xây dựng × số tầng (giá móng & mái đã có hạng mục riêng)
  const dien_tich_san = params.dien_tich_san || Math.round(dien_tich_xay_dung * so_tang * 10) / 10;
  // Diện tích quy đổi theo cách nhà thầu VN hay báo giá (để khách so sánh): sàn + móng + mái
  const dien_tich_quy_doi = Math.round(dien_tich_xay_dung * (so_tang + K_MONG + K_MAI) * 10) / 10;
  const so_phong_ngu = params.so_phong_ngu;
  const so_wc = Math.max(1, params.so_wc || (so_tang === 1 ? 2 : Math.max(so_tang, 2)));
  const co_san_vuon = params.co_san_vuon === true;   // mặc định KHÔNG tính sân vườn

  // Helper to compute a single package
  const computePackage = (pkg: FinishingPackageKey) => {
    const activeItems = MASTER_BOQ_ITEMS.filter(it => it.options.includes(optionKey));
    
    let sumBoq = 0;
    let sumLabor = 0;
    let sumMaterial = 0;
    const lines: BOQCalculatedLine[] = [];

    activeItems.forEach(origItem => {
      let item = { ...origItem };
      if (item.id === 'HT_TRAN' && params.loai_tran) {
        const raw = params.loai_tran.toLowerCase();
        if (raw.includes('than tre') || raw.includes('than_tre') || raw.includes('bamboo')) {
          item.name = 'Trần ốp tấm đa năng sợi than tre (Bamboo Charcoal) chống ẩm';
          item.unitPrices = { tiet_kiem: 280000, tieu_chuan: 380000, cao_cap: 550000 };
          item.specs = { tiet_kiem: 'Tấm than tre dày 5mm, khung xương gỗ / thép hộp mạ kẽm', tieu_chuan: 'Tấm than tre dày 8mm vân gỗ/vân đá, khung xương thép hộp mạ kẽm, nẹp nhôm', cao_cap: 'Tấm than tre 8mm phủ PET bóng gương, nẹp nhôm định hình, đèn hắt LED' };
          item.clientExplanation = 'Trần ốp tấm sợi than tre cao cấp chống ẩm mốc, vân đá/vân gỗ sang trọng, cách âm và bền đẹp';
        } else if (raw.includes('nhom') || raw.includes('nhôm') || raw.includes('aluminum') || raw.includes('clip-in') || raw.includes('baffle')) {
          item.name = 'Hệ trần nhôm hợp kim (Clip-in / Baffle)';
          item.unitPrices = { tiet_kiem: 320000, tieu_chuan: 420000, cao_cap: 620000 };
          item.specs = {
            tiet_kiem: 'Tấm nhôm Clip-in 600×600 dày 0,5mm sơn tĩnh điện, khung xương chữ T mạ kẽm, ty treo D8',
            tieu_chuan: 'Tấm nhôm Clip-in 600×600 dày 0,6mm hoặc Baffle U 30×100mm sơn tĩnh điện, khung xương Omega mạ kẽm, ty treo D8 a1200',
            cao_cap: 'Trần nhôm Baffle / Linear dày 0,7–0,8mm vân gỗ chuyển nhiệt, khung xương chuyên dụng, phụ kiện đồng bộ hãng'
          };
          item.technicalNote = 'Khoảng treo trần 300–500mm cho điều hòa, đèn; chừa ô thăm kỹ thuật; tấm nhôm tháo lắp được để bảo trì.';
          item.clientExplanation = 'Trần nhôm sơn tĩnh điện chống ẩm, không mối mọt, tháo lắp được để sửa điện nước, phong cách hiện đại';
        } else if (raw.includes('nano') || raw.includes('nhua') || raw.includes('nhựa') || raw.includes('pvc') || raw.includes('lam sóng') || raw.includes('lam song')) {
          item.name = 'Trần tấm nhựa Nano / Lam sóng phẳng nguyên sinh chống ẩm';
          item.unitPrices = { tiet_kiem: 180000, tieu_chuan: 250000, cao_cap: 350000 };
          item.specs = { tiet_kiem: 'Tấm nhựa PVC Nano dày 8mm, khung xương thép hộp mạ kẽm', tieu_chuan: 'Tấm Nano / lam sóng dày 9–10mm vân gỗ, khung xương thép hộp mạ kẽm, nẹp góc', cao_cap: 'Lam sóng Nano cao cấp phủ film 3D, nẹp nhôm, đèn hắt LED' };
          item.clientExplanation = 'Trần nhựa Nano PVC chịu nước, không mối mọt, dễ lau chùi';
        } else if (raw.includes('go') || raw.includes('gỗ') || raw.includes('wood')) {
          item.name = 'Trần ốp gỗ tự nhiên / gỗ công nghiệp chống ẩm cao cấp';
          item.unitPrices = { tiet_kiem: 350000, tieu_chuan: 550000, cao_cap: 950000 };
          item.specs = { tiet_kiem: 'Gỗ công nghiệp MDF chống ẩm phủ melamine, khung xương gỗ', tieu_chuan: 'Gỗ công nghiệp An Cường chống ẩm phủ laminate, khung xương thép hộp', cao_cap: 'Gỗ tự nhiên (sồi/óc chó) sơn PU, khung xương thép hộp, đèn hắt' };
          item.clientExplanation = 'Trần gỗ cao cấp mang lại vẻ ấm cúng, sang trọng và nâng tầm đẳng cấp không gian';
        } else if (raw.includes('thach cao') || raw.includes('thạch cao') || raw.includes('gypsum')) {
          item.name = 'Trần thạch cao khung xương chìm Vĩnh Tường chống ẩm';
          item.unitPrices = { tiet_kiem: 165000, tieu_chuan: 215000, cao_cap: 295000 };
          item.specs = { tiet_kiem: 'Khung xương chìm Vĩnh Tường, tấm Gyproc 9mm thường (khu ướt dùng tấm chịu ẩm)', tieu_chuan: 'Khung xương chìm Vĩnh Tường Basi, tấm Gyproc 9mm chịu ẩm, sơn bả hoàn thiện', cao_cap: 'Khung Vĩnh Tường Alpha, tấm chịu ẩm 12mm, giật cấp đèn hắt, sơn bả hoàn thiện' };
          item.clientExplanation = 'Trần thạch cao tấm chống ẩm Vĩnh Tường khung xương cao cấp sơn bả hoàn thiện';
        } else if (params.loai_tran.trim().length > 0 && params.loai_tran !== "Khác" && params.loai_tran !== "Khác (Tự nhập)") {
          item.name = `Trần hoàn thiện: ${params.loai_tran.trim()}`;
          item.unitPrices = { tiet_kiem: 220000, tieu_chuan: 320000, cao_cap: 480000 };
          item.specs = { tiet_kiem: `${params.loai_tran.trim()} — vật tư phổ thông (đơn giá tạm tính, cần báo giá thực tế)`, tieu_chuan: `${params.loai_tran.trim()} — vật tư tiêu chuẩn (đơn giá tạm tính, cần báo giá thực tế)`, cao_cap: `${params.loai_tran.trim()} — vật tư cao cấp (đơn giá tạm tính, cần báo giá thực tế)` };
          item.clientExplanation = `Hệ trần hoàn thiện theo đúng yêu cầu gia chủ: ${params.loai_tran.trim()}`;
        }
      }

      // Móng: theo loại móng thực tế & tải trọng phương án
      if (item.id === 'KC_MONG_BTCT') {
        const optK = optionKey === 'PA1' ? 1 : optionKey === 'PA2' ? 0.75 : 0.8;
        const fK = nenMong.foundation === 'be' ? 1.15 : nenMong.foundation === 'coc' ? 1.05 : 1;
        item.unitPrices = scalePrices(origItem.unitPrices, optK * fK);
        item.name = nenMong.foundation === 'coc'
          ? 'Đài cọc + giằng móng BTCT M250 & cốt thép theo thiết kế (phần cọc tính riêng)'
          : nenMong.foundation === 'be'
          ? 'Móng bè BTCT M250 hai lớp thép (nền đất yếu, tải trọng nhẹ)'
          : 'Móng băng BTCT M250 đá 1x2 & cốt thép móng theo thiết kế';
      }
      // Mái: theo loại mái khách chọn
      if (item.id === 'HT_MAI') {
        const rK = { ton: 0.85, ngoi: 1.0, btct: 0.9, thai_nhat: 1.6 }[roof];
        item.unitPrices = scalePrices(origItem.unitPrices, rK);
        item.name = roof === 'ton' ? 'Mái tôn cách nhiệt PU 3 lớp + xà gồ thép mạ kẽm & chống thấm'
          : roof === 'ngoi' ? 'Mái ngói tráng men trên vì kèo thép nhẹ mạ kẽm & chống thấm'
          : roof === 'thai_nhat' ? 'Mái Thái/Nhật: sàn mái BTCT dốc dán ngói + seno, chống thấm'
          : 'Mái bằng BTCT: chống thấm 2 lớp + lát gạch chống nóng, tôn che tum';
      }

      let { quantity, formattedQuantity } = item.computeQuantity({
        dien_tich_san,
        dien_tich_xay_dung,
        so_tang,
        so_wc,
        so_phong_ngu,
        co_san_vuon
      });
      // tường, sơn tường: khối lượng tỷ lệ với chiều cao tầng gia chủ nhập (hệ số chuẩn tính cho 3,6m / 3,3m)
      if (heightFactor !== 1 && quantity > 0 && (item.category === 'wall' || item.id === 'HT_SON')) {
        const q2 = Number((quantity * heightFactor).toFixed(1));
        formattedQuantity = formattedQuantity.replace(String(quantity), String(q2));
        quantity = q2;
      }

      if (quantity <= 0) return;
      const ch = applyChoices(item, item.specs[pkg], quantity, formattedQuantity, params.yeuCau, params.loai_tran);
      const qty = ch.quantity;

      const baseUnitPrice = item.unitPrices[pkg];
      // Apply regional price factor
      const unitPrice = Math.round((baseUnitPrice * regionFactor * MARKET_CALIBRATION) / 100) * 100;
      const totalAmount = Math.round(qty * unitPrice);

      const laborRatio = item.laborRatio !== undefined ? item.laborRatio : 0.30;
      const itemLabor = Math.round(totalAmount * laborRatio);
      const itemMaterial = totalAmount - itemLabor;

      sumBoq += totalAmount;
      sumLabor += itemLabor;
      sumMaterial += itemMaterial;

      lines.push({
        item,
        quantity: qty,
        formattedQuantity: ch.formattedQuantity,
        formattedQty: ch.formattedQuantity,
        unitPrice,
        formattedUnitPrice: `${unitPrice.toLocaleString('vi-VN')} đ`,
        totalAmount,
        formattedTotalAmount: `${totalAmount.toLocaleString('vi-VN')} đ`,
        materialAmount: itemMaterial,
        laborAmount: itemLabor,
        spec: ch.spec,
        yeuCau: ch.applied.length ? ch.applied : undefined
      });
    });

    // Ép cọc (khi nền yếu / nhà cao tầng)
    if (nenMong.pile.needed) {
      const pilePrice: Record<FinishingPackageKey, number> = { tiet_kiem: 290000, tieu_chuan: 340000, cao_cap: 420000 };
      const pileSize: Record<FinishingPackageKey, string> = { tiet_kiem: '200×200', tieu_chuan: '250×250', cao_cap: '300×300' };
      const mobil: Record<FinishingPackageKey, number> = { tiet_kiem: 18000000, tieu_chuan: 22000000, cao_cap: 28000000 };
      const addLine = (def: MasterBOQItemDef, quantity: number, formattedQuantity: string, unitPriceBase: number) => {
        const unitPrice = Math.round((unitPriceBase * regionFactor * MARKET_CALIBRATION) / 100) * 100;
        const totalAmount = Math.round(quantity * unitPrice);
        const lr = def.laborRatio ?? 0.3;
        const lab = Math.round(totalAmount * lr);
        sumBoq += totalAmount; sumLabor += lab; sumMaterial += totalAmount - lab;
        lines.push({ item: def, quantity, formattedQuantity, formattedQty: formattedQuantity, unitPrice,
          formattedUnitPrice: `${unitPrice.toLocaleString('vi-VN')} đ`, totalAmount,
          formattedTotalAmount: `${totalAmount.toLocaleString('vi-VN')} đ`, materialAmount: totalAmount - lab, laborAmount: lab, spec: def.specs[pkg] });
      };
      const base = { category: 'foundation' as const, categoryName: '1. Kết Cấu Móng & Phần Thô', options: ['PA1', 'PA2', 'PA3'] as StructuralOptionKey[],
        computeQuantity: () => ({ quantity: 0, formattedQuantity: '' }), technicalNote: 'Chốt số cọc, chiều dài & tải trọng sau khoan khảo sát địa chất và thiết kế kết cấu (TCVN 10304:2014).',
        clientExplanation: 'Cọc truyền tải trọng nhà xuống lớp đất chắc bên dưới, chống lún nứt trên nền yếu.' };
      addLine({ ...base, id: 'KC_COC_EP', name: `Ép cọc BTCT ${pileSize[pkg]} (dự kiến ${nenMong.pile.count} cọc × ${nenMong.pile.lengthM}m)`, unit: 'm cọc', laborRatio: 0.25,
        formulaDescription: `= ${nenMong.pile.caps} đài × ${nenMong.pile.perCap} cọc × ${nenMong.pile.lengthM}m`, unitPrices: pilePrice,
        specs: { tiet_kiem: 'Cọc BTCT 200×200 mác 250, ép tải', tieu_chuan: 'Cọc BTCT 250×250 mác 300, ép robot/ép neo', cao_cap: 'Cọc BTCT 300×300 mác 300 hoặc cọc ly tâm D300, ép robot có nhật ký lực ép' } },
        nenMong.pile.meters, `${nenMong.pile.meters} m cọc`, pilePrice[pkg]);
      addLine({ ...base, id: 'KC_COC_MAY', name: 'Vận chuyển, lắp đặt máy ép cọc & nối cọc, nén tĩnh thử tải (gói)', unit: 'Gói', laborRatio: 0.6,
        formulaDescription: '1 gói', unitPrices: mobil,
        specs: { tiet_kiem: 'Máy ép tải sắt', tieu_chuan: 'Máy ép robot / ép neo phù hợp ngõ hẻm', cao_cap: 'Máy ép robot + nén tĩnh thử tải 1 cọc' } },
        1, '1 Gói', mobil[pkg]);
    }

    // Chi phí chung = 6.2% tổng BOQ (quản lý, giám sát, giàn giáo bảo hiểm an toàn)
    const chi_phi_chung_rate = pkg === 'tiet_kiem' ? 0.058 : pkg === 'tieu_chuan' ? 0.062 : 0.068;
    const chi_phi_chung = Math.round(sumBoq * chi_phi_chung_rate);

    const finalContractTotal = sumBoq + chi_phi_chung;
    const finalRatePerSqm = Math.round(finalContractTotal / dien_tich_quy_doi); // suất / m² quy đổi (cách báo giá phổ biến)

    // Gia chủ khoán nhân công: Nhân công thực tế + phần chi phí quản lý kỹ thuật/giàn giáo (60% của chi phí chung)
    const laborOnlyOverhead = Math.round(chi_phi_chung * 0.60);
    const tong_khoan_nhan_cong = sumLabor + laborOnlyOverhead;
    const tong_vat_tu_thiet_bi = finalContractTotal - tong_khoan_nhan_cong;
    const laborRatePerSqm = Math.round(tong_khoan_nhan_cong / dien_tich_quy_doi);

    // Add CP_CHUNG line
    const cpChungDef: MasterBOQItemDef = {
      id: 'CP_CHUNG',
      category: 'overhead',
      categoryName: '7. Chi Phí Quản Lý & Bảo Hiểm Chung',
      name: 'Chi phí chung (Giàn giáo bao che, máy móc, bảo hiểm công trình, kỹ sư giám sát, vệ sinh)',
      unit: 'Gói',
      options: ['PA1', 'PA2', 'PA3'],
      laborRatio: 0.60,
      formulaDescription: 'Định mức quản lý & an toàn theo chuẩn xây dựng',
      computeQuantity: () => ({ quantity: 1, formattedQuantity: '1 Gói' }),
      unitPrices: { tiet_kiem: chi_phi_chung, tieu_chuan: chi_phi_chung, cao_cap: chi_phi_chung },
      specs: {
        tiet_kiem: 'Giàn giáo thi công, bạt che bụi, vệ sinh thô trước bàn giao',
        tieu_chuan: 'Hệ giàn giáo bao che an toàn đầy đủ, lưới chắn bụi, bảo hiểm tai nạn thợ, dọn vệ sinh công nghiệp trước bàn giao',
        cao_cap: 'Bao che an toàn chuẩn quốc tế, bảo hiểm trách nhiệm công trình, vệ sinh công nghiệp chuyên sâu, xịt khử khuẩn nhà mới'
      },
      technicalNote: 'Bao gồm kiểm định an toàn máy móc, lán trại kỹ sư và vệ sinh công trình trước khi bàn giao',
      clientExplanation: 'Đảm bảo an toàn lao động, vệ sinh môi trường sạch sẽ và bảo hiểm trọn gói'
    };

    lines.push({
      item: cpChungDef,
      quantity: 1,
      formattedQuantity: '1 Gói',
      unitPrice: chi_phi_chung,
      formattedUnitPrice: `${chi_phi_chung.toLocaleString('vi-VN')} đ`,
      totalAmount: chi_phi_chung,
      formattedTotalAmount: `${chi_phi_chung.toLocaleString('vi-VN')} đ`,
      materialAmount: chi_phi_chung - laborOnlyOverhead,
      laborAmount: laborOnlyOverhead,
      spec: cpChungDef.specs[pkg]
    });

    const costBillion = (finalContractTotal / 1000000000).toFixed(3);

    return {
      lines,
      sumBoq,
      sumLabor,
      sumMaterial,
      chi_phi_chung,
      finalContractTotal,
      finalRatePerSqm,
      tong_khoan_nhan_cong,
      tong_vat_tu_thiet_bi,
      laborRatePerSqm,
      costBillion
    };
  };

  const selectedResult = computePackage(packageKey);
  const ecoResult = computePackage('tiet_kiem');
  const stdResult = computePackage('tieu_chuan');
  const preResult = computePackage('cao_cap');

  return {
    optionKey,
    packageKey,
    regionKey,
    regionName: regionInfo.name,
    regionFactor,
    dien_tich_san,
    dien_tich_xay_dung,
    dien_tich_quy_doi,
    he_so_quy_doi: { mong: K_MONG, mai: K_MAI },
    nen_mong: nenMong,
    loai_mai_tinh: roof,
    so_tang,
    so_wc,
    so_phong_ngu,
    co_san_vuon,

    lines: selectedResult.lines,
    tong_boq: selectedResult.sumBoq,
    formatted_tong_boq: `${selectedResult.sumBoq.toLocaleString('vi-VN')} đ`,
    
    chi_phi_chung: selectedResult.chi_phi_chung,
    formatted_chi_phi_chung: `${selectedResult.chi_phi_chung.toLocaleString('vi-VN')} đ`,
    ty_le_chi_phi_chung: Number(((selectedResult.chi_phi_chung / selectedResult.finalContractTotal) * 100).toFixed(2)),

    tong_tron_goi: selectedResult.finalContractTotal,
    formatted_tong_tron_goi: `${selectedResult.finalContractTotal.toLocaleString('vi-VN')} đ`,
    costBillion: selectedResult.costBillion,

    suat_dau_tu_m2: selectedResult.finalRatePerSqm,
    formatted_suat_dau_tu_m2: `${selectedResult.finalRatePerSqm.toLocaleString('vi-VN')} đ/m²`,

    tong_vat_tu_thiet_bi: selectedResult.tong_vat_tu_thiet_bi,
    formatted_tong_vat_tu_thiet_bi: `${selectedResult.tong_vat_tu_thiet_bi.toLocaleString('vi-VN')} đ`,
    tong_khoan_nhan_cong: selectedResult.tong_khoan_nhan_cong,
    formatted_tong_khoan_nhan_cong: `${selectedResult.tong_khoan_nhan_cong.toLocaleString('vi-VN')} đ`,
    suat_khoan_nhan_cong_m2: selectedResult.laborRatePerSqm,
    formatted_suat_khoan_nhan_cong_m2: `${selectedResult.laborRatePerSqm.toLocaleString('vi-VN')} đ/m²`,

    allPackages: {
      tiet_kiem: {
        packageKey: 'tiet_kiem',
        title: 'Gói Tiết Kiệm',
        desc: 'Thép chuẩn TCVN, gạch Viglacera, sơn Maxilite, nhôm hệ phổ thông',
        suat_dau_tu_m2: ecoResult.finalRatePerSqm,
        formatted_suat_dau_tu_m2: `${ecoResult.finalRatePerSqm.toLocaleString('vi-VN')} đ/m²`,
        tong_tron_goi: ecoResult.finalContractTotal,
        formatted_tong_tron_goi: `${ecoResult.finalContractTotal.toLocaleString('vi-VN')} đ`,
        tong_khoan_nhan_cong: ecoResult.tong_khoan_nhan_cong,
        formatted_tong_khoan_nhan_cong: `${ecoResult.tong_khoan_nhan_cong.toLocaleString('vi-VN')} đ`,
        tong_vat_tu_thiet_bi: ecoResult.tong_vat_tu_thiet_bi,
        formatted_tong_vat_tu_thiet_bi: `${ecoResult.tong_vat_tu_thiet_bi.toLocaleString('vi-VN')} đ`,
        costBillion: ecoResult.costBillion
      },
      tieu_chuan: {
        packageKey: 'tieu_chuan',
        title: 'Gói Tiêu Chuẩn (Khuyên Dùng)',
        desc: 'Thép Hòa Phát CB400, thiết bị Inax, sơn Dulux 5in1, nhôm Xingfa',
        suat_dau_tu_m2: stdResult.finalRatePerSqm,
        formatted_suat_dau_tu_m2: `${stdResult.finalRatePerSqm.toLocaleString('vi-VN')} đ/m²`,
        tong_tron_goi: stdResult.finalContractTotal,
        formatted_tong_tron_goi: `${stdResult.finalContractTotal.toLocaleString('vi-VN')} đ`,
        tong_khoan_nhan_cong: stdResult.tong_khoan_nhan_cong,
        formatted_tong_khoan_nhan_cong: `${stdResult.tong_khoan_nhan_cong.toLocaleString('vi-VN')} đ`,
        tong_vat_tu_thiet_bi: stdResult.tong_vat_tu_thiet_bi,
        formatted_tong_vat_tu_thiet_bi: `${stdResult.tong_vat_tu_thiet_bi.toLocaleString('vi-VN')} đ`,
        costBillion: stdResult.costBillion
      },
      cao_cap: {
        packageKey: 'cao_cap',
        title: 'Gói Cao Cấp',
        desc: 'Thiết bị Toto/Kohler, đá Granite/Marble, sơn Jotun, smart-home cao cấp',
        suat_dau_tu_m2: preResult.finalRatePerSqm,
        formatted_suat_dau_tu_m2: `${preResult.finalRatePerSqm.toLocaleString('vi-VN')} đ/m²`,
        tong_tron_goi: preResult.finalContractTotal,
        formatted_tong_tron_goi: `${preResult.finalContractTotal.toLocaleString('vi-VN')} đ`,
        tong_khoan_nhan_cong: preResult.tong_khoan_nhan_cong,
        formatted_tong_khoan_nhan_cong: `${preResult.tong_khoan_nhan_cong.toLocaleString('vi-VN')} đ`,
        tong_vat_tu_thiet_bi: preResult.tong_vat_tu_thiet_bi,
        formatted_tong_vat_tu_thiet_bi: `${preResult.tong_vat_tu_thiet_bi.toLocaleString('vi-VN')} đ`,
        costBillion: preResult.costBillion
      }
    }
  };
}
