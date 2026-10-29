// Contact sheets of the studies without a window: headless Chrome (with the GPU) against the dev
// server (npm run dev, port 5203). Each job is <moment> <way> <frames> [out]; the frames are spread
// evenly over the whole way and saved by the page itself into docs/estudios/.
//   node tools/hojas.mjs leyes 2 12 agujero 1 16 agujero 2 16
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const args = process.argv.slice(2);
const port = 9337;
const chrome = spawn(process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), 'infinito-hojas')}`, '--window-size=1600,900', '--ignore-gpu-blocklist', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
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
for (let i = 0; i < args.length; i += 3) {
  // A way written «4v» is that way as the journey has it (GUION.md).
  const viaje = String(args[i + 1]).endsWith('v');
  const [m, s, n] = [args[i], parseInt(args[i + 1], 10), Number(args[i + 2])];
  if (m === 'puentes') {
    // Five frames round every change of act (just before, and through the relay), one row each.
    await send('Page.navigate', { url: 'http://localhost:5203/index.html?debug&cap=1600x900' });
    await sleep(6000);
    const r = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `(async () => { await viaje.listo(); const t = viaje.tramos(); const b = []; for (const x of t.slice(1)) for (const d of [-0.25, 0.3, 0.8, 1.3, 2.2]) b.push(+(x[2] + d).toFixed(2)); await viaje.hoja('docs/viaje/puentes.jpg', b, 5, 320); return b.length; })()`,
    });
    console.log(`puentes: ${r.result?.result?.value ?? JSON.stringify(r.result?.exceptionDetails ?? r)}`);
    continue;
  }
  if (m === 'cuadro') {
    // One frame of the journey at beat s, full size, into docs/viaje/cuadro-<s>.jpg.
    await send('Page.navigate', { url: 'http://localhost:5203/index.html?debug&cap=1600x900' });
    await sleep(6000);
    const b = args[i + 1];
    const r = await send('Runtime.evaluate', { awaitPromise: true, returnByValue: true, expression: `(async () => { await viaje.listo(); await viaje.hoja('docs/viaje/cuadro-${b}.jpg', [${b}], 1, 1600); return 'ok'; })()` });
    console.log(`cuadro ${b}: ${r.result?.result?.value ?? JSON.stringify(r.result?.exceptionDetails ?? r)}`);
    continue;
  }
  if (m === 'viaje') {
    // The whole journey: n frames spread over it (s is ignored), into docs/viaje/viaje.jpg.
    await send('Page.navigate', { url: 'http://localhost:5203/index.html?debug&cap=1600x900' });
    await sleep(6000);
    const r = await send('Runtime.evaluate', {
      awaitPromise: true,
      returnByValue: true,
      expression: `(async () => { await viaje.listo(); const L = viaje.total; const b = Array.from({ length: ${n} }, (_, i) => +(0.2 + i * (L - 0.4) / ${n - 1}).toFixed(2)); await viaje.hoja('docs/viaje/viaje.jpg', b, 6, 320); return JSON.stringify(viaje.tramos()) + ' total ' + L.toFixed(1); })()`,
    });
    console.log(`viaje: ${r.result?.result?.value ?? JSON.stringify(r.result?.exceptionDetails ?? r)}`);
    continue;
  }
  await send('Page.navigate', { url: `http://localhost:5203/estudios/index.html?m=${m}&s=${s}&debug&cap=1600x900${viaje ? '&viaje' : ''}` });
  await sleep(2500);
  const r = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => { await estudio.inst?.listo; const L = estudio.length; const b = Array.from({ length: ${n} }, (_, i) => +(0.3 + i * (L - 0.3) / ${n - 1}).toFixed(2)); await estudio.hoja('docs/estudios/${m}-${s}${viaje ? 'v' : ''}.jpg', b, 4, 480); return L; })()`,
  });
  console.log(`${m}-${s}: ${r.result?.result?.value ?? JSON.stringify(r.result?.exceptionDetails ?? r)}`);
}
await send('Browser.close');
chrome.kill();
process.exit(0);
