import React from 'react';
import {
  RefreshCw,
  Database,
  Lock,
  Sun,
  Moon,
  User,
  Check,
  RotateCcw,
} from 'lucide-react';
import { UserInfo, ConstructionInfo } from '../types';

interface AppHeaderAndStepsProps {
  t: any;
  lang: 'vi' | 'en' | 'lo' | 'zh';
  setLang: (lang: 'vi' | 'en' | 'lo' | 'zh') => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  isLoggedIn: boolean;
  loggedUser: string;
  onLoginPhoneClick: () => void;
  onLogout: () => void;
  isAdminAuthenticated: boolean;
  onOpenAdminDashboard: () => void;
  onOpenAdminAuth: () => void;
  onSyncAiTools: () => void;
  updatingAiTools: boolean;
  currentStep: string;
  onStepChange: (step: string) => void;
  userInfo: UserInfo;
  constructionInfo: ConstructionInfo;
  aiCredits?: number;
  goiKichHoat?: string;
  onNewProject?: () => void;
}

export const AppHeaderAndSteps: React.FC<AppHeaderAndStepsProps> = ({
  t,
  lang,
  setLang,
  theme,
  setTheme,
  isLoggedIn,
  loggedUser,
  onLoginPhoneClick,
  onLogout,
  isAdminAuthenticated,
  onOpenAdminDashboard,
  onOpenAdminAuth,
  onSyncAiTools,
  updatingAiTools,
  currentStep,
  onStepChange,
  userInfo,
  constructionInfo,
  aiCredits = 20,
  goiKichHoat,
  onNewProject,
}) => {
  return (
    <>
      {/* TOP HEADER CLOCK AND SIGNAL LINES */}
      <div className="statusbar flex items-center justify-between px-6 pt-5 pb-2 text-[12px] font-mono tracking-wide bg-gradient-to-b from-[#10172a] to-transparent text-slate-400 select-none z-10 w-full">
        <span>9:41 AM</span>
        <span className="text-[#FFD700] flex items-center gap-1 font-bold">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-ping" />
          YOHU CLOUD ACTIVE
        </span>
        <span>5G ●●●</span>
      </div>

      {/* PREMIUM DEEP RED BRAND HEADER BAR */}
      <div className="px-5 py-4 lg:px-8 lg:py-6 bg-gradient-to-r from-[#9c1c1c] to-[#730d0d] text-white relative border-b border-red-950/40">
        <div className="flex items-center justify-between mb-1.5 pt-1">
          <div className="flex items-center gap-2.5 lg:gap-3.5">
            <span className="text-[#FFD700] text-xl lg:text-3xl font-extrabold filter drop-shadow">⚒</span>
            <div>
              <h1 className="text-[15.5px] lg:text-2xl xl:text-3xl font-black tracking-tight text-[#FFD700] uppercase font-sans">
                Yohu Build
              </h1>
              <p className="text-[10.5px] lg:text-base text-white/90 font-semibold italic tracking-wide">
                {t.companyName}
              </p>
            </div>
          </div>
          
          {/* UTILITY CONTROL BUTTON GROUPS (LANGUAGES, THEMES, CRM ADMIN) */}
          <div className="flex items-center gap-1.5 lg:gap-2.5">
            {/* New Project / Reset */}
            {onNewProject && (
              <button 
                type="button"
                onClick={onNewProject}
                title="Nhập hồ sơ mới cho khách khác (Làm sạch form)"
                className="p-1.5 px-2.5 lg:p-2.5 lg:px-3 text-amber-300 hover:bg-white/10 bg-black/20 rounded-lg lg:rounded-xl border border-amber-600/40 text-[11px] lg:text-sm font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span className="hidden md:inline font-sans">Nhập Mới</span>
              </button>
            )}

            {/* Synchronize AI Tools and Data */}
            <button 
              type="button"
              onClick={onSyncAiTools}
              disabled={updatingAiTools}
              title={t.syncToolMsg}
              className="p-1.5 lg:p-2.5 text-[#FFD700] hover:bg-white/10 bg-black/20 rounded-lg lg:rounded-xl border border-red-800/40 cursor-pointer transition flex items-center justify-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 lg:w-5 lg:h-5 ${updatingAiTools ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Admin Dashboard Gate */}
            <button 
              type="button"
              onClick={() => {
                if (isAdminAuthenticated) {
                  onOpenAdminDashboard();
                } else {
                  onOpenAdminAuth();
                }
              }}
              title={isAdminAuthenticated ? "Yohu Admin Panel (Đã xác thực)" : "Yohu Admin Panel (Yêu cầu mật khẩu Admin)"}
              className="p-1.5 px-2.5 lg:p-2.5 lg:px-4 text-[#FFD700] hover:bg-white/10 bg-black/20 rounded-lg lg:rounded-xl border border-red-800/40 text-[11px] lg:text-sm font-mono flex items-center gap-1.5 lg:gap-2 cursor-pointer transition"
            >
              {isAdminAuthenticated ? (
                <Database className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-400" />
              )}
              <span className="hidden sm:inline font-sans text-[11px] lg:text-sm font-bold text-amber-400">
                {isAdminAuthenticated ? "Admin ✓" : "Admin 🔒"}
              </span>
            </button>

            {/* Theme switcher */}
            <button 
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 lg:p-2.5 text-[#FFD700] hover:bg-white/10 bg-black/20 rounded-lg lg:rounded-xl border border-red-800/40 cursor-pointer transition"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 lg:w-5 lg:h-5" /> : <Moon className="w-3.5 h-3.5 lg:w-5 lg:h-5" />}
            </button>

            {/* Language Switch Dropdown */}
            <div className="relative">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as 'vi' | 'en' | 'lo' | 'zh')}
                className="px-2.5 py-1 lg:px-3.5 lg:py-2 text-[#FFD700] font-mono font-bold hover:bg-white/10 bg-black/20 rounded-lg lg:rounded-xl border border-red-800/40 text-[11px] lg:text-sm flex items-center gap-1 cursor-pointer transition focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="vi" className="bg-[#121829] text-slate-100 font-bold">🇻🇳 VI</option>
                <option value="lo" className="bg-[#121829] text-slate-100 font-bold">🇱🇦 LO</option>
                <option value="en" className="bg-[#121829] text-slate-100 font-bold">🇺🇸 EN</option>
                <option value="zh" className="bg-[#121829] text-slate-100 font-bold">🇨🇳 ZH</option>
              </select>
            </div>
          </div>
        </div>
        <p className="text-[11.5px] lg:text-base text-red-100 font-sans tracking-tight leading-relaxed font-medium">
          {t.subtitle}
        </p>

        {/* User Authentication & AI Credits Banner */}
        <div className="mt-2.5 lg:mt-3.5 flex flex-col sm:flex-row items-center justify-between text-[12px] lg:text-sm font-mono p-1.5 px-3 bg-black/25 border border-red-800/30 rounded-lg lg:rounded-xl gap-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
            <span>⚡ {t.aiCreditsLabel || 'Tín dụng AI:'}</span>
            {isAdminAuthenticated ? (
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1">
                <span>{t.aiCreditsAdmin || 'Vô hạn ∞ (Admin)'}</span>
              </span>
            ) : (goiKichHoat && goiKichHoat !== 'free') ? (
              <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40 text-[11px] font-semibold flex items-center gap-1">
                <span>{(t.aiCreditsUnlimitedPackage || 'Không giới hạn (Gói {pack})').replace('{pack}', goiKichHoat === 'design' ? (t.packageDesign || 'Thiết Kế') : (t.packageStandard || 'Tiêu Chuẩn'))}</span>
              </span>
            ) : (
              <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${
                aiCredits > 5 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                  : aiCredits > 0 
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' 
                    : 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
              }`}>
                {aiCredits} / 20 {t.aiCreditsTurns || 'lượt'}
              </span>
            )}
          </div>
          {isLoggedIn ? (
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <span className="text-slate-200 truncate max-w-[200px] lg:max-w-[300px]">{t.loggedInAs}{loggedUser}</span>
              <button 
                type="button"
                onClick={onLogout}
                className="text-red-300 hover:text-red-100 font-bold transition cursor-pointer text-[12px] lg:text-sm"
              >
                [{t.logout}]
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <span className="text-slate-300 text-[11.5px] lg:text-sm hidden sm:inline">{t.offlineNotice}</span>
              <button 
                type="button"
                onClick={onLoginPhoneClick}
                className="text-[#FFD700] hover:text-yellow-200 font-bold transition cursor-pointer flex items-center gap-1 text-[12px] lg:text-sm"
              >
                <User className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span>{t.loginPhone}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* THREE DYNAMIC PROGRESS TRACKING CIRCLES */}
      <div className={`flex items-center justify-around px-5 py-3.5 border-b ${theme === 'dark' ? 'bg-[#0f1423] border-slate-800/60' : 'bg-slate-50 border-slate-200'}`}>
        {/* Step A circle indicator */}
        <button 
          type="button"
          onClick={() => onStepChange("A")}
          className="flex flex-col items-center gap-1 border-none focus:outline-none cursor-pointer"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all ${
            userInfo.name && userInfo.birthDate 
              ? "bg-emerald-600 text-white" 
              : "bg-red-600 text-white shadow-md shadow-red-700/20"
          }`}>
            {userInfo.name && userInfo.birthDate ? <Check className="w-4 h-4 stroke-[3px]" /> : "A"}
          </div>
          <span className={`text-[11px] font-bold tracking-tight uppercase ${currentStep === "A" ? "text-red-500" : "text-slate-400"}`}>
            {t.stepA}
          </span>
        </button>

        {/* Connection bar A -> B */}
        <div className="flex-1 h-[2px] bg-red-600/30 max-w-[40px] -mt-5" />

        {/* Step B circle indicator */}
        <button 
          type="button"
          onClick={() => onStepChange("B")}
          className="flex flex-col items-center gap-1 border-none focus:outline-none cursor-pointer"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all ${
            currentStep === "B" 
              ? "bg-red-600 text-white shadow-md shadow-red-700/20" 
              : (constructionInfo.overallDescription ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300")
          }`}>
            {constructionInfo.overallDescription && currentStep !== "B" ? <Check className="w-4 h-4 stroke-[3px]" /> : "B"}
          </div>
          <span className={`text-[11px] font-bold tracking-tight uppercase ${currentStep === "B" ? "text-red-600 font-extrabold" : "text-slate-400"}`}>
            {t.stepB}
          </span>
        </button>

        {/* Connection bar B -> C */}
        <div className="flex-1 h-[2px] bg-red-600/30 max-w-[40px] -mt-5" />

        {/* Step C circle indicator */}
        <button 
          type="button"
          onClick={() => onStepChange("C")}
          className="flex flex-col items-center gap-1 border-none focus:outline-none cursor-pointer"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all ${
            currentStep === "C" ? "bg-red-600 text-white shadow-md shadow-red-700/25" : "bg-slate-700 text-slate-300"
          }`}>
            C
          </div>
          <span className={`text-[11px] font-bold tracking-tight uppercase ${currentStep === "C" ? "text-red-600 font-extrabold" : "text-slate-400"}`}>
            {t.stepC}
          </span>
        </button>
      </div>
    </>
  );
};
