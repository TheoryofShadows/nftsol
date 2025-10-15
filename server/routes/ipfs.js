import { Router } from "express";
import pino from "pino";
import LRU from "lru-cache";
import crypto from "crypto";
import { fetchFromGateways } from "../ipfs/gatewayClient";
import { getCached, setCached } from "../ipfs/cache";
const log = pino({ level: process.env.LOG_LEVEL || "info" });
const inflight = new LRU({ max: 1024 });
const MAX_MB = Number(process.env.MAX_IMAGE_MB || 50);
const r = Router();
function etag(b) { return 'W/"' + crypto.createHash("sha1").update(b).digest("hex") + '"'; }
r.get("/ipfs/:cid/*", async (req, res) => {
    const { cid } = req.params;
    const tail = req.params[0] || "";
    const key = `ipfs/${cid}/${tail}`;
    try {
        let data = await getCached(key);
        if (!data) {
            let p = inflight.get(key);
            if (!p) {
                p = (async () => {
                    const { buf } = await fetchFromGateways(`${cid}/${tail}`);
                    if (buf.byteLength > MAX_MB * 1024 * 1024)
                        throw Object.assign(new Error("Payload too large"), { status: 413 });
                    await setCached(key, buf);
                    return buf;
                })();
                inflight.set(key, p);
            }
            data = await p;
            inflight.delete(key);
        }
        const tag = etag(data);
        if (req.headers["if-none-match"] === tag)
            return res.status(304).end();
        res.setHeader("ETag", tag);
        res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
        const range = req.headers.range;
        if (range) {
            const m = /^bytes=(\d+)-(\d+)?$/.exec(String(range));
            if (m) {
                const start = Number(m[1]);
                const end = m[2] ? Number(m[2]) : data.length - 1;
                if (start <= end && end < data.length) {
                    res.status(206);
                    res.setHeader("Accept-Ranges", "bytes");
                    res.setHeader("Content-Range", `bytes ${start}-${end}/${data.length}`);
                    return res.end(data.subarray(start, end + 1));
                }
            }
        }
        if (req.method === "HEAD")
            return res.status(200).end();
        return res.status(200).end(data);
    }
    catch (e) {
        log.warn({ err: e?.message }, "IPFS fetch failed");
        if (e?.status === 413)
            return res.status(413).json({ error: "File too large" });
        return res.status(502).json({ error: "Bad Gateway" });
    }
});
export default r;
