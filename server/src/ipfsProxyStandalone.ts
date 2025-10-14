import express from "express";
const app = express();
const PORT = Number(process.env.IPFS_PROXY_PORT || 3002);

function ipfsGatewayList(u: string) {
  const GWS = [
    "https://w3s.link/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
  ];
  return u.startsWith("ipfs://") ? GWS.map((g) => g + u.slice(7)) : [u];
}

app.get("/ipfs-img", async (req, res) => {
  try {
    const raw = String(req.query.u || "");
    const debug = String(req.query.debug || "") === "1";
    if (!raw) return res.status(400).json({ error: "missing u" });

    const list = ipfsGatewayList(raw);
    const init: RequestInit = {
      redirect: "follow",
      headers: {
        Accept: "*/*",
        "User-Agent": "Mozilla/5.0",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    };

    let ok: globalThis.Response | null = null;
    const attempts: Array<{ url: string; status?: number; ct?: string; error?: string }> = [];

    for (const url of list) {
      try {
        const r = await fetch(url, init);
        const ct = r.headers.get("content-type") || "";
        attempts.push({ url, status: r.status, ct });
        if (r.ok) { ok = r; break; }
      } catch (e: any) {
        attempts.push({ url, error: e?.message || String(e) });
      }
    }

    if (debug) return res.status(ok ? 200 : 502).json({ input: raw, attempts });
    if (!ok) return res.status(502).json({ error: "all gateways failed", attempts });

    res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    res.setHeader("Content-Type", ok.headers.get("content-type") || "application/octet-stream");
    const buf = Buffer.from(await ok.arrayBuffer());
    return res.status(200).send(buf);
  } catch (e: any) {
    return res.status(502).json({ error: e?.message || String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`✅ IPFS proxy listening on http://localhost:${PORT}`);
});
