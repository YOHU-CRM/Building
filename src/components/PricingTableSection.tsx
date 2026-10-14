import React, { useState } from 'react';
import { Check, ShieldCheck, Zap, Crown, ChevronDown, ChevronUp, Eye, X, Video } from 'lucide-react';
import { formatCurrency } from '../lib/currency';

interface PricingTableSectionProps {
  theme: 'light' | 'dark';
  lang: 'vi' | 'en' | 'lo' | 'zh';
  currentPackage: 'free' | 'standard' | 'design';
  onSelectPackage: (pkg: 'free' | 'standard' | 'design') => void;
}

export default function PricingTableSection({
  theme,
  lang,
  currentPackage,
  onSelectPackage
}: PricingTableSectionProps) {
  const isDark = theme === 'dark';
  const [detailModalPkg, setDetailModalPkg] = useState<any | null>(null);

  const t = {
    vi: {
      title: "Bảng Giá Gói Dịch Vụ Tư Vấn",
      subtitle: "Nhấp vào từng gói để xem chi tiết hạng mục hoặc chọn nhanh gói phù hợp",
      selectBtn: "Chọn Gói",
      selectedBtn: "Đang Dùng",
      viewDetail: "Xem chi tiết",
      close: "Đóng",
      featuresTitle: "Chi tiết các hạng mục trong gói:"
    },
    en: {
      title: "Service Package Pricing",
      subtitle: "Click on each package to view details or select your preferred tier",
      selectBtn: "Select",
      selectedBtn: "Active",
      viewDetail: "View Details",
      close: "Close",
      featuresTitle: "Included Features & Items:"
    },
    lo: {
      title: "ຕາຕະລາງລາຄາແພັກເກັດການບໍລິການ",
      subtitle: "ຄລິກໃສ່ແຕ່ລະແພັກເກັດເພື່ອເບິ່ງລາຍລະອຽດ",
      selectBtn: "ເລືອກ",
      selectedBtn: "ກຳລັງໃຊ້",
      viewDetail: "ເບິ່ງລາຍລະອຽດ",
      close: "ປິດ",
      featuresTitle: "ລາຍລະອຽດລາຍການ:"
    },
    zh: {
      title: "咨询服务套餐价格表",
      subtitle: "点击各套餐查看详细项目或直接选择",
      selectBtn: "选择套餐",
      selectedBtn: "当前使用",
      viewDetail: "查看详情",
      close: "关闭",
      featuresTitle: "包含项目与权限详情："
    }
  }[lang] || {};

  const packagesData = [
    {
      id: 'free',
      name: { vi: "Báo Cáo Cơ Bản", en: "Basic Report", lo: "ບົດລາຍງານພື້ນຖານ", zh: "基础报告版" }[lang] || "Basic Report",
      price: formatCurrency(0, lang),
      badge: { vi: "Miễn Phí", en: "Free", lo: "ຟຣີ", zh: "免费" }[lang] || "Free",
      shortDesc: {
        vi: "Phù hợp tham khảo sơ bộ phong thủy và định mức vật tư tổng quan.",
        en: "Ideal for initial feng shui & general material estimation.",
        lo: "ເໝາະສຳລັບການອ້າງອີງຮວງຈຸ້ຍເບື້ອງຕົ້ນ.",
        zh: "适合初步了解风水参考及大致预算。"
      }[lang],
      features: [
        { vi: "Phân tích Bát Trạch & Ngũ Hành sơ bộ", en: "Basic Bagua & Element analysis", lo: "ວິເຄາະຮວງຈຸ້ຍເບື້ອງຕົ້ນ", zh: "基础八字与五行分析" },
        { vi: "Định mức cơ bản thép, gạch, xi măng", en: "Basic material quantity estimates", lo: "ປະລິມານວັດສະດຸເບື້ອງຕົ້ນ", zh: "基础建材用量概算" },
        { vi: "Ước tính tổng chi phí sơ bộ", en: "General cost estimate", lo: "ປະເມີນຄ່າໃຊ້ຈ່າຍລວມ", zh: "总体造价初步估算" },
        { vi: "Xuất bản báo cáo PDF cơ bản", en: "Export basic PDF report", lo: "ສົ່ງອອກ PDF ພື້ນຖານ", zh: "导出基础PDF报告" }
      ],
      color: "border-slate-300 bg-slate-50 text-slate-900"
    },
    {
      id: 'standard',
      name: { vi: "Báo Cáo Đầy Đủ", en: "Full Report", lo: "ບົດລາຍງານເຕັມ", zh: "专业深度全功能报告" }[lang] || "Full Report",
      price: formatCurrency(299000, lang),
      badge: { vi: "Phổ Biến", en: "Popular", lo: "ຍອດນິຍົມ", zh: "最受欢迎" }[lang] || "Popular",
      shortDesc: {
        vi: "Dự toán chi tiết từng hạng mục & quy chuẩn kết cấu kỹ thuật 2026.",
        en: "Detailed itemized estimates & technical structural specs.",
        lo: "ຄາດຄະເນງົບປະມານຢ່າງລະອຽດທຸກລາຍການ.",
        zh: "精确到各项工程的细致预算与结构规范核对。"
      }[lang],
      features: [
        { vi: "Phân tích phong thủy chi tiết cát hung 2026", en: "Detailed 2026 feng shui auspicious analysis", lo: "ວິເຄາະຮວງຈຸ້ຍປີ 2026", zh: "2026年流年吉凶风水精细化分析" },
        { vi: "Dự toán chi tiết từng hạng mục vật tư", en: "Itemized cost estimation down to exact materials", lo: "ຄາດຄະເນງົບປະມານລະອຽດ", zh: "各项建材分项工程造价明细" },
        { vi: "Bản phân tích kỹ thuật kết cấu móng, tường, sàn", en: "Foundation and structural technical report", lo: "ບົດລາຍງານເຕັກນິກໂຄງສ້າງ", zh: "基础与墙体柱梁结构技术报告" },
        { vi: "Tư vấn vật tư cao cấp chính hãng", en: "Premium genuine material advice", lo: "ຄຳແນະນຳວັດສະດຸຊັ້ນສູງ", zh: "正品优质品牌建材选型建议" }
      ],
      color: "border-blue-500 bg-blue-50/60 text-blue-900"
    },
    {
      id: 'design',
      name: { vi: "Báo Cáo + Bản Vẽ", en: "Report + Drawings", lo: "ບົດລາຍງານ + ແບບແປນ", zh: "全套报告 + 设计图纸" }[lang] || "Report + Drawings",
      price: { vi: `Từ ${formatCurrency(1200000, lang)}`, en: `From ${formatCurrency(1200000, lang)}`, lo: `ຈາກ ${formatCurrency(1200000, lang)}`, zh: `${formatCurrency(1200000, lang)}起` }[lang] || `From ${formatCurrency(1200000, lang)}`,
      badge: { vi: "Cao Cấp", en: "Elite", lo: "ພິເສດ", zh: "尊享全包" }[lang] || "Elite",
      shortDesc: {
        vi: "Hồ sơ kỹ thuật toàn diện. Giá cụ thể theo diện tích và loại kết cấu — xem báo giá chi tiết sau khi nhập thông tin.",
        en: "Comprehensive technical files. Pricing varies by area and structure type — check details after entering info.",
        lo: "ແກ້ໄຂຄົບຊຸດ, ລາຄາຈະແຈ້ງຕາມພື້ນທີ່ ແລະ ປະເພດໂຄງສ້າງ.",
        zh: "全方位一站式解决方案，具体价格根据面积及结构类型核算。"
      }[lang],
      features: [
        { vi: "Tất cả quyền lợi của gói Báo Cáo Đầy Đủ", en: "All benefits of Full Report", lo: "ສິດທິປະໂຫຍດທັງໝົດຂອງແພັກເກັດເຕັມ", zh: "享有全功能报告所有权限" },
        { vi: "Bản vẽ 2D mặt bằng & bố trí công năng chi tiết", en: "Detailed 2D floor plans & functional layout", lo: "ແບບແປນ 2D ຈັດວາງຟັງຊັນ", zh: "2D详细平面图及各房间功能动线规划" },
        { vi: "Mô hình 3D trực quan & Thư viện mẫu thiết kế", en: "Interactive 3D model & design gallery", lo: "ໂມເດວ 3D ແລະ ຫ້ອງວາງສະແດງຕົວຢ່າງ", zh: "3D互动空间模型与全屋设计素材库" },
        { vi: "Hỗ trợ tư vấn trực tiếp 24/7 từ Kỹ sư trưởng Yohu", en: "24/7 direct consultation with Yohu Chief Engineer", lo: "ປຶກສາສົດ 24/7 ກັບວິສະວະກອນ", zh: "总工程师团队7x24小时专属咨询" }
      ],
      color: "border-purple-500 bg-purple-50/60 text-purple-900"
    }
  ];

  return (
    <div id="pricing-section" className={`p-4 sm:p-5 rounded-2xl border transition-all my-5 ${
      isDark ? 'bg-[#0b0f19] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500 shrink-0" />
          <h4 className={`text-sm sm:text-base font-black uppercase tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {t.title}
          </h4>
        </div>
        <span className={`text-[13px] lg:text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {t.subtitle}
        </span>
      </div>

      {/* COMPACT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {packagesData.map((pkg) => {
          const isSelected = currentPackage === pkg.id;
          return (
            <div 
              key={pkg.id}
              className={`p-3.5 sm:p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                isSelected 
                  ? 'ring-2 ring-red-500 border-red-600 bg-red-600/5 shadow-md' 
                  : isDark 
                    ? 'bg-[#121829] border-slate-800 hover:border-slate-700' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h5 className={`text-[14.5px] lg:text-sm font-extrabold uppercase leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {pkg.name}
                  </h5>
                  {pkg.badge && (
                    <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-600 text-white whitespace-nowrap shadow-2xs">
                      {pkg.badge}
                    </span>
                  )}
                </div>

                <div className="text-[18px] lg:text-lg font-black text-red-600 font-mono my-1.5 whitespace-nowrap tracking-tight">
                  {pkg.price}
                </div>

                <p className={`text-[13.5px] lg:text-[11px] leading-relaxed mb-3 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {pkg.shortDesc}
                </p>
              </div>

              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/10 mt-auto">
                <button
                  type="button"
                  onClick={() => setDetailModalPkg(pkg)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[13.5px] lg:text-[11px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap shrink-0 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="whitespace-nowrap">{t.viewDetail}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectPackage(pkg.id as 'free' | 'standard' | 'design')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[13.5px] lg:text-[11px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap">{t.selectedBtn}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap">{t.selectBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* VIDEO PACKAGES SECTION */}
      <div className="mt-8 pt-6 border-t border-slate-700/30">
        <div className="flex items-center gap-2 mb-2">
          <Video className="w-4 h-4 text-rose-500 shrink-0" />
          <h4 className={`text-sm sm:text-base font-black uppercase tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {{
              vi: "Bảng Giá Dịch Vụ Tạo Video 3D/VR Trực Quan Công Trình",
              en: "3D/VR Architectural Video Production Pricing",
              lo: "ຕາຕະລາງລາຄາການຜະລິດວິດີໂອ 3D/VR",
              zh: "3D/VR建筑施工可视化视频制作价格表"
            }[lang]}
          </h4>
        </div>
        <p className={`text-[13px] lg:text-[11px] mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {{
            vi: "Diễn họa không gian sống chân thực, hỗ trợ thuyết trình dự án & marketing bất động sản",
            en: "Realistic spatial rendering, project presentation & real estate marketing",
            lo: "ການສະແດງພາບພື້ນທີ່ຈິງ, ສະໜັບສະໜູນການນຳສະເໜີໂຄງການ",
            zh: "逼真空间演练，助力项目汇报与房地产营销推广"
          }[lang]}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: 'VID-TEASER',
              name: { vi: "Video Mồi (Teaser)", en: "Teaser Video", lo: "ວິດີໂອຕົວຢ່າງ", zh: "预告视频" }[lang] || "Teaser Video",
              price: formatCurrency(200000, lang),
              duration: "15 – 20 giây",
              badge: { vi: "Phổ Biến", en: "Popular", lo: "ຍອດນິຍົມ", zh: "热门" }[lang] || "Popular",
              shortDesc: {
                vi: "Fly-through ngoại thất, góc nhìn từ trên cao. Trải nghiệm nhanh không gian.",
                en: "Exterior fly-through, aerial view. Quick spatial experience.",
                lo: "ບິນຜ່ານພາຍນອກ, ມຸມມອງຈາກທາງເທິງ.",
                zh: "外观飞行漫游，高空视角。快速空间体验。"
              }[lang],
              features: [
                { vi: "Fly-through ngoại thất từ trên cao", en: "Aerial exterior fly-through", lo: "ບິນຜ່ານພາຍນອກ", zh: "高空外观飞行漫游" },
                { vi: "Hiệu ứng chuyển động mượt mà", en: "Smooth motion effects", lo: "ເອັບເຟັກການເຄື່ອນໄຫວ", zh: "流畅运动效果" },
                { vi: "Nhạc nền bản quyền", en: "Copyright background music", lo: "ເພງພື້ນຫຼັງ", zh: "版权背景音乐" }
              ]
            },
            {
              id: 'VID-01',
              name: { vi: "Video Tiêu Chuẩn", en: "Standard Video", lo: "ວິດີໂອມາດຕະຖານ", zh: "标准视频" }[lang] || "Standard Video",
              price: formatCurrency(500000, lang),
              duration: "30 – 45 giây",
              badge: { vi: "Tiết Kiệm", en: "Economy", lo: "ປະຢັດ", zh: "经济款" }[lang] || "Economy",
              shortDesc: {
                vi: "Ngoại thất 360°, 2–3 góc nhìn. Nhạc nền + text overlay tên chủ nhà.",
                en: "360° exterior, 2-3 angles. Background music + homeowner name text overlay.",
                lo: "ພາຍນອກ 360°, 2-3 ມຸມມອງ.",
                zh: "360°外观，2-3个视角。背景音乐+业主姓名文字叠加。"
              }[lang],
              features: [
                { vi: "Ngoại thất 360 độ chi tiết", en: "Detailed 360-degree exterior", lo: "ພາຍນອກ 360 ອົງສາ", zh: "详细360度外观" },
                { vi: "2 - 3 góc nhìn phối cảnh chính", en: "2 - 3 main perspective angles", lo: "2 - 3 ມຸມມອງຫຼັກ", zh: "2 - 3个主要透视视角" },
                { vi: "Chèn tên chủ nhà & nhạc nền", en: "Homeowner name & BGM overlay", lo: "ໃສ່ຊື່ເຈົ້າຂອງບ້ານ", zh: "添加业主姓名与背景音乐" }
              ]
            },
            {
              id: 'VID-02',
              name: { vi: "Video Nâng Cao", en: "Advanced Video", lo: "ວິດີໂອຂັ້ນສູງ", zh: "高级视频" }[lang] || "Advanced Video",
              price: formatCurrency(1200000, lang),
              duration: "60 – 90 giây",
              badge: { vi: "Đề Xuất", en: "Recommended", lo: "ແນະນຳ", zh: "推荐" }[lang] || "Recommended",
              shortDesc: {
                vi: "Ngoại thất + nội thất walkthrough. Hiệu ứng ánh sáng ngày/đêm. Voiceover AI.",
                en: "Exterior + interior walkthrough. Day/night lighting effects. AI voiceover.",
                lo: "ພາຍນອກ + ພາຍໃນ walkthrough.",
                zh: "外观+室内漫游。昼夜光效。AI配音解说。"
              }[lang],
              features: [
                { vi: "Walkthrough nội thất chi tiết từng phòng", en: "Room-by-room interior walkthrough", lo: "ຍ່າງເບິ່ງພາຍໃນທຸກຫ້ອງ", zh: "各房间室内漫游" },
                { vi: "Hiệu ứng ánh sáng ngày & đêm", en: "Day and night lighting simulation", lo: "ແສງສະຫວ່າງกลางวัน/กลางคืน", zh: "昼夜光影模拟" },
                { vi: "Lồng tiếng thuyết minh AI chuyên nghiệp", en: "Professional AI voiceover", lo: "ສຽງພາກ AI ມືອາຊີບ", zh: "专业AI配音解说" }
              ]
            },
            {
              id: 'VID-03',
              name: { vi: "Video Cinematic Premium", en: "Cinematic Premium Video", lo: "ວິດີໂອ Cinematic Premium", zh: "尊享电影级视频" }[lang] || "Cinematic Premium",
              price: formatCurrency(2500000, lang),
              duration: "90 – 120 giây",
              badge: { vi: "Cao Cấp", en: "Elite", lo: "ພິເສດ", zh: "尊享" }[lang] || "Elite",
              shortDesc: {
                vi: "Full exterior + interior + không gian sống. Drone-style. Title card + CTA + logo chủ nhà.",
                en: "Full exterior + interior + living space. Drone-style. Title card + CTA + homeowner logo.",
                lo: "ເຕັມรูปแบบ ພາຍນອກ + ພາຍໃນ.",
                zh: "全套外观+室内+生活空间。航拍风格。片头+CTA+业主标志。"
              }[lang],
              features: [
                { vi: "Đỉnh cao điện ảnh toàn cảnh kiến trúc", en: "Cinematic architectural peak", lo: "ຈຸດສູງສຸດຂອງສິລະປະ", zh: "建筑美学电影巅峰" },
                { vi: "Phong cách bay drone góc rộng đẳng cấp", en: "Drone-style wide-angle cinematography", lo: "ມຸມມອງ Drone ລະດັບສູງ", zh: "高端大 航拍视角" },
                { vi: "Chèn Logo, Title Card & CTA độc quyền", en: "Exclusive Logo, Title Card & CTA", lo: "ໃສ່โลโก້ ແລະ Title Card", zh: "独家Logo、片头与CTA展示" }
              ]
            }
          ].map((vPkg) => (
            <div 
              key={vPkg.id}
              className={`p-3.5 sm:p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                isDark ? 'bg-[#121829] border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h5 className={`text-[14.5px] lg:text-sm font-extrabold uppercase leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {vPkg.name}
                  </h5>
                  {vPkg.badge && (
                    <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white whitespace-nowrap shadow-2xs">
                      {vPkg.badge}
                    </span>
                  )}
                </div>

                <div className="text-[18px] lg:text-lg font-black text-rose-600 font-mono my-1.5 whitespace-nowrap tracking-tight">
                  {vPkg.price}
                </div>

                <p className={`text-[13.5px] lg:text-[11px] leading-relaxed mb-3 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {vPkg.shortDesc}
                </p>
              </div>

              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/10 mt-auto">
                <button
                  type="button"
                  onClick={() => setDetailModalPkg(vPkg)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[13.5px] lg:text-[11px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap shrink-0 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="whitespace-nowrap">{t.viewDetail}</span>
                </button>

                <button
                  type="button"
                  onClick={() => alert(lang === 'vi' ? `Bạn đã chọn đăng ký ${vPkg.name}. Vui lòng xác nhận thông tin dự án để chuyên viên liên hệ dựng video.` : `Selected ${vPkg.name}. Our team will contact you soon.`)}
                  className="flex-1 py-1.5 px-2 rounded-lg text-[13.5px] lg:text-[11px] font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap shrink-0 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  <Video className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{lang === 'vi' ? "Đặt Video" : "Order Video"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAIL MODAL (POPUP ON CLICK) */}
      {detailModalPkg && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-[#0e1423] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-extrabold uppercase tracking-wide">{detailModalPkg.name}</h4>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalPkg(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] lg:text-xs font-bold uppercase text-slate-400">Mức phí đầu tư:</span>
                <span className="text-[22px] lg:text-xl font-black text-red-600 font-mono">{detailModalPkg.price}</span>
              </div>
              <p className={`text-[14px] lg:text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {detailModalPkg.shortDesc}
              </p>

              <div>
                <h5 className="text-[14px] lg:text-xs font-extrabold uppercase text-amber-500 mb-2">{t.featuresTitle}</h5>
                <ul className="space-y-2">
                  {detailModalPkg.features.map((feat: any, idx: number) => {
                    const text = typeof feat === 'string' ? feat : (feat[lang] || feat.vi);
                    return (
                      <li key={idx} className="flex items-start gap-2 text-[14px] lg:text-xs leading-relaxed">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className={isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}>
                          {text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-800/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDetailModalPkg(null)}
                  className="px-4 py-2 rounded-xl text-[14.5px] lg:text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer transition"
                >
                  {t.close}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPackage(detailModalPkg.id);
                    setDetailModalPkg(null);
                  }}
                  className="px-4 py-2 rounded-xl text-[14.5px] lg:text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer transition flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{t.selectBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
