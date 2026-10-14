import React from "react";
import { Lock, Unlock, ArrowRight } from "lucide-react";

interface BlurredPreviewImageProps {
  link_anh_phoi_canh?: string;
  packageTier: 'free' | 'standard' | 'design';
  theme?: string;
}

export default function BlurredPreviewImage({ link_anh_phoi_canh, packageTier, theme = 'dark' }: BlurredPreviewImageProps) {
  if (!link_anh_phoi_canh || !link_anh_phoi_canh.trim()) {
    return null;
  }

  const isFree = packageTier === 'free';

  const handleScrollToPricing = () => {
    const el = document.getElementById("pricing-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className={`mt-6 p-5 rounded-2xl border ${
      theme === 'dark' 
        ? 'bg-[#0f1423] border-slate-800' 
        : 'bg-slate-50 border-slate-200'
    } text-left`}>
      <h4 className={`text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2 ${
        theme === 'dark' ? 'text-[#FFD700]' : 'text-rose-600'
      }`}>
        <span>🏛️ Phối Cảnh 3D Ngoại Thất / Thiết Kế Không Gian</span>
      </h4>

      <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/40">
        {/* The Image Container */}
        <div className={`transition-all duration-500 ease-in-out h-[320px] md:h-[450px] w-full`}>
          <img 
            src={link_anh_phoi_canh} 
            alt="Phối cảnh 3D" 
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-700 ${
              isFree ? 'blur-xl scale-105 opacity-60' : 'blur-0 scale-100 opacity-100'
            }`}
          />
        </div>

        {/* Locked Overlay for Free Package */}
        {isFree && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/60 backdrop-blur-[2px] animate-fade-in text-center">
            <div className="w-14 h-14 bg-amber-500/20 border-2 border-amber-500/50 text-[#FFD700] rounded-full flex items-center justify-center mb-4 shadow-xl shadow-amber-500/10 animate-pulse">
              <Lock className="w-6 h-6" />
            </div>

            <h5 className="text-sm md:text-base font-bold text-amber-400 uppercase font-mono tracking-wider mb-2">
              🔒 Phối Cảnh 3D Độc Quyền Đang Bị Khóa
            </h5>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed mb-5">
              Hình ảnh phối cảnh 3D thực tế của công trình đã được thiết kế riêng. Hãy nâng cấp gói dịch vụ để chiêm ngưỡng thiết kế kiến trúc sắc nét không bị mờ.
            </p>

            <button
              onClick={handleScrollToPricing}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <span>🔓 Nâng cấp để xem ảnh rõ nét</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Clear/Unlocked Badge for Premium Users */}
        {!isFree && (
          <div className="absolute top-4 left-4 bg-emerald-500/90 border border-emerald-400/30 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md font-mono">
            <Unlock className="w-3 h-3" />
            <span>MỞ KHÓA RÕ NÉT</span>
          </div>
        )}
      </div>
    </div>
  );
}
