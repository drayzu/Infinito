# Infinito · estado

## Decisiones

- **26 oct 2026 (Diego).** La obra trata de la realidad, no de la matemática, y debe ser la obra «mindfuck» de la serie. Su formato es el de las otras: un viaje con scroll de unos 10 minutos, teclas A/S/I/L y la lámina opcional, sin modo explorar ni estaciones.
- **28 oct 2026 (Diego).**
  - **Sí** a la regla de números con torres de potencias.
  - Ir más adentro y en primera persona que el final de Espacio: **sí**.
  - El cierre en el punto de Espacio y el fractal **se deciden viendo estudios**.
  - Pidió una obra «extremadamente visual, existencial, mindblowing», del universo y de temas que faltan por explorar, con la matemática solo como complemento. Se puede repetir lo de otras obras si hace falta. **La simulación es importante.**
- **28 oct 2026 (Diego).** Aprobó el plan v2, con el hilo «¿cuántos hay de ti?». Sus seis actos:
  1. tu doble;
  2. todas tus ramas;
  3. otras leyes;
  4. universos en agujeros negros;
  5. el tiempo no pasa;
  6. ¿eres real? (la simulación, los cerebros de Boltzmann y el holograma).

- **28 oct 2026 (Diego), al ver los estudios.**
  - **Ramas:** «Por dentro» (1), «incluso más largo, está precioso», pero con la ramificación de «El árbol» (2), más curva y bella. Quedó como la manera 4, `Elegida`.
  - **Simulación:** «definitivamente muñecas» (3). Le gustó la Tierra que se replica de «Tus Tierras» y preguntó si cabía en la simulación. Cabe: un mundo calculado es información, y la información se copia; además, el argumento de Bostrom depende de las copias. La manera 4, `Elegida`, une las muñecas con la Tierra de bits que se copia en 3D hasta formar la red de mundos.
  - **El tiempo no pasa:** empieza con la hélice; de cerca pasa a las rebanadas; al salir de ellas se ve la escena final de la hélice, con las líneas de las estrellas alrededor. Es la manera 3, `Elegida` (`estudios/bloqueElegida.ts`). Todo ocurre en un mismo mundo con el tiempo en +Y, y `uE` estira el tiempo ×12 al acercarse. Diego probó una versión más corta y prefirió volver a la original (25 beats).

## Cómo están hechos los estudios

- `npm run dev` abre el puerto 5203.
- **La página** es `estudios/index.html?m=<estudio>&s=<manera>`.
  - El scroll es el tiempo. **A** reproduce y **1 2 3** cambian de manera.
  - `?p=beat` empieza en ese beat; `?ver=beat` congela la imagen; `?cap=1600x900` dibuja a ese tamaño para las capturas.
  - `?debug` deja `estudio` en la consola, con `hoja(ruta, beats, cols, ancho)`, `mosaico(…)` y `lum(beat)`. El plugin `guardar` de `vite.config.ts` escribe en `docs/` y `capturas/`.
- **El banco es el de los estudios de Destino**, en `estudios/main.ts`, `stage.ts` y `timeline.ts`, con el motor de `src/engine/`. Su placa es propia (`estudios/placa.ts`): el reloj de números en torre y la escalera de pisos.
- **La Tierra de los estudios** (`estudios/comun.ts`) es una copia liviana: puntos en una esfera de Fibonacci coloreados con el mapa real y con el tratamiento de la serie. Sus puntos se pueden reordenar en teselas y bits. En la obra se usa la de `horizontes-cuerpos`, que ya está copiada en `src/horizontes/`.
- **Las capturas de cada estudio** están en `docs/estudios/<estudio>-<manera>.jpg`. Sin abrir ventana: `node tools/hojas.mjs leyes 2 12 agujero 1 16` (estudio, manera, cuadros; necesita `npm run dev`).
- **Los estudios:**
  - `ramas`: 1 por dentro, 2 el árbol, 3 tus Tierras, **4 elegida**.
  - `simulacion`: 1 pixelar, 2 solo donde miras, 3 muñecas, **4 elegida**.
  - `leyes`: 1 mar de burbujas, 2 perillas.
  - `agujero`: 1 caer (el agujero negro trazado con rayos de Tiempo y Destino, en `src/engine/agujero.ts`), 2 sin fondo (zoom infinito: cada nivel es la misma red, y el marco de la cámara se reinicia en cada nivel).
  - `bloque`: 1 la hélice, 2 rebanadas, **3 elegida**.
  - `final`: 1 el punto (todo cae en un punto de luz; adentro, la espuma con que empieza Espacio), 2 tú (todo se apaga menos los puntos verdes, y luego todos menos uno), 3 la nada (la cuenta cae a cero; en lo negro aparece un punto, luego unos pocos). Las tres terminan en «Todo, desde aquí.».
  - `fractal`: un destello, un buceo en el Mandelbrot hecho de puntos (cada punto calcula su escape en el shader; con floats llega a ~10⁻⁵).
  - `real` (acto VI, junto a la simulación): 1 cerebro de Boltzmann (en el vacío frío, el azar arma un cerebro que piensa y se deshace; al final, otros cerebros que aparecen y se deshacen a lo lejos), 2 holograma (la Tierra, de la corteza al núcleo, se escribe en una esfera de bits y desde ella se vuelve a formar).
  - El del doble sigue aparte, en `estudios/doble.html`.

## Lecciones

- **Hay nombres reservados.**
  - El motor de materia usa los uniformes `uK`, `uSpread`, `uGain`…
  - En el nivel principal de `main()` declara `k`, `p`, `em`, `occ`, `sz`, `fuente`, `mv`, `depth`, `s`, `dim` y `fog`.
  - Un `move` que declare otra vez uno de esos nombres no compila, y la nube no se ve: «Perillas» salió negra por un `float s`. Hay que usar nombres propios: `uCuadro`, `kg`, `kn`, `sx`.
- **Los puntos no prueban profundidad.** En un planeta de puntos, lo de atrás brilla a través de lo de adelante, y más si es emisivo (bits). Se tapa con `n · cámara ≥ 1` en el shader (`uCam`, la cámara en el marco del planeta).
- **Juntar puntos en celdas multiplica el brillo.** Para pixelar, cada punto toma el color del centro de su celda y los bordes de la celda se oscurecen; los puntos no se mueven.
- **El resplandor necesita umbral.** Con 0,1 todo se quema; el planeta va con 0,5–0,55.
- **Nunca `pow()` con base negativa:** `x * x`.

## Pendiente

- Estudios de otras leyes (III), del agujero negro (IV), de Boltzmann y el holograma (VI), del final (sus tres opciones) y del fractal.
- Pasar el estudio del doble al banco.
- Verificar las cifras antes de escribir los textos: Tegmark (2003), la cota de Bekenstein, Linde y Vanchurin (2010), Bostrom (2003), los cerebros de Boltzmann y los tiempos de Planck de una vida.

## Siguiente paso

Diego revisa las tres elegidas. Siguen los estudios que faltan, y después la fase 1: el motor de Destino y el acto I.
1. ~~Otras leyes~~ y ~~el agujero negro~~: Diego eligió **mar de burbujas** (`leyes` 1) y **caer** (`agujero` 1).
2. ~~Boltzmann y el holograma~~: hechos (`real`). Diego aprobó la propuesta: **Boltzmann completo** y el **holograma corto, como cierre de la simulación**.
3. ~~El final~~: Diego eligió **mezclar la nada (3) y el tú (2)**, «para que no se sienta sin propósito, hablar del tú». Es la manera 4, `Elegida`: todo se deshace en nada; ¿por qué hay algo?; de ese algo vuelven todos tus tú; de todos, uno solo mira: tú. «Todo, desde aquí.»
4. El fractal (`fractal`): **entra**, como destello antes del final (Diego: «entra claro»).

La fase 0 terminó el 28 de octubre de 2026. Sigue la fase 1: el motor de Destino y el acto I.
