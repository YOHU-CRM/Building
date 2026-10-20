// YOHU Kế toán — đọc câu trả lời "Hỏi nhanh" bằng giọng tiếng Việt của Google Cloud Text-to-Speech.
// Khách không phải cài giọng đọc: máy chủ tạo file MP3, trình duyệt chỉ việc phát.
// Cần đặt trên Vercel → Settings → Environment Variables:
//   GOOGLE_TTS_KEY   = mã API Google Cloud (chỉ cho phép Cloud Text-to-Speech API)
//   GOOGLE_TTS_VOICE = (không bắt buộc) tên giọng, mặc định vi-VN-Wavenet-A
module.exports = async (req, res) => {
  try {
    const key = process.env.GOOGLE_TTS_KEY;
    if (!key) { res.status(503).send("Chưa cài GOOGLE_TTS_KEY"); return; }
    // chỉ phục vụ trang web của chính mình (giảm bị người ngoài dùng ké)
    const host = String(req.headers.host || ""), ref = String(req.headers.referer || req.headers.origin || "");
    if (ref && host && ref.indexOf(host) < 0) { res.status(403).send("Không được phép"); return; }
    const text = String((req.query && req.query.t) || "").replace(/\s+/g, " ").trim().slice(0, 400);
    if (!text) { res.status(400).send("Thiếu nội dung"); return; }
    const voice = process.env.GOOGLE_TTS_VOICE || "vi-VN-Wavenet-A";
    const r = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize?key=" + encodeURIComponent(key), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: { text }, voice: { languageCode: "vi-VN", name: voice }, audioConfig: { audioEncoding: "MP3", speakingRate: 0.95 } })
    });
    const j = await r.json();
    if (!r.ok || !j.audioContent) { res.status(502).send((j.error && j.error.message) || "Google TTS lỗi"); return; }
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=2592000");   // cùng câu đọc lại: lấy bản lưu, không tốn thêm
    res.status(200).send(Buffer.from(j.audioContent, "base64"));
  } catch (e) { res.status(500).send("Lỗi: " + e.message); }
};
