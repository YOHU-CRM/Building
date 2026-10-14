import React, { useState } from 'react';
import { 
  X, 
  Video, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  Image as ImageIcon, 
  Trash2, 
  Send,
  Eye,
  Film,
  Camera,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export interface VideoPackage {
  id: string;
  code: 'TEASER' | 'STANDARD' | 'ADVANCED' | 'CINEMATIC';
  name: string;
  duration: string;
  desc: string;
  price: number;
  badge?: string;
  highlights: string[];
}

interface VideoUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  t: any;
  lang: 'vi' | 'en' | 'lo' | 'zh';
  videoPackages?: VideoPackage[];
  onActivatePackage: (pkgId: string, orderDetails?: any) => void;
  formatCurrency: (val: number, lang: string) => string;
  currentProjectInfo?: {
    id?: string;
    customerName?: string;
    phone?: string;
    birthYear?: number | string;
    element?: string;
    direction?: string;
    buildingType?: string;
    existingImages?: string[];
  };
}

export const DEFAULT_VIDEO_PACKAGES: VideoPackage[] = [
  {
    id: 'VID-TEASER',
    code: 'TEASER',
    name: 'GÓI 1: VIDEO MỒI (TEASER)',
    duration: '15 – 20 giây',
    desc: 'Fly-through ngoại thất góc nhìn từ trên cao, tạo ấn tượng thị giác ban đầu.',
    price: 200000,
    badge: 'Tiết kiệm',
    highlights: [
      'Fly-through ngoại thất từ trên cao (Fly-cam view)',
      'Góc lia mượt mà toàn cảnh thế đất & hình khối',
      'Định dạng dọc (9:16) & ngang (16:9) chuẩn TikTok/Reels'
    ]
  },
  {
    id: 'VID-01',
    code: 'STANDARD',
    name: 'GÓI 2: VIDEO TIÊU CHUẨN',
    duration: '30 – 45 giây',
    desc: 'Ngoại thất 360°, 2-3 góc nhìn chân thực, nhạc nền & text overlay tên chủ nhà.',
    price: 500000,
    badge: 'Phổ biến',
    highlights: [
      'Quay quét ngoại thất 360° đa góc nhìn',
      '2–3 góc máy cận cảnh chi tiết kiến trúc',
      'Nhạc nền phong thủy + Text overlay tên gia chủ & bản mệnh'
    ]
  },
  {
    id: 'VID-02',
    code: 'ADVANCED',
    name: 'GÓI 3: VIDEO NÂNG CAO',
    duration: '60 – 90 giây',
    desc: 'Ngoại thất + nội thất walkthrough, hiệu ứng ánh sáng ngày/đêm, Voiceover AI.',
    price: 1200000,
    badge: 'Đề xuất',
    highlights: [
      'Trải nghiệm Walkthrough ngoại thất & nội thất liền mạch',
      'Hiệu ứng chuyển đổi ánh sáng Ngày ➔ Hoàng hôn ➔ Đêm',
      'Thuyết minh AI Voiceover chuẩn phong thủy & kiến trúc'
    ]
  },
  {
    id: 'VID-03',
    code: 'CINEMATIC',
    name: 'GÓI 4: VIDEO CINEMATIC PREMIUM',
    duration: '90 – 120 giây',
    desc: 'Full exterior + interior + không gian sống, Drone-style, Title card + CTA + logo.',
    price: 2500000,
    badge: 'VIP Cao Cấp',
    highlights: [
      'Full exterior + interior + tiểu cảnh sân vườn không gian sống',
      'Kỹ xảo Drone-style điện ảnh 4K sắc nét',
      'Title card sang trọng + Call-To-Action + Logo gia chủ riêng'
    ]
  }
];

export const VideoUpsellModal: React.FC<VideoUpsellModalProps> = ({
  isOpen,
  onClose,
  theme,
  t,
  lang,
  videoPackages = DEFAULT_VIDEO_PACKAGES,
  onActivatePackage,
  formatCurrency,
  currentProjectInfo
}) => {
  const [selectedPkg, setSelectedPkg] = useState<VideoPackage>(videoPackages[1] || videoPackages[0]);
  const [showOrderForm, setShowOrderForm] = useState<boolean>(false);

  // Order Form Data
  const [customerName, setCustomerName] = useState<string>(currentProjectInfo?.customerName || "");
  const [phone, setPhone] = useState<string>(currentProjectInfo?.phone || "");
  const [buildingType, setBuildingType] = useState<string>(currentProjectInfo?.buildingType || "Nhà phố");
  const [birthYear, setBirthYear] = useState<string | number>(currentProjectInfo?.birthYear || "");
  const [element, setElement] = useState<string>(currentProjectInfo?.element || "");
  const [direction, setDirection] = useState<string>(currentProjectInfo?.direction || "");
  const [note, setNote] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<string[]>(currentProjectInfo?.existingImages || []);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);

  // Sync initial info if modal opens
  React.useEffect(() => {
    if (isOpen && currentProjectInfo) {
      if (currentProjectInfo.customerName) setCustomerName(currentProjectInfo.customerName);
      if (currentProjectInfo.phone) setPhone(currentProjectInfo.phone);
      if (currentProjectInfo.buildingType) setBuildingType(currentProjectInfo.buildingType);
      if (currentProjectInfo.birthYear) setBirthYear(currentProjectInfo.birthYear);
      if (currentProjectInfo.element) setElement(currentProjectInfo.element);
      if (currentProjectInfo.direction) setDirection(currentProjectInfo.direction);
      if (currentProjectInfo.existingImages && currentProjectInfo.existingImages.length > 0) {
        setUploadedImages(currentProjectInfo.existingImages);
      }
      setOrderSuccess(false);
      setShowOrderForm(false);
    }
  }, [isOpen, currentProjectInfo]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadedImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (idxToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderPayload = {
      packageId: selectedPkg.id,
      packageType: selectedPkg.code,
      packageName: selectedPkg.name,
      price: selectedPkg.price,
      customerName: customerName || "Gia chủ",
      phone: phone || "",
      buildingType: buildingType || "Nhà phố",
      birthYear: birthYear || "",
      element: element || "",
      direction: direction || "",
      note: note || "",
      images: uploadedImages,
      status: "PENDING"
    };

    onActivatePackage(selectedPkg.id, orderPayload);

    setTimeout(() => {
      setIsSubmitting(false);
      setOrderSuccess(true);
      setTimeout(() => {
        setOrderSuccess(false);
        onClose();
      }, 2500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[70] flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto font-sans">
      <div
        className={`w-full max-w-4xl rounded-3xl p-5 sm:p-7 shadow-2xl relative ${
          isDark 
            ? 'bg-[#0a0f1d] border border-slate-800 text-slate-100' 
            : 'bg-white border border-slate-200 text-slate-900'
        } my-auto transition-all max-h-[92vh] overflow-y-auto`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-amber-500 p-2 rounded-full hover:bg-slate-800/20 transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-700/30">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
              <Film className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-amber-500 font-mono">
                  Dịch Vụ Video 3D / VR Trực Quan Công Trình
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Video Studio AI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Biến bản vẽ & ảnh phối cảnh thành video chuyển động 3D chân thực, sắc nét 4K chuẩn phong thủy.
              </p>
            </div>
          </div>

          {!showOrderForm && (
            <button
              type="button"
              onClick={() => setShowOrderForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
            >
              <span>Tiếp tục đặt hàng</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {orderSuccess ? (
          <div className="py-12 px-6 text-center animate-fade-in flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-emerald-400 mb-2">ĐẶT ĐƠN VIDEO 3D THÀNH CÔNG!</h3>
            <p className="text-xs text-slate-300 max-w-md mb-4 leading-relaxed">
              Hồ sơ công trình cùng ảnh phối cảnh đã được chuyển vào danh sách <b>Chờ duyệt (Pending)</b> trong hệ thống Yohu Video Studio. Admin sẽ duyệt và xuất video sớm nhất!
            </p>
            <span className="text-[11px] font-mono bg-slate-800/80 px-3 py-1 rounded-lg text-amber-400 border border-slate-700">
              Gói đã chọn: {selectedPkg.name} ({formatCurrency(selectedPkg.price, lang)})
            </span>
          </div>
        ) : !showOrderForm ? (
          /* STEP 1: 4 PRICING PACKAGES GRID */
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {videoPackages.map((pkg) => {
                const isSelected = selectedPkg.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    className={`rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between relative group ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/15 ring-2 ring-amber-500/40'
                        : isDark
                        ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                        : 'border-slate-200 bg-slate-50 hover:border-amber-300 hover:bg-amber-50/40'
                    }`}
                  >
                    {pkg.badge && (
                      <span className="absolute -top-2.5 right-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-sm">
                        {pkg.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-[11px] font-mono font-bold text-amber-500">
                          {pkg.code}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {pkg.duration}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs uppercase tracking-tight text-slate-100 mb-1 leading-snug">
                        {pkg.name}
                      </h4>

                      <div className="text-base font-black text-amber-400 font-mono my-2">
                        {formatCurrency(pkg.price, lang)}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                        {pkg.desc}
                      </p>

                      {/* Highlights */}
                      <ul className="space-y-1.5 text-[10.5px] text-slate-300 border-t border-slate-800/40 pt-2.5 mb-3">
                        {pkg.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPkg(pkg);
                        setShowOrderForm(true);
                      }}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <span>ĐẶT VIDEO GÓI NÀY</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-slate-300">
                  Đã chọn: <b className="text-amber-400">{selectedPkg.name}</b> ({formatCurrency(selectedPkg.price, lang)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowOrderForm(true)}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition cursor-pointer shrink-0"
              >
                Tiếp Tục Điền Thông Tin & Tải Phối Cảnh ➔
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: ORDER FORM & PERSPECTIVE / BLUEPRINT UPLOAD */
          <form onSubmit={handleSubmitOrder} className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <button
                type="button"
                onClick={() => setShowOrderForm(false)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                ← Quay lại chọn gói khác
              </button>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30">
                {selectedPkg.name} — {formatCurrency(selectedPkg.price, lang)}
              </span>
            </div>

            {/* Client and Project Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Họ Tên Gia Chủ *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ví dụ: Anh Tuấn"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Số Điện Thoại / Zalo *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0973480488"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Loại Công Trình</label>
                <input
                  type="text"
                  value={buildingType}
                  onChange={(e) => setBuildingType(e.target.value)}
                  placeholder="Biệt thự, Nhà phố, Nhà vườn..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Feng Shui Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <div>
                <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Năm Sinh Gia Chủ</label>
                <input
                  type="text"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="Ví dụ: 1985"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Bản Mệnh (Ngũ Hành)</label>
                <input
                  type="text"
                  value={element}
                  onChange={(e) => setElement(e.target.value)}
                  placeholder="Ví dụ: Hải Trung Kim, Thiên Thượng Hỏa..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Hướng Nhà / Đất</label>
                <input
                  type="text"
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  placeholder="Ví dụ: Nam (Sinh Khí)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Image & Blueprint Upload Section */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-dashed border-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Tải Ảnh Phối Cảnh 3D / Bản Vẽ / Mặt Bằng (Tùy Chọn)
                  </span>
                </div>
                <label className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1 w-fit">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Chọn tệp ảnh</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <p className="text-[11px] text-slate-400 mb-3">
                Hệ thống Video Studio sẽ dựa vào ảnh phối cảnh, mặt bằng 2D hoặc bản vẽ để dựng đường bay camera và render hiệu ứng chân thực nhất.
              </p>

              {/* Thumbnails grid */}
              {uploadedImages.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-700 group bg-slate-950">
                      <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-xs font-mono">
                  (Chưa có ảnh tải lên — Video Studio sẽ lấy ảnh 3D có sẵn trong hồ sơ của bạn)
                </div>
              )}
            </div>

            {/* Optional Note */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Ghi chú hoặc yêu cầu góc quay đặc biệt</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Nhấn mạnh góc phòng khách nhìn ra hồ cá Koi, thêm text tên vợ chồng gia chủ..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowOrderForm(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 transition cursor-pointer disabled:opacity-50 uppercase tracking-wider"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "Đang Gửi Đơn..." : `Xác Nhận Đặt ${selectedPkg.name}`}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
