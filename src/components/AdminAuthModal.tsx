import React from 'react';
import { X, Lock, Unlock } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  passwordInput: string;
  setPasswordInput: (val: string) => void;
  authError: string | null;
  t: any;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  passwordInput,
  setPasswordInput,
  authError,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-[#0f172a] border-2 border-amber-500/60 rounded-3xl p-6 w-full max-w-md text-slate-100 shadow-2xl relative">
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer p-2 hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-3 mb-3">
          <span className="p-2 bg-amber-500/25 text-[#FFD700] rounded-xl">
            <Lock className="w-6 h-6" />
          </span>
          <h3 className="text-lg font-bold tracking-tight text-[#FFD700] font-sans">
            {t.adminLoginTitle || "Xác thực Quyền Admin"}
          </h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-5">
          {t.adminLoginDesc || "Vui lòng nhập mật khẩu quản trị để mở khóa tính năng CRM, thiết lập bảng tổng hợp vật tư & phân tách nhân công."}
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-300 uppercase font-bold tracking-wider mb-2">
              {t.adminPasswordLabel || "Mật khẩu Admin"}
            </label>
            <input 
              type="password"
              required
              autoFocus
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder={t.adminPasswordPlaceholder || "Nhập mật khẩu..."}
              className="w-full p-3.5 rounded-xl text-base bg-[#101524] border border-slate-700 focus:border-amber-500 focus:outline-none text-slate-100 font-sans tracking-wide shadow-inner"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Chữ viết thường, hoa hoặc ký tự phải khớp với cấu hình Vercel.
            </span>
          </div>
          {authError && (
            <div className="p-3 bg-red-950/50 border border-red-500/40 text-red-300 text-sm rounded-xl font-medium leading-relaxed font-sans shadow-lg whitespace-pre-wrap">
              ⚠️ {authError}
            </div>
          )}
          <button 
            type="submit"
            className="w-full p-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 text-slate-950 font-extrabold rounded-xl text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 uppercase tracking-wider"
          >
            <Unlock className="w-5 h-5" /> {t.adminConfirmBtn || "Mở khóa Admin"}
          </button>
        </form>
      </div>
    </div>
  );
};
