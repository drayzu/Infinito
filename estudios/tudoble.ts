import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder, type Nube } from '../src/engine/materia';
import { lerp } from '../src/engine/math';
import { deH, h10, h1010, ink, proyectar, slog, texto, type Cuenta, type Rotulo } from './placa';
import { aqui, ease, LUZ_TIERRA, logLerp, mapaTierra, mirar, redCosmica, tierraDatos, TU, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * Act I, «Tu doble» (plan v2, approved 28 Oct 2026): the relay from Destino (a bubble that inflates;
 * inside, a universe begins: ours), our observable universe and its horizon, then out past it:
 * volumes like ours in a lattice without end, each with its matter arranged its own way. The ways
 * to arrange a volume are many (~10^10^122) but not infinite; in endless space every one repeats,
 * ours too (Tegmark, 2003: the nearest double ~10^10^29 m away). The camera crosses the copies to the
 * one arranged like ours, dives in, and lands on an Earth like this one: there, you.
 *
 * Units: our observable universe has radius 1. The lattice of volumes has step PASO; the double is
 * a few cells off (the number on the clock is the true distance; the picture is not to scale).
 */

const CAP = 'I · Tu doble';
const PASO = 2.7;
const DOBLE = new THREE.Vector3(3, -1, -4).multiplyScalar(PASO);
const R_TIERRA = 0.03;

export const tuDoble: Escena = {
  id: 'doble',
  nombre: 'Tu doble',
  estilos: [{ key: '1', nombre: 'Elegida', nota: 'El plan v2: del relevo de Destino al horizonte; más allá, volúmenes como el nuestro; uno ordenado igual; adentro, una Tierra y tú.' }],
  montar(stage): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.55;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = 0.4;
    const tl = new Timeline();
    const nubes: Nube[] = [];
    const add = (n: Nube, parent: THREE.Object3D = root) => {
      n.u.uSpread.value = 0;
      parent.add(n.points);
      nubes.push(n);
      return n;
    };

    tl.set({ burbuja: 0, entra: 0, sale: 0, red: 0, cuenta: 0, vuela: 0, zoom: 0, tierra: 0, az: 0 });
    tl.label('relevo').caption(3.0, 'Un universo empieza', 'Destino terminó con una burbuja que se inflaba y, adentro, un universo que empezaba. Así pudo empezar el nuestro.');
    tl.to(1.6, { burbuja: 1 });
    tl.to(1.4, { entra: 1 });
    tl.label('horizonte').caption(3.2, 'El horizonte', 'Todo lo que vemos termina a 46 000 millones de años luz: más allá, la luz no ha tenido tiempo de llegar. Pero el espacio sigue.');
    tl.to(3.2, { az: 0.5, cuenta: 1 });
    tl.label('mas').caption(3.2, 'Más allá', 'Afuera hay otros volúmenes como el nuestro, con la misma física y su materia ordenada a su manera.');
    tl.to(3.2, { sale: 1, red: 1, cuenta: 2, az: 0.8 });
    tl.label('maneras').caption(3.2, 'Todas las maneras', 'Las maneras de ordenar la materia en un volumen así son muchísimas, pero no infinitas. Y el espacio, quizá, sí lo es.');
    tl.to(3.2, { cuenta: 3, az: 1.0 });
    tl.label('doble').caption(3.6, 'Tu doble', 'Entonces cada manera se repite, también la nuestra: otro volumen igual, con un planeta igual y alguien leyendo esto.');
    tl.to(3.6, { vuela: 1, cuenta: 4 });
    tl.label('tu').caption(3.6, 'Tú, otra vez', 'El más cercano estaría a unos 10 elevado a 10²⁹ metros. Un número que no cabe en el universo, pero no es infinito.');
    tl.to(1.8, { zoom: 1 });
    tl.to(1.8, { tierra: 1 });

    // ---- The relay: Destino's bubble (a violet wall that inflates).
    const bw = materiaBuilder(3);
    for (let i = 0; i < 9000; i++) {
      const [x, y, z] = bw.onSphere();
      bw.push(x, y, z, new THREE.Color(0.79, 0.7, 1.0), 0.012, 0.9);
    }
    const pared = add(materia(bw.data(), { pre: `uniform float uOn;`, move: `em *= uOn; fuente = 0.7;`, uniforms: { uOn: { value: 1 } } }));

    // ---- Our observable universe: the cosmic web and its horizon (faint violet shell).
    const red = redCosmica(2003, 110, (t, out) => out.setRGB(1, 0.92 - 0.12 * t, 0.8 - 0.2 * t));
    const nuestro = add(materia(red.data, { pre: `uniform float uOn;`, move: `em *= uOn; fuente = 0.6;`, uniforms: { uOn: { value: 0 } } }));
    const bh = materiaBuilder(4);
    for (let i = 0; i < 7000; i++) {
      const [x, y, z] = bh.onSphere();
      bh.push(x, y, z, new THREE.Color(0.79, 0.7, 1.0), 0.006, 0.4);
    }
    const horizonteData = bh.data();
    add(materia(horizonteData, { pre: `uniform float uOn;`, move: `em *= uOn; fuente = 0.6;`, uniforms: { uOn: { value: 0 } } }));
    const horizonte = nubes[nubes.length - 1];

    // ---- The lattice: copies of the same web, each turned its own way (its own arrangement). The
    // double is turned exactly like ours. Copies share our geometry, with their own uniforms.
    const copias: { points: THREE.Points; u: Nube['u']; pos: THREE.Vector3; esDoble: boolean }[] = [];
    const matWeb = nuestro.points.material as THREE.ShaderMaterial;
    const matHor = horizonte.points.material as THREE.ShaderMaterial;
    const rnd = materiaBuilder(9).r;
    const celdas: THREE.Vector3[] = [];
    for (let i = -2; i <= 4; i++) for (let j = -1; j <= 1; j++) for (let k = -5; k <= 1; k++) if (i || j || k) celdas.push(V(i, j, k).multiplyScalar(PASO));
    // The other volumes are lighter (their points merge at that distance anyway); the double is whole.
    const ligera = redCosmica(77, 45);
    const ligeraWeb = materia(ligera.data, { pre: `uniform float uOn;`, move: `em *= uOn; fuente = 0.6;`, uniforms: { uOn: { value: 0 } } });
    const hl = materiaBuilder(6);
    for (let i = 0; i < 1800; i++) {
      const [x, y, z] = hl.onSphere();
      hl.push(x, y, z, new THREE.Color(0.79, 0.7, 1.0), 0.01, 0.4);
    }
    const ligeraHor = materia(hl.data(), { pre: `uniform float uOn;`, move: `em *= uOn; fuente = 0.6;`, uniforms: { uOn: { value: 0 } } });
    for (const pos of celdas) {
      const esDoble = pos.distanceTo(DOBLE) < 1e-6;
      const g = new THREE.Group();
      g.position.copy(pos);
      if (!esDoble) g.rotation.set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28);
      const m = (esDoble ? matWeb : (ligeraWeb.points.material as THREE.ShaderMaterial)).clone();
      const pts = new THREE.Points(esDoble ? nuestro.points.geometry : ligeraWeb.points.geometry, m);
      pts.frustumCulled = false;
      g.add(pts);
      const mh = (esDoble ? matHor : (ligeraHor.points.material as THREE.ShaderMaterial)).clone();
      const hp = new THREE.Points(esDoble ? horizonte.points.geometry : ligeraHor.points.geometry, mh);
      hp.frustumCulled = false;
      g.add(hp);
      root.add(g);
      copias.push({ points: pts, u: m.uniforms as Nube['u'], pos, esDoble });
      copias.push({ points: hp, u: mh.uniforms as Nube['u'], pos, esDoble });
    }

    // ---- The Earth inside the double (and you, teal, in Santiago).
    let tierra: Nube | null = null;
    const giro = new THREE.Euler(0.3, -0.34, 0);
    const tGroup = new THREE.Group();
    tGroup.position.copy(DOBLE);
    tGroup.scale.setScalar(R_TIERRA);
    tGroup.rotation.copy(giro);
    root.add(tGroup);
    const yo = (() => {
      const b = materiaBuilder(5);
      const q = aqui().multiplyScalar(1.006);
      b.push(q.x, q.y, q.z, TU, 0.035, 3.4);
      return materia(b.data(), { move: 'fuente = 1.0;' });
    })();
    yo.u.uSpread.value = 0;
    tGroup.add(yo.points);
    const listo = mapaTierra().then((img) => {
      tierra = materia(tierraDatos(img, 90000, 29), {
        pre: LUZ_TIERRA + /* glsl */ `uniform vec3 uSol, uCam;`,
        move: /* glsl */ `
          em *= luzTierra(normalize(position), uSol);
          em *= smoothstep(0.96, 1.03, dot(normalize(position), uCam));
          fuente = 0.3;`,
        uniforms: { uSol: { value: V(0.6, 0.25, 0.75).normalize() }, uCam: { value: V(0, 0, 10) } },
      });
      tierra.u.uSpread.value = 0;
      tGroup.add(tierra.points);
    });

    const cuentaDe = (p: number): Cuenta => {
      const c = tl.get('cuenta', p);
      if (c < 0.5) return { pisos: ['1'], linea: 'un universo, el nuestro', h: 1 };
      if (c <= 1.02) return { pisos: ['10', '80'], linea: 'protones en todo lo que vemos', h: h10(80) };
      if (c <= 2.02) {
        const n = Math.round(lerp(1, 124, ease(1, 2, c)));
        return { pisos: [String(n)], linea: 'volúmenes como el nuestro a la vista', h: slog(n) };
      }
      if (c <= 3.02) {
        const h = lerp(slog(124), h1010(122), ease(2, 3, c));
        return { pisos: c > 2.98 ? ['10', '10', '122'] : deH(h), linea: 'maneras de ordenar un volumen como el nuestro', h };
      }
      const h = h1010(29);
      return { pisos: ['10', '10', '29'], unidad: 'm', linea: 'hasta tu doble más cercano · estimación', h };
    };

    const tmp = V();
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
        camera.near = 1e-5;
        camera.far = 1e4;
        camera.fov = 46;
        const burbuja = tl.get('burbuja', p);
        const entra = tl.get('entra', p);
        const sale = tl.get('sale', p);
        const red = tl.get('red', p);
        const vuela = tl.get('vuela', p);
        const zoom = tl.get('zoom', p);
        const tk = tl.get('tierra', p);
        // The relay: the bubble grows from a point to our horizon, then fades as we go in.
        pared.points.scale.setScalar(lerp(0.02, 1.0, ease(0, 1, burbuja)));
        pared.u.uOn.value = (1 - ease(0.3, 1, entra)) * ease(0, 0.2, burbuja);
        nuestro.u.uOn.value = ease(0.2, 1, entra) * (1 - 0.5 * ease(0.6, 1, vuela));
        horizonte.u.uOn.value = ease(0.5, 1, entra) * (0.4 + 0.6 * ease(0, 1, sale));
        for (const c of copias) {
          const lejos = c.pos.length();
          c.u.uOn.value = ease(0, 0.6, red) * (c.esDoble ? lerp(0.4, 1, ease(0.3, 1, vuela)) : 0.28 * (1 - 0.3 * ease(0.5, 1, vuela))) * Math.exp(-c.pos.distanceTo(camera.position) / 14) * (c.esDoble ? 1 - ease(0.5, 1, tk) * 0.9 : 1 - ease(0, 0.6, zoom));
          void lejos;
          c.u.uFocal.value = f.focal;
          c.u.uMinPx.value = 1.6 * f.dpr;
          c.u.uMaxPx.value = 24 * f.dpr;
          c.u.uTime.value = f.time;
        }
        // The Earth appears inside the double as the camera dives into it.
        if (tierra) tierra.u.uGain.value = ease(0.5, 1, zoom);
        yo.u.uGain.value = ease(0.3, 1, tk);

        // ---- The camera: from outside the bubble, in; out past the horizon; across to the double; in; to the Earth.
        const a = tl.get('az', p) + f.time * 0.008;
        const fuera = V(Math.sin(a) * 4.5, 0.9, Math.cos(a) * 4.5);
        const dentro = V(Math.sin(a) * 0.35, 0.08, Math.cos(a) * 0.35);
        let pos = fuera.clone().lerp(dentro, ease(0, 1, entra));
        let look = V(0, 0, 0);
        // Out: back through the horizon, over the lattice.
        pos.lerp(V(Math.sin(a) * 6.5, 2.4, Math.cos(a) * 6.5 + 1.5), ease(0, 1, sale));
        // Across: a long arc to the double (the clock carries the true distance).
        const arco = new THREE.QuadraticBezierCurve3(V(Math.sin(a) * 6.5, 2.4, Math.cos(a) * 6.5 + 1.5), V(DOBLE.x * 0.5, 6, DOBLE.z * 0.3), DOBLE.clone().add(V(1.2, 0.8, 3.2)));
        const v = ease(0, 1, vuela);
        if (v > 0) {
          pos = arco.getPoint(v);
          look = look.lerp(DOBLE, ease(0, 0.6, v));
        }
        // Into the double, down to its Earth, to you.
        const z = ease(0, 1, zoom);
        if (z > 0) {
          const t0 = DOBLE.clone().add(V(1.2, 0.8, 3.2));
          const dir = t0.clone().sub(DOBLE).normalize();
          const d = logLerp(t0.distanceTo(DOBLE), R_TIERRA * 3.2, z);
          pos = DOBLE.clone().addScaledVector(dir, d);
          look = DOBLE.clone();
        }
        const k = ease(0, 1, tk);
        if (k > 0) {
          // Close over Santiago, the Earth large in the frame.
          const sitio = aqui().applyEuler(giro).multiplyScalar(R_TIERRA).add(DOBLE);
          const sobre = aqui().applyEuler(giro).multiplyScalar(R_TIERRA * 2.1).add(DOBLE).add(V(0, R_TIERRA * 0.4, 0));
          pos = pos.lerp(sobre, k);
          look = look.lerp(sitio, k);
        }
        mirar(camera, pos, look);
        camera.updateMatrixWorld();
        if (tierra) {
          tGroup.updateMatrixWorld();
          (tierra.u.uCam.value as THREE.Vector3).copy(tGroup.worldToLocal(camera.position.clone()));
          (tierra.u.uSol.value as THREE.Vector3).copy(camera.position.clone().sub(DOBLE).normalize().add(V(0.3, 0.4, 0)).normalize()).applyQuaternion(tGroup.quaternion.clone().invert());
          enfocar(tierra, f.focal, f.dpr, f.time);
          tierra.u.uSizeUnit.value = R_TIERRA;
        }
        enfocar(yo, f.focal, f.dpr, f.time);
        yo.u.uSizeUnit.value = R_TIERRA;
        for (const n of nubes) enfocar(n, f.focal, f.dpr, f.time);
      },
      placa(g, f) {
        const u = f.u;
        // The double, marked while we fly to it; you, on its Earth, at the end.
        const v = ease(tl.at('doble') + 0.6, tl.at('doble') + 1.4, f.p) * (1 - ease(tl.at('tu') + 0.4, tl.at('tu') + 1.0, f.p));
        if (v > 0.01) {
          const s = proyectar(DOBLE, camera, f.W, f.H);
          if (s.z < 1) texto(g, u, s.x + 18 * u, s.y - 18 * u, 'ordenado como el nuestro', '#73ffd9', v, 11);
        }
        const t = ease(tl.at('tu') + 2.6, tl.at('tu') + 3.3, f.p);
        if (t > 0.01) {
          tmp.copy(aqui()).applyEuler(giro).multiplyScalar(R_TIERRA).add(DOBLE);
          const s = proyectar(tmp, camera, f.W, f.H);
          if (s.z < 1) texto(g, u, s.x + 16 * u, s.y - 16 * u, 'tu doble · leyendo esto', '#73ffd9', t, 11);
        }
        void ink;
      },
      dispose() {},
    };
  },
};
