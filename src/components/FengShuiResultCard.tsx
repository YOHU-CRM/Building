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
                ? <ul className="space-y-1">{fengShuiAnalysis.favorableGroundbreakingDates.map((d: string, i: number) => <li key={i} className={d.startsWith('📅') ? 'pl-2' : d.startsWith('ℹ️') ? 'text-[12px] font-normal opacity-80 mt-2' : ''}>{d}</li>)}</ul>
                : fengShuiAnalysis.favorableGroundbreakingDates}
            </div>
          </div>
        </div>
      )}

      {/* MƯỢN TUỔI ĐỘNG THỔ (khi gia chủ phạm hạn) — trọng tâm gia chủ, kèm vợ/chồng, luôn có cách làm */}
      {(() => {
        const fa: any = fengShuiAnalysis;
        const adv = String(fa.advice2026 || '');
        const list: any[] = Array.isArray(fa.borrowAgeDetails) ? fa.borrowAgeDetails : [];
        const needBorrow = /^Kết luận:/.test(adv) || (/phạm/.test(adv) && !/không phạm/.test(adv.slice(0, 200)));
        if (!needBorrow || !list.length) return null;
        const conclusion = (adv.match(/^Kết luận:[^.]*\./) || [])[0];
        const box = theme === 'dark' ? 'bg-slate-950/40 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900';
        return (
          <div className={`p-4 rounded-xl border text-xs sm:text-sm ${box}`}>
            <b className="text-sm sm:text-base">🤝 Mượn tuổi động thổ</b>
            {conclusion && <p className="mt-1 p-2 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold">✅ {conclusion}</p>}
            <p className="mt-2 opacity-90">Tool chọn tuổi theo <b>gia chủ</b> là chính: người được mượn phải không phạm hạn năm khởi công và không kỵ gia chủ; sau đó xét thêm tuổi <b>vợ/chồng</b> để báo rõ có hợp hay không.</p>
            <ul className="mt-2 space-y-2">{list.map((d: any, i: number) => (
              <li key={i} className={`p-2 rounded-lg border ${d.tier === 'luu_y' ? 'border-amber-500/40' : 'border-emerald-500/40'}`}>
                <div><b>{d.year} {d.canChi}</b>{d.age ? ` · tuổi mụ ${d.age}` : ''} <span className={`ml-1 px-1.5 py-0.5 rounded text-[11px] font-black ${d.tier === 'luu_y' ? 'bg-amber-500/20 text-amber-600' : 'bg-emerald-500/20 text-emerald-600'}`}>{d.tier === 'luu_y' ? '🟡 Mượn được' : '✅ Nên mượn'}</span></div>
                <div className="mt-1 text-[12px] sm:text-xs leading-relaxed">{d.plain || d.why}</div>
                {d.remedy && <div className="mt-1 text-[12px] sm:text-xs text-amber-600 font-bold">👉 Cách xử lý: {d.remedy}</div>}
                {d.note && <div className="mt-1 text-[11px] opacity-70">ℹ️ {d.note}</div>}
              </li>
            ))}</ul>
            <div className="mt-3">
              <b>Các bước làm lễ khi mượn tuổi</b>
              <ol className="mt-1 list-decimal pl-5 space-y-0.5">
                <li>Nhờ người được mượn tuổi (nam, khỏe mạnh, gia đình êm ấm, ưu tiên người thân) — chọn 1 người ở danh sách trên.</li>
                <li>Đúng ngày giờ tool đề xuất, người đó đứng ra khấn và cuốc nhát đất đầu tiên.</li>
                <li>Lúc đó gia chủ (và người có ghi "tránh mặt") tạm ra xa khu đất; xong lễ thì về bình thường.</li>
                <li>Làm thủ tục "bán nhà" tượng trưng cho người mượn tuổi; đến lễ nhập trạch, gia chủ "mua lại" và về ở.</li>
                <li>Khi đổ mái (cất nóc), nên nhờ lại chính người này đứng lễ.</li>
              </ol>
            </div>
            <p className="mt-2 opacity-70 text-[11px]">Tuổi bị loại: phạm Tam Tai / Kim Lâu / Hoang Ốc năm khởi công, kỵ năm khởi công, hoặc kỵ thẳng với gia chủ, vợ/chồng. Nên nhờ thầy địa phương xem lại trước khi làm lễ.</p>
          </div>
        );
      })()}

      {/* ĐÔNG / TÂY TỨ MỆNH & VỢ CHỒNG KHÁC NHÓM */}
      {((fengShuiAnalysis as any).menhQuaiExplain || ((fengShuiAnalysis as any).spouseAdvice || []).length > 0) && (
        <div className={`p-4 rounded-xl border text-xs sm:text-sm ${theme === 'dark' ? 'bg-slate-950/40 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}>
          <b className="text-sm sm:text-base">🧭 Đông / Tây Tứ Mệnh là gì?</b>
          <p className="mt-1">{(fengShuiAnalysis as any).menhQuaiExplain}</p>
          {((fengShuiAnalysis as any).spouseAdvice || []).length > 0 && (
            <>
              <b className="block mt-3">💑 Vợ chồng khác nhóm — giải pháp cụ thể</b>
              <ul className="mt-1 space-y-1">{(fengShuiAnalysis as any).spouseAdvice.map((a: string, i: number) => <li key={i}>• {a}</li>)}</ul>
            </>
          )}
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
          {(fengShuiAnalysis as any).deepAnalysisCore || fengShuiAnalysis.deepAnalysis}
        </div>
      )}
    </div>
  );
};
