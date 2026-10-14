import React from 'react';
import { FileText, X, Edit3 } from 'lucide-react';

interface SavedProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  t: any;
  lang: 'vi' | 'en' | 'lo' | 'zh';
  crmLeads: any[];
  clientId: string;
  onLoadLead: (lead: any) => void;
}

export const SavedProfilesModal: React.FC<SavedProfilesModalProps> = ({
  isOpen,
  onClose,
  theme,
  t,
  lang,
  crmLeads,
  clientId,
  onLoadLead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl p-6 relative max-h-[85vh] flex flex-col ${
          theme === 'dark'
            ? 'bg-[#0f172a] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-[#FFD700]">
                {t.savedProfilesModalTitle || "Hồ sơ khách hàng & Kết quả đã lưu"}
              </h3>
              <p className="text-xs text-slate-400">
                {t.savedProfilesModalSub ||
                  "Chọn hồ sơ để xem lại hoặc sửa đổi mà vẫn giữ nguyên toàn bộ kết quả đã tạo"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-4 space-y-3 flex-1 custom-scrollbar">
          {(crmLeads || []).length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              {t.savedProfilesEmpty ||
                "Chưa có hồ sơ nào được tạo. Khi bạn nhập thông tin và phân tích, hồ sơ sẽ tự động lưu tại đây."}
            </div>
          ) : (
            (crmLeads || []).map((lead: any, idx: number) => {
              const isCurrent = lead.id === clientId;
              const hasReport = !!(lead.aiReport || lead.aiResult);
              const hasFs = !!(lead.fengShuiAnalysis || lead.fengshui);
              return (
                <div
                  key={lead.id || idx}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                    isCurrent
                      ? theme === 'dark'
                        ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/30'
                        : 'bg-amber-50 border-amber-300 ring-1 ring-amber-200'
                      : theme === 'dark'
                        ? 'bg-[#121829] border-slate-800 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">
                        {lead.userInfo?.name || (t.crmNewClient || "Khách hàng mới")}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {lead.id}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {t.statusActiveProfile || "Đang mở"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                      {lead.userInfo?.phone && <span>📞 {lead.userInfo.phone}</span>}
                      {lead.constructionInfo?.constructionType && (
                        <span>🏠 {lead.constructionInfo.constructionType}</span>
                      )}
                      {lead.constructionInfo?.floors ? (
                        <span>
                          ({lead.constructionInfo.floors} {t.stepB?.floors || "tầng"})
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {hasReport && (
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {t.badgeHasAiReport || "✓ Có báo cáo dự toán AI"}
                        </span>
                      )}
                      {hasFs && (
                        <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                          {t.badgeHasFengShui || "✓ Phong thủy"}
                        </span>
                      )}
                      <span className="text-[9.5px] text-slate-400">
                        {lead.createdAt
                          ? new Date(lead.createdAt).toLocaleDateString(
                              lang === 'vi'
                                ? 'vi-VN'
                                : lang === 'lo'
                                  ? 'lo-LA'
                                  : lang === 'zh'
                                    ? 'zh-CN'
                                    : 'en-US'
                            )
                          : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onLoadLead(lead);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>
                        {isCurrent
                          ? t.btnContinueEditProfile || "Tiếp tục sửa"
                          : t.btnLoadAndViewProfile || "Nạp & Xem kết quả"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            {t.modalCloseBtn || "Đóng"}
          </button>
        </div>
      </div>
    </div>
  );
};
