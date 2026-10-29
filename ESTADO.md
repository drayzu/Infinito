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

## El guion (aprobado el 28 de octubre de 2026)

Diego vio el primer viaje, armado con los estudios encadenados con fundidos, y lo rechazó: «parecen capítulos cerrados y no conectados… debería tener una historia… algo para reflexionar». Después se escribió `GUION.md`:
- una sola voz en segunda persona;
- 46 momentos, en el arco certeza → vértigo → duda → disolución → nada → asombro;
- el punto verde (tú) como protagonista;
- puentes entre actos en vez de fundidos;
- un toque de «otras mentes» (otra química, una máquina que piensa).

Diego lo aprobó: «Me encanta mucho. Por favor hazlo… Vamos a hacer arte». **El guion manda sobre los estudios**: los textos, el orden de los momentos, los puentes y las pausas salen de él.

**Cómo se implementa:**
- **Modo viaje.** Cada estudio recibe `montar(stage, estilo, viaje)`. Con `viaje`, usa la coreografía del guion (sus momentos, su voz, su reloj) y empieza y termina en la imagen que comparte con el acto vecino.
- **Puentes por imagen compartida.** El último cuadro de un acto y el primero del siguiente muestran lo mismo: un punto verde en lo negro, una bola de luz al centro o puntos sueltos. El cambio en ese instante no se nota, y el fundido desaparece.
- **El orden de trabajo:**
  1. apertura + I;
  2. II;
  3. III;
  4. IV;
  5. V;
  6. VI (la simulación, el holograma corto y Boltzmann);
  7. el fractal;
  8. el final.

  Después vienen el ritmo de Destino, la lámina, el sonido, el idioma y el móvil.

## Auditoría y arreglos (29 de octubre de 2026)

Diego sintió la página «bugeada»: el hilo del acto II aparecía de golpe, la cámara daba un tirón en las bifurcaciones, y al final del acto I la pantalla quedaba negra.
- **El acto anterior se quedaba fuera de lugar.** Durante un relevo, el acto anterior se ubica dentro del mundo del nuevo. Si el scroll volvía atrás, aunque fuera un poco, ese acto ya no regresaba a su lugar y se dibujaba desplazado: pantalla negra. Ahora vuelve a su lugar.
- **Tirón en las bifurcaciones.** La distancia de la cámara dependía del largo de cada rama, que salta en cada división. Ahora sigue el largo nominal de cada generación, de forma continua. Medido: los saltos eran de hasta 100 veces el paso normal y ahora son de 2,6.
- **Trabas la primera vez que algo se dibuja** (hasta 1 s al entrar al agujero negro):
  - los shaders se compilan para el destino fuera de pantalla de la película (HalfFloat): para el lienzo, three arma otros programas;
  - un render de calentamiento sube todas las nubes de puntos a la GPU;
  - al cargar, el viaje entero se recorre cada 0,5 beat sin que se vea: 3 pasos por cuadro y después el cuadro real.

  Tras esto, la segunda pasada y la primera dan igual.
- **El agujero negro:** el horizonte se cruza en 0,6 beat y las estrías se ven desde que entras. El rebote es un solo destello, del que sube el universo nuevo, y la cámara pasa sin saltar.
- **Saltos de brillo suavizados:** el universo breve, el cerebro de Boltzmann (se arma y se deshace más escalonado) y las últimas copias de la simulación.
- **Herramienta:** `viaje.sonda(b)` (con `?debug&cap=1600x900`) da el acto, la cámara, el tiempo del cuadro y el brillo medio. Con ella se audita el viaje entero: hacia adelante cada 0,1 beat y yendo y volviendo sobre cada cambio de acto.

## Publicada (29 de octubre de 2026)

- **El sitio.** https://drayzu.github.io/Infinito/, en GitHub Pages con fuente «GitHub Actions» (`.github/workflows/deploy.yml`, el mismo de Destino). Cada push a `main` hace build y publica.
- **El README.** La portada es el hilo del acto II completo, con la frase *«Beyond the last thing we could know.»*, de Diego. Siguen seis filas:
  1. Your double;
  2. Other laws;
  3. A universe inside (la caída);
  4. Every instant, at once (el túnel de cuadros);
  5. Copies of a world;
  6. A mind from nothing (Boltzmann).

  Diego no quiso una fila del final, para no adelantarlo. Debajo va la barra ENTER.
- **Rehacer el README.** `node tools/clip.mjs [--fresh <clip>]` graba con beats locales por acto (`tools/readme.json`) y `python tools/readme_media.py [<clip>]` compone.

## La Tierra de la serie y el árbol (28 de octubre de 2026, noche)

- **La Tierra de `horizontes-cuerpos`** (puntos con los mapas reales, nubes, el brillo del mar, el halo y puntos más finos al acercarse) reemplaza a la Tierra liviana de los estudios:
  - en la apertura y el acto I (`tudoble.ts`: la nuestra y la del doble);
  - en la simulación (manera 4), hasta que la Tierra se vuelve celdas, cuando le cede el lugar a la Tierra de bits.

  Se atenúa con `presencia` y sus puntos siguen solos la escala del grupo. La del holograma sigue siendo la liviana, porque se deshace en bits.
- **El árbol de «Mirar atrás»:** queda parado, con la raíz abajo, y siempre de frente a su lado más ancho: el eje principal de las puntas alrededor del tronco, con un vaivén de ±0,3 rad. Diego notó que, al girar, a veces se veía delgado.

## Los relevos (28 de octubre de 2026, noche)

Diego, sobre el paso del II al III: «estas transiciones hacen parecer que fueran módulos, que no fuera todo una misma historia visual». Se arregló en el motor, para todos los puentes a la vez (`src/main.ts`):
- **Anclas.** Cada acto declara su `entrada` y su `salida` (`Ancla`: un punto de su mundo y un tamaño). Por ejemplo, el II sale por la burbuja de su árbol y el III entra por nuestra burbuja.
- **Relevo.** Durante los primeros 1,8 beats de un acto, el anterior se sigue dibujando en su último instante. Su mundo se ubica de modo que su `salida` caiga exactamente sobre la `entrada` del nuevo, en el mismo lugar y con el mismo tamaño. Su luz baja (`uFundido`) mientras sube la del nuevo.
- **Escala de los puntos.** El tamaño de los puntos sigue la escala de ese mundo (`uEscalaMundo`). Sin eso, un mundo encogido se volvía un destello blanco y uno agrandado se volvía invisible.
- **Cámara.** Arranca exactamente donde la dejó el acto anterior y gira alrededor del ancla, mirándola siempre, con la distancia interpolada en logaritmo. Luego se desliza a la del nuevo acto.
- **Inicio quieto.** Los actos empiezan sin moverse, mirando su ancla (holds en III, V y la simulación).
- **Hoja de los puentes:** `node tools/hojas.mjs puentes 0 0` → `docs/viaje/puentes.jpg`, con cinco cuadros por cambio de acto.

## El viaje según el guion (28 de octubre de 2026, noche)

Todos los actos tienen ya su modo viaje (`montar(stage, estilo, true)`). El viaje no tiene portada ni fundidos, y dura unos 208 beats (~8 min con A):
- **Apertura + I** (`tudoble.ts`): el punto en lo negro; Santiago al atardecer y el título; lo observable con la Tierra al centro; las regiones como la nuestra; tu doble. Termina con el punto del doble solo en lo negro.
- **II** (ramas 4): empieza en ese punto y termina con el árbol en su burbuja, como una bola de luz.
- **III** (leyes 1): empieza en la nuestra, vista de lejos. Recorre la niebla, los agujeros negros y la breve; sale lejos («casi ninguna») y vuelve a la nuestra. Termina en un nudo brillante, con el resto en negro.
- **IV** (agujero 1): cae en el agujero, rebota y nace un universo. Termina en una de sus estrellas, una luz al centro.
- **V** (bloque 3): empieza lejos, con el Sol como un punto. Termina en la Tierra, un punto azul solo.
- **VI:**
  - la simulación 4 empieza con la Tierra lejos y termina en las muñecas;
  - el holograma, corto, llega de lejos y se deshace en puntos;
  - Boltzmann termina con los cerebros deshechos en puntos sueltos.
- **Al fondo** (fractal): los puntos sueltos se juntan en el Mandelbrot y al final se dispersan.
- **Final** (4):
  - la nada y algo;
  - «los que miran»: los puntos verdes y luces de otros colores, que son otras mentes;
  - «el universo mirándose», «uno mira» y «Todo, desde aquí».

  El último cuadro es el punto del principio.

Capturas: `node tools/hojas.mjs viaje 0 60` (la hoja) y `node tools/hojas.mjs cuadro <beat> 0` (un cuadro).

## El viaje (fase 1, desde el 28 de octubre de 2026)

`index.html` + `src/main.ts`, en http://localhost:5203/. Es un solo scroll por las maneras elegidas, en el orden de los actos:
1. Portada.
2. I tu doble (`estudios/tudoble.ts`, nuevo).
3. II ramas 4.
4. III leyes 1.
5. IV agujero 1.
6. V bloque 3.
7. VI simulación 4, holograma y Boltzmann.
8. El fractal.
9. El final 4.

Son unos 167 beats; con **A**, unos 6 minutos.
- **Cada acto se monta en su propio grupo**: un `stage` cuya raíz es ese grupo. Mientras está activo, controla la cámara y vuelve a poner su propio resplandor.
- **Entre actos hay un fundido a negro de medio beat**, provisional hasta que existan los puentes.
- **Capturas:** `node tools/hojas.mjs viaje 0 48` escribe `docs/viaje/viaje.jpg`.

**Lo que falta en el viaje:**
- **Puentes entre actos.** Por ejemplo, la Tierra de tu doble se vuelve el hilo de tu primera rama.
- **El ritmo de Destino** (`ritmo.ts`: autoplay a velocidad de lectura, nada brusco a mano).
- **La lámina (I), el sonido (S), el idioma (L) y el modo liviano en el celular.**
- **Verificar cada cifra** antes de fijar los textos.
- **Acortar el holograma.**
- **Montar los actos de a poco**: hoy se montan todos al cargar para medir sus largos.

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
