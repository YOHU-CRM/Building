import React, { useState } from 'react';

interface SamplePromptsAccordionProps {
  theme: 'dark' | 'light';
  t: any;
  onApplyPrompt: (promptText: string) => void;
  onShowToast: (msg: string) => void;
}

export const SamplePromptsAccordion: React.FC<SamplePromptsAccordionProps> = ({
  theme,
  t,
  onApplyPrompt,
  onShowToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const samplePrompts: string[] = t.samplePromptsList || [];

  return (
    <div className="mt-2.5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-between w-full ${
          isOpen
            ? 'bg-amber-500/15 border-amber-500 text-amber-500 shadow-xs'
            : theme === 'dark'
              ? 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-750'
              : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
        }`}
      >
        <span className="flex items-center gap-1.5 font-sans">
          <span>{t.samplePromptsTitle || "💡 Câu lệnh mẫu gợi ý (Bấm để xem / sao chép)"}</span>
        </span>
        <span className="text-[11px] font-mono">
          {isOpen
            ? (t.btnCollapseSamplePrompts || "▲ Thu gọn")
            : (t.btnExpandSamplePrompts || "▼ Xem mẫu")}
        </span>
      </button>

      {isOpen && (
        <div
          className={`mt-2 p-3 rounded-2xl border space-y-2 animate-fade-in ${
            theme === 'dark' ? 'bg-[#0f172a] border-slate-750' : 'bg-amber-50/70 border-amber-200'
          }`}
        >
          {samplePrompts.map((promptText: string, idx: number) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition ${
                theme === 'dark'
                  ? 'bg-[#152033] border-slate-700 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <p className="flex-1 font-sans leading-relaxed">"{promptText}"</p>
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(promptText);
                    onShowToast(t.toastPromptCopied || "Đã sao chép câu lệnh mẫu!");
                  }}
                  className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  {t.btnCopyPrompt || "📋 Sao chép"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApplyPrompt(promptText);
                    onShowToast(t.toastPromptCopied || "Đã áp dụng câu lệnh mẫu!");
                  }}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  {t.btnApplyPrompt || "⚡ Áp dụng ngay"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
