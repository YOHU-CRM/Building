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
