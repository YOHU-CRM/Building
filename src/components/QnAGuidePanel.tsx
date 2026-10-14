import React, { useState } from 'react';
import { qnaGuideData } from '../data/qnaGuideData';

interface QnAGuidePanelProps {
  theme: 'dark' | 'light';
  lang: 'vi' | 'en' | 'lo' | 'zh';
  onSelectQuestion: (question: string) => void;
}

export const QnAGuidePanel: React.FC<QnAGuidePanelProps> = ({
  theme,
  lang,
  onSelectQuestion,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const guide =
    lang === 'vi'
      ? qnaGuideData.vi
      : lang === 'lo'
        ? qnaGuideData.lo
        : lang === 'zh'
          ? qnaGuideData.zh
          : qnaGuideData.en;

  const titleText =
    lang === 'vi'
      ? "HƯỚNG DẪN & CHỦ ĐỀ GỢI Ý ĐỂ HỎI CHUYÊN GIA"
      : lang === 'lo'
        ? "ຄຳແນະນຳ & ຫົວຂໍ້ແນະນຳໃນການຖາມ"
        : lang === 'zh'
          ? "问答指导与建议咨询主题"
          : "ASK EXPERT: DESIGN & FENG SHUI GUIDANCE";

  const btnText = isOpen
    ? lang === 'vi'
      ? "ĐÓNG LẠI"
      : lang === 'zh'
        ? "关闭"
        : lang === 'lo'
          ? "ປິດ"
          : "CLOSE"
    : lang === 'vi'
      ? "BẤM ĐỂ XEM"
      : lang === 'zh'
        ? "展开"
        : lang === 'lo'
          ? "ເປີດ"
          : "EXPAND";

  const instructionText =
    lang === 'vi'
      ? "* Bấm chọn bất kỳ câu mẫu nào dưới đây để tự động điền vào ô câu hỏi, sau đó bạn có thể tùy chỉnh lại theo ý mình trước khi gửi."
      : lang === 'lo'
        ? "* ກົດເລືອກປະໂຫຍກຕົວຢ່າງໃດໜຶ່ງຂ້າງລຸ່ມເພື່ອປ້ອນອັດຕະໂນມັດ, ທ່ານສາມາດປັບແຕ່ງກ່ອນສົ່ງ."
        : lang === 'zh'
          ? "* 点击下方任何示例问题将自动填入输入框，您可在发送前进行个性化修改。"
          : "* Click any example below to fill the input field. You can customize it before sending.";

  return (
    <div className="mt-3.5">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3.5 border rounded-xl transition-all font-bold text-xs sm:text-sm text-left cursor-pointer min-h-[46px] ${
          theme === 'dark'
            ? 'bg-[#0f1423] hover:bg-slate-900 border-slate-800 text-amber-300 hover:text-amber-200 shadow-sm'
            : 'bg-amber-50/50 hover:bg-amber-100/70 border-amber-250 text-amber-900 hover:text-amber-950 shadow-xs'
        }`}
      >
        <span className="flex items-center gap-2">
          <span>💡</span>
          <span>{titleText}</span>
        </span>
        <span
          className={`text-xs uppercase font-mono tracking-wider transition-all px-2.5 py-1 rounded-md font-bold ${
            theme === 'dark' ? 'bg-slate-900 text-slate-300' : 'bg-amber-100 text-amber-900'
          }`}
        >
          {btnText}
        </span>
      </button>

      {isOpen && (
        <div
          className={`mt-2 p-4 sm:p-5 rounded-xl border animate-slide-up text-left space-y-4 ${
            theme === 'dark' ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-white border-amber-100 shadow-md'
          }`}
        >
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium italic">
            {instructionText}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {guide.categories.map((cat, cIdx) => (
              <div
                key={cIdx}
                className={`p-3.5 rounded-xl border ${
                  theme === 'dark' ? 'bg-[#080c15] border-slate-900' : 'bg-slate-50 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-2 font-black text-xs sm:text-sm text-red-500 uppercase tracking-wide">
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </div>
                <ul className="space-y-2">
                  {cat.items.map((item, iIdx) => (
                    <li key={iIdx}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectQuestion(item);
                          const inputEl = document.querySelector(
                            'input[placeholder*="Hỏi về mác"], input[placeholder*="Ví dụ:"]'
                          );
                          if (inputEl) (inputEl as HTMLElement).focus();
                        }}
                        className={`w-full text-left text-xs sm:text-sm leading-relaxed py-1.5 px-2 rounded-lg transition cursor-pointer hover:font-bold ${
                          theme === 'dark'
                            ? 'text-slate-300 hover:bg-slate-900 hover:text-amber-400'
                            : 'text-slate-700 hover:bg-amber-50 hover:text-red-600'
                        }`}
                      >
                        • {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
