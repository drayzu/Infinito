import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../estudios/style.css';
import * as THREE from 'three';
import { clamp, damp } from './engine/math';
import { FONDOS } from './engine/pantalla';
import { createStage, type Stage } from '../estudios/stage';
import { cuenta, escalera, FONT, ink, VIOLETA } from '../estudios/placa';
import type { Escena, Frame, Instancia } from '../estudios/tipos';
import { tuDoble } from '../estudios/tudoble';
import { ramas } from '../estudios/ramas';
import { leyes } from '../estudios/leyes';
import { agujero } from '../estudios/agujero';
import { bloque } from '../estudios/bloque';
import { simulacion } from '../estudios/simulacion';
import { boltzmann } from '../estudios/boltzmann';
import { fractal } from '../estudios/fractal';
import { final } from '../estudios/final';

/**
 * Infinito, phase 1: the journey. One scroll through the ways Diego chose in phase 0, in the order of
 * the acts. Each act builds into its own group (a little before it is reached) and owns the camera
 * while it is on; between acts the film dips through black for a beat (the bridges come later).
 * The clock and the ladder are the studies' plate.
 *
 * URL: ?p=beat (start there) &ver=beat (freeze) &cap=1600x900 (render at that size) &debug (leaves
 * `viaje` in the console: `viaje.hoja('docs/viaje/x.jpg', beats, cols, width)`).
 */

const ACTOS: [Escena, number][] = [
  [tuDoble, 0],
  [ramas, 3],
  [leyes, 0],
  [agujero, 0],
  [bloque, 2],
  [simulacion, 3],
  [boltzmann, 1], // the hologram, closing the simulation
  [boltzmann, 0], // the Boltzmann brain
  [fractal, 0],
  [final, 3],
];
/** Beats before the first act: the title. */
const PORTADA = 1.6;
/** Beats of black between two acts (half on each side). */
const FUNDIDO = 0.5;
const PX_PER_BEAT = 520;

const params = new URLSearchParams(location.search);
const capMatch = /^(\d+)x(\d+)$/.exec(params.get('cap') ?? '');
const fixed = capMatch ? { w: Number(capMatch[1]), h: Number(capMatch[2]) } : null;
if (fixed) document.body.classList.add('is-cap');

const canvas = document.querySelector<HTMLCanvasElement>('#scene')!;
const plate = document.querySelector<HTMLCanvasElement>('#placa')!;
const g = plate.getContext('2d')!;
const stage = createStage(canvas, fixed);
const spacer = document.querySelector<HTMLElement>('#spacer')!;

// ---------------------------------------------------------------- the acts

interface Tramo {
  escena: Escena;
  estilo: number;
  inicio: number;
  largo: number;
  grupo: THREE.Group;
  inst: Instancia | null;
  /** The film settings the act chose when it was built (re-applied when it comes on). */
  film: { strength: number; radius: number; threshold: number; exposure: number } | null;
}

/** An act builds into its own group: a stage whose root is that group. */
function montar(t: Tramo) {
  if (t.inst) return t.inst;
  const s = Object.create(stage, { root: { value: t.grupo } }) as Stage;
  stage.reset();
  t.inst = t.escena.montar(s, t.estilo);
  t.film = { strength: stage.bloom.strength, radius: stage.bloom.radius, threshold: stage.bloom.threshold, exposure: stage.renderer.toneMappingExposure };
  t.grupo.visible = false;
  return t.inst;
}

// The length of each act comes from its own timeline: build them all once to measure (cheap enough
// for now; the heavy ones load their maps in the background).
const tramos: Tramo[] = [];
let cursor = PORTADA;
for (const [escena, estilo] of ACTOS) {
  const grupo = new THREE.Group();
  stage.root.add(grupo);
  const t: Tramo = { escena, estilo, inicio: cursor, largo: 0, grupo, inst: null, film: null };
  montar(t);
  t.largo = t.inst!.tl.length;
  cursor += t.largo + FUNDIDO;
  tramos.push(t);
}
const TOTAL = cursor;
spacer.style.height = `${TOTAL * PX_PER_BEAT + innerHeight}px`;

/** The act on at beat P, and the beat inside it. */
function enTramo(P: number) {
  let t = tramos[0];
  for (const x of tramos) if (P >= x.inicio - FUNDIDO / 2) t = x;
  return { t, p: clamp(P - t.inicio, 0, t.largo) };
}

// ---------------------------------------------------------------- scroll and autoplay

let P = clamp(Number(params.get('p') ?? 0), 0, TOTAL);
let target = P;
let autoplay = false;
const frozen: number | null = params.has('ver') ? Number(params.get('ver')) : null;
scrollTo(0, P * PX_PER_BEAT);
addEventListener('scroll', () => (target = clamp(scrollY / PX_PER_BEAT, 0, TOTAL)));
addEventListener('wheel', () => (autoplay = false), { passive: true });
addEventListener('keydown', (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  if (ev.key.toLowerCase() === 'a') autoplay = !autoplay;
});
const mouse = new THREE.Vector2();
const mouseTarget = new THREE.Vector2();
addEventListener('pointermove', (ev) => mouseTarget.set((ev.clientX / innerWidth) * 2 - 1, -((ev.clientY / innerHeight) * 2 - 1)));
const calm = matchMedia('(prefers-reduced-motion: reduce)');

let activo: Tramo | null = null;

/** One frame at journey beat `at`, ambient time `now` (ms), step `dt` (s). */
function step(now: number, dt: number, at: number) {
  const { camera } = stage;
  const W = stage.W;
  const H = stage.H;
  const { t, p } = enTramo(at);
  const inst = montar(t);
  if (activo !== t) {
    if (activo) activo.grupo.visible = false;
    t.grupo.visible = true;
    if (t.film) {
      stage.bloom.strength = t.film.strength;
      stage.bloom.radius = t.film.radius;
      stage.bloom.threshold = t.film.threshold;
      stage.renderer.toneMappingExposure = t.film.exposure;
    }
    activo = t;
  }
  const f: Frame = { time: calm.matches ? 0 : now / 1000, dt, p, W, H, u: H / 860, dpr: stage.dpr, focal: H / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), camera };
  inst.update(f);
  if (!fixed && !calm.matches) {
    mouse.x = damp(mouse.x, mouseTarget.x, 3, dt);
    mouse.y = damp(mouse.y, mouseTarget.y, 3, dt);
    camera.rotateY(-mouse.x * 0.025);
    camera.rotateX(mouse.y * 0.018);
  }
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  f.focal = H / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  for (const s of FONDOS) {
    s.seguir(camera);
    s.u.uTime.value = f.time;
    (s.u.uRes.value as THREE.Vector2).set(W, H);
  }
  stage.render(f.time);

  // ---- The plate.
  if (plate.width !== W || plate.height !== H) {
    plate.width = W;
    plate.height = H;
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, W, H);
  const u = f.u;
  // The dip between acts, and the title before the first.
  const negro = Math.max(1 - clamp((at - (t.inicio - FUNDIDO / 2)) / (FUNDIDO / 2), 0, 1), clamp((at - (t.inicio + t.largo)) / (FUNDIDO / 2), 0, 1));
  const portada = 1 - clamp((at - PORTADA * 0.35) / (PORTADA * 0.6), 0, 1);
  const tapa = Math.max(negro, t === tramos[0] ? portada : 0);
  if (tapa > 0.001) {
    g.fillStyle = `rgba(0,0,0,${tapa})`;
    g.fillRect(0, 0, W, H);
  }
  if (portada > 0.01) {
    g.save();
    g.globalAlpha = portada;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = FONT.serif(118 * u);
    g.fillStyle = ink(0.96);
    g.fillText('Infinito', W / 2, H * 0.44);
    g.font = FONT.italic(30 * u);
    g.fillStyle = ink(0.75);
    g.fillText('¿Qué hay más allá?', W / 2, H * 0.44 + 84 * u);
    g.font = FONT.mono(11 * u);
    g.letterSpacing = `${1.8 * u}px`;
    g.fillStyle = VIOLETA;
    g.fillText('HORIZONTES · 04', W / 2, H * 0.44 - 92 * u);
    g.restore();
    return;
  }
  const vis = 1 - negro;
  g.save();
  g.globalAlpha = vis;
  inst.placa?.(g, f);
  // The brand, top left.
  g.textBaseline = 'alphabetic';
  g.shadowColor = 'rgba(0,0,0,0.8)';
  g.shadowBlur = 10 * u;
  g.font = FONT.serif(27 * u);
  g.fillStyle = ink();
  g.fillText('Infinito', 40 * u, 54 * u);
  g.restore();
  const c = inst.cuenta(p);
  g.save();
  g.globalAlpha = vis;
  cuenta(g, u, H, c, inst.rotulo(p));
  g.restore();
  if (c && inst.escalera !== false) escalera(g, u, W, H, c.h, (c.a ?? 1) * vis);
}

let last = performance.now();
function frame(now: number) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (autoplay) {
    const next = Math.min(TOTAL, target + dt * 0.45);
    scrollTo(0, next * PX_PER_BEAT);
    target = next;
    if (next >= TOTAL) autoplay = false;
  }
  P = frozen ?? damp(P, target, 4.2, dt);
  step(now, dt, P);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------------------------------------------------------------- captures (?debug)

async function save(path: string, c: HTMLCanvasElement, q = 0.88) {
  const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/jpeg', q));
  await fetch(`/__guardar?f=${encodeURIComponent(path)}`, { method: 'POST', body: blob });
}
function shot(b: number, warm = 40) {
  const t0 = performance.now();
  for (let k = 0; k < warm; k++) step(t0 + k * 16.7, 1 / 60, b);
  const out = document.createElement('canvas');
  out.width = stage.W;
  out.height = stage.H;
  const o = out.getContext('2d')!;
  o.drawImage(canvas, 0, 0);
  o.drawImage(plate, 0, 0);
  return out;
}
const api = {
  get total() {
    return TOTAL;
  },
  tramos: () => tramos.map((t) => [t.escena.id, t.estilo + 1, +t.inicio.toFixed(2), +t.largo.toFixed(2)]),
  async listo() {
    await Promise.all(tramos.map((t) => t.inst?.listo));
    await document.fonts.ready;
  },
  async hoja(path: string, beats: number[], cols = 5, tw = 384) {
    await api.listo();
    const th = Math.round((tw * stage.H) / stage.W);
    const out = document.createElement('canvas');
    out.width = cols * tw;
    out.height = Math.ceil(beats.length / cols) * th;
    const o = out.getContext('2d')!;
    for (const [k, b] of beats.entries()) {
      o.drawImage(shot(b), (k % cols) * tw, Math.floor(k / cols) * th, tw, th);
      o.font = `500 ${Math.round(12 * (tw / 640))}px "Geist Mono Variable"`;
      o.fillStyle = 'rgba(0,0,0,0.6)';
      o.fillRect((k % cols) * tw + 6, Math.floor(k / cols) * th + 6, 54 * (tw / 384), 18 * (tw / 384));
      o.fillStyle = '#ece7db';
      o.fillText(b.toFixed(1), (k % cols) * tw + 10, Math.floor(k / cols) * th + 19 * (tw / 384));
    }
    await save(path, out);
    return [out.width, out.height];
  },
};
if (params.has('debug')) Object.assign(window, { viaje: api });
