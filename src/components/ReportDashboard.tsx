import React, { useState, useEffect } from 'react';
import { CheckCircle2, ChevronRight, Calculator, FileText, Calendar, Compass, Layers, AlertTriangle, ShieldCheck, Download, Building2, Clock, Maximize2, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { translations, getTranslation } from '../translations';
import BlurredPreviewImage from './BlurredPreviewImage';
import { getClientDocuments, ClientDocument } from '../lib/clientDocuments';
import { formatCurrency, formatCurrencyNoSymbol } from '../lib/currency';

interface ReportDashboardProps {
  aiReport: any;
  lang: string;
  theme: string;
  triggerRenderConceptImage: (type: any) => void;
  perspectiveSlot?: React.ReactNode;   // khu ảnh phối cảnh mới (ảnh tham chiếu + khung 3D)
  imageRendering: boolean;
  renderedConceptImage: string | null;
  setZoomImage: (url: string) => void;
  packageTier?: 'free' | 'standard' | 'design';
  onUpgradePackage?: (tier: 'free' | 'standard' | 'design') => void;
  link_anh_phoi_canh?: string;
  clientId?: string; // Add clientId
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ReportDashboard({ 
  aiReport, lang, theme, triggerRenderConceptImage, imageRendering, renderedConceptImage, setZoomImage, perspectiveSlot,
  packageTier = 'free', onUpgradePackage, link_anh_phoi_canh, clientId
}: ReportDashboardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [activationCode, setActivationCode] = useState("");
  const [activationError, setActivationError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);

  useEffect(() => {
    if (clientId) {
      getClientDocuments(clientId).then(setDocuments);
    }
  }, [clientId]);

  const handleApplyActivationCode = () => {
    const code = activationCode.trim().toUpperCase();
    if (["YOHU2026", "ADMINVIP", "379AI", "ADMIN888", "TC299"].includes(code)) {
      setActivationError(null);
      if (onUpgradePackage) {
        onUpgradePackage('standard');
      }
    } else {
      setActivationError(lang === 'vi' ? "Mã kích hoạt không đúng!" : "Invalid activation code!");
    }
  };

  const t = getTranslation(lang as any);
  const rt = t.report;

  const stepIcons = [Compass, Calculator, Calendar, Building2, ShieldCheck, FileText, ExternalLink];
  const stepTitles = t.reportSteps || (translations.vi as any).reportSteps || [
    "Phân tích Phong thủy",
    "Dự toán Vật tư",
    "Tiến độ Thi công",
    "Kết cấu Kỹ thuật",
    "Tiêu chuẩn Nghiệm thu",
    "Phương án Đầu tư",
    "Tài liệu Riêng"
  ];

  const steps = stepTitles.map((title: string, index: number) => ({
    title,
    icon: stepIcons[index] || FileText
  }));

  // Map BOQ data for chart
  const boqData = aiReport.boq || [];
  const chartData = boqData.reduce((acc: any[], item: any) => {
    const existing = acc.find(x => x.name === item.category);
    if (existing) {
      existing.value += item.totalPrice;
    } else {
      acc.push({ name: item.category, value: item.totalPrice });
    }
    return acc;
  }, []);

  return (
    <div className={`mt-4 border rounded-2xl overflow-hidden font-sans ${theme === 'dark' ? 'border-slate-800 bg-[#0b101e]' : 'border-slate-200 bg-white'}`}>
      
      {/* Steps Header with sleek smooth horizontal scroll and zero text overlap */}
      <div className={`relative border-b ${theme === 'dark' ? 'border-slate-800 bg-[#121829]' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex items-center overflow-x-auto no-scrollbar scroll-smooth px-2 py-1.5 gap-1.5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === idx;
            return (
              <button 
                key={idx}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`flex items-center gap-2 px-3.5 py-2.5 shrink-0 min-w-max rounded-xl text-[14px] lg:text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                  isActive 
                    ? (theme === 'dark' 
                        ? 'bg-[#0f172a] text-[#FFD700] shadow-sm border border-[#FFD700]/30 ring-1 ring-[#FFD700]/20' 
                        : 'bg-white text-rose-600 shadow-sm border border-rose-200 ring-1 ring-rose-100')
                    : (theme === 'dark' 
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2333]/70 border border-transparent' 
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 border border-transparent')
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? (theme === 'dark' ? 'text-[#FFD700]' : 'text-rose-600') : 'text-slate-400'}`} />
                <span className="shrink-0 tracking-tight">{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 md:p-6 overflow-y-auto max-h-[600px] text-left">
        
        {/* STEP 0: PHONG THỦY */}
        {activeStep === 0 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className={`font-black uppercase tracking-wider text-sm mb-4 ${theme === 'dark' ? 'text-[#FFD700]' : 'text-rose-600'}`}>
              {lang === 'vi' ? "Phân tích Năng lượng & Cân bằng Không gian (Phong Thủy)" : "Spatial Energy & Harmony Analysis (Feng Shui)"}
            </h3>
            
            {/* Professional Expert Summary Box */}
            <div className={`p-4 rounded-xl border-l-4 ${theme === 'dark' ? 'bg-[#121829] border-amber-500' : 'bg-rose-50 border-rose-500'}`}>
               <h4 className="font-bold text-[14.5px] lg:text-sm mb-1">💡 Nhận định từ Chuyên gia</h4>
               <p className="text-[13px] lg:text-xs leading-relaxed">
                  Phương án này đã được tối ưu hóa hướng khí và bố trí không gian theo bát trạch, giúp gia tăng vượng khí và cân bằng năng lượng cho gia chủ.
               </p>
            </div>

            {aiReport.fengShui ? (
              <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#121829]/60 border-slate-800 text-slate-300' : 'bg-rose-50/50 border-rose-200 text-slate-700'}`}>
                <div className="font-bold mb-2 text-[15px] lg:text-base">{rt.summaryFull} {aiReport.fengShui.summary}</div>
                <div className="text-[14.5px] lg:text-sm leading-relaxed whitespace-pre-wrap">{aiReport.fengShui.details}</div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">{rt.defaultFengshui}</div>
            )}

            {/* Objective 9: ẢNH 3D BỊ MỜ Ở GÓI FREE */}
            <BlurredPreviewImage 
              link_anh_phoi_canh={link_anh_phoi_canh} 
              packageTier={packageTier} 
              theme={theme} 
            />
          </div>
        )}

        {/* STEP 1: DỰ TOÁN VẬT TƯ & CÂN ĐỐI TÀI CHÍNH */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className={`font-black uppercase tracking-wider text-sm ${theme === 'dark' ? 'text-[#FFD700]' : 'text-rose-600'}`}>
                {lang === 'vi' ? "Dự toán Vật tư & Cân đối Tài chính" : "Material Estimation & Financial Balancing"}
              </h3>
              <div className="flex items-center gap-1 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded">
                <ShieldCheck className="w-3.5 h-3.5" /> {rt.transparencyCommit}
              </div>
            </div>

            {/* Financial Advice Box */}
            <div className={`p-4 rounded-xl border-l-4 ${theme === 'dark' ? 'bg-[#121829] border-emerald-500' : 'bg-emerald-50 border-emerald-500'}`}>
               <h4 className="font-bold text-[14.5px] lg:text-sm mb-1 text-emerald-700">💰 Lời khuyên tài chính từ Chuyên gia</h4>
               <p className="text-[13px] lg:text-xs leading-relaxed text-slate-600">
                  {aiReport.priceSource
                    ? <>Tổng dự toán <b>{formatCurrency(aiReport.totalBoqCost || 0, lang)}</b> ({aiReport.priceSource.optionName}, suất {formatCurrency(aiReport.priceSource.perM2 || 0, lang)}/m², {aiReport.priceSource.floorAreaConverted} m² sàn quy đổi, {aiReport.priceSource.region}). {aiReport.priceSource.note}</>
                    : 'Danh mục ưu tiên vật liệu bền vững tại địa phương để giảm chi phí vận chuyển mà vẫn đảm bảo tiêu chuẩn kỹ thuật.'}
                  {aiReport.budgetCheck && (
                    <span className={`block mt-1.5 font-bold ${aiReport.budgetCheck.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{aiReport.budgetCheck.ok ? '✅ ' : '⚠️ '}{aiReport.budgetCheck.text}</span>
                  )}
               </p>
            </div>

            {packageTier === 'free' ? (
              <div className="relative">
                {/* The blurred/locked BOQ container */}
                <div className="space-y-4 filter blur-[3px] select-none pointer-events-none opacity-40">
                  <div className={`h-48 rounded-xl border p-2 flex items-center justify-center ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="w-36 h-36 rounded-full border-8 border-slate-700 border-t-amber-500 animate-spin" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { name: "Thép xây dựng chịu lực", brand: "Hòa Phát", specs: "Thép phi 10-18 CB400", quantity: "4.500", unit: "kg", totalPrice: 81000000, category: "Sắt thép" },
                      { name: "Bê tông thương phẩm mác 250", brand: "B20 PCB40", specs: "Độ sụt 12±2", quantity: "45", unit: "m³", totalPrice: 65250000, category: "Bê tông" },
                      { name: "Gạch xây Tuynel tiêu chuẩn", brand: "Gạch loại 1 Hưng Yên", specs: "Kích thước 8x19", quantity: "24.000", unit: "viên", totalPrice: 32400000, category: "Xây thô" },
                      { name: "Nhân công xây thô & hoàn thiện", brand: "Tổ đội Yohu", specs: "Nhân công lành nghề", quantity: "180", unit: "m²", totalPrice: 279000000, category: "Nhân công" }
                    ].map((item: any, idx: number) => (
                      <div key={idx} className={`p-3 rounded-xl border flex flex-col gap-2 ${theme === 'dark' ? 'bg-[#121829] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-sm">{item.name}</div>
                            <div className="text-[10px] uppercase font-bold text-slate-500">{item.brand} • {item.category}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Padlock upgrade card */}
                <div className="absolute inset-0 flex items-center justify-center p-3 z-10">
                  <div className={`p-6 rounded-2xl border text-center max-w-md shadow-2xl backdrop-blur-md ${theme === 'dark' ? 'bg-slate-950/90 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-900'}`}>
                    <div className="w-12 h-12 bg-amber-500/25 border border-amber-500/40 text-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                      <Calculator className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-[#FFD700] uppercase mb-1.5 font-mono tracking-tight">
                      🔒 {t.boqLockedTitle || "Tính năng dự toán chuyên sâu bị khóa"}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {t.boqLockedDesc || "Bản bóc tách chi tiết tổng khối lượng vật tư (thép, xi măng, gạch, cát...) và đơn giá nhân công m² chỉ khả dụng cho khách hàng sử dụng Gói đầy đủ (Standard) hoặc Thiết kế (Design)."}
                    </p>

                    <div className="space-y-3">
                      <div className="flex gap-1.5 justify-center max-w-xs mx-auto">
                        <input 
                          type="text"
                          placeholder="Mã kích hoạt (Mẹo: YOHU2026)"
                          value={activationCode}
                          onChange={(e) => setActivationCode(e.target.value)}
                          className="p-2 border border-slate-800 rounded-lg text-xs bg-[#101524] text-slate-250 focus:outline-none w-2/3 text-center font-mono uppercase"
                        />
                        <button 
                          onClick={handleApplyActivationCode}
                          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg cursor-pointer flex-1 transition"
                        >
                          Xác nhận
                        </button>
                      </div>

                      {activationError && (
                        <div className="text-[10px] text-red-400 font-medium font-mono">{activationError}</div>
                      )}

                      <div className="relative flex py-1 items-center justify-center">
                        <span className="text-slate-500 text-[9px] font-mono font-bold uppercase">HOẶC DÀNH CHO BẠN TEST</span>
                      </div>

                      <button 
                        type="button"
                        onClick={() => {
                          if (onUpgradePackage) {
                            onUpgradePackage('standard');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 mx-auto cursor-pointer shadow-md shadow-blue-600/15 transition"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Mở khóa nhanh tức thì để Test (1-Click)</span>
                      </button>
                      
                      <div className="text-[9px] text-slate-500 leading-normal font-sans">
                        Bạn cũng có thể mở khóa bằng cách vào <b className="text-amber-400">Yohu Admin Panel 🔒</b> ở thanh tiêu đề chính, đăng nhập tài khoản quản trị, chọn khách hàng này và chuyển đổi gói dịch vụ tương ứng.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {chartData.length > 0 && (
                  <div className={`h-48 rounded-xl border p-2 flex items-center justify-center ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                          {chartData.map((_entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value, lang)} />
                        <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Tổng vật tư / nhân công + yêu cầu của gia chủ đã đưa vào dự toán */}
                {aiReport.priceSource && (
                  <div className={`p-3 rounded-xl border text-xs sm:text-sm space-y-2 ${theme === 'dark' ? 'bg-[#121829] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div><div className="text-[11px] uppercase font-bold text-slate-500">Tổng dự toán</div><div className="font-mono font-black text-rose-500">{formatCurrency(aiReport.totalBoqCost || 0, lang)}</div></div>
                      <div><div className="text-[11px] uppercase font-bold text-slate-500">Phần vật tư, thiết bị</div><div className="font-mono font-black text-emerald-500">{formatCurrency(aiReport.priceSource.totalMaterial || 0, lang)}</div></div>
                      <div><div className="text-[11px] uppercase font-bold text-slate-500">Phần nhân công (khoán)</div><div className="font-mono font-black text-amber-500">{formatCurrency(aiReport.priceSource.totalLabor || 0, lang)}</div></div>
                    </div>
                    {Array.isArray(aiReport.priceSource.yeuCau) && aiReport.priceSource.yeuCau.length > 0 && (
                      <div>
                        <div className="font-black mb-1">✅ Yêu cầu của gia chủ đã đưa vào dự toán</div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-[12px] lg:text-xs">
                            <thead><tr className="text-left text-slate-500"><th className="py-1 pr-2">Hạng mục</th><th className="py-1 pr-2">Gia chủ chọn</th><th className="py-1 pr-2">Áp vào</th><th className="py-1">Ghi chú</th></tr></thead>
                            <tbody>
                              {aiReport.priceSource.yeuCau.map((r: any, i: number) => (
                                <tr key={i} className={`border-t ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                                  <td className="py-1 pr-2 font-bold">{r.label}</td>
                                  <td className="py-1 pr-2">{r.value}</td>
                                  <td className={`py-1 pr-2 ${r.appliedTo.length ? '' : 'text-slate-500'}`}>{r.appliedTo.length ? r.appliedTo.join(' · ') : '—'}</td>
                                  <td className="py-1 text-slate-500">{r.note}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {boqData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {boqData.map((item: any, idx: number) => (
                      <div key={idx} className={`p-3 rounded-xl border flex flex-col gap-2 ${theme === 'dark' ? 'bg-[#121829] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className={`font-bold text-[15px] lg:text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{item.name}</div>
                            <div className="text-[12px] lg:text-[10px] uppercase font-bold text-slate-500">{item.brand ? `${item.brand} • ` : ''}{item.category}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-emerald-500 text-[14px] lg:text-xs">{item.quantity} {item.unit}</div>
                            <div className="text-[12px] lg:text-[10px] text-slate-400">@ {formatCurrency(item.unitPrice, lang)}</div>
                          </div>
                        </div>
                        <div className={`pl-2 border-l-2 text-[13.5px] lg:text-xs py-1 ${theme === 'dark' ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'}`}>
                          {item.specs}
                        </div>
                        <div className="flex justify-between items-end gap-2 mt-1">
                          {(item.material || item.labor) ? (
                            <div className="text-[12px] lg:text-[11px] font-mono leading-snug">
                              <div className="text-emerald-500">Vật tư: {formatCurrency(item.material || 0, lang)}</div>
                              <div className="text-amber-500">Nhân công: {formatCurrency(item.labor || 0, lang)}</div>
                            </div>
                          ) : <span />}
                          <div className="text-right font-mono font-bold text-[15px] lg:text-sm text-rose-500">Σ: {formatCurrency(item.totalPrice, lang)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-500 text-sm">{rt.interpolatingBoq}</div>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP 2: TIẾN ĐỘ THI CÔNG & THỜI TIẾT THỰC TẾ */}
        {activeStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className={`font-black uppercase tracking-wider text-sm mb-4 ${theme === 'dark' ? 'text-[#FFD700]' : 'text-rose-600'}`}>
              {lang === 'vi' ? "Tiến độ Thi công & Dự phòng Thời tiết" : "Timeline & Weather Contingency"}
            </h3>
            
            {/* Weather & Realism Note */}
            <div className={`p-4 rounded-xl border-l-4 ${theme === 'dark' ? 'bg-[#121829] border-blue-500' : 'bg-blue-50 border-blue-500'}`}>
               <h4 className="font-bold text-[14.5px] lg:text-sm mb-1 text-blue-700">🗓️ Góc nhìn thực tế từ Kỹ sư</h4>
               <p className="text-[13px] lg:text-xs leading-relaxed text-slate-600">
                  Thời gian trên được tính toán cho nhóm thợ {aiReport.timeline?.[0]?.workersPerDay || 6} người/ngày. Thời gian đã cộng thêm các ngày nghỉ dự phòng do thời tiết (mưa, nắng gắt) để bạn không bị bất ngoại lệ.
               </p>
            </div>
            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {aiReport.timeline && aiReport.timeline.map((phase: any, idx: number) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-[#0b101e] text-slate-300' : 'bg-white border-rose-100 text-rose-500'}`}>
                    <span className="font-bold text-[13.5px] lg:text-xs">{idx + 1}</span>
                  </div>
                  <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#121829] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-bold text-[15px] lg:text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{phase.phaseName}</h4>
                      <span className="text-[13.5px] lg:text-xs font-mono font-bold text-emerald-500 text-right">{phase.days} {rt.day}</span>
                    </div>
                    <div className="text-[12px] lg:text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">{rt.payment}: {phase.paymentPercentage}% • {rt.workerPerDay}: {phase.workersPerDay}</div>
                    <ul className={`text-[13.5px] lg:text-xs space-y-1 list-disc pl-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {phase.tasks?.map((task: string, i: number) => <li key={i}>{task}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: KỸ THUẬT KẾT CẤU VÀ BIỆN PHÁP THI CÔNG */}
        {activeStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className={`font-black uppercase tracking-wider text-sm ${theme === 'dark' ? 'text-[#FFD700]' : 'text-rose-600'}`}>
              {lang === 'vi' ? "🧱 KỸ THUẬT KẾT CẤU & BIỆN PHÁP THI CÔNG" : "🧱 STRUCTURAL ENGINEERING SPECIFICATIONS"}
            </h3>

            {packageTier === 'free' ? (
              <div className="relative">
                {/* Blurred mockup of structural cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 filter blur-[3px] select-none pointer-events-none opacity-40">
                  {[
                    { title: "Gia cố nền móng", content: "Sử dụng móng cọc ép bê tông cốt thép..." },
                    { title: "Hệ cột chịu lực", content: "Cột bê tông mác 250, thép phi 18..." },
                    { title: "Dầm sàn chịu lực", content: "Dầm 200x350 liên kết cốt thép sàn 2 lớp..." },
                    { title: "Kết cấu tường", content: "Xây tường 220 cách âm bằng cát sạch sàng lọc..." }
                  ].map((item, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#121829] border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="font-bold text-xs uppercase mb-1">{item.title}</div>
                      <div className="text-xs">{item.content}</div>
                    </div>
                  ))}
                </div>

                {/* Padlock upgrade card */}
                <div className="absolute inset-0 flex items-center justify-center p-3 z-10">
                  <div className={`p-6 rounded-2xl border text-center max-w-md shadow-2xl backdrop-blur-md ${theme === 'dark' ? 'bg-slate-950/90 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-900'}`}>
                    <div className="w-12 h-12 bg-indigo-500/25 border border-indigo-500/40 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-[#FFD700] uppercase mb-1.5 font-mono tracking-tight">
                      🔒 {lang === 'vi' ? "Bản kết cấu kỹ thuật bị khóa" : "Technical Structure Locked"}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {lang === 'vi' 
                        ? "Bản phân tích kỹ thuật kết cấu chịu lực móng, cột dầm sàn, tường bao, cầu thang và các biện pháp chống thấm chuyên sâu chỉ khả dụng cho khách hàng sử dụng Gói đầy đủ (Standard) hoặc Thiết kế (Design)."
                        : "Detailed structural calculations of foundation, columns, beam slabs, masonry, and professional waterproofing specifications are only available on Standard or Design packages."}
                    </p>

                    <div className="space-y-3">
                      <div className="flex gap-1.5 justify-center max-w-xs mx-auto">
                        <input 
                          type="text"
                          placeholder="Mã kích hoạt (Mẹo: YOHU2026)"
                          value={activationCode}
                          onChange={(e) => setActivationCode(e.target.value)}
                          className="p-2 border border-slate-800 rounded-lg text-xs bg-[#101524] text-slate-250 focus:outline-none w-2/3 text-center font-mono uppercase"
                        />
                        <button 
                          onClick={handleApplyActivationCode}
                          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg cursor-pointer flex-1 transition"
                        >
                          Xác nhận
                        </button>
                      </div>

                      {activationError && (
                        <div className="text-[10px] text-red-400 font-medium font-mono">{activationError}</div>
                      )}

                      <div className="relative flex py-1 items-center justify-center">
                        <span className="text-slate-500 text-[9px] font-mono font-bold uppercase">HOẶC DÀNH CHO BẠN TEST</span>
                      </div>

                      <button 
                        type="button"
                        onClick={() => {
                          if (onUpgradePackage) {
                            onUpgradePackage('standard');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 mx-auto cursor-pointer shadow-md shadow-blue-600/15 transition"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Mở khóa nhanh tức thì để Test (1-Click)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  const structuralLabelsMap: Record<string, Record<string, string>> = {
                    vi: {
                      foundation: "🧱 KẾT CẤU MÓNG & GIA CỐ NỀN ĐẤT",
                      columns: "📐 HỆ CỘT & KHUNG CHỊU LỰC CHÍNH",
                      frame: "🧱 KẾT CẤU TƯỜNG BAO & TƯỜNG NGĂN",
                      beam: "🏢 HỆ DẦM, BẢN SÀN & CẦU THANG BÊ TÔNG",
                      roof: "🏠 KẾT CẤU MÁI & HỆ THỐNG THOÁT NƯỚC",
                      waterproofing: "💧 BIỆN PHÁP CHỐNG THẤM CHUYÊN SÂU"
                    },
                    en: {
                      foundation: "🧱 FOUNDATION & GROUND WORK",
                      columns: "📐 COLUMNS & STRUCTURAL FRAME",
                      frame: "🧱 MASONRY & BOUNDARY WALL SPECS",
                      beam: "🏢 BEAM SLABS & CONCRETE STAIRS",
                      roof: "🏠 ROOF STRUCTURE & DRAINAGE",
                      waterproofing: "💧 WATERPROOFING SPECIFICATIONS"
                    },
                    lo: {
                      foundation: "🧱 ໂຄງສ້າງຮາກຖານ & ການປັບປຸງດິນ",
                      columns: "📐 ລະບົບເສົາ & ໂຄງສ້າງຫຼັກ",
                      frame: "🧱 ໂຄງສ້າງຝາອ້ອມ & ຝາກັ້ນຫ້ອງ",
                      beam: "🏢 ລະບົບຂານ, ພື້ນ & ຂັ້ນໄດເບຕົງ",
                      roof: "🏠 ໂຄງສ້າງຫຼັງຄາ & ລະບົບລະບາຍນ້ຳ",
                      waterproofing: "💧 ມາດຕະການກັນຊຶມລະອຽດ"
                    },
                    zh: {
                      foundation: "🧱 地基基础与地基加固构造",
                      columns: "📐 主立柱与主体承重受力框架",
                      frame: "🧱 外围护墙与室内隔墙工程",
                      beam: "🏢 梁板结构与现浇混凝土楼梯",
                      roof: "🏠 屋面构造与屋顶排水系统",
                      waterproofing: "💧 建筑全方位深度防水工程"
                    }
                  };
                  const currentLabels = structuralLabelsMap[lang] || structuralLabelsMap.vi;
                  const data = aiReport.structuralAnalysis || {
                    foundation: "Móng băng giao thoa bê tông mác 250 giằng 200x350 thép đai phi 8 phi 16 chịu tải tốt.",
                    columns: "Cột 200x200 bê tông cốt thép mác 250 khoảng chịu lực tối ưu.",
                    frame: "Tường bao xây gạch ống dày 200 ngăn vách 100 bằng cát sạch xây mác 75.",
                    beam: "Sàn bê tông dày 100mm đan thép phi 10 a150 hai lớp chịu uốn nứt cầu thang.",
                    roof: "Hệ xà gồ thép mạ kẽm độ dốc ngói Fuji thoát nhiệt tối đa.",
                    waterproofing: "Sàn toilet và ban công quét màng chống thấm Sika Top Seal 107 dán lưới thủy tinh gia cường."
                  };
                  return Object.entries(data).map(([key, val]) => (
                    <div key={key} className={`p-4 rounded-xl border flex flex-col gap-2 ${theme === 'dark' ? 'bg-[#121829] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <h4 className={`font-bold text-[14px] lg:text-sm tracking-wide ${theme === 'dark' ? 'text-amber-400' : 'text-indigo-900'}`}>
                        {currentLabels[key] || key.toUpperCase()}
                      </h4>
                      <p className={`text-[14px] lg:text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {String(val)}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: NGHIỆM THU */}
        {activeStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className={`font-black uppercase tracking-wider text-sm mb-4 ${theme === 'dark' ? 'text-[#FFD700]' : 'text-rose-600'}`}>
              {rt.inspectionTitle}
            </h3>
            {Array.isArray(aiReport.checklists) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiReport.checklists.map((list: any, idx: number) => (
                  <div key={idx} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#121829] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <h4 className={`font-bold text-[15px] lg:text-sm mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-[#FFD700]' : 'text-slate-800'}`}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {list.phaseName}
                    </h4>
                    <div className="space-y-2">
                      {list.checks?.map((check: string, i: number) => (
                        <label key={i} className={`flex items-start gap-2 text-[14.5px] lg:text-xs p-2 rounded-lg cursor-pointer transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-600'}`}>
                          <input type="checkbox" className="w-3.5 h-3.5 mt-0.5 rounded border-slate-400 text-emerald-500 focus:ring-emerald-500 bg-transparent" />
                          <span>{check}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 text-slate-500">{rt.noInspectionData}</div>
            )}
          </div>
        )}

        {/* STEP 5: GÓI BÁO GIÁ */}
        {activeStep === 5 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className={`font-black uppercase tracking-wider text-sm ${theme === 'dark' ? 'text-[#FFD700]' : 'text-rose-600'}`}>
              {rt.pricingTitle}
            </h3>
            
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${theme === 'dark' ? 'bg-amber-950/20 border-amber-900/40' : 'bg-amber-50 border-amber-200'}`}>
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className={`text-sm font-bold ${theme === 'dark' ? 'text-amber-500' : 'text-amber-700'}`}>{rt.expertRecommendation}</div>
                <div className={`text-xs mt-1 leading-relaxed ${theme === 'dark' ? 'text-amber-200/70' : 'text-amber-900/80'}`}>
                  {aiReport.expertNote}
                </div>
              </div>
            </div>

            {aiReport.priceSource && (
              <div className={`text-xs leading-relaxed p-3 rounded-xl border ${theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                3 gói dưới đây cùng phương án <b>{aiReport.priceSource.optionName}</b>, khác nhau ở vật tư hoàn thiện. Cùng một bộ tính với PDF và CRM (bảng đơn giá {aiReport.priceSource.version}).
              </div>
            )}
            {aiReport.threeOptions && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(aiReport.threeOptions || {}).map(([key, opt]: [string, any]) => {
                  const isRecommended = key === 'standard';
                  return (
                    <div key={key} className={`relative p-4 rounded-2xl border flex flex-col gap-2 transition-transform hover:-translate-y-1 ${
                      isRecommended 
                        ? (theme === 'dark' ? 'bg-gradient-to-br from-indigo-950/40 to-blue-900/20 border-indigo-500/50' : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-300 shadow-md')
                        : (theme === 'dark' ? 'bg-[#121829] border-slate-800' : 'bg-white border-slate-200')
                    }`}>
                      {isRecommended && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">
                          {rt.recommended}
                        </div>
                      )}
                      <div className={`text-[13.5px] lg:text-xs font-bold uppercase tracking-wider ${
                        isRecommended ? 'text-indigo-500' : (theme === 'dark' ? 'text-slate-400' : 'text-slate-500')
                      }`}>{opt.title}</div>
                      <div className={`text-[22px] lg:text-xl font-mono font-black ${
                        isRecommended ? (theme === 'dark' ? 'text-white' : 'text-indigo-900') : (theme === 'dark' ? 'text-[#FFD700]' : 'text-slate-800')
                      }`}>{opt.estimatedPrice}</div>
                      <div className={`text-[13px] lg:text-[11px] leading-relaxed mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{opt.desc}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {perspectiveSlot ? perspectiveSlot : (
            <div className={`mt-6 p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-[#FFD700]' : 'text-slate-800'}`}>
                {rt.aiVisualTitle}
              </h4>
              
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => triggerRenderConceptImage('2d')}
                  disabled={imageRendering}
                  className={`flex-1 p-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${theme === 'dark' ? 'bg-[#121829] hover:bg-slate-800 text-slate-200 border border-slate-800' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm'}`}
                >
                  <Layers className={`w-4 h-4 ${theme === 'dark' ? 'text-[#FFD700]' : 'text-rose-500'}`} /> {rt.render2d}
                </button>
                <button 
                  onClick={() => triggerRenderConceptImage('3d')}
                  disabled={imageRendering}
                  className={`flex-1 p-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${theme === 'dark' ? 'bg-[#121829] hover:bg-slate-800 text-slate-200 border border-slate-800' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm'}`}
                >
                  <Building2 className={`w-4 h-4 ${theme === 'dark' ? 'text-[#FFD700]' : 'text-rose-500'}`} /> {rt.render3d}
                </button>
              </div>

              {imageRendering && (
                <div className={`p-6 text-center text-xs animate-pulse rounded-xl border border-dashed ${theme === 'dark' ? 'text-slate-400 border-slate-800 bg-[#121829]/60' : 'text-slate-500 border-slate-300 bg-slate-100/50'}`}>
                  <Clock className="w-5 h-5 mx-auto mb-2 text-amber-500 animate-spin" />
                  {rt.rendering}
                </div>
              )}

              {renderedConceptImage && !imageRendering && (
                <div className="mt-4 animate-fade-in">
                  <div className={`aspect-[16/9] w-full rounded-xl overflow-hidden border relative group ${theme === 'dark' ? 'border-slate-800' : 'border-slate-300'}`}>
                    <img 
                      src={renderedConceptImage} 
                      alt="Render" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button 
                        onClick={() => setZoomImage(renderedConceptImage)}
                        className="p-2 bg-slate-900 text-slate-100 rounded-full hover:bg-slate-800 cursor-pointer shadow-lg border border-slate-700"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}

            <div className="flex flex-col items-end gap-2 pt-4">
              {/* Nút trả phí — chỉ dành cho gói có phí */}
              {aiReport.trang_thai_pdf === "san_sang_download" ? (
                <button
                  onClick={() => window.print()}
                  className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-600/20 text-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" /> {rt.exportPdf} ({aiReport.goi_mua || (lang === 'vi' ? "Gói Có Phí" : "Paid Package")})
                </button>
              ) : (
                <div className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-right">
                  {lang === 'vi' ? "🔒 Tải xuống bản vẽ & báo cáo PDF chi tiết chỉ dành cho gói có phí (Tiêu chuẩn / Thiết kế). Vui lòng liên hệ Admin kích hoạt." :
                   lang === 'lo' ? "🔒 ການດາວໂຫລດ PDF ແລະ ແບບແຜນລະອຽດແມ່ນສະຫງວນໄວ້ສຳລັບຊຸດທີ່ມີຄ່າໃຊ້ຈ່າຍເທົ່ານັ້ນ." :
                   lang === 'zh' ? "🔒 详细PDF报告与图纸下载仅限付费套餐（标准/设计）。请联系管理员激活。" :
                   "🔒 Detailed PDF report & drawing download is exclusive to paid packages (Standard / Design). Contact Admin to activate."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: TÀI LIỆU DỰ ÁN */}
        {activeStep === 6 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className={`font-black uppercase tracking-wider text-sm mb-4 ${theme === 'dark' ? 'text-[#FFD700]' : 'text-rose-600'}`}>
              {stepTitles[6] || (lang === 'vi' ? "Tài liệu dự án" : "Project Documents")}
            </h3>
            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 p-3 rounded-lg border ${theme === 'dark' ? 'bg-[#121829] border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                    <ExternalLink className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm">{doc.title}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {lang === 'vi' ? "Chưa có tài liệu riêng cho dự án của bạn." :
                 lang === 'lo' ? "ຍັງບໍ່ມີເອກະສານສະເພາະສຳລັບໂຄງການຂອງທ່ານ." :
                 lang === 'zh' ? "暂无专属项目文件。" :
                 "No custom documents available yet for your project."}
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
