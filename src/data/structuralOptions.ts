export interface StructuralOption {
  id: 'PA1' | 'PA2' | 'PA3';
  name: string;
  codeName: string;
  shortDescription: string;
  badge: string;
  highlights: string[];
  referenceDocContent: Record<string, string>;
  // Số liệu kết cấu CỐ ĐỊNH của từng phương án (móng/cột/dầm/sàn/vách).
  // Đây là nguồn số liệu duy nhất được gửi cho AI ở MỌI mục, để mục IX, X... không tự bịa số khác mục III.
  structuralFactsSummary?: string;
}

export const STRUCTURAL_OPTIONS: StructuralOption[] = [
  {
    id: 'PA1',
    name: 'Khung Bê Tông Cốt Thép (BTCT) Truyền Thống',
    codeName: 'BTCT_Truyen_Thong',
    shortDescription: 'Khung cột/dầm/sàn BTCT đổ tại chỗ liền khối, tường gạch xây trát vữa xi măng. Phương án phổ biến nhất tại Việt Nam.',
    badge: 'Phổ biến nhất',
    highlights: [
      'Liên kết cứng tự nhiên do đổ liền khối',
      'Dễ tìm thợ thi công ở mọi địa phương',
      'Độ bền cao, chịu lực đa hướng tốt',
      'Quy mô phổ biến từ 1 đến 5 tầng'
    ],
    referenceDocContent: {
      "I": `THUYẾT MINH KIẾN TRÚC – KẾT CẤU
PHƯƠNG ÁN 1 — NHÀ Ở KHUNG BÊ TÔNG CỐT THÉP (BTCT) TRUYỀN THỐNG
I. THÔNG TIN CHUNG & CĂN CỨ THIẾT KẾ
- Loại hình công trình: nhà ở riêng lẻ / nhà phố / biệt thự, kết cấu chịu lực chính là khung bê tông cốt thép (BTCT) đổ tại chỗ, quy mô phổ biến 1–5 tầng.
- Đây là giải pháp kết cấu phổ biến và quen thuộc nhất tại Việt Nam, được hầu hết các đơn vị thiết kế – thi công dân dụng trên cả nước áp dụng.
- Liên kết dầm – cột – sàn là liên kết cứng tự nhiên do đổ bê tông liền khối cùng một lần, không cần tính toán bổ sung khung cứng như kết cấu thép lắp ghép.
- Tiêu chuẩn tham chiếu khuyến nghị: TCVN 5574:2018 (kết cấu bê tông và bê tông cốt thép), TCVN 2737:2020 (tải trọng và tác động), TCVN 9362:2012 (thiết kế nền nhà và công trình), QCVN 06:2022/BXD (an toàn cháy cho nhà và công trình).
- Ghi chú kỹ sư: nên khảo sát địa chất tối thiểu (hố khoan/xuyên tĩnh) trước khi thiết kế móng cho công trình từ 2 tầng trở lên.`,

      "II": `II. KIẾN TRÚC MẶT TIỀN
- Hình khối: linh hoạt theo yêu cầu gia chủ — mái bằng, mái Thái, mái Nhật hoặc mái dốc lợp ngói; mặt tiền có thể ốp đá, sơn nước, giả gỗ, kết hợp lam bê tông/nhôm trang trí.
- Hệ cửa: cửa chính khung nhôm kính hoặc gỗ công nghiệp, cửa sổ khung nhôm hệ kính cường lực; không giới hạn tỷ lệ mảng đặc/mảng kính như kết cấu thép do khung BTCT chịu lực đa hướng tốt.
- Ban công, ô văng, console: đổ liền khối với sàn, có thể vươn ra 0.8–1.2m tùy tính toán tải trọng.`,

      "III": `III. GIẢI PHÁP KẾT CẤU
3.1. Nền và móng:
- Loại móng (móng đơn, móng băng, móng bè hoặc móng cọc) xác định theo tải trọng công trình và kết quả khảo sát địa chất thực tế.
- Móng băng phổ biến cho nhà phố 2–3 tầng: bản móng rộng 0,9–1,2m, dày 25–30cm, thép chủ D14–D16, lớp bê tông lót đá 4x6 dày 10cm. Giằng móng tiết diện 20x30cm hoặc 25x35cm, thép chủ D16–D18.
3.2. Khung chịu lực chính:
- Cột BTCT: tiết diện phổ biến 200x200mm đến 220x300mm tùy tầng và nhịp, thép chủ D16–D20, đai D6–D8 khoảng cách 15–20cm.
- Dầm chính: tiết diện 200x300mm đến 220x400mm tùy nhịp và tải trọng, thép chủ D16–D20, kiểm tra độ võng cho phép L/250.
- Sàn: đổ tại chỗ dày 10–12cm, thép sàn D8–D10 hai lớp trên/dưới.
3.3. Tường bao che:
- Tường xây gạch nung hoặc gạch bê tông khí chưng áp (AAC) dày 110–200mm, trát vữa xi măng cát hai mặt dày 1,5–2cm, sơn bả hoàn thiện.
3.4. Sàn các tầng trên & Cầu thang & Mái & Chống thấm.`,

      "IV": `IV. BỐ TRÍ CÔNG NĂNG TẦNG 1
- Không gian bố trí tự do, không phụ thuộc vào vị trí vách chịu lực — chỉ cần tránh phạm vi lưới cột chịu lực chính.
- Khu vực bếp, vệ sinh bố trí theo trục kỹ thuật cấp thoát nước, có thể thay đổi vị trí tường ngăn không chịu lực trong tương lai mà không ảnh hưởng kết cấu chính.
- Cầu thang đặt theo mặt bằng cụ thể, có chiếu nghỉ tránh bước trực tiếp từ cửa chính vào bậc đầu tiên.`,

      "V": `V. BỐ TRÍ CÔNG NĂNG TẦNG 2 TRỞ LÊN
- Có thể bố trí nhà vệ sinh, ban công, sân phơi ở bất kỳ tầng nào nhờ khả năng chịu tải và chống thấm tốt của sàn BTCT — không có giới hạn như phương án sàn nhẹ.
- Phòng ngủ, phòng thờ, phòng làm việc bố trí linh hoạt theo nhu cầu gia chủ và hướng nắng/gió.`,

      "VI": `VI. HỆ THỐNG KỸ THUẬT ĐIỆN – NƯỚC – AN TOÀN
- Đường điện và ống cấp thoát nước đi âm trong tường/sàn trước khi trát/lát hoàn thiện.
- Hệ thống tiếp địa và chống sét theo TCVN 9385:2012, kim thu sét đỉnh mái.
- An toàn điện: tủ điện tổng có aptomat chống giật (ELCB/RCD), dây dẫn đi trong ống gen chống cháy.
- PCCC cơ bản: bình chữa cháy xách tay, lối thoát hiểm qua cầu thang chính.`,

      "IX": `IX. GÓC NHÌN PHONG THỦY (TƯ VẤN BỔ SUNG GIA CHỦ)
- Nguyên tắc bố trí cầu thang, bếp, cửa chính, hướng nhà theo phong thủy áp dụng chung cho mọi loại kết cấu chịu lực.
- Cầu thang 21 bậc (Sinh - Lão - Bệnh - Tử) đếm từ bậc 1 = Sinh, rơi vào cung Sinh. Cầu thang đặt giữa nhà có chiếu nghỉ, tránh xông thẳng ra cửa chính.
- Bếp đặt "Tọa Hung Hướng Cát", tránh đối diện cửa chính và WC.`,

      "X": `X. GHI CHÚ THI CÔNG, GIÁM SÁT VÀ AN TOÀN
- Khảo sát địa chất và mực nước ngầm trước khi thiết kế móng.
- Giám sát chất lượng bê tông (mác thiết kế, độ sụt, dưỡng hộ) và cốt thép (đúng chủng loại, khoảng cách).
- Thời gian tháo dỡ cốp pha tuân thủ TCVN để đảm bảo cường độ chịu tải.`
    },
    structuralFactsSummary: `SỐ LIỆU KẾT CẤU CHUẨN — PA1 (BTCT truyền thống), áp dụng thống nhất cho toàn bộ hồ sơ, tuyệt đối không tự suy diễn số khác:
- Móng: Móng băng BTCT rộng 0,9–1,2m, dày 25–30cm, thép chủ D14–D16, bê tông lót đá 4x6 dày 10cm; giằng móng 20x30cm hoặc 25x35cm thép chủ D16–D18 (chọn loại móng cụ thể theo khảo sát địa chất và quy mô công trình thực tế của khách hàng).
- Cột chịu lực: tiết diện 200x200mm–220x300mm tùy tầng/nhịp, thép chủ D16–D20, đai D6–D8 khoảng cách 15–20cm.
- Dầm chính: tiết diện 200x300mm–220x400mm, thép chủ D16–D20.
- Sàn: đổ tại chỗ dày 10–12cm, thép D8–D10 hai lớp trên/dưới.
- Tường bao che: gạch nung/AAC dày 110–200mm, trát vữa xi măng 1,5–2cm mỗi mặt.`
  },
  {
    id: 'PA2',
    name: 'Khung Thép Tiền Chế Lắp Ghép + Sàn Cemboard',
    codeName: 'Khung_Thep_Cemboard',
    shortDescription: 'Cột dầm thép hình I/hộp, sàn Cemboard 1.6cm dầm phụ 30-40cm, vách panel nhẹ 5cm, lắp ghép siêu tốc module 3m/nhịp.',
    badge: 'Thi công siêu tốc',
    highlights: [
      'Thi công cực nhanh, giảm 40-50% thời gian',
      'Thích hợp nhà ống, kinh doanh, chuỗi nhà liền kề',
      'Kết cấu nhẹ, giảm tải trọng móng',
      'Dễ tháo dỡ, nâng tầng, cải tạo'
    ],
    referenceDocContent: {
      "I": `THUYẾT MINH KIẾN TRÚC – KẾT CẤU
NHÀ Ở KHUNG THÉP LẮP GHÉP THEO YÊU CẦU GIA CHỦ
I. THÔNG TIN CHUNG & CĂN CỨ THIẾT KẾ
- Loại hình công trình: nhà ở riêng lẻ dạng nhà ống, khung thép tiền chế lắp ghép, thiết kế theo module 3m/nhịp để linh hoạt lắp đặt.
- Cấp công trình: nhà ở thấp tầng, kết cấu chính chịu lực bằng khung thép, tường bao che nhẹ (tấm panel), sàn tầng bằng tấm bê tông siêu nhẹ Cemboard.
- Tiêu chuẩn tham chiếu: TCVN 2737:2020 (tải trọng và tác động), TCVN 5575:2012 (kết cấu thép), TCVN 9362:2012 (thiết kế nền nhà và công trình), QCVN 06:2022/BXD (an toàn cháy).
- Ghi chú kỹ sư: Cần khảo sát địa chất tối thiểu để xác định kích thước đế móng.`,

      "II": `II. KIẾN TRÚC MẶT TIỀN
- Hình khối: kiến trúc 2-3 tầng, linh hoạt mặt tiền kinh doanh. Tầng 1 sử dụng cửa cuốn khổ rộng hoặc kính cường lực. Tầng 2-3 dùng hệ kính khung nhôm hệ kết hợp ô cố định và lùa.
- Mái dốc lệch 8-12% về phía sau hoặc mái bằng tôn lạnh chống nóng. Mái đua tạo sảnh đón ốp nhựa giả gỗ downlight.`,

      "III": `III. GIẢI PHÁP KẾT CẤU
3.1. Nền và móng:
- Móng đơn/móng cốc cục bộ 60x60 - 80x80cm, sâu 60-80cm.
- Giằng móng BTCT 20x30cm liên kết chân cột chống lún lệch.
- Bản mã chân cột (base plate) liên kết bu-lông neo M16-M20 (tối thiểu 4 bu-lông/chân cột) có vữa gạt không co ngót (grouting).
3.2. Khung thép chịu lực chính:
- Cột thép hộp vuông 150x150x2.5mm hoặc thép hình I200/H200, giật cấp theo tầng. Cột góc/mặt tiền kinh doanh dùng H250x250 hoặc hộp 250x250x5mm.
- Dầm chính: Thép hình I200 - I350 hoặc hộp 100x200 - 200x350mm. Liên kết dầm-cột bu-lông cường độ cao + bản mã gusset plate.
3.3. Khung cứng cửa cuốn & Giằng ổn định ngang:
- Bắt buộc có giằng mái chữ X (D16-D20) và giằng đứng tường hồi (L50x50x5) để đảm bảo ổn định ngang.
3.4. Sàn tầng 2 (Tấm Cemboard 1.6cm):
- Tấm Cemboard/xi măng sợi dày 1.6cm. Dầm phụ thép hộp 40x80mm cách nhau 30-40cm tim-tim.
3.5. Vách bao che & Cầu thang & Mái.`,

      "IV": `IV. BỐ TRÍ CÔNG NĂNG TẦNG 1
- Không gian thông suốt tối ưu kinh doanh hoặc phòng khách lớn. Bếp và WC dồn về vế phụ để tối ưu chiều rộng nhà ống.
- Cầu thang đặt giữa nhà, có chiếu nghỉ. WC cuối nhà kích thước phủ bì 2.0x2.4m.`,

      "V": `V. BỐ TRÍ CÔNG NĂNG TẦNG 2 TRỞ LÊN
- Bố trí phòng ngủ, phòng làm việc, phòng thờ. Giếng trời cầu thang kết hợp lỗ thông gió mái lấy sáng tự nhiên.`,

      "VI": `VI. HỆ THỐNG KỸ THUẬT ĐIỆN – NƯỚC – AN TOÀN
- Chiếu sáng: đèn tuýp LED/panel ốp nổi, mặt tiền lắp downlight 18W.
- Cấp thoát nước: ống đứng PPR/PVC Φ110, bể phốt 1.2m3/căn. Tiếp địa khung thép làm cọc nối đất.`,

      "IX": `IX. GÓC NHÌN PHONG THỦY (TƯ VẤN BỔ SUNG GIA CHỦ)
- Cầu thang 21 bậc rơi đúng cung Sinh. Cầu thang giữa nhà không đâm thẳng ra cửa chính tránh thoát tài khí.
- Bếp sau cầu thang không đối diện cửa chính & cửa WC.`,

      "X": `X. GHI CHÚ THI CÔNG, GIÁM SÁT VÀ AN TOÀN
- Kiểm tra mối hàn và bu-lông liên kết khung thép. Nghiệm thu khoảng cách dầm phụ 30-40cm trước khi bắn vít tấm Cemboard.`
    },
    structuralFactsSummary: `SỐ LIỆU KẾT CẤU CHUẨN — PA2 (Khung thép tiền chế + sàn Cemboard), áp dụng thống nhất cho toàn bộ hồ sơ, tuyệt đối không tự suy diễn số khác:
- Móng: móng đơn/cốc cục bộ 60x60–80x80cm sâu 60–80cm; giằng móng BTCT 20x30cm; bản mã chân cột liên kết bu-lông neo M16–M20 (tối thiểu 4 bu-lông/chân cột).
- Cột thép: hộp vuông 150x150x2.5mm hoặc thép hình I200/H200; cột góc/mặt tiền kinh doanh dùng H250x250 hoặc hộp 250x250x5mm.
- Dầm chính: thép hình I200–I350 hoặc hộp 100x200–200x350mm, liên kết bu-lông cường độ cao + bản mã gusset plate.
- Sàn tầng: tấm Cemboard/xi măng sợi dày 1.6cm, dầm phụ thép hộp 40x80mm cách nhau 30–40cm tim-tim.
- Vách bao che: panel nhẹ dày 5cm, nẹp nhựa nano 2x2cm.`
  },
  {
    id: 'PA3',
    name: 'Bê Tông Nhẹ EPS Đúc Liền Khối + Gông Định Hình 3D',
    codeName: 'EPS_Gong3D_CongNgheMoi',
    shortDescription: 'Cột 20x20cm (4D14) + vách EPS 15cm đúc liền khối tại chỗ trong 1 mẻ trút, gông 3D khóa cứng, 100% M&E âm tường, chống nóng & cách âm vượt trội.',
    badge: 'Độc quyền Yohu',
    highlights: [
      'Rút ngắn 50% thời gian thi công thô (30-45 ngày)',
      'Trọng lượng nhẹ 1/3 - 1/2 so với gạch, tiết kiệm móng',
      'Tường đúc liền khối không mạch ngừng, không nứt chân chim',
      'Cách âm >45 dB, phòng mát hơn 4-6°C',
      '100% điện nước đi âm sẵn, không đục đẽo'
    ],
    referenceDocContent: {
      "I": `THUYẾT MINH KIẾN TRÚC – KẾT CẤU
BÊ TÔNG NHẸ EPS ĐÚC LIỀN KHỐI + HỆ GÔNG ĐỊNH HÌNH 3D
(Bản kỹ thuật dành cho khách hàng — Công nghệ, kết cấu và quy trình thi công)
I. THÔNG TIN CHUNG & CĂN CỨ THIẾT KẾ
- Loại hình công trình: nhà ở dân dụng (nhà vườn 1 tầng, nhà phố 2–2,5 tầng, biệt thự mái Nhật...), sử dụng công nghệ đúc vách bê tông nhẹ hạt xốp EPS liền khối tại chỗ kết hợp hệ khung cơ khí và Gông định hình 3D độc quyền.
- Ưu điểm chính: rút ngắn khoảng 50% thời gian hoàn thiện phần thô so với xây gạch truyền thống (khoảng 30–45 ngày cho nhà 2 tầng); trọng lượng bản thân kết cấu chỉ bằng 1/3–1/2 nhà gạch truyền thống nên giảm tải xuống móng; khả năng cách âm – cách nhiệt vượt trội; tường liền khối không mạch ngừng giúp giảm nguy cơ nứt chân chim.
- Khuyến nghị kiểm định: Thí nghiệm nén mẫu bê tông nhẹ EPS đạt M7.5–M10, kiểm định chỉ số chịu lửa REI.`,

      "II": `II. GIẢI PHÁP KẾT CẤU
2.1. Cột chịu lực chính và vách EPS liền khối:
- Cột chịu lực: tiết diện 20x20cm, thép chủ 4D14, được đúc đồng thời với vách EPS trong cùng một mẻ trút bê tông — không có mạch ngừng thi công giữa cột và vách. Do vách EPS thành phẩm chỉ dày 15cm (mỏng hơn cột), cột nhô nhẹ khỏi mặt vách khoảng 2,5cm mỗi bên, tạo dạng cột hộp kỹ thuật âm sẵn trong hốc tường; cạnh nhô được bo góc và bả phẳng đồng bộ với mặt hoàn thiện, không lộ góc sắc và không ảnh hưởng diện tích sử dụng phòng.
- Vách EPS: dày 15cm (thành phẩm), lõi là bê tông nhẹ hạt xốp EPS trộn phụ gia hóa dẻo siêu chảy, tự điền đầy khoảng trống mà không cần đầm dùi; thép dọc D10 chạy liên tục kết hợp đai ngang D6/D8 khóa ngàm vào đai cột.
- Vỏ khuôn ngoài: tấm xi măng sợi (Cemboard) dày 8mm gắn trên khung xương thép hộp 2x4cm (dày 1,2–1,4mm), giữ vai trò cốp pha vĩnh cửu kết hợp lớp nền hoàn thiện.
2.2. Hệ gông định hình 3D chống phồng, chống nghiêng vách:
- Thanh gông ngang: thép hộp 40x80mm đặt ngang, khoảng cách 60cm/thanh.
- Bản đệm dạng "dấu cộng" (+) đặt tại giao điểm góc tấm, phân bổ đều lực ép 4 hướng.
- Ty ren xuyên tường + đai ốc siết chặt gông ngoài vào khung xương, khóa cứng chống nghiêng.
- Xương đứng phụ 20x20mm bổ sung tại tâm khẩu độ lớn (1,22m) chia nhỏ khoảng uốn, chống phồng vỏ Cemboard khi trút bê tông.
2.3. Kiểm soát rủi ro thi công: Lưới thép mắt cáo ngăn tạm giữa cột & vách, bơm bê tông xoay vòng cuốn chiếu 80cm-1m/lớp.`,

      "III": `III. NỀN MÓNG THEO LOẠI ĐẤT
- Do trọng lượng kết cấu rất nhẹ so với nhà gạch truyền thống, phần lớn trường hợp không cần ép cọc bê tông cốt thép tải trọng lớn.
- Đất cứng/đất đồi/đất vườn lâu năm: móng băng BTCT truyền thống bản rộng 0,8–1,2m, đổ bê tông móng dày 25cm, tạo rãnh ngàm sâu 5cm trên mặt móng để lắp khung vách.
- Đất mềm/đất ruộng/đất san lấp: móng bè toàn diện, 2 lớp lưới thép D10 ô 20x20cm, đổ bê tông dày 15–20cm liền khối.
- Đất ao sâu/sình lầy: gia cố cọc tre/tràm dưới đáy móng băng/móng bè.`,

      "IV": `IV. SÀN VÀ MÁI
- Sàn các tầng trên: kết hợp hệ khung thép hộp đỡ tấm Cemboard, hoặc sàn bê tông nhẹ tùy yêu cầu tải trọng.
- Mái bằng: bê tông nhẹ EPS dốc 2%, tích hợp màng chống thấm Polyurethane và gạch chống nóng.
- Mái dốc (mái Nhật, mái Thái): khung thép mạ kẽm, lợp ngói nhựa ASA/PVC hoặc tôn theo thiết kế.`,

      "V": `V. CẦU THANG
- Khung sắt hộp 50x100mm và 2x4cm tạo thành khay dạng răng cưa, đổ bê tông đặc bên trong tạo khối cầu thang liền khối, chắc chắn, không phát ra tiếng kêu hay rung lắc.
- Hoàn thiện mặt bậc dán trực tiếp tấm nhựa giả đá (PVC vân đá) hoặc gỗ công nghiệp chống ẩm.`,

      "VI": `VI. HỆ THỐNG KỸ THUẬT ĐIỆN – NƯỚC (M&E ÂM TƯỜNG 100%)
- Toàn bộ ống gen cứng PVC luồn dây điện và ống cấp thoát nước PPR/PVC được định vị, cố định bên trong khung vách Cemboard trước khi đổ bê tông — loại bỏ hoàn toàn công đoạn cắt/đục tường sau khi hoàn thiện.
- Thợ điện nước thi công song hành ngay sau khi dựng xong lưới thép đứng D10.`,

      "IX": `IX. GÓC NHÌN PHONG THỦY (TƯ VẤN BỔ SUNG GIA CHỦ)
- Cầu thang 21 bậc (cung Sinh). Bố trí bếp "Tọa Hung Hướng Cát", cửa chính lệch tâm.
- Vách đúc liền khối, các cạnh cột nhô đều được bo góc bả phẳng, không tạo góc nhọn nội thất, giúp dòng khí luân chuyển êm dịu, gia tăng vượng khí.`,

      "X": `X. GHI CHÚ THI CÔNG, GIÁM SÁT VÀ AN TOÀN
- Luân chuyển hệ gông 3D sau 24 giờ nhờ phụ gia R7 đông kết nhanh.
- Thi công trên cao: Lắp ráp module dưới đất, cẩu lên neo giàn giáo bắn vít an toàn.`
    },
    structuralFactsSummary: `SỐ LIỆU KẾT CẤU CHUẨN — PA3 (Bê tông nhẹ EPS đúc liền khối + Gông 3D, ĐỘC QUYỀN YOHU — kích thước cột/vách là thông số cố định theo công nghệ, KHÔNG thay đổi theo yêu cầu khách hàng; chỉ số lượng/bố trí và diện tích sàn thay đổi theo công trình):
- Móng: chọn theo loại đất — đất cứng/đồi: móng băng BTCT bản rộng 0,8–1,2m, dày 25cm; đất mềm/san lấp: móng bè toàn diện 2 lớp lưới D10 ô 20x20cm, dày 15–20cm; đất ao/sình lầy: gia cố cọc tre/tràm dưới đáy móng.
- Cột chịu lực: tiết diện 20x20cm, thép chủ 4D14, đúc liền khối cùng một mẻ trút với vách (không mạch ngừng).
- Vách EPS: dày 15cm (thành phẩm) — MỎNG HƠN cột 5cm, nên cột nhô 2,5cm mỗi bên khỏi mặt vách (dạng cột hộp kỹ thuật âm trong hốc tường, bo góc bả phẳng khi hoàn thiện). Đây là đặc điểm cấu tạo thật của công nghệ, KHÔNG được mô tả cột là "chìm hoàn toàn trong vách".
- Sàn/mái: khung thép hộp đỡ Cemboard hoặc bê tông nhẹ EPS tùy tải trọng thiết kế.`
  }
];
