/**
 * YOHU BUILD AI — Bộ Tính Toán Dự Toán & Kết Cấu Kỹ Thuật Tự Động
 * Master Calculation & Engineering Estimation Model
 * Đảm bảo 100% ăn khớp giữa UI, Báo Cáo Admin CRM, PDF 3 Trang và Hồ Sơ Kỹ Thuật PDF 10 Phần
 */

import { ConstructionInfo, AIResultReport } from '../types';
import { StructuralOptionKey } from './boqEngine';
import { getUnifiedEstimate, parsePricingArea, resolveOptionKey } from './unifiedPricing';

export interface ComprehensiveEstimate {
  areaPerFloor: number;
  floors: number;
  totalFloorArea: number;       // Tổng diện tích sàn thi công tính cả móng và mái
  selectedOptionKey: 'PA1' | 'PA2' | 'PA3';
  selectedOption: { title: string; codeName: string; pricePerSqm: number; totalCost: number; desc: string };
  packageOptions: {
    pa1: { title: string; codeName: string; pricePerSqm: number; totalCost: number; desc: string };
    pa2: { title: string; codeName: string; pricePerSqm: number; totalCost: number; desc: string };
    pa3: { title: string; codeName: string; pricePerSqm: number; totalCost: number; desc: string };
  };
  structuralSolution: {
    foundation: string;
    columnsBeams: string;
    wallsCeiling: string;
    roofing: string;
    waterproofing: string;
  };
  boqSummary: Array<{
    item: string;
    volume: string;
    unit: string;
    unitPrice: string;
    totalAmount: string;
  }>;
  timelinePhases: Array<{
    phase: string;
    duration: string;
    workContent: string;
    percentage: string;
  }>;
  expertRecommendations: string[];
}

export function generateComprehensiveEstimate(
  ct: Partial<ConstructionInfo> & { soilType?: string; province?: string; loai_ket_cau_chinh?: string },
  aiResult?: Partial<AIResultReport> | null,
  userInfo?: any
): ComprehensiveEstimate {
  void aiResult;
  void parsePricingArea;

  const floors = Math.max(1, Math.min(50, Number(ct?.floors) || 1));
  const soilType = ct?.soilType || "chua_biet";
  // Mặc định: BTCT truyền thống (phương án phổ biến nhất) — chỉ dùng EPS khi khách CHỌN EPS
  const structuralType = ct?.loai_ket_cau_chinh || "Bê tông cốt thép truyền thống";
  const sLower = structuralType.toLowerCase();

  // PA1 = BTCT, PA2 = Khung thép + Cemboard, PA3 = EPS đúc liền khối (bộ nhận diện chung)
  const optKey: StructuralOptionKey = resolveOptionKey(structuralType);

  const isEpsMonolithic = optKey === 'PA3';
  const isSteelFrame = optKey === 'PA2';

  // Một nguồn giá duy nhất cho cả 3 phương án
  const estPA1 = getUnifiedEstimate({ constructionInfo: ct, userInfo, optionKey: 'PA1' });
  const estPA2 = getUnifiedEstimate({ constructionInfo: ct, userInfo, optionKey: 'PA2' });
  const estPA3 = getUnifiedEstimate({ constructionInfo: ct, userInfo, optionKey: 'PA3' });

  // Current active master estimate for structural solution text
  const masterEstimate = optKey === 'PA1' ? estPA1 : optKey === 'PA2' ? estPA2 : estPA3;

  const totalFloorArea = masterEstimate.dien_tich_quy_doi;
  const area = masterEstimate.dien_tich_xay_dung;          // diện tích xây dựng (đã trừ khoảng lùi)
  const site = masterEstimate.meta.site;
  const nm = masterEstimate.nen_mong;

  const fmtVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
  };

  // 3. Giải pháp kết cấu theo quy mô & loại đất & loại kết cấu
  // Móng: thuyết minh khớp đúng hạng mục móng trong bảng dự toán (cùng 1 quyết định nen_mong)
  let foundationStr = "";
  if (nm.foundation === 'coc') {
    foundationStr = `Móng cọc: ${nm.reason}. Dự kiến ${nm.pile.caps} đài cọc × ${nm.pile.perCap} cọc BTCT 250×250, dài ~${nm.pile.lengthM}m, đài + giằng BTCT M250. Số cọc, chiều dài và sức chịu tải PHẢI chốt sau khoan khảo sát địa chất & thiết kế kết cấu (TCVN 10304:2014); nên ép thử/nén tĩnh 1 cọc trước khi ép đại trà.`;
  } else if (nm.foundation === 'be') {
    foundationStr = `Móng bè BTCT 2 lớp thép, dầm bo viền: ${nm.reason}. Phân bổ đều tải trọng, giảm lún lệch. Cần khảo sát địa chất để xác nhận không cần cọc.`;
  } else {
    foundationStr = `Móng băng BTCT M250 giao thoa 2 phương, giằng móng 200×300: ${nm.reason}. Kiểm soát lún theo TCVN 9362:2012. Nếu khi đào móng gặp đất yếu/ao lấp, chuyển sang móng cọc (dự toán tăng — xem mục ép cọc khi chọn "đất yếu").`;
  }
  if (isEpsMonolithic) {
    foundationStr += ` Với vách EPS đúc liền khối: để rãnh ngàm 5cm trên dầm bo móng và chờ râu thép D10 liên kết chân vách.`;
  }
  void soilType;

  const columnsBeamsStr = isEpsMonolithic
    ? "Hệ khung cột chịu lực chính (200x200mm, 4 cốt thép D14 CB300/CB400) được lắp ghép định hình và đổ bê tông đúc liền khối đồng thời cùng với vách bê tông nhẹ EPS 15cm trong một mẻ (Monolithic Casting không mạch ngừng). Thép dọc D10 vách liên kết ngàm vào đai cột, tạo khối hộp không gian liên kết tốt, giảm nứt tại vị trí giao cột - tường. Tiết diện và cốt thép cột phải được kỹ sư kết cấu tính theo số tầng và nhịp thực tế."
    : isSteelFrame
    ? `Hệ khung cột thép tiền chế kết hợp cột thép hộp ${ct?.thep_hop_cot || '100x100mm'}, liên kết bản mã bulông cường độ cao 8.8. Dầm thép I/H định hình chịu lực tối ưu.`
    : `Khung cột BTCT tiết diện ${floors > 2 ? '220x220mm đến 220x300mm' : '200x200mm'}, cốt thép chủ 4 phi 18/20 mác CB400, cốt đai phi 6/8 khoảng cách a150. Dầm chịu lực 200x350mm.`;

  const wallsCeilingStr = isEpsMonolithic
    ? "Vách tường đúc liền khối dày 15cm bằng hỗn hợp bê tông hạt xốp EPS nguyên sinh (2-4mm) trộn phụ gia hóa dẻo siêu chảy ViscoCrete tự điền đầy bao bọc thép D10/D6 không cần đầm dùi, phụ gia chống phân tầng HPMC và phụ gia đông kết nhanh Sikament R7 (tháo gông định hình 3D sau 24h). Cách âm, cách nhiệt tốt hơn tường gạch thông thường (mức tiết kiệm điện thực tế phụ thuộc hướng nắng, mái và thói quen sử dụng). Lõi đặc 15cm bắt vít treo tủ bếp, tivi được (dùng tắc kê phù hợp bê tông nhẹ)."
    : isSteelFrame
    ? "Vách ngăn và tường bao lắp ghép bằng tấm xi măng Cemboard / Panel EPS cách âm cách nhiệt trọng lượng nhẹ, giảm tải trọng truyền móng."
    : "Tường bao xây gạch ống tuynel 2 da dày 220mm cách âm cách nhiệt; tường ngăn dày 110mm. Vữa xây trát mác 75 trộn cát sạch sàng lọc.";

  const roofingStr = isEpsMonolithic
    ? "Mái bằng bê tông nhẹ EPS dốc 2% phủ màng chống thấm Polyurethane co giãn đàn hồi và lát gạch chống nóng bảo ôn (hoặc vì kèo thép hộp mạ kẽm lợp ngói nhựa ASA 4 lớp chống ồn mưa và bức xạ nhiệt)."
    : ct?.constructionType?.toLowerCase().includes("biệt thự") 
    ? "Mái thái lợp ngói màu không phai tráng men (Fuji / SCG), xà gồ thép mạ kẽm Smartruss chống rỉ sét, độ dốc 35 độ thoát nước nhanh."
    : isSteelFrame
    ? "Mái lợp tôn lạnh chống nóng cách nhiệt PU 3 lớp kết hợp máng xối thoát nước inox."
    : "Sàn mái BTCT đổ liền khối dốc 2%, xử lý chống thấm ngược, lớp bảo vệ gạch chống nóng bảo ôn 4 mùa.";

  const waterproofingStr = isEpsMonolithic
    ? "Xử lý mối nối tấm bằng keo Polyurethane đàn hồi + dán lưới thủy tinh chống xé nứt co ngót. Toàn bộ bề mặt ngoài trời phủ sơn chống thấm co giãn đàn hồi Elastomeric trước khi phủ sơn màu ngoại thất, hạn chế thấm và nứt chân chim; bảo hành chống thấm theo hợp đồng."
    : "Quét 3 lớp màng chống thấm polyme đàn hồi xi măng Sika Top Seal 107 cho toàn bộ sàn vệ sinh, ban công, máng xối seno và sàn mái. Ngâm nước thử tải 48h trước khi lát gạch.";

  // 4. Bảng khối lượng sơ bộ (BOQ) khớp 100% với Master Engine
  const boqSummary = masterEstimate.lines.map(line => ({
    item: line.item.name,
    volume: String(line.quantity),
    unit: line.item.unit,
    unitPrice: line.formattedUnitPrice,
    totalAmount: line.formattedTotalAmount
  }));

  // 5. Tiến độ thi công thực tế (5 giai đoạn)
  const timelinePhases = isEpsMonolithic ? [
    {
      phase: "Giai đoạn 1: Chuẩn bị mặt bằng & Móng băng/móng bè (rãnh ngàm 5cm)",
      duration: "04 - 06 ngày",
      workContent: "Đào móng băng/móng bè, đổ bê tông lót, đan thép móng D10, đổ bê tông M250 chừa rãnh ngàm định hình vách 15cm, lắp đặt bể tự hoại 3 ngăn.",
      percentage: "15% giá trị hợp đồng"
    },
    {
      phase: "Giai đoạn 2: Khung vách EPS & Gông 3D",
      duration: `${String(6 * floors).padStart(2, "0")} - ${String(8 * floors).padStart(2, "0")} ngày (${floors} tầng, tháo gông luân chuyển sau 24h)`,
      workContent: "Lắp đặt cốt thép cột D14 & thép vách D10, đi ống luồn M&E âm tường, lắp dựng hệ gông 3D, bơm bê tông nhẹ EPS đúc liền khối nguyên khối toàn bộ nhà.",
      percentage: "40% giá trị hợp đồng"
    },
    {
      phase: "Giai đoạn 3: Tháo gông & Hệ mái",
      duration: "03 - 05 ngày",
      workContent: "Tháo dỡ bộ gông định hình 3D (sau 24h đổ), thi công kết cấu vì kèo thép mạ kẽm, lợp ngói / tôn PU cách nhiệt, xử lý chống thấm toàn diện.",
      percentage: "20% giá trị hợp đồng"
    },
    {
      phase: "Giai đoạn 4: Hoàn thiện nội - ngoại thất",
      duration: "08 - 12 ngày",
      workContent: "Bả dẻo acrylic chống nứt, sơn lót kháng kiềm, sơn phủ Dulux/Jotun, lát nền gạch Porcelain, đóng trần thạch cao, lắp cửa nhôm Xingfa.",
      percentage: "15% giá trị hợp đồng"
    },
    {
      phase: "Giai đoạn 5: Thiết bị & Nghiệm thu",
      duration: "03 - 04 ngày",
      workContent: "Lắp đặt tủ bếp An Cường, thiết bị vệ sinh Inax/Toto, đèn LED Panasonic, kiểm tra áp lực nước, vệ sinh công nghiệp và bàn giao chìa khóa trao tay.",
      percentage: "10% giá trị hợp đồng"
    }
  ] : isSteelFrame ? [
    {
      phase: "Giai đoạn 1: Móng & chân đế cột thép",
      duration: nm.foundation === 'coc' ? "12 - 18 ngày (gồm ép cọc)" : "08 - 12 ngày",
      workContent: "Đào móng, đổ bê tông móng/đài giằng, chôn bulông neo chân cột đúng cao độ, lắp bể tự hoại.",
      percentage: "20% giá trị hợp đồng"
    },
    {
      phase: "Giai đoạn 2: Gia công & lắp dựng khung thép",
      duration: `${String(4 * floors + 4).padStart(2, '0')} - ${String(5 * floors + 6).padStart(2, '0')} ngày (gia công xưởng song song với làm móng)`,
      workContent: "Gia công cột dầm thép tại xưởng, sơn chống rỉ, cẩu lắp dựng, siết bulông cường độ cao, lắp dầm phụ.",
      percentage: "35% giá trị hợp đồng"
    },
    {
      phase: "Giai đoạn 3: Sàn Cemboard, vách panel & mái",
      duration: `${String(3 * floors + 5).padStart(2, '0')} - ${String(4 * floors + 7).padStart(2, '0')} ngày`,
      workContent: "Bắn sàn Cemboard, lắp vách panel, đi ống điện nước, lợp mái và chống thấm.",
      percentage: "25% giá trị hợp đồng"
    },
    {
      phase: "Giai đoạn 4: Hoàn thiện & bàn giao",
      duration: `${String(3 * floors + 10).padStart(2, '0')} - ${String(4 * floors + 15).padStart(2, '0')} ngày`,
      workContent: "Xử lý mối nối, bả sơn, lát sàn, lắp cửa, thiết bị vệ sinh, đèn, vệ sinh công nghiệp và bàn giao.",
      percentage: "20% giá trị hợp đồng"
    }
  ] : [
    {
      phase: "Giai đoạn 1: Chuẩn bị mặt bằng & Thi công móng",
      duration: floors > 2 ? "20 - 25 ngày" : "15 - 18 ngày",
      workContent: "Đào đất móng, ép cọc, đổ bê tông lót, đan thép đài giằng và đổ bê tông móng, bảo dưỡng ẩm.",
      percentage: "15% giá trị hợp đồng"
    },
    {
      phase: "Giai đoạn 2: Thi công kết cấu khung cột, dầm sàn",
      duration: floors > 2 ? "45 - 60 ngày" : "25 - 35 ngày",
      workContent: `Ghép cốp pha, đan thép cột dầm sàn ${floors} tầng, đổ bê tông sàn toàn khối và kiểm tra độ sụt.`,
      percentage: "35% giá trị hợp đồng"
    },
    {
      phase: "Giai đoạn 3: Xây thô tường bao & lắp ống ngầm điện nước",
      duration: "25 - 30 ngày",
      workContent: "Xây tường gạch 2 da, chôn ống luồn dây điện Sino/Cadivi, ống cấp thoát nước Tiền Phong, trát tường phẳng.",
      percentage: "25% giá trị hợp đồng"
    },
    {
      phase: "Giai đoạn 4: Hoàn thiện ốp lát, sơn bả & cửa",
      duration: "30 - 40 ngày",
      workContent: "Chống thấm Sika, ốp lát gạch granite, bả matit 2 lớp, sơn phủ 1 lót 2 màu, lắp đặt hệ thống cửa nhôm kính.",
      percentage: "20% giá trị hợp đồng"
    },
    {
      phase: "Giai đoạn 5: Lắp thiết bị, vệ sinh công nghiệp & bàn giao",
      duration: "10 - 15 ngày",
      workContent: "Lắp đặt thiết bị vệ sinh Inax/Toto, đèn chiếu sáng LED, kiểm tra điện nước, nghiệm thu bàn giao chìa khóa.",
      percentage: "5% bảo hành công trình"
    }
  ];

  // 6. Khuyến nghị chuyên gia & Giải thích diện tích sàn
  const coefUsed = (Math.round((totalFloorArea / area) * 100) / 100);
  const expertRecommendations = [
    `📐 DIỆN TÍCH: ${site.note} Sàn thực ${masterEstimate.dien_tich_san}m² (${area}m² × ${floors} tầng). Quy đổi theo cách nhà thầu báo giá: sàn + móng ${masterEstimate.he_so_quy_doi.mong} + mái ${masterEstimate.he_so_quy_doi.mai} = ${totalFloorArea}m² (hệ số ${coefUsed}) — dùng để so sánh đơn giá/m² với báo giá khác.`,
    `⚖️ TỔNG DỰ TOÁN phương án đã chọn: ${fmtVND(masterEstimate.tong_tron_goi)} (${masterEstimate.formatted_suat_dau_tu_m2}), chưa gồm: VAT, chi phí xin phép xây dựng, thiết kế, khảo sát địa chất, ép cọc (nếu địa chất yếu), phá dỡ nhà cũ, nội thất rời. Sai số dự toán sơ bộ ±10–15%.`,
    `🛡️ VẬT TƯ: Chủng loại & thương hiệu ghi trong bảng là đề xuất theo gói; hợp đồng thi công cần ghi rõ mã sản phẩm để gia chủ nghiệm thu.`,
    isEpsMonolithic
      ? `⚡ TIẾN ĐỘ: Công nghệ EPS & gông định hình rút ngắn phần thô; tổng thời gian dự kiến tùy số tầng và thời tiết. Cần đơn vị thi công có kinh nghiệm thực tế với hệ này.`
      : `⏱️ TIẾN ĐỘ: Nhà ${floors} tầng kết cấu ${isSteelFrame ? 'khung thép' : 'BTCT'} thường cần ${isSteelFrame ? Math.max(2, Math.round(floors * 1.0)) : Math.max(3, Math.round(floors * 1.5 + 1))}–${isSteelFrame ? Math.max(3, Math.round(floors * 1.5)) : Math.max(4, Math.round(floors * 2 + 1))} tháng (chưa tính thời gian xin phép).`
  ];

  const packageOptions = {
      pa1: {
        title: "PA1: Khung BTCT Truyền Thống",
        codeName: "BTCT_Truyen_Thong",
        pricePerSqm: estPA1.suat_dau_tu_m2,
        totalCost: estPA1.tong_tron_goi,
        desc: `Trọn gói chìa khóa trao tay: ${estPA1.formatted_tong_tron_goi} (${estPA1.formatted_suat_dau_tu_m2}). Móng băng/bè BTCT, cột dầm đổ tại chỗ, tường gạch xây trát.`
      },
      pa2: {
        title: "PA2: Khung Thép Lắp Ghép + Cemboard",
        codeName: "Khung_Thep_Cemboard",
        pricePerSqm: estPA2.suat_dau_tu_m2,
        totalCost: estPA2.tong_tron_goi,
        desc: `Trọn gói chìa khóa trao tay: ${estPA2.formatted_tong_tron_goi} (${estPA2.formatted_suat_dau_tu_m2}). Cột dầm thép hộp/hình I, sàn Cemboard, lắp ghép nhanh.`
      },
      pa3: {
        title: "PA3: Bê Tông Nhẹ EPS Đúc Liền Khối",
        codeName: "EPS_Gong3D_CongNgheMoi",
        pricePerSqm: estPA3.suat_dau_tu_m2,
        totalCost: estPA3.tong_tron_goi,
        desc: `Trọn gói chìa khóa trao tay: ${estPA3.formatted_tong_tron_goi} (${estPA3.formatted_suat_dau_tu_m2}). Vách EPS đúc liền khối gông 3D, cách nhiệt tốt, tải trọng nhẹ.`
      }
  };
  const selectedOption = optKey === 'PA1' ? packageOptions.pa1 : optKey === 'PA2' ? packageOptions.pa2 : packageOptions.pa3;

  return {
    areaPerFloor: area,
    selectedOptionKey: optKey,
    selectedOption,
    floors,
    totalFloorArea,
    packageOptions,
    structuralSolution: {
      foundation: foundationStr,
      columnsBeams: columnsBeamsStr,
      wallsCeiling: wallsCeilingStr,
      roofing: roofingStr,
      waterproofing: waterproofingStr
    },
    boqSummary,
    timelinePhases,
    expertRecommendations
  };
}
