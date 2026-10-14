import { app } from "../server.js";

export default function handler(req: any, res: any) {
  // Fix Vercel URL stripping if /api was removed in serverless routing
  if (req.url && !req.url.startsWith("/api") && !req.url.startsWith("/?")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  return app(req, res);
}
