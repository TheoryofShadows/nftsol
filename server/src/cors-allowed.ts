import type { Request, Response, NextFunction } from "express";

export default function corsAllowed(req: Request, res: Response, next: NextFunction) {
  const list = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  // Always allow local dev UI
  if (!list.includes("http://localhost:3000")) list.push("http://localhost:3000");
  if (!list.includes("http://localhost:5173")) list.push("http://localhost:5173");

  // Production domains that should always be allowed if in production
  if (process.env.NODE_ENV === "production") {
    const productionDomains = [
      "https://nftsol.app",
      "https://www.nftsol.app",
      "https://market.nftsol.app",
    ];
    productionDomains.forEach((domain) => {
      if (!list.includes(domain)) list.push(domain);
    });
  }

  const allowed = new Set(list);
  const origin = req.headers.origin as string | undefined;

  if (origin && allowed.has(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
}
