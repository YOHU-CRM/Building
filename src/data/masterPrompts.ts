/**
 * Master Prompt Templates for Comprehensive Construction & Feng Shui Consultation
 * Strictly unmixed multi-language support: vi (Vietnamese), en (English), lo (Lao), zh (Chinese)
 */

export interface MasterPromptConfig {
  id: string;
  badge: string;
  title: string;
  description: string;
  btnInsert: string;
  btnAutoFill: string;
  btnCopy: string;
  btnCopied: string;
  btnPreview: string;
  btnCollapse: string;
  attachImageLabel: string;
  removeImageLabel: string;
  hint: string;
  template: string;
}

export const masterPromptData: Record<'vi' | 'en' | 'lo' | 'zh', MasterPromptConfig> = {
  vi: {
    id: "master_prompt_vi",
    badge: "⭐ CÂU LỆNH MẪU CHUYÊN NGHIỆP (MASTER PROMPT)",
    title: "Khung Câu Hỏi Tổng Thể Điền Vào Chỗ Trống",
    description: "Câu lệnh mẫu toàn diện gồm 7 phần thông tin cốt lõi. Bạn chỉ việc điền thông tin vào các dấu ngoặc vuông [...] hoặc bấm 'Điền tự động từ dự án' để AI hiểu sâu sắc 100% công trình và phân tích trọn vẹn, kể cả khi có ảnh tham chiếu!",
    btnInsert: "✍️ Điền mẫu vào ô chat",
    btnAutoFill: "⚡ Tự động điền dữ liệu hiện có",
    btnCopy: "📋 Sao chép câu lệnh",
    btnCopied: "✓ Đã sao chép!",
    btnPreview: "👁️ Xem toàn văn mẫu",
    btnCollapse: "Thu gọn",
    attachImageLabel: "📷 Đính kèm ảnh tham chiếu (Phối cảnh/Bản vẽ tay)",
    removeImageLabel: "Gỡ ảnh",
    hint: "💡 Mẹo: Bạn có thể đính kèm ảnh phối cảnh mặt tiền hoặc bản vẽ tay phác thảo đất để AI phân tích đối chiếu chuyên sâu!",
    template: `Chào Chuyên gia AI Yohu, tôi đang chuẩn bị xây dựng nhà và cần bạn phân tích tổng thể toàn bộ công trình một cách chi tiết, chính xác và chuyên sâu nhất:

1. THÔNG TIN CHỦ NHÀ & PHONG THỦY:
- Họ và tên gia chủ: [Nguyễn Văn A]
- Năm sinh (dương lịch & âm lịch): [1985 - Ất Sửu]
- Giới tính: [Nam]
- Hướng đất / hướng mặt tiền dự kiến: [Hướng Nam / Đông Nam ...]

2. THÔNG SỐ KHU ĐẤT & QUY MÔ CÔNG TRÌNH:
- Kích thước khu đất: Mặt tiền [5.5]m x Chiều sâu [18]m
- Số tầng dự kiến: [3 tầng + 1 tum sân thượng]
- Diện tích sàn tầng 1: [85] m²; Tổng diện tích sàn xây dựng (GFA): [260] m²
- Phong cách kiến trúc: [Hiện đại tối giản / Mái Nhật / Tân cổ điển / Biệt thự vườn]

3. CÔNG NĂNG SỬ DỤNG MONG MUỐN TỪNG TẦNG:
- Tầng 1 (Trệt): [Gara ô tô, 1 Phòng khách rộng, 1 Bếp + Bàn ăn, 1 WC chung, sân sau giếng trời]
- Tầng 2: [1 Phòng ngủ Master có WC khép kín, 2 Phòng ngủ con, 1 WC chung, ban công]
- Tầng 3 (và tum): [1 Phòng thờ trang nghiêm hướng mặt tiền, 1 Phòng giặt & sân phơi, sân thượng trồng cây]

4. ĐỊA CHẤT NỀN ĐẤT & GIẢI PHÁP KẾT CẤU:
- Hiện trạng địa chất: [Đất thổ cư cứng chắc / Đất ruộng nền yếu / Gần ao hồ kênh rạch]
- Giải pháp móng dự kiến: [Móng băng / Móng cọc BTCT 250x250 / Móng bè / Móng đơn]
- Kết cấu khung dầm sàn: [Bê tông cốt thép toàn khối, cấp độ bền B20/B25, xi măng PCB40]

5. NGÂN SÁCH ĐẦU TƯ & TIÊU CHUẨN VẬT TƯ:
- Tổng mức ngân sách dự kiến: [Khoảng 1.5 đến 1.8 tỷ VNĐ]
- Tiêu chuẩn vật tư hoàn thiện: [Khá - Tiêu chuẩn cao (Cửa nhôm Xingfa, thiết bị vệ sinh Inax/Toto, sơn Jotun, gạch Granite)]
- Hình thức hợp đồng: [Thi công trọn gói Chìa khóa trao tay / Thi công phần thô + nhân công hoàn thiện]

6. ẢNH THAM CHIẾU & BẢN VẼ ĐÍNH KÈM (NẾU CÓ):
- Mô tả ảnh tham chiếu: [Tôi có đính kèm ảnh phối cảnh mặt tiền 3 tầng hiện đại / ảnh chụp phác thảo sơ đồ đất tay]
- Yêu cầu kết hợp với ảnh: [Hãy phân tích đối chiếu đường nét, màu sắc và hình khối của ảnh tham chiếu để đề xuất phương án tương thích tối đa với khu đất thực tế]

7. ĐẦU RA YÊU CẦU CHUYÊN GIA AI TRẢ LỜI CHI TIẾT:
- 1) Phân tích phong thủy Bát Trạch: Cung mệnh gia chủ, hướng cát đón tài lộc, bố trí bếp tọa hung hướng cát, hướng bàn thờ và giường ngủ.
- 2) Đề xuất phương án bố trí mặt bằng công năng tối ưu lưu thông không khí và ánh sáng tự nhiên.
- 3) Phương án kết cấu móng & quy cách cốt thép an toàn, tối ưu chi phí, chống lún nứt.
- 4) Bảng bóc tách khối lượng vật tư chủ yếu (thép, xi măng, cát, đá, gạch) và dự toán chi phí chi tiết theo thời giá năm 2026.
- 5) Kế hoạch tiến độ thi công 5 giai đoạn và các mốc nghiệm thu kỹ thuật gia chủ cần trực tiếp giám sát.`
  },

  en: {
    id: "master_prompt_en",
    badge: "⭐ MASTER PROMPT TEMPLATE",
    title: "Comprehensive Construction & Feng Shui Prompt (Fill in the Blanks)",
    description: "A comprehensive prompt covering 7 core engineering dimensions. Simply fill in the bracketed [...] blanks or click 'Auto-fill from project' so the AI deeply understands 100% of your project details, even with attached reference photos!",
    btnInsert: "✍️ Insert into Chat",
    btnAutoFill: "⚡ Auto-fill with Project Data",
    btnCopy: "📋 Copy Prompt",
    btnCopied: "✓ Copied!",
    btnPreview: "👁️ Preview Full Template",
    btnCollapse: "Collapse",
    attachImageLabel: "📷 Attach Reference Photo (Render / Sketch)",
    removeImageLabel: "Remove image",
    hint: "💡 Pro tip: You can attach a facade perspective image or hand-drawn plot sketch for deep visual and structural cross-referencing!",
    template: `Hello Yohu AI Specialist, I am planning a construction project and require a comprehensive, professional, and detailed end-to-end analysis:

1. OWNER & FENG SHUI INFORMATION:
- Owner Name: [John Doe]
- Year of Birth (Solar & Lunar): [1985 - Wood Ox]
- Gender: [Male]
- Lot / Facade Orientation: [South / Southeast ...]

2. LOT SPECIFICATIONS & BUILDING SCALE:
- Lot Dimensions: Frontage [5.5]m x Depth [18]m
- Number of Stories: [3 Floors + 1 Rooftop Terrace]
- Ground Floor Footprint: [85] m²; Total Gross Floor Area (GFA): [260] m²
- Architectural Style: [Modern Minimalist / Japanese Roof / Neoclassical / Garden Villa]

3. DESIRED ROOM & FUNCTIONAL LAYOUT PER FLOOR:
- Floor 1 (Ground): [Car garage, 1 Spacious living room, 1 Kitchen & dining area, 1 Powder room, backyard light well]
- Floor 2: [1 Master bedroom with en-suite bath, 2 Children bedrooms, 1 Shared bathroom, balcony]
- Floor 3 (or Penthouse): [1 Sacred altar room facing front, 1 Laundry area & drying yard, green sky terrace]

4. SOIL CONDITIONS & STRUCTURAL FOUNDATION:
- Soil Condition: [Solid native clay / Soft wetland / Adjacent to riverbank]
- Proposed Foundation: [Continuous strip footing / RC driven piles 250x250 / Raft mat / Pad footing]
- Superstructure Framework: [Monolithic reinforced concrete beam-slab frame, PCB40 cement]

5. INVESTMENT BUDGET & MATERIAL STANDARDS:
- Target Budget: [Approx. $75,000 - $90,000 / 1.6 to 2.0 Billion VND]
- Finishing Material Tier: [Standard Plus to Premium (Xingfa aluminum windows, Inax/Toto fixtures, premium paint, granite tiles)]
- Delivery Method: [Turnkey Lump-sum Package / Rough Structural Build + Finishing Labor]

6. REFERENCE PHOTOS & ATTACHED SKETCHES (IF ANY):
- Photo Details: [Attached 3D facade perspective image / hand-drawn plot layout sketch]
- Image Alignment: [Evaluate the architectural geometry, lighting, and finishes from the reference photo and align them harmoniously with physical site constraints]

7. EXPECTED SPECIALIST AI OUTPUTS:
- 1) Eight Mansions (Ba Zhai) Feng Shui assessment: Auspicious orientation, optimal kitchen placement, altar position, and master bed orientation.
- 2) Optimal architectural space planning with natural ventilation and daylighting strategies.
- 3) Structural foundation assessment, concrete/steel specs, and waterproofing guidelines.
- 4) Comprehensive Bill of Quantities (BOQ) with estimated material quantities (steel, cement, bricks, sand) and cost projection for 2026.
- 5) 5-stage construction milestone schedule and essential owner inspection checklists.`
  },

  lo: {
    id: "master_prompt_lo",
    badge: "⭐ ແບບຟອມຄຳສັ່ງຫຼັກ (MASTER PROMPT)",
    title: "ແບບຟອມຄຳຖາມຫຼັກແບບຄົບຊຸດ (ປ້ອນຂໍ້ມູນໃສ່ບ່ອນວ່າງ)",
    description: "ແບບຟອມຄຳສັ່ງທີ່ຄົບຖ້ວນເຊິ່ງກວມເອົາ 7 ພາກສ່ວນຫຼັກ. ທ່ານພຽງແຕ່ປ້ອນຂໍ້ມູນໃສ່ວົງເລັບ [...] ຫຼື ກົດ 'ປ້ອນຂໍ້ມູນອັດຕະໂນມັດຈາກໂຄງການ' ເພື່ອໃຫ້ AI ເຂົ້າໃຈລາຍລະອຽດໂຄງການ 100%, ເຖິງແມ່ນວ່າມີຮູບພາບອ້າງອີງ!",
    btnInsert: "✍️ ປ້ອນໃສ່ຊ່ອງສົນທະນາ",
    btnAutoFill: "⚡ ປ້ອນຂໍ້ມູນໂຄງການປະຈຸບັນອັດຕະໂນມັດ",
    btnCopy: "📋 ສຳເນົາຄຳສັ່ງ",
    btnCopied: "✓ ສຳເນົາແລ້ວ!",
    btnPreview: "👁️ ເບິ່ງເນື້ອໃນເຕັມ",
    btnCollapse: "ຫຍໍ້ເຂົ້າ",
    attachImageLabel: "📷 ແນບຮູບອ້າງອີງ (ຮູບທັດສະນີຍະພາບ / ແຜນວາດແຕ້ມມື)",
    removeImageLabel: "ລຶບຮູບ",
    hint: "💡 ຄຳແນະນຳ: ທ່ານສາມາດແນບຮູບໜ້າບ້ານ 3D ຫຼື ແຜນວາດທີ່ດິນ ເພື່ອໃຫ້ AI ວິເຄາະສົມທຽບຢ່າງເລິກເຊິ່ງ!",
    template: `ສະບາຍດີ ຜູ້ຊ່ຽວຊານ Yohu AI, ຂ້າພະເຈົ້າກຳລັງກະກຽມສ້າງເຮືອນ ແລະ ຕ້ອງການໃຫ້ທ່ານວິເຄາະໂຄງການທັງໝົດຢ່າງລະອຽດ, ຊັດເຈນ ແລະ ເປັນມືອາຊີບທີ່ສຸດ:

1. ຂໍ້ມູນເຈົ້າຂອງເຮືອນ & ຮວງຈຸ້ຍ:
- ຊື່ ແລະ ນາມສະກຸນ: [ທ້າວ ສົມສັກ]
- ປີເກີດ (ສາກົນ & ຈັນທະຄະຕິ): [1985 - ປີສະລູ]
- ເພດ: [ຊາຍ]
- ທິດທາງທີ່ດິນ / ທິດໜ້າບ້ານ: [ທິດໃຕ້ / ທິດຕາເວັນອອກສ່ຽງໃຕ້ ...]

2. ຂະໜາດທີ່ດິນ & ຂະໜາດສິ່ງປຸກສ້າງ:
- ຂະໜາດທີ່ດິນ: ໜ້າກວ້າງ [5.5] ແມັດ x ຄວາມເລິກ [18] ແມັດ
- ຈຳນວນຊັ້ນທີ່ຕ້ອງການ: [3 ຊັ້ນ + ດາດຟ້າ]
- ເນື້ອທີ່ຊັ້ນ 1: [85] ຕາແມັດ; ເນື້ອທີ່ກໍ່ສ້າງລວມ (GFA): [260] ຕາແມັດ
- ຮູບແບບສະຖາປັດຕະຍະກຳ: [ທັນສະໄໝແບບລຽບງ່າຍ / ຫຼັງຄາຍີ່ປຸ່ນ / ຄລາສສິກໃໝ່ / ວິນລ່າສວນ]

3. ການຈັດວາງຫ້ອງ ແລະ ປະໂຫຍດໃຊ້ສອຍແຕ່ລະຊັ້ນ:
- ຊັ້ນ 1 (ຊັ້ນລຸ່ມ): [ບ່ອນຈອດລົດ, 1 ຫ້ອງຮັບແຂກກວ້າງ, 1 ຫ້ອງຄົວ ແລະ ໂຕະກິນເຂົ້າ, 1 ຫ້ອງນ້ຳລວມ, ເດີ່ນຫຼັງບ້ານ]
- ຊັ້ນ 2: [1 ຫ້ອງນອນໃຫຍ່ພ້ອມຫ້ອງນ້ຳໃນຕົວ, 2 ຫ້ອງນອນລູກ, 1 ຫ້ອງນ້ຳລວມ, ລະບຽງ]
- ຊັ້ນ 3 (ແລະ ດາດຟ້າ): [1 ຫ້ອງພຣະຫັນໜ້າໄປທາງໜ້າບ້ານ, 1 ຫ້ອງຊັກຜ້າ ແລະ ເດີ່ນຕາກ, ດາດຟ້າປູກຕົ້ນໄມ້]

4. ສະພາບດິນ & ວິທີການໂຄງສ້າງຮາກຖານ:
- ສະພາບດິນ: [ດິນແຂງ / ດິນອ່ອນໃກ້ທົ່ງນາ / ໃກ້ແຄມນ້ຳ]
- ປະເພດຮາກຖານທີ່ວາງແຜນ: [ຮາກຖານແຜ / ຮາກຖານເສົາເຂັມຄອນກີດ 250x250 / ຮາກຖານແຜ່ນໃຫຍ່ / ຮາກຖານດ່ຽວ]
- ໂຄງສ້າງເສົາຄານ: [ຄອນກີດເສີມເຫຼັກຫຼໍ່ກັບທີ່, ຊີມັງມາດຕະຖານ PCB40]

5. ງົບປະມານ & ມາດຕະຖານວັດສະດຸ:
- ງົບປະມານຄາດຄະເນ: [ປະມານ 1.5 ຫາ 1.8 ຕື້ ກີບ / ຫຼື ຕາມທີ່ກຳນົດ]
- ລະດັບວັດສະດຸຕົບແຕ່ງ: [ປານກາງຫາສູງ (ປະຕູອາລູມິນຽມ Xingfa, ສຸຂະພັນຄຸນນະພາບສູງ, ສີທາເຮືອນເກຣດ A)]
- ຮູບແບບການຈ້າງ: [ຮັບເໝົາຄົບວົງຈອນມອບກຸນແຈ / ຮັບເໝົາໂຄງສ້າງ + ແຮງງານຕົບແຕ່ງ]

6. ຮູບພາບອ້າງອີງ & ແຜນວາດແນບ (ຖ້າມີ):
- ລາຍລະອຽດຮູບອ້າງອີງ: [ມີຮູບທັດສະນີຍະພາບໜ້າບ້ານ 3D / ຮູບແຕ້ມແຜນຜັງທີ່ດິນດ້ວຍມື]
- ຄວາມຕ້ອງການສົມທຽບກັບຮູບ: [ກະລຸນາວິເຄາະຕາມຮູບແບບແລະເສັ້ນສາຍຂອງຮູບອ້າງອີງ ເພື່ອສະເໜີທາງເລືອກທີ່ເໝາະສົມກັບທີ່ດິນຕົວຈິງ]

7. ຜົນໄດ້ຮັບທີ່ຕ້ອງການຈາກ AI ຊ່ຽວຊານ:
- 1) ວິເຄາະຮວງຈຸ້ຍແປດທິດ: ທິດມຸງຄຸນ, ຕຳແໜ່ງເຕົາໄຟ, ທິດຫ້ອງພຣະ ແລະ ຕຽງນອນ.
- 2) ສະເໜີແຜນຜັງການຈັດສັນພື້ນທີ່ໃຫ້ໂປ່ງສະບາຍ ແລະ ຮັບແສງທຳມະຊາດໄດ້ດີ.
- 3) ວິທີແກ້ໄຂໂຄງສ້າງຮາກຖານທີ່ປອດໄພ, ປະຢັດ ແລະ ປ້ອງກັນການຊຶມນ້ຳ.
- 4) ຕາຕະລາງຖອດປະລິມານວັດສະດຸຕົ້ນຕໍ (ເຫຼັກ, ຊີມັງ, ດິນບລັອກ, ຫີນ, ຊາຍ) ແລະ ປະເມີນລາຄາລະອຽດ.
- 5) ແຜນກຳນົດເວລາການກໍ່ສ້າງ 5 ໄລຍະ ແລະ ຈຸດສຳຄັນທີ່ເຈົ້າຂອງເຮືອນຕ້ອງຕິດຕາມກວດກາ.`
  },

  zh: {
    id: "master_prompt_zh",
    badge: "⭐ 专家级提示词模板 (MASTER PROMPT)",
    title: "全维度工程与风水综合咨询提示词（填空即用）",
    description: "涵盖工程、风水、结构与造价7大核心维度的全景提示词。您只需修改括号 [...] 中的具体信息，或点击'自动填入项目数据'，AI 即可100%深度解析项目全貌并输出极度详尽的成果，包含参考图片比对！",
    btnInsert: "✍️ 填入对话框",
    btnAutoFill: "⚡ 自动填入当前项目数据",
    btnCopy: "📋 复制完整提示词",
    btnCopied: "✓ 已复制！",
    btnPreview: "👁️ 预览完整模板",
    btnCollapse: "收起",
    attachImageLabel: "📷 附加参考图片（效果图 / 手绘草图）",
    removeImageLabel: "移除图片",
    hint: "💡 专业建议：您可直接上传建筑外观效果图或手绘地块草图，AI 将结合图像深度比对落地！",
    template: `您好，有湖 AI 首席建筑工程师与周易风水顾问：我正在筹划建房工程，需要您针对该项目进行一次最完整、高精度且专业落地的全维度综合分析：

1. 业主背景与风水堪舆信息：
- 业主姓名：[张三]
- 出生年份（公历与农历）：[1985年 - 乙丑牛年]
- 性别：[男]
- 宅基地坐向 / 拟建大门朝向：[坐北朝南 / 坐西北朝东南 ...]

2. 地块指标与建筑规制体量：
- 土地尺寸：面宽 [5.5] 米 x 进深 [18] 米
- 规划建造层数：[3层 + 1层屋顶露台/阁楼]
- 首层占地面积：[85] 平方米；总建筑面积 (GFA)：[260] 平方米
- 建筑外观风格：[现代极简 / 新中式 / 日式和风坡顶 / 院落别墅]

3. 各层精细化功能空间布局诉求：
- 首层（一层）：[入户车库、挑空大客厅、开放式餐厨空间、公用卫生间、后院采光绿植天井]
- 二层：[1间带独立卫浴及衣帽间的主卧、2间次卧/儿童房、1间公卫、生活景观阳台]
- 三层（及阁楼）：[朝南端庄独立宗祠神位、洗衣晾晒生活区、空中露台绿化休闲区]

4. 地质水文与结构基础选型：
- 施工地地质现状：[原生硬质实土 / 软弱回填土 / 临近水系池塘流沙地质]
- 拟定基础形式：[条形基础 / 250x250预制钢筋混凝土桩基础 / 筏板满堂红基础 / 独立柱基]
- 主体承重结构：[全现浇梁板柱框架结构，混凝土等级C25/C30，高标号水泥PCB40]

5. 建设投资预算与物料选材档次：
- 预期总投资控制线：[约 50万 至 60万元 人民币 / 16亿至20亿越南盾]
- 装饰装修材料标准：[中高档品质（断桥铝系统门窗、品牌卫浴陶瓷、高耐候外墙漆、通体大理石瓷砖）]
- 发包承揽模式：[包工包料交钥匙全包整装 / 主体包工包料+精装自选分包]

6. 参考效果图与手绘草图对照（如有）：
- 图片描述：[随附现代风格3层外立面效果图 / 手绘地块及红线轮廓草图]
- 结合要求：[请深度提取参考图的体块比例、窗墙比和材质美学，并根据实际地形尺寸进行合规性落地优化]

7. 期望 AI 专家输出的详细成果清单：
- 1) 八宅真传风水堪舆研判：推算本命卦象，排布生气、天医、延年、伏位四大吉方，严格执行灶台坐凶向吉、神位朝向与主卧安床吉位。
- 2) 户型平面功能动线优化方案（兼顾自然采光井、对流穿堂风与私密性）。
- 3) 基础与主体结构受力安全分析、配筋技术建议及全方位防渗抗裂工艺标准。
- 4) 核心工程量物料清单（钢筋、水泥、红砖、黄沙、碎石）定额消耗测算与2026年明细造价总表。
- 5) 科学严谨的5大施工工期节点甘特排期，以及业主务必亲自旁站核验的隐蔽工程验收要点。`
  }
};

/**
 * Builds a customized Master Prompt with user & project data automatically filled in where available
 */
export function buildPopulatedMasterPrompt(
  lang: 'vi' | 'en' | 'lo' | 'zh',
  userInfo?: any,
  constructionInfo?: any
): string {
  const base = masterPromptData[lang] || masterPromptData.vi;
  let text = base.template;

  const name = userInfo?.name?.trim();
  const birth = userInfo?.birthDate?.trim();
  const gender = userInfo?.gender === 'female' ? (lang === 'vi' ? 'Nữ' : lang === 'zh' ? '女' : lang === 'lo' ? 'ຍິງ' : 'Female') : (lang === 'vi' ? 'Nam' : lang === 'zh' ? '男' : lang === 'lo' ? 'ຊາຍ' : 'Male');
  const width = constructionInfo?.width;
  const length = constructionInfo?.length;
  const floors = constructionInfo?.floors;
  const budget = constructionInfo?.totalBudget;
  const style = constructionInfo?.architecturalStyle || constructionInfo?.constructionType;

  if (lang === 'vi') {
    if (name) text = text.replace("[Nguyễn Văn A]", name);
    if (birth) text = text.replace("[1985 - Ất Sửu]", birth);
    if (gender) text = text.replace("[Nam]", gender);
    if (width) text = text.replace("[5.5]", String(width));
    if (length) text = text.replace("[18]", String(length));
    if (floors) text = text.replace("[3 tầng + 1 tum sân thượng]", `${floors} tầng`);
    if (budget) text = text.replace("[Khoảng 1.5 đến 1.8 tỷ VNĐ]", String(budget));
    if (style) text = text.replace("[Hiện đại tối giản / Mái Nhật / Tân cổ điển / Biệt thự vườn]", String(style));
  } else if (lang === 'en') {
    if (name) text = text.replace("[John Doe]", name);
    if (birth) text = text.replace("[1985 - Wood Ox]", birth);
    if (gender) text = text.replace("[Male]", gender);
    if (width) text = text.replace("[5.5]", String(width));
    if (length) text = text.replace("[18]", String(length));
    if (floors) text = text.replace("[3 Floors + 1 Rooftop Terrace]", `${floors} Stories`);
    if (budget) text = text.replace("[Approx. $75,000 - $90,000 / 1.6 to 2.0 Billion VND]", String(budget));
    if (style) text = text.replace("[Modern Minimalist / Japanese Roof / Neoclassical / Garden Villa]", String(style));
  } else if (lang === 'lo') {
    if (name) text = text.replace("[ທ້າວ ສົມສັກ]", name);
    if (birth) text = text.replace("[1985 - ປີສະລູ]", birth);
    if (gender) text = text.replace("[ຊາຍ]", gender);
    if (width) text = text.replace("[5.5]", String(width));
    if (length) text = text.replace("[18]", String(length));
    if (floors) text = text.replace("[3 ຊັ້ນ + ດາດຟ້າ]", `${floors} ຊັ້ນ`);
    if (budget) text = text.replace("[ປະມານ 1.5 ຫາ 1.8 ຕື້ ກີບ / ຫຼື ຕາມທີ່ກຳນົດ]", String(budget));
    if (style) text = text.replace("[ທັນສະໄໝແບບລຽບງ່າຍ / ຫຼັງຄາຍີ່ປຸ່ນ / ຄລາສສິກໃໝ່ / ວິນລ່າສວນ]", String(style));
  } else if (lang === 'zh') {
    if (name) text = text.replace("[张三]", name);
    if (birth) text = text.replace("[1985年 - 乙丑牛年]", birth);
    if (gender) text = text.replace("[男]", gender);
    if (width) text = text.replace("[5.5]", String(width));
    if (length) text = text.replace("[18]", String(length));
    if (floors) text = text.replace("[3层 + 1层屋顶露台/阁楼]", `${floors} 层`);
    if (budget) text = text.replace("[约 50万 至 60万元 人民币 / 16亿至20亿越南盾]", String(budget));
    if (style) text = text.replace("[现代极简 / 新中式 / 日式和风坡顶 / 院落别墅]", String(style));
  }

  return text;
}
