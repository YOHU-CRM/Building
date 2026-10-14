import React from 'react';
import { FengShuiAnalysis } from '../types';

interface FengShuiResultCardProps {
  theme: 'dark' | 'light';
  t: any;
  fengShuiAnalysis: FengShuiAnalysis | null;
}

export const FengShuiResultCard: React.FC<FengShuiResultCardProps> = ({
  theme,
  t,
  fengShuiAnalysis,
}) => {
  if (!fengShuiAnalysis) return null;

  return (
    <div
      className={`mt-4 p-4 sm:p-5 rounded-2xl border text-left animate-fade-in space-y-3.5 shadow-md ${
        theme === 'dark'
          ? 'bg-amber-950/20 border-amber-500/30'
          : 'bg-amber-50/80 border-amber-300/80 text-slate-900'
      }`}
    >
      <div
        className={`flex items-center gap-2 text-sm sm:text-base font-black tracking-wider uppercase font-mono ${
          theme === 'dark' ? 'text-amber-400' : 'text-amber-900'
        }`}
      >
        <span className="animate-pulse">✨</span>
        <span>{t.fengshuiScrollResult}</span>
      </div>

      {/* KẾT LUẬN HƯỚNG NHÀ — trả lời thẳng câu hỏi số 1 của gia chủ */}
      {fengShuiAnalysis.directionVerdict && fengShuiAnalysis.directionVerdict.summary && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm ${
            fengShuiAnalysis.directionVerdict.level === 'chua_chon'
              ? (theme === 'dark' ? 'bg-slate-900/70 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800')
              : fengShuiAnalysis.directionVerdict.isGood
                ? (theme === 'dark' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-900')
                : (theme === 'dark' ? 'bg-red-950/40 border-red-500/40 text-red-200' : 'bg-red-50 border-red-300 text-red-900')
          }`}
        >
          <div className="font-black mb-1">🧭 {fengShuiAnalysis.directionVerdict.summary}</div>
          {Array.isArray(fengShuiAnalysis.directionVerdict.remedy) && fengShuiAnalysis.directionVerdict.remedy.length > 0 && (
            <ul className="list-disc pl-5 space-y-0.5">
              {fengShuiAnalysis.directionVerdict.remedy.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
        <div
          className={`p-3.5 rounded-xl border ${
            theme === 'dark'
              ? 'bg-slate-950/70 border-slate-800/80'
              : 'bg-white border-amber-200/90 shadow-xs'
          }`}
        >
          <span
            className={`block text-xs font-bold mb-1 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {t.niênMệnhLabel}
          </span>
          <span
            className={`font-black font-mono text-sm sm:text-base ${
              theme === 'dark' ? 'text-amber-400' : 'text-amber-800'
            }`}
          >
            {fengShuiAnalysis.element}
          </span>
        </div>
        <div
          className={`p-3.5 rounded-xl border ${
            theme === 'dark'
              ? 'bg-slate-950/70 border-slate-800/80'
              : 'bg-white border-amber-200/90 shadow-xs'
          }`}
        >
          <span
            className={`block text-xs font-bold mb-1 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {t.cungPhiLabel}
          </span>
          <span
            className={`font-black font-mono text-sm sm:text-base ${
              theme === 'dark' ? 'text-emerald-400' : 'text-emerald-800'
            }`}
          >
            {fengShuiAnalysis.cungPhi || "Kim"}
          </span>
        </div>
      </div>

      {/* BẢNG HƯỚNG CÁT, HƯỚNG HUNG, MÀU HỢP MỆNH */}
      <div
        className={`text-sm sm:text-base leading-relaxed font-sans space-y-2.5 p-4 rounded-xl border ${
          theme === 'dark'
            ? 'bg-slate-950/60 border-slate-800/80 text-slate-200'
            : 'bg-white border-slate-200 text-slate-900 shadow-xs'
        }`}
      >
        <div className="flex items-start">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 mt-1.5 shrink-0"></span>
          <div>
            <span
              className={`font-bold mr-1.5 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-800'
              }`}
            >
              {t.auspiciousDirLabel}
            </span>
            <span
              className={`font-black ${
                theme === 'dark' ? 'text-emerald-400' : 'text-emerald-800'
              }`}
            >
              {Array.isArray(fengShuiAnalysis.favorableDirections)
                ? fengShuiAnalysis.favorableDirections.join(", ")
                : fengShuiAnalysis.favorableDirections}
            </span>
          </div>
        </div>
        <div className="flex items-start">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-2 mt-1.5 shrink-0"></span>
          <div>
            <span
              className={`font-bold mr-1.5 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-800'
              }`}
            >
              {t.inauspiciousDirLabel}
            </span>
            <span
              className={`font-semibold ${
                theme === 'dark' ? 'text-red-300' : 'text-red-700'
              }`}
            >
              {Array.isArray(fengShuiAnalysis.unfavorableDirections)
                ? fengShuiAnalysis.unfavorableDirections.join(", ")
                : fengShuiAnalysis.unfavorableDirections}
            </span>
          </div>
        </div>
        {fengShuiAnalysis.favorableColors && (
          <div className="flex items-start">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 mt-1.5 shrink-0"></span>
            <div>
              <span
                className={`font-bold mr-1.5 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-800'
                }`}
              >
                {t.prosperousColorsLabel}
              </span>
              <span
                className={`font-semibold ${
                  theme === 'dark' ? 'text-amber-200' : 'text-slate-900'
                }`}
              >
                {Array.isArray(fengShuiAnalysis.favorableColors)
                  ? fengShuiAnalysis.favorableColors.join(", ")
                  : fengShuiAnalysis.favorableColors}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* THỜI ĐIỂM ĐẠI LỢI KHỞI CÔNG */}
      {fengShuiAnalysis.favorableGroundbreakingDates && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-2.5 ${
            theme === 'dark'
              ? 'bg-slate-950/40 border-amber-500/20 text-amber-300'
              : 'bg-amber-100/70 border-amber-300 text-amber-950 shadow-xs'
          }`}
        >
          <span className="text-xl">📅</span>
          <div>
            <b
              className={`text-sm sm:text-base font-black ${
                theme === 'dark' ? 'text-amber-300' : 'text-amber-950'
              }`}
            >
              {t.idealDateLabel}
            </b>
            <div
              className={`text-xs sm:text-sm font-semibold mt-1 leading-relaxed ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-900'
              }`}
            >
              {Array.isArray(fengShuiAnalysis.favorableGroundbreakingDates)
                ? fengShuiAnalysis.favorableGroundbreakingDates.join("; ")
                : fengShuiAnalysis.favorableGroundbreakingDates}
            </div>
          </div>
        </div>
      )}

      {/* BÀI LUẬN GIẢI PHONG THỦY CHI TIẾT */}
      {fengShuiAnalysis.deepAnalysis && (
        <div
          className={`p-4 sm:p-5 rounded-xl border text-sm sm:text-base leading-relaxed font-normal whitespace-pre-line ${
            theme === 'dark'
              ? 'bg-slate-950/70 border-slate-800/80 text-slate-200'
              : 'bg-white border-slate-200 text-slate-900 shadow-xs'
          }`}
        >
          {fengShuiAnalysis.deepAnalysis}
        </div>
      )}
    </div>
  );
};
