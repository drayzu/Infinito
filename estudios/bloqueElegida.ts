import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder, type Nube } from '../src/engine/materia';
import { lerp } from '../src/engine/math';
import { deH, h10, ink, proyectar, slog, texto, type Cuenta, type Rotulo } from './placa';
import { ease, mirar, TU, V } from './comun';
import type { Stage } from './stage';
import type { Frame, Instancia } from './tipos';

/**
 * Study · act V, the way Diego chose (28 Oct 2026): the spring (way 1); coming close, the spring is
 * made of instants, frames you fly through (way 2); from the side they are the block; pulling out,
 * the frames dissolve back into the spring, your life lights up, and the block of the stars'
 * worldlines closes it (the end of way 1).
 *
 * One world for all of it: time is +Y. The spring's points and the frames keep their time in y
 * (years × PITCH); the shaders multiply it by `uE`, the stretch of time. Coming close stretches time
 * ×12, so a year is three units tall and its 24 frames sit an eighth of a unit apart, as in way 2.
 */

const CAP = 'V · El tiempo no pasa';
const SOL = new THREE.Color(1.0, 0.72, 0.38);
const AZUL = new THREE.Color(0.35, 0.55, 1.0);
const PITCH = 0.25;
const T0 = -110;
const T1 = 110;
const NACE = -32;
const MUERE = 48;
/** Frames: 24 a year, from a year before the start to ten after. */
const K = 260;
const POR_ANO = 24;
const K0 = 24;
const E_MAX = 12;

export function montarElegida(stage: Stage, viaje = false): Instancia {
  const root = stage.root;
  const { camera } = stage;
  stage.bloom.strength = 0.5;
  stage.bloom.radius = 0.6;
  stage.bloom.threshold = 0.35;
  const nubes: Nube[] = [];
  const add = (n: Nube) => {
    n.u.uSpread.value = 0;
    root.add(n.points);
    nubes.push(n);
    return n;
  };

  // ---------------------------------------------------------------- the choreography
  const tl = new Timeline();
  tl.set({ ahora: -0.15, E: 1, bq: 0, reb: 0, hel: 1, lado: 0, corte: 0, hojas: 0, vida: 0, todo: 0, c0: viaje ? 0 : 1, c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, c6: 0, apaga: 0 });
  // The voice: GUION.md 24–29 in the journey; the study's own words otherwise.
  const T = viaje
    ? {
        ahora: ['Ahora', 'La Tierra da vueltas al Sol y sientes que el tiempo pasa: el pasado ya no está y el futuro todavía no.'],
        direccion: ['Una dirección', 'Pero para la física, el tiempo es una dirección más. Dibujado así, el camino de la Tierra es un resorte.'],
        instante: ['Instantes', 'De cerca, el resorte está hecho de instantes, como los cuadros de una película.'],
        paginas: ['Pasar', 'Sentir que el tiempo pasa es ir de uno al siguiente.'],
        bloque: ['El bloque', 'Pero todos los cuadros están ahí, a la vez.'],
        otro: ['Otro ahora', 'Y para alguien que se mueve, el ahora corta el bloque en otro ángulo: su presente no es el tuyo.'],
        vida: ['Tu vida', 'Tu vida es un tramo de ese resorte: tu nacimiento en un extremo, tu muerte en el otro.'],
        todo: ['Para siempre', 'Y nada dice que solo exista el ahora. Cada instante tuyo, este también, está ahí para siempre.'],
      }
    : {
        ahora: ['Ahora', 'La Tierra gira alrededor del Sol y tú sientes que el tiempo pasa: el pasado ya no está y el futuro todavía no.'],
        direccion: ['El tiempo es una dirección', 'Para Einstein, el tiempo es una dirección más, como arriba o adelante. Dibujado así, el camino de la Tierra es un resorte.'],
        instante: ['Un instante', 'De cerca, el resorte está hecho de instantes. Cada uno es un cuadro: el Sol, la Tierra y las estrellas, quietos.'],
        paginas: ['Pasar las páginas', 'Sentir que el tiempo pasa es ir de un cuadro al siguiente. Pero ¿y si todos los cuadros existen, y solo los recorres?'],
        bloque: ['El bloque', 'Vistos de lado, los instantes forman un bloque. La Tierra deja un resorte, el Sol una columna, cada estrella una línea.'],
        otro: ['Otro ahora', 'Para alguien que se mueve, el ahora corta el bloque en otro ángulo, y su presente incluye parte de tu futuro. Ningún corte es el verdadero.'],
        vida: ['Tu vida', 'Tu vida es un tramo de ese resorte: unas ochenta vueltas. Tu nacimiento en un extremo, tu muerte en el otro.'],
        todo: ['Todo a la vez', 'Y nada en las ecuaciones dice que solo exista el ahora. El tramo entero está ahí, de una vez: cada instante de tu vida, para siempre.'],
      };
  tl.label('ahora').caption(viaje ? 3.4 : 2.4, T.ahora[0], T.ahora[1]);
  // In the journey it starts far, the Sun a light in the middle (act IV leaves it so), and comes in.
  if (viaje) tl.to(1.4, { c0: 1, ahora: 0.15 });
  tl.to(viaje ? 2.0 : 2.4, { ahora: 0.55 });
  tl.label('direccion').caption(3.0, T.direccion[0], T.direccion[1]);
  tl.to(3.0, { ahora: 1.0, bq: 1, c1: 1 });
  tl.label('instante').caption(3.0, T.instante[0], T.instante[1]);
  tl.to(3.0, { E: E_MAX, c2: 1, reb: 1, hel: 0.12 });
  tl.label('paginas').caption(3.2, T.paginas[0], T.paginas[1]);
  tl.to(3.2, { ahora: 3.9 }, (t) => t * t * (3 - 2 * t));
  tl.label('bloque').caption(3.0, T.bloque[0], T.bloque[1]);
  tl.to(3.0, { c3: 1, lado: 1 });
  tl.label('otro').caption(3.4, T.otro[0], T.otro[1]);
  tl.to(1.4, { corte: 1, hojas: 1 });
  tl.to(2.0, { corte: 2 });
  tl.label('vida').caption(3.6, T.vida[0], T.vida[1]);
  tl.to(1.6, { E: 1, reb: 0, hel: 1, hojas: 0, c4: 1 });
  tl.to(2.0, { vida: 1 });
  tl.label('todo').caption(3.6, T.todo[0], T.todo[1]);
  tl.to(1.2, { todo: 1 });
  tl.to(2.4, { c5: 1 });
  if (viaje) {
    // The bridge: back to the Earth, now, a blue light alone in the black (act VI starts there).
    tl.label('puente').caption(3.0, '', '¿Y si el bloque, el tiempo, el espacio, tú… no fueran reales?');
    tl.to(3.0, { c6: 1, apaga: 1 });
  }

  // ---------------------------------------------------------------- the spring, the Sun, the worldlines
  const hel = (t: number, E: number, out = V()) => out.set(Math.cos(t * Math.PI * 2), t * PITCH * E, -Math.sin(t * Math.PI * 2));
  const bh = materiaBuilder(3);
  for (let i = 0; i <= (T1 - T0) * 260; i++) {
    const t = T0 + i / 260;
    const q = hel(t, 1);
    bh.push(q.x, q.y, q.z, AZUL, 0.012, 1, { delay: t });
  }
  const helice = add(
    materia(bh.data(), {
      pre: /* glsl */ `uniform float uAhora, uBloque, uVida, uTodo, uNace, uMuere, uE, uHel;`,
      move: /* glsl */ `
        p.y *= uE;
        float t = aDelay;
        float pasado = uAhora - t;
        float trail = step(0.0, pasado) * exp(-max(pasado, 0.0) / 0.35);
        float vis = max(trail, uBloque * (0.22 + 0.78 * exp(-abs(pasado) / 14.0)));
        float enVida = step(uNace, t) * step(t, uMuere) * uVida;
        float bordes = (exp(-abs(t - uNace) / 0.12) + exp(-abs(t - uMuere) / 0.12)) * uVida;
        vec3 c = mix(em, vec3(0.45, 1.0, 0.85), enVida);
        float ahora = exp(-abs(pasado) / 0.25) * (1.0 - uTodo);
        em = (c * vis * (0.55 + 0.6 * enVida) + c * ahora * 1.6 + vec3(0.8, 1.0, 0.95) * bordes * 2.5) * uHel;
        sz *= 1.0 + 0.8 * enVida + 2.5 * bordes;
        fuente = 0.6;`,
      uniforms: { uAhora: { value: 0 }, uBloque: { value: 0 }, uVida: { value: 0 }, uTodo: { value: 0 }, uNace: { value: NACE }, uMuere: { value: MUERE }, uE: { value: 1 }, uHel: { value: 1 } },
    }),
  );
  const be = materiaBuilder(4);
  be.push(0, 0, 0, AZUL, 0.07, 2.4);
  const tierra = add(materia(be.data(), { move: 'fuente = 1.0;' }));
  const bs = materiaBuilder(5);
  for (let i = 0; i < 2600; i++) {
    const [x, y, z] = bs.onSphere();
    const r = 0.13 * Math.cbrt(bs.r());
    bs.push(x * r, y * r, z * r, SOL, 0.022, 0.45, { kind: 1 });
  }
  for (let i = 0; i < 26000; i++) {
    const t = T0 + bs.r() * (T1 - T0);
    const [x, , z] = bs.onSphere();
    bs.push(x * 0.07, t * PITCH, z * 0.07, SOL, 0.018, 0.7, { kind: 0, delay: t });
  }
  const solCol = add(
    materia(bs.data(), {
      pre: /* glsl */ `uniform float uAhora, uBloque, uTodo, uE, uHel;`,
      move: /* glsl */ `
        if (aKind > 0.5) { p.y += uAhora * ${PITCH} * uE; em *= (1.0 - 0.6 * uTodo) * smoothstep(0.15, 0.6, uHel); }
        else { p.y *= uE; em *= uBloque * (0.3 + 0.7 * exp(-abs(uAhora - aDelay) / 18.0)) * smoothstep(0.2, 0.7, uHel); }
        fuente = 0.7;`,
      uniforms: { uAhora: { value: 0 }, uBloque: { value: 0 }, uTodo: { value: 0 }, uE: { value: 1 }, uHel: { value: 1 } },
    }),
  );
  const bw = materiaBuilder(6);
  for (let s = 0; s < 220; s++) {
    const a = bw.r() * Math.PI * 2;
    const r = 14 + bw.r() * 60;
    const c = new THREE.Color().setHSL(0.05 + bw.r() * 0.6, 0.5, 0.7);
    for (let i = 0; i < 160; i++) {
      const t = T0 * 1.6 + bw.r() * (T1 - T0) * 1.6;
      bw.push(Math.cos(a) * r, t * PITCH, Math.sin(a) * r, c, 0.05, 0.5);
    }
  }
  const estrellas = add(materia(bw.data(), { pre: `uniform float uOn, uE;`, move: `p.y *= uE; em *= uOn; fuente = 1.0;`, uniforms: { uOn: { value: 0 }, uE: { value: 1 } } }));

  // ---------------------------------------------------------------- the frames
  const tK = (k: number) => (k - K0) / POR_ANO;
  const bc = materiaBuilder(8);
  const fondo: [number, number, THREE.Color][] = [];
  for (let s = 0; s < 120; s++) fondo.push([(bc.r() - 0.5) * 2.6, (bc.r() - 0.5) * 2.6, new THREE.Color().setHSL(0.05 + bc.r() * 0.6, 0.45, 0.75)]);
  for (let k = 0; k < K; k++) {
    const t = tK(k);
    const y = t * PITCH;
    for (let i = 0; i < 360; i++) {
      const u = i / 90;
      const side = Math.floor(u);
      const f = u - side;
      const x = side === 0 ? -1.4 + 2.8 * f : side === 1 ? 1.4 : side === 2 ? 1.4 - 2.8 * f : -1.4;
      const z = side === 0 ? -1.4 : side === 1 ? -1.4 + 2.8 * f : side === 2 ? 1.4 : 1.4 - 2.8 * f;
      bc.push(x, y, z, new THREE.Color(0.75, 0.65, 1.0), 0.012, 0.6, { delay: k, kind: 0 });
    }
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      bc.push(Math.cos(a), y, Math.sin(a), new THREE.Color(0.5, 0.55, 0.9), 0.008, 0.3, { delay: k, kind: 1 });
    }
    for (let i = 0; i < 40; i++) {
      const [x, , z] = bc.onSphere();
      bc.push(x * 0.08, y, z * 0.08, SOL, 0.03, 1.4, { delay: k, kind: 2 });
    }
    const q = hel(t, 1);
    bc.push(q.x, y, q.z, AZUL, 0.06, 2.2, { delay: k, kind: 3 });
    for (const [x, z, c] of fondo) bc.push(x, y, z, c, 0.014, 0.9, { delay: k, kind: 4 });
  }
  const cuadros = add(
    materia(bc.data(), {
      pre: /* glsl */ `uniform float uCuadro, uBloque, uLado, uE, uReb;`,
      move: /* glsl */ `
        p.y *= uE;
        float d = aDelay - uCuadro;
        float now = exp(-d * d / 0.18);
        float ahead = step(0.0, d) * exp(-d / 7.0) * 0.35 * (1.0 - uLado);
        float base = aKind < 0.5 ? 0.1 : aKind < 1.5 ? 0.05 : aKind < 2.5 ? 0.22 : aKind < 3.5 ? 1.0 : 0.45;
        float frameBoost = aKind < 0.5 ? 1.0 : 0.0;
        float vis = max(now, max(ahead * (frameBoost + 0.25), uLado * base));
        em *= vis * uReb;
        fuente = 0.7;`,
      uniforms: { uCuadro: { value: 0 }, uBloque: { value: 0 }, uLado: { value: 0 }, uE: { value: 1 }, uReb: { value: 0 } },
    }),
  );

  // Your now (teal, square to time) and a moving observer's (violet, tilted).
  const bn = materiaBuilder(9);
  for (const kind of [0, 1])
    for (let i = 0; i < 64; i++)
      for (let j = 0; j < 64; j++) bn.push(-1.4 + (2.8 * (i + 0.5)) / 64, 0, -1.4 + (2.8 * (j + 0.5)) / 64, kind ? new THREE.Color(0.8, 0.68, 1.0) : TU, 0.016, 0.55, { kind });
  const ahoras = add(
    materia(bn.data(), {
      pre: /* glsl */ `uniform float uY0, uPend, uMio, uOtro;`,
      move: /* glsl */ `
        p.y = uY0 + (aKind > 0.5 ? uPend * p.x : 0.0);
        em *= aKind > 0.5 ? uOtro : uMio;
        fuente = 1.0;`,
      uniforms: { uY0: { value: 0 }, uPend: { value: 0 }, uMio: { value: 0 }, uOtro: { value: 0 } },
    }),
  );

  // ---------------------------------------------------------------- the count
  const cuentaDe = (p: number): Cuenta => {
    const todo = tl.get('todo', p);
    if (todo > 0.02) {
      const h = lerp(slog(80), h10(52.7), ease(0, 1, todo));
      return { pisos: deH(h), linea: todo > 0.98 ? 'instantes de tu vida · todos a la vez' : 'instantes', h };
    }
    if (p >= tl.at('vida')) return { pisos: ['80'], linea: 'vueltas al Sol · tu vida', h: slog(80) };
    if (p >= tl.at('bloque')) {
      const n = Math.round(lerp(1 + (3.9 - 1.0) * POR_ANO, K, ease(0, 1, tl.get('lado', p))));
      return { pisos: [String(n)], linea: 'instantes en el bloque · todos ahí', h: slog(n) };
    }
    if (p >= tl.at('instante')) {
      const n = 1 + Math.floor((tl.get('ahora', p) - 1.0) * POR_ANO + 1e-6);
      return { pisos: [String(n)], linea: n === 1 ? 'un instante' : 'instantes recorridos', h: slog(n) };
    }
    const n = 1 + Math.round(tl.get('bq', p) * 219);
    return { pisos: [String(n)], linea: n === 1 ? 'un ahora' : 'vueltas al Sol a la vista', h: slog(n) };
  };

  const tmp = V();
  return {
    tl,
    cuenta: cuentaDe,
    rotulo(p): Rotulo | null {
      const c = tl.captionAt(p);
      return c ? { capitulo: viaje ? 'V · ¿El tiempo se va?' : CAP, name: c.name, fact: c.fact } : null;
    },
    update(f: Frame) {
      const p = f.p;
      camera.near = 1e-3;
      camera.far = 1e5;
      const ahora = tl.get('ahora', p);
      const E = tl.get('E', p);
      const todo = tl.get('todo', p);
      const hl = tl.get('hel', p);
      for (const n of [helice, solCol]) {
        n.u.uAhora.value = ahora;
        n.u.uBloque.value = tl.get('bq', p);
        n.u.uTodo.value = todo;
        n.u.uE.value = E;
        n.u.uHel.value = hl;
      }
      helice.u.uVida.value = tl.get('vida', p);
      estrellas.u.uE.value = E;
      const apaga = tl.get('apaga', p);
      estrellas.u.uOn.value = ease(0.5, 1, tl.get('c5', p)) * 1.6 * (1 - ease(0, 0.7, apaga));
      helice.u.uHel.value = hl * (1 - ease(0.2, 0.9, apaga));
      solCol.u.uHel.value = hl * (1 - ease(0.2, 0.9, apaga));
      tierra.points.position.copy(hel(ahora, E));
      tierra.u.uGain.value = Math.max((1 - todo) * lerp(1, 0.25, ease(0.3, 1, 1 - hl)), ease(0.3, 1, apaga) * 1.4);
      cuadros.u.uCuadro.value = ahora * POR_ANO + K0;
      cuadros.u.uLado.value = tl.get('lado', p);
      cuadros.u.uE.value = E;
      cuadros.u.uReb.value = tl.get('reb', p);
      // The two nows sit in the middle of the block.
      const yMid = tK((K - 1) / 2) * PITCH * E;
      const c = tl.get('corte', p);
      const hojas = tl.get('hojas', p);
      ahoras.u.uY0.value = yMid;
      ahoras.u.uMio.value = ease(0, 0.5, c) * hojas;
      ahoras.u.uOtro.value = ease(0.3, 0.8, c) * hojas;
      ahoras.u.uPend.value = 2.4 * ease(0.3, 1.0, c) * (c > 1 ? 1 + 0.5 * Math.sin((c - 1) * Math.PI) : 1);

      // ---- The camera: five poses blended in turn.
      camera.fov = lerp(42, 46, ease(0, 1, tl.get('c2', p)) * (1 - ease(0, 1, tl.get('c4', p))));
      const a = 0.5 + f.time * 0.01;
      const yN = ahora * PITCH * E;
      const yV = ((NACE + MUERE) / 2) * PITCH * E;
      const tierraAhora = hel(ahora, E);
      const poses: [THREE.Vector3, THREE.Vector3, THREE.Vector3, string | null][] = [
        [V(Math.sin(a) * 16, yN + 4, Math.cos(a) * 16), V(0, yN, 0), V(0, 1, 0), null],
        [V(Math.sin(a) * 3.4, yN + 1.6, Math.cos(a) * 3.4), V(0, yN, 0), V(0, 1, 0), 'c0'],
        [V(Math.sin(a + 0.9) * 14, yN + 2, Math.cos(a + 0.9) * 14), V(0, yN, 0), V(0, 1, 0), 'c1'],
        // Below the now, looking up the time axis: the frames ahead are the future.
        [V(0.12, yN - 2.9, 0.08), V(0, yN + 1, 0), V(0, 0, -1), 'c2'],
        // The block from the side, rolled so that time runs left to right.
        [V(Math.sin(0.3) * 21, yMid + 1.5, Math.cos(0.3) * 21), V(0, yMid, 0), V(-1, 0.32, 0.2).normalize(), 'c3'],
        [V(Math.sin(a + 0.9) * 26, yV + 3, Math.cos(a + 0.9) * 26), V(0, yV, 0), V(0, 1, 0), 'c4'],
        [V(Math.sin(a + 0.9) * 58, yV + 8, Math.cos(a + 0.9) * 58), V(0, yV, 0), V(0, 1, 0), 'c5'],
        [tierraAhora.clone().add(V(Math.sin(a + 0.9) * 2.2, 0.4, Math.cos(a + 0.9) * 2.2)), tierraAhora.clone(), V(0, 1, 0), 'c6'],
      ];
      const pos = poses[0][0].clone();
      const look = poses[0][1].clone();
      const up = poses[0][2].clone();
      for (const [P, L, U, k] of poses.slice(1)) {
        const w = ease(0, 1, tl.get(k!, p));
        pos.lerp(P, w);
        look.lerp(L, w);
        up.lerp(U, w);
      }
      mirar(camera, pos, look, up.normalize());
      for (const n of nubes) enfocar(n, f.focal, f.dpr, f.time);
    },
    placa(g, f) {
      const u = f.u;
      const E = tl.get('E', f.p);
      const n = ease(0.3, 1.0, f.p) * (1 - ease(tl.at('direccion') + 1.5, tl.at('direccion') + 2.3, f.p));
      if (n > 0.01) {
        const s = proyectar(hel(tl.get('ahora', f.p), E, tmp), camera, f.W, f.H);
        if (s.z < 1) texto(g, u, s.x + 14 * u, s.y - 14 * u, 'ahora', ink(0.85), n, 11);
      }
      const m = ease(tl.at('instante') + 1.8, tl.at('instante') + 2.6, f.p) * (1 - ease(tl.at('paginas') + 0.6, tl.at('paginas') + 1.3, f.p));
      if (m > 0.01) {
        const s = proyectar(hel(tl.get('ahora', f.p), E, tmp), camera, f.W, f.H);
        if (s.z < 1) texto(g, u, s.x + 14 * u, s.y - 14 * u, 'la Tierra · ahora', ink(0.85), m, 11);
      }
      const c = ease(tl.at('otro') + 0.8, tl.at('otro') + 1.4, f.p) * (1 - ease(tl.at('vida'), tl.at('vida') + 0.6, f.p));
      texto(g, u, f.W / 2, f.H * 0.12, 'verde: tu ahora · violeta: el de alguien que se mueve', '#cbb6ff', c, 11, 'center');
      const v = ease(tl.at('vida') + 1.8, tl.at('vida') + 2.6, f.p) * (1 - ease(tl.at('todo') + 0.4, tl.at('todo') + 1.2, f.p));
      if (v > 0.01) {
        for (const [t, label] of [[NACE, 'naces'], [MUERE, 'mueres']] as const) {
          const s = proyectar(hel(t, E, tmp), camera, f.W, f.H);
          if (s.z < 1) texto(g, u, s.x + 16 * u, s.y, label, '#73ffd9', v, 11);
        }
      }
    },
    dispose() {},
  };
}
