import { Router } from "express";
import pino from "pino";
import { fetchFromGateways } from "../ipfs/gatewayClient";
import { getCached, setCached } from "../ipfs/cache";
import LRU from "lru-cache";

const log = pino({ level: process.env.LOG_LEVEL || "info" });
const inflight = new LRU<string, Promise<Buffer>>({ max: 512 });
const MAX_MB = Number(process.env.MAX_IMAGE_MB || 20);

const r = Router();

r.get("/ipfs/:cid/*", async (req, res) => {
  const { cid } = req.params;
  const tail = req.params[0] || "";
  const key = `ipfs/${cid}/${tail}`;

  try {
    const cached = await getCached(key);
    if (cached) {
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      return res.end(cached);
    }

    let p = inflight.get(key);
    if (!p) {
      p = (async () => {
        const { buf, headers } = await fetchFromGateways(`${cid}/${tail}`);
        if (buf.byteLength > MAX_MB * 1024 * 1024) throw Object.assign(new Error("Payload too large"), { status: 413 });
        await setCached(key, buf);
        const ct = (headers["content-type"] ?? (headers as any)["Content-Type"]) as string | string[] | undefined;
        if (ct) res.setHeader("Content-Type", Array.isArray(ct) ? ct[0] : ct);
        return buf;
      })();
      inflight.set(key, p);
    }
    const buf = await p;
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    res.end(buf);
  } catch (e: any) {
    log.warn({ err: e?.message }, "IPFS fetch failed");
    if (e?.status === 413) return res.status(413).json({ error: "File too large" });
    res.status(502).json({ error: "Bad Gateway" });
  } finally {
    inflight.delete(key);
  }
});

export default r;
