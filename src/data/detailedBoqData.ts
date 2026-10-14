import { BOQItem } from './boqStandards';

// =================================================================================================
// BẢNG BÓC TÁCH VẬT TƯ – NHÂN CÔNG CHI TIẾT (BOQ) - PHƯƠNG ÁN 1: BTCT TRUYỀN THỐNG (GIÁ 2026)
// =================================================================================================
export const DETAILED_PA1_BOQ: BOQItem[] = [
  // --- A.1. Nhóm Móng & Tôn nền ---
  {
    id: 'pa1_thep_dam_mong',
    category: 'foundation',
    categoryName: 'A.1. Nhóm Móng & Tôn Nền',
    name: 'Thép dầm móng, đài móng & giằng móng Ø14, Ø16, Ø18 CB400-V (Hòa Phát/Pomina)',
    unit: 'kg',
    unitPrice: 17800,
    formulaDescription: '≈ 18–22 kg/m² sàn tầng 1',
    clientExplanation: 'Thanh thép vằn chịu lực dọc đáy và bụng dầm móng, chịu ứng suất uốn và chống lún lệch',
    technicalNote: 'Thép cường độ cao CB400-V, bẻ mỏ neo 30d vào đài móng theo TCVN 5574:2018',
    calculateQuantity: (sGround) => {
      const min = Math.round(sGround * 18);
      const max = Math.round(sGround * 22);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} kg` };
    }
  },
  {
    id: 'pa1_thep_dai_mong',
    category: 'foundation',
    categoryName: 'A.1. Nhóm Móng & Tôn Nền',
    name: 'Thép đai móng & thép giằng chân cột Ø8 CB240-T (đan đai a100–a150)',
    unit: 'kg',
    unitPrice: 17500,
    formulaDescription: '≈ 4–6 kg/m² sàn tầng 1',
    clientExplanation: 'Thép đai uốn vuông góc cố định vị trí cây thép chủ và chịu lực cắt của dầm móng',
    technicalNote: 'Uốn móc 135° ngàm sâu vào lõi bê tông chống bung khi chịu lực cắt',
    calculateQuantity: (sGround) => {
      const min = Math.round(sGround * 4);
      const max = Math.round(sGround * 6);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} kg` };
    }
  },
  {
    id: 'pa1_betong_mong',
    category: 'foundation',
    categoryName: 'A.1. Nhóm Móng & Tôn Nền',
    name: 'Bê tông móng mác M250 đá 1x2 thương phẩm (độ sụt 12±2cm)',
    unit: 'm³',
    unitPrice: 1480000,
    formulaDescription: '≈ 0,20–0,25 m³/m² sàn tầng 1',
    clientExplanation: 'Bê tông tươi trộn chuẩn trạm trộn, đầm dùi kỹ chống rỗ tổ ong đáy móng',
    technicalNote: 'Bê tông R28 ≥ 250 daN/cm², lấy mẫu thí nghiệm nén 3 tổ mẫu tại công trường',
    calculateQuantity: (sGround) => {
      const min = Number((sGround * 0.20).toFixed(1));
      const max = Number((sGround * 0.25).toFixed(1));
      const avg = Number(((min + max) / 2).toFixed(1));
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m³` };
    }
  },
  {
    id: 'pa1_betong_lot',
    category: 'foundation',
    categoryName: 'A.1. Nhóm Móng & Tôn Nền',
    name: 'Bê tông lót móng đá 4x6 mác M100 dày 10cm',
    unit: 'm³',
    unitPrice: 1150000,
    formulaDescription: '≈ 0,03–0,04 m³/m² sàn tầng 1',
    clientExplanation: 'Lớp bê tông đệm làm phẳng đáy hố móng và chống mất nước xi măng khi đổ móng',
    technicalNote: 'Đá 4x6 chèn chặt vữa mác 100, tạo mặt bằng sạch trước khi đặt cốt thép',
    calculateQuantity: (sGround) => {
      const min = Number((sGround * 0.03).toFixed(1));
      const max = Number((sGround * 0.04).toFixed(1));
      const avg = Number(((min + max) / 2).toFixed(1));
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m³` };
    }
  },
  {
    id: 'pa1_cat_ton_nen',
    category: 'foundation',
    categoryName: 'A.1. Nhóm Móng & Tôn Nền',
    name: 'Cát san lấp / Cát đen tôn nền tầng 1 đầm chặt K90',
    unit: 'm³',
    unitPrice: 180000,
    formulaDescription: '≈ 0,15–0,25 m³/m² sàn tầng 1',
    clientExplanation: 'Tôn cao cốt nền nhà so với mặt đường, đầm chặt triệt tiêu nguy cơ sụt lún gạch lát',
    technicalNote: 'Đầm cóc từng lớp dày ≤20cm tưới ẩm đạt độ chặt tiêu chuẩn K90',
    calculateQuantity: (sGround) => {
      const min = Number((sGround * 0.15).toFixed(1));
      const max = Number((sGround * 0.25).toFixed(1));
      const avg = Number(((min + max) / 2).toFixed(1));
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m³` };
    }
  },

  // --- A.2. Nhóm Khung chịu lực (Cột – Dầm – Sàn BTCT) ---
  {
    id: 'pa1_thep_cot_dam_khung',
    category: 'frame',
    categoryName: 'A.2. Nhóm Khung Chịu Lực (BTCT)',
    name: 'Thép cột & dầm khung chịu lực chính Ø16, Ø18, Ø20 CB400-V (Hòa Phát/Pomina)',
    unit: 'kg',
    unitPrice: 17800,
    formulaDescription: '≈ 16–19 kg/m² sàn xây dựng',
    clientExplanation: 'Thép dọc chịu lực chính của cột & dầm, truyền toàn bộ tải trọng công trình xuống móng',
    technicalNote: 'Thép dọc chịu kéo/nén chính, so le mối nối nối chồng ≥ 40d hoặc hàn đối đầu',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 16);
      const max = Math.round(sTotal * 19);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} kg` };
    }
  },
  {
    id: 'pa1_thep_san_2lop',
    category: 'frame',
    categoryName: 'A.2. Nhóm Khung Chịu Lực (BTCT)',
    name: 'Thép sàn 2 lớp (lớp dưới chịu kéo, lớp mũ trên chịu mô-men âm) Ø8, Ø10 CB300-V',
    unit: 'kg',
    unitPrice: 17800,
    formulaDescription: '≈ 10–12 kg/m² sàn xây dựng',
    clientExplanation: 'Đan lưới thép sàn 2 lớp a120–a150 kèm con kê bê tông 20mm chống võng nứt sàn',
    technicalNote: 'Lớp dưới thép a150, lớp mũ a120 kê chân chó thép đảm bảo chiều cao làm việc ho',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 10);
      const max = Math.round(sTotal * 12);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} kg` };
    }
  },
  {
    id: 'pa1_thep_dai_giang',
    category: 'frame',
    categoryName: 'A.2. Nhóm Khung Chịu Lực (BTCT)',
    name: 'Thép đai cột, đai dầm Ø6, Ø8 CB240-T & râu thép neo giằng tường',
    unit: 'kg',
    unitPrice: 17500,
    formulaDescription: '≈ 5–7 kg/m² sàn xây dựng',
    clientExplanation: 'Thép đai chịu lực cắt chống nở hông cột và râu thép neo tường chống nứt góc',
    technicalNote: 'Khoảng cách đai chân/đầu cột a100, giữa cột a200; râu tường cấy D6 a500',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 5);
      const max = Math.round(sTotal * 7);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} kg` };
    }
  },
  {
    id: 'pa1_betong_khung',
    category: 'frame',
    categoryName: 'A.2. Nhóm Khung Chịu Lực (BTCT)',
    name: 'Bê tông cột/dầm/sàn thương phẩm mác M250/M300 đá 1x2',
    unit: 'm³',
    unitPrice: 1550000,
    formulaDescription: '≈ 0,38–0,42 m³/m² sàn xây dựng',
    clientExplanation: 'Bê tông thương phẩm mác chuẩn đổ toàn khối dầm sàn, bảo dưỡng tưới nước 7 ngày',
    technicalNote: 'Cột mác M300, Dầm Sàn mác M250, bảo dưỡng giữ ẩm liên tục 14 ngày đầu',
    calculateQuantity: (_, sTotal) => {
      const min = Number((sTotal * 0.38).toFixed(1));
      const max = Number((sTotal * 0.42).toFixed(1));
      const avg = Number(((min + max) / 2).toFixed(1));
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m³` };
    }
  },
  {
    id: 'pa1_coppha_van_phim',
    category: 'frame',
    categoryName: 'A.2. Nhóm Khung Chịu Lực (BTCT)',
    name: 'Cốp pha ván ép phủ phim 15mm chịu nước & hệ giàn giáo chống thép nêm',
    unit: 'm²',
    unitPrice: 240000,
    formulaDescription: '≈ 2,2–2,6 m²/m² sàn xây dựng',
    clientExplanation: 'Ván khuôn phủ phim tạo bề mặt bê tông phẳng bóng, giàn giáo nêm an toàn tuyệt đối',
    technicalNote: 'Ván phủ phim keo WBP chống nước sôi 72h, xà gồ hộp kẽm 50x50mm chịu lực',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 2.2);
      const max = Math.round(sTotal * 2.6);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m²` };
    }
  },

  // --- A.3. Nhóm Tường bao che & Tách riêng Cát, Xi măng ---
  {
    id: 'pa1_gach_tuong_220',
    category: 'wall',
    categoryName: 'A.3. Nhóm Tường Bao Che & Vật Liệu Xây Trát',
    name: 'Gạch Tuynel nung xây tường bao ngoài 220mm (Viglacera/Đồng Nai)',
    unit: 'viên',
    unitPrice: 1850,
    formulaDescription: '≈ 110–120 viên/m² tường bao (khoảng 1.8–2.0 m² tường/m² sàn)',
    clientExplanation: 'Gạch Tuynel 2 lớp dày 220mm chống nóng hướng Tây, cách âm và chống thấm mặt tiền',
    technicalNote: 'Gạch đặc hoặc 2 lỗ mác M75 nung chín đều, ngâm ẩm trước khi xây',
    calculateQuantity: (_, sTotal) => {
      const wallArea = sTotal * 1.9;
      const min = Math.round(wallArea * 110);
      const max = Math.round(wallArea * 120);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} viên` };
    }
  },
  {
    id: 'pa1_gach_tuong_110',
    category: 'wall',
    categoryName: 'A.3. Nhóm Tường Bao Che & Vật Liệu Xây Trát',
    name: 'Gạch Tuynel nung xây tường ngăn phòng 110mm',
    unit: 'viên',
    unitPrice: 1850,
    formulaDescription: '≈ 55–60 viên/m² tường ngăn (khoảng 1.2–1.5 m² tường/m² sàn)',
    clientExplanation: 'Gạch ngăn chia các phòng ngủ, phòng vệ sinh, phòng thờ nhẹ tải',
    technicalNote: 'Cứ 5 hàng gạch xây 1 hàng gạch quay ngang khóa mạch và giằng râu thép D6',
    calculateQuantity: (_, sTotal) => {
      const wallArea = sTotal * 1.3;
      const min = Math.round(wallArea * 55);
      const max = Math.round(wallArea * 60);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} viên` };
    }
  },
  {
    id: 'pa1_cat_xay_trat',
    category: 'wall',
    categoryName: 'A.3. Nhóm Tường Bao Che & Vật Liệu Xây Trát',
    name: 'Cát vàng hạt vừa (mịn vừa) sàng lọc kỹ phục vụ xây tường & trát tường mác M75',
    unit: 'm³',
    unitPrice: 360000,
    formulaDescription: '≈ 0,22–0,26 m³/m² sàn xây dựng',
    clientExplanation: 'Cát sàng sạch qua lưới 1.5mm loại bỏ tạp chất, giúp vữa dẻo mịn chống rạn chân chim',
    technicalNote: 'Mô đun độ lớn 1.5–2.0, hàm lượng bùn sét < 3%, không nhiễm mặn',
    calculateQuantity: (_, sTotal) => {
      const min = Number((sTotal * 0.22).toFixed(1));
      const max = Number((sTotal * 0.26).toFixed(1));
      const avg = Number(((min + max) / 2).toFixed(1));
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m³` };
    }
  },
  {
    id: 'pa1_ximang_xay_trat',
    category: 'wall',
    categoryName: 'A.3. Nhóm Tường Bao Che & Vật Liệu Xây Trát',
    name: 'Xi măng PCB30/PCB40 chuyên dụng xây & trát hoàn thiện mác M75 (Hoàng Thạch/Hà Tiên/Bỉm Sơn)',
    unit: 'bao (50kg)',
    unitPrice: 92000,
    formulaDescription: '≈ 0,8–1,0 bao (50kg)/m² sàn xây dựng',
    clientExplanation: 'Xi măng dẻo giữ nước tốt, giúp thợ miết mạch vữa kín khít và trát tường phẳng bóng',
    technicalNote: 'Xi măng poóc lăng hỗn hợp mác 30/40, bảo quản pallet cách đất >20cm chống vón',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 0.8);
      const max = Math.round(sTotal * 1.0);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} bao (50kg)` };
    }
  },

  // --- A.4. Nhóm Mái & Chống Thấm (Tách biệt logic nhà 1 tầng vs 2 tầng, Mái ngói vs Mái tôn) ---
  {
    id: 'pa1_chongtham_wc',
    category: 'roof',
    categoryName: 'A.4. Nhóm Mái & Chống Thấm',
    name: 'Chống thấm sàn khu vệ sinh WC & ban công (SikaTop Seal 107 + Lưới thủy tinh gia cường)',
    unit: 'm²',
    unitPrice: 210000,
    formulaDescription: 'Đồng bộ 100% theo số phòng WC (5–7 m²/phòng)',
    clientExplanation: 'Quét 2 lớp vuông góc, dán lưới sợi thủy tinh bo góc chân tường cao 30cm, ngâm nước nghiệm thu 48h',
    technicalNote: 'Gốc xi măng polyme đàn hồi 2 thành phần, chịu áp lực nước liên tục (Áp dụng cho mọi ngôi nhà)',
    calculateQuantity: (_, __, floors, layout) => {
      const wcCount = layout?.wcCount || (floors === 1 ? 1 : Math.max(floors, 2));
      const min = wcCount * 5;
      const max = wcCount * 7;
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m² (đồng bộ ${wcCount} phòng WC)` };
    }
  },
  {
    id: 'pa1_chongtham_san_mai',
    category: 'roof',
    categoryName: 'A.4. Nhóm Mái & Chống Thấm',
    name: 'Chống thấm sàn mái lộ thiên / sân thượng (Màng PU đàn hồi 2 thành phần kháng UV)',
    unit: 'm²',
    unitPrice: 230000,
    formulaDescription: '= diện tích sàn mái lộ thiên (Chỉ áp dụng khi nhà ≥ 2 tầng hoặc mái bằng có sân thượng)',
    clientExplanation: 'Màng PU chống tia cực tím UV và chịu nhiệt độ co giãn ngoài trời, ngăn thấm dột trần nhà',
    technicalNote: 'Độ giãn dài >400%, kháng tia UV mặt trời, bảo hành chống thấm >10 năm',
    multiFloorOnly: true,
    calculateQuantity: (sGround, _, floors) => {
      if (floors <= 1) {
        return { qtyMin: 0, qtyMax: 0, qtyAverage: 0, formatted: '0 m² (Nhà 1 tầng lợp mái ngói không cần sàn mái bê tông)' };
      }
      const min = Math.round(sGround);
      const max = Math.round(sGround * 1.1);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `≈ ${min} – ${max} m²` };
    }
  },
  {
    id: 'pa1_mai_khung_keo_thep',
    category: 'roof',
    categoryName: 'A.4. Nhóm Mái & Chống Thấm',
    name: 'Hệ khung vì kèo & xà gồ rui mè thép mạ hợp kim nhôm kẽm siêu nhẹ chống gỉ (Smartruss/Zacs)',
    unit: 'm²',
    unitPrice: 360000,
    formulaDescription: '≈ 1,15–1,25 × diện tích sàn (Áp dụng khi gia chủ chọn nhà mái ngói/mái Thái/mái Nhật)',
    clientExplanation: 'Khung kèo thép mạ siêu nhẹ giảm tải cho cột móng, bắt vít chuyên dụng chống hoen gỉ tuyệt đối',
    technicalNote: 'Thép mạ kẽm cường độ cao G550 mạ AZ100, không bị gỉ sét mối hàn như sắt hộp đen',
    roofTypeTag: 'tiled',
    calculateQuantity: (sGround) => {
      const min = Math.round(sGround * 1.15);
      const max = Math.round(sGround * 1.25);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m²` };
    }
  },
  {
    id: 'pa1_mai_ngoi_song_caocap',
    category: 'roof',
    categoryName: 'A.4. Nhóm Mái & Chống Thấm',
    name: 'Ngói sóng tráng men / Ngói màu cao cấp (Fuji/Inari/Đồng Tâm) kèm phụ kiện ngói nóc & rìa',
    unit: 'm²',
    unitPrice: 320000,
    formulaDescription: '≈ 1,15–1,25 × diện tích sàn tầng mái (khoảng 9–10 viên/m²)',
    clientExplanation: 'Ngói sóng tráng men phủ bóng chống bám rêu mốc, cách âm chống ồn tuyệt đối khi mưa to gió bão',
    technicalNote: 'Ngói phụ kiện nóc, rìa, chạc 3 đồng bộ; ngói chính bắn vít inox chống tốc mái',
    roofTypeTag: 'tiled',
    calculateQuantity: (sGround) => {
      const min = Math.round(sGround * 1.15);
      const max = Math.round(sGround * 1.25);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m² (đồng bộ ngói nóc/rìa)` };
    }
  },
  {
    id: 'pa1_mai_ton_pu_3lop',
    category: 'roof',
    categoryName: 'A.4. Nhóm Mái & Chống Thấm',
    name: 'Tôn PU cách nhiệt chống nóng 3 lớp dày 0.45mm + Xà gồ thép hộp mạ kẽm (Khi chọn nhà mái tôn)',
    unit: 'm²',
    unitPrice: 340000,
    formulaDescription: '≈ 1,15 × diện tích sàn mái (Khi chọn phương án mái tôn)',
    clientExplanation: 'Lớp tôn mạ màu + lõi xốp PU 20mm + màng bạc cách nhiệt giảm 6-8°C, chống ồn khi mưa',
    technicalNote: 'Tôn Hoa Sen/Đông Á dày 0.45mm, xà gồ hộp mạ kẽm 50x100mm dập lỗ thoát nước',
    roofTypeTag: 'metal',
    calculateQuantity: (sGround) => {
      const min = Math.round(sGround * 1.10);
      const max = Math.round(sGround * 1.20);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m²` };
    }
  },

  // --- A.5. Nhóm Hoàn thiện & Tách riêng từng loại cửa theo m² ---
  {
    id: 'pa1_gach_lat_nen',
    category: 'finishing',
    categoryName: 'A.5. Nhóm Hoàn Thiện & Cửa Nhôm Kính Chi Tiết',
    name: 'Gạch lát nền 60x60 / 80x80 granite nhân tạo porcelain & ốp tường WC 30x60',
    unit: 'm²',
    unitPrice: 320000,
    formulaDescription: '≈ 1,05 × diện tích sàn sử dụng (hao hụt 5%)',
    clientExplanation: 'Gạch xương bán sứ mài cạnh chống trầy xước, keo dán gạch chuyên dụng chống phồng rộp',
    technicalNote: 'Độ hút nước E < 0.5%, lát ke cân bằng gạch 1.5mm, chà ron chống ố mốc',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 1.05);
      const max = Math.round(sTotal * 1.15);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m²` };
    }
  },
  {
    id: 'pa1_son_nuoc',
    category: 'finishing',
    categoryName: 'A.5. Nhóm Hoàn Thiện & Cửa Nhôm Kính Chi Tiết',
    name: 'Sơn nước cao cấp (1 lớp lót kháng kiềm + 2 lớp phủ màu Dulux/Jotun ngoại & nội thất)',
    unit: 'lít',
    unitPrice: 95000,
    formulaDescription: '≈ diện tích tường × 2 mặt ÷ 7 (lít/m²/lớp) × 3 lớp',
    clientExplanation: 'Sơn ngoại thất chống kiềm chống rêu mốc, sơn nội thất dễ lau chùi vết bẩn',
    technicalNote: 'Độ phủ 7m²/lít/lớp, độ ẩm tường < 16% trước khi lăn sơn lót',
    calculateQuantity: (_, sTotal) => {
      const wallArea = sTotal * 3.0;
      const liters = Math.round((wallArea / 7) * 3);
      return { qtyMin: liters, qtyMax: Math.round(liters * 1.1), qtyAverage: liters, formatted: `≈ ${liters} – ${Math.round(liters * 1.1)} lít` };
    }
  },
  {
    id: 'pa1_tran_thach_cao',
    category: 'finishing',
    categoryName: 'A.5. Nhóm Hoàn Thiện & Cửa Nhôm Kính Chi Tiết',
    name: 'Trần thạch cao chìm Vĩnh Tường khung Boral tấm chống ẩm 9mm',
    unit: 'm²',
    unitPrice: 240000,
    formulaDescription: '= diện tích sàn xây dựng các tầng',
    clientExplanation: 'Trần phẳng giấu kín đường dây điện ống nước, bố trí đèn LED âm trần thẩm mỹ',
    technicalNote: 'Khung xương chìm mạ kẽm Vĩnh Tường BASI, tấm chống ẩm Gyproc dán băng keo lưới chống nứt',
    calculateQuantity: (_, sTotal) => {
      const qty = Math.round(sTotal);
      return { qtyMin: qty, qtyMax: qty, qtyAverage: qty, formatted: `≈ ${qty} m²` };
    }
  },
  {
    id: 'pa1_cua_chinh_mat_tien',
    category: 'finishing',
    categoryName: 'A.5. Nhóm Hoàn Thiện & Cửa Nhôm Kính Chi Tiết',
    name: 'Cửa đi chính mặt tiền (Cửa 4 cánh / 2 cánh, nhôm Xingfa hệ 55 dày 2.0mm + Kính an toàn 8.38mm)',
    unit: 'm²',
    unitPrice: 2450000,
    formulaDescription: 'Tính theo m² thông thủy Lỗ Ban 52.2cm (cung Cát Phúc Lộc)',
    clientExplanation: 'Cửa đại sảnh mặt tiền chịu gió bão, khóa đa điểm an toàn, gioăng EPDM kín khít',
    technicalNote: 'Nhôm Xingfa nhập khẩu tem đỏ hệ 55 dày 2.0mm, kính dán an toàn 8.38mm 2 lớp',
    calculateQuantity: (sGround) => {
      const area = sGround > 120 ? 9.6 : (sGround > 80 ? 7.8 : 6.2);
      return { qtyMin: Number((area * 0.9).toFixed(1)), qtyMax: Number((area * 1.1).toFixed(1)), qtyAverage: area, formatted: `${area} m² (Cửa 4 cánh đại sảnh Lỗ Ban)` };
    }
  },
  {
    id: 'pa1_cua_phong_ngu',
    category: 'finishing',
    categoryName: 'A.5. Nhóm Hoàn Thiện & Cửa Nhôm Kính Chi Tiết',
    name: 'Cửa thông phòng & phòng ngủ (Nhôm Xingfa hệ 55 dày 1.4mm hoặc Cửa gỗ Composite cốt đúc)',
    unit: 'm²',
    unitPrice: 1950000,
    formulaDescription: '≈ 2.0 m²/bộ × số lượng phòng ngủ trên mặt bằng kiến trúc',
    clientExplanation: 'Cửa phòng ngủ cách âm tốt, đóng mở êm ái, chống cong vênh co ngót theo mùa',
    technicalNote: 'Kích thước Lỗ Ban chuẩn 810x2150mm (≈1.9–2.1 m²/bộ), bản lề inox 304',
    calculateQuantity: (_, __, floors, layout) => {
      const bedCount = layout?.bedroomCount || (floors === 1 ? 2 : floors * 2);
      const totalSqm = Number((bedCount * 2.0).toFixed(1));
      return { qtyMin: totalSqm, qtyMax: totalSqm, qtyAverage: totalSqm, formatted: `${totalSqm} m² (${bedCount} bộ phòng ngủ)` };
    }
  },
  {
    id: 'pa1_cua_wc',
    category: 'finishing',
    categoryName: 'A.5. Nhóm Hoàn Thiện & Cửa Nhôm Kính Chi Tiết',
    name: 'Cửa phòng vệ sinh WC (Nhôm hệ 55 + Kính an toàn phun cát mờ / Pano nhôm lá chớp)',
    unit: 'm²',
    unitPrice: 1850000,
    formulaDescription: '≈ 1.6 m²/bộ × số lượng phòng vệ sinh trên bản vẽ',
    clientExplanation: 'Chống ẩm ướt 100%, không mục nát hoen gỉ trong môi trường nước và hóa chất tẩy rửa',
    technicalNote: 'Kích thước chuẩn Lỗ Ban 700x2000mm (≈1.5–1.7 m²/bộ), khóa gạt vệ sinh không chìa an toàn',
    calculateQuantity: (_, __, floors, layout) => {
      const wcCount = layout?.wcCount || (floors === 1 ? 1 : Math.max(floors, 2));
      const totalSqm = Number((wcCount * 1.6).toFixed(1));
      return { qtyMin: totalSqm, qtyMax: totalSqm, qtyAverage: totalSqm, formatted: `${totalSqm} m² (${wcCount} bộ WC)` };
    }
  },
  {
    id: 'pa1_cua_so_chan_song',
    category: 'finishing',
    categoryName: 'A.5. Nhóm Hoàn Thiện & Cửa Nhôm Kính Chi Tiết',
    name: 'Cửa sổ mở quay / lùa 2–4 cánh nhôm hệ 55 + Kính an toàn 6.38mm kèm chấn song inox bảo vệ',
    unit: 'm²',
    unitPrice: 2150000,
    formulaDescription: '≈ 1,8–2,4 m²/bộ × số lượng cửa sổ các phòng',
    clientExplanation: 'Lấy sáng và đón gió đối lưu tự nhiên, khung chấn song inox 304 bảo vệ chống trộm',
    technicalNote: 'Hệ 55 dày 1.4mm, kính an toàn 6.38mm chống vỡ vụn, gioăng chống mưa tràn ngược',
    calculateQuantity: (_, sTotal, floors) => {
      const windowCount = Math.max(4, Math.round(sTotal / 25) + floors);
      const totalSqm = Number((windowCount * 2.1).toFixed(1));
      return { qtyMin: totalSqm, qtyMax: totalSqm, qtyAverage: totalSqm, formatted: `${totalSqm} m² (${windowCount} bộ cửa sổ)` };
    }
  },

  // --- A.6. Nhóm M&E (Điện - Nước) Tách rõ Dây đơn / Dây đôi / Ống nước ---
  {
    id: 'pa1_cap_nguon_tong_2x6',
    category: 'mep',
    categoryName: 'A.6. Nhóm Cơ Điện M&E (Dây Điện Đơn/Đôi & Ống Cấp Thoát Nước)',
    name: 'Cáp đôi cấp nguồn tổng từ công tơ vào tủ điện: Cáp Cu/PVC/PVC 2x6mm² hoặc 2x10mm² Cadisun',
    unit: 'md',
    unitPrice: 68000,
    formulaDescription: '≈ 25–45 md (theo khoảng cách từ cột điện vào tủ điện tổng)',
    clientExplanation: 'Cáp đôi 2 lõi đồng bọc 2 lớp vỏ cách điện chịu toàn bộ công suất điện sinh hoạt cả căn nhà',
    technicalNote: 'Cáp Cu/PVC/PVC 2x6mm² (hoặc 2x10mm² nếu có 4+ điều hòa/bếp từ), luồn ống gân xoắn HDPE ngầm',
    calculateQuantity: (sGround) => {
      const len = sGround > 100 ? 35 : 25;
      return { qtyMin: len, qtyMax: len + 10, qtyAverage: len, formatted: `${len} md (Cáp nguồn tổng 2x6mm²)` };
    }
  },
  {
    id: 'pa1_day_doi_cong_suat_2x4',
    category: 'mep',
    categoryName: 'A.6. Nhóm Cơ Điện M&E (Dây Điện Đơn/Đôi & Ống Cấp Thoát Nước)',
    name: 'Dây đôi cấp nhánh công suất lớn (Bếp từ, Bình nóng lạnh, Điều hòa nhiệt độ): Dây Cu/PVC 2x4mm² Cadisun',
    unit: 'md',
    unitPrice: 38000,
    formulaDescription: '≈ 1,2–1,5 md/m² sàn xây dựng',
    clientExplanation: 'Dây đôi 2x4mm² cấp riêng biệt cho từng thiết bị tải nặng, chống quá nhiệt chập cháy điện',
    technicalNote: 'Mỗi lộ tải nặng đi 1 aptomat tép RCBO chống giật riêng biệt tại tủ điện nhánh',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 1.2);
      const max = Math.round(sTotal * 1.5);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} md (Dây đôi 2x4mm²)` };
    }
  },
  {
    id: 'pa1_day_doi_o_cam_2x2_5',
    category: 'mep',
    categoryName: 'A.6. Nhóm Cơ Điện M&E (Dây Điện Đơn/Đôi & Ống Cấp Thoát Nước)',
    name: 'Dây đôi cấp nguồn ổ cắm điện sinh hoạt phòng khách, phòng ngủ: Dây Cu/PVC 2x2.5mm² Cadisun',
    unit: 'md',
    unitPrice: 26000,
    formulaDescription: '≈ 2,0–2,5 md/m² sàn xây dựng',
    clientExplanation: 'Dây đôi 2x2.5mm² cấp điện cho tivi, tủ lạnh, quạt, máy tính, sạc điện thoại an toàn',
    technicalNote: 'Đi dây đôi trong ống gen cứng SP chôn ngầm tường, độ sâu chôn >25mm',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 2.0);
      const max = Math.round(sTotal * 2.5);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} md (Dây đôi 2x2.5mm²)` };
    }
  },
  {
    id: 'pa1_day_don_chieu_sang_1x1_5',
    category: 'mep',
    categoryName: 'A.6. Nhóm Cơ Điện M&E (Dây Điện Đơn/Đôi & Ống Cấp Thoát Nước)',
    name: 'Dây đơn cấp chiếu sáng, đèn LED & công tắc điều khiển: Dây đơn Cu/PVC 1x1.5mm² (hoặc 1x0.75mm²)',
    unit: 'md',
    unitPrice: 12500,
    formulaDescription: '≈ 2,5–3,0 md/m² sàn xây dựng',
    clientExplanation: 'Dây đơn 1 lõi đồng mềm dẫn điện từ công tắc đến bóng đèn tiết kiệm điện năng',
    technicalNote: 'Phân màu dây chuẩn: Dây pha (Đỏ/Vàng), Dây trung tính (Xanh), Dây tiếp địa (Vàng-Xanh lá)',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 2.5);
      const max = Math.round(sTotal * 3.0);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} md (Dây đơn 1x1.5mm²)` };
    }
  },
  {
    id: 'pa1_ong_gen_chong_chay',
    category: 'mep',
    categoryName: 'A.6. Nhóm Cơ Điện M&E (Dây Điện Đơn/Đôi & Ống Cấp Thoát Nước)',
    name: 'Ống gen cứng chống cháy SP / Sino luồn dây điện âm tường và sàn (D16, D20, D25)',
    unit: 'md',
    unitPrice: 14000,
    formulaDescription: '≈ 4,0–5,0 md/m² sàn xây dựng',
    clientExplanation: 'Ống nhựa PVC tự chống cháy lan, bảo vệ cơ học chống đinh đóng vào dây điện',
    technicalNote: 'Ống gen tròn chống va đập 750N, uốn bằng lò xo lạnh không bị gãy gập',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 4.0);
      const max = Math.round(sTotal * 5.0);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} md (Ống gen chống cháy D16-D20)` };
    }
  },
  {
    id: 'pa1_ong_cap_ppr',
    category: 'mep',
    categoryName: 'A.6. Nhóm Cơ Điện M&E (Dây Điện Đơn/Đôi & Ống Cấp Thoát Nước)',
    name: 'Ống cấp nước sạch hàn nhiệt PPR PN10/PN16 chịu nhiệt độ cao (Tiền Phong/Vesbo/Bình Minh)',
    unit: 'md',
    unitPrice: 45000,
    formulaDescription: '≈ 1,2–1,6 md/m² sàn',
    clientExplanation: 'Ống hàn nhiệt vĩnh cửu không bao giờ rò rỉ tại mối nối, dẫn nước nóng thái dương năng an toàn',
    technicalNote: 'Ống PPR chịu áp suất 10-16 bar, test áp suất nước 8 bar trong 24h trước khi trát kín',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 1.2);
      const max = Math.round(sTotal * 1.6);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} md (Ống hàn nhiệt PPR)` };
    }
  },
  {
    id: 'pa1_ong_thoat_upvc',
    category: 'mep',
    categoryName: 'A.6. Nhóm Cơ Điện M&E (Dây Điện Đơn/Đôi & Ống Cấp Thoát Nước)',
    name: 'Ống thoát nước thải & phân uPVC D60, D90, D110 dày C2 (Tiền Phong) kèm bẫy siphon ngăn mùi',
    unit: 'md',
    unitPrice: 55000,
    formulaDescription: '≈ 1,5–2,0 md/m² sàn',
    clientExplanation: 'Độ dốc tiêu chuẩn 2%, có bẫy siphon chữ U và ống thông hơi D60 chống mùi hôi bốc ngược',
    technicalNote: 'Độ dốc thoát nước i = 2–3%, dán keo PVC chuyên dụng và treo quang đai đệm cao su',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 1.5);
      const max = Math.round(sTotal * 2.0);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} md (Ống thoát uPVC D90-D110)` };
    }
  },
  {
    id: 'pa1_thiet_bi_ve_sinh',
    category: 'mep',
    categoryName: 'A.6. Nhóm Cơ Điện M&E (Dây Điện Đơn/Đôi & Ống Cấp Thoát Nước)',
    name: 'Thiết bị vệ sinh (Bồn cầu 1 khối men tuyết nano, Lavabo, Vòi sen tắm nóng lạnh Inax/Toto/Viglacera)',
    unit: 'bộ',
    unitPrice: 7500000,
    formulaDescription: 'Đồng bộ 100% theo số phòng vệ sinh thực tế trên bản vẽ',
    clientExplanation: 'Bộ thiết bị vệ sinh cao cấp men chống bám bẩn nano, phụ kiện vòi đồng mạ crom 3 lớp',
    technicalNote: 'Xả xoáy Siphonic tiết kiệm nước, bảo hành men sứ 10 năm chính hãng',
    calculateQuantity: (_, __, floors, layout) => {
      const toilets = layout?.wcCount || (floors === 1 ? 1 : Math.max(floors, 2));
      return { qtyMin: toilets, qtyMax: toilets, qtyAverage: toilets, formatted: `${toilets} bộ trọn gói (đồng bộ ${toilets} phòng WC)` };
    }
  },

  // --- A.7. Nhóm Nhân công xây dựng ---
  {
    id: 'pa1_nhancong_thoho',
    category: 'labor',
    categoryName: 'A.7. Nhóm Nhân Công Xây Dựng (Tổ Đội Chuyên Môn Hóa)',
    name: 'Nhân công thợ hồ (xây tường gạch, trát vữa trong/ngoài, cán nền lát gạch, chống thấm)',
    unit: 'công',
    unitPrice: 490000,
    formulaDescription: '≈ 0,35–0,45 công/m² sàn',
    clientExplanation: 'Đội ngũ thợ hồ tay nghề bậc 3-4/7 thi công hoàn thiện bề mặt phẳng đẹp chuẩn xác',
    technicalNote: 'Thợ có chứng chỉ an toàn lao động, kiểm tra thước nhôm 2m độ phẳng trát tường',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 0.35);
      const max = Math.round(sTotal * 0.45);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `≈ ${min} – ${max} công` };
    }
  },
  {
    id: 'pa1_nhancong_thosat_coppha',
    category: 'labor',
    categoryName: 'A.7. Nhóm Nhân Công Xây Dựng (Tổ Đội Chuyên Môn Hóa)',
    name: 'Nhân công thợ sắt & ghép cốp pha định hình móng, cột, dầm, sàn',
    unit: 'công',
    unitPrice: 520000,
    formulaDescription: '≈ 0,15–0,20 công/m² sàn',
    clientExplanation: 'Thợ uốn buộc cốt thép đúng quy chuẩn TCVN 5574:2018 và lắp dựng ván khuôn chuẩn nivo',
    technicalNote: 'Nghiệm thu tim trục, độ thẳng đứng cột bằng quả rọi và nivo laser trước khi đổ bê tông',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 0.15);
      const max = Math.round(sTotal * 0.20);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `≈ ${min} – ${max} công` };
    }
  },
  {
    id: 'pa1_nhancong_thodiennuoc',
    category: 'labor',
    categoryName: 'A.7. Nhóm Nhân Công Xây Dựng (Tổ Đội Chuyên Môn Hóa)',
    name: 'Nhân công thợ điện – nước (M&E) thi công âm tường, luồn dây & đấu nối thiết bị',
    unit: 'công',
    unitPrice: 490000,
    formulaDescription: '≈ 0,10–0,15 công/m² sàn',
    clientExplanation: 'Thợ chuyên ngành luồn dây cáp, thử áp đường ống 24h và lắp đặt thiết bị an toàn',
    technicalNote: 'Đấu nối dây điện bấm cos, test cách điện mê-gôm-mét trước khi đóng điện',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 0.10);
      const max = Math.round(sTotal * 0.15);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `≈ ${min} – ${max} công` };
    }
  },
  {
    id: 'pa1_nhancong_thosonba',
    category: 'labor',
    categoryName: 'A.7. Nhóm Nhân Công Xây Dựng (Tổ Đội Chuyên Môn Hóa)',
    name: 'Nhân công thợ sơn bả matit hoàn thiện bề mặt 3 lớp',
    unit: 'công',
    unitPrice: 450000,
    formulaDescription: '≈ 0,08–0,12 công/m² sàn',
    clientExplanation: 'Thợ bả phẳng tường, chà nhám máy hút bụi và lăn 3 lớp sơn nước hoàn thiện',
    technicalNote: 'Chà nhám phẳng mịn, rọi đèn halogen kiểm tra độ phẳng không để lại vệt xước',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 0.08);
      const max = Math.round(sTotal * 0.12);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `≈ ${min} – ${max} công` };
    }
  },
  {
    id: 'pa1_nhancong_lap_cua',
    category: 'labor',
    categoryName: 'A.7. Nhóm Nhân Công Xây Dựng (Tổ Đội Chuyên Môn Hóa)',
    name: 'Nhân công lắp đặt hoàn thiện hệ cửa nhôm kính & trần thạch cao',
    unit: 'công',
    unitPrice: 490000,
    formulaDescription: 'Đồng bộ theo số lượng bộ cửa và trần trên bản vẽ',
    clientExplanation: 'Thợ cân chỉnh bản lề nivo laser, bắn silicon chống thấm chân khung bao',
    technicalNote: 'Bơm foam nở chân khung và miết keo silicon A500 kháng thời tiết ngoài trời',
    calculateQuantity: (_, __, floors, layout) => {
      const doors = layout?.totalDoorAndWindowCount || (floors === 1 ? 8 : floors * 4 + 2);
      const cong = Math.max(4, Math.round(doors * 0.5));
      return { qtyMin: cong, qtyMax: cong + 2, qtyAverage: cong, formatted: `≈ ${cong} – ${cong + 2} công` };
    }
  }
];

// =================================================================================================
// BẢNG BÓC TÁCH VẬT TƯ – NHÂN CÔNG CHI TIẾT (BOQ) - PHƯƠNG ÁN 2: KHUNG THÉP TIỀN CHẾ + CEMBOARD (GIÁ 2026)
// =================================================================================================
export const DETAILED_PA2_BOQ: BOQItem[] = [
  // --- A.1. Nhóm Móng ---
  {
    id: 'pa2_mong_don_giamtai',
    category: 'foundation',
    categoryName: 'A.1. Nhóm Móng Đơn & Giằng Móng Chân Cột',
    name: 'Bê tông móng đơn & đà kiềng giằng chân cột mác M250 (giảm 40% tải trọng so với BTCT)',
    unit: 'm³',
    unitPrice: 1480000,
    formulaDescription: '≈ 0,12–0,16 m³/m² sàn tầng 1',
    clientExplanation: 'Móng đơn chịu tải chân cột thép nhẹ, tiết kiệm đáng kể chi phí đào đất và bê tông',
    technicalNote: 'Bê tông M250 đá 1x2, kích thước đài móng tối ưu theo bước gian kết cấu thép',
    calculateQuantity: (sGround) => {
      const min = Number((sGround * 0.12).toFixed(1));
      const max = Number((sGround * 0.16).toFixed(1));
      const avg = Number(((min + max) / 2).toFixed(1));
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m³` };
    }
  },
  {
    id: 'pa2_bulong_banma',
    category: 'foundation',
    categoryName: 'A.1. Nhóm Móng Đơn & Giằng Móng Chân Cột',
    name: 'Bu-lông neo móng M16–M20 (cấp bền 8.8) + Bản mã thép dày 12mm & Vữa Grout không co ngót',
    unit: 'bộ',
    unitPrice: 480000,
    formulaDescription: '4–6 bu-lông neo móng cường độ cao cho mỗi chân cột thép',
    clientExplanation: 'Cố định cột thép vào móng bê tông vững chắc, chống rung lật khi có gió bão',
    technicalNote: 'Vữa SikaGrout 214-11 rót chèn đáy bản mã chịu nén >60 MPa',
    calculateQuantity: (sGround) => {
      const cols = Math.max(Math.round(sGround / 15), 6);
      return { qtyMin: cols, qtyMax: cols, qtyAverage: cols, formatted: `${cols} cụm bản mã (${cols * 4} bu-lông M16-M20)` };
    }
  },

  // --- A.2. Nhóm Khung thép tiền chế ---
  {
    id: 'pa2_thep_hinh_cot_dam',
    category: 'frame',
    categoryName: 'A.2. Nhóm Khung Kết Cấu Thép Tiền Chế',
    name: 'Thép hình I, H & Hộp chế tạo Cột, Dầm chính (SS400/Q235 sơn chống gỉ 2 lớp + 1 lớp sơn màu)',
    unit: 'kg',
    unitPrice: 32500,
    formulaDescription: '≈ 25–32 kg/m² sàn xây dựng',
    clientExplanation: 'Khung kết cấu thép tiền chế gia công tại xưởng, lắp ghép tại công trường trong 3–5 ngày',
    technicalNote: 'Thép hình nhập khẩu đạt chuẩn TCVN 5575:2012, mối hàn siêu âm kiểm tra khuyết tật',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 25);
      const max = Math.round(sTotal * 32);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} kg` };
    }
  },
  {
    id: 'pa2_dam_phu_hop_san',
    category: 'frame',
    categoryName: 'A.2. Nhóm Khung Kết Cấu Thép Tiền Chế',
    name: 'Dầm phụ thép hộp mạ kẽm 50x100mm đan dày 30–40cm đỡ sàn Cemboard',
    unit: 'md',
    unitPrice: 110000,
    formulaDescription: '≈ 2,8–3,2 md/m² sàn tầng lầu (nhịp đan 30–40cm tim-tim)',
    clientExplanation: 'Hệ dầm phụ đan dày đặc đỡ sàn Cemboard, triệt tiêu hoàn toàn hiện tượng rung lắc sàn',
    technicalNote: 'Khoảng cách xà gồ dầm phụ a = 300–407mm tương thích khổ tấm Cemboard 1220x2440mm',
    calculateQuantity: (_, sTotal, floors) => {
      const upperFloorsArea = sTotal * ((floors - 1) / Math.max(floors, 1));
      const effective = upperFloorsArea > 0 ? upperFloorsArea : sTotal * 0.5;
      const min = Math.round(effective * 2.8);
      const max = Math.round(effective * 3.2);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} md` };
    }
  },
  {
    id: 'pa2_giang_cheo_bulong',
    category: 'frame',
    categoryName: 'A.2. Nhóm Khung Kết Cấu Thép Tiền Chế',
    name: 'Hệ giằng chéo chữ X (D16–D20) & Bu-lông liên kết cường độ cao cấp bền 8.8 mạ kẽm',
    unit: 'bộ',
    unitPrice: 380000,
    formulaDescription: 'Hệ giằng hồi + giằng mái đảm bảo độ cứng không gian chống xoắn',
    clientExplanation: 'Khóa cứng hệ khung thép, chống rung lắc đa hướng khi có bão gió lớn',
    technicalNote: 'Bu-lông cấp bền 8.8 siết bằng cờ lê lực kiểm soát mô-men xoắn',
    calculateQuantity: (_, __, floors) => {
      const count = floors * 4 + 4;
      return { qtyMin: count, qtyMax: count + 2, qtyAverage: count, formatted: `${count} bộ giằng X + Bu-lông 8.8` };
    }
  },

  // --- A.3. Nhóm Sàn nhẹ Cemboard & Vách Panel ---
  {
    id: 'pa2_san_cemboard',
    category: 'wall',
    categoryName: 'A.3. Nhóm Sàn Cemboard & Vách Panel Nhẹ Cách Nhiệt',
    name: 'Tấm sàn xi măng sợi Cemboard SCG Thái Lan 16mm/18mm chịu lực cao',
    unit: 'm²',
    unitPrice: 420000,
    formulaDescription: '≈ 1,05 × diện tích sàn các tầng trên (hao hụt 5%)',
    clientExplanation: 'Tấm xi măng sợi nhẹ chịu tải 500kg/m², chống mối mọt, chống cháy và cách âm tốt',
    technicalNote: 'Tấm Cemboard SCG nhập khẩu nguyên tấm, bắn vít tự khoan có cánh ngầm âm mặt phẳng',
    calculateQuantity: (_, sTotal, floors) => {
      const upper = sTotal * ((floors - 1) / Math.max(floors, 1));
      const effective = upper > 0 ? upper : sTotal * 0.4;
      const min = Math.round(effective * 1.05);
      const max = Math.round(effective * 1.10);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `≈ ${min} – ${max} m²` };
    }
  },
  {
    id: 'pa2_vach_panel_nhe',
    category: 'wall',
    categoryName: 'A.3. Nhóm Sàn Cemboard & Vách Panel Nhẹ Cách Nhiệt',
    name: 'Tấm vách Panel nhẹ EPS/PU cách nhiệt 50mm + nẹp nhôm nano định hình',
    unit: 'm²',
    unitPrice: 450000,
    formulaDescription: '≈ 2,0–2,4 m² vách/m² sàn xây dựng',
    clientExplanation: 'Vách lắp ghép siêu nhẹ, chống nóng, không cần xây trát vữa xi măng ướt',
    technicalNote: 'Tôn 2 mặt mạ màu dày 0.4mm, lõi xốp EPS tỷ trọng 14-16 kg/m³ chống cháy lan',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 2.0);
      const max = Math.round(sTotal * 2.4);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `≈ ${min} – ${max} m²` };
    }
  },

  // --- A.4. Nhóm Mái & Chống thấm ---
  {
    id: 'pa2_chongtham_cemboard_wc',
    category: 'roof',
    categoryName: 'A.4. Nhóm Mái & Chống Thấm',
    name: 'Chống thấm sàn Cemboard WC & Mối nối (Keo PU đàn hồi + SikaTop Seal 107 dán lưới thủy tinh)',
    unit: 'm²',
    unitPrice: 240000,
    formulaDescription: 'Đồng bộ 100% theo số phòng vệ sinh thực tế',
    clientExplanation: 'Xử lý triệt để mối ghép tấm Cemboard, ngăn nước thấm rò rỉ xuống tầng dưới',
    technicalNote: 'Bơm keo trám khe Sikaflex 11FC, phủ màng chống thấm polyme 2 thành phần 2 lớp',
    calculateQuantity: (_, __, floors, layout) => {
      const toilets = layout?.wcCount || (floors === 1 ? 1 : Math.max(floors, 2));
      const min = toilets * 6;
      const max = toilets * 8;
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m² (đồng bộ ${toilets} WC)` };
    }
  },
  {
    id: 'pa2_mai_ton_lanh_pu',
    category: 'roof',
    categoryName: 'A.4. Nhóm Mái & Chống Thấm',
    name: 'Mái tôn lạnh cách nhiệt 3 lớp (lõi PU/EPS chống nóng dày 50mm + tôn mạ kẽm màu)',
    unit: 'm²',
    unitPrice: 320000,
    formulaDescription: '= diện tích mái dốc (S sàn × 1.15–1.25)',
    clientExplanation: 'Lợp tôn lạnh 3 lớp chống nóng mùa hè và triệt tiêu tiếng ồn khi trời mưa lớn',
    technicalNote: 'Sóng tôn dập cao thoát nước nhanh, vít bắn tôn inox kèm gioăng cao su EPDM',
    calculateQuantity: (sGround) => {
      const min = Math.round(sGround * 1.15);
      const max = Math.round(sGround * 1.25);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m²` };
    }
  },

  // --- A.5. Nhóm Hoàn thiện & Cửa nhôm kính chi tiết ---
  {
    id: 'pa2_hoanthien_san_go',
    category: 'finishing',
    categoryName: 'A.5. Nhóm Hoàn Thiện & Cửa Chi Tiết',
    name: 'Sàn gỗ công nghiệp cốt xanh chống ẩm 12mm / Gạch lát nền dán keo trên sàn Cemboard',
    unit: 'm²',
    unitPrice: 350000,
    formulaDescription: '≈ 1,05 × diện tích sàn sử dụng',
    clientExplanation: 'Hoàn thiện bề mặt sàn êm chân, ấm cúng và sang trọng, chống mối mọt',
    technicalNote: 'Sàn gỗ HDF cốt xanh chịu nước mài mòn AC4, lót xốp tráng bạc chống ẩm 2mm',
    calculateQuantity: (_, sTotal) => {
      const qty = Math.round(sTotal * 1.05);
      return { qtyMin: qty, qtyMax: qty, qtyAverage: qty, formatted: `≈ ${qty} m²` };
    }
  },
  {
    id: 'pa2_cua_chinh_mat_tien',
    category: 'finishing',
    categoryName: 'A.5. Nhóm Hoàn Thiện & Cửa Chi Tiết',
    name: 'Cửa cuốn tấm liền Austdoor hoặc Cửa nhôm Xingfa hệ 55 mặt tiền 4 cánh',
    unit: 'm²',
    unitPrice: 2450000,
    formulaDescription: 'Theo kích thước thông thủy Lỗ Ban 52.2cm mặt tiền',
    clientExplanation: 'Cửa mặt tiền sang trọng, an toàn, đóng mở êm nhẹ bằng mô tơ hoặc tay kéo',
    technicalNote: 'Nan nhôm hợp kim AL6063 T5 sơn tĩnh điện ngoài trời bảo hành 10 năm',
    calculateQuantity: (sGround) => {
      const area = sGround > 100 ? 8.5 : 6.5;
      return { qtyMin: area, qtyMax: area, qtyAverage: area, formatted: `${area} m² (Cửa đại sảnh Lỗ Ban)` };
    }
  },
  {
    id: 'pa2_cua_phong_ngu_wc',
    category: 'finishing',
    categoryName: 'A.5. Nhóm Hoàn Thiện & Cửa Chi Tiết',
    name: 'Cửa thông phòng ngủ & Cửa WC nhôm Xingfa hệ 55 + Cửa sổ an toàn (tính theo m²)',
    unit: 'm²',
    unitPrice: 1950000,
    formulaDescription: 'Tính chi tiết theo m² từng loại cửa (Phòng ngủ: 2.0m², WC: 1.6m², Cửa sổ: 2.1m²)',
    clientExplanation: 'Hệ cửa nhôm đồng bộ, cách âm kín khít, không cong vênh',
    technicalNote: 'Phụ kiện Kinlong chính hãng, khóa đơn/đa điểm an toàn',
    calculateQuantity: (_, sTotal, floors, layout) => {
      const bedCount = layout?.bedroomCount || (floors === 1 ? 2 : floors * 2);
      const wcCount = layout?.wcCount || (floors === 1 ? 1 : Math.max(floors, 2));
      const totalSqm = Number((bedCount * 2.0 + wcCount * 1.6 + floors * 4.2).toFixed(1));
      return { qtyMin: totalSqm, qtyMax: totalSqm, qtyAverage: totalSqm, formatted: `${totalSqm} m² (${bedCount} cửa ngủ + ${wcCount} cửa WC + Cửa sổ)` };
    }
  },

  // --- A.6. Nhóm M&E (Dây điện & Ống nước) ---
  {
    id: 'pa2_mep_cap_dien_day_doi_don',
    category: 'mep',
    categoryName: 'A.6. Nhóm Điện – Nước',
    name: 'Hệ thống dây điện Cadisun (Dây nguồn đôi 2x6mm², dây nhánh 2x4mm², dây ổ cắm 2x2.5mm², dây đèn 1x1.5mm²)',
    unit: 'md',
    unitPrice: 32000,
    formulaDescription: '≈ 5,0–6,0 md/m² sàn (đi trong ống gen cứng chống cháy giấu rãnh Panel)',
    clientExplanation: 'Phân tách rõ dây đôi chịu tải lớn và dây đơn điều khiển bóng đèn tiết kiệm điện',
    technicalNote: 'Dây cáp điện bọc nhựa PVC/XLPE luồn ống gen chống cháy SP/Sino D20',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 5.0);
      const max = Math.round(sTotal * 6.0);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} md (Tách lộ dây đôi & đơn)` };
    }
  },
  {
    id: 'pa2_mep_ong_nuoc_ppr_pvc',
    category: 'mep',
    categoryName: 'A.6. Nhóm Điện – Nước',
    name: 'Ống cấp nước hàn nhiệt PPR & Ống thoát uPVC Tiền Phong giấu trong hộp gen kỹ thuật',
    unit: 'md',
    unitPrice: 55000,
    formulaDescription: '≈ 2,0–2,5 md/m² sàn',
    clientExplanation: 'Hệ thống đường ống cấp thoát nước hoàn thiện kín khít, có bẫy siphon ngăn mùi',
    technicalNote: 'Ống cấp hàn nhiệt PPR chịu áp lực 16 bar, ống thoát uPVC D90-D110',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 2.0);
      const max = Math.round(sTotal * 2.5);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} md` };
    }
  },

  // --- A.7. Nhóm Nhân công lắp ghép ---
  {
    id: 'pa2_nhancong_cokhi',
    category: 'labor',
    categoryName: 'A.7. Nhóm Nhân Công Cơ Khí & Lắp Ghép (Thi Công Nhanh)',
    name: 'Nhân công thợ cơ khí lắp dựng khung kết cấu thép tiền chế & giằng bu-lông',
    unit: 'công',
    unitPrice: 550000,
    formulaDescription: '≈ 0,10–0,14 công/m² sàn (lắp siêu nhanh trong 3–5 ngày)',
    clientExplanation: 'Thợ cơ khí chuyên nghiệp cẩu dựng cột dầm thép, siết bu-lông cân chỉnh nivo laser chuẩn xác',
    technicalNote: 'Kiểm tra độ thẳng đứng cột ≤ H/1000, siết lực bu-lông theo tiêu chuẩn kết cấu thép',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 0.10);
      const max = Math.round(sTotal * 0.14);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `≈ ${min} – ${max} công` };
    }
  },
  {
    id: 'pa2_nhancong_lapcemboard',
    category: 'labor',
    categoryName: 'A.7. Nhóm Nhân Công Cơ Khí & Lắp Ghép (Thi Công Nhanh)',
    name: 'Nhân công thợ bắn sàn Cemboard, ghép vách Panel nhẹ & xử lý mối nối',
    unit: 'công',
    unitPrice: 500000,
    formulaDescription: '≈ 0,12–0,16 công/m² sàn',
    clientExplanation: 'Thợ bắn vít sàn Cemboard chuyên dụng, lắp nẹp vách và dán lưới keo xử lý mối nối phẳng',
    technicalNote: 'Bắn vít cách mép tấm ≥ 15mm, khoảng cách vít 20–30cm',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 0.12);
      const max = Math.round(sTotal * 0.16);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `≈ ${min} – ${max} công` };
    }
  },
  {
    id: 'pa2_nhancong_hoanthien',
    category: 'labor',
    categoryName: 'A.7. Nhóm Nhân Công Cơ Khí & Lắp Ghép (Thi Công Nhanh)',
    name: 'Nhân công thợ điện nước, sơn bả hoàn thiện & lắp đặt thiết bị',
    unit: 'công',
    unitPrice: 490000,
    formulaDescription: '≈ 0,10–0,12 công/m² sàn',
    clientExplanation: 'Thợ đấu nối thiết bị vệ sinh, đèn LED, lát sàn gỗ và sơn hoàn thiện',
    technicalNote: 'Kiểm tra vận hành thiết bị trọn gói trước khi bàn giao',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 0.10);
      const max = Math.round(sTotal * 0.12);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `≈ ${min} – ${max} công` };
    }
  }
];

// =================================================================================================
// BẢNG BÓC TÁCH VẬT TƯ – NHÂN CÔNG CHI TIẾT (BOQ) - PHƯƠNG ÁN 3: BÊ TÔNG NHẸ EPS ĐÚC LIỀN KHỐI & GÔNG 3D (GIÁ 2026)
// =================================================================================================
export const DETAILED_PA3_BOQ: BOQItem[] = [
  // --- A.1. Nhóm Móng ---
  {
    id: 'pa3_mong_tietkiem',
    category: 'foundation',
    categoryName: 'A.1. Nhóm Móng (Tiết Kiệm 50% Khối Lượng Nhờ Giảm Tải 60%)',
    name: 'Bê tông móng băng nhẹ / Móng bè mác M250 đá 1x2 (giảm 50% khối lượng móng)',
    unit: 'm³',
    unitPrice: 1480000,
    formulaDescription: '≈ 0,10–0,14 m³/m² sàn tầng 1',
    clientExplanation: 'Tải trọng nhà nhẹ hơn 60% so với gạch nung truyền thống, giúp tiết kiệm hàng chục triệu tiền móng cọc',
    technicalNote: 'Bê tông móng mác M250, thép giằng dầm D14-D16 CB300-V',
    calculateQuantity: (sGround) => {
      const min = Number((sGround * 0.10).toFixed(1));
      const max = Number((sGround * 0.14).toFixed(1));
      const avg = Number(((min + max) / 2).toFixed(1));
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m³` };
    }
  },

  // --- A.2. Nhóm Cột & Vách Bê Tông Xốp Liền Khối ---
  {
    id: 'pa3_betong_eps_duc',
    category: 'frame',
    categoryName: 'A.2. Nhóm Vách & Cột EPS Đúc Liền Khối Toàn Phần',
    name: 'Bê tông hạt xốp EPS đúc liền khối dày 12–15cm (tỷ trọng 800–1000 kg/m³, mác M100–M150)',
    unit: 'm³',
    unitPrice: 1850000,
    formulaDescription: '≈ 0,28–0,32 m³/m² sàn xây dựng',
    clientExplanation: 'Bê tông hạt xốp đúc nguyên khối không mạch ngừng, cách âm >45dB, mát hơn 4-6°C, chống nồm ẩm tuyệt đối',
    technicalNote: 'Cấp phối: Xi măng PCB40 + Hạt EPS xử lý bề mặt + Cát mịn + Phụ gia tăng dẻo & chống phân tầng',
    calculateQuantity: (_, sTotal) => {
      const min = Number((sTotal * 0.28).toFixed(1));
      const max = Number((sTotal * 0.32).toFixed(1));
      const avg = Number(((min + max) / 2).toFixed(1));
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m³` };
    }
  },
  {
    id: 'pa3_thep_cot_giang',
    category: 'frame',
    categoryName: 'A.2. Nhóm Vách & Cột EPS Đúc Liền Khối Toàn Phần',
    name: 'Thép cột chịu lực 20×20cm (4 thanh D14 CB300-V + đai D6) & Thép giằng sàn liên kết',
    unit: 'kg',
    unitPrice: 17800,
    formulaDescription: '≈ 12–15 kg/m² sàn xây dựng (tiết kiệm 50% lượng thép)',
    clientExplanation: 'Cột chịu lực đổ đồng nhất ẩn chìm trong vách EPS, liên kết thép vững chắc không lộ góc cạnh',
    technicalNote: 'Thép cột D14 CB300-V liên kết móng, bẻ mỏ neo chắc chắn',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 12);
      const max = Math.round(sTotal * 15);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} kg` };
    }
  },
  {
    id: 'pa3_luoi_thep_han_d4',
    category: 'frame',
    categoryName: 'A.2. Nhóm Vách & Cột EPS Đúc Liền Khối Toàn Phần',
    name: 'Lưới thép hàn D4 a100x100 gia cường chống nứt 2 mặt vách EPS',
    unit: 'm²',
    unitPrice: 48000,
    formulaDescription: '≈ 2,0 × diện tích tường vách EPS (đặt áp sát 2 mặt vách)',
    clientExplanation: 'Gia cường độ dẻo dai và chịu va đập, triệt tiêu hoàn toàn hiện tượng nứt xé chân chim',
    technicalNote: 'Lưới thép hàn cường độ cao D4 kéo nguội, buộc cố định vào khung gông 3D',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 3.5);
      const max = Math.round(sTotal * 4.0);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m²` };
    }
  },

  // --- A.3. Nhóm Hệ Gông Định Hình 3D Độc Quyền ---
  {
    id: 'pa3_he_gong_3d',
    category: 'wall',
    categoryName: 'A.3. Nhóm Hệ Gông Định Hình 3D & Phụ Gia Đông Kết',
    name: 'Hệ Gông định hình 3D chống nghiêng & chống phình vách (bộ khuôn luân chuyển)',
    unit: 'gói',
    unitPrice: 15000000,
    formulaDescription: 'Bộ gông 3D hợp kim siêu phẳng, luân chuyển tháo dỡ sau 24h',
    clientExplanation: 'Khóa phẳng 2 mặt vách chuẩn xác 100%, đúc xong bề mặt phẳng nhẵn như trát matit',
    technicalNote: 'Hệ giằng ti ren xuyên tường D12 kèm tán chuồn và thanh hộp hợp kim chịu lực ép vữa bê tông nhẹ',
    calculateQuantity: (sGround) => {
      return { qtyMin: 1, qtyMax: 1, qtyAverage: 1, formatted: `1 Gói luân chuyển (cho sàn ${sGround}m²)` };
    }
  },
  {
    id: 'pa3_phu_gia_r7',
    category: 'wall',
    categoryName: 'A.3. Nhóm Hệ Gông Định Hình 3D & Phụ Gia Đông Kết',
    name: 'Phụ gia tăng dẻo & đông kết nhanh R7 (cho phép tháo gông sau 24h)',
    unit: 'lít',
    unitPrice: 55000,
    formulaDescription: '≈ 1,2% trọng lượng xi măng',
    clientExplanation: 'Giúp vách đạt cường độ nhanh chỉ sau 24 giờ để tháo gông, thi công thần tốc',
    technicalNote: 'Phụ gia giảm nước kéo dài độ sụt và đẩy nhanh cường độ sớm R3',
    calculateQuantity: (_, sTotal) => {
      const liters = Math.round(sTotal * 2.5);
      return { qtyMin: liters, qtyMax: liters, qtyAverage: liters, formatted: `≈ ${liters} lít` };
    }
  },

  // --- A.4. Nhóm Mái & Chống Thấm ---
  {
    id: 'pa3_chongtham_wc_phan_tich',
    category: 'roof',
    categoryName: 'A.4. Nhóm Mái & Chống Thấm (Đặc Tính Kháng Nước Của Bê Tông Xốp)',
    name: 'Chống thấm sàn khu vệ sinh WC & Ban công (SikaTop Seal 107 dán lưới thủy tinh)',
    unit: 'm²',
    unitPrice: 220000,
    formulaDescription: 'Quét 2 lớp chống thấm sàn ướt WC (Vách EPS đã có tính kháng ẩm tự nhiên)',
    clientExplanation: 'Vách bê tông xốp EPS không hút nước mao dẫn; chỉ cần xử lý lớp màng chống thấm sàn WC 48h',
    technicalNote: 'Độ hút nước của bê tông EPS < 3% (thấp hơn nhiều so với gạch đất nung 12-15%)',
    calculateQuantity: (_, __, floors, layout) => {
      const wcCount = layout?.wcCount || (floors === 1 ? 1 : Math.max(floors, 2));
      const min = wcCount * 5;
      const max = wcCount * 7;
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m² (đồng bộ ${wcCount} phòng WC)` };
    }
  },
  {
    id: 'pa3_mai_khung_keo_ngoi',
    category: 'roof',
    categoryName: 'A.4. Nhóm Mái & Chống Thấm (Đặc Tính Kháng Nước Của Bê Tông Xốp)',
    name: 'Hệ vì kèo mạ kẽm siêu nhẹ + Ngói sóng cao cấp (hoặc Tôn PU 3 lớp khi chọn mái tôn)',
    unit: 'm²',
    unitPrice: 340000,
    formulaDescription: '≈ 1,15–1,25 × diện tích sàn (Đồng bộ theo kiểu mái khách hàng tick chọn trong app)',
    clientExplanation: 'Lợp mái ngói sóng cao cấp hoặc tôn PU cách nhiệt, liên kết neo thép vào giằng đỉnh tường EPS',
    technicalNote: 'Khoan cấy bu-lông nở hoặc đúc râu thép chờ trên đỉnh vách EPS liên kết thanh xà gồ biên',
    calculateQuantity: (sGround) => {
      const min = Math.round(sGround * 1.15);
      const max = Math.round(sGround * 1.25);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min} – ${max} m²` };
    }
  },

  // --- A.5. Nhóm Hoàn thiện & Cửa nhôm kính chi tiết theo m² ---
  {
    id: 'pa3_bot_ba_deo_son',
    category: 'finishing',
    categoryName: 'A.5. Nhóm Hoàn Thiện & Cửa Nhôm Kính Chi Tiết',
    name: 'Bột bả dẻo chuyên dụng trám phẳng lỗ gông + Sơn lót kiềm và 2 lớp sơn màu hoàn thiện',
    unit: 'bao / lít',
    unitPrice: 240000,
    formulaDescription: 'Bột bả dẻo co giãn + Sơn cao cấp (Tiết kiệm 70% vữa trát so với tường gạch)',
    clientExplanation: 'Vách đúc bằng gông 3D rất phẳng nhẵn nên chỉ cần bả mỏng 1–2mm là sơn được, không cần trát vữa dày',
    technicalNote: 'Bột bả dẻo gốc acrylic kháng nứt, kết dính tuyệt đối trên bề mặt bê tông EPS',
    calculateQuantity: (_, sTotal) => {
      const bao = Math.round(sTotal * 0.4);
      return { qtyMin: bao, qtyMax: bao, qtyAverage: bao, formatted: `≈ ${bao} bao (40kg) + Sơn nước 3 lớp` };
    }
  },
  {
    id: 'pa3_cua_nhom_kinh_m2',
    category: 'finishing',
    categoryName: 'A.5. Nhóm Hoàn Thiện & Cửa Nhôm Kính Chi Tiết',
    name: 'Hệ cửa nhôm kính Xingfa hệ 55 + Kính an toàn tính chi tiết theo m² (Cửa chính, cửa ngủ, WC, cửa sổ)',
    unit: 'm²',
    unitPrice: 2250000,
    formulaDescription: 'Tính chi tiết theo m² từng chủng loại cửa Lỗ Ban 52.2cm',
    clientExplanation: 'Khuôn cửa được chèn dưỡng gỗ/thép chính xác ngay trong khi đúc gông 3D, lắp cửa vừa khít 100%',
    technicalNote: 'Khoan bắt vít nở trực tiếp vào khung dưỡng đúc sẵn, bơm foam nở và keo silicon chống nước',
    calculateQuantity: (_, sTotal, floors, layout) => {
      const bedCount = layout?.bedroomCount || (floors === 1 ? 2 : floors * 2);
      const wcCount = layout?.wcCount || (floors === 1 ? 1 : Math.max(floors, 2));
      const totalSqm = Number((7.5 + bedCount * 2.0 + wcCount * 1.6 + floors * 4.0).toFixed(1));
      return { qtyMin: totalSqm, qtyMax: totalSqm, qtyAverage: totalSqm, formatted: `${totalSqm} m² (Toàn bộ cửa theo m²)` };
    }
  },

  // --- A.6. Nhóm M&E (Điện Nước Âm Vách) ---
  {
    id: 'pa3_mep_am_vach_truoc',
    category: 'mep',
    categoryName: 'A.6. Nhóm Cơ Điện M&E Âm Vách (Tách Rõ Dây Đôi & Dây Đơn)',
    name: 'Dây cáp điện Cadisun (Dây nguồn đôi 2x6mm², dây nhánh 2x4mm², ổ cắm 2x2.5mm², đèn 1x1.5mm²) luồn sẵn trong vách EPS',
    unit: 'md',
    unitPrice: 48000,
    formulaDescription: '100% âm trong vách trước khi bơm bê tông EPS (Không đục tường sau này)',
    clientExplanation: 'Ống gen và dây điện được cố định cùng lưới thép trước khi bơm vữa xốp, tường nguyên khối không rạn nứt',
    technicalNote: 'Ống gen cứng chống cháy SP chôn định vị vào lưới thép D4, đế âm chôn phẳng mặt gông',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 3.5);
      const max = Math.round(sTotal * 4.0);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} md (Âm vách đúc sẵn)` };
    }
  },
  {
    id: 'pa3_mep_ong_nuoc_am_vach',
    category: 'mep',
    categoryName: 'A.6. Nhóm Cơ Điện M&E Âm Vách (Tách Rõ Dây Đôi & Dây Đơn)',
    name: 'Ống cấp nước hàn nhiệt PPR PN16 & Ống thoát uPVC đúc chìm trong hộp kỹ thuật vách',
    unit: 'md',
    unitPrice: 58000,
    formulaDescription: '≈ 1,8–2,2 md/m² sàn',
    clientExplanation: 'Đường ống nước đi thẳng trong hộp kỹ thuật, bọc bảo ôn chống ồn khi xả nước',
    technicalNote: 'Test áp lực 10 bar trước khi đổ bê tông vách bao quanh',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 1.8);
      const max = Math.round(sTotal * 2.2);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')} md` };
    }
  },

  // --- A.7. Nhóm Nhân công công nghệ Yohu ---
  {
    id: 'pa3_nhancong_gong_bom',
    category: 'labor',
    categoryName: 'A.7. Nhóm Nhân Công Công Nghệ Yohu (Giảm 60% Thợ)',
    name: 'Tổ thợ công nghệ: Lắp dựng gông 3D, bơm bê tông xốp EPS đúc liền khối & Hoàn thiện',
    unit: 'công',
    unitPrice: 550000,
    formulaDescription: '≈ 0,15–0,20 công/m² sàn (giảm 60% nhân công xây trát)',
    clientExplanation: 'Đổ toàn bộ vách và sàn trong 1–2 ngày bằng máy bơm vữa chuyên dụng, rút ngắn tiến độ bàn giao nhà',
    technicalNote: 'Đội thợ đào tạo chứng chỉ thi công cốp pha định hình 3D và vận hành máy bơm vữa trục vít',
    calculateQuantity: (_, sTotal) => {
      const min = Math.round(sTotal * 0.15);
      const max = Math.round(sTotal * 0.20);
      const avg = Math.round((min + max) / 2);
      return { qtyMin: min, qtyMax: max, qtyAverage: avg, formatted: `≈ ${min} – ${max} công` };
    }
  }
];

