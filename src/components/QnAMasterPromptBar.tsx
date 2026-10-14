import React, { useState, useRef } from 'react';
import { masterPromptData, buildPopulatedMasterPrompt } from '../data/masterPrompts';
import { Sparkles, Copy, Check, ChevronDown, ChevronUp, Image as ImageIcon, X, FileText, Wand2 } from 'lucide-react';

interface QnAMasterPromptBarProps {
  theme: 'dark' | 'light';
  lang: 'vi' | 'en' | 'lo' | 'zh';
  userInfo?: any;
  constructionInfo?: any;
  onApplyPrompt: (promptText: string) => void;
  attachedImage: string | null;
  onAttachImage: (base64Image: string | null) => void;
}

export const QnAMasterPromptBar: React.FC<QnAMasterPromptBarProps> = ({
  theme,
  lang,
  userInfo,
  constructionInfo,
  onApplyPrompt,
  attachedImage,
  onAttachImage,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = masterPromptData[lang] || masterPromptData.vi;

  const handleCopy = () => {
    navigator.clipboard.writeText(config.template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInsertRaw = () => {
    onApplyPrompt(config.template);
  };

  const handleInsertPopulated = () => {
    const text = buildPopulatedMasterPrompt(lang, userInfo, constructionInfo);
    onApplyPrompt(text);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(lang === 'vi' ? 'Vui lòng chọn file hình ảnh (JPG, PNG, WEBP).' : 'Please select an image file (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const base64 = loadEvt.target?.result as string;
      if (base64) {
        onAttachImage(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-sm ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-amber-950/20 via-slate-900/60 to-slate-950/80 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.06)]'
        : 'bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 border-amber-300 shadow-md'
    }`}>
      {/* HEADER WITH BADGE & TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>{config.badge}</span>
            </span>
          </div>
          <h4 className={`text-sm sm:text-base font-black tracking-tight font-sans ${
            theme === 'dark' ? 'text-amber-200' : 'text-slate-900'
          }`}>
            {config.title}
          </h4>
          <p className={`text-xs sm:text-[13px] leading-relaxed max-w-3xl ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
          }`}>
            {config.description}
          </p>
        </div>

        {/* QUICK COPY BUTTON */}
        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[38px] ${
              copied
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300'
                  : 'bg-white hover:bg-amber-50 border-slate-300 text-slate-800'
            }`}
            title={config.btnCopy}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copied ? config.btnCopied : config.btnCopy}</span>
          </button>
        </div>
      </div>

      {/* ACTION TOOLBAR: INSERT, AUTO-FILL, PREVIEW & ATTACH IMAGE */}
      <div className="mt-3 pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* INSERT BUTTON */}
          <button
            type="button"
            onClick={handleInsertRaw}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer min-h-[40px]"
            title={config.btnInsert}
          >
            <FileText className="w-4 h-4" />
            <span>{config.btnInsert}</span>
          </button>

          {/* AUTO-FILL BUTTON */}
          <button
            type="button"
            onClick={handleInsertPopulated}
            className={`px-3.5 py-2 font-bold text-xs sm:text-sm rounded-xl transition border flex items-center gap-1.5 cursor-pointer min-h-[40px] ${
              theme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-yellow-300 hover:text-yellow-200'
                : 'bg-white hover:bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
            }`}
            title={config.btnAutoFill}
          >
            <Wand2 className="w-4 h-4 text-amber-400" />
            <span>{config.btnAutoFill}</span>
          </button>

          {/* ATTACH REFERENCE IMAGE BUTTON */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`px-3.5 py-2 font-bold text-xs sm:text-sm rounded-xl transition border flex items-center gap-1.5 cursor-pointer min-h-[40px] ${
              attachedImage
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                : theme === 'dark'
                  ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-sm'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span>{attachedImage ? (lang === 'vi' ? '✓ Đã đính kèm ảnh' : lang === 'zh' ? '✓ 已附加图片' : lang === 'lo' ? '✓ ໄດ້ແນບຮູບແລ້ວ' : '✓ Image Attached') : config.attachImageLabel}</span>
          </button>
        </div>

        {/* TOGGLE PREVIEW ACCORDION */}
        <button
          type="button"
          onClick={() => setIsPreviewOpen(!isPreviewOpen)}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
        >
          <span>{isPreviewOpen ? config.btnCollapse : config.btnPreview}</span>
          {isPreviewOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ATTACHED IMAGE PREVIEW THUMBNAIL */}
      {attachedImage && (
        <div className="mt-3 p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <img
              src={attachedImage}
              alt="Reference"
              className="w-14 h-14 object-cover rounded-lg border border-emerald-500/50 shadow-sm"
            />
            <div className="text-left">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                <span>📸</span> {lang === 'vi' ? 'Ảnh tham chiếu đã sẵn sàng' : lang === 'zh' ? '参考图片已就绪' : lang === 'lo' ? 'ຮູບອ້າງອີງພ້ອມແລ້ວ' : 'Reference image ready'}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'vi' 
                  ? 'AI sẽ đối chiếu mặt tiền/bản vẽ của ảnh này khi phân tích!' 
                  : lang === 'zh' 
                    ? 'AI 将结合此图片的外观立面或草图进行综合比对分析！' 
                    : lang === 'lo' 
                      ? 'AI ຈະສົມທຽບໜ້າບ້ານ/ແຜນວາດຂອງຮູບນີ້ເວລາວິເຄາະ!' 
                      : 'AI will cross-reference this photo during analysis!'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAttachImage(null)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
            title={config.removeImageLabel}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FULL TEMPLATE PREVIEW ACCORDION */}
      {isPreviewOpen && (
        <div className="mt-3 pt-3 border-t border-amber-500/20 animate-slide-up text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-amber-400">
              {lang === 'vi' ? 'NỘI DUNG CHI TIẾT CÂU LỆNH MẪU:' : lang === 'zh' ? '提示词模板详细内容：' : lang === 'lo' ? 'ເນື້ອໃນລະອຽດຂອງແບບຟອມຄຳສັ່ງ:' : 'FULL PROMPT TEMPLATE PREVIEW:'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono italic">
              {config.hint}
            </span>
          </div>
          <pre className={`p-4 rounded-xl text-xs sm:text-[13px] leading-relaxed font-mono whitespace-pre-wrap max-h-72 overflow-y-auto custom-scrollbar border ${
            theme === 'dark'
              ? 'bg-black/60 border-slate-800 text-slate-200'
              : 'bg-white border-amber-200 text-slate-800 shadow-inner'
          }`}>
            {config.template}
          </pre>
        </div>
      )}
    </div>
  );
};
