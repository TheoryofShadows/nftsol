import type { Request, Response, NextFunction } from "express";

export default function corsAllowed(req: Request, res: Response, next: NextFunction) {
  const list = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  // Always allow local dev UI
  if (!list.includes("http://localhost:3000")) list.push("http://localhost:3000");

  const allowed = new Set(list);
  const origin = req.headers.origin as string | undefined;

  if (origin && allowed.has(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
}
