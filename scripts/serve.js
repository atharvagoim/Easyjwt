// Local dev server: npm start → http://localhost:3000
// config.js is regenerated from .env on every page load, so edits to .env show up on refresh.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { writeConfig } = require('./env');

const ROOT = path.join(__dirname, '..');
const PORT = +process.env.PORT || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.md': 'text/plain' };
const BLOCK = /(^|\/)(\.env|\.git|node_modules|scripts|dist)(\/|$)/;

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') p = '/index.html';
  if (p === '/config.js') writeConfig();
  const file = path.normalize(path.join(ROOT, p));
  if (!file.startsWith(ROOT) || BLOCK.test(path.relative(ROOT, file))) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(PORT, () => { writeConfig(); console.log(`\n  Easy JWT running →  http://localhost:${PORT}\n`); });
