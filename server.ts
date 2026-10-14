import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";
import { calculateFengShui, getLunarBirthYear, getDefaultConstructionYear, getCanChi } from "./src/lib/fengshui.js";
import { applyUnifiedPricing } from "./src/lib/unifiedPricing.js";

dotenv.config();

// --- FIRESTORE ADMIN (PERSISTENT STORAGE) — TẢI ĐỘNG, KHÔNG LÀM SẬP SERVER ---
// Nếu FIREBASE_SERVICE_ACCOUNT được cấu hình trên Vercel -> dữ liệu leads sẽ
// được lưu vĩnh viễn trên Firestore. "firebase-admin" chỉ được nạp bằng
// dynamic import() bên trong try/catch: nếu gói này chưa cài được đúng
// (thiếu lockfile, build lỗi...) thì CHỈ tính năng Firestore bị tắt,
// toàn bộ phần còn lại của server (đăng nhập Admin, /api/leads,...)
// vẫn chạy bình thường như cũ, không bị sập theo.
let firestoreDb: FirebaseFirestore.Firestore | null = null;

async function initFirestore() {
  const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!svcJson) {
    console.warn("⚠️ [Firestore] FIREBASE_SERVICE_ACCOUNT chưa cấu hình trên Vercel — đang dùng bộ nhớ tạm (dữ liệu sẽ mất khi server khởi động lại/redeploy).");
    return;
  }
  try {
    const { default: admin } = await import("firebase-admin");
    const serviceAccount = JSON.parse(svcJson);
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    firestoreDb = admin.firestore();
    console.log("✅ [Firestore] Đã kết nối Firestore Admin — dữ liệu leads sẽ được lưu vĩnh viễn.");
  } catch (err) {
    console.error("❌ [Firestore] Không nạp được Firebase Admin (gói chưa cài đúng hoặc JSON sai) — tiếp tục dùng bộ nhớ tạm, các phần khác của app không bị ảnh hưởng:", err);
  }
}
// Fire-and-forget: không chặn server khởi động chờ Firestore.
initFirestore();

// --- IN-MEMORY DATABASE STORAGE (BYPASSING FIRESTORE TO AVOID EXTERNAL DEPENDENCIES & VERCEL CRASHES) ---
const inMemoryStore = {
  leads: new Map<string, any>(),
  rateLimits: new Map<string, { consecutiveFailures: number; blockUntil: number; lastAttempt?: number; lastSuccess?: number }>(),
  clientDocuments: new Map<string, any>(),
  commissions: new Map<string, any>(),
  ctvPartners: new Map<string, any>(),
  videoOrders: new Map<string, any>(),
};

const app = express();
export { app };
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Chẩn đoán ADMIN_CODE — KHÔNG cần biết mã đúng, KHÔNG lộ mã thật (đã che).
// Dùng để xác nhận Vercel đã nạp đúng biến môi trường hay chưa trước khi đăng nhập.
app.get("/api/admin-check", (req, res) => {
  const rawEnvCode = (
    process.env.ADMIN_CODE ||
    process.env.ADMIN_PASSWORD ||
    process.env.admin_code ||
    process.env.Admin_Code ||
    ""
  ).trim();
  const envAdminCode = rawEnvCode.replace(/^["']|["']$/g, "").trim();
  const codes = envAdminCode
    .split(",")
    .map(c => c.replace(/^["']|["']$/g, "").trim())
    .filter(Boolean);

  res.json({
    configured: codes.length > 0,
    count: codes.length,
    gasConfigured: !!getGasUrl(),
    gasSecretConfigured: !!(process.env.GAS_SECRET || "").trim(),
    firestoreConnected: !!firestoreDb
  });
});

// Helper to resolve the correct Google Sheets Apps Script URL (no hardcoded fallback URL)
function getGasUrl(): string {
  const gasUrl = process.env.GOOGLE_SHEETS_GAS_URL;
  if (gasUrl && gasUrl.startsWith("http")) {
    return gasUrl.trim();
  }
  console.warn("⚠️ [Config Warning]: GOOGLE_SHEETS_GAS_URL is not configured in environment variables.");
  return "";
}

function cleanServerVietnameseText(input: string): string {
  if (!input) return '';
  let str = input;
  // Clean LaTeX math formatting and stray dollar signs like $110mm$ or $100m²$
  str = str.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  str = str.replace(/\$([^\$\n]+)\$/g, '$1');
  str = str.replace(/\\times/g, '×')
           .replace(/\\cdot/g, '·')
           .replace(/\\approx/g, '≈')
           .replace(/\\le\b/g, '≤')
           .replace(/\\ge\b/g, '≥')
           .replace(/\\pm/g, '±')
           .replace(/\\degree/g, '°')
           .replace(/\^\\circ/g, '°');
  str = str.replace(/\$\s*(\d+(?:[.,]\d+)?\s*(?:mm|cm|m|m²|m³|kg|tấn|công|bộ|viên|lít|md|bar|%|đ|VNĐ|VND|tỷ|triệu))\b/gi, '$1');
  str = str.replace(/\b(\d+(?:[.,]\d+)?\s*(?:mm|cm|m|m²|m³|kg|tấn|công|bộ|viên|lít|md|bar|%|đ|VNĐ|VND|tỷ|triệu))\s*\$/gi, '$1');

  str = str.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\s\u200B\u00A0\uFEFF]+([\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F])/g, '$1$2');
  str = str.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\s\u200B\u00A0\uFEFF]+([\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F])/g, '$1$2');
  str = str.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\s\u200B\u00A0]*[\u00B4\u02CA]/g, '$1\u0301');
  str = str.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\s\u200B\u00A0]*[\u0060\u02CB]/g, '$1\u0300');
  str = str.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\s\u200B\u00A0]*[\u02C6]/g, '$1\u0302');
  str = str.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\s\u200B\u00A0]*[\u02DC~]/g, '$1\u0303');
  str = str.replace(/([a-zA-Z\u00C0-\u024F\u1EA0-\u1EF9])[\s\u200B\u00A0]*[\u02D9\u00B7]/g, '$1\u0323');
  return str.normalize('NFC');
}

// Helper: giới hạn thời gian chờ Firestore — nếu quá lâu (mạng lỗi, sai key...)
// thì tự bỏ qua ngay thay vì treo request cho tới khi Vercel timeout (300s).
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Firestore timeout sau ${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

// Helper to acquire CRM Leads — đọc từ Firestore nếu đã cấu hình,
// nếu không (hoặc lỗi/chậm) thì rơi về bộ nhớ tạm như logic gốc.
async function getLeads(): Promise<any[]> {
  if (firestoreDb) {
    try {
      const snap = await withTimeout(firestoreDb.collection("leads").get(), 5000);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return list;
    } catch (err) {
      console.error("⚠️ [Firestore] Lỗi/chậm khi đọc leads, tạm dùng bộ nhớ:", err);
    }
  }
  try {
    const list = Array.from(inMemoryStore.leads.values());
    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return list;
  } catch (err) {
    console.error("Error reading leads from memory:", err);
    return [];
  }
}

// Lưu lead — ghi vào Firestore (nếu có) VÀ luôn giữ bản cache trong bộ nhớ
// (giúp phản hồi nhanh, và vẫn hoạt động nếu Firestore tạm lỗi).
async function saveLeadToFirestore(lead: any) {
  if (!lead || !lead.id) return;
  const leadData = {
    ...lead,
    createdAt: lead.createdAt || new Date().toISOString()
  };
  try {
    inMemoryStore.leads.set(lead.id, leadData);
  } catch (err) {
    console.error("Error saving lead in-memory:", err);
  }
  if (firestoreDb) {
    try {
      await withTimeout(
        firestoreDb.collection("leads").doc(String(lead.id)).set(leadData, { merge: true }),
        5000
      );
    } catch (err) {
      console.error("⚠️ [Firestore] Lỗi/chậm khi ghi lead (đã lưu tạm ở bộ nhớ):", err);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GEMINI API KEY MANAGER — Ưu tiên FREE → hết mới dùng PAID
// ═══════════════════════════════════════════════════════════════════════════════

// Initialize standard clients requested by user pattern
let aiFree: GoogleGenAI | null = null;
let aiPaid: GoogleGenAI | null = null;

try {
  if (process.env.GEMINI_API_KEY) {
    aiFree = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  } else {
    console.warn("⚠️ Warning: GEMINI_API_KEY (Free key) is not defined.");
  }
} catch (error) {
  console.error("Failed to initialize aiFree:", error);
}

try {
  if (process.env.GEMINI_PAID_KEY || process.env.GEMINI_API_KEY_PAID) {
    aiPaid = new GoogleGenAI({
      apiKey: (process.env.GEMINI_PAID_KEY || process.env.GEMINI_API_KEY_PAID)!,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  } else {
    console.log("ℹ️ Note: GEMINI_PAID_KEY is not configured yet.");
  }
} catch (error) {
  console.error("Failed to initialize aiPaid:", error);
}

function parseKeys(envVar: string): string[] {
  return (process.env[envVar] || "")
    .split(",")
    .map((k: string) => k.trim())
    .filter(Boolean);
}

// Danh sách FREE keys (ưu tiên cao nhất)
const FREE_KEYS: string[] = (() => {
  const dedicated = parseKeys("GEMINI_FREE_KEYS");
  if (dedicated.length) return dedicated;
  const legacy = parseKeys("GEMINI_API_KEYS");
  if (legacy.length) return legacy;
  const single = (process.env.GEMINI_API_KEY || "").trim();
  return single ? [single] : [];
})();

const PAID_KEYS: string[] = (() => {
  const dedicated = parseKeys("GEMINI_PAID_KEYS");
  if (dedicated.length) return dedicated;
  const single = (process.env.GEMINI_PAID_KEY || process.env.GEMINI_API_KEY_PAID || "").trim();
  return single ? [single] : [];
})();

// Theo dõi cặp (key, model) nào đã bị quota hoặc lỗi — tự động hồi phục sau QUOTA_RESET_MS
const QUOTA_RESET_MS = 30 * 60 * 1000; // 30 phút
const exhaustedModelKeys = new Map<string, number>();
const exhaustedKeys = new Map<string, number>();

function isKeyExhausted(key: string): boolean {
  const ts = exhaustedKeys.get(key);
  if (!ts) return false;
  if (Date.now() - ts > QUOTA_RESET_MS) {
    exhaustedKeys.delete(key);
    return false;
  }
  return true;
}

function isModelKeyExhausted(key: string, model: string): boolean {
  if (isKeyExhausted(key)) return true;
  const comboKey = `${key.slice(-8)}:::${model}`;
  const ts = exhaustedModelKeys.get(comboKey);
  if (!ts) return false;
  if (Date.now() - ts > QUOTA_RESET_MS) {
    exhaustedModelKeys.delete(comboKey);
    return false;
  }
  return true;
}

function markModelKeyExhausted(key: string, model: string) {
  const comboKey = `${key.slice(-8)}:::${model}`;
  exhaustedModelKeys.set(comboKey, Date.now());
  console.warn(`[Gemini Rotator] Model ${model} (Key ...${key.slice(-6)}) hết quota tín dụng. Tự động luân chuyển sang model/key tiếp theo...`);
}

function markKeyExhausted(key: string) {
  exhaustedKeys.set(key, Date.now());
  console.warn(`[KeyManager] Toàn bộ key ...${key.slice(-6)} bị giới hạn tài khoản. Thử lại sau ${QUOTA_RESET_MS / 60000} phút.`);
}

// Round-robin index riêng cho từng tier
let _freeIdx = 0;
let _paidIdx = 0;

function pickAvailableKey(model?: string): { key: string; tier: "free" | "paid" } | null {
  // Thử toàn bộ free keys trước
  for (let i = 0; i < FREE_KEYS.length; i++) {
    const key = FREE_KEYS[_freeIdx % FREE_KEYS.length];
    _freeIdx++;
    if (model ? !isModelKeyExhausted(key, model) : !isKeyExhausted(key)) {
      return { key, tier: "free" };
    }
  }
  // Free hết quota -> thử paid keys
  for (let i = 0; i < PAID_KEYS.length; i++) {
    const key = PAID_KEYS[_paidIdx % PAID_KEYS.length];
    _paidIdx++;
    if (model ? !isModelKeyExhausted(key, model) : !isKeyExhausted(key)) {
      return { key, tier: "paid" };
    }
  }
  return null;
}

function makeAiClient(key: string): GoogleGenAI | null {
  try {
    if (!key) return null;
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI client:", error);
    return null;
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const picked = pickAvailableKey();
  if (!picked) return null;
  return makeAiClient(picked.key);
}

// Danh sách đầy đủ các model Google AI Studio miễn phí theo thứ tự ưu tiên & tự động luân chuyển khi hết tín dụng / quá tải
const DEFAULT_TEXT_MODELS = [
  "gemini-3.7-flash",         // Bản Flash 3.7 cân bằng, cực nhanh & chuẩn xác
  "gemini-3.8-flash",         // Bản Flash 3.8
  "gemini-3.5-flash",         // Bản Flash 3.5 ổn định cao
  "gemini-3.5-flash-lite",    // Bản Flash-Lite 3.5 siêu tốc
  "gemini-3.6-flash",         // Bản Flash 3.6
  "gemini-3.1-flash-lite",    // Bản Flash-Lite 3.1
  "gemini-3-flash-preview",   // Bản Preview thế hệ 3
  "gemini-flash-latest",      // Luôn trỏ tới bản Flash mới nhất
  "gemini-flash-lite-latest", // Luôn trỏ tới bản Flash-Lite mới nhất
  "gemini-pro-latest",        // Bản Pro mới nhất
  "gemini-2.5-flash",         // Bản 2.5 Flash
  "gemini-2.5-flash-lite",    // Bản 2.5 Flash Lite
];

// Hàm chính: gọi Gemini, tự động luân chuyển model khi hết hạn mức (429/quota) hoặc quá tải (503)
async function callGeminiWithRetry(
  callFn: (ai: GoogleGenAI, model: string) => Promise<any>,
  models: string[] = DEFAULT_TEXT_MODELS
): Promise<any> {
  const allKeys = [...FREE_KEYS, ...PAID_KEYS];
  if (allKeys.length === 0) {
    throw new Error("Chưa cấu hình GEMINI_API_KEY hoặc GEMINI_FREE_KEYS trong biến môi trường.");
  }

  let lastError: any;

  // 1. Duyệt qua từng model trong danh sách miễn phí
  for (let mIdx = 0; mIdx < models.length; mIdx++) {
    const currentModel = models[mIdx];

    // 2. Thử lần lượt các key (ưu tiên FREE rồi đến PAID)
    for (let kIdx = 0; kIdx < allKeys.length; kIdx++) {
      const key = allKeys[kIdx];
      const tier = FREE_KEYS.includes(key) ? "FREE" : "PAID";

      // Nếu model này trên key này đã bị đánh dấu hết quota trước đó, bỏ qua để tiết kiệm thời gian
      if (isModelKeyExhausted(key, currentModel)) {
        continue;
      }

      const ai = makeAiClient(key);
      if (!ai) continue;

      const label = `[${tier} ...${key.slice(-6)} | ${currentModel}]`;

      try {
        console.log(`${label} Đang gửi yêu cầu Gemini API...`);
        const result = await (callFn.length > 1 ? callFn(ai, currentModel) : (callFn as any)(ai));
        console.log(`${label} Gọi thành công!`);
        return result;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || JSON.stringify(err);

        // Kiểm tra lỗi hết hạn mức / Quota / Resource Exhausted (429)
        const isQuota =
          msg.includes("429") ||
          msg.includes("Quota exceeded") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("resource_exhausted") ||
          msg.toLowerCase().includes("quota");

        if (isQuota) {
          markModelKeyExhausted(key, currentModel);

          // Nếu lỗi là do giới hạn theo từng model (metric per_model_per_user), chuyển sang model tiếp theo ngay
          if (msg.includes("per_model") || msg.includes(currentModel)) {
            console.warn(`[Quota] Model ${currentModel} hết hạn mức token. Chuyển sang model miễn phí tiếp theo...`);
            break; // Thoát vòng lặp key để sang model tiếp theo trong danh sách
          } else {
            // Hết hạn mức chung trên key
            markKeyExhausted(key);
            continue;
          }
        }

        // Kiểm tra lỗi 503 (Server quá tải / High Demand / Spikes in demand)
        const isUnavailable =
          msg.includes("503") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("high demand") ||
          msg.includes("overloaded");

        if (isUnavailable) {
          console.warn(`[503 Overloaded] Model ${currentModel} đang quá tải trên server Google. Chuyển ngay sang model dự phòng tiếp theo...`);
          await new Promise((resolve) => setTimeout(resolve, 300));
          break; // Thoát vòng lặp key để sang model tiếp theo ngay
        }

        console.warn(`[Gemini Warning] Lỗi tạm thời ${label}: ${msg.slice(0, 160)}`);
      }
    }
  }

  throw lastError || new Error("Tất cả các model Gemini và API keys đều quá tải hoặc đã hết hạn mức.");
}

console.log(`[KeyManager] FREE keys: ${FREE_KEYS.length} | PAID keys: ${PAID_KEYS.length}`);
if (FREE_KEYS.length === 0 && PAID_KEYS.length === 0) {
  console.warn("[KeyManager] Không có API key nào! Hệ thống dùng local fallback.");
}
// ═══════════════════════════════════════════════════════════════════════════════


// Helper to notify Google Sheets Apps Script URL
async function notifyGoogleSheets(lead: any) {
  const url = getGasUrl();
  if (!url) {
    console.warn("[Google Sheets Sync Skipped]: GOOGLE_SHEETS_GAS_URL is not configured.");
    return;
  }
  
  // Helper to format Date into dd/MM/yyyy
  const formatVN = (dtStr?: string) => {
    if (!dtStr) return "";
    try {
      const d = new Date(dtStr);
      if (isNaN(d.getTime())) return dtStr;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return dtStr || "";
    }
  };

  // Helper to get birth year as number
  const getYear = (dtStr?: string) => {
    if (!dtStr) return "";
    try {
      const d = new Date(dtStr);
      if (isNaN(d.getTime())) {
        const parsed = parseInt(dtStr);
        return isNaN(parsed) ? dtStr : parsed;
      }
      return d.getFullYear();
    } catch {
      return dtStr || "";
    }
  };

  const ctvCode = lead.affiliateData?.ref || lead.affiliateData?.aid || lead.affiliateData?.utm_source || lead.ref || lead.aid || "";

  // Compile the EXACT structure required by Google Sheets App Script (using literal headers from screenshot)
  const payloadToPost: Record<string, any> = {
    // TECHNICAL MAPPING FOR GAS RELIABILITY
    type: "khach_hang",
    api_type: "khach_hang", 
    sheetName: "Khach_Hang", 
    
    // Explicit technical keys expected by luuKhachHang(data) in GAS
    id: lead.id || "",
    ma_kh: lead.id || "",
    ho_ten: lead.userInfo?.name || ((lead.userInfo?.phone || lead.userInfo?.sdt) ? `Khách hàng ${lead.userInfo?.phone || lead.userInfo?.sdt}` : "Khách hàng mới"),
    so_dt: lead.userInfo?.phone || lead.userInfo?.sdt || "",
    email: lead.userInfo?.email || "",
    dia_chi: lead.userInfo?.address || "",
    nam_sinh: getYear(lead.userInfo?.birthDate),
    gioi_tinh: lead.userInfo?.gender === "nam" ? "Nam" : (lead.userInfo?.gender === "nu" ? "Nữ" : lead.userInfo?.gender || "Nam"),
    menh: lead.fengShuiAnalysis?.element || "",
    loai_ct: lead.constructionInfo?.constructionType || "",
    dien_tich: lead.constructionInfo?.dimensions || "",
    so_tang: Number(lead.constructionInfo?.floors) || 1,
    ngan_sach: Number(lead.constructionInfo?.totalBudget) || 0,
    don_vi: "VNĐ",
    tieu_chuan: "VN",
    huong_muon: lead.userInfo?.desiredDirection || "",
    huong_tot: Array.isArray(lead.fengShuiAnalysis?.favorableDirections) ? lead.fengShuiAnalysis.favorableDirections.join(", ") : "",
    goi_mua: (() => {
      const g = lead.goi_mua || lead.goiMua || "";
      if (g === "free" || g === "Gói Free" || g === "Báo cáo cơ bản" || !g) return "Báo cáo cơ bản";
      if (g === "standard" || g === "Gói Tiêu Chuẩn 299K" || g === "Báo cáo đầy đủ" || g.includes("299")) return "Báo cáo đầy đủ";
      return "Báo cáo + Bản vẽ";
    })(),
    doanh_thu: Number(lead.goi_gia || 0),
    trang_thai: lead.status || "Mới",
    ma_ctv: ctvCode,
    quoc_gia: "Việt Nam",
    vung_mien: lead.vung_mien || lead.vungMien || "",
    loai_dat: lead.loai_dat || lead.loaiDat || "",
    phong_cach: lead.phong_cach || lead.phongCách || "",
    ngon_ngu: lead.ngon_ngu || lead.ngonNgu || lead.lang || "vi",

    // Basic identifiers for fallback safety - already defined at top of payload
    // Personal Info & Aliases
    name: lead.userInfo?.name || ((lead.userInfo?.phone || lead.userInfo?.sdt) ? `Khách hàng ${lead.userInfo?.phone || lead.userInfo?.sdt}` : "Khách hàng mới"),
    "Họ Tên": lead.userInfo?.name || ((lead.userInfo?.phone || lead.userInfo?.sdt) ? `Khách hàng ${lead.userInfo?.phone || lead.userInfo?.sdt}` : "Khách hàng mới"),
    "Họ và tên": lead.userInfo?.name || ((lead.userInfo?.phone || lead.userInfo?.sdt) ? `Khách hàng ${lead.userInfo?.phone || lead.userInfo?.sdt}` : "Khách hàng mới"),
    fullName: lead.userInfo?.name || ((lead.userInfo?.phone || lead.userInfo?.sdt) ? `Khách hàng ${lead.userInfo?.phone || lead.userInfo?.sdt}` : "Khách hàng mới"),
    "Khách Hàng": lead.userInfo?.name || ((lead.userInfo?.phone || lead.userInfo?.sdt) ? `Khách hàng ${lead.userInfo?.phone || lead.userInfo?.sdt}` : "Khách hàng mới"),

    phone: lead.userInfo?.phone || "",
    "Số Điện Thoại": lead.userInfo?.phone || "",
    "SĐT": lead.userInfo?.phone || "",
    "Điện thoại": lead.userInfo?.phone || "",

    address: lead.userInfo?.address || "",
    "Địa Chỉ": lead.userInfo?.address || "",
    "Địa chỉ": lead.userInfo?.address || "",

    birthDate: lead.userInfo?.birthDate || "",
    "Ngày Sinh": lead.userInfo?.birthDate || "",
    "Năm sinh": lead.userInfo?.birthDate || "",

    birthHour: lead.userInfo?.birthHour || "",
    "Giờ Sinh": lead.userInfo?.birthHour || "",

    gender: lead.userInfo?.gender || "",
    "Giới tính fallback": lead.userInfo?.gender || "",

    desiredDirection: lead.userInfo?.desiredDirection || "",
    "Hướng Đất": lead.userInfo?.desiredDirection || "",
    "Hướng mong muốn": lead.userInfo?.desiredDirection || "",

    purpose: lead.userInfo?.purpose || "",
    "Mục Đích": lead.userInfo?.purpose || "",

    // Construction Details & Aliases
    constructionType: lead.constructionInfo?.constructionType || "",
    "Loại Nhà": lead.constructionInfo?.constructionType || "",
    "Loại công trình": lead.constructionInfo?.constructionType || "",

    totalBudget: lead.constructionInfo?.totalBudget || "",
    "Ngân sách (Số)": lead.constructionInfo?.totalBudget || "",

    dimensions: lead.constructionInfo?.dimensions || "",
    "Kích Thước": lead.constructionInfo?.dimensions || "",

    floors: lead.constructionInfo?.floors || "",
    "Số tầng (Số)": lead.constructionInfo?.floors || "",

    // Feng shui
    "Mệnh Ngũ Hành": lead.fengShuiAnalysis?.element || "",
    "Cung Phi": lead.fengShuiAnalysis?.cungPhi || "",
    "Hướng Hợp": Array.isArray(lead.fengShuiAnalysis?.favorableDirections) ? lead.fengShuiAnalysis.favorableDirections.join(", ") : "",
    "Màu Hợp": Array.isArray(lead.fengShuiAnalysis?.favorableColors) ? lead.fengShuiAnalysis.favorableColors.join(", ") : "",
    "Ngày Động Thổ Cát": Array.isArray(lead.fengShuiAnalysis?.favorableGroundbreakingDates) ? lead.fengShuiAnalysis.favorableGroundbreakingDates.join("; ") : "",

    // Rooms layout flattened
    "Phòng Khách": lead.constructionInfo?.rooms?.livingRoom ? "Có" : "Không",
    "Phòng Ngủ": lead.constructionInfo?.rooms?.bedroomCount || 0,
    "Phòng Bếp": lead.constructionInfo?.rooms?.kitchen ? "Có" : "Không",
    "Phòng Thờ": lead.constructionInfo?.rooms?.worshipRoom ? "Có" : "Không",
    "Phòng Vệ Sinh": lead.constructionInfo?.rooms?.bathroomCount || 0,
    "Nhà Xe": lead.constructionInfo?.rooms?.garage ? "Có" : "Không",
    "Sân Vườn": lead.constructionInfo?.rooms?.garden ? "Có" : "Không",
    "Hồ Cá": lead.constructionInfo?.rooms?.fishPond ? "Có" : "Không",

    // Structural & Material Details
    "Móng": lead.detailItems?.foundation || "",
    "Cột": lead.detailItems?.columns || "",
    "Dầm": lead.detailItems?.beam || "",
    "Tường": lead.detailItems?.wall || "",
    "Khung": lead.detailItems?.frame || "",
    "Trần": lead.detailItems?.ceiling || "",
    "Mái": lead.detailItems?.roof || "",
    "Xi măng": lead.detailItems?.cementType || "",
    "Sơn": lead.detailItems?.paintType || "",
    "Gạch ốp": lead.detailItems?.tiles || "",
    "Cửa chính": lead.detailItems?.mainDoor || "",
    "Cửa sổ": lead.detailItems?.window || "",
    "Thang": lead.detailItems?.stairs || "",
    link_anh_phoi_canh: lead.link_anh_phoi_canh || "",
    "Link Ảnh Phối Cảnh 3D": lead.link_anh_phoi_canh || "",
    link_video_phoi_canh: lead.link_video_phoi_canh || "",
    "Link Video Phối Cảnh": lead.link_video_phoi_canh || "",

    status: lead.status || "new",
    createdAt: lead.createdAt || new Date().toISOString(),
  };

  // Extract affiliate/UTM data
  if (lead.affiliateData && typeof lead.affiliateData === "object") {
    Object.entries(lead.affiliateData).forEach(([key, value]) => {
      payloadToPost[key] = value || "";
      payloadToPost[`Tiếp thị liên kết (${key})`] = value || "";
    });
  }

  // Handle support for veo3 and extra parameters explicitly
  const extraKeys = ["ref", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "veo3", "click_id", "aid", "affiliate"];
  extraKeys.forEach(k => {
    // If we have it in the affiliate payload or direct body, populate it
    if (lead[k]) {
      payloadToPost[k] = lead[k];
    }
    if (lead.affiliateData && lead.affiliateData[k]) {
      payloadToPost[k] = lead.affiliateData[k];
    }
  });

  try {
    // 1. Send via POST (JSON) which is the industry standard
    console.log(`[Google Sheets] Sending lead ${lead.id} to Google Sheet via POST with type "khach_hang"...`);
    // Gói luôn lấy theo xác nhận của máy chủ, không tin dữ liệu khách gửi lên
    try { payloadToPost.goi_mua = GOI_LABEL[await getVerifiedPackage(String(lead.id || ""))]; } catch {}
    delete payloadToPost.doanh_thu;
    delete payloadToPost.trang_thai;
    const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "text/plain" },
  body: JSON.stringify({ ...payloadToPost, secret: (process.env.GAS_SECRET || "").trim() }),
  redirect: "follow"
});
    console.log(`[Google Sheets POST] status: ${response.status}`);
  } catch (err: any) {
    console.error(`[Google Sheets POST Failed]:`, err.message || err);
  }

  // 2. Also send via GET fallback using query parameters (just in case they compiled `doGet` instead of `doPost` in Apps Script!)
  try {
    const queryParams = new URLSearchParams();
    Object.entries(payloadToPost).forEach(([k, v]) => {
      if (typeof v !== "object") {
        queryParams.append(k, String(v));
      }
    });
    const getUrl = `${url}?${queryParams.toString()}`;
    await fetch(getUrl, { method: "GET" });
    console.log(`[Google Sheets GET] Fallback fired successfully.`);
  } catch (err: any) {
    console.warn(`[Google Sheets GET Fallback Skipped/Failed]:`, err.message || err);
  }
}

// --- ADMIN AUTH & BRUTE FORCE PROTECTION IN-MEMORY ---
function sanitizeIp(ip: string): string {
  return ip.replace(/[^a-zA-Z0-9_-]/g, "_");
}

async function checkRateLimit(clientIp: string): Promise<{ blocked: boolean; remainingMinutes?: number }> {
  const ipKey = sanitizeIp(clientIp);
  try {
    const data = inMemoryStore.rateLimits.get(ipKey);
    if (data) {
      const now = Date.now();
      if (data.blockUntil && now < data.blockUntil) {
        const remainingMinutes = Math.ceil((data.blockUntil - now) / 60000);
        return { blocked: true, remainingMinutes };
      }
    }
  } catch (err) {
    console.error("[RateLimit Check Error]:", err);
  }
  return { blocked: false };
}

async function recordFailedAttempt(clientIp: string): Promise<{ blocked: boolean }> {
  const ipKey = sanitizeIp(clientIp);
  const now = Date.now();
  try {
    const data = inMemoryStore.rateLimits.get(ipKey) || { consecutiveFailures: 0, blockUntil: 0 };
    let consecutiveFailures = 1;
    if (data.lastAttempt && now - data.lastAttempt < 30 * 60 * 1000) {
      consecutiveFailures = (data.consecutiveFailures || 0) + 1;
    }
    let blockUntil = 0;
    let blocked = false;
    if (consecutiveFailures >= 5) {
      blockUntil = now + 15 * 60 * 1000;
      blocked = true;
    }
    inMemoryStore.rateLimits.set(ipKey, {
      consecutiveFailures,
      blockUntil,
      lastAttempt: now
    });
    return { blocked };
  } catch (err) {
    console.error("[RateLimit Record Error]:", err);
    return { blocked: false };
  }
}

async function recordSuccessfulAttempt(clientIp: string) {
  const ipKey = sanitizeIp(clientIp);
  try {
    inMemoryStore.rateLimits.set(ipKey, {
      consecutiveFailures: 0,
      blockUntil: 0,
      lastSuccess: Date.now()
    });
  } catch (err) {
    console.error("[RateLimit Reset Error]:", err);
  }
}

const adminAuthMiddleware = async (req: any, res: any, next: any) => {
  const clientIp = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown")
    .toString()
    .split(",")[0]
    .trim();

  // 1. Persistent brute-force check via in-memory store
  const limitStatus = await checkRateLimit(clientIp);
  if (limitStatus.blocked) {
    return res.status(429).json({
      error: `Đã nhập sai quá nhiều lần, vui lòng thử lại sau ${limitStatus.remainingMinutes || 15} phút`
    });
  }

  const rawAdminCode = (req.headers["x-admin-code"] || req.query?.code || req.body?.code || "").toString().trim();
  const adminCode = rawAdminCode.replace(/^["']|["']$/g, "").trim();

  // Mật khẩu admin CHỈ lấy từ biến môi trường ADMIN_CODE trên Vercel (không còn mật khẩu viết cứng trong code)
  const rawEnvCode = (
    process.env.ADMIN_CODE || 
    process.env.ADMIN_PASSWORD || 
    process.env.admin_code || 
    process.env.Admin_Code || 
    ""
  ).trim();

  // Securely strip any accidental outer quotes pasted from copy-paste templates
  const envAdminCode = rawEnvCode.replace(/^["']|["']$/g, "").trim();

  if (!envAdminCode) {
    const failResult = await recordFailedAttempt(clientIp);
    if (failResult.blocked) {
      return res.status(429).json({ error: "Đã nhập sai quá 5 lần, vui lòng thử lại sau 15 phút" });
    }
    return res.status(401).json({ 
      error: "Máy chủ chưa cấu hình ADMIN_CODE. Vào Vercel → Settings → Environment Variables để thêm mã admin."
    });
  }

  // Split and sanitize each individual code (stripping potential inner quotes)
  const adminCodes = envAdminCode
    .split(",")
    .map(c => c.replace(/^["']|["']$/g, "").trim())
    .filter(Boolean);

  const envMatch = adminCode && adminCodes.includes(adminCode);

  if (envMatch) {
    recordSuccessfulAttempt(clientIp).catch(console.error);
    return next();
  } else {
    const failResult = await recordFailedAttempt(clientIp);
    if (failResult.blocked) {
      return res.status(429).json({ error: "Đã nhập sai quá 5 lần, vui lòng thử lại sau 15 phút" });
    }
    
    // Provide secure, masked debug details to guide the user in setting up variables properly
    const envKeysFound = Object.keys(process.env).filter(k => 
      ["ADMIN_CODE", "ADMIN_PASSWORD", "admin_code", "Admin_Code"].includes(k) && !!process.env[k]
    );

    return res.status(401).json({ 
      error: "Mã bảo mật Admin không chính xác. Vui lòng kiểm tra cấu hình ADMIN_CODE trên Vercel.",
      debugInfo: {
        keysDetected: envKeysFound,
        codesLoadedCount: adminCodes.length,

        inputLength: adminCode.length,
      }
    });
  }
};


// ══════════════════════════════════════════════════════════════════
// BẢO MẬT GÓI TRẢ PHÍ & GOOGLE SHEET
// - Gói của khách chỉ do MÁY CHỦ quyết định (admin kích hoạt) — trình duyệt không tự mở được
// - Trình duyệt không còn biết địa chỉ Google Apps Script; mọi lệnh đi qua /api/gas-proxy
// - Lệnh quản trị (kích hoạt gói, thống kê, hoa hồng...) bắt buộc có mã admin
// ══════════════════════════════════════════════════════════════════
type GoiKey = "free" | "standard" | "design";
const GOI_LABEL: Record<GoiKey, string> = { free: "Báo cáo cơ bản", standard: "Báo cáo đầy đủ", design: "Báo cáo + Bản vẽ" };
function labelToGoi(label: string): GoiKey {
  const l = String(label || "").toLowerCase();
  if (l.includes("bản vẽ") || l === "design") return "design";
  if (l.includes("đầy đủ") || l === "standard") return "standard";
  return "free";
}

function getAdminCodes(): string[] {
  const raw = (process.env.ADMIN_CODE || process.env.ADMIN_PASSWORD || process.env.admin_code || process.env.Admin_Code || "")
    .trim().replace(/^["']|["']$/g, "").trim();
  return raw.split(",").map(c => c.replace(/^["']|["']$/g, "").trim()).filter(Boolean);
}
function isAdminRequest(req: any): boolean {
  const code = String(req.headers["x-admin-code"] || "").replace(/^["']|["']$/g, "").trim();
  if (!code) return false;
  const codes = getAdminCodes();
  return codes.length > 0 && codes.includes(code);
}

/** Gửi lệnh sang Google Apps Script, kèm mã bí mật GAS_SECRET */
async function forwardToGas(payload: any): Promise<any> {
  const url = getGasUrl();
  if (!url) throw new Error("GOOGLE_SHEETS_GAS_URL chưa cấu hình trên máy chủ");
  const body = { ...payload, secret: (process.env.GAS_SECRET || "").trim() };
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(body),
    redirect: "follow"
  });
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { ok: response.ok, raw: text.substring(0, 500) }; }
}

const packageCache = new Map<string, { goi: GoiKey; ts: number }>();
const PACKAGE_CACHE_MS = 60 * 1000;

/** Gói đã được xác nhận của 1 khách: Firestore → bộ nhớ tạm → Google Sheet → "free" */
async function getVerifiedPackage(clientId: string): Promise<GoiKey> {
  const id = String(clientId || "").trim();
  if (!id) return "free";
  const cached = packageCache.get(id);
  if (cached && Date.now() - cached.ts < PACKAGE_CACHE_MS) return cached.goi;

  let goi: GoiKey | null = null;
  if (firestoreDb) {
    try {
      const snap: any = await withTimeout(firestoreDb.collection("packages").doc(id).get(), 4000);
      if (snap && snap.exists) goi = labelToGoi(snap.data()?.goi);
    } catch (e: any) { console.warn("[Package] Firestore read:", e?.message || e); }
  }
  if (!goi && getGasUrl()) {
    try {
      const r = await withTimeout(forwardToGas({ type: "get_goi", ma_kh: id }), 8000);
      if (r && r.ok && r.goi_mua) goi = labelToGoi(r.goi_mua);
    } catch (e: any) { console.warn("[Package] GAS lookup:", e?.message || e); }
  }
  const finalGoi: GoiKey = goi || (cached?.goi ?? "free");
  packageCache.set(id, { goi: finalGoi, ts: Date.now() });
  return finalGoi;
}

async function setVerifiedPackage(clientId: string, goi: GoiKey, meta: Record<string, any> = {}) {
  const id = String(clientId || "").trim();
  if (!id) return;
  packageCache.set(id, { goi, ts: Date.now() });
  if (firestoreDb) {
    try {
      await withTimeout(firestoreDb.collection("packages").doc(id).set({
        goi, label: GOI_LABEL[goi], updatedAt: new Date().toISOString(), ...meta
      }, { merge: true }), 5000);
    } catch (e: any) { console.warn("[Package] Firestore write:", e?.message || e); }
  }
}

// Lệnh khách hàng được phép gửi (không cần mã admin)
const GAS_PUBLIC_TYPES = new Set([
  "register_customer", "khach_hang", "video_order", "video_orders",
  "ctv_affiliate", "hoa_hong", "get_mau_thiet_ke", "xuat_pdf"
]);
// Lệnh quản trị (bắt buộc mã admin)
const GAS_ADMIN_TYPES = new Set([
  "kich_hoat_goi", "update_goi", "giao_dich", "cap_nhat_video", "update_video_status",
  "get_stats", "get_tong_hop_ctv", "cap_nhat_anh_phoi_canh", "update_commission_status", "get_goi"
]);

// --- API ROUTES ---

// Health check moved up

// Proxy endpoint to forward requests to Google Apps Script bypassing browser CORS and iframe sandbox restrictions
app.post("/api/gas-proxy", express.text({ type: "*/*" }), async (req, res) => {
  try {
    let payloadObj: any = {};
    if (typeof req.body === "string") {
      try { payloadObj = JSON.parse(req.body || "{}"); } catch { payloadObj = {}; }
    } else if (req.body && typeof req.body === "object") {
      payloadObj = req.body;
    }
    // Hỗ trợ dạng { data: "<json>" } (giống URLSearchParams cũ)
    if (payloadObj && typeof payloadObj.data === "string" && !payloadObj.type && !payloadObj.api_type) {
      try { payloadObj = JSON.parse(payloadObj.data); } catch {}
    }
    const type = String(payloadObj?.api_type || payloadObj?.type || "");
    delete payloadObj.secret;

    if (!type) return res.status(400).json({ ok: false, error: "Thiếu type" });

    const admin = isAdminRequest(req);
    if (GAS_ADMIN_TYPES.has(type)) {
      if (!admin) {
        const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").toString().split(",")[0].trim();
        recordFailedAttempt(ip).catch(() => {});
        return res.status(401).json({ ok: false, error: "Lệnh này cần mã Admin" });
      }
    } else if (!GAS_PUBLIC_TYPES.has(type)) {
      return res.status(400).json({ ok: false, error: "Lệnh không hợp lệ: " + type });
    }

    // Khách không được tự khai gói đã mua — máy chủ ghi đè bằng gói đã xác nhận
    if (!admin && (type === "register_customer" || type === "khach_hang" || type === "xuat_pdf")) {
      const id = payloadObj.ma_kh || payloadObj.id || payloadObj.clientId || payloadObj.stt;
      const goi = await getVerifiedPackage(id);
      payloadObj.goi_mua = GOI_LABEL[goi];
      delete payloadObj.doanh_thu;
      delete payloadObj.trang_thai;
    }
    // Hoa hồng do khách tạo luôn ở trạng thái chờ duyệt
    if (!admin && type === "hoa_hong") {
      payloadObj.trang_thai = "Chờ duyệt";
    }
    // Admin kích hoạt gói qua proxy → lưu luôn vào máy chủ
    if (admin && (type === "kich_hoat_goi" || type === "update_goi")) {
      const id = payloadObj.ma_kh || payloadObj.userInfo?.phone || payloadObj.so_dt || payloadObj.sdt;
      if (id) await setVerifiedPackage(String(id), labelToGoi(payloadObj.goi_mua), { so_tien: payloadObj.so_tien || 0 });
    }

    console.log(`[GAS Proxy] ${admin ? "ADMIN" : "PUBLIC"} → "${type}"`);
    const result = await forwardToGas(payloadObj);
    res.json(result);
  } catch (err: any) {
    console.error("[GAS Proxy Error]:", err.message || err);
    res.status(500).json({ ok: false, error: err.message || "Failed to forward request to Apps Script" });
  }
});

// Khách hỏi: gói của tôi đã được kích hoạt chưa?
app.get("/api/package/:clientId", async (req, res) => {
  try {
    const goi = await getVerifiedPackage(req.params.clientId);
    res.json({ ok: true, goi, label: GOI_LABEL[goi] });
  } catch (err: any) {
    res.json({ ok: true, goi: "free", label: GOI_LABEL.free });
  }
});

// Khách nhập mã kích hoạt do admin cấp.
// Cấu hình trên Vercel: ACTIVATION_CODES = "MA-ABC123:standard,MA-XYZ789:design" (mỗi mã dùng 1 lần)
const usedCodesMemory = new Set<string>();
app.post("/api/redeem-code", async (req, res) => {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").toString().split(",")[0].trim();
  try {
    const limit = await checkRateLimit(ip);
    if (limit.blocked) return res.status(429).json({ ok: false, error: "Nhập sai quá nhiều lần, thử lại sau 15 phút" });

    const clientId = String(req.body?.clientId || "").trim();
    const code = String(req.body?.code || "").trim().toUpperCase();
    if (!clientId || !code) return res.status(400).json({ ok: false, error: "Thiếu mã" });

    const table: Record<string, GoiKey> = {};
    String(process.env.ACTIVATION_CODES || "").split(",").forEach(pair => {
      const [c, g] = pair.split(":").map(x => (x || "").trim());
      if (c && (g === "standard" || g === "design")) table[c.toUpperCase()] = g;
    });
    const goi = table[code];
    if (!goi) {
      await recordFailedAttempt(ip);
      return res.status(400).json({ ok: false, error: "Mã không hợp lệ" });
    }

    // Kiểm tra mã đã dùng chưa
    let used = usedCodesMemory.has(code);
    if (!used && firestoreDb) {
      try {
        const snap: any = await withTimeout(firestoreDb.collection("usedCodes").doc(code).get(), 4000);
        used = !!(snap && snap.exists && snap.data()?.clientId !== clientId);
      } catch {}
    }
    if (used) return res.status(400).json({ ok: false, error: "Mã đã được sử dụng" });

    usedCodesMemory.add(code);
    if (firestoreDb) {
      try {
        await withTimeout(firestoreDb.collection("usedCodes").doc(code).set({ clientId, goi, usedAt: new Date().toISOString() }), 4000);
      } catch {}
    }
    await setVerifiedPackage(clientId, goi, { via: "activation_code", code });
    if (getGasUrl()) {
      forwardToGas({ type: "kich_hoat_goi", ma_kh: clientId, goi_mua: GOI_LABEL[goi] }).catch(() => {});
    }
    recordSuccessfulAttempt(ip).catch(() => {});
    res.json({ ok: true, goi, label: GOI_LABEL[goi] });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "Redeem failed" });
  }
});

// Admin thêm mẫu thiết kế (Firestore khóa ghi từ trình duyệt)
app.post("/api/admin/design-samples", adminAuthMiddleware, async (req, res) => {
  try {
    if (!firestoreDb) return res.status(500).json({ ok: false, error: "Máy chủ chưa kết nối Firestore (FIREBASE_SERVICE_ACCOUNT)" });
    const sample = req.body || {};
    const ref = await withTimeout(firestoreDb.collection("designSamples").add({ ...sample, createdAt: new Date().toISOString() }), 6000);
    res.json({ ok: true, id: (ref as any).id });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "Add sample failed" });
  }
});

// Admin kích hoạt gói cho khách (cách duy nhất để mở gói trả phí)
app.post("/api/admin/activate-package", adminAuthMiddleware, async (req, res) => {
  try {
    const { clientId, goi, so_tien } = req.body || {};
    if (!clientId || !["free", "standard", "design"].includes(goi)) {
      return res.status(400).json({ ok: false, error: "Thiếu clientId hoặc gói không hợp lệ" });
    }
    await setVerifiedPackage(String(clientId), goi as GoiKey, { so_tien: Number(so_tien) || 0 });
    let gas: any = null;
    if (getGasUrl()) {
      try {
        gas = await forwardToGas({ type: "kich_hoat_goi", ma_kh: clientId, goi_mua: GOI_LABEL[goi as GoiKey], so_tien: Number(so_tien) || 0 });
      } catch (e: any) { gas = { ok: false, error: e?.message || String(e) }; }
    }
    res.json({ ok: true, goi, label: GOI_LABEL[goi as GoiKey], gas });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || "Activate failed" });
  }
});

// Database Get Leads for CRM Dashboard
app.get("/api/leads", adminAuthMiddleware, async (req, res) => {
  const leads = await getLeads();
  res.json(leads);
});

// Objective 8: Get Tong_Hop_CTV summaries
app.get("/api/tong-hop-ctv", adminAuthMiddleware, async (req, res) => {
  try {
    if (getGasUrl()) {
      const data = await forwardToGas({ type: "get_tong_hop_ctv" });
      if (data && data.ok && Array.isArray(data.data)) {
        return res.json(data.data);
      }
    }
  } catch (err) {
    console.warn("Could not fetch Tong_Hop_CTV from GAS, calculating locally.");
  }

  // Fallback calculation on server
  const leads = await getLeads();
  const ctvMap: Record<string, any> = {};
  leads.forEach(lead => {
    const code = (lead.ma_ctv || lead.maCtv || (lead.userInfo && lead.userInfo.ma_ctv) || "").trim().toUpperCase();
    if (!code) return;
    if (!ctvMap[code]) {
      ctvMap[code] = {
        code,
        loaiDoiTac: code.startsWith("VIP") ? "B2B VIP" : code.startsWith("B2B") ? "B2B Đối Tác" : "CTV Thường",
        totalKH: 0,
        totalVideo: 0,
        totalRevenue: 0,
        totalCommission: 0,
        commissionPaid: 0,
        commissionDebt: 0,
        lastUpdated: new Date().toLocaleDateString('vi-VN')
      };
    }
    const c = ctvMap[code];
    c.totalKH++;
    if (lead.doanh_thu) {
      c.totalRevenue += Number(lead.doanh_thu);
    } else if (lead.doanhThu) {
      c.totalRevenue += Number(lead.doanhThu);
    }
  });

  res.json(Object.values(ctvMap));
});

// Section D: Get design templates catalog (Mau_Thiet_Ke tab from Google Sheet GAS or fallback)
app.get("/api/mau-thiet-ke", async (req, res) => {
  try {
    if (getGasUrl()) {
      const r = await forwardToGas({ type: "get_mau_thiet_ke" });
      const data = Array.isArray(r) ? r : r?.data;
      if (Array.isArray(data) && data.length > 0) {
        return res.json(data);
      }
    }
  } catch (err) {
    console.warn("Could not fetch Mau_Thiet_Ke from GAS, serving default catalog.");
  }

  // Fallback catalog representing tab "Mau_Thiet_Ke"
  res.json([
    {
      id: '1',
      roomType: 'Phòng khách',
      style: 'Hiện đại',
      element: 'Thủy',
      imageUrl: 'https://drive.google.com/uc?export=view&id=1B2M2Y8AsgTzEm874-Hzk27zR1Kz5r5x5',
      youtubeId: '',
      title: 'Phòng khách không gian mở tông xanh thủy - gỗ óc chó',
      note: 'Phù hợp gia chủ mệnh Thủy & Mộc, thiết kế tối ưu ánh sáng tự nhiên.'
    },
    {
      id: '2',
      roomType: 'Phòng bếp',
      style: 'Tân cổ điển',
      element: 'Hỏa',
      imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
      youtubeId: '',
      title: 'Hệ tủ bếp chữ L cao cấp phối màu trầm ấm',
      note: 'Tối ưu công năng nấu nướng, chuẩn phong thủy hướng bếp cho mệnh Hỏa.'
    },
    {
      id: '3',
      roomType: 'Phòng ngủ',
      style: 'Tropical',
      element: 'Mộc',
      imageUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
      youtubeId: '',
      title: 'Phòng ngủ master phong cách Nhiệt đới xanh mát',
      note: 'Sử dụng vật liệu gỗ tự nhiên sinh vượng khí cho gia chủ mệnh Mộc.'
    },
    {
      id: '4',
      roomType: 'Hồ cá Koi',
      style: 'Hiện đại',
      element: 'Thủy',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      youtubeId: '',
      title: 'Hồ cá Koi mini kết hợp thác nước phong thủy trước nhà',
      note: 'Kích hoạt tài lộc, vượng khí cực mạnh cho cung tài vị.'
    },
    {
      id: '5',
      roomType: 'Sân vườn',
      style: 'Tropical',
      element: 'Thổ',
      imageUrl: 'https://images.unsplash.com/photo-1584467735818-f2f2f7ea16aa?auto=format&fit=crop&w=800&q=80',
      youtubeId: '',
      title: 'Sân vườn tiểu cảnh đá tự nhiên kết hợp cây xanh',
      note: 'Bổ trợ hành Thổ và Mộc, tạo không gian nghỉ dưỡng thanh bình.'
    },
    {
      id: '6',
      roomType: 'Cầu thang',
      style: 'Tối giản',
      element: 'Kim',
      imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      youtubeId: '',
      title: 'Cầu thang kính cường lực tay vịn âm tường tinh tế',
      note: 'Chất liệu kim loại và kính phù hợp gia chủ mệnh Kim.'
    },
    {
      id: '7',
      roomType: 'Phòng tắm',
      style: 'Hiện đại',
      element: 'Thủy',
      imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      youtubeId: '',
      title: 'Phòng tắm thiết bị cao cấp phối đá marble chống trượt',
      note: 'Thiết kế thông thoáng, bố trí chuẩn phong thủy khu vực vệ sinh cho mệnh Thủy & Kim.'
    }
  ]);
});

// Config endpoint to share GAS URL with frontend
app.get("/api/config", (req, res) => {
  // Không trả địa chỉ Apps Script thật cho trình duyệt — chỉ trả đường dẫn proxy nội bộ
  res.json({
    gasUrl: getGasUrl() ? "/api/gas-proxy" : "",
    hotline: (process.env.HOTLINE || "0973 480 488").trim(),
    bankInfo: (process.env.BANK_INFO || "").trim()
  });
});

// Diagnostic endpoint (secured via adminAuthMiddleware, no hardcoded backdoor)
app.post("/api/diagnose", adminAuthMiddleware, async (req, res) => {
  const { targetClientId } = req.body;

  const reports: any = {
    env: {
      hasFreeKey: !!process.env.GEMINI_API_KEY,
      hasPaidKey: !!process.env.GEMINI_API_KEY_PAID || !!process.env.GEMINI_PAID_KEY,
      hasAdminCode: !!process.env.ADMIN_CODE,
      hasGasUrl: !!process.env.GOOGLE_SHEETS_GAS_URL,
      nodeVersion: process.version,
    },
    clientsStatus: {
      aiFreeInitialized: !!aiFree,
      aiPaidInitialized: !!aiPaid,
    },
  };

  if (targetClientId) {
    const leads = await getLeads();
    reports.targetLead = leads.find(l => l.id === targetClientId);
  }

  res.json(reports);
});

// Create or update (realtime autosave) lead
app.post("/api/leads", async (req, res) => {
  const clientData = req.body;
  if (!clientData.id) {
    return res.status(400).json({ error: "Missing unique Client ID (id) for autosaving." });
  }

  const leads = await getLeads();
  const existingIndex = leads.findIndex((l) => l.id === clientData.id);

  const updatedLead = {
    ...clientData,
    status: clientData.status || "new",
    createdAt: clientData.createdAt || new Date().toISOString()
  };

  await saveLeadToFirestore(updatedLead);
  
  // Background fire-and-forget notification to Google Sheets web app
  notifyGoogleSheets(updatedLead).catch((err) => {
    console.error("Async Google Sheets notification task failed:", err);
  });

  res.json({ success: true, lead: updatedLead });
});

// Update Caregiver Lead status from CRM admin dashboard (secured)
app.patch("/api/leads/:id/status", adminAuthMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const leads = await getLeads();
  const lead = leads.find((l) => l.id === id);

  if (lead) {
    lead.status = status;
    await saveLeadToFirestore(lead);
    return res.json({ success: true, lead: lead });
  }

  res.status(404).json({ error: "Lead not found." });
});

// Admin kích hoạt gói sau khi KH thanh toán (secured)
app.patch("/api/leads/:id/goi", adminAuthMiddleware, async (req, res) => {
  const { id } = req.params;
  const { goi_mua, trang_thai_pdf } = req.body;
  // goi_mua: "free" | "standard_299" | "thiet_ke_1500" | "ban_ve"
  // trang_thai_pdf: "chua_xuat" | "da_xuat" | "san_sang_download"

  const leads = await getLeads();
  const lead = leads.find((l) => l.id === id);
  if (!lead) return res.status(404).json({ error: "Không tìm thấy khách hàng." });

  lead.goi_mua = goi_mua || lead.goi_mua;
  lead.trang_thai_pdf = trang_thai_pdf || lead.trang_thai_pdf;
  lead.activated_at = new Date().toISOString();

  await saveLeadToFirestore(lead);

  // Đồng bộ lên Google Sheet
  notifyGoogleSheets({
    ...lead,
    type: "update_goi",
  }).catch(console.error);

  res.json({ success: true, lead: lead });
});

// KH check trạng thái gói của mình (dùng SĐT làm key)
app.get("/api/leads/check/:phone", adminAuthMiddleware, async (req, res) => {
  const { phone } = req.params;
  const leads = await getLeads();
  const lead = leads.find((l) => l.userInfo?.phone === phone);
  if (!lead) return res.status(404).json({ error: "Không tìm thấy." });

  res.json({
    id: lead.id,
    goi_mua: lead.goi_mua || "free",
    trang_thai_pdf: lead.trang_thai_pdf || "chua_xuat",
    activated_at: lead.activated_at || null,
  });
});

// API Phong Thủy AI Analysis
app.post("/api/fengshui/analyze", async (req, res) => {
  const { userInfo, lang = "vi" } = req.body;

  if (!userInfo?.name || !userInfo?.birthDate || !userInfo?.gender) {
    return res.status(400).json({
      error: lang === "vi" 
        ? "Vui lòng nhập đầy đủ tên, ngày sinh và giới tính gia chủ." 
        : "Please supply complete owner name, birth date, and gender."
    });
  }

  if (FREE_KEYS.length + PAID_KEYS.length === 0) {
    // Fallback nếu không có key nào trong .env
    const birthYear = getLunarBirthYear(userInfo.birthDate);
    const targetYear = Number(userInfo.constructionYear) || getDefaultConstructionYear();
    const baseInfo = generateLocalFengShui(userInfo.name, birthYear, userInfo.gender, userInfo.desiredDirection, lang, targetYear, userInfo);
    return res.json(baseInfo);
  }

  try {
    const birthYear = getLunarBirthYear(userInfo.birthDate);
    const targetYear = Number(userInfo.constructionYear) || getDefaultConstructionYear();
    const baseInfo = generateLocalFengShui(userInfo.name, birthYear, userInfo.gender, userInfo.desiredDirection, lang, targetYear, userInfo);

    const prompt = `Bạn là bậc thầy phong thủy am hiểu sâu sắc Bát Trạch Minh Cảnh và các bộ sách cổ kiến trúc. Hãy phân tích chuyên sâu cho gia chủ ${userInfo.name}:
- Ngày sinh: ${userInfo.birthDate} (${userInfo.gender}) - Năm sinh ${baseInfo.canChi} (${birthYear})
- Bản mệnh Lục Thập Hoa Giáp chuẩn xác: ${baseInfo.element}
- Cung Phi Bát Trạch chuẩn xác: ${baseInfo.cungPhi}
- Hướng đất dự định: ${userInfo.desiredDirection || "Tự chọn"}
- Mục đích: ${userInfo.purpose || "Xây nhà ở"}

Yêu cầu (ngôn ngữ ${lang}):
1. Khẳng định chuẩn xác Bản mệnh (${baseInfo.element}) và Cung Phi (${baseInfo.cungPhi}).
2. 4 hướng Cát (${baseInfo.favorableDirections.join(", ")}) và 4 hướng Hung (${baseInfo.unfavorableDirections.join(", ")}) theo Bát Trạch.
3. Tư vấn hướng bàn thờ, hướng giường ngủ, hướng bếp chuẩn "Tọa Hung Hướng Cát".
4. Xem tuổi năm khởi công ${targetYear} (${getCanChi(targetYear)}) — KẾT QUẢ ĐÃ TÍNH SẴN, KHÔNG ĐƯỢC TỰ TÍNH LẠI: ${baseInfo.advice2026}
5b. Kết luận hướng nhà ĐÃ TÍNH SẴN, giữ nguyên: ${baseInfo.directionVerdict?.summary || ""}. Chỉ được diễn giải thêm cách bố trí kiến trúc, không đảo kết luận.
5. Phân tích sự tương tác giữa hướng nhà và cung mệnh.
6. Văn phong: Tri thức, uy tín, kết hợp hài hòa phong thủy và kiến trúc hiện đại. KHÔNG dùng markdown.

JSON Format:
{
  "element": "${baseInfo.element}",
  "cungPhi": "${baseInfo.cungPhi}",
  "canChi": "${baseInfo.canChi}",
  "favorableDirections": ["dir1", "dir2"],
  "unfavorableDirections": ["dir1", "dir2"],
  "favorableColors": ["color1", "color2"],
  "favorableGroundbreakingDates": ["Ngày/Tháng/Năm"],
  "deepAnalysis": "Bài phân tích chi tiết (300-500 chữ)..."
}`;

    const response = await callGeminiWithRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              element: { type: Type.STRING },
              cungPhi: { type: Type.STRING },
              canChi: { type: Type.STRING },
              favorableDirections: { type: Type.ARRAY, items: { type: Type.STRING } },
              unfavorableDirections: { type: Type.ARRAY, items: { type: Type.STRING } },
              favorableColors: { type: Type.ARRAY, items: { type: Type.STRING } },
              favorableGroundbreakingDates: { type: Type.ARRAY, items: { type: Type.STRING } },
              deepAnalysis: { type: Type.STRING }
            },
            required: ["element", "cungPhi", "favorableDirections", "favorableColors", "favorableGroundbreakingDates", "deepAnalysis"]
          }
        }
      })
    );

    const parsed = JSON.parse(response.text.trim());
    if (!parsed.element || parsed.element.includes("Mệnh Ngũ Hành")) {
      parsed.element = baseInfo.element;
    }
    if (!parsed.cungPhi) parsed.cungPhi = baseInfo.cungPhi;
    if (!parsed.canChi) parsed.canChi = baseInfo.canChi;
    if (!parsed.unfavorableDirections || parsed.unfavorableDirections.length === 0) {
      parsed.unfavorableDirections = baseInfo.unfavorableDirections;
    }
    // Các trường tính toán phải lấy từ thuật toán cố định — AI chỉ viết phần diễn giải
    parsed.element = baseInfo.element;
    parsed.cungPhi = baseInfo.cungPhi;
    parsed.canChi = baseInfo.canChi;
    parsed.favorableDirections = baseInfo.favorableDirections;
    parsed.unfavorableDirections = baseInfo.unfavorableDirections;
    parsed.favorableColors = baseInfo.favorableColors;
    parsed.unfavorableColors = baseInfo.unfavorableColors;
    parsed.favorableGroundbreakingDates = baseInfo.favorableGroundbreakingDates;
    parsed.advice2026 = baseInfo.advice2026;
    parsed.directionVerdict = baseInfo.directionVerdict;
    parsed.borrowAgeCandidates = baseInfo.borrowAgeCandidates;
    parsed.targetYear = baseInfo.targetYear;
    parsed.luckyNumbers = baseInfo.luckyNumbers;
    parsed.isLocal = false;
    res.json(parsed);
  } catch (error: any) {
    console.warn("Gemini Fengshui API Notice (chuyển sang công cụ phong thủy chuẩn Yohu):", error?.message || error);
    // Fallback về local nếu tất cả key đều lỗi
    const birthYear = getLunarBirthYear(userInfo.birthDate);
    const targetYear = Number(userInfo.constructionYear) || getDefaultConstructionYear();
    const fallback = generateLocalFengShui(userInfo.name, birthYear, userInfo.gender, userInfo.desiredDirection, lang, targetYear, userInfo);
    res.json(fallback);
  }
});

// API Core Construction Model (AI estimation, materials selection, structural calculations)
app.post("/api/construction/analyze", async (req, res) => {
  const { userInfo, constructionInfo, detailItems, lang = "vi" } = req.body;

  // Verification
  if (!constructionInfo?.overallDescription && !constructionInfo?.constructionType) {
    return res.status(400).json({
      error: lang === "vi" 
        ? "Vui lòng nhập mô tả công trình hoặc chọn loại công trình." 
        : "Please supply construction description or select a type."
    });
  }

  if (FREE_KEYS.length + PAID_KEYS.length === 0) {
    // Generate beautiful fallback computation
    const fallbackEstimate = generateLocalEstimate(constructionInfo, detailItems, lang);
    return res.json(applyUnifiedPricing(fallbackEstimate, { constructionInfo, userInfo }));
  }

  try {
    const imagesParts = (constructionInfo.referenceImages || []).map((imgBase64: string) => {
      const cleanBase64 = imgBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
      return {
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64
        }
      };
    });

    const promptText = `
      You are a high-level SaaS cost estimator, civil structural engineer, and materials optimizer for "Yohu Việt Nam" constructor.
      Review the client overall description, specified architectural type, custom items configuration, and images (if uploaded).
      
      Client Details:
      - Name: ${userInfo?.name || "Anonymous Client"}
      - Overall description: ${constructionInfo.overallDescription}
      - Architectural Type: ${constructionInfo.constructionType}
      - Budget: ${constructionInfo.totalBudget} ${constructionInfo.budgetUnit}
      - Dimensions: ${constructionInfo.dimensions}
      - Floors Count: ${constructionInfo.floors}
      - Standards requested: ${constructionInfo.standard} ${constructionInfo.otherStandardRequirement ? `(${constructionInfo.otherStandardRequirement})` : ""}
      - Primary Structure: ${constructionInfo.loai_ket_cau_chinh || "Bê tông cốt thép truyền thống"}
      - Frontages: ${constructionInfo.so_mat_tien || 1}
      - Custom items: thep_hop_cot=${constructionInfo.thep_hop_cot || "N/A"}, loai_mai=${constructionInfo.loai_mai || "N/A"}, loai_san=${constructionInfo.loai_san || "N/A"}, loai_vach=${constructionInfo.loai_vach || "N/A"}, loai_tran=${constructionInfo.loai_tran || "N/A"}
      - Rooms layout: ${JSON.stringify(constructionInfo.rooms)}
      - Details (Móng, tường, cột, dầm, trần, xi măng, cửa, ngói, gạch, điện nước): ${JSON.stringify(detailItems || {})}

      CRITICAL INSTRUCTION FOR STRUCTURAL SYSTEM:
      If Primary Structure is "Bê tông nhẹ EPS đúc liền khối & Gông 3D" (hoặc có chứa "EPS", "Bê tông nhẹ", "Gông 3D"):
      - Timeline is 50% faster (turnkey handover in only 15 - 30 days; 3D formwork disassembled after 24h via R7 fast-curing accelerator).
      - Deadweight is 50% - 65% lighter than brick masonry, so 90% of sites require NO expensive pile foundation—only standard strip footing or raft footing with 5cm notch grooves.
      - Main D14 columns (20x20cm, 4D14) and 15cm EPS walls are cast monolithically in one pour with zero joints, eliminating hairline cracks and water leaks permanently.
      - Superb thermal insulation (rooms 4 - 6°C cooler than outside, saving 40% - 50% AC electricity) and acoustic isolation (>45 dB).
      - 100% pre-embedded conduits before casting (zero wall chasing).

      Task:
      Perform deep analysis and act as a BOQ Engine to calculate actual quantities. 
      - Generate a detailed BOQ (Bill of Quantities) based on area, floors, foundation type, and finishing style. Break down sand/stone (m3), cement (tons/bags), steel (tons by type/phi), bricks (pieces), tiles (m2), doors (qty), MEP (length), paints (buckets/liters) etc.
      - Generate a professional construction timeline divided by phases (prep, piling, foundation, structure, masonry, MEP, waterproofing, finishing, interior, handover) with days, payment %, tasks, materials used, number of workers.
      - Generate Acceptance Checklists (Nghiệm thu) for each phase.
      - Generate Feng Shui analysis explaining clearly like an architect combining practical Feng Shui. Do not use generic phrases without practical explanations. Connect architectural layout, air flow, and house orientation to practical Feng Shui principles. Explain cause -> effect -> practical energy outcome like a high-end villa design description.
      - Provide structural analysis and expert notes on cost saving and risk recommendations.
      - Provide 3 packages (Economy, Standard, Premium).

      PRICING RULE (BẮT BUỘC):
      - KHÔNG tự đặt bất kỳ đơn giá, thành tiền, tổng dự toán hay giá 3 gói nào. Hệ thống Yohu tự tính toàn bộ con số tiền từ bảng đơn giá chuẩn và sẽ ghi đè các trường boq, totalBoqCost, budgetTable, threeOptions.
      - Với các trường số tiền trong JSON: điền 0 hoặc chuỗi rỗng. Trong phần chữ (expertNote, structuralAnalysis, timeline...) KHÔNG nêu số tiền cụ thể; chỉ nêu khối lượng, giải pháp, rủi ro, cách tiết kiệm.

      CRITICAL WRITING STYLE RULES & DOMAIN STANDARDS:
      - Act as a high-end architecture studio producing a technical design brief.
      - Target Language: Return all text in ${lang === "vi" ? "Vietnamese" : lang === "lo" ? "Lao" : lang === "zh" ? "Chinese" : "English"}.
      - DO NOT use hyperbolic or absolute adverbs. Use measured, professional engineering terms.
      - DO NOT invent Feng Shui terms (like "cung Thiên Lộc hướng Đông Nam"). ONLY use standard terms: Sinh Khí, Thiên Y, Diên Niên, Phục Vị, Họa Hại, Ngũ Quỷ, Lục Sát, Tuyệt Mệnh.
      - Always explain the physical/climatic reason FIRST before the Feng Shui outcome (e.g., "Mái ngói hỗ trợ thoát nhiệt, cải thiện đối lưu không khí, từ đó duy trì luân chuyển dương khí..."). Avoid framing everything purely as mystical. Do not over-mystify structural mechanics.
      - ĐỊA GIỚI HÀNH CHÍNH & TINH GỌN BỘ MÁY: Tuyệt đối sử dụng đúng địa giới hành chính thực tế hiện hành theo dữ liệu người dùng nhập, tuân thủ các phương án sáp nhập tỉnh/thành, sáp nhập xã/phường, và tinh gọn bỏ/sáp nhập cấp huyện theo chủ trương cải cách mới nhất của Nhà nước. Không dùng địa danh cũ đã sáp nhập/thay đổi.
      - VẬT LIỆU HOÀN THIỆN TRẦN THEO YÊU CẦU GIA CHỦ: Tuân thủ chính xác và bảo toàn tuyệt đối chủng loại vật tư trần mà gia chủ đã mô tả hoặc chọn (Ví dụ: Tấm ốp đa năng sợi than tre Bamboo Charcoal, Trần nhôm Clip-in/Baffle, Trần nhựa Nano/Lam sóng, Trần gỗ công nghiệp/tự nhiên, Trần thạch cao chống ẩm...). Tuyệt đối KHÔNG tự động biến đổi thành thạch cao nếu gia chủ yêu cầu tấm than tre hoặc trần nhôm hoặc vật liệu khác.
      - CHỐNG THẤM NHÀ 1 TẦNG: Giải thích rõ nhà 1 tầng tuy không có sàn lầu dưới dột trần nhưng BẮT BUỘC chống thấm WC bằng màng polyme đàn hồi (SikaTop Seal 107) + lưới thủy tinh bo chân tường cao 20-30cm để ngăn thấm ngang và ẩm mao dẫn ngấm sang vách phòng khách/ngủ liền kề.
      - CẦU THANG NHÀ 1 TẦNG: Thay vì thang cốn sắt hộp hay thang BTCT cồng kềnh chiếm diện tích, tư vấn Thang gác mái thông minh âm trần (Smart Retractable Ceiling Ladder) điều khiển tự động hạ xuống từ trần khi cần và đóng phẳng khít như mặt trần khi không dùng, tối ưu 100% không gian.
      - KHÔNG GIAN KỸ THUẬT TRẦN DƯỚI MÁI: Phân tích và sinh giải pháp sàn thao tác kỹ thuật trên trần/dưới mái tích hợp bồn nước Inox, máy lọc nước tổng đầu nguồn, máy cấp khí tươi lọc không khí ERV, và cụm nóng điều hòa có cửa chớp louver giải nhiệt đối lưu.

      Format the entire report as a raw JSON payload matching:
      {
        "boq": [
          { "name": "Thép CB400-V phi 16", "brand": "Hòa Phát", "specs": "Đường kính 16mm", "unit": "kg", "quantity": 1200, "unitPrice": 18500, "totalPrice": 22200000, "category": "Thép", "phase": "Móng" }
        ],
        "totalBoqCost": 800000000,
        "timeline": [
          { "phaseName": "Thi công móng", "days": 15, "paymentPercentage": 20, "tasks": ["Đào móng", "Ép cọc", "Đổ bê tông"], "mainMaterials": ["Thép", "Xi măng PCB40"], "workersPerDay": 5 }
        ],
        "checklists": [
          { "phaseName": "Nghiệm thu phần móng", "checks": ["Kiểm tra chủng loại thép", "Đo kích thước hố móng", "Kiểm tra chất lượng bê tông", "Nghiệm thu cao độ móng"] }
        ],
        "fengShui": {
          "summary": "Mộc suy, Kim vượng",
          "details": "Giải thích chi tiết dễ hiểu, ví dụ bếp đối diện cửa chính dễ tạo cảm giác nóng và thất thoát năng lượng..."
        },
        "budgetTable": [
          { "no": 1, "category": "Móng cốc", "material": "Bê tông", "labor": "Chuẩn", "unitPrice": "2M", "total": "20M" }
        ],
        "estimatedDuration": "150 ngày bàn giao",
        "structuralAnalysis": {
          "foundation": "Structural advice", "columns": "columns", "frame": "frame", "roof": "roof", "beam": "beam", "waterproofing": "waterproofing"
        },
        "expertNote": "Optimized materials and cost saving advice, plus risk & recommendations",
        "threeOptions": {
          "economy": { "title": "Economy", "desc": "Desc", "estimatedPrice": "Price" },
          "standard": { "title": "Standard", "desc": "Desc", "estimatedPrice": "Price" },
          "premium": { "title": "Premium", "desc": "Desc", "estimatedPrice": "Price" }
        },
        "ho_so_hoan_cong": "300 từ, gồm 4 phần: (1) Checklist các hạng mục cần nghiệm thu (móng, khung, hoàn thiện, điện nước...), (2) Danh mục vật tư chính đã sử dụng (mẫu bảng), (3) Nội dung giấy bảo hành mẫu (thời hạn bảo hành từng hạng mục theo thông lệ ngành xây dựng VN), (4) Hướng dẫn bảo trì cơ bản 6 tháng đầu. Ghi rõ trong nội dung: đây là MẪU MINH HỌA, hồ sơ hoàn công thực tế sẽ được lập dựa trên thi công thực tế và có xác nhận của kỹ sư giám sát."
      }
      
      Return ONLY valid JSON. Keep descriptions informative, professional, realistic, and commercially persuasive to prompt client scheduling consultation.
    `;

    const contents = [
      ...imagesParts,
      { text: promptText }
    ];

    const response = await callGeminiWithRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents: { parts: contents as any },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
          type: Type.OBJECT,
          properties: {
            boq: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  specs: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  totalPrice: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  phase: { type: Type.STRING }
                },
                required: ["name", "brand", "specs", "unit", "quantity", "unitPrice", "totalPrice", "category", "phase"]
              }
            },
            totalBoqCost: { type: Type.NUMBER },
            timeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phaseName: { type: Type.STRING },
                  days: { type: Type.NUMBER },
                  paymentPercentage: { type: Type.NUMBER },
                  tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
                  mainMaterials: { type: Type.ARRAY, items: { type: Type.STRING } },
                  workersPerDay: { type: Type.NUMBER }
                },
                required: ["phaseName", "days", "paymentPercentage", "tasks", "mainMaterials", "workersPerDay"]
              }
            },
            checklists: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phaseName: { type: Type.STRING },
                  checks: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["phaseName", "checks"]
              }
            },
            fengShui: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                details: { type: Type.STRING }
              },
              required: ["summary", "details"]
            },
            budgetTable: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  no: { type: Type.INTEGER },
                  category: { type: Type.STRING },
                  material: { type: Type.STRING },
                  labor: { type: Type.STRING },
                  unitPrice: { type: Type.STRING },
                  total: { type: Type.STRING }
                },
                required: ["no", "category", "material", "labor", "unitPrice", "total"]
              }
            },
            estimatedDuration: { type: Type.STRING },
            structuralAnalysis: {
              type: Type.OBJECT,
              properties: {
                foundation: { type: Type.STRING },
                columns: { type: Type.STRING },
                frame: { type: Type.STRING },
                roof: { type: Type.STRING },
                beam: { type: Type.STRING },
                waterproofing: { type: Type.STRING }
              },
              required: ["foundation", "columns", "frame", "roof", "beam", "waterproofing"]
            },
            expertNote: { type: Type.STRING },
            threeOptions: {
              type: Type.OBJECT,
              properties: {
                economy: {
                  type: Type.OBJECT,
                  properties: { title: { type: Type.STRING }, desc: { type: Type.STRING }, estimatedPrice: { type: Type.STRING } },
                  required: ["title", "desc", "estimatedPrice"]
                },
                standard: {
                  type: Type.OBJECT,
                  properties: { title: { type: Type.STRING }, desc: { type: Type.STRING }, estimatedPrice: { type: Type.STRING } },
                  required: ["title", "desc", "estimatedPrice"]
                },
                premium: {
                  type: Type.OBJECT,
                  properties: { title: { type: Type.STRING }, desc: { type: Type.STRING }, estimatedPrice: { type: Type.STRING } },
                  required: ["title", "desc", "estimatedPrice"]
                }
              },
              required: ["economy", "standard", "premium"]
            },
            ho_so_hoan_cong: { type: Type.STRING }
          },
          required: ["boq", "totalBoqCost", "timeline", "checklists", "fengShui", "budgetTable", "estimatedDuration", "structuralAnalysis", "expertNote", "threeOptions", "ho_so_hoan_cong"]
        }
      }
    })
    );

    // Mọi con số tiền lấy từ bộ máy giá chuẩn — giống hệt PDF & CRM
    const aiParsed = JSON.parse(response.text.trim());
    res.json(applyUnifiedPricing(aiParsed, { constructionInfo, userInfo }));
  } catch (error: any) {
    console.warn("Gemini Construction API Notice (chuyển sang công cụ dự toán kỹ thuật Yohu):", error?.message || error);
    // Fallback về local nếu tất cả key đều lỗi
    const fallbackEstimate = generateLocalEstimate(constructionInfo, detailItems, lang);
    res.json(applyUnifiedPricing(fallbackEstimate, { constructionInfo, userInfo }));
  }
});

// API Chunking Section Generation for Detailed Technical Specification Report
app.post("/api/generate-specification-section", async (req, res) => {
  const {
    sectionId,
    sectionTitle,
    structuralOptionId,
    structuralOptionName,
    userInfo,
    constructionInfo,
    fengShuiAnalysis,
    structuralFacts,
    previousSectionsSummary,
    referenceContext,
    lang = "vi"
  } = req.body;

  if (!sectionId || !structuralOptionId) {
    return res.status(400).json({ error: "Missing required sectionId or structuralOptionId." });
  }

  try {
    const ownerName = userInfo?.name || "Chủ Đầu Tư";
    const dimensions = constructionInfo?.dimensions || "100m²";
    const floors = constructionInfo?.floors || 2;
    const budget = constructionInfo?.totalBudget 
      ? `${constructionInfo.totalBudget.toLocaleString('vi-VN')} ${constructionInfo.budgetUnit}`
      : "Theo dự toán";
    const address = userInfo?.address || "Việt Nam";

    const prompt = `Bạn là Kỹ sư trưởng Kết cấu & Kiến trúc sư Trưởng của "Yohu Build".
Nhiệm vụ của bạn là soạn thảo MỤC ${sectionId}: "${sectionTitle}" trong bộ hồ sơ "THUYẾT MINH KIẾN TRÚC – KẾT CẤU" chi tiết dành riêng cho công trình của gia chủ.

THÔNG TIN CÔNG TRÌNH DỰ ÁN:
- Chủ đầu tư: ${ownerName} (Năm sinh: ${userInfo?.birthDate || "Chưa nhập"}, Giới tính: ${userInfo?.gender || "nam"})
- Địa điểm xây dựng: ${address}
- Diện tích & kích thước lô đất: ${dimensions}
- Quy mô: ${floors} tầng
- Ngân sách dự kiến: ${budget}
- Phương án kết cấu lựa chọn: ${structuralOptionName} (${structuralOptionId})
- Phong thủy gia chủ: Mệnh ${fengShuiAnalysis?.element || "Bát Trạch"}, Cung ${fengShuiAnalysis?.cungPhi || "Cát"}, Hướng hợp ${fengShuiAnalysis?.favorableDirections?.join(", ") || userInfo?.desiredDirection || "Chính"}

${structuralFacts ? `SỐ LIỆU KẾT CẤU CHUẨN CỦA CÔNG TRÌNH (BẮT BUỘC DÙNG ĐÚNG NHỮNG SỐ NÀY XUYÊN SUỐT MỤC ${sectionId}, TUYỆT ĐỐI KHÔNG TỰ BỊA HOẶC SUY DIỄN RA SỐ KHÁC VỚI CÁC MỤC KHÁC TRONG BỘ HỒ SƠ):
${structuralFacts}
` : ""}
TÓM TẮT NGẮN CÁC MỤC ĐÃ SOẠN TRƯỚC ĐÓ (chỉ để tham khảo mạch văn/bố cục, số liệu kết cấu đã có ở khối bắt buộc phía trên):
${previousSectionsSummary || "Đây là mục bắt đầu của bộ thuyết minh."}

VĂN BẢN MẪU THAM CHIẾU KỸ THUẬT CHO MỤC NÀY (HÃY DÙNG KHUNG SƯỜN, VĂN PHONG VÀ ĐỘ CHI TIẾT KỸ THUẬT NÀY - KHÔNG COPY NGUYÊN VĂN, MÀ ĐIỀN CỤ THỂ SỐ LIỆU ĐẤT & CÔNG TRÌNH CỦA KHÁCH HÀNG):
${referenceContext || "Mô tả chi tiết kỹ thuật chuyên ngành."}

YÊU CẦU SOẠN THẢO BẮT BUỘC (Ngôn ngữ ${lang}):
1. Trình bày chi tiết, chuyên nghiệp dưới góc nhìn Kỹ sư kết cấu + Kiến trúc sư.
2. Điền cụ thể số liệu kích thước móng, cột, dầm, sàn, tường, phong thủy tương ứng với diện tích ${dimensions} và quy mô ${floors} tầng của khách hàng. Nếu khối "SỐ LIỆU KẾT CẤU CHUẨN" phía trên có nêu số/dải số cho hạng mục nào, PHẢI chọn một giá trị cụ thể nằm trong đúng dải đó — dải số trong "VĂN BẢN MẪU THAM CHIẾU" chỉ là khung văn phong, không được dùng để suy ra số liệu khác mâu thuẫn với khối SỐ LIỆU KẾT CẤU CHUẨN.
3. Tuân thủ tuyệt đối phương án kết cấu được chọn: ${structuralOptionName} (${structuralOptionId}). Nếu là PA1 (BTCT truyền thống), mô tả khung cột dầm sàn BTCT đổ tại chỗ và tường gạch. Nếu là PA2 (Khung thép + Cemboard), mô tả khung thép định hình và sàn Cemboard. Nếu là PA3 (Bê tông nhẹ EPS + Gông 3D), mô tả vách EPS đúc liền khối và gông định hình 3D. Tuyệt đối không nhầm lẫn giữa các phương án.
4. BẮT BUỘC TRÌNH BÀY BỐ CỤC RÀNH MẠCH, CHỐNG LIỀN MẠCH DỒN CỤC:
   - Tuyệt đối KHÔNG viết thành một khối chữ liền mạch kéo dài.
   - Bắt buộc chia thành các tiểu mục con rõ ràng (ví dụ: 1.1, 1.2, 1.3... hoặc a., b., c.).
   - Mỗi mục con phải có tiêu đề in đậm rõ ràng (ví dụ: '1.1. Giải pháp kết cấu móng:', '1.2. Khung cột và dầm chịu lực:').
   - Các ý kỹ thuật cụ thể hoặc quy cách vật liệu BẮT BUỘC xuống dòng riêng rẽ, bắt đầu bằng gạch đầu dòng '- ' (ví dụ: '- Cột: Tiết diện 200x200mm...', '- Bê tông: Mác 250 đá 1x2...').
   - Giữa các mục con và giữa các đoạn văn BẮT BUỘC ngắt bằng 1 dòng trống (2 lần xuống dòng) để văn bản thoáng đẹp, khoa học khi xuất file Word và PDF.
5. TUYỆT ĐỐI KHÔNG DÙNG KÝ HIỆU TOÁN HỌC LATEX BỌC TRONG DẤU ĐÔ LA (như $110mm$, $200 \times 300$, $100m²$, $3.5$ tháng). Hãy viết chuẩn văn bản kỹ thuật thông thường (ví dụ: '110mm', '200x300mm', '100m²', '3.5 tháng') để tránh lỗi font chữ và hiển thị dấu $.
6. ĐỊA GIỚI HÀNH CHÍNH & TINH GỌN BỘ MÁY: Sử dụng đúng địa giới hành chính thực tế hiện hành theo thông tin cung cấp (${address}), tuân thủ các phương án sáp nhập tỉnh/thành, sáp nhập xã/phường, và tinh gọn bỏ/sáp nhập cấp huyện theo chủ trương mới nhất của Nhà nước. Không dùng địa danh cũ đã sáp nhập/thay đổi.
7. VẬT LIỆU HOÀN THIỆN TRẦN THEO ĐÚNG YÊU CẦU GIA CHỦ: Tuân thủ chính xác và bảo toàn tuyệt đối chủng loại vật tư trần mà gia chủ đã mô tả hoặc chọn (Ví dụ: Tấm ốp đa năng sợi than tre Bamboo Charcoal, Trần nhôm Clip-in/Baffle, Trần nhựa Nano/Lam sóng, Trần gỗ công nghiệp/tự nhiên, Trần thạch cao chống ẩm...). Tuyệt đối KHÔNG tự ý thay thế thành thạch cao nếu gia chủ yêu cầu tấm than tre hoặc trần nhôm hoặc vật liệu khác.
8. ĐẶC THÙ NHÀ 1 TẦNG (NẾU SỐ TẦNG = 1):
   - Cầu thang: Tư vấn giải pháp Thang gác mái thông minh âm trần (Smart Retractable Ceiling Ladder) điều khiển tự động giấu kín phẳng như trần khi đóng và tự mở xuống khi dùng để thăm/bảo trì gác kỹ thuật, không dùng thang sắt hộp cồng kềnh chiếm diện tích.
   - Chống thấm: Nhấn mạnh tính cấp thiết của việc quét màng đàn hồi SikaTop Seal 107 dán lưới thủy tinh bo chân tường WC cao 30cm nhằm chống thấm ngang ngăn nước mao dẫn ngấm ẩm sang các phòng liền kề.
9. KHÔNG GIAN KỸ THUẬT TRẦN DƯỚI MÁI: Phân tích và sinh giải pháp sàn thao tác kỹ thuật tích hợp bồn nước Inox, máy lọc nước tổng đầu nguồn, máy lọc không khí cấp khí tươi hồi nhiệt (ERV), và cụm nóng điều hòa có cửa chớp louver giải nhiệt đối lưu đầu hồi mái.
10. Trả về trực tiếp văn bản thuyết minh của riêng Mục ${sectionId}. Không kèm lời chào hay ghi chú ngoài.`;

    const response = await callGeminiWithRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents: prompt
      })
    );

    const generatedText = cleanServerVietnameseText(response.text ? response.text.trim() : "");
    return res.json({
      sectionId,
      title: sectionTitle,
      content: generatedText
    });
  } catch (error: any) {
    console.warn(`[Spec Section ${sectionId} Error]:`, error?.message || error);
    return res.status(500).json({ error: "Failed to generate section with Gemini." });
  }
});

// API Chunking Section Translation for Specification Report
app.post("/api/translate-specification-section", async (req, res) => {
  const { text, targetLang, sectionTitle, glossary } = req.body;

  if (!text || !targetLang || targetLang === "vi") {
    return res.json({ translatedText: cleanServerVietnameseText(text || "") });
  }

  try {
    const langName = targetLang === 'en' ? 'English' : targetLang === 'zh' ? 'Simplified Chinese' : targetLang === 'lo' ? 'Lao' : targetLang;
    const prompt = `You are a certified professional architectural and civil engineering translator.
Translate the following entire technical report section titled "${sectionTitle}" completely and accurately into ${langName} (${targetLang}).

CRITICAL TRANSLATION MANDATES:
1. Translate 100% of all sentences, explanations, headings, and bullet points into ${langName}. DO NOT leave mixed Vietnamese sentences in the output.
2. Preserve all technical codes and standards (e.g. TCVN 5574:2018, TCVN 2737:2020, QCVN 06:2022/BXD) exactly as written.
3. Preserve all numerical figures, dimensions (e.g. 200x200mm, D14-D16, 100m², kg/m², VNĐ), percentages, and timelines intact.
4. Keep technical brand/technology acronyms recognizable (e.g. "EPS", "Cemboard", "3D Formwork", "Yohu Build", "Xingfa").
5. Output ONLY the translated technical text, without any conversational greeting, translator commentary, or wrapper quotes.

DOCUMENT TEXT TO TRANSLATE:
${text}`;

    const response = await callGeminiWithRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents: prompt
      })
    );

    const translatedText = response.text ? response.text.trim().normalize('NFC') : text;
    return res.json({ translatedText });
  } catch (error: any) {
    console.warn(`[Spec Translation Error]:`, error?.message || error);
    return res.json({ translatedText: text }); // Fallback to original text
  }
});

// API Q&A Chat interaction with Master Constructor & Spiritual Architect
app.post("/api/qna", async (req, res) => {
  const { chatHistory, newestQuestion, userInfo, constructionInfo, lang = "vi", referenceImage } = req.body;

  if (!newestQuestion) {
    return res.status(400).json({ error: "No question provided." });
  }

  // INTERCEPT SPECIFIC INQUIRY ON 2D / 3D CAD VISUAL ALIGNMENT AND FEES
  const qLower = newestQuestion.toLowerCase();
  const holds2D3D = qLower.includes("2d") || qLower.includes("3d") || qLower.includes("ảnh") || qLower.includes("vẽ") || qLower.includes("phối cảnh") || qLower.includes("render") || qLower.includes("concept") || qLower.includes("cad") || qLower.includes("ຮູບ") || qLower.includes("ແບບແຕ້ມ") || qLower.includes("效果图") || qLower.includes("图纸");
  const holdsAPIorPrice = qLower.includes("api") || qLower.includes("phí") || qLower.includes("giá") || qLower.includes("tiền") || qLower.includes("đô") || qLower.includes("cost") || qLower.includes("fee") || qLower.includes("key") || qLower.includes("ລາຄາ") || qLower.includes("ຄ່າ") || qLower.includes("费用") || qLower.includes("造价");

  if (holds2D3D && holdsAPIorPrice) {
    if (lang === "vi") {
      const specialAnswer = `❖ HƯỚNG DẪN TÍCH HỢP BẢN VẼ 2D/3D SÁT CÔNG TRÌNH THỰC TẾ & KHẢO SÁT CHI PHÍ:

Để dựng hình ảnh 2D (mặt bằng kỹ thuật) và phối cảnh 3D sát thực tế với hiện trạng thực tế công trình nhất, hệ thống AI của Yohu Việt Nam đang ứng dụng các công nghệ hàng đầu thế giới sau:

1. CÔNG CỤ TẠO ẢNH CHUYÊN SÂU SÁT CÔNG TRÌNH NHẤT:
   - Stable Diffusion XL (SDXL) kết hợp mô-đun ControlNet (Cực kỳ khuyên dùng): Bám sát hoàn toàn kết cấu dây, móng cọc, dầm đà của bản vẽ AutoCAD/Revit 2D để tạo phối cảnh 3D chuẩn xác kích thước mác thép móng. Không bị méo hay sai lệch như các AI tạo ảnh thông thường.
   - Midjourney v6: Mang lại chất lượng phối cảnh ngoại thất nghệ thuật và nội thất sang trọng, đẹp mắt nhất.
   - OpenAI DALL-E 3: Tạo ý tưởng phối màu tường bao và ánh sáng sân vườn nhanh chóng dựa trên mô tả văn bản tự nhiên.

2. PHƯƠNG THỨC LIÊN KẾT API KEY:
   - Đối với Stable Diffusion: Sử dụng API của nền tảng như RunPod, Replicate API, hoặc kết nối cục bộ qua ComfyUI WebAPI.
   - Đối với Midjourney: Tích hợp thông qua dịch vụ API như ImagineAPI.to.
   - Đối với DALL-E 3: Sử dụng API của OpenAI thông qua thư viện \`@google/genai\` hoặc SDK \`openai\`.

3. KHẢO SÁT CHỦNG LOẠI & CHI PHÍ SỬ DỤNG:
   - Stable Diffusion XL: Khoảng 0.003$ - 0.01$ (70 - 250 VNĐ) mỗi lượt kết xuất hình ảnh 2K siêu nét.
   - OpenAI DALL-E 3: Cố định khoảng 0.04$ - 0.08$ (1.000 - 2.000 VNĐ) mỗi lượt.
   - Midjourney (ImagineAPI): Phí thuê bao khoảng 20$ - 49$/tháng.

💡 LỜI KHUYÊN TỪ YOHU VIỆT NAM:
Khi ký hợp đồng xây dựng trọn gói thiết kế thi công với Yohu Việt Nam, toàn bộ hồ sơ thiết kế chi tiết AutoCAD kỹ thuật và phối cảnh 3D đỉnh cao sẽ được các kỹ sư trưởng của chúng tôi xuất bản hoàn chỉnh HOÀN TOÀN MIỄN PHÍ! Liên hệ ngay Hotline: +84 973 480 488 để đặt lịch khảo sát đất thực địa!`;
      return res.json({ answer: specialAnswer });
    } else if (lang === "zh") {
      const specialAnswer = `❖ 2D/3D建筑图纸生成指南、API接口集成及造价费用分析：

为确保2D建筑施工平面图与3D逼真效果图高度贴合物理现场实际工程条件，有湖 AI 体系深度整合了以下全球领先的图形引擎：

1. 行业顶尖的建筑图像渲染工具：
   - Stable Diffusion XL (SDXL) 结合 ControlNet 控制网（极力推荐）：唯一能精准提取AutoCAD/Revit二维线框并锁定梁板柱配筋与立面开孔的AI，彻底避免画面形变与结构失真。
   - Midjourney v6：提供极高审美价值的室外园林光影与高品质室内精装质感。
   - OpenAI DALL-E 3：善于根据自然语言文字描述快速迭代外立面漆色与庭院灯光概念。

2. API接口集成途径：
   - Stable Diffusion: 推荐使用 Replicate API、RunPod 或本地 ComfyUI WebAPI 进行图像生成。
   - Midjourney: 通过 ImagineAPI.to 等专业桥接接口调用。
   - DALL-E 3: 直接调用 OpenAI 官方 API 接口。

3. 接口调用成本测算：
   - SDXL: 每张2K超清渲染仅约 0.003$ - 0.01$ 美元（成本极低）。
   - DALL-E 3: 每张图约 0.04$ - 0.08$ 美元。
   - Midjourney: 月度订阅套餐约 20$ - 49$ 美元，享无限次高速生成。

💡 有湖建筑特别赋能承诺：
签约有湖工程全包设计施工总承包合同时，全套正规施工级AutoCAD图纸与高品质3D立面效果图将由总工设计团队【完全免费】为您交付！总工咨询热线：+84 973 480 488。`;
      return res.json({ answer: specialAnswer });
    } else if (lang === "lo") {
      const specialAnswer = `❖ ຄຳແນະນຳການສ້າງແບບແຕ້ມ 2D/3D ໃຫ້ສອດຄ່ອງກັບໜ້າວຽກຕົວຈິງ & ສຳຫຼວດຄ່າໃຊ້ຈ່າຍ:

ເພື່ອໃຫ້ແບບແຕ້ມ 2D (ຜັງພື້ນເຕັກນິກ) ແລະ ຮູບທັດສະນີຍະພາບ 3D ໃກ້ຄຽງກັບຄວາມເປັນຈິງຂອງໂຄງການທີ່ສຸດ, ລະບົບ Yohu AI ນຳໃຊ້ເຕັກໂນໂລຊີຊັ້ນນຳດັ່ງນີ້:

1. ເຄື່ອງມືສ້າງຮູບພາບສະຖາປັດຕະຍະກຳທີ່ຊັດເຈນທີ່ສຸດ:
   - Stable Diffusion XL (SDXL) ຜະສົມ ControlNet (ແນະນຳຢ່າງຍິ່ງ): ເກາະຕິດໂຄງສ້າງເສົາ, ຄານ, ຮາກຖານ ຈາກແບບແຕ້ມ AutoCAD/Revit 2D ໄດ້ຢ່າງແນ່ນອນ ໂດຍບໍ່ບິດບຽວ.
   - Midjourney v6: ໃຫ້ຄຸນນະພາບຮູບພາບທັດສະນີຍະພາບ ແລະ ການຕົກແຕ່ງພາຍໃນທີ່ສວຍງາມ ແລະ ຫຼູຫຼາທີ່ສຸດ.
   - OpenAI DALL-E 3: ຊ່ວຍອອກແບບໂທນສີ ແລະ ແສງສະຫວ່າງຂອງສວນໄດ້ໄວ.

2. ວິທີການເຊື່ອມຕໍ່ API Key:
   - Stable Diffusion: ໃຊ້ API ຂອງ Replicate, RunPod ຫຼື ເຊື່ອມຕໍ່ຜ່ານ ComfyUI WebAPI.
   - Midjourney: ເຊື່ອມຕໍ່ຜ່ານບໍລິການ API ຂອງ ImagineAPI.to.
   - DALL-E 3: ໃຊ້ API ຢ່າງເປັນທາງການຂອງ OpenAI.

3. ຄ່າໃຊ້ຈ່າຍໃນການນຳໃຊ້:
   - Stable Diffusion XL: ລາຄາຖືກຫຼາຍ ປະມານ 0.003$ - 0.01$ ຕໍ່ຮູບ 2K.
   - DALL-E 3: ປະມານ 0.04$ - 0.08$ ຕໍ່ຮູບ.
   - Midjourney: ຄ່າສະມາຊິກລາຍເດືອນປະມານ 20$ - 49$/ເດືອນ.

💡 ຄຳແນະນຳພິເສດຈາກ Yohu:
ເມື່ອເຊັນສັນຍາກໍ່ສ້າງຄົບວົງຈອນກັບ Yohu, ຊຸດແບບແຕ້ມເຕັກນິກ AutoCAD ແລະ ຮູບ 3D ລະດັບສູງທັງໝົດຈະຖືກວິສະວະກອນອອກແບບໃຫ້ [ຟຣີ 100%]! ໂທສາຍດ່ວນ: +84 973 480 488.`;
      return res.json({ answer: specialAnswer });
    } else {
      const specialAnswer = `❖ ARCHITECTURAL 2D/3D GENERATION GUIDE, API PORTALS & PRICING SCHEME:

To generate 2D structural floor plans and 3D photorealistic architectural renders closest to the physical site parameters, the following advanced frameworks are integrated inside the Yohu AI workspace:

1. BEST-IN-CLASS ARCHITECTURAL TOOLS:
   - Stable Diffusion XL (SDXL) equipped with ControlNet (Highly Recommended): ControlNet binds exact line contours from 2D AutoCAD/Revit blueprints to render 3D perspectives without structural warping.
   - Midjourney v6: Delivers outstanding visual aesthetic values, cinematic sunshine, and high-fidelity textures.
   - OpenAI DALL-E 3: Great for fast conceptualizing of exterior painting palettes and illumination setups based on rich natural text descriptors.

2. API INTEGRATIONS SETUP:
   - Stable Diffusion: Integrate seamlessly using Replicate API, RunPod Serverless APIs, or local ComfyUI REST endpoints.
   - Midjourney: Implemented using trusted bridge providers such as ImagineAPI.to.
   - OpenAI DALL-E 3: Linked via OpenAI Developer Platform.

3. FEES & COST COMPILING:
   - Stable Diffusion XL: Around $0.003 to $0.01 per 2K high-definition render.
   - OpenAI DALL-E 3 API: Flat rate of $0.04 to $0.08 per image generated.
   - Midjourney (ImagineAPI): Monthly subscription is around $20 to $49.

💡 SPECIAL BENEFIT:
When you sign a full-scale Design & Build package with Yohu Vietnam, our Senior Engineering Team will draft your professional AutoCAD files completely FREE of charge! Contact our hotlines at +84 973 480 488 to initiate site inspections.`;
      return res.json({ answer: specialAnswer });
    }
  }

  if (FREE_KEYS.length + PAID_KEYS.length === 0) {
    const genericAnswers: Record<string, string> = {
      vi: `Cảm ơn câu hỏi của bạn về xây dựng/phong thủy. Theo kinh nghiệm thực tế của chúng tôi tại Yohu Việt Nam: việc khởi công, chọn hướng, cách chọn mác xi măng hoàng thạch PCB40 và tối ưu phần móng là vô cùng cần thiết để gia tăng cát lành, giảm hao hụt chi phí vật tư. Bạn nên đăng ký tư vấn trực tiếp qua hotline +84 973 480 488 để các kỹ sư hàng đầu hỗ trợ khảo sát móng miễn phí.`,
      en: `Thank you for your construction and feng shui inquiry. According to our practical experience at Yohu Vietnam, choosing the right ground-breaking dates, selecting adequate cement types (such as PCB40), and optimizing structural foundation sizes are key elements to cut surplus structural expenditures while elevating spiritual positive energy. We strongly recommend contacting our hotlines at +84 973 480 488 for deep site inspections.`,
      lo: `ຂໍຂອບໃຈສຳລັບຄຳຖາມຂອງທ່ານກ່ຽວກັບການກໍ່ສ້າງ ແລະ ຮວງຈຸ້ຍ. ອີງຕາມປະສົບການຕົວຈິງຂອງພວກເຮົາທີ່ Yohu: ການເລີ່ມຕົ້ນລົງມືກໍ່ສ້າງ, ການເລືອກທິດທາງ, ການເລືອກມາດຕະຖານຊີມັງ PCB40 ແລະ ການປັບປຸງໂຄງສ້າງຮາກຖານແມ່ນມີຄວາມສຳຄັນຫຼາຍ ເພື່ອເພີ່ມຄວາມເປັນສິຣິມຸງຄຸນ ແລະ ຫຼຸດຜ່ອນຕົ້ນທຶນວັດສະດຸ. ທ່ານສາມາດຕິດຕໍ່ສາຍດ່ວນວິສະວະກອນທີ່ +84 973 480 488 ເພື່ອຮັບການສຳຫຼວດຟຣີ.`,
      zh: `感谢您关于建筑工程与周易风水堪舆的咨询。根据有湖工程实战经验：准确选取动土吉日、大门坐向、选用高标号PCB40水泥以及科学优化地基基础结构，对于聚气生财、规避工程超支至关重要。建议您拨打总工热线 +84 973 480 488 预约免费实地地质及基础勘察。`
    };
    return res.json({ answer: genericAnswers[lang] || genericAnswers.vi });
  }

  try {
    const langName = 
      lang === "lo" ? "Lao language (ພາສາລາວ)" : 
      lang === "zh" ? "Simplified Chinese (简体中文)" : 
      lang === "en" ? "English" : 
      "Vietnamese (Tiếng Việt)";

    const contextPrompt = `
      You are Master Spiritual Architect and Chief Civil Engineer for Yohu Construction (Yohu Việt Nam).
      You answer beautifully, helpfully, technically, matching ancient feng shui principles combined with modern 2026 civil and structural engineering expertise.
      
      Owner background:
      - Name: ${userInfo?.name || "Premium Client"}
      - Birth year: ${userInfo?.birthDate || "unregistered"} 
      - House details: ${constructionInfo?.overallDescription || "unspecified"} (${constructionInfo?.constructionType || "general house"})
      - Dimensions: ${constructionInfo?.width ? `${constructionInfo.width}m x ${constructionInfo.length}m` : "not specified"}
      - Floors: ${constructionInfo?.floors || "not specified"}
      - Budget: ${constructionInfo?.totalBudget || "TBD"}

      Chat history context:
      ${JSON.stringify(chatHistory || [])}

      CRITICAL STRICT MANDATE - ABSOLUTELY NO MIXED LANGUAGES:
      The user selected language: ${langName}.
      You MUST formulate your entire response 100% EXCLUSIVELY in ${langName}.
      DO NOT mix any other languages. Every section heading, bullet point, technical term, and sentence must be strictly in ${langName}.
      (If Lao, write 100% pure Lao. If Chinese, write 100% pure Simplified Chinese. If Vietnamese, write 100% pure Vietnamese. If English, write 100% pure English).

      Make your answer expert, reassuring, precise, structured (using bold headings and list items but elegant prose), and always highlight the positive, structurally sound, and budget-optimized construction aspects.
      If a reference photo is provided, actively analyze and cross-reference its facade style, geometry, textures, or floorplan layout with the physical parameters.
      
      DOMAIN EXPERTISE GUIDELINES:
      1. Địa giới hành chính: Sử dụng đúng địa giới hành chính thực tế hiện hành của Việt Nam (theo dữ liệu cung cấp), không dùng địa danh cũ.
      2. Chống thấm sàn WC Nhà 1 tầng: Giải thích rõ rằng nhà 1 tầng tuy không dột xuống tầng dưới nhưng BẮT BUỘC chống thấm quét màng đàn hồi (SikaTop Seal 107) + dán lưới thủy tinh bo cao 20-30cm chân tường để ngăn chặn hiện tượng thấm ẩm mao dẫn ngấm ngang sang phòng ngủ và phòng khách liền kề.
      3. Cầu thang Nhà 1 tầng: Tư vấn giải pháp Thang gác mái thông minh âm trần (Smart Retractable Ceiling Ladder) điều khiển tự động đóng mở từ trần xuống, khi đóng phẳng khít đồng bộ với mặt trần, không chiếm diện tích sàn và cực kỳ thẩm mỹ cho nhà mái ngói/mái tôn.
      4. Không gian trần/gác mái làm trung tâm kỹ thuật: Phân tích và sinh giải pháp sàn thao tác trên trần/dưới mái tôn hoặc ngói để đặt bồn nước Inox, máy lọc nước tổng đầu nguồn, máy cấp khí tươi & lọc không khí ERV, và cụm nóng điều hòa có cửa chớp louver giải nhiệt đối lưu.
      
      User Question / Master Prompt:
      ${newestQuestion}
    `;

    // Multi-modal content builder
    const contents: any[] = [];
    
    // If reference image provided, pass as inlineData
    if (referenceImage && typeof referenceImage === 'string' && referenceImage.startsWith('data:image')) {
      const mimeMatch = referenceImage.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const cleanBase64 = referenceImage.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
      contents.push({
        inlineData: {
          mimeType,
          data: cleanBase64
        }
      });
    }

    contents.push({ text: contextPrompt });

    const response = await callGeminiWithRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents
      })
    );

    res.json({ answer: response.text });
  } catch (error: any) {
    console.warn("Q&A AI Notice (chuyển sang thông điệp kỹ sư trực ban):", error?.message || error);
    const errorFallbacks: Record<string, string> = {
      vi: "Hệ thống chuyên gia Yohu đã ghi nhận câu hỏi của bạn. Để được hỗ trợ trực tiếp và giải đáp chi tiết về kết cấu cũng như phong thủy cho công trình, bạn vui lòng liên hệ hotline kỹ sư trưởng Yohu: 0973.480.488 hoặc Zalo Yohu Việt Nam.",
      en: "The Yohu engineering specialist team has recorded your question. For dedicated structural blueprints and feng shui consultation, please contact our chief engineer at (+84) 973.480.488.",
      lo: "ລະບົບຊ່ຽວຊານ Yohu ໄດ້ຮັບຄຳຖາມຂອງທ່ານແລ້ວ. ເພື່ອຮັບການສະໜັບສະໜູນໂດຍກົງກ່ຽວກັບໂຄງສ້າງ ແລະ ຮວງຈຸ້ຍ, ກະລຸນາຕິດຕໍ່ສາຍດ່ວນຫົວໜ້າວິສະວະກອນ Yohu: +84 973 480 488.",
      zh: "有湖专家系统已记录您的问题。如需针对该项目的结构图纸与风水堪舆进行一对一专项解答，请联系有湖总工程师热线：0973.480.488。"
    };
    res.json({
      answer: errorFallbacks[lang] || errorFallbacks.vi
    });
  }
});

// Generate PDF HTML Template
app.post("/api/pdf/template", async (req, res) => {
  const { goi, data } = req.body;

  if (FREE_KEYS.length + PAID_KEYS.length === 0) {
    return res.status(500).json({ error: "Yêu cầu cấu hình GEMINI_FREE_KEYS hoặc GEMINI_PAID_KEYS trong .env để xuất PDF." });
  }

  try {
    const prompt = `
Sinh HTML template PDF cho gói: ${goi.toUpperCase()}
Dữ liệu khách hàng:
${JSON.stringify({
  ho_ten: data.userInfo?.name,
  nam_sinh: data.userInfo?.birthDate,
  gioi_tinh: data.userInfo?.gender,
  dia_chi: data.constructionInfo?.overallDescription,
  loai_ct: data.constructionInfo?.constructionType,
  dien_tich: data.constructionInfo?.dimensions,
  so_tang: data.constructionInfo?.floors,
  ngan_sach: data.constructionInfo?.totalBudget,
  don_vi: data.constructionInfo?.budgetUnit,
  tieu_chuan: data.constructionInfo?.standard,
  huong_muon: data.userInfo?.desiredDirection,
  menh: data.fengShuiAnalysis?.element,
  huong_tot: data.fengShuiAnalysis?.favorableDirections,
  ket_cau: data.aiResult?.structuralAnalysis,
  du_toan: data.aiResult?.threeOptions,
  ngay_xuat: new Date().toLocaleDateString('vi-VN'),
}, null, 2)}

Yêu cầu:
- Trả về CHỈ chuỗi HTML thuần — không markdown, không giải thích
- Mỗi trang dùng class="pdf-page" và style="width:794px;min-height:1123px;page-break-after:always"
- CSS inline hoàn toàn, font Arial
- Cuối cùng thêm trang mồi video đúng gói
`;

    const result = await callGeminiWithRetry((ai, model) =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: { temperature: 0.3 }
      })
    );
    
    let text = result.text;
    if (text) {
      text = text.replace(/^```html\n?/, "").replace(/\n?```$/, "");
    }
    
    res.json({ html: text });
  } catch (error: any) {
    console.warn("PDF Template Generation Notice (dùng mẫu template HTML dự phòng):", error?.message || error);
    const fallbackHtml = `
      <div class="pdf-page" style="width:794px;min-height:1123px;padding:40px;box-sizing:border-box;font-family:Arial,sans-serif;color:#1e293b;background:#ffffff;">
        <div style="border-bottom:2px solid #ea580c;padding-bottom:20px;margin-bottom:30px;">
          <h1 style="color:#ea580c;margin:0;font-size:24px;">YOHU VIỆT NAM — BÁO CÁO DỰ TOÁN & PHONG THỦY XÂY DỰNG</h1>
          <p style="margin:5px 0 0;color:#64748b;font-size:14px;">Gói tư vấn: ${goi || 'Báo cáo cơ bản'} | Ngày lập: ${new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <h2 style="font-size:18px;color:#0f172a;border-left:4px solid #ea580c;padding-left:10px;">1. THÔNG TIN CÔNG TRÌNH & GIA CHỦ</h2>
        <table style="width:100%;border-collapse:collapse;margin-top:15px;font-size:14px;">
          <tr><td style="padding:8px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:bold;width:30%;">Chủ đầu tư:</td><td style="padding:8px;border:1px solid #cbd5e1;">${data?.userInfo?.name || 'Khách hàng'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:bold;">Điện thoại:</td><td style="padding:8px;border:1px solid #cbd5e1;">${data?.userInfo?.phone || 'Chưa cung cấp'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:bold;">Bản mệnh phong thủy:</td><td style="padding:8px;border:1px solid #cbd5e1;">${data?.fengShuiAnalysis?.element || 'Thổ'} (${data?.fengShuiAnalysis?.cungPhi || 'Khôn Thổ'})</td></tr>
          <tr><td style="padding:8px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:bold;">Quy mô công trình:</td><td style="padding:8px;border:1px solid #cbd5e1;">${data?.constructionInfo?.constructionType || 'Nhà ở'} - ${data?.constructionInfo?.floors || 1} tầng (${data?.constructionInfo?.dimensions || '100m2'})</td></tr>
          <tr><td style="padding:8px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:bold;">Ngân sách dự kiến:</td><td style="padding:8px;border:1px solid #cbd5e1;color:#ea580c;font-weight:bold;">${data?.constructionInfo?.totalBudget ? Number(data.constructionInfo.totalBudget).toLocaleString('vi-VN') + ' VNĐ' : 'Theo dự toán chuẩn'}</td></tr>
        </table>
        <div style="margin-top:30px;padding:15px;background:#fff7ed;border-left:4px solid #ea580c;border-radius:4px;">
          <h3 style="margin:0 0 8px;color:#c2410c;font-size:16px;">Lời khuyên kỹ thuật & Phong thủy:</h3>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#7c2d12;">${data?.fengShuiAnalysis?.deepAnalysis || 'Công trình cần tuân thủ giải pháp móng theo địa chất thực tế, bố trí phòng thờ và hướng bếp theo nguyên tắc Tọa Hung Hướng Cát để thu hút vượng khí.'}</p>
        </div>
      </div>
    `;
    res.json({ html: fallbackHtml });
  }
});

// Concept Rendering Generator - Integration using Gemini Image generation
app.post("/api/generate-concept-image", async (req, res) => {
  const { prompt, optionType = "3d", lang = "vi", loai_phong = "", clientId = "" } = req.body;

  // Gói lấy theo xác nhận của máy chủ — không tin giá trị goi_mua do trình duyệt gửi lên
  const verifiedGoi = isAdminRequest(req) ? "design" : await getVerifiedPackage(String(clientId || ""));
  if (verifiedGoi !== "design") {
    return res.status(403).json({
      error: lang === "vi"
        ? "Tính năng này chỉ áp dụng cho gói Thiết Kế 1.5M"
        : "This feature is only available for the 1.5M Design Package."
    });
  }

  if (FREE_KEYS.length + PAID_KEYS.length === 0) {
    return res.status(500).json({ 
      error: lang === "vi" 
        ? "Tính năng dựng concept hình ảnh yêu cầu GEMINI_FREE_KEYS hoặc GEMINI_PAID_KEYS trong .env." 
        : "Dynamic image concept rendering requires an active GEMINI_API_KEY."
    });
  }

  try {
    const constructPrompt = `
      Generate a professional high-contrast architectural render concept for a room of type: ${loai_phong || "general interior"}.
      Type: ${optionType === "2d" ? "Architectural AutoCAD style clean white blueprint line art sketch" : "Photorealistic ultra-modern architectural interior concept rendering, warm cinematic sunshine, beautiful landscape landscaping"}
      Context details: ${prompt}
      Make it beautifully proportioned, premium design quality.
    `;

    const response = await callGeminiWithRetry(
      (ai, model) =>
        ai.models.generateContent({
          model,
          contents: { parts: [{ text: constructPrompt }] },
          config: {
            imageConfig: { aspectRatio: "16:9", imageSize: "1K" }
          }
        }),
      ["gemini-3.1-flash-image", "gemini-3.1-flash-lite-image"]
    );

    let imageUrl = "";
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error("No image data returned from generator.");
    }

    res.json({ imageUrl });
  } catch (error: any) {
    console.warn("Concept Image Gen Notice:", error?.message || error);
    res.status(429).json({ 
      error: lang === "vi"
        ? "Hạn ngạch (Quota) tạo ảnh AI hiện đang bận hoặc cần gói trả phí (Pay-as-you-go). Vui lòng thử lại sau vài phút hoặc nhập thêm GEMINI_PAID_KEY."
        : "Image generation quota is currently rate-limited. Please retry shortly or provide a paid Gemini API key."
    });
  }
});


// New localized fallback generator algorithm with authentic 60 Hoa Giap & Bat Trach calculation
function generateLocalFengShui(name: string, year: number, gender: string, direction: string, lang: string, targetYear?: number, userInfo?: any) {
  const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
  const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

  const canIndex = ((year - 4) % 10 + 10) % 10;
  const chiIndex = ((year - 4) % 12 + 12) % 12;
  const canChi = `${CAN[canIndex]} ${CHI[chiIndex]}`;

  const NAP_AM_PAIRS = [
    { hanh: "Kim",  detail: "Hải Trung Kim (Vàng trong biển)", en: "Ocean Gold (Metal)", lo: "ທອງໃນທະເລ", zh: "海中金" },
    { hanh: "Hỏa",  detail: "Lư Trung Hỏa (Lửa trong lò)", en: "Furnace Fire", lo: "ໄຟໃນເຕົາ", zh: "炉中火" },
    { hanh: "Mộc",  detail: "Đại Lâm Mộc (Gỗ rừng già)", en: "Great Forest Wood", lo: "ໄມ້ໃຫຍ່ໃນປ່າ", zh: "大林木" },
    { hanh: "Thổ",  detail: "Lộ Bàng Thổ (Đất ven đường)", en: "Roadside Earth", lo: "ດິນແຄມທາງ", zh: "路旁土" },
    { hanh: "Kim",  detail: "Kiếm Phong Kim (Vàng mũi kiếm)", en: "Sword Edge Gold", lo: "ທອງປາຍດາບ", zh: "剑锋金" },
    { hanh: "Hỏa",  detail: "Sơn Đầu Hỏa (Lửa trên núi)", en: "Mountaintop Fire", lo: "ໄຟເທິງພູ", zh: "山头火" },
    { hanh: "Thủy", detail: "Giản Hạ Thủy (Nước dưới khe)", en: "Stream Water", lo: "ນ້ຳຫ້ວຍນ້ອຍ", zh: "涧下水" },
    { hanh: "Thổ",  detail: "Thành Đầu Thổ (Đất trên thành)", en: "Castle Wall Earth", lo: "ດິນເທິງກຳແພງ", zh: "城头土" },
    { hanh: "Kim",  detail: "Bạch Lạp Kim (Vàng sáp ong)", en: "White Wax Gold", lo: "ທອງຂີ້ເຜີ້ງ", zh: "白蜡金" },
    { hanh: "Mộc",  detail: "Dương Liễu Mộc (Gỗ cây dương)", en: "Willow Wood", lo: "ໄມ້ດອກຍາງ", zh: "杨柳木" },
    { hanh: "Thủy", detail: "Tuyền Trung Thủy (Nước trong suối)", en: "Spring Water", lo: "ນ້ຳໃນບໍ່", zh: "泉中水" },
    { hanh: "Thổ",  detail: "Ốc Thượng Thổ (Đất trên nóc nhà)", en: "Rooftop Earth", lo: "ດິນເທິງຫຼັງຄາ", zh: "屋上土" },
    { hanh: "Hỏa",  detail: "Tích Lịch Hỏa (Lửa sấm sét)", en: "Lightning Fire", lo: "ໄຟຟ້າແມບ", zh: "霹雳火" },
    { hanh: "Mộc",  detail: "Tùng Bách Mộc (Gỗ tùng bách)", en: "Pine & Cypress Wood", lo: "ໄມ້ສົນ", zh: "松柏木" },
    { hanh: "Thủy", detail: "Trường Lưu Thủy (Nước chảy dài)", en: "Long River Water", lo: "ນ້ຳໄຫຼຍາວ", zh: "长流水" },
    { hanh: "Kim",  detail: "Sa Trung Kim (Vàng trong cát)", en: "Sand Gold", lo: "ທອງໃນດິນຊາຍ", zh: "沙中金" },
    { hanh: "Hỏa",  detail: "Sơn Hạ Hỏa (Lửa dưới chân núi)", en: "Under-mountain Fire", lo: "ໄຟໃຕ້ພູ", zh: "山下火" },
    { hanh: "Mộc",  detail: "Bình Địa Mộc (Gỗ đồng bằng)", en: "Plains Wood", lo: "ໄມ້ທົ່ງພຽງ", zh: "平地木" },
    { hanh: "Thổ",  detail: "Bích Thượng Thổ (Đất trên vách tường)", en: "Wall Earth", lo: "ດິນເທິງຝາ", zh: "壁上土" },
    { hanh: "Kim",  detail: "Kim Bạch Kim (Vàng ánh kim)", en: "Pure White Gold", lo: "ທອງຄຳຂາວ", zh: "金箔金" },
    { hanh: "Hỏa",  detail: "Phúc Đăng Hỏa (Lửa đèn dầu)", en: "Oil Lamp Fire", lo: "ໄຟຕະກຽງ", zh: "覆灯火" },
    { hanh: "Thủy", detail: "Thiên Hà Thủy (Nước trên trời)", en: "Heavenly River Water", lo: "ນ້ຳເທິງຟ້າ", zh: "天河水" },
    { hanh: "Thổ",  detail: "Đại Trạch Thổ (Đất đầm lầy)", en: "Swamp Earth", lo: "ດິນໜອງໃຫຍ່", zh: "大驿土" },
    { hanh: "Kim",  detail: "Thoa Xuyến Kim (Vàng trang sức)", en: "Jewelry Gold", lo: "ທອງເຄື່ອງປະດັບ", zh: "钗钏金" },
    { hanh: "Mộc",  detail: "Tang Đố Mộc (Gỗ cây dâu)", en: "Mulberry Wood", lo: "ໄມ້ມອນ", zh: "桑柘木" },
    { hanh: "Thủy", detail: "Đại Khê Thủy (Nước khe lớn)", en: "Great Stream Water", lo: "ນ້ຳສາຍນ້ຳໃຫຍ່", zh: "大溪水" },
    { hanh: "Thổ",  detail: "Sa Trung Thổ (Đất pha cát)", en: "Sand Earth", lo: "ດິນຊາຍປົນ", zh: "沙中土" },
    { hanh: "Hỏa",  detail: "Thiên Thượng Hỏa (Lửa trên trời)", en: "Celestial Fire (Heavenly Fire)", lo: "ໄຟເທິງທ້ອງຟ້າ", zh: "天上火" }, // 27: 1978 Mậu Ngọ, 1979 Kỷ Mùi
    { hanh: "Mộc",  detail: "Thạch Lựu Mộc (Gỗ cây lựu đá)", en: "Pomegranate Wood", lo: "ໄມ້ໝາກພິລາ", zh: "石榴木" }, // 28: 1980 Canh Thân, 1981 Tân Dậu
    { hanh: "Thủy", detail: "Đại Hải Thủy (Nước biển lớn)", en: "Great Ocean Water", lo: "ນ້ຳມະຫາສະໝຸດ", zh: "大海水" }  // 29: 1982 Nhâm Tuất, 1983 Quý Hợi
  ];

  const cycleIndex = ((year - 1924) % 60 + 60) % 60;
  const pairIndex = Math.floor(cycleIndex / 2);
  const napAm = NAP_AM_PAIRS[pairIndex] || NAP_AM_PAIRS[0];

  // Calculate Cung Phi
  const lastTwo = year % 100;
  let d = Math.floor(lastTwo / 10) + (lastTwo % 10);
  while (d > 9) d = Math.floor(d / 10) + (d % 10);

  let cungNum = 3;
  if (year < 2000) {
    if (gender === 'nu') {
      let g = 5 + d;
      while (g > 9) g = Math.floor(g / 10) + (g % 10);
      cungNum = g === 5 ? 8 : g;
    } else {
      let c = 10 - d;
      if (c <= 0) c += 9;
      cungNum = c === 5 ? 2 : c;
    }
  } else {
    if (gender === 'nu') {
      let g = 6 + d;
      while (g > 9) g = Math.floor(g / 10) + (g % 10);
      cungNum = g === 5 ? 8 : g;
    } else {
      let c = 9 - d;
      if (c <= 0) c += 9;
      cungNum = c === 5 ? 2 : c;
    }
  }

  const CUNG_NAMES: Record<number, { name: string; hanh: string; menh: string; goodDirs: string[]; badDirs: string[] }> = {
    1: { name: "Khảm", hanh: "Thủy", menh: "Đông Tứ Mệnh", goodDirs: ["Đông Nam (Sinh Khí)", "Đông (Thiên Y)", "Nam (Diên Niên)", "Bắc (Phục Vị)"], badDirs: ["Tây Nam (Tuyệt Mệnh)", "Đông Bắc (Ngũ Quỷ)", "Tây Bắc (Lục Sát)", "Tây (Họa Hại)"] },
    2: { name: "Khôn", hanh: "Thổ", menh: "Tây Tứ Mệnh", goodDirs: ["Đông Bắc (Sinh Khí)", "Tây (Thiên Y)", "Tây Bắc (Diên Niên)", "Tây Nam (Phục Vị)"], badDirs: ["Bắc (Tuyệt Mệnh)", "Đông Nam (Ngũ Quỷ)", "Nam (Lục Sát)", "Đông (Họa Hại)"] },
    3: { name: "Chấn", hanh: "Mộc", menh: "Đông Tứ Mệnh", goodDirs: ["Nam (Sinh Khí)", "Bắc (Thiên Y)", "Đông Nam (Diên Niên)", "Đông (Phục Vị)"], badDirs: ["Tây (Tuyệt Mệnh)", "Tây Bắc (Ngũ Quỷ)", "Đông Bắc (Lục Sát)", "Tây Nam (Họa Hại)"] },
    4: { name: "Tốn", hanh: "Mộc", menh: "Đông Tứ Mệnh", goodDirs: ["Bắc (Sinh Khí)", "Nam (Thiên Y)", "Đông (Diên Niên)", "Đông Nam (Phục Vị)"], badDirs: ["Đông Bắc (Tuyệt Mệnh)", "Tây Nam (Ngũ Quỷ)", "Tây (Lục Sát)", "Tây Bắc (Họa Hại)"] },
    6: { name: "Càn", hanh: "Kim", menh: "Tây Tứ Mệnh", goodDirs: ["Tây (Sinh Khí)", "Đông Bắc (Thiên Y)", "Tây Nam (Diên Niên)", "Tây Bắc (Phục Vị)"], badDirs: ["Nam (Tuyệt Mệnh)", "Đông (Ngũ Quỷ)", "Bắc (Lục Sát)", "Đông Nam (Họa Hại)"] },
    7: { name: "Đoài", hanh: "Kim", menh: "Tây Tứ Mệnh", goodDirs: ["Tây Bắc (Sinh Khí)", "Tây Nam (Thiên Y)", "Đông Bắc (Diên Niên)", "Tây (Phục Vị)"], badDirs: ["Đông (Tuyệt Mệnh)", "Nam (Ngũ Quỷ)", "Đông Nam (Lục Sát)", "Bắc (Họa Hại)"] },
    8: { name: "Cấn", hanh: "Thổ", menh: "Tây Tứ Mệnh", goodDirs: ["Tây Nam (Sinh Khí)", "Tây Bắc (Thiên Y)", "Tây (Diên Niên)", "Đông Bắc (Phục Vị)"], badDirs: ["Đông Nam (Tuyệt Mệnh)", "Bắc (Ngũ Quỷ)", "Đông (Lục Sát)", "Nam (Họa Hại)"] },
    9: { name: "Ly", hanh: "Hỏa", menh: "Đông Tứ Mệnh", goodDirs: ["Đông (Sinh Khí)", "Đông Nam (Thiên Y)", "Bắc (Diên Niên)", "Nam (Phục Vị)"], badDirs: ["Tây Bắc (Tuyệt Mệnh)", "Tây (Ngũ Quỷ)", "Tây Nam (Lục Sát)", "Đông Bắc (Họa Hại)"] }
  };

  const cung = CUNG_NAMES[cungNum] || CUNG_NAMES[3];
  const cungPhiDisplay = `${cung.name} ${cung.hanh} (${cung.menh})`;

  const elementTitle = lang === 'en' ? napAm.en : lang === 'lo' ? napAm.lo : lang === 'zh' ? napAm.zh : napAm.detail;

  const favorableColors = napAm.hanh === 'Hỏa' ? ["Đỏ, Hồng, Tím, Cam (Bản mệnh)", "Xanh lá cây (Tương sinh Mộc sinh Hỏa)"]
    : napAm.hanh === 'Mộc' ? ["Xanh lá cây (Bản mệnh)", "Đen, Xanh nước biển (Thủy sinh Mộc)"]
    : napAm.hanh === 'Kim' ? ["Trắng, Xám ghi (Bản mệnh)", "Vàng, Nâu đất (Thổ sinh Kim)"]
    : napAm.hanh === 'Thủy' ? ["Đen, Xanh biển (Bản mệnh)", "Trắng, Ánh kim (Kim sinh Thủy)"]
    : ["Vàng, Nâu đất (Bản mệnh)", "Đỏ, Hồng, Cam (Hỏa sinh Thổ)"];

  const unfavorableColors = napAm.hanh === 'Hỏa' ? ["Đen, Xanh nước biển (Thủy khắc Hỏa)"]
    : napAm.hanh === 'Mộc' ? ["Trắng, Xám ghi (Kim khắc Mộc)"]
    : napAm.hanh === 'Kim' ? ["Đỏ, Hồng, Tím (Hỏa khắc Kim)"]
    : napAm.hanh === 'Thủy' ? ["Vàng, Nâu đất (Thổ khắc Thủy)"]
    : ["Xanh lá cây (Mộc khắc Thổ)"];

  // Dùng chung thuật toán chuẩn với giao diện (src/lib/fengshui.ts) — một nguồn sự thật duy nhất
  const calc = calculateFengShui(
    year,
    gender === 'nu' ? 'nu' : 'nam',
    direction,
    userInfo?.spouseBirthYear ? Number(userInfo.spouseBirthYear) : undefined,
    userInfo?.spouseGender,
    userInfo?.birthHour,
    targetYear
  );
  void cungPhiDisplay; void favorableColors; void unfavorableColors; void cung;

  return {
    element: lang === 'vi' ? calc.elementDetail : elementTitle,
    cungPhi: calc.cungPhi,
    canChi: calc.canChi,
    favorableDirections: calc.favorableDirections,
    unfavorableDirections: calc.unfavorableDirections,
    favorableColors: calc.favorableColors,
    unfavorableColors: calc.unfavorableColors,
    luckyColors: calc.favorableColors,
    favorableGroundbreakingDates: calc.favorableDates2026,
    deepAnalysis: lang === 'vi' ? `Gia chủ ${name}. ` + calc.deepAnalysis : `Client ${name}, born ${calc.canChi} (${year}). ${calc.directionVerdict.summary}`,
    advice2026: calc.advice2026,
    luckyNumbers: calc.luckyNumbers,
    targetYear: calc.targetYear,
    borrowAgeCandidates: calc.borrowAgeCandidates,
    directionVerdict: calc.directionVerdict,
    isLocal: true
  };
}

function generateLocalEstimate(info: any, details: any, lang: string) {
  const rawDim = info.dimensions || "100";
  let areaFactor = 100;
  if (rawDim.includes("x") || rawDim.includes("X") || rawDim.includes("×")) {
    const parts = rawDim.split(/[xX×]/);
    areaFactor = (parseFloat(parts[0]) || 5) * (parseFloat(parts[1]) || 20);
  } else {
    areaFactor = parseFloat(rawDim) || 120;
  }
  const floors = info.floors || 1;
  const totalArea = areaFactor * floors;
  const isEps = (info.loai_ket_cau_chinh || "").toLowerCase().includes("eps") || 
                (info.loai_ket_cau_chinh || "").toLowerCase().includes("bê tông nhẹ") ||
                (info.loai_ket_cau_chinh || "").toLowerCase().includes("gông 3d");
  let baseRate = isEps ? 5268000 : 6000000;

  const cats: Record<string, any> = {
    vi: isEps ? ["Móng rãnh ngàm", "Cột D14 liền khối", "Vách EPS 15cm", "Cửa nhôm kính", "Mái chống thấm", "Điện nước âm"]
              : ["Phần Móng", "Khung thép", "Tường bao", "Hệ thống Cửa", "Mái ngói", "Ốp lát"],
    lo: ["ພາກສ່ວນພື້ນຖານ", "ໂຄງເຫຼັກ", "ຝາຜະໜັງ", "ລະບົບປະຕູ", "ຫຼັງຄາ", "ການປູພື້ນ"],
    zh: isEps ? ["开槽基础", "现浇D14立柱", "15cm EPS整体墙", "门窗系统", "防水屋面", "预埋水电"]
              : ["地基工程", "钢结构", "围墙工程", "门窗系统", "屋顶工程", "铺贴工程"],
    en: isEps ? ["Notched Foundation", "Monolithic D14 Columns", "15cm EPS Wall", "Doors & Windows", "Waterproof Roof", "Embedded MEP"]
              : ["Foundation", "Steel Frame", "Walls", "Doors", "Roof", "Tiles"]
  };
  const c = cats[lang] || cats.en;

  const detailsTable = [
    { no: 1, category: c[0], material: "Standard", labor: "Yohu Team", unitPrice: "TBD", total: "TBD" },
    { no: 2, category: c[1], material: "Standard", labor: "Yohu Team", unitPrice: "TBD", total: "TBD" },
    { no: 3, category: c[2], material: "Standard", labor: "Yohu Team", unitPrice: "TBD", total: "TBD" },
    { no: 4, category: c[3], material: "Standard", labor: "Yohu Team", unitPrice: "TBD", total: "TBD" },
    { no: 5, category: c[4], material: "Standard", labor: "Yohu Team", unitPrice: "TBD", total: "TBD" },
    { no: 6, category: c[5], material: "Standard", labor: "Yohu Team", unitPrice: "TBD", total: "TBD" }
  ];

  const labels: any = {
    vi: { 
      duration: "ngày hoàn thiện", 
      note: isEps 
        ? "Công nghệ Bê tông nhẹ hạt xốp EPS đúc liền khối & Gông 3D: Rút ngắn 50% tiến độ (15-30 ngày bàn giao chìa khóa), tiết kiệm 25%-35% chi phí, chống nứt chân chim và chống thấm 100%, mát hơn ngoài trời 4-6°C."
        : "Khuyên dùng xi măng PCB40." 
    },
    lo: { 
      duration: "ມື້ສໍາເລັດ", 
      note: isEps
        ? "ເຕັກໂນໂລຊີເບຕົງເບົາ EPS ຫຼໍ່ຕໍ່ເນື່ອງ & ໂກງ 3D: ຫຼຸດເວລາ 50% (ມອບໂອນ 15-30 ມື້), ປະຢັດຕົ້ນທຶນ 25%-35%, ກັນຊຶມ ແລະ ບໍ່ແຕກຮາວ 100%."
        : "ແນະນໍາໃຫ້ໃຊ້ຊີມັງ PCB40." 
    },
    zh: { 
      duration: "天完成", 
      note: isEps
        ? "现浇一体化EPS轻质混凝土 & 3D定型加固体系：工期缩短50%（15-30天交钥匙），造价降低25%-35%，整体无缝防裂防渗，常态降温4-6°C。"
        : "建议使用 PCB40 水泥。" 
    },
    en: { 
      duration: "days to finish", 
      note: isEps
        ? "Monolithic EPS Lightweight Concrete & 3D Formwork: 50% faster schedule (15-30 days turnkey handover), 25%-35% cost savings, 100% anti-crack & leak-proof."
        : "Recommend using PCB40 cement." 
    }
  };
  const l = labels[lang] || labels.en;

  const durationDays = isEps ? Math.max(15, floors * 15) : floors * 45;

  return {
    budgetTable: detailsTable,
    estimatedDuration: `${durationDays} ${l.duration}`,
    structuralAnalysis: { foundation: "OK", columns: "OK", frame: "OK", roof: "OK", beam: "OK", waterproofing: "OK" },
    expertNote: l.note,
    threeOptions: {
      economy: { title: "Economy", desc: "Basic", estimatedPrice: "TBD" },
      standard: { title: "Standard", desc: "Recommended", estimatedPrice: "TBD" },
      premium: { title: "Premium", desc: "Luxury", estimatedPrice: "TBD" }
    }
  };
}



// Project Information Extraction from Files/Text using Gemini
// Robust JSON safe parser helper
function parseJsonSafe(text: string): any {
  if (!text) throw new Error("Empty text for JSON parse");
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch (e) {
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const sub = clean.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(sub);
      } catch (e2) {
        const fixed = sub
          .replace(/'/g, '"')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        return JSON.parse(fixed);
      }
    }
    throw e;
  }
}

function fallbackExtractFromDescription(desc: string) {
  const lower = desc.toLowerCase();
  let so_tang = 2;
  const matchTang = desc.match(/(\d+)\s*(tầng|lầu)/i);
  if (matchTang) so_tang = parseInt(matchTang[1]) || 2;

  let dien_tich = "5x20m";
  const matchDim = desc.match(/(\d+)\s*[xX×]\s*(\d+)/);
  if (matchDim) {
    dien_tich = `${matchDim[1]}x${matchDim[2]}m`;
  }

  let loai_ct = "Nhà phố";
  if (lower.includes("biệt thự") || lower.includes("villa")) loai_ct = "Biệt thự";
  else if (lower.includes("cấp 4") || lower.includes("cap 4")) loai_ct = "Nhà cấp 4";
  else if (lower.includes("xưởng") || lower.includes("kho")) loai_ct = "Nhà xưởng";

  return {
    ho_ten: "",
    so_dt: "",
    dia_chi: "",
    loai_ct,
    dien_tich,
    so_tang,
    ngan_sach: "",
    menh: "",
    huong_muon: "",
    loai_ket_cau_chinh: lower.includes("eps") || lower.includes("bê tông nhẹ") || lower.includes("gông 3d") ? "Bê tông nhẹ EPS đúc liền khối & Gông 3D" : "Bê tông cốt thép truyền thống",
    so_mat_tien: lower.includes("2 mặt tiền") || lower.includes("hai mặt tiền") ? 2 : 1,
    thep_hop_cot: "",
    loai_mai: "Tôn lạnh",
    loai_san: "Cemboard",
    loai_vach: "Panel EPS",
    loai_tran: "Thạch cao",
    phong_cach: "Hiện đại",
    canh_bao: ["Trích xuất thông minh tự động (AI heuristic) do hệ thống Gemini đang bận hoặc quá tải tạm thời."]
  };
}

app.post("/api/extract-project-info", upload.array("files", 5), async (req, res) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    const description = req.body.description || req.body.text || "";

    const parts: any[] = [];
    for (const file of files) {
      parts.push({
        inlineData: {
          mimeType: file.mimetype,
          data: file.buffer.toString("base64")
        }
      });
    }

    const prompt = `Bạn là trợ lý AI chuyên gia tư vấn xây dựng và phân tích hồ sơ nhà đất, sổ đỏ, bản vẽ kiến trúc tại Việt Nam.
Hãy phân tích các file ảnh/PDF đính kèm (có thể gồm sổ đỏ, bản vẽ sơ bộ, tài liệu khác) và đoạn mô tả bằng văn bản sau:
"${description}"

YÊU CẦU TRÍCH XUẤT:
Trích xuất thông tin công trình thành một đối tượng JSON THUẦN (không markdown, không backtick) chính xác theo cấu trúc sau:
{
  "ho_ten": "Họ tên chủ đầu tư nếu có",
  "so_dt": "Số điện thoại nếu có",
  "dia_chi": "Địa chỉ khu đất hoặc công trình",
  "loai_ct": "Loại công trình (Nhà phố, Biệt thự, Nhà cấp 4, Tòa nhà văn phòng, ...)",
  "dien_tich": "Kích thước hoặc diện tích khu đất (vd: 5x20m hoặc 100m2)",
  "so_tang": 2,
  "ngan_sach": "Ngân sách dự kiến nếu có",
  "menh": "Năm sinh hoặc mệnh nếu có",
  "huong_muon": "Hướng nhà hoặc hướng đất mong muốn",
  "loai_ket_cau_chinh": "Chọn đúng 1 trong 3: 'Bê tông cốt thép truyền thống', 'Khung thép tiền chế + Cemboard', hoặc 'Bê tông nhẹ EPS đúc liền khối & Gông 3D'",
  "so_mat_tien": 1,
  "thep_hop_cot": "Kích thước thép hộp cột chính nếu là khung thép (vd: 100x100mm)",
  "loai_mai": "Loại mái (Tôn lạnh / Tôn giả ngói / Khác)",
  "loai_san": "Loại sàn (Cemboard / Khác)",
  "loai_vach": "Loại vách (Panel EPS / Panel PU / Khác)",
  "loai_tran": "Loại trần (Nhựa Nano / Thạch cao / Khác)",
  "phong_cach": "Phong cách kiến trúc (Hiện đại, Tân cổ điển, Tối giản, ...)",
  "canh_bao": ["Danh sách các trường dữ liệu AI không đọc rõ hoặc không chắc chắn, ví dụ: 'Không đọc rõ diện tích trên sổ đỏ', 'Không xác định được số mặt tiền'..."]
}

QUY TẮC ƯU TIÊN:
1. Sổ đỏ ưu tiên lấy diện tích, kích thước, địa chỉ, hướng đất.
2. Ảnh bản vẽ ưu tiên lấy số tầng, công năng.
3. Text mô tả dùng bổ sung loại kết cấu chính, vật liệu, phong cách.
Nếu trường nào không tìm thấy thông tin, để trống ("") hoặc giá trị mặc định (so_tang: 1, so_mat_tien: 1, loai_ket_cau_chinh: "Bê tông cốt thép truyền thống"). TUYỆT ĐỐI KHÔNG TỰ BỊA SỐ LIỆU.`;

    parts.push({ text: prompt });

    let parsedData: any = null;
    try {
      const result = await callGeminiWithRetry(async (ai, model) => {
        const response = await ai.models.generateContent({
          model: model,
          contents: { parts },
          config: { temperature: 0.2, maxOutputTokens: 2048 }
        });
        return response.text;
      });

      if (result) {
        parsedData = parseJsonSafe(result);
      }
    } catch (geminiErr: any) {
      console.warn("Gemini extraction warning, falling back to heuristics:", geminiErr?.message || geminiErr);
    }

    if (!parsedData) {
      parsedData = fallbackExtractFromDescription(description);
    }

    res.json({ ok: true, data: parsedData });
  } catch (err: any) {
    console.error("Error extracting project info:", err);
    // Return graceful fallback instead of 500 error
    res.json({ ok: true, data: fallbackExtractFromDescription(req.body.description || "") });
  }
});

// Client Documents API
app.get("/api/client-documents/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const docs = Array.from(inMemoryStore.clientDocuments.values())
      .filter(doc => doc.clientId === clientId);
    docs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(docs);
  } catch (err: any) {
    console.error("Error getting client documents:", err);
    res.status(500).json({ error: err.message || "Failed to get documents" });
  }
});

app.post("/api/client-documents", async (req, res) => {
  try {
    const docData = req.body;
    if (!docData || !docData.clientId) {
      return res.status(400).json({ error: "Missing clientId" });
    }
    const id = "doc_" + Math.random().toString(36).substr(2, 9);
    const newDoc = {
      id,
      ...docData,
      createdAt: new Date().toISOString()
    };
    inMemoryStore.clientDocuments.set(id, newDoc);
    res.json({ success: true, id: id });
  } catch (err: any) {
    console.error("Error adding client document:", err);
    res.status(500).json({ error: err.message || "Failed to add document" });
  }
});

// CTV Commissions API
app.get("/api/commissions", adminAuthMiddleware, async (req, res) => {
  try {
    const list = Array.from(inMemoryStore.commissions.values());
    res.json(list);
  } catch (err: any) {
    console.error("Error getting commissions:", err);
    res.status(500).json({ error: err.message || "Failed to get commissions" });
  }
});

app.post("/api/commissions", adminAuthMiddleware, async (req, res) => {
  try {
    const comData = req.body;
    if (!comData || !comData.id) {
      return res.status(400).json({ error: "Missing commission id" });
    }
    inMemoryStore.commissions.set(comData.id, {
      ...comData,
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error saving commission:", err);
    res.status(500).json({ error: err.message || "Failed to save commission" });
  }
});

// CTV Partners API
app.get("/api/ctv-partners", adminAuthMiddleware, async (req, res) => {
  try {
    const list = Array.from(inMemoryStore.ctvPartners.values());
    res.json(list);
  } catch (err: any) {
    console.error("Error getting ctvPartners:", err);
    res.status(500).json({ error: err.message || "Failed to get ctvPartners" });
  }
});

app.post("/api/ctv-partners", adminAuthMiddleware, async (req, res) => {
  try {
    const partnerData = req.body;
    if (!partnerData || !partnerData.ma_ctv) {
      return res.status(400).json({ error: "Missing ma_ctv" });
    }
    const docId = partnerData.id || partnerData.ma_ctv;
    inMemoryStore.ctvPartners.set(docId, {
      ...partnerData,
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error saving ctvPartner:", err);
    res.status(500).json({ error: err.message || "Failed to save ctvPartner" });
  }
});

// Video Orders API
app.get("/api/video-orders", adminAuthMiddleware, async (req, res) => {
  try {
    const list = Array.from(inMemoryStore.videoOrders.values());
    res.json(list);
  } catch (err: any) {
    console.error("Error getting videoOrders:", err);
    res.status(500).json({ error: err.message || "Failed to get videoOrders" });
  }
});

app.post("/api/video-orders", async (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData || !orderData.id) {
      return res.status(400).json({ error: "Missing order id" });
    }
    inMemoryStore.videoOrders.set(orderData.id, {
      ...orderData,
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error saving videoOrder:", err);
    res.status(500).json({ error: err.message || "Failed to save videoOrder" });
  }
});

// Admin Dispatch & Trigger Video Studio Generation
app.post("/api/admin/dispatch-video", adminAuthMiddleware, async (req, res) => {
  try {
    const {
      projectId,
      customerName,
      birthYear,
      element,
      direction,
      buildingType,
      packageType,
      images = []
    } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: "Missing projectId" });
    }

    const videoStudioUrl = (process.env.VIDEO_STUDIO_URL || "https://ais-pre-pu7a7mgzu5meihkevrptbc-83853799035.asia-southeast1.run.app").trim();
    const videoToken = (process.env.VIDEO_STUDIO_SECRET || "YOHU_SECRET_2026").trim(); // Nên đặt VIDEO_STUDIO_SECRET trên Vercel

    const payload = {
      secretToken: videoToken,
      projectId,
      customerName: customerName || "Gia chủ",
      birthYear: birthYear || "",
      element: element || "",
      direction: direction || "",
      buildingType: buildingType || "Nhà phố",
      packageType: packageType || "STANDARD",
      images: Array.isArray(images) ? images : []
    };

    console.log(`[Video Studio Dispatch] Sending project ${projectId} to ${videoStudioUrl}/api/create-project-video ...`);

    let studioResponseData: any = null;
    let studioStatus = 200;
    try {
      const response = await fetch(`${videoStudioUrl}/api/create-project-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      studioStatus = response.status;
      if (response.ok) {
        try {
          studioResponseData = await response.json();
        } catch {
          studioResponseData = { success: true };
        }
      } else {
        const errText = await response.text().catch(() => "");
        console.warn(`[Video Studio Dispatch Response ${response.status}]:`, errText);
        studioResponseData = { success: false, status: response.status, message: errText || "Video Studio response code " + response.status };
      }
    } catch (err: any) {
      console.warn("[Video Studio Network Warning]:", err.message || err);
      studioResponseData = { success: false, message: err.message || "Network connection issue to Video Studio" };
    }

    // Update in-memory / persistent order status
    const orderId = "VID-" + projectId;
    const existingOrder = inMemoryStore.videoOrders.get(orderId) || {};
    const updatedOrder = {
      ...existingOrder,
      id: orderId,
      projectId,
      customerName: payload.customerName,
      packageType: payload.packageType,
      status: studioResponseData?.success ? "RENDERING" : "DISPATCHED",
      dispatchedAt: new Date().toISOString(),
      studioResponse: studioResponseData,
      videoUrl: studioResponseData?.videoUrl || studioResponseData?.url || existingOrder.videoUrl || ""
    };
    inMemoryStore.videoOrders.set(orderId, updatedOrder);

    // Also update lead record if exists
    const leads = await getLeads();
    const lead = leads.find((l: any) => l.id === projectId);
    if (lead) {
      lead.videoStatus = "RENDERING";
      lead.videoPackageType = payload.packageType;
      if (studioResponseData?.videoUrl) {
        lead.link_video_phoi_canh = studioResponseData.videoUrl;
      }
      await saveLeadToFirestore(lead);
    }

    res.json({
      success: true,
      message: "Đã gửi lệnh tạo video thành công sang Video Studio!",
      payload,
      studioResponse: studioResponseData
    });
  } catch (err: any) {
    console.error("Error in dispatch-video:", err);
    res.status(500).json({ error: err.message || "Failed to dispatch video creation" });
  }
});

// Serve static built files in production, use Vite in development
async function startServer() {
  console.log("[Yohu AI Server] Initializing Express + Vite...");

  if (process.env.NODE_ENV !== "production") {
    console.log("[Yohu AI Server] Registering Vite middleware...");
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
      console.log("[Yohu AI Server] Vite middleware registered successfully.");
    } catch (err) {
      console.error("[Yohu AI Server] FAILED to register Vite middleware:", err);
    }
  } else {
    console.log("[Yohu AI Server] Using production static serving...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Production build not found. Please run npm run build.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Yohu AI Server] Online on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error("[Yohu AI Server] FATAL ERROR DURING STARTUP:", err);
    process.exit(1);
  });
}
