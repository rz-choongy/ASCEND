// Reverse proxy in front of the Expo web dev server that forces
// Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy headers onto
// EVERY response, including the top-level index.html document.
//
// Why this exists: metro.config.js already sets these headers via
// `server.enhanceMiddleware`, and that correctly reaches Metro's own
// `.bundle` / asset routes -- but `expo start --web`'s dev server serves
// the root index.html document through a code path that doesn't run
// through that hook, so the *document* response never carries the
// headers. Cross-origin isolation (and therefore `SharedArrayBuffer`,
// which expo-sqlite's web/WASM backend needs) requires the headers on the
// top-level document itself, not just its subresources -- so without this,
// the app throws "SharedArrayBuffer is not defined" before it can render.
//
// Usage: node scripts/web-coi-proxy.js <listenPort> <targetPort>
// Defaults: listen 8091, target 8090 (matches .claude/launch.json).
const http = require('http');

const LISTEN_PORT = Number(process.argv[2]) || 8091;
const TARGET_PORT = Number(process.argv[3]) || 8090;

const COI_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

const server = http.createServer((req, res) => {
  const proxyReq = http.request(
    {
      host: '127.0.0.1',
      port: TARGET_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, {
        ...proxyRes.headers,
        ...COI_HEADERS,
      });
      proxyRes.pipe(res, { end: true });
    },
  );

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain', ...COI_HEADERS });
    res.end(`web-coi-proxy: upstream error: ${err.message}`);
  });

  req.pipe(proxyReq, { end: true });
});

// WebSocket upgrade support (Metro's Fast Refresh / HMR socket).
server.on('upgrade', (req, clientSocket, head) => {
  const proxyReq = http.request({
    host: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  });

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    clientSocket.write(
      `HTTP/1.1 101 Switching Protocols\r\n` +
        Object.entries(proxyRes.headers)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\r\n') +
        '\r\n\r\n',
    );
    proxySocket.write(proxyHead);
    proxySocket.pipe(clientSocket);
    clientSocket.pipe(proxySocket);
  });

  proxyReq.on('error', () => clientSocket.destroy());
  proxyReq.end();
});

server.listen(LISTEN_PORT, () => {
  console.log(
    `web-coi-proxy: listening on http://localhost:${LISTEN_PORT}, forwarding to http://localhost:${TARGET_PORT} with COOP/COEP headers forced on every response`,
  );
});
