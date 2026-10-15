import React, { useState } from "react";
import { Upload, FileText, Sparkles, AlertTriangle, CheckCircle, X } from "lucide-react";
import { translations, getTranslation } from "../translations";

interface ProjectIntakeUploaderProps {
  onApplyData: (data: any) => void;
  theme?: string;
  lang?: "vi" | "en" | "lo" | "zh";
}

export const ProjectIntakeUploader: React.FC<ProjectIntakeUploaderProps> = ({
  onApplyData,
  theme = "dark",
  lang = "vi"
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const tLang = getTranslation(lang as any);
  const it = tLang.intake;
  const structOpts = tLang.mainStructureOptions;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (files.length === 0 && !description.trim()) {
      setErrorMsg(it.errNoInput || "Vui lòng tải lên ít nhất 1 file hoặc nhập mô tả văn bản.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("description", description);
      formData.append("lang", lang);

      const res = await fetch("/api/extract-project-info", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || (lang === 'vi' ? "Lỗi phân tích từ AI." : "AI analysis error."));
      }

      setExtractedData(json.data);
      setWarnings(json.data.canh_bao || []);
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'vi' ? "Không thể phân tích dữ liệu công trình." : "Failed to analyze project data."));
    } finally {
      setLoading(false);
    }
  };

  const handleChangeField = (field: string, value: any) => {
    setExtractedData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => {
    if (extractedData) {
      onApplyData(extractedData);
      setExtractedData(null);
      setFiles([]);
      setDescription("");
    }
  };

  return (
    <div className={`p-4 sm:p-6 rounded-2xl border mb-6 transition-all shadow-md ${
      theme === 'dark' ? 'bg-[#121829] border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
        <h3 className="text-base sm:text-lg font-black tracking-tight">
          {it.title || '⚡ Trích Xuất Hồ Sơ Yêu Cầu Dự Án Bằng AI'}
        </h3>
      </div>
      <p className="text-xs sm:text-sm text-slate-400 mb-4 leading-relaxed">
        {it.sub || 'Tải lên ảnh sổ đỏ, ảnh bản vẽ kỹ thuật, file PDF hoặc gõ mô tả tự do bên dưới. AI sẽ tự động điền form cho bạn!'}
      </p>

      {!extractedData ? (
        <div className="space-y-4">
          {/* File Dropzone */}
          <div className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition cursor-pointer relative ${
            theme === 'dark' ? 'border-slate-700 hover:border-amber-500 bg-[#0c101d]' : 'border-slate-300 hover:border-amber-600 bg-white'
          }`}>
            <input 
              type="file" 
              multiple 
              accept="image/*,.pdf" 
              onChange={handleFileChange} 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center space-y-2.5">
              <Upload className="w-9 h-9 sm:w-10 sm:h-10 text-amber-400" />
              <div className="text-sm sm:text-base font-extrabold leading-snug">
                {it.dropzone || 'Kéo thả file vào đây hoặc bấm để chọn (Ảnh Sổ đỏ, Bản vẽ, PDF)'}
              </div>
              <span className="text-xs sm:text-sm text-slate-400 font-medium">{it.dropzoneHint || 'Hỗ trợ JPG, PNG, PDF (Có thể chọn nhiều file)'}</span>
            </div>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-xs sm:text-sm text-slate-200 border border-slate-700">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button type="button" onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text Description */}
          <div>
            <label className="block text-sm sm:text-base font-extrabold mb-2 text-slate-200">
              {it.textLabel || 'Hoặc mô tả công trình bằng lời (tự do):'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={it.textPlaceholder || 'Ví dụ: Nhà phố 3 tầng, diện tích 5x18m, hướng Đông Nam, xây khung thép Cemboard...'}
              rows={4}
              className={`w-full p-3.5 sm:p-4 rounded-xl text-sm sm:text-base leading-relaxed border focus:outline-none focus:border-amber-500 resize-none ${
                theme === 'dark' ? 'bg-[#0c101d] text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-slate-300'
              }`}
            />
          </div>

          {errorMsg && <div className="text-xs sm:text-sm font-bold text-red-400">{errorMsg}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 text-white font-black text-sm sm:text-base shadow-lg hover:opacity-90 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{it.btnAnalyzing || 'AI đang phân tích tài liệu...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{it.btnAnalyze || 'Phân tích tự động bằng AI'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{it.successMsg || 'AI đã trích xuất thành công! Vui lòng rà soát lại thông tin bên dưới và sửa nếu cần trước khi xác nhận.'}</span>
          </div>

          {warnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{it.warningsTitle || 'Cảnh báo AI (cần kiểm tra kỹ các ô này):'}</span>
              </div>
              <ul className="list-disc list-inside pl-1 text-xs">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Editable Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-400 mb-1">{it.clientName || 'Họ và tên chủ đầu tư'}</label>
              <input
                type="text"
                value={extractedData.ho_ten || ""}
                onChange={(e) => handleChangeField("ho_ten", e.target.value)}
                className={`w-full p-3 sm:p-3.5 rounded-lg border text-sm sm:text-base font-bold ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-400 mb-1">{it.phone || 'Số điện thoại'}</label>
              <input
                type="text"
                value={extractedData.so_dt || ""}
                onChange={(e) => handleChangeField("so_dt", e.target.value)}
                className={`w-full p-3 sm:p-3.5 rounded-lg border text-sm sm:text-base font-bold ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-400 mb-1">{it.address || 'Địa chỉ khu đất'}</label>
              <input
                type="text"
                value={extractedData.dia_chi || ""}
                onChange={(e) => handleChangeField("dia_chi", e.target.value)}
                className={`w-full p-3 sm:p-3.5 rounded-lg border text-sm sm:text-base font-bold ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-400 mb-1">{it.constructionType || 'Loại công trình'}</label>
              <input
                type="text"
                value={extractedData.loai_ct || ""}
                onChange={(e) => handleChangeField("loai_ct", e.target.value)}
                className={`w-full p-3 sm:p-3.5 rounded-lg border text-sm sm:text-base font-bold ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-400 mb-1">{it.dimensions || 'Diện tích / Kích thước'}</label>
              <input
                type="text"
                value={extractedData.dien_tich || ""}
                onChange={(e) => handleChangeField("dien_tich", e.target.value)}
                className={`w-full p-3 sm:p-3.5 rounded-lg border text-sm sm:text-base font-bold ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-400 mb-1">{it.floors || 'Số tầng'}</label>
              <input
                type="number"
                value={extractedData.so_tang || 1}
                onChange={(e) => handleChangeField("so_tang", Number(e.target.value))}
                className={`w-full p-3 sm:p-3.5 rounded-lg border text-sm sm:text-base font-bold ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-400 mb-1">{it.direction || 'Hướng nhà / Đất'}</label>
              <input
                type="text"
                value={extractedData.huong_muon || ""}
                onChange={(e) => handleChangeField("huong_muon", e.target.value)}
                className={`w-full p-3 sm:p-3.5 rounded-lg border text-sm sm:text-base font-bold ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-400 mb-1">{it.primaryStructure || 'Loại kết cấu chính'}</label>
              <select
                value={extractedData.loai_ket_cau_chinh || "Bê tông cốt thép truyền thống"}
                onChange={(e) => handleChangeField("loai_ket_cau_chinh", e.target.value)}
                className={`w-full p-3 sm:p-3.5 rounded-lg border text-sm sm:text-base font-bold ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              >
                <option value="Bê tông cốt thép truyền thống">{structOpts.traditional || "Bê tông cốt thép truyền thống"}</option>
                <option value="Khung thép tiền chế + Cemboard">{structOpts.steelCemboard || "Khung thép tiền chế + Cemboard"}</option>
                <option value="Bê tông nhẹ EPS đúc liền khối & Gông 3D">{structOpts.epsMonolithic || "Bê tông nhẹ EPS đúc liền khối & Gông 3D"}</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-400 mb-1">{it.frontages || 'Số mặt tiền'}</label>
              <input
                type="number"
                value={extractedData.so_mat_tien || 1}
                onChange={(e) => handleChangeField("so_mat_tien", Number(e.target.value))}
                className={`w-full p-3 sm:p-3.5 rounded-lg border text-sm sm:text-base font-bold ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
              />
            </div>
          </div>

          {/* PHIẾU YÊU CẦU BỔ SUNG: đất, nền, phòng, phác thảo — khách xác nhận trước khi vẽ & tính giá */}
          {(() => {
            const conf = extractedData.do_tin_cay || {};
            const low = (k: string) => typeof conf[k] === 'number' && conf[k] < 0.7;
            const inCls = (k?: string) => `w-full p-3 rounded-lg border text-sm font-bold ${k && low(k) ? 'border-amber-500 ring-1 ring-amber-500/40' : ''} ${theme === 'dark' ? 'bg-[#0c101d] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`;
            const kd = extractedData.kich_thuoc_dat || {};
            const setKd = (f: string, v: any) => handleChangeField('kich_thuoc_dat', { ...kd, [f]: v });
            const kn = extractedData.kich_thuoc_nha || {};
            const setKn = (f: string, v: any) => handleChangeField('kich_thuoc_nha', { ...kn, [f]: v });
            const sk = extractedData.bo_tri_phac_thao || {};
            const LOAI: Record<string, string> = { khach: 'Phòng khách', an: 'Phòng ăn', bep: 'Bếp', ngu: 'P. ngủ', wc: 'WC', tho: 'Phòng thờ', gara: 'Gara', sinh_hoat: 'Sinh hoạt chung', gieng_troi: 'Giếng trời', san: 'Sân', kho: 'Kho', lam_viec: 'Làm việc', doc_sach: 'Đọc sách', sanh: 'Sảnh', hanh_lang: 'Hành lang', hien: 'Hiên', thang: 'Cầu thang' };
            const VT: Record<string, string> = { truoc: 'trước', giua: 'giữa', sau: 'sau' };
            const BEN: Record<string, string> = { trai: 'trái', phai: 'phải', ca_ngang: 'cả ngang' };
            const hasSketch = Array.isArray(sk.tang) && sk.tang.some((t: any) => (t.phong || []).length);
            const shapeNote = kd.hinh_dang === 'no_hau' ? 'Đất nở hậu' : kd.hinh_dang === 'top_hau' ? 'Đất tóp hậu' : kd.hinh_dang === 'meo' ? 'Đất méo' : '';
            return (
              <div className={`p-3.5 rounded-xl border space-y-3 text-xs sm:text-sm ${theme === 'dark' ? 'border-slate-700 bg-[#0c101d]/60' : 'border-slate-200 bg-white'}`}>
                <div className="font-black text-amber-500">📋 Phiếu yêu cầu thiết kế — ô viền vàng là chỗ AI chưa chắc, anh/chị kiểm tra giúp</div>
                <div className="text-slate-400">Thứ tự tool làm theo: <b>1. mô tả & các ô anh/chị điền</b> → 2. sổ đỏ → 3. ảnh / bản vẽ tay (chỉ tham chiếu bố trí và kiểu dáng).</div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div><label className="block font-bold text-slate-400 mb-1">🏠 Nhà xây — chiều ngang (m)</label>
                    <input className={inCls()} inputMode="decimal" value={kn.rong ?? ''} onChange={e => setKn('rong', e.target.value)} /></div>
                  <div><label className="block font-bold text-slate-400 mb-1">🏠 Nhà xây — chiều sâu (m)</label>
                    <input className={inCls()} inputMode="decimal" value={kn.dai ?? ''} onChange={e => setKn('dai', e.target.value)} /></div>
                </div>
                <div className="text-slate-400 font-bold">📜 Thửa đất theo sổ đỏ (không bắt buộc — chỉ để tính khoảng lùi, mật độ):</div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div><label className="block font-bold text-slate-400 mb-1">Rộng mặt tiền (m)</label>
                    <input className={inCls('kich_thuoc_dat')} inputMode="decimal" value={kd.rong_truoc ?? ''} onChange={e => setKd('rong_truoc', e.target.value)} /></div>
                  <div><label className="block font-bold text-slate-400 mb-1">Rộng cuối đất (m)</label>
                    <input className={inCls('kich_thuoc_dat')} inputMode="decimal" value={kd.rong_sau ?? ''} onChange={e => setKd('rong_sau', e.target.value)} /></div>
                  <div><label className="block font-bold text-slate-400 mb-1">Chiều dài đất (m)</label>
                    <input className={inCls('kich_thuoc_dat')} inputMode="decimal" value={kd.dai ?? ''} onChange={e => setKd('dai', e.target.value)} /></div>
                </div>
                {(() => {
                  // Chỗ chưa khớp giữa mô tả / ô nhập và ảnh → hỏi lại gia chủ (tool không tự đoán)
                  const skp = (Array.isArray(sk.tang) ? sk.tang : []).flatMap((t: any) => t.phong || []);
                  const c = (l: string) => skp.filter((r: any) => r.loai === l).length;
                  const q: string[] = [];
                  const nr = parseFloat(String(kn.rong ?? '')), nd = parseFloat(String(kn.dai ?? ''));
                  const br = parseFloat(String(sk.nha?.rong ?? '')), bd = parseFloat(String(sk.nha?.sau ?? ''));
                  if (nr > 0 && br > 0 && Math.abs(nr - br) > 0.3) q.push(`Chiều ngang nhà: ô nhập ${nr}m, bản vẽ tay ghi ${br}m → tool dùng ${nr}m.`);
                  if (nd > 0 && bd > 0 && Math.abs(nd - bd) > 0.3) q.push(`Chiều sâu nhà: ô nhập ${nd}m, bản vẽ tay ghi ${bd}m → tool dùng ${nd}m.`);
                  if (!(nr > 0 && nd > 0)) q.push('Chưa có kích thước NHÀ XÂY (ngang × sâu) — anh/chị điền để tool vẽ và tính giá đúng.');
                  if (skp.length && Number(extractedData.so_phong_ngu) > 0 && Number(extractedData.so_phong_ngu) !== c('ngu')) q.push(`Số phòng ngủ: ô nhập ${extractedData.so_phong_ngu}, bản vẽ tay ${c('ngu')}.`);
                  if (skp.length && Number(extractedData.so_wc) > 0 && Number(extractedData.so_wc) !== c('wc')) q.push(`Số WC: ô nhập ${extractedData.so_wc}, bản vẽ tay ${c('wc')}.`);
                  if (skp.length && !!extractedData.phong_tho !== (c('tho') > 0)) q.push(`Phòng thờ: ô nhập ${extractedData.phong_tho ? 'có' : 'không'}, bản vẽ tay ${c('tho') ? 'có' : 'không'}.`);
                  (Array.isArray(extractedData.canh_bao) ? extractedData.canh_bao : []).slice(0, 4).forEach((w: any) => q.push(String(w)));
                  return q.length ? (
                    <div className="rounded-lg p-3 border border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300">
                      <div className="font-black mb-1">❓ Cần anh/chị xác nhận trước khi tool vẽ & tính giá:</div>
                      <ul className="list-disc pl-5 space-y-0.5">{q.map((x, i) => <li key={i}>{x}</li>)}</ul>
                    </div>
                  ) : null;
                })()}
                {shapeNote && <div className="text-amber-500">⚠️ {shapeNote}: bản vẽ & dự toán dùng bề rộng trung bình. Kiến trúc sư sẽ xử lý phần đất lệch khi thiết kế chi tiết.</div>}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div><label className="block font-bold text-slate-400 mb-1">Loại đất</label>
                    <select className={inCls()} value={extractedData.loai_dat || 'chua_biet'} onChange={e => handleChangeField('loai_dat', e.target.value)}>
                      <option value="chua_biet">Chưa biết</option><option value="tot">Đất tốt</option><option value="yeu">Đất yếu / ao lấp</option><option value="cat">Đất cát</option>
                    </select></div>
                  <div><label className="block font-bold text-slate-400 mb-1">Số phòng ngủ</label>
                    <input type="number" min={0} className={inCls()} value={extractedData.so_phong_ngu || ''} onChange={e => handleChangeField('so_phong_ngu', Number(e.target.value))} /></div>
                  <div><label className="block font-bold text-slate-400 mb-1">Số WC</label>
                    <input type="number" min={0} className={inCls()} value={extractedData.so_wc || ''} onChange={e => handleChangeField('so_wc', Number(e.target.value))} /></div>
                  <div><label className="block font-bold text-slate-400 mb-1">Gara</label>
                    <select className={inCls()} value={extractedData.gara || 'xe_may'} onChange={e => handleChangeField('gara', e.target.value)}>
                      <option value="xe_may">Để xe máy</option><option value="oto">Gara ô tô</option><option value="khong">Không</option>
                    </select></div>
                </div>
                <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={!!extractedData.phong_tho} onChange={e => handleChangeField('phong_tho', e.target.checked)} /> Có phòng thờ</label>
                {hasSketch && (
                  <div className={`rounded-lg p-3 border ${low('bo_tri_phac_thao') ? 'border-amber-500' : theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className="font-black mb-1.5">✏️ AI đọc được từ bản vẽ tay{sk.vi_tri_thang && sk.vi_tri_thang !== 'khong_ro' ? ` · cầu thang bên ${BEN[sk.vi_tri_thang] || sk.vi_tri_thang}` : ''}:</div>
                    {sk.tang.map((t: any, i: number) => {
                      const ph = (t.phong || []).filter((r: any) => Number.isFinite(Number(r.hang)) && Number.isFinite(Number(r.cot)));
                      if (ph.length < 2) return (
                        <div key={i} className="mb-1"><b>Tầng {t.tang}:</b> {(t.phong || []).map((r: any) => `${r.ten_goc || LOAI[r.loai] || r.loai}${r.vi_tri ? ' (' + (VT[r.vi_tri] || r.vi_tri) + (r.ben && r.ben !== 'ca_ngang' ? ', ' + (BEN[r.ben] || r.ben) : '') + ')' : ''}`).join(' · ') || '—'}</div>
                      );
                      // Sơ đồ ô: hàng 0 (sát cửa chính) vẽ ở DƯỚI, giống bản vẽ khi đứng ngoài nhìn vào cửa chính
                      const R = Math.max(Number(sk.luoi?.so_hang) || 0, ...ph.map((r: any) => Number(r.hang) + (Number(r.so_hang) || 1)));
                      const C = Math.max(Number(sk.luoi?.so_cot) || 0, ...ph.map((r: any) => Number(r.cot) + (Number(r.so_cot) || 1)));
                      return (
                        <div key={i} className="mb-2">
                          <b>Tầng {t.tang}</b> — sơ đồ phòng AI đọc được (phía dưới = cửa chính{sk.huong_mat_tien ? `, hướng ${sk.huong_mat_tien}` : ''}):
                          <div className="mt-1.5 grid gap-1" style={{ gridTemplateColumns: `repeat(${C}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${R}, minmax(44px, auto))` }}>
                            {ph.map((r: any, k: number) => {
                              const rs = Number(r.so_hang) || 1, cs = Number(r.so_cot) || 1;
                              const unsure = typeof r.tin_cay === 'number' && r.tin_cay < 0.6;
                              return (
                                <div key={k} className={`rounded-md border p-1 text-[10px] sm:text-xs leading-tight ${unsure ? 'border-amber-500 bg-amber-500/10' : r.loai === 'hien' ? 'border-dashed border-slate-400' : theme === 'dark' ? 'border-slate-600 bg-slate-800/60' : 'border-slate-300 bg-slate-50'}`}
                                  style={{ gridColumn: `${Number(r.cot) + 1} / span ${cs}`, gridRow: `${R - Number(r.hang) - rs + 1} / span ${rs}` }}>
                                  <div className="font-black">{r.ten_goc || LOAI[r.loai] || r.loai}{unsure ? ' (?)' : ''}</div>
                                  {r.dien_tich ? <div className="opacity-70">{r.dien_tich} m²</div> : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {(sk.nha?.rong || sk.nha?.sau || sk.kieu === 'tu_do') && (
                      <div className="grid grid-cols-2 gap-2.5 mt-2">
                        <div><label className="block font-bold text-slate-400 mb-1">Chiều ngang nhà (m) — để trống: tool tự tính</label>
                          <input className={inCls('bo_tri_phac_thao')} inputMode="decimal" value={sk.nha?.rong ?? ''} onChange={e => handleChangeField('bo_tri_phac_thao', { ...sk, nha: { ...(sk.nha || {}), rong: e.target.value } })} /></div>
                        <div><label className="block font-bold text-slate-400 mb-1">Chiều sâu nhà (m)</label>
                          <input className={inCls('bo_tri_phac_thao')} inputMode="decimal" value={sk.nha?.sau ?? ''} onChange={e => handleChangeField('bo_tri_phac_thao', { ...sk, nha: { ...(sk.nha || {}), sau: e.target.value } })} /></div>
                      </div>
                    )}
                    {(() => {
                      const NN: Record<string, string> = { bep_phu: 'Bếp phụ (đun củi)', gieng: 'Giếng', ao: 'Ao', vuon: 'Vườn', cay_xanh: 'Cây xanh', san: 'Sân', chuong_trai: 'Chuồng trại' };
                      const CANH: Record<string, string> = { truoc: 'trước', sau: 'sau', trai: 'trái', phai: 'phải' };
                      const out: string[] = [];
                      (sk.cua || []).forEach((c: any) => out.push(`${c.loai === 'chinh' ? 'Cửa chính' : 'Cửa phụ'}${c.phong ? ' ở ' + c.phong : ''}${c.canh ? ', phía ' + (CANH[c.canh] || c.canh) : ''}${c.ra === 'bep_phu' ? ' → ra bếp phụ' : c.ra === 'vuon' ? ' → ra vườn' : ''}`));
                      if (sk.hien?.co) out.push(`Hiên trước nhà${sk.hien.sau ? ' sâu ' + sk.hien.sau + 'm' : ''}`);
                      if (sk.loi_vao?.canh) out.push(`Khách vào từ phía ${CANH[sk.loi_vao.canh] || sk.loi_vao.canh}`);
                      (sk.ngoai_nha || []).forEach((o: any) => out.push(`${NN[o.loai] || o.loai}${o.canh ? ' phía ' + (CANH[o.canh] || o.canh) : ''}`));
                      return out.length ? <div className="mt-2"><b>Cửa · lối đi · ngoài nhà:</b> {out.join(' · ')}</div> : null;
                    })()}
                    {Array.isArray(sk.doc_khong_ro) && sk.doc_khong_ro.length > 0 && (
                      <div className="mt-2 text-amber-500">⚠️ AI chưa đọc rõ: {sk.doc_khong_ro.join(' · ')} — anh/chị kiểm tra giúp.</div>
                    )}
                    <label className="flex items-center gap-2 mt-2 font-bold">
                      <input type="checkbox" checked={sk.co_phac_thao !== false} onChange={e => handleChangeField('bo_tri_phac_thao', { ...sk, co_phac_thao: e.target.checked })} />
                      Vẽ mặt bằng theo bố trí này (chỗ nào phạm lỗi kỹ thuật/phong thủy, bản vẽ tự điều chỉnh và ghi rõ lý do)
                    </label>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setExtractedData(null)}
              className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs sm:text-sm cursor-pointer"
            >
              {it.btnReset || 'Làm lại / Tải file khác'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{it.btnConfirm || 'Xác nhận & Áp dụng vào Form'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
