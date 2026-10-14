import React, { useState } from 'react';
import { addDesignSample, DesignSample } from '../lib/designSamples';

export const AdminDesignManager: React.FC = () => {
  const [sample, setSample] = useState<DesignSample>({
    name: '',
    imageUrl: '',
    constructionType: 'Bê tông cốt thép truyền thống',
    style: 'Hiện đại',
    areaRange: '50-100',
    prompt: '',
    videoUrl: '',
    referenceUrl: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDesignSample(sample);
      alert('Đã thêm mẫu thiết kế thành công!');
      setSample({ name: '', imageUrl: '', constructionType: 'Bê tông cốt thép truyền thống', style: 'Hiện đại', areaRange: '50-100', prompt: '', videoUrl: '', referenceUrl: '' });
    } catch (error) {
      console.error('Lỗi khi thêm mẫu:', error);
      alert('Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-xl font-bold mb-4">Quản lý Mẫu Thiết Kế (Admin)</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full p-2 border rounded" placeholder="Tên mẫu" value={sample.name} onChange={e => setSample({...sample, name: e.target.value})} required />
        <input className="w-full p-2 border rounded" placeholder="Link ảnh" value={sample.imageUrl} onChange={e => setSample({...sample, imageUrl: e.target.value})} required />
        <input className="w-full p-2 border rounded" placeholder="Link Video (YouTube/Drive)" value={sample.videoUrl} onChange={e => setSample({...sample, videoUrl: e.target.value})} />
        <input className="w-full p-2 border rounded" placeholder="Link Tài liệu/Drive" value={sample.referenceUrl} onChange={e => setSample({...sample, referenceUrl: e.target.value})} />
        <select className="w-full p-2 border rounded" value={sample.constructionType} onChange={e => setSample({...sample, constructionType: e.target.value})}>
          <option>Bê tông cốt thép truyền thống</option>
          <option>Khung thép tiền chế + Cemboard</option>
          <option>Nhà xưởng công nghiệp (Zamil Steel/PEB)</option>
        </select>
        <input className="w-full p-2 border rounded" placeholder="Phong cách" value={sample.style} onChange={e => setSample({...sample, style: e.target.value})} />
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? 'Đang lưu...' : 'Thêm mẫu mới'}
        </button>
      </form>
    </div>
  );
};
