import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder, type Nube } from '../src/engine/materia';
import { lerp } from '../src/engine/math';
import { deH, h1010, ink, proyectar, slog, texto, type Cuenta, type Rotulo } from './placa';
import { aqui, ease, LUZ_TIERRA, logLerp, mapaTierra, mirar, tierraDatos, TU, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * Study · act II, «Todas tus ramas». In the many-worlds reading of quantum mechanics (Everett,
 * 1957) the universe never chooses: when something quantum is decided (an atom decays or not), it
 * goes on both ways, and each branch holds its own you, who feels like the only one. The count:
 * branches, doubling at every split (2ⁿ).
 *
 * Three ways:
 * 1 · Por dentro: the camera rides the tip of your branch. At every split the other way peels off
 *     and splits again; the splits come faster and faster. At the end the camera turns round and
 *     sees the tree behind it.
 * 2 · El árbol: from outside. From one point (you, now) a tree of light grows in every direction,
 *     each branch drifting to its own colour; your path stays teal.
 * 3 · Tus Tierras: the Earth itself splits: one, two, four… copies, each with a teal point where you
 *     are (Santiago), laid out as an H-tree that fills the plane; far out they are a carpet of
 *     thousands of Earths.
 */

// ---------------------------------------------------------------- the tree

interface Rama {
  a: THREE.Vector3;
  c: THREE.Vector3;
  b: THREE.Vector3;
  t0: number;
  t1: number;
  gen: number;
  tu: boolean;
}

const bez = (r: Rama, s: number, out = V()) => {
  const u = 1 - s;
  return out.set(0, 0, 0).addScaledVector(r.a, u * u).addScaledVector(r.c, 2 * u * s).addScaledVector(r.b, s * s);
};

/** A branching tree: every branch splits in two, turning ±`ang` about a random axis; lengths shrink by `k`. */
function arbol(seed: number, G: number, ang: number, k: number, L0 = 1, sube = 0) {
  const b = materiaBuilder(seed);
  const r = b.r;
  const ramas: Rama[] = [];
  const hsl = { h: 0, s: 0, l: 0 };
  const col = new THREE.Color();
  const tuIdx: [number, number][] = [];
  const tuPick: number[] = [];
  for (let g = 0; g < G; g++) tuPick.push(r() < 0.5 ? 0 : 1);
  const grow = (a: THREE.Vector3, dPrev: THREE.Vector3, d: THREE.Vector3, t0: number, gen: number, tu: boolean, hue: number) => {
    const L = Math.pow(k, gen) * (gen === 0 ? L0 : 0.82 + 0.36 * r());
    const c = a.clone().addScaledVector(dPrev, L * 0.5);
    const end = c.clone().addScaledVector(d, L * 0.5);
    const rama: Rama = { a, c, b: end, t0, t1: t0 + L, gen, tu };
    ramas.push(rama);
    // Its points: fewer and finer the deeper it is.
    const n = Math.max(8, Math.round(L * 430));
    col.setHSL(hue, 0.55, 0.62);
    col.getHSL(hsl);
    const sz = 0.0055 * Math.pow(0.86, gen);
    const p = V();
    const i0 = b.count;
    for (let i = 0; i < n; i++) {
      const s = (i + r()) / n;
      bez(rama, s, p);
      const j = sz * 0.6;
      b.push(p.x + (r() - 0.5) * j, p.y + (r() - 0.5) * j, p.z + (r() - 0.5) * j, tu ? TU : col, sz, 0.9, { delay: t0 + L * s, kind: gen });
    }
    if (tu) tuIdx.push([i0, b.count]);
    if (gen + 1 >= G) return;
    // Split: two new directions, symmetric about this one, around a random perpendicular axis.
    const axis = V(r() - 0.5, r() - 0.5, r() - 0.5).cross(d).normalize();
    const pick = tuPick[gen + 1];
    for (const sgn of [-1, 1]) {
      const nd = d.clone().applyAxisAngle(axis, sgn * ang * (0.8 + 0.4 * r())).addScaledVector(d0, sube).normalize();
      const child = sgn === -1 ? 0 : 1;
      grow(end.clone(), d, nd, t0 + L, gen + 1, tu && child === pick, hue + (r() - 0.5) * 0.07);
    }
  };
  const d0 = V(0, 0, -1);
  grow(V(0, 0, 0), d0.clone(), d0.clone(), 0, 0, true, 0.73);
  const data = b.data();
  const tu = new Float32Array(data.aKind.length);
  for (const [a, z] of tuIdx) tu.fill(1, a, z);
  const splits = ramas.filter((x) => x.gen + 1 < G).map((x) => x.t1).sort((x, y) => x - y);
  const camino = ramas.filter((x) => x.tu).sort((x, y) => x.t0 - y.t0);
  const fin = Math.max(...ramas.map((x) => x.t1));
  // The sphere that holds the whole tree, root and trunk included (its box's middle, out to the
  // farthest point): the bubble of act III closes round it.
  const box = new THREE.Box3();
  for (const x of ramas) box.expandByPoint(x.a).expandByPoint(x.b);
  const centro = box.getCenter(V());
  const radio = Math.max(...ramas.flatMap((x) => [x.a.distanceTo(centro), x.b.distanceTo(centro)]));
  const zmin = Math.min(...ramas.map((x) => x.b.z));
  // Seen from the side the crown is wider one way than the other: its widest direction (the main axis
  // of the branch ends round the trunk), and how wide it is that way.
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const x of ramas) {
    const dx = x.b.x - centro.x;
    const dy = x.b.y - centro.y;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  const angulo = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const eje = V(Math.cos(angulo), Math.sin(angulo), 0);
  const ancho = 2 * Math.max(...ramas.map((x) => Math.abs((x.b.x - centro.x) * eje.x + (x.b.y - centro.y) * eje.y)));
  return { data, tu, ramas, splits, camino, fin, centro, radio, zmin, ancho, angulo };
}

const ARBOL_PRE = /* glsl */ `
  attribute float aTu;
  uniform float uT, uTuGlow, uMundos, uViejo;
`;
const ARBOL_MOVE = /* glsl */ `
  float age = uT - aDelay;
  float vis = smoothstep(0.0, 0.006, age);
  float tip = exp(-max(age, 0.0) / 0.035);
  em *= vis * (0.85 + 3.0 * tip) * mix(1.0, uViejo, smoothstep(0.15, 2.2, age));
  sz *= 1.0 + 1.2 * tip;
  em = mix(em, vec3(0.45, 1.0, 0.85) * (0.45 + 1.4 * tip) * vis, aTu * uTuGlow);
  fuente = 0.6;
`;

// ---------------------------------------------------------------- the Earths (way 3)

const G3 = 12;
/** The Earths' turn: Santiago towards the camera (+z, a little below), and the Sun from that side. */
const GIRO = { x: 0.25, y: -0.34 };
const SOL3 = new THREE.Vector3(0.55, -0.15, 0.82).normalize();
interface Nodo {
  pos: THREE.Vector3;
  padre: THREE.Vector3;
  gen: number;
}
/** H-tree: each split moves the copies ±L along x, then y, then x…; L shrinks by √2 per generation. */
function hTree(S: number) {
  const gens: Nodo[][] = [[{ pos: V(), padre: V(), gen: 0 }]];
  for (let g = 1; g <= G3; g++) {
    const L = S / Math.pow(Math.SQRT2, g - 1);
    const axis = g % 2 === 1 ? V(1, 0, 0) : V(0, 1, 0);
    const prev = gens[g - 1];
    const next: Nodo[] = [];
    for (const n of prev) for (const s of [-1, 1]) next.push({ pos: n.pos.clone().addScaledVector(axis, s * L), padre: n.pos.clone(), gen: g });
    gens.push(next);
  }
  return gens;
}

// ---------------------------------------------------------------- the scene

const CAP = 'II · Todas tus ramas';

export const ramas: Escena = {
  id: 'ramas',
  nombre: 'Todas tus ramas',
  estilos: [
    { key: '1', nombre: 'Por dentro', nota: 'La cámara viaja en la punta de tu rama; en cada división la otra se aparta. Al final mira atrás.' },
    { key: '2', nombre: 'El árbol', nota: 'Desde afuera: de un punto (tú, ahora) crece un árbol de luz; tu camino queda en verde.' },
    { key: '3', nombre: 'Tus Tierras', nota: 'La Tierra misma se divide: una, dos, cuatro… cada una con un punto verde donde estás tú.' },
    { key: '4', nombre: 'Elegida', nota: 'La que eligió Diego: por dentro (1), más larga, en el árbol curvo (2). Al final mira atrás.' },
  ],
  montar(stage, estilo, viaje = false): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = estilo === 2 ? 0.4 : 0.6;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = estilo === 2 ? 0.55 : 0.3;
    const tl = new Timeline();
    /** Way 4 (chosen): riding inside (way 1), longer, through the curved tree (way 2). */
    const ride = estilo === 0 || estilo === 3;
    const curvo = estilo === 1 || estilo === 3;

    // ---- The choreography (beats). Track `t`: growth time of the tree (ways 1, 2) or generation (way 3).
    tl.set({ t: estilo === 2 ? 0 : viaje ? 0.015 : 0.14, out: 0, mundos: 0, mira: 1, burbuja: 0, lejos: 0 });
    if (viaje) {
      // GUION.md 10–13 and the bridge to act III. It starts on the point act I ends on: the camera
      // looks straight at the tip, then settles behind it.
      tl.set({ mira: 0 });
      tl.label('uno').caption(3.4, 'Un hilo', 'Tu vida parece un hilo: una sola historia, la que recuerdas.');
      tl.to(1.4, { mira: 1, t: 0.22 });
      tl.to(2.0, { t: 0.72 });
      tl.label('elige').caption(3.8, 'El universo no elige', 'Pero cuando algo diminuto se decide, un átomo que se desintegra o no, puede que el universo no elija. Que siga por los dos caminos.');
      tl.to(3.8, { t: 1.45 });
      tl.label('vidas').caption(6.0, 'Todas tus vidas', 'Pasa en cada átomo, a cada instante. En cada rama hay un tú, y cada uno siente que la suya es la única.');
      tl.to(6.0, { t: 3.95 });
      tl.label('atras').caption(4.4, 'Mirar atrás', 'Cada vida que pudiste vivir estaría ahí, las que elegiste y las que no. Esta es solo una.');
      tl.to(1.8, { t: 4.2, out: 0.6 });
      tl.to(2.6, { t: 4.4, out: 1, mundos: 1 });
      tl.label('puente').caption(2.8, '', 'Y todo ese árbol cabe en un solo universo.');
      tl.to(2.8, { lejos: 1, burbuja: 1 });
    } else if (estilo === 3) {
      tl.label('uno').caption(2.8, 'Una historia', 'Hasta ahora tu vida es un hilo: una sola historia, la que recuerdas.');
      tl.to(2.8, { t: 0.72 });
      tl.label('elige').caption(3.2, 'El universo no elige', 'Pero cuando un átomo decae o no decae, el universo no se queda con uno de los dos caminos: sigue por ambos.');
      tl.to(3.2, { t: 1.45 });
      tl.label('vidas').caption(6.0, 'Todas tus vidas', 'Pasa sin parar, en cada átomo. Cada rama tiene su propio tú, y cada uno se siente el único.');
      tl.to(6.0, { t: 3.95 });
      tl.label('atras').caption(4.4, 'Mirar atrás', 'Si es así, cada vida que pudiste vivir existe en alguna rama. Esta es solo una.');
      tl.to(1.8, { t: 4.2, out: 0.6 });
      tl.to(2.6, { t: 4.4, out: 1, mundos: 1 });
    } else {
      tl.label('uno').caption(2.2, 'Una historia', 'Hasta ahora tu vida es un hilo: una sola historia, la que recuerdas.');
      tl.to(2.2, { t: estilo === 2 ? 0.0 : estilo === 1 ? 0.42 : 0.9 });
      tl.label('elige').caption(2.4, 'El universo no elige', 'Pero cuando un átomo decae o no decae, el universo no se queda con uno de los dos caminos: sigue por ambos.');
      tl.to(2.4, { t: estilo === 2 ? 2 : estilo === 1 ? 1.15 : 1.6 });
      tl.label('vidas').caption(3.4, 'Todas tus vidas', 'Pasa sin parar, en cada átomo. Cada rama tiene su propio tú, y cada uno se siente el único.');
      tl.to(3.4, { t: estilo === 2 ? 9 : estilo === 1 ? 3.6 : 4.3 });
      tl.label('atras').caption(3.2, estilo === 0 ? 'Mirar atrás' : estilo === 1 ? 'El árbol' : 'Una entre todas', 'Si es así, cada vida que pudiste vivir existe en alguna rama. Esta es solo una.');
      tl.to(1.4, { t: estilo === 2 ? 11 : estilo === 1 ? 4.2 : 4.75, out: 0.6 });
      tl.to(1.8, { t: estilo === 2 ? 12 : estilo === 1 ? 4.5 : 4.95, out: 1, mundos: 1 });
    }

    let burbuja: Nube | null = null;
    let yo: Nube | null = null;
    if (viaje) {
      const yb = materiaBuilder(45);
      yb.push(0, 0, 0, TU, 0.035, 3.4);
      yo = materia(yb.data(), { move: 'fuente = 1.0;' });
      yo.u.uSpread.value = 0;
      root.add(yo.points);
    }
    // ---- Ways 1 and 2: the tree.
    let nube: Nube | null = null;
    let tree: ReturnType<typeof arbol> | null = null;
    // ---- Way 3: the Earths.
    const tierras: { points: THREE.Points; u: Record<string, THREE.IUniform> }[] = [];
    let puntos3: Nube | null = null;
    let gens3: Nodo[][] = [];
    const S3 = 40;
    let listo: Promise<unknown> = Promise.resolve();

    if (estilo !== 2) {
      tree = curvo ? arbol(31, 12, 0.62, 0.79, ride ? 0.8 : 0.5, estilo === 3 ? 0.22 : 0) : arbol(1957, 12, 0.34, 0.8);
      nube = materia(tree.data, {
        pre: ARBOL_PRE,
        move: ARBOL_MOVE,
        uniforms: { uT: { value: 0 }, uTuGlow: { value: 1 }, uMundos: { value: 0 }, uViejo: { value: 0.4 } },
        extra: { aTu: [tree.tu, 1] },
      });
      nube.u.uSpread.value = 0;
      root.add(nube.points);
      if (viaje) {
        const bb = materiaBuilder(44);
        for (let i = 0; i < 9000; i++) {
          const [x, y, z] = bb.onSphere();
          const r = tree.radio * 1.08;
          bb.push(tree.centro.x + x * r, tree.centro.y + y * r, tree.centro.z + z * r, new THREE.Color(0.79, 0.7, 1.0), 0.03, 0.9);
        }
        burbuja = materia(bb.data(), { pre: `uniform float uOn;`, move: `em *= uOn; fuente = 0.7;`, uniforms: { uOn: { value: 0 } } });
        burbuja.u.uSpread.value = 0;
        root.add(burbuja.points);
      }
    } else {
      gens3 = hTree(S3);
      listo = mapaTierra().then((img) => {
        const d = tierraDatos(img, 26000);
        // You: a teal point in Santiago (kind 2, unlit).
        const b = materiaBuilder(3);
        const q = aqui().multiplyScalar(1.004);
        b.push(q.x, q.y, q.z, TU, 0.035, 3.2, { kind: 2 });
        const t = b.data();
        const join = <K extends keyof typeof d>(k: K) => {
          const out = new Float32Array(d[k].length + t[k].length);
          out.set(d[k]);
          out.set(t[k], d[k].length);
          return out;
        };
        const all = { position: join('position'), aFrom: join('aFrom'), color: join('color'), aInk: join('aInk'), size: join('size'), seed: join('seed'), aDelay: join('aDelay'), aKind: join('aKind') };
        const base = materia(all, {
          pre: LUZ_TIERRA + /* glsl */ `uniform vec3 uSol;`,
          move: /* glsl */ `
            if (aKind > 1.5) { fuente = 1.0; }
            else { em *= luzTierra(normalize(position), uSol); fuente = 0.3; }`,
          uniforms: { uSol: { value: V(1, 0.2, 0.4).normalize() } },
        });
        base.u.uSpread.value = 0;
        const mat = base.points.material as THREE.ShaderMaterial;
        for (let i = 0; i < 32; i++) {
          const m = i === 0 ? mat : mat.clone();
          const pts = i === 0 ? base.points : new THREE.Points(base.points.geometry, m);
          pts.frustumCulled = false;
          root.add(pts);
          tierras.push({ points: pts, u: m.uniforms });
        }
        // Far generations: one point per Earth.
        const bd = materiaBuilder(9);
        for (let g = 6; g <= G3; g++) {
          const sz = Math.min(2.0, 0.5 * (S3 / Math.pow(Math.SQRT2, g - 1)));
          for (const n of gens3[g]) bd.push(n.pos.x, n.pos.y, n.pos.z, new THREE.Color(0.32, 0.5, 0.95), sz, 1.7, { from: [n.padre.x, n.padre.y, n.padre.z], kind: g });
        }
        puntos3 = materia(bd.data(), {
          pre: /* glsl */ `uniform float uG;`,
          move: /* glsl */ `
            float n = aKind;
            float kg = clamp(uG - (n - 1.0), 0.0, 1.0);
            p = mix(aFrom, position, kg * kg * (3.0 - 2.0 * kg));
            float on = step(n - 1.0, uG) * (1.0 - step(n, uG - 1e-4));
            if (n >= ${G3}.0) on = step(n - 1.0, uG);
            em *= on;
            fuente = 1.0;`,
          uniforms: { uG: { value: 0 } },
        });
        puntos3.u.uSpread.value = 0;
        root.add(puntos3.points);
      });
    }

    /** Your tip at tree time t: position and direction. */
    const tip = (t: number, pos: THREE.Vector3, dir: THREE.Vector3) => {
      const c = tree!.camino;
      const r = c.find((x) => t >= x.t0 && t <= x.t1) ?? (t < c[0].t0 ? c[0] : c[c.length - 1]);
      const s = Math.min(1, Math.max(0, (t - r.t0) / (r.t1 - r.t0)));
      bez(r, s, pos);
      const q = bez(r, Math.min(1, s + 0.02), V());
      const q0 = bez(r, Math.max(0, s - 0.02), V());
      dir.copy(q).sub(q0).normalize();
      return r.t1 - r.t0;
    };

    /** Branches alive at tree time t. */
    const vivas = (t: number) => {
      if (!tree) return 1;
      let n = 0;
      while (n < tree.splits.length && tree.splits[n] <= t) n++;
      return 1 + n;
    };

    const cuentaDe = (p: number): Cuenta => {
      if (viaje && p < tl.at('elige') + 0.6) return { pisos: ['1'], linea: 'vida', h: 1 };
      const t = tl.get('t', p);
      const out = tl.get('out', p);
      const n = estilo === 2 ? Math.pow(2, Math.ceil(t - 0.02)) : vivas(t);
      // Beyond the drawn tree: all the branches of one second of the universe (rough estimate:
      // ~10⁸⁰ particles × ~10¹⁰ decoherences per second each → 2^(10⁹⁰) ≈ 10^10^89.5).
      const big = ease(0.55, 1, out);
      const h = lerp(slog(n), h1010(89.48), big);
      const linea = viaje ? (big > 0.97 ? 'tus vidas en un segundo · estimación' : 'tus vidas') : big > 0.97 ? 'ramas en un segundo del universo · estimación gruesa' : estilo === 2 ? 'Tierras · cada una con un tú' : 'ramas · cada una con un tú';
      return { pisos: deH(h), linea, h };
    };

    const tmpP = V();
    const tmpD = V();
    return {
      tl,
      listo,
      entrada: { pos: V(0, 0, 0), escala: 1 },
      salida: tree ? { pos: tree.centro.clone(), escala: tree.radio * 1.08 } : undefined,
      cuenta: cuentaDe,
      rotulo(p): Rotulo | null {
        const c = tl.captionAt(p);
        return c ? { capitulo: viaje ? 'II · ¿Tu vida es una sola?' : CAP, name: c.name, fact: c.fact } : null;
      },
      update(f: Frame) {
        const t = tl.get('t', f.p);
        const out = tl.get('out', f.p);
        camera.fov = ride ? lerp(58, 44, ease(0, 1, out)) : 44;
        if (estilo !== 2 && nube && tree) {
          nube.u.uT.value = t;
          nube.u.uViejo.value = lerp(0.42, ride ? 0.55 : 0.75, out);
          if (ride) {
            // Riding the tip, a little behind and above; the offsets shrink with the branch.
            const L = tip(t, tmpP, tmpD);
            const sc = Math.max(0.12, Math.pow(L, 0.7)) * 2.6;
            const side = V(0, 1, 0).cross(tmpD).normalize();
            const up = tmpD.clone().cross(side).normalize();
            const ride = tmpP.clone().addScaledVector(tmpD, -0.55 * sc).addScaledVector(up, 0.2 * sc).addScaledVector(side, 0.12 * sc);
            const look = tmpP.clone().lerp(tmpP.clone().addScaledVector(tmpD, 0.6 * sc), ease(0, 1, tl.get('mira', f.p)));
            // Turning round: from behind the tip to out in front of the tree, looking back at it.
            const o = ease(0, 1, out);
            const centro = estilo === 0 ? V(0, 0, -2.2) : tree.centro.clone();
            const a = 0.6 + f.time * 0.02;
            // Facing the crown's widest side, swaying a little round it (never edge-on, where it looks thin).
            const la = tree.angulo + Math.PI / 2 + 0.3 * Math.sin(f.time * 0.05);
            const lado = V(Math.cos(la), Math.sin(la), 0);
            const th = Math.tan(THREE.MathUtils.degToRad(22));
            const alto = -tree.zmin;
            const objetivo = V(tree.centro.x, tree.centro.y, tree.zmin * 0.53);
            const dist = Math.max(alto / (2 * th), tree.ancho / (2 * th * camera.aspect)) * 1.32;
            const fuera = tmpP.clone().add(V(Math.sin(a) * 1.4, 0.7, -1.8)).lerp(objetivo.clone().addScaledVector(lado, dist), ease(0.4, 1, out));
            const pos = ride.lerp(fuera, o);
            const lj = ease(0, 1, tl.get('lejos', f.p));
            // Far off, the tree is a ball of light: dimmer, so it does not burn white.
            nube.u.uGain.value = lerp(1, 0.62, o) * (1 - 0.4 * lj);
            if (lj > 0) pos.lerp(centro.clone().addScaledVector(lado, tree.radio * 1.08 * 7.7), lj);
            const mira = look.lerp(objetivo, ease(0, 0.8, out)).lerp(centro, lj);
            mirar(camera, pos, mira, up.lerp(V(0, 0, -1), o).normalize());
            void centro;
            if (yo) {
              yo.points.position.copy(tmpP);
              yo.u.uGain.value = (1 + 0.22 * Math.sin(f.time * 1.5)) * (1 - ease(tl.at('uno') + 1.5, tl.at('elige') + 0.5, f.p));
              enfocar(yo, f.focal, f.dpr, f.time);
            }
            if (burbuja) {
              burbuja.u.uOn.value = ease(0.3, 1, tl.get('burbuja', f.p));
              enfocar(burbuja, f.focal, f.dpr, f.time);
            }
          } else {
            // Outside: from close to the root, out as the tree grows, slowly round it.
            const grow = Math.min(t, tree.fin);
            tip(t, tmpP, tmpD);
            const centro = tmpP.clone().multiplyScalar(lerp(0.75, 0.35, Math.min(1, grow / 2.5)));
            const d = logLerp(0.5, 3.0, Math.min(1, grow / 3.2)) * lerp(1, 1.5, out);
            const a = 1.2 + f.time * 0.03 + grow * 0.35;
            mirar(camera, centro.clone().add(V(Math.sin(a) * d, d * 0.35, Math.cos(a) * d)), centro);
          }
          enfocar(nube, f.focal, f.dpr, f.time);
          nube.u.uMaxPx.value = 7 * f.dpr;
        } else if (estilo === 2) {
          // The Earths: generation `t` (fractional: the copies sliding apart).
          const gc = Math.max(0, t);
          const nG = Math.ceil(gc - 1e-6);
          const k = 1 - (nG - gc);
          const kk = k * k * (3 - 2 * k);
          const spin = f.time * 0.03;
          for (const [i, e] of tierras.entries()) {
            const n = gens3[Math.min(nG, 5)]?.[i];
            e.points.visible = nG <= 5 && !!n;
            if (!n) continue;
            const pos = nG === 0 ? n.pos : n.padre.clone().lerp(n.pos, kk);
            e.points.position.copy(pos);
            e.points.rotation.set(GIRO.x, GIRO.y + spin, 0);
            (e.u.uSol.value as THREE.Vector3).copy(SOL3).applyQuaternion(e.points.quaternion.clone().invert());
            e.u.uFocal.value = f.focal;
            e.u.uMinPx.value = 1.6 * f.dpr;
            e.u.uMaxPx.value = 24 * f.dpr;
            e.u.uTime.value = f.time;
            e.u.uGain.value = 0.9;
          }
          if (puntos3) {
            puntos3.u.uG.value = gc;
            enfocar(puntos3, f.focal, f.dpr, f.time);
          }
          // Camera: framing all the copies of this generation (x grows on odd splits, y on even ones), tilted.
          let ex = 1.6;
          let ey = 1.6;
          for (let g = 1; g <= Math.min(G3, nG); g++) {
            const L = (S3 / Math.pow(Math.SQRT2, g - 1)) * (g === nG ? kk : 1);
            if (g % 2 === 1) ex += L;
            else ey += L;
          }
          const th = Math.tan(THREE.MathUtils.degToRad(22));
          // Late on, the carpet overflows the frame: it goes on past the edges.
          const d = Math.max(3.4, Math.max(ex / (th * camera.aspect), ey / th) * 1.08) * lerp(1, 0.5, ease(7, 12, gc));
          const a = -0.12 + f.time * 0.012;
          mirar(camera, V(Math.sin(a) * d * 0.5, -d * 0.4, Math.cos(a) * d), V(0, 0, 0));
        }
      },
      placa(g, f) {
        // A label on your tip (ways 1 and 2) and on the first Earth (way 3), only while it helps.
        const u = f.u;
        if (estilo !== 2 && tree) {
          const a = ease(0.3, 1.2, f.p) * (1 - ease(tl.at('elige') + 0.4, tl.at('elige') + 1.2, f.p));
          if (a > 0.01) {
            tip(tl.get('t', f.p), tmpP, tmpD);
            const s = proyectar(tmpP, camera, f.W, f.H);
            if (s.z < 1) texto(g, u, s.x + 16 * u, s.y - 16 * u, 'tú', '#73ffd9', a, 11);
          }
        }
        if (estilo === 2) {
          const a = ease(0.6, 1.4, f.p) * (1 - ease(tl.at('elige') - 0.2, tl.at('elige') + 0.3, f.p));
          if (a > 0.01) {
            const q = aqui().applyEuler(new THREE.Euler(GIRO.x, GIRO.y + f.time * 0.03, 0));
            const s = proyectar(q, camera, f.W, f.H);
            if (s.z < 1) texto(g, u, s.x + 14 * u, s.y - 14 * u, 'tú', '#73ffd9', a, 11);
          }
          const b = ease(tl.at('atras') + 1.2, tl.at('atras') + 2.2, f.p);
          texto(g, u, f.W / 2, f.H * 0.14, 'cada punto, una Tierra · en cada una, tú', ink(0.8), b, 11, 'center');
        }
      },
      dispose() {},
    };
  },
};
