import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder, type Nube } from '../src/engine/materia';
import { crearAgujero } from '../src/engine/agujero';
import { lerp } from '../src/engine/math';
import { deH, h10, slog, type Cuenta, type Rotulo } from './placa';
import { ease, logLerp, mirar, redCosmica, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * Study · act IV, «Universos en agujeros negros». Some theories replace the singularity at the
 * centre of a black hole with a bounce: the matter that falls in stops, rebounds and inflates into a
 * new universe (Popławski, 2010, with torsion; Smolin, 1992, «cosmological natural selection»: the
 * laws are inherited, and universes that make more black holes have more children). There are some
 * 4 × 10¹⁹ stellar black holes in the observable universe (Sicilia et al., 2022).
 *
 * Two ways:
 * 1 · Caer: the black hole (ray traced, from Tiempo and Destino); the camera falls through the
 *     horizon; inside, the matter falling with it streams past; the bounce is a flash; a hot new
 *     universe expands around the camera and cools into a cosmic web.
 * 2 · Sin fondo: a universe with black holes; the camera dives into one and finds a whole universe,
 *     with its own black holes; into one of those, another. A seamless infinite zoom (each level is
 *     the same web, so the camera's frame resets every level).
 */

const CAP = 'IV · Universos en agujeros negros';
const L19 = Math.log10(4e19);

export const agujero: Escena = {
  id: 'agujero',
  nombre: 'Agujeros negros',
  estilos: [
    { key: '1', nombre: 'Caer', nota: 'La cámara cae por el horizonte; adentro, la materia rebota en un destello y nace un universo nuevo a tu alrededor.' },
    { key: '2', nombre: 'Sin fondo', nota: 'Un universo con agujeros negros; dentro de uno, otro universo entero, con los suyos; y dentro de uno de esos, otro.' },
  ],
  montar(stage, estilo, viaje = false): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.5;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = 0.45;
    const tl = new Timeline();
    const nubes: Nube[] = [];
    const add = (n: Nube, parent: THREE.Object3D = root) => {
      n.u.uSpread.value = 0;
      parent.add(n.points);
      nubes.push(n);
      return n;
    };

    // ================================================================ way 1: falling in
    const bh = estilo === 0 ? crearAgujero() : null;
    let caida: Nube | null = null;
    let nuevo: Nube | null = null;
    let destello: Nube | null = null;
    let estrella: Nube | null = null;
    const estrellaPos = V();
    if (bh) {
      root.add(bh.mesh);
      bh.u.uDiskIn.value = 3;
      bh.u.uDiskOut.value = 16;
      bh.u.uBand.value = 0.6;
      tl.set({ d: 0, dentro: 0, cae: 0, rebote: 0, nace: 0, sale: 0, cuenta: 0, puente: 0 });
      if (viaje) {
        // GUION.md 20–23 and the bridge to act V.
        tl.label('agujero').caption(3.4, 'Un agujero negro', 'En nuestro universo hay unos cuarenta trillones de agujeros negros. Lo que cae en ellos no vuelve.');
        tl.to(3.4, { d: 0.55, cuenta: 1 });
        tl.label('horizonte').caption(3.0, 'Adentro', 'Al cruzar el borde, todos los caminos llevan al centro.');
        tl.to(1.2, { d: 1 });
        tl.to(0.6, { dentro: 1 });
        tl.to(1.2, { cae: 1 });
        tl.label('rebote').caption(3.4, 'Otro comienzo', 'Quizá en el centro no hay un final, sino un rebote. Y de ese rebote, un universo nuevo.');
        tl.to(0.7, { rebote: 1, cae: 1.3 });
        tl.to(2.7, { nace: 1 });
        tl.label('dentro').caption(3.8, 'Quizá el nuestro', 'Quizá el nuestro empezó así, adentro de un agujero negro de otro universo. Un universo hijo de otro.');
        tl.to(3.8, { sale: 1, cuenta: 2 });
        tl.label('puente').caption(3.2, '', 'Y si todo empieza en algún momento… ¿qué es un momento?');
        tl.to(3.2, { puente: 1 });
      }
      if (!viaje) tl.label('agujero').caption(3.0, 'Un agujero negro', 'En el universo observable hay unos 4 × 10¹⁹ agujeros negros de estrellas. Lo que cae en ellos no vuelve a salir.');
      if (!viaje) tl.to(3.0, { d: 0.55, cuenta: 1 });
      if (!viaje) tl.label('horizonte').caption(3.0, 'El horizonte', 'Al cruzar el borde, todos los caminos llevan hacia adentro. Lo que cae contigo se estira hacia el centro.');
      if (!viaje) {
      tl.to(1.2, { d: 1 });
      tl.to(0.6, { dentro: 1 });
      tl.to(1.2, { cae: 1 });
      tl.label('rebote').caption(3.0, 'Otro comienzo', 'Algunas teorías dicen que en el centro no hay un punto sin fin: la materia rebota y empieza a inflarse. Un universo nuevo.');
      tl.to(0.7, { rebote: 1, cae: 1.3 });
      tl.to(2.3, { nace: 1 });
      tl.label('dentro').caption(3.4, 'Un universo adentro', 'Con su propio espacio, sus galaxias y sus agujeros negros. Quizá el nuestro empezó así, dentro de un agujero negro de otro universo.');
      tl.to(3.4, { sale: 1, cuenta: 2 });
      }

      // Matter falling with the camera: streaks along the way in (a tube round the path).
      const b = materiaBuilder(12);
      for (let i = 0; i < 5000; i++) {
        const a = b.r() * Math.PI * 2;
        const r = 0.15 + Math.sqrt(b.r()) * 1.6;
        const z = b.r();
        for (let j = 0; j < 6; j++) b.push(Math.cos(a) * r, Math.sin(a) * r, z, new THREE.Color(1, 0.62, 0.32), 0.012, 0.4, { delay: j / 6 });
      }
      caida = add(
        materia(b.data(), {
          pre: /* glsl */ `uniform float uCae, uOn;`,
          move: /* glsl */ `
            // Each streak runs towards the camera and past it, faster and longer as the fall goes on.
            float L = 14.0;
            // Time × speed jumped whenever the speed changed (the whole field leapt): the drift is slow and
            // steady, and the fall itself moves them, with the scroll (faster as it goes on).
            float z = fract(position.z - uTime * 0.25 - uCae * (0.6 + 3.0 * uCae)) * L;
            float stretch = 0.12 + 0.45 * uCae;
            p = vec3(p.xy * (1.0 - 0.6 * uCae * (1.0 - z / L)), -z + aDelay * stretch);
            em *= uOn * (1.1 + 0.6 * uCae) * smoothstep(L, L * 0.6, z) * smoothstep(0.0, 1.0, z);
            sz *= 1.8 - 0.8 * uCae;
            em = mix(em, vec3(1.0, 0.95, 0.9) * length(em), uCae * 0.6);
            fuente = 0.8;`,
          uniforms: { uCae: { value: 0 }, uOn: { value: 0 } },
        }),
      );
      // The flash of the bounce: a shell of white light round the camera.
      const fb = materiaBuilder(13);
      for (let i = 0; i < 6000; i++) {
        const [x, y, z] = fb.onSphere();
        fb.push(x * 3, y * 3, z * 3, new THREE.Color(1, 0.96, 0.9), 0.4, 1.6);
      }
      destello = add(materia(fb.data(), { pre: `uniform float uOn;`, move: `em *= uOn; fuente = 1.0;`, uniforms: { uOn: { value: 0 } } }));
      // The new universe: from a hot point round the camera, out into a web that cools.
      const red = redCosmica(2010, 100, (t, out) => out.setRGB(0.85, 0.75 - 0.1 * t, 1.0));
      const from = red.data.aFrom;
      const delay = red.data.aDelay;
      const rnd = materiaBuilder(14).r;
      for (let i = 0; i < from.length / 3; i++) {
        from[i * 3] *= 0.02;
        from[i * 3 + 1] *= 0.02;
        from[i * 3 + 2] *= 0.02;
        delay[i] = rnd();
      }
      nuevo = add(
        materia(red.data, {
          pre: /* glsl */ `uniform float uNace;`,
          move: /* glsl */ `
            // Hot when dense: white, then gold, then the web's own colour.
            float caliente = 1.0 - smoothstep(0.0, 0.7, uNace);
            em = mix(em, vec3(1.0, 0.85, 0.6) * 2.2, caliente);
            em *= smoothstep(0.0, 0.08, uNace);
            fuente = 0.6;`,
          uniforms: { uNace: { value: 0 } },
        }),
      );
      nuevo.u.uSpread.value = 0.8;
      const k = red.nodos.reduce((m, n) => (n.distanceTo(V(0.3, 0.15, 0.45)) < m.distanceTo(V(0.3, 0.15, 0.45)) ? n : m), red.nodos[0]);
      estrellaPos.copy(k);
      const eb = materiaBuilder(16);
      eb.push(k.x, k.y, k.z, new THREE.Color(1.0, 0.8, 0.55), 0.004, 3.0);
      estrella = add(materia(eb.data(), { move: 'fuente = 1.0;' }));
    }

    // ================================================================ way 2: no bottom
    // The same web at every level: the special knot P holds the next level, scaled by S.
    const S = 0.012;
    let red2: ReturnType<typeof redCosmica> | null = null;
    const niveles: { n: Nube; a: Nube; g: THREE.Group }[] = [];
    const P = V();
    const X = V();
    if (estilo === 1) {
      tl.set({ z: 0, cuenta: 0, az: 0 });
      tl.label('nuestro').caption(3.0, 'Un universo con agujeros negros', 'En nuestro universo hay unos 4 × 10¹⁹ agujeros negros de estrellas, repartidos por las galaxias.');
      tl.to(3.0, { z: 0.25, cuenta: 1, az: 0.4 });
      tl.label('adentro').caption(3.4, 'Adentro, otro', 'Si cada uno guarda un universo, adentro hay otro cosmos entero, con sus propias galaxias y sus propios agujeros negros.');
      tl.to(3.4, { z: 1.0, cuenta: 2, az: 0.7 });
      tl.label('otro').caption(3.4, 'Y adentro, otro', 'Y en cada uno de esos, otro. Y otro. Nada dice que haya un fondo.');
      tl.to(3.4, { z: 2.6, cuenta: 3.6, az: 1.0 }, (t) => t * t * (3 - 2 * t));
      tl.label('herencia').caption(3.6, 'Universos que se heredan', 'Smolin propuso que así se heredan las leyes: los universos que hacen más agujeros negros tienen más hijos.');
      tl.to(3.6, { z: 3.6, cuenta: 4.6, az: 1.3 });
      red2 = redCosmica(1992, 100, (t, out) => out.setRGB(0.95, 0.85 - 0.15 * t, 1.0 - 0.1 * t));
      // The knot that holds the next level: the node nearest to (0.35, 0.1, 0.2).
      const objetivo = V(0.35, 0.1, 0.2);
      P.copy(red2.nodos.reduce((m, n) => (n.distanceTo(objetivo) < m.distanceTo(objetivo) ? n : m), red2.nodos[0]));
      X.copy(P).multiplyScalar(1 / (1 - S));
      // Its black holes: a hot ring at every knot (the special one too).
      const rb = materiaBuilder(15);
      for (const n of red2.nodos) {
        for (let k = 0; k < 90; k++) {
          const a = rb.r() * Math.PI * 2;
          const r = 0.006 + rb.r() * 0.006;
          rb.push(n.x + Math.cos(a) * r, n.y + (rb.r() - 0.5) * 0.001, n.z + Math.sin(a) * r, new THREE.Color(1, 0.55, 0.25), 0.0025, 1.4);
        }
      }
      const anillos = rb.data();
      // Three levels drawn at a time: the one we are in, the one inside P, and the one inside that.
      for (let k = 0; k < 3; k++) {
        const g = new THREE.Group();
        root.add(g);
        const n = add(materia(red2.data, { pre: `uniform float uOn;`, move: `em *= uOn; fuente = 0.6;`, uniforms: { uOn: { value: 1 } } }), g);
        const an = add(materia(anillos, { pre: `uniform float uOn;`, move: `em *= uOn; fuente = 1.0;`, uniforms: { uOn: { value: 1 } } }), g);
        niveles.push({ n, a: an, g });
      }
    }

    const cuentaDe = (p: number): Cuenta => {
      const c = tl.get('cuenta', p);
      if (estilo === 0) {
        if (p >= tl.at('rebote') && p < tl.at('dentro')) return { pisos: ['1'], linea: 'un universo nuevo', h: 1 };
        if (viaje && p >= tl.at('puente')) return { pisos: ['1'], linea: 'una estrella', h: 1 };
        if (c < 0.01) return { pisos: ['1'], linea: 'un agujero negro', h: 1 };
        const l = L19 * ease(0, 1, Math.min(c, 1));
        return { pisos: l > 19 ? ['4 × 10', '19'] : deH(h10(l)), linea: p >= tl.at('dentro') ? 'agujeros negros en él · cada uno, otro universo' : 'agujeros negros de estrellas · universo observable', h: h10(l) };
      }
      // Way 2: universes inside universes: (4 × 10¹⁹)ⁿ.
      if (c < 0.01) return { pisos: ['1'], linea: 'un universo', h: 1 };
      const l = L19 * c;
      return { pisos: deH(h10(l)), linea: c <= 1.02 ? 'agujeros negros · cada uno, un universo' : `universos, ${Math.ceil(c - 1e-6)} pisos hacia adentro`, h: h10(l) };
    };

    return {
      tl,
      entrada: { pos: V(0, 0, 0), escala: 16 },
      salida: { pos: estrellaPos.clone(), escala: 0.02 },
      cuenta: cuentaDe,
      rotulo(p): Rotulo | null {
        const c = tl.captionAt(p);
        return c ? { capitulo: viaje ? 'IV · ¿De dónde salió?' : CAP, name: c.name, fact: c.fact } : null;
      },
      update(f: Frame) {
        const p = f.p;
        camera.near = 1e-4;
        camera.far = 1e4;
        if (bh && caida && nuevo && destello) {
          const d = tl.get('d', p);
          const dentro = tl.get('dentro', p);
          const cae = tl.get('cae', p);
          const rebote = tl.get('rebote', p);
          const nace = tl.get('nace', p);
          const sale = tl.get('sale', p);
          camera.fov = lerp(42, 62, ease(0.6, 1, d));
          // Outside: the camera comes in from far, a little above the disk; then straight in.
          const dist = d < 0.85 ? logLerp(70, 3.2, ease(0, 0.85, d)) : logLerp(3.2, 1.05, ease(0.85, 1, d));
          const el = lerp(0.16, 0.05, ease(0.3, 1, d));
          const az = 0.4 + 0.25 * d;
          const pos = V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist);
          // Crossing the horizon the camera eases from the outside view into the fall's frame (the streaks
          // run along −z round the origin); it used to switch in one frame at dentro = 1.
          const cruza = ease(0, 1, dentro);
          const mira = V(0, 0.9 * ease(0.4, 0.9, d) * (1 - ease(0.9, 1, d)), 0).lerp(V(0, 0, -1), cruza);
          mirar(camera, pos.clone().lerp(V(0, 0, 0.001), cruza), mira);
          // The camera's way from the fall into the new universe (used below once the bounce starts).
          const pasa = ease(0.15, 0.85, rebote);
          camera.updateMatrixWorld();
          bh.update({ camera, center: V(0, 0, 0), normal: V(0, 1, 0.08).normalize(), rs: 1, sky: new THREE.Matrix3(), time: f.time, alpha: 1 - dentro });
          caida.u.uCae.value = Math.min(cae, 1);
          caida.u.uOn.value = dentro * (1 - ease(1.05, 1.3, cae));
          destello.u.uOn.value = ease(0, 0.6, rebote) * (1 - ease(0.05, 0.8, nace));
          nuevo.u.uK.value = ease(0, 1, nace);
          nuevo.u.uNace.value = nace;
          nuevo.points.visible = rebote > 0.001;
          const nuevoOn = ease(0.25, 1, rebote);
          stage.renderer.toneMappingExposure = 1.1 + 0.6 * ease(0, 0.6, rebote) * (1 - ease(0, 0.7, nace));
          if (rebote > 0.001) {
            // In the new universe: from its middle, out until it is whole in front of us.
            const r = lerp(0.05, 2.7, ease(0, 1, sale));
            const a = 0.3 + f.time * 0.01 + sale * 0.6;
            const pos = V(Math.sin(a) * r, 0.3 * r, Math.cos(a) * r);
            const look = V(0, 0, 0);
            // The bridge: down to one of its stars, until it is a light in the middle of the black.
            const pu = ease(0, 1, tl.get('puente', p));
            if (pu > 0) {
              pos.lerp(estrellaPos.clone().addScaledVector(pos.clone().sub(estrellaPos).normalize(), 0.06), pu);
              look.lerp(estrellaPos, ease(0, 0.4, pu));
            }
            nuevo.u.uGain.value = nuevoOn * (1 - 0.85 * ease(0.4, 1, pu));
            mirar(camera, V(0, 0, 0.001).lerp(pos, pasa), V(0, 0, -1).lerp(look, pasa));
          }
          if (estrella) {
            estrella.u.uGain.value = ease(0, 0.6, tl.get('puente', p));
            estrella.u.uSizeUnit.value = lerp(1, 5, ease(0.3, 1, tl.get('puente', p)));
          }
        } else if (red2) {
          // The infinite zoom: level k is drawn in its own frame (×1); k+1 sits at P scaled by S; k+2
          // at P + S·P scaled by S². The camera closes in on the fixed point X = P / (1 − S).
          const z = tl.get('z', p);
          const k = Math.floor(z);
          const fz = z - k;
          niveles[0].g.position.set(0, 0, 0);
          niveles[0].g.scale.setScalar(1);
          niveles[1].g.position.copy(P);
          niveles[1].g.scale.setScalar(S);
          niveles[2].g.position.copy(P).addScaledVector(P, S);
          niveles[2].g.scale.setScalar(S * S);
          const d = 2.4 * Math.pow(S, fz);
          const a = tl.get('az', p) + f.time * 0.01 + fz * 0.8;
          const dir = V(Math.sin(a), 0.32, Math.cos(a)).normalize();
          camera.fov = 46;
          mirar(camera, X.clone().addScaledVector(dir, d), X);
          // The level we leave fades as we go in; the next one shows inside its black hole.
          const on = [1 - ease(0.55, 0.95, fz), ease(0.05, 0.4, fz), ease(0.6, 1.0, fz) * 0.6];
          niveles.forEach((nv, i) => {
            nv.n.u.uOn.value = on[i];
            nv.a.u.uOn.value = on[i];
          });
          void k;
        }
        for (const n of nubes) enfocar(n, f.focal, f.dpr, f.time);
        // Point sizes follow each level's scale (sizes are in world units, not scaled with the group).
        niveles.forEach((nv) => {
          nv.n.u.uSizeUnit.value = nv.g.scale.x;
          nv.a.u.uSizeUnit.value = nv.g.scale.x;
        });
      },
      dispose() {
        stage.renderer.toneMappingExposure = 1.1;
      },
    };
  },
};
