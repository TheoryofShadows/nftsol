import ipfsRouter from "../routes/ipfs";
import "./env-loader.js";
import { cluster, HELIUS_URL } from "./env-loader.js";
import { createServer } from "http";
import app from "./app.js";

const port = Number(process.env.PORT) || 3001;
const server = createServer(app);
server.listen(port, () => {
  console.log(`✅ API listening on http://localhost:${port}`);
});


// === IPFS image proxy (hardened) ============================================
import type { Request, Response } from "express";

const debug = String(req.query.debug || "") === "1";
    if (!raw) return res.status(400).json({ error: "missing u" });

    const list = ipfsGatewayList(raw);
    const init: RequestInit = {
      redirect: "follow",
      headers: {
        "Accept": "*/*",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
    };

    let ok: globalThis.Response | null = null;
    const attempts: Array<{url:string;status?:number;ct?:string;error?:string}> = [];

    for (const url of list) {
      try {
        const r = await fetch(url, init);
        const ct = r.headers.get("content-type") || "";
        attempts.push({ url, status: r.status, ct });

        if (r.ok && (ct.startsWith("image/") || ct.includes("png") || ct.includes("jpeg") || ct.includes("gif") || ct.includes("webp") || ct.startsWith("application/octet-stream"))) {
          ok = r;
          break;
        }
        if (r.ok) { ok = r; break; } // some gateways omit image/*
      } catch (e:any) {
        attempts.push({ url, error: e?.message || String(e) });
      }
    }

    if (debug) {
      return res.status(ok ? 200 : 502).json({ input: raw, attempts });
    }

    if (!ok) {
      return res.status(502).json({ error: "all gateways failed", attempts });
    }

    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.setHeader("Content-Type", ok.headers.get("content-type") || "application/octet-stream");
    const buf = Buffer.from(await ok.arrayBuffer());
    return res.status(200).send(buf);
  } catch (e:any) {
    return res.status(502).json({ error: e?.message || String(e) });
  }
});
// ============================================================================

// === IPFS image proxy (hardened) ============================================
import type { Request, Response } from "express";

const debug = String(req.query.debug || "") === "1";
    if (!raw) return res.status(400).json({ error: "missing u" });

    const list = ipfsGatewayList(raw);
    const init: RequestInit = {
      redirect: "follow",
      headers: {
        "Accept": "*/*",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
    };

    let ok: globalThis.Response | null = null;
    const attempts: Array<{url:string;status?:number;ct?:string;error?:string}> = [];

    for (const url of list) {
      try {
        const r = await fetch(url, init);
        const ct = r.headers.get("content-type") || "";
        attempts.push({ url, status: r.status, ct });
        if (r.ok && (ct.startsWith("image/") || ct.includes("png") || ct.includes("jpeg") || ct.includes("gif") || ct.includes("webp") || ct.startsWith("application/octet-stream"))) {
          ok = r;
          break;
        }
        if (r.ok) { ok = r; break; }
      } catch (e:any) {
        attempts.push({ url, error: e?.message || String(e) });
      }
    }

    if (debug) {
      return res.status(ok ? 200 : 502).json({ input: raw, attempts });
    }
    if (!ok) {
      return res.status(502).json({ error: "all gateways failed", attempts });
    }

    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.setHeader("Content-Type", ok.headers.get("content-type") || "application/octet-stream");
    const buf = Buffer.from(await ok.arrayBuffer());
    return res.status(200).send(buf);
  } catch (e:any) {
    return res.status(502).json({ error: e?.message || String(e) });
  }
});
// ============================================================================

// === IPFS image proxy (hardened) ============================================
function ipfsGatewayList(u: string) {
  const GWS = [
    "https://w3s.link/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
  ];
  return u.startsWith("ipfs://") ? GWS.map(g => g + u.slice(7)) : [u];
}

app.get("/ipfs-img", async (req: Request, res: Response) => {
  try {
    const raw = String(req.query.u || "");
    const debug = String(req.query.debug || "") === "1";
    if (!raw) return res.status(400).json({ error: "missing u" });

    const list = ipfsGatewayList(raw);
    const init: RequestInit = {
      redirect: "follow",
      headers: {
        "Accept": "*/*",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
    };

    let ok: globalThis.Response | null = null;
    const attempts: Array<{url:string;status?:number;ct?:string;error?:string}> = [];

    for (const url of list) {
      try {
        const r = await fetch(url, init);
        const ct = r.headers.get("content-type") || "";
        attempts.push({ url, status: r.status, ct });

        if (r.ok && (ct.startsWith("image/") || ct.includes("png") || ct.includes("jpeg") || ct.includes("gif") || ct.includes("webp") || ct.startsWith("application/octet-stream"))) {
          ok = r;
          break;
        }
        if (r.ok) { ok = r; break; } // some gateways omit image/*
      } catch (e:any) {
        attempts.push({ url, error: e?.message || String(e) });
      }
    }

    if (debug) {
      return res.status(ok ? 200 : 502).json({ input: raw, attempts });
    }

    if (!ok) {
      return res.status(502).json({ error: "all gateways failed", attempts });
    }

    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.setHeader("Content-Type", ok.headers.get("content-type") || "application/octet-stream");
    const buf = Buffer.from(await ok.arrayBuffer());
    return res.status(200).send(buf);
  } catch (e:any) {
    return res.status(502).json({ error: e?.message || String(e) });
  }
});
// ============================================================================


// Mount hardened IPFS proxy (keeps /ipfs/:cid/*)
app.use("/", ipfsRouter);
