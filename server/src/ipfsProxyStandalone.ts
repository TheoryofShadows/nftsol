import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = Number(process.env.PORT) || 3003;

app.get("/ipfs-img", async (req, res) => {
  try {
    const cid = req.query.cid as string;
    if (!cid) return res.status(400).send("Missing cid");

    const gateway = "https://w3s.link/ipfs/";
    const url = `${gateway}${cid}`;
    const r = await fetch(url);

    if (!r.ok) throw new Error(`fetch failed ${r.status}`);

    const ct = r.headers.get("content-type") || "application/octet-stream";
    const cc = r.headers.get("cache-control");

    res.setHeader("Content-Type", ct);
    if (cc) res.setHeader("Cache-Control", cc);

    // Stream response bytes
    (r.body as any).pipe(res);
  } catch (e: any) {
    console.error("proxy error:", e?.message || e);
    res.status(500).send("proxy failure");
  }
});

// optional standalone mode
if (process.env.RUN_STANDALONE) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ IPFS proxy listening on http://0.0.0.0:${PORT}`);
  });
}

export default app;
