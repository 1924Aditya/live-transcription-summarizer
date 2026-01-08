#!/usr/bin/env node
// mic.js - tiny Node static server (start with `node mic.js`)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const base = process.cwd();

const mime = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'
};

function createServerInstance() {
  return http.createServer((req, res) => {
    let reqpath = decodeURIComponent(req.url.split('?')[0]);
    if (reqpath === '/') reqpath = '/index.html';
    const filePath = path.join(base, reqpath);

    fs.stat(filePath, (err, stat) => {
      if (err) return send404(res);
      if (stat.isDirectory()) return send404(res);

      const ext = path.extname(filePath).toLowerCase();
      const type = mime[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      fs.createReadStream(filePath).pipe(res);
    });
  });
}

function send404(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
}

function startServer(port) {
  const server = createServerInstance();

  server.on('listening', () => {
    console.log(`Static server started on http://localhost:${port} (cwd=${base})`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use. Trying ${port + 1}...`);
      // ensure server is closed before retrying
      try { server.close(); } catch (e) { /* ignore */ }
      setTimeout(() => startServer(port + 1), 200);
      return;
    }
    console.error('Server error:', err);
    process.exit(1);
  });

  // start listening on this server
  server.listen(port);

  // graceful shutdown for this instance
  const shutdown = () => {
    try {
      server.close(() => process.exit(0));
    } catch (e) { process.exit(0); }
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

startServer(PORT);
