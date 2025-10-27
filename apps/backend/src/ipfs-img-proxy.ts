import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fetch from 'node-fetch';

const app = express();
const PORT = Number(process.env.AUX_PORT || process.env.PORT || 3003);

// Allow your Vite app + general dev use
app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));

function gatewayForIpfs(cidOrPath: string) {
  // Accept forms like "bafy.../path/file.png" or just "bafy..."
  return `https://w3s.link/ipfs/${cidOrPath.replace(/^ipfs:\/\//,'').replace(/^\/+/,'')}`;
}

app.get('/healthz', (_req, res) => res.json({ ok: true }));

// GET /ipfs-img?u=<http(s)|ipfs://...>   OR   /ipfs-img?cid=<cid[/path]>
app.get('/ipfs-img', async (req, res) => {
  try {
    let src = String(req.query.u || '');
    const cid = String(req.query.cid || '');

    if (!src && cid) src = gatewayForIpfs(cid);

    if (!src) return res.status(400).json({ error: 'Missing ?u or ?cid' });

    if (src.startsWith('ipfs://')) src = gatewayForIpfs(src.slice('ipfs://'.length));
    if (!/^https?:\/\//i.test(src)) return res.status(400).json({ error: 'Only http(s) or ipfs:// supported' });

    const r = await fetch(src, { redirect: 'follow' });
    if (!r.ok) return res.status(r.status).send(`Upstream error ${r.status}`);

    // Forward content-type and cache headers when present
    const ct = r.headers.get('content-type') || 'application/octet-stream';
    const cc = r.headers.get('cache-control');
    res.setHeader('Content-Type', ct);
    if (cc) res.setHeader('Cache-Control', cc);

    // Stream bytes
    r.body.pipe(res);
  } catch (e: any) {
    console.error('proxy error:', e?.message || e);
    res.status(500).send('proxy failure');
  }
});

if (process.env.RUN_STANDALONE) { // app.listen DISABLED (PORT, '0.0.0.0', () => { }
// RUN_STANDALONE gate:
if (process.env.RUN_STANDALONE) {
  // app.listen DISABLED (PORT, "0.0.0.0", () => {
    console.log(`ipfs-img-proxy listening on http://0.0.0.0:${PORT}`);
  });
}
  console.log(`ipfs-img-proxy listening on http://0.0.0.0:${PORT}`);
});
