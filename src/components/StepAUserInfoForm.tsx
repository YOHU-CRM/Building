import React, { useState } from 'react';
import PrivacyNotice, { CompanyInfo } from './PrivacyNotice';
import { getDefaultConstructionYear, getCurrentLunarYear, getCanChi } from '../lib/fengshui';
import { UserInfo, FengShuiAnalysis, AIResultReport } from '../types';
import { FengShuiResultCard } from './FengShuiResultCard';

interface StepAUserInfoFormProps {
  theme: 'dark' | 'light';
  t: any;
  clientId: string;
  aiReport: AIResultReport | null;
  isAdminAuthenticated: boolean;
  crmLeads: any[];
  onOpenSavedProfiles: () => void;
  onCreateNewCustomer: () => void;
  userInfo: UserInfo;
  setUserInfo: (updater: UserInfo | ((prev: UserInfo) => UserInfo)) => void;
  setAuthPhone: (phone: string) => void;
  setLoggedUser: (user: string) => void;
  setIsLoggedIn: (loggedIn: boolean) => void;
  goiKichHoat: string;
  triggerFengshuiExport: () => void;
  fengshuiCalculating: boolean;
  fengShuiAnalysis: FengShuiAnalysis | null;
  onProceedStepB: () => void;
  company?: CompanyInfo | null;
  hotline?: string;
  lang?: string;
}

export const StepAUserInfoForm: React.FC<StepAUserInfoFormProps> = ({
  theme,
  t,
  clientId,
  aiReport,
  isAdminAuthenticated,
  crmLeads,
  onOpenSavedProfiles,
  onCreateNewCustomer,
  userInfo,
  setUserInfo,
  setAuthPhone,
  setLoggedUser,
  setIsLoggedIn,
  goiKichHoat,
  triggerFengshuiExport,
  fengshuiCalculating,
  fengShuiAnalysis,
  onProceedStepB,
  company,
  hotline,
  lang = 'vi',
}) => {
  const [showPolicy, setShowPolicy] = useState(false);
  const consented = !!(userInfo as any).consentAt || isAdminAuthenticated;
  const vi = lang === 'vi';
  const needConsent = (fn: () => void) => () => {
    if (!consented) { alert(vi ? 'Vui lòng tích ô đồng ý xử lý dữ liệu cá nhân trước khi tiếp tục.' : 'Please tick the personal-data consent box first.'); return; }
    fn();
  };
  return (
    <div className={`rounded-2xl border ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'} overflow-hidden shadow-md shadow-slate-950/20`}>
      <div 
        className={`flex items-center justify-between p-4 select-none ${theme === 'dark' ? 'bg-[#0f1423]' : 'bg-slate-50'}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 bg-[#a81d1d] text-white rounded-full flex items-center justify-center font-black text-xs">A</span>
          <h2 className={`text-sm sm:text-base font-black tracking-tight ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{t.stepA_title}</h2>
        </div>
      </div>

      <div className={`p-4 sm:p-5 space-y-4 border-t text-xs sm:text-sm ${theme === 'dark' ? 'bg-[#080d1a] border-slate-800' : 'bg-white border-slate-200'}`}>
        {/* Session Identity & New Client Reset action */}
        <div className={`flex flex-wrap items-center justify-between gap-2.5 pb-3 mb-1 border-b border-dashed ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono opacity-75 tracking-wider">ID: <span className="font-black text-amber-500">{clientId}</span></span>
            {aiReport && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                ✓ {t.hasReportBadge || "Đã có báo cáo"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAdminAuthenticated && crmLeads && crmLeads.length > 0 && (
              <button 
                type="button"
                onClick={onOpenSavedProfiles}
                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px]"
                title={t.savedProfilesTooltip || "Xem danh sách hồ sơ khách hàng đã tạo & kết quả"}
              >
                {t.savedProfilesBtn || "📁 Hồ sơ đã lưu"} ({crmLeads.length})
              </button>
            )}
            <button 
              type="button"
              onClick={onCreateNewCustomer}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/15 text-amber-500 hover:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px]"
            >
              ✨ {t.btnAddNewClient}
            </button>
          </div>
        </div>

        {/* Name & Phone inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-1.5 font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>{t.fullName}</label>
            <input 
              type="text"
              value={userInfo.name || ""}
              onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
              placeholder={t.fullNamePlaceholder}
              className={`w-full p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base font-sans border focus:outline-none focus:border-red-500 min-h-[48px] ${theme === 'dark' ? 'bg-[#121829] text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'}`}
            />
          </div>
          <div>
            <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-1.5 font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>
              {t.phoneNumberLabel}
            </label>
            <input 
              type="tel"
              value={userInfo.phone || ""}
              onChange={(e) => {
                const val = e.target.value;
                setUserInfo({ ...userInfo, phone: val });
                setAuthPhone(val);
                setLoggedUser(val);
                if (val.trim()) {
                  setIsLoggedIn(true);
                }
              }}
              placeholder={t.phonePlaceholder || "Ví dụ: 0973 480 488"}
              className={`w-full p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base font-sans border focus:outline-none focus:border-red-500 min-h-[48px] ${theme === 'dark' ? 'bg-[#121829] text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'}`}
            />
          </div>
        </div>

        {/* DOB input */}
        <div>
          <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-1.5 font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>{t.birthDate}</label>
          <input 
            type="date"
            value={userInfo.birthDate || ""}
            onChange={(e) => setUserInfo({ ...userInfo, birthDate: e.target.value })}
            className={`w-full p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base border focus:outline-none focus:border-red-500 min-h-[48px] ${theme === 'dark' ? 'bg-[#121829] text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'}`}
          />
        </div>

        {/* Hour & Gender parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-1.5 font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>{t.birthHour}</label>
            <input 
              type="text"
              value={userInfo.birthHour || ""}
              onChange={(e) => setUserInfo({ ...userInfo, birthHour: e.target.value })}
              placeholder={t.birthHourPlaceholder}
              className={`w-full p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base border focus:outline-none focus:border-red-500 min-h-[48px] ${theme === 'dark' ? 'bg-[#121829] text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'}`}
            />
          </div>
          <div>
            <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-1.5 font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>{t.gender}</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setUserInfo({ ...userInfo, gender: 'nam' })}
                className={`p-3 sm:p-3.5 rounded-xl text-sm sm:text-base font-black border cursor-pointer transition min-h-[48px] ${
                  userInfo.gender === 'nam' 
                    ? 'bg-red-600 text-white border-red-600 shadow-md' 
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                {t.genderMale}
              </button>
              <button 
                type="button"
                onClick={() => setUserInfo({ ...userInfo, gender: 'nu' })}
                className={`p-3 sm:p-3.5 rounded-xl text-sm sm:text-base font-black border cursor-pointer transition min-h-[48px] ${
                  userInfo.gender === 'nu' 
                    ? 'bg-red-600 text-white border-red-600 shadow-md' 
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                {t.genderFemale}
              </button>
            </div>
          </div>
        </div>

        {(goiKichHoat === 'standard' || goiKichHoat === 'design') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <div>
              <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-1.5 font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>{(t as any).spouseBirthYear}</label>
              <input 
                type="number"
                value={(userInfo as any).spouseBirthYear || ""}
                onChange={(e) => setUserInfo({ ...userInfo, spouseBirthYear: e.target.value ? Number(e.target.value) : undefined } as any)}
                placeholder={(t as any).spouseBirthYearPlaceholder}
                className={`w-full p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base border focus:outline-none focus:border-red-500 min-h-[48px] ${theme === 'dark' ? 'bg-[#121829] text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'}`}
              />
            </div>
            <div>
              <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-1.5 font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>{(t as any).spouseGender}</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setUserInfo({ ...userInfo, spouseGender: 'nam' } as any)}
                  className={`p-3 sm:p-3.5 rounded-xl text-sm sm:text-base font-black border cursor-pointer transition min-h-[48px] ${
                    (userInfo as any).spouseGender === 'nam' 
                      ? 'bg-red-600 text-white border-red-600 shadow-md' 
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {(t as any).spouseGenderMale}
                </button>
                <button 
                  type="button"
                  onClick={() => setUserInfo({ ...userInfo, spouseGender: 'nu' } as any)}
                  className={`p-3 sm:p-3.5 rounded-xl text-sm sm:text-base font-black border cursor-pointer transition min-h-[48px] ${
                    (userInfo as any).spouseGender === 'nu' 
                      ? 'bg-red-600 text-white border-red-600 shadow-md' 
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {(t as any).spouseGenderFemale}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desired direction select */}
        <div>
          <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-1.5 font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>{t.desiredDirection}</label>
          <select 
            value={userInfo.desiredDirection || ""}
            onChange={(e) => setUserInfo({ ...userInfo, desiredDirection: e.target.value })}
            className={`w-full p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base border focus:outline-none focus:border-red-500 min-h-[48px] ${theme === 'dark' ? 'bg-[#121829] text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'}`}
          >
            <option value="">-- {t.orientationSelectPlaceholder} --</option>
            <option value="Đông">{t.directionsShort?.east || "Đông"}</option>
            <option value="Tây">{t.directionsShort?.west || "Tây"}</option>
            <option value="Nam">{t.directionsShort?.south || "Nam"}</option>
            <option value="Bắc">{t.directionsShort?.north || "Bắc"}</option>
            <option value="Đông Nam">{t.directionsShort?.southeast || "Đông Nam"}</option>
            <option value="Đông Bắc">{t.directionsShort?.northeast || "Đông Bắc"}</option>
            <option value="Tây Nam">{t.directionsShort?.southwest || "Tây Nam"}</option>
            <option value="Tây Bắc">{t.directionsShort?.northwest || "Tây Bắc"}</option>
          </select>
        </div>

        {/* Năm dự kiến khởi công — dùng để xét Tam Tai, Kim Lâu, Hoang Ốc đúng năm xây */}
        <div>
          <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-1.5 font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>{(t as any).constructionYearLabel || "Năm dự kiến khởi công"}</label>
          <select
            value={userInfo.constructionYear || getDefaultConstructionYear()}
            onChange={(e) => setUserInfo({ ...userInfo, constructionYear: Number(e.target.value) })}
            className={`w-full p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base border focus:outline-none focus:border-red-500 min-h-[48px] ${theme === 'dark' ? 'bg-[#121829] text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'}`}
          >
            {[0, 1, 2, 3].map(k => {
              const y = getCurrentLunarYear() + k;
              return <option key={y} value={y}>{y} ({getCanChi(y)})</option>;
            })}
          </select>
        </div>

        {/* Purpose */}
        <div>
          <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-1.5 font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>{t.purpose}</label>
          <input 
            type="text"
            value={userInfo.purpose || ""}
            onChange={(e) => setUserInfo({ ...userInfo, purpose: e.target.value })}
            placeholder={t.purposePlaceholder}
            className={`w-full p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base font-sans border focus:outline-none focus:border-red-500 min-h-[48px] ${theme === 'dark' ? 'bg-[#121829] text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'}`}
          />
        </div>

        {/* Address */}
        <div>
          <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-1.5 font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>{t.address}</label>
          <input 
            type="text"
            value={userInfo.address || ""}
            onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
            placeholder={t.addressPlaceholder}
            className={`w-full p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base font-sans border focus:outline-none focus:border-red-500 min-h-[48px] ${theme === 'dark' ? 'bg-[#121829] text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'}`}
          />
        </div>

        {/* ĐỒNG Ý XỬ LÝ DỮ LIỆU CÁ NHÂN (Nghị định 13/2023) */}
        <label className={`flex items-start gap-2.5 p-3 rounded-2xl border text-xs sm:text-sm cursor-pointer ${consented ? (theme === 'dark' ? 'border-emerald-700/50 bg-emerald-900/10' : 'border-emerald-300 bg-emerald-50') : (theme === 'dark' ? 'border-amber-600/50 bg-amber-900/10' : 'border-amber-300 bg-amber-50')}`}>
          <input type="checkbox" className="mt-0.5 w-5 h-5 shrink-0" checked={!!(userInfo as any).consentAt}
            onChange={e => setUserInfo({ ...userInfo, consentAt: e.target.checked ? new Date().toISOString() : '' } as any)} />
          <span className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>
            {vi ? <>Tôi đồng ý cho {company?.name || 'Yohu ConsTech'} xử lý thông tin cá nhân ở trên để tính phong thủy, lập dự toán, bản vẽ và liên hệ tư vấn, theo </> : <>I agree that {company?.name || 'Yohu ConsTech'} processes the personal data above to produce my results and contact me, under the </>}
            <button type="button" onClick={e => { e.preventDefault(); setShowPolicy(true); }} className="underline font-bold text-blue-500 cursor-pointer">{vi ? 'Chính sách bảo vệ dữ liệu cá nhân' : 'personal data policy'}</button>.
          </span>
        </label>
        {showPolicy && <PrivacyNotice company={company} hotline={hotline} lang={lang} onClose={() => setShowPolicy(false)} />}

        <button 
          onClick={needConsent(triggerFengshuiExport)}
          disabled={fengshuiCalculating}
          className="w-full mt-2 p-3.5 sm:p-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-sm sm:text-base font-black rounded-2xl transition cursor-pointer shadow-md min-h-[48px]"
        >
          {fengshuiCalculating ? (t.queryingScrolls) : t.btnExportFengshui}
        </button>

        <FengShuiResultCard
          theme={theme}
          t={t}
          fengShuiAnalysis={fengShuiAnalysis}
        />

        {/* Navigation Step B */}
        <button
          type="button"
          onClick={needConsent(onProceedStepB)}
          className="w-full mt-4 p-4 sm:p-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 text-sm sm:text-base shadow-lg shadow-red-700/20 min-h-[50px]"
        >
          {t.btnProceedStepB}
        </button>
      </div>
    </div>
  );
};
