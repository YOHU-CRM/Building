import React, { useEffect, useRef } from 'react';
import makerjs from 'makerjs';
import { Download, ShieldAlert, FileText } from 'lucide-react';
import { exportSvgToPdf } from '../lib/pdfExporter';

interface ElevationViewerProps {
  dimensions?: string;
  floors?: number;
  constructionType?: string;
  theme: string;
  lang: string;
  customerName?: string;
  onExportSvgDataUrl?: (dataUrl: string) => void;
}

export default function ElevationViewer({
  dimensions = "10x15",
  floors = 2,
  constructionType = "Nhà phố",
  theme,
  lang,
  customerName = "Khách Hàng",
  onExportSvgDataUrl
}: ElevationViewerProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Parse dimensions e.g. "10x15" -> width = 10m, length = 15m (use width/shorter side for elevation width)
  const parseDimensions = (dimStr: string) => {
    if (!dimStr) return { w: 10, l: 15 };
    const clean = dimStr.toLowerCase().replace(/m2|m²/g, '').trim();
    if (clean.includes('x')) {
      const parts = clean.split('x');
      const w = parseFloat(parts[0]) || 10;
      const l = parseFloat(parts[1]) || 15;
      return { w: Math.min(w, l), l: Math.max(w, l) };
    }
    const area = parseFloat(clean) || 150;
    const side = Math.round(Math.sqrt(area));
    return { w: side, l: side * 1.5 };
  };

  const { w: widthM } = parseDimensions(dimensions);
  const totalFloors = Math.max(1, floors || 1);
  const isPitchedRoof = constructionType?.toLowerCase().includes('mái ngói') || constructionType?.toLowerCase().includes('ngói');

  // Generate MakerJS model for Elevation (Mặt cắt đứng)
  const generateElevationModel = (numFloors: number, wM: number, pitched: boolean) => {
    const model: makerjs.IModel = {
      models: {},
      paths: {}
    };

    const widthMm = wM * 1000;
    const foundationH = 500; // mm
    const floorH = 3300; // mm per floor
    const totalBuildingH = foundationH + numFloors * floorH;

    // 1. Foundation block
    model.models['foundation'] = new makerjs.models.Rectangle(widthMm, foundationH);

    // 2. Floors structure
    for (let i = 0; i < numFloors; i++) {
      const yPos = foundationH + i * floorH;
      const floorRect = new makerjs.models.Rectangle(widthMm, floorH);
      floorRect.origin = [0, yPos];
      model.models[`floor_${i + 1}`] = floorRect;

      // Floor slab line
      if (i > 0) {
        model.paths[`slab_${i}`] = new makerjs.paths.Line([0, yPos], [widthMm, yPos]);
      }

      // Stairs schematic line if multi-floor
      if (numFloors > 1 && i < numFloors - 1) {
        const stairX1 = widthMm * 0.3;
        const stairY1 = yPos + 300;
        const stairX2 = widthMm * 0.7;
        const stairY2 = yPos + floorH - 300;
        model.paths[`stair_diag_${i + 1}`] = new makerjs.paths.Line([stairX1, stairY1], [stairX2, stairY2]);
      }
    }

    // 3. Roof structure
    const roofY = totalBuildingH;
    if (pitched) {
      // Pitched roof (mái ngói ~30 deg, height ~2500mm)
      const roofPeakH = 2500;
      const peakX = widthMm / 2;
      const peakY = roofY + roofPeakH;

      model.paths['roof_left'] = new makerjs.paths.Line([0, roofY], [peakX, peakY]);
      model.paths['roof_right'] = new makerjs.paths.Line([widthMm, roofY], [peakX, peakY]);
      model.paths['roof_base'] = new makerjs.paths.Line([0, roofY], [widthMm, roofY]);
    } else {
      // Flat roof with parapet wall (~1000mm)
      const parapetH = 1000;
      model.paths['parapet_left'] = new makerjs.paths.Line([0, roofY], [0, roofY + parapetH]);
      model.paths['parapet_right'] = new makerjs.paths.Line([widthMm, roofY], [widthMm, roofY + parapetH]);
      model.paths['parapet_top'] = new makerjs.paths.Line([0, roofY + parapetH], [widthMm, roofY + parapetH]);
    }

    return model;
  };

  const model = generateElevationModel(totalFloors, widthM, isPitchedRoof);
  const svgString = makerjs.exporter.toSVG(model, {
    units: makerjs.unitType.Millimeter,
    viewBox: true,
    strokeWidth: 4
  } as any);

  // Export SVG to PDF
  // This button is for single-page elevation export, but for multi-page,
  // we will call a central export function from App.tsx
  const handleDownloadPDF = () => {
    if (svgContainerRef.current) {
      const svgElement = svgContainerRef.current.querySelector('svg');
      if (svgElement) {
        const date = new Date().toLocaleDateString('vi-VN');
        const footerText = `${customerName} - ${date} - Bản vẽ sơ bộ — cần kỹ sư Yohu kiểm tra trước khi thi công`;
        const filename = `MatCatDung_${customerName.replace(/\s+/g, '_')}_${date}.pdf`;
        exportSvgToPdf([svgElement], ["Mặt cắt đứng"], filename, footerText);
      }
    }
  };

  // Export to DXF string
  const handleDownloadDXF = () => {
    try {
      const dxfString = makerjs.exporter.toDXF(model, { units: makerjs.unitType.Millimeter } as any);
      const blob = new Blob([dxfString], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Mat_Cat_Dung_${constructionType.replace(/\s+/g, '_')}_${totalFloors}T_${widthM}m.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export DXF (Elevation):", err);
      alert("Không thể xuất file DXF mặt cắt đứng. Vui lòng thử lại!");
    }
  };

  // Export SVG data URL for PDF
  useEffect(() => {
    if (onExportSvgDataUrl && svgString) {
      const encoded = encodeURIComponent(svgString);
      const dataUrl = `data:image/svg+xml;utf8,${encoded}`;
      onExportSvgDataUrl(dataUrl);
    }
  }, [svgString]);

  return (
    <div className={`mt-6 p-5 rounded-2xl border ${theme === 'dark' ? 'bg-[#101524] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}>
      
      {/* Title & Badge */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-md">
            🏛️
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight">
              {lang === 'vi' ? "Mặt Cắt Đứng & Chiều Cao (Elevation DXF)" : "Elevation & Vertical Heights (DXF)"}
            </h4>
            <p className="text-[11px] text-slate-400">
              {totalFloors} {lang === 'vi' ? "tầng" : "floors"} · {isPitchedRoof ? "Mái ngói (Pitched Roof)" : "Mái bằng (Flat Roof)"} · Cao ~{(0.5 + totalFloors * 3.3).toFixed(1)}m
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            {lang === 'vi' ? "Tải PDF" : "Download PDF"}
          </button>
          <button
            onClick={handleDownloadDXF}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            {lang === 'vi' ? "Tải file .DXF Mặt Cắt" : "Download Elevation .DXF"}
          </button>
        </div>
      </div>

      {/* WARNING NOTE MANDATE */}
      <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-300 font-sans leading-relaxed">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <b>{lang === 'vi' ? "Lưu ý quan trọng:" : "Important Note:"}</b>{" "}
          {lang === 'vi' 
            ? "Đây là bản vẽ mặt cắt sơ bộ do AI hỗ trợ, cần kỹ sư có chứng chỉ hành nghề của Yohu kiểm tra trước khi thi công thực tế — không phải bản vẽ thi công cuối cùng."
            : "This is a preliminary AI-assisted elevation drawing and must be reviewed by a certified Yohu engineer before actual construction."}
        </div>
      </div>

      {/* SVG Render Container */}
      <div 
        ref={svgContainerRef}
        className={`w-full h-[320px] rounded-xl border flex items-center justify-center overflow-hidden p-4 relative ${
          theme === 'dark' ? 'bg-[#080d1a] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div 
          className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:stroke-blue-400 [&>svg]:fill-none"
          dangerouslySetInnerHTML={{ __html: svgString }}
        />
        <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-slate-950/80 text-[10px] text-slate-300 font-mono border border-slate-800">
          Elevation Scale 1:100 · MakerJS Engine
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>💡 {lang === 'vi' ? "Hiển thị chiều cao tầng chuẩn 3.3m và kết cấu mái." : "Displays standard 3.3m floor heights and roof structure."}</span>
        <span className="text-blue-400 font-bold">✔ {lang === 'vi' ? "Đã tối ưu chuẩn DXF" : "DXF Optimized"}</span>
      </div>

    </div>
  );
}
