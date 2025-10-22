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

/**
 * === IPFS image proxy (hardened, standalone) ================================
 * Usage:
 *   GET /ipfs-img?u=<cid or full http(s) url>[&path=<subpath>][&debug=1]
 */
app.get("/ipfs-img", async (req: Request, res: Response) => {
  try {
    const debug = String(req.query.debug || "") === "1";
    const uRaw = String(req.query.u || "").trim();
    const subpath = String(req.query.path || "").trim();

    if (!uRaw) return res.status(400).json({ error: "missing query param 'u'" });

    const isHttp = /^https?:\/\//i.test(uRaw);
    const safePath = subpath && subpath.startsWith("/") ? subpath : (subpath ? `/${subpath}` : "");
    const candidates: string[] = [];

    if (isHttp) {
      try {
        const given = new URL(uRaw);
        candidates.push(given.toString());
      } catch { /* fall through */ }
    }

    const cidMatch = uRaw.match(/([a-z0-9]{46,}|bafy[0-9a-z]+)/i);
    if (cidMatch) {
      const cid = cidMatch[1];
      const suffix = safePath || "";
      candidates.push(
        `https://w3s.link/ipfs/${cid}${suffix}`,
        `https://ipfs.io/ipfs/${cid}${suffix}`,
        `https://cloudflare-ipfs.com/ipfs/${cid}${suffix}`,
        `https://dweb.link/ipfs/${cid}${suffix}`
      );
    }

    if (!candidates.length && !isHttp) {
      try { candidates.push(new URL(uRaw).toString()); } catch { /* ignore */ }
    }
    if (!candidates.length) {
      return res.status(400).json({ error: "could not derive any candidate URLs from 'u'" });
    }

    const attempts: Array<{ url: string; status?: number; ok?: boolean; error?: string; contentType?: string }> = [];
    let best: any = null, bestUrl = "";

    for (const url of candidates) {
      try {
        const r = await fetch(url, { method: "GET", redirect: "follow", cache: "no-store" });
        attempts.push({ url, status: r.status, ok: r.ok, contentType: r.headers.get("content-type") || undefined });
        if (r.ok) { best = r; bestUrl = url; break; }
      } catch (err: any) {
        attempts.push({ url, ok: false, error: err?.message || String(err) });
      }
    }

    if (debug) return res.status(best ? 200 : 502).json({ input: { u: uRaw, path: subpath }, tried: attempts, picked: bestUrl || null });
    if (!best) return res.status(502).json({ error: "all gateways failed", attempts });

    const ct = (best.headers.get("content-type") || "application/octet-stream").toLowerCase();
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");

    // Stream if possible
    // @ts-ignore Node fetch Response has Readable body
    if (best.body && typeof best.body.pipe === "function") {
      // @ts-ignore
      return best.body.pipe(res);
    }
    const buf = Buffer.from(await best.arrayBuffer());
    return res.status(200).send(buf);
  } catch (e: any) {
    return res.status(502).json({ error: e?.message || String(e) });
  }
});
/** ======================================================================== */
