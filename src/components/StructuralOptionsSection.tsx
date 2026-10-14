import React from 'react';
import { ConstructionInfo } from '../types';
import { STRUCTURAL_OPTIONS, StructuralOption } from '../data/structuralOptions';

interface StructuralOptionsSectionProps {
  theme: 'dark' | 'light';
  t: any;
  selectedStructuralOptionId: 'PA1' | 'PA2' | 'PA3';
  onSelectOption: (id: 'PA1' | 'PA2' | 'PA3', name: string) => void;
  constructionInfo: ConstructionInfo;
  onUpdateConstructionInfo: (updater: (prev: ConstructionInfo) => ConstructionInfo) => void;
}

export const StructuralOptionsSection: React.FC<StructuralOptionsSectionProps> = ({
  theme,
  t,
  selectedStructuralOptionId,
  onSelectOption,
  constructionInfo,
  onUpdateConstructionInfo,
}) => {
  return (
    <div className="space-y-3 pt-2">
      <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider ${theme === 'dark' ? 'text-amber-400' : 'text-slate-900'}`}>
        {t.structuralOptionsTitle || "🏗️ CHỌN PHƯƠNG ÁN KẾT CẤU CHÍNH (3 PHƯƠNG ÁN LỰA CHỌN):"}
      </label>

      {/* 3 Structural Options Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {STRUCTURAL_OPTIONS.map((opt: StructuralOption) => {
          const optTranslated = t.structuralOptions?.[opt.id];
          const optName = optTranslated?.name || opt.name;
          const optBadge = optTranslated?.badge || opt.badge;
          const optDesc = optTranslated?.shortDesc || opt.shortDescription;
          const isSelected = selectedStructuralOptionId === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectOption(opt.id, opt.name)}
              className={`p-3.5 rounded-2xl border text-left transition relative cursor-pointer ${
                isSelected
                  ? 'bg-red-950/40 border-amber-400 text-white shadow-lg ring-2 ring-amber-400/50'
                  : theme === 'dark'
                    ? 'bg-[#101728] border-slate-800 text-slate-300 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-xs text-amber-400 font-mono">{opt.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  opt.id === 'PA3' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                }`}>
                  {optBadge}
                </span>
              </div>
              <h4 className="font-bold text-xs sm:text-sm line-clamp-1">{optName}</h4>
              <p className="text-[11px] opacity-75 mt-1 line-clamp-2 leading-snug">{optDesc}</p>
            </button>
          );
        })}
      </div>

      {/* Structural Type Dropdown & Frontages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        <div>
          <label className={`block text-xs uppercase font-bold mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>
            {t.primaryStructureTypeLabel || "Loại kết cấu chính"}
          </label>
          <select
            value={selectedStructuralOptionId}
            onChange={(e) => {
              const optId = e.target.value as 'PA1' | 'PA2' | 'PA3';
              const targetOpt = STRUCTURAL_OPTIONS.find(o => o.id === optId);
              onSelectOption(optId, targetOpt ? targetOpt.name : optId);
            }}
            className={`w-full p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm border font-bold min-h-[44px] ${
              theme === 'dark' ? 'bg-[#121829] text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-300'
            }`}
          >
            <option value="PA1">{t.structuralOptions?.PA1?.selectLabel || "PA1: Bê tông cốt thép truyền thống"}</option>
            <option value="PA2">{t.structuralOptions?.PA2?.selectLabel || "PA2: Khung thép tiền chế + Cemboard"}</option>
            <option value="PA3">{t.structuralOptions?.PA3?.selectLabel || "PA3: Bê tông nhẹ EPS đúc liền khối + Gông 3D"}</option>
          </select>
        </div>
        <div>
          <label className={`block text-xs uppercase font-bold mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-700'}`}>
            {t.frontagesLabel || "Số mặt tiền"}
          </label>
          <input
            type="number"
            min={1}
            value={constructionInfo.so_mat_tien || 1}
            onChange={(e) => {
              const val = Number(e.target.value) || 1;
              onUpdateConstructionInfo(prev => ({ ...prev, so_mat_tien: val }));
            }}
            className={`w-full p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm border font-bold min-h-[44px] ${
              theme === 'dark' ? 'bg-[#121829] text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-300'
            }`}
          />
        </div>
      </div>

      {/* PA1: Traditional Reinforced Concrete Detailed Specs */}
      {selectedStructuralOptionId === 'PA1' && (
        <div className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 animate-fade-in ${
          theme === 'dark' ? 'bg-[#151c2f] border-blue-500/30' : 'bg-blue-50/70 border-blue-300'
        }`}>
          <div className="text-sm sm:text-base font-black text-blue-500 dark:text-blue-400 flex items-center gap-2">
            <span>{t.pa1ConfigTitle || "⚙️ Cấu hình chi tiết Khung Bê Tông Cốt Thép Truyền Thống (PA1):"}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div>
              <label className={`block font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {t.concreteGradeLabel || "Mác bê tông chịu lực (Móng / Cột / Dầm / Sàn)"}
              </label>
              <select
                value={constructionInfo.mac_be_tong || "M250"}
                onChange={(e) => onUpdateConstructionInfo(prev => ({ ...prev, mac_be_tong: e.target.value }))}
                className={`w-full p-3 rounded-xl border text-sm sm:text-base ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                {(t.concreteGradeOptions || ["M250 (B20) - Nhà dân thông dụng", "M300 (B22.5) - Chịu tải cao", "M350 (B25) - Công trình cao tầng"]).map((optText: string, idx: number) => (
                  <option key={idx} value={optText}>{optText}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {t.rebarGradeLabel || "Chủng loại thép cốt chịu lực"}
              </label>
              <select
                value={constructionInfo.mac_thep || "CB300-V / CB400-V (Hòa Phát)"}
                onChange={(e) => onUpdateConstructionInfo(prev => ({ ...prev, mac_thep: e.target.value }))}
                className={`w-full p-3 rounded-xl border text-sm sm:text-base ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                {(t.rebarGradeOptions || ["CB300-V / CB400-V (Hòa Phát)", "CB400-V (Việt Nhật Vina Kyoei)", "CB300-V (Pomina / Miền Nam)"]).map((optText: string, idx: number) => (
                  <option key={idx} value={optText}>{optText}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {t.brickTypeLabel || "Loại gạch xây bao che & tường ngăn"}
              </label>
              <select
                value={constructionInfo.loai_gach || "Gạch tuynel 2 lỗ / đặc"}
                onChange={(e) => onUpdateConstructionInfo(prev => ({ ...prev, loai_gach: e.target.value }))}
                className={`w-full p-3 rounded-xl border text-sm sm:text-base ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                {(t.brickTypeOptions || ["Gạch tuynel 2 lỗ / đặc (220mm & 110mm)", "Gạch không nung xi măng cốt liệu", "Gạch bê tông khí chưng áp AAC"]).map((optText: string, idx: number) => (
                  <option key={idx} value={optText}>{optText}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {t.formworkTypeLabel || "Biện pháp cốp pha (ván khuôn)"}
              </label>
              <select
                value={constructionInfo.bien_phap_cop_pha || "Cốp pha ván ép phủ phim"}
                onChange={(e) => onUpdateConstructionInfo(prev => ({ ...prev, bien_phap_cop_pha: e.target.value }))}
                className={`w-full p-3 rounded-xl border text-sm sm:text-base ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                {(t.formworkTypeOptions || ["Cốp pha ván ép phủ phim công nghệ cao", "Cốp pha thép định hình truyền thống", "Cốp pha gỗ ván tự nhiên"]).map((optText: string, idx: number) => (
                  <option key={idx} value={optText}>{optText}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* PA2: Prefab Steel Frame + Cemboard Fields */}
      {selectedStructuralOptionId === 'PA2' && (
        <div className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 animate-fade-in ${
          theme === 'dark' ? 'bg-[#151c2f] border-amber-500/30' : 'bg-amber-50 border-amber-300'
        }`}>
          <div className="text-sm sm:text-base font-black text-amber-500 dark:text-amber-400">
            {t.steelConfigTitle || "⚙️ Cấu hình chi tiết hệ Khung thép tiền chế + Cemboard:"}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-400 mb-1.5">
                {t.columnSteelSizeLabel || "Kích thước thép cột chính (Hộp / I / H)"}
              </label>
              <input
                type="text"
                placeholder={t.columnSteelPlaceholder || "vd: Hộp 100x100, I150, H200..."}
                value={constructionInfo.thep_hop_cot || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateConstructionInfo(prev => ({ ...prev, thep_hop_cot: val }));
                }}
                className={`w-full p-3 rounded-xl border text-sm sm:text-base ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              />
              {/* Quick Column Shape & Size Suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(t.steelColumnQuickOptions || ["Hộp 100x100", "Hộp 150x150", "I150", "I200", "H150", "H200"]).map((sugg: string) => {
                  const isSelected = constructionInfo.thep_hop_cot === sugg ||
                    (sugg.includes("100x100") && (constructionInfo.thep_hop_cot || "").includes("100x100")) ||
                    (sugg.includes("150x150") && (constructionInfo.thep_hop_cot || "").includes("150x150"));
                  return (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => onUpdateConstructionInfo(prev => ({ ...prev, thep_hop_cot: sugg }))}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-xs'
                          : theme === 'dark'
                            ? 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-750'
                            : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {sugg}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-400 mb-1.5">
                {t.roofTypeLabel || "Loại mái"}
              </label>
              <select
                value={constructionInfo.loai_mai || "Tôn lạnh"}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateConstructionInfo(prev => ({ ...prev, loai_mai: val }));
                }}
                className={`w-full p-3 rounded-xl border text-sm sm:text-base ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                <option value="Tôn lạnh">{t.roofTypeOptions?.[0] || "Tôn lạnh"}</option>
                <option value="Tôn giả ngói">{t.roofTypeOptions?.[1] || "Tôn giả ngói"}</option>
                <option value="Khác">{t.roofTypeOptions?.[2] || "Khác (Tự nhập)"}</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-400 mb-1.5">
                {t.floorTypeLabel || "Loại sàn"}
              </label>
              <select
                value={constructionInfo.loai_san || "Cemboard"}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateConstructionInfo(prev => ({ ...prev, loai_san: val }));
                }}
                className={`w-full p-3 rounded-xl border text-sm sm:text-base ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                <option value="Cemboard">{t.floorTypeOptions?.[0] || "Cemboard"}</option>
                <option value="Khác">{t.floorTypeOptions?.[1] || "Khác"}</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-400 mb-1.5">
                {t.wallTypeLabel || "Loại vách"}
              </label>
              <select
                value={constructionInfo.loai_vach || "Panel EPS"}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateConstructionInfo(prev => ({ ...prev, loai_vach: val }));
                }}
                className={`w-full p-3 rounded-xl border text-sm sm:text-base ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                <option value="Panel EPS">{t.wallTypeOptions?.[0] || "Panel EPS"}</option>
                <option value="Panel PU">{t.wallTypeOptions?.[1] || "Panel PU"}</option>
                <option value="Khác">{t.wallTypeOptions?.[2] || "Khác"}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-400 mb-1.5">
                {t.ceilingTypeLabel || "Loại trần & Vật liệu hoàn thiện"}
              </label>
              <select
                value={constructionInfo.loai_tran || t.ceilingTypeOptions?.[0] || "Thạch cao Vĩnh Tường chống ẩm"}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateConstructionInfo(prev => ({ ...prev, loai_tran: val }));
                }}
                className={`w-full p-3 rounded-xl border text-sm sm:text-base ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                {(t.ceilingTypeOptions || [
                  "Thạch cao Vĩnh Tường chống ẩm",
                  "Tấm ốp đa năng sợi than tre (Bamboo Charcoal)",
                  "Trần nhôm hợp kim (Clip-in / Baffle)",
                  "Nhựa Nano / Lam sóng giả gỗ",
                  "Gỗ tự nhiên / Gỗ công nghiệp",
                  "Khác (Tự nhập)"
                ]).map((opt: string, idx: number) => (
                  <option key={idx} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* UNIVERSAL CEILING MATERIAL SELECTION SECTION */}
      <div className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 transition-all ${
        theme === 'dark' ? 'bg-[#121829]/70 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg">✨</span>
            <div>
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                {t.ceilingTypeLabel || "Vật liệu hoàn thiện trần theo yêu cầu"}
              </h4>
              <p className={`text-[11px] sm:text-xs font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Tuân thủ chính xác yêu cầu chủng loại vật tư của gia chủ (Tấm than tre, Nhôm, Thạch cao, Nano, Gỗ...)
              </p>
            </div>
          </div>
          {constructionInfo.loai_tran && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
              Đang chọn: {constructionInfo.loai_tran}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { id: "thach_cao", label: "Trần Thạch Cao Vĩnh Tường", desc: "Chống ẩm, phẳng đẹp", icon: "🏛️" },
            { id: "than_tre", label: "Tấm Sợi Than Tre (Bamboo)", desc: "Vân đá/vân gỗ sang trọng", icon: "🎍" },
            { id: "nhom", label: "Trần Nhôm Hợp Kim (Clip-in)", desc: "Chống oxy hóa, bền vĩnh cửu", icon: "⚙️" },
            { id: "nhua_nano", label: "Nhựa Nano / Lam Sóng", desc: "Chống nước 100%, dễ lau chùi", icon: "🌿" },
            { id: "go", label: "Gỗ Tự Nhiên / Công Nghiệp", desc: "Ấm cúng & Đẳng cấp", icon: "🪵" },
            { id: "custom", label: "Tùy chọn khác...", desc: "Tự nhập theo ý muốn", icon: "✏️" },
          ].map((item) => {
            const isSelected = 
              (item.id === 'thach_cao' && (constructionInfo.loai_tran?.toLowerCase().includes('thạch cao') || constructionInfo.loai_tran?.toLowerCase().includes('thach cao'))) ||
              (item.id === 'than_tre' && (constructionInfo.loai_tran?.toLowerCase().includes('than tre') || constructionInfo.loai_tran?.toLowerCase().includes('bamboo'))) ||
              (item.id === 'nhom' && (constructionInfo.loai_tran?.toLowerCase().includes('nhôm') || constructionInfo.loai_tran?.toLowerCase().includes('nhom') || constructionInfo.loai_tran?.toLowerCase().includes('baffle'))) ||
              (item.id === 'nhua_nano' && (constructionInfo.loai_tran?.toLowerCase().includes('nano') || constructionInfo.loai_tran?.toLowerCase().includes('lam sóng'))) ||
              (item.id === 'go' && (constructionInfo.loai_tran?.toLowerCase().includes('gỗ') || constructionInfo.loai_tran?.toLowerCase().includes('go'))) ||
              (item.id === 'custom' && constructionInfo.loai_tran && !['thạch cao', 'than tre', 'nhôm', 'nano', 'gỗ'].some(k => constructionInfo.loai_tran?.toLowerCase().includes(k)));

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  let mapped = "Thạch cao Vĩnh Tường chống ẩm";
                  if (item.id === 'than_tre') mapped = "Tấm ốp đa năng sợi than tre (Bamboo Charcoal)";
                  else if (item.id === 'nhom') mapped = "Trần nhôm hợp kim (Clip-in / Baffle)";
                  else if (item.id === 'nhua_nano') mapped = "Nhựa Nano / Lam sóng giả gỗ";
                  else if (item.id === 'go') mapped = "Gỗ tự nhiên / Gỗ công nghiệp";
                  else if (item.id === 'custom') mapped = "Khác (Tự nhập)";
                  onUpdateConstructionInfo(prev => ({ ...prev, loai_tran: mapped }));
                }}
                className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 font-black shadow-sm ring-1 ring-red-500' 
                    : theme === 'dark'
                      ? 'border-slate-800 bg-[#0c101d] text-slate-300 hover:border-slate-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs sm:text-sm font-bold truncate">{item.label}</span>
                </div>
                <span className={`text-[10px] sm:text-xs truncate ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Ceiling Material Input */}
        {(constructionInfo.loai_tran?.includes("Khác") || (!['thạch cao', 'than tre', 'nhôm', 'nano', 'gỗ'].some(k => constructionInfo.loai_tran?.toLowerCase().includes(k)) && constructionInfo.loai_tran)) && (
          <div className="pt-2 animate-fade-in">
            <label className={`block text-xs font-bold mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
              Mô tả chi tiết vật tư trần theo ý bạn:
            </label>
            <input
              type="text"
              value={constructionInfo.loai_tran === "Khác (Tự nhập)" ? "" : constructionInfo.loai_tran}
              onChange={(e) => onUpdateConstructionInfo(prev => ({ ...prev, loai_tran: e.target.value }))}
              placeholder="Ví dụ: Tấm than tre sợi nano phủ acrylic bóng gương, Trần nhôm 3D đục lỗ tiêu âm..."
              className={`w-full p-3 rounded-xl border text-xs sm:text-sm ${
                theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>
        )}
      </div>

      {/* PA3: EPS Monolithic Lightweight Concrete Advantage Card & Specs */}
      {selectedStructuralOptionId === 'PA3' && (
        <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 animate-fade-in ${
          theme === 'dark' ? 'bg-[#0f1d2c] border-emerald-500/50 text-slate-100 shadow-xl' : 'bg-emerald-50/95 border-emerald-400 text-slate-900 shadow-md'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm sm:text-base font-black text-emerald-950 dark:text-emerald-300 flex items-center gap-2">
              <span>{t.epsAdvantageInfo?.title || "🚀 Công nghệ Bê tông nhẹ EPS đúc liền khối & Hệ Gông định hình 3D"}</span>
            </div>
            <span className="text-xs font-black px-3 py-1 rounded-full border-2 border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 shadow-xs">
              {t.epsAdvantageInfo?.badge || "Ưu việt vượt trội"}
            </span>
          </div>

          <p className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400 leading-relaxed">
            {t.epsAdvantageInfo?.tagline || "Rút ngắn 50% tiến độ · Tiết kiệm 25%-35% chi phí · Chống nứt thấm tuyệt đối"}
          </p>

          {/* PA3 Specs Inputs */}
          <div className={`p-3.5 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm ${
            theme === 'dark' ? 'bg-[#0a1420] border-emerald-500/30' : 'bg-white border-emerald-300'
          }`}>
            <div>
              <label className={`block font-bold mb-1.5 ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-900'}`}>
                {t.epsDensityLabel || "Tỷ trọng bê tông nhẹ EPS"}
              </label>
              <select
                value={constructionInfo.ty_trong_eps || "D800 (800 kg/m³)"}
                onChange={(e) => onUpdateConstructionInfo(prev => ({ ...prev, ty_trong_eps: e.target.value }))}
                className={`w-full p-2.5 rounded-xl border text-sm ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                {(t.epsDensityOptions || ["D600 (600 kg/m³) - Cách âm, chống nóng siêu việt", "D800 (800 kg/m³) - Cân bằng chịu lực & cách nhiệt", "D1000 (1000 kg/m³) - Chịu tải trọng cao"]).map((optText: string, idx: number) => (
                  <option key={idx} value={optText}>{optText}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block font-bold mb-1.5 ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-900'}`}>
                {t.epsWallThicknessLabel || "Độ dày vách đúc liền khối"}
              </label>
              <select
                value={constructionInfo.do_day_vach_eps || "150 mm (15 cm)"}
                onChange={(e) => onUpdateConstructionInfo(prev => ({ ...prev, do_day_vach_eps: e.target.value }))}
                className={`w-full p-2.5 rounded-xl border text-sm ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                {(t.epsWallThicknessOptions || ["150 mm (15 cm) - Tiêu chuẩn chống nóng & cách âm", "120 mm (12 cm) - Tiết kiệm diện tích", "200 mm (20 cm) - Cách âm tối đa"]).map((optText: string, idx: number) => (
                  <option key={idx} value={optText}>{optText}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs sm:text-sm">
            <div className={`p-4 rounded-xl border transition-all ${theme === 'dark' ? 'bg-[#15253b] border-emerald-500/30' : 'bg-white border-emerald-400 shadow-sm'}`}>
              <div className={`font-black mb-2 flex items-center gap-1.5 text-xs sm:text-sm lg:text-base ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-950'}`}>
                <span>{t.epsAdvantageInfo?.speedTitle || "⚡ Tốc độ thi công thần tốc"}</span>
              </div>
              <p className={`text-xs sm:text-sm lg:text-base font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                {t.epsAdvantageInfo?.speedDesc}
              </p>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${theme === 'dark' ? 'bg-[#15253b] border-emerald-500/30' : 'bg-white border-emerald-400 shadow-sm'}`}>
              <div className={`font-black mb-2 flex items-center gap-1.5 text-xs sm:text-sm lg:text-base ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-950'}`}>
                <span>{t.epsAdvantageInfo?.costTitle || "💰 Giá thành siêu cạnh tranh"}</span>
              </div>
              <p className={`text-xs sm:text-sm lg:text-base font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                {t.epsAdvantageInfo?.costDesc}
              </p>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${theme === 'dark' ? 'bg-[#15253b] border-emerald-500/30' : 'bg-white border-emerald-400 shadow-sm'}`}>
              <div className={`font-black mb-2 flex items-center gap-1.5 text-xs sm:text-sm lg:text-base ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-950'}`}>
                <span>{t.epsAdvantageInfo?.qualityTitle || "🛡️ Đúc liền khối không mạch ngừng"}</span>
              </div>
              <p className={`text-xs sm:text-sm lg:text-base font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                {t.epsAdvantageInfo?.qualityDesc}
              </p>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${theme === 'dark' ? 'bg-[#15253b] border-emerald-500/30' : 'bg-white border-emerald-400 shadow-sm'}`}>
              <div className={`font-black mb-2 flex items-center gap-1.5 text-xs sm:text-sm lg:text-base ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-950'}`}>
                <span>{t.epsAdvantageInfo?.insulationTitle || "❄️ Cách âm >45 dB & Mát hơn 4 - 6°C"}</span>
              </div>
              <p className={`text-xs sm:text-sm lg:text-base font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                {t.epsAdvantageInfo?.insulationDesc}
              </p>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${theme === 'dark' ? 'bg-[#15253b] border-emerald-500/30' : 'bg-white border-emerald-400 shadow-sm'}`}>
              <div className={`font-black mb-2 flex items-center gap-1.5 text-xs sm:text-sm lg:text-base ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-950'}`}>
                <span>{t.epsAdvantageInfo?.foundationTitle || "🏗️ Giảm tải 50-65% - Tiết kiệm móng"}</span>
              </div>
              <p className={`text-xs sm:text-sm lg:text-base font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                {t.epsAdvantageInfo?.foundationDesc}
              </p>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${theme === 'dark' ? 'bg-[#15253b] border-emerald-500/30' : 'bg-white border-emerald-400 shadow-sm'}`}>
              <div className={`font-black mb-2 flex items-center gap-1.5 text-xs sm:text-sm lg:text-base ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-950'}`}>
                <span>{t.epsAdvantageInfo?.meoTitle || "🔌 M&E điện nước âm tường 100%"}</span>
              </div>
              <p className={`text-xs sm:text-sm lg:text-base font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                {t.epsAdvantageInfo?.meoDesc}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
