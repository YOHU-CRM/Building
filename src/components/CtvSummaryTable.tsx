import React, { useState, useMemo, useEffect } from "react";
import { Search, ArrowUpDown, DollarSign, Users, Award, ShieldAlert, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "../lib/currency";

interface CtvSummaryTableProps {
  crmLeads: any[];
  lang: string;
}

export default function CtvSummaryTable({ crmLeads, lang }: CtvSummaryTableProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<'revenue' | 'kh' | 'video' | 'commission' | 'debt'>('revenue');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [commissions, setCommissions] = useState<any[]>([]);

  const [ctvPartners, setCtvPartners] = useState<any[]>([]);
  const [videoOrders, setVideoOrders] = useState<any[]>([]);

  useEffect(() => {
    const adminCode = sessionStorage.getItem("yohu_admin_code") || "";
    const headers = { "x-admin-code": adminCode };

    // Load commissions
    fetch("/api/commissions", { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCommissions(data);
        } else {
          const saved = localStorage.getItem("yohu_commissions");
          if (saved) setCommissions(JSON.parse(saved));
        }
      })
      .catch(() => {
        try {
          const saved = localStorage.getItem("yohu_commissions");
          if (saved) setCommissions(JSON.parse(saved));
        } catch {}
      });

    // Load CTV Partners
    fetch("/api/ctv-partners", { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCtvPartners(data);
        } else {
          const saved = localStorage.getItem("yohu_ctv_partners");
          if (saved) {
            setCtvPartners(JSON.parse(saved));
          } else {
            setCtvPartners([
              { ma_ctv: "CTV001", loai_doi_tac: "CTV Thường", hh_thoa_thuan: 0 },
              { ma_ctv: "B2B01", loai_doi_tac: "B2B Đối Tác", hh_thoa_thuan: 0 },
              { ma_ctv: "VIP01", loai_doi_tac: "B2B VIP", hh_thoa_thuan: 30 }
            ]);
          }
        }
      })
      .catch(() => {
        try {
          const saved = localStorage.getItem("yohu_ctv_partners");
          if (saved) setCtvPartners(JSON.parse(saved));
        } catch {}
      });

    // Load Video Orders
    fetch("/api/video-orders", { headers })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setVideoOrders(data);
        } else {
          const saved = localStorage.getItem("yohu_video_orders");
          if (saved) setVideoOrders(JSON.parse(saved));
        }
      })
      .catch(() => {
        try {
          const saved = localStorage.getItem("yohu_video_orders");
          if (saved) setVideoOrders(JSON.parse(saved));
        } catch {}
      });
  }, []);

  // Compute all CTV stats
  const ctvStats = useMemo(() => {
    // Collect all unique CTV codes
    const codesSet = new Set<string>();
    ctvPartners.forEach((p: any) => {
      if (p.ma_ctv) codesSet.add(p.ma_ctv.trim().toUpperCase());
    });
    crmLeads.forEach((lead: any) => {
      const code = lead.ma_ctv || lead.maCtv || (lead.userInfo && lead.userInfo.ma_ctv);
      if (code) codesSet.add(String(code).trim().toUpperCase());
    });
    videoOrders.forEach((order: any) => {
      const code = order.ma_ctv || order.refCode;
      if (code) codesSet.add(String(code).trim().toUpperCase());
    });
    commissions.forEach((com: any) => {
      const code = com.refCode || com.ma_ctv;
      if (code) codesSet.add(String(code).trim().toUpperCase());
    });

    const list = Array.from(codesSet).map(code => {
      // Find partner type
      const partner = ctvPartners.find((p: any) => String(p.ma_ctv).toUpperCase() === code);
      const loaiDoiTac = partner ? partner.loai_doi_tac : "CTV Thường";

      // 1. Total KH Giới Thiệu
      const matchingLeads = crmLeads.filter((lead: any) => {
        const leadCode = lead.ma_ctv || lead.maCtv || (lead.userInfo && lead.userInfo.ma_ctv);
        return leadCode && String(leadCode).toUpperCase() === code;
      });
      const totalKH = matchingLeads.length;

      // 2. Total Video Orders
      const matchingVideos = videoOrders.filter((v: any) => {
        const videoCode = v.ma_ctv || v.refCode;
        return videoCode && String(videoCode).toUpperCase() === code;
      });
      const totalVideo = matchingVideos.length;

      // 3. Total Revenue
      let totalRevenue = 0;
      // Add lead packages revenues
      matchingLeads.forEach((lead: any) => {
        if (lead.doanh_thu) {
          totalRevenue += Number(lead.doanh_thu);
        } else if (lead.doanhThu) {
          totalRevenue += Number(lead.doanhThu);
        } else {
          // calculate fallback from package name
          const goi = String(lead.goiMua || lead.goi_mua || '').toLowerCase();
          if (goi.includes('1.5m') || goi.includes('thiết kế') || goi.includes('design')) {
            totalRevenue += 1500000;
          } else if (goi.includes('299k') || goi.includes('tiêu chuẩn') || goi.includes('standard')) {
            totalRevenue += 299000;
          }
        }
      });

      // Add video orders revenues
      matchingVideos.forEach((v: any) => {
        const pkg = String(v.packageId || v.goi_video || '');
        let price = 0;
        if (pkg === 'VID-TEASER') price = 200000;
        else if (pkg === 'VID-01') price = 500000;
        else if (pkg === 'VID-02') price = 1200000;
        else if (pkg === 'VID-03') price = 2500000;
        totalRevenue += price * (v.so_luong || v.quantity || 1);
      });

      // 4. Total Commission Generated
      const matchingCommissions = commissions.filter((com: any) => {
        const comCode = com.refCode || com.ma_ctv;
        return comCode && String(comCode).toUpperCase() === code;
      });
      const totalCommission = matchingCommissions.reduce((sum, com) => sum + (Number(com.amount) || 0), 0);

      // 5. Commission Paid vs Debt
      const paidCommissions = matchingCommissions.filter((com: any) => {
        const st = String(com.status || '').toLowerCase();
        return st.includes('thanh toán') || st.includes('trả') || st.includes('thanh_toan');
      });
      const commissionPaid = paidCommissions.reduce((sum, com) => sum + (Number(com.amount) || 0), 0);
      const commissionDebt = Math.max(0, totalCommission - commissionPaid);

      return {
        code,
        loaiDoiTac,
        totalKH,
        totalVideo,
        totalRevenue,
        totalCommission,
        commissionPaid,
        commissionDebt,
        lastUpdated: new Date().toLocaleDateString('vi-VN')
      };
    });

    return list;
  }, [crmLeads, ctvPartners, videoOrders, commissions]);

  // Handle Sort & Search
  const filteredAndSortedStats = useMemo(() => {
    let result = ctvStats.filter(item => 
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.loaiDoiTac.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortField === 'revenue') {
        valA = a.totalRevenue;
        valB = b.totalRevenue;
      } else if (sortField === 'kh') {
        valA = a.totalKH;
        valB = b.totalKH;
      } else if (sortField === 'video') {
        valA = a.totalVideo;
        valB = b.totalVideo;
      } else if (sortField === 'commission') {
        valA = a.totalCommission;
        valB = b.totalCommission;
      } else if (sortField === 'debt') {
        valA = a.commissionDebt;
        valB = b.commissionDebt;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [ctvStats, searchTerm, sortField, sortAsc]);

  const toggleSort = (field: 'revenue' | 'kh' | 'video' | 'commission' | 'debt') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending
    }
  };

  return (
    <div className="mt-8 p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-700/50 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
        <div>
          <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wide font-mono flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>👥 BẢNG TỔNG HỢP HIỆU QUẢ THEO TỪNG CTV (tab: Tong_Hop_CTV)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Tổng quan hiệu suất giới thiệu, doanh số mang lại, hoa hồng phát sinh và công nợ của từng CTV.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Tìm kiếm mã CTV..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/90 text-slate-300 border-b border-slate-800 font-mono">
              <th className="p-3">Mã CTV</th>
              <th className="p-3">Loại Đối Tác</th>
              <th 
                className="p-3 text-center cursor-pointer hover:bg-slate-900/50 transition-colors select-none"
                onClick={() => toggleSort('kh')}
              >
                <span className="flex items-center justify-center gap-1">
                  Tổng KH {sortField === 'kh' && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                </span>
              </th>
              <th 
                className="p-3 text-center cursor-pointer hover:bg-slate-900/50 transition-colors select-none"
                onClick={() => toggleSort('video')}
              >
                <span className="flex items-center justify-center gap-1">
                  Đơn Video {sortField === 'video' && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                </span>
              </th>
              <th 
                className="p-3 text-right cursor-pointer hover:bg-slate-900/50 transition-colors select-none"
                onClick={() => toggleSort('revenue')}
              >
                <span className="flex items-center justify-end gap-1">
                  Doanh Thu Mang Lại (₫) {sortField === 'revenue' && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                </span>
              </th>
              <th 
                className="p-3 text-right cursor-pointer hover:bg-slate-900/50 transition-colors select-none"
                onClick={() => toggleSort('commission')}
              >
                <span className="flex items-center justify-end gap-1">
                  HH Phát Sinh (₫) {sortField === 'commission' && <ArrowUpDown className="w-3 h-3 text-emerald-400" />}
                </span>
              </th>
              <th className="p-3 text-right">HH Đã Trả (₫)</th>
              <th 
                className="p-3 text-right cursor-pointer hover:bg-slate-900/50 transition-colors select-none"
                onClick={() => toggleSort('debt')}
              >
                <span className="flex items-center justify-end gap-1 font-bold text-amber-400">
                  HH Còn Nợ (₫) {sortField === 'debt' && <ArrowUpDown className="w-3 h-3 text-amber-400" />}
                </span>
              </th>
              <th className="p-3 text-center">Cập Nhật</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredAndSortedStats.map((row) => (
              <tr key={row.code} className="hover:bg-slate-900/40 transition-colors font-mono">
                <td className="p-3 font-bold text-emerald-400">{row.code}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    row.loaiDoiTac.includes('VIP') 
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                      : row.loaiDoiTac.includes('Đối Tác') 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                        : 'bg-slate-800 text-slate-300 border border-slate-750'
                  }`}>
                    {row.loaiDoiTac}
                  </span>
                </td>
                <td className="p-3 text-center font-bold text-slate-200">{row.totalKH}</td>
                <td className="p-3 text-center text-slate-300">{row.totalVideo}</td>
                <td className="p-3 text-right font-bold text-slate-200">{formatCurrency(row.totalRevenue, lang)}</td>
                <td className="p-3 text-right text-teal-400">{formatCurrency(row.totalCommission, lang)}</td>
                <td className="p-3 text-right text-emerald-400">{formatCurrency(row.commissionPaid, lang)}</td>
                <td className={`p-3 text-right font-bold ${row.commissionDebt > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                  {formatCurrency(row.commissionDebt, lang)}
                </td>
                <td className="p-3 text-center text-slate-500 text-[10px]">{row.lastUpdated}</td>
              </tr>
            ))}
            {filteredAndSortedStats.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  Không tìm thấy CTV nào khớp với từ khóa tìm kiếm.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
        <div className="font-bold text-emerald-400 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Hướng dẫn đồng bộ Google Sheet (`tinhTongHopCTV`):</span>
        </div>
        <p className="leading-relaxed">
          Mã Apps Script đã được tích hợp hoàn chỉnh và sẽ tự động đồng bộ vào tab <code className="text-emerald-300">Tong_Hop_CTV</code> hằng ngày. Bảng trên web giúp quản trị viên theo dõi nhanh hiệu suất, tổng hợp doanh thu phát sinh và đối chiếu công nợ hoa hồng của từng CTV theo thời gian thực.
        </p>
      </div>
    </div>
  );
}
