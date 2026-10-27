// Captures of a study without a window: headless Chrome (with the GPU) against the dev server.
//   node tools/foto.mjs <out.jpg> "<url query>" <scroll fraction> [<out.jpg> "<query>" <fraction> …]
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const args = process.argv.slice(2);
const port = 9336;
const chrome = spawn(process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), 'infinito-foto')}`, '--window-size=1600,900', '--ignore-gpu-blocklist', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
  } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
  if (m.method === 'Runtime.exceptionThrown') console.error('[page]', m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
for (let i = 0; i < args.length; i += 3) {
  const [file, query, frac] = [args[i], args[i + 1], Number(args[i + 2])];
  await send('Page.navigate', { url: `http://localhost:5203/estudios/doble.html?${query}` });
  await sleep(3500);
  await send('Runtime.evaluate', { expression: `scrollTo(0, (document.body.scrollHeight - innerHeight) * ${frac})` });
  await sleep(1500);
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
  console.log(file);
}
await send('Browser.close');
chrome.kill();
process.exit(0);
