/**
 * Bản dịch cho các phần giao diện khách mới (bộ ảnh, 3D, mặt đứng, yêu cầu từng phòng, kết quả, thanh toán QR).
 * Khóa = câu tiếng Việt gốc. Thiếu bản dịch → hiện tiếng Việt.
 * Lưu ý: bản tiếng Lào / Trung do máy soạn — nên nhờ người bản xứ đọc lại trước khi chạy quảng cáo ở thị trường đó.
 */
type L = 'en' | 'zh' | 'lo';
const D: Record<string, Partial<Record<L, string>>> = {
  // ── Yêu cầu từng phòng
  '📐 Yêu cầu từng phòng (không bắt buộc)': { en: '📐 Room-by-room requirements (optional)', zh: '📐 各房间要求（可选）', lo: '📐 ຄວາມຕ້ອງການແຕ່ລະຫ້ອງ (ບໍ່ບັງຄັບ)' },
  'Đã nhập {a}/{b} phòng · phòng chưa nhập: tool tự bố trí theo phong thủy': { en: '{a}/{b} rooms filled · others are placed automatically by feng shui', zh: '已填写 {a}/{b} 间 · 未填写的按风水自动布置', lo: 'ປ້ອນແລ້ວ {a}/{b} ຫ້ອງ · ຫ້ອງທີ່ບໍ່ໄດ້ປ້ອນ ລະບົບຈັດຕາມຮວງຈຸ້ຍ' },
  'Tự động theo phong thủy': { en: 'Auto (feng shui)', zh: '按风水自动', lo: 'ອັດຕະໂນມັດຕາມຮວງຈຸ້ຍ' },
  'Tự lưu khi nhập': { en: 'Saved as you type', zh: '输入即保存', lo: 'ບັນທຶກອັດຕະໂນມັດ' },
  'Tầng': { en: 'Floor', zh: '楼层', lo: 'ຊັ້ນ' },
  'Tầng {f}': { en: 'Floor {f}', zh: '{f} 层', lo: 'ຊັ້ນ {f}' },
  'Dài (m)': { en: 'Length (m)', zh: '长 (米)', lo: 'ຍາວ (ມ)' },
  'Rộng (m)': { en: 'Width (m)', zh: '宽 (米)', lo: 'ກວ້າງ (ມ)' },
  'tự động': { en: 'auto', zh: '自动', lo: 'ອັດຕະໂນມັດ' },
  'Diện tích yêu cầu:': { en: 'Requested area:', zh: '要求面积：', lo: 'ເນື້ອທີ່ຕ້ອງການ:' },
  'Vị trí trong nhà (đứng ngoài đường nhìn vào cửa chính)': { en: 'Position (standing on the street facing the main door)', zh: '位置（站在街上面向正门）', lo: 'ຕຳແໜ່ງ (ຢືນຢູ່ຖະໜົນ ຫັນໜ້າເຂົ້າປະຕູໃຫຍ່)' },
  'Phía trước': { en: 'Front', zh: '前部', lo: 'ດ້ານໜ້າ' }, 'Giữa nhà': { en: 'Middle', zh: '中部', lo: 'ກາງເຮືອນ' }, 'Phía sau': { en: 'Rear', zh: '后部', lo: 'ດ້ານຫຼັງ' },
  'Bên trái': { en: 'Left', zh: '左侧', lo: 'ເບື້ອງຊ້າຍ' }, 'Ở giữa': { en: 'Centre', zh: '居中', lo: 'ຢູ່ກາງ' }, 'Bên phải': { en: 'Right', zh: '右侧', lo: 'ເບື້ອງຂວາ' },
  'Hướng cửa sổ / hướng nhìn': { en: 'Window / view direction', zh: '窗户 / 视线方向', lo: 'ທິດປ່ອງຢ້ຽມ / ທິດເບິ່ງ' },
  'Không yêu cầu': { en: 'No preference', zh: '无要求', lo: 'ບໍ່ກຳນົດ' },
  'Ghi chú': { en: 'Notes', zh: '备注', lo: 'ໝາຍເຫດ' },
  'vd: có WC riêng, tủ âm tường': { en: 'e.g. ensuite WC, built-in wardrobe', zh: '例：独立卫生间、嵌入式衣柜', lo: 'ເຊັ່ນ: ມີຫ້ອງນ້ຳໃນຕົວ, ຕູ້ຝັງຝາ' },
  '↺ Để tool tự động': { en: '↺ Let the tool decide', zh: '↺ 交给系统自动', lo: '↺ ໃຫ້ລະບົບຈັດເອງ' },
  '✓ Xong': { en: '✓ Done', zh: '✓ 完成', lo: '✓ ແລ້ວ' },
  'Thứ tự tool làm theo: ô anh/chị nhập ở đây → mô tả & các ô chung → phòng không nhập do tool tự đặt theo phong thủy → ảnh tham chiếu chỉ để lấy kiểu dáng. Kích thước phòng không khớp tổng diện tích nhà thì bản vẽ ghi rõ để anh/chị chỉnh.': {
    en: 'Priority: what you enter here → description & general fields → rooms you leave blank are placed by feng shui → reference photos only guide the style. If room sizes do not fit the house, the drawing flags it for you to adjust.',
    zh: '优先顺序：此处填写的内容 → 描述与通用字段 → 未填写的房间按风水自动放置 → 参考图片仅用于风格。房间尺寸与总面积不符时，图纸会标注以便您调整。',
    lo: 'ລຳດັບ: ຂໍ້ມູນທີ່ປ້ອນຢູ່ນີ້ → ຄຳອະທິບາຍ ແລະ ຊ່ອງທົ່ວໄປ → ຫ້ອງທີ່ບໍ່ປ້ອນ ລະບົບຈັດຕາມຮວງຈຸ້ຍ → ຮູບອ້າງອີງໃຊ້ສະເພາະຮູບແບບ. ຖ້າຂະໜາດຫ້ອງບໍ່ເຂົ້າກັບເນື້ອທີ່ເຮືອນ ແບບແຜນຈະແຈ້ງໃຫ້ປັບ.' },
  'Phòng khách': { en: 'Living room', zh: '客厅', lo: 'ຫ້ອງຮັບແຂກ' }, 'Bếp + ăn': { en: 'Kitchen + dining', zh: '厨房+餐厅', lo: 'ເຮືອນຄົວ + ຫ້ອງກິນເຂົ້າ' },
  'Phòng thờ': { en: 'Altar room', zh: '祭祀间', lo: 'ຫ້ອງບູຊາ' }, 'Phòng làm việc': { en: 'Study', zh: '书房', lo: 'ຫ້ອງເຮັດວຽກ' },
  'Phòng ngủ {n}': { en: 'Bedroom {n}', zh: '卧室 {n}', lo: 'ຫ້ອງນອນ {n}' }, 'WC {n}': { en: 'WC {n}', zh: '卫生间 {n}', lo: 'ຫ້ອງນ້ຳ {n}' }, 'Gara ô tô': { en: 'Garage', zh: '车库', lo: 'ບ່ອນຈອດລົດ' },
  'Bắc': { en: 'North', zh: '北', lo: 'ເໜືອ' }, 'Đông Bắc': { en: 'North-east', zh: '东北', lo: 'ຕາເວັນອອກສຽງເໜືອ' }, 'Đông': { en: 'East', zh: '东', lo: 'ຕາເວັນອອກ' }, 'Đông Nam': { en: 'South-east', zh: '东南', lo: 'ຕາເວັນອອກສຽງໃຕ້' },
  'Nam': { en: 'South', zh: '南', lo: 'ໃຕ້' }, 'Tây Nam': { en: 'South-west', zh: '西南', lo: 'ຕາເວັນຕົກສຽງໃຕ້' }, 'Tây': { en: 'West', zh: '西', lo: 'ຕາເວັນຕົກ' }, 'Tây Bắc': { en: 'North-west', zh: '西北', lo: 'ຕາເວັນຕົກສຽງເໜືອ' },

  // ── Kết quả của khách
  '🏠 Kết quả thiết kế của {name}': { en: '🏠 Design results for {name}', zh: '🏠 {name} 的设计成果', lo: '🏠 ຜົນການອອກແບບຂອງ {name}' },
  'anh/chị': { en: 'you', zh: '您', lo: 'ທ່ານ' },
  'Gói Thiết kế — tất cả kết quả của anh/chị ở đây': { en: 'Design package — all your results in one place', zh: '设计套餐 — 您的全部成果都在这里', lo: 'ແພັກເກັດອອກແບບ — ຜົນທັງໝົດຂອງທ່ານຢູ່ນີ້' },
  '🧊 Xem 3D nhà của tôi': { en: '🧊 View my house in 3D', zh: '🧊 查看我的房子 3D', lo: '🧊 ເບິ່ງເຮືອນຂອງຂ້ອຍແບບ 3D' },
  '📐 Mặt bằng': { en: '📐 Floor plan', zh: '📐 平面图', lo: '📐 ແຜນຜັງ' },
  '🎬 Xem video': { en: '🎬 Watch video', zh: '🎬 观看视频', lo: '🎬 ເບິ່ງວິດີໂອ' },
  '⬇ Video 3D vừa quay': { en: '⬇ 3D video just recorded', zh: '⬇ 刚录制的 3D 视频', lo: '⬇ ວິດີໂອ 3D ທີ່ຫາກໍ່ອັດ' },
  'Nội thất': { en: 'Interior', zh: '室内', lo: 'ພາຍໃນ' }, 'Ngoại thất': { en: 'Exterior', zh: '室外', lo: 'ພາຍນອກ' },
  'Chưa có ảnh phối cảnh.': { en: 'No renderings yet.', zh: '还没有效果图。', lo: 'ຍັງບໍ່ມີຮູບທັດສະນີຍະພາບ.' },
  'Tạo bộ ảnh phối cảnh từ 3D nhà của anh/chị': { en: 'Create a rendering set from your 3D house', zh: '用您的 3D 房屋生成效果图', lo: 'ສ້າງຊຸດຮູບຈາກ 3D ເຮືອນຂອງທ່ານ' },
  'Muốn có video: mở 🧊 3D → bấm 🎬 Quay video 3D.': { en: 'For a video: open 🧊 3D → tap 🎬 Record 3D video.', zh: '想要视频：打开 🧊 3D → 点 🎬 录制 3D 视频。', lo: 'ຢາກໄດ້ວິດີໂອ: ເປີດ 🧊 3D → ກົດ 🎬 ອັດວິດີໂອ 3D.' },

  // ── 3D
  '3D Hình Khối — dựng từ mặt bằng': { en: '3D Massing — built from the floor plan', zh: '3D 体块 — 由平面图生成', lo: '3D ຮູບຊົງ — ສ້າງຈາກແຜນຜັງ' },
  '✅ Chốt hình khối (5 góc)': { en: '✅ Lock massing (5 views)', zh: '✅ 确定体块（5 个视角）', lo: '✅ ຢືນຢັນຮູບຊົງ (5 ມຸມ)' },
  '🔒 Chốt lại hình khối': { en: '🔒 Re-lock massing', zh: '🔒 重新确定体块', lo: '🔒 ຢືນຢັນຮູບຊົງໃໝ່' },
  '✓ Đã chốt': { en: '✓ Locked', zh: '✓ 已确定', lo: '✓ ຢືນຢັນແລ້ວ' },
  '🎬 Quay video 3D': { en: '🎬 Record 3D video', zh: '🎬 录制 3D 视频', lo: '🎬 ອັດວິດີໂອ 3D' },
  '⏺ Đang quay {n}%…': { en: '⏺ Recording {n}%…', zh: '⏺ 录制中 {n}%…', lo: '⏺ ກຳລັງອັດ {n}%…' },
  '🏠 Toàn nhà': { en: '🏠 Whole house', zh: '🏠 整栋', lo: '🏠 ທັງເຮືອນ' },
  'Xem trong tầng {f}': { en: 'Inside floor {f}', zh: '查看 {f} 层内部', lo: 'ເບິ່ງພາຍໃນຊັ້ນ {f}' },
  'Góc chéo': { en: 'Corner view', zh: '斜角', lo: 'ມຸມສະແຍງ' }, 'Mặt tiền': { en: 'Front', zh: '正立面', lo: 'ດ້ານໜ້າ' }, 'Nhìn từ trên': { en: 'Top view', zh: '俯视', lo: 'ເບິ່ງຈາກເທິງ' },
  '🔄 Tự xoay': { en: '🔄 Auto-rotate', zh: '🔄 自动旋转', lo: '🔄 ໝູນອັດຕະໂນມັດ' }, '⏸ Dừng xoay': { en: '⏸ Stop', zh: '⏸ 停止旋转', lo: '⏸ ຢຸດໝູນ' },
  'Kéo 1 ngón: xoay · chụm 2 ngón: phóng to · kéo 2 ngón: di chuyển': { en: '1 finger: rotate · pinch: zoom · 2 fingers: pan', zh: '单指：旋转 · 双指捏合：缩放 · 双指拖动：平移', lo: '1 ນິ້ວ: ໝູນ · ບີບ 2 ນິ້ວ: ຂະຫຍາຍ · ລາກ 2 ນິ້ວ: ເລື່ອນ' },
  'BẢN XEM THỬ': { en: 'PREVIEW', zh: '预览版', lo: 'ສະບັບທົດລອງ' },
  '⏺ Đang quay video — giữ màn hình mở ({n}%)': { en: '⏺ Recording — keep the screen on ({n}%)', zh: '⏺ 正在录制 — 请保持屏幕常亮 ({n}%)', lo: '⏺ ກຳລັງອັດ — ຢ່າປິດໜ້າຈໍ ({n}%)' },
  '✓ Đã chốt hình khối — 5 góc đã gửi sang "Ảnh phối cảnh"': { en: '✓ Massing locked — 5 views sent to "Renderings"', zh: '✓ 已确定体块 — 5 个视角已发送到"效果图"', lo: '✓ ຢືນຢັນຮູບຊົງແລ້ວ — ສົ່ງ 5 ມຸມໄປ "ຮູບທັດສະນີຍະພາບ"' },
  '⬇ Tải video về máy': { en: '⬇ Download video', zh: '⬇ 下载视频', lo: '⬇ ດາວໂຫຼດວິດີໂອ' },
  'Bản xem thử: xoay xem hình khối nhà của anh/chị. Mở gói Thiết kế để chốt hình khối, tạo ảnh phối cảnh, quay video và tải bản vẽ.': { en: 'Preview: rotate to see your house massing. Unlock the Design package to lock the massing, create renderings, record video and download drawings.', zh: '预览：旋转查看您的房屋体块。开通设计套餐即可确定体块、生成效果图、录制视频并下载图纸。', lo: 'ສະບັບທົດລອງ: ໝູນເບິ່ງຮູບຊົງເຮືອນ. ເປີດແພັກເກັດອອກແບບເພື່ອຢືນຢັນຮູບຊົງ, ສ້າງຮູບ, ອັດວິດີໂອ ແລະ ດາວໂຫຼດແບບ.' },
  'Mô hình khối minh họa tỷ lệ, số tầng, mái, cửa và hướng nhà theo đúng mặt bằng 2D (chữ B = hướng Bắc). Vật liệu, màu sắc, chi tiết mặt tiền sẽ được thể hiện ở bước ảnh phối cảnh.': { en: 'The massing model shows proportions, floors, roof, openings and orientation exactly as the 2D plan (B = North). Materials, colours and façade details appear in the rendering step.', zh: '体块模型按 2D 平面图显示比例、层数、屋顶、门窗和朝向（B = 北）。材料、颜色和立面细节在效果图步骤中呈现。', lo: 'ຮູບຊົງສະແດງອັດຕາສ່ວນ, ຈຳນວນຊັ້ນ, ຫຼັງຄາ, ປະຕູ ແລະ ທິດເຮືອນຕາມແຜນຜັງ 2D (B = ທິດເໜືອ). ວັດສະດຸ ແລະ ສີ ຈະສະແດງໃນຂັ້ນຕອນຮູບທັດສະນີຍະພາບ.' },
  'Góc chéo trái': { en: 'Left corner', zh: '左斜角', lo: 'ມຸມຊ້າຍ' }, 'Góc chéo phải': { en: 'Right corner', zh: '右斜角', lo: 'ມຸມຂວາ' },
  'Phía sau / sân vườn': { en: 'Rear / garden', zh: '后方 / 庭院', lo: 'ດ້ານຫຼັງ / ສວນ' }, 'Toàn cảnh trên cao': { en: 'Aerial view', zh: '鸟瞰', lo: 'ພາບມຸມສູງ' },

  // ── Bộ ảnh phối cảnh
  '🎨 Bộ ảnh phối cảnh theo yêu cầu gia chủ': { en: '🎨 Rendering set to your brief', zh: '🎨 按业主要求的效果图', lo: '🎨 ຊຸດຮູບຕາມຄວາມຕ້ອງການ' },
  'Đã dùng {a}/{b} lượt vẽ AI': { en: 'Used {a}/{b} AI renders', zh: '已用 {a}/{b} 次 AI 绘图', lo: 'ໃຊ້ແລ້ວ {a}/{b} ຄັ້ງ' },
  'Hình khối lấy đúng từ 3D (số tầng, mái, cửa). Gia chủ chọn 1 phong cách, tool vẽ cả bộ ảnh cùng màu, cùng vật liệu từ nhiều góc.': { en: 'Massing comes from your 3D (floors, roof, openings). Pick one style and the tool renders a consistent set — same colours and materials — from several angles.', zh: '体块来自 3D（层数、屋顶、门窗）。选择一种风格，系统从多个角度绘制同色同材质的整套效果图。', lo: 'ຮູບຊົງມາຈາກ 3D. ເລືອກ 1 ຮູບແບບ ລະບົບຈະແຕ້ມທັງຊຸດ ສີ ແລະ ວັດສະດຸດຽວກັນ ຈາກຫຼາຍມຸມ.' },
  'Chốt hình khối 3D': { en: 'Lock the 3D massing', zh: '确定 3D 体块', lo: 'ຢືນຢັນຮູບຊົງ 3D' },
  'Chọn phong cách — AI vẽ 3 phương án cùng 1 góc': { en: 'Choose a style — AI draws 3 options from the same angle', zh: '选择风格 — AI 从同一角度画 3 个方案', lo: 'ເລືອກຮູບແບບ — AI ແຕ້ມ 3 ທາງເລືອກຈາກມຸມດຽວ' },
  'Bộ ảnh hoàn chỉnh theo phong cách đã chốt': { en: 'Full set in the chosen style', zh: '按确定风格的完整效果图', lo: 'ຊຸດຮູບຄົບຕາມຮູບແບບທີ່ເລືອກ' },
  'Mở 3D': { en: 'Open 3D', zh: '打开 3D', lo: 'ເປີດ 3D' },
  '✓ Đã chốt: {s}': { en: '✓ Chosen: {s}', zh: '✓ 已确定：{s}', lo: '✓ ເລືອກແລ້ວ: {s}' },
  'Đổi phong cách (vẽ lại bộ ảnh)': { en: 'Change style (redraw the set)', zh: '更换风格（重画整套）', lo: 'ປ່ຽນຮູບແບບ (ແຕ້ມໃໝ່)' },
  'Yêu cầu thêm: sơn trắng, ốp đá xám, cửa gỗ…': { en: 'Extra wishes: white paint, grey stone, wooden doors…', zh: '其他要求：白色涂料、灰色石材、木门…', lo: 'ຄວາມຕ້ອງການເພີ່ມ: ທາສີຂາວ, ຫີນສີເທົາ, ປະຕູໄມ້…' },
  '🎨 Vẽ {n} phương án phong cách': { en: '🎨 Draw {n} style options', zh: '🎨 绘制 {n} 个风格方案', lo: '🎨 ແຕ້ມ {n} ທາງເລືອກ' },
  '✓ Chốt phong cách này': { en: '✓ Choose this style', zh: '✓ 选定此风格', lo: '✓ ເລືອກຮູບແບບນີ້' },
  '🖼️ Vẽ bộ {n} ảnh còn thiếu': { en: '🖼️ Draw the {n} missing images', zh: '🖼️ 绘制缺少的 {n} 张', lo: '🖼️ ແຕ້ມ {n} ຮູບທີ່ຍັງຂາດ' },
  '↻ Vẽ lại': { en: '↻ Redraw', zh: '↻ 重画', lo: '↻ ແຕ້ມໃໝ່' },
  'Còn {a}/{b} lần vẽ lại cho bộ ảnh này.': { en: '{a}/{b} redraws left for this set.', zh: '本套还可重画 {a}/{b} 次。', lo: 'ເຫຼືອ {a}/{b} ຄັ້ງແຕ້ມໃໝ່.' },
  'Ảnh AI minh họa ý tưởng. Hình khối bám theo 3D; chi tiết vật liệu, kích thước chính xác do kiến trúc sư chốt trong hồ sơ thiết kế.': { en: 'AI images illustrate the idea. Massing follows the 3D; exact materials and dimensions are finalised by the architect.', zh: 'AI 图片为概念示意。体块依据 3D；具体材料和尺寸由建筑师在设计文件中确定。', lo: 'ຮູບ AI ເປັນພາບແນວຄິດ. ວັດສະດຸ ແລະ ຂະໜາດແທ້ ສະຖາປະນິກຈະກຳນົດ.' },
  'Nội thất {r}': { en: 'Interior {r}', zh: '室内 {r}', lo: 'ພາຍໃນ {r}' },
  'Bám theo {n} ảnh tham chiếu của gia chủ': { en: 'Follow your {n} reference photos', zh: '参照业主的 {n} 张参考图', lo: 'ອີງຕາມ {n} ຮູບອ້າງອີງ' },

  // ── Mặt đứng
  'Mặt đứng & Mặt cắt — dựng từ 3D': { en: 'Elevations & section — from 3D', zh: '立面与剖面 — 由 3D 生成', lo: 'ດ້ານຕັ້ງ ແລະ ພາກຕັດ — ຈາກ 3D' },
  'Mặt đứng chính': { en: 'Front elevation', zh: '正立面', lo: 'ດ້ານຕັ້ງໜ້າ' }, 'Mặt đứng sau': { en: 'Rear elevation', zh: '背立面', lo: 'ດ້ານຕັ້ງຫຼັງ' },
  'Mặt đứng bên trái': { en: 'Left elevation', zh: '左立面', lo: 'ດ້ານຕັ້ງຊ້າຍ' }, 'Mặt đứng bên phải': { en: 'Right elevation', zh: '右立面', lo: 'ດ້ານຕັ້ງຂວາ' }, 'Mặt cắt A-A': { en: 'Section A-A', zh: '剖面 A-A', lo: 'ພາກຕັດ A-A' },
  'Mặt đứng dựng tự động từ mặt bằng và 3D (cùng số tầng, cốt cao độ, mái, cửa). Là bản vẽ sơ bộ — chi tiết trang trí mặt tiền, vật liệu và kết cấu do KTS/kỹ sư Yohu hoàn thiện trước khi thi công.': { en: 'Elevations are generated from the plan and 3D (same floors, levels, roof, openings). Preliminary drawings — façade details, materials and structure are completed by Yohu architects/engineers before construction.', zh: '立面由平面图和 3D 自动生成（层数、标高、屋顶、门窗一致）。为初步图纸 — 立面装饰、材料和结构由 Yohu 建筑师/工程师在施工前完善。', lo: 'ດ້ານຕັ້ງສ້າງອັດຕະໂນມັດຈາກແຜນຜັງ ແລະ 3D. ເປັນແບບເບື້ອງຕົ້ນ — ລາຍລະອຽດ ແລະ ໂຄງສ້າງ ສະຖາປະນິກ/ວິສະວະກອນ Yohu ຈະສຳເລັດກ່ອນກໍ່ສ້າງ.' },
  'Tải PDF (5 bản vẽ)': { en: 'PDF (5 sheets)', zh: '下载 PDF（5 张）', lo: 'PDF (5 ແຜ່ນ)' }, 'Tải DXF bản đang xem': { en: 'DXF (current sheet)', zh: '下载当前 DXF', lo: 'DXF (ແຜ່ນນີ້)' },

  // ── Thanh toán QR
  'Quét bằng app ngân hàng: đã điền sẵn {m}đ và nội dung {c}': { en: 'Scan with your banking app: amount {m} VND and note {c} are pre-filled', zh: '用银行 App 扫码：已预填金额 {m} 越南盾和备注 {c}', lo: 'ສະແກນດ້ວຍແອັບທະນາຄານ: ໃສ່ຈຳນວນ {m} ດົ່ງ ແລະ ເນື້ອໃນ {c} ໄວ້ແລ້ວ' },
  'Tôi đã chuyển khoản': { en: 'I have transferred', zh: '我已转账', lo: 'ຂ້ອຍໂອນແລ້ວ' },
  '✓ Đã báo Yohu — đang chờ xác nhận': { en: '✓ Yohu notified — awaiting confirmation', zh: '✓ 已通知 Yohu — 等待确认', lo: '✓ ແຈ້ງ Yohu ແລ້ວ — ລໍຖ້າຢືນຢັນ' },
  'Kiểm tra gói': { en: 'Check package', zh: '查看套餐', lo: 'ກວດແພັກເກັດ' }
};

export function tx(lang: string | undefined, vi: string, vars?: Record<string, string | number>): string {
  const l = (lang || 'vi') as L;
  let s = l === ('vi' as any) ? vi : (D[vi]?.[l] || vi);
  if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.split(`{${k}}`).join(String(v)); });
  return s;
}

/** Tên phòng từ roomSpecs ("Phòng ngủ 2", "WC 1"...) */
export function txRoom(lang: string | undefined, label: string): string {
  const m = label.match(/^(Phòng ngủ|WC) (\d+)$/);
  if (m) return tx(lang, `${m[1]} {n}`, { n: m[2] });
  return tx(lang, label);
}
