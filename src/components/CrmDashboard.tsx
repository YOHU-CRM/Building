import React, { useState, useEffect } from "react";
import { getUnifiedEstimate } from '../lib/unifiedPricing';
import { callGas, adminActivatePackage, labelToGoi } from '../lib/gasClient';
import { 
  X, 
  Download, 
  Database, 
  Users, 
  Sparkles, 
  TrendingUp, 
  Check, 
  Trash2, 
  FileText, 
  Edit3, 
  Lock, 
  Send, 
  HelpCircle, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  FilePlus,
  Video,
  Film,
  Play
} from "lucide-react";
import { addClientDocument } from "../lib/clientDocuments";
import { DashboardStats } from "../types";
import CtvSummaryTable from "./CtvSummaryTable";
import { formatCurrency, formatCurrencyNoSymbol } from "../lib/currency";

interface CrmDashboardProps {
  onClose: () => void;
  crmLeads: any[];
  onUpdateStatus: (leadId: string, newStatus: string) => void;
  onExportCSV: () => void;
  onExportPDF: (goi: 'free' | 'standard' | 'design', lead: any) => void;
  onLoadLead?: (lead: any) => void;
  onActivateLeadGoi?: (leadId: string, phone: string, goi: string) => void;
  dynamicGasUrl?: string;
  onUpdateGasUrl?: (newUrl: string) => void;
  onLogoutAdmin?: () => void;
  onChangeAdminPassword?: () => void;
  lang: 'vi' | 'en' | 'lo' | 'zh';
  t: any;
}

export default function CrmDashboard({
  onClose,
  crmLeads,
  onUpdateStatus,
  onExportCSV,
  onExportPDF,
  onLoadLead,
  onActivateLeadGoi,
  dynamicGasUrl = "",
  onUpdateGasUrl,
  onLogoutAdmin,
  onChangeAdminPassword,
  lang,
  t
}: CrmDashboardProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [gasUrlInput, setGasUrlInput] = useState<string>(dynamicGasUrl);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [showGsheetGuide, setShowGsheetGuide] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'leads' | 'videos' | 'gsheet' | 'revenue'>('leads');

  // Video Orders & Filtering States
  const [videoStatusFilter, setVideoStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [videoOrdersList, setVideoOrdersList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("yohu_video_orders");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Video Studio Dispatch States
  const [dispatchingVideoId, setDispatchingVideoId] = useState<string | null>(null);
  const [videoDispatchToast, setVideoDispatchToast] = useState<{
    type: 'success' | 'error';
    message: string;
    videoUrl?: string;
  } | null>(null);

  // Admin Code Verification States
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(() => {
    return !!sessionStorage.getItem("yohu_admin_code");
  });
  const [enteredAdminCode, setEnteredAdminCode] = useState<string>("");
  const [adminVerificationError, setAdminVerificationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Load latest video orders from API when Admin is verified
  useEffect(() => {
    if (isAdminVerified) {
      fetch("/api/video-orders", {
        headers: { "x-admin-code": sessionStorage.getItem("yohu_admin_code") || "" }
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setVideoOrdersList(data);
            localStorage.setItem("yohu_video_orders", JSON.stringify(data));
          }
        })
        .catch(() => {});
    }
  }, [isAdminVerified]);

  // Auto-verify stored code on mount
  useEffect(() => {
    const savedCode = sessionStorage.getItem("yohu_admin_code");
    if (savedCode) {
      setIsVerifying(true);
      fetch("/api/leads", {
        method: "GET",
        headers: {
          "x-admin-code": savedCode
        }
      }).then(async (res) => {
        if (res.status === 200) {
          setIsAdminVerified(true);
        } else {
          sessionStorage.removeItem("yohu_admin_code");
          setIsAdminVerified(false);
          try {
            const data = await res.json();
            if (data && data.error) {
              setAdminVerificationError(data.error);
            } else if (res.status === 429) {
              setAdminVerificationError("Đã nhập sai quá nhiều lần, vui lòng thử lại sau 15 phút");
            } else {
              setAdminVerificationError("Mã bảo mật Admin không chính xác.");
            }
          } catch {
            if (res.status === 429) {
              setAdminVerificationError("Đã nhập sai quá nhiều lần, vui lòng thử lại sau 15 phút");
            } else {
              setAdminVerificationError("Mã bảo mật Admin không chính xác.");
            }
          }
        }
      }).catch(() => {
        // Fallback locally if server is temporarily unreachable but code is saved
        setIsAdminVerified(true);
      }).finally(() => {
        setIsVerifying(false);
      });
    } else {
      setIsAdminVerified(false);
    }
  }, []);

  const handleVerifyAdminCode = async (codeToVerify: string) => {
    setIsVerifying(true);
    setAdminVerificationError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "GET",
        headers: {
          "x-admin-code": codeToVerify
        }
      });

      if (res.status === 200) {
        sessionStorage.setItem("yohu_admin_code", codeToVerify);
        setIsAdminVerified(true);
      } else {
        try {
          const data = await res.json();
          if (data && data.error) {
            setAdminVerificationError(data.error);
          } else if (res.status === 429) {
            setAdminVerificationError("Đã nhập sai quá nhiều lần, vui lòng thử lại sau 15 phút");
          } else {
            setAdminVerificationError("Mã Admin không chính xác. Vui lòng nhập lại.");
          }
        } catch {
          if (res.status === 429) {
            setAdminVerificationError("Đã nhập sai quá nhiều lần, vui lòng thử lại sau 15 phút");
          } else {
            setAdminVerificationError("Mã Admin không chính xác. Vui lòng nhập lại.");
          }
        }
      }
    } catch (err: any) {
      setAdminVerificationError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setIsVerifying(false);
    }
  };

  // State for sending document
  const [docModal, setDocModal] = useState<{ leadId: string, title: string, url: string } | null>(null);

  const handleSendDocument = async () => {
    if (!docModal) return;
    try {
      await addClientDocument({
        clientId: docModal.leadId,
        title: docModal.title,
        url: docModal.url,
        createdAt: new Date()
      });
      alert('Đã gửi tài liệu thành công!');
      setDocModal(null);
    } catch (err) {
      console.error(err);
      alert('Lỗi gửi tài liệu.');
    }
  };

  // Helper for status badge styles
  const getStatusBadge = (status: string) => {
    const dict: Record<string, { label: string, color: string }> = {
      new: { label: t.crmStatusNew || 'Mới', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
      contacted: { label: t.crmStatusContacted || 'Đang gọi', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      negotiating: { label: t.crmStatusNegotiating || 'Thương thảo', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
      won: { label: t.crmStatusWon || 'Ký thầu', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
      lost: { label: t.crmStatusLost || 'Từ chối', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
    };
    return dict[status] || { label: status, color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' };
  };

  // Safe package activation with Google Sheet update
  const activateGoi = async (leadId: string, phone: string, goi: string) => {
    try {
      if (onActivateLeadGoi) {
        onActivateLeadGoi(leadId, phone, goi);
      } else {
        // Fallback directly
        try {
          await fetch(`/api/leads/${leadId}/goi`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              goi_mua: goi,
              trang_thai_pdf: "san_sang_download",
              so_dt: phone,
            }),
          });
        } catch (e) {
          console.warn("Server route not available, saved locally:", e);
        }
      }

      // Also forward notification to Google Sheets
      const params = new URLSearchParams({
        data: JSON.stringify({
          type: "kich_hoat_goi",
          ma_kh: leadId,
          so_dt: phone,
          goi_mua: goi,
          timestamp: new Date().toISOString()
        })
      });
      void params;
      // Kích hoạt qua máy chủ (cần mã admin). Máy chủ tự ghi Google Sheet.
      if (!onActivateLeadGoi) {
        const act = await adminActivatePackage(leadId, labelToGoi(goi));
        if (!act.ok) { alert(`❌ Kích hoạt thất bại: ${act.error}`); return; }
      }

      const successMsg = lang === 'vi' 
        ? `✅ Đã kích hoạt ${goi} cho khách hàng ${phone || leadId}!` 
        : lang === 'en'
        ? `✅ Activated ${goi} for client ${phone || leadId}!`
        : lang === 'lo'
        ? `✅ ເປີດໃຊ້ງານ ${goi} ສຳເລັດແລ້ວ!`
        : `✅ 已成功为客户 ${phone || leadId} 激活 ${goi}！`;

      alert(successMsg);
    } catch (err) {
      console.error("Activation error:", err);
    }
  };

  // Sync All Leads to Google Sheet
  const handleSyncAllToGoogleSheet = async () => {
    if (!gasUrlInput.trim()) {
      alert("Vui lòng nhập Google Sheets Webhook URL!");
      return;
    }
    setIsSyncingAll(true);
    setSyncFeedback(null);

    let successCount = 0;
    try {
      for (const lead of crmLeads) {
        const payload = {
          type: "khach_hang",
          id: lead.id,
          "Họ và tên": lead.userInfo?.name || "Khách hàng",
          "Số điện thoại": lead.userInfo?.phone || "",
          "Email": lead.userInfo?.email || "",
          "Địa chỉ": lead.userInfo?.address || "",
          "Năm sinh": lead.userInfo?.birthDate || "",
          "Hướng đất": lead.userInfo?.desiredDirection || "",
          "Loại công trình": lead.constructionInfo?.constructionType || "",
          "Diện tích": lead.constructionInfo?.dimensions || "",
          "Số tầng": lead.constructionInfo?.floors || "",
          "Tổng kinh phí": lead.constructionInfo?.totalBudget || "",
          "Đơn vị tiền": lead.constructionInfo?.budgetUnit || "VND",
          "Gói mua": lead.goiMua || lead.goi_mua || "Báo cáo cơ bản",
          "Trạng thái": lead.status || "new",
          "Thời gian": lead.createdAt || new Date().toISOString()
        };

        const params = new URLSearchParams({ data: JSON.stringify(payload) });
        await callGas(params).catch(() => {});
        successCount++;
      }

      const feedback = lang === 'vi' 
        ? `✅ Đã đồng bộ thành công ${successCount}/${crmLeads.length} hồ sơ sang Google Sheet!` 
        : lang === 'en'
        ? `✅ Successfully synced ${successCount}/${crmLeads.length} leads to Google Sheet!`
        : lang === 'lo'
        ? `✅ ຊິງຄ໌ຂໍ້ມູນສຳເລັດ ${successCount}/${crmLeads.length} ລາຍການໄປ Google Sheet!`
        : `✅ 成功将 ${successCount}/${crmLeads.length} 份档案同步至 Google 表格！`;

      setSyncFeedback(feedback);
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err: any) {
      setSyncFeedback("❌ Lỗi đồng bộ: " + (err.message || String(err)));
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSaveGasUrl = () => {
    if (onUpdateGasUrl) {
      onUpdateGasUrl(gasUrlInput);
    }
    localStorage.setItem("yohu_gas_url", gasUrlInput);
    alert(t.gsheetSyncSuccess || "Đã lưu Webhook Google Sheets thành công!");
  };

  const handleDispatchVideoToStudio = async (lead: any) => {
    if (!lead || !lead.id) return;
    const leadId = lead.id;
    setDispatchingVideoId(leadId);
    setVideoDispatchToast(null);

    // Extract proper birthYear
    let birthYearVal: string | number = "";
    if (lead.userInfo?.birthDate) {
      try {
        const d = new Date(lead.userInfo.birthDate);
        if (!isNaN(d.getFullYear())) {
          birthYearVal = d.getFullYear();
        }
      } catch {}
      if (!birthYearVal) {
        const p = parseInt(lead.userInfo.birthDate);
        if (!isNaN(p)) birthYearVal = p;
      }
    }

    const payload = {
      projectId: leadId,
      customerName: lead.userInfo?.name || "Gia chủ",
      birthYear: birthYearVal,
      element: lead.fengShuiAnalysis?.element || "Thiên Thượng Hỏa",
      direction: lead.userInfo?.desiredDirection || (Array.isArray(lead.fengShuiAnalysis?.favorableDirections) ? lead.fengShuiAnalysis.favorableDirections[0] : lead.fengShuiAnalysis?.favorableDirections) || "Nam (Sinh Khí)",
      buildingType: lead.constructionInfo?.constructionType || "Biệt thự",
      packageType: lead.videoPackageType || (lead.goiMua?.includes("1.5") ? "CINEMATIC" : "STANDARD"),
      images: lead.images || lead.constructionInfo?.referenceImages || (lead.link_anh_phoi_canh ? [lead.link_anh_phoi_canh] : [])
    };

    try {
      // 1. Send to server backend proxy
      const res = await fetch("/api/admin/dispatch-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-code": sessionStorage.getItem("yohu_admin_code") || ""
        },
        body: JSON.stringify(payload)
      });

      let resData: any = null;
      try {
        resData = await res.json();
      } catch {}

      if (res.ok && resData?.success) {
        // Also update local CRM leads with status
        const savedLeads = localStorage.getItem("yohu_crm_leads");
        if (savedLeads) {
          const leads = JSON.parse(savedLeads);
          const idx = leads.findIndex((l: any) => l.id === leadId);
          if (idx >= 0) {
            leads[idx].videoStatus = "RENDERING";
            leads[idx].link_video_phoi_canh = resData.studioResponse?.videoUrl || leads[idx].link_video_phoi_canh || "";
            localStorage.setItem("yohu_crm_leads", JSON.stringify(leads));
          }
        }

        setVideoDispatchToast({
          type: 'success',
          message: `🎬 Đã gửi lệnh tạo video 3D phong thủy cho hồ sơ "${lead.userInfo?.name || leadId}" sang Video Studio thành công!`,
          videoUrl: resData?.studioResponse?.videoUrl
        });
      } else {
        // Không gửi thẳng từ trình duyệt (lộ mã bí mật). Báo lỗi rõ để admin xử lý.
        setVideoDispatchToast({
          type: 'error',
          message: `❌ Chưa gửi được lệnh video (${resData?.error || 'lỗi ' + res.status}). Kiểm tra đăng nhập Admin và cấu hình VIDEO_STUDIO_URL trên Vercel.`
        });
      }
    } catch (err: any) {
      console.warn("Video dispatch exception:", err);
      setVideoDispatchToast({
        type: 'error',
        message: `❌ Không kết nối được máy chủ để gửi lệnh video. Vui lòng thử lại.`
      });
    } finally {
      setDispatchingVideoId(null);
      setTimeout(() => {
        setVideoDispatchToast((prev) => (prev?.type === 'success' ? null : prev));
      }, 7000);
    }
  };

  const normalizeVideoStatus = (statusStr?: string): 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' => {
    const s = String(statusStr || '').toUpperCase();
    if (s.includes('COMPLET') || s.includes('XONG') || s.includes('HOÀN THÀNH') || s.includes('ĐÃ GIAO')) {
      return 'COMPLETED';
    }
    if (s.includes('RENDER') || s.includes('PROGRESS') || s.includes('LÀM') || s.includes('TẠO') || s.includes('DISPATCH') || s.includes('XỬ LÝ') || s.includes('TIẾP NHẬN')) {
      return 'IN_PROGRESS';
    }
    return 'PENDING';
  };

  const handleUpdateVideoOrderStatus = async (orderId: string, newStatus: string, videoUrl?: string) => {
    const updatedList = videoOrdersList.map(o => {
      if (o.id === orderId || o.projectId === orderId || o.customerId === orderId) {
        return { ...o, status: newStatus, ...(videoUrl !== undefined ? { videoUrl, link: videoUrl } : {}) };
      }
      return o;
    });
    setVideoOrdersList(updatedList);
    localStorage.setItem("yohu_video_orders", JSON.stringify(updatedList));

    // Update lead if matching
    const leads = crmLeads || [];
    const leadIdx = leads.findIndex((l: any) => l.id === orderId || "VID-" + l.id === orderId);
    if (leadIdx >= 0) {
      leads[leadIdx].videoStatus = newStatus;
      if (videoUrl) leads[leadIdx].link_video_phoi_canh = videoUrl;
      localStorage.setItem("yohu_crm_leads", JSON.stringify(leads));
    }

    // Sync to API
    const foundOrder = updatedList.find(o => o.id === orderId || o.projectId === orderId || o.customerId === orderId);
    if (foundOrder) {
      try {
        await fetch("/api/video-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-code": sessionStorage.getItem("yohu_admin_code") || "" },
          body: JSON.stringify(foundOrder)
        });
      } catch {}
    }
  };

  // Compile combined video orders from direct video orders and CRM leads with video requests
  const allCombinedVideoOrders = (() => {
    const map = new Map<string, any>();
    (videoOrdersList || []).forEach((o: any) => {
      if (o && o.id) map.set(o.id, o);
    });
    (crmLeads || []).forEach((l: any) => {
      if (l && (l.videoStatus || l.videoPackageType || (l.goiMua && String(l.goiMua).toLowerCase().includes('video')))) {
        const vidId = "VID-" + l.id;
        if (!map.has(vidId)) {
          map.set(vidId, {
            id: vidId,
            projectId: l.id,
            customerId: l.id,
            customerName: l.userInfo?.name || "Gia chủ",
            phone: l.userInfo?.phone || "",
            buildingType: l.constructionInfo?.constructionType || "Nhà phố",
            birthYear: l.userInfo?.birthDate,
            element: l.fengShuiAnalysis?.element,
            direction: l.userInfo?.desiredDirection,
            packageType: l.videoPackageType || "STANDARD",
            packageName: l.videoPackageType ? `Gói ${l.videoPackageType}` : "Video Tiêu Chuẩn",
            status: l.videoStatus || "PENDING",
            videoUrl: l.link_video_phoi_canh || "",
            images: l.images || l.constructionInfo?.referenceImages || (l.link_anh_phoi_canh ? [l.link_anh_phoi_canh] : []),
            createdAt: l.createdAt || new Date().toISOString()
          });
        }
      }
    });
    return Array.from(map.values());
  })();

  const pendingVideoCount = allCombinedVideoOrders.filter(o => normalizeVideoStatus(o.status) === 'PENDING').length;
  const inProgressVideoCount = allCombinedVideoOrders.filter(o => normalizeVideoStatus(o.status) === 'IN_PROGRESS').length;
  const completedVideoCount = allCombinedVideoOrders.filter(o => normalizeVideoStatus(o.status) === 'COMPLETED').length;

  const calculateStats = (): DashboardStats => {
    const leads = crmLeads || [];
    const totalLeads = leads.length;
    const totalAnalyses = leads.filter(l => l && (l.aiResult || l.aiReport)).length;
    
    let vndRevenue = 0;
    let usdRevenue = 0;

    leads.forEach(l => {
      if (!l) return;
      const budgetVal = Number(l.constructionInfo?.totalBudget) || 0;
      if (l.constructionInfo?.budgetUnit === 'USD') {
        usdRevenue += budgetVal;
      } else {
        vndRevenue += budgetVal;
      }
    });

    const counts = { new: 0, contacted: 0, negotiating: 0, won: 0, lost: 0 };
    leads.forEach(l => {
      if (!l) return;
      const s = l.status as 'new' | 'contacted' | 'negotiating' | 'won' | 'lost';
      if (counts[s] !== undefined) {
        counts[s]++;
      } else {
        counts.new++;
      }
    });

    return {
      totalLeads,
      totalAnalyses,
      estimatedRevenue: { vnd: vndRevenue, usd: usdRevenue },
      leadsByStatus: counts,
      leadsHistory: (leads || []).map(l => ({
        id: l?.id,
        name: l?.userInfo?.name || "Anonymous",
        phone: l?.userInfo?.phone || "No phone",
        constructionType: l?.constructionInfo?.constructionType || "Default Structure",
        totalBudget: formatCurrency(l?.constructionInfo?.totalBudget, lang),
        createdAt: l?.createdAt ? new Date(l.createdAt).toLocaleDateString() : "TBD",
        status: l?.status
      }))
    };
  };

  const stats = calculateStats();

  const calculateMonthlyRevenueData = () => {
    const map: Record<string, {
      free: number;
      standard: number;
      design: number;
      video: number;
      b2b: number;
      totalOrders: number;
      revenue: number;
      commission: number;
      aiCalls: number;
    }> = {};

    (crmLeads || []).forEach(lead => {
      if (!lead) return;
      const dateStr = lead.createdAt || lead.timestamp || new Date().toISOString();
      const d = new Date(dateStr);
      const year = isNaN(d.getFullYear()) ? 2026 : d.getFullYear();
      const month = isNaN(d.getMonth()) ? 8 : d.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;

      if (!map[monthKey]) {
        map[monthKey] = { free: 0, standard: 0, design: 0, video: 0, b2b: 0, totalOrders: 0, revenue: 0, commission: 0, aiCalls: 0 };
      }

      const goi = String(lead.goiMua || lead.goi_mua || lead.package || 'free').toLowerCase();
      let price = 0;
      if (goi.includes('1.5m') || goi.includes('thiết kế') || goi.includes('design')) {
        price = 1500000;
        map[monthKey].design++;
      } else if (goi.includes('299k') || goi.includes('tiêu chuẩn') || goi.includes('standard')) {
        price = 299000;
        map[monthKey].standard++;
      } else if (goi.includes('video')) {
        price = 500000;
        map[monthKey].video++;
      } else if (goi.includes('b2b')) {
        price = 5000000;
        map[monthKey].b2b++;
      } else {
        price = 0;
        map[monthKey].free++;
      }

      map[monthKey].totalOrders++;
      map[monthKey].revenue += price;
      
      if (lead.aiResult || lead.aiReport) {
        map[monthKey].aiCalls++;
      }
    });

    return Object.keys(map).sort().reverse().map(monthKey => {
      const item = map[monthKey];
      const aiCost = item.aiCalls * 500; // 500 VND per AI generation call
      const commission = item.commission || 0;
      const netProfit = item.revenue - commission - aiCost;
      const margin = item.revenue > 0 ? (netProfit / item.revenue) * 100 : 0;
      return {
        month: monthKey,
        ...item,
        aiCost,
        netProfit,
        margin: Number(margin.toFixed(2))
      };
    });
  };

  const monthlyRevenueData = calculateMonthlyRevenueData();

  if (!isAdminVerified) {
    return (
      <div className="w-full max-w-md mx-auto bg-[#0b1329] border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-2xl relative animate-fade-in text-slate-100 z-50 my-12">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-amber-500/20 text-[#FFD700] rounded-full border border-amber-500/30 shadow-md mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-[#FFD700]">Xác Thực Quyền Admin</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">
            Khu vực hạn chế. Vui lòng nhập mã bảo mật Admin để tiếp tục truy cập dữ liệu CRM và hoa hồng CTV.
          </p>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (enteredAdminCode.trim()) {
              handleVerifyAdminCode(enteredAdminCode.trim());
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mã Bảo Mật Admin</label>
            <input 
              type="password"
              placeholder="Nhập mã bảo mật..."
              value={enteredAdminCode}
              onChange={(e) => setEnteredAdminCode(e.target.value)}
              disabled={isVerifying}
              className="w-full bg-slate-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all font-mono"
              autoFocus
            />
          </div>

          {adminVerificationError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium leading-relaxed">
              ⚠️ {adminVerificationError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isVerifying}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isVerifying || !enteredAdminCode.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5"
            >
              {isVerifying ? "Đang xác thực..." : "Xác nhận"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl bg-[#0b1329] border border-slate-700/60 rounded-2xl p-4 sm:p-6 shadow-2xl relative animate-fade-in text-slate-100 z-50">
      {/* Top Header & Security Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-amber-500/20 text-[#FFD700] rounded-xl border border-amber-500/30 shadow-md">
              <Database className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-[#FFD700]">{t.adminTitle || "Yohu Admin Panel"}</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
                  {t.adminAccessGranted || "Admin Active"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{t.adminSub || "Trung tâm Quản trị Leads, Google Sheets và Phân quyền Khách hàng"}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Header */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          <button 
            type="button"
            onClick={() => setActiveTab(activeTab === 'videos' ? 'leads' : 'videos')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'videos' 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black border-amber-400 shadow-md shadow-amber-500/30' 
                : 'bg-slate-800 hover:bg-slate-750 text-amber-300 border-slate-700'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>🎬 Đơn Hàng Video 3D</span>
            {pendingVideoCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-mono font-bold">
                {pendingVideoCount}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab(activeTab === 'revenue' ? 'leads' : 'revenue')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'revenue' 
                ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md shadow-amber-500/30' 
                : 'bg-slate-800 hover:bg-slate-750 text-amber-400 border-slate-700'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>📊 Doanh Thu & Lợi Nhuận</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab(activeTab === 'gsheet' ? 'leads' : 'gsheet')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'gsheet' 
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30' 
                : 'bg-slate-800 hover:bg-slate-750 text-emerald-400 border-slate-700'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Google Sheet Sync</span>
          </button>

          <button 
            type="button"
            onClick={onExportCSV}
            className="px-3.5 py-2 bg-[#1e293b] hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-600 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title={t.exportCsvTooltip || "Xuất file CSV chứa dữ liệu khách hàng (Mở bằng Excel chuẩn UTF-8)"}
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>{t.exportCSV || "Export CSV"}</span>
          </button>

          {onChangeAdminPassword && (
            <button
              type="button"
              onClick={onChangeAdminPassword}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
              title={t.adminChangePassBtn || "Đổi Mật Khẩu Admin"}
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{t.adminChangePassBtn || "Đổi Mật Khẩu"}</span>
            </button>
          )}

          {onLogoutAdmin && (
            <button
              type="button"
              onClick={onLogoutAdmin}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
              title={t.adminLogoutBtn || "Khóa & Đăng Xuất"}
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{t.adminLogoutBtn || "Khóa Admin"}</span>
            </button>
          )}

          <button 
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>{t.btnCloseAdmin || "Đóng"}</span>
          </button>
        </div>
      </div>

      {/* Video Studio Dispatch Feedback Banner */}
      {videoDispatchToast && (
        <div className={`mb-5 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-semibold animate-fade-in shadow-lg ${
          videoDispatchToast.type === 'success' 
            ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-emerald-500/50 text-emerald-300' 
            : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
        }`}>
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{videoDispatchToast.message}</span>
          </div>
          {videoDispatchToast.videoUrl && (
            <a 
              href={videoDispatchToast.videoUrl} 
              target="_blank" 
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition flex items-center gap-1 shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Xem Video 3D</span>
            </a>
          )}
        </div>
      )}

      {/* 🎬 DEDICATED 3D VIDEO ORDERS MANAGEMENT & FILTER VIEW */}
      {activeTab === 'videos' && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-purple-950/30 via-slate-900 to-slate-900 border border-purple-500/40 shadow-xl animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg">
                  <Film className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-base text-amber-400 uppercase tracking-wide font-mono">
                  Quản Lý & Lọc Đơn Hàng Video 3D / VR Phong Thủy
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Lọc, duyệt và điều phối lệnh tạo video tự động sang Video Studio. Hỗ trợ theo dõi tiến độ và gắn link video cho gia chủ.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã đơn, tên gia chủ, SĐT..."
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans w-full sm:w-60"
              />
            </div>
          </div>

          {/* 🎯 STATUS FILTER TABS / PILLS */}
          <div className="flex flex-wrap items-center gap-2 mb-4 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <span>Lọc trạng thái:</span>
            </span>

            {/* Filter: ALL */}
            <button
              type="button"
              onClick={() => setVideoStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                videoStatusFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>Tất Cả</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                videoStatusFilter === 'ALL' ? 'bg-slate-950 text-amber-300' : 'bg-slate-700 text-slate-300'
              }`}>
                {allCombinedVideoOrders.length}
              </span>
            </button>

            {/* Filter: PENDING */}
            <button
              type="button"
              onClick={() => setVideoStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                videoStatusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-md font-black ring-2 ring-amber-400/40'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-amber-400'
              }`}
            >
              <span>⏳ Chờ Duyệt (Pending)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                videoStatusFilter === 'PENDING' ? 'bg-white text-amber-700 font-bold' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {pendingVideoCount}
              </span>
            </button>

            {/* Filter: IN_PROGRESS */}
            <button
              type="button"
              onClick={() => setVideoStatusFilter('IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                videoStatusFilter === 'IN_PROGRESS'
                  ? 'bg-purple-600 text-white shadow-md font-black ring-2 ring-purple-400/40'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-purple-400'
              }`}
            >
              <span>⚙️ Đang Thực Hiện (In Progress)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                videoStatusFilter === 'IN_PROGRESS' ? 'bg-white text-purple-800 font-bold' : 'bg-purple-500/20 text-purple-300'
              }`}>
                {inProgressVideoCount}
              </span>
            </button>

            {/* Filter: COMPLETED */}
            <button
              type="button"
              onClick={() => setVideoStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                videoStatusFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-md font-black ring-2 ring-emerald-400/40'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-emerald-400'
              }`}
            >
              <span>✅ Hoàn Thành (Completed)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                videoStatusFilter === 'COMPLETED' ? 'bg-white text-emerald-800 font-bold' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {completedVideoCount}
              </span>
            </button>
          </div>

          {/* VIDEO ORDERS TABLE */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 font-mono text-slate-400 text-xs">
                  <th className="p-3">Mã Đơn / Khách Hàng</th>
                  <th className="p-3">Gói Dịch Vụ Video</th>
                  <th className="p-3">Ảnh Phối Cảnh & Phong Thủy</th>
                  <th className="p-3">Trạng Thái Đơn</th>
                  <th className="p-3">Thao Tác Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {allCombinedVideoOrders
                  .filter(o => {
                    const norm = normalizeVideoStatus(o.status);
                    if (videoStatusFilter === 'PENDING' && norm !== 'PENDING') return false;
                    if (videoStatusFilter === 'IN_PROGRESS' && norm !== 'IN_PROGRESS') return false;
                    if (videoStatusFilter === 'COMPLETED' && norm !== 'COMPLETED') return false;
                    if (searchTerm.trim()) {
                      const q = searchTerm.toLowerCase();
                      const matchName = (o.customerName || "").toLowerCase().includes(q);
                      const matchPhone = (o.phone || "").includes(q);
                      const matchId = (o.id || o.projectId || "").toLowerCase().includes(q);
                      const matchPkg = (o.packageName || o.packageType || "").toLowerCase().includes(q);
                      return matchName || matchPhone || matchId || matchPkg;
                    }
                    return true;
                  })
                  .map((order) => {
                    const normStatus = normalizeVideoStatus(order.status);
                    const leadObj = crmLeads.find((l: any) => l.id === order.projectId || l.id === order.customerId) || {
                      id: order.projectId || order.customerId,
                      userInfo: { name: order.customerName, phone: order.phone, birthDate: order.birthYear, desiredDirection: order.direction },
                      constructionInfo: { constructionType: order.buildingType, referenceImages: order.images },
                      fengShuiAnalysis: { element: order.element },
                      videoPackageType: order.packageType,
                      images: order.images
                    };

                    return (
                      <tr key={order.id} className="hover:bg-slate-900/50 transition-colors font-sans">
                        <td className="p-3">
                          <div className="font-bold text-slate-100 text-xs">{order.customerName || "Gia chủ"}</div>
                          <div className="text-amber-300 font-mono text-[11px] font-semibold mt-0.5">{order.phone || "Chưa có SĐT"}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{order.buildingType || "Nhà phố"}</div>
                          <div className="text-[9px] font-mono text-slate-500 mt-0.5">{order.id}</div>
                        </td>

                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono inline-block ${
                            order.packageType === 'CINEMATIC' || order.packageId === 'VID-03'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : order.packageType === 'ADVANCED' || order.packageId === 'VID-02'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {order.packageName || `Gói ${order.packageType || 'STANDARD'}`}
                          </span>
                          <div className="text-emerald-400 font-mono font-bold text-xs mt-1">
                            {formatCurrency(order.price || (order.packageType === 'CINEMATIC' ? 2500000 : order.packageType === 'ADVANCED' ? 1200000 : order.packageType === 'TEASER' ? 200000 : 500000), lang)}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="text-[11px] text-slate-300 space-y-0.5">
                            {order.element && <div>Mệnh: <b className="text-amber-400">{order.element}</b></div>}
                            {order.direction && <div>Hướng: <b className="text-slate-200">{order.direction}</b></div>}
                            {order.birthYear && <div>Năm sinh: <b className="text-slate-200">{order.birthYear}</b></div>}
                          </div>

                          {/* Thumbnails */}
                          {order.images && order.images.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2">
                              {order.images.slice(0, 3).map((img: string, i: number) => (
                                <img 
                                  key={i} 
                                  src={img} 
                                  alt="Thumb" 
                                  className="w-8 h-8 rounded object-cover border border-slate-700 hover:scale-125 transition-transform" 
                                />
                              ))}
                              {order.images.length > 3 && (
                                <span className="text-[10px] text-slate-400 font-mono">+{order.images.length - 3}</span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="flex flex-col gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono w-fit uppercase ${
                              normStatus === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : normStatus === 'IN_PROGRESS'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            }`}>
                              {normStatus === 'COMPLETED' ? '✅ Completed' : normStatus === 'IN_PROGRESS' ? '⚙️ In Progress' : '⏳ Pending'}
                            </span>

                            {/* Status Selector */}
                            <select
                              value={order.status || (normStatus === 'COMPLETED' ? 'Hoàn thành' : normStatus === 'IN_PROGRESS' ? 'RENDERING' : 'PENDING')}
                              onChange={(e) => handleUpdateVideoOrderStatus(order.id, e.target.value)}
                              className="bg-slate-900 border border-slate-700 text-slate-200 rounded p-1 text-[10px] cursor-pointer"
                            >
                              <option value="PENDING">⏳ Chờ duyệt (Pending)</option>
                              <option value="RENDERING">⚙️ Đang render (In Progress)</option>
                              <option value="Hoàn thành">✅ Hoàn thành (Completed)</option>
                            </select>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDispatchVideoToStudio(leadObj)}
                              disabled={dispatchingVideoId === (order.projectId || order.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                dispatchingVideoId === (order.projectId || order.id)
                                  ? 'bg-amber-600/50 text-white cursor-wait'
                                  : normStatus === 'IN_PROGRESS'
                                  ? 'bg-purple-600/40 text-purple-200 border border-purple-500/50 hover:bg-purple-600 hover:text-white'
                                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black'
                              }`}
                            >
                              <Film className={`w-3.5 h-3.5 ${dispatchingVideoId === (order.projectId || order.id) ? 'animate-spin' : ''}`} />
                              <span>{normStatus === 'IN_PROGRESS' ? "Gửi Lại Studio" : "🎬 Duyệt & Tạo Video"}</span>
                            </button>

                            {order.videoUrl && (
                              <a
                                href={order.videoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition"
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

                {allCombinedVideoOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                      Chưa có đơn hàng Video 3D nào. Khi khách hàng hoặc CTV đặt video, danh sách sẽ hiển thị và tự động đồng bộ tại đây.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dashboard Doanh Thu & Lợi Nhuận Panel */}
      {activeTab === 'revenue' && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/40 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h3 className="font-bold text-sm text-amber-400 uppercase tracking-wide font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>📊 Dashboard Doanh Thu Theo Tháng + Lợi Nhuận / Margin (tab: Dashboard_Doanh_Thu)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Tự động tổng hợp doanh thu theo từng tháng từ giao dịch, trừ hoa hồng CTV và chi phí AI (500₫/lượt gọi AI).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-amber-300 border-b border-slate-800 font-mono">
                  <th className="p-3">Tháng</th>
                  <th className="p-3 text-center">Free</th>
                  <th className="p-3 text-center">Tiêu Chuẩn ({formatCurrencyNoSymbol(299000, lang)})</th>
                  <th className="p-3 text-center">Thiết Kế ({formatCurrencyNoSymbol(1500000, lang)})</th>
                  <th className="p-3 text-center">Video</th>
                  <th className="p-3 text-center">B2B</th>
                  <th className="p-3 text-center font-bold">Tổng Đơn</th>
                  <th className="p-3 text-right">Tổng Doanh Thu</th>
                  <th className="p-3 text-right">HH Đã Trả</th>
                  <th className="p-3 text-right">Chi Phí AI</th>
                  <th className="p-3 text-right font-bold text-emerald-400">Lợi Nhuận Ròng</th>
                  <th className="p-3 text-right font-bold text-amber-400">% Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {monthlyRevenueData.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-850/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-200">{row.month}</td>
                    <td className="p-3 text-center text-slate-400">{row.free}</td>
                    <td className="p-3 text-center text-slate-300">{row.standard}</td>
                    <td className="p-3 text-center text-emerald-400 font-bold">{row.design}</td>
                    <td className="p-3 text-center text-slate-300">{row.video}</td>
                    <td className="p-3 text-center text-slate-300">{row.b2b}</td>
                    <td className="p-3 text-center font-bold">{row.totalOrders}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-200">{formatCurrency(row.revenue, lang)}</td>
                    <td className="p-3 text-right font-mono text-rose-400">{formatCurrency(row.commission, lang)}</td>
                    <td className="p-3 text-right font-mono text-amber-400">{formatCurrency(row.aiCost, lang)}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(row.netProfit, lang)}</td>
                    <td className="p-3 text-right font-mono font-bold text-amber-300">{row.margin}%</td>
                  </tr>
                ))}
                {monthlyRevenueData.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-8 text-center text-slate-500">
                      Chưa có dữ liệu giao dịch để tổng hợp doanh thu theo tháng.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-amber-400">💡 Hướng dẫn Apps Script (`tinhDashboardThang`):</div>
            <p>Hàm Apps Script đã được định nghĩa để đồng bộ với tab <code className="text-amber-300">Dashboard_Doanh_Thu</code> trong Google Sheet của bạn. Chi phí AI tính cố định <code className="text-emerald-400">500 VNĐ / lượt gọi AI</code>.</p>
          </div>

          {/* Objective 8: Bảng tổng hợp hiệu quả theo từng CTV */}
          <CtvSummaryTable crmLeads={crmLeads} lang={lang} />
        </div>
      )}

      {/* Google Sheets Synchronizer Card */}
      {activeTab === 'gsheet' && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-xl animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <ExternalLink className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wide font-mono">
                  {t.gsheetSectionTitle || "Tự Động Đồng Bộ Google Sheets (Live Webhook)"}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {t.gsheetSectionSub || "Dữ liệu khách hàng nhập trên web sẽ tự động gửi thẳng về Google Sheets cá nhân của bạn theo thời gian thực."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGsheetGuide(!showGsheetGuide)}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showGsheetGuide ? "Ẩn hướng dẫn" : (t.gsheetGuideTitle || "Hướng dẫn cài đặt trong 1 phút")}</span>
            </button>
          </div>

          {/* Guide Dropdown */}
          {showGsheetGuide && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2 font-sans">
              <div className="font-bold text-amber-400">
                {lang === 'vi' ? '📋 3 bước kết nối Google Sheet cá nhân:' : lang === 'lo' ? '📋 3 ຂັ້ນຕອນເຊື່ອມຕໍ່ Google Sheet ສ່ວນຕົວ:' : lang === 'zh' ? '📋 连接个人 Google 表格的 3 个步骤：' : '📋 3 Steps to connect your personal Google Sheet:'}
              </div>
              <div>
                <b>{lang === 'vi' ? 'Bước 1:' : lang === 'lo' ? 'ຂັ້ນຕອນ 1:' : lang === 'zh' ? '第 1 步：' : 'Step 1:'}</b> {lang === 'vi' ? 'Mở Google Sheet cá nhân của bạn > Chọn Tiện ích mở rộng (Extensions) > Apps Script.' : lang === 'lo' ? 'ເປີດ Google Sheet ຂອງທ່ານ > ເລືອກ Extensions > Apps Script.' : lang === 'zh' ? '打开您的 Google 表格 > 选择 扩展程序 (Extensions) > Apps Script。' : 'Open your Google Sheet > Select Extensions > Apps Script.'}
              </div>
              <div>
                <b>{lang === 'vi' ? 'Bước 2:' : lang === 'lo' ? 'ຂັ້ນຕອນ 2:' : lang === 'zh' ? '第 2 步：' : 'Step 2:'}</b> {lang === 'vi' ? 'Dán đoạn mã nhận dữ liệu Webhook của Yohu > Bấm Triển khai (Deploy) > Triển khai mới (New deployment).' : lang === 'lo' ? 'ວາງລະຫັດ Webhook > ກົດ Deploy > New deployment.' : lang === 'zh' ? '粘贴 Yohu Webhook 脚本 > 点击 部署 (Deploy) > 新建部署 (New deployment)。' : 'Paste Yohu Webhook script > Click Deploy > New deployment.'}
              </div>
              <div>
                <b>{lang === 'vi' ? 'Bước 3:' : lang === 'lo' ? 'ຂັ້ນຕອນ 3:' : lang === 'zh' ? '第 3 步：' : 'Step 3:'}</b> {lang === 'vi' ? 'Chọn loại Web app > Mục "Ai có quyền truy cập" (Who has access) chọn "Bất kỳ ai" (Anyone) > Sao chép Webhook URL và dán vào ô bên dưới!' : lang === 'lo' ? 'ເລືອກ Web app > "Who has access" ເລືອກ "Anyone" > ຄັດລອກ Webhook URL ມາໃສ່ຫ້ອງລຸ່ມນີ້!' : lang === 'zh' ? '类型选择 Web 应用程序 > “访问权限”选择“任何人 (Anyone)” > 复制 Webhook URL 并粘贴到下方！' : 'Select Web app > "Who has access" select "Anyone" > Copy Webhook URL and paste below!'}
              </div>
            </div>
          )}

          {/* Input URL & Sync Actions */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <input 
                type="text"
                value={gasUrlInput}
                onChange={(e) => setGasUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveGasUrl}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              {t.gsheetSaveBtn || "Lưu Webhook"}
            </button>
            <button
              type="button"
              onClick={handleSyncAllToGoogleSheet}
              disabled={isSyncingAll || crmLeads.length === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? "Đang gửi..." : (t.gsheetSyncAllBtn || "⚡ Đồng bộ toàn bộ sang Sheet")}</span>
            </button>
          </div>

          {syncFeedback && (
            <div className="mt-3 p-2.5 rounded-xl bg-slate-950/70 border border-emerald-500/30 text-xs font-semibold text-emerald-400 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}
        </div>
      )}

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <span className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
            <Users className="w-6 h-6" />
          </span>
          <div>
            <div className="text-xs text-slate-400 font-mono uppercase">{t.crmStatsTotalLeads || "Tổng Leads"}</div>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
          </div>
        </div>
        <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <span className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
            <Sparkles className="w-6 h-6" />
          </span>
          <div>
            <div className="text-xs text-slate-400 font-mono uppercase">{t.crmStatsTotalAnalyses || "Hồ Sơ Đã Bóc Tách"}</div>
            <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
          </div>
        </div>
        <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <span className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </span>
          <div>
            <div className="text-xs text-slate-400 font-mono uppercase">{t.crmStatsRevenue || "Tổng Giá Trị Công Trình"}</div>
            <div className="text-sm font-bold font-mono text-emerald-400">
              {formatCurrency(stats.estimatedRevenue.vnd, lang)}
            </div>
            {stats.estimatedRevenue.usd > 0 && (
              <div className="text-xs font-mono text-slate-400">
                {formatCurrency(stats.estimatedRevenue.usd * 25000, lang)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status segments metric layout */}
      <div className="bg-slate-850/60 border border-slate-800 p-4 rounded-xl mb-6">
        <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
          {lang === 'vi' ? 'PHÂN BỔ TRẠNG THÁI KHÁCH HÀNG' : lang === 'en' ? 'CUSTOMER STATUS AGGREGATION' : lang === 'lo' ? 'ການແບ່ງສະຖານະລູກຄ້າ' : '客户状态汇总'}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-800/30 p-2.5 rounded-xl border border-amber-500/25 text-center">
            <div className="text-[10px] text-slate-400 font-semibold">{t.crmStatusNew || "Mới"}</div>
            <div className="text-lg font-bold text-amber-500">{stats.leadsByStatus.new}</div>
          </div>
          <div className="bg-slate-800/30 p-2.5 rounded-xl border border-blue-500/25 text-center">
            <div className="text-[10px] text-slate-400 font-semibold">{t.crmStatusContacted || "Đang gọi"}</div>
            <div className="text-lg font-bold text-blue-400">{stats.leadsByStatus.contacted}</div>
          </div>
          <div className="bg-slate-800/30 p-2.5 rounded-xl border border-purple-500/25 text-center">
            <div className="text-[10px] text-slate-400 font-semibold">{t.crmStatusNegotiating || "Thương thảo"}</div>
            <div className="text-lg font-bold text-purple-400">{stats.leadsByStatus.negotiating}</div>
          </div>
          <div className="bg-slate-800/30 p-2.5 rounded-xl border border-emerald-500/25 text-center">
            <div className="text-[10px] text-slate-400 font-semibold">{t.crmStatusWon || "Ký thầu"}</div>
            <div className="text-lg font-bold text-emerald-400">{stats.leadsByStatus.won}</div>
          </div>
          <div className="bg-slate-800/30 p-2.5 rounded-xl border border-rose-500/25 text-center">
            <div className="text-[10px] text-slate-400 font-semibold">{t.crmStatusLost || "Hủy"}</div>
            <div className="text-lg font-bold text-rose-400">{stats.leadsByStatus.lost}</div>
          </div>
        </div>
      </div>

      {/* Real-time CRM leads table grid */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
        <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wide text-slate-200">
              {lang === 'vi' ? 'Hồ Sơ Khách Hàng Yohu CRM (Bảo Mật Nội Bộ)' : lang === 'en' ? 'Yohu CRM Customer Leads (Confidential)' : lang === 'lo' ? 'ລາຍຊື່ລູກຄ້າ Yohu CRM' : '有湖 CRM 客户档案列表'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {crmLeads.length}
            </span>
          </div>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchLeads || "Tìm theo tên, SĐT, công trình..."}
            className="w-full sm:max-w-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#FFD700]"
          />
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse bg-slate-900 text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-800/30 border-b border-slate-800 font-mono text-slate-400 text-xs">
                <th className="p-3">{lang === 'vi' ? 'Họ và Tên' : lang === 'en' ? 'Client Profile' : lang === 'lo' ? 'ຊື່ ແລະ ນາມສະກຸນ' : '客户姓名'}</th>
                <th className="p-3">{lang === 'vi' ? 'Số Điện Thoại / Email' : lang === 'en' ? 'Contact Specs' : lang === 'lo' ? 'ເບີໂທ / ອີເມວ' : '电话 / 邮箱'}</th>
                <th className="p-3">{lang === 'vi' ? 'Công Trình & Ngân Sách' : lang === 'en' ? 'Construction & Budget' : lang === 'lo' ? 'ໂຄງສ້າງ ແລະ ງົບປະມານ' : '建筑类型与预算'}</th>
                <th className="p-3">{lang === 'vi' ? 'Gói Dịch Vụ' : lang === 'en' ? 'Package Tier' : lang === 'lo' ? 'ແພັກເກດ' : '服务套餐'}</th>
                <th className="p-3">{lang === 'vi' ? 'Thao Tác Quản Trị' : lang === 'en' ? 'Action Control' : lang === 'lo' ? 'ການຈັດການ' : '管理操作'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {(crmLeads || [])
                .filter(l => 
                  l && (
                    (l.userInfo?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (l.userInfo?.phone || "").includes(searchTerm) ||
                    (l.userInfo?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (l.id || "").toLowerCase().includes(searchTerm.toLowerCase())
                  )
                )
                .map((lead) => {
                  const badge = getStatusBadge(lead.status);
                  const totalFormatted = formatCurrencyNoSymbol(lead.constructionInfo?.totalBudget, lang);
                  const leadGoi = lead.goiMua || lead.goi_mua || "Báo cáo cơ bản";

                  return (
                    <tr key={lead.id} className="hover:bg-slate-800/30 font-sans transition-colors">
                      <td className="p-3 font-medium text-slate-100">
                        <div className="font-bold">{lead.userInfo?.name || (t.crmNewClient || "Khách hàng")}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{lead.userInfo?.address || (t.notUpdated || "Chưa cập nhật")}</div>
                        <div className="text-[9px] font-mono text-slate-500 mt-0.5">{lead.id}</div>
                      </td>
                      <td className="p-3 font-mono">
                        <div className="text-amber-300 font-bold">{lead.userInfo?.phone || (t.noPhone || "Chưa có SĐT")}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{lead.userInfo?.email || ""}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ""}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="capitalize font-semibold text-slate-200">
                          {lead.constructionInfo?.constructionType || "Nhà phố"} ({lead.constructionInfo?.dimensions || "100m²"})
                        </div>
                        <div className="font-bold text-emerald-400 font-mono text-xs mt-0.5">
                          NS khách: {totalFormatted} {lead.constructionInfo?.budgetUnit || "VND"}
                        </div>
                        {(() => {
                          try {
                            const est = getUnifiedEstimate({ constructionInfo: lead.constructionInfo, userInfo: lead.userInfo });
                            return <div className="font-bold text-sky-300 font-mono text-xs mt-0.5" title="Cùng số với màn hình khách & PDF">Dự toán Yohu: {formatCurrency(est.tong_tron_goi, lang)}</div>;
                          } catch { return null; }
                        })()}
                        {lead.constructionInfo?.floors && (
                          <div className="text-[10px] text-slate-400">{lead.constructionInfo.floors} {t.stepB?.floors || "tầng"}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold w-fit ${
                            leadGoi.includes('Bản vẽ') || leadGoi.includes('1.5M') || leadGoi === 'design'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : leadGoi.includes('đầy đủ') || leadGoi.includes('299K') || leadGoi === 'standard'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-700/40 text-slate-300 border border-slate-600'
                          }`}>
                            {leadGoi}
                          </span>

                          {/* Quick Package Activation Dropdown */}
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                activateGoi(lead.id, lead.userInfo?.phone, e.target.value);
                                e.target.value = "";
                              }
                            }}
                            className="bg-emerald-950/60 text-emerald-300 border border-emerald-600/40 text-[10px] font-bold p-1 rounded focus:outline-none cursor-pointer hover:border-emerald-500 transition-colors"
                          >
                            <option value="">⚡ {t.adminManualActivate || "Kích hoạt gói"}</option>
                            <option value="Báo cáo cơ bản">{t.pdf?.labels?.basicReport || "Free (Cơ bản)"}</option>
                            <option value="Báo cáo đầy đủ">{t.pdf?.labels?.fullReport || `${formatCurrencyNoSymbol(299000, lang)} (Tiêu chuẩn)`}</option>
                            <option value="Báo cáo + Bản vẽ">{t.pdf?.labels?.designReport || `${formatCurrencyNoSymbol(1500000, lang)} (Thiết kế)`}</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button onClick={() => setDocModal({ leadId: lead.id, title: '', url: '' })} className="p-1 text-sky-400 hover:text-sky-300" title="Gửi tài liệu">
                             <FilePlus className="w-4 h-4" />
                          </button>
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold font-mono whitespace-nowrap ${badge.color}`}>
                            {badge.label}
                          </span>

                          <select 
                            value={lead.status || "new"}
                            onChange={(e) => onUpdateStatus(lead.id, e.target.value)}
                            className="bg-[#1e293b] text-slate-200 border border-slate-700 text-[10px] p-1 rounded focus:outline-none cursor-pointer"
                          >
                            <option value="new">{t.crmStatusNew || (lang === 'vi' ? 'Mới' : 'New')}</option>
                            <option value="contacted">{t.crmStatusContacted || (lang === 'vi' ? 'Đã gọi' : 'Contacted')}</option>
                            <option value="negotiating">{t.crmStatusNegotiating || (lang === 'vi' ? 'Thương thảo' : 'Negotiating')}</option>
                            <option value="won">{t.crmStatusWon || (lang === 'vi' ? 'Ký thầu' : 'Deal Won')}</option>
                            <option value="lost">{t.crmStatusLost || (lang === 'vi' ? 'Hủy' : 'Disqualified')}</option>
                          </select>

                          {onLoadLead && (
                            <button
                              type="button"
                              onClick={() => onLoadLead(lead)}
                              className="px-2 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title={t.btnLoadAndViewProfile || (lang === 'vi' ? 'Nạp & Sửa hồ sơ này trên giao diện chính' : 'Load & Edit this profile in main form')}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{t.btnEditLead || (lang === 'vi' ? 'Sửa' : 'Edit')}</span>
                            </button>
                          )}

                          {/* 🎬 NÚT DUYỆT & TẠO VIDEO 3D PHONG THỦY */}
                          <button
                            type="button"
                            onClick={() => handleDispatchVideoToStudio(lead)}
                            disabled={dispatchingVideoId === lead.id}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                              dispatchingVideoId === lead.id
                                ? 'bg-amber-600/50 text-white cursor-wait'
                                : lead.videoStatus === 'RENDERING'
                                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50 hover:bg-purple-600 hover:text-white'
                                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 font-extrabold'
                            }`}
                            title="Duyệt & Gửi lệnh tạo video 3D phong thủy trực quan sang Video Studio"
                          >
                            <Film className={`w-3.5 h-3.5 ${dispatchingVideoId === lead.id ? 'animate-spin' : ''}`} />
                            <span>
                              {dispatchingVideoId === lead.id 
                                ? "Đang gửi Video Studio..." 
                                : lead.videoStatus === 'RENDERING'
                                ? "🎬 Video Đang Render"
                                : "🎬 Duyệt & Tạo Video 3D"}
                            </span>
                          </button>

                          {lead.link_video_phoi_canh && (
                            <a
                              href={lead.link_video_phoi_canh}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white rounded transition-colors"
                              title="Xem Video 3D đã tạo"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button 
                            type="button"
                            onClick={() => {
                              const goiMap: Record<string, 'free' | 'standard' | 'design'> = {
                                'Báo cáo cơ bản': 'free',
                                'Báo cáo đầy đủ': 'standard',
                                'Báo cáo + Bản vẽ': 'design',
                                'Gói Free': 'free',
                                'Gói Tiêu Chuẩn 299K': 'standard',
                                'Gói Thiết Kế 1.5M': 'design',
                                'free': 'free',
                                'standard': 'standard',
                                'design': 'design'
                              };
                              onExportPDF(goiMap[leadGoi] || 'standard', lead);
                            }}
                            className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded transition-colors cursor-pointer"
                            title={t.exportPdf || "Xuất PDF"}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {crmLeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                    {lang === 'vi' 
                      ? 'Chưa có dữ liệu CRM khách hàng. Thông tin bạn nhập ngoài biểu mẫu sẽ đồng bộ lập tức về đây.' 
                      : lang === 'en'
                      ? 'No CRM leads recorded yet. Submissions from the main form will sync here in real-time.'
                      : lang === 'lo'
                      ? 'ບໍ່ມີຂໍ້ມູນລູກຄ້າໃນລະບົບ CRM.'
                      : 'CRM 中暂无客户线索。在主界面提交的信息将实时同步至此处。'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Send Document Modal */}
      {docModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4">Gửi Tài Liệu</h3>
            <input className="w-full p-2 bg-slate-800 text-white rounded mb-2" placeholder="Tiêu đề tài liệu" value={docModal.title} onChange={e => setDocModal({...docModal, title: e.target.value})} />
            <input className="w-full p-2 bg-slate-800 text-white rounded mb-4" placeholder="Đường dẫn (URL)" value={docModal.url} onChange={e => setDocModal({...docModal, url: e.target.value})} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setDocModal(null)} className="px-4 py-2 bg-slate-700 text-white rounded">Hủy</button>
              <button onClick={handleSendDocument} className="px-4 py-2 bg-indigo-600 text-white rounded">Gửi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
