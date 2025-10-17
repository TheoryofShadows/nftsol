import express from "express";

const app = express();

// Health endpoints
app.get("/healthz", (_req,res)=>res.json({ ok:true, service:"ipfs-proxy" }));
app.head("/healthz", (_req,res)=>res.status(200).end());

const PORT = Number(process.env.AUX_PORT || process.env.IPFS_PROXY_PORT || process.env.SECONDARY_PORT || 3004);

const GATEWAYS = [
  "https://w3s.link/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
] as const;

function toCandidates(u: string) {
  if (u.startsWith("ipfs://")) {
    const path = u.slice(7);
    return GATEWAYS.map(gw => gw + path);
  }
  return [u];
}

function isLikelyBinary(ct: string) {
  const t = (ct || "").toLowerCase();
  if (t.startsWith("image/")) return true;
  if (t.startsWith("application/octet-stream")) return true;
  if (t.includes("image")) return true;
  return false;
}

function withTimeout(ms: number) {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, cancel: () => clearTimeout(id) };
}

app.get("/ipfs-img", async (req, res) => {
  const raw = String(req.query.u || "");
  const debug = String(req.query.debug || "") === "1";
  const strict = String(req.query.strict || "1") !== "0";
  if (!raw) return res.status(400).json({ error: "missing u" });

  const list = toCandidates(raw);
  const attempts: Array<{ url: string; status?: number; ct?: string; error?: string }> = [];
  let ok: Response | null = null;

  for (const url of list) {
    const { signal, cancel } = withTimeout(8000);
    try {
      const head = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        headers: {
          "Accept": "*/*",
          "User-Agent": "Mozilla/5.0",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
        signal,
      }).catch(() => null as any);

      let ct = head?.headers?.get("content-type") || "";
      let status = head?.status;

      if (!head || (status && status >= 400)) {
        const { signal: s2, cancel: c2 } = withTimeout(8000);
        const probe = await fetch(url, {
          method: "GET",
          redirect: "follow",
          headers: {
            "Accept": "*/*",
            "User-Agent": "Mozilla/5.0",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Range": "bytes=0-0",
          },
          signal: s2,
        });
        ct = probe.headers.get("content-type") || "";
        status = probe.status;
        c2();
      }

      attempts.push({ url, status, ct });

      if (status && status >= 200 && status < 300 && (!strict || isLikelyBinary(ct))) {
        const { signal: s3, cancel: c3 } = withTimeout(15000);
        const full = await fetch(url, {
          redirect: "follow",
          headers: {
            "Accept": "*/*",
            "User-Agent": "Mozilla/5.0",
          },
          signal: s3,
        });
        if (full.ok) {
          ok = full;
          c3();
          cancel();
          break;
        }
        c3();
      }
      cancel();
    } catch (e: any) {
      attempts.push({ url, error: e?.message || String(e) });
    }
  }

  if (debug) return res.json({ input: raw, attempts });

  if (!ok) return res.status(502).json({ error: "all gateways failed", input: raw, attempts });

  const ct = ok.headers.get("content-type") || "application/octet-stream";
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  res.setHeader("Content-Type", ct);

  if (ok.body) {
    ok.body.pipeTo(new WritableStream({
      bwrite(chunk: any) { res.write(chunk); },
      close() { res.end(); },
      abort() { res.end(); }
    } as any)).catch(() => res.end());
  } else {
    res.status(500).end();
  }
});

if (process.env.RUN_STANDALONE) { app.listen(PORT, () => { }
// RUN_STANDALONE gate:
if (process.env.RUN_STANDALONE) {
  app.listen(PORT, () => {
    console.log(`✅ IPFS proxy listening on http://localhost:${PORT}`);
  });
}
  console.log(`✅ IPFS proxy listening on http://localhost:${PORT}`);
});
