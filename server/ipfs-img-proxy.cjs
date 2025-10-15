const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fetch = require('node-fetch');

const app = express();
const PORT = Number(process.env.PORT || process.env.SECONDARY_PORT || 3004);

app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('tiny'));

const toGateway = (s) => {
  const clean = String(s).replace(/^ipfs:\/\//,'').replace(/^\/+/, '');
  return `https://w3s.link/ipfs/${clean}`;
};

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.get('/ipfs-img', async (req, res) => {
  try {
    let src = req.query.u ? String(req.query.u) : '';
    const cid = req.query.cid ? String(req.query.cid) : '';
    if (!src && cid) src = toGateway(cid);
    if (!src) return res.status(400).json({ error: 'Missing ?u or ?cid' });

    if (src.startsWith('ipfs://')) src = toGateway(src.slice('ipfs://'.length));
    if (!/^https?:\/\//i.test(src)) return res.status(400).json({ error: 'Only http(s) or ipfs:// supported' });

    const r = await fetch(src, {
      redirect: 'follow',
      headers: { 'User-Agent': 'NFTSolProxy/1.0', 'Accept': '*/*' },
    });
    if (!r.ok) return res.status(r.status).send(`Upstream error ${r.status}`);

    const ct = r.headers.get('content-type') || 'application/octet-stream';
    const cc = r.headers.get('cache-control');
    res.setHeader('Content-Type', ct);
    if (cc) res.setHeader('Cache-Control', cc);

    r.body.on('error', () => res.destroy());
    r.body.pipe(res);
  } catch (e) {
    console.error('proxy error:', e && e.message ? e.message : e);
    res.status(500).send('proxy failure');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ipfs-img-proxy listening on http://0.0.0.0:${PORT}`);
});
