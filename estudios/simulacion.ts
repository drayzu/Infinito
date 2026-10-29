import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder, type MateriaData, type Nube } from '../src/engine/materia';
import { lerp } from '../src/engine/math';
import { h10, ink, deH, proyectar, slog, texto, VIOLETA, type Cuenta, type Rotulo } from './placa';
import { aqui, ease, LUZ_TIERRA, logLerp, mapaTierra, mirar, tierraDatos, TU, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * Study · act VI, «¿Eres real?»: the simulation argument (Bostrom, 2003). Whatever follows exact
 * rules can be computed; a civilization like Destino's would have computing to spare (the light of
 * one star, 10⁴⁷–10⁴⁹ operations per second; a whole human history, 10³³–10³⁶ operations): it could
 * run some 10¹¹ human histories every second. Then simulated minds would far outnumber real ones,
 * and yours would most likely be one of them. An argument, not a proof.
 *
 * Three ways:
 * 1 · Pixelar: the Earth in points; its matter snaps to cells (each takes the map's colour at its
 *     centre), then every cell becomes a bit, on and off. The camera pulls back: the world of bits is
 *     one in a lattice of worlds being run, thousands of them. One is ours (teal).
 * 2 · Solo donde miras: a simulation would save by computing only what someone looks at. The Earth
 *     is detailed only around where the camera looks; that region follows the camera late, so what
 *     comes into view arrives as coarse bits and resolves. Turning round fast shows the side nobody
 *     looks at: a grid of bits waiting.
 * 3 · Muñecas: simulations inside simulations. Pulling back, the world of bits is one cell of a
 *     machine; the machine is matter, so it too is bits in a bigger one; and so on.
 */

// ---------------------------------------------------------------- the Earth that can be computed

const SIM_PRE = /* glsl */ `
  uniform vec3 uSol, uMira, uCam;
  uniform float uCelda, uCeldaFuera, uBits, uCono, uDetalle, uSem, uFrente;
  uniform sampler2D uMapa;
  float hh(float x) { return fract(sin(x * 127.1 + uSem * 31.7) * 43758.5453); }
  vec3 grado(vec3 c) {
    float l = dot(c, vec3(0.3, 0.59, 0.11));
    c = max(vec3(l) + (c - vec3(l)) * 0.6, vec3(0.0));
    return pow(c, vec3(1.3)) * vec3(0.9, 0.96, 1.04);
  }
` + LUZ_TIERRA;

const SIM_MOVE = /* glsl */ `
  vec3 nrm = normalize(position);
  float lat = aFrom.x;
  float lon = aFrom.y;
  // Computed here? (way 2: only around where someone looks; elsewhere, coarse bits).
  float calc = 1.0;
  float frente = 0.0;
  if (uDetalle > 0.0) {
    float c = dot(nrm, uMira);
    calc = smoothstep(uCono - 0.09, uCono + 0.02, c);
    float x = (c - uCono + 0.035) / 0.03;
    frente = exp(-x * x) * uFrente;
    calc = mix(1.0, calc, uDetalle);
  }
  float cel = mix(uCelda, uCeldaFuera, 1.0 - calc);
  float bits = max(uBits, 1.0 - calc);
  float cellId = seed * 9137.0;
  float borde = 1.0;
  if (cel > 0.0004) {
    // Tiles: every point takes the map's colour at its cell's centre; the cells' edges go dark.
    float fl = lat / cel;
    float la = (floor(fl) + 0.5) * cel;
    float cl = cel / max(cos(la), 0.2);
    float fo = lon / cl;
    float lo = (floor(fo) + 0.5) * cl;
    vec3 tc = texture2D(uMapa, vec2(lo / 6.2831853 + 0.5, 0.5 + la / 3.1415927)).rgb;
    float kc = smoothstep(0.0004, 0.006, cel);
    vec3 px = floor(grado(tc) * 7.0 + 0.5) / 7.0;
    em = mix(em, px, kc);
    cellId = floor(fl) * 131.7 + floor(fo) * 17.3;
    float e = min(min(fract(fl), 1.0 - fract(fl)), min(fract(fo), 1.0 - fract(fo)));
    borde = mix(1.0, 0.08 + 0.92 * smoothstep(0.05, 0.2, e), kc);
  }
  float luz = luzTierra(nrm, uSol);
  float on = step(0.5, hh(cellId + floor(uTime * 4.0 + hh(cellId * 1.3) * 7.0)));
  vec3 bitc = mix(vec3(0.4, 0.3, 0.85) * 0.06, vec3(0.75, 0.66, 1.0) * 0.5, on);
  em = mix(em * luz, bitc, bits) * borde;
  em += vec3(0.75, 0.6, 1.0) * frente * 0.45;
  // The far side is hidden by the planet (points do not test depth): a point on the unit sphere is
  // seen from uCam (the camera in the planet's frame) when n · cam ≥ 1.
  em *= smoothstep(0.96, 1.03, dot(normalize(position), uCam));
  fuente = 0.2;
`;

function tierraSim(d: MateriaData, tex: THREE.Texture) {
  const n = materia(d, {
    pre: SIM_PRE,
    move: SIM_MOVE,
    uniforms: {
      uSol: { value: V(0.6, 0.25, 0.75).normalize() },
      uMira: { value: V(0, 0, 1) },
      uCam: { value: V(0, 0, 10) },
      uCelda: { value: 0 },
      uCeldaFuera: { value: 0.07 },
      uBits: { value: 0 },
      uCono: { value: 0.5 },
      uDetalle: { value: 0 },
      uSem: { value: 0 },
      uFrente: { value: 0 },
      uMapa: { value: tex },
    },
  });
  n.u.uSpread.value = 0;
  return n;
}

/** A Points that shares another's geometry, with its own uniforms (a copy of the same world). */
function copia(n: Nube) {
  const m = (n.points.material as THREE.ShaderMaterial).clone();
  m.uniforms.uMapa.value = n.u.uMapa.value;
  const pts = new THREE.Points(n.points.geometry, m);
  pts.frustumCulled = false;
  return { points: pts, u: m.uniforms as Nube['u'] };
}

const tu = () => {
  const b = materiaBuilder(5);
  const q = aqui().multiplyScalar(1.006);
  b.push(q.x, q.y, q.z, TU, 0.03, 3.4);
  const n = materia(b.data(), { move: 'fuente = 1.0;' });
  n.u.uSpread.value = 0;
  return n;
};

// ---------------------------------------------------------------- the scene

const CAP = 'VI · ¿Eres real?';
/** The Earth's turn: Santiago towards +z. */
const GIRO = new THREE.Euler(0.3, -0.34, 0);

export const simulacion: Escena = {
  id: 'simulacion',
  nombre: 'La simulación',
  estilos: [
    { key: '1', nombre: 'Pixelar', nota: 'La Tierra se vuelve celdas y luego bits; la cámara se aleja: es uno entre miles de mundos que se calculan.' },
    { key: '2', nombre: 'Solo donde miras', nota: 'El mundo solo se calcula donde alguien mira, y llega tarde: al girar rápido, detrás no hay nada calculado.' },
    { key: '3', nombre: 'Muñecas', nota: 'Simulaciones dentro de simulaciones: el mundo de bits es una celda de una máquina, que también es bits.' },
    { key: '4', nombre: 'Elegida', nota: 'La que eligió Diego: muñecas (3), y la red de mundos nace copiándose: de un mundo de bits salen dos, cuatro… (de Tus Tierras).' },
  ],
  montar(stage, estilo, viaje = false): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.45;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = 0.5;
    const tl = new Timeline();
    tl.set({ celda: 0, bits: 0, lejos: 0, az: 0, cuenta: 0, detalle: 0, giro: 0, baja: 0 });
    if (estilo === 0) {
      tl.label('reglas').caption(2.4, 'Reglas', 'Todo lo que ves, la Tierra, tu casa, tu cuerpo, sigue reglas exactas. Y lo que sigue reglas exactas se puede calcular.');
      tl.to(2.4, { az: 0.5 });
      tl.label('calcular').caption(2.6, 'Calcular un mundo', 'Una civilización como la de Destino tendría cómputo de sobra para calcular un mundo entero, con todas las mentes que hay en él.');
      tl.to(1.3, { celda: 0.025, az: 0.8 });
      tl.to(1.3, { celda: 0.1, az: 1.0 });
      tl.label('copias').caption(3.0, 'Muchas copias', 'Con la luz de una sola estrella podría correr unas cien mil millones de historias humanas por segundo.');
      tl.to(1.2, { bits: 1, celda: 0.1, cuenta: 0.15 });
      tl.to(1.8, { lejos: 0.55, cuenta: 1 });
      tl.label('cual').caption(3.4, 'Y tú, ¿en cuál?', 'Entonces las mentes simuladas serían muchísimas más que las reales, y lo más probable es que la tuya sea una de ellas. Es un argumento, no una prueba.');
      tl.to(3.4, { lejos: 1 });
    } else if (estilo === 1) {
      tl.label('entero').caption(2.4, 'Un mundo entero', 'Simular la Tierra átomo por átomo sería carísimo: tiene unos 10⁵⁰ átomos. El universo observable, unos 10⁸⁰.');
      tl.to(2.4, { az: 0.6, cuenta: 0.5 });
      tl.label('miras').caption(2.8, 'Solo donde miras', 'Pero no hace falta calcularlo todo: basta con lo que alguien está mirando, en el momento en que lo mira.');
      tl.to(0.8, { detalle: 1, cuenta: 1 });
      tl.to(2.0, { az: 1.7 });
      tl.label('detras').caption(3.0, 'Detrás de ti', 'Lo que nadie mira no tendría por qué existir en detalle. Desde adentro, no habría forma de notarlo.');
      tl.to(0.9, { giro: 1 }, (t) => t * t * (3 - 2 * t));
      tl.to(2.1, { az: 1.9 });
      tl.label('igual').caption(2.8, 'Igual que este', 'Un mundo calculado así se vería exactamente como este.');
      tl.to(2.8, { baja: 1, az: 2.25 });
    } else if (estilo === 3 && viaje) {
      // GUION.md 30–33. It starts on the blue light act V leaves (the Earth, far) and comes in.
      tl.set({ gen: 0, acerca: 0 });
      tl.label('reglas').caption(4.2, 'Reglas', 'Todo lo que existe sigue reglas exactas. Y lo que sigue reglas se puede calcular.');
      tl.to(1.6, { acerca: 1, az: 0.15 });
      tl.to(1.3, { celda: 0.1, az: 0.3 });
      tl.to(1.3, { bits: 1, celda: 0.1, az: 0.5 });
      tl.label('copiar').caption(4.6, 'Copiar un mundo', 'Un mundo calculado es información, y la información se copia: de uno salen dos, de dos salen cuatro.');
      tl.to(1.6, { gen: 1, lejos: 0.1 });
      tl.to(1.2, { gen: 3, lejos: 0.4 });
      tl.to(1.8, { gen: 9, lejos: 0.95 });
      tl.label('maquina').caption(4.8, 'La máquina', 'Una sola estrella bastaría para calcular miles de millones de vidas como la tuya. Las mentes calculadas serían muchas más que las otras. ¿Y una mente calculada mira menos que tú?');
      tl.to(4.8, { lejos: 1.5, cuenta: 1 });
      tl.label('munecas').caption(4.2, 'Muñecas', 'Y la máquina también podría estar calculada, dentro de otra. No hay forma de saber en qué piso estás.');
      tl.to(4.2, { lejos: 3.6, cuenta: 3 });
    } else if (estilo === 3) {
      tl.set({ gen: 0, acerca: 1 });
      tl.label('reglas').caption(2.4, 'Un mundo calculado', 'Imagina que este mundo es un cálculo: cada trozo de él, un bit que se enciende y se apaga.');
      tl.to(1.2, { celda: 0.1, az: 0.3 });
      tl.to(1.2, { bits: 1, celda: 0.1, az: 0.5 });
      tl.label('copiar').caption(4.6, 'Copiar un mundo', 'Y lo que es información se copia. Copiar un mundo calculado es como copiar un archivo: de uno salen dos, de dos salen cuatro.');
      tl.to(1.6, { gen: 1, lejos: 0.1 });
      tl.to(1.2, { gen: 3, lejos: 0.4 });
      tl.to(1.8, { gen: 9, lejos: 0.95 });
      tl.label('maquina').caption(3.4, 'La máquina', 'Una sola estrella bastaría para correr cien mil millones de historias humanas por segundo. Las mentes simuladas serían muchísimas más que las reales.');
      tl.to(3.4, { lejos: 1.5, cuenta: 1 });
      tl.label('munecas').caption(4.4, 'Muñecas', 'Pero esa máquina también es materia, y la materia también se podría calcular. Una simulación dentro de otra, sin saber en qué piso estás.');
      tl.to(4.4, { lejos: 3.6, cuenta: 3 });
    } else {
      tl.label('reglas').caption(2.2, 'Un mundo calculado', 'Imagina que este mundo es un cálculo: cada célula de él, un bit que se enciende y se apaga.');
      tl.to(1.1, { celda: 0.1, az: 0.3 });
      tl.to(1.1, { bits: 1, celda: 0.1, az: 0.5 });
      tl.label('maquina').caption(3.2, 'La máquina', 'Lo calcula una máquina. Pero esa máquina también es materia, y la materia también se podría calcular.');
      tl.to(3.2, { lejos: 1.4, cuenta: 1 });
      tl.label('munecas').caption(4.0, 'Muñecas', 'Una simulación dentro de otra, dentro de otra. No hay forma de saber en qué piso estás, ni si hay un último piso.');
      tl.to(4.0, { lejos: 3.6, cuenta: 3 });
    }

    // ---- The world.
    const tex = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}texturas/2k_earth_daymap.jpg`);
    tex.colorSpace = THREE.NoColorSpace;
    let tierra: Nube | null = null;
    const yo = tu();
    const mundo = new THREE.Group();
    mundo.rotation.copy(GIRO);
    root.add(mundo);
    mundo.add(yo.points);
    const otros: { points: THREE.Points; u: Nube['u'] }[] = [];
    let lejanos: Nube | null = null;
    // Way 1: a lattice of worlds (5³ copies of a light Earth; beyond, one point each).
    const PASO = 7;
    const N0 = 9;
    // Way 3: the dolls. Level 0 is the lattice of worlds; every level above is a lattice of 9³ cells,
    // each cell a cube of 5³ points that stands for a whole level below (the centre cell is the one
    // we came from).
    const NIVELES: { S: number; E: number; nube: Nube | null; color: THREE.Color }[] = [];
    {
      let E = (2 * N0 + 1) * PASO;
      const cols = [new THREE.Color(0.5, 0.62, 1.0), new THREE.Color(1.0, 0.58, 0.85), new THREE.Color(0.6, 1.0, 0.88)];
      for (let L = 0; L < 3; L++) {
        const S = E * 1.35;
        NIVELES.push({ S, E: 9 * S, nube: null, color: cols[L] });
        E = 9 * S;
      }
    }

    // Way 4: the world copies itself as an H-tree in 3D (x, y, z in turn; the step halves every three
    // generations): after nine, 512 worlds on a cubic lattice of step PASO. The first three
    // generations are full worlds, the next three light ones, the last three a point each.
    const GD = 9;
    const genes: { pos: THREE.Vector3; padre: THREE.Vector3 }[][] = [[{ pos: V(), padre: V() }]];
    for (let g = 1; g <= GD; g++) {
      const ax = (g - 1) % 3;
      const L = (2 * PASO) / Math.pow(2, Math.floor((g - 1) / 3));
      const dir = ax === 0 ? V(1, 0, 0) : ax === 1 ? V(0, 1, 0) : V(0, 0, 1);
      genes.push(genes[g - 1].flatMap((n) => [-1, 1].map((sg) => ({ pos: n.pos.clone().addScaledVector(dir, sg * L), padre: n.pos.clone() }))));
    }
    const dup8: { points: THREE.Points; u: Nube['u']; yo: Nube }[] = [];
    const dup64: { points: THREE.Points; u: Nube['u'] }[] = [];
    let dupPuntos: Nube | null = null;

    const listo = mapaTierra().then((img) => {
      tierra = tierraSim(tierraDatos(img, estilo === 1 ? 150000 : 110000, 11), tex);
      mundo.add(tierra.points);
      if (estilo === 3) {
        tierra.points.visible = false;
        yo.points.visible = false;
        const ligera = tierraSim(tierraDatos(img, 7000, 12), tex);
        for (let i = 0; i < 8; i++) {
          const c = copia(tierra);
          c.points.rotation.copy(GIRO);
          const y = tu();
          c.points.add(y.points);
          root.add(c.points);
          dup8.push({ ...c, yo: y });
        }
        for (let i = 0; i < 64; i++) {
          const c = copia(ligera);
          c.points.rotation.copy(GIRO);
          c.u.uBits.value = 1;
          c.u.uCelda.value = 0.1;
          root.add(c.points);
          dup64.push(c);
        }
        const bd = materiaBuilder(31);
        for (let g = 7; g <= GD; g++) for (const n of genes[g]) bd.push(n.pos.x, n.pos.y, n.pos.z, new THREE.Color(0.7, 0.6, 1.0), 1.5, 0.6, { from: [n.padre.x, n.padre.y, n.padre.z], kind: g });
        dupPuntos = materia(bd.data(), {
          pre: /* glsl */ `uniform float uG;`,
          move: /* glsl */ `
            float n = aKind;
            float kg = clamp(uG - (n - 1.0), 0.0, 1.0);
            p = mix(aFrom, position, kg * kg * (3.0 - 2.0 * kg));
            float vis = step(n - 1.0, uG) * (1.0 - step(n, uG - 1e-4));
            if (n >= ${GD}.0) vis = step(n - 1.0, uG);
            float on = step(0.45, fract(sin(seed * 913.1 + floor(uTime * 3.0 + seed * 9.0)) * 43758.5));
            em *= vis * (0.35 + 0.9 * on);
            fuente = 1.0;`,
          uniforms: { uG: { value: 0 } },
        });
        dupPuntos.u.uSpread.value = 0;
        root.add(dupPuntos.points);
        // The rest of the machine: the lattice beyond the copies, on the same half-step grid.
        const b = materiaBuilder(21);
        for (let i = -10; i < 10; i++)
          for (let j = -10; j < 10; j++)
            for (let k = -10; k < 10; k++) {
              if (Math.max(Math.abs(i + 0.5), Math.abs(j + 0.5), Math.abs(k + 0.5)) < 4) continue;
              b.push((i + 0.5) * PASO, (j + 0.5) * PASO, (k + 0.5) * PASO, new THREE.Color(0.7, 0.6, 1.0), 0.6, 0.45);
            }
        lejanos = materia(b.data(), {
          pre: /* glsl */ `uniform float uLejos;`,
          move: /* glsl */ `
            float on = step(0.45, fract(sin(seed * 913.1 + floor(uTime * 3.0 + seed * 9.0)) * 43758.5));
            em *= (0.35 + 0.9 * on) * uLejos;
            fuente = 1.0;`,
          uniforms: { uLejos: { value: 0 } },
        });
        lejanos.u.uSpread.value = 0;
        root.add(lejanos.points);
      } else if (estilo !== 1) {
        const ligera = tierraSim(tierraDatos(img, 7000, 12), tex);
        const N = 2;
        for (let i = -N; i <= N; i++)
          for (let j = -N; j <= N; j++)
            for (let k = -N; k <= N; k++) {
              if (!i && !j && !k) continue;
              const c = copia(ligera);
              c.points.position.set(i, j, k).multiplyScalar(PASO);
              c.points.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
              c.u.uSem.value = Math.random() * 100;
              c.u.uBits.value = 1;
              c.u.uCelda.value = 0.1;
              root.add(c.points);
              otros.push(c);
            }
        // Far worlds: a point each, flickering.
        const b = materiaBuilder(21);
        const M = N0;
        for (let i = -M; i <= M; i++)
          for (let j = -M; j <= M; j++)
            for (let k = -M; k <= M; k++) {
              if (Math.max(Math.abs(i), Math.abs(j), Math.abs(k)) <= N) continue;
              b.push(i * PASO, j * PASO, k * PASO, new THREE.Color(0.7, 0.6, 1.0), 0.6, 0.45);
            }
        lejanos = materia(b.data(), {
          pre: /* glsl */ `uniform float uLejos;`,
          move: /* glsl */ `
            float on = step(0.45, fract(sin(seed * 913.1 + floor(uTime * 3.0 + seed * 9.0)) * 43758.5));
            em *= (0.35 + 0.9 * on) * uLejos;
            fuente = 1.0;`,
          uniforms: { uLejos: { value: 0 } },
        });
        lejanos.u.uSpread.value = 0;
        root.add(lejanos.points);
      }
      if (estilo >= 2) {
        let Eb = (2 * N0 + 1) * PASO;
        for (const [L, nv] of NIVELES.entries()) {
          const b = materiaBuilder(40 + L);
          const q = Eb / 5;
          for (let i = -4; i <= 4; i++)
            for (let j = -4; j <= 4; j++)
              for (let k = -4; k <= 4; k++) {
                if (!i && !j && !k) continue;
                for (let a = -2; a <= 2; a++)
                  for (let c = -2; c <= 2; c++)
                    for (let e = -2; e <= 2; e++) b.push(i * nv.S + a * q, j * nv.S + c * q, k * nv.S + e * q, nv.color, q * 0.1, 0.4);
              }
          nv.nube = materia(b.data(), {
            pre: /* glsl */ `uniform float uOn;`,
            move: /* glsl */ `
              float on = step(0.45, fract(sin(seed * 517.3 + floor(uTime * 3.0 + seed * 11.0)) * 43758.5));
              em *= (0.3 + 0.9 * on) * uOn;
              fuente = 1.0;`,
            uniforms: { uOn: { value: 0 } },
          });
          nv.nube.u.uSpread.value = 0;
          root.add(nv.nube.points);
          Eb = nv.E;
        }
      }
    });

    /** Way 2: where the camera is (Earth frame, unit radius) at progress p. */
    const camEn = (p: number) => {
      const az = tl.get('az', p) + tl.get('giro', p) * 2.6;
      const baja = tl.get('baja', p);
      const d = lerp(2.5, 2.9, ease(0, 1, baja));
      const el = 0.22 + 0.05 * baja;
      return V(Math.sin(az) * Math.cos(el) * d, Math.sin(el) * d, Math.cos(az) * Math.cos(el) * d);
    };

    const cuentaDe = (p: number): Cuenta => {
      const c = tl.get('cuenta', p);
      if (estilo === 0) {
        if (c < 0.01) return { pisos: ['1'], linea: 'un mundo', h: 1 };
        const l = 11 * ease(0, 1, c);
        return { pisos: deH(h10(l)), linea: 'historias humanas simuladas por segundo · con la luz de una estrella', h: h10(l) };
      }
      if (estilo === 1) {
        if (c < 0.5) {
          const l = lerp(50, 80, ease(0, 0.5, c));
          return { pisos: ['10', String(Math.round(l))], linea: c < 0.25 ? 'átomos de la Tierra' : 'átomos del universo observable', h: h10(l) };
        }
        const a = ease(0.5, 1, c);
        return { pisos: a > 0.5 ? ['?'] : ['10', '80'], linea: a > 0.5 ? 'los que hace falta calcular: los que alguien mira' : 'átomos del universo observable', h: h10(80) * (1 - a) + 1 * a };
      }
      if (estilo === 3) {
        const gc = tl.get('gen', p);
        if (c < 0.01) {
          const n = Math.pow(2, Math.ceil(gc - 0.02));
          return { pisos: [String(n)], linea: n === 1 ? (viaje ? 'tu mundo' : 'un mundo') : 'mundos copiados · cada uno con un tú', h: slog(n) };
        }
        if (p < tl.at('munecas')) {
          const l = lerp(Math.log10(512), 11, ease(0, 1, c));
          return { pisos: deH(h10(l)), linea: 'historias humanas por segundo · con la luz de una estrella', h: h10(l) };
        }
      }
      const pisosN = Math.floor(1 + c + 1e-6);
      return { pisos: [String(pisosN)], linea: pisosN === 1 ? 'simulación · un piso' : `simulaciones, una dentro de otra · ¿${pisosN}? ¿más?`, h: 1 + c * 0.3 };
    };

    const tmp = V();
    return {
      tl,
      listo,
      entrada: { pos: V(0, 0, 0), escala: 1 },
      salida: { pos: V(0, 0, 0), escala: 2000 },
      cuenta: cuentaDe,
      rotulo(p): Rotulo | null {
        const c = tl.captionAt(p);
        return c ? { capitulo: viaje ? 'VI · ¿Y si nada es real?' : CAP, name: c.name, fact: c.fact } : null;
      },
      update(f: Frame) {
        const p = f.p;
        camera.fov = 40;
        const t = tierra;
        const lejos = tl.get('lejos', p);
        if (t) {
          t.u.uCelda.value = tl.get('celda', p);
          t.u.uBits.value = tl.get('bits', p);
          t.u.uDetalle.value = tl.get('detalle', p);
          // The Sun in the Earth's frame.
          (t.u.uSol.value as THREE.Vector3).copy(V(0.55, 0.3, 0.8).normalize()).applyQuaternion(mundo.quaternion.clone().invert());
          enfocar(t, f.focal, f.dpr, f.time);
        }
        enfocar(yo, f.focal, f.dpr, f.time);
        yo.u.uGain.value = estilo === 1 ? 1 : 1 - 0.3 * tl.get('bits', p);

        if (estilo === 1) {
          // The camera orbits; what is computed follows it half a beat late.
          const cam = camEn(p);
          const late = camEn(Math.max(0, p - 0.55)).normalize();
          if (t) {
            t.u.uMira.value.copy(late);
            t.u.uCono.value = Math.cos(lerp(0.72, 1.3, ease(0.2, 1, tl.get('baja', p))));
            t.u.uGain.value = 0.85;
            t.u.uFrente.value = tl.get('detalle', p);
          }
          // Lit from beside the viewer, so whatever is computed is day.
          if (t) (t.u.uSol.value as THREE.Vector3).copy(cam).normalize().add(V(0, 0.45, 0)).applyAxisAngle(V(0, 1, 0), 0.5).normalize();
          // Camera position is in the Earth's frame; the world group carries the turn.
          const w = cam.clone().applyEuler(GIRO);
          const look = V(0, 0, 0);
          mirar(camera, w, look);
        } else {
          for (const o of otros) {
            o.u.uFocal.value = f.focal;
            o.u.uMinPx.value = 1.6 * f.dpr;
            o.u.uMaxPx.value = 24 * f.dpr;
            o.u.uTime.value = f.time;
            o.u.uGain.value = ease(0.02, 0.25, lejos) * 0.9;
            o.points.visible = lejos > 0.01;
          }
          if (lejanos) {
            lejanos.u.uLejos.value = ease(0.3, 0.75, lejos);
            enfocar(lejanos, f.focal, f.dpr, f.time);
          }
          const a = tl.get('az', p) + f.time * 0.01;
          if (estilo === 3) {
            camera.far = 1e8;
            const gc = tl.get('gen', p);
            const nG = Math.ceil(gc - 1e-6);
            const k = 1 - (nG - gc);
            const kk = k * k * (3 - 2 * k);
            const sol = V(0.55, 0.3, 0.8).normalize().applyQuaternion(mundo.quaternion.clone().invert());
            const ajustar = (c: { points: THREE.Points; u: Nube['u'] }, n: { pos: THREE.Vector3; padre: THREE.Vector3 } | undefined, on: boolean) => {
              c.points.visible = on && !!n;
              if (!n || !on) return;
              c.points.position.copy(nG === 0 ? n.pos : n.padre.clone().lerp(n.pos, kk));
              c.u.uCelda.value = tl.get('celda', p);
              c.u.uBits.value = tl.get('bits', p);
              (c.u.uSol.value as THREE.Vector3).copy(sol);
              c.u.uFocal.value = f.focal;
              c.u.uMinPx.value = 1.6 * f.dpr;
              c.u.uMaxPx.value = 24 * f.dpr;
              c.u.uTime.value = f.time;
            };
            dup8.forEach((c, i) => {
              ajustar(c, genes[Math.min(nG, 3)][i], nG <= 3);
              enfocar(c.yo, f.focal, f.dpr, f.time);
              c.yo.u.uGain.value = 1 - 0.3 * tl.get('bits', p);
            });
            dup64.forEach((c, i) => ajustar(c, genes[Math.min(Math.max(nG, 4), 6)][i], nG >= 4 && nG <= 6));
            if (dupPuntos) {
              dupPuntos.u.uG.value = gc;
              dupPuntos.points.visible = nG >= 7;
              enfocar(dupPuntos, f.focal, f.dpr, f.time);
            }
            // Framing: the copies of this generation (x, y and z grow in turn), then the levels.
            let ex = 1.4;
            let ey = 1.4;
            let ez = 1.4;
            for (let g = 1; g <= Math.min(GD, nG); g++) {
              const L = ((2 * PASO) / Math.pow(2, Math.floor((g - 1) / 3))) * (g === nG ? kk : 1);
              if ((g - 1) % 3 === 0) ex += L;
              else if ((g - 1) % 3 === 1) ey += L;
              else ez += L;
            }
            const th = Math.tan(THREE.MathUtils.degToRad(20));
            const fit = Math.max(ex / (th * camera.aspect), ey / th) * 1.5 + ez;
            const dMax = NIVELES[NIVELES.length - 1].E * 1.6;
            const d = Math.max(3.0, fit, logLerp(3.0, dMax, ease(0, 1, lejos / 3.6)), logLerp(32, 3.0, ease(0, 1, tl.get('acerca', p))));
            for (const nv of NIVELES) if (nv.nube) {
              nv.nube.u.uOn.value = ease(nv.S * 0.5, nv.S * 2.2, d);
              enfocar(nv.nube, f.focal, f.dpr, f.time);
            }
            if (lejanos) {
              lejanos.u.uLejos.value = ease(1.0, 1.4, lejos);
              enfocar(lejanos, f.focal, f.dpr, f.time);
            }
            mirar(camera, V(Math.sin(a) * d * 0.4, d * 0.18, Math.cos(a) * d), V(0, 0, 0));
          } else if (estilo === 0) {
            const d = logLerp(3.0, 270, ease(0, 1, lejos));
            const at = V(0, 0, 0).lerp(V(PASO * 0.5, PASO * 0.3, 0), ease(0.3, 1, lejos));
            mirar(camera, at.clone().add(V(Math.sin(a * 0.4) * d, d * 0.18, Math.cos(a * 0.4) * d)), at);
          } else {
            // Dolls: the camera pulls back through the levels (log distance); each level lights up as
            // the one below it shrinks into its centre cell.
            camera.far = 1e8;
            const dMax = NIVELES[NIVELES.length - 1].E * 1.6;
            const d = logLerp(3.0, dMax, ease(0, 1, lejos / 3.6));
            for (const nv of NIVELES) if (nv.nube) {
              nv.nube.u.uOn.value = ease(nv.S * 0.5, nv.S * 2.2, d);
              enfocar(nv.nube, f.focal, f.dpr, f.time);
            }
            if (lejanos) lejanos.u.uLejos.value = ease(8, 60, d);
            for (const o of otros) {
              o.u.uGain.value = ease(4, 12, d) * 0.9;
              o.points.visible = d > 4;
            }
            mirar(camera, V(Math.sin(a) * d * 0.4, d * 0.18, Math.cos(a) * d), V(0, 0, 0));
          }
        }
        // The camera in every world's own frame (for the far-side cull).
        root.updateMatrixWorld();
        if (t) (t.u.uCam.value as THREE.Vector3).copy(mundo.worldToLocal(camera.position.clone()));
        for (const o of [...otros, ...dup8, ...dup64]) if (o.points.visible) (o.u.uCam.value as THREE.Vector3).copy(o.points.worldToLocal(camera.position.clone()));
      },
      placa(g, f) {
        const u = f.u;
        // «Tú» on our world while it can be found.
        const a = estilo === 3 ? ease(0.4, 1.2, f.p) * (1 - ease(tl.at('copiar') + 0.6, tl.at('copiar') + 1.2, f.p)) : estilo === 1 ? ease(0.4, 1.2, f.p) * (1 - ease(tl.at('miras') - 0.4, tl.at('miras'), f.p)) : ease(0.4, 1.2, f.p) * (1 - ease(tl.at('calcular') + 0.5, tl.at('calcular') + 1.2, f.p)) + (estilo === 0 ? ease(tl.at('cual') + 1.4, tl.at('cual') + 2.2, f.p) : 0);
        if (a > 0.01) {
          tmp.copy(aqui()).applyEuler(GIRO);
          const s = proyectar(tmp, camera, f.W, f.H);
          if (s.z < 1) texto(g, u, s.x + 14 * u, s.y - 14 * u, 'tú', '#73ffd9', a, 11);
        }
        if (estilo === 1) {
          const b = ease(tl.at('detras') + 0.9, tl.at('detras') + 1.4, f.p) * (1 - ease(tl.at('igual') - 0.3, tl.at('igual'), f.p));
          texto(g, u, f.W / 2, f.H * 0.14, 'aquí no mira nadie', ink(0.8), b, 11, 'center');
        }
        void VIOLETA;
      },
      dispose() {
        tex.dispose();
      },
    };
  },
};
