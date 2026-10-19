import React, { useEffect, useMemo, useState } from 'react';
import makerjs from 'makerjs';
import { Download, ShieldAlert, FileText } from 'lucide-react';
import { exportSvgToPdf } from '../lib/pdfExporter';
import { buildMassing, parseDimsWL } from '../lib/massingModel';
import { buildElevation, ELEV_VIEWS, ElevView } from '../lib/elevationFromMassing';
import { tx } from '../lib/i18nExtra';

/**
 * MẶT ĐỨNG & MẶT CẮT — dựng từ CHÍNH mô hình 3D (cùng mặt bằng, cùng cốt cao độ, cùng mái, cùng cửa).
 * 4 mặt đứng + 1 mặt cắt qua cầu thang. Tải PDF (5 trang) và DXF (mở bằng AutoCAD).
 */
interface ElevationViewerProps {
  dimensions?: string;
  floors?: number;
  constructionType?: string;
  rooms?: any;
  fengShuiAnalysis?: any;
  desiredDirection?: string;
  frontSetbackM?: number | string;
  backSetbackM?: number | string;
  roofType?: string;
  floorHeight1?: number | string;
  floorHeightUpper?: number | string;
  theme: string;
  lang: string;
  customerName?: string;
  onExportSvgDataUrl?: (dataUrl: string) => void;
}

export default function ElevationViewer({
  dimensions = '10x15', floors = 2, constructionType = 'Nhà phố', rooms, fengShuiAnalysis, desiredDirection,
  frontSetbackM, backSetbackM, roofType, floorHeight1, floorHeightUpper, theme, lang, customerName = 'Khách Hàng', onExportSvgDataUrl
}: ElevationViewerProps) {
  const [view, setView] = useState<ElevView>('front');
  const dark = theme === 'dark';
  const T = (v: string) => tx(lang, v);
  const { w, l } = parseDimsWL(dimensions);

  const built = useMemo(() => {
    try {
      const model = buildMassing({ widthM: w, lengthM: l, totalFloors: Math.max(1, floors || 1), rooms, fengShuiAnalysis, desiredDirection, frontSetbackM, backSetbackM, roofType: roofType || constructionType, floorHeight1, floorHeightUpper });
      const all = Object.fromEntries(ELEV_VIEWS.map(v => [v.key, buildElevation(model, v.key, { customerName })])) as Record<ElevView, ReturnType<typeof buildElevation>>;
      return { model, all, error: '' };
    } catch (e: any) {
      return { model: null, all: null, error: 'Chưa dựng được mặt đứng: ' + String(e?.message || e) };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, l, floors, JSON.stringify(rooms || {}), desiredDirection, frontSetbackM, backSetbackM, roofType, floorHeight1, floorHeightUpper, constructionType, customerName, JSON.stringify(fengShuiAnalysis?.favorableDirections || [])]);

  const cur = built.all?.[view];

  // bản PDF tổng hợp dùng mặt đứng chính
  useEffect(() => {
    if (onExportSvgDataUrl && built.all) onExportSvgDataUrl(`data:image/svg+xml;utf8,${encodeURIComponent(built.all.front.svg)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [built]);

  const date = new Date().toLocaleDateString('vi-VN');
  const handleDownloadPDF = () => {
    if (!built.all) return;
    exportSvgToPdf(ELEV_VIEWS.map(v => built.all![v.key].svg), ELEV_VIEWS.map(v => built.all![v.key].title), `MatDung_MatCat_${customerName.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}.pdf`,
      `${customerName} - ${date} - Bản vẽ sơ bộ — cần kỹ sư Yohu kiểm tra trước khi thi công`);
  };
  const handleDownloadDXF = () => {
    if (!cur) return;
    try {
      const dxf = makerjs.exporter.toDXF(cur.maker, { units: makerjs.unitType.Millimeter } as any);
      const url = URL.createObjectURL(new Blob([dxf], { type: 'application/dxf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `${ELEV_VIEWS.find(v => v.key === view)!.label.replace(/\s+/g, '_')}_${customerName.replace(/\s+/g, '_')}.dxf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (err) {
      console.error('DXF elevation:', err);
      alert('Không xuất được file DXF. Vui lòng thử lại!');
    }
  };

  const btn = (on: boolean) => `px-3 py-2 rounded-lg text-xs font-bold cursor-pointer min-h-[40px] ${on ? 'bg-blue-600 text-white font-black shadow' : dark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`;
  const m = built.model;

  return (
    <div className={`mt-6 p-4 sm:p-5 rounded-2xl border ${dark ? 'bg-[#101524] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h4 className="text-sm font-black uppercase tracking-tight">🏛️ {T('Mặt đứng & Mặt cắt — dựng từ 3D')}</h4>
          <p className="text-[11px] text-slate-400">{m ? `${m.summary.join(' · ')}` : ''}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleDownloadPDF} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer min-h-[40px]">
            <FileText className="w-3.5 h-3.5" /> {T('Tải PDF (5 bản vẽ)')}
          </button>
          <button onClick={handleDownloadDXF} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer min-h-[40px]">
            <Download className="w-3.5 h-3.5" /> {T('Tải DXF bản đang xem')}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {ELEV_VIEWS.map(v => <button key={v.key} className={btn(view === v.key)} onClick={() => setView(v.key)}>{T(v.label)}</button>)}
      </div>

      <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-500 leading-relaxed">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <div>{lang === 'vi' ? <>Mặt đứng dựng tự động từ mặt bằng và 3D (cùng số tầng, cốt cao độ, mái, cửa). Là <b>bản vẽ sơ bộ</b> — chi tiết trang trí mặt tiền, vật liệu và kết cấu do KTS/kỹ sư Yohu hoàn thiện trước khi thi công.</> : T('Mặt đứng dựng tự động từ mặt bằng và 3D (cùng số tầng, cốt cao độ, mái, cửa). Là bản vẽ sơ bộ — chi tiết trang trí mặt tiền, vật liệu và kết cấu do KTS/kỹ sư Yohu hoàn thiện trước khi thi công.')}</div>
      </div>

      <div className="w-full rounded-xl border border-slate-300 bg-white overflow-auto">
        {built.error ? <div className="p-6 text-center text-sm text-amber-600">{built.error}</div>
          : cur && <div className="w-full [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[620px]" dangerouslySetInnerHTML={{ __html: cur.svg }} />}
      </div>
      {m && (
        <div className="mt-2 text-[11px] text-slate-400 leading-relaxed">
          💡 Cốt cao độ: {cur?.levels.map(x => `${x.label} ${x.y === 0 ? '±0.000' : '+' + x.y.toFixed(3)}`).join(' · ')}. Đổi số tầng, mái, phòng hoặc kích thước ở Bước B → mặt bằng, 3D và mặt đứng cập nhật cùng lúc.
        </div>
      )}
    </div>
  );
}
