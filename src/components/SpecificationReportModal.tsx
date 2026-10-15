import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Download, RefreshCw, CheckCircle2, AlertCircle, 
  Layers, Globe, CheckSquare, Square, ChevronRight, X, Sparkles, Printer, Lock,
  Edit3, Save, Copy, Eye, Check, BookOpen, Calculator
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { STRUCTURAL_OPTIONS, StructuralOption } from '../data/structuralOptions';
import { UserInfo, ConstructionInfo, FengShuiAnalysis } from '../types';
import { 
  REPORT_SECTIONS_META, ReportSection, 
  generateSingleSection, translateSectionContent,
  parseFloorArea
} from '../lib/specificationGenerator';
import { 
  getBoqTemplateForOption,
  calculateFullBOQ,
  calculateCashflowMilestones,
  MATERIAL_LEAD_TIME_SCHEDULE,
  SITE_LOGISTICS_GUIDELINE,
  HIDDEN_WORK_INSPECTION_PROTOCOL,
  SYSTEM_BOQ_TEMPLATE, 
  TECHNICAL_STANDARDS_TABLE, 
  MATERIAL_BRANDING_DISCLAIMER,
  REPORT_TOC_TABLE
} from '../data/boqStandards';
import { exportSpecificationToPdf } from '../lib/specificationPdfExporter';
import { StructuralOptionKey } from '../lib/boqEngine';
import { getUnifiedEstimate } from '../lib/unifiedPricing';
import { generateArchitecturalFloorPlanSvg } from '../lib/architecturalFloorPlan';
import { computeArchitecturalLayoutModel } from '../lib/architecturalLayoutModel';
import { formatSectionContentToHtml, cleanAndNormalizeVietnameseText, cleanMarkdownForPlainText } from '../lib/documentFormatter';

interface SpecificationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOptionId: 'PA1' | 'PA2' | 'PA3';
  onSelectOptionId: (id: 'PA1' | 'PA2' | 'PA3') => void;
  userInfo: UserInfo;
  constructionInfo: ConstructionInfo;
  fengShuiAnalysis?: FengShuiAnalysis;
  isPaidTier: boolean;
  onUnlockPaidTier?: () => void;
  onExportAdminPdf?: () => void;
  lang?: 'vi' | 'en' | 'lo' | 'zh';
  clientId?: string;
  onConsumeCredit?: () => boolean;
}

export const SpecificationReportModal: React.FC<SpecificationReportModalProps> = ({
  isOpen,
  onClose,
  selectedOptionId,
  onSelectOptionId,
  userInfo,
  constructionInfo,
  fengShuiAnalysis,
  isPaidTier,
  onUnlockPaidTier,
  onExportAdminPdf,
  lang = 'vi',
  clientId,
  onConsumeCredit
}) => {
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(-1);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isLoadedFromCache, setIsLoadedFromCache] = useState<boolean>(false);
  
  // View Tab: 'sections' (Từng mục & chỉnh sửa) vs 'master' (Văn bản tổng hợp hoàn chỉnh)
  const [viewMode, setViewMode] = useState<'sections' | 'master' | 'boq_table'>('master');

  // Inline editing state
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');

  // Language for export
  const [exportLang, setExportLang] = useState<string>(lang);
  const [customLangInput, setCustomLangInput] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Copied alert state
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const cancelGenerationRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const currentOption = STRUCTURAL_OPTIONS.find(opt => opt.id === selectedOptionId) || STRUCTURAL_OPTIONS[0];

  const dim = constructionInfo?.dimensions || "100m²";
  const floors = constructionInfo?.floors || 2;
  const { groundArea, totalArea, widthM, lengthM } = parseFloorArea(dim);
  const sGround = groundArea;
  const sTotal = totalArea * (floors / 2);

  // Generate architectural floor plan SVG for direct visual preview & embedding
  const floorPlanSvg = generateArchitecturalFloorPlanSvg({
    widthM: widthM || 8,
    lengthM: lengthM || 15,
    floor: 1,
    totalFloors: floors,
    constructionType: constructionInfo?.constructionType || "Nhà phố",
    customerName: userInfo?.name || "Gia Chủ",
    showFurniture: true,
    desiredDirection: userInfo?.desiredDirection || "Nam",
    fengShuiAnalysis,
    groundFloorArea: sGround,
    totalConstructionArea: sTotal,
    lang,
    rooms: constructionInfo?.rooms,
    frontSetbackM: (constructionInfo as any)?.frontSetbackM,
    backSetbackM: (constructionInfo as any)?.backSetbackM
  });

  // Cache helper functions for browser-persistent storage
  const effectiveClientId = clientId || (typeof window !== 'undefined' ? localStorage.getItem("yohu_client_id") : null) || "guest";

  const getCacheKey = (optId: string, l: string) => {
    return `yohu_spec_cache_${effectiveClientId}_${optId}_${l}`;
  };

  const saveSectionsToCache = (optId: string, l: string, secs: ReportSection[]) => {
    try {
      if (!secs || secs.length === 0) return;
      const key = getCacheKey(optId, l);
      localStorage.setItem(key, JSON.stringify({
        sections: secs,
        timestamp: Date.now(),
        optionId: optId,
        lang: l,
        dimensions: constructionInfo?.dimensions,
        floors: constructionInfo?.floors,
        clientName: userInfo?.name
      }));
    } catch (e) {
      console.warn("Could not save specification to localStorage", e);
    }
  };

  const loadSectionsFromCache = (optId: string, l: string): ReportSection[] | null => {
    try {
      const key = getCacheKey(optId, l);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.sections) && parsed.sections.length > 0) {
        // Auto sanitize all cached text in case older entries had decomposed accents
        return parsed.sections.map((s: ReportSection) => ({
          ...s,
          title: cleanAndNormalizeVietnameseText(s.title || ''),
          content: cleanAndNormalizeVietnameseText(s.content || '')
        }));
      }
    } catch (e) {
      console.warn("Could not load specification from localStorage", e);
    }
    return null;
  };

  // Initialize or restore sections container: check cache first to avoid re-generating
  useEffect(() => {
    if (!isOpen) return;

    setExportLang(lang);
    
    // 1. Try loading cached sections from browser storage for this client, option & lang
    const cached = loadSectionsFromCache(selectedOptionId, lang);
    if (cached && cached.length > 0) {
      setSections(cached);
      setIsGenerating(false);
      setIsPaused(false);
      setGenerationProgress(100);
      setIsLoadedFromCache(true);
      setStatusMessage(`⚡ Đã tải toàn bộ dữ liệu thuyết minh đã lưu trên trình duyệt (${cached.length}/10 chương mục hoàn chỉnh).`);
      return;
    }

    // 2. If no cache exists, run initial generation for this option
    setIsLoadedFromCache(false);
    handleStartGeneration();
  }, [isOpen, selectedOptionId, lang]);

  if (!isOpen) return null;

  // Toggle individual section selection
  const handleToggleSection = (sectionId: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, isSelected: !s.isSelected } : s));
  };

  // Select all / Deselect all
  const handleSelectAll = (selectAll: boolean) => {
    setSections(prev => prev.map(s => ({ ...s, isSelected: selectAll })));
  };

  // Start editing a section
  const handleStartEdit = (sec: ReportSection) => {
    setEditingSectionId(sec.id);
    setEditingContent(sec.content);
  };

  // Save edited section
  const handleSaveEdit = (sectionId: string) => {
    const cleaned = cleanAndNormalizeVietnameseText(editingContent);
    const updated = sections.map(s => s.id === sectionId ? { ...s, content: cleaned } : s);
    setSections(updated);
    saveSectionsToCache(selectedOptionId, exportLang, updated);
    setEditingSectionId(null);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingSectionId(null);
    setEditingContent('');
  };

  const handlePauseGeneration = () => {
    setIsPaused(true);
    setStatusMessage('⏸️ Đã tạm dừng quá trình biên soạn thuyết minh.');
  };

  const handleResumeGeneration = () => {
    setIsPaused(false);
    setStatusMessage('▶️ Đang tiếp tục biên soạn thuyết minh...');
  };

  const handleCancelGeneration = () => {
    cancelGenerationRef.current = true;
    setIsPaused(false);
    setIsGenerating(false);
    setActiveSectionIdx(-1);
    setStatusMessage('❌ Đã hủy quá trình biên soạn thuyết minh.');
  };

  // Handler for chunked section-by-section AI generation
  const handleStartGeneration = async () => {
    if (onConsumeCredit && !onConsumeCredit()) {
      return;
    }

    setIsGenerating(true);
    setIsPaused(false);
    cancelGenerationRef.current = false;
    isPausedRef.current = false;
    setActiveSectionIdx(0);
    setGenerationProgress(0);
    setIsLoadedFromCache(false);

    const generatedSections: ReportSection[] = [];
    let summaryAccumulator = "";

    for (let i = 0; i < REPORT_SECTIONS_META.length; i++) {
      if (cancelGenerationRef.current) {
        setIsGenerating(false);
        setIsPaused(false);
        setActiveSectionIdx(-1);
        setStatusMessage('❌ Đã hủy quá trình biên soạn thuyết minh.');
        return;
      }

      while (isPausedRef.current && !cancelGenerationRef.current) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (cancelGenerationRef.current) {
        setIsGenerating(false);
        setIsPaused(false);
        setActiveSectionIdx(-1);
        setStatusMessage('❌ Đã hủy quá trình biên soạn thuyết minh.');
        return;
      }

      const meta = REPORT_SECTIONS_META[i];
      setActiveSectionIdx(i);
      setStatusMessage(`Đang biên soạn ${meta.title}... (${i + 1}/${REPORT_SECTIONS_META.length})`);
      setGenerationProgress(Math.round(((i) / REPORT_SECTIONS_META.length) * 100));

      const content = await generateSingleSection(
        meta,
        currentOption,
        userInfo,
        constructionInfo,
        fengShuiAnalysis,
        summaryAccumulator,
        exportLang === 'custom' ? (customLangInput || 'vi') : exportLang
      );

      const sectionObj: ReportSection = {
        id: meta.id,
        title: meta.title,
        content: content,
        isSelected: true,
        isCompleted: true
      };

      generatedSections.push(sectionObj);
      const updatedList = [...generatedSections];
      setSections(updatedList);
      saveSectionsToCache(selectedOptionId, exportLang, updatedList);

      // Chỉ ghi lại TÊN các mục đã soạn để giữ mạch văn/bố cục.
      // Số liệu kỹ thuật không còn phụ thuộc vào đoạn này — nó đã được gửi đầy đủ,
      // cố định qua option.structuralFactsSummary ở mọi lượt gọi (xem PHẦN 2–3).
      summaryAccumulator += summaryAccumulator ? `, ${meta.id}` : `Đã soạn xong: ${meta.id}`;
    }

    if (!cancelGenerationRef.current) {
      setGenerationProgress(100);
      setIsGenerating(false);
      setIsPaused(false);
      setActiveSectionIdx(-1);
      setStatusMessage('✅ Hoàn tất biên soạn 10 chương mục Thuyết minh kỹ thuật & Bóc tách BOQ chuẩn TCVN! Dữ liệu đã lưu tự động.');
      saveSectionsToCache(selectedOptionId, exportLang, generatedSections);
    }
  };

  // Handler for Translating generated sections chunk by chunk
  const handleTranslateAll = async (targetLanguage: string) => {
    if (sections.length === 0) return;
    setIsTranslating(true);
    setStatusMessage(`🌐 Đang dịch thuyết minh sang ngôn ngữ [${targetLanguage}] theo từng mục...`);

    const translatedList: ReportSection[] = [];
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      setStatusMessage(`Đang dịch ${sec.title}... (${i + 1}/${sections.length})`);
      const translated = await translateSectionContent(sec.content, targetLanguage, sec.title);
      translatedList.push({
        ...sec,
        content: translated
      });
      setSections([...translatedList]);
      saveSectionsToCache(selectedOptionId, targetLanguage, [...translatedList]);
    }

    setIsTranslating(false);
    setStatusMessage(`✅ Đã hoàn tất dịch đa ngôn ngữ sang [${targetLanguage}]!`);
    saveSectionsToCache(selectedOptionId, targetLanguage, translatedList);
  };

  // Get selected sections
  const selectedSections = sections.filter(s => s.isSelected);

  // 1. DIRECT DOM-CAPTURE PDF EXPORT (BÊ NGUYÊN GIAO DIỆN 10 MỤC VÀO FILE PDF)
  const handleExportDirectPdf = async () => {
    if (!printRef.current) {
      alert("Không tìm thấy nội dung văn bản. Vui lòng thử lại!");
      return;
    }
    setIsDownloadingPdf(true);
    setDownloadProgress('Đang chụp toàn bộ 10 chương mục từ giao diện vào file PDF...');

    try {
      const el = printRef.current;
      
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const allEls = clonedDoc.querySelectorAll('*');
          allEls.forEach((item: any) => {
            if (item.style) {
              if (item.style.color && item.style.color.includes('oklch')) item.style.color = '#111827';
              if (item.style.backgroundColor && item.style.backgroundColor.includes('oklch')) item.style.backgroundColor = '#ffffff';
              if (item.style.borderColor && item.style.borderColor.includes('oklch')) item.style.borderColor = '#cbd5e1';
            }
          });
        }
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210; // A4 width mm
      const pageHeight = 297; // A4 height mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Page 1
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Subsequent pages
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const clientNameClean = (userInfo?.name || 'Gia_Chu').replace(/\s+/g, '_');
      pdf.save(`Thuyet_Minh_10_Muc_${clientNameClean}_${selectedOptionId}.pdf`);
      setStatusMessage('✅ Đã tải thành công file PDF 10 chương mục đầy đủ về thiết bị!');
    } catch (err) {
      console.error('Lỗi chụp PDF giao diện:', err);
      // Fallback: trigger structured export
      try {
        await exportSpecificationToPdf({
          userInfo,
          constructionInfo,
          currentOption,
          sections,
          fengShuiAnalysis,
          lang,
          onProgress: (msg) => setDownloadProgress(msg)
        });
      } catch (fallbackErr) {
        alert('Không thể tạo PDF tự động. Bạn vui lòng bấm nút "Tải File Word (.doc)" ngay bên cạnh để lưu 10 mục về máy tức thì!');
      }
    } finally {
      setIsDownloadingPdf(false);
      setDownloadProgress('');
    }
  };

  // 2. EXPORT DIRECT WORD FILE (.DOC) (BÊ NGUYÊN 10 MỤC MỞ BẰNG MS WORD)
  const handleExportWord = () => {
    const clientNameClean = (userInfo?.name || 'Gia_Chu').replace(/\s+/g, '_');
    const clientName = userInfo?.name || 'Gia Chủ';
    const dateStr = new Date().toLocaleDateString('vi-VN');

    const layout = computeArchitecturalLayoutModel({
      widthM: widthM || 5,
      lengthM: lengthM || 20,
      floors,
      groundFloorArea: sGround,
      totalConstructionArea: sTotal
    });
    const masterEstimate = getUnifiedEstimate({ constructionInfo, userInfo, optionKey: (selectedOptionId as StructuralOptionKey) || 'PA1' });
    const boqResult = masterEstimate;
    const cashflowMilestones = calculateCashflowMilestones(masterEstimate.tong_tron_goi, selectedOptionId);

    const formattedSectionsHtml = selectedSections.map((sec, idx) => `
      <div style="margin-top: 16pt; margin-bottom: 14pt; page-break-inside: avoid;">
        <h2 style="font-family: Arial, sans-serif; font-size: 13pt; color: #7f1d1d; text-transform: uppercase; border-bottom: 1.5pt solid #b91c1c; padding-bottom: 3pt; margin-top: 14pt; margin-bottom: 8pt;">
          ${sec.title}
        </h2>
        <div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #0f172a;">
          ${formatSectionContentToHtml(sec.content, true)}
        </div>
      </div>
    `).join('\n');

    const tocRowsHtml = REPORT_TOC_TABLE.map((row) => `
      <tr>
        <td style="text-align: center; font-weight: bold; width: 40pt;">${row.romanNumber}</td>
        <td style="font-weight: bold; width: 140pt;">${row.title}</td>
        <td>${row.keyFocus}</td>
        <td style="font-family: Consolas, monospace; font-size: 9pt; width: 85pt;">${row.standardsApplied}</td>
        <td style="text-align: center; width: 50pt;">${row.pageReference}</td>
      </tr>
    `).join('\n');

    const boqRowsHtml = boqResult.lines.map((line, idx) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
        <td><b>${line.item.name}</b><br/><span style="font-size: 8.5pt; color: #475569;">${line.spec || ''}</span></td>
        <td style="text-align: center;">${line.item.unit}</td>
        <td style="text-align: right; font-weight: bold;">${line.formattedQuantity}</td>
        <td style="text-align: right;">${line.unitPrice.toLocaleString('vi-VN')} đ</td>
        <td style="text-align: right;">${Math.round(line.materialAmount || 0).toLocaleString('vi-VN')} đ</td>
        <td style="text-align: right;">${Math.round(line.laborAmount || 0).toLocaleString('vi-VN')} đ</td>
        <td style="text-align: right; font-weight: bold; color: #7f1d1d;">${line.formattedTotalAmount}</td>
      </tr>
    `).join('\n');

    const cashflowRowsHtml = cashflowMilestones.map((m) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">${m.stage}</td>
        <td><b>${m.phaseName}</b> <span style="color: #b45309;">(${m.timeframe})</span></td>
        <td style="text-align: center; font-weight: bold;">${m.percentage}%</td>
        <td style="text-align: right; font-weight: bold; color: #15803d;">${m.formattedAmount}</td>
        <td style="font-size: 9.5pt;">${m.triggerCondition}</td>
      </tr>
    `).join('\n');

    const standardsRowsHtml = TECHNICAL_STANDARDS_TABLE.map((t) => `
      <tr>
        <td><b>${t.item}</b></td>
        <td style="font-family: Consolas, monospace; font-weight: bold; color: #7f1d1d;">${t.standardCode}</td>
        <td>${t.notes}</td>
      </tr>
    `).join('\n');

    const wordDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Thuyết Minh Kiến Trúc – Kết Cấu – Phong Thủy 10 Chương Mục</title>
        <style>
          @page { size: A4; margin: 20mm 15mm 20mm 20mm; mso-page-orientation: portrait; }
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #1e293b; background: #ffffff; }
          h1 { font-family: Arial, sans-serif; font-size: 16pt; color: #7f1d1d; text-align: center; text-transform: uppercase; font-weight: bold; margin-bottom: 4pt; }
          h2 { font-family: Arial, sans-serif; font-size: 13pt; color: #7f1d1d; text-transform: uppercase; border-bottom: 1.5pt solid #b91c1c; padding-bottom: 3pt; margin-top: 14pt; margin-bottom: 8pt; }
          h3 { font-family: Arial, sans-serif; font-size: 11.5pt; color: #7f1d1d; text-transform: uppercase; margin-top: 12pt; margin-bottom: 6pt; }
          h4 { font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; color: #7f1d1d; margin-top: 10pt; margin-bottom: 4pt; }
          p { margin-bottom: 8pt; text-align: justify; line-height: 1.6; }
          ul, ol { margin: 4pt 0 8pt 20pt; padding-left: 8pt; }
          li { margin-bottom: 4pt; line-height: 1.55; text-align: justify; }
          table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-family: Arial, sans-serif; font-size: 10pt; }
          th, td { border: 1pt solid #475569; padding: 6pt 8pt; }
          th { background-color: #7f1d1d; color: #ffffff; font-weight: bold; text-align: left; }
          .banner-box { border: 1.5pt solid #b91c1c; background: #fff5f5; padding: 12pt; margin-bottom: 16pt; text-align: center; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 14pt; }
          .info-table td { border: none; padding: 3pt 6pt; font-size: 11pt; font-family: Arial, sans-serif; }
          .commitment-box { margin-top: 10pt; padding: 8pt 12pt; background: #fffbeb; border: 1pt solid #d97706; border-left: 4pt solid #b45309; font-family: Arial, sans-serif; font-size: 10pt; color: #78350f; line-height: 1.5; }
          .regional-box { background: #f0fdf4; border: 1pt solid #86efac; border-left: 4pt solid #16a34a; padding: 8pt 12pt; margin-top: 10pt; margin-bottom: 10pt; font-family: Arial, sans-serif; font-size: 9.5pt; color: #166534; }
        </style>
      </head>
      <body>
        <!-- COVER / HEADER -->
        <div class="banner-box">
          <div style="font-size: 11pt; font-weight: bold; color: #991b1b; letter-spacing: 1.5pt; font-family: Arial, sans-serif;">YOHU BUILD AI · HỆ THỐNG KỸ THUẬT XÂY DỰNG &amp; KIẾN TRÚC</div>
          <h1>THUYẾT MINH THIẾT KẾ KIẾN TRÚC – KẾT CẤU &amp; PHONG THỦY</h1>
          <div style="font-size: 12pt; font-weight: bold; color: #b45309; font-family: Arial, sans-serif;">PHƯƠNG ÁN: ${currentOption.name.toUpperCase()} (${currentOption.codeName})</div>
          <div style="font-size: 10pt; color: #64748b; margin-top: 4pt;">Tiêu chuẩn thiết kế: TCVN 5574:2018 · TCVN 2737:2020 · QCVN 06:2022/BXD</div>
        </div>

        <!-- PROJECT INFO SUMMARY TABLE -->
        <table class="info-table">
          <tr>
            <td width="50%"><b>Chủ đầu tư:</b> ${clientName} (${userInfo?.birthDate || "Chưa rõ năm sinh"})</td>
            <td width="50%"><b>Quy mô xây dựng:</b> ${floors} tầng · Mặt sàn: ~${sGround} m²</td>
          </tr>
          <tr>
            <td width="50%"><b>Địa điểm xây dựng:</b> ${userInfo?.address || "Việt Nam"}</td>
            <td width="50%"><b>Tổng diện tích sàn:</b> ~${Math.round(sTotal)} m² (${dim})</td>
          </tr>
          <tr>
            <td width="50%"><b>Phong thủy bản mệnh:</b> ${fengShuiAnalysis?.element || "Hợp mệnh"} (${fengShuiAnalysis?.cungPhi || "Cát"})</td>
            <td width="50%"><b>Hướng nhà dự định:</b> ${userInfo?.desiredDirection || "Chưa chọn"}${(fengShuiAnalysis as any)?.directionVerdict?.star ? ` — ${(fengShuiAnalysis as any).directionVerdict.star} (${(fengShuiAnalysis as any).directionVerdict.isGood ? "HỢP" : "KHÔNG HỢP, xem giải pháp hóa giải"})` : ""}</td>
          </tr>
          <tr>
            <td width="50%"><b>Ngân sách dự kiến:</b> ${constructionInfo?.totalBudget ? `${constructionInfo.totalBudget.toLocaleString('vi-VN')} ${constructionInfo.budgetUnit}` : "Theo dự toán chi tiết"}</td>
            <td width="50%"><b>Ngày biên soạn:</b> ${dateStr}</td>
          </tr>
        </table>

        <!-- BẢNG MỤC LỤC VĂN BẢN 10 CHƯƠNG MỤC -->
        <h2 style="font-family: Arial, sans-serif; font-size: 13pt; color: #7f1d1d; text-transform: uppercase; border-bottom: 1.5pt solid #b91c1c; padding-bottom: 3pt; margin-top: 14pt;">
          MỤC LỤC TỔNG QUAN HỒ SƠ THUYẾT MINH KỸ THUẬT (10 CHƯƠNG MỤC)
        </h2>
        <table>
          <thead>
            <tr>
              <th style="width: 40pt; text-align: center;">Mục</th>
              <th style="width: 140pt;">Tên Chương Mục</th>
              <th>Nội Dung Trọng Tâm &amp; Pháp Lý Nghiệm Thu</th>
              <th style="width: 85pt;">Tiêu Chuẩn Áp Dụng</th>
              <th style="width: 50pt; text-align: center;">Vị Trí</th>
            </tr>
          </thead>
          <tbody>
            ${tocRowsHtml}
          </tbody>
        </table>

        <!-- 10 SECTIONS OF SPECIFICATION -->
        ${formattedSectionsHtml}

        <!-- BẢNG DỰ TOÁN KHỐI LƯỢNG BOQ CHI TIẾT KÈM ĐƠN GIÁ & THÀNH TIỀN -->
        <h2 style="font-family: Arial, sans-serif; font-size: 13pt; color: #7f1d1d; text-transform: uppercase; border-bottom: 1.5pt solid #b91c1c; padding-bottom: 3pt; margin-top: 18pt;">
          DỰ TOÁN KHỐI LƯỢNG VẬT TƯ &amp; NHÂN CÔNG (BOQ) KÈM ĐƠN GIÁ THỊ TRƯỜNG
        </h2>

        <!-- THÔNG TIN ĐIỀU CHỈNH GIÁ KHU VỰC THỰC TẾ -->
        <div class="regional-box">
          <b>📍 KHU VỰC ÁP DỤNG ĐƠN GIÁ:</b> ${boqResult.regionName} 
          (Hệ số thị trường: <b>${(boqResult.regionFactor * 100).toFixed(0)}%</b>) &nbsp;|&nbsp; 
          Đơn giá trung bình xây dựng trọn gói: <b>${boqResult.formatted_suat_dau_tu_m2} / m² sàn</b>.<br/>
          <i>Khoảng giá tham chiếu khu vực: Phần thô (3.8 - 4.5 tr/m²) · Trọn gói (4.8 - 6.5 tr/m²).</i>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30pt; text-align: center;">STT</th>
              <th>Hạng Mục Vật Tư / Nhân Công</th>
              <th style="width: 40pt; text-align: center;">ĐVT</th>
              <th style="width: 75pt; text-align: right;">Khối Lượng</th>
              <th style="width: 75pt; text-align: right;">Đơn Giá (VNĐ)</th>
              <th style="width: 80pt; text-align: right;">Vật Tư (VNĐ)</th>
              <th style="width: 80pt; text-align: right;">Nhân Công (VNĐ)</th>
              <th style="width: 90pt; text-align: right;">Thành Tiền (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            ${boqRowsHtml}
            <tr style="background: #0f172a; color: #ffffff; font-weight: bold;">
              <td colspan="7" style="text-align: right; text-transform: uppercase; padding: 8pt; color: #f59e0b;">
                TỔNG CỘNG DỰ TOÁN BÓC TÁCH (BOQ) — ${currentOption.name}:
              </td>
              <td style="text-align: right; padding: 8pt; color: #f59e0b; font-size: 12pt;">
                ${boqResult.formatted_tong_tron_goi}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- KẾ HOẠCH DÒNG TIỀN THEO TUẦN -->
        <h2 style="font-family: Arial, sans-serif; font-size: 13pt; color: #7f1d1d; text-transform: uppercase; border-bottom: 1.5pt solid #b91c1c; padding-bottom: 3pt; margin-top: 18pt;">
          KẾ HOẠCH DÒNG TIỀN &amp; LỘ TRÌNH GIẢI NGÂN THEO TUẦN
        </h2>
        <table>
          <thead>
            <tr>
              <th style="width: 35pt; text-align: center;">Đợt</th>
              <th style="width: 130pt;">Tiến độ &amp; Thời gian</th>
              <th style="width: 45pt; text-align: center;">Tỷ lệ</th>
              <th style="width: 90pt; text-align: right;">Số tiền</th>
              <th>Điều kiện nghiệm thu kích hoạt</th>
            </tr>
          </thead>
          <tbody>
            ${cashflowRowsHtml}
          </tbody>
        </table>

        <!-- BẢNG TRA TIÊU CHUẨN TCVN -->
        <h2 style="font-family: Arial, sans-serif; font-size: 13pt; color: #7f1d1d; text-transform: uppercase; border-bottom: 1.5pt solid #b91c1c; padding-bottom: 3pt; margin-top: 18pt;">
          BẢNG TRA TIÊU CHUẨN KỸ THUẬT QUỐC GIA (TCVN/QCVN) ÁP DỤNG
        </h2>
        <table>
          <thead>
            <tr>
              <th style="width: 120pt;">Hạng mục công trình</th>
              <th style="width: 120pt;">Tiêu chuẩn tham chiếu</th>
              <th>Ghi chú kiểm định</th>
            </tr>
          </thead>
          <tbody>
            ${standardsRowsHtml}
          </tbody>
        </table>

        <!-- COMMITMENT & 24H NOTICE -->
        <div class="commitment-box">
          <b>⚡ CAM KẾT KỸ THUẬT &amp; ĐÍNH CHÍNH BẢN VẼ CHI TIẾT 24H:</b><br/>
          Sơ đồ và phân khu chức năng trong tài liệu này được tính toán chuẩn theo diện tích thực tế <b>${sGround} m² (${widthM || 8}m x ${lengthM || 15}m)</b> của Quý khách. Hồ sơ bản vẽ kỹ thuật thi công hoàn chỉnh (AutoCAD kiến trúc, kết cấu móng-cột-dầm-sàn, bản vẽ điện nước MEP) sẽ được <b>Đội ngũ kỹ sư thẩm định và bàn giao trong vòng 24 giờ làm việc</b>.
        </div>

        <!-- FORMAL SIGNATURE BLOCK -->
        <table style="width: 100%; border: none; margin-top: 24pt;">
          <tr>
            <td style="width: 50%; text-align: center; border: none; font-family: Arial, sans-serif;">
              <b>ĐẠI DIỆN CHỦ ĐẦU TƯ</b><br/>
              <i>(Ký và ghi rõ họ tên)</i><br/><br/><br/><br/>
              <b>${clientName}</b>
            </td>
            <td style="width: 50%; text-align: center; border: none; font-family: Arial, sans-serif;">
              <b>ĐƠN VỊ LẬP HỒ SƠ</b><br/>
              <i style="color: #0284c7;">(Hồ sơ thiết kế sơ bộ tự động)</i><br/><br/><br/><br/>
              <b>YOHU BUILD AI ENGINE</b>
            </td>
          </tr>
        </table>
        <div style="font-size: 9pt; color: #64748b; text-align: center; margin-top: 12pt; font-style: italic;">
          * Ghi chú: Thuyết minh và dự toán được tính toán tự động bằng AI phục vụ công tác lập kế hoạch ban đầu. Cần kỹ sư có chứng chỉ hành nghề thẩm định trước khi triển khai thi công.
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordDoc], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Thuyet_Minh_10_Muc_${clientNameClean}_${selectedOptionId}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage('✅ Đã xuất file Word (.doc) 10 chương mục đầy đủ, rõ ràng, ngắt đoạn chuyên nghiệp!');
  };

  // 3. PRINT DIRECTLY / SAVE AS CLEAN PDF VIA BROWSER
  const handlePrintDirect = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    const htmlToPrint = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Thuyết Minh Kiến Trúc - Kết Cấu 10 Mục - YOHU BUILD AI</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Times New Roman", serif; font-size: 12px; color: #0f172a; background: #ffffff; padding: 20px; line-height: 1.6; }
          h1, h2, h3, h4 { color: #7f1d1d; }
          h4 { font-size: 13px; font-weight: bold; margin-top: 14px; margin-bottom: 6px; }
          ul, ol { margin: 6px 0 10px 20px; padding-left: 8px; }
          li { margin-bottom: 4px; line-height: 1.6; }
          p { margin-bottom: 8px; line-height: 1.65; text-align: justify; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; font-size: 11px; }
          th, td { border: 1px solid #94a3b8; padding: 6px 8px; }
          th { background-color: #7f1d1d; color: #ffffff; font-weight: bold; }
          @media print {
            body { padding: 0; }
            @page { size: A4 portrait; margin: 12mm; }
          }
        </style>
      </head>
      <body>
        ${printContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlToPrint);
    printWindow.document.close();
  };

  // 4. Structured Multi-Page PDF Exporter
  const handleExportPDF = async () => {
    setIsDownloadingPdf(true);
    setDownloadProgress('Đang khởi tạo các trang hồ sơ chuẩn A4...');
    try {
      await exportSpecificationToPdf({
        userInfo,
        constructionInfo,
        currentOption,
        sections,
        fengShuiAnalysis,
        lang,
        onProgress: (msg) => setDownloadProgress(msg)
      });
    } catch (err) {
      console.error('PDF export error:', err);
      // Fallback to direct DOM capture
      await handleExportDirectPdf();
    } finally {
      setIsDownloadingPdf(false);
      setDownloadProgress('');
    }
  };

  // Copy full document text
  const handleCopyDocument = () => {
    if (selectedSections.length === 0) return;
    const header = `THUYẾT MINH KIẾN TRÚC – KẾT CẤU & PHONG THỦY CÔNG TRÌNH\nChủ đầu tư: ${userInfo?.name || "Chủ Đầu Tư"} | Quy mô: ${floors} tầng (${dim})\nPhương án: ${currentOption.name} (${currentOption.id})\nNgày xuất: ${new Date().toLocaleDateString('vi-VN')}\n\n`;
    const body = selectedSections
      .map(s => `${cleanAndNormalizeVietnameseText(s.title)}\n${cleanMarkdownForPlainText(s.content)}`)
      .join('\n\n' + '='.repeat(60) + '\n\n');
    navigator.clipboard.writeText(cleanAndNormalizeVietnameseText(header + body));
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        
        {/* HEADER BAR */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#800f0f] via-[#a31c1c] to-[#6e0a0a] border-b border-red-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-xl border border-yellow-400/30 text-yellow-300">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-yellow-300 uppercase font-sans">
                Thuyết Minh Kiến Trúc – Kết Cấu – Phong Thủy & BOQ Mở Rộng
              </h2>
              <p className="text-xs text-red-100 font-medium">
                Dữ liệu chuẩn TCVN, BOQ tính theo diện tích S={sGround}m², Phong thủy Bát Trạch & Xuất hồ sơ PDF chuẩn in A4
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition cursor-pointer text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN BODY AREA */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* OPTIONAL VIP BANNER IF NOT PAID */}
          {!isPaidTier && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                <span>Bạn đang sử dụng bản xem trước đầy đủ hồ sơ kỹ thuật & BOQ. Có thể tải PDF hoặc xuất báo cáo VIP ngay bên dưới.</span>
              </div>
              {onUnlockPaidTier && (
                <button
                  onClick={onUnlockPaidTier}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shrink-0 transition"
                >
                  Kích hoạt VIP
                </button>
              )}
            </div>
          )}

          {/* STRUCTURAL OPTION SELECTOR (PA1, PA2, PA3) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Phương Án Kết Cấu Lựa Chọn (3 Phương Án):
              </label>
              <span className="text-xs text-slate-400">
                Quy mô: <strong className="text-white">{floors} tầng</strong> | S sàn T1: <strong className="text-yellow-300">{sGround} m²</strong> | Tổng DTXD: <strong className="text-yellow-300">{Math.round(sTotal)} m²</strong>
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {STRUCTURAL_OPTIONS.map((opt) => {
                    const isSelected = opt.id === selectedOptionId;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSelectOptionId(opt.id)}
                        className={`p-3 rounded-xl border text-left transition relative cursor-pointer ${
                          isSelected 
                            ? 'bg-red-950/40 border-amber-400 text-white shadow-md ring-2 ring-amber-400/50' 
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-xs text-yellow-300 font-mono">{opt.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            opt.id === 'PA3' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-700 text-slate-200'
                          }`}>
                            {opt.badge}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-100 line-clamp-1">{opt.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">{opt.shortDescription}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ACTION CONTROL & VIEW MODE BAR */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* GENERATE & STATUS */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleStartGeneration}
                      disabled={isGenerating || isTranslating}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition flex items-center gap-2 ${
                        isGenerating 
                          ? 'bg-amber-600/50 text-amber-200 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white shadow-md'
                      }`}
                    >
                      <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                      {sections.length === 0 ? 'Tạo Thuyết Minh 10 Mục (AI Chunking)' : 'Tạo Lại Toàn Bộ'}
                    </button>

                    {statusMessage && (
                      <span className="text-xs font-medium text-amber-300 hidden md:inline-block animate-pulse">
                        {statusMessage}
                      </span>
                    )}
                  </div>

                  {/* MULTILINGUAL SELECTOR */}
                  <div className="flex items-center gap-2 bg-slate-900/90 p-1 px-2.5 rounded-xl border border-slate-700">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-slate-300">Ngôn ngữ:</span>
                    <select
                      value={exportLang}
                      onChange={(e) => {
                        const val = e.target.value;
                        setExportLang(val);
                        if (val !== 'vi' && val !== 'custom' && sections.length > 0) {
                          handleTranslateAll(val);
                        }
                      }}
                      className="bg-slate-800 text-amber-300 font-bold text-xs rounded px-2 py-1 border border-slate-700 focus:outline-none"
                    >
                      <option value="vi">🇻🇳 Tiếng Việt</option>
                      <option value="en">🇺🇸 English</option>
                      <option value="lo">🇱🇦 Lao</option>
                      <option value="zh">🇨🇳 Chinese</option>
                      <option value="custom">✏️ Khác...</option>
                    </select>

                    {exportLang === 'custom' && (
                      <div className="flex items-center gap-1">
                        <input 
                          type="text" 
                          placeholder="Ví dụ: Japanese"
                          value={customLangInput}
                          onChange={(e) => setCustomLangInput(e.target.value)}
                          className="px-2 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded text-white focus:outline-none w-28"
                        />
                        <button
                          onClick={() => handleTranslateAll(customLangInput || 'en')}
                          disabled={!customLangInput || isTranslating}
                          className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition"
                        >
                          Dịch
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* PROGRESS BAR IF GENERATING */}
                {isGenerating && (
                  <div className="space-y-2 bg-slate-900/90 p-3 rounded-xl border border-amber-500/30">
                    <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-amber-300 font-mono">
                      <span>Đang nạp ngữ cảnh & biên soạn từng chương mục: {generationProgress}%</span>
                      <div className="flex items-center gap-2">
                        {isPaused ? (
                          <button
                            type="button"
                            onClick={handleResumeGeneration}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <span>▶️ Tiếp tục</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handlePauseGeneration}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs transition flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <span>⏸️ Tạm dừng</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleCancelGeneration}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <span>❌ Hủy</span>
                        </button>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* BROWSER PERSISTENCE STATUS BANNER */}
                {!isGenerating && sections.length > 0 && (
                  <div className="bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        {isLoadedFromCache 
                          ? <strong>Đã tải từ bộ nhớ lưu trình duyệt: </strong>
                          : <strong>Đã lưu vào bộ nhớ trình duyệt: </strong>
                        }
                        Toàn bộ 10 chương mục & Bảng tra BOQ được lưu an toàn. Bạn có thể đóng/mở lại bất kỳ lúc nào mà không sợ mất dữ liệu hay phải đợi tải lại.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Bạn có muốn chạy biên soạn lại toàn bộ thuyết minh mới nhất cho phương án này không?")) {
                          handleStartGeneration();
                        }
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 font-bold rounded-lg border border-slate-700 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                      title="Biên soạn lại dữ liệu từ đầu"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Biên soạn lại từ đầu</span>
                    </button>
                  </div>
                )}

                {/* VIEW TABS & SELECTION CONTROLS */}
                <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700">
                    <button
                      onClick={() => setViewMode('master')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        viewMode === 'master' 
                          ? 'bg-gradient-to-r from-red-700 to-amber-600 text-white shadow' 
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Văn Bản Tổng Hợp ({selectedSections.length} mục đã chọn)</span>
                    </button>

                    <button
                      onClick={() => setViewMode('sections')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        viewMode === 'sections' 
                          ? 'bg-gradient-to-r from-red-700 to-amber-600 text-white shadow' 
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Từng Mục & Chỉnh Sửa</span>
                    </button>

                    <button
                      onClick={() => setViewMode('boq_table')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        viewMode === 'boq_table' 
                          ? 'bg-gradient-to-r from-red-700 to-amber-600 text-white shadow' 
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Bảng Tra BOQ & Tiêu Chuẩn</span>
                    </button>
                  </div>

                  {/* QUICK SELECTION BUTTONS */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelectAll(true)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg border border-slate-700 transition cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      onClick={() => handleSelectAll(false)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg border border-slate-700 transition cursor-pointer"
                    >
                      Bỏ chọn
                    </button>

                    {selectedSections.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 ml-2">
                        {/* NÚT 1: TẢI PDF TRỰC TIẾP (BÊ NGUYÊN 10 MỤC TỪ GIAO DIỆN) */}
                        <button
                          onClick={handleExportDirectPdf}
                          disabled={isDownloadingPdf}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow transition flex items-center gap-1.5 text-xs cursor-pointer"
                          title="Bê nguyên toàn bộ 10 chương mục và bảng biểu đang hiển thị trên màn hình thành file PDF tải về máy"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isDownloadingPdf ? (downloadProgress || 'Đang chụp PDF...') : 'Tải PDF (Bê Nguyên 10 Mục Giao Diện)'}</span>
                        </button>

                        {/* NÚT 2: TẢI FILE WORD (.DOC) */}
                        <button
                          onClick={handleExportWord}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow transition flex items-center gap-1.5 text-xs cursor-pointer"
                          title="Tải toàn bộ 10 chương mục thành file Word (.doc) để xem, in ấn hoặc gửi khách hàng"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Tải File Word (.doc)</span>
                        </button>

                        {/* NÚT 3: IN TRỰC TIẾP / LƯU PDF TRÌNH DUYỆT */}
                        <button
                          onClick={handlePrintDirect}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl border border-slate-700 transition flex items-center gap-1 text-xs cursor-pointer"
                          title="Mở giao diện in ấn chuyên nghiệp để lưu file PDF sắc nét hoặc in ra giấy"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>In / Lưu PDF</span>
                        </button>

                        {/* NÚT 4: SAO CHÉP VĂN BẢN */}
                        <button
                          onClick={handleCopyDocument}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl border border-slate-700 transition flex items-center gap-1 text-xs cursor-pointer"
                          title="Sao chép toàn bộ văn bản 10 mục vào bộ nhớ tạm"
                        >
                          {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSuccess ? 'Đã sao chép!' : 'Sao chép'}</span>
                        </button>

                        {/* NÚT 5: TẢI BÁO CÁO VIP MỤC ADMIN */}
                        {onExportAdminPdf && (
                          <button
                            onClick={onExportAdminPdf}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow transition flex items-center gap-1.5 text-xs cursor-pointer"
                            title="Tải trọn bộ 3 trang như bản xuất ở mục Quản trị Admin"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Báo Cáo VIP (Mục Admin)</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* VIEW 1: VĂN BẢN TỔNG HỢP HOÀN CHỈNH (CONSOLIDATED MASTER REPORT) */}
              <div className={viewMode === 'master' ? 'block' : 'hidden'}>
                <div className="bg-slate-950 p-3 sm:p-6 rounded-2xl border border-slate-800 space-y-6">
                  {selectedSections.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <FileText className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
                      <p className="text-slate-400 text-sm font-medium">
                        Bạn chưa chọn mục nào để ghép vào văn bản tổng hợp. Hãy chuyển qua tab <strong className="text-amber-400">"Từng Mục & Chỉnh Sửa"</strong> hoặc bấm <strong className="text-amber-400">"Chọn tất cả"</strong> ở phía trên!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* PRINT CANVAS */}
                      <div ref={printRef} className="bg-white text-slate-900 p-8 sm:p-14 rounded-xl shadow-2xl space-y-8 font-serif leading-relaxed text-sm max-w-4xl mx-auto border border-slate-200">
                        
                        {/* FORMAL COVER PAGE */}
                        <div className="border-b-4 border-red-900 pb-8 text-center space-y-4 font-sans">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs text-slate-500 font-mono">
                            <span>HỆ THỐNG YOHU BUILD AI SPECIFICATION</span>
                            <span>MÃ HỒ SƠ: YH-{currentOption.id}-{new Date().getFullYear()}</span>
                          </div>

                          <div className="pt-2">
                            <span className="px-3 py-1 bg-red-100 text-red-900 font-bold text-xs uppercase tracking-widest rounded-full">
                              HỒ SƠ THIẾT KẾ KỸ THUẬT & PHONG THỦY BÁT TRẠCH
                            </span>
                          </div>

                          <h1 className="text-2xl sm:text-3xl font-black text-red-950 uppercase tracking-tight">
                            THUYẾT MINH KIẾN TRÚC – KẾT CẤU & BÓC TÁCH KHỐI LƯỢNG
                          </h1>
                          <p className="text-sm font-bold text-slate-700 italic">
                            Dự án: {constructionInfo?.constructionType || "Nhà ở dân dụng"} — Chủ đầu tư: {userInfo?.name || "Chủ Đầu Tư"}
                          </p>

                          {/* GENERAL PROPERTY SUMMARY GRID */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans bg-slate-50 p-4 rounded-xl border border-slate-300 text-left mt-4 shadow-inner">
                            <div>
                              <span className="text-slate-500 block">Quy mô công trình:</span>
                              <strong className="text-slate-900 font-bold">{floors} tầng</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Diện tích sàn T1 / Tổng DTXD:</span>
                              <strong className="text-slate-900 font-bold">{sGround} m² / {Math.round(sTotal)} m²</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Phương án kết cấu:</span>
                              <strong className="text-red-900 font-bold">{currentOption.id} — {currentOption.name}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Gia chủ & Phong thủy:</span>
                              <strong className="text-slate-900 font-bold">{userInfo?.birthDate ? `Năm ${userInfo.birthDate}` : 'Theo Bát Trạch'}</strong>
                            </div>
                          </div>

                          {/* DYNAMIC TABLE OF CONTENTS TABLE (MỤC LỤC 10 CHƯƠNG MỤC DẠNG BẢNG) */}
                          <div className="mt-4 p-4 bg-amber-50/60 rounded-xl border border-amber-300 text-left">
                            <h4 className="font-sans font-black text-xs uppercase tracking-wider text-red-950 mb-2">
                              📋 MỤC LỤC VĂN BẢN (10 CHƯƠNG MỤC THUYẾT MINH KỸ THUẬT &amp; DỰ TOÁN):
                            </h4>
                            <div className="overflow-x-auto border border-amber-300 rounded-lg">
                              <table className="w-full text-left text-xs text-slate-900 border-collapse">
                                <thead className="bg-red-950 text-white font-black uppercase text-[11px]">
                                  <tr>
                                    <th className="p-2 border border-amber-300 text-center w-12">Mục</th>
                                    <th className="p-2 border border-amber-300 w-44">Tên Chương Mục</th>
                                    <th className="p-2 border border-amber-300">Nội Dung Trọng Tâm &amp; Pháp Lý Nghiệm Thu</th>
                                    <th className="p-2 border border-amber-300 w-32">Tiêu Chuẩn Áp Dụng</th>
                                    <th className="p-2 border border-amber-300 text-center w-16">Vị Trí</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-200 text-[11px]">
                                  {REPORT_TOC_TABLE.map((row) => (
                                    <tr key={row.id} className="hover:bg-amber-100/50">
                                      <td className="p-1.5 border border-amber-200 text-center font-bold text-red-950">{row.romanNumber}</td>
                                      <td className="p-1.5 border border-amber-200 font-bold text-slate-900">{row.title}</td>
                                      <td className="p-1.5 border border-amber-200 text-slate-700">{row.keyFocus}</td>
                                      <td className="p-1.5 border border-amber-200 font-mono text-red-900 font-semibold">{row.standardsApplied}</td>
                                      <td className="p-1.5 border border-amber-200 text-center font-bold text-amber-800">{row.pageReference}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>

                        {/* SECTION CONTENTS */}
                        <div className="space-y-8">
                          {selectedSections.map((sec, idx) => (
                            <div key={sec.id} className="space-y-3 pt-2">
                              <h2 className="text-base sm:text-lg font-black text-red-950 font-sans uppercase border-b-2 border-red-300 pb-1.5 flex items-center justify-between">
                                <span>{sec.title}</span>
                                <span className="text-xs text-slate-400 font-normal font-mono">Mục {idx + 1}/{selectedSections.length}</span>
                              </h2>

                              <div 
                                className="formatted-section-content text-slate-800 font-serif leading-relaxed text-sm text-justify space-y-2"
                                dangerouslySetInnerHTML={{ __html: formatSectionContentToHtml(sec.content, false) }}
                              />
                            </div>
                          ))}
                        </div>

                        {/* BOQ TABLE IN PRINT REPORT WITH PROFESSIONAL GRIDLINES */}
                        <div className="space-y-4 pt-6 border-t-2 border-slate-300 font-sans">
                          {(() => {
                            const layout = computeArchitecturalLayoutModel({
                              widthM: widthM || 5,
                              lengthM: lengthM || 20,
                              floors,
                              groundFloorArea: sGround,
                              totalConstructionArea: sTotal
                            });
                            const masterEstimate = getUnifiedEstimate({ constructionInfo, userInfo, optionKey: (selectedOptionId as StructuralOptionKey) || 'PA1' });
                            const lines = masterEstimate.lines;
                            const formattedTotalCostVND = masterEstimate.formatted_tong_tron_goi;
                            const formattedCostPerSqm = masterEstimate.formatted_suat_dau_tu_m2;
                            const regionalAdjustment = {
                              regionName: masterEstimate.regionName,
                              overallMultiplier: masterEstimate.regionFactor,
                              roughCostPerSqmRange: "3.8 - 4.5 tr/m²",
                              turnkeyCostPerSqmRange: "4.8 - 6.5 tr/m²"
                            };

                            return (
                              <>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <h3 className="text-sm font-black text-red-950 uppercase tracking-wide">
                                    📋 BẢNG BÓC TÁCH VẬT TƯ – NHÂN CÔNG (BOQ) KÈM ĐƠN GIÁ &amp; THÀNH TIỀN
                                  </h3>
                                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300">
                                    Đơn giá theo khu vực: {regionalAdjustment.regionName} (x{(regionalAdjustment.overallMultiplier).toFixed(2)})
                                  </span>
                                </div>

                                {/* Regional Pricing Index Card */}
                                <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-xl text-xs text-emerald-950 space-y-1">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span><b>📍 Địa bàn công trình:</b> {userInfo?.address || regionalAdjustment.regionName}</span>
                                    <span className="font-bold text-emerald-900 font-mono">Suất đầu tư: ~{formattedCostPerSqm} / m²</span>
                                  </div>
                                  <div className="text-[11px] text-emerald-800">
                                    Tham chiếu thị trường: Xây thô &amp; nhân công: <b>{regionalAdjustment.roughCostPerSqmRange}</b> · Trọn gói chìa khóa trao tay: <b>{regionalAdjustment.turnkeyCostPerSqmRange}</b>.
                                  </div>
                                </div>

                                <div className="overflow-x-auto border border-slate-400 rounded-lg">
                                  <table className="w-full text-left text-xs text-slate-900 border-collapse">
                                    <thead className="bg-red-950 text-white font-black uppercase">
                                      <tr>
                                        <th className="p-2 border border-slate-400 text-center w-8">STT</th>
                                        <th className="p-2 border border-slate-400">Hạng mục công việc</th>
                                        <th className="p-2 border border-slate-400 text-center w-12">ĐVT</th>
                                        <th className="p-2 border border-slate-400 text-right">Khối lượng</th>
                                        <th className="p-2 border border-slate-400 text-right">Đơn giá (VNĐ)</th>
                                        <th className="p-2 border border-slate-400 text-right">Vật tư (VNĐ)</th>
                                        <th className="p-2 border border-slate-400 text-right">Nhân công (VNĐ)</th>
                                        <th className="p-2 border border-slate-400 text-right">Thành tiền (VNĐ)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-300">
                                      {lines.map((line, idx) => (
                                        <tr key={line.item.id}>
                                          <td className="p-2 border border-slate-300 text-center font-bold">{idx + 1}</td>
                                          <td className="p-2 border border-slate-300 font-bold">{line.item.name}<div className="font-normal text-[10px] text-slate-600">{line.spec}</div></td>
                                          <td className="p-2 border border-slate-300 text-center font-mono">{line.item.unit}</td>
                                          <td className="p-2 border border-slate-300 font-bold text-slate-900 font-mono text-right">{line.formattedQty}</td>
                                          <td className="p-2 border border-slate-300 text-slate-600 font-mono text-right">{line.unitPrice.toLocaleString('vi-VN')} đ</td>
                                          <td className="p-2 border border-slate-300 text-emerald-800 font-mono text-right">{Math.round(line.materialAmount || 0).toLocaleString('vi-VN')} đ</td>
                                          <td className="p-2 border border-slate-300 text-amber-800 font-mono text-right">{Math.round(line.laborAmount || 0).toLocaleString('vi-VN')} đ</td>
                                          <td className="p-2 border border-slate-300 font-bold text-red-900 font-mono text-right">{line.formattedTotalAmount}</td>
                                        </tr>
                                      ))}
                                      <tr className="bg-red-50 font-black text-red-950">
                                        <td colSpan={7} className="p-2 border border-slate-400 text-right uppercase">
                                          TỔNG CỘNG DỰ TOÁN BÓC TÁCH (BOQ):
                                        </td>
                                        <td className="p-2 border border-slate-400 text-right font-mono text-sm text-red-900">
                                          {formattedTotalCostVND}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {/* CASHFLOW MILESTONES / WEEKLY DISBURSEMENT SCHEDULE */}
                        <div className="space-y-4 pt-6 border-t border-slate-300 font-sans">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-red-950 uppercase tracking-wide flex items-center gap-2">
                              <span>💰 KẾ HOẠCH DÒNG TIỀN &amp; LỘ TRÌNH GIẢI NGÂN THEO TUẦN</span>
                            </h3>
                            <span className="text-xs text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                              Chủ động tài chính · Thanh toán theo tiến độ nghiệm thu
                            </span>
                          </div>
                          <div className="overflow-x-auto border border-slate-400 rounded-lg">
                            <table className="w-full text-left text-xs text-slate-900 border-collapse">
                              <thead className="bg-slate-900 text-white font-black uppercase">
                                <tr>
                                  <th className="p-2 border border-slate-400 text-center w-8">Đợt</th>
                                  <th className="p-2 border border-slate-400">Thời gian (Tuần) &amp; Nội dung đợt</th>
                                  <th className="p-2 border border-slate-400 text-center w-16">Tỷ lệ (%)</th>
                                  <th className="p-2 border border-slate-400 text-right w-28">Số tiền dự kiến</th>
                                  <th className="p-2 border border-slate-400">Điều kiện nghiệm thu kích hoạt thanh toán</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-300">
                                {(() => {
                                  const layout = computeArchitecturalLayoutModel({
                                    widthM: widthM || 5,
                                    lengthM: lengthM || 20,
                                    floors,
                                    groundFloorArea: sGround,
                                    totalConstructionArea: sTotal
                                  });
                                  const boqList = getBoqTemplateForOption(selectedOptionId);
                                  const { totalCostVND } = calculateFullBOQ(boqList, sGround, sTotal, floors, layout, userInfo?.address);
                                  const milestones = calculateCashflowMilestones(totalCostVND, selectedOptionId);

                                  return milestones.map((ms) => (
                                    <tr key={ms.stage}>
                                      <td className="p-2 border border-slate-300 text-center font-bold">{ms.stage}</td>
                                      <td className="p-2 border border-slate-300">
                                        <div className="font-bold text-slate-900">{ms.phaseName}</div>
                                        <div className="text-[11px] text-amber-700 font-semibold">{ms.timeframe}</div>
                                      </td>
                                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-900">{ms.percentage}%</td>
                                      <td className="p-2 border border-slate-300 text-right font-mono font-bold text-emerald-800">{ms.formattedAmount}</td>
                                      <td className="p-2 border border-slate-300 text-[11px] text-slate-700 leading-snug">
                                        <div>{ms.triggerCondition}</div>
                                        <div className="text-slate-500 italic mt-0.5">👉 {ms.homeownerAction}</div>
                                      </td>
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* MATERIAL ORDERING & LEAD-TIME SCHEDULE */}
                        <div className="space-y-4 pt-6 border-t border-slate-300 font-sans">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-red-950 uppercase tracking-wide flex items-center gap-2">
                              <span>⏱️ LỊCH TRÌNH ĐẶT HÀNG VẬT TƯ &amp; CẢNH BÁO LEAD-TIME (TRÁNH THỢ CHỜ / HỎNG VẬT TƯ)</span>
                            </h3>
                          </div>
                          <div className="overflow-x-auto border border-slate-400 rounded-lg">
                            <table className="w-full text-left text-xs text-slate-900 border-collapse">
                              <thead className="bg-slate-900 text-white font-black uppercase">
                                <tr>
                                  <th className="p-2 border border-slate-400">Chủng loại vật tư chính</th>
                                  <th className="p-2 border border-slate-400 text-center w-36">Thời gian đặt trước (Lead-time)</th>
                                  <th className="p-2 border border-slate-400 text-center w-28">Trách nhiệm</th>
                                  <th className="p-2 border border-slate-400">Thời điểm chốt &amp; Lưu ý rủi ro thực tế</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-300">
                                {MATERIAL_LEAD_TIME_SCHEDULE.map((item) => (
                                  <tr key={item.id}>
                                    <td className="p-2 border border-slate-300 font-bold text-slate-900">
                                      {item.materialName}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-center font-bold text-amber-900 bg-amber-50/50">
                                      {item.orderLeadTimeDays}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-center text-[11px] font-semibold text-slate-700">
                                      {item.responsibleParty}
                                    </td>
                                    <td className="p-2 border border-slate-300 text-[11px] text-slate-700 leading-snug">
                                      <div className="font-semibold text-slate-900">Thời điểm: {item.orderTriggerMilestone}</div>
                                      <div className="text-red-700 mt-0.5">{item.criticalRiskWarning}</div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* TECHNICAL STANDARDS TABLE IN PRINT REPORT */}
                        <div className="space-y-4 pt-6 border-t border-slate-300 font-sans">
                          <h3 className="text-sm font-black text-red-950 uppercase tracking-wide">
                            📐 TIÊU CHUẨN KỸ THUẬT QUỐC GIA (TCVN/QCVN) ÁP DỤNG
                          </h3>
                          <div className="overflow-x-auto border border-slate-400 rounded-lg">
                            <table className="w-full text-left text-xs text-slate-900 border-collapse">
                              <thead className="bg-red-950 text-white font-black uppercase">
                                <tr>
                                  <th className="p-2 border border-slate-400">Hạng mục công trình</th>
                                  <th className="p-2 border border-slate-400">Tiêu chuẩn tham chiếu</th>
                                  <th className="p-2 border border-slate-400">Ghi chú kiểm định</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-300">
                                {TECHNICAL_STANDARDS_TABLE.map((std, idx) => (
                                  <tr key={idx}>
                                    <td className="p-2 border border-slate-300 font-bold">{std.item}</td>
                                    <td className="p-2 border border-slate-300 font-mono font-bold text-red-900">{std.standardCode}</td>
                                    <td className="p-2 border border-slate-300 text-[11px] text-slate-700">{std.notes}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* ARCHITECTURAL FLOOR PLAN VISUAL SVG */}
                        <div className="space-y-4 pt-6 border-t-2 border-slate-300 font-sans">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm sm:text-base font-black text-red-950 uppercase tracking-wide flex items-center gap-2">
                              <span>📐 SƠ ĐỒ MẶT BẰNG KIẾN TRÚC 2D TRỰC QUAN (TỰ ĐỘNG THIẾT KẾ THEO PHONG THỦY)</span>
                            </h3>
                            <span className="text-xs text-slate-500 font-mono">Tỷ lệ trực quan · Phù hợp Bát Trạch</span>
                          </div>
                          <p className="text-xs text-slate-600 italic">
                            Bản vẽ kiến trúc sơ bộ hiển thị phân khu chức năng (Phòng khách, Phòng ngủ, Bếp ăn, Vệ sinh), hướng cửa chính chuẩn Bát Trạch, kích thước tường và bố trí nội thất cơ bản:
                          </p>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 flex justify-center items-center overflow-x-auto shadow-sm">
                            <div 
                              className="max-w-full"
                              dangerouslySetInnerHTML={{ __html: floorPlanSvg }} 
                            />
                          </div>

                          {/* 24H TECHNICAL COMMITMENT NOTICE */}
                          <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-950 font-sans shadow-sm">
                            <div className="font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                              <span>⚡ CAM KẾT KỸ THUẬT &amp; ĐÍNH CHÍNH BẢN VẼ CHI TIẾT 24H:</span>
                            </div>
                            <p className="leading-relaxed text-amber-900">
                              Sơ đồ phân khu công năng trên được tính toán khớp với diện tích mặt bằng thực tế <b>{sGround} m² ({widthM || 8}m × {lengthM || 15}m)</b> của Quý khách. Hồ sơ bản vẽ kỹ thuật thi công hoàn chỉnh (AutoCAD kiến trúc, kết cấu móng-cột-dầm-sàn, bản vẽ điện nước MEP) sẽ được <b>Đội ngũ kỹ sư thẩm định, hoàn thiện chính xác 100% và bàn giao trong vòng 24 giờ làm việc</b>.
                            </p>
                          </div>
                        </div>

                        {/* FORMAL SIGNATURE / DISCLAIMER BLOCK */}
                        <div className="border-t-2 border-slate-300 pt-6 mt-8 font-sans">
                          <div className="grid grid-cols-2 gap-6 text-center text-xs">
                            <div className="space-y-12">
                              <div>
                                <strong className="text-slate-900 block uppercase font-black">ĐẠI DIỆN CHỦ ĐẦU TƯ</strong>
                                <span className="text-slate-500 italic">(Ký và ghi rõ họ tên)</span>
                              </div>
                              <div className="font-bold text-slate-800">{userInfo?.name || "Chủ Đầu Tư"}</div>
                            </div>
                            <div className="space-y-12">
                              <div>
                                <strong className="text-red-950 block uppercase font-black">ĐƠN VỊ LẬP HỒ SƠ</strong>
                                <span className="text-slate-500 italic">(Hồ sơ thiết kế sơ bộ tự động)</span>
                              </div>
                              <div className="font-bold text-red-900">YOHU BUILD AI ENGINE</div>
                            </div>
                          </div>

                          <div className="border-t border-slate-200 pt-4 mt-6 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                            <span>Bản quyền © {new Date().getFullYear()} Yohu Build. Mọi thông số tiêu chuẩn tuân thủ TCVN hiện hành.</span>
                            <span>Ngày xuất bản: {new Date().toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 italic text-center mt-2">
                            * Ghi chú: Thuyết minh và dự toán được tính toán tự động bằng AI phục vụ công tác lập kế hoạch ban đầu. Cần kỹ sư có chứng chỉ hành nghề thẩm định trước khi triển khai thi công.
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* VIEW 2: TỪNG MỤC CHI TIẾT & CHỈNH SỬA TRỰC TIẾP (INLINE EDITING) */}
              <div className={viewMode === 'sections' ? 'block' : 'hidden'}>
                <div className="space-y-4">
                  <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-center justify-between">
                    <span>
                      💡 Bạn có thể <strong>tích chọn/bỏ chọn</strong> từng mục để loại trừ khỏi bản in, hoặc bấm <strong>"Chỉnh sửa"</strong> để sửa đổi văn bản trực tiếp theo ý muốn!
                    </span>
                    <span className="font-bold text-white">
                      Đã chọn: {selectedSections.length}/{sections.length} mục
                    </span>
                  </div>

                  <div className="space-y-3">
                    {sections.map((sec) => {
                      const isEditing = editingSectionId === sec.id;
                      return (
                        <div 
                          key={sec.id}
                          className={`p-4 rounded-xl border transition-all ${
                            sec.isSelected 
                              ? 'bg-slate-800/80 border-slate-700' 
                              : 'bg-slate-900/60 border-slate-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={sec.isSelected}
                                onChange={() => handleToggleSection(sec.id)}
                                className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                              />
                              <span className="font-black text-sm text-yellow-300">
                                {sec.title}
                              </span>
                            </label>

                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEdit(sec.id)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                                  >
                                    <Save className="w-3.5 h-3.5" /> Lưu
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-lg text-xs cursor-pointer"
                                  >
                                    Hủy
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleStartEdit(sec)}
                                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-amber-300 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition"
                                >
                                  <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
                                </button>
                              )}
                            </div>
                          </div>

                          {isEditing ? (
                            <textarea
                              rows={8}
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full p-3 rounded-lg bg-slate-950 border border-amber-400 text-slate-100 font-serif text-xs leading-relaxed focus:outline-none"
                            />
                          ) : (
                            <div 
                              className="formatted-section-content text-slate-300 font-serif text-xs leading-relaxed max-h-48 overflow-y-auto bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1.5"
                              dangerouslySetInnerHTML={{ __html: formatSectionContentToHtml(sec.content, false) }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* VIEW 3: BẢNG TRA BOQ & TIÊU CHUẨN CỐ ĐỊNH HỆ THỐNG */}
              <div className={viewMode === 'boq_table' ? 'block' : 'hidden'}>
                <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-6">
                  
                  {/* HARD-CODED BOQ TABLE */}
                  <div className="space-y-3">
                    {(() => {
                      const layout = computeArchitecturalLayoutModel({
                        widthM: widthM || 5,
                        lengthM: lengthM || 20,
                        floors,
                        groundFloorArea: sGround,
                        totalConstructionArea: sTotal
                      });
                      const masterEstimate = getUnifiedEstimate({ constructionInfo, userInfo, optionKey: (selectedOptionId as StructuralOptionKey) || 'PA1' });
                      const lines = masterEstimate.lines;
                      const formattedTotalCostVND = masterEstimate.formatted_tong_tron_goi;
                      const formattedCostPerSqm = masterEstimate.formatted_suat_dau_tu_m2;
                      const regionalAdjustment = {
                        regionName: masterEstimate.regionName,
                        overallMultiplier: masterEstimate.regionFactor,
                        roughCostPerSqmRange: "3.8 - 4.5 tr/m²",
                        turnkeyCostPerSqmRange: "4.8 - 6.5 tr/m²"
                      };

                      return (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm sm:text-base font-black text-amber-400 uppercase tracking-tight flex items-center gap-2">
                                <Calculator className="w-4 h-4" /> BẢNG BÓC TÁCH VẬT TƯ – NHÂN CÔNG (BOQ) MỞ RỘNG
                              </h3>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                {selectedOptionId}: {currentOption?.name}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">
                              Tính toán theo: S sàn = <strong className="text-yellow-300">{sGround}m²</strong> | S tổng = <strong className="text-yellow-300">{Math.round(sTotal)}m²</strong>
                            </span>
                          </div>

                          {/* Regional Price Info Banner */}
                          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span><b>📍 Khu vực thị trường:</b> <span className="text-white font-bold">{regionalAdjustment.regionName}</span> (Hệ số vùng: <b>{(regionalAdjustment.overallMultiplier * 100).toFixed(0)}%</b>)</span>
                              <span className="font-bold text-amber-300 font-mono">Đơn giá TB: ~{formattedCostPerSqm} / m²</span>
                            </div>
                            <div className="text-[11px] text-emerald-400/90">
                              Khung giá thị trường địa phương: Phần thô ({regionalAdjustment.roughCostPerSqmRange}) · Trọn gói hoàn thiện ({regionalAdjustment.turnkeyCostPerSqmRange}).
                            </div>
                          </div>

                          {/* GIẢI TRÌNH DIỆN TÍCH SỬ DỤNG VS DIỆN TÍCH XÂY DỰNG */}
                          <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-200 space-y-2 leading-relaxed">
                            <strong className="text-amber-300 uppercase block tracking-wide">📐 GIẢI TRÌNH DIỆN TÍCH THI CÔNG CHI TIẾT (Tránh hiểu nhầm về hao hụt diện tích):</strong>
                            <ul className="list-disc pl-4 space-y-1 text-slate-300">
                              <li><b>Diện tích sàn sử dụng thực tế (thông thủy sàn trệt):</b> <span className="text-white font-bold">{sGround} m²</span> (Toàn bộ phần diện tích sử dụng bên trong các phòng chức năng sinh hoạt hàng ngày).</li>
                              <li><b>Diện tích quy đổi kết cấu móng &amp; hạ tầng kỹ thuật (Hệ số quy đổi 30%):</b> <span className="text-white font-bold">{(sGround * 0.3).toFixed(1)} m²</span> (Quy đổi chi phí đào đắp móng, bê tông lót, bê tông móng băng/móng cọc ngầm, cốp pha ngầm và hệ thống bể tự hoại bảo vệ nền nhà không lún lệch).</li>
                              <li><b>Tổng diện tích sàn tính toán dự toán (BOQ trọn gói):</b> {sGround} m² + {(sGround * 0.3).toFixed(1)} m² = <span className="text-yellow-300 font-bold">{Math.round(sTotal)} m²</span>. Đây là diện tích chuẩn được áp dụng để tính toán chính xác tuyệt đối định mức vật liệu &amp; nhân công, đảm bảo tính minh bạch tối đa cho Chủ đầu tư.</li>
                            </ul>
                          </div>

                          <div className="overflow-x-auto rounded-xl border border-slate-700">
                            <table className="w-full text-left text-xs text-slate-200 border-collapse">
                              <thead className="bg-slate-800 text-amber-300 uppercase font-black">
                                <tr>
                                  <th className="p-2.5 border border-slate-700 text-center w-8">STT</th>
                                  <th className="p-2.5 border border-slate-700">Hạng mục</th>
                                  <th className="p-2.5 border border-slate-700 text-center w-12">ĐVT</th>
                                  <th className="p-2.5 border border-slate-700 text-right text-yellow-300">Khối lượng</th>
                                  <th className="p-2.5 border border-slate-700 text-right">Đơn giá (VNĐ)</th>
                                  <th className="p-2.5 border border-slate-700 text-right text-emerald-300">Vật tư (VNĐ)</th>
                                  <th className="p-2.5 border border-slate-700 text-right text-amber-200">Nhân công (VNĐ)</th>
                                  <th className="p-2.5 border border-slate-700 text-right text-amber-300">Thành tiền (VNĐ)</th>
                                  <th className="p-2.5 border border-slate-700">Giải thích dễ hiểu cho khách</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800 font-sans">
                                {lines.map((line, idx) => (
                                  <tr key={line.item.id} className="hover:bg-slate-900/60 transition">
                                    <td className="p-2.5 border border-slate-800 text-center text-slate-400">{idx + 1}</td>
                                    <td className="p-2.5 border border-slate-800 font-bold text-white">{line.item.name}<div className="font-normal text-[11px] text-slate-400">{line.spec}</div></td>
                                    <td className="p-2.5 border border-slate-800 text-center text-slate-400 font-mono">{line.item.unit}</td>
                                    <td className="p-2.5 border border-slate-800 font-bold text-amber-300 font-mono text-right">{line.formattedQty}</td>
                                    <td className="p-2.5 border border-slate-800 text-slate-400 font-mono text-right">{line.unitPrice.toLocaleString('vi-VN')} đ</td>
                                    <td className="p-2.5 border border-slate-800 text-emerald-300 font-mono text-right">{Math.round(line.materialAmount || 0).toLocaleString('vi-VN')} đ</td>
                                    <td className="p-2.5 border border-slate-800 text-amber-200 font-mono text-right">{Math.round(line.laborAmount || 0).toLocaleString('vi-VN')} đ</td>
                                    <td className="p-2.5 border border-slate-800 font-bold text-emerald-400 font-mono text-right">{line.formattedTotalAmount}</td>
                                    <td className="p-2.5 border border-slate-800 text-slate-300 text-[11px] italic">{line.item.clientExplanation}</td>
                                  </tr>
                                ))}
                                <tr className="bg-amber-950/40 font-black text-white">
                                  <td colSpan={7} className="p-3 border border-slate-700 text-right uppercase text-amber-300">
                                    TỔNG CỘNG DỰ TOÁN BÓC TÁCH (BOQ):
                                  </td>
                                  <td className="p-3 border border-slate-700 text-right font-mono text-sm text-yellow-300">
                                    {formattedTotalCostVND}
                                  </td>
                                  <td className="p-3 border border-slate-700 text-xs text-slate-400">
                                    Khái toán theo thị trường {regionalAdjustment.regionName} 2026
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* HARD-CODED TECHNICAL STANDARDS TABLE */}
                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <h3 className="text-sm sm:text-base font-black text-amber-400 uppercase tracking-tight flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> BẢNG TRA TIÊU CHUẨN KỸ THUẬT QUỐC GIA (TCVN/QCVN) CỐ ĐỊNH
                    </h3>

                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                      <table className="w-full text-left text-xs text-slate-200 border-collapse">
                        <thead className="bg-slate-800 text-amber-300 uppercase font-black">
                          <tr>
                            <th className="p-2.5 border border-slate-700">Hạng mục</th>
                            <th className="p-2.5 border border-slate-700">Tiêu chuẩn tham chiếu</th>
                            <th className="p-2.5 border border-slate-700">Ghi chú kỹ thuật</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-sans">
                          {TECHNICAL_STANDARDS_TABLE.map((std, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/60 transition">
                              <td className="p-2.5 border border-slate-800 font-bold text-white">{std.item}</td>
                              <td className="p-2.5 border border-slate-800 font-mono text-emerald-400 font-bold">{std.standardCode}</td>
                              <td className="p-2.5 border border-slate-800 text-slate-400 text-[11px]">{std.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* MATERIAL BRANDING PRINCIPLE DISCLAIMER */}
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-slate-300 space-y-2">
                    <h4 className="font-bold text-amber-300 uppercase">
                      NGUYÊN TẮC GHI THƯƠNG HIỆU VẬT TƯ (TRÁNH RỦI RO CAM KẾT NGẦM):
                    </h4>
                    <p className="leading-relaxed">
                      {MATERIAL_BRANDING_DISCLAIMER}
                    </p>
                  </div>

                </div>
              </div>

        </div>

        {/* FOOTER ACTION BAR */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Phương án hiện tại: <strong className="text-amber-300">{currentOption.name}</strong> ({currentOption.badge})
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition cursor-pointer text-xs"
          >
            Đóng Cửa Sổ
          </button>
        </div>

      </div>
    </div>
  );
};
