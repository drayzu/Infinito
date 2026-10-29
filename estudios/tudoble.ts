import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder, type Nube } from '../src/engine/materia';
import { lerp } from '../src/engine/math';
import { deH, FONT, h10, h1010, ink, slog, VIOLETA, type Cuenta, type Rotulo } from './placa';
import { aqui, ease, logLerp, mirar, redCosmica, TU, V } from './comun';
import { tierra as tierraHorizontes, type Planeta } from '../src/horizontes';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * The opening and act I, «¿Eres único?», as GUION.md has them (moments 1–9, approved 28 Oct 2026).
 *
 * Black, and a teal point that breathes: you. «Estás aquí, mirando esto.» The camera pulls back: the
 * point is in Santiago, on the Earth at dusk (the title). Further back, the Earth is the centre of all
 * we can see (it always is), and that ends at the horizon. Beyond, regions like ours, each arranged
 * its own way; the ways are many but not infinite; in endless space every one repeats, ours too
 * (Tegmark, 2003: the nearest double ~10^10^29 m away). The camera crosses to the double, dives in,
 * and lands on an Earth like this one, where a teal point breathes like yours. «¿Cuál de los dos eres
 * tú?» The Earth goes out and the point is left alone in the black: the bridge to act II, where it
 * stretches into a thread.
 *
 * Units: our observable universe has radius 1 and the Earth (at its centre) R_T. The lattice of
 * regions has step PASO and the double is a few cells off (the clock carries the true distance).
 */

const PASO = 2.7;
const DOBLE = new THREE.Vector3(3, -1, -4).multiplyScalar(PASO);
const R_T = 0.03;
/** Santiago towards +z; the Sun on the horizon there (dusk). */
const GIRO = new THREE.Euler(0.3, -0.34, 0);

export const tuDoble: Escena = {
  id: 'doble',
  nombre: 'Aquí · tu doble',
  estilos: [{ key: '1', nombre: 'Guion', nota: 'Apertura y acto I según el guion: tu punto en lo negro, la Tierra, el horizonte, las regiones como la nuestra, tu doble.' }],
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

    // ---------------------------------------------------------------- the moments (GUION.md 1–9)
    tl.set({ tierra: 0, aleja: 0, titulo: 0, red: 0, sale: 0, cuenta: 0, vuela: 0, zoom: 0, llega: 0, apaga: 0, az: 0 });
    tl.label('aqui').caption(3.2, 'Aquí', 'Estás aquí, mirando esto.');
    tl.wait(3.2);
    tl.label('seguro').caption(3.4, 'Lo único seguro', 'De todo lo que sabes, esto es lo único seguro: que alguien está mirando.');
    tl.wait(3.4);
    tl.label('demas').caption(4.6, 'Lo demás', 'Lo demás lo damos por hecho: que eres uno solo, que tu vida es una, que el tiempo pasa, que todo esto es real. Vamos a ver qué queda.');
    tl.to(1.6, { tierra: 1, aleja: 0.22 });
    tl.to(3.0, { titulo: 1, aleja: 0.3 });
    tl.label('lejos').caption(3.4, 'Lejos', 'Ese punto está en un planeta, que gira alrededor de una estrella, en una galaxia entre billones.');
    tl.to(3.4, { aleja: 1, red: 1, titulo: 2 });
    tl.label('horizonte').caption(3.4, 'El horizonte', 'Todo lo que podemos ver termina aquí, porque más allá la luz no ha tenido tiempo de llegar. Pero el espacio no termina donde termina la vista.');
    tl.to(3.4, { az: 0.5, cuenta: 1 });
    tl.label('otras').caption(3.4, 'Otras como esta', 'Si sigue para siempre, hay otras regiones como la nuestra, cada una con su materia ordenada a su manera.');
    tl.to(3.4, { sale: 1, cuenta: 2, az: 0.8 });
    tl.label('maneras').caption(3.0, 'Las maneras', 'Las maneras de ordenar tanta materia son muchísimas. Pero no infinitas.');
    tl.to(3.0, { cuenta: 3, az: 1.0 });
    tl.label('doble').caption(4.6, 'Tu doble', 'Y si el espacio sí es infinito, todas se repiten, también esta. En algún lugar hay un planeta igual, y alguien igual a ti leyendo esta misma frase.');
    tl.to(2.0, { vuela: 1, cuenta: 4 });
    tl.to(1.4, { zoom: 1 });
    tl.to(1.2, { llega: 1 });
    tl.label('cual').caption(3.6, '¿Cuál?', 'Él también cree ser el único. ¿Cuál de los dos eres tú?');
    tl.wait(3.6);
    tl.label('puente').caption(2.4, '', 'Pero no hace falta ir tan lejos para encontrar otro tú.');
    tl.to(2.4, { apaga: 1 });

    // ---------------------------------------------------------------- the two Earths and you
    // The Earth of the series (horizontes-cuerpos: points coloured with the real maps, clouds, the sea's
    // glint, finer points as the camera comes down). Ours and the double's are the same planet.
    const base = `${import.meta.env.BASE_URL}texturas/`;
    const tierras: { g: THREE.Group; n: Planeta; yo: Nube; presencia: number }[] = [];
    for (const centro of [V(0, 0, 0), DOBLE]) {
      const g = new THREE.Group();
      g.position.copy(centro);
      g.scale.setScalar(R_T);
      g.rotation.copy(GIRO);
      root.add(g);
      const b = materiaBuilder(5);
      const q = aqui().multiplyScalar(1.006);
      b.push(q.x, q.y, q.z, TU, 0.035, 3.4);
      const yo = materia(b.data(), { move: 'fuente = 1.0;' });
      yo.u.uSpread.value = 0;
      g.add(yo.points);
      const n = tierraHorizontes(base);
      g.add(n.group);
      tierras.push({ g, n, yo, presencia: 0 });
    }
    // The Sun low on Santiago's horizon: dusk there.
    const S = aqui();
    const solLocal = S.clone().cross(V(0, 1, 0)).normalize().multiplyScalar(0.98).addScaledVector(S, 0.2).normalize();
    const listo = Promise.all(tierras.map((t) => t.n.listo));
    // You, far off: a teal point that stays visible at the centre of all we see.
    const mb = materiaBuilder(6);
    mb.push(0, 0, 0, TU, 0.012, 2.6);
    const marca = add(materia(mb.data(), { move: 'fuente = 1.0;' }));

    // ---------------------------------------------------------------- our observable universe, and the lattice
    const red = redCosmica(2003, 110, (t, out) => out.setRGB(1, 0.92 - 0.12 * t, 0.8 - 0.2 * t));
    const nuestro = add(materia(red.data, { pre: `uniform float uOn;`, move: `em *= uOn; fuente = 0.6;`, uniforms: { uOn: { value: 0 } } }));
    const bh = materiaBuilder(4);
    for (let i = 0; i < 7000; i++) {
      const [x, y, z] = bh.onSphere();
      bh.push(x, y, z, new THREE.Color(0.79, 0.7, 1.0), 0.006, 0.4);
    }
    const horizonte = add(materia(bh.data(), { pre: `uniform float uOn;`, move: `em *= uOn; fuente = 0.6;`, uniforms: { uOn: { value: 0 } } }));
    // The other regions: lighter webs (their points merge at that distance); the double is whole and
    // turned exactly like ours.
    const ligera = redCosmica(77, 45);
    const ligeraWeb = materia(ligera.data, { pre: `uniform float uOn;`, move: `em *= uOn; fuente = 0.6;`, uniforms: { uOn: { value: 0 } } });
    const hl = materiaBuilder(7);
    for (let i = 0; i < 1800; i++) {
      const [x, y, z] = hl.onSphere();
      hl.push(x, y, z, new THREE.Color(0.79, 0.7, 1.0), 0.01, 0.4);
    }
    const ligeraHor = materia(hl.data(), { pre: `uniform float uOn;`, move: `em *= uOn; fuente = 0.6;`, uniforms: { uOn: { value: 0 } } });
    const copias: { points: THREE.Points; u: Nube['u']; pos: THREE.Vector3; esDoble: boolean }[] = [];
    const rnd = materiaBuilder(9).r;
    for (let i = -2; i <= 4; i++)
      for (let j = -1; j <= 1; j++)
        for (let k = -5; k <= 1; k++) {
          if (!i && !j && !k) continue;
          const pos = V(i, j, k).multiplyScalar(PASO);
          const esDoble = pos.distanceTo(DOBLE) < 1e-6;
          const g = new THREE.Group();
          g.position.copy(pos);
          if (!esDoble) g.rotation.set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28);
          for (const [src, light] of [[esDoble ? nuestro : ligeraWeb, ligeraWeb], [esDoble ? horizonte : ligeraHor, ligeraHor]] as const) {
            void light;
            const m = (src.points.material as THREE.ShaderMaterial).clone();
            const pts = new THREE.Points(src.points.geometry, m);
            pts.frustumCulled = false;
            g.add(pts);
            copias.push({ points: pts, u: m.uniforms as Nube['u'], pos, esDoble });
          }
          root.add(g);
        }

    // ---------------------------------------------------------------- the clock
    const cuentaDe = (p: number): Cuenta => {
      const c = tl.get('cuenta', p);
      if (p >= tl.at('cual')) return { pisos: ['2'], linea: 'tú y él', h: slog(2) };
      if (c < 0.5) return { pisos: ['1'], linea: 'tú', h: 1 };
      if (c <= 1.02) return { pisos: ['10', '80'], linea: 'protones en todo lo que vemos', h: h10(80) };
      if (c <= 2.02) {
        const n = Math.round(lerp(1, 146, ease(1, 2, c)));
        return { pisos: [String(n)], linea: 'regiones como la nuestra a la vista', h: slog(n) };
      }
      if (c <= 3.02) {
        const h = lerp(slog(146), h1010(122), ease(2, 3, c));
        return { pisos: c > 2.98 ? ['10', '10', '122'] : deH(h), linea: 'maneras de ordenarla', h };
      }
      return { pisos: ['10', '10', '29'], unidad: 'm', linea: 'hasta tu doble', h: h1010(29) };
    };

    return {
      tl,
      listo,
      salida: { pos: aqui().applyEuler(GIRO).multiplyScalar(R_T).add(DOBLE), escala: R_T },
      cuenta: cuentaDe,
      rotulo(p): Rotulo | null {
        const c = tl.captionAt(p);
        if (!c) return null;
        const cap = p < tl.at('lejos') ? '' : 'I · ¿Eres único?';
        return { capitulo: cap, name: c.name, fact: c.fact };
      },
      update(f: Frame) {
        const p = f.p;
        camera.near = 1e-6;
        camera.far = 1e4;
        camera.fov = 44;
        const t = f.time;
        const tierraOn = tl.get('tierra', p);
        const aleja = tl.get('aleja', p);
        const redOn = tl.get('red', p);
        const sale = tl.get('sale', p);
        const vuela = tl.get('vuela', p);
        const zoom = tl.get('zoom', p);
        const llega = tl.get('llega', p);
        const apaga = tl.get('apaga', p);
        const respira = 1 + 0.22 * Math.sin(t * 1.5);

        // ---- Visibility.
        const [mia, otra] = tierras;
        mia.presencia = ease(0, 1, tierraOn) * (1 - ease(0.35, 0.6, aleja));
        mia.yo.u.uGain.value = respira * (1 - ease(0.45, 0.62, aleja));
        marca.u.uGain.value = ease(0.5, 0.65, aleja) * (1 - ease(0, 0.4, vuela)) * respira;
        nuestro.u.uOn.value = ease(0.45, 1, redOn) * (1 - 0.5 * ease(0.6, 1, vuela));
        horizonte.u.uOn.value = ease(0.6, 1, redOn) * (0.45 + 0.55 * ease(0, 1, sale));
        otra.presencia = ease(0.4, 1, zoom) * (1 - ease(0, 0.8, apaga));
        otra.yo.u.uGain.value = ease(0, 1, llega) * respira * (1 - 0.15 * ease(0.8, 1, apaga));

        // ---- The camera.
        const a = tl.get('az', p) + t * 0.006;
        const S0 = aqui().applyEuler(GIRO);
        // Over Santiago, close, looking down at the Earth's centre: the point is in the middle.
        let pos = S0.clone().multiplyScalar(R_T * logLerp(2.3, 117, ease(0, 1, aleja)));
        let look = V(0, 0, 0);
        // Far out, the camera turns a little round all we see.
        pos.applyAxisAngle(V(0, 1, 0), ease(0.55, 1, aleja) * a * 0.6);
        pos.lerp(V(Math.sin(a) * 6.5, 2.4, Math.cos(a) * 6.5 + 1.5), ease(0, 1, sale));
        const arco = new THREE.QuadraticBezierCurve3(V(Math.sin(a) * 6.5, 2.4, Math.cos(a) * 6.5 + 1.5), V(DOBLE.x * 0.5, 6, DOBLE.z * 0.3), DOBLE.clone().add(V(1.2, 0.8, 3.2)));
        const v = ease(0, 1, vuela);
        if (v > 0) {
          pos = arco.getPoint(v);
          look = look.lerp(DOBLE, ease(0, 0.6, v));
        }
        const z = ease(0, 1, zoom);
        const S1 = aqui().applyEuler(GIRO).multiplyScalar(R_T).add(DOBLE);
        if (z > 0) {
          const t0 = DOBLE.clone().add(V(1.2, 0.8, 3.2));
          const dir = t0.clone().sub(DOBLE).normalize();
          pos = DOBLE.clone().addScaledVector(dir, logLerp(t0.distanceTo(DOBLE), R_T * 6, z));
          look = DOBLE.clone();
        }
        const k = ease(0, 1, llega);
        if (k > 0) {
          // Over the double's Santiago, as over ours at the start: its point in the middle.
          const sobre = aqui().applyEuler(GIRO).multiplyScalar(R_T * 2.3).add(DOBLE);
          pos = pos.lerp(sobre, k);
          look = look.lerp(DOBLE, k);
        }
        mirar(camera, pos, look);
        camera.updateMatrixWorld();
        // The regions' light depends on how far the camera is: set after the camera is placed (before,
        // it read the last frame's camera, which in a relay is the next act's, in another scale).
        for (const c of copias) {
          const base = c.esDoble ? lerp(0.4, 1, ease(0.3, 1, vuela)) * (1 - 0.9 * ease(0, 1, llega)) : 0.28 * (1 - ease(0, 0.6, zoom));
          c.u.uOn.value = ease(0, 0.6, sale) * base * Math.exp(-c.pos.distanceTo(camera.position) / 14);
          c.u.uFocal.value = f.focal;
          c.u.uMinPx.value = 1.6 * f.dpr;
          c.u.uMaxPx.value = 24 * f.dpr;
          c.u.uTime.value = t;
        }
        for (const tt of tierras) {
          tt.g.updateMatrixWorld();
          tt.n.group.visible = tt.presencia > 0.002;
          tt.n.update({ sol: solLocal, camara: tt.g.worldToLocal(camera.position.clone()), focal: f.focal, dpr: f.dpr, tiempo: t, presencia: tt.presencia });
          enfocar(tt.yo, f.focal, f.dpr, t);
          tt.yo.u.uSizeUnit.value = R_T;
        }
        for (const n of nubes) enfocar(n, f.focal, f.dpr, t);
        void S1;
      },
      placa(g, f) {
        // The title, over the Earth, in the third moment.
        const ti = tl.get('titulo', f.p);
        const a = ease(0, 0.5, ti) * (1 - ease(1.2, 1.8, ti));
        if (a > 0.01) {
          const u = f.u;
          g.save();
          g.globalAlpha = a;
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.shadowColor = 'rgba(0,0,0,0.9)';
          g.shadowBlur = 20 * u;
          g.font = FONT.mono(11 * u);
          g.letterSpacing = `${1.8 * u}px`;
          g.fillStyle = VIOLETA;
          g.fillText('HORIZONTES · 04', f.W / 2, f.H * 0.2 - 92 * u);
          g.letterSpacing = '0px';
          g.font = FONT.serif(118 * u);
          g.fillStyle = ink(0.96);
          g.fillText('Infinito', f.W / 2, f.H * 0.2);
          g.font = FONT.italic(30 * u);
          g.fillStyle = ink(0.78);
          g.fillText('¿Qué hay más allá?', f.W / 2, f.H * 0.2 + 84 * u);
          g.restore();
        }
      },
      dispose() {},
    };
  },
};
