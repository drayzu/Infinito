import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import * as THREE from 'three';
import { createPost } from '../src/engine/post';
import { enfocar, materia, materiaBuilder, type Nube } from '../src/engine/materia';
import { gauss, smoothstep } from '../src/engine/math';

/**
 * Infinito · phase-0 study: «tu doble». If space goes on for ever, every way of arranging the matter
 * in a volume like ours repeats somewhere, yours too: your nearest double would be some 10^10^29 m
 * away (Tegmark, 2003). Three ways to show it (keys 1 2 3, scroll moves through it):
 *
 * 1 · Retícula: our observable universe (a sphere of cosmic web) and, as the camera pulls back,
 *     others like it in a lattice without end, each a different arrangement (turned its own way);
 *     far out, one turned exactly as ours: the double, marked.
 * 2 · Barajar: one volume, its matter shuffling through arrangements while the count of tries
 *     climbs as powers of ten; it settles into ours.
 * 3 · Torre: the pull back through lattices of lattices; the number is written as a tower of powers.
 */

const params = new URLSearchParams(location.search);
let manera = Number(params.get('s') ?? 1);
const post = createPost(document.querySelector<HTMLCanvasElement>('#scene')!);
const { renderer, scene, camera } = post;
post.bloom.strength = 0.6;
post.bloom.radius = 0.45;
post.bloom.threshold = 0.55;
renderer.toneMappingExposure = 1.0;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const VIOLETA = new THREE.Color(0.79, 0.7, 1.0);

// ---------------------------------------------------------------- an observable universe (radius 1)
/** Its cosmic web: knots joined to their neighbours by filaments, a little haze of field galaxies. */
function web(seed: number) {
  const b = materiaBuilder(seed);
  const nodos: THREE.Vector3[] = [];
  for (let i = 0; i < 90; i++) {
    const [x, y, z] = b.onSphere();
    nodos.push(V(x, y, z).multiplyScalar(Math.cbrt(b.r()) * 0.95));
  }
  const col = (t: number) => new THREE.Color(1, 1, 1).lerp(VIOLETA, t);
  for (const n of nodos) {
    for (let k = 0; k < 90; k++) b.push(n.x + gauss(b.r) * 0.025, n.y + gauss(b.r) * 0.025, n.z + gauss(b.r) * 0.025, col(0.3), 0.006, 0.55);
    const cerca = nodos.filter((m) => m !== n).sort((a, c) => a.distanceTo(n) - c.distanceTo(n)).slice(0, 3);
    for (const m of cerca) {
      const d = m.distanceTo(n);
      const k = Math.round(d * 260);
      for (let i = 0; i < k; i++) {
        const t = b.r();
        b.push(n.x + (m.x - n.x) * t + gauss(b.r) * 0.012, n.y + (m.y - n.y) * t + gauss(b.r) * 0.012, n.z + (m.z - n.z) * t + gauss(b.r) * 0.012, col(0.7), 0.004, 0.5);
      }
    }
  }
  for (let i = 0; i < 6000; i++) {
    const [x, y, z] = b.onSphere();
    const r = Math.cbrt(b.r());
    b.push(x * r, y * r, z * r, col(1), 0.003, 0.15);
  }
  // The edge: the horizon, faint.
  for (let i = 0; i < 9000; i++) {
    const [x, y, z] = b.onSphere();
    b.push(x, y, z, VIOLETA, 0.004, 0.18);
  }
  return b.data();
}

const datos = web(2003);
/** Every n-th point: the far copies need far fewer (their points merge anyway). */
function ralo(d: typeof datos, n: number): typeof datos {
  const pick = <T extends Float32Array>(a: T, k: number) => {
    const m = Math.floor(a.length / k / n);
    const out = new Float32Array(m * k);
    for (let i = 0; i < m; i++) for (let j = 0; j < k; j++) out[i * k + j] = a[i * n * k + j];
    return out;
  };
  return { position: pick(d.position, 3), aFrom: pick(d.aFrom, 3), color: pick(d.color, 3), aInk: pick(d.aInk, 1), size: pick(d.size, 1).map((x) => x * Math.sqrt(n)), seed: pick(d.seed, 1), aDelay: pick(d.aDelay, 1), aKind: pick(d.aKind, 1) };
}
const datosLejos = ralo(datos, 6);
/** A copy of the universe: same matter, its own arrangement (its own turn and a shuffle `uMezcla`). */
function copia(gain: number, d = datos) {
  const n = materia(d, {
    pre: /* glsl */ `uniform float uMezcla, uSemilla; uniform vec3 uTinte;
      float hh(float x) { return fract(sin(x * 91.17 + uSemilla * 13.7) * 43758.5453); }`,
    move: /* glsl */ `
      // Shuffled: every point to somewhere else in the sphere (uMezcla 1), or where ours has it (0).
      vec3 q = vec3(hh(seed * 3.1), hh(seed * 7.7), hh(seed * 11.3)) * 2.0 - 1.0;
      q = normalize(q + 1e-4) * pow(hh(seed * 5.3), 0.33);
      p = mix(p, q, uMezcla);
      em *= uTinte;
      fuente = 0.0;`,
    uniforms: { uMezcla: { value: 0 }, uSemilla: { value: Math.random() * 100 }, uTinte: { value: new THREE.Color(1, 1, 1) } },
  });
  n.u.uSpread.value = 0;
  n.u.uGain.value = gain;
  return n;
}

// ---------------------------------------------------------------- the lattice
const nuestro = copia(1);
scene.add(nuestro.points);
// Us: a point of teal light at the centre.
const yo = materia(
  (() => {
    const b = materiaBuilder(1);
    b.push(0, 0, 0, new THREE.Color(0.45, 1.0, 0.85), 0.03, 6);
    return b.data();
  })(),
  { move: 'fuente = 1.0;' },
);
yo.u.uSpread.value = 0;
scene.add(yo.points);
const copias: { n: Nube; pos: THREE.Vector3; doble: boolean }[] = [];
const PASO = 2.6;
const R = 3;
const DOBLE = V(3, -1, -2).multiplyScalar(PASO);
for (let i = -R; i <= R; i++)
  for (let j = -R; j <= R; j++)
    for (let k = -R; k <= R; k++) {
      if (i === 0 && j === 0 && k === 0) continue;
      const pos = V(i, j, k).multiplyScalar(PASO);
      const doble = pos.equals(DOBLE);
      const c = copia(0.8, datosLejos);
      c.points.position.copy(pos);
      if (!doble) c.points.rotation.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
      scene.add(c.points);
      copias.push({ n: c, pos, doble });
    }
const dobleYo = materia(
  (() => {
    const b = materiaBuilder(2);
    b.push(0, 0, 0, new THREE.Color(0.45, 1.0, 0.85), 0.03, 6);
    for (let i = 0; i < 4000; i++) {
      const [x, y, z] = b.onSphere();
      b.push(x * 1.04, y * 1.04, z * 1.04, new THREE.Color(0.45, 1.0, 0.85), 0.006, 0.6);
    }
    return b.data();
  })(),
  { move: 'fuente = 1.0;' },
);
dobleYo.u.uSpread.value = 0;
dobleYo.points.position.copy(DOBLE);
scene.add(dobleYo.points);

// ---------------------------------------------------------------- the words
const MOMENTOS: Record<number, [string, string, string][]> = {
  1: [
    ['I · Más allá del horizonte', 'El horizonte', 'Lo que vemos termina donde la luz no ha tenido tiempo de llegar. Más allá, el espacio sigue.'],
    ['I · Más allá del horizonte', 'Otros como el nuestro', 'Si sigue para siempre, hay otros volúmenes como el nuestro, con la misma física y su materia ordenada a su manera.'],
    ['I · Más allá del horizonte', 'Tu doble', 'Las maneras de ordenar un volumen son muchísimas, pero no infinitas. En un espacio infinito, todas se repiten: también la tuya.'],
  ],
  2: [
    ['I · Más allá del horizonte', 'Un volumen', 'El nuestro: su materia ordenada de una manera entre muchísimas.'],
    ['I · Más allá del horizonte', 'Barajar', 'Cada volumen lejano es otra mano de la misma baraja. Casi todas son distintas de la nuestra.'],
    ['I · Más allá del horizonte', 'Tu doble', 'Pero las manos posibles se acaban, y el espacio no: tarde o temprano sale la nuestra.'],
  ],
  3: [
    ['I · Más allá del horizonte', 'El horizonte', 'Todo lo que vemos: 10²⁷ metros.'],
    ['I · Más allá del horizonte', 'Más allá', 'Volúmenes como el nuestro, y volúmenes de volúmenes.'],
    ['I · Más allá del horizonte', 'Tu doble', 'Tu doble más cercano estaría a unos 10 elevado a 10²⁹ metros: un 1 seguido de tantos ceros que no cabrían en el universo.'],
  ],
};
const $ = (s: string) => document.querySelector<HTMLElement>(s)!;
for (const b of document.querySelectorAll<HTMLButtonElement>('.maneras button')) {
  b.onclick = () => {
    manera = Number(b.dataset.s);
    pintar();
  };
}
addEventListener('keydown', (e) => {
  if (e.key === '1' || e.key === '2' || e.key === '3') {
    manera = Number(e.key);
    pintar();
  }
});
function pintar() {
  for (const b of document.querySelectorAll<HTMLButtonElement>('.maneras button')) b.classList.toggle('on', Number(b.dataset.s) === manera);
}
pintar();

/** Powers of ten, and towers of them, as text. */
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const sup = (n: number) => [...String(n)].map((c) => SUP[c] ?? c).join('');

// ---------------------------------------------------------------- each frame
const t0 = performance.now();
function frame() {
  requestAnimationFrame(frame);
  const time = (performance.now() - t0) / 1000;
  const max = document.body.scrollHeight - innerHeight;
  const p = Math.min(1, Math.max(0, scrollY / Math.max(1, max))) * 3;
  const i = Math.min(2, Math.floor(p));
  const k = p - i;
  const [cap, tit, txt] = MOMENTOS[manera][i];
  $('#cap').textContent = cap;
  $('#tit').textContent = tit;
  $('#txt').textContent = txt;

  // The camera: pulling back from inside our volume (and, in way 3, ever further).
  const lejos = manera === 3 ? Math.exp(Math.log(0.6) + Math.min(p, 2.6) * 1.75) : Math.exp(Math.log(0.6) + Math.min(p, 2.2) * 1.45);
  const a = time * 0.03 + p * 0.5;
  const mira = manera === 1 && p > 2 ? DOBLE.clone().multiplyScalar(smoothstep(2.0, 2.6, p) * 0.5) : V();
  camera.position.set(Math.sin(a) * lejos, lejos * 0.35, Math.cos(a) * lejos).add(mira);
  camera.lookAt(mira);
  camera.updateMatrixWorld();

  // Way 1: the lattice appears as we leave our horizon; the double lights up at the end.
  // Way 2: only our volume, shuffling; it settles back at the end.
  // Way 3: the lattice, and its own copies further out (the same lattice seen from ever further).
  const red = manera === 2 ? 0 : smoothstep(0.6, 1.4, p);
  for (const c of copias) {
    c.n.points.visible = red > 0.001;
    c.n.u.uGain.value = red * (c.doble && manera === 1 ? 1.0 : 0.45);
    (c.n.u.uTinte.value as THREE.Color).setRGB(1, 1, 1);
    c.n.u.uMezcla.value = manera === 2 ? 0 : 0.0;
  }
  const marca = manera === 1 ? smoothstep(2.1, 2.6, p) : manera === 3 ? smoothstep(2.3, 2.8, p) : 0;
  dobleYo.points.visible = marca > 0.001;
  dobleYo.u.uGain.value = marca;
  if (manera === 2) {
    const baraja = smoothstep(0.7, 1.1, p) * (1 - smoothstep(2.3, 2.85, p));
    nuestro.u.uMezcla.value = baraja * (0.55 + 0.45 * Math.abs(Math.sin(time * 7.0)));
    (nuestro.u.uSemilla as { value: number }).value = Math.floor(time * 6) * 1.37;
  } else nuestro.u.uMezcla.value = 0;

  // The number.
  let cifra = '';
  let linea = '';
  if (manera === 1) {
    cifra = p < 1 ? '10²⁷ m' : p < 2 ? `${Math.round(10 + p * 40)}` : '10<sup>10<sup>29</sup></sup> m';
    linea = p < 1 ? 'el horizonte · lo que podemos ver' : p < 2 ? 'volúmenes como el nuestro' : 'hasta tu doble más cercano';
  } else if (manera === 2) {
    const e = Math.floor(10 + 110 * smoothstep(0.7, 2.4, p));
    cifra = `10${sup(e)}`;
    linea = 'manos barajadas';
  } else {
    const e = Math.floor(27 + (p > 2 ? 0 : p * 12));
    cifra = p < 2 ? `10${sup(e)} m` : '10<sup>10<sup>29</sup></sup> m';
    linea = p < 2 ? 'cuánto vemos' : 'tu doble · una torre de potencias';
  }
  $('#cifra').innerHTML = cifra;
  $('#cifraT').textContent = linea;

  const H = renderer.domElement.height;
  const focal = H / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  for (const n of [nuestro, yo, dobleYo, ...copias.map((c) => c.n)]) {
    enfocar(n, focal, post.dpr, time);
    n.u.uSizeUnit.value = 1;
  }
  post.render(time, 0, 0);
  void k;
}
frame();
