import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder, type Nube } from '../src/engine/materia';
import { lerp } from '../src/engine/math';
import { FONT, ink, slog, type Cuenta, type Rotulo } from './placa';
import { ease, logLerp, mirar, TU, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * Study · the end of Infinito (and of the series), three ways for Diego to choose by looking.
 * All three start from «Todo lo que hay»: the doubles, the branches, the other universes, the ones
 * inside black holes, the simulations, as a field of light without end (teal: every «you»).
 *
 * 1 · El punto: everything falls into one point of light; the camera dives into it and finds the
 *     foam of space, where Espacio begins. «Todo, desde aquí.» The series closes in a circle.
 * 2 · Tú: everything fades but the teal points, every «you»; then all but one. Of all the
 *     infinities, one point is looking at this. «Todo, desde aquí.»
 * 3 · La nada: everything comes apart, the count falls to zero, black. «¿Por qué hay algo en vez de
 *     nada?» In the black, one point flickers into being, then a few.
 * 4 · Elegida (Diego, 28 Oct 2026: «mezclar el 3 y el 2… para que no se sienta sin propósito, hablar
 *     del tú»): the nothing (3); from it, something; from that something, every «you» comes back
 *     (the teal points); and of all of them, one is looking: you (2).
 */

const CAP = 'Final';

export const final: Escena = {
  id: 'final',
  nombre: 'El final',
  estilos: [
    { key: '1', nombre: 'El punto', nota: 'Todo cae en un punto de luz; adentro, la espuma del espacio con que empieza Espacio. La serie se cierra en círculo.' },
    { key: '2', nombre: 'Tú', nota: 'Todo se apaga menos los puntos verdes, cada tú; y luego todos menos uno: el que está mirando esto.' },
    { key: '3', nombre: 'La nada', nota: 'Todo se deshace, la cuenta cae a cero. ¿Por qué hay algo en vez de nada? En lo negro, un punto aparece.' },
    { key: '4', nombre: 'Elegida', nota: 'La que eligió Diego: la nada (3); de ella, algo; de ese algo, todos tus tú; y de todos, uno solo mira: tú (2).' },
  ],
  montar(stage, estilo, viaje = false): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.55;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = 0.4;
    const tl = new Timeline();
    const nubes: Nube[] = [];
    const add = (n: Nube) => {
      n.u.uSpread.value = 0;
      root.add(n.points);
      nubes.push(n);
      return n;
    };

    tl.set({ cae: 0, solo: 0, uno: 0, nada: 0, espuma: 0, chispa: 0, dentro: 0, texto: 0, az: 0, acerca: 0, renace: 0, vuelve: 0 });
    tl.label('todo').caption(viaje ? 3.8 : 3.2, 'Todo lo que hay', viaje ? 'Tus dobles, tus ramas, los otros universos, los que nacen en agujeros negros, los calculados. Infinitos, unos dentro de otros.' : 'Tus dobles, tus ramas, los otros universos, los que hay dentro de los agujeros negros, las simulaciones. Infinitos, unos dentro de otros.');
    tl.to(viaje ? 3.8 : 3.2, { az: 0.4 });
    if (estilo === 3 && viaje) {
      // GUION.md 41–46.
      tl.label('nada').caption(4.2, 'Nada', 'Ahora quítalo todo: el espacio, el tiempo, las leyes. Lo que queda no es un vacío. Es nada.');
      tl.to(3.0, { nada: 1, az: 0.6 });
      tl.wait(1.2);
      tl.label('algo').caption(3.6, '¿Por qué algo?', '¿Por qué hay algo en vez de nada? Nadie lo sabe. Pero hay algo.');
      tl.to(3.6, { chispa: 1 });
      tl.label('tus').caption(5.4, 'Los que miran', 'Y de ese algo salió todo. En algunos rincones, la materia se ordenó hasta poder mirar: tú, y quizá otros. En otro mundo, hecho de otra química. En una máquina que piensa. En algo que todavía no imaginamos.');
      tl.to(1.0, { chispa: 1.4 });
      tl.to(4.4, { renace: 1, vuelve: 1 });
      tl.label('mira').caption(3.4, 'El universo mirándose', 'Cada uno es una manera en que el universo se mira a sí mismo.');
      tl.wait(3.4);
      tl.label('uno').caption(3.8, 'Uno mira', 'Y de todos, uno solo está mirando esto, ahora: tú.');
      tl.to(1.6, { uno: 1 });
      tl.to(2.2, { acerca: 1 });
      tl.label('aqui').caption(4.0, 'Todo, desde aquí', '');
      tl.to(4.0, { texto: 1 });
    } else if (estilo === 0) {
      tl.label('cae').caption(3.0, 'Hacia un punto', 'Y todo eso, visto desde lo bastante lejos, cabe en un punto de luz.');
      tl.to(3.0, { cae: 1, az: 0.6 });
      tl.label('adentro').caption(3.2, 'El punto', 'Adentro del punto está la espuma del espacio, lo más pequeño que hay. Ahí empieza Espacio, la primera obra.');
      tl.to(1.6, { dentro: 1 });
      tl.to(1.6, { espuma: 1 });
      tl.label('aqui').caption(3.0, 'Todo, desde aquí', '');
      tl.to(3.0, { texto: 1 });
    } else if (estilo === 3) {
      tl.label('nada').caption(3.4, 'Nada', 'Ahora quita todo: los universos, el espacio, el tiempo, las leyes. Lo que queda no es un vacío. Es nada.');
      tl.to(3.4, { nada: 1, az: 0.6 });
      tl.label('algo').caption(3.4, '¿Por qué algo?', '¿Por qué hay algo en vez de nada? Nadie lo sabe. Pero hay algo.');
      tl.to(3.4, { chispa: 1 });
      tl.label('tus').caption(3.6, 'Todos tus tú', 'Y de ese algo salió todo: los universos, las ramas, las copias, los cerebros. Y en cada uno, alguien como tú.');
      tl.to(1.0, { chispa: 1.4 });
      tl.to(2.6, { renace: 1, vuelve: 1 });
      tl.label('uno').caption(3.6, 'Uno solo mira', 'De todos ellos, hay uno solo que está mirando esto, ahora. Tú.');
      tl.to(1.6, { uno: 1 });
      tl.to(2.0, { acerca: 1 });
      tl.label('aqui').caption(3.0, 'Todo, desde aquí', '');
      tl.to(3.0, { texto: 1 });
    } else if (estilo === 1) {
      tl.label('solo').caption(3.2, 'Todos tus tú', 'Apaga todo lo demás. Quedan los puntos verdes: cada copia, cada rama, cada cerebro, cada simulación de ti.');
      tl.to(3.2, { solo: 1, az: 0.6 });
      tl.label('uno').caption(3.4, 'Uno solo mira', 'Y de todos esos, hay uno solo que está mirando esto, ahora.');
      tl.to(1.6, { uno: 1 });
      tl.to(1.8, { acerca: 1 });
      tl.label('aqui').caption(3.0, 'Todo, desde aquí', '');
      tl.to(3.0, { texto: 1 });
    } else {
      tl.label('nada').caption(3.4, 'Nada', 'Ahora quita todo: los universos, el espacio, el tiempo, las leyes. Lo que queda no es un vacío. Es nada.');
      tl.to(3.4, { nada: 1, az: 0.6 });
      tl.label('algo').caption(3.6, '¿Por qué algo?', '¿Por qué hay algo en vez de nada? Nadie lo sabe.');
      tl.to(3.6, { chispa: 1 });
      tl.label('aqui').caption(3.0, 'Todo, desde aquí', '');
      tl.to(3.0, { texto: 1, chispa: 2 });
    }

    // ---- Everything: a field without end (white galaxies, violet bubbles, teal «you»s).
    const b = materiaBuilder(2026);
    let nTu = 0;
    for (let i = 0; i < 46000; i++) {
      const [x, y, z] = b.onSphere();
      const q = 1.5 + Math.pow(b.r(), 0.6) * 40;
      const t = b.r();
      let c: THREE.Color;
      let kind = 0;
      let s = 0.05;
      let l = 0.6;
      if (t < 0.09) {
        c = TU;
        kind = 1;
        s = 0.09;
        l = 1.3;
        nTu++;
      } else if (t < 0.4) c = new THREE.Color().setHSL(0.72 + (b.r() - 0.5) * 0.1, 0.6, 0.7);
      else c = new THREE.Color(1, 0.92, 0.78);
      b.push(x * q, y * q, z * q, c, s, l, { kind, delay: b.r() });
    }
    // Other minds (the journey's end): lights of other colours that come back with every «you».
    const OTRAS = [new THREE.Color(1, 0.78, 0.4), new THREE.Color(1, 0.5, 0.72), new THREE.Color(0.45, 0.78, 1), new THREE.Color(0.85, 0.75, 1)];
    if (viaje) {
      for (let i = 0; i < 1600; i++) {
        const [x, y, z] = b.onSphere();
        const q = 1.5 + Math.pow(b.r(), 0.6) * 40;
        b.push(x * q, y * q, z * q, OTRAS[i % OTRAS.length], 0.085, 1.2, { kind: 3, delay: b.r() });
      }
    }
    // The one that stays (way 2): a teal point close to the camera's way.
    const ELEGIDO = V(0.6, 0.25, 3.2);
    b.push(ELEGIDO.x, ELEGIDO.y, ELEGIDO.z, TU, 0.1, 1.6, { kind: 2, delay: 0 });
    const campo = add(
      materia(b.data(), {
        pre: /* glsl */ `uniform float uCae, uSolo, uUno, uNada, uDentro, uRenace;`,
        move: /* glsl */ `
          // Way 1: everything falls into one point, each in its own time.
          float kc = clamp(uCae * 1.6 - aDelay * 0.6, 0.0, 1.0);
          kc = kc * kc * (3.0 - 2.0 * kc);
          p *= mix(1.0, 0.0005, kc);
          em *= mix(1.0, step(0.995, fract(seed * 97.3)) * 1.5 + 0.004, kc);
          em *= 1.0 - uDentro;
          // Way 2: only the teal ones, then only one.
          float verde = aKind > 0.5 ? 1.0 : 0.0;
          em *= mix(1.0, verde, uSolo);
          em *= mix(1.0, (aKind > 1.5 && aKind < 2.5) ? 1.0 : 0.0, uUno);
          // Way 3: everything comes apart into nothing, each in its own time.
          float kn = clamp(uNada * 1.6 - aDelay * 0.6, 0.0, 1.0);
          // Way 4: out of the nothing, every «you» comes back (each in its own time).
          float verdeR = (aKind > 0.5 ? 1.0 : 0.0) * clamp(uRenace * 1.6 - aDelay * 0.6, 0.0, 1.0);
          em *= max(1.0 - kn, verdeR);
          p += normalize(p + 1e-4) * kn * 3.0 * (1.0 - verdeR);
          fuente = 0.7;`,
        uniforms: { uCae: { value: 0 }, uSolo: { value: 0 }, uUno: { value: 0 }, uNada: { value: 0 }, uDentro: { value: 0 }, uRenace: { value: 0 } },
      }),
    );

    // ---- Way 1: the foam inside the point (Espacio's first image: cells that boil).
    let espuma: Nube | null = null;
    if (estilo === 0) {
      const fb = materiaBuilder(7);
      for (let i = 0; i < 60000; i++) {
        const [x, y, z] = fb.onSphere();
        const q = Math.cbrt(fb.r()) * 3;
        fb.push(x * q, y * q, z * q, new THREE.Color().setHSL(0.68 + fb.r() * 0.1, 0.5, 0.75), 0.02, 0.6);
      }
      espuma = add(
        materia(fb.data(), {
          pre: /* glsl */ `uniform float uEspuma;`,
          move: /* glsl */ `
            // Each point bubbles in and out: the foam boils.
            float ph = fract(uTime * (0.4 + fract(seed * 7.1)) + seed * 13.0);
            float burbuja = sin(3.14159 * ph);
            p += normalize(p + 1e-4) * 0.08 * burbuja;
            em *= uEspuma * (0.2 + burbuja * burbuja);
            fuente = 0.8;`,
          uniforms: { uEspuma: { value: 0 } },
        }),
      );
    }

    // ---- Way 3: the first points out of nothing.
    let chispas: Nube | null = null;
    if (estilo === 2 || estilo === 3) {
      const cb = materiaBuilder(9);
      cb.push(0, 0, -2, new THREE.Color(1, 0.95, 0.9), 0.05, 2.5, { delay: 0 });
      for (let i = 0; i < 40; i++) {
        const [x, y, z] = cb.onSphere();
        const q = 0.3 + cb.r() * 2.4;
        cb.push(x * q, y * q, -2 + z * q, new THREE.Color().setHSL(cb.r(), 0.4, 0.8), 0.03, 1.4, { delay: 0.2 + cb.r() * 0.8 });
      }
      chispas = add(
        materia(cb.data(), {
          pre: /* glsl */ `uniform float uChispa;`,
          move: /* glsl */ `
            float on = smoothstep(aDelay, aDelay + 0.08, uChispa);
            float flick = 0.6 + 0.4 * step(0.4, fract(sin(seed * 91.7 + floor(uTime * 6.0)) * 437.5));
            em *= on * mix(flick, 1.0, smoothstep(1.2, 1.8, uChispa));
            fuente = 1.0;`,
          uniforms: { uChispa: { value: 0 } },
        }),
      );
    }

    const cuentaDe = (p: number): Cuenta => {
      if (p < tl.at('todo') + 3.2) return { pisos: ['2', 'ℵ₀'], linea: 'cuántos: más que cualquier número', h: 6.3 };
      if (estilo === 0) {
        if (p >= tl.at('adentro') + 1.2) return { pisos: ['10', '−35'], unidad: 'm', linea: 'la espuma del espacio · donde empieza Espacio', h: 1 };
        const c = tl.get('cae', p);
        return c > 0.97 ? { pisos: ['1'], linea: 'un punto', h: 1 } : { pisos: ['2', 'ℵ₀'], linea: 'cayendo en un punto', h: lerp(6.3, 1, ease(0.5, 1, c)) };
      }
      if (estilo === 3) {
        if (tl.get('uno', p) > 0.5) return { pisos: ['1'], linea: 'tú · el que mira', h: 1 };
        if (tl.get('renace', p) > 0.4) return { pisos: ['ℵ₀'], linea: viaje ? 'los que miran' : 'tus tú · infinitos', h: 5.75 };
        if (p >= tl.at('algo') + 0.8) {
          const k = tl.get('chispa', p);
          const m = k < 0.2 ? 1 : Math.min(41, 1 + Math.round(40 * ease(0.2, 1, k)));
          return { pisos: [String(m)], linea: m === 1 ? 'algo' : 'algo, y algo más', h: slog(m) };
        }
        const n = tl.get('nada', p);
        return n > 0.97 ? { pisos: ['0'], linea: 'nada', h: 1 } : { pisos: ['2', 'ℵ₀'], linea: 'deshaciéndose', h: lerp(6.3, 1, ease(0.4, 1, n)) };
      }
      if (estilo === 1) {
        if (tl.get('uno', p) > 0.5) return { pisos: ['1'], linea: 'tú · el que mira', h: 1 };
        const s = tl.get('solo', p);
        return s > 0.5 ? { pisos: ['ℵ₀'], linea: 'tus tú · infinitos', h: 5.75 } : { pisos: ['2', 'ℵ₀'], linea: 'cuántos: más que cualquier número', h: 6.3 };
      }
      const n = tl.get('nada', p);
      if (p >= tl.at('algo') + 0.8) {
        const k = tl.get('chispa', p);
        const m = k < 0.2 ? 1 : Math.min(41, 1 + Math.round(40 * ease(0.2, 1, k)));
        return { pisos: [String(m)], linea: m === 1 ? 'algo' : 'algo, y algo más', h: slog(m) };
      }
      return n > 0.97 ? { pisos: ['0'], linea: 'nada', h: 1, a: 1 } : { pisos: ['2', 'ℵ₀'], linea: 'deshaciéndose', h: lerp(6.3, 1, ease(0.4, 1, n)) };
    };

    return {
      tl,
      entrada: { pos: V(0, 0, 0), escala: 20 },
      cuenta: cuentaDe,
      rotulo(p): Rotulo | null {
        const c = tl.captionAt(p);
        if (!c || !c.fact) return null;
        return { capitulo: viaje ? 'Final · ¿Por qué hay algo?' : CAP, name: c.name, fact: c.fact };
      },
      escalera: true,
      update(f: Frame) {
        const p = f.p;
        camera.near = 1e-4;
        camera.far = 1e4;
        camera.fov = 50;
        campo.u.uCae.value = tl.get('cae', p);
        campo.u.uSolo.value = tl.get('solo', p);
        campo.u.uUno.value = tl.get('uno', p);
        campo.u.uNada.value = tl.get('nada', p);
        campo.u.uDentro.value = tl.get('dentro', p);
        campo.u.uRenace.value = tl.get('renace', p);
        const a = tl.get('az', p) + f.time * 0.01;
        // Inside the field, drifting; way 1 pulls back while it falls, then dives in.
        const dentro = tl.get('dentro', p);
        const d = estilo === 0 ? lerp(logLerp(9, 3, tl.get('cae', p)), 0.6, ease(0, 1, dentro)) : 9;
        let pos = V(Math.sin(a) * d, 0.6, Math.cos(a) * d);
        let look = V(0, 0, 0);
        if (estilo === 3) {
          // Into the nothing (in front of the first sparks), back out among every «you», then to one.
          const ch = tl.get('chispa', p);
          const vuelve = ease(0, 1, tl.get('vuelve', p));
          if (ch > 0) {
            pos = V(0, 0.05, 1.5).lerp(pos, vuelve);
            look = V(0, 0, -2).multiplyScalar(ease(0, 1, Math.min(ch, 1)) * (1 - vuelve));
          }
          const k = ease(0, 1, tl.get('acerca', p));
          pos = pos.lerp(ELEGIDO.clone().add(V(0.15, 0.05, 0.9)), k);
          look = look.lerp(ELEGIDO, ease(0, 1, tl.get('uno', p)));
        }
        if (estilo === 1) {
          const k = ease(0, 1, tl.get('acerca', p));
          pos = pos.lerp(ELEGIDO.clone().add(V(0.15, 0.05, 0.9)), k);
          look = look.lerp(ELEGIDO, ease(0, 1, tl.get('uno', p)));
        }
        if (estilo === 2) look = V(0, 0, -2).multiplyScalar(ease(0, 1, tl.get('chispa', p)));
        if (estilo === 2 && tl.get('chispa', p) > 0) pos = V(0, 0.05, 1.5);
        mirar(camera, pos, look);
        if (espuma) espuma.u.uEspuma.value = tl.get('espuma', p);
        if (chispas) {
          chispas.u.uChispa.value = tl.get('chispa', p);
          chispas.u.uGain.value = 1 - ease(0, 0.6, tl.get('renace', p));
        }
        for (const n of nubes) enfocar(n, f.focal, f.dpr, f.time);
        // Way 2: the one that is left breathes.
        if (estilo === 1 || estilo === 3) campo.u.uGain.value = 1 + 0.25 * Math.sin(f.time * 1.6) * tl.get('uno', p);
      },
      placa(g, f) {
        // «Todo, desde aquí», big and centred, as the last words.
        const t = tl.get('texto', f.p);
        if (t > 0.01) {
          g.save();
          g.globalAlpha = ease(0, 0.6, t);
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.font = FONT.italic(64 * f.u);
          g.shadowColor = 'rgba(0,0,0,0.9)';
          g.shadowBlur = 18 * f.u;
          g.fillStyle = ink(0.95);
          g.fillText('Todo, desde aquí.', f.W / 2, f.H * 0.42);
          if (estilo === 0) {
            g.font = FONT.mono(11 * f.u);
            g.letterSpacing = `${1.6 * f.u}px`;
            g.fillStyle = `rgba(255,91,46,${ease(0.4, 1, t)})`;
            g.fillText('→ ESPACIO', f.W / 2, f.H * 0.42 + 64 * f.u);
          }
          g.restore();
        }
      },
      dispose() {},
    };
  },
};
