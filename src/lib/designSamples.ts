import { db } from "./firebase";
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

export interface DesignSample {
  id?: string;
  name: string;
  imageUrl: string;
  constructionType: string;
  roomType?: string;
  style: string;
  element?: string;
  areaRange: string; // e.g., "50-100", "100-200"
  prompt: string;
  videoUrl?: string; // New field
  referenceUrl?: string; // New field
}

const COLLECTION_NAME = "designSamples";

const DEFAULT_SAMPLES: DesignSample[] = [
  {
    id: 'sample-1',
    name: 'Phòng khách Tân Cổ Điển',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    constructionType: 'Phòng khách',
    roomType: 'Phòng khách',
    style: 'Tân cổ điển',
    element: 'Mộc',
    areaRange: '50-100',
    prompt: 'Thiết kế phòng khách tân cổ điển sang trọng'
  },
  {
    id: 'sample-2',
    name: 'Phòng ngủ Hiện Đại',
    imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
    constructionType: 'Phòng ngủ',
    roomType: 'Phòng ngủ',
    style: 'Hiện đại',
    element: 'Thổ',
    areaRange: '50-100',
    prompt: 'Thiết kế phòng ngủ hiện đại ấm cúng'
  },
  {
    id: 'sample-3',
    name: 'Phòng bếp Tối Giản',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    constructionType: 'Phòng bếp',
    roomType: 'Phòng bếp',
    style: 'Tối giản',
    element: 'Kim',
    areaRange: '50-100',
    prompt: 'Thiết kế nhà bếp tối giản tiện nghi'
  }
];

// Thêm mẫu thiết kế: đi qua máy chủ (cần mã admin). Firestore đã khóa ghi trực tiếp từ trình duyệt.
export const addDesignSample = async (sample: DesignSample) => {
  let adminCode = '';
  try { adminCode = sessionStorage.getItem('yohu_admin_code') || ''; } catch {}
  const res = await fetch('/api/admin/design-samples', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-code': adminCode },
    body: JSON.stringify(sample)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Lỗi ${res.status}`);
  return data;
};
void addDoc;

const adminFetch = async (url: string, method: string, body?: any) => {
  let adminCode = '';
  try { adminCode = sessionStorage.getItem('yohu_admin_code') || ''; } catch {}
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'x-admin-code': adminCode }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Lỗi ${res.status}`);
  return data;
};
/** Sửa mẫu (qua máy chủ, cần mã admin) */
export const updateDesignSample = (id: string, sample: Partial<DesignSample>) => adminFetch(`/api/admin/design-samples/${encodeURIComponent(id)}`, 'PUT', sample);
/** Xóa mẫu (qua máy chủ; bản sao lưu giữ ở deletedDesignSamples). Giao diện phải hỏi xác nhận trước. */
export const deleteDesignSample = (id: string) => adminFetch(`/api/admin/design-samples/${encodeURIComponent(id)}`, 'DELETE');
export const isDefaultSample = (id?: string) => !id || id.startsWith('sample-');

export const getDesignSamples = async (constructionType?: string, area?: number) => {
  try {
    const q = collection(db, COLLECTION_NAME);
    const querySnapshot = await getDocs(q);
    const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DesignSample));
    if (fetched.length > 0) {
      return fetched;
    }
    return DEFAULT_SAMPLES;
  } catch (err) {
    console.warn("Could not fetch design samples from Firestore, using default fallback samples.", err);
    return DEFAULT_SAMPLES;
  }
};
