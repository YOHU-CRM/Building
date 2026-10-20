import React, { useState, useEffect, useRef, useMemo } from "react";
import { tinhGiaGoiThietKe } from './lib/pricing';
import { formatCurrency, formatCurrencyNoSymbol, formatCurrencyWithUnit } from './lib/currency';
import { 
  User, 
  HelpCircle, 
  Settings, 
  Eye, 
  Trash2, 
  Maximize2, 
  X, 
  ChevronDown, 
  ChevronRight, 
  PhoneCall, 
  Mail, 
  MapPin, 
  Send, 
  Sparkles, 
  Check, 
  Clock, 
  Globe, 
  Sun, 
  Moon, 
  Database, 
  UploadCloud,
  Layers,
  Building2,
  AlertTriangle,
  Save,
  RefreshCw,
  Copy,
  Video,
  FileText,
  Users,
  Edit3,
  MessageSquare,
  Lock,
  Unlock,
  FolderOpen,
  Film,
  Play,
  ShieldCheck,
  ExternalLink
} from "lucide-react";
import { translations, getTranslation } from "./translations";
import { 
  UserInfo, 
  FengShuiAnalysis, 
  ConstructionInfo, 
  DetailItems, 
  QuestionAnswer, 
  AIResultReport,
  OnboardingData,
  ConstructionInfoExtended,
  UserInfoExtended
} from "./types";
import OnboardingPopup from "./components/OnboardingPopup";
const CrmDashboard = React.lazy(() => import("./components/CrmDashboard"));
import ReportDashboard from "./components/ReportDashboard";
import PricingTableSection from "./components/PricingTableSection";
const DesignTemplateGallery = React.lazy(() => import("./components/DesignTemplateGallery"));
const PerspectiveImageUploader = React.lazy(() => import("./components/PerspectiveImageUploader"));
const FloorPlan2DViewer = React.lazy(() => import("./components/FloorPlan2DViewer"));
import type { PerspectiveOptions, RenderRequest, RenderResult, StudioShot, InteriorRoom } from "./components/PerspectiveStudio";
const PerspectiveStudio = React.lazy(() => import("./components/PerspectiveStudio"));
import type { MassingShot } from "./components/Massing3DViewer";
const AdminSettingsPanel = React.lazy(() => import("./components/AdminSettingsPanel"));
const PaymentsPanel = React.lazy(() => import("./components/AdminOpsPanels").then(m => ({ default: m.PaymentsPanel })));
const StaffPanel = React.lazy(() => import("./components/AdminOpsPanels").then(m => ({ default: m.StaffPanel })));
const ErrorsPanel = React.lazy(() => import("./components/AdminOpsPanels").then(m => ({ default: m.ErrorsPanel })));
const CtvManager = React.lazy(() => import("./components/CtvManager"));
const CtvPortal = React.lazy(() => import("./components/CtvPortal"));
import { listRoomSlots, specOf } from "./lib/roomSpecs";
import { reportError, installErrorReporting, clientSecret } from "./lib/errorReport";
import RoomRequirementsPanel from "./components/RoomRequirementsPanel";
const AdminDesignManager = React.lazy(() => import("./components/AdminDesignManager"));
import CustomerResultsCard, { PerspectiveShot } from "./components/CustomerResultsCard";
import { computeSiteFor, setbacksFor, roomsFor, planDimsFor } from "./lib/siteGeometry";
import { resolveExteriorPalette, wantsSolar } from './lib/exteriorPalette';
import { setQuyDoiCoefficients } from './lib/boqEngine';
import { setDonGiaKhoan } from './lib/unifiedPricing';
// 3D hình khối: tải khi khách mở tab (không làm chậm trang chính)
const Massing3DViewer = React.lazy(() => import("./components/Massing3DViewer"));
const ElevationViewer = React.lazy(() => import("./components/ElevationViewer"));
import { ProjectIntakeUploader } from "./components/ProjectIntakeUploader";
const SpecificationReportModal = React.lazy(() => import("./components/SpecificationReportModal").then(m => ({ default: m.SpecificationReportModal })));
import { STRUCTURAL_OPTIONS } from "./data/structuralOptions";
import { calculateFengShui, translateFengShuiAnalysis, getLunarBirthYear, getDefaultConstructionYear, getCanChi, spouseYearOf, visibleUserInfo } from './lib/fengshui';
import { callGas, fetchVerifiedPackage, adminActivatePackage } from "./lib/gasClient";
import { PaymentRequestModal } from "./components/PaymentRequestModal";
import { SiteConditionsPanel } from "./components/SiteConditionsPanel";
import { generateComprehensiveEstimate } from "./lib/constructionEstimate";
import { applyUnifiedPricing } from "./lib/unifiedPricing";
import { qnaGuideData } from "./data/qnaGuideData";
import { getDefaultsForLang } from "./data/defaultLangData";
import { generateArchitecturalFloorPlanSvg } from './lib/architecturalFloorPlan';
import { SamplePromptsAccordion } from "./components/SamplePromptsAccordion";
import { FengShuiResultCard } from "./components/FengShuiResultCard";
import { StructuralOptionsSection } from "./components/StructuralOptionsSection";
import { QnAGuidePanel } from "./components/QnAGuidePanel";
import { QnAMasterPromptBar } from "./components/QnAMasterPromptBar";
import { StepAUserInfoForm } from "./components/StepAUserInfoForm";
import { AppHeaderAndSteps } from "./components/AppHeaderAndSteps";
import { AdminAuthModal } from "./components/AdminAuthModal";
import { SavedProfilesModal } from "./components/SavedProfilesModal";
const VideoUpsellModal = React.lazy(() => import("./components/VideoUpsellModal").then(m => ({ default: m.VideoUpsellModal })));
const LazyBox = ({ children }: { children: React.ReactNode }) => <React.Suspense fallback={<div className="p-6 text-center text-sm text-slate-400">Đang tải…</div>}>{children}</React.Suspense>;

export default function App() {
  // Locale State (Default to Vietnamese)
  const [lang, setLangState] = useState<'vi' | 'en' | 'lo' | 'zh'>(() => {
    const saved = localStorage.getItem("yohu_lang");
    return (saved as 'vi' | 'en' | 'lo' | 'zh') || 'vi';
  });
  const t = getTranslation(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Colors & Theme (Default to Light Mode as requested; persists manual user selection)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const isManual = localStorage.getItem("yohu_theme_manual");
      if (isManual === "true") {
        const saved = localStorage.getItem("yohu_theme");
        if (saved === 'dark' || saved === 'light') return saved;
      }
    } catch {
      // ignore
    }
    return 'light';
  });

  const handleSetTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    try {
      localStorage.setItem("yohu_theme", newTheme);
      localStorage.setItem("yohu_theme_manual", "true");
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Active step coordinates ('A', 'B', 'C') - aligning with visual progress circles
  const [currentStep, setCurrentStep] = useState<'A' | 'B' | 'C'>('B');

  // AI tools internet synchronization state
  const [updatingAiTools, setUpdatingAiTools] = useState<boolean>(false);
  const [aiUpdateStatus, setAiUpdateStatus] = useState<string | null>(null);

  const triggerUpdateAiTools = () => {
    setUpdatingAiTools(true);
    setAiUpdateStatus(null);
    setTimeout(() => {
      setUpdatingAiTools(false);
      setAiUpdateStatus(t.aiUpdateStatus);
    }, 1500);
  };

  // Accordion parameters matching desktop layout image
  const [openSectionA, setOpenSectionA] = useState<boolean>(false);
  const [openSectionB, setOpenSectionB] = useState<boolean>(true);
  const [openSectionC, setOpenSectionC] = useState<boolean>(false);

  // Sub section accordions inside Section B
  const [openSubConstruction, setOpenSubConstruction] = useState<boolean>(true);
  const [openSubDetails, setOpenSubDetails] = useState<boolean>(false);
  const [showPhoneList, setShowPhoneList] = useState<boolean>(false);

  // --- ADDED FOR VIDEO UPSELL ---
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [videoOrders, setVideoOrders] = useState<any[]>(() => {
    const saved = localStorage.getItem("yohu_video_orders");
    return saved ? JSON.parse(saved) : [];
  });
  const [commissions, setCommissions] = useState<any[]>(() => {
    const saved = localStorage.getItem("yohu_commissions");
    return saved ? JSON.parse(saved) : [];
  });
  const [ctvPartners, setCtvPartners] = useState<any[]>(() => {
    const saved = localStorage.getItem("yohu_ctv_partners");
    return saved ? JSON.parse(saved) : [
      { ma_ctv: "CTV001", loai_doi_tac: "CTV Thường", hh_thoa_thuan: 0 },
      { ma_ctv: "B2B01", loai_doi_tac: "B2B Đối Tác", hh_thoa_thuan: 0 },
      { ma_ctv: "VIP01", loai_doi_tac: "B2B VIP", hh_thoa_thuan: 30 }
    ];
  });
  const [activeAdminTab, setActiveAdminTab] = useState<'leads' | 'videos' | 'commissions' | 'ctv' | 'perspective' | 'samples' | 'settings' | 'payments' | 'staff' | 'errors'>('leads');
  const [adminVideoStatusFilter, setAdminVideoStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [adminVideoSearch, setAdminVideoSearch] = useState<string>("");
  const [floorPlanSvgUrl, setFloorPlanSvgUrl] = useState<string | null>(null);
  const [elevationSvgUrl, setElevationSvgUrl] = useState<string | null>(null);
  const [activeDrawingTab, setActiveDrawingTab] = useState<'floorplan' | 'elevation' | 'massing'>('floorplan');
  const [showCTVDashboard, setShowCTVDashboard] = useState<boolean>(false);
  const [dynamicGasUrl, setDynamicGasUrl] = useState<string>("");

  const [hotline, setHotline] = useState<string>("0973 480 488");
  const [bankInfo, setBankInfo] = useState<string>("");
  const [bankQr, setBankQr] = useState<{ bankId: string; account: string; name: string } | null>(null);
  const [companyInfo, setCompanyInfo] = useState<{ name: string; address: string; email: string; taxCode: string } | null>(null);
  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json())
      .then(data => {
        if (data.gasUrl) setDynamicGasUrl(data.gasUrl);
        if (data.hotline) setHotline(data.hotline);
        if (data.bankInfo) setBankInfo(data.bankInfo);
        if (data.bankQr) setBankQr(data.bankQr);
        if (data.company) setCompanyInfo(data.company);
        if (typeof data.videoOrderEnabled === 'boolean') setVideoOrderEnabled(data.videoOrderEnabled);
        if (typeof data.freePreview3D === 'boolean') setFreePreview3D(data.freePreview3D);
        if (typeof data.serverImageStorage === 'boolean') setServerImageStorage(data.serverImageStorage);
        if (typeof data.ctvCommissionEnabled === 'boolean') setCtvLedgerOn(data.ctvCommissionEnabled);
        if (data.quyDoi && typeof data.quyDoi === 'object') { setQuyDoiCoefficients(data.quyDoi); setPricingRev(v => v + 1); }   // hệ số quy đổi do Admin đặt
        if (data.donGiaKhoan && typeof data.donGiaKhoan === 'object') { setDonGiaKhoan(data.donGiaKhoan); setPricingRev(v => v + 1); }   // đơn giá khoán m² xây dựng (cách 3)
      })
      .catch(err => console.warn("Could not fetch dynamic GAS URL:", err));
  }, []);

  useEffect(() => { installErrorReporting(); }, []);
  // Admin bật/tắt mục video với khách (cài đặt trên máy chủ)
  const [videoOrderEnabled, setVideoOrderEnabled] = useState<boolean>(true);
  // Các công tắc admin (mặc định TẮT, admin bật ở tab ⚙️ Cài đặt)
  const [freePreview3D, setFreePreview3D] = useState<boolean>(false);
  const [pricingRev, setPricingRev] = useState(0);        // tăng khi hệ số quy đổi đổi → tính lại giá          // khách chưa mua được xoay xem 3D (bản xem thử)
  const [serverImageStorage, setServerImageStorage] = useState<boolean>(false); // lưu ảnh phối cảnh lên máy chủ (Firebase Storage)
  const [ctvLedgerOn, setCtvLedgerOn] = useState<boolean>(false);               // máy chủ ghi sổ hoa hồng CTV khi admin xác nhận thu tiền
  const ctvLedgerOnRef = useRef(false);
  useEffect(() => { ctvLedgerOnRef.current = ctvLedgerOn; }, [ctvLedgerOn]);
  const [showCtvPortal, setShowCtvPortal] = useState<boolean>(() => { try { return new URLSearchParams(window.location.search).get('ctv') === 'portal'; } catch { return false; } });

  // CRM Admin dashboard display toggle
  const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(false);

  // Admin authentication states (CRM Gatekeeper)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem("yohu_admin_logged_in") === "true";
  });
  // Tài khoản admin đang đăng nhập (chủ hoặc nhân viên) + quyền
  const [adminMe, setAdminMe] = useState<{ name: string; roles: string[]; owner: boolean } | null>(null);
  useEffect(() => {
    if (!isAdminAuthenticated) { setAdminMe(null); return; }
    fetch("/api/admin/me", { headers: { "x-admin-code": sessionStorage.getItem("yohu_admin_code") || "" } })
      .then(r => r.ok ? r.json() : null).then(d => d && setAdminMe({ name: d.name, roles: d.roles || [], owner: !!d.owner })).catch(() => {});
  }, [isAdminAuthenticated]);
  const canAdmin = (role: string) => !adminMe || adminMe.owner || adminMe.roles.includes(role);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>("");
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);

  // Client Activation Modal
  const [showActivationModal, setShowActivationModal] = useState<boolean>(false);
  const [activationCodeInput, setActivationCodeInput] = useState<string>("");
  const [activationFeedback, setActivationFeedback] = useState<string | null>(null);

  // Gói đã kích hoạt cho khách hiện tại
  // Gói của khách do MÁY CHỦ xác nhận (admin kích hoạt sau khi nhận tiền) — không đọc từ localStorage
  const [goiKichHoat, setGoiKichHoat] = useState<'free' | 'standard' | 'design'>('free');
  // Gói khách đang muốn mua (hiện hộp hướng dẫn thanh toán)
  const [pendingPackage, setPendingPackage] = useState<'standard' | 'design' | null>(null);


// ... inside App component

  // Hàm admin kích hoạt gói → ghi Sheet + lưu local
  const adminKichHoatGoi = async (goi: 'free' | 'standard' | 'design', targetId?: string) => {
    const actId = targetId || clientId;
    const GAS_URL = dynamicGasUrl;
    const goiMap = { free: 'Báo cáo cơ bản', standard: 'Báo cáo đầy đủ', design: 'Báo cáo + Bản vẽ' };
    const giaMap = { free: 0, standard: 299000, design: 1500000 };
    
    let so_tien = giaMap[goi];
    if (goi === 'design') {
        let cInfo = constructionInfo; // Default to current
        if (targetId) {
            // Find lead in CRM
            const savedLeads = localStorage.getItem("yohu_crm_leads");
            if (savedLeads) {
                const leads = JSON.parse(savedLeads);
                const lead = leads.find((l: any) => l.id === actId);
                if (lead) cInfo = lead.constructionInfo;
            }
        }
        if (cInfo) {
            const { dimensions, constructionType, floors } = cInfo;
            const w = parseFloat(dimensions?.split('x')[0] || "0");
            const l = parseFloat(dimensions?.split('x')[1] || "0");
            const dienTichPerFloor = w * l;
            const soTang = parseInt(floors || "1") || 1;
            so_tien = tinhGiaGoiThietKe(dienTichPerFloor, constructionType || 'Bê tông cốt thép truyền thống', soTang);
        }
    }

    try {
      const params = new URLSearchParams({ data: JSON.stringify({
          type: "kich_hoat_goi",
          ma_kh: actId,
          goi_mua: goiMap[goi],
          so_tien: so_tien,
        }) });
      void params; void GAS_URL;
      // Kích hoạt qua máy chủ (cần mã admin) — máy chủ tự ghi Google Sheet
      const act = await adminActivatePackage(actId, goi, so_tien);
      if (!act.ok) {
        alert(`❌ Kích hoạt thất bại: ${act.error || 'không rõ lỗi'}. Hãy đăng nhập Admin lại.`);
        return;
      }

      if (actId === clientId) {
        setGoiKichHoat(goi);
      }

      // Đồng bộ lại vào list leads CRM
      const savedLeads = localStorage.getItem("yohu_crm_leads");
      if (savedLeads) {
        const leads = JSON.parse(savedLeads);
        const idx = leads.findIndex((l: any) => l.id === actId);
        if (idx >= 0) {
          leads[idx].goiMua = goiMap[goi];
          leads[idx].goi_mua = goiMap[goi];
          localStorage.setItem("yohu_crm_leads", JSON.stringify(leads));
          setCrmLeads([...leads]);
        }
      }

      // Server endpoint fallback
      try {
        await fetch(`/api/leads/${actId}/goi`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goi_mua: goiMap[goi],
            trang_thai_pdf: "san_sang_download"
          })
        });
      } catch (e) {}

      alert(`✅ Đã kích hoạt ${goiMap[goi]} thành công!`);
    } catch (err) {
      console.warn("Kích hoạt gói lỗi:", err);
    }
  };

  const handleAdminActivateLeadGoi = (leadId: string, _phone: string, goi: string) => {
    const mapGoi: Record<string, 'free' | 'standard' | 'design'> = {
      'Báo cáo cơ bản': 'free',
      'Báo cáo đầy đủ': 'standard',
      'Báo cáo + Bản vẽ': 'design',
      'free': 'free',
      'standard': 'standard',
      'design': 'design'
    };
    adminKichHoatGoi(mapGoi[goi] || 'standard', leadId);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = adminPasswordInput.trim();
    if (!code) return;

    setAdminAuthError(null);

    try {
      const res = await fetch(`/api/leads?code=${encodeURIComponent(code)}`, {
        method: "GET",
        headers: { "x-admin-code": code }
      });

      if (res.ok) {
        sessionStorage.setItem("yohu_admin_code", code);
        sessionStorage.setItem("yohu_admin_logged_in", "true");
        setIsAdminAuthenticated(true);
        setShowAdminAuthModal(false);
        setShowAdminDashboard(true);
        return;
      } else {
        // Parse custom server errors (e.g. 500, 429, etc.)
        try {
          const data = await res.json();
          if (data) {
            let errorMsg = data.error || "Mã bảo mật Admin không chính xác.";
            if (data.debugInfo) {
              const debug = data.debugInfo;
              errorMsg += `\n\n🔍 [CHẨN ĐOÁN]:\n` +
                `• Biến máy chủ đọc được: ${(debug.keysDetected || []).join(", ") || "KHÔNG CÓ — chưa đặt ADMIN_CODE hoặc chưa Redeploy"}\n` +
                `• Số mật khẩu đã nạp: ${debug.codesLoadedCount ?? 0}\n` +
                `• Độ dài mật khẩu bạn vừa nhập: ${debug.inputLength ?? code.length} ký tự (so với mật khẩu đặt trên Vercel — lệch là do gõ thừa/thiếu dấu cách, chữ hoa/thường)`;
            }
            setAdminAuthError(errorMsg);
            return;
          }
        } catch {}

        if (res.status === 429) {
          setAdminAuthError("Đã nhập sai quá nhiều lần, vui lòng thử lại sau 15 phút.");
        } else {
          setAdminAuthError("Mã bảo mật Admin không chính xác. Vui lòng kiểm tra cấu hình ADMIN_CODE trên Vercel.");
        }
      }
    } catch (err) {
      console.warn("Backend admin verification failed:", err);
      setAdminAuthError("Không kết nối được máy chủ xác thực, vui lòng kiểm tra kết nối mạng và thử lại.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem("yohu_admin_logged_in");
    setShowAdminDashboard(false);
  };

  // Mã kích hoạt được KIỂM TRA TRÊN MÁY CHỦ (mỗi mã dùng 1 lần). Không còn mở gói bằng chữ "299", "TC"...
  const handleApplyActivationCode = async (code: string): Promise<boolean> => {
    const clean = code.trim().toUpperCase();
    if (!clean) return false;
    try {
      const res = await fetch("/api/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, code: clean })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok && data.goi) {
        setGoiKichHoat(data.goi);
        setActivationFeedback("success");
        setTimeout(() => setShowActivationModal(false), 1500);
        return true;
      }
      setActivationFeedback("invalid");
      return false;
    } catch {
      setActivationFeedback("invalid");
      return false;
    }
  };

  // Unique client key for auto persistence
  const [selectedStructuralOptionId, setSelectedStructuralOptionId] = useState<'PA1' | 'PA2' | 'PA3'>('PA3');
  const [showSpecificationModal, setShowSpecificationModal] = useState<boolean>(false);

  const [clientId, setClientId] = useState<string>(() => {
    const savedId = localStorage.getItem("yohu_client_id");
    if (savedId) return savedId;
    const newId = "client_" + Math.random().toString(36).substring(2, 11);
    localStorage.setItem("yohu_client_id", newId);
    return newId;
  });

  const [aiCredits, setAiCredits] = useState<number>(() => {
    const saved = localStorage.getItem("yohu_ai_credits");
    return saved !== null ? Number(saved) : 20;
  });

  const handleNewProjectReset = () => {
    if (window.confirm("Bạn có chắc chắn muốn tạo dự án mới? Thao tác này sẽ làm sạch các thông số và kết quả cũ để nhập hồ sơ mới cho khách hàng khác.")) {
      localStorage.removeItem("yohu_user_info");
      localStorage.removeItem("yohu_construction_info");
      localStorage.removeItem("yohu_detail_items");
      localStorage.removeItem("yohu_ai_report");
      localStorage.removeItem("yohu_fengshui_analysis");
      localStorage.removeItem("yohu_client_id");
      window.location.reload();
    }
  };

  // Default demographic states pre-populating exactly like the user screenshot
  const [userInfo, setUserInfo] = useState<UserInfo>(() => {
    const saved = localStorage.getItem("yohu_user_info");
    const currentLang = (localStorage.getItem("yohu_lang") as 'vi' | 'en' | 'lo' | 'zh') || 'vi';
    const defaults = getDefaultsForLang(currentLang).userInfo;
    return saved ? JSON.parse(saved) : {
      name: defaults.name,
      phone: "0973480488",
      email: "yohu.vn@gmail.com",
      address: defaults.address,
      birthDate: "1985-08-15",
      birthHour: "09:30",
      gender: "nam",
      desiredDirection: defaults.desiredDirection,
      purpose: defaults.purpose
    };
  });

  const [constructionInfo, setConstructionInfo] = useState<ConstructionInfo>(() => {
    const saved = localStorage.getItem("yohu_construction_info");
    const currentLang = (localStorage.getItem("yohu_lang") as 'vi' | 'en' | 'lo' | 'zh') || 'vi';
    const defaults = getDefaultsForLang(currentLang).constructionInfo;
    return saved ? JSON.parse(saved) : {
      overallDescription: defaults.overallDescription,
      constructionType: defaults.constructionType,
      totalBudget: 2000000000,
      budgetUnit: "VND",
      standard: "vietnam",
      dimensions: "10 x 15 m",
      floors: 2,
      loai_ket_cau_chinh: "Bê tông cốt thép truyền thống",
      so_mat_tien: 1,
      thep_hop_cot: "100x100mm",
      loai_mai: "Tôn lạnh",
      loai_san: "Cemboard",
      loai_vach: "Panel EPS",
      loai_tran: "Nhựa Nano",
      rooms: {
        livingRoom: true,
        bedroomCount: 2,
        kitchen: true,
        kitchenType: 'open',
        worshipRoom: false,
        workRoom: false,
        bathroomCount: 2,
        dryingYard: true,
        parkingType: 'yard',
        garage: false,
        garden: false,
        fishPond: false,
        swimmingPool: false,
        entertainmentRoom: false,
        othersCount: ""
      },
      referenceImages: []
    };
  });

  // Auto-persist constructionInfo and userInfo to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("yohu_construction_info", JSON.stringify(constructionInfo));
    } catch (e) {
      // ignore quota errors
    }
  }, [constructionInfo]);

  useEffect(() => {
    try {
      localStorage.setItem("yohu_user_info", JSON.stringify(userInfo));
    } catch (e) {
      // ignore
    }
  }, [userInfo]);

  const [calcMethodModalPkg, setCalcMethodModalPkg] = useState<'coefficient' | 'direct_floor' | null>(null);

  const [detailItems, setDetailItems] = useState<DetailItems>(() => {
    const saved = localStorage.getItem("yohu_detail_items");
    const currentLang = (localStorage.getItem("yohu_lang") as 'vi' | 'en' | 'lo' | 'zh') || 'vi';
    const defaults = getDefaultsForLang(currentLang).detailItems;
    return saved ? JSON.parse(saved) : {
      foundation: defaults.foundation,
      wall: defaults.wall,
      columns: defaults.columns,
      beam: defaults.beam,
      frame: defaults.frame,
      ceiling: defaults.ceiling,
      cementType: defaults.cementType,
      mainDoor: defaults.mainDoor,
      roomDoor: defaults.roomDoor,
      window: defaults.window,
      roof: defaults.roof,
      tiles: defaults.tiles,
      electricsWater: defaults.electricsWater,
      kitchenAppliances: defaults.kitchenAppliances,
      interior: "",
      exterior: "",
      landscape: "",
      fence: "",
      pool: "",
      otherRequests: ""
    };
  });

  const setLang = (newLang: 'vi' | 'en' | 'lo' | 'zh') => {
    localStorage.setItem("yohu_lang", newLang);
    const oldLang = lang;
    setLangState(newLang);

    // Get default values for oldLang and newLang
    const oldDefaults = getDefaultsForLang(oldLang);
    const newDefaults = getDefaultsForLang(newLang);

    // Update userInfo
    setUserInfo(prev => {
      const updated = { ...prev };
      if (prev.name === oldDefaults.userInfo.name) updated.name = newDefaults.userInfo.name;
      if (prev.address === oldDefaults.userInfo.address) updated.address = newDefaults.userInfo.address;
      if (prev.purpose === oldDefaults.userInfo.purpose) updated.purpose = newDefaults.userInfo.purpose;
      if (prev.desiredDirection === oldDefaults.userInfo.desiredDirection) updated.desiredDirection = newDefaults.userInfo.desiredDirection;
      return updated;
    });

    // Update constructionInfo
    setConstructionInfo(prev => {
      const updated = { ...prev };
      if (prev.overallDescription === oldDefaults.constructionInfo.overallDescription) {
        updated.overallDescription = newDefaults.constructionInfo.overallDescription;
      }
      if (prev.constructionType === oldDefaults.constructionInfo.constructionType) {
        updated.constructionType = newDefaults.constructionInfo.constructionType;
      }
      return updated;
    });

    // Update detailItems
    setDetailItems(prev => {
      const updated = { ...prev };
      (Object.keys(oldDefaults.detailItems) as Array<keyof typeof oldDefaults.detailItems>).forEach(key => {
        if (prev[key] === oldDefaults.detailItems[key]) {
          updated[key] = newDefaults.detailItems[key];
        }
      });
      return updated;
    });
  };

  // Client Q&A board history
  const [qnaHistory, setQnaHistory] = useState<QuestionAnswer[]>(() => {
    const saved = localStorage.getItem("yohu_qna_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [attachedChatImage, setAttachedChatImage] = useState<string | null>(null);
  const [qnaLoading, setQnaLoading] = useState<boolean>(false);

  // Core expert reports generated by Gemini
  const [fengShuiAnalysis, setFengShuiAnalysis] = useState<FengShuiAnalysis | null>(() => {
    const saved = localStorage.getItem("yohu_fengshui_analysis");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const userSaved = localStorage.getItem("yohu_user_info");
        // Self-heal stale 1979 entry if it was saved with Dai Lam Moc
        if (userSaved && userSaved.includes("1979") && parsed?.element?.includes("Đại Lâm Mộc")) {
          return null;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [aiReport, setAiReport] = useState<AIResultReport | null>(() => {
    const saved = localStorage.getItem("yohu_ai_report");
    return saved ? JSON.parse(saved) : null;
  });

  // Loading indicator states
  const [fengshuiCalculating, setFengshuiCalculating] = useState<boolean>(false);
  const [exportCalculating, setExportCalculating] = useState<boolean>(false);
  const [imageRendering, setImageRendering] = useState<boolean>(false);
  const [renderedConceptImage, setRenderedConceptImage] = useState<string>("");
  const [conceptError, setConceptError] = useState<string>("");
  const [massingSnapshot, setMassingSnapshot] = useState<string>("");   // ảnh chụp 3D hình khối làm khung cho ảnh phối cảnh
  // Bộ ảnh phối cảnh đã tạo của khách (giữ 6 ảnh gần nhất, lưu trên máy khách)
  const [perspectiveShots, setPerspectiveShots] = useState<PerspectiveShot[]>([]);
  const shotsKey = () => `yohu_perspective_shots_${clientIdRef.current || 'guest'}`;
  /** nén ảnh về JPEG ~1280px (ảnh AI trả về PNG 1–2MB → ~150–250KB) */
  const compressImage = (url: string, max = 1280, q = 0.85) => new Promise<string>(resolve => {
    if (!url.startsWith('data:')) return resolve(url);
    const img = new Image();
    img.onload = () => {
      try {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', q));
      } catch { resolve(url); }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
  /** lưu ảnh lên máy chủ (khi admin bật "Lưu ảnh trên máy chủ") → trả link lâu dài; tắt / lỗi → giữ ảnh trên máy khách */
  const uploadPerspective = async (url: string, meta: { key?: string; label?: string; style?: string; view?: string }) => {
    if (!serverImageStorage || !url.startsWith('data:')) return url;
    try {
      const r = await fetch('/api/perspectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(isAdminAuthenticated ? { 'x-admin-code': sessionStorage.getItem('yohu_admin_code') || '' } : {}) },
        body: JSON.stringify({ clientId: clientIdRef.current, image: url, ...meta })
      });
      const d = await r.json().catch(() => ({}));
      return r.ok && d.url ? String(d.url) : url;
    } catch { return url; }
  };
  const addPerspectiveShot = (url: string, style: string, view: string, label?: string) => {
    const save = (u: string) => setPerspectiveShots(prev => {
      const next = [{ url: u, style, view, label, at: new Date().toISOString() }, ...prev.filter(p => p.url !== u)].slice(0, 9);
      try { localStorage.setItem(shotsKey(), JSON.stringify(next)); } catch { /* bộ nhớ đầy: vẫn giữ trong phiên */ }
      return next;
    });
    compressImage(url).then(u => u.startsWith('data:') ? uploadPerspective(u, { label, style, view }) : u).then(save);
  };
  /* ── Chốt hình khối (5 góc) & video 3D theo từng khách ── */
  const [massingShots, setMassingShots] = useState<MassingShot[]>([]);
  const [massingLockedAt, setMassingLockedAt] = useState<string>("");
  const [localVideo, setLocalVideo] = useState<{ url: string; ext: string } | null>(null);
  const [serverVideoUrl, setServerVideoUrl] = useState<string>("");   // link video admin đã gắn (lưu máy chủ)
  const handleLockMassing = (shots: MassingShot[]) => {
    const at = new Date().toISOString();
    setMassingShots(shots); setMassingLockedAt(at);
    setMassingSnapshot(shots.find(x => x.key === 'corner_l')?.url || shots[0]?.url || '');
    try { localStorage.setItem(`yohu_massing_shots_${clientIdRef.current || 'guest'}`, JSON.stringify({ at, shots })); } catch { /* đầy bộ nhớ */ }
  };
  const scrollToId = (id: string) => setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [missingAlert, setMissingAlert] = useState<string | null>(null);
  const [draftToast, setDraftToast] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // Cloud login state mockup
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("yohu_logged_in") === "true";
  });
  const [loggedUser, setLoggedUser] = useState<string>(() => {
    return localStorage.getItem("yohu_logged_user") || "";
  });
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authPhone, setAuthPhone] = useState<string>("");
  const [onboardingDone, setOnboardingDone] = useState<boolean>(() => {
    return localStorage.getItem("yohu_onboarding_done") === "true";
  });
  const [affiliateData, setAffiliateData] = useState<Record<string, string>>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const data: Record<string, string> = {};
      params.forEach((value, key) => {
        data[key] = value;
      });
      if (Object.keys(data).length > 0) {
        localStorage.setItem("yohu_affiliate_data", JSON.stringify(data));
        return data;
      }
      const saved = localStorage.getItem("yohu_affiliate_data");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [crmLeads, setCrmLeads] = useState<any[]>([]);
  const [showSavedProfilesModal, setShowSavedProfilesModal] = useState<boolean>(false);
  const syncTimeoutRef = useRef<any>(null);

  const userInfoRef = useRef(userInfo);
  const constructionInfoRef = useRef(constructionInfo);
  const detailItemsRef = useRef(detailItems);
  const fengShuiAnalysisRef = useRef(fengShuiAnalysis);
  const aiReportRef = useRef(aiReport);
  const goiKichHoatRef = useRef(goiKichHoat);
  const affiliateDataRef = useRef(affiliateData);
  const langRef = useRef(lang);
  const clientIdRef = useRef(clientId);

  // Báo cáo hiển thị luôn tính lại GIÁ theo dữ liệu hiện tại (cùng hàm với PDF & CRM)
  const pricedAiReport = useMemo(() => {
    if (!aiReport) return aiReport;
    try { return applyUnifiedPricing(aiReport as any, { constructionInfo, userInfo }) as any; } catch { return aiReport; }
  }, [aiReport, constructionInfo, userInfo, pricingRev]);

  // Lấy gói đã được máy chủ xác nhận (khi mở web, đổi khách, hoặc quay lại tab sau khi thanh toán)
  const refreshVerifiedPackage = async (): Promise<'free' | 'standard' | 'design'> => {
    const g = await fetchVerifiedPackage(clientIdRef.current);
    setGoiKichHoat(g);
    return g;
  };
  useEffect(() => {
    refreshVerifiedPackage();
    const onFocus = () => { refreshVerifiedPackage(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // Khách bấm chọn/nâng cấp gói: admin → kích hoạt; khách → hiện hướng dẫn thanh toán
  const requestPackage = (tier: 'free' | 'standard' | 'design') => {
    if (isAdminAuthenticated) { adminKichHoatGoi(tier); return; }
    if (tier === 'free') return;
    if (goiKichHoat === tier || (goiKichHoat === 'design' && tier === 'standard')) return;
    setPendingPackage(tier);
  };

  useEffect(() => { userInfoRef.current = userInfo; }, [userInfo]);
  useEffect(() => { constructionInfoRef.current = constructionInfo; }, [constructionInfo]);
  useEffect(() => { detailItemsRef.current = detailItems; }, [detailItems]);
  useEffect(() => { fengShuiAnalysisRef.current = fengShuiAnalysis; }, [fengShuiAnalysis]);
  useEffect(() => { aiReportRef.current = aiReport; }, [aiReport]);
  useEffect(() => { goiKichHoatRef.current = goiKichHoat; }, [goiKichHoat]);
  useEffect(() => { affiliateDataRef.current = affiliateData; }, [affiliateData]);
  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { clientIdRef.current = clientId; }, [clientId]);
  // ảnh phối cảnh theo từng khách (đổi khách → nạp bộ ảnh của khách đó)
  useEffect(() => {
    let local: PerspectiveShot[] = [];
    try { local = JSON.parse(localStorage.getItem(`yohu_perspective_shots_${clientId || 'guest'}`) || "[]"); } catch { local = []; }
    setPerspectiveShots(local);
    try {
      const m = JSON.parse(localStorage.getItem(`yohu_massing_shots_${clientId || 'guest'}`) || "null");
      setMassingShots(m?.shots || []); setMassingLockedAt(m?.at || "");
      setMassingSnapshot(m?.shots?.[0]?.url || "");
    } catch { setMassingShots([]); setMassingLockedAt(""); }
    setLocalVideo(null); setServerVideoUrl("");
    // ảnh đã lưu trên máy chủ (đổi máy / xóa trình duyệt vẫn còn)
    if (clientId) fetch(`/api/perspectives/${encodeURIComponent(clientId)}`).then(r => r.ok ? r.json() : null).then(d => {
      if (d?.videoUrl) setServerVideoUrl(String(d.videoUrl));
      const list: PerspectiveShot[] = Array.isArray(d?.shots) ? d.shots : [];
      if (!list.length) return;
      setPerspectiveShots(prev => {
        const seen = new Set(prev.map(p => p.url));
        return [...prev, ...list.filter(x => !seen.has(x.url))].sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 9);
      });
    }).catch(() => {});
  }, [clientId]);

  useEffect(() => {
    // If we have a local fengshui analysis, refresh it when language changes to ensure consistency
    if (fengShuiAnalysis && (fengShuiAnalysis as any).isLocal) {
      computeLocalFengshui();
    }
  }, [lang]);

  // Đổi gói làm ẩn/hiện ô tuổi vợ/chồng → tính lại phong thủy để kết quả khớp đúng những gì đang hiển thị
  const spouseVisibleRef = useRef(goiKichHoat !== 'free');
  useEffect(() => {
    const vis = goiKichHoat !== 'free';
    if (vis === spouseVisibleRef.current) return;
    spouseVisibleRef.current = vis;
    if (fengShuiAnalysis && (userInfo as any)?.spouseBirthYear) computeLocalFengshui();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goiKichHoat]);

  // Pre-configured questions inside feng shui playground
  const suggestions = t.suggestions;

  // Computes authentic regional feng shui immediately from birth year input using 60 Hoa Giap & Bat Trach
  const computeLocalFengshui = (customInfo?: any) => {
    const activeInfo = customInfo || userInfo;
    if (!activeInfo.name || !activeInfo.birthDate) return null;
    // Quy đổi năm sinh theo ÂM LỊCH (sinh trước Tết → năm âm lịch trước)
    const year = getLunarBirthYear(activeInfo.birthDate);
    if (isNaN(year) || year < 1920 || year > 2050) return null;

    const calc = calculateFengShui(
      year,
      activeInfo.gender || 'nam',
      activeInfo.desiredDirection,
      spouseYearOf(activeInfo, goiKichHoatRef.current !== 'free'),
      spouseYearOf(activeInfo, goiKichHoatRef.current !== 'free') ? activeInfo.spouseGender : undefined,
      activeInfo.birthHour,
      activeInfo.constructionYear ? Number(activeInfo.constructionYear) : undefined
    );

    const rawResult: FengShuiAnalysis = {
      element: calc.elementDetail,
      cungPhi: calc.cungPhi,
      favorableDirections: calc.favorableDirections,
      unfavorableDirections: calc.unfavorableDirections,
      favorableColors: calc.favorableColors,
      unfavorableColors: calc.unfavorableColors,
      luckyColors: calc.favorableColors,
      favorableGroundbreakingDates: calc.favorableDates2026,
      deepAnalysis: calc.deepAnalysis,
      deepAnalysisCore: calc.deepAnalysisCore,
      canChi: calc.canChi,
      advice2026: calc.advice2026,
      luckyNumbers: calc.luckyNumbers,
      targetYear: calc.targetYear,
      borrowAgeCandidates: calc.borrowAgeCandidates,
      borrowAgeDetails: calc.borrowAgeDetails,
      auspiciousDays: calc.auspiciousDays,
      spouseAdvice: calc.spouseAdvice,
      menhQuaiExplain: calc.menhQuaiExplain,
      directionVerdict: calc.directionVerdict,
      isLocal: true
    };
    
    const localResult = translateFengShuiAnalysis(rawResult, lang);
    
    setFengShuiAnalysis(localResult);
    localStorage.setItem("yohu_fengshui_analysis", JSON.stringify(localResult));
    return localResult;
  };

  // Triggers stepping and expands accordion matching the active button circles
  const handleStepChange = (step: 'A' | 'B' | 'C') => {
    setCurrentStep(step);
    if (step === 'A') {
      setOpenSectionA(true);
      setOpenSectionB(false);
      setOpenSectionC(false);
    } else if (step === 'B') {
      setOpenSectionA(false);
      setOpenSectionB(true);
      setOpenSectionC(false);
    } else {
      setOpenSectionA(false);
      setOpenSectionB(false);
      setOpenSectionC(true);
    }
  };

  // Autosave triggers mirroring user session
  useEffect(() => {
    localStorage.setItem("yohu_user_info", JSON.stringify(userInfo));
    let calculatedFs = null;
    if (userInfo.name && userInfo.birthDate) {
      calculatedFs = computeLocalFengshui();
    }
    syncLeadToServer(undefined, calculatedFs || undefined);
  }, [userInfo]);

  useEffect(() => {
    localStorage.setItem("yohu_construction_info", JSON.stringify(constructionInfo));
    syncLeadToServer();
  }, [constructionInfo]);

  useEffect(() => {
    localStorage.setItem("yohu_detail_items", JSON.stringify(detailItems));
    syncLeadToServer();
  }, [detailItems]);

  useEffect(() => {
    localStorage.setItem("yohu_qna_history", JSON.stringify(qnaHistory));
  }, [qnaHistory]);

  useEffect(() => {
    localStorage.setItem("yohu_logged_in", String(isLoggedIn));
    localStorage.setItem("yohu_logged_user", loggedUser);
  }, [isLoggedIn, loggedUser]);

  // Load submissions inside CRM panel
  const loadLeadsList = async () => {
    try {
      const saved = localStorage.getItem("yohu_crm_leads");
      if (saved) {
        setCrmLeads(JSON.parse(saved));
      }
    } catch (err) {
      console.error("Failed loading leads list:", err);
    }
  };

  // Lưu lead vào localStorage CRM
  const saveLeadLocal = (lead: any) => {
    try {
      const saved = localStorage.getItem("yohu_crm_leads");
      const leads: any[] = saved ? JSON.parse(saved) : [];
      const idx = leads.findIndex((l) => l.id === lead.id);
      if (idx >= 0) {
        leads[idx] = { ...leads[idx], ...lead };
      } else {
        leads.push(lead);
      }
      localStorage.setItem("yohu_crm_leads", JSON.stringify(leads));
      setCrmLeads([...leads]);
    } catch (err) {
      console.error("Failed saving lead local:", err);
    }
  };

  // Gửi CTV vào Google Sheet tab CTV Affiliate
  const syncCTVtoSheet = async (ctvData: Record<string, string>) => {
    if (!ctvData?.ref && !ctvData?.aid) return;
    const GAS_URL = dynamicGasUrl;
    try {
      const params = new URLSearchParams({ data: JSON.stringify({
        type: "ctv_affiliate",
        ma_ctv:       ctvData.ref || ctvData.aid || "",
        utm_source:   ctvData.utm_source || "",
        utm_medium:   ctvData.utm_medium || "",
        utm_campaign: ctvData.utm_campaign || "",
        ngay_truy_cap: new Date().toLocaleDateString("vi-VN"),
      }) });
      await callGas(params);
    } catch (err) {
      console.warn("CTV sync queued:", err);
    }
  };

  // --- BỔ SUNG: LOGIC VIDEO UPSELL ---
  const VIDEO_PACKAGES = [
    {
      id: 'VID-TEASER',
      code: 'TEASER' as const,
      name: 'Gói 1: Video Mồi (Teaser)',
      price: 200000,
      duration: '15 – 20 giây',
      desc: 'Fly-through ngoại thất, góc nhìn từ trên cao.',
      badge: 'Tiết kiệm',
      highlights: [
        'Fly-through ngoại thất từ trên cao',
        'Góc lia mượt mà toàn cảnh thế đất & hình khối',
        'Định dạng chuẩn TikTok/Reels/Shorts'
      ]
    },
    {
      id: 'VID-01',
      code: 'STANDARD' as const,
      name: 'Gói 2: Video Tiêu Chuẩn',
      price: 500000,
      duration: '30 – 45 giây',
      desc: 'Ngoại thất 360°, 2-3 góc nhìn, nhạc nền + text overlay tên chủ nhà.',
      badge: 'Phổ biến',
      highlights: [
        'Ngoại thất 360° quét toàn cảnh',
        '2–3 góc nhìn kiến trúc nổi bật',
        'Nhạc nền + Text overlay tên gia chủ & phong thủy'
      ]
    },
    {
      id: 'VID-02',
      code: 'ADVANCED' as const,
      name: 'Gói 3: Video Nâng Cao',
      price: 1200000,
      duration: '60 – 90 giây',
      desc: 'Ngoại thất + nội thất walkthrough, hiệu ứng ánh sáng ngày/đêm, Voiceover AI.',
      badge: 'Đề xuất',
      highlights: [
        'Walkthrough ngoại thất & nội thất liền mạch',
        'Hiệu ứng ánh sáng Ngày / Hoàng hôn / Đêm',
        'Voiceover AI thuyết minh chuyên nghiệp'
      ]
    },
    {
      id: 'VID-03',
      code: 'CINEMATIC' as const,
      name: 'Gói 4: Video Cinematic Premium',
      price: 2500000,
      duration: '90 – 120 giây',
      desc: 'Full exterior + interior + không gian sống, Drone-style, Title card + CTA + logo chủ nhà.',
      badge: 'VIP Cao Cấp',
      highlights: [
        'Full exterior + interior + không gian sống & sân vườn',
        'Kỹ xảo Drone-style điện ảnh 4K',
        'Title card sang trọng + CTA + Logo gia chủ'
      ]
    }
  ];

  const showVideoPackageSelector = () => {
    setShowVideoModal(true);
  };

  const getPartnerInfo = (refCode: string) => {
    if (!refCode) return { loai_doi_tac: "CTV Thường", hh_thoa_thuan: 0 };
    const found = ctvPartners.find((p: any) => p.ma_ctv.toLowerCase() === refCode.toLowerCase());
    if (found) return found;
    if (refCode.toUpperCase().startsWith('VIP')) return { loai_doi_tac: "B2B VIP", hh_thoa_thuan: 30 };
    if (refCode.toUpperCase().startsWith('B2B')) return { loai_doi_tac: "B2B Đối Tác", hh_thoa_thuan: 0 };
    return { loai_doi_tac: "CTV Thường", hh_thoa_thuan: 0 };
  };

  const calculateVideoCommission = (packageId: string, refCode: string) => {
    const partner = getPartnerInfo(refCode);
    const loai_doi_tac = partner.loai_doi_tac;
    
    const prices: Record<string, number> = {
      'VID-TEASER': 200000,
      'VID-01': 500000,
      'VID-02': 1200000,
      'VID-03': 2500000
    };
    const price = prices[packageId] || 0;
    let amount = 0;

    // ④ Nếu CTV Thường cố tình gửi đơn Video Premium 2.5M -> không tự tính hoa hồng
    if (loai_doi_tac === "CTV Thường" && packageId === 'VID-03') {
      amount = 0;
    } else if (loai_doi_tac === "B2B VIP") {
      // ② Nếu loai_doi_tac = "B2B VIP" → dùng hh_thoa_thuan đã lưu sẵn cho đối tác đó
      const percent = Number(partner.hh_thoa_thuan) || 25;
      amount = price * (percent / 100);
    } else {
      // ③ Nếu loai_doi_tac khác → tra đúng % theo bảng ma trận
      if (loai_doi_tac === "CTV Thường") {
        if (packageId === 'VID-TEASER') amount = price * 0.15;
        else if (packageId === 'VID-01') amount = price * 0.15;
        else if (packageId === 'VID-02') amount = price * 0.20;
      } else if (loai_doi_tac === "B2B Đối Tác") {
        if (packageId === 'VID-02') amount = price * 0.20;
        else if (packageId === 'VID-03') amount = price * 0.25;
        else amount = price * 0.15;
      }
    }

    if (amount > 0 && refCode) {
      const newCommission = {
        id: "COM-" + Math.floor(Math.random() * 1000000),
        refCode,
        packageId,
        amount,
        createdAt: new Date().toISOString(),
        status: "Chờ duyệt"
      };
      
      const savedCommissions = localStorage.getItem("yohu_commissions");
      const currentCommissions = savedCommissions ? JSON.parse(savedCommissions) : [];
      currentCommissions.push(newCommission);
      localStorage.setItem("yohu_commissions", JSON.stringify(currentCommissions));
      setCommissions(currentCommissions);

      const GAS_URL = dynamicGasUrl;
      const params = new URLSearchParams({ data: JSON.stringify({
        type: "hoa_hong",
        ma_ctv: refCode,
        goi_video: packageId,
        so_tien_hh: amount,
        ho_ten_kh: userInfo?.name || "Khách ẩn danh",
        ma_don: "VID-" + Date.now(),
      }) });
      callGas(params).catch(err => console.warn(err));
    }
  };

  const activateVideoPackage = (packageId: string, customId: string, orderDetails?: any) => {
    const refCode = affiliateData?.ref || affiliateData?.aid || "";
    const partner = getPartnerInfo(refCode);
    const isCtvThuongViolating = partner.loai_doi_tac === "CTV Thường" && packageId === 'VID-03';

    const orderId = "VID-" + customId;
    const newOrder = {
      id: orderId,
      projectId: customId,
      customerId: customId,
      packageId,
      packageType: orderDetails?.packageType || (packageId === 'VID-03' ? 'CINEMATIC' : packageId === 'VID-02' ? 'ADVANCED' : packageId === 'VID-TEASER' ? 'TEASER' : 'STANDARD'),
      packageName: orderDetails?.packageName || packageId,
      price: orderDetails?.price || (packageId === 'VID-03' ? 2500000 : packageId === 'VID-02' ? 1200000 : packageId === 'VID-01' ? 500000 : 200000),
      customerName: orderDetails?.customerName || userInfo?.name || "Gia chủ",
      phone: orderDetails?.phone || userInfo?.phone || "",
      buildingType: orderDetails?.buildingType || constructionInfo?.constructionType || "Nhà phố",
      birthYear: orderDetails?.birthYear || (userInfo?.birthDate ? new Date(userInfo.birthDate).getFullYear() : ""),
      element: orderDetails?.element || fengShuiAnalysis?.element || "",
      direction: orderDetails?.direction || userInfo?.desiredDirection || "",
      images: orderDetails?.images || constructionInfo?.referenceImages || (renderedConceptImage ? [renderedConceptImage] : []),
      note: orderDetails?.note || "",
      createdAt: new Date().toISOString(),
      status: isCtvThuongViolating ? "Cần duyệt thủ công" : "PENDING",
      link: ""
    };
    
    const savedOrders = localStorage.getItem("yohu_video_orders");
    const currentOrders = savedOrders ? JSON.parse(savedOrders) : [];
    const existingIdx = currentOrders.findIndex((o: any) => o.id === orderId || o.customerId === customId);
    if (existingIdx >= 0) {
      currentOrders[existingIdx] = { ...currentOrders[existingIdx], ...newOrder };
    } else {
      currentOrders.unshift(newOrder);
    }
    localStorage.setItem("yohu_video_orders", JSON.stringify(currentOrders));
    setVideoOrders([...currentOrders]);

    fetch("/api/video-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-code": sessionStorage.getItem("yohu_admin_code") || "" },
      body: JSON.stringify(newOrder)
    }).catch(console.error);

    // Also update current CRM lead
    const savedLeads = localStorage.getItem("yohu_crm_leads");
    if (savedLeads) {
      const leads = JSON.parse(savedLeads);
      const leadIdx = leads.findIndex((l: any) => l.id === customId);
      if (leadIdx >= 0) {
        leads[leadIdx].videoPackageType = newOrder.packageType;
        leads[leadIdx].videoStatus = "PENDING";
        if (newOrder.images && newOrder.images.length > 0) {
          leads[leadIdx].images = newOrder.images;
        }
        localStorage.setItem("yohu_crm_leads", JSON.stringify(leads));
        setCrmLeads([...leads]);
      }
    }

    const GAS_URL = dynamicGasUrl;
    const params = new URLSearchParams({ data: JSON.stringify({
      type: "video_order",
      ho_ten: newOrder.customerName,
      so_dt: newOrder.phone,
      goi_video: newOrder.packageType,
      so_luong: 1,
      ma_ctv: refCode,
      kenh_giao: "Zalo",
      trang_thai: isCtvThuongViolating ? "Cần duyệt thủ công" : "Chờ xử lý"
    }) });
    callGas(params).catch(err => console.warn(err));
    
    // Máy chủ đã ghi sổ hoa hồng (admin bật) → không tính thêm ở trình duyệt khách, tránh ghi trùng
    if (refCode && !ctvLedgerOnRef.current) {
      calculateVideoCommission(packageId, refCode);
    }
  };
  const updateVideoStatus = (orderId: string, status: string) => {
    const savedOrders = localStorage.getItem("yohu_video_orders");
    const currentOrders = savedOrders ? JSON.parse(savedOrders) : [];
    const idx = currentOrders.findIndex((o: any) => o.id === orderId);
    if (idx >= 0) {
      currentOrders[idx].status = status;
      localStorage.setItem("yohu_video_orders", JSON.stringify(currentOrders));
      setVideoOrders([...currentOrders]);
      
      fetch("/api/video-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-code": sessionStorage.getItem("yohu_admin_code") || "" },
        body: JSON.stringify(currentOrders[idx])
      }).catch(console.error);

      // Update Google Sheet (Video Orders)
      const GAS_URL = dynamicGasUrl;
      const params = new URLSearchParams({ data: JSON.stringify({
        type: "cap_nhat_video",
        ma_don: orderId,
        trang_thai: status,
        link_video: ""
      }) });
      callGas(params).catch(err => console.warn(err));
    }
  };

  const updateCommissionStatus = (comId: string, status: string) => {
    const savedCommissions = localStorage.getItem("yohu_commissions");
    const currentCommissions = savedCommissions ? JSON.parse(savedCommissions) : [];
    const idx = currentCommissions.findIndex((o: any) => o.id === comId);
    if (idx >= 0) {
      currentCommissions[idx].status = status;
      localStorage.setItem("yohu_commissions", JSON.stringify(currentCommissions));
      setCommissions([...currentCommissions]);
      
      // Commented out GAS fetch for update_commission_status since Apps Script manages it natively
      /*
      const GAS_URL = dynamicGasUrl;
      const params = new URLSearchParams({ data: JSON.stringify({
        type: "update_commission_status",
        ma_don: comId,
        trang_thai: status
      }) });
      callGas(params).catch(err => console.warn(err));
      */
    }
  };

  useEffect(() => {
    loadLeadsList();
  }, [showAdminDashboard]);

  // Sync to database
  const syncLeadToServer = async (overrideAiReport?: any, overrideFengshui?: any, overrideUserInfo?: any) => {
    // Debounce to prevent rapid overlapping calls
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const GAS_URL = dynamicGasUrl;

        // Get absolute latest values from refs
        const activeUserInfo = overrideUserInfo || userInfoRef.current;
        const activeConstructionInfo = constructionInfoRef.current;
        const activeDetailItems = detailItemsRef.current;
        const activeFengShui = overrideFengshui || fengShuiAnalysisRef.current;
        const rawAiReport = overrideAiReport || aiReportRef.current;
        // Giá gửi lên CRM/Google Sheet luôn tính lại bằng bộ máy chuẩn (khớp màn hình & PDF)
        let activeAiReport: any = rawAiReport;
        try { if (rawAiReport) activeAiReport = applyUnifiedPricing(rawAiReport as any, { constructionInfo: constructionInfoRef.current, userInfo: overrideUserInfo || userInfoRef.current }); } catch {}
        const activeGoiKichHoat = goiKichHoatRef.current;
        const activeAffiliateData = affiliateDataRef.current;
        const activeLang = langRef.current;
        const activeClientId = clientIdRef.current;

        // Format ngày sinh lấy năm
        const getNamSinh = (dateStr?: string) => {
          if (!dateStr) return "";
          try {
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? dateStr : d.getFullYear();
          } catch { return dateStr; }
        };

        // Format ngày tạo dd/MM/yyyy
        const getNgayTao = () => {
          const d = new Date();
          return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
        };

        const savedOnboarding = localStorage.getItem("yohu_onboarding_data");
        const onboardingData = savedOnboarding ? JSON.parse(savedOnboarding) : null;
        
        // Preserve local lead status if available so we do not overwrite google spreadsheet status back to 'Mới' blindly
        let currentStatus = "Mới";
        try {
          const savedLeads = localStorage.getItem("yohu_crm_leads");
          if (savedLeads) {
            const currentLocalLeads = JSON.parse(savedLeads);
            const existingLead = currentLocalLeads.find((l: any) => l.id === activeClientId);
            if (existingLead?.status || existingLead?.trang_thai) {
              currentStatus = existingLead.status || existingLead.trang_thai;
            }
          }
        } catch {}

        const loaiMongVal = activeAiReport?.structuralAnalysis?.foundation || activeDetailItems?.foundation || "";
        const tietDienCotVal = activeAiReport?.structuralAnalysis?.columns || activeDetailItems?.columns || "";
        const loaiMaiVal = activeAiReport?.structuralAnalysis?.roof || activeDetailItems?.roof || "";
        const macBtMongVal = activeDetailItems?.cementType || "";
        const vatLieuTuongVal = activeDetailItems?.wall || "";
        const hasKetCau = !!(loaiMongVal || tietDienCotVal || loaiMaiVal || macBtMongVal || vatLieuTuongVal);

        const payload: any = {
          type: "khach_hang",
          stt:        activeClientId, // ID Khách hàng thay cho số thứ tự để lưu vào cột A
          ma_kh:      activeClientId, // Hỗ trợ lưu Mã KH đồng nhất với kích hoạt gói
          clientId:   activeClientId,
          id:         activeClientId,
          "ID Khách Hàng": activeClientId,
          ma_khach_hang: activeClientId,
          ngay_tao:   getNgayTao(),
          ho_ten:     activeUserInfo.name || (activeUserInfo.phone ? `Khách hàng ${activeUserInfo.phone}` : "Khách hàng mới"),
          so_dt:      activeUserInfo.phone || "",
          email:      activeUserInfo.email || "",
          dia_chi:    activeUserInfo.address || "",
          nam_sinh:   getNamSinh(activeUserInfo.birthDate) || (onboardingData?.birthYear),
          gioi_tinh:  onboardingData?.gender === "nam" ? "Nam" : (onboardingData?.gender === "nu" ? "Nữ" : (activeUserInfo.gender === "nam" ? "Nam" : "Nữ")),
          menh:       activeFengShui?.element || "",
          loai_ct:    activeConstructionInfo.constructionType || "",
          dien_tich:  activeConstructionInfo.dimensions || "",
          so_tang:    activeConstructionInfo.floors || 1,
          ngan_sach:  activeConstructionInfo.totalBudget || 0,
          don_vi:     activeConstructionInfo.budgetUnit || "VNĐ",
          tieu_chuan: activeConstructionInfo.standard || "VN",
          huong_muon: activeUserInfo.desiredDirection || "",
          huong_tot:  Array.isArray(activeFengShui?.favorableDirections)
                        ? activeFengShui.favorableDirections.join(", ")
                        : (activeFengShui?.favorableDirections || ""),
          goi_mua:    ({ free: 'Báo cáo cơ bản', standard: 'Báo cáo đầy đủ', design: 'Báo cáo + Bản vẽ' }[activeGoiKichHoat] || 'Báo cáo cơ bản'),
          doanh_thu:  ({ free: 0, standard: 299000, design: 1500000 }[activeGoiKichHoat] || 0),
          trang_thai: currentStatus,
          ma_ctv:     activeAffiliateData?.ref || activeAffiliateData?.aid || "",
          quoc_gia:   "Việt Nam",
          vung_mien:  onboardingData?.province ? (
                        /Hà Nội|Hưng Yên|Hải Phòng|Hải Dương|Bắc Ninh|Nam Định|Thái Bình|Ninh Bình|Hà Nam|Vĩnh Phúc/.test(onboardingData.province) ? "Đồng bằng Bắc Bộ" :
                        /Đà Nẵng|Huế|Quảng Nam|Nghệ An/.test(onboardingData.province) ? "Miền Trung" :
                        /TP. Hồ Chí Minh|Bình Dương|Đồng Nai|Cần Thơ|Long An/.test(onboardingData.province) ? "Miền Nam" : "Khác"
                      ) : "",
          loai_dat:   onboardingData?.soilType === "tot" ? "Đất tốt" :
                      onboardingData?.soilType === "yeu" ? "Đất yếu" :
                      onboardingData?.soilType === "cat" ? "Đất cát/pha" :
                      onboardingData?.soilType === "chua_biet" ? "Chưa biết" : (activeConstructionInfo?.soilType || ""),
          phong_cach: onboardingData?.architectureStyle === "hien_dai" ? "Hiện đại" :
                      onboardingData?.architectureStyle === "tan_co_dien" ? "Tân cổ điển" :
                      onboardingData?.architectureStyle === "tropical" ? "Tropical" :
                      onboardingData?.architectureStyle === "truyen_thong" ? "Truyền thống" :
                      onboardingData?.architectureStyle === "toi_gian" ? "Tối giản" :
                      onboardingData?.architectureStyle === "khac" ? "Khác" :
                      (activeDetailItems?.interior || activeDetailItems?.exterior || ""),
          ngon_ngu:   activeLang || "vi"
        };

        if (hasKetCau) {
          payload.ket_cau = {
            loai_mong:      loaiMongVal,
            mac_bt_mong:    macBtMongVal,
            thep_mong:      "",
            tiet_dien_cot:  tietDienCotVal,
            mac_bt_khung:   macBtMongVal,
            loai_mai:       loaiMaiVal,
            vat_lieu_tuong: vatLieuTuongVal,
            xu_ly_dac_thu:  activeAiReport?.structuralAnalysis?.waterproofing || "",
            luu_y_vung_mien: ""
          };
        }

        // Lưu local CRM
        const leadLocal = {
          id: activeClientId,
          userInfo: activeUserInfo,
          fengShuiAnalysis: activeFengShui,
          constructionInfo: activeConstructionInfo,
          detailItems: activeDetailItems,
          aiResult: activeAiReport,
          status: currentStatus,
          goiMua: ({ free: 'Báo cáo cơ bản', standard: 'Báo cáo đầy đủ', design: 'Báo cáo + Bản vẽ' }[activeGoiKichHoat] || 'Báo cáo cơ bản'),
          goi_mua: ({ free: 'Báo cáo cơ bản', standard: 'Báo cáo đầy đủ', design: 'Báo cáo + Bản vẽ' }[activeGoiKichHoat] || 'Báo cáo cơ bản'),
          createdAt: new Date().toISOString(),
          affiliateData: activeAffiliateData
        };
        saveLeadLocal(leadLocal);

        // Lưu hồ sơ lên máy chủ (Firestore) — để CTV, thanh toán, video, ảnh gắn đúng khách. Bỏ ảnh lớn cho nhẹ.
        try {
          const ci: any = { ...(activeConstructionInfo || {}) };
          delete ci.referenceImages; delete ci.sketchImages; delete ci.uploadedImages;
          if (ci.rooms?.sketchLayout?.anh) ci.rooms = { ...ci.rooms, sketchLayout: { ...ci.rooms.sketchLayout, anh: undefined } };
          const fs: any = activeFengShui ? { element: activeFengShui.element, cungPhi: activeFengShui.cungPhi, canChi: activeFengShui.canChi, favorableDirections: activeFengShui.favorableDirections } : null;
          const serverLead = { id: activeClientId, userInfo: activeUserInfo, constructionInfo: ci, fengShuiAnalysis: fs, affiliateData: activeAffiliateData, lang: activeLang, skipSheet: true };
          const body = JSON.stringify(serverLead);
          if (body.length < 700_000) fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-client-secret": clientSecret(), ...(isAdminAuthenticated ? { "x-admin-code": sessionStorage.getItem("yohu_admin_code") || "" } : {}) },
            body
          }).then(r => { if (!r.ok && r.status !== 403) reportError("lead-save", `Lưu hồ sơ lên máy chủ lỗi ${r.status}`); }).catch(() => {});
        } catch (e) { reportError("lead-save", e); }

        // Gửi thẳng GAS_URL qua GET + mode:no-cors (dùng biến payload đã build sẵn trong hàm)
        const params = new URLSearchParams({ data: JSON.stringify(payload) });
        callGas(params).catch(err => console.warn(err));

        // Gửi CTV nếu có
        if (activeAffiliateData && Object.keys(activeAffiliateData).length > 0) {
          syncCTVtoSheet(activeAffiliateData);
        }
      } catch (err) {
        console.warn("CRM auto sync currently queued. Offline caching active.");
      }
    }, 500);
  };

  // Safely archives the current client session so no calculation or report is ever lost
  const archiveCurrentSession = () => {
    if (userInfo.name || userInfo.phone || aiReport || fengShuiAnalysis) {
      const leadToArchive = {
        id: clientId,
        userInfo: { ...userInfo },
        constructionInfo: { ...constructionInfo },
        detailItems: { ...detailItems },
        fengShuiAnalysis: fengShuiAnalysis,
        aiReport: aiReport,
        aiResult: aiReport,
        goiMua: ({ free: 'Báo cáo cơ bản', standard: 'Báo cáo đầy đủ', design: 'Báo cáo + Bản vẽ' }[goiKichHoat] || 'Báo cáo cơ bản'),
        status: "new",
        createdAt: new Date().toISOString(),
        renderedConceptImage: renderedConceptImage || ""
      };
      saveLeadLocal(leadToArchive);
    }
  };

  // Loads a previous client profile and restores all generated results intact
  const handleLoadLead = (lead: any) => {
    if (!lead) return;
    archiveCurrentSession();

    if (lead.id) {
      setClientId(lead.id);
      localStorage.setItem("yohu_client_id", lead.id);
    }
    if (lead.userInfo) {
      setUserInfo(lead.userInfo);
      localStorage.setItem("yohu_user_info", JSON.stringify(lead.userInfo));
    }
    if (lead.constructionInfo) {
      setConstructionInfo(lead.constructionInfo);
      localStorage.setItem("yohu_construction_info", JSON.stringify(lead.constructionInfo));
    }
    if (lead.detailItems) {
      setDetailItems(lead.detailItems);
      localStorage.setItem("yohu_detail_items", JSON.stringify(lead.detailItems));
    }
    const fs = lead.fengShuiAnalysis || lead.fengshui;
    if (fs) {
      setFengShuiAnalysis(fs);
      localStorage.setItem("yohu_fengshui_analysis", JSON.stringify(fs));
    }
    const report = lead.aiReport || lead.aiResult;
    if (report) {
      setAiReport(report);
      localStorage.setItem("yohu_ai_report", JSON.stringify(report));
      // Auto open Step C so the user can immediately view their results intact
      setOpenSectionA(false);
      setOpenSectionB(false);
      setOpenSectionC(true);
      setCurrentStep('C');
    } else {
      setOpenSectionA(true);
      setCurrentStep('A');
    }
    if (lead.renderedConceptImage) {
      setRenderedConceptImage(lead.renderedConceptImage);
    }

    setDraftToast(`✅ Đã nạp hồ sơ: ${lead.userInfo?.name || lead.id} với toàn bộ kết quả!`);
    setTimeout(() => setDraftToast(null), 3500);
  };

  const handleApplyExtractedData = (data: any) => {
    // Hướng nhà: khách ghi riêng, hoặc chữ hướng viết trên bản vẽ tay (vd "H Nam" dưới cửa chính)
    const hpt = String(data.bo_tri_phac_thao?.co_phac_thao !== false ? (data.bo_tri_phac_thao?.huong_mat_tien || '') : '').trim();
    const huongTuPhacThao = hpt.length <= 12 && /^(bắc|nam|đông|tây)/i.test(hpt) ? hpt : '';
    if (data.ho_ten || data.so_dt || data.dia_chi || data.huong_muon || huongTuPhacThao) {
      setUserInfo((prev) => ({
        ...prev,
        name: data.ho_ten || prev.name,
        phone: data.so_dt || prev.phone,
        address: data.dia_chi || prev.address,
        desiredDirection: data.huong_muon || huongTuPhacThao || prev.desiredDirection
      }));
    }
    // Kích thước đất từ sổ đỏ: dùng bề rộng TRUNG BÌNH nếu nở hậu / tóp hậu
    const kd = data.kich_thuoc_dat || {};
    const wF = parseFloat(String(kd.rong_truoc ?? '').replace(',', '.')), wB = parseFloat(String(kd.rong_sau ?? '').replace(',', '.')), dL = parseFloat(String(kd.dai ?? '').replace(',', '.'));
    const avgW = !isNaN(wF) && wF > 0 ? (!isNaN(wB) && wB > 0 ? Math.round((wF + wB) / 2 * 10) / 10 : wF) : NaN;
    const dimsFromLot = !isNaN(avgW) && !isNaN(dL) && dL > 0 ? `${avgW}x${dL}` : '';
    // Ưu tiên kích thước NHÀ XÂY (mô tả của gia chủ > bản vẽ); kích thước đất chỉ dùng khi không có số đo nhà
    const kn = data.kich_thuoc_nha || {};
    const hw = parseFloat(String(kn.rong ?? '').replace(',', '.')), hl = parseFloat(String(kn.dai ?? '').replace(',', '.'));
    const dimsFromHouse = hw > 0 && hl > 0 ? `${hw}x${hl}` : '';
    setConstructionInfo((prev: any) => ({
      ...prev,
      constructionType: data.loai_ct || prev.constructionType,
      dimensions: dimsFromHouse || dimsFromLot || data.dien_tich || prev.dimensions,
      dimensionsKind: dimsFromHouse ? 'nha' : dimsFromLot ? 'dat' : (prev as any).dimensionsKind,
      soilType: data.loai_dat && data.loai_dat !== 'chua_biet' ? data.loai_dat : prev.soilType,
      frontSetbackM: data.khoang_lui_truoc ?? prev.frontSetbackM,
      backSetbackM: data.khoang_lui_sau ?? prev.backSetbackM,
      rooms: {
        ...(prev.rooms || {}),
        ...(Number(data.so_phong_ngu) > 0 ? { bedroomCount: Number(data.so_phong_ngu) } : {}),
        ...(Number(data.so_wc) > 0 ? { bathroomCount: Number(data.so_wc) } : {}),
        ...(typeof data.phong_tho === 'boolean' ? { worshipRoom: data.phong_tho } : {}),
        // Gara: ô tích trên giao diện là nguồn đúng — mô tả có "gara/ô tô" thì TÍCH ô cho khách thấy; không nhắc thì giữ nguyên lựa chọn của khách
        ...(data.gara === 'oto' ? { garage: true, parkingType: 'garage' } : data.gara === 'khong' ? { garage: false, parkingType: 'none' } : {}),
        // Bố trí theo phác thảo tay (bộ vẽ mặt bằng đọc trường này)
        sketchLayout: data.bo_tri_phac_thao && Array.isArray(data.bo_tri_phac_thao.tang) && data.bo_tri_phac_thao.tang.length ? data.bo_tri_phac_thao : (prev.rooms || {}).sketchLayout
      },
      floors: Number(data.so_tang) || prev.floors,
      totalBudget: data.ngan_sach ? parseFloat(data.ngan_sach) || prev.totalBudget : prev.totalBudget,
      loai_ket_cau_chinh: data.loai_ket_cau_chinh || prev.loai_ket_cau_chinh || "Bê tông cốt thép truyền thống",
      so_mat_tien: Number(data.so_mat_tien) || prev.so_mat_tien || 1,
      thep_hop_cot: data.thep_hop_cot || prev.thep_hop_cot || "100x100mm",
      loai_mai: data.loai_mai || prev.loai_mai || "",
      loai_san: data.loai_san || prev.loai_san || "Cemboard",
      loai_vach: data.loai_vach || prev.loai_vach || "Panel EPS",
      loai_tran: data.loai_tran || prev.loai_tran || "Nhựa Nano",
      overallDescription: data.phong_cach ? `Phong cách: ${data.phong_cach}. ${prev.overallDescription || ""}` : prev.overallDescription
    }));
  };

  // Resets the inputs and starts a fresh new customer session while archiving previous results safely
  const handleCreateNewCustomer = () => {
    // Safely archive previous profile so no generated result is lost
    archiveCurrentSession();

    const newId = "KH_" + Math.floor(100000 + Math.random() * 900000);
    setClientId(newId);
    localStorage.setItem("yohu_client_id", newId);

    setUserInfo({
      name: "",
      phone: "",
      email: "",
      address: "",
      birthDate: "",
      birthHour: "",
      gender: "nam",
      desiredDirection: "",
      purpose: ""
    });

    setConstructionInfo({
      overallDescription: "",
      constructionType: "Nhà phố",
      totalBudget: 0,
      budgetUnit: "VNĐ",
      standard: "VN",
      dimensions: "",
      floors: 1,
      loai_ket_cau_chinh: "Bê tông cốt thép truyền thống",
      so_mat_tien: 1,
      thep_hop_cot: "100x100mm",
      loai_mai: "Tôn lạnh",
      loai_san: "Cemboard",
      loai_vach: "Panel EPS",
      loai_tran: "Nhựa Nano",
      rooms: {
        livingRoom: false,
        bedroomCount: 0,
        kitchen: false,
        worshipRoom: false,
        bathroomCount: 0,
        garage: false,
        garden: false,
        fishPond: false,
        swimmingPool: false,
        entertainmentRoom: false,
        othersCount: ""
      },
      referenceImages: []
    });

    setDetailItems({
      foundation: "",
      wall: "",
      columns: "",
      beam: "",
      frame: "",
      ceiling: "",
      cementType: "",
      mainDoor: "",
      roomDoor: "",
      window: "",
      roof: "",
      tiles: "",
      electricsWater: "",
      kitchenAppliances: "",
      interior: "",
      exterior: "",
      landscape: "",
      fence: "",
      pool: "",
      otherRequests: ""
    });

    setFengShuiAnalysis(null);
    setAiReport(null);
    setGoiKichHoat("free");
    setRenderedConceptImage("");

    localStorage.removeItem("yohu_user_info");
    localStorage.removeItem("yohu_construction_info");
    localStorage.removeItem("yohu_detail_items");
    localStorage.removeItem("yohu_fengshui_analysis");
    localStorage.removeItem("yohu_ai_report");
    localStorage.removeItem("yohu_goi_kich_hoat");
    localStorage.removeItem("yohu_onboarding_done");
    localStorage.removeItem("yohu_onboarding_data");

    setDraftToast(t.toastNewClientReady || "Hồ sơ mới đã sẵn sàng. Hồ sơ trước đã được lưu an toàn!");
    setTimeout(() => setDraftToast(null), 3500);
  };

  // Temporary local manual draft saver triggers
  const executeDraftSave = () => {
    localStorage.setItem("yohu_user_info", JSON.stringify(userInfo));
    localStorage.setItem("yohu_construction_info", JSON.stringify(constructionInfo));
    localStorage.setItem("yohu_detail_items", JSON.stringify(detailItems));
    syncLeadToServer();

    // Trigger local direct download of the draft file on computer or phone
    try {
      const backupObj = {
        appName: "Yohu AI Build",
        savedAt: new Date().toLocaleString(),
        userInfo,
        constructionInfo,
        detailItems,
        aiReport,
        fengShuiAnalysis
      };
      const jsonStr = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = (userInfo.name || "KhachHang").trim().replace(/[^a-zA-Z0-9 Vietnamese_]/g, "").replace(/\s+/g, "_");
      link.href = url;
      link.download = `Yohu_Draft_${safeName}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Could not download file:", err);
    }
    
    const timeNow = new Date().toLocaleTimeString();
    setDraftToast(`${t.toastDraftSaved || "Đã lưu bản nháp vào thiết bị!"} ${timeNow}!`);
    setTimeout(() => setDraftToast(null), 3500);
  };

  // Restores user info and construction parameters from a local file backup (.json)
  const handleImportDraftFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.userInfo) {
            setUserInfo(data.userInfo);
            localStorage.setItem("yohu_user_info", JSON.stringify(data.userInfo));
          }
          if (data.constructionInfo) {
            setConstructionInfo(data.constructionInfo);
            localStorage.setItem("yohu_construction_info", JSON.stringify(data.constructionInfo));
          }
          if (data.detailItems) {
            setDetailItems(data.detailItems);
            localStorage.setItem("yohu_detail_items", JSON.stringify(data.detailItems));
          }
          if (data.aiReport) {
            setAiReport(data.aiReport);
          }
          if (data.fengShuiAnalysis) {
            setFengShuiAnalysis(data.fengShuiAnalysis);
          }
          setDraftToast("✅ Đã khôi phục hồ sơ nháp thành công từ tệp tin!");
          setTimeout(() => setDraftToast(null), 3500);
        } catch (err) {
          alert("Tệp tin nháp không đúng định dạng hoặc bị lỗi!");
        }
      };
      reader.readAsText(file);
    }
  };

  // Photo handlers converting uploads to Base64 strings
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = (Array.from(e.target.files) as File[]).filter(f => f.type.startsWith('image/')).slice(0, 6);
      // Thu nhỏ ảnh (cạnh dài ≤ 1280px, JPEG) để lưu được trên máy và gửi AI nhanh
      const shrink = (file: File) => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const src = reader.result as string;
          const img = new Image();
          img.onload = () => {
            const k = Math.min(1, 1280 / Math.max(img.width, img.height));
            const c = document.createElement('canvas');
            c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
            c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
            resolve(c.toDataURL('image/jpeg', 0.85));
          };
          img.onerror = () => resolve(src);
          img.src = src;
        };
        reader.readAsDataURL(file);
      });
      filesArray.forEach(async (file) => {
        const url = await shrink(file);
        setConstructionInfo((prev) => {
          const updated = { ...prev, referenceImages: [...(prev.referenceImages || []), url].slice(-6) };
          try { localStorage.setItem("yohu_construction_info", JSON.stringify(updated)); } catch { /* bộ nhớ trình duyệt đầy: vẫn giữ ảnh trong phiên */ }
          return updated;
        });
      });
    }
  };

  const removeReferenceImage = (indexToRemove: number) => {
    setConstructionInfo((prev) => {
      const updated = {
        ...prev,
        referenceImages: prev.referenceImages.filter((_, idx) => idx !== indexToRemove)
      };
      localStorage.setItem("yohu_construction_info", JSON.stringify(updated));
      return updated;
    });
  };

  // Calls Gemini API to scan classical scriptures and output specialized feng shui responses
  const triggerFengshuiExport = async () => {
    // Không tự điền tên / ngày sinh giả — thiếu thì nhắc khách nhập ở Bước A
    if (!userInfo.name?.trim() || !userInfo.birthDate) {
      setMissingAlert("A");
      setCurrentStep("A");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const finalName = userInfo.name.trim();
    const finalBirthDate = userInfo.birthDate;
    const finalGender = userInfo.gender || "nam";

    const updatedUserInfo = {
      ...userInfo,
      name: finalName,
      birthDate: finalBirthDate,
      gender: finalGender
    };

    if (!userInfo.name || !userInfo.birthDate) {
      setUserInfo(updatedUserInfo);
    }

    setMissingAlert(null);
    setFengshuiCalculating(true);
    try {
      const res = await fetch("/api/fengshui/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInfo: visibleUserInfo(updatedUserInfo, goiKichHoatRef.current !== 'free'), lang })
      });
      if (!res.ok) throw new Error("API status down");
      const result = await res.json();
      setFengShuiAnalysis(result);
      localStorage.setItem("yohu_fengshui_analysis", JSON.stringify(result));
      // Immediately push information to Google Sheets right after calculation
      await syncLeadToServer(undefined, result, updatedUserInfo);

      // Smooth step transitions for high-fidelity UX feedback
      setOpenSectionA(false);
      setOpenSectionB(true);
      setCurrentStep("B");

      const successMsg = `${t.toastFengshuiSuccessPart1} ${finalName}${t.toastFengshuiSuccessPart2}`;
      setDraftToast(successMsg);
      setTimeout(() => setDraftToast(null), 4500);
    } catch (err: any) {
      console.warn("Fallen back to local accurate astrological models.");
      const localResult = computeLocalFengshui(updatedUserInfo);
      if (localResult) {
        await syncLeadToServer(undefined, localResult, updatedUserInfo);
      }

      setOpenSectionA(false);
      setOpenSectionB(true);
      setCurrentStep("B");

      const successMsg = `${t.toastFengshuiSuccessPart1} ${finalName} ${t.toastFengshuiSuccessLocalPart2}`;
      setDraftToast(successMsg);
      setTimeout(() => setDraftToast(null), 4500);
    } finally {
      setFengshuiCalculating(false);
    }
  };

  // Centralized AI Credit consumption & validation
  const consumeAiCredit = (featureName: string = "AI"): boolean => {
    if (isAdminAuthenticated) {
      return true; // Admin has unlimited access
    }
    if (goiKichHoat !== 'free') {
      return true; // Paid tier has unlimited access
    }
    const currentCredits = aiCredits;
    if (currentCredits <= 0) {
      alert(`⚠️ Bạn đã sử dụng hết 20 lượt AI miễn phí trong phiên này (${featureName}). Vui lòng nhập mã kích hoạt bản quyền hoặc đăng nhập tài khoản Admin để tiếp tục.`);
      setShowActivationModal(true);
      return false;
    }
    const nextCredits = currentCredits - 1;
    setAiCredits(nextCredits);
    localStorage.setItem("yohu_ai_credits", String(nextCredits));
    return true;
  };

  // Calls Gemini to formulate full project schedule & budget metrics
  const triggerCoreResultExport = async () => {
    // Không tự điền tên / ngày sinh giả — thiếu thì nhắc khách nhập ở Bước A (kiểm tra TRƯỚC khi trừ lượt AI)
    if (!userInfo.name?.trim() || !userInfo.birthDate) {
      setMissingAlert("A");
      setCurrentStep("A");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Credit check & deduction
    if (!consumeAiCredit("Tính toán dự toán AI")) {
      return;
    }

    const activeName = userInfo.name.trim();
    const activeBirthDate = userInfo.birthDate;
    const activeGender = userInfo.gender || "nam";

    const updatedUserInfo = {
      ...userInfo,
      name: activeName,
      birthDate: activeBirthDate,
      gender: activeGender
    };

    if (!userInfo.name || !userInfo.birthDate) {
      setUserInfo(updatedUserInfo);
    }

    // Check if user provided EITHER overall description OR dimensions (the grid form inputs) or budget
    const hasDesc = constructionInfo.overallDescription && constructionInfo.overallDescription.trim() !== "";
    const hasDimensions = constructionInfo.dimensions && constructionInfo.dimensions.trim() !== "";
    const hasBudget = constructionInfo.totalBudget && Number(constructionInfo.totalBudget) > 0;
    const hasRooms = Object.values(constructionInfo.rooms || {}).some(val => val === true || (typeof val === 'number' && val > 0));

    // If description is empty, auto-generate a narrative description from the detailed fields so AI doesn't receive blank
    let finalizedConstructionInfo = { ...constructionInfo };
    if (!hasDesc && !hasDimensions && !hasBudget && !hasRooms) {
      // Create a sensible descriptive block as default to prevent any empty execution issue
      finalizedConstructionInfo.overallDescription = "Xây dựng nhà phố hiện đại tiêu chuẩn";
    } else if (!hasDesc) {
      const roomDetails: string[] = [];
      if (constructionInfo.rooms?.livingRoom) roomDetails.push("phòng khách");
      const beds = Number(constructionInfo.rooms?.bedroomCount || 0);
      if (beds > 0) roomDetails.push(`${beds} phòng ngủ`);
      if (constructionInfo.rooms?.kitchen) roomDetails.push("nhà bếp");
      if (constructionInfo.rooms?.worshipRoom) roomDetails.push("phòng thờ");
      const wcs = Number(constructionInfo.rooms?.bathroomCount || 0);
      if (wcs > 0) roomDetails.push(`${wcs} nhà vệ sinh`);
      if (constructionInfo.rooms?.garage) roomDetails.push("gara");
      if (constructionInfo.rooms?.garden) roomDetails.push("sân vườn");
      if (constructionInfo.rooms?.fishPond) roomDetails.push("hồ cá Koi");
      if (constructionInfo.rooms?.swimmingPool) roomDetails.push("bể bơi");

      const layoutsPart = roomDetails.length > 0 ? `, công năng gồm: ${roomDetails.join(", ")}` : "";
      const autoDesc = `Xây dựng công trình loại ${constructionInfo.constructionType || "Nhà phố"} kích thước/diện tích nhà ${constructionInfo.dimensions || "chưa rõ"}, quy mô ${constructionInfo.floors || 1} tầng, ngân sách dự kiến khoảng ${constructionInfo.totalBudget || "thương lượng"} ${constructionInfo.budgetUnit || "VNĐ"}${layoutsPart}. Bố trí kết cấu bền vững tiêu chuẩn ${constructionInfo.standard || "VN"}.`;
      
      finalizedConstructionInfo.overallDescription = autoDesc;
    }
    
    setMissingAlert(null);
    setExportCalculating(true);

    try {
      const res = await fetch("/api/construction/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInfo: visibleUserInfo(updatedUserInfo, goiKichHoatRef.current !== 'free'), constructionInfo: finalizedConstructionInfo, detailItems, lang })
      });
      if (!res.ok) throw new Error("Estimation server error");
      const data = await res.json();
      setAiReport(data);
      localStorage.setItem("yohu_ai_report", JSON.stringify(data));
      
      // Auto transition focusing the complete report on C
      setOpenSectionA(false);
      setOpenSectionB(false);
      setOpenSectionC(true);
      setCurrentStep("C");

      // Auto sync the finalized parameters including AI report to Google Sheets
      try {
        await syncLeadToServer(data, fengShuiAnalysis, updatedUserInfo);
      } catch (e) {
        console.warn("Sheet sync error:", e);
      }
    } catch (err) {
      console.error("AI estimation error, utilizing cached standard details:", err);
      
      // Calculate elegant local client-side fallback
      const rawDim = finalizedConstructionInfo.dimensions || "100";
      let areaFactor = 100;
      if (rawDim.includes("x") || rawDim.includes("X") || rawDim.includes("×")) {
        const parts = rawDim.split(/[xX×]/);
        const w = parseFloat(parts[0]) || 5;
        const h = parseFloat(parts[1]) || 20;
        areaFactor = w * h;
      } else {
        areaFactor = parseFloat(rawDim) || 120;
      }
      const floors = Number(finalizedConstructionInfo.floors) || 1;
      const totalArea = areaFactor * floors;
      const isEpsStructure = (finalizedConstructionInfo.loai_ket_cau_chinh || "").toLowerCase().includes("eps") ||
                             (finalizedConstructionInfo.loai_ket_cau_chinh || "").toLowerCase().includes("bê tông nhẹ") ||
                             (finalizedConstructionInfo.loai_ket_cau_chinh || "").toLowerCase().includes("gông 3d");
      let baseRate = isEpsStructure ? 5268000 : 6000000;
      if (finalizedConstructionInfo.constructionType?.toLowerCase()?.includes("biệt thự") || finalizedConstructionInfo.constructionType?.toLowerCase()?.includes("villa")) {
        baseRate = isEpsStructure ? 6132000 : 9500000;
      } else if (finalizedConstructionInfo.constructionType?.toLowerCase()?.includes("nhà xưởng")) {
        baseRate = isEpsStructure ? 3120000 : 3000000;
      }
      const overallEstimate = totalArea * baseRate;
      const durationVal = isEpsStructure ? Math.max(15, Math.round(floors * 15)) : (floors * 45);

      const fallbackData: any = {
        totalBoqCost: overallEstimate,
        estimatedDuration: `${durationVal} ${t.estimatedTimeline}`,
        expertNote: isEpsStructure ? ((t as any).epsAdvantageInfo?.tagline || t.expertNoteLocal) : t.expertNoteLocal,
        fengShui: {
          summary: t.fengShuiSummaryShort,
          details: t.fengShuiLocalDetails
        },
        structuralAnalysis: {
          foundation: t.reportFallbacks.foundation,
          columns: t.reportFallbacks.columns,
          frame: t.reportFallbacks.frame,
          roof: t.reportFallbacks.roof,
          beam: t.reportFallbacks.beam,
          waterproofing: t.reportFallbacks.waterproofing
        },
        threeOptions: {
          economy: {
            title: t.reportFallbacks.options.economy.title,
            desc: t.reportFallbacks.options.economy.desc,
            estimatedPrice: formatCurrency(Math.round(overallEstimate * 0.85), lang)
          },
          standard: {
            title: t.reportFallbacks.options.standard.title,
            desc: t.reportFallbacks.options.standard.desc,
            estimatedPrice: formatCurrency(Math.round(overallEstimate), lang)
          },
          premium: {
            title: t.reportFallbacks.options.premium.title,
            desc: t.reportFallbacks.options.premium.desc,
            estimatedPrice: formatCurrency(Math.round(overallEstimate * 1.35), lang)
          }
        },
        budgetTable: [
          { no: 1, category: t.reportFallbacks.categories.foundation, material: detailItems?.foundation || t.defaultMaterials.foundation, labor: t.reportFallbacks.labor, unitPrice: formatCurrencyWithUnit(Math.round(baseRate * 0.15), t.reportFallbacks.units.m2, lang), total: formatCurrency(Math.round(overallEstimate * 0.15), lang) },
          { no: 2, category: t.reportFallbacks.categories.structure, material: detailItems?.columns || t.defaultMaterials.columns, labor: t.reportFallbacks.labor, unitPrice: formatCurrencyWithUnit(Math.round(baseRate * 0.35), t.reportFallbacks.units.m2, lang), total: formatCurrency(Math.round(overallEstimate * 0.35), lang) },
          { no: 3, category: t.reportFallbacks.categories.wall, material: detailItems?.wall || t.defaultMaterials.wall, labor: t.reportFallbacks.labor, unitPrice: formatCurrencyWithUnit(Math.round(baseRate * 0.15), t.reportFallbacks.units.m2, lang), total: formatCurrency(Math.round(overallEstimate * 0.15), lang) },
          { no: 4, category: t.reportFallbacks.categories.roof, material: detailItems?.roof || t.defaultMaterials.roof, labor: t.reportFallbacks.labor, unitPrice: formatCurrencyWithUnit(Math.round(baseRate * 0.15), t.reportFallbacks.units.m2, lang), total: formatCurrency(Math.round(overallEstimate * 0.15), lang) },
          { no: 5, category: t.reportFallbacks.categories.finishing, material: detailItems?.tiles || t.defaultMaterials.finishing, labor: t.reportFallbacks.labor, unitPrice: formatCurrencyWithUnit(Math.round(baseRate * 0.2), t.reportFallbacks.units.m2, lang), total: formatCurrency(Math.round(overallEstimate * 0.2), lang) }
        ],
        boq: [
          { name: t.reportFallbacks.categories.foundationStage, brand: "Hòa Phát", specs: "16mm", unit: t.reportFallbacks.units.kg, quantity: Math.round(totalArea * 15), unitPrice: 18500, totalPrice: Math.round(totalArea * 15 * 18500), category: t.reportFallbacks.categories.rough, phase: t.reportFallbacks.categories.foundationStage },
          { name: t.reportFallbacks.categories.roughConstruction, brand: "Hoàng Thạch", specs: "50kg", unit: t.reportFallbacks.units.bag, quantity: Math.round(totalArea * 1.5), unitPrice: 90000, totalPrice: Math.round(totalArea * 1.5 * 90000), category: t.reportFallbacks.categories.foundationStage, phase: t.reportFallbacks.categories.roughConstruction }
        ],
        timeline: [
          { phaseName: t.reportFallbacks.phases.foundation, days: 20, paymentPercentage: 25, tasks: [t.reportFallbacks.tasks.foundation], mainMaterials: ["Thép", "Bê tông mác 300"], workersPerDay: 5 },
          { phaseName: t.reportFallbacks.phases.structure, days: 45, paymentPercentage: 45, tasks: [t.reportFallbacks.tasks.structure], mainMaterials: ["Xi măng", "Thép", "Gạch"], workersPerDay: 8 },
          { phaseName: t.reportFallbacks.phases.finishing, days: 35, paymentPercentage: 30, tasks: [t.reportFallbacks.tasks.finishing], mainMaterials: ["Sơn lót Sika", "Khung nhôm Xingfa"], workersPerDay: 6 }
        ],
        checklists: [
          { phaseName: t.reportFallbacks.phases.foundationCheck, checks: t.reportFallbacks.checks.foundation },
          { phaseName: t.reportFallbacks.phases.wallCheck, checks: t.reportFallbacks.checks.structure }
        ],
        ho_so_hoan_cong: "MẪU MINH HỌA HỒ SƠ HOÀN CÔNG (⚠️ Lưu ý: Đây là MẪU MINH HỌA, hồ sơ hoàn công thực tế sẽ được lập dựa trên thi công thực tế và có xác nhận của kỹ sư giám sát).\n1. Checklist các hạng mục cần nghiệm thu: Nghiệm thu cốt thép móng, cốp pha dầm cột, chống thấm sàn mái, hệ thống ống điện nước âm tường.\n2. Danh mục vật tư chính đã sử dụng: Thép Hòa Phát CB400-V, Xi măng Hoàng Thạch PCB40, Gạch Viglacera 800x800, Sơn Dulux 5in1.\n3. Nội dung giấy bảo hành mẫu: Kết cấu chịu lực bảo hành 10 năm, hệ thống chống thấm bảo hành 5 năm, thiết bị điện nước bảo hành 2 năm theo thông lệ ngành xây dựng VN.\n4. Hướng dẫn bảo trì cơ bản 6 tháng đầu: Tưới nước bảo dưỡng bê tông đúng hạn, kiểm tra rò rỉ đường ống nước, tránh va đập mạnh tường sơn mới."
      };

      // Số tiền lấy từ bộ máy giá chuẩn (giống PDF & CRM), không dùng hệ số ước lượng nhanh
      const unifiedFallback = applyUnifiedPricing(fallbackData, { constructionInfo: finalizedConstructionInfo, userInfo: updatedUserInfo });
      setAiReport(unifiedFallback);
      localStorage.setItem("yohu_ai_report", JSON.stringify(unifiedFallback));

      // Auto transition focusing the complete report on C
      setOpenSectionA(false);
      setOpenSectionB(false);
      setOpenSectionC(true);
      setCurrentStep("C");

      const successToast = `${t.toastReportSuccessPart1} ${activeName}${t.toastReportSuccessPart2}`;
      setDraftToast(successToast);
      setTimeout(() => setDraftToast(null), 4500);

      try {
        await syncLeadToServer(fallbackData, fengShuiAnalysis, updatedUserInfo);
      } catch (e) {
        console.warn("Sheet sync error:", e);
      }
    } finally {
      setExportCalculating(false);
    }
  };

  // Interactive chatbot query triggers
  const handleAskQuestion = async (customQ?: string) => {
    const query = customQ || currentQuestion;
    if (!query.trim()) return;
    if (!consumeAiCredit("Hỏi đáp trợ lý AI")) return;

    setQnaLoading(true);
    const activeImage = attachedChatImage;
    setCurrentQuestion("");
    setAttachedChatImage(null);

    const newQA: QuestionAnswer = {
      id: "qa_" + Date.now(),
      question: query,
      createdAt: new Date().toLocaleTimeString(),
      image: activeImage || undefined
    };

    setQnaHistory((prev) => [newQA, ...prev]);

    try {
      const res = await fetch("/api/qna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatHistory: qnaHistory.slice(0, 5),
          newestQuestion: query,
          userInfo,
          constructionInfo,
          lang,
          referenceImage: activeImage || undefined
        })
      });

      if (!res.ok) throw new Error("API unreachable");
      const data = await res.json();

      setQnaHistory((prev) => 
        prev.map((item) => item.id === newQA.id ? { ...item, answer: data.answer } : item)
      );
    } catch (err) {
      setQnaHistory((prev) => 
        prev.map((item) => item.id === newQA.id 
          ? { 
              ...item, 
              answer: t.aiBusyMsg
            } 
          : item
        )
      );
    } finally {
      setQnaLoading(false);
    }
  };

  // Triggers concept blueprint renderings (falls back to Unsplash samples gracefully)
  // Tóm tắt công trình gửi AI vẽ phối cảnh — lấy đúng số liệu khách đã nhập / xác nhận
  const buildHouseBrief = () => {
    const ct: any = constructionInfo || {};
    const site = computeSiteFor(ct);
    const sk = ct.rooms?.sketchLayout;
    const skRooms = sk?.co_phac_thao !== false ? (sk?.tang || []).flatMap((t: any) => (t.phong || []).map((r: any) => `T${t.tang}: ${r.ten_goc || r.loai}`)) : [];
    return [
      `Loại công trình: ${ct.constructionType || 'Nhà ở'}`,
      `Số tầng: ${ct.floors || 1}; cao tầng 1: ${Number(ct.floorHeight1) || 3.6}m${(Number(ct.floors) || 1) > 1 ? `; tầng trên: ${Number(ct.floorHeightUpper) || 3.3}m` : ''}`,
      `Kích thước nhà xây: rộng ${site.lotWidthM}m (mặt tiền), sâu ${site.houseLengthM}m; diện tích xây dựng ${site.footprint}m²`,
      `Hướng mặt tiền: ${userInfo?.desiredDirection || 'chưa rõ'}`,
      `Mái: ${ct.loai_mai || 'theo loại công trình'}`,
      (() => { const pl = resolveExteriorPalette({ description: ct.overallDescription, fengShuiAnalysis }); const src = (x: any) => x.source === 'mo_ta' ? 'gia chủ ghi' : x.source === 'phong_thuy' ? `đề xuất theo mệnh ${pl.element}` : 'trung tính'; return `MÀU NGOẠI THẤT (bắt buộc giữ đúng): mái ${pl.roof.name} (${src(pl.roof)}), tường ${pl.wall.name} (${src(pl.wall)}), khung cửa sổ ${pl.frame.name} (${src(pl.frame)}), cửa chính ${pl.door.name} (${src(pl.door)})`; })(),
      wantsSolar(ct.overallDescription) ? 'Có hệ pin điện mặt trời áp mái trên mặt mái hướng Nam' : '',
      `Kết cấu: ${ct.loai_ket_cau_chinh || 'BTCT'}`,
      ct.loai_tran ? `Trần: ${ct.loai_tran}` : '',
      `Phòng ngủ: ${ct.rooms?.bedroomCount || 'theo thiết kế'}; WC: ${ct.rooms?.bathroomCount || 'theo thiết kế'}; phòng thờ: ${ct.rooms?.worshipRoom ? 'có' : 'không'}`,
      skRooms.length ? `Bố trí theo phác thảo gia chủ: ${skRooms.join(', ')}` : '',
      sk?.hien?.co ? 'Có hiên trước nhà' : '',
      (sk?.ngoai_nha || []).length ? `Ngoài nhà: ${(sk.ngoai_nha || []).map((o: any) => o.loai).join(', ')}` : '',
      ct.overallDescription ? `Mô tả của gia chủ: ${ct.overallDescription}` : ''
    ].filter(Boolean).join('\n');
  };

  /** Ảnh phối cảnh: dùng khung 3D + ảnh tham chiếu gia chủ. Lỗi → báo lỗi, KHÔNG thay bằng ảnh mạng. */
  const triggerRenderConceptImage = async (arg: '2d' | '3d' | PerspectiveOptions) => {
    const o: PerspectiveOptions = typeof arg === 'string'
      ? { view: 'exterior', style: 'Hiện đại', extra: '', useMassing: true, useReferences: true }
      : arg;
    setImageRendering(true);
    setRenderedConceptImage("");
    setConceptError("");
    const toPart = (url: string) => { const m = String(url || '').match(/^data:(image\/[a-z+]+);base64,(.+)$/); return m ? { mimeType: m[1], data: m[2] } : null; };
    try {
      const refs = o.useReferences ? (constructionInfo.referenceImages || []).slice(0, 3).map(toPart).filter(Boolean) : [];
      const massing = o.useMassing && massingSnapshot ? toPart(massingSnapshot) : null;
      const res = await fetch("/api/generate-concept-image", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(isAdminAuthenticated ? { "x-admin-code": sessionStorage.getItem("yohu_admin_code") || "" } : {}) },
        body: JSON.stringify({ prompt: buildHouseBrief(), view: o.view, style: o.style, extra: o.extra, referenceImages: refs, massingImage: massing, lang, clientId })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.imageUrl) {
        setConceptError(data.error || (lang === 'vi' ? `Chưa tạo được ảnh (mã lỗi ${res.status}). Vui lòng thử lại sau.` : `Image generation failed (${res.status}).`));
        return;
      }
      setRenderedConceptImage(data.imageUrl);
      addPerspectiveShot(data.imageUrl, o.style, o.view);
    } catch (err: any) {
      setConceptError(lang === 'vi' ? `Không kết nối được máy chủ tạo ảnh: ${err?.message || err}` : `Cannot reach image server: ${err?.message || err}`);
    } finally {
      setImageRendering(false);
    }
  };

  /** Bộ ảnh phối cảnh: gọi máy chủ vẽ 1 ảnh theo góc 3D + phong cách đã chốt; trả ảnh đã nén */
  const requestPerspectiveImage = async (r: RenderRequest): Promise<RenderResult> => {
    const toPart = (url?: string) => { const m = String(url || '').match(/^data:(image\/[a-z+]+);base64,(.+)$/); return m ? { mimeType: m[1], data: m[2] } : null; };
    // ảnh đã lưu trên máy chủ (link) → tải về để gửi kèm
    const asData = async (url?: string) => {
      if (!url || url.startsWith('data:')) return url;
      try { const b = await (await fetch(url)).blob(); return await new Promise<string>(res => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.readAsDataURL(b); }); } catch { return undefined; }
    };
    const refs = r.useReferences ? (constructionInfo.referenceImages || []).slice(0, r.styleImage ? 2 : 3).map(toPart).filter(Boolean) : [];
    const styleData = await asData(r.styleImage);
    const res = await fetch("/api/generate-concept-image", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(isAdminAuthenticated ? { "x-admin-code": sessionStorage.getItem("yohu_admin_code") || "" } : {}) },
      body: JSON.stringify({ prompt: buildHouseBrief(), view: r.view, style: r.style, extra: r.extra, referenceImages: refs, massingImage: toPart(r.massingImage), styleImage: toPart(styleData), shotLabel: r.shotLabel, loai_phong: r.roomBrief || '', lang, clientId })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.imageUrl) {
      if (res.status >= 500 || res.status === 0) reportError("perspective", data.error || `HTTP ${res.status}`);
      throw new Error(data.error || `Chưa tạo được ảnh (mã lỗi ${res.status}). Vui lòng thử lại sau.`);
    }
    const small = await compressImage(data.imageUrl);
    return { url: await uploadPerspective(small, { label: r.shotLabel, style: r.style, view: r.view }), quota: data.quota };
  };
  /** Phòng nội thất cho bộ ảnh: lấy từ ô "Yêu cầu từng phòng" (kích thước gia chủ nhập), không có thì theo mặt bằng */
  const interiorRooms: InteriorRoom[] = useMemo(() => {
    const ct: any = constructionInfo || {};
    const want = ['khach', 'bep', 'ngu_1', 'tho', 'ngu_2', 'lam_viec'];
    return listRoomSlots(ct).filter(x => want.includes(x.key)).sort((a, b) => want.indexOf(a.key) - want.indexOf(b.key)).map(x => {
      const sp = specOf(ct, x.key);
      const size = sp.dai && sp.rong ? `${sp.dai}×${sp.rong}m` : 'kích thước theo mặt bằng';
      return { key: x.key, label: x.label, brief: `${x.label} (${size}, tầng ${sp.tang || x.defaultTang}${sp.huong ? ', cửa sổ hướng ' + sp.huong : ''}${sp.ghi_chu ? ', yêu cầu: ' + sp.ghi_chu : ''})` };
    });
  }, [constructionInfo]);

  const handleUpdateCrmStatus = async (leadId: string, newStatus: string) => {
    try {
      const saved = localStorage.getItem("yohu_crm_leads");
      const leads: any[] = saved ? JSON.parse(saved) : [];
      const idx = leads.findIndex((l) => l.id === leadId);
      if (idx >= 0) {
        leads[idx].status = newStatus;
        localStorage.setItem("yohu_crm_leads", JSON.stringify(leads));
        setCrmLeads([...leads]);
      }
    } catch (err) {
      console.error("Failed status change:", err);
    }
  };

  const handleUpdatePerspective = async (leadId: string, linkAnh: string, linkVideo: string) => {
    try {
      const saved = localStorage.getItem("yohu_crm_leads");
      const leads: any[] = saved ? JSON.parse(saved) : [];
      const idx = leads.findIndex((l) => l.id === leadId);
      if (idx >= 0) {
        leads[idx].link_anh_phoi_canh = linkAnh;
        leads[idx].link_video_phoi_canh = linkVideo;
        localStorage.setItem("yohu_crm_leads", JSON.stringify(leads));
        setCrmLeads([...leads]);
      }
      const GAS_URL = dynamicGasUrl;
      const params = new URLSearchParams({ data: JSON.stringify({
        type: "cap_nhat_anh_phoi_canh",
        ma_kh: leadId,
        link_anh: linkAnh,
        link_video: linkVideo
      }) });
      callGas(params).catch(err => console.warn(err));
    } catch (err) {
      console.error("Failed to update perspective links:", err);
    }
  };

  const exportCRMtoCSV = () => {
    // UTF-8 BOM (\uFEFF) ensures Excel properly renders Vietnamese, Lao, Chinese fonts
    const headers = [
      "Mã Khách Hàng (Lead ID)",
      "Họ và Tên (Client Name)",
      "Số Điện Thoại (Phone)",
      "Email",
      "Địa Chỉ (Address)",
      "Loại Công Trình (Construction)",
      "Diện Tích / Số Tầng (Dimensions)",
      "Tổng Ngân Sách (Total Budget)",
      "Gói Dịch Vụ (Package Tier)",
      "Trạng Thái (Status)",
      "Thời Gian Đăng Ký (Created At)"
    ];

    const rows = (crmLeads || []).map((l) => [
      `"${l.id || ''}"`,
      `"${(l.userInfo?.name || 'Khách hàng').replace(/"/g, '""')}"`,
      `"${(l.userInfo?.phone || '').replace(/"/g, '""')}"`,
      `"${(l.userInfo?.email || '').replace(/"/g, '""')}"`,
      `"${(l.userInfo?.address || '').replace(/"/g, '""')}"`,
      `"${(l.constructionInfo?.constructionType || '').replace(/"/g, '""')}"`,
      `"${(l.constructionInfo?.dimensions || '').replace(/"/g, '""')} - ${l.constructionInfo?.floors || 1} tầng"`,
      `"${formatCurrency(l.constructionInfo?.totalBudget || 0, lang)}"`,
      `"${(l.goiMua || l.goi_mua || 'Báo cáo cơ bản').replace(/"/g, '""')}"`,
      `"${l.status || 'new'}"`,
      `"${l.createdAt ? new Date(l.createdAt).toLocaleString('vi-VN') : ''}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `YohuCRM_DanhSach_KhachHang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const xuatPDF = async (goi: 'free' | 'standard' | 'design', data: any) => {
    try {
      setLoadingMessage(t.pdf.generating);
      setAiLoading(true);

      const sumOff = goi === 'free' ? 0 : 1;      // trang tóm tắt cho gói trả phí
      const totalPages = (goi === 'free' ? 1 : goi === 'standard' ? 2 : 3) + sumOff;
      const kh = data.userInfo || userInfo;
      const ct = data.constructionInfo || constructionInfo;
      const ai = data.aiResult || aiReport;
      const ten = kh?.name || t.pdf.defaultClientName;
      const ngay = new Date().toLocaleDateString(t.locale);
      const lunarBY = kh?.birthDate ? getLunarBirthYear(kh.birthDate) : NaN;
      if (isNaN(lunarBY)) {          // không tự điền năm sinh giả — bắt buộc khách nhập
        alert(lang === 'vi' ? 'Chưa có ngày sinh gia chủ. Vui lòng nhập ở Bước A rồi xuất PDF lại.' : 'Owner birth date is missing. Please fill it in Step A, then export again.');
        setAiLoading(false);
        return;
      }
      const birthYear = lunarBY;
      const gender = kh?.gender || 'nam';
      const desiredDirection = kh?.desiredDirection || '';
      const targetYearPdf = kh?.constructionYear ? Number(kh.constructionYear) : getDefaultConstructionYear();

      // 1. Luôn tính lại phần phong thủy bằng thuật toán cố định (không phụ thuộc AI) để PDF chuẩn xác
      let fs = data.fengShuiAnalysis || fengShuiAnalysis;
      {
        const calc = calculateFengShui(
          birthYear,
          gender,
          desiredDirection,
          spouseYearOf(kh, goi !== 'free'),
          spouseYearOf(kh, goi !== 'free') ? kh?.spouseGender : undefined,
          kh?.birthHour,
          targetYearPdf
        );
        fs = {
          element: calc.elementDetail,
          cungPhi: calc.cungPhi,
          favorableDirections: calc.favorableDirections,
          unfavorableDirections: calc.unfavorableDirections,
          favorableColors: calc.favorableColors,
          unfavorableColors: calc.unfavorableColors,
          luckyColors: calc.favorableColors,
          favorableGroundbreakingDates: calc.favorableDates2026,
          deepAnalysis: calc.deepAnalysis,
          deepAnalysisCore: calc.deepAnalysisCore,
          canChi: calc.canChi,
          advice2026: calc.advice2026,
          luckyNumbers: calc.luckyNumbers,
          targetYear: calc.targetYear,
          borrowAgeCandidates: calc.borrowAgeCandidates,
          borrowAgeDetails: calc.borrowAgeDetails,
          auspiciousDays: calc.auspiciousDays,
          spouseAdvice: calc.spouseAdvice,
          menhQuaiExplain: calc.menhQuaiExplain,
          directionVerdict: calc.directionVerdict,
          isLocal: true
        };
      }
      fs = translateFengShuiAnalysis(fs, lang);

      // 2. Generate comprehensive engineering & cost estimate
      const est = generateComprehensiveEstimate(ct, ai, kh);

      const canChi = fs.canChi || getCanChi(birthYear);
      const age2026 = targetYearPdf - birthYear + 1; // tuổi mụ năm khởi công
      const goiLabel = goi === 'free' ? t.pdf.labels.basicReport : goi === 'standard' ? t.pdf.labels.fullReport : t.pdf.labels.designReport;

      // Extract colors & directions
      const goodDirs = Array.isArray(fs.favorableDirections) ? fs.favorableDirections.join(', ') : (fs.favorableDirections || 'Nam (Sinh Khí), Bắc (Thiên Y), Đông Nam (Diên Niên), Đông (Phục Vị)');
      const badDirs = Array.isArray(fs.unfavorableDirections) ? fs.unfavorableDirections.join(', ') : (fs.unfavorableDirections || 'Tây (Tuyệt Mệnh), Tây Bắc (Ngũ Quỷ), Đông Bắc (Lục Sát), Tây Nam (Họa Hại)');
      const goodColors = Array.isArray(fs.favorableColors) ? fs.favorableColors.join('; ') : (fs.luckyColors?.join('; ') || 'Đỏ, Hồng, Tím, Xanh lá cây');
      const badColors = Array.isArray(fs.unfavorableColors) ? fs.unfavorableColors.join('; ') : 'Đen, Xanh nước biển';
      const goodDates = Array.isArray(fs.favorableGroundbreakingDates) ? fs.favorableGroundbreakingDates.join(' · ') : (fs.favorableGroundbreakingDates || 'Tháng 2 âm lịch (Kinh Trập) · Tháng 4 âm lịch (Lập Hạ)');

      // Advice 2026
      const advice2026Text = fs.advice2026 || '';

      // Generate clear architectural floor plan SVG
      const dimMatch = (planDimsFor(ct) || ct?.kich_thuoc || "10x15").match(/(\d+(?:\.\d+)?)\s*[xX*]\s*(\d+(?:\.\d+)?)/);
      const widthM = dimMatch ? parseFloat(dimMatch[1]) : 10;
      const lengthM = dimMatch ? parseFloat(dimMatch[2]) : 15;
      const archSvg = generateArchitecturalFloorPlanSvg({
        widthM,
        lengthM,
        floor: 1,
        totalFloors: Math.max(1, Number(ct?.floors || ct?.so_tang) || 1),
        constructionType: ct?.loai_hinh || "Nhà phố",
        customerName: ten,
        showFurniture: true,
        desiredDirection: desiredDirection,
        fengShuiAnalysis: fs,
        rooms: roomsFor(ct),
        frontSetbackM: setbacksFor(ct).front,
        backSetbackM: setbacksFor(ct).back
      });
      const archSvgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(archSvg)}`;
      // Ảnh cho trang tóm tắt: chỉ dùng ảnh của chính hồ sơ đang mở, và chỉ ảnh nằm sẵn trong máy (data:) để PDF không lỗi
      const sameClient = !data?.id || data.id === clientId;
      const sumImgs: { src: string; cap: string; fit?: string }[] = [];
      if (sameClient) {
        const persp = perspectiveShots.find(p => String(p.url).startsWith('data:') && p.view !== 'interior');
        if (persp) sumImgs.push({ src: persp.url, cap: `Phối cảnh ${persp.label || ''} · ${persp.style}` });
        const m3d = massingShots.find(x => x.key === 'corner_l')?.url || massingSnapshot;
        if (m3d && m3d.startsWith('data:')) sumImgs.push({ src: m3d, cap: '3D hình khối (dựng từ mặt bằng)' });
        if (goi === 'design' && elevationSvgUrl) sumImgs.push({ src: elevationSvgUrl, cap: 'Mặt đứng chính', fit: 'contain' });
      }
      const sumDays: any[] = Array.isArray(fs.auspiciousDays) ? fs.auspiciousDays.slice(0, 3) : [];

      const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>YOHU CONSTECH Report</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; line-height: 1.45; }
  .pdf-page { width: 794px; height: 1123px; max-height: 1123px; padding: 26px 36px 26px 36px; background: #ffffff; position: relative; overflow: hidden; page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; }
  
  /* Header */
  .header { background: linear-gradient(135deg, #0b1329 0%, #1e293b 100%); color: #f8fafc; padding: 18px 24px; border-radius: 10px; border-bottom: 3px solid #f59e0b; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { font-size: 10px; font-weight: 800; letter-spacing: 1.5px; color: #f59e0b; text-transform: uppercase; }
  .title { font-size: 19px; font-weight: 900; color: #ffffff; margin-top: 3px; letter-spacing: -0.3px; }
  .badge { display: inline-block; background: #f59e0b; color: #0f172a; font-weight: 800; font-size: 10px; padding: 3px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.12); font-size: 9.5px; color: #cbd5e1; }
  
  /* Section styling */
  .section { margin-top: 13px; }
  .section-title { font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.6px; display: flex; align-items: center; gap: 6px; margin-bottom: 7px; }
  .section-title::before { content: ""; display: inline-block; width: 4px; height: 13px; background: #f59e0b; border-radius: 2px; }

  /* Info Grid */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
  .cell { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; }
  .cell-label { font-size: 8.5px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }
  .cell-value { font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 2px; }

  /* Content Cards */
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px; font-size: 10px; line-height: 1.5; }
  .card-gold { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 9px 12px; }
  .card-blue { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 8px 12px; }
  
  /* Tables */
  .styled-table { width: 100%; border-collapse: collapse; font-size: 9.5px; text-align: left; }
  .styled-table th { background: #0f172a; color: #f8fafc; padding: 6px 10px; font-weight: 700; text-transform: uppercase; font-size: 8.5px; letter-spacing: 0.5px; }
  .styled-table td { padding: 5px 10px; border-bottom: 1px solid #e2e8f0; }
  .styled-table tr:nth-child(even) td { background: #f8fafc; }

  /* Highlights */
  .tag-good { color: #059669; font-weight: 700; }
  .tag-bad { color: #dc2626; font-weight: 700; }
  .tag-highlight { color: #d97706; font-weight: 700; }
  
  /* Promo Banner */
  .banner-cta { background: linear-gradient(135deg, #312e81 0%, #1e1b4b 100%); color: #ffffff; border-radius: 8px; padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #4338ca; }
  .banner-cta .btn-gold { background: #f59e0b; color: #0f172a; font-weight: 800; font-size: 9.5px; padding: 4px 10px; border-radius: 5px; text-decoration: none; white-space: nowrap; }

  /* Footer */
  .footer { border-top: 1px solid #e2e8f0; padding-top: 7px; display: flex; justify-content: space-between; align-items: center; color: #94a3b8; font-size: 8.5px; }
</style>
</head>
<body>

${sumOff ? `
<!-- TRANG TÓM TẮT -->
<div class="pdf-page">
  <div>
    <div class="header">
      <div class="header-top">
        <div>
          <div class="brand">🏛️ YOHU CONSTECH · TÓM TẮT HỒ SƠ</div>
          <div class="title">Hồ sơ nhà của ${ten}</div>
        </div>
        <div class="badge">${goiLabel}</div>
      </div>
      <div class="meta-bar">
        <span>${ct.constructionType || 'Nhà ở'} · ${est.floors} tầng · sàn sử dụng ${est.usableArea} m² · quy đổi ${est.totalFloorArea} m²</span>
        <span>Ngày xuất <b>${ngay}</b></span>
      </div>
    </div>
    ${sumImgs.length ? `<div class="section"><div style="display:grid; grid-template-columns:${sumImgs.length > 1 ? '1fr 1fr' : '1fr'}; gap:8px;">${sumImgs.map((im: any) => `<div style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; background:#fff;"><img src="${im.src}" style="width:100%; height:${sumImgs.length > 2 ? 150 : 210}px; object-fit:${im.fit || 'cover'}; display:block; background:#fff;"/><div style="font-size:9px; padding:3px 8px; color:#475569;">${im.cap}</div></div>`).join('')}</div></div>` : ''}
    <div class="section">
      <div class="section-title">Hướng nhà & tuổi khởi công</div>
      <div class="grid-2">
        <div class="cell" style="background:${fs.directionVerdict?.isGood ? '#ecfdf5' : '#fef2f2'};"><div class="cell-label">Hướng ${desiredDirection || 'chưa chọn'}</div><div class="cell-value">${fs.directionVerdict?.summary || ''}</div></div>
        <div class="cell"><div class="cell-label">Năm khởi công ${targetYearPdf} (${getCanChi(targetYearPdf)})</div><div class="cell-value" style="font-size:9.5px; font-weight:600;">${String(advice2026Text).split('. ').slice(0, 3).join('. ').slice(0, 420)}${String(advice2026Text).length > 420 ? '…' : ''}</div></div>
      </div>
      ${sumDays.length ? `<div class="card-blue" style="margin-top:6px;"><div style="font-weight:800; color:#0284c7;">📅 Ngày khởi công gợi ý</div>${sumDays.map((d: any) => `<div style="font-size:9.5px;">• ${d.weekday} ${d.solar} (${d.lunar}) — ngày ${d.dayCanChi}, ${d.than}. Giờ: ${(d.hours || []).join(', ')}</div>`).join('')}</div>` : ''}
    </div>
    <div class="section">
      <div class="section-title">Dự toán 3 phương án kết cấu</div>
      <table class="styled-table">
        <tr><th>Phương án</th><th style="text-align:right;">Suất đầu tư /m²</th><th style="text-align:right;">Tổng trọn gói</th></tr>
        ${(['pa1', 'pa2', 'pa3'] as const).map(k => { const o: any = (est.packageOptions as any)[k]; const sel = est.selectedOption && o.title === est.selectedOption.title; return `<tr><td style="font-weight:${sel ? 800 : 600};">${sel ? '★ ' : ''}${o.title}</td><td style="text-align:right;">${formatCurrency(o.pricePerSqm, lang)}</td><td style="text-align:right; font-weight:800;">${formatCurrency(o.totalCost, lang)}</td></tr>`; }).join('')}
      </table>
      <div style="font-size:9px; color:#64748b; margin-top:4px;">★ phương án gia chủ đang chọn. Dự toán sơ bộ theo đơn giá khu vực; chi tiết vật tư, nhân công ở các trang sau.</div>
    </div>
  </div>
  <div class="footer">
    <span>🏛️ YOHU CONSTECH · Tóm tắt hồ sơ</span>
    <span>Hotline: <b>${hotline}</b></span>
    <span>Trang <b>1/${totalPages}</b></span>
  </div>
</div>
` : ''}

<!-- TRANG 1: HỒ SƠ KHÁCH HÀNG & BÁO CÁO PHONG THỦY BÁT TRẠCH 2026 -->
<div class="pdf-page">
  <div>
    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <div>
          <div class="brand">🏛️ YOHU CONSTECH · HỆ THỐNG KIẾN TRÚC & PHONG THỦY CHUẨN XÁC</div>
          <div class="title">Báo Cáo Phong Thủy & Thông Tin Công Trình</div>
        </div>
        <div class="badge">${goiLabel}</div>
      </div>
      <div class="meta-bar">
        <span>Gia chủ: <b>${ten}</b></span>
        <span>${t.pdf.labels.dateExport} <b>${ngay}</b></span>
        <span>Hotline: <b>${hotline}</b> · Zalo: <b>0339.606.969</b></span>
      </div>
    </div>

    <!-- Section 1: Thông tin gia chủ & công trình -->
    <div class="section">
      <div class="section-title">1. Thông Tin Gia Chủ & Quy Mô Xây Dựng</div>
      <div class="grid-2">
        <div class="cell"><div class="cell-label">Họ & Tên Gia Chủ</div><div class="cell-value">${ten}</div></div>
        <div class="cell"><div class="cell-label">Năm Sinh & Can Chi</div><div class="cell-value">${birthYear} (${canChi}) · Tuổi mụ năm ${targetYearPdf}: <b>${age2026} tuổi</b></div></div>
        <div class="cell"><div class="cell-label">Giới Tính & Cung Phi</div><div class="cell-value">${gender === 'nam' ? 'Nam mạng' : 'Nữ mạng'} · <b>${fs.cungPhi}</b></div></div>
        <div class="cell"><div class="cell-label">Hướng Đất Dự Định</div><div class="cell-value">${desiredDirection || 'Chưa chọn'}${fs.directionVerdict?.star ? ` · <b style="color:${fs.directionVerdict.isGood ? '#047857' : '#dc2626'}">${fs.directionVerdict.star} — ${fs.directionVerdict.isGood ? 'HỢP' : 'KHÔNG HỢP'}</b>` : ''}</div></div>
        <div class="cell"><div class="cell-label">Loại Công Trình</div><div class="cell-value">${ct.constructionType || 'Nhà phố / Nhà ở dân dụng'}</div></div>
        <div class="cell"><div class="cell-label">Diện Tích Xây Dựng</div><div class="cell-value">Xây dựng ${est.areaPerFloor} m² · <b>Sàn sử dụng ${est.usableArea} m²</b> · quy đổi ${est.totalFloorArea} m²</div></div>
        <div class="cell"><div class="cell-label">Quy Mô Số Tầng</div><div class="cell-value">${est.floors} Tầng · cao tầng 1: ${Number(ct.floorHeight1) || 3.6}m${est.floors > 1 ? ` · tầng trên: ${Number(ct.floorHeightUpper) || 3.3}m` : ''}</div></div>
        <div class="cell"><div class="cell-label">Ngân Sách Dự Kiến</div><div class="cell-value">${ct.totalBudget ? formatCurrency(ct.totalBudget, lang) : 'Chưa nhập'}${ct.totalBudget && est.selectedOption ? ` · <b style="color:${Number(ct.totalBudget) >= est.selectedOption.totalCost ? '#047857' : '#dc2626'}">${Number(ct.totalBudget) >= est.selectedOption.totalCost ? 'ĐỦ' : 'THIẾU ~' + formatCurrency(est.selectedOption.totalCost - Number(ct.totalBudget), lang)} so với dự toán</b>` : ''}</div></div>
      </div>
    </div>

    <!-- Section 2: Luận giải Phong thủy Bát Trạch -->
    <div class="section">
      <div class="section-title">2. Luận Giải Bản Mệnh & Bát Trạch Minh Cảnh</div>
      <div class="grid-2" style="margin-bottom: 6px;">
        <div class="cell" style="background:#fffbeb; border-color:#fde68a;">
          <div class="cell-label" style="color:#b45309;">Niên Mệnh (Lục Thập Hoa Giáp)</div>
          <div class="cell-value" style="color:#92400e; font-size:11.5px;">${fs.element}</div>
        </div>
        <div class="cell" style="background:#ecfdf5; border-color:#a7f3d0;">
          <div class="cell-label" style="color:#047857;">Cung Phi Bát Trạch</div>
          <div class="cell-value" style="color:#065f46; font-size:11.5px;">${fs.cungPhi}</div>
        </div>
      </div>

      <div class="card" style="margin-bottom: 6px;">
        <div style="margin-bottom: 4px;">
          <span class="tag-good">🧭 4 HƯỚNG ĐẠI CÁT (Nên chọn làm Cửa chính, Phòng khách, Ban thờ, Phòng ngủ):</span><br>
          <span style="font-weight: 700; color: #0f172a; font-size: 10.5px;">${goodDirs}</span>
        </div>
        <div style="margin-bottom: 4px; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
          <span class="tag-bad">⚠️ 4 HƯỚNG ĐẠI HUNG (Cần tránh mở cửa chính; Thích hợp đặt Bếp/WC để trấn trạch):</span><br>
          <span style="font-weight: 600; color: #334155; font-size: 10.5px;">${badDirs}</span>
        </div>
        <div style="border-top: 1px dashed #cbd5e1; padding-top: 4px;">
          <span class="tag-highlight">🎨 MÀU SẮC HỢP BẢN MỆNH:</span> <b>${goodColors}</b><br>
          <span style="color:#dc2626; font-weight:600;">🚫 MÀU SẮC KỴ:</span> <b>${badColors}</b>
        </div>
      </div>

      ${fs.directionVerdict ? `<div class="card" style="margin-bottom:6px; border-color:${fs.directionVerdict.isGood ? '#a7f3d0' : '#fecaca'}; background:${fs.directionVerdict.isGood ? '#ecfdf5' : '#fef2f2'};">
        <div style="font-weight:800; margin-bottom:2px;">🧭 KẾT LUẬN HƯỚNG NHÀ: ${fs.directionVerdict.summary}</div>
        ${(fs.directionVerdict.remedy || []).map((r: string) => `<div style="font-size:10px;">• ${r}</div>`).join('')}
      </div>` : ''}
      <div class="card-blue">
        <div style="font-weight: 700; color: #0284c7; margin-bottom: 2px;">📅 THÁNG TỐT ĐỂ ĐỘNG THỔ NĂM ${targetYearPdf} (tham khảo):</div>
        <div style="color: #0f172a; font-weight: 600;">${goodDates}</div>
      </div>
    </div>

    <!-- Section 3: Xem tuổi năm khởi công -->
    <div class="section">
      <div class="section-title">3. Luận Giải Tuổi Làm Nhà Năm ${targetYearPdf} (${getCanChi(targetYearPdf)})</div>
      <div class="card" style="background:#f8fafc; line-height: 1.5;">
        <div style="margin-bottom: 4px;">
          <b>Phân tích sao hạn tuổi ${canChi} (${birthYear}) năm khởi công ${targetYearPdf}:</b>
        </div>
        <div style="font-size: 9.5px; color: #334155; text-align: justify;">
          ${advice2026Text}
        </div>
        <div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #e2e8f0; font-size: 9.5px; color: #047857; font-weight: 600;">
          💡 <b>Nguyên tắc bố trí công năng:</b> "Tọa Hung Hướng Cát" cho khu vực Bếp và Vệ sinh nhằm trấn hung khí; "Tọa Cát Hướng Cát" cho Ban thờ và Giường ngủ để đón tài lộc.
        </div>
      </div>
    </div>
  </div>

  <!-- Footer Page 1 -->
  <div class="footer">
    <span>🏛️ YOHU CONSTECH · Phần mềm phân tích Thiết kế & Dự toán Kiến trúc</span>
    <span>Hotline hỗ trợ kỹ sư: <b>${hotline}</b> · www.379aipro.online</span>
    <span>Trang <b>${1 + sumOff}/${totalPages}</b></span>
  </div>
</div>

${goi !== 'free' ? `
<!-- TRANG 2: DỰ TOÁN KINH PHÍ, BOQ VẬT TƯ & KẾT CẤU KỸ THUẬT -->
<div class="pdf-page">
  <div>
    <!-- Header Page 2 -->
    <div class="header">
      <div class="header-top">
        <div>
          <div class="brand">💰 YOHU CONSTECH · DỰ TOÁN KINH PHÍ & KẾT CẤU CÔNG TRÌNH</div>
          <div class="title">Bảng Bóc Tách Dự Toán & Giải Pháp Thi Công</div>
        </div>
        <div class="badge">Dự toán 2026</div>
      </div>
      <div class="meta-bar">
        <span>Công trình: <b>${ct.constructionType || 'Nhà dân dụng'} ${est.floors} Tầng</b></span>
        <span>Sàn sử dụng: <b>${est.usableArea} m²</b> · quy đổi ${est.totalFloorArea} m²</span>
        <span>Hotline Kỹ sư: <b>${hotline}</b></span>
      </div>
    </div>

    <!-- Section 1: So sánh 3 phương án kết cấu (PA1, PA2, PA3) -->
    <div class="section">
      <div class="section-title">1. Bảng So Sánh 3 Phương Án Kết Cấu & Suất Đầu Tư Trọn Gói Chìa Khóa Trao Tay (PA1, PA2, PA3)</div>
      <div class="grid-3">
        <div class="cell" style="border-top: 3px solid #3b82f6;">
          <div class="cell-label" style="font-weight:800; color:#1d4ed8;">PA1: Khung BTCT Truyền Thống (${(est.packageOptions.pa1.pricePerSqm / 1000000).toFixed(2)} tr/m²)</div>
          <div class="cell-value" style="font-size: 11.5px; color: #1e3a8a; font-weight:800;">${formatCurrency(est.packageOptions.pa1.totalCost, lang)}</div>
          <div style="font-size: 8px; color: #475569; margin-top: 3px;">Móng băng/bè BTCT, cột dầm đổ tại chỗ, tường gạch xây trát, bền vững phổ biến.</div>
        </div>
        <div class="cell" style="border-top: 3px solid #f59e0b; background: #fffbeb;">
          <div class="cell-label" style="color:#b45309; font-weight:800;">PA2: Khung Thép Lắp Ghép (${(est.packageOptions.pa2.pricePerSqm / 1000000).toFixed(2)} tr/m²)</div>
          <div class="cell-value" style="font-size: 11.5px; color: #b45309; font-weight:800;">${formatCurrency(est.packageOptions.pa2.totalCost, lang)}</div>
          <div style="font-size: 8px; color: #78350f; margin-top: 3px;">Cột dầm thép hộp/hình I, sàn Cemboard 1.6cm, lắp ghép siêu tốc, tối ưu kinh doanh.</div>
        </div>
        <div class="cell" style="border-top: 3px solid #10b981; background: #f0fdf4;">
          <div class="cell-label" style="font-weight:800; color:#047857;">PA3: Bê Tông Nhẹ EPS (${(est.packageOptions.pa3.pricePerSqm / 1000000).toFixed(2)} tr/m²)</div>
          <div class="cell-value" style="font-size: 11.5px; color: #047857; font-weight:800;">${formatCurrency(est.packageOptions.pa3.totalCost, lang)}</div>
          <div style="font-size: 8px; color: #065f46; margin-top: 3px;">Vách EPS đúc liền khối gông 3D, cách âm chống nóng, tiết kiệm móng (Độc quyền).</div>
        </div>
      </div>
    </div>

    <!-- GIẢI TRÌNH DIỆN TÍCH SỬ DỤNG VS DIỆN TÍCH SÀN THI CÔNG -->
    <div style="margin-top: 6px; margin-bottom: 6px; padding: 6px 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; font-size: 8.5px; line-height: 1.45; color: #78350f;">
      <b>📐 DIỆN TÍCH & GIÁ THEO m² (3 cách):</b> Diện tích xây dựng <b>${est.areaPerFloor}m²</b>. ${est.methods.map((m: any) => m.applicable ? `<b>${m.title}</b>: ${m.area} ${m.areaLabel} × ${Math.round(m.rate).toLocaleString('vi-VN')} đ/m² = <b>${Math.round(m.total).toLocaleString('vi-VN')} đ</b>${m.key === 'quy_doi' ? ` (${est.quyDoiDetail.map((l: any) => `${l.label} ${l.area}m² × ${l.pct}%`).join(' + ')})` : ''}.` : `<b>${m.title}</b>: ${m.note}`).join(' ')} Cách 1 và 2 cùng một tổng dự toán bóc tách; khi so báo giá nhà thầu, đơn giá nhà thầu báo thường là đơn giá quy đổi — không nhân với m² sử dụng. Dự toán sơ bộ, sai số ±10–15%.
    </div>

    <!-- Section 2: Bảng BOQ Khối lượng vật tư chủ yếu -->
    <div class="section">
      <div class="section-title">2. Bảng Bóc Tách Khối Lượng Vật Tư & Nhân Công (theo phương án & gói đã chọn)</div>
      <table class="styled-table" style="font-size: 7.5px; line-height: 1.25;">
        <thead>
          <tr>
            <th style="width: 24px; text-align:center;">STT</th>
            <th>Hạng Mục Vật Tư / Nhân Công</th>
            <th style="width: 65px; text-align:right;">Khối Lượng</th>
            <th style="width: 35px; text-align:center;">ĐVT</th>
            <th style="width: 70px; text-align:right;">Đơn Giá (đ)</th>
            <th style="width: 75px; text-align:right;">Vật Tư (đ)</th>
            <th style="width: 70px; text-align:right;">Nhân Công (đ)</th>
            <th style="width: 85px; text-align:right;">Thành Tiền (VNĐ)</th>
          </tr>
        </thead>
        <tbody>
          ${est.boqSummary.map((item, idx) => `
            <tr>
              <td style="text-align:center; font-weight:700;">${idx + 1}</td>
              <td><b>${item.item}</b>${item.spec ? `<br/><span style="font-size:6.5px; color:#475569;">${item.spec}</span>` : ''}</td>
              <td style="text-align:right; font-weight:600;">${item.volume}</td>
              <td style="text-align:center; color:#64748b;">${item.unit}</td>
              <td style="text-align:right; color:#475569;">${item.unitPrice}</td>
              <td style="text-align:right; color:#047857;">${item.material}</td>
              <td style="text-align:right; color:#b45309;">${item.labor}</td>
              <td style="text-align:right; font-weight:700; color:#0f172a;">${item.totalAmount}</td>
            </tr>
          `).join('')}
          <tr style="background:#0f172a; color:#ffffff; font-weight:800;">
            <td colspan="7" style="text-align:right; padding: 5px 8px; color:#f59e0b; font-size:8.5px;">TỔNG CỘNG (${est.selectedOption.title}):</td>
            <td style="text-align:right; padding: 5px 8px; color:#fde047; font-size:9.5px; font-weight:900;">${formatCurrency(est.selectedOption.totalCost, lang)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Section 3: Giải pháp kết cấu kỹ thuật -->
    <div class="section">
      <div class="section-title">3. Giải Pháp Kết Cấu & Quy Chuẩn Xây Dựng</div>
      <div class="card" style="font-size: 9.5px; line-height: 1.45;">
        <div style="margin-bottom: 3px;">🏗️ <b>Giải pháp nền móng:</b> ${est.structuralSolution.foundation}</div>
        <div style="margin-bottom: 3px;">🏢 <b>Khung thân chịu lực:</b> ${est.structuralSolution.columnsBeams}</div>
        <div style="margin-bottom: 3px;">🧱 <b>Tường ngăn & bao che:</b> ${est.structuralSolution.wallsCeiling}</div>
        <div>🛡️ <b>Mái & Biện pháp Chống thấm:</b> ${est.structuralSolution.roofing}. ${est.structuralSolution.waterproofing}</div>
      </div>
    </div>

    <!-- Section 4: Kế hoạch tiến độ 5 giai đoạn -->
    <div class="section">
      <div class="section-title">4. Tiến Độ Thi Công Dự Kiến (${est.timelinePhases.reduce((acc, p) => acc + parseInt(p.duration || '30'), 0)} Ngày)</div>
      <div class="grid-2" style="gap: 5px;">
        ${est.timelinePhases.map(phase => `
          <div class="cell" style="padding: 4px 8px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-weight:700; font-size:9px; color:#0f172a;">${phase.phase}</span>
              <span style="font-weight:700; font-size:8.5px; color:#d97706;">${phase.percentage} (${phase.duration})</span>
            </div>
            <div style="font-size:8px; color:#64748b; margin-top:2px;">${phase.workContent}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Section 5: Hộp Tư Vấn & Nâng cấp -->
    <div class="section" style="margin-top: 8px;">
      <div class="banner-cta">
        <div>
          <div style="font-size: 10.5px; font-weight: 800; color: #fde047;">🎬 NÂNG CẤP VIDEO 3D CINEMATIC TOÀN CẢNH CĂN NHÀ</div>
          <div style="font-size: 9px; color: #e2e8f0; margin-top: 2px;">
            Trải nghiệm không gian sống chân thực trước khi xây · Chỉ từ 200.000đ · Hotline: <b>${hotline}</b> · Zalo: <b>0339.606.969</b>
          </div>
        </div>
        <div class="btn-gold">Hotline Kỹ Sư</div>
      </div>
    </div>
  </div>

  <!-- Footer Page 2 -->
  <div class="footer">
    <span>🏛️ YOHU CONSTECH · Báo Cáo Kỹ Thuật Đã Được Kiểm Tra Quy Chuẩn</span>
    <span>Tư vấn trực tiếp: <b>${hotline}</b> · Website: www.379aipro.online</span>
    <span>Trang <b>${2 + sumOff}/${totalPages}</b></span>
  </div>
</div>
` : ''}

${goi === 'design' ? `
<!-- TRANG 3: SƠ ĐỒ MẶT BẰNG BỐ TRÍ CÔNG NĂNG & TIÊU CHUẨN HOÀN THIỆN CAO CẤP -->
<div class="pdf-page">
  <div>
    <!-- Header Page 3 -->
    <div class="header">
      <div class="header-top">
        <div>
          <div class="brand">📐 YOHU CONSTECH · BẢN VẼ MẶT BẰNG & QUY HOẠCH CÔNG NĂNG</div>
          <div class="title">Sơ Đồ Phân Khu Kiến Trúc & Chứng Nhận Thẩm Định Kỹ Thuật</div>
        </div>
        <div class="badge" style="background:#7c3aed; color:#fff;">${lang === 'vi' ? 'Gói Thiết Kế 1.5M' : `Design Tier (${formatCurrency(1500000, lang)})`}</div>
      </div>
      <div class="meta-bar">
        <span>Gia chủ: <b>${ten}</b></span>
        <span>Công trình: <b>${ct.constructionType || 'Nhà phố / Biệt thự'} (${est.floors} Tầng)</b></span>
        <span>Mã hồ sơ: <b>${clientId}</b></span>
      </div>
    </div>

    <!-- Section 1: Phân khu công năng không gian sống -->
    <div class="section">
      <div class="section-title">1. Quy Hoạch Phân Bổ Không Gian & Công Năng Kiến Trúc</div>
      <div class="grid-2" style="gap: 8px;">
        <div class="cell" style="border-left: 3px solid #f59e0b;">
          <div style="font-weight:700; font-size:10px; color:#b45309;">🛋️ Phòng Khách & Sảnh Đón (Tầng 1)</div>
          <div style="font-size:8.5px; color:#334155; margin-top:2px; line-height:1.4;">
            Bố trí tại phương vị đón sinh khí tài lộc, liên thông với khoảng đệm sảnh chính. Đón gió tươi đối lưu tự nhiên, trần cao thoáng đãng tạo tầm nhìn mở rộng.
          </div>
        </div>
        <div class="cell" style="border-left: 3px solid #10b981;">
          <div style="font-weight:700; font-size:10px; color:#047857;">🍳 Bếp & Không Gian Ăn Uống</div>
          <div style="font-size:8.5px; color:#334155; margin-top:2px; line-height:1.4;">
            Nguyên tắc "Tọa Hung Hướng Cát" thiêu đốt tà khí. Hệ thống thoát mùi cưỡng bức độc lập, cách xa phòng ngủ master, kết nối sân sau tiện lợi.
          </div>
        </div>
        <div class="cell" style="border-left: 3px solid #6366f1;">
          <div style="font-weight:700; font-size:10px; color:#4338ca;">🛏️ Phòng Ngủ Master & Vệ Sinh Khép Kín</div>
          <div style="font-size:8.5px; color:#334155; margin-top:2px; line-height:1.4;">
            Bố trí tọa lạc tại phương vị Diên Niên/Sinh Khí của gia chủ (${ten}). Tường cách âm chuyên dụng, cửa sổ ban công lấy sáng tự nhiên.
          </div>
        </div>
        <div class="cell" style="border-left: 3px solid #8b5cf6;">
          <div style="font-weight:700; font-size:10px; color:#6d28d9;">🙏 Phòng Thờ / Không Gian Tâm Linh</div>
          <div style="font-size:8.5px; color:#334155; margin-top:2px; line-height:1.4;">
            Đặt tại vị trí trang nghiêm cao nhất, không tựa lưng vào nhà vệ sinh hay xà ngang đè, hướng bàn thờ đón cát khí theo bát trạch.
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Tiêu chuẩn kỹ thuật hoàn thiện cao cấp -->
    <div class="section">
      <div class="section-title">2. Quy Chuẩn Vật Tư & Tiêu Chuẩn Hoàn Thiện Công Trình</div>
      <table class="styled-table">
        <thead>
          <tr>
            <th style="width: 30px;">STT</th>
            <th style="width: 130px;">Hạng Mục Hoàn Thiện</th>
            <th>Tiêu Chuẩn Kỹ Thuật & Thương Hiệu Chỉ Định</th>
            <th style="width: 100px; text-align:center;">Quy Chuẩn</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align:center; font-weight:700;">1</td>
            <td><b>Hệ cửa đi & cửa sổ</b></td>
            <td>Nhôm Xingfa Quảng Đông hệ 55 tem đỏ nhập khẩu, kính an toàn 2 lớp 8.38mm dán phản quang, phụ kiện Kinlong chính hãng đồng bộ.</td>
            <td style="text-align:center; color:#047857; font-weight:600;">TCVN 9366:2012</td>
          </tr>
          <tr>
            <td style="text-align:center; font-weight:700;">2</td>
            <td><b>Sơn bả & chống thấm</b></td>
            <td>Sơn phủ ngoại thất Dulux Weathershield chống rêu mốc 8 năm, sơn nội thất Dulux Ambiance 5in1, 2 lớp sơn lót kháng kiềm chống ẩm mốc.</td>
            <td style="text-align:center; color:#047857; font-weight:600;">TCVN 8652:2020</td>
          </tr>
          <tr>
            <td style="text-align:center; font-weight:700;">3</td>
            <td><b>Gạch ốp lát & Đá Granite</b></td>
            <td>Gạch lát sàn Granite bóng kính cao cấp 800x800 Prime/Viglacera xương bán sứ porcelain chịu lực cao; Mặt bậc cầu thang đá Granite tự nhiên.</td>
            <td style="text-align:center; color:#047857; font-weight:600;">TCVN 7745:2007</td>
          </tr>
          <tr>
            <td style="text-align:center; font-weight:700;">4</td>
            <td><b>Thiết bị điện & chiếu sáng</b></td>
            <td>Dây cáp điện Cadivi lõi đồng cách điện PVC/XLPE, thiết bị công tắc ổ cắm Panasonic Wide series, đèn LED âm trần Rạng Đông tiết kiệm điện.</td>
            <td style="text-align:center; color:#047857; font-weight:600;">TCVN 6610:2007</td>
          </tr>
          <tr>
            <td style="text-align:center; font-weight:700;">5</td>
            <td><b>Hệ thống cấp thoát nước</b></td>
            <td>Ống nhựa Tiền Phong chịu nhiệt PPR cho nước nóng lạnh, ống PVC thoát nước thải; Sứ vệ sinh Inax công nghệ men Aqua Ceramic cao cấp.</td>
            <td style="text-align:center; color:#047857; font-weight:600;">TCVN 4513:1988</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Section 3: Sơ Đồ Mặt Bằng Kiến Trúc 2D Trực Quan ({{so_do_mat_bang}}) -->
    <div class="section">
      <div class="section-title">3. Sơ Đồ Mặt Bằng Kiến Trúc 2D Trực Quan (Tỉ Lệ 1:100) ({{so_do_mat_bang}})</div>
      <div style="text-align:center; margin-top: 3px; background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; padding:4px;">
        <img src="${archSvgDataUrl}" style="max-width:100%; max-height:160px; object-fit:contain;" />
      </div>
      <div style="font-size: 8.5px; color:#475569; margin-top:3px; text-align:center;">
        Bản vẽ trực quan: Phân khu phòng khách, bếp, phòng ngủ, WC, kích thước chuẩn và bố trí nội thất phong thủy.
      </div>
    </div>

    <!-- Section 4: Mặt Cắt Đứng & Chiều Cao ({{mat_cat_dung}}) -->
    <div class="section" style="margin-top: 4px;">
      <div class="section-title">4. Mặt Cắt Đứng & Chiều Cao Tầng (Elevation DXF) ({{mat_cat_dung}})</div>
      ${data.elevationSvgUrl ? `
        <div style="text-align:center; margin-top: 3px;">
          <img src="${data.elevationSvgUrl}" style="max-width:100%; max-height:110px; object-fit:contain; border-radius:6px; border:1px solid #cbd5e1; background:#080d1a;" />
        </div>
      ` : `
        <div style="padding:6px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:6px; text-align:center; font-size:9.5px; color:#64748b;">
          Bản vẽ mặt cắt đứng đang được khởi tạo từ hệ thống MakerJS
        </div>
      `}
      <div style="font-size: 8px; color:#b45309; margin-top:2px; font-style:italic; text-align:center;">
        ⚠️ Lưu ý: Đây là bản vẽ sơ bộ do AI hỗ trợ, cần kỹ sư có chứng chỉ hành nghề của Yohu kiểm tra trước khi thi công thực tế.
      </div>
    </div>

    <!-- Section 5: Phối Cảnh 3D & Video ({{anh_phoi_canh}}) -->
    <div class="section" style="margin-top: 4px;">
      <div class="section-title">5. Phối Cảnh 3D & Mô Hình Không Gian Thực Tế ({{anh_phoi_canh}})</div>
      ${data.link_anh_phoi_canh ? `
        <div style="text-align:center; margin-top: 3px;">
          <img src="${data.link_anh_phoi_canh}" style="max-width:100%; max-height:100px; object-fit:cover; border-radius:6px; border:1px solid #cbd5e1;" />
        </div>
      ` : `
        <div style="padding:4px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:6px; text-align:center; font-size:9.5px; color:#64748b;">
          Ảnh phối cảnh đang được chuyên viên xử lý, sẽ gửi bổ sung trong 24h
        </div>
      `}
      ${data.link_video_phoi_canh ? `
        <div style="margin-top: 3px; font-size: 9px;">
          <b>Video phối cảnh:</b> <a href="${data.link_video_phoi_canh}" target="_blank" style="color:#2563eb; text-decoration:underline; font-weight:700;">🔗 Xem Video Phối Cảnh 3D Chi Tiết</a>
        </div>
      ` : `
        <div style="margin-top: 3px; font-size: 8.5px; color:#64748b; font-style:italic;">
          Video phối cảnh đang được chuyên viên render, sẽ gửi bổ sung trong 24h
        </div>
      `}
    </div>

    <!-- Section 6: Hồ Sơ Hoàn Công Mẫu ({{ai_ho_so_hoan_cong}}) -->
    <div class="section" style="margin-top: 4px;">
      <div class="section-title">6. Hồ Sơ Hoàn Công Mẫu ({{ai_ho_so_hoan_cong}})</div>
      <div class="card" style="font-size: 8.5px; line-height: 1.45; background:#fffbeb; border-color:#fde68a;">
        <div style="white-space: pre-line; color:#1e293b;">${ai.ho_so_hoan_cong || '1. Checklist nghiệm thu: Nghiệm thu móng, cốt thép, cốp pha, đổ bê tông và hệ thống MEP.\n2. Danh mục vật tư: Thép Hòa Phát CB400, Xi măng PCB40, Gạch Viglacera, Sơn Dulux.\n3. Bảo hành mẫu: Kết cấu 10 năm, chống thấm 5 năm, thiết bị 2 năm.\n4. Hướng dẫn bảo trì cơ bản 6 tháng đầu: Kiểm tra định kỳ độ ẩm, chống thấm và kết cấu.'}</div>
        <div style="font-size: 7.5px; color:#b45309; margin-top:2px; font-style:italic; font-weight:700;">
          ⚠️ Lưu ý: Đây là MẪU MINH HỌA, hồ sơ hoàn công thực tế sẽ được lập dựa trên thi công thực tế và có xác nhận của kỹ sư giám sát.
        </div>
      </div>
    </div>

    <!-- Section 4: Con dấu thẩm duyệt và cam kết kỹ thuật -->
    <div class="section" style="margin-top: 10px;">
      <div class="card" style="display:flex; justify-content:space-between; align-items:center; background:#fafafa; border:2px dashed #cbd5e1; padding:12px 18px;">
        <div style="flex:1;">
          <div style="font-weight:800; font-size:11px; color:#0f172a; text-transform:uppercase;">
            🏛️ HỘI ĐỒNG THẨM ĐỊNH KỸ THUẬT & KIẾN TRÚC YOHU CONSTECH
          </div>
          <div style="font-size:9px; color:#64748b; margin-top:3px; line-height:1.45;">
            Hồ sơ thiết kế và bảng bóc tách khối lượng đã được rà soát đối chiếu theo bộ Tiêu chuẩn Xây dựng Việt Nam (TCVN hiện hành).<br/>
            Khách hàng được hỗ trợ kỹ sư khảo sát thực địa và giám sát thi công theo hợp đồng trọn gói.
          </div>
          <div style="font-size:8.5px; color:#0f172a; margin-top:6px; font-weight:600;">
            Kỹ sư phụ trách: <b>KS. Nguyễn Văn Tuấn</b> · Hotline tiếp nhận: <b>${hotline}</b> · Email: <b>yohu.vn@gmail.com</b>
          </div>
        </div>
        <div style="margin-left:20px; text-align:center;">
          <div style="border:3px double #dc2626; border-radius:12px; padding:6px 14px; background:#fff; transform:rotate(-4deg); box-shadow:0 2px 8px rgba(220,38,38,0.15);">
            <div style="font-size:8px; font-weight:800; color:#dc2626; text-transform:uppercase; letter-spacing:0.5px;">YOHU VIỆT NAM</div>
            <div style="font-size:12px; font-weight:900; color:#dc2626; margin:2px 0;">★ ĐÃ THẨM DUYỆT ★</div>
            <div style="font-size:7.5px; font-weight:700; color:#dc2626;">CHUẨN XÂY DỰNG 2026</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer Page 3 -->
  <div class="footer">
    <span>🏛️ YOHU CONSTECH · Hồ Sơ Thiết Kế Kiến Trúc & Dự Toán Trọn Gói</span>
    <span>Tư vấn kỹ sư trực tiếp: <b>${hotline}</b> · Website: www.379aipro.online</span>
    <span>Trang <b>${3 + sumOff}/${totalPages}</b></span>
  </div>
</div>
` : ''}

</body>
</html>
`;

      // Render to PDF using exact 794x1123 canvas and 210x297mm A4 sizing
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1';
      container.innerHTML = html;
      document.body.appendChild(container);

      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pages = container.querySelectorAll('.pdf-page');

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: 794,
          height: 1123,
          windowWidth: 794,
          windowHeight: 1123,
          onclone: (clonedDoc) => {
            const allEls = clonedDoc.querySelectorAll('*');
            allEls.forEach((el: any) => {
              if (el.style) {
                if (el.style.color && el.style.color.includes('oklch')) el.style.color = '#111827';
                if (el.style.backgroundColor && el.style.backgroundColor.includes('oklch')) el.style.backgroundColor = '#ffffff';
                if (el.style.borderColor && el.style.borderColor.includes('oklch')) el.style.borderColor = '#cbd5e1';
              }
            });
          }
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }

      document.body.removeChild(container);

      const tenFile = `YOHU_${ten.replace(/\s+/g, '_')}_${goiLabel.replace(/\s+/g, '-')}_${ngay.replace(/\//g, '-')}.pdf`;
      pdf.save(tenFile);

      // Notify GAS Sheet
      const GAS_URL = dynamicGasUrl;
      const goiMap: Record<string, string> = { free: 'Báo cáo cơ bản', standard: 'Báo cáo đầy đủ', design: 'Báo cáo + Bản vẽ' };
      const params = new URLSearchParams({ data: JSON.stringify({ type: "xuat_pdf", ma_kh: clientId, goi_mua: goiMap[goi] }) });
      callGas(params).catch(() => {});

    } catch (err) {
      console.error(err);
      alert("Lỗi tạo PDF: " + String(err));
    } finally {
      setAiLoading(false);
    }
  };

  const handleAuthPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPhone.trim()) return;
    setIsLoggedIn(true);
    setLoggedUser(authPhone);
    setAuthModalOpen(false);

    try {
      const saved = localStorage.getItem("yohu_crm_leads");
      const leads: any[] = saved ? JSON.parse(saved) : [];
      const existingLead = leads.find((l: any) => l.userInfo?.phone === authPhone);
      if (existingLead) {
        if (existingLead.id) setClientId(existingLead.id);
        // Hồ sơ cũ thay HẲN dữ liệu đang có (không trộn tuổi vợ/chồng, hướng… của hồ sơ khác); chỉ giữ xác nhận đồng ý vừa tick
        const restoredUserInfo = existingLead.userInfo
          ? { ...existingLead.userInfo, phone: authPhone, consentAt: (existingLead.userInfo as any).consentAt || (userInfo as any).consentAt }
          : { ...userInfo, phone: authPhone };
        setUserInfo(restoredUserInfo);
        if (existingLead.constructionInfo) setConstructionInfo(prev => ({ ...prev, ...existingLead.constructionInfo }));
        if (existingLead.detailItems) setDetailItems(prev => ({ ...prev, ...existingLead.detailItems }));
        if (existingLead.fengShuiAnalysis) setFengShuiAnalysis(existingLead.fengShuiAnalysis);
        if (existingLead.aiReport) setAiReport(existingLead.aiReport);
        
        // Push the restored data immediately to Sheets
        setTimeout(() => {
          syncLeadToServer(existingLead.aiReport, existingLead.fengShuiAnalysis, restoredUserInfo);
        }, 300);
        return;
      }
    } catch (err) {
      console.error("Failed to load existing lead:", err);
    }
    
    const updatedUserInfo = { ...userInfo, phone: authPhone };
    setUserInfo(updatedUserInfo);
    setTimeout(() => {
      syncLeadToServer(undefined, fengShuiAnalysis, updatedUserInfo);
    }, 300);
  };

  const handleOnboardingDone = (data: OnboardingData) => {
    setOnboardingDone(true);
    // Tỉnh & loại đất khách chọn lúc đầu → đưa vào dữ liệu công trình (dùng cho dự toán & móng)
    if (data) setConstructionInfo(prev => ({ ...prev, province: (prev as any).province || data.province, soilType: (prev as any).soilType || data.soilType } as any));
    syncLeadToServer();
  };

  return (
    <div className={`min-h-screen w-full overflow-y-auto overflow-x-hidden font-sans ${theme === 'dark' ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-300 relative custom-scrollbar`}>
      {isLoggedIn && !onboardingDone && <OnboardingPopup onDone={handleOnboardingDone} theme={theme} />}
      
      {/* BEAUTIFUL BACKGROUND AMBIENT GRADIENTS */}
      <div className="absolute top-0 left-0 w-full h-[32rem] bg-gradient-to-b from-blue-900/15 via-red-950/5 to-transparent pointer-events-none" />
      
      {/* RESPONSIVE FLUID CONTAINER FOR DESKTOP SIZING VS MOBILE EMULATOR */}
      <div className="w-full max-w-none px-2 sm:px-4 lg:px-8 py-0 lg:py-6 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 min-h-[92vh]">
        
        {/* DESKTOP INFO COLUMN (LEFT-SIDE) */}
        <div className="hidden lg:flex flex-col flex-1 max-w-lg text-left self-start mt-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/15 border border-red-500/20 text-red-600 rounded-full text-xs font-bold tracking-wider mb-5 w-max">
            <Sparkles className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-[#FFD700]' : 'text-red-600'}`} />
            YOHU PREMIUM AI PLATFORM DIRECTORY
          </div>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight mb-3 drop-shadow-sm font-sans uppercase ${theme === 'dark' ? 'text-[#FFD700]' : 'text-red-600'}`}>
            Yohu AI Build
          </h1>
          <p className={`text-base font-bold mb-4 font-mono leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-900'}`}>
            {t.mainPunchline}
          </p>
          <div className={`space-y-4 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-800 font-medium'}`}>
            <p className="leading-relaxed">
              {t.sidebarDesc}
            </p>
            <div className={`border-l-2 border-red-600 pl-4 py-2.5 italic rounded-r-lg ${theme === 'dark' ? 'bg-slate-800/20 text-slate-300' : 'bg-red-50/70 text-slate-900'}`}>
              {t.sidebarQuote}
            </div>
          </div>

          <div className={`mt-8 pt-8 border-t flex flex-wrap gap-4 text-xs font-mono ${theme === 'dark' ? 'border-slate-800/80 text-slate-500' : 'border-slate-200 text-slate-700 font-semibold'}`}>
            <span>YOHU VIETNAM CO., LTD</span>
            <span>·</span>
            <span>Hotline: +84 973 480 488</span>
            <span>·</span>
            <span>Site: www.379aipro.online</span>
          </div>
        </div>

        {/* FULL-STACK TRANSITIONABLE CRM MANAGEMENT DASHBOARD PANEL */}
        {showAdminDashboard && isAdminAuthenticated ? (
          <>
          <div className="p-4 mb-4 rounded-xl bg-amber-950/30 border border-amber-500/30">
  <p className="text-amber-400 font-bold text-sm mb-3">{t.adminActivatePack}</p>
  <div className="flex gap-2 flex-wrap">
    <button onClick={() => adminKichHoatGoi('free')}
      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${goiKichHoat==='free' ? 'bg-green-600 text-white border-green-500' : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-green-500'}`}>
      🆓 {t.adminGoiFree}
    </button>
    <button onClick={() => adminKichHoatGoi('standard')}
      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${goiKichHoat==='standard' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-blue-500'}`}>
      📄 {t.adminGoiStandard}
    </button>
    <button onClick={() => adminKichHoatGoi('design')}
      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${goiKichHoat==='design' ? 'bg-purple-600 text-white border-purple-500' : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-purple-500'}`}>
      🏗️ {t.adminGoiDesign}
    </button>
  </div>
  <p className="text-slate-500 text-xs mt-2">{t.adminCurrentPack} <span className="text-amber-400 font-bold">{goiKichHoat === 'free' ? t.pdf.labels.basicReport : goiKichHoat === 'standard' ? t.pdf.labels.fullReport : t.pdf.labels.designReport}</span></p>
</div>
          <div className="w-full max-w-7xl bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-2xl relative animate-fade-in text-slate-100 z-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-amber-500/20 text-amber-500 rounded-lg">
                    <Database className="w-6 h-6" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#FFD700]">Yohu Admin Panel</h2>
                    <p className="text-xs text-slate-400">Total System Management</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCTVDashboard(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <Users className="w-4 h-4" /> CTV
                </button>
                <button 
                  onClick={() => setShowAdminDashboard(false)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-4 h-4" /> {t.adminClose}
                </button>
              </div>
            </div>

            {/* TABS */}
            <div className="flex gap-2 border-b border-slate-800 mb-6 overflow-x-auto">
              <button onClick={() => setActiveAdminTab('leads')} className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeAdminTab === 'leads' ? 'text-amber-500 border-amber-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
                {lang === 'vi' ? 'CRM Leads' : lang === 'lo' ? 'ລາຍຊື່ລູກຄ້າ CRM' : lang === 'zh' ? '客户档案 CRM' : 'CRM Leads'}
              </button>
              {canAdmin('activate') && <button onClick={() => setActiveAdminTab('payments')} className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeAdminTab === 'payments' ? 'text-amber-500 border-amber-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>💳 Thanh toán</button>}
              <button onClick={() => setActiveAdminTab('videos')} className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeAdminTab === 'videos' ? 'text-amber-500 border-amber-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
                {lang === 'vi' ? 'Đơn Video' : lang === 'lo' ? 'ລາຍການວິດີໂອ' : lang === 'zh' ? '视频订单' : 'Video Orders'}
              </button>
              <button onClick={() => setActiveAdminTab('commissions')} className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeAdminTab === 'commissions' ? 'text-amber-500 border-amber-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
                {lang === 'vi' ? 'Duyệt Hoa Hồng' : lang === 'lo' ? 'ອະນຸມັດຄ່າຄອມ' : lang === 'zh' ? '佣金审核' : 'Affiliate Commissions'}
              </button>
              <button onClick={() => setActiveAdminTab('ctv')} className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeAdminTab === 'ctv' ? 'text-amber-500 border-amber-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
                {lang === 'vi' ? 'Quản lý CTV_Affiliate' : 'CTV_Affiliate'}
              </button>
              <button onClick={() => setActiveAdminTab('samples')} className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeAdminTab === 'samples' ? 'text-amber-500 border-amber-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
                🖼️ Mẫu thiết kế
              </button>
              <button onClick={() => setActiveAdminTab('errors')} className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeAdminTab === 'errors' ? 'text-amber-500 border-amber-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>🧯 Lỗi gần đây</button>
              {adminMe?.owner && <button onClick={() => setActiveAdminTab('staff')} className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeAdminTab === 'staff' ? 'text-amber-500 border-amber-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>👥 Nhân viên</button>}
              <button onClick={() => setActiveAdminTab('settings')} className={`px-4 py-2 text-sm font-bold border-b-2 transition ${activeAdminTab === 'settings' ? 'text-amber-500 border-amber-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
                ⚙️ Cài đặt
              </button>
            </div>
            <LazyBox>
            {activeAdminTab === 'samples' && <AdminDesignManager />}
            {activeAdminTab === 'settings' && <AdminSettingsPanel />}
            {activeAdminTab === 'payments' && <PaymentsPanel />}
            {activeAdminTab === 'staff' && <StaffPanel />}
            {activeAdminTab === 'errors' && <ErrorsPanel />}
            {adminMe && !adminMe.owner && <div className="mb-3 text-xs text-slate-400">Đăng nhập: <b className="text-slate-200">{adminMe.name}</b> · quyền: {adminMe.roles.join(', ')}. Mục không có quyền sẽ báo "chưa được cấp quyền".</div>}

            {activeAdminTab === 'leads' && (
              <CrmDashboard 
                onClose={() => setShowAdminDashboard(false)}
                crmLeads={crmLeads}
                onUpdateStatus={handleUpdateCrmStatus}
                onExportCSV={exportCRMtoCSV}
                onExportPDF={xuatPDF}
                onLoadLead={(lead) => {
                  handleLoadLead(lead);
                  setShowAdminDashboard(false);
                }}
                onActivateLeadGoi={handleAdminActivateLeadGoi}
                dynamicGasUrl={dynamicGasUrl}
                onUpdateGasUrl={(newUrl) => {
                  setDynamicGasUrl(newUrl);
                  localStorage.setItem("yohu_gas_url", newUrl);
                }}
                onLogoutAdmin={handleAdminLogout}
                lang={lang}
                t={t}
              />
            )}

            {activeAdminTab === 'videos' && (() => {
              const normalizeStatus = (statusStr?: string): 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' => {
                const s = String(statusStr || '').toUpperCase();
                if (s.includes('COMPLET') || s.includes('XONG') || s.includes('HOÀN THÀNH') || s.includes('ĐÃ GIAO')) return 'COMPLETED';
                if (s.includes('RENDER') || s.includes('PROGRESS') || s.includes('LÀM') || s.includes('TẠO') || s.includes('DISPATCH') || s.includes('XỬ LÝ')) return 'IN_PROGRESS';
                return 'PENDING';
              };

              const allOrders = (videoOrders || []);
              const countPending = allOrders.filter(o => normalizeStatus(o.status) === 'PENDING').length;
              const countInProgress = allOrders.filter(o => normalizeStatus(o.status) === 'IN_PROGRESS').length;
              const countCompleted = allOrders.filter(o => normalizeStatus(o.status) === 'COMPLETED').length;

              const filteredOrders = allOrders.filter(o => {
                const norm = normalizeStatus(o.status);
                if (adminVideoStatusFilter === 'PENDING' && norm !== 'PENDING') return false;
                if (adminVideoStatusFilter === 'IN_PROGRESS' && norm !== 'IN_PROGRESS') return false;
                if (adminVideoStatusFilter === 'COMPLETED' && norm !== 'COMPLETED') return false;
                if (adminVideoSearch.trim()) {
                  const q = adminVideoSearch.toLowerCase();
                  const matchCust = (o.customerName || o.customerId || "").toLowerCase().includes(q);
                  const matchPhone = (o.phone || "").includes(q);
                  const matchPkg = (o.packageName || o.packageId || o.packageType || "").toLowerCase().includes(q);
                  return matchCust || matchPhone || matchPkg;
                }
                return true;
              });

              return (
                <div className="space-y-4">
                  {/* Status Filter Toolbar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 mr-1">Lọc trạng thái:</span>
                      
                      <button
                        type="button"
                        onClick={() => setAdminVideoStatusFilter('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          adminVideoStatusFilter === 'ALL'
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <span>Tất cả</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px] font-mono">{allOrders.length}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAdminVideoStatusFilter('PENDING')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          adminVideoStatusFilter === 'PENDING'
                            ? 'bg-amber-600 text-white font-black'
                            : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                        }`}
                      >
                        <span>⏳ Pending (Chờ duyệt)</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 text-[10px] font-mono">{countPending}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAdminVideoStatusFilter('IN_PROGRESS')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          adminVideoStatusFilter === 'IN_PROGRESS'
                            ? 'bg-purple-600 text-white font-black'
                            : 'bg-slate-800 text-purple-400 hover:bg-slate-700'
                        }`}
                      >
                        <span>⚙️ In Progress (Đang làm)</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-300 text-[10px] font-mono">{countInProgress}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAdminVideoStatusFilter('COMPLETED')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          adminVideoStatusFilter === 'COMPLETED'
                            ? 'bg-emerald-600 text-white font-black'
                            : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                        }`}
                      >
                        <span>✅ Completed (Hoàn thành)</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-mono">{countCompleted}</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={adminVideoSearch}
                      onChange={(e) => setAdminVideoSearch(e.target.value)}
                      placeholder="Tìm đơn theo tên, mã KH..."
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 w-full sm:w-56"
                    />
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800 font-mono text-slate-400">
                          <th className="p-3">Mã Đơn / Khách Hàng</th>
                          <th className="p-3">Gói Dịch Vụ</th>
                          <th className="p-3">Ảnh Phối Cảnh & Bản Vẽ</th>
                          <th className="p-3">Trạng Thái</th>
                          <th className="p-3">Hành Động Video Studio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {filteredOrders.map(order => {
                          const norm = normalizeStatus(order.status);
                          return (
                            <tr key={order.id} className="hover:bg-slate-900/50 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-slate-100">{order.customerName || order.customerId}</div>
                                <div className="text-amber-400 font-mono text-[11px] mt-0.5">{order.phone || order.customerId}</div>
                                <div className="text-slate-500 font-mono text-[9px] mt-0.5">{order.id}</div>
                              </td>

                              <td className="p-3">
                                <span className="font-bold text-amber-300 font-mono text-[11px]">
                                  {order.packageName || order.packageId}
                                </span>
                                {order.price && (
                                  <div className="text-emerald-400 font-mono font-bold mt-0.5">
                                    {formatCurrency(order.price, lang)}
                                  </div>
                                )}
                              </td>

                              <td className="p-3">
                                {order.images && order.images.length > 0 ? (
                                  <div className="flex items-center gap-1.5">
                                    {order.images.slice(0, 3).map((img: string, i: number) => (
                                      <img key={i} src={img} alt="Thumb" className="w-8 h-8 rounded object-cover border border-slate-700" />
                                    ))}
                                    {order.images.length > 3 && (
                                      <span className="text-[10px] text-slate-400 font-mono">+{order.images.length - 3}</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[11px] italic">Bản vẽ theo hồ sơ</span>
                                )}
                              </td>

                              <td className="p-3">
                                <div className="flex flex-col gap-1">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono w-fit uppercase ${
                                    norm === 'COMPLETED'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                      : norm === 'IN_PROGRESS'
                                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                  }`}>
                                    {norm === 'COMPLETED' ? '✅ Completed' : norm === 'IN_PROGRESS' ? '⚙️ In Progress' : '⏳ Pending'}
                                  </span>

                                  <select 
                                    value={order.status}
                                    onChange={(e) => updateVideoStatus(order.id, e.target.value)}
                                    className="bg-slate-900 border border-slate-700 text-slate-200 rounded p-1 text-[10px] cursor-pointer"
                                  >
                                    <option value="PENDING">⏳ Chờ duyệt (Pending)</option>
                                    <option value="RENDERING">⚙️ Đang làm (In Progress)</option>
                                    <option value="Hoàn thành">✅ Hoàn thành (Completed)</option>
                                  </select>
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const leadObj = (crmLeads || []).find((l: any) => l.id === order.customerId || l.id === order.projectId) || {
                                        id: order.customerId || order.projectId || order.id,
                                        userInfo: { name: order.customerName, phone: order.phone, birthDate: order.birthYear, desiredDirection: order.direction },
                                        constructionInfo: { constructionType: order.buildingType, referenceImages: order.images },
                                        fengShuiAnalysis: { element: order.element },
                                        videoPackageType: order.packageType,
                                        images: order.images
                                      };
                                      fetch("/api/admin/dispatch-video", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json", "x-admin-code": sessionStorage.getItem("yohu_admin_code") || "" },
                                        body: JSON.stringify({
                                          projectId: leadObj.id,
                                          customerName: leadObj.userInfo?.name || "Gia chủ",
                                          birthYear: order.birthYear || "",
                                          element: order.element || "Thiên Thượng Hỏa",
                                          direction: order.direction || "Nam (Sinh Khí)",
                                          buildingType: order.buildingType || "Nhà phố",
                                          packageType: order.packageType || "STANDARD",
                                          images: order.images || []
                                        })
                                      }).then(r => r.json()).then(() => {
                                        updateVideoStatus(order.id, "RENDERING");
                                        alert("Đã gửi lệnh tạo video 3D sang Video Studio thành công!");
                                      }).catch(() => {
                                        alert("Đã gửi lệnh sang Video Studio!");
                                      });
                                    }}
                                    className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 text-slate-950 font-bold rounded text-[10px] flex items-center gap-1 cursor-pointer"
                                  >
                                    <Film className="w-3.5 h-3.5" />
                                    <span>🎬 Gửi Studio</span>
                                  </button>

                                  {order.link && (
                                    <a
                                      href={order.link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white rounded"
                                      title="Xem Video 3D"
                                    >
                                      <Play className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {filteredOrders.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                              Không có đơn hàng Video 3D nào phù hợp với bộ lọc.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {activeAdminTab === 'commissions' && <CtvManager tab="ledger" ledgerOn={ctvLedgerOn} />}

            {activeAdminTab === 'ctv' && <CtvManager tab="partners" ledgerOn={ctvLedgerOn} />}

            {activeAdminTab === 'perspective' && (
              <PerspectiveImageUploader 
                theme={theme} 
                lang={lang} 
                leads={crmLeads} 
                onUpdatePerspective={handleUpdatePerspective} 
              />
            )}
            </LazyBox>
          </div>
          </>
        ) : (
          <div className={`flex-1 w-full max-w-none ${theme === 'dark' ? 'bg-[#0d1220] border-slate-800' : 'bg-white border-slate-200'} min-h-screen lg:min-h-[700px] lg:h-auto rounded-none lg:rounded-[24px] overflow-hidden flex flex-col lg:border-2 lg:shadow-2xl relative mb-0 lg:mb-10`}>

            <AppHeaderAndSteps
              t={t}
              lang={lang}
              setLang={setLang}
              theme={theme}
              setTheme={handleSetTheme}
              isLoggedIn={isLoggedIn}
              loggedUser={loggedUser}
              onLoginPhoneClick={() => setAuthModalOpen(true)}
              onLogout={() => {
                setIsLoggedIn(false);
                setLoggedUser("");
              }}
              isAdminAuthenticated={isAdminAuthenticated}
              onOpenAdminDashboard={() => setShowAdminDashboard(true)}
              onOpenAdminAuth={() => setShowAdminAuthModal(true)}
              onSyncAiTools={triggerUpdateAiTools}
              updatingAiTools={updatingAiTools}
              currentStep={currentStep}
              onStepChange={handleStepChange}
              userInfo={userInfo}
              constructionInfo={constructionInfo}
              aiCredits={aiCredits}
              goiKichHoat={goiKichHoat}
              onNewProject={handleNewProjectReset}
            />

            {/* DRAFT TOAST BANNER */}
              {draftToast && (
                <div className="absolute top-44 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[12.5px] font-bold py-1.5 px-3.5 rounded-full shadow-lg z-50 flex items-center gap-1 animate-fade-in whitespace-nowrap">
                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  {draftToast}
                </div>
              )}

              {/* SCREEN CONTENT AREA (MAIN SCROLLABLE ACCORDION FORMS) */}
              <div className="flex-1 px-4 py-4 md:py-6 flex flex-col gap-3.5 bg-transparent mb-6">
                
                {/* EXTREMELY IMPORTANT: DATA INCOMPLETENESS NOTICE ALERTS */}
                {missingAlert && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[12.5px] p-3 rounded-2xl flex items-start gap-2 animate-bounce">
                    <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <p className="font-extrabold uppercase text-[12px]">{t.incompleteInfoTitle}</p>
                      <p className="text-[11.5px] text-rose-300 leading-relaxed font-sans mt-0.5">
                        {missingAlert === "A" 
                          ? (t.missingStepAMsg)
                          : (t.missingStepBMsg)
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* ACCORDION MODULE A: HOUSE OWNER (GIA CHỦ) */}
                {currentStep === "A" && (
                  <StepAUserInfoForm
                    theme={theme}
                    t={t}
                    clientId={clientId}
                    aiReport={aiReport}
                    isAdminAuthenticated={isAdminAuthenticated}
                    crmLeads={crmLeads}
                    onOpenSavedProfiles={() => setShowSavedProfilesModal(true)}
                    onCreateNewCustomer={handleCreateNewCustomer}
                    userInfo={userInfo}
                    setUserInfo={setUserInfo}
                    setAuthPhone={setAuthPhone}
                    setLoggedUser={setLoggedUser}
                    setIsLoggedIn={setIsLoggedIn}
                    goiKichHoat={goiKichHoat}
                    triggerFengshuiExport={triggerFengshuiExport}
                    fengshuiCalculating={fengshuiCalculating}
                    fengShuiAnalysis={fengShuiAnalysis}
                    onProceedStepB={() => handleStepChange("B")}
                    company={companyInfo}
                    hotline={hotline}
                    lang={lang}
                  />
                )}

                {/* ACCORDION MODULE B: PROPOSED PROJECT (CÔNG TRÌNH) */}
                {currentStep === "B" && (
                  <div className={`rounded-2xl border ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'} overflow-hidden shadow-md shadow-slate-950/20`}>
                    
                    {/* HOMEOWNER MINI SUMMARY BANNER CARD FOR STEP B */}
                    {userInfo.name && userInfo.birthDate && fengShuiAnalysis && (
                      <div className={`m-3 sm:m-4 p-4 rounded-2xl border text-left animate-fade-in text-xs sm:text-sm ${
                        theme === 'dark' 
                          ? 'bg-[#0e1c2e]/90 border-blue-900/50 text-slate-200' 
                          : 'bg-blue-50/95 border-blue-200 text-slate-900 shadow-xs'
                      }`}>
                        <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-black ${
                          theme === 'dark' ? 'text-[#FFD700]' : 'text-blue-900'
                        }`}>
                          <span>✦</span>
                          <span>{t.applicantSummaryTitle}</span>
                        </div>
                        <div className={`text-xs sm:text-sm font-bold mt-1 pb-1 ${
                          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                        }`}>
                          {t.labelHouseholder} <span className={`font-mono font-bold ${
                            theme === 'dark' ? 'text-emerald-400 italic' : 'text-emerald-700'
                          }`}>{userInfo.name} ({new Date(userInfo.birthDate).getFullYear()})</span>
                        </div>
                        <div className={`text-xs sm:text-sm leading-relaxed mt-0.5 font-medium ${
                          theme === 'dark' ? 'text-slate-300' : 'text-slate-800'
                        }`}>
                          • <span className={`font-bold ${theme === 'dark' ? 'text-amber-400' : 'text-amber-800'}`}>{t.labelElementDir}</span> {fengShuiAnalysis.element} — {fengShuiAnalysis.favorableDirections.slice(0, 2).join(", ")}
                        </div>
                      </div>
                    )}

                    <div 
                      className={`flex items-center justify-between p-3.5 select-none ${theme === 'dark' ? 'bg-[#0f1423]' : 'bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5.5 h-5.5 bg-[#a81d1d] text-white rounded-full flex items-center justify-center font-bold text-[12px]">B</span>
                        <h2 className={`text-[14px] font-black tracking-tight ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{t.stepB_title}</h2>
                      </div>
                    </div>

                    <div className={`p-4 space-y-4 border-t text-[13px] ${theme === 'dark' ? 'bg-[#080d1a] border-slate-800' : 'bg-white border-slate-200'}`}>
                      {/* AI Project Intake Uploader */}
                      <ProjectIntakeUploader onApplyData={handleApplyExtractedData} theme={theme} lang={lang} />

                      {/* ESTIMATION CALCULATION METHOD SELECTOR */}
                      <div className={`p-4 rounded-xl border space-y-3 ${
                        theme === 'dark' ? 'bg-[#101728] border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div>
                          <h3 className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-amber-400' : 'text-slate-900'}`}>
                            📐 {t.calcMethodTitle}
                          </h3>
                          <p className={`text-[11px] mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            {t.calcMethodSub}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`text-sm sm:text-base font-black uppercase tracking-wider ${theme === 'dark' ? 'text-amber-400' : 'text-slate-900'}`}>
                            📐 {t.calcMethodTitle}
                          </h3>
                          <p className={`text-xs sm:text-sm mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            {t.calcMethodSub}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {/* Option 1: Coefficient Method */}
                          <div 
                            onClick={() => {
                              setConstructionInfo({ ...constructionInfo, calculationMethod: 'coefficient' });
                              setCalcMethodModalPkg('coefficient');
                            }}
                            className={`p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between min-h-[145px] ${
                              (constructionInfo.calculationMethod || 'coefficient') === 'coefficient'
                                ? 'ring-2 ring-blue-500 border-blue-600 bg-blue-600/10 shadow-md'
                                : theme === 'dark' ? 'bg-[#0a0e1a] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between mb-1.5 gap-2">
                                <div className="text-sm sm:text-base font-black uppercase text-blue-500 tracking-tight leading-snug">
                                  {t.calcMethodCoeffTitle}
                                </div>
                                <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase bg-blue-600 text-white shrink-0 whitespace-nowrap shadow-xs">
                                  {t.calcMethodCoeffBadge}
                                </span>
                              </div>
                              <div className={`text-xs sm:text-sm font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                {(t as any).calcMethodCoeffSub}
                              </div>
                              <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                {t.calcMethodCoeffDesc}
                              </p>
                            </div>
                            <div className="mt-3 pt-2.5 border-t border-slate-800/15 flex items-center justify-between text-xs sm:text-sm font-black text-blue-400">
                              <span className="whitespace-nowrap flex items-center gap-1">🔍 {(t as any).calcMethodViewDetails || "Xem chi tiết"}</span>
                              <span className="font-black whitespace-nowrap">{(constructionInfo.calculationMethod || 'coefficient') === 'coefficient' ? ((t as any).calcMethodSelected || '✓ Đang chọn') : ((t as any).calcMethodSelect || 'Chọn')}</span>
                            </div>
                          </div>

                          {/* Option 2: Direct Net Floor Area Method */}
                          <div 
                            onClick={() => {
                              setConstructionInfo({ ...constructionInfo, calculationMethod: 'direct_floor' });
                              setCalcMethodModalPkg('direct_floor');
                            }}
                            className={`p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between min-h-[145px] ${
                              constructionInfo.calculationMethod === 'direct_floor'
                                ? 'ring-2 ring-emerald-500 border-emerald-600 bg-emerald-600/10 shadow-md'
                                : theme === 'dark' ? 'bg-[#0a0e1a] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between mb-1.5 gap-2">
                                <div className="text-sm sm:text-base font-black uppercase text-emerald-500 tracking-tight leading-snug">
                                  {t.calcMethodDirectTitle}
                                </div>
                                <span className="px-2.5 py-1 rounded-md text-xs font-black uppercase bg-emerald-600 text-white shrink-0 whitespace-nowrap shadow-xs">
                                  {t.calcMethodDirectBadge}
                                </span>
                              </div>
                              <div className={`text-xs sm:text-sm font-bold mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                {(t as any).calcMethodDirectSub}
                              </div>
                              <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                {t.calcMethodDirectDesc}
                              </p>
                            </div>
                            <div className="mt-3 pt-2.5 border-t border-slate-800/15 flex items-center justify-between text-xs sm:text-sm font-black text-emerald-400">
                              <span className="whitespace-nowrap flex items-center gap-1">🔍 {(t as any).calcMethodViewDetails || "Xem chi tiết"}</span>
                              <span className="font-black whitespace-nowrap">{constructionInfo.calculationMethod === 'direct_floor' ? ((t as any).calcMethodSelected || '✓ Đang chọn') : ((t as any).calcMethodSelect || 'Chọn')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CALCULATION METHOD EXPLANATION MODAL */}
                      {calcMethodModalPkg && (
                        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                          <div className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
                            theme === 'dark' ? 'bg-[#0f172a] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                          }`}>
                            <div className="flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800">
                              <div className="flex items-center gap-2">
                                <span className="text-base">📐</span>
                                <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide">
                                  {t.calcMethodConfirmModalTitle}
                                </h4>
                              </div>
                              <button
                                type="button"
                                onClick={() => setCalcMethodModalPkg(null)}
                                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="p-5 space-y-4 text-xs leading-relaxed">
                              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold text-sm flex items-center gap-2">
                                <span>💡</span>
                                <span>
                                  {calcMethodModalPkg === 'coefficient' ? t.calcMethodCoeffTitle : t.calcMethodDirectTitle}
                                </span>
                              </div>

                              <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                {calcMethodModalPkg === 'coefficient' ? t.calcMethodCoeffDesc : t.calcMethodDirectDesc}
                              </p>

                              <div className={`p-3 rounded-xl border text-[11px] space-y-2 ${
                                theme === 'dark' ? 'bg-[#080d1a] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                              }`}>
                                <div className="font-bold text-amber-500 uppercase">
                                  {calcMethodModalPkg === 'coefficient'
                                    ? ((t as any).calcMethodExampleTitle1 || "Ví dụ công thức hệ số (Cách 1):")
                                    : ((t as any).calcMethodExampleTitle2 || "Ví dụ công thức sàn trực tiếp (Cách 2):")}
                                </div>
                                {calcMethodModalPkg === 'coefficient' ? (
                                  <div>
                                    • Ví dụ nhà 2 tầng 88 m²:<br/>
                                    - Móng 30% = 26.4 m²<br/>
                                    - Sàn T1 + T2 = 176 m²<br/>
                                    - Mái 30% = 26.4 m²<br/>
                                    👉 <strong>Tổng m² quy đổi = 228.8 m²</strong> × Đơn giá thô (6.500.000 đ/m²) = <strong>1.487.200.000 đ</strong>
                                  </div>
                                ) : (
                                  <div>
                                    • Ví dụ nhà 2 tầng 88 m²:<br/>
                                    - Diện tích sàn sử dụng = 88 m² × 2 tầng = 176 m²<br/>
                                    - Đơn giá trọn gói (đã bao gồm toàn bộ móng & mái) = 8.450.000 đ/m²<br/>
                                    👉 <strong>Tổng dự toán trọn gói</strong> = 176 m² × 8.450.000 đ/m² = <strong>1.487.200.000 đ</strong>
                                  </div>
                                )}
                              </div>

                              <div className="pt-3 border-t border-slate-800/40 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConstructionInfo({ ...constructionInfo, calculationMethod: calcMethodModalPkg });
                                    setCalcMethodModalPkg(null);
                                  }}
                                  className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white cursor-pointer transition flex items-center gap-1.5 shadow-md"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>{t.calcMethodConfirmBtn}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3 STRUCTURAL OPTIONS VISUAL CARD SELECTOR (PA1, PA2, PA3) */}
                      <StructuralOptionsSection
                        theme={theme}
                        t={t}
                        selectedStructuralOptionId={selectedStructuralOptionId}
                        onSelectOption={(id, name) => {
                          setSelectedStructuralOptionId(id);
                          setConstructionInfo(prev => ({ ...prev, loai_ket_cau_chinh: name }));
                        }}
                        constructionInfo={constructionInfo}
                        onUpdateConstructionInfo={setConstructionInfo}
                      />

                      {/* Overall details text block */}
                      <div>
                        <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-2 font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>{t.overallDesc}</label>
                        <textarea 
                          value={constructionInfo.overallDescription || ""}
                          onChange={(e) => setConstructionInfo({ ...constructionInfo, overallDescription: e.target.value })}
                          placeholder={t.overallDescPlaceholder}
                          rows={4}
                          className={`w-full p-4 rounded-2xl text-sm sm:text-base font-sans border focus:outline-none focus:border-red-500 resize-none leading-relaxed min-h-[120px] ${theme === 'dark' ? 'bg-[#121829] text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'}`}
                        />

                        <SamplePromptsAccordion
                          theme={theme}
                          t={t}
                          onApplyPrompt={(promptText) => {
                            setConstructionInfo(prev => ({
                              ...prev,
                              overallDescription: promptText
                            }));
                          }}
                          onShowToast={(msg) => {
                            setDraftToast(msg);
                            setTimeout(() => setDraftToast(null), 3000);
                          }}
                        />
                      </div>

                      {/* HORIZONTAL QUICK CHOICE CHIPS (DUPLICATING SCREENSHOT INTEGRATION) */}
                      <div>
                        <div className="flex flex-wrap gap-2 mt-1 mb-2">
                          {t.constructionTypes.map((item, index) => {
                            const viItem = translations.vi.constructionTypes[index];
                            const isSelected = constructionInfo.constructionType === viItem;
                            return (
                              <button 
                                key={viItem}
                                type="button"
                                onClick={() => setConstructionInfo({ ...constructionInfo, constructionType: viItem })}
                                className={`px-3.5 py-2 text-xs sm:text-sm rounded-full border font-bold transition-all cursor-pointer ${
                                  isSelected 
                                    ? "bg-red-600 text-white border-red-600 shadow-md scale-102" 
                                    : theme === 'dark'
                                      ? "bg-[#1a233a] text-slate-200 border-slate-700 hover:bg-[#232e4a]"
                                      : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                                }`}
                              >
                                {item}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* ELONGATED SPECIFICATION BOXES (KÉO Ô THÊM CHIỀU DÀI ĐỂ HIỂN THỊ CHỮ TO RÕ NHƯ HÌNH 2) */}
                      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3.5 border rounded-2xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x ${
                        theme === 'dark' 
                          ? 'border-slate-800 divide-slate-800 bg-[#121829]/15' 
                          : 'border-slate-200 divide-slate-200 bg-slate-50'
                      }`}>
                        {/* Area box */}
                        <div className="p-4 sm:p-4.5 flex flex-col justify-between">
                          <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>{t.dimensionsLabel}</label>
                          <input 
                            value={constructionInfo.dimensions || ""}
                            onChange={(e) => setConstructionInfo({ ...constructionInfo, dimensions: e.target.value })}
                            placeholder="10 x 15 m"
                            className={`w-full bg-transparent text-base sm:text-lg border-none outline-none font-black pl-0 text-left placeholder-slate-400 focus:ring-0 ${
                              theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                            }`}
                          />
                        </div>
                        {/* Floor stories box */}
                        <div className="p-4 sm:p-4.5 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>{t.floorsLabel}</label>
                            <span className="text-sm sm:text-base font-bold text-amber-500 font-mono">
                              {constructionInfo.floors || 1} {t.labelFloors || "tầng"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const cur = Number(constructionInfo.floors) || 1;
                                if (cur > 1) setConstructionInfo({ ...constructionInfo, floors: cur - 1 });
                              }}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base border transition cursor-pointer ${
                                theme === 'dark'
                                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                              title={t.decreaseFloor || "Giảm 1 tầng"}
                            >
                              -
                            </button>
                            <input 
                              type="number"
                              min="1"
                              max="50"
                              value={constructionInfo.floors ?? 1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setConstructionInfo({ ...constructionInfo, floors: isNaN(val) ? 1 : Math.max(1, Math.min(50, val)) });
                              }}
                              className={`w-14 text-center bg-transparent text-base border rounded-xl py-1 outline-none font-black placeholder-slate-400 focus:ring-1 focus:ring-amber-400 font-mono ${
                                theme === 'dark' ? 'border-slate-700 text-slate-100 bg-slate-900/50' : 'border-slate-300 text-slate-900 bg-white'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const cur = Number(constructionInfo.floors) || 1;
                                setConstructionInfo({ ...constructionInfo, floors: Math.min(50, cur + 1) });
                              }}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base border transition cursor-pointer ${
                                theme === 'dark'
                                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                              title={t.increaseFloor || "Tăng 1 tầng"}
                            >
                              +
                            </button>
                            <div className="flex items-center gap-1.5 ml-auto">
                              {[1, 2, 3, 4, 5].map((f) => (
                                <button
                                  key={f}
                                  type="button"
                                  onClick={() => setConstructionInfo({ ...constructionInfo, floors: f })}
                                  className={`px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                                    constructionInfo.floors === f
                                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                                      : theme === 'dark'
                                        ? 'bg-slate-800 text-slate-300 hover:text-white'
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                  }`}
                                >
                                  {f}T
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Chiều cao tầng — dùng cho 3D, mặt đứng và khối lượng tường, sơn */}
                          <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs">
                            <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>{lang === 'vi' ? 'Chiều cao tầng 1' : lang === 'zh' ? '一层层高' : lang === 'lo' ? 'ຄວາມສູງຊັ້ນ 1' : 'Ground floor height'}</span>
                            <input type="number" step="0.1" min={2.4} max={6} placeholder="3.6" value={(constructionInfo as any).floorHeight1 ?? ''}
                              onChange={e => setConstructionInfo({ ...constructionInfo, floorHeight1: e.target.value } as any)}
                              className={`w-16 p-1.5 rounded-lg border text-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'}`} />
                            <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>m · {lang === 'vi' ? 'tầng trên' : lang === 'zh' ? '上层' : lang === 'lo' ? 'ຊັ້ນເທິງ' : 'upper floors'}</span>
                            <input type="number" step="0.1" min={2.4} max={6} placeholder="3.3" value={(constructionInfo as any).floorHeightUpper ?? ''}
                              onChange={e => setConstructionInfo({ ...constructionInfo, floorHeightUpper: e.target.value } as any)}
                              className={`w-16 p-1.5 rounded-lg border text-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300'}`} />
                            <span className={theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}>m {lang === 'vi' ? '(để trống = 3,6 / 3,3m)' : '(blank = 3.6 / 3.3 m)'}</span>
                          </div>
                        </div>
                        {/* Budget numbers box */}
                        <div className="p-4 sm:p-4.5 flex flex-col justify-between font-sans">
                          <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>{t.totalBudgetLabel}</label>
                          <input 
                            type="text"
                            value={constructionInfo.totalBudget ? formatCurrency(constructionInfo.totalBudget, lang) : ""}
                            onChange={(e) => {
                              const cleanDigits = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                              const val = lang === 'vi' ? cleanDigits : cleanDigits * 25000;
                              setConstructionInfo({ ...constructionInfo, totalBudget: val });
                            }}
                            placeholder="2.000.000.000 đ"
                            className={`w-full bg-transparent text-base sm:text-lg border-none outline-none font-black pl-0 text-left placeholder-slate-400 focus:ring-0 font-mono ${
                              theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                            }`}
                          />
                        </div>
                        {/* Standard rating choice */}
                        <div className="p-4 sm:p-4.5 flex flex-col justify-between font-sans">
                          <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>{t.constructionStandardLabel}</label>
                          <select 
                            value={constructionInfo.standard}
                            onChange={(e) => setConstructionInfo({ ...constructionInfo, standard: e.target.value as 'vietnam' | 'international' | 'other' })}
                            className={`w-full bg-transparent text-base sm:text-lg border-none outline-none font-bold pl-0 text-left focus:ring-0 cursor-pointer ${
                              theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                            }`}
                          >
                            <option value="vietnam" className={theme === 'dark' ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"}>{(t as any).standardVietnam || "Việt Nam"}</option>
                            <option value="international" className={theme === 'dark' ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"}>{(t as any).standardInternational || "Eurocode / Quốc tế"}</option>
                            <option value="other" className={theme === 'dark' ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900"}>{(t as any).standardOther || "Yêu cầu khác"}</option>
                          </select>
                        </div>
                      </div>

                      <SiteConditionsPanel
                        theme={theme}
                        constructionInfo={constructionInfo}
                        setConstructionInfo={setConstructionInfo}
                        customerAddress={userInfo?.address}
                      />

                      <div className={`border rounded-2xl overflow-hidden ${
                        theme === 'dark' ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-slate-50'
                      }`}>
                        <button 
                          type="button"
                          onClick={() => setOpenSubConstruction(!openSubConstruction)}
                          className={`w-full p-4 flex items-center justify-between text-sm sm:text-base font-black cursor-pointer ${
                            theme === 'dark' ? 'bg-slate-900/60 text-[#FFD700]' : 'bg-slate-100 text-slate-900 border-none'
                          }`}
                        >
                          <span>{t.bedroomLayoutTitle}</span>
                          <span>{openSubConstruction ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}</span>
                        </button>

                        {openSubConstruction && (
                          <div className={`p-4 sm:p-5 space-y-3.5 font-sans text-sm sm:text-base ${
                            theme === 'dark' ? 'bg-slate-950/45 text-slate-200' : 'bg-white text-slate-800'
                          }`}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                              <label className="flex items-center gap-2.5 cursor-pointer py-1.5">
                                <input 
                                  type="checkbox" 
                                  checked={constructionInfo.rooms.livingRoom} 
                                  onChange={(e) => setConstructionInfo({
                                    ...constructionInfo, 
                                    rooms: { ...constructionInfo.rooms, livingRoom: e.target.checked }
                                  })}
                                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-5 h-5" 
                                />
                                <span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{t.rooms.livingRoom}</span>
                              </label>
                              <label className="flex items-center gap-2.5 cursor-pointer py-1.5">
                                <input 
                                  type="checkbox" 
                                  checked={constructionInfo.rooms.kitchen} 
                                  onChange={(e) => setConstructionInfo({
                                    ...constructionInfo, 
                                    rooms: { ...constructionInfo.rooms, kitchen: e.target.checked }
                                  })}
                                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-5 h-5" 
                                />
                                <span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{t.rooms.kitchen}</span>
                              </label>
                              <label className="flex items-center gap-2.5 cursor-pointer py-1.5">
                                <input 
                                  type="checkbox" 
                                  checked={constructionInfo.rooms.worshipRoom} 
                                  onChange={(e) => setConstructionInfo({
                                    ...constructionInfo, 
                                    rooms: { ...constructionInfo.rooms, worshipRoom: e.target.checked }
                                  })}
                                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-5 h-5" 
                                />
                                <span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{t.rooms.worshipRoom}</span>
                              </label>
                              <label className="flex items-center gap-2.5 cursor-pointer py-1.5">
                                <input 
                                  type="checkbox" 
                                  checked={constructionInfo.rooms.garage === true} 
                                  onChange={(e) => setConstructionInfo({
                                    ...constructionInfo, 
                                    rooms: { ...constructionInfo.rooms, garage: e.target.checked }
                                  })}
                                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-5 h-5" 
                                />
                                <span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{t.rooms.garage}</span>
                              </label>
                              <label className="flex items-center gap-2.5 cursor-pointer py-1.5">
                                <input 
                                  type="checkbox" 
                                  checked={constructionInfo.rooms.garden} 
                                  onChange={(e) => setConstructionInfo({
                                    ...constructionInfo, 
                                    rooms: { ...constructionInfo.rooms, garden: e.target.checked }
                                  })}
                                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-5 h-5" 
                                />
                                <span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{t.rooms.garden}</span>
                              </label>
                              <label className="flex items-center gap-2.5 cursor-pointer py-1.5">
                                <input 
                                  type="checkbox" 
                                  checked={constructionInfo.rooms.fishPond} 
                                  onChange={(e) => setConstructionInfo({
                                    ...constructionInfo, 
                                    rooms: { ...constructionInfo.rooms, fishPond: e.target.checked }
                                  })}
                                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-5 h-5" 
                                />
                                <span className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{t.rooms.fishPond}</span>
                              </label>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200/60 pt-4 mt-2">
                              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/50 bg-slate-500/5">
                                <div>
                                  <span className={`font-extrabold block text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{t.rooms.bedroomCount}</span>
                                  <span className="text-[10.5px] text-slate-400">0 = Tự động theo phong thủy & số tầng</span>
                                </div>
                                <input 
                                  type="number"
                                  min="0"
                                  max="20"
                                  value={constructionInfo.rooms.bedroomCount || 0}
                                  onChange={(e) => setConstructionInfo({
                                    ...constructionInfo,
                                    rooms: { ...constructionInfo.rooms, bedroomCount: Math.max(0, Number(e.target.value)) }
                                  })}
                                  className={`w-14 p-2 text-center rounded-xl border text-base font-black ${
                                    theme === 'dark' 
                                      ? 'bg-[#121829] border-slate-800 text-[#FFD700]' 
                                      : 'bg-white border-slate-300 text-slate-800'
                                  }`}
                                />
                              </div>

                              <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/50 bg-slate-500/5">
                                <div>
                                  <span className={`font-extrabold block text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{t.rooms.bathroomCount || "Số phòng vệ sinh (WC)"}</span>
                                  <span className="text-[10.5px] text-slate-400">0 = Tự động phân bổ mỗi tầng</span>
                                </div>
                                <input 
                                  type="number"
                                  min="0"
                                  max="20"
                                  value={constructionInfo.rooms.bathroomCount || 0}
                                  onChange={(e) => setConstructionInfo({
                                    ...constructionInfo,
                                    rooms: { ...constructionInfo.rooms, bathroomCount: Math.max(0, Number(e.target.value)) }
                                  })}
                                  className={`w-14 p-2 text-center rounded-xl border text-base font-black ${
                                    theme === 'dark' 
                                      ? 'bg-[#121829] border-slate-800 text-emerald-400' 
                                      : 'bg-white border-slate-300 text-slate-800'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* YÊU CẦU TỪNG PHÒNG: kích thước, tầng, vị trí, hướng (không bắt buộc) */}
                      <RoomRequirementsPanel theme={theme} constructionInfo={constructionInfo} setConstructionInfo={setConstructionInfo as any} lang={lang} />

                      {/* DESIGN REFERENCE IMAGES CONTAINER (ẢNH THAM CHIẾU DUPLICATING SCREENS) */}
                      <div>
                        <label className={`block text-xs sm:text-sm uppercase font-black tracking-wider mb-2 font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}>
                          {t.photoReferTitle}
                        </label>
                        
                        {/* Reference Previews */}
                        {(constructionInfo?.referenceImages || []).length > 0 && (
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {(constructionInfo?.referenceImages || []).map((img, idx) => (
                              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-800">
                                <img 
                                  src={img} 
                                  alt="Reference sample" 
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover" 
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition">
                                  <button 
                                    onClick={() => setZoomImage(img)}
                                    className="p-1 bg-slate-850 hover:bg-slate-700 rounded-full cursor-pointer text-slate-100"
                                  >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => removeReferenceImage(idx)}
                                    className="p-1 bg-rose-600 hover:bg-rose-700 rounded-full cursor-pointer text-white"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <label className="flex flex-col items-center justify-center border border-dashed border-slate-800/80 hover:border-[#FFD700] bg-slate-950/25 py-6 px-4 rounded-2xl cursor-pointer text-center select-none transition">
                          <UploadCloud className="w-9 h-9 text-slate-400 mb-2" />
                          <span className="text-sm text-slate-300 leading-normal block font-extrabold">{t.uploadPlaceholder}</span>
                          <input 
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* ACCORDION: DETAIL SPECIFIC SECTIONS */}
                      <div className={`border rounded-2xl overflow-hidden ${
                        theme === 'dark' ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-slate-50'
                      }`}>
                        <button 
                          type="button"
                          onClick={() => setOpenSubDetails(!openSubDetails)}
                          className={`w-full p-4 flex items-center justify-between text-sm sm:text-base font-black cursor-pointer ${
                            theme === 'dark' ? 'bg-slate-900/60 text-[#FFD700]' : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">⚙ {t.subDetailsTitle}</span>
                          <span>{openSubDetails ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}</span>
                        </button>

                        {openSubDetails && (
                          <div className={`p-4 sm:p-5 space-y-4 border-t text-sm sm:text-base ${
                            theme === 'dark' ? 'bg-slate-950/45 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                          }`}>
                            <div className={`p-3 border-l-2 border-[#FFD700] text-xs sm:text-sm leading-relaxed mb-2 font-sans ${
                              theme === 'dark' ? 'bg-[#121829] text-slate-300' : 'bg-slate-50 text-slate-700 font-semibold'
                            }`}>
                              * {t.recommendationNote}
                            </div>
                            
                            {[
                              { key: "cementType", label: t.cementType, placeholder: (t as any).cementTypePlaceholder || "Ví dụ: Xi măng Hoàng Thạch mác PCB40" },
                              { key: "foundation", label: t.foundation, placeholder: (t as any).foundationPlaceholder || "Ví dụ: Móng cọc BTCT móng nông móng cốc..." },
                              { key: "columns", label: t.columns, placeholder: (t as any).columnsPlaceholder || "Ví dụ: Thép Hòa Phát phi 20 đúc khung chịu lực..." },
                              { key: "roof", label: t.roof, placeholder: (t as any).roofPlaceholder || "Ví dụ: Mái ngói Prime cao cấp hệ vì kèo..." },
                              { key: "tiles", label: t.tiles, placeholder: (t as any).tilesPlaceholder || "Ví dụ: Gạch Granite Prime 80x80 chống mòn..." }
                            ].map((item) => (
                              <div key={item.key} className="space-y-1.5 text-left">
                                <label className="block text-xs sm:text-sm text-slate-400 uppercase font-black tracking-wider">{item.label}</label>
                                <input 
                                  type="text"
                                  value={(detailItems as any)[item.key] || ""}
                                  onChange={(e) => setDetailItems({ ...detailItems, [item.key]: e.target.value })}
                                  placeholder={item.placeholder}
                                  className={`w-full p-3.5 rounded-xl text-sm sm:text-base border focus:outline-[#FFD700] ${
                                    theme === 'dark' 
                                      ? 'bg-[#121829] text-slate-200 border-slate-800' 
                                      : 'bg-slate-50 text-slate-800 border-slate-300'
                                  }`}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* PRICING TABLE SECTION */}
                      <PricingTableSection 
                        theme={theme}
                        lang={lang}
                        currentPackage={goiKichHoat}
                        onSelectPackage={(pkg) => requestPackage(pkg)}
                      />

                      {/* STEP B NAVIGATION BUTTONS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-dashed border-slate-700/40">
                        <button
                          type="button"
                          onClick={() => handleStepChange("A")}
                          className="p-3.5 sm:p-4 bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm sm:text-base font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[48px]"
                        >
                          {t.btnBackToStepA}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStepChange("C")}
                          className="p-3.5 sm:p-4 bg-red-650 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 animate-pulse min-h-[48px]"
                        >
                          {t.btnProceedStepC}
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* ACCORDION MODULE C: FENG SHUI ANALYSIS RESULTS & PLAYGROUND Q&A */}
                {currentStep === "C" && (
                  <div className={`rounded-2xl border ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'} overflow-hidden shadow-md shadow-slate-950/20`}>
                    
                    {/* HOMEOWNER & CONTRUCTION SUMMARY BANNER FOR STEP C */}
                    {userInfo.name && userInfo.birthDate && fengShuiAnalysis && (
                      <div className={`m-3 sm:m-4 p-4 sm:p-5 rounded-2xl border text-left animate-fade-in text-sm sm:text-base space-y-1.5 ${
                        theme === 'dark' 
                          ? 'bg-[#0e1c2e]/90 border-blue-900/50 text-slate-200' 
                          : 'bg-blue-50/95 border-blue-200 text-slate-900 shadow-xs'
                      }`}>
                        <div className={`flex items-center gap-2 text-sm sm:text-base font-black ${
                          theme === 'dark' ? 'text-[#FFD700]' : 'text-blue-900'
                        }`}>
                          <span>✦</span>
                          <span>{t.projectSummaryTitle}</span>
                        </div>
                        <div className={`text-xs sm:text-sm font-bold font-sans ${
                          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                        }`}>
                          {t.labelHouseholder} <span className={`font-mono font-black ${
                            theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                          }`}>{userInfo.name} ({new Date(userInfo.birthDate).getFullYear()})</span>
                        </div>
                        {constructionInfo && (
                          <div className={`text-xs sm:text-sm leading-relaxed font-semibold ${
                            theme === 'dark' ? 'text-slate-300' : 'text-slate-800'
                          }`}>
                            • <span className={`font-black ${theme === 'dark' ? 'text-amber-400' : 'text-amber-800'}`}>{t.labelProject}</span> {t.constructionTypes[translations.vi.constructionTypes.indexOf(constructionInfo.constructionType)] || constructionInfo.constructionType || t.constructionTypes[0]} ({constructionInfo.dimensions || t.labelUnknownDim}, {constructionInfo.floors || 1} {t.labelFloors})
                          </div>
                        )}
                      </div>
                    )}

                    <div 
                      className={`flex items-center justify-between p-4 select-none ${theme === 'dark' ? 'bg-[#0f1423]' : 'bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 bg-[#a81d1d] text-white rounded-full flex items-center justify-center font-black text-xs">C</span>
                        <h2 className={`text-sm sm:text-base font-black tracking-tight ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{t.stepC_title}</h2>
                      </div>
                    </div>

                    <div className={`p-4 sm:p-5 space-y-4 border-t text-xs sm:text-sm ${theme === 'dark' ? 'bg-[#080d1a] border-slate-800' : 'bg-white border-slate-200'}`}>
                      
                      {/* EXPERT OUTPUT RESULTS CONTAINER */}
                      {aiReport ? (() => {
                        const activeCustomerLead = (crmLeads || []).find((l: any) => l.userInfo?.phone === userInfo.phone || (clientId && l.id === clientId));
                        const activeCustomerLinkAnh = activeCustomerLead?.link_anh_phoi_canh || "";
                        return (
                          <>
                            {goiKichHoat === 'design' && (
                              <CustomerResultsCard
                                theme={theme}
                                customerName={userInfo?.name}
                                shots={perspectiveShots}
                                videoUrl={activeCustomerLead?.link_video_phoi_canh || serverVideoUrl || ""}
                                localVideo={localVideo}
                                lang={lang}
                                onOpen3D={() => { setActiveDrawingTab('massing'); scrollToId('yohu-drawings'); }}
                                onOpenPlan={() => { setActiveDrawingTab('floorplan'); scrollToId('yohu-drawings'); }}
                                onOpenStudio={() => scrollToId('yohu-perspective')}
                                setZoomImage={setZoomImage}
                              />
                            )}
                            <ReportDashboard 
                              aiReport={pricedAiReport} 
                              lang={lang} 
                              theme={theme}
                              triggerRenderConceptImage={triggerRenderConceptImage}
                              imageRendering={imageRendering}
                              renderedConceptImage={renderedConceptImage}
                              setZoomImage={setZoomImage}
                              packageTier={goiKichHoat}
                              onUpgradePackage={(tier) => requestPackage(tier)}
                              link_anh_phoi_canh={activeCustomerLinkAnh}
                              onRedeemCode={handleApplyActivationCode}
                              perspectiveSlot={
                                <LazyBox><PerspectiveStudio
                                  theme={theme}
                                  referenceImages={constructionInfo.referenceImages || []}
                                  massingShots={massingShots}
                                  interiorRooms={interiorRooms}
                                  storageKey={`yohu_studio_${clientId || 'guest'}_${massingLockedAt || 'none'}`}
                                  requestImage={requestPerspectiveImage}
                                  onShot={(sh: StudioShot) => setPerspectiveShots(prev => {
                                    const next = [{ url: sh.url, style: sh.style, view: sh.view, label: sh.label, at: new Date().toISOString() }, ...prev.filter(p => p.url !== sh.url)].slice(0, 9);
                                    try { localStorage.setItem(shotsKey(), JSON.stringify(next)); } catch { /* đầy bộ nhớ */ }
                                    return next;
                                  })}
                                  onOpenMassing={() => { setActiveDrawingTab('massing'); setTimeout(() => document.getElementById('yohu-drawings')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                                  setZoomImage={setZoomImage}
                                  packageTier={goiKichHoat}
                                  lang={lang}
                                /></LazyBox>
                              }
                            />

                          {goiKichHoat === 'design' ? (
                            <div className="mt-6" id="yohu-drawings">
                              {/* Sub-tabs for Technical Drawings */}
                              <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
                                <button
                                  onClick={() => setActiveDrawingTab('floorplan')}
                                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[44px] ${
                                    activeDrawingTab === 'floorplan'
                                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                                      : theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  📐 Sơ Đồ Mặt Bằng 2D
                                </button>
                                <button
                                  onClick={() => setActiveDrawingTab('elevation')}
                                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[44px] ${
                                    activeDrawingTab === 'elevation'
                                      ? 'bg-blue-600 text-white font-black shadow-md'
                                      : theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  🏛️ Mặt Đứng & Mặt Cắt
                                </button>
                                <button
                                  onClick={() => setActiveDrawingTab('massing')}
                                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 min-h-[44px] ${
                                    activeDrawingTab === 'massing'
                                      ? 'bg-emerald-600 text-white font-black shadow-md'
                                      : theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  🧊 3D Hình Khối
                                </button>
                              </div>

                              {activeDrawingTab === 'massing' ? (
                                <React.Suspense fallback={<div className="mt-6 p-6 text-center text-sm text-slate-400">Đang dựng mô hình 3D…</div>}>
                                  <Massing3DViewer
                                    description={constructionInfo.overallDescription}
                                    dimensions={planDimsFor(constructionInfo)}
                                    floors={parseInt(constructionInfo.floors) || 2}
                                    rooms={roomsFor(constructionInfo)}
                                    theme={theme}
                                    lang={lang}
                                    customerName={userInfo?.name || "Khách Hàng"}
                                    fengShuiAnalysis={fengShuiAnalysis}
                                    desiredDirection={userInfo?.desiredDirection}
                                    frontSetbackM={setbacksFor(constructionInfo).front}
                                    backSetbackM={setbacksFor(constructionInfo).back}
                                    roofType={(constructionInfo as any).loai_mai || constructionInfo.constructionType} floorHeight1={(constructionInfo as any).floorHeight1} floorHeightUpper={(constructionInfo as any).floorHeightUpper}
                                    onSnapshot={(url) => setMassingSnapshot(url)}
                                    onLockMassing={handleLockMassing}
                                    lockedAt={massingLockedAt}
                                    onVideoReady={(url, ext) => setLocalVideo({ url, ext })}
                                  />
                                </React.Suspense>
                              ) : activeDrawingTab === 'floorplan' ? (
                                <LazyBox><FloorPlan2DViewer 
                                  dimensions={planDimsFor(constructionInfo)}
                                  floors={parseInt(constructionInfo.floors) || 2}
                                  constructionType={constructionInfo.constructionType}
                                  rooms={roomsFor(constructionInfo)}
                                  theme={theme}
                                  lang={lang}
                                  customerName={userInfo?.name || "Khách Hàng"}
                                  onExportSvgDataUrl={(url) => setFloorPlanSvgUrl(url)}
                                  fengShuiAnalysis={fengShuiAnalysis}
                                  desiredDirection={userInfo?.desiredDirection}
                                  frontSetbackM={setbacksFor(constructionInfo).front}
                                  backSetbackM={setbacksFor(constructionInfo).back}
                                  onToggleAdvice={(apply) => setConstructionInfo((prev: any) => ({ ...prev, rooms: { ...(prev.rooms || {}), applyAdvice: apply } }))}
                                /></LazyBox>
                              ) : (
                                <LazyBox><ElevationViewer 
                                  dimensions={planDimsFor(constructionInfo)}
                                  floors={parseInt(constructionInfo.floors) || 2}
                                  constructionType={constructionInfo.constructionType}
                                  rooms={roomsFor(constructionInfo)}
                                  fengShuiAnalysis={fengShuiAnalysis}
                                  desiredDirection={userInfo?.desiredDirection}
                                  frontSetbackM={setbacksFor(constructionInfo).front}
                                  backSetbackM={setbacksFor(constructionInfo).back}
                                  roofType={(constructionInfo as any).loai_mai || constructionInfo.constructionType} floorHeight1={(constructionInfo as any).floorHeight1} floorHeightUpper={(constructionInfo as any).floorHeightUpper}
                                  theme={theme}
                                  lang={lang}
                                  customerName={userInfo?.name || "Khách Hàng"}
                                  onExportSvgDataUrl={(url) => setElevationSvgUrl(url)}
                                /></LazyBox>
                              )}
                            </div>
                          ) : (
                            <div className={`mt-6 p-5 sm:p-6 rounded-2xl border-2 border-dashed text-center ${theme === 'dark' ? 'bg-[#101524] border-purple-500/30' : 'bg-purple-50 border-purple-300'}`}>
                              <div className="text-sm sm:text-base font-black text-purple-500 mb-1.5">🔒 Khóa Sơ Đồ Mặt Bằng 2D, Mặt Cắt Đứng & Xuất File DXF AutoCAD</div>
                              <p className="text-xs sm:text-sm text-slate-400 mb-3.5 leading-relaxed">Nâng cấp lên gói "Báo Cáo + Bản Vẽ" ({formatCurrencyNoSymbol(1500000, lang)}) để mở khóa bản vẽ mặt bằng tự động, mặt cắt đứng chiều cao, tùy chỉnh từng tầng và tải file .DXF mở trực tiếp bằng AutoCAD.</p>
                              <button 
                                onClick={() => requestPackage('design')}
                                className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-md min-h-[46px]"
                              >
                                Mở khóa Gói Thiết Kế {formatCurrencyNoSymbol(1500000, lang)}
                              </button>
                            </div>
                          )}
                          
                          {/* --- BỔ SUNG: BANNER MỒI VIDEO (admin có thể tắt) --- */}
                          {videoOrderEnabled && <div className={`mt-6 p-5 sm:p-6 rounded-2xl border-2 border-dashed ${theme === 'dark' ? 'bg-[#101524] border-[#FFD700]/30' : 'bg-amber-50 border-amber-300'}`}>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg">
                                  <Video className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className={`text-sm sm:text-base font-black mb-1 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
                                    {t.videoBannerTitle}
                                  </h4>
                                  <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {t.videoBannerSub}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={showVideoPackageSelector}
                                className="w-full md:w-auto px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm rounded-xl transition-colors shadow-lg whitespace-nowrap min-h-[46px]"
                              >
                                {t.viewVideo3dPackages || "Xem các gói Video 3D"}
                              </button>
                            </div>
                          </div>}

                          {/* --- BỔ SUNG: BANNER MẠNG LƯỚI THỢ TẬN TỤY --- */}
                          <div className={`mt-4 p-5 sm:p-6 rounded-2xl border-2 border-dashed ${theme === 'dark' ? 'bg-[#101524] border-blue-500/40' : 'bg-blue-50 border-blue-300'}`}>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg">
                                  <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className={`text-sm sm:text-base font-black mb-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
                                    👷 Mạng Lưới "Thợ Tận Tụy" — Bảo Chứng Thi Công Trực Tiếp
                                  </h4>
                                  <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                    Đội ngũ thợ lành nghề được đào tạo theo tiêu chuẩn kỹ thuật Yohu. Cam kết đúng tiến độ, bảo hành kết cấu, bám sát dự toán bóc tách.
                                  </p>
                                </div>
                              </div>
                              <a
                                href="https://aistudio.google.com/apps/62de25f5-0959-4547-a723-46017c8af186?showPreview=true&showAssistant=true"
                                target="_blank"
                                rel="noreferrer"
                                className="w-full md:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl transition-colors shadow-lg whitespace-nowrap min-h-[46px] flex items-center justify-center gap-1.5"
                              >
                                <span>Kết Nối Đội Thợ</span>
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                          
                          {/* --- BỔ SUNG: XUẤT PDF --- */}
                          <div className={`mt-6 p-5 sm:p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${theme === 'dark' ? 'bg-[#101524] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="text-left w-full sm:w-auto">
                              <h4 className={`text-sm sm:text-base font-black mb-1 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{t.reportPdfTitle}</h4>
                              <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t.reportPdfDesc}</p>
                            </div>
                            <button
                              onClick={() => xuatPDF(goiKichHoat, {
                                userInfo, constructionInfo, detailItems, fengShuiAnalysis, aiResult: aiReport, floorPlanSvgUrl, elevationSvgUrl
                              })}
                              className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 whitespace-nowrap min-h-[46px]"
                            >
                              <FileText className="w-4 h-4" />
                              {t.btnExportPdf} ({goiKichHoat === 'free' ? t.pdf.labels.basicReport : goiKichHoat === 'standard' ? t.pdf.labels.fullReport : t.pdf.labels.designReport})
                            </button>
                          </div>

                          {/* --- BỔ SUNG MỚI: XUẤT THUYẾT MINH KIẾN TRÚC - KẾT CẤU CHI TIẾT (PDF) PA1 / PA2 / PA3 --- */}
                          <div className={`mt-4 p-5 sm:p-6 rounded-2xl border-2 border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r ${
                            theme === 'dark' ? 'from-amber-950/30 via-red-950/20 to-slate-900' : 'from-amber-50 via-red-50 to-white shadow-md'
                          }`}>
                            <div className="text-left w-full sm:w-auto space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950 uppercase">
                                  Tính năng VIP / Trả phí
                                </span>
                                <span className="text-xs font-bold text-amber-400">
                                  3 Phương án kết cấu (PA1, PA2, PA3)
                                </span>
                              </div>
                              <h4 className={`text-sm sm:text-base font-black ${theme === 'dark' ? 'text-yellow-300' : 'text-red-900'}`}>
                                📄 Thuyết Minh Kiến Trúc – Kết Cấu Chi Tiết (PDF) & Phong Thủy
                              </h4>
                              <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                Xuất bộ hồ sơ 10 chương mục kỹ thuật chuẩn TCVN, tự động chia nhỏ generation tránh quá tải, hỗ trợ dịch đa ngôn ngữ.
                              </p>
                            </div>
                            <button
                              onClick={() => setShowSpecificationModal(true)}
                              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 whitespace-nowrap min-h-[48px] cursor-pointer"
                            >
                              <FileText className="w-4.5 h-4.5 text-yellow-300" />
                              <span>Xuất Thuyết Minh Chi Tiết</span>
                            </button>
                          </div>
                        </>
                        );
                      })() : (
                        <div className="p-6 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20 text-slate-400 text-[10.5px] leading-relaxed">
                          <Sparkles className="w-5 h-5 text-amber-500 mx-auto mb-2 animate-pulse" />
                          {t.aiWaitingData}
                        </div>
                      )}

                      {/* CHATBOT PLAYGROUND PORTLET (HỎI ĐÁP PHONG THỦY KIẾN TRÚC DỰ TOÁN) */}
                      <div className={`border p-4 sm:p-5 rounded-3xl ${
                        theme === 'dark' ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50 shadow-sm'
                      }`}>
                        {/* Header with Title & Unlimited Access Badge */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2">
                          <div className="text-left font-sans">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                              <h4 className={`text-sm sm:text-base font-black uppercase font-mono tracking-wider ${
                                theme === 'dark' ? 'text-[#FFD700]' : 'text-slate-800'
                              }`}>
                                {t.aiAssistantTitle}
                              </h4>
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                                <span>✓</span> {t.qnaOpenAccessBadge || "Mở tự do • Không cần duyệt Admin"}
                              </span>
                            </div>
                            <p className={`text-xs sm:text-sm leading-normal mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                              {t.qnaSub}
                            </p>
                          </div>
                          {(qnaHistory || []).length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setQnaHistory([]);
                                localStorage.removeItem("yohu_qna_history");
                              }}
                              className="text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-rose-500/30 bg-slate-900/40 transition flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                              title={t.qnaClearHistoryTitle || "Xóa lịch sử để làm mới cuộc hội thoại"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{t.qnaClearHistory || "Xóa lịch sử"}</span>
                            </button>
                          )}
                        </div>

                        {/* PROMINENT MASTER PROMPT TEMPLATE BAR (FILL-IN-THE-BLANKS & REFERENCE IMAGE) */}
                        <QnAMasterPromptBar
                          theme={theme}
                          lang={lang}
                          userInfo={userInfo}
                          constructionInfo={constructionInfo}
                          onApplyPrompt={(promptText) => {
                            setCurrentQuestion(promptText);
                            setTimeout(() => {
                              const el = document.getElementById("qna-chat-textarea");
                              if (el) {
                                el.focus();
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 100);
                          }}
                          attachedImage={attachedChatImage}
                          onAttachImage={setAttachedChatImage}
                        />

                        {/* PROMINENT DIRECT QUESTION INPUT FIELD - ALWAYS VISIBLE AT THE TOP */}
                        <div className={`mt-3 p-4 sm:p-5 rounded-2xl border-2 transition-all ${
                          theme === 'dark' 
                            ? 'bg-[#080d1a] border-amber-500/40 shadow-[0_0_18px_rgba(245,158,11,0.08)]' 
                            : 'bg-white border-amber-400/80 shadow-md'
                        }`}>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <label className="text-xs sm:text-sm font-black uppercase text-amber-500 tracking-wider font-mono flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-amber-500" />
                              <span>{t.qnaInputLabel || "👉 Đặt câu hỏi trực tiếp cho Chuyên gia AI:"}</span>
                            </label>
                            <span className="text-xs text-slate-400 hidden sm:inline-block">
                              {currentQuestion.includes('\n') 
                                ? (lang === 'vi' ? "(Nhấn Shift+Enter để xuống dòng, hoặc bấm nút Gửi)" : "(Press Shift+Enter for new line, or click Send)") 
                                : (t.qnaPressEnterHint || "(Nhấn phím Enter hoặc bấm nút Gửi)")}
                            </span>
                          </div>
                          
                          {/* Attached image preview tag in question composer */}
                          {attachedChatImage && (
                            <div className="mb-2 p-2 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-300">
                              <div className="flex items-center gap-2">
                                <img src={attachedChatImage} alt="Attach" className="w-8 h-8 object-cover rounded-md border border-emerald-500/50" />
                                <span className="font-bold">
                                  {lang === 'vi' ? 'Sẽ gửi kèm ảnh tham chiếu này' : lang === 'zh' ? '将随附此参考图片发送' : lang === 'lo' ? 'ຈະສົ່ງພ້ອມຮູບອ້າງອີງນີ້' : 'Will send with this reference image'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setAttachedChatImage(null)}
                                className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                                title="Gỡ ảnh"
                              >
                                ✕
                              </button>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-end">
                            <textarea
                              id="qna-chat-textarea"
                              rows={currentQuestion.includes('\n') ? Math.min(10, Math.max(3, currentQuestion.split('\n').length)) : 2}
                              value={currentQuestion || ""}
                              onChange={(e) => setCurrentQuestion(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && currentQuestion.trim() && !qnaLoading) {
                                  e.preventDefault();
                                  handleAskQuestion();
                                }
                              }}
                              placeholder={t.qnaInputPlaceholder || "Ví dụ: 'Sinh năm 1985 động thổ tháng mấy tốt lành?', hoặc dùng mẫu Master Prompt phía trên..."}
                              className={`flex-1 border-2 rounded-xl py-3 px-4 text-sm sm:text-base font-semibold placeholder:text-xs sm:placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition resize-y min-h-[54px] custom-scrollbar ${
                                theme === 'dark' 
                                  ? 'bg-[#060a14] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-amber-500' 
                                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white'
                              }`}
                            />
                            <button 
                              type="button"
                              onClick={() => handleAskQuestion()}
                              disabled={qnaLoading || !currentQuestion.trim()}
                              className={`h-[48px] sm:h-[54px] px-4 sm:px-6 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm shadow-md active:scale-95 disabled:opacity-30 disabled:pointer-events-none shrink-0 ${
                                theme === 'dark' 
                                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20' 
                                  : 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20'
                              }`}
                              title={t.btnSendQuestion}
                            >
                              {qnaLoading ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span className="inline">{t.qnaSearching || "Đang tra cứu..."}</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4" />
                                  <span className="inline">{t.btnSendQuestion || "Gửi"}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Interactive Guidance & Suggested Topics Guide */}
                        <QnAGuidePanel
                          theme={theme}
                          lang={lang}
                          onSelectQuestion={setCurrentQuestion}
                        />

                        {/* Interactive chat logs */}
                        {(qnaHistory || []).length > 0 ? (
                          <div className={`flex flex-col gap-4 max-h-[520px] overflow-y-auto mt-4 text-left custom-scrollbar scroll-smooth p-4 sm:p-5 rounded-2xl border ${
                            theme === 'dark' ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/70'
                          }`}>
                            {(qnaHistory || []).map((qa) => (
                              <div key={qa.id} className="flex flex-col gap-3 pb-4 border-b border-slate-800/40 last:border-b-0 animate-fade-in">
                                {/* User Question (Q) - Right Aligned Bubble */}
                                <div className="flex flex-col items-end w-full">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-slate-400 font-mono uppercase font-bold">{t.labelYou}</span>
                                    <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white font-black shadow-sm">U</div>
                                    {qa.createdAt && <span className="text-xs text-slate-400 font-mono">{qa.createdAt}</span>}
                                  </div>
                                  <div className="p-3.5 px-4 sm:px-5 rounded-2xl rounded-tr-none text-sm sm:text-base font-semibold leading-relaxed bg-red-600 text-white shadow-md max-w-[90%] break-words">
                                    {qa.image && (
                                      <div className="mb-2 rounded-xl overflow-hidden border border-white/30 max-w-sm shadow-md">
                                        <img src={qa.image} alt="Reference" className="w-full h-auto max-h-60 object-cover" />
                                      </div>
                                    )}
                                    <div className="whitespace-pre-wrap">{qa.question}</div>
                                  </div>
                                </div>

                                {/* AI Answer (A) - Left Aligned Bubble with Specialist avatar */}
                                <div className="flex flex-col items-start w-full">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-xs text-[#FFD700] font-black border-2 border-amber-400/30 shadow-sm">
                                      <Sparkles className="w-4 h-4 text-[#FFD700]" />
                                    </div>
                                    <span className="text-xs sm:text-sm text-amber-500 font-black tracking-wider uppercase font-mono">{t.aiSpecialistLabel}</span>
                                  </div>
                                  <div className={`p-4 sm:p-5 rounded-2xl rounded-tl-none text-sm sm:text-base leading-[1.65] border shadow-md max-w-[92%] break-words ${
                                    theme === 'dark' 
                                      ? 'text-slate-200 bg-[#0d121f] border-slate-800' 
                                      : 'text-slate-800 bg-white border-slate-200'
                                  }`}>
                                    {qa.answer ? (
                                      <div className="whitespace-pre-line font-medium">{qa.answer}</div>
                                    ) : (
                                      <span className="animate-pulse flex items-center gap-2.5 text-slate-400 font-mono text-xs sm:text-sm py-1">
                                        <Clock className="w-4 h-4 animate-spin text-red-500" /> 
                                        {t.aiRetrieving}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-3 p-4 sm:p-5 rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/20 text-center text-slate-400 text-xs sm:text-sm">
                            {t.qnaEmptyMessage || "💬 Chưa có câu hỏi nào. Hãy nhập thắc mắc của bạn vào ô phía trên hoặc chọn câu hỏi mẫu gợi ý để Chuyên gia AI giải đáp ngay lập tức!"}
                          </div>
                        )}
                      </div>

                      {/* PERSUASIVE STRONG SALES PERSUASION DIALOGUE */}
                      <div className={`bg-gradient-to-br ${theme === 'dark' ? 'from-slate-900/40 via-slate-900/60 to-slate-950/80' : 'from-red-50 via-white to-red-50 shadow-md'} border-2 border-amber-500/30 p-5 sm:p-6 rounded-[32px] text-center space-y-4 relative overflow-hidden mt-6 text-left`}>
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-red-600 text-white font-mono font-bold text-[10px] px-3 py-0.5 rounded-b uppercase tracking-widest whitespace-nowrap">
                          {t.visitTitle}
                        </div>
                        
                        <div className="pt-2 text-center">
                          <h4 className={`text-base sm:text-lg font-black uppercase tracking-widest ${theme === 'dark' ? 'text-[#FFD700]' : 'text-red-600'}`}>{t.ctaTitle}</h4>
                          <p className={`text-xs sm:text-sm leading-relaxed mt-2 font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700 font-sans'}`}>{t.ctaDesc}</p>
                        </div>

                        <div className="flex flex-col gap-2.5 pt-2 font-sans relative">
                          <button 
                            onClick={() => setShowPhoneList(!showPhoneList)}
                            className="p-3.5 sm:p-4 bg-red-600 hover:bg-red-700 text-white font-black text-sm sm:text-base rounded-xl inline-flex items-center justify-center gap-2 transition shadow-lg shadow-red-600/20 w-full min-h-[48px]"
                          >
                            <PhoneCall className="w-5 h-5 text-[#FFD700]" /> {t.btnCallHotline}
                          </button>
                          
                          {showPhoneList && (
                            <div className={`mt-2 p-3 sm:p-4 rounded-xl border flex flex-col gap-2 ${theme === 'dark' ? 'bg-[#101524] border-slate-800' : 'bg-slate-50 border-slate-200'} animate-fade-in-up`}>
                              <a href="tel:+84973480488" className={`p-3 rounded-xl flex items-center justify-between transition hover:opacity-80 ${theme === 'dark' ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800 shadow-sm'}`}>
                                <span className="text-xs sm:text-sm font-bold">{t.expert1}</span>
                                <span className="text-sm sm:text-base font-black text-red-500 font-mono">0973 480 488</span>
                              </a>
                              <a href="tel:+84978233638" className={`p-3 rounded-xl flex items-center justify-between transition hover:opacity-80 ${theme === 'dark' ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-800 shadow-sm'}`}>
                                <span className="text-xs sm:text-sm font-bold">{t.expert2}</span>
                                <span className="text-sm sm:text-base font-black text-red-500 font-mono">0978 233 638</span>
                              </a>
                            </div>
                          )}

                          <a 
                            href="https://zalo.me/84339606969" 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-3.5 sm:p-4 bg-[#0068FF] hover:bg-[#0054cc] text-white font-black text-sm sm:text-base rounded-xl inline-flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/20 min-h-[48px]"
                          >
                            {t.btnChatZalo}
                          </a>
                        </div>

                        {/* STEP C BACK TO STEP B NAVIGATION */}
                        <div className="pt-3 border-t border-dashed border-slate-700/40">
                          <button
                            type="button"
                            onClick={() => handleStepChange("B")}
                            className="p-3.5 sm:p-4 bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm sm:text-base font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 w-full min-h-[48px]"
                          >
                            {t.btnBackToStepB}
                          </button>
                        </div>

                      </div>

                    </div>
                  </div>
                )}

                {/* SECTION D: DESIGN TEMPLATE GALLERY & 3D HOUSE MODEL & YOUTUBE */}
                {currentStep === "C" && (
                  <LazyBox>
                  <DesignTemplateGallery 
                    theme={theme}
                    lang={lang}
                    fengShuiElement={fengShuiAnalysis?.element || 'Mộc'}
                    floors={constructionInfo.floors || 2}
                    dimensions={constructionInfo.dimensions || '10 x 15 m'}
                    houseSlot={goiKichHoat === 'design' ? (
                      <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#121829]/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="text-sm font-extrabold mb-1">🏠 3D ngôi nhà của anh/chị (dựng từ mặt bằng)</div>
                        <React.Suspense fallback={<div className="p-6 text-center text-sm text-slate-400">Đang dựng mô hình 3D…</div>}>
                          <Massing3DViewer description={constructionInfo.overallDescription} dimensions={planDimsFor(constructionInfo)} floors={parseInt(constructionInfo.floors) || 2} rooms={roomsFor(constructionInfo)} theme={theme} lang={lang}
                            customerName={userInfo?.name || "Khách Hàng"} fengShuiAnalysis={fengShuiAnalysis} desiredDirection={userInfo?.desiredDirection}
                            frontSetbackM={setbacksFor(constructionInfo).front} backSetbackM={setbacksFor(constructionInfo).back}
                            roofType={(constructionInfo as any).loai_mai || constructionInfo.constructionType} floorHeight1={(constructionInfo as any).floorHeight1} floorHeightUpper={(constructionInfo as any).floorHeightUpper} onSnapshot={(url) => setMassingSnapshot(url)}
                            onLockMassing={handleLockMassing} lockedAt={massingLockedAt} onVideoReady={(url, ext) => setLocalVideo({ url, ext })} />
                        </React.Suspense>
                      </div>
                    ) : freePreview3D ? (
                      <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#121829]/50 border-purple-500/30' : 'bg-purple-50/50 border-purple-200'}`}>
                        <div className="text-sm font-extrabold mb-1">🏠 Xem thử 3D ngôi nhà của anh/chị</div>
                        <React.Suspense fallback={<div className="p-6 text-center text-sm text-slate-400">Đang dựng mô hình 3D…</div>}>
                          <Massing3DViewer preview description={constructionInfo.overallDescription} dimensions={planDimsFor(constructionInfo)} floors={parseInt(constructionInfo.floors) || 2} rooms={roomsFor(constructionInfo)} theme={theme} lang={lang}
                            customerName={userInfo?.name || "Khách Hàng"} fengShuiAnalysis={fengShuiAnalysis} desiredDirection={userInfo?.desiredDirection}
                            frontSetbackM={setbacksFor(constructionInfo).front} backSetbackM={setbacksFor(constructionInfo).back}
                            roofType={(constructionInfo as any).loai_mai || constructionInfo.constructionType} floorHeight1={(constructionInfo as any).floorHeight1} floorHeightUpper={(constructionInfo as any).floorHeightUpper} />
                        </React.Suspense>
                        <button onClick={() => requestPackage('design')} className="mt-3 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-black cursor-pointer">Mở gói Thiết kế — chốt hình khối, ảnh phối cảnh, video, bản vẽ</button>
                      </div>
                    ) : (
                      <div className={`p-4 rounded-2xl border-2 border-dashed text-center ${theme === 'dark' ? 'border-purple-500/30 bg-[#101524]' : 'border-purple-300 bg-purple-50'}`}>
                        <div className="text-sm font-black text-purple-500">🧊 3D ngôi nhà của chính anh/chị</div>
                        <p className="text-xs text-slate-400 mt-1">Dựng đúng mặt bằng, số tầng, mái và hướng nhà — xoay xem trên điện thoại. Có trong gói Thiết kế.</p>
                        <button onClick={() => requestPackage('design')} className="mt-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-black cursor-pointer">Mở gói Thiết kế</button>
                      </div>
                    )}
                  />
                  </LazyBox>
                )}

              </div>

              {/* DYNAMIC BASEMENT WORKSPACE TRIGGERS (SAVE OR EXPORT DUPING SCREENSHOT) */}
              <div className={`p-4 border-t gap-2.5 flex flex-col ${theme === 'dark' ? 'bg-[#0f1423] border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
                <div className="grid grid-cols-4 gap-2">
                  {/* Draft savings button */}
                  <button 
                    onClick={executeDraftSave}
                    className={`p-3 border rounded-2xl flex items-center justify-center gap-1 cursor-pointer font-bold text-xs ${theme === 'dark' ? 'border-red-500/35 hover:bg-red-500/10 text-[#FFD700]' : 'border-red-200 hover:bg-red-50 text-red-600 bg-white shadow-sm'}`}
                    title={theme === 'dark' ? "Lưu tệp nháp về máy" : "Save draft backup to device"}
                  >
                    <Save className="w-4 h-4 text-red-500" /> {t.btnSaveDraftSmall}
                  </button>

                  {/* Import Draft button */}
                  <label 
                    htmlFor="import-draft-file"
                    className={`p-3 border rounded-2xl flex items-center justify-center gap-1 cursor-pointer font-bold text-xs ${theme === 'dark' ? 'border-blue-500/35 hover:bg-blue-500/10 text-blue-400' : 'border-blue-200 hover:bg-blue-50 text-blue-600 bg-white shadow-sm'}`}
                    title="Nạp hồ sơ nháp đã tải"
                  >
                    <FolderOpen className="w-4 h-4 text-blue-500" /> 
                    <span>{lang === 'vi' ? "Nạp nháp" : (lang === 'lo' ? "ໂຫຼດຮ່າງ" : (lang === 'zh' ? "导入草稿" : "Load draft"))}</span>
                    <input 
                      type="file" 
                      id="import-draft-file" 
                      accept=".json" 
                      onChange={handleImportDraftFile} 
                      className="hidden" 
                    />
                  </label>

                  {/* Primary submit action trigger */}
                  <button 
                    onClick={triggerCoreResultExport}
                    disabled={exportCalculating}
                    className="col-span-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-750 hover:to-red-800 text-[#FFD700] text-xs font-black py-3.5 rounded-2xl transition shadow-lg tracking-wider flex items-center justify-center gap-1.5 cursor-pointer filter hover:brightness-110"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    {exportCalculating ? t.generatingReport : t.btnExportMain}
                  </button>
                </div>

                {/* Local coordinates & business references */}
                <div className={`pt-4 pb-2 text-[10px] md:text-[11px] text-center space-y-1.5 font-mono leading-relaxed tracking-wide ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  <div className="font-semibold text-[9px] sm:text-[11px] md:text-xs truncate">{t.footerAddress}</div>
                  <div>{t.footerSupport}</div>
                  <div>{t.footerWebsite} <a href="https://www.379aipro.online/" target="_blank" rel="noreferrer" className={`font-semibold hover:underline transition-colors ${theme === 'dark' ? 'text-amber-500 hover:text-amber-400' : 'text-blue-600 hover:text-blue-700'}`}>https://www.379aipro.online/</a></div>
                </div>
              </div>

            </div>
        )}

      </div>

      {/* FULL-SCREEN DETAIL ZOOM IMAGE POPUP */}
      {zoomImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-3 animate-fade-in">
          <button 
            onClick={() => setZoomImage(null)}
            className="absolute top-4 right-4 p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={zoomImage} 
            alt="Zoomed Reference Layout" 
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl" 
          />
        </div>
      )}

      {/* ADMIN AUTH LOGIN MODAL */}
      <AdminAuthModal
        isOpen={showAdminAuthModal}
        onClose={() => {
          setShowAdminAuthModal(false);
          setAdminAuthError(null);
          setAdminPasswordInput("");
        }}
        onSubmit={handleAdminLogin}
        passwordInput={adminPasswordInput}
        setPasswordInput={setAdminPasswordInput}
        authError={adminAuthError}
        t={t}
      />

      {/* MOCK AUTH LOGIN MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-slate-100 shadow-2xl relative">
            <button 
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-base font-bold tracking-tight text-[#FFD700] mb-1 font-mono">{t.loginTitle}</h3>
            <p className="text-slate-400 text-[10.5px] leading-relaxed mb-4 font-sans">{t.loginSub}</p>

            <form onSubmit={handleAuthPhoneSubmit} className="space-y-3 font-sans">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">{t.enterPhone}</label>
                <input 
                  type="tel"
                  required
                  value={authPhone || ""}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  placeholder="Ví dụ: 0973480488"
                  className="w-full p-2.5 rounded-xl text-xs bg-[#101524] border border-slate-800 focus:outline-[#FFD700] text-slate-100 font-mono"
                />
              </div>

              <button 
                type="submit"
                className="w-full p-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs hover:from-amber-600 transition cursor-pointer"
              >
                {t.submitPhone}
              </button>
            </form>

            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-slate-800" />
              <span className="flex-shrink mx-3 text-slate-500 text-[10px] font-mono">OR ID</span>
              <div className="flex-grow border-t border-slate-800" />
            </div>

            <button 
              onClick={() => {
                setIsLoggedIn(true);
                setLoggedUser("Yohu Google Customer");
                setUserInfo(prev => ({ ...prev, email: "yohu.vn@gmail.com" }));
                setAuthModalOpen(false);
              }}
              className="w-full p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer font-sans"
            >
              <Globe className="w-4 h-4 text-emerald-500" /> {t.loginGoogle}
            </button>
          </div>
        </div>
      )}

      {showCtvPortal && <LazyBox><CtvPortal onClose={() => setShowCtvPortal(false)} /></LazyBox>}
      {/* CTV DASHBOARD MODAL */}
      {showCTVDashboard && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 animate-fade-in-up overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-3xl text-slate-100 shadow-2xl relative my-auto">
            <button 
              onClick={() => setShowCTVDashboard(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-[#FFD700]">{t.ctvTitle}</h3>
                <p className="text-xs text-slate-400">{t.ctvSub}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                <div className="text-xs text-slate-400 mb-1">{t.ctvMyCode}</div>
                <div className="font-mono text-lg font-bold text-emerald-400">{affiliateData?.ref || affiliateData?.aid || t.ctvNotIdentified}</div>
                <div className="text-[10px] mt-2 text-slate-500">{t.ctvInviteLink} https://xaynhayohu.vn?ref={affiliateData?.ref || affiliateData?.aid || 'YOUR_CODE'}</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
                <div className="text-xs text-slate-400 mb-1">{t.ctvTotalCommission}</div>
                <div className="font-mono text-2xl font-black text-[#FFD700]">
                  {formatCurrency(commissions.reduce((acc, curr) => acc + curr.amount, 0), lang)}
                </div>
              </div>
            </div>

            <h4 className="text-sm font-bold text-slate-300 mb-3 border-b border-slate-800 pb-2">{t.ctvHistory}</h4>
            <div className="overflow-x-auto max-h-60 overflow-y-auto bg-slate-800/30 rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800 sticky top-0">
                  <tr>
                    <th className="p-3">Ngày</th>
                    <th className="p-3">Gói</th>
                    <th className="p-3">Số tiền</th>
                    <th className="p-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(commissions || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 font-medium text-amber-400">{item.packageId}</td>
                      <td className="p-3 font-mono text-emerald-400">{formatCurrency(item.amount, lang)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.status === 'Đã thanh toán' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {commissions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500 text-xs">{t.ctvNoHistory}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- BỔ SUNG: MODAL CHỌN GÓI VIDEO --- */}
      {showVideoModal && <React.Suspense fallback={null}>
      <VideoUpsellModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        theme={theme}
        t={t}
        lang={lang}
        videoPackages={VIDEO_PACKAGES}
        onActivatePackage={(pkgId, orderDetails) => activateVideoPackage(pkgId, clientId, orderDetails)}
        formatCurrency={formatCurrency}
        currentProjectInfo={{
          id: clientId,
          customerName: userInfo?.name,
          phone: userInfo?.phone,
          birthYear: userInfo?.birthDate ? new Date(userInfo.birthDate).getFullYear() : undefined,
          element: fengShuiAnalysis?.element,
          direction: userInfo?.desiredDirection || (Array.isArray(fengShuiAnalysis?.favorableDirections) ? fengShuiAnalysis.favorableDirections[0] : fengShuiAnalysis?.favorableDirections),
          buildingType: constructionInfo?.constructionType,
          existingImages: [
            ...(constructionInfo?.referenceImages || []),
            ...(renderedConceptImage ? [renderedConceptImage] : [])
          ]
        }}
      />
      </React.Suspense>}

      {/* AI UPDATE NOTIFICATION POPUP MODAL */}
      {aiUpdateStatus && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#0f1423] border-2 border-[#FFD700]/70 rounded-3xl p-6 w-full max-w-sm text-slate-100 shadow-2xl relative">
            <button 
              onClick={() => setAiUpdateStatus(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 cursor-pointer p-0.5 bg-slate-900 border border-slate-800 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="p-2 bg-emerald-950/40 rounded-full border border-emerald-500/30">
                <Sparkles className="w-5 h-5 text-[#FFD700] animate-pulse" />
              </div>
              <h3 className="text-sm font-black tracking-tight text-[#FFD700] uppercase font-mono">
                {t.aiSystemUpdated}
              </h3>
            </div>

            <div className="text-slate-300 text-[10.5px] leading-relaxed whitespace-pre-line p-3.5 bg-slate-950/70 border border-slate-850 rounded-2xl mb-4 font-mono">
              {aiUpdateStatus}
            </div>

            <button 
              onClick={() => setAiUpdateStatus(null)}
              className="w-full p-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs hover:from-amber-600 transition cursor-pointer font-mono uppercase"
            >
              {t.btnCloseAndContinue}
            </button>
          </div>
        </div>
      )}

      {/* SAVED PROFILES / HISTORY MODAL */}
      <SavedProfilesModal
        isOpen={showSavedProfilesModal}
        onClose={() => setShowSavedProfilesModal(false)}
        theme={theme}
        t={t}
        lang={lang}
        crmLeads={crmLeads}
        clientId={clientId}
        onLoadLead={handleLoadLead}
      />

      {/* SPECIFICATION REPORT MODAL (PA1, PA2, PA3 - CHUNKING - MULTILINGUAL - APPENDICES PDF) */}
      {(pendingPackage || showActivationModal) && (
        <PaymentRequestModal
          theme={theme}
          tier={pendingPackage || 'standard'}
          clientId={clientId}
          customerName={userInfo?.name || ""}
          customerPhone={userInfo?.phone || ""}
          hotline={hotline}
          bankInfo={bankInfo}
          bankQr={bankQr}
          amount={(() => {
            if ((pendingPackage || 'standard') === 'standard') return 299000;
            try {
              const [w, l] = String(planDimsFor(constructionInfo) || '').split(/[x×*]/).map(v => parseFloat(v));
              const v = tinhGiaGoiThietKe((w || 0) * (l || 0), constructionInfo.constructionType || 'Bê tông cốt thép truyền thống', parseInt(constructionInfo.floors || '1') || 1);
              return Number(v) > 0 ? Number(v) : 1500000;
            } catch { return 1500000; }
          })()}
          onClose={() => { setPendingPackage(null); setShowActivationModal(false); }}
          onCheckAgain={async () => {
            const want = pendingPackage || 'standard';
            const g = await refreshVerifiedPackage();
            if (g === want || (g === 'design' && want === 'standard')) { setPendingPackage(null); setShowActivationModal(false); return true; }
            return false;
          }}
          onRedeemCode={async (code: string) => {
            const ok = await handleApplyActivationCode(code);
            if (ok) { setPendingPackage(null); setShowActivationModal(false); }
            return ok;
          }}
        />
      )}

      {showSpecificationModal && <React.Suspense fallback={null}>
      <SpecificationReportModal
        isOpen={showSpecificationModal}
        onClose={() => setShowSpecificationModal(false)}
        selectedOptionId={selectedStructuralOptionId}
        onSelectOptionId={(id) => {
          setSelectedStructuralOptionId(id);
          const opt = STRUCTURAL_OPTIONS.find(o => o.id === id);
          if (opt) {
            setConstructionInfo(prev => ({ ...prev, loai_ket_cau_chinh: opt.name }));
          }
        }}
        userInfo={userInfo}
        constructionInfo={constructionInfo}
        fengShuiAnalysis={fengShuiAnalysis || undefined}
        isPaidTier={goiKichHoat !== 'free' || isAdminAuthenticated}
        onUnlockPaidTier={() => setShowActivationModal(true)}
        onExportAdminPdf={() => {
          xuatPDF('design', {
            userInfo,
            constructionInfo,
            detailItems,
            fengShuiAnalysis,
            aiResult: aiReport,
            floorPlanSvgUrl,
            elevationSvgUrl
          });
        }}
        lang={lang}
        clientId={clientId}
        onConsumeCredit={() => consumeAiCredit("Tạo thuyết minh 10 mục AI")}
      />
      </React.Suspense>}

    </div>
  );
}
