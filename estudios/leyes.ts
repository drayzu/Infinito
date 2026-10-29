import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder, type Nube } from '../src/engine/materia';
import { pantalla } from '../src/engine/pantalla';
import { lerp } from '../src/engine/math';
import { NOISE_GLSL } from '../src/lib/glsl';
import { deH, FONT, h10, ink, slog, texto, VIOLETA, type Cuenta, type Rotulo } from './placa';
import { ease, mirar, redCosmica, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * Study · act III, «Otras leyes». In eternal inflation (Guth, Linde, Vilenkin) space keeps inflating
 * for ever; here and there inflation stops and a bubble is born: a universe. Each bubble may come out
 * with its own laws (the string landscape counts some 10⁵⁰⁰ recipes; Linde and Vanchurin, 2010, put
 * the distinguishable universes at 10^10^10^7). Almost none allows atoms, stars and chemistry: the
 * fine tuning.
 *
 * Two ways:
 * 1 · Mar de burbujas: in the inflating false vacuum, bubbles are born and grow around the camera.
 *     It dives into four: a fog that never clumps (no nuclei), a universe of black holes (too much
 *     gravity), one that closes on itself in an instant, and ours, with its cosmic web. Then out.
 * 2 · Perillas: our universe, and three dials (gravity, the nuclear force, dark energy). Turning one a
 *     little ruins it: everything falls into black holes; matter is a fog; space flies apart. The
 *     window that allows us is very narrow.
 */

const CAP = 'III · Otras leyes';
const ORO = new THREE.Color(1.0, 0.85, 0.6);

interface Burbuja {
  c: THREE.Vector3;
  R: number;
  t0: number;
  tinte: THREE.Color;
}

export const leyes: Escena = {
  id: 'leyes',
  nombre: 'Otras leyes',
  estilos: [
    { key: '1', nombre: 'Mar de burbujas', nota: 'En el vacío que se infla nacen burbujas-universo; la cámara entra en cuatro: niebla, agujeros negros, un colapso, y la nuestra.' },
    { key: '2', nombre: 'Perillas', nota: 'Nuestro universo y tres perillas: gravedad, fuerza nuclear, energía oscura. Girar una apenas lo arruina.' },
  ],
  montar(stage, estilo, viaje = false): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.5;
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
    // The false vacuum: a faint violet that moves.
    const fondo = pantalla(
      NOISE_GLSL +
        /* glsl */ `
        uniform float uVacio;
        void main() {
          vec3 d = normalize(vDir);
          vec2 q = vec2(atan(d.z, d.x), asin(d.y)) * 2.2;
          float n = fbm(q + uTime * 0.02) * 0.5 + 0.5;
          gl_FragColor = vec4(vec3(0.32, 0.22, 0.6) * (0.03 + 0.05 * n) * uVacio, 1.0);
        }`,
      { uVacio: { value: 0 } },
    );
    root.add(fondo.mesh);

    // ================================================================ way 1
    const burbujas: Burbuja[] = [];
    const conchas: Nube[] = [];
    let ruta: THREE.CatmullRomCurve3 | null = null;
    let miradas: THREE.CatmullRomCurve3 | null = null;
    const especiales: { nube: Nube; grupo: THREE.Group }[] = [];
    // The four we dive into, along the way (−z), and the rest around them.
    // In the journey ours comes first (act II hands it over: a ball of light in its bubble) and the
    // others lie ahead.
    const DESTINOS = viaje ? [V(14, 3, -22), V(-12, -4, -40), V(12, 5, -60), V(0, 0, 0)] : [V(9, 2, -14), V(-11, -3, -36), V(10, 4, -58), V(-4, 0, -82)];
    let nudo = V();
    const TINTES = [new THREE.Color(0.55, 0.65, 0.85), new THREE.Color(1.0, 0.55, 0.35), new THREE.Color(0.95, 0.45, 0.8), new THREE.Color(1.0, 0.85, 0.55)];
    if (estilo === 0 && viaje) {
      // GUION.md 14–19 and the bridge to act IV.
      tl.set({ infla: 0, r: 0, colapso: 0, fuera: 0, cuenta: 0, vacio: 0 });
      tl.label('burbuja').caption(3.8, 'Una burbuja', 'Nuestro universo podría ser una burbuja en algo que se infla sin parar. Y no la única.');
      tl.to(1.8, { infla: 0.45, vacio: 0.6 });
      tl.to(2.0, { infla: 1, r: 1, vacio: 1 });
      tl.label('niebla').caption(3.8, 'Otra receta', 'En otras, las reglas serían distintas. En esta no se forman átomos: hay una niebla que nunca se junta.');
      tl.to(3.8, { r: 3 });
      tl.label('agujeros').caption(3.0, 'Demasiada gravedad', 'En esta, todo cae en agujeros negros antes de que se encienda una sola estrella.');
      tl.to(3.0, { r: 5 });
      tl.label('breve').caption(3.0, 'Breve', 'Esta se cierra sobre sí misma antes de cumplir un segundo.');
      tl.to(1.2, { r: 6 });
      tl.to(1.8, { r: 7, colapso: 1 });
      tl.label('ninguna').caption(4.2, 'Casi ninguna', 'Casi ninguna receta deja que exista alguien que se pregunte esto. Ni nosotros ni nadie: ninguna vida, ninguna mente, de ningún tipo.');
      tl.to(4.2, { r: 8, cuenta: 1 });
      tl.label('aqui').caption(3.8, 'Por eso aquí', 'Esta sí. Por eso estás aquí: solo se puede mirar desde un universo que permita mirar.');
      tl.to(3.8, { r: 9 });
      tl.label('puente').caption(3.0, '', '¿Y de dónde salió esta?');
      tl.to(3.0, { r: 11, vacio: 0 });
    } else if (estilo === 0) {
      tl.set({ infla: 0, r: 0, colapso: 0, fuera: 0, cuenta: 0, vacio: 1 });
      tl.label('inflacion').caption(3.2, 'Inflación eterna', 'Más allá de lo que vemos, el espacio se sigue inflando sin parar. Aquí y allá se detiene, y nace una burbuja: un universo.');
      tl.to(3.2, { infla: 1, r: 0.6 });
      tl.label('niebla').caption(2.8, 'Otra receta', 'Cada burbuja puede salir con sus propias leyes. En esta no se forman núcleos: la materia es una niebla que nunca se junta.');
      tl.to(2.8, { r: 1.6 });
      tl.label('agujeros').caption(2.8, 'Demasiada gravedad', 'En esta la gravedad es más fuerte: todo cae en agujeros negros antes de que se encienda una estrella.');
      tl.to(2.8, { r: 2.6 });
      tl.label('breve').caption(2.8, 'Un universo breve', 'Esta se vuelve a cerrar sobre sí misma antes de cumplir un segundo.');
      tl.to(1.2, { r: 3.25 });
      tl.to(1.6, { r: 3.6, colapso: 1 });
      tl.label('nuestra').caption(3.0, 'La nuestra', 'Y en esta, por un margen finísimo, las leyes permiten átomos, estrellas y química. Aquí estás tú.');
      tl.to(3.0, { r: 4.6 });
      tl.label('paisaje').caption(3.6, 'El paisaje', 'La teoría de cuerdas admite unas 10⁵⁰⁰ recetas distintas. Casi ninguna da un universo donde alguien pueda preguntarse esto.');
      tl.to(1.8, { r: 5, fuera: 1, cuenta: 1 });
      tl.to(1.8, { cuenta: 2 });
    }
    if (estilo === 0) {
      const b = materiaBuilder(77);
      const r = b.r;
      DESTINOS.forEach((c, i) => burbujas.push({ c, R: [6, 6.5, 5.5, 7][i], t0: (viaje ? [0.15, 0.25, 0.35, -1] : [0.05, 0.12, 0.2, 0.3])[i], tinte: TINTES[i] }));
      for (let i = 0; i < 44; i++) {
        const c = V((r() - 0.5) * 90, (r() - 0.5) * 44, 20 - r() * 120);
        if (DESTINOS.some((d) => d.distanceTo(c) < 14) || Math.abs(c.x) < 6) continue;
        burbujas.push({ c, R: 3 + r() * 7, t0: r() * 0.75, tinte: new THREE.Color().setHSL(r(), 0.55, 0.62) });
      }
      // One sphere of wall, shared by every bubble (each its own size and tint).
      const wb = materiaBuilder(5);
      const N = 2600;
      for (let i = 0; i < N; i++) {
        const y = 1 - ((i + 0.5) / N) * 2;
        const q = Math.sqrt(1 - y * y);
        const a = i * 2.39996;
        wb.push(Math.cos(a) * q, y, Math.sin(a) * q, new THREE.Color(1, 1, 1), 0.07, 1);
      }
      const pared = materia(wb.data(), {
        pre: /* glsl */ `uniform vec3 uTinte; uniform float uOn;`,
        move: /* glsl */ `
          em *= uTinte * uOn * (0.55 + 0.45 * sin(uTime * 0.8 + seed * 40.0));
          fuente = 0.6;`,
        uniforms: { uTinte: { value: new THREE.Color() }, uOn: { value: 0 } },
      });
      pared.u.uSpread.value = 0;
      const mat = pared.points.material as THREE.ShaderMaterial;
      for (const [i, bb] of burbujas.entries()) {
        const m = i === 0 ? mat : mat.clone();
        const pts = i === 0 ? pared.points : new THREE.Points(pared.points.geometry, m);
        pts.frustumCulled = false;
        pts.position.copy(bb.c);
        (m.uniforms.uTinte.value as THREE.Color).copy(bb.tinte);
        root.add(pts);
        conchas.push({ points: pts, u: m.uniforms as Nube['u'] });
      }
      // What is inside the four.
      const dentro = (i: number) => {
        const g = new THREE.Group();
        g.position.copy(DESTINOS[i]);
        root.add(g);
        const ib = materiaBuilder(100 + i);
        if (i === 0) {
          // No nuclei: an even fog.
          for (let k = 0; k < 9000; k++) {
            const [x, y, z] = ib.onSphere();
            const q = Math.cbrt(ib.r()) * 0.95;
            ib.push(x * q, y * q, z * q, new THREE.Color(0.55, 0.62, 0.8), 0.012, 0.35);
          }
        } else if (i === 1) {
          // Black holes: hot rings round dark middles.
          for (let h = 0; h < 26; h++) {
            const [x, y, z] = ib.onSphere();
            const c = V(x, y, z).multiplyScalar(Math.cbrt(ib.r()) * 0.85);
            const n = V(ib.r() - 0.5, ib.r() - 0.5, ib.r() - 0.5).normalize();
            const u = V(1, 0, 0).cross(n).normalize();
            const w = n.clone().cross(u);
            const R = 0.03 + ib.r() * 0.04;
            for (let k = 0; k < 260; k++) {
              const a = ib.r() * Math.PI * 2;
              const rr = R * (1 + ib.r() * 1.4);
              const q = c.clone().addScaledVector(u, Math.cos(a) * rr).addScaledVector(w, Math.sin(a) * rr);
              const t = 1 - (rr / R - 1) / 1.4;
              ib.push(q.x, q.y, q.z, new THREE.Color(1, 0.45 + 0.4 * t, 0.2 + 0.5 * t * t), 0.008, 0.5 + 0.9 * t);
            }
          }
        } else if (i === 2) {
          for (let k = 0; k < 8000; k++) {
            const [x, y, z] = ib.onSphere();
            const q = Math.cbrt(ib.r()) * 0.95;
            ib.push(x * q, y * q, z * q, new THREE.Color(1, 0.6, 0.85), 0.012, 0.5);
          }
        }
        let n: Nube;
        if (i === 3) {
          const red = redCosmica(1987);
          // The knot the camera goes down to at the end (act IV starts at a black hole).
          const k = red.nodos.reduce((m, n) => (n.distanceTo(V(0.25, 0.1, 0.55)) < m.distanceTo(V(0.25, 0.1, 0.55)) ? n : m), red.nodos[0]);
          nudo = DESTINOS[3].clone().addScaledVector(k, 7);
          n = materia(red.data, { move: 'fuente = 0.6;' });
        } else if (i === 2) {
          n = materia(ib.data(), {
            pre: /* glsl */ `uniform float uColapso;`,
            move: /* glsl */ `
              float c = uColapso;
              p *= max(1.0 - c, 0.0) * (1.0 - c) + 0.002;
              em *= (1.0 + 2.5 * c * c * step(c, 0.97)) * (1.0 - 0.7 * c);
              em *= 1.0 - smoothstep(0.97, 1.0, c);
              fuente = 0.8;`,
            uniforms: { uColapso: { value: 0 } },
          });
        } else n = materia(ib.data(), { move: 'fuente = 0.6;' });
        add(n, g);
        especiales.push({ nube: n, grupo: g });
      };
      for (let i = 0; i < 4; i++) dentro(i);
      // The way: from the vacuum to each bubble, in, out to the next, and far out at the end.
      const P: THREE.Vector3[] = [V(0, 3, 34)];
      const L: THREE.Vector3[] = [V(0, 0, -20)];
      if (viaje) {
        // Ours, framed as act II leaves its ball; back a little; into the fog, the holes, the brief
        // one; far out over them all; home; down into ours, to a bright knot.
        const [A, B, C, D] = DESTINOS;
        P.length = 0;
        L.length = 0;
        P.push(D.clone().add(V(0, 0.6, 54)), D.clone().add(V(12, 7, 70)));
        L.push(D.clone(), D.clone().add(V(10, 0, -30)));
        for (const d of [A, B, C]) {
          P.push(d.clone().add(V(-6, 2, 14)), d.clone().add(V(0.4, 0.2, 0.8)));
          L.push(d.clone(), d.clone().add(V(0, 0, -4)));
        }
        P.push(V(25, 30, 30), D.clone().add(V(-10, 4, 18)));
        L.push(V(0, 0, -35), D.clone());
        const dir = nudo.clone().sub(D).normalize();
        P.push(D.clone().lerp(nudo, 0.5).add(V(0.6, 0.5, 1.2)), nudo.clone().addScaledVector(dir, 1.1));
        L.push(nudo.clone(), nudo.clone());
      }
      for (const d of viaje ? [] : DESTINOS) {
        P.push(d.clone().add(V(-6, 2, 14)));
        L.push(d.clone());
        P.push(d.clone().add(V(0.4, 0.2, 0.8)));
        L.push(d.clone().add(V(0, 0, -4)));
      }
      P.push(V(30, 40, 90));
      L.push(V(0, 0, -40));
      ruta = new THREE.CatmullRomCurve3(P, false, 'centripetal');
      miradas = new THREE.CatmullRomCurve3(L, false, 'centripetal');
    }

    // ================================================================ way 2
    let nuestro: Nube | null = null;
    if (estilo === 1) {
      tl.set({ grav: 0, nuc: 0, lam: 0, ventana: 0, cuenta: 0, az: 0, vacio: 0 });
      tl.label('reglas').caption(2.6, 'Las perillas', 'Nuestro universo funciona con unas pocas perillas: la fuerza de la gravedad, la que une los núcleos, la de la energía oscura.');
      tl.to(2.6, { az: 0.5 });
      tl.label('grav').caption(3.0, 'Más gravedad', 'Si la gravedad fuera algo más fuerte, todo caería en agujeros negros antes de que se encendiera una estrella.');
      tl.to(1.2, { grav: 1, az: 0.7 });
      tl.to(0.8, { az: 0.8 });
      tl.to(1.0, { grav: 0, az: 0.9 });
      tl.label('nuc').caption(3.0, 'Sin núcleos', 'Si la fuerza que une los núcleos fuera algo más débil, no habría átomos: solo una niebla que nunca se junta.');
      tl.to(1.2, { nuc: 1, az: 1.1 });
      tl.to(0.8, { az: 1.2 });
      tl.to(1.0, { nuc: 0, az: 1.3 });
      tl.label('lam').caption(3.0, 'Más energía oscura', 'Con algo más de energía oscura, el espacio se estiraría tan rápido que nada alcanzaría a juntarse.');
      tl.to(1.2, { lam: 1, az: 1.5 });
      tl.to(0.8, { az: 1.6 });
      tl.to(1.0, { lam: 0, az: 1.7 });
      tl.label('ventana').caption(3.6, 'Una ventana estrecha', 'Las combinaciones que permiten estrellas y química caben en una ventana estrechísima. La teoría de cuerdas admite unas 10⁵⁰⁰.');
      tl.to(1.6, { ventana: 1, cuenta: 1, az: 1.9 });
      tl.to(2.0, { az: 2.1 });
      const red = redCosmica(1987, 110);
      nuestro = add(
        materia(red.data, {
          pre: /* glsl */ `attribute vec3 aAzar; uniform float uGrav, uNuc, uLam;`,
          move: /* glsl */ `
            vec3 kn = aFrom;
            vec3 dk = p - kn;
            float g = smoothstep(0.0, 1.0, uGrav);
            // Gravity: matter falls to its knot; late, it circles there as a hot ring round a black hole.
            vec3 plano = vec3(dk.x, 0.0, dk.z) + vec3(1e-4, 0.0, 0.0);
            vec3 anillo = kn + normalize(plano) * (0.018 + 0.02 * fract(seed * 7.3));
            p = mix(p, mix(kn + dk * 0.15, anillo, smoothstep(0.55, 1.0, g)), g);
            em = mix(em, vec3(1.0, 0.5, 0.18) * (0.8 + 1.2 * fract(seed * 3.1)), smoothstep(0.55, 1.0, g));
            // No nuclei: everything spreads into an even, dim fog.
            float n = smoothstep(0.0, 1.0, uNuc);
            p = mix(p, aAzar, n);
            em = mix(em, vec3(0.45, 0.5, 0.65) * 0.3, n);
            // Dark energy: space stretches and the matter thins out to nothing.
            float sx = exp(uLam * 1.6);
            p *= sx;
            em /= sx * sx;
            fuente = 0.6;`,
          uniforms: { uGrav: { value: 0 }, uNuc: { value: 0 }, uLam: { value: 0 } },
          extra: { aAzar: [red.azar, 3] },
        }),
      );
    }

    const cuentaDe = (p: number): Cuenta => {
      const c = tl.get('cuenta', p);
      if (viaje && p >= tl.at('aqui')) return { pisos: ['1'], linea: 'uno que permite mirar', h: 1 };
      if (viaje && c > 0.01) {
        const h = lerp(slog(burbujas.length), h10(500), ease(0, 1, c));
        return { pisos: deH(h), linea: 'recetas posibles', h };
      }
      if (estilo === 0 && c < 0.01) {
        const n = Math.max(1, Math.round(burbujas.length * ease(0, 1, tl.get('infla', p))));
        return { pisos: [String(n)], linea: n === 1 ? 'un universo' : 'universos burbuja a la vista', h: slog(n) };
      }
      if (estilo === 1 && c < 0.01) return { pisos: ['1'], linea: 'un universo · el nuestro', h: 1 };
      if (c <= 1) {
        const h = lerp(estilo === 0 ? slog(burbujas.length) : 1, h10(500), ease(0, 1, c));
        return { pisos: deH(h), linea: 'recetas de leyes posibles · teoría de cuerdas', h };
      }
      const h = lerp(h10(500), 3 + slog(7), ease(1, 2, c));
      return { pisos: c > 1.98 ? ['10', '10', '10', '7'] : deH(h), linea: 'universos distintos · inflación eterna (estimación)', h };
    };

    const tmp = V();
    return {
      tl,
      entrada: { pos: DESTINOS[3].clone(), escala: 7 },
      salida: { pos: nudo.clone(), escala: 0.4 },
      cuenta: cuentaDe,
      rotulo(p): Rotulo | null {
        const c = tl.captionAt(p);
        return c ? { capitulo: viaje ? 'III · ¿Por qué este universo?' : CAP, name: c.name, fact: c.fact } : null;
      },
      update(f: Frame) {
        const p = f.p;
        camera.near = 1e-3;
        camera.far = 1e4;
        camera.fov = 50;
        fondo.u.uVacio.value = tl.get('vacio', p);
        if (estilo === 0 && ruta && miradas) {
          const infla = tl.get('infla', p);
          for (const [i, bb] of burbujas.entries()) {
            const k = ease(bb.t0, bb.t0 + 0.5, infla);
            const s = bb.R * Math.max(k, 0.001);
            conchas[i].points.scale.setScalar(s);
            const sale = viaje ? 1 - ease(tl.at('puente'), tl.at('puente') + 2.2, p) : 1;
            conchas[i].u.uOn.value = k * (i < 4 ? 0.8 : 0.45) * sale;
            conchas[i].u.uFocal.value = f.focal;
            conchas[i].u.uMinPx.value = 1.6 * f.dpr;
            conchas[i].u.uMaxPx.value = 24 * f.dpr;
            conchas[i].u.uTime.value = f.time;
            conchas[i].points.visible = k > 0.001;
          }
          for (const [i, e] of especiales.entries()) {
            const k = ease(burbujas[i].t0 + 0.2, burbujas[i].t0 + 0.6, infla);
            e.grupo.scale.setScalar(burbujas[i].R * Math.max(k, 0.001));
            e.nube.u.uGain.value = k;
          }
          (especiales[2].nube.u.uColapso as THREE.IUniform).value = tl.get('colapso', p);
          const u = viaje ? Math.min(1, tl.get('r', p) / (ruta.points.length - 1)) : Math.min(1, tl.get('r', p) / 5);
          const pos = ruta.getPoint(u);
          const look = miradas.getPoint(Math.min(1, u + 0.01));
          mirar(camera, pos, look);
        } else if (estilo === 1 && nuestro) {
          nuestro.u.uGrav.value = tl.get('grav', p);
          nuestro.u.uNuc.value = tl.get('nuc', p);
          nuestro.u.uLam.value = tl.get('lam', p);
          const a = tl.get('az', p) + f.time * 0.01;
          mirar(camera, V(Math.sin(a) * 2.6, 0.7, Math.cos(a) * 2.6), V(0, 0, 0));
        }
        for (const n of nubes) enfocar(n, f.focal, f.dpr, f.time);
        void tmp;
      },
      placa(g, f) {
        const u = f.u;
        if (estilo === 1) {
          // Three dials, top centre: the needle where the universe is; the narrow window that allows us.
          const vals = [tl.get('grav', f.p), tl.get('nuc', f.p), tl.get('lam', f.p)];
          const names = ['gravedad', 'fuerza nuclear', 'energía oscura'];
          const win = tl.get('ventana', f.p);
          for (let i = 0; i < 3; i++) {
            const cx = f.W / 2 + (i - 1) * 150 * u;
            const cy = 120 * u;
            const R = 44 * u;
            g.save();
            g.lineWidth = Math.max(1, 1.2 * u);
            g.strokeStyle = ink(0.35);
            g.beginPath();
            g.arc(cx, cy, R, Math.PI, 2 * Math.PI);
            g.stroke();
            // The window that allows stars and chemistry (narrow; it lights up at the end).
            const w0 = Math.PI * 1.47;
            const w1 = Math.PI * 1.53;
            g.strokeStyle = `rgba(115,255,217,${0.35 + 0.65 * win})`;
            g.lineWidth = Math.max(1, (2 + 2 * win) * u);
            g.beginPath();
            g.arc(cx, cy, R, w0, w1);
            g.stroke();
            const ang = Math.PI * 1.5 + vals[i] * Math.PI * 0.42;
            g.strokeStyle = vals[i] > 0.05 ? 'rgba(255,140,110,0.95)' : ink(0.9);
            g.lineWidth = Math.max(1, 1.6 * u);
            g.beginPath();
            g.moveTo(cx, cy);
            g.lineTo(cx + Math.cos(ang) * (R - 6 * u), cy + Math.sin(ang) * (R - 6 * u));
            g.stroke();
            g.font = FONT.mono(9.5 * u);
            g.letterSpacing = `${1 * u}px`;
            g.textAlign = 'center';
            g.fillStyle = ink(0.7);
            g.fillText(names[i].toUpperCase(), cx, cy + 18 * u);
            g.restore();
          }
          texto(g, u, f.W / 2, 170 * u, 'en verde: lo que permite estrellas y química', '#73ffd9', ease(tl.at('ventana') + 0.4, tl.at('ventana') + 1.2, f.p), 10, 'center');
        }
        void VIOLETA;
        void ORO;
      },
      dispose() {},
    };
  },
};
