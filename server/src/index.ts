import http from 'node:http';

const HOST = process.env.HOST ?? '0.0.0.0';
// Use SECONDARY_PORT so we never clash with the main proxy on 3003
const PORT = Number(process.env.SECONDARY_PORT ?? 3004);

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    const body = JSON.stringify({ ok: true });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(body);
    return;
  }
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`aux server listening on http://${HOST}:${PORT}`);
});
