// npm run build → dist/ (static files + config.js from .env or host env vars). Deploy the dist folder.
const fs = require('fs');
const path = require('path');
const { writeConfig } = require('./env');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
for (const f of ['index.html', 'styles.css', 'app.js']) fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
for (const f of fs.readdirSync(path.join(ROOT, 'assets'))) fs.copyFileSync(path.join(ROOT, 'assets', f), path.join(DIST, 'assets', f));
const cfg = writeConfig(DIST);
writeConfig(ROOT);
console.log('Built dist/ with', cfg);
