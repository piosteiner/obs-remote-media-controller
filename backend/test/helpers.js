// A real server for the API tests: src/server.js on a free port, with its own empty data and uploads folders
// (OBS_DATA_DIR, OBS_UPLOADS_DIR) — never the live ones. The admin key is KEY.
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const KEY = 'test-key';

const freePort = () => new Promise((resolve, reject) => {
  const srv = net.createServer();
  srv.listen(0, () => { const { port } = srv.address(); srv.close(() => resolve(port)); });
  srv.on('error', reject);
});

async function startServer() {
  const port = await freePort();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'obs-test-'));
  const dataDir = path.join(dir, 'data');
  const uploadsDir = path.join(dir, 'uploads');
  const url = `http://localhost:${port}`;
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'src', 'server.js')], {
    env: { ...process.env, PORT: String(port), OBS_DATA_DIR: dataDir, OBS_UPLOADS_DIR: uploadsDir, ADMIN_API_KEY: KEY,
      API_BASE_URL: url, ALLOWED_ORIGINS: 'http://localhost' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`${url}/api/health`)).ok) break; } catch { /* not up yet */ }
    if (child.exitCode !== null) throw new Error(`server exited:\n${log}`);
    await new Promise((r) => setTimeout(r, 100));
  }
  const api = async (method, p, body, { key = KEY, raw = false } = {}) => {
    const res = await fetch(`${url}/api${p}`, {
      method,
      headers: { ...(key ? { 'X-API-Key': key } : {}), ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) },
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
    return raw ? res : { status: res.status, body: await res.json().catch(() => null) };
  };
  const stop = () => new Promise((resolve) => {
    child.once('exit', () => { fs.rmSync(dir, { recursive: true, force: true }); resolve(); });
    child.kill();
  });
  return { url, port, dataDir, uploadsDir, api, stop, log: () => log };
}

module.exports = { startServer, KEY };
