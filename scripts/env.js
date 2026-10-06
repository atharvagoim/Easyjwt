// Reads .env (and real environment variables, which win) and writes config.js for the browser.
// No dependencies. Only the keys listed below are exposed. They end up public on your site.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const KEYS = { PHONE: 'phone', WHATSAPP: 'whatsapp', INSTAGRAM: 'instagram', EMAIL: 'email' };

function parseEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, '');
    out[m[1]] = v;
  }
  return out;
}

function writeConfig(dir = ROOT) {
  const env = parseEnv(path.join(ROOT, '.env'));
  const cfg = {};
  for (const [k, name] of Object.entries(KEYS)) cfg[name] = process.env[k] ?? env[k] ?? '';
  const js = `/* generated from .env, do not edit */\nwindow.EASY_JWT_CONFIG = ${JSON.stringify(cfg, null, 2)};\n`;
  fs.writeFileSync(path.join(dir, 'config.js'), js);
  return cfg;
}

module.exports = { writeConfig };
if (require.main === module) { console.log('config.js written:', writeConfig()); }
