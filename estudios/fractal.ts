import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder } from '../src/engine/materia';
import { deH, h10, slog, type Cuenta, type Rotulo } from './placa';
import { ease, logLerp, mirar, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * Study · the fractal, as a flash: «la matemática como lugar». A one-line rule (z → z² + c) holds
 * detail without end. A grid of points in front of the camera; each computes, in its vertex
 * shader, how fast its c escapes, and glows by it (violet to white to gold); the set itself is
 * black. The dive goes into Seahorse Valley down to ~10⁻⁵ (single-precision floats hold to there;
 * deeper needs perturbation, see the plan). Espacio already shows the Mandelbrot from afar, as a
 * panel on a sheet; here it would be a short dive, inside.
 */

const CAP = 'La matemática como lugar';
const GX = 640;
const GY = 360;
const CENTRO = new THREE.Vector2(-0.743643887, 0.131825904);

export const fractal: Escena = {
  id: 'fractal',
  nombre: 'El fractal',
  estilos: [{ key: '1', nombre: 'Destello', nota: 'Un buceo corto en el conjunto de Mandelbrot hecho de puntos: una regla de una línea con detalle sin fin.' }],
  montar(stage): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.5;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = 0.45;
    const tl = new Timeline();
    tl.set({ z: 0, az: 0 });
    tl.label('regla').caption(3.0, 'Una regla de una línea', '¿Y si al fondo de todo solo hay matemática? Esta forma sale de una sola regla: multiplicar un número por sí mismo y sumarle otro, una y otra vez.');
    tl.to(3.0, { z: 0.15 });
    tl.label('fondo').caption(4.0, 'Sin fondo', 'Y por más que te acerques, el detalle no se acaba. Nadie lo inventó: estaba ahí.');
    tl.to(4.0, { z: 1 }, (t) => t * t * (3 - 2 * t));

    // The grid: a sheet of points that fills the view, a little jittered (no moiré).
    const b = materiaBuilder(5);
    for (let j = 0; j < GY; j++)
      for (let i = 0; i < GX; i++) {
        const x = ((i + 0.5 + (b.r() - 0.5) * 0.3) / GX - 0.5) * 2 * (16 / 9);
        const y = ((j + 0.5 + (b.r() - 0.5) * 0.3) / GY - 0.5) * 2;
        b.push(x, y, 0, new THREE.Color(1, 1, 1), 2.2 / GY, 1);
      }
    const hoja = materia(b.data(), {
      pre: /* glsl */ `uniform vec2 uCentro; uniform float uEscala;`,
      move: /* glsl */ `
        vec2 c = uCentro + position.xy * uEscala;
        vec2 zz = vec2(0.0);
        float it = 0.0;
        float esc = 0.0;
        for (int i = 0; i < 400; i++) {
          zz = vec2(zz.x * zz.x - zz.y * zz.y, 2.0 * zz.x * zz.y) + c;
          float m2 = dot(zz, zz);
          if (m2 > 256.0) { esc = 1.0; break; }
          it += 1.0;
        }
        // Smooth escape count; inside the set, dark.
        float mu = it + 1.0 - log(log(max(dot(zz, zz), 1.0001)) * 0.5) / log(2.0);
        // Bands of colour along the escape count, with dark between them (deep in, everything escapes
        // slowly, and without the dark bands it all washes to grey).
        float t = fract(mu * 0.022 + 0.55);
        vec3 col = mix(vec3(0.35, 0.22, 0.85), vec3(0.95, 0.9, 1.0), smoothstep(0.0, 0.5, t));
        col = mix(col, vec3(1.0, 0.75, 0.35), smoothstep(0.5, 1.0, t));
        float banda = sin(3.14159 * fract(mu * 0.06));
        em = col * esc * 0.6 * (0.12 + 0.88 * banda * banda);
        fuente = 1.0;`,
      uniforms: { uCentro: { value: CENTRO.clone() }, uEscala: { value: 1.2 } },
    });
    hoja.u.uSpread.value = 0;
    root.add(hoja.points);

    const escala = (p: number) => logLerp(1.25, 1.6e-5, ease(0, 1, tl.get('z', p)));
    const cuentaDe = (p: number): Cuenta => {
      const aum = 1.25 / escala(p);
      if (p > tl.length - 0.6) return { pisos: ['∞'], linea: 'aumentos · el detalle no se acaba', h: 5.75 };
      return { pisos: deH(aum < 10 ? slog(aum) : h10(Math.log10(aum))), linea: 'aumentos', h: aum < 10 ? slog(aum) : h10(Math.log10(aum)) };
    };

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
        camera.far = 100;
        camera.fov = 46;
        const s = escala(p);
        // From the whole set (centred on it) into Seahorse Valley.
        const k = ease(0, 0.4, tl.get('z', p));
        (hoja.u.uCentro.value as THREE.Vector2).set(-0.6, 0).lerp(CENTRO, k);
        hoja.u.uEscala.value = s;
        const a = Math.sin(f.time * 0.05) * 0.03;
        mirar(camera, V(Math.sin(a) * 2.42, 0, Math.cos(a) * 2.42), V(0, 0, 0));
        enfocar(hoja, f.focal, f.dpr, f.time);
      },
      dispose() {},
    };
  },
};
