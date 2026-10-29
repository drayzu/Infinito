import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder, type MateriaData, type Nube } from '../src/engine/materia';
import { lerp } from '../src/engine/math';
import { deH, h10, h1010, ink, texto, type Cuenta, type Rotulo } from './placa';
import { ease, logLerp, mapaTierra, mirar, tierraDatos, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * Study · act VI, «¿Eres real?», the other two questions beside the simulation.
 *
 * 1 · Cerebro de Boltzmann: the cold end, a near-empty vacuum where a few particles wander. Given
 *     endless time, chance arranges them every way, and sooner or later into a brain with the
 *     memories of a life it never lived; it thinks for an instant and comes apart. One brain is far
 *     likelier than a whole universe, so if the future is endless there would be more such brains
 *     than people like you (the «Boltzmann brain» problem; ~10^10^50 years, an estimate to check).
 * 2 · Holograma: everything inside a region is information, and all of it fits on the surface
 *     round it, a bit per patch of area (Bekenstein, Hawking, 't Hooft, Susskind). The Earth, crust,
 *     mantle and core, flows out onto a sphere of bits; seen up close the sphere is a flat grid;
 *     turning round, the Earth forms again from it: maybe what is inside is the projection. The
 *     observable universe: some 10¹²² bits on its horizon.
 */

const CAP = 'VI · ¿Eres real?';

/** A brain as points: two folded hemispheres, the cerebellum, the stem. Front is +z, up +y. */
function cerebro(seed: number, n: number): MateriaData {
  const b = materiaBuilder(seed);
  const r = b.r;
  const pliegue = (x: number, y: number, z: number) =>
    Math.abs(Math.sin(9 * y + 3 * Math.sin(6 * z + 1.3))) * 0.5 + Math.abs(Math.sin(8 * z + 2.6 * Math.sin(7 * x + 0.4))) * 0.5;
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const t = r();
    let p: THREE.Vector3;
    let hondo = 0;
    if (t < 0.84) {
      const lado = r() < 0.5 ? -1 : 1;
      const [x, y, z] = b.onSphere();
      // The inner face of each hemisphere is flat, against the other.
      const ux = lado * x < 0 ? x * 0.25 : x;
      const f = pliegue(ux, y, z);
      hondo = 1 - f;
      const k = 1 + 0.07 * (f - 0.5);
      p = V(lado * 0.36 + ux * 0.6 * k, 0.05 + y * 0.66 * k, z * 0.92 * k);
      if (p.y < -0.35) p.y = -0.35 + (p.y + 0.35) * 0.4;
    } else if (t < 0.96) {
      const [x, y, z] = b.onSphere();
      hondo = Math.abs(Math.sin(38 * y));
      p = V(x * 0.48, -0.42 + y * 0.2 * (1 - 0.15 * hondo), -0.55 + z * 0.3);
    } else {
      const a = r() * Math.PI * 2;
      const h = r();
      p = V(Math.cos(a) * 0.1, -0.45 - h * 0.6, -0.25 + Math.sin(a) * 0.1 - h * 0.1);
    }
    c.setRGB(0.95, 0.72, 0.9).multiplyScalar(0.55 + 0.45 * (1 - hondo));
    // Where it comes from: anywhere in the cold vacuum.
    const [fx, fy, fz] = b.onSphere();
    const q = 3 + r() * 9;
    b.push(p.x, p.y, p.z, c, 0.009, 0.5, { from: [fx * q, fy * q, fz * q], delay: r() });
  }
  return b.data();
}

export const boltzmann: Escena = {
  id: 'real',
  nombre: 'Boltzmann y holograma',
  estilos: [
    { key: '1', nombre: 'Cerebro de Boltzmann', nota: 'En el vacío frío del final, el azar junta unas partículas en un cerebro con recuerdos de una vida que nunca vivió; piensa un instante y se deshace.' },
    { key: '2', nombre: 'Holograma', nota: 'La Tierra entera, de la corteza al núcleo, se escribe en una esfera de bits que la rodea; y desde esa esfera se vuelve a formar.' },
  ],
  montar(stage, estilo): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.5;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = estilo === 1 ? 0.55 : 0.4;
    const tl = new Timeline();
    const nubes: Nube[] = [];
    const add = (n: Nube) => {
      n.u.uSpread.value = 0;
      root.add(n.points);
      nubes.push(n);
      return n;
    };
    let listo: Promise<unknown> = Promise.resolve();

    // ================================================================ way 1: a brain from nothing
    let brain: Nube | null = null;
    let vacio: Nube | null = null;
    const otros: { points: THREE.Points; u: Nube['u']; fase: number }[] = [];
    if (estilo === 0) {
      tl.set({ espera: 0, arma: 0, piensa: 0, cuenta: 0, az: 0, cerca: 0, muchos: 0 });
      tl.label('frio').caption(3.0, 'El final frío', 'Dentro de muchísimo tiempo, el universo será un vacío casi vacío y frío, con unas pocas partículas que vagan al azar.');
      tl.to(3.0, { espera: 0.3, az: 0.3 });
      tl.label('azar').caption(3.0, 'El azar', 'Pero si el tiempo no se acaba, el azar las junta de todas las maneras posibles. Casi siempre, en nada.');
      tl.to(3.0, { espera: 1, az: 0.6, cerca: 0.4 });
      tl.label('cerebro').caption(3.6, 'Un cerebro de la nada', 'Tarde o temprano se arma un cerebro, con recuerdos de una vida que nunca vivió. Piensa un instante y se deshace.');
      tl.to(1.4, { arma: 1, az: 0.8, cerca: 1 });
      tl.to(1.2, { piensa: 1, az: 0.95 });
      tl.to(1.0, { arma: 0, piensa: 1.2, az: 1.05 });
      tl.label('tu').caption(3.6, '¿Y tú?', 'Armar un cerebro solo es mucho más fácil que armar un universo entero. Si el futuro no tiene fin, habría más cerebros así que personas como tú. ¿Cómo sabes cuál eres?');
      tl.to(1.2, { arma: 1, piensa: 1.3, cuenta: 1 });
      tl.to(2.4, { piensa: 2, az: 1.3, cuenta: 1, muchos: 1, cerca: 0.3 });

      brain = add(
        materia(cerebro(1896, 42000), {
          pre: /* glsl */ `uniform float uArma, uPiensa;`,
          move: /* glsl */ `
            // Drifting while scattered; still once it is a brain.
            float k2 = clamp(uArma * 1.6 - aDelay * 0.6, 0.0, 1.0);
            k2 = k2 * k2 * (3.0 - 2.0 * k2);
            vec3 deriva = vec3(sin(uTime * 0.07 + seed * 40.0), cos(uTime * 0.05 + seed * 23.0), sin(uTime * 0.06 + seed * 17.0)) * 0.6;
            p = mix(aFrom + deriva, position, k2);
            // Thought: waves of light that run through it while it is whole.
            float w = fract(uPiensa * 1.7 + dot(position, vec3(0.3, 0.5, 0.8)) * 0.6);
            float xw = (w - 0.5) / 0.035;
            float chispa = exp(-xw * xw) * smoothstep(0.85, 1.0, k2) * step(0.01, uPiensa);
            em *= mix(0.25, 1.0, k2);
            em += vec3(0.75, 0.85, 1.0) * chispa * 2.2;
            sz *= mix(0.7, 1.0, k2);
            fuente = mix(0.9, 0.5, k2);`,
          uniforms: { uArma: { value: 0 }, uPiensa: { value: 0 } },
        }),
      );
      // The rest of the cold vacuum: a few particles wandering.
      const vb = materiaBuilder(31);
      for (let i = 0; i < 12000; i++) {
        const [x, y, z] = vb.onSphere();
        const q = 2 + vb.r() * 20;
        vb.push(x * q, y * q, z * q, new THREE.Color(0.55, 0.6, 0.85), 0.03, 0.6);
      }
      vacio = add(
        materia(vb.data(), {
          pre: /* glsl */ `uniform float uEspera;`,
          move: /* glsl */ `
            // The ages go by faster and faster: the wander quickens; now and then two meet and flare.
            float tt = uTime * (0.05 + 1.4 * uEspera) + uEspera * 40.0;
            p += vec3(sin(tt + seed * 40.0), cos(tt * 0.8 + seed * 23.0), sin(tt * 0.9 + seed * 17.0)) * (0.8 + 1.5 * uEspera);
            float fl = step(0.996, fract(sin(seed * 311.7 + floor(uTime * 3.0 + uEspera * 30.0)) * 43758.5));
            em *= 1.0 + 6.0 * fl * uEspera;
            fuente = 0.9;`,
          uniforms: { uEspera: { value: 0 } },
        }),
      );
      // «¿Y tú?»: far off, other brains come and go.
      const mat = brain.points.material as THREE.ShaderMaterial;
      const rb = materiaBuilder(41);
      for (let i = 0; i < 14; i++) {
        const m = mat.clone();
        const pts = new THREE.Points(brain.points.geometry, m);
        pts.frustumCulled = false;
        const [x, y, z] = rb.onSphere();
        pts.position.set(x, y * 0.5, z).multiplyScalar(6 + rb.r() * 10);
        pts.rotation.set(rb.r() * 6, rb.r() * 6, rb.r() * 6);
        root.add(pts);
        otros.push({ points: pts, u: m.uniforms as Nube['u'], fase: rb.r() });
      }
    }

    // ================================================================ way 2: the hologram
    let tierra: Nube | null = null;
    let borde: Nube | null = null;
    const RB = 2.6;
    if (estilo === 1) {
      tl.set({ proy: 0, cerca: 0, az: 0, cuenta: 0, lejos: 0 });
      tl.label('volumen').caption(2.8, 'Un volumen', 'Todo lo que hay dentro de una región, cada átomo de la Tierra, de la corteza al núcleo, es información.');
      tl.to(2.8, { az: 0.4 });
      tl.label('borde').caption(3.4, 'Escrito en el borde', 'Y toda esa información cabe en la superficie que la rodea, un bit por cada pedacito de área. Así lo enseñan los agujeros negros.');
      tl.to(3.4, { proy: 1, az: 0.8, cuenta: 1 });
      tl.label('proyeccion').caption(3.6, 'Una proyección', 'Quizá lo real es el borde, y lo de adentro, tú incluido, es su proyección: un holograma.');
      tl.to(1.4, { cerca: 1, az: 0.95 });
      tl.to(2.2, { proy: 0, cerca: 0.3, az: 1.1 });
      tl.label('universo').caption(3.2, 'Los bits del universo', 'Todo el universo observable cabría en unos 10¹²² bits escritos en su horizonte.');
      tl.to(3.2, { lejos: 1, cuenta: 2, az: 1.3 });

      listo = mapaTierra().then((img) => {
        // The Earth as a solid ball: its surface (the map) and inside it the mantle and the core.
        const s = tierraDatos(img, 40000, 21);
        const b = materiaBuilder(22);
        const n0 = s.position.length / 3;
        for (let i = 0; i < n0; i++) {
          const c = new THREE.Color(s.color[i * 3], s.color[i * 3 + 1], s.color[i * 3 + 2]);
          b.push(s.position[i * 3], s.position[i * 3 + 1], s.position[i * 3 + 2], c, s.size[i], 0.5, { delay: 0 });
        }
        for (let i = 0; i < 26000; i++) {
          const [x, y, z] = b.onSphere();
          const q = Math.cbrt(b.r()) * 0.97;
          const c = q < 0.35 ? new THREE.Color(1, 0.9, 0.55) : q < 0.55 ? new THREE.Color(1, 0.6, 0.25) : new THREE.Color(0.85, 0.3, 0.15);
          b.push(x * q, y * q, z * q, c, 0.02, 0.5, { delay: 1 - q });
        }
        tierra = add(
          materia(b.data(), {
            pre: /* glsl */ `uniform float uProy, uR;`,
            move: /* glsl */ `
              // Out along its own direction to the sphere of bits (the outside first, the core last).
              float kp = clamp(uProy * 1.7 - aDelay * 0.7, 0.0, 1.0);
              kp = kp * kp * (3.0 - 2.0 * kp);
              float r0 = length(position);
              vec3 dir = position / max(r0, 1e-4);
              p = dir * mix(r0, uR, kp);
              float on = step(0.5, fract(sin(seed * 913.1 + floor(uTime * 4.0 + seed * 9.0)) * 43758.5));
              vec3 bit = mix(vec3(0.45, 0.35, 0.9) * 0.25, vec3(0.9, 0.85, 1.0) * 0.9, on);
              em = mix(em, mix(em, bit, aDelay > 0.0 ? 0.9 : 0.3), smoothstep(0.85, 1.0, kp));
              // The mantle and core are hidden by the crust until they leave it.
              em *= mix(aDelay > 0.0 ? 0.0 : 1.0, 1.0, smoothstep(0.0, 0.15, kp));
              fuente = 0.5;`,
            uniforms: { uProy: { value: 0 }, uR: { value: RB } },
          }),
        );
      });
      const bb = materiaBuilder(23);
      const N = 30000;
      for (let i = 0; i < N; i++) {
        const y = 1 - ((i + 0.5) / N) * 2;
        const q = Math.sqrt(1 - y * y);
        const a = i * 2.39996;
        bb.push(Math.cos(a) * q * RB, y * RB, Math.sin(a) * q * RB, new THREE.Color(0.6, 0.5, 1.0), 0.018, 0.3);
      }
      borde = add(
        materia(bb.data(), {
          pre: /* glsl */ `uniform float uOn;`,
          move: /* glsl */ `
            float on = step(0.6, fract(sin(seed * 517.3 + floor(uTime * 3.0 + seed * 7.0)) * 43758.5));
            em *= uOn * (0.3 + 0.9 * on);
            fuente = 0.8;`,
          uniforms: { uOn: { value: 0.4 } },
        }),
      );
    }

    const cuentaDe = (p: number): Cuenta => {
      const c = tl.get('cuenta', p);
      if (estilo === 0) {
        if (c > 0.01) return { pisos: ['10', '10', '50'], linea: 'años de espera por un cerebro así · estimación', h: h1010(50) };
        const e = tl.get('espera', p);
        const h = lerp(h10(100), h1010(50), ease(0, 1, e));
        return { pisos: deH(h), linea: e < 0.05 ? 'años desde hoy · los agujeros negros ya se evaporaron' : 'años de espera', h };
      }
      if (c < 0.01) return { pisos: ['10', '50'], linea: 'átomos de la Tierra', h: h10(50) };
      if (c <= 1) return { pisos: ['10', '84'], linea: 'bits que caben en la esfera que la rodea · como máximo', h: h10(84) };
      const h = lerp(h10(84), h10(122), ease(1, 2, c));
      return { pisos: deH(h), linea: 'bits en el horizonte del universo observable', h };
    };

    return {
      tl,
      listo,
      cuenta: cuentaDe,
      rotulo(p): Rotulo | null {
        const c = tl.captionAt(p);
        return c ? { capitulo: CAP, name: c.name, fact: c.fact } : null;
      },
      update(f: Frame) {
        const p = f.p;
        camera.near = 1e-3;
        camera.far = 1e4;
        camera.fov = 44;
        const a = tl.get('az', p) + f.time * 0.01;
        if (brain && vacio) {
          brain.u.uArma.value = tl.get('arma', p);
          brain.u.uPiensa.value = tl.get('piensa', p);
          vacio.u.uEspera.value = tl.get('espera', p);
          const muchos = tl.get('muchos', p);
          for (const o of otros) {
            // Each its own cycle: it forms, thinks, comes apart.
            const ciclo = (f.time * 0.12 + o.fase) % 1;
            o.u.uArma.value = muchos * Math.sin(Math.PI * Math.min(1, ciclo * 1.4)) ** 2;
            o.u.uPiensa.value = f.time * 0.3 + o.fase * 3;
            o.u.uFocal.value = f.focal;
            o.u.uMinPx.value = 1.6 * f.dpr;
            o.u.uMaxPx.value = 24 * f.dpr;
            o.u.uTime.value = f.time;
            o.points.visible = muchos > 0.01;
          }
          const d = logLerp(14, 2.8, ease(0, 1, tl.get('cerca', p)));
          mirar(camera, V(Math.sin(a + 0.6) * d, d * 0.18, Math.cos(a + 0.6) * d), V(0, 0, 0));
        } else if (estilo === 1) {
          const t = tierra;
          if (t) {
            t.u.uProy.value = tl.get('proy', p);
            t.points.rotation.set(0.3, -0.34 + f.time * 0.02, 0);
          }
          if (borde) borde.u.uOn.value = 0.4 + 0.6 * tl.get('proy', p);
          // Up close to the sphere (it reads as a flat grid of bits), then out past the universe.
          const cerca = tl.get('cerca', p);
          const lejos = tl.get('lejos', p);
          const d = lerp(lerp(6.4, RB + 0.35, ease(0, 1, cerca)), 26, ease(0, 1, lejos));
          const dir = V(Math.sin(a), 0.25, Math.cos(a)).normalize();
          const pos = dir.clone().multiplyScalar(d);
          // Near the sphere, look along it (its curve flattens into a horizon of bits), then back in at the Earth.
          const tan = V(0, 1, 0).cross(dir).normalize();
          const rasante = pos.clone().addScaledVector(tan, 2).addScaledVector(dir, -0.45);
          mirar(camera, pos, V(0, 0, 0).lerp(rasante, ease(0.4, 1, cerca)));
        }
        for (const n of nubes) enfocar(n, f.focal, f.dpr, f.time);
      },
      placa(g, f) {
        if (estilo === 1) {
          const v = ease(tl.at('proyeccion') + 0.8, tl.at('proyeccion') + 1.4, f.p) * (1 - ease(tl.at('proyeccion') + 2.0, tl.at('proyeccion') + 2.6, f.p));
          texto(g, f.u, f.W / 2, f.H * 0.14, 'de cerca, el borde es una superficie plana de bits', ink(0.8), v, 11, 'center');
        }
      },
      dispose() {},
    };
  },
};
