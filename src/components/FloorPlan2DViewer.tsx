import React, { useEffect, useRef, useState } from 'react';
import makerjs from 'makerjs';
import { Download, Layers, ShieldAlert, FileText, Eye, Compass } from 'lucide-react';
import { exportSvgToPdf } from '../lib/pdfExporter';
import { tinhQuyTacPhongThuyPhong } from '../lib/fengshuiRoomRules';
import { generateArchitecturalFloorPlanSvg } from '../lib/architecturalFloorPlan';
import { planFloor } from '../lib/architectPlanner';

interface FloorPlan2DViewerProps {
  dimensions?: string;
  floors?: number;
  constructionType?: string;
  rooms?: any; // Should ideally be properly typed
  theme: string;
  lang: string;
  customerName?: string;
  onExportSvgDataUrl?: (dataUrl: string) => void;
  elevationSvgElement?: SVGElement | null;
  fengShuiAnalysis?: any;
  desiredDirection?: string;
  frontSetbackM?: number | string;
  backSetbackM?: number | string;
  /** đổi giữa "Theo ý gia chủ" và "Theo đề xuất KTS" (lưu vào rooms.applyAdvice) */
  onToggleAdvice?: (apply: boolean) => void;
}

export default function FloorPlan2DViewer({
  dimensions = "10x15",
  floors = 1,
  constructionType = "Nhà phố",
  rooms,
  theme,
  lang,
  customerName = "Khách Hàng",
  onExportSvgDataUrl,
  elevationSvgElement,
  fengShuiAnalysis,
  desiredDirection,
  frontSetbackM,
  backSetbackM,
  onToggleAdvice
}: FloorPlan2DViewerProps) {
  const houseFacing = desiredDirection || fengShuiAnalysis?.directionVerdict?.direction || "Nam";
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const [showFurniture, setShowFurniture] = useState(true); // Default to showing furniture for clarity
  const [viewStyle, setViewStyle] = useState<'architectural' | 'cad'>('architectural');
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Parse dimensions e.g. "10x15" -> width = 10m, length = 15m
  const parseDimensions = (dimStr: string) => {
    if (!dimStr) return { w: 10, l: 15 };
    const clean = dimStr.toLowerCase().replace(/m2|m²/g, '').trim();
    if (clean.includes('x')) {
      const parts = clean.split('x');
      const w = parseFloat(parts[0]) || 10;
      const l = parseFloat(parts[1]) || 15;
      return { w, l };
    }
    const area = parseFloat(clean) || 150;
    const side = Math.round(Math.sqrt(area));
    return { w: side, l: side * 1.5 };
  };

  const { w: widthM, l: lengthM } = parseDimensions(dimensions);
  const totalFloors = Math.max(1, floors || 1);

  // Feng Shui Rules
  const quyTacPhongThuy = fengShuiAnalysis ? tinhQuyTacPhongThuyPhong(fengShuiAnalysis, "Nam") : null;

  // Generate MakerJS model for current floor (for DXF export & CAD wireframe mode)
  // Mô hình CAD/DXF lấy CHUNG dữ liệu với bản vẽ kiến trúc (planFloor) — đơn vị mm, có layer & chữ
  const generateFloorPlanModel = (floorIdx: number, wM: number, lM: number, furniture: boolean, roomsData: any, _rules: any) => {
    const plan = planFloor({
      widthM: wM, lengthM: lM, floor: floorIdx, totalFloors,
      desiredDirection: houseFacing, frontSetbackM, backSetbackM, fengShuiAnalysis, rooms: roomsData,
      requestedBedrooms: roomsData?.bedroomCount, requestedBathrooms: roomsData?.bathroomCount
    });
    const mm = (m: number) => Math.round(m * 1000);
    const oy = plan.frontSetbackM; // đưa sân trước về y = 0
    const model: makerjs.IModel = { models: {}, paths: {} };
    const layerOf: Record<string, string> = { wc: 'WC', stair: 'CAU_THANG', lightwell: 'GIENG_TROI', corridor: 'HANH_LANG', yard: 'SAN', balcony: 'SAN', terrace: 'SAN', porch: 'SAN', walkway: 'SAN', garden: 'SAN', pond: 'SAN', well: 'SAN', outkitchen: 'BEP_PHU' };

    // Ranh đất & tường bao
    // Nhà phố: ranh đất = rộng × dài khách nhập. Phác thảo tự do (nhà vườn): ranh theo sân vườn quanh nhà
    const lotR = plan.lot || { x: 0, y: -plan.frontSetbackM, w: wM, h: lM };
    const lot = new makerjs.models.Rectangle(mm(lotR.w), mm(lotR.h)); lot.origin = [mm(lotR.x), mm(lotR.y + oy)]; (lot as any).layer = 'RANH_DAT';
    model.models!['RANH_DAT'] = lot;
    const shell = new makerjs.models.Rectangle(mm(plan.widthM), mm(plan.houseLengthM)); shell.origin = [0, mm(oy)]; (shell as any).layer = 'TUONG_BAO';
    model.models!['TUONG_BAO'] = shell;

    plan.rooms.forEach((r, i) => {
      const rect = new makerjs.models.Rectangle(mm(r.w), mm(r.h));
      rect.origin = [mm(r.x), mm(r.y + oy)];
      (rect as any).layer = layerOf[r.type] || 'PHONG';
      if (r.name) {
        const cx = mm(r.w / 2), cy = mm(r.h / 2);
        (rect as any).caption = { text: `${r.name} ${(r.w * r.h).toFixed(1)}m2`, anchor: new makerjs.paths.Line([cx - 600, cy], [cx + 600, cy]) };
      }
      model.models![`P_${i}_${r.id}`] = rect;
      if (r.type === 'stair') {
        const steps = Math.max(6, Math.round(r.h / 0.27));
        for (let k = 1; k < steps; k++) {
          const yy = mm(r.y + oy) + Math.round(mm(r.h) * k / steps);
          const ln = new makerjs.paths.Line([mm(r.x), yy], [mm(r.x + r.w), yy]); (ln as any).layer = 'CAU_THANG';
          model.paths![`BAC_${k}`] = ln;
        }
      }
      if (furniture) r.items.forEach((it, j) => {
        const f = new makerjs.models.Rectangle(Math.max(50, mm(it.w)), Math.max(50, mm(it.h)));
        f.origin = [mm(it.x), mm(it.y + oy)];
        (f as any).layer = 'NOI_THAT';
        model.models![`NT_${i}_${j}`] = f;
      });
      r.doors.forEach((d, j) => {
        // vạch cửa đi trên tường
        const horiz = d.side === 'front' || d.side === 'rear';
        const x0 = horiz ? mm(r.x + d.at) : mm(d.side === 'left' ? r.x : r.x + r.w);
        const y0 = horiz ? mm((d.side === 'front' ? r.y : r.y + r.h) + oy) : mm(r.y + oy + d.at);
        const ln = horiz ? new makerjs.paths.Line([x0, y0], [x0 + mm(d.width), y0]) : new makerjs.paths.Line([x0, y0], [x0, y0 + mm(d.width)]);
        (ln as any).layer = 'CUA';
        model.paths![`CUA_${i}_${j}`] = ln;
      });
    });
    return model;
  };

  // 1. Generate CAD wireframe SVG via MakerJS
  const activeModel = generateFloorPlanModel(activeFloor, widthM, lengthM, showFurniture, rooms, quyTacPhongThuy);
  const cadSvgString = makerjs.exporter.toSVG(activeModel, { units: makerjs.unitType.Millimeter, viewBox: true, strokeWidth: 4 } as any);

  // 2. Generate Human-Readable Architectural SVG (with colors, dimensions, room names, title block)
  const architecturalSvgString = generateArchitecturalFloorPlanSvg({
    widthM,
    lengthM,
    floor: activeFloor,
    totalFloors,
    constructionType,
    customerName,
    showFurniture,
    desiredDirection: houseFacing, frontSetbackM, backSetbackM,
    fengShuiAnalysis,
    rooms,
    requestedBedrooms: rooms?.bedroomCount,
    requestedBathrooms: rooms?.bathroomCount
  });

  // Choose display SVG string based on viewStyle
  const displaySvgString = viewStyle === 'architectural' ? architecturalSvgString : cadSvgString;

  const handleDownloadPDF = async () => {
    try {
      const svgSources: string[] = [];
      const titles: string[] = [];
      
      // Gather all architectural floor plans
      for (let i = 1; i <= totalFloors; i++) {
        const floorSvg = generateArchitecturalFloorPlanSvg({
          widthM,
          lengthM,
          floor: i,
          totalFloors,
          constructionType,
          customerName,
          showFurniture: true,
          desiredDirection: houseFacing, frontSetbackM, backSetbackM,
          fengShuiAnalysis,
          rooms,
          requestedBedrooms: rooms?.bedroomCount,
          requestedBathrooms: rooms?.bathroomCount
        });
        svgSources.push(floorSvg);
        titles.push(`Bản Vẽ Mặt Bằng Kiến Trúc Tầng ${i}`);
      }
      
      // If elevation element exists, serialize and append
      if (elevationSvgElement) {
        const serializer = new XMLSerializer();
        const elevationStr = serializer.serializeToString(elevationSvgElement);
        svgSources.push(elevationStr);
        titles.push("Mặt Cắt Đứng & Chiều Cao Tầng");
      }

      const date = new Date().toLocaleDateString('vi-VN');
      const footerText = `${customerName} - ${date} - Bản vẽ kiến trúc sơ bộ Yohu Build AI`;
      const filename = `BanVe_KienTruc_${customerName.replace(/\s+/g, '_')}_${widthM}x${lengthM}m.pdf`;
      
      await exportSvgToPdf(svgSources, titles, filename, footerText);
    } catch (err) {
      console.error("PDF export error:", err);
      alert("Không thể tải PDF. Vui lòng thử lại!");
    }
  };

  const handleDownloadDXF = () => {
    try {
      const combinedModel: makerjs.IModel = { models: {} };
      for (let i = 1; i <= totalFloors; i++) {
        const floorModel = generateFloorPlanModel(i, widthM, lengthM, showFurniture, rooms, quyTacPhongThuy);
        floorModel.origin = [(i - 1) * Math.round((widthM + 3) * 1000), 0]; // mỗi tầng cách nhau 3m
        combinedModel.models[`TANG_${i}`] = floorModel;
      }
      
      const dxfString = makerjs.exporter.toDXF(combinedModel, { units: makerjs.unitType.Millimeter } as any);
      const blob = new Blob([dxfString], { type: 'application/dxf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${constructionType.replace(/\s+/g, '_')}_CAD_${widthM}x${lengthM}m.dxf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export DXF:", err);
      alert("Không thể xuất file DXF. Vui lòng thử lại!");
    }
  };

  useEffect(() => {
    if (onExportSvgDataUrl && architecturalSvgString) {
      const encoded = encodeURIComponent(architecturalSvgString);
      const dataUrl = `data:image/svg+xml;utf8,${encoded}`;
      onExportSvgDataUrl(dataUrl);
    }
  }, [architecturalSvgString, activeFloor, showFurniture]);

  return (
    <div className={`mt-6 p-5 sm:p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#101524] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}>
      
      {/* Title & Badge */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md text-lg">
            📐
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-black uppercase tracking-tight">
                {lang === 'vi' ? "Sơ Đồ Mặt Bằng Kiến Trúc & Công Năng 2D" : "Architectural 2D Floor Plan"}
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {viewStyle === 'architectural' ? 'Dễ đọc cho gia chủ' : 'Chuẩn DXF CAD'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {widthM}m x {lengthM}m ({widthM * lengthM} m²) · {totalFloors} {lang === 'vi' ? "tầng" : "floors"} · {constructionType}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Style Toggle: Architectural vs CAD */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewStyle('architectural')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                viewStyle === 'architectural'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Kiến trúc màu</span>
            </button>
            <button
              onClick={() => setViewStyle('cad')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                viewStyle === 'cad'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Nét CAD</span>
            </button>
          </div>

          <button
            onClick={() => setShowFurniture(!showFurniture)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              showFurniture ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {showFurniture 
              ? (lang === 'vi' ? "✓ Nội thất" : "✓ Furniture") 
              : (lang === 'vi' ? "+ Hiện nội thất" : "+ Furniture")}
          </button>

          {/* DOWNLOAD PDF BUTTON */}
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Tải bản vẽ A4 rõ ràng có đầy đủ tên phòng, kích thước, nội thất"
          >
            <FileText className="w-4 h-4 text-amber-300" />
            <span>{lang === 'vi' ? "Tải Bản Vẽ (PDF)" : "Download PDF Blueprint"}</span>
          </button>

          {/* DOWNLOAD DXF BUTTON */}
          <button
            onClick={handleDownloadDXF}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="Tải file cho kiến trúc sư mở trên AutoCAD / Revit"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.DXF (AutoCAD)</span>
          </button>
        </div>
      </div>

      {/* Bản vẽ theo ý gia chủ / theo đề xuất KTS */}
      {rooms?.sketchLayout && rooms.sketchLayout.co_phac_thao !== false && onToggleAdvice && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-400">Bản vẽ:</span>
          <button onClick={() => onToggleAdvice(false)} className={`px-3 py-2 rounded-lg font-bold cursor-pointer min-h-[40px] ${!rooms.applyAdvice ? 'bg-amber-500 text-slate-950' : theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>✍️ Theo ý gia chủ (phác thảo)</button>
          <button onClick={() => onToggleAdvice(true)} className={`px-3 py-2 rounded-lg font-bold cursor-pointer min-h-[40px] ${rooms.applyAdvice ? 'bg-blue-600 text-white' : theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>🧭 Theo đề xuất kiến trúc sư</button>
          <span className="text-slate-400">Đề xuất nằm ở mục <b>TƯ VẤN KTS</b> trên bản vẽ; gia chủ quyết định có áp dụng hay không.</span>
        </div>
      )}

      {/* INFORMATIVE NOTICE */}
      <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-300 font-sans leading-relaxed">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <b>{lang === 'vi' ? "Bản vẽ trực quan dành cho gia chủ:" : "Homeowner friendly drawing:"}</b>{" "}
          {lang === 'vi' 
            ? "Mặt bằng đã được tô màu phân khu, ghi chú rõ diện tích từng phòng, khoảng lùi đón gió và hướng phong thủy cát lợi. Khi bấm \"Tải Bản Vẽ (PDF)\", bạn sẽ nhận được bản in A4 sắc nét đầy đủ khung tên kỹ thuật."
            : "The floor plan is color-coded with room dimensions, ventilation setbacks, and Feng Shui orientation. Click \"Download PDF Blueprint\" to get a crisp A4 printable sheet."}
        </div>
      </div>

      {/* Multi-floor tabs if totalFloors > 1 */}
      {totalFloors > 1 && (
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          {Array.from({ length: totalFloors }, (_, i) => i + 1).map((floorNum) => (
            <button
              key={floorNum}
              onClick={() => setActiveFloor(floorNum)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeFloor === floorNum 
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                  : theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {lang === 'vi' ? `Mặt Bằng Tầng ${floorNum}` : `Floor ${floorNum}`}
            </button>
          ))}
        </div>
      )}

      {/* SVG Render Container */}
      <div 
        ref={svgContainerRef}
        className={`w-full h-[520px] rounded-xl border flex items-center justify-center overflow-hidden p-2 relative ${
          theme === 'dark' ? 'bg-[#080d1a] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {viewStyle === 'architectural' ? (
          <div 
            className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto shadow-inner"
            dangerouslySetInnerHTML={{ __html: architecturalSvgString }}
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:stroke-amber-400 [&>svg]:fill-none"
            dangerouslySetInnerHTML={{ __html: cadSvgString }}
          />
        )}
        <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-slate-950/85 text-[10px] text-slate-200 font-mono border border-slate-700 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Tỉ lệ 1:100 · {viewStyle === 'architectural' ? 'Bản vẽ Kiến Trúc Sắc Nét' : 'MakerJS DXF Wireframe'}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
        <span className="flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          {lang === 'vi' ? (fengShuiAnalysis ? "Bố trí có xét cung mệnh gia chủ (xem mục Phong thủy bố trí trên bản vẽ)." : "Chưa có dữ liệu cung mệnh — bố trí theo công năng.") : "Layout notes on the drawing."}
        </span>
        <span className="text-emerald-500 font-bold">{lang === 'vi' ? "Bản vẽ sơ bộ phục vụ tư vấn — KTS lập hồ sơ kỹ thuật trước khi thi công" : "Preliminary drawing for consultation"}</span>
      </div>

    </div>
  );
}

