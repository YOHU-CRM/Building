import React, { useState } from 'react';
import { Image, Video, Save, CheckCircle, Search } from 'lucide-react';

interface PerspectiveImageUploaderProps {
  theme: 'light' | 'dark';
  lang: 'vi' | 'en' | 'lo' | 'zh';
  leads: any[];
  onUpdatePerspective: (leadId: string, linkAnh: string, linkVideo: string) => void;
}

export default function PerspectiveImageUploader({
  theme,
  lang,
  leads,
  onUpdatePerspective
}: PerspectiveImageUploaderProps) {
  const isDark = theme === 'dark';
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [linkAnh, setLinkAnh] = useState<string>('');
  const [linkVideo, setLinkVideo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const filteredLeads = (leads || []).filter(l => {
    const name = l.userInfo?.name || l.name || '';
    const phone = l.userInfo?.phone || l.phone || l.so_dt || '';
    const id = l.id || l.ma_kh || '';
    const term = searchTerm.toLowerCase();
    return name.toLowerCase().includes(term) || phone.toLowerCase().includes(term) || id.toLowerCase().includes(term);
  });

  const handleSelectLead = (lead: any) => {
    setSelectedLeadId(lead.id || lead.ma_kh);
    setLinkAnh(lead.link_anh_phoi_canh || '');
    setLinkVideo(lead.link_video_phoi_canh || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) {
      alert("Vui lòng chọn khách hàng cần cập nhật link phối cảnh!");
      return;
    }
    onUpdatePerspective(selectedLeadId, linkAnh, linkVideo);
    setSuccessMsg("Đã cập nhật link ảnh/video phối cảnh thành công!");
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121829] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}>
      <div className="flex items-center gap-2 mb-4">
        <Image className="w-5 h-5 text-amber-500" />
        <h3 className="text-base font-black uppercase tracking-tight">Cập Nhật Ảnh & Video Phối Cảnh 3D (Thủ Công)</h3>
      </div>
      <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        Dán link Google Drive ảnh phối cảnh (<code>https://drive.google.com/uc?export=view&id=FILE_ID</code>) và link video phối cảnh cho khách hàng để tự động chèn vào báo cáo PDF.
      </p>

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Search & Select Customer */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT hoặc mã KH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
            />
          </div>

          <div className={`max-h-64 overflow-y-auto rounded-xl border divide-y ${isDark ? 'border-slate-800 divide-slate-800 bg-slate-950/40' : 'border-slate-200 divide-slate-100 bg-slate-50'}`}>
            {filteredLeads.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">Không tìm thấy khách hàng phù hợp.</div>
            ) : (
              filteredLeads.map((lead, idx) => {
                const id = lead.id || lead.ma_kh || idx;
                const name = lead.userInfo?.name || lead.name || 'Khách hàng';
                const phone = lead.userInfo?.phone || lead.phone || lead.so_dt || 'N/A';
                const isSelected = selectedLeadId === id;
                return (
                  <div
                    key={id}
                    onClick={() => handleSelectLead(lead)}
                    className={`p-3 text-xs cursor-pointer transition flex items-center justify-between ${
                      isSelected 
                        ? 'bg-amber-500/15 border-l-4 border-amber-500 font-bold text-amber-400' 
                        : isDark ? 'hover:bg-slate-900 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{name}</div>
                      <div className="text-[11px] opacity-75 font-mono">{phone} • Gói: {lead.goi_mua || lead.goiMua || 'Cơ bản'}</div>
                    </div>
                    {lead.link_anh_phoi_canh && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono">Đã có ảnh</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Form to edit links */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-400">Mã / ID Khách Hàng đã chọn</label>
            <input
              type="text"
              readOnly
              value={selectedLeadId || 'Chưa chọn khách hàng bên trái'}
              className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${isDark ? 'bg-slate-900 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-300 text-slate-700'}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-400 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-blue-400" />
              <span>Link Ảnh Phối Cảnh 3D (Drive)</span>
            </label>
            <input
              type="text"
              placeholder="https://drive.google.com/uc?export=view&id=..."
              value={linkAnh}
              onChange={(e) => setLinkAnh(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
            />
            {linkAnh && (
              <div className="mt-2 h-20 w-32 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 relative">
                <img src={linkAnh} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-slate-400 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-purple-400" />
              <span>Link Video Phối Cảnh (Tùy chọn)</span>
            </label>
            <input
              type="text"
              placeholder="https://drive.google.com/... hoặc YouTube"
              value={linkVideo}
              onChange={(e) => setLinkVideo(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
            />
          </div>

          <button
            type="submit"
            disabled={!selectedLeadId}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition ${
              selectedLeadId 
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Lưu Link Phối Cảnh Cho Khách Hàng</span>
          </button>
        </form>
      </div>
    </div>
  );
}
