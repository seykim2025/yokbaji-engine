// POST /api/auth/toss-login — proxy to Toss auth server

import type { VercelRequest, VercelResponse } from "@vercel/node";

const AUTH_BASE = process.env.TOSS_AUTH_URL ?? "https://auth.oneclack.com";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const upstream = await fetch(`${AUTH_BASE}/api/toss/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error("[toss-login] proxy error:", err);
    return res.status(502).json({ error: "Auth proxy error" });
  }
}
