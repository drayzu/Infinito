import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder, type Nube } from '../src/engine/materia';
import { lerp } from '../src/engine/math';
import { deH, h10, ink, proyectar, slog, texto, type Cuenta, type Rotulo } from './placa';
import { ease, logLerp, mirar, TU, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';
import { montarElegida } from './bloqueElegida';

/**
 * Study · act V, «El tiempo no pasa»: the block universe. In relativity time is one more direction
 * of a four-dimensional spacetime, and nothing in the equations singles out a «now»: past and future
 * are there as much as the present (eternalism). Drawn with time as a direction, the Earth's orbit is
 * a spring; your life, some eighty turns of it; ~10⁵² Planck instants, all at once.
 *
 * Two ways:
 * 1 · La hélice: the Earth goes round the Sun; then time becomes a direction (up) and its path is a
 *     spring around the Sun's column. Your life lights up as a stretch of the spring, from a spark
 *     (birth) to its end; the «now» fades and the whole stretch is there at once; pulling back, the
 *     block: the worldlines of the stars around.
 * 2 · Rebanadas: an instant is a frame (the Sun, the Earth, the stars, still). The camera flies
 *     through the frames, a flipbook: that is time passing. Seen from the side they are a block; the
 *     Earth's positions make the spring. A moving observer's «now» cuts the block at another angle.
 */

const CAP = 'V · El tiempo no pasa';
const SOL = new THREE.Color(1.0, 0.72, 0.38);
const AZUL = new THREE.Color(0.35, 0.55, 1.0);

export const bloque: Escena = {
  id: 'bloque',
  nombre: 'El tiempo no pasa',
  estilos: [
    { key: '1', nombre: 'La hélice', nota: 'El tiempo como una dirección: la órbita de la Tierra es un resorte; tu vida, un tramo de ochenta vueltas, entero.' },
    { key: '2', nombre: 'Rebanadas', nota: 'Cada instante es un cuadro; la cámara los atraviesa como un libro animado, y de lado son un bloque.' },
    { key: '3', nombre: 'Elegida', nota: 'La que eligió Diego: la hélice; de cerca, sus instantes son cuadros que atraviesas; de lado, el bloque; al salir, tu vida y las líneas de las estrellas.' },
  ],
  montar(stage, estilo, viaje = false): Instancia {
    if (estilo === 2) return montarElegida(stage, viaje);
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.5;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = 0.35;
    const tl = new Timeline();
    const nubes: Nube[] = [];
    const add = (n: Nube) => {
      n.u.uSpread.value = 0;
      root.add(n.points);
      nubes.push(n);
      return n;
    };

    if (estilo === 0) {
      tl.set({ ahora: -0.15, bloque: 0, vida: 0, todo: 0, lejos: 0, ride: 0 });
      tl.label('ahora').caption(2.4, 'Ahora', 'La Tierra gira alrededor del Sol y tú sientes que el tiempo pasa: el pasado ya no está y el futuro todavía no.');
      tl.to(2.4, { ahora: 0.55 });
      tl.label('direccion').caption(3.0, 'El tiempo es una dirección', 'Para Einstein, el tiempo es una dirección más, como arriba o adelante. Dibujado así, el camino de la Tierra es un resorte.');
      tl.to(3.0, { ahora: 1.0, bloque: 1, lejos: 0.4 });
      tl.label('vida').caption(3.4, 'Tu vida', 'Tu vida es un tramo de ese resorte: unas ochenta vueltas. Tu nacimiento en un extremo, tu muerte en el otro.');
      tl.to(0.8, { vida: 1, lejos: 0.5 });
      tl.to(2.6, { ride: 1 });
      tl.label('todo').caption(3.6, 'Todo a la vez', 'Y nada en las ecuaciones dice que solo exista el ahora. El tramo entero está ahí, de una vez: cada instante de tu vida, para siempre.');
      tl.to(1.2, { todo: 1, ride: 1.25 });
      tl.to(2.4, { lejos: 1 });
    } else {
      tl.set({ k: 0, bloque: 0, corte: 0, lado: 0 });
      tl.label('instante').caption(2.2, 'Un instante', 'Esto es un instante: el Sol, la Tierra y las estrellas, quietos, como un cuadro de una película.');
      tl.to(2.2, { k: 2 });
      tl.label('paginas').caption(3.0, 'Pasar las páginas', 'Sentir que el tiempo pasa es ir de un cuadro al siguiente. Pero ¿y si todos los cuadros existen, y solo los recorres?');
      tl.to(3.0, { k: 70 }, (t) => t * t * (3 - 2 * t));
      tl.label('bloque').caption(3.0, 'El bloque', 'Vistos de lado, los instantes forman un bloque. La Tierra deja un resorte, el Sol una columna, cada estrella una línea.');
      tl.to(3.0, { lado: 1, bloque: 1 });
      tl.label('otro').caption(3.6, 'Otro ahora', 'Para alguien que se mueve, el ahora corta el bloque en otro ángulo, y su presente incluye parte de tu futuro. Ningún corte es el verdadero.');
      tl.to(1.6, { corte: 1 });
      tl.to(2.0, { corte: 2 });
    }

    // ================================================================ way 1: the spring
    const PITCH = 0.25; // scene units per year
    const T0 = -110;
    const T1 = 110;
    const NACE = -32; // your birth, in years from now
    const MUERE = 48;
    let helice: Nube | null = null;
    let tierra: Nube | null = null;
    let solCol: Nube | null = null;
    let estrellas: Nube | null = null;
    const hel = (t: number, out = V()) => out.set(Math.cos(t * Math.PI * 2), t * PITCH, -Math.sin(t * Math.PI * 2));
    if (estilo === 0) {
      const b = materiaBuilder(3);
      const per = 260;
      for (let i = 0; i <= (T1 - T0) * per; i++) {
        const t = T0 + i / per;
        const q = hel(t);
        b.push(q.x, q.y, q.z, AZUL, 0.012, 1, { delay: t });
      }
      helice = add(
        materia(b.data(), {
          pre: /* glsl */ `uniform float uAhora, uBloque, uVida, uTodo, uNace, uMuere;`,
          move: /* glsl */ `
            float t = aDelay;
            float pasado = uAhora - t;
            // Before the block: only a short trail behind the Earth (the past fading).
            float trail = step(0.0, pasado) * exp(-max(pasado, 0.0) / 0.35);
            float vis = max(trail, uBloque * (0.22 + 0.78 * exp(-abs(pasado) / 14.0)));
            // Your life: teal, with a spark at each end.
            float enVida = step(uNace, t) * step(t, uMuere) * uVida;
            float bordes = (exp(-abs(t - uNace) / 0.12) + exp(-abs(t - uMuere) / 0.12)) * uVida;
            vec3 c = mix(em, vec3(0.45, 1.0, 0.85), enVida);
            // The now: bright where the Earth is, until everything is equally there.
            float ahora = exp(-abs(pasado) / 0.25) * (1.0 - uTodo);
            em = c * vis * (0.55 + 0.6 * enVida) + c * ahora * 1.6 + vec3(0.8, 1.0, 0.95) * bordes * 2.5;
            sz *= 1.0 + 0.8 * enVida + 2.5 * bordes;
            fuente = 0.6;`,
          uniforms: { uAhora: { value: 0 }, uBloque: { value: 0 }, uVida: { value: 0 }, uTodo: { value: 0 }, uNace: { value: NACE }, uMuere: { value: MUERE } },
        }),
      );
      // The Earth (now) and the Sun's column.
      const be = materiaBuilder(4);
      be.push(0, 0, 0, AZUL, 0.07, 2.4);
      tierra = add(materia(be.data(), { move: 'fuente = 1.0;' }));
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
      solCol = add(
        materia(bs.data(), {
          pre: /* glsl */ `uniform float uAhora, uBloque, uTodo;`,
          move: /* glsl */ `
            if (aKind > 0.5) { p.y += uAhora * ${PITCH}; em *= 1.0 - 0.6 * uTodo; }
            else { em *= uBloque * (0.3 + 0.7 * exp(-abs(uAhora - aDelay) / 18.0)); }
            fuente = 0.7;`,
          uniforms: { uAhora: { value: 0 }, uBloque: { value: 0 }, uTodo: { value: 0 } },
        }),
      );
      // The other stars' worldlines: columns far out, each a thin line (the block).
      const bw = materiaBuilder(6);
      for (let s = 0; s < 220; s++) {
        const a = bw.r() * Math.PI * 2;
        const r = 14 + bw.r() * 60;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        const c = new THREE.Color().setHSL(0.05 + bw.r() * 0.6, 0.5, 0.7);
        for (let i = 0; i < 160; i++) {
          const t = T0 * 1.6 + bw.r() * (T1 - T0) * 1.6;
          bw.push(x, t * PITCH, z, c, 0.05, 0.5);
        }
      }
      estrellas = add(materia(bw.data(), { pre: `uniform float uOn;`, move: `em *= uOn; fuente = 1.0;`, uniforms: { uOn: { value: 0 } } }));
    }

    // ================================================================ way 2: the slices
    const K = 260; // frames
    const DZ = 0.11;
    const POR_ANO = 24; // frames per year
    let cuadros: Nube | null = null;
    const tierraEn = (k: number, out = V()) => {
      const a = (k / POR_ANO) * Math.PI * 2;
      return out.set(Math.cos(a) * 0.8, Math.sin(a) * 0.8, -k * DZ);
    };
    if (estilo === 1) {
      const b = materiaBuilder(8);
      const fondo: [number, number, THREE.Color][] = [];
      for (let s = 0; s < 120; s++) fondo.push([(b.r() - 0.5) * 2.3, (b.r() - 0.5) * 2.3, new THREE.Color().setHSL(0.05 + b.r() * 0.6, 0.45, 0.75)]);
      const q = V();
      for (let k = 0; k < K; k++) {
        const z = -k * DZ;
        // The frame's edge.
        for (let i = 0; i < 360; i++) {
          const u = i / 90;
          const side = Math.floor(u);
          const f = u - side;
          const x = side === 0 ? -1.25 + 2.5 * f : side === 1 ? 1.25 : side === 2 ? 1.25 - 2.5 * f : -1.25;
          const y = side === 0 ? -1.25 : side === 1 ? -1.25 + 2.5 * f : side === 2 ? 1.25 : 1.25 - 2.5 * f;
          b.push(x, y, z, new THREE.Color(0.75, 0.65, 1.0), 0.012, 0.6, { delay: k, kind: 0 });
        }
        // The orbit, faint.
        for (let i = 0; i < 120; i++) {
          const a = (i / 120) * Math.PI * 2;
          b.push(Math.cos(a) * 0.8, Math.sin(a) * 0.8, z, new THREE.Color(0.5, 0.55, 0.9), 0.008, 0.3, { delay: k, kind: 1 });
        }
        // The Sun.
        for (let i = 0; i < 40; i++) {
          const [x, y] = b.onSphere();
          b.push(x * 0.07, y * 0.07, z, SOL, 0.03, 1.4, { delay: k, kind: 2 });
        }
        // The Earth.
        tierraEn(k, q);
        b.push(q.x, q.y, z, AZUL, 0.06, 2.2, { delay: k, kind: 3 });
        // The stars, fixed: in the block they become lines.
        for (const [x, y, c] of fondo) b.push(x, y, z, c, 0.014, 0.9, { delay: k, kind: 4 });
      }
      cuadros = add(
        materia(b.data(), {
          pre: /* glsl */ `uniform float uCuadro, uBloque, uCorte, uLado;`,
          move: /* glsl */ `
            float d = aDelay - uCuadro;
            float now = exp(-d * d / 0.18);
            // Ahead of the camera: the next pages, faint (only their edges), until the block shows all.
            float ahead = step(0.0, d) * exp(-d / 7.0) * 0.35 * (1.0 - uLado);
            float base = aKind < 0.5 ? 0.1 : aKind < 1.5 ? 0.05 : aKind < 2.5 ? 0.22 : aKind < 3.5 ? 1.0 : 0.45;
            float frameBoost = aKind < 0.5 ? 1.0 : 0.0;
            float vis = max(now, max(ahead * (frameBoost + 0.25), uBloque * base));
            em *= vis;
            fuente = 0.7;`,
          uniforms: { uCuadro: { value: 0 }, uBloque: { value: 0 }, uCorte: { value: 0 }, uLado: { value: 0 } },
        }),
      );
    }

    let ahoras: Nube | null = null;
    if (estilo === 1) {
      const b = materiaBuilder(9);
      for (const kind of [0, 1])
        for (let i = 0; i < 64; i++)
          for (let j = 0; j < 64; j++) {
            const x = -1.25 + (2.5 * (i + 0.5)) / 64;
            const y = -1.25 + (2.5 * (j + 0.5)) / 64;
            b.push(x, y, 0, kind ? new THREE.Color(0.8, 0.68, 1.0) : TU, 0.016, 0.55, { kind });
          }
      ahoras = add(
        materia(b.data(), {
          pre: /* glsl */ `uniform float uZ0, uPend, uMio, uOtro;`,
          move: /* glsl */ `
            p.z = uZ0 + (aKind > 0.5 ? uPend * p.y : 0.0);
            em *= aKind > 0.5 ? uOtro : uMio;
            fuente = 1.0;`,
          uniforms: { uZ0: { value: 0 }, uPend: { value: 0 }, uMio: { value: 0 }, uOtro: { value: 0 } },
        }),
      );
    }

    const cuentaDe = (p: number): Cuenta => {
      if (estilo === 0) {
        const vida = tl.get('vida', p);
        const todo = tl.get('todo', p);
        if (todo > 0.02) {
          const h = lerp(slog(80), h10(52.7), ease(0, 1, todo));
          return { pisos: deH(h), linea: todo > 0.98 ? 'instantes de tu vida · todos a la vez' : 'instantes', h };
        }
        if (vida > 0.02) return { pisos: ['80'], linea: 'vueltas al Sol · tu vida', h: slog(80) };
        const b = tl.get('bloque', p);
        const n = 1 + Math.round(b * 219);
        return { pisos: [String(n)], linea: n === 1 ? 'un ahora' : 'vueltas al Sol a la vista', h: slog(n) };
      }
      const k = tl.get('k', p);
      const lado = tl.get('lado', p);
      if (lado > 0.3) {
        const h = lerp(slog(K), h10(52.7), ease(0.3, 1, lado));
        return { pisos: deH(h), linea: lado > 0.98 ? 'instantes de una vida · todos ahí' : 'instantes', h };
      }
      const n = 1 + Math.floor(k);
      return { pisos: [String(n)], linea: n === 1 ? 'un instante' : 'instantes recorridos', h: slog(n) };
    };

    const tmp = V();
    return {
      tl,
      cuenta: cuentaDe,
      rotulo(p): Rotulo | null {
        const c = tl.captionAt(p);
        return c ? { capitulo: CAP, name: c.name, fact: c.fact } : null;
      },
      update(f: Frame) {
        const p = f.p;
        camera.near = 1e-3;
        camera.far = 1e5;
        if (estilo === 0 && helice && tierra && solCol && estrellas) {
          const ahora = tl.get('ahora', p);
          const bq = tl.get('bloque', p);
          const vida = tl.get('vida', p);
          const todo = tl.get('todo', p);
          const lejos = tl.get('lejos', p);
          const ride = tl.get('ride', p);
          helice.u.uAhora.value = ahora;
          helice.u.uBloque.value = bq;
          helice.u.uVida.value = vida;
          helice.u.uTodo.value = todo;
          solCol.u.uAhora.value = ahora;
          solCol.u.uBloque.value = bq;
          solCol.u.uTodo.value = todo;
          estrellas.u.uOn.value = ease(0.6, 1, lejos) * 1.6;
          tierra.points.position.copy(hel(ahora));
          tierra.u.uGain.value = 1 - todo;
          // Camera: near the orbit, then out to the side as time unfolds; riding along your life; out to the block.
          camera.fov = 42;
          const a = 0.5 + f.time * 0.01;
          const cerca = V(Math.sin(a) * 3.4, ahora * PITCH + 1.6, Math.cos(a) * 3.4);
          const centroVida = V(0, ((NACE + MUERE) / 2) * PITCH, 0);
          const lado = V(Math.sin(a + 0.9) * 26, centroVida.y + 3, Math.cos(a + 0.9) * 26);
          // Riding: from your birth to your death, outside the spring, looking along it.
          const tRide = lerp(NACE, MUERE, ease(0, 1, Math.min(ride, 1)));
          const q = hel(tRide);
          const rideCam = V(q.x * 2.6, q.y - 2.2, q.z * 2.6);
          const rideLook = V(0, q.y + 3.5, 0);
          const lejosCam = V(Math.sin(a + 0.9) * 58, centroVida.y + 8, Math.cos(a + 0.9) * 58);
          let pos = cerca.clone().lerp(lado, ease(0, 0.4, lejos));
          let look = V(0, ahora * PITCH, 0).lerp(centroVida, ease(0, 0.4, lejos));
          const rk = ease(0, 0.25, ride) * (1 - ease(1.0, 1.25, ride));
          pos.lerp(rideCam, rk);
          look.lerp(rideLook, rk);
          const lk = ease(0.5, 1, lejos);
          pos = pos.lerp(lejosCam, lk);
          look = look.lerp(centroVida, lk);
          mirar(camera, pos, look);
          for (const n of nubes) enfocar(n, f.focal, f.dpr, f.time);
        } else if (estilo === 1 && cuadros) {
          const k = tl.get('k', p);
          const lado = tl.get('lado', p);
          cuadros.u.uCuadro.value = k;
          cuadros.u.uBloque.value = tl.get('bloque', p);
          cuadros.u.uCorte.value = tl.get('corte', p);
          cuadros.u.uLado.value = lado;
          if (ahoras) {
            const c = tl.get('corte', p);
            ahoras.u.uZ0.value = -(K * DZ) / 2;
            ahoras.u.uMio.value = ease(0, 0.5, c);
            ahoras.u.uOtro.value = ease(0.3, 0.8, c);
            ahoras.u.uPend.value = 2.4 * ease(0.3, 1.0, c) * (c > 1 ? 1 + 0.5 * Math.sin((c - 1) * Math.PI) : 1);
          }
          camera.fov = 46;
          // Flying through the pages (looking down the time axis), then round to the side of the block.
          const zNow = -k * DZ;
          const frente = V(0.15, 0.1, zNow + 2.9);
          const mid = -(K * DZ) / 2;
          const a = lerp(0, 1.25, ease(0, 1, lado));
          const R = logLerp(2.9, 17, ease(0, 1, lado));
          const centro = V(0, 0, lerp(zNow, mid, ease(0, 1, lado)));
          const pos = lado < 1e-4 ? frente : centro.clone().add(V(Math.sin(a) * R, 0.35 * R * Math.sin(a), Math.cos(a) * R));
          mirar(camera, pos, lado < 1e-4 ? V(0, 0, zNow - 1) : centro);
          enfocar(cuadros, f.focal, f.dpr, f.time);
        }
      },
      placa(g, f) {
        const u = f.u;
        if (estilo === 0) {
          const v = ease(tl.at('vida') + 0.4, tl.at('vida') + 1.0, f.p) * (1 - ease(tl.at('todo') + 0.4, tl.at('todo') + 1.2, f.p));
          if (v > 0.01) {
            for (const [t, label] of [[NACE, 'naces'], [MUERE, 'mueres']] as const) {
              const s = proyectar(hel(t, tmp), camera, f.W, f.H);
              if (s.z < 1) texto(g, u, s.x + 16 * u, s.y, label, '#73ffd9', v, 11);
            }
          }
          const n = ease(0.3, 1.0, f.p) * (1 - ease(tl.at('direccion') + 1.5, tl.at('direccion') + 2.3, f.p));
          if (n > 0.01) {
            const s = proyectar(hel(tl.get('ahora', f.p), tmp), camera, f.W, f.H);
            if (s.z < 1) texto(g, u, s.x + 14 * u, s.y - 14 * u, 'ahora', ink(0.85), n, 11);
          }
        } else {
          const n = ease(0.3, 1.0, f.p) * (1 - ease(tl.at('paginas') + 0.6, tl.at('paginas') + 1.3, f.p));
          if (n > 0.01) {
            const s = proyectar(tierraEn(tl.get('k', f.p), tmp), camera, f.W, f.H);
            if (s.z < 1) texto(g, u, s.x + 14 * u, s.y - 14 * u, 'la Tierra · ahora', ink(0.85), n, 11);
          }
          const c = ease(tl.at('otro') + 0.8, tl.at('otro') + 1.4, f.p);
          texto(g, u, f.W / 2, f.H * 0.12, 'verde: tu ahora · violeta: el de alguien que se mueve', '#cbb6ff', c, 11, 'center');
        }
      },
      dispose() {},
    };
  },
};
