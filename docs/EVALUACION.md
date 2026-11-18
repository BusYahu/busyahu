<!-- evaluacion:inicio -->
# Evaluación — BusYahu/busyahu

> Documento **generado automáticamente** por la cátedra de Programación III (RepoSense + análisis de calidad + constancia). **No editar a mano**: se regenera en cada evaluación.
> Rama evaluada: `main`. Análisis **heurístico** (regex + métricas): es una criba para orientar la revisión, **no una nota**.
> Generado: 2026-11-18.

## 1. Veredicto

| Aspecto | Resultado |
|---|---|
| Tipo de proyecto | app |
| Índice de calidad de servicios | **19/100** (mínimo 50) |
| Criterios cumplidos | **9/16** |
| Aprobado (semáforo) | **NO** |
| Código (LOC) | 16,793 |
| Archivos de código | 93 |
| Tests (archivos) | 1 |
| Cobertura de líneas | no medible (mínimo 80%) |
| Capas detectadas | presentacion, datos, vistas, servicios, estado |
| Pushes directos a `main` (sin PR) | 3 |
| Tope por duplicación | `DUP>=15%` → índice ≤ 50 |

> **Pushes directos:** se detectaron **3** commit(s) a `main` que no pasaron por un Pull Request. El flujo esperado es **rama → PR → revisión → merge**; el PR se aprueba con el mensaje `Aprobado`. Evitá pushear directo a `main`: la ruleset lo bloquea y el commit directo queda auditado.

> **Aprobado** exige las compuertas críticas (**SEC**, **SQL**, **capas**, **índice ≥ 50** y **cobertura ≥ 80 %** cuando aplica) y tolera hasta **3 criterios en rojo** (12/15). No es una nota: sirve para ordenar y priorizar la revisión.

## 2. Autoría (RepoSense)

| Autor | Commits | Código (LOC) | Tests (LOC) | Docs (LOC) | Días activos | % del código |
|---|---:|---:|---:|---:|---:|---:|
| Lauti Gómez | 14 | 9,287 | 0 | 243 | 11 | 68% |
| Valentino Dilello | 17 | 4,340 | 0 | 23,662 | 21 | 32% |

> _El LOC de autoría lo calcula RepoSense sobre el historial y puede diferir del LOC de código del análisis de calidad (que mira solo el estado de `main`)._

> **Reparto del trabajo:** Lauti Gómez concentra el 68% de las líneas de código. Un reparto muy desigual suele indicar que la integración no fue realmente en equipo; vale la pena reconstruir cómo se coordinó.

## 3. Constancia (IC) — todas las ramas

> El IC mide **cuándo** se trabajó (sesiones por semana, pausas y recencia), no cuánto ni con qué calidad. Se calcula sobre **todas las ramas** de todos los repositorios del alumno, no sólo `main`.

| Alumno | Sesiones | Cumplimiento | Pausa | Recencia | IC | Nivel | Para subir de nivel |
|---|--:|--:|--:|--:|--:|--|--|
| Lauti Gómez | 10 | 36% | 35 d | 93% | **36** | No aprueba | Cumplimiento 36% (mín. 50%) |
| Valentino Dilello | 15 | 54% | 21 d | 71% | **45** | Aprueba | Cumplimiento 54% (mín. 100%); Pausa 21 d (máx. 5 d); Recencia 71% (mín. 75%) |

> Para aprobar el IC: **2 sesiones por semana** sostenidas, sin pausas mayores a **10 días** y con actividad en las **últimas 2 semanas**. Se excluyen merges, bots y al docente. Zona horaria UTC-3.

## 4. Aspectos evaluados

Cada aspecto indica **qué mide**, **por qué importa** y **tu resultado**. Cuando el resultado está en rojo, se agregan preguntas para **investigar la causa** (no hay recetas: entender el porqué es parte de la evaluación).

### 1. Índice de calidad de servicios (indice) — A REVISAR

- **Qué mide:** Un resumen numérico (0-100) que combina todas las señales y métricas del análisis, con topes duros por duplicación.
- **Por qué importa:** Ordena y prioriza la revisión: un índice bajo indica varias señales que conviene mirar juntas.
- **Tu resultado:** índice **19/100** _(mínimo 50)_
- **Para investigar la causa:**
    - ¿En qué momento del proyecto se concentraron los problemas (arranque, integración de partes, cierre)?
    - ¿El índice bajó por muchas señales chicas o por una o dos graves?
    - ¿Se revisó el código integrado después de unir el trabajo de cada integrante?

### 2. Duplicación (DRY) (duplicacion) — A REVISAR

- **Qué mide:** Porcentaje de bloques de código repetidos (similitud) en el repositorio.
- **Por qué importa:** Cada copia se mantiene por separado: un arreglo hay que repetirlo y los defectos se multiplican.
- **Tu resultado:** **20.6%** de duplicación _(máximo 15%)_
- **Para investigar la causa:**
    - ¿El trabajo se repartió por pantallas o archivos y se integró copiando y pegando bloques?
    - ¿Qué zonas del sistema cambiaron juntas más de una vez (señal de lógica compartida)?
    - ¿Hubo un lugar común acordado para la lógica repetida antes de empezar, o cada integrante resolvió lo suyo?

### 3. Secretos hardcodeados (SEC) — OK

- **Qué mide:** Credenciales, tokens o claves escritos directamente en el código en vez de leerse de variables de entorno.
- **Por qué importa:** Un secreto en el repositorio queda expuesto en el historial aunque luego se borre, y compromete al servicio y a sus usuarios.
- **Tu resultado:** **0** secreto(s) hardcodeado(s) _(máximo 0)_

### 4. Consultas SQL por concatenación (SQL) — OK

- **Qué mide:** Consultas SQL armadas concatenando o interpolando valores en vez de usar parámetros.
- **Por qué importa:** Es la puerta clásica a inyección: un valor que llega de afuera puede cambiar la consulta.
- **Tu resultado:** **0** consulta(s) SQL por concatenación _(máximo 0)_

### 5. Separación en capas (capas) — OK

- **Qué mide:** Si el código está separado en capas reconocibles (backend: presentación / lógica / datos; frontend: vistas / servicios / estado).
- **Por qué importa:** Sin separación, cada archivo hace de todo y cualquier cambio toca varios lugares a la vez.
- **Tu resultado:** **5** capa(s) detectada(s): presentacion, datos, vistas, servicios, estado _(mínimo 2 capas (a partir de 150 LOC))_

### 6. Acceso a datos dentro del componente (HTTP) — A REVISAR

- **Qué mide:** Llamadas `fetch`/`axios` dentro de componentes de UI en vez de una capa de servicios/API.
- **Por qué importa:** Duplica la lógica de acceso a datos y acopla la vista al backend: un cambio de API toca muchos componentes.
- **Tu resultado:** **1** llamada(s) a la API dentro de componente(s) _(máximo 0)_
- **Para investigar la causa:**
    - ¿Por qué se llamó directo desde el componente: urgencia, desconocimiento de una capa de servicios, o prueba rápida?
    - ¿La misma llamada aparece en más de un componente?
    - ¿Se acordó dónde debía vivir el acceso a la API?

### 7. Depuración olvidada (DBG) — A REVISAR

- **Qué mide:** Mensajes de depuración olvidados (`console.log`, `print`, `debugger`).
- **Por qué importa:** Generan ruido en los registros, pueden filtrar datos y dan sensación de código sin terminar.
- **Tu resultado:** **6** mensaje(s) de depuración olvidado(s) _(máximo 0)_
- **Para investigar la causa:**
    - ¿Fue depuración que quedó al cerrar una tarea, o se usó como registro permanente?
    - ¿Hubo una revisión final antes de cerrar la issue o la entrega?
    - ¿Quién agregó cada mensaje y con qué objetivo?

### 8. Uso del tipo `any` (Any) — OK

- **Qué mide:** Uso de `any` en TypeScript, que desactiva la verificación de tipos.
- **Por qué importa:** Se pierde la ayuda del compilador justo donde los datos vienen de afuera (API, formularios).
- **Tu resultado:** **0** uso(s) de `any` _(máximo 2)_

### 9. Componente demasiado grande (BigC) — A REVISAR

- **Qué mide:** Componentes de UI muy extensos, que suelen mezclar render, estado y lógica.
- **Por qué importa:** Son difíciles de leer, probar y reutilizar, y sus cambios tienen efectos inesperados.
- **Tu resultado:** **21** componente(s) demasiado grande(s) _(máximo 1)_
- **Para investigar la causa:**
    - ¿El componente creció a medida que se agregaban requisitos, sin volver a dividirlo?
    - ¿Mezcla responsabilidades distintas (mostrar, calcular, pedir datos)?
    - ¿Se dividió por pantalla o por unidad de responsabilidad?

### 10. Baja cohesión (Coh) — A REVISAR

- **Qué mide:** Una clase o unidad cuyos métodos y campos no están relacionados entre sí.
- **Por qué importa:** Una unidad que cambia por motivos distintos es frágil y cuesta entenderla.
- **Tu resultado:** **4** unidad(es) con baja cohesión _(máximo 0)_
- **Para investigar la causa:**
    - ¿La unidad agrupa cosas que en realidad pertenecen a lugares distintos?
    - ¿Cambia por motivos diferentes según la tarea?
    - ¿Se pensó su responsabilidad antes de escribirla, o se fue agregando?

### 11. Complejidad alta (Compl) — OK

- **Qué mide:** Complejidad ciclomática: cantidad de caminos posibles dentro de una función (condicionales, bucles, casos).
- **Por qué importa:** Muchos caminos = difícil de seguir y de probar; suelen esconderse casos sin cubrir.
- **Tu resultado:** **71** bloque(s) de complejidad alta _(máximo 5 por 1000 LOC (tenés 16793 LOC))_

### 12. Funciones/métodos largos o con muchos parámetros (Tam) — OK

- **Qué mide:** Tamaño de las funciones/métodos y cantidad de parámetros.
- **Por qué importa:** Una función que hace varias cosas cuesta leerla, nombrarla y reutilizarla.
- **Tu resultado:** **57** función/método(s) largos o con muchos parámetros _(máximo 10 por 1000 LOC)_

### 13. Acoplamiento alto (Acop) — OK

- **Qué mide:** Cuánto depende una unidad de las partes internas de otra.
- **Por qué importa:** Piezas muy enlazadas hacen que un cambio se propague y que sea difícil reemplazar partes.
- **Tu resultado:** **22** unidad(es) con acoplamiento alto _(máximo 2 por 1000 LOC)_

### 14. Cobertura de tests (Cob) — A REVISAR

- **Qué mide:** Porcentaje de líneas de código ejecutadas por la suite de tests (cobertura real, no cantidad de archivos de test).
- **Por qué importa:** Un test que existe pero no ejecuta el código no protege de nada: la cobertura muestra qué partes quedan sin verificar.
- **Tu resultado:** **no medible** — backend-fastapi: pytest no generó cobertura: INTERNALERROR> File "test_smtp.py", line 149, in <module> · INTERNALERROR> sys.exit(1) · INTERNALERROR> SystemExit: 1 _(mínimo 80% de líneas)_
- **Causa detectada:** backend-fastapi: pytest no generó cobertura: INTERNALERROR> File "test_smtp.py", line 149, in <module> · INTERNALERROR> sys.exit(1) · INTERNALERROR> SystemExit: 1
- **Para investigar la causa:**
    - ¿Qué módulos o ramas del sistema nunca se ejecutan en los tests?
    - ¿Los tests prueban el camino principal y los errores, o solo el caso feliz?
    - ¿La suite se puede correr en CI sin base de datos ni servicios externos?

### 15. Endpoints del backend (EP) — OK

- **Qué mide:** Cantidad de endpoints (rutas HTTP) expuestos por el backend.
- **Por qué importa:** El backend se mide por lo que expone: pocos endpoints sugiere poca funcionalidad de servicio.
- **Tu resultado:** **65** endpoint(s) _(mínimo 5)_

### 16. Vistas del frontend (Vistas) — OK

- **Qué mide:** Cantidad de vistas/componentes de pantalla del frontend.
- **Por qué importa:** El frontend se mide por pantallas: pocas vistas sugiere poca cobertura de la interfaz pedida.
- **Tu resultado:** **35** vista(s)/componente(s) _(mínimo 6)_

## 5. Observaciones y qué falta

Criterios que hoy están en rojo y, para cada uno, una explicación breve de **cómo corregirlo** hasta alcanzar el nivel de aprobación (perfil `exigente`):

| Criterio | Resultado actual | Meta | Brecha | Cómo alcanzarlo |
|---|---|---|---|---|
| Índice de calidad de servicios (indice) | índice **19/100** | mínimo 50 | faltan 31 pts | El índice sólo penaliza lo que **excede** los umbrales de cada criterio: si tenés todo en verde, el índice es 100. Si está en rojo, mirá la columna **Brecha** y los criterios en rojo; corregí primero duplicación, SEC, SQL y capas. Meta del perfil exigente: ≥50. |
| Duplicación (DRY) (duplicacion) | **20.6%** de duplicación | máximo 15% | sobran 5.6 pts | Ubicá los bloques repetidos con `jscpd` o SonarQube, llevá la lógica común a una función o módulo compartido y hacé que todos lo usen. Cada copia eliminada baja el porcentaje; meta ≤15%. |
| Acceso a datos dentro del componente (HTTP) | **1** llamada(s) a la API dentro de componente(s) | máximo 0 | 1 caso(s) a eliminar | Creá una capa de servicios/API (un módulo por recurso) que centralice `fetch`/`axios` y consumila desde los componentes; así el acceso a datos deja de estar duplicado en las vistas. Meta: 0 casos. |
| Depuración olvidada (DBG) | **6** mensaje(s) de depuración olvidado(s) | máximo 0 | 6 caso(s) a eliminar | Borrá `console.log`/`print`/`debugger` del código de producción. Si necesitás registro, usá el logger del proyecto con el nivel adecuado. Meta: 0 casos. |
| Componente demasiado grande (BigC) | **21** componente(s) demasiado grande(s) | máximo 1 | 20 componente(s) de más | Dividí el componente por responsabilidad en subcomponentes (render, estado, acceso a datos) y dejá el original sólo como orquestador. Meta: ≤1 componente grande. |
| Baja cohesión (Coh) | **4** unidad(es) con baja cohesión | máximo 0 | 4 clase(s) a separar | Separá la clase en unidades con una sola responsabilidad: si los métodos cambian por motivos distintos, son clases distintas. Meta: 0 clases con baja cohesión. |
| Cobertura de tests (Cob) | **no medible** — backend-fastapi: pytest no generó cobertura: INTERNALERROR> File "test_smtp.py", line 149, in <module> · INTERNALERROR> sys.exit(1) · INTERNALERROR> SystemExit: 1 | mínimo 80% de líneas | no medible: generá el artefacto o corré la suite | Revisá que la suite corra en un clon limpio (sin base de datos ni servicios externos) y que las dependencias de test estén declaradas. Agregá o ampliá tests que ejecuten los módulos sin cubrir (camino principal y errores) y publicá el artefacto (`coverage/lcov.info`, `coverage-summary.json`, `coverage.xml` o `coverage.json`) o corré la suite con coverage. Meta: ≥80% de líneas. |

> Empezá por las señales de seguridad (**SEC**, **SQL**) y por la **duplicación**: son las que más pesan en el índice y las más rápidas de verificar a ojo. Después de corregir, volvé a correr la medición: el semáforo se recalcula sobre `main`.

> **Tests (informativo):** hoy tenés **1** archivo(s) de test; la meta es **5**, pero **no** es una compuerta del semáforo. Para acercarte, agregá tests de los flujos principales (servicios y endpoints) y corré la suite con coverage.

## 6. Actividad en clase y fuera de clase

> Se consideran las **28 clases** del período (miércoles y viernes, según `config/constancia.json`; feriados y semanas sin clase descontados). Para cada alumno se muestra la actividad **en cada clase** y también la actividad **fuera de los días de clase** (fines de semana u otros días). `Commits` = commits de trabajo (no-merge); `Merges` = merges de PR (también son push). Los días sin actividad dicen **sin actividad**.

### Lauti Gómez

**8/28 clases con actividad** · total del período: 13 commits · 1 merges

| Fecha | Actividad | Repositorios | Commits / merges |
|---|:--:|---|--:|
| 2026-08-14 | **Sí** | busyahu | 3 / 0 |
| 2026-08-19 | **Sí** | busyahu | 1 / 0 |
| 2026-08-21 | No | sin actividad | 0 / 0 |
| 2026-08-26 | **Sí** | busyahu | 1 / 0 |
| 2026-08-28 | **Sí** | busyahu | 1 / 0 |
| 2026-09-02 | No | sin actividad | 0 / 0 |
| 2026-09-04 | **Sí** | busyahu | 2 / 1 |
| 2026-09-09 | **Sí** | busyahu | 2 / 0 |
| 2026-09-11 | No | sin actividad | 0 / 0 |
| 2026-09-16 | No | sin actividad | 0 / 0 |
| 2026-09-18 | No | sin actividad | 0 / 0 |
| 2026-09-23 | No | sin actividad | 0 / 0 |
| 2026-09-25 | No | sin actividad | 0 / 0 |
| 2026-09-30 | No | sin actividad | 0 / 0 |
| 2026-10-02 | No | sin actividad | 0 / 0 |
| 2026-10-07 | No | sin actividad | 0 / 0 |
| 2026-10-09 | No | sin actividad | 0 / 0 |
| 2026-10-14 | **Sí** | busyahu | 1 / 0 |
| 2026-10-16 | No | sin actividad | 0 / 0 |
| 2026-10-21 | No | sin actividad | 0 / 0 |
| 2026-10-23 | No | sin actividad | 0 / 0 |
| 2026-10-28 | No | sin actividad | 0 / 0 |
| 2026-10-30 | No | sin actividad | 0 / 0 |
| 2026-11-04 | No | sin actividad | 0 / 0 |
| 2026-11-06 | **Sí** | busyahu | 2 / 0 |
| 2026-11-11 | No | sin actividad | 0 / 0 |
| 2026-11-13 | No | sin actividad | 0 / 0 |
| 2026-11-18 | No | sin actividad | 0 / 0 |

**Fuera de clase:** 3 fecha(s) con actividad · 4 commits · 2 merges

| Fecha | Repositorios | Commits / merges |
|---|---|--:|
| 2026-10-31 | busyahu | 2 / 0 |
| 2026-11-14 | busyahu | 1 / 0 |
| 2026-11-17 | busyahu | 1 / 2 |

### Valentino Dilello

**14/28 clases con actividad** · total del período: 13 commits · 8 merges

| Fecha | Actividad | Repositorios | Commits / merges |
|---|:--:|---|--:|
| 2026-08-14 | No | sin actividad | 0 / 0 |
| 2026-08-19 | **Sí** | busyahu | 0 / 1 |
| 2026-08-21 | **Sí** | busyahu | 1 / 0 |
| 2026-08-26 | **Sí** | busyahu | 1 / 0 |
| 2026-08-28 | **Sí** | busyahu | 1 / 2 |
| 2026-09-02 | No | sin actividad | 0 / 0 |
| 2026-09-04 | **Sí** | busyahu | 1 / 1 |
| 2026-09-09 | **Sí** | busyahu | 1 / 0 |
| 2026-09-11 | No | sin actividad | 0 / 0 |
| 2026-09-16 | No | sin actividad | 0 / 0 |
| 2026-09-18 | No | sin actividad | 0 / 0 |
| 2026-09-23 | No | sin actividad | 0 / 0 |
| 2026-09-25 | No | sin actividad | 0 / 0 |
| 2026-09-30 | **Sí** | busyahu | 1 / 0 |
| 2026-10-02 | No | sin actividad | 0 / 0 |
| 2026-10-07 | **Sí** | busyahu | 1 / 2 |
| 2026-10-09 | **Sí** | busyahu | 1 / 0 |
| 2026-10-14 | **Sí** | busyahu | 1 / 0 |
| 2026-10-16 | **Sí** | busyahu | 1 / 0 |
| 2026-10-21 | No | sin actividad | 0 / 0 |
| 2026-10-23 | **Sí** | busyahu | 2 / 0 |
| 2026-10-28 | **Sí** | busyahu | 0 / 2 |
| 2026-10-30 | No | sin actividad | 0 / 0 |
| 2026-11-04 | No | sin actividad | 0 / 0 |
| 2026-11-06 | No | sin actividad | 0 / 0 |
| 2026-11-11 | **Sí** | busyahu | 1 / 0 |
| 2026-11-13 | No | sin actividad | 0 / 0 |
| 2026-11-18 | No | sin actividad | 0 / 0 |

**Fuera de clase:** 7 fecha(s) con actividad · 5 commits · 4 merges

| Fecha | Repositorios | Commits / merges |
|---|---|--:|
| 2026-08-27 | busyahu | 1 / 0 |
| 2026-08-29 | busyahu | 1 / 0 |
| 2026-09-06 | busyahu | 1 / 0 |
| 2026-09-07 | busyahu | 0 / 2 |
| 2026-11-03 | busyahu | 1 / 1 |
| 2026-11-14 | busyahu | 1 / 0 |
| 2026-11-17 | busyahu | 0 / 1 |

## 7. Anexo: archivos donde se originan los problemas

Se listan los archivos y líneas que el análisis marca para cada criterio en rojo. Para **duplicación** se muestran los archivos con más líneas repetidas; para **cobertura**, las unidades por debajo del umbral.

**Índice (indice)** — señales que más pesan:

- `scripts/verify-interop.mjs:273` — high_complexity: función 'diffShapes' con complejidad 10
- `busyahu/src/App.jsx:7` — long_function: función 'App' de 110 líneas
- `frontend-svelte/src/App.svelte:68` — high_complexity: función 'handleCreateRoute' con complejidad 6
- `frontend-svelte/src/App.svelte:228` — long_function: función 'handleConfirmBooking' de 72 líneas
- `frontend-svelte/src/App.svelte:228` — high_complexity: función 'handleConfirmBooking' con complejidad 24
- `frontend-svelte/src/App.svelte:268` — long_function: función 'void' de 37 líneas
- `frontend-svelte/src/App.svelte:268` — high_complexity: función 'void' con complejidad 17
- `frontend-svelte/src/lib/api.js:156` — low_cohesion: clase 'ApiGatewayClient' con baja cohesión (17%)
- `frontend-svelte/src/lib/api.js:156` — high_coupling: clase 'ApiGatewayClient' muy acoplada (CBO=30)
- `frontend-svelte/src/lib/api.js:240` — long_method: método 'ApiGatewayClient.checkHealth' de 43 líneas
- `frontend-svelte/src/lib/api.js:240` — high_complexity: método 'ApiGatewayClient.checkHealth' con complejidad 8
- `frontend-svelte/src/lib/api.js:310` — long_method: método 'ApiGatewayClient.requestOnce' de 68 líneas
- `frontend-svelte/src/lib/api.js:310` — high_complexity: método 'ApiGatewayClient.requestOnce' con complejidad 17
- `frontend-svelte/src/lib/api.js:588` — long_method: método 'ApiGatewayClient.registerRequest' de 30 líneas
- `frontend-svelte/src/lib/api.js:588` — high_complexity: método 'ApiGatewayClient.registerRequest' con complejidad 7
- `frontend-svelte/src/lib/api.js:643` — long_method: método 'ApiGatewayClient.createBooking' de 32 líneas
- `frontend-svelte/src/lib/api.js:643` — high_complexity: método 'ApiGatewayClient.createBooking' con complejidad 13
- `frontend-svelte/src/lib/api.js:694` — high_complexity: método 'ApiGatewayClient.cancelBooking' con complejidad 10
- `frontend-svelte/src/lib/api.js:96` — high_complexity: función 'extractErrorMessage' con complejidad 12
- `frontend-svelte/src/lib/storage.js:53` — high_complexity: función 'normalizeUser' con complejidad 6
- `frontend-svelte/src/lib/storage.js:78` — high_complexity: función 'saveSession' con complejidad 6
- `frontend-svelte/src/lib/stores.js:26` — long_function: función 'createAuthStore' de 62 líneas
- `frontend-svelte/src/lib/stores.js:26` — high_complexity: función 'createAuthStore' con complejidad 7
- `frontend-svelte/src/lib/stores.js:117` — long_function: función 'createSearchStore' de 47 líneas
- `frontend-svelte/src/lib/stores.js:169` — long_function: función 'createSeatStore' de 31 líneas
- `frontend-svelte/src/lib/stores.js:205` — long_function: función 'createBookingsStore' de 51 líneas
- `frontend-svelte/src/lib/normalizers.js:92` — high_complexity: función 'normalizeAuthResponse' con complejidad 18
- `frontend-svelte/src/lib/normalizers.js:126` — high_complexity: función 'normalizeDestinations' con complejidad 28
- `frontend-svelte/src/lib/normalizers.js:158` — long_function: función 'normalizeTrainSummary' de 42 líneas
- `frontend-svelte/src/lib/normalizers.js:158` — high_complexity: función 'normalizeTrainSummary' con complejidad 83
- … y 152 hallazgo(s) más.

**Duplicación (duplicacion)** — archivos con más líneas repetidas:

- `frontend-react/src/lib/apiClient.ts` — 291 línea(s) duplicada(s)
- `frontend-svelte/src/lib/api.js` — 272 línea(s) duplicada(s)
- `backend-fastapi/app/routers/bookings.py` — 232 línea(s) duplicada(s)
- `frontend-svelte/src/data.ts` — 181 línea(s) duplicada(s)
- `frontend-react/src/mockData.ts` — 181 línea(s) duplicada(s)
- `frontend-react/src/lib/normalizers.ts` — 107 línea(s) duplicada(s)
- `frontend-svelte/src/lib/normalizers.js` — 107 línea(s) duplicada(s)
- `frontend-svelte/src/types.ts` — 82 línea(s) duplicada(s)
- `frontend-react/src/types.ts` — 78 línea(s) duplicada(s)
- `frontend-react/src/lib/mockAdapter.ts` — 61 línea(s) duplicada(s)
- `frontend-svelte/src/lib/mockAdapter.js` — 54 línea(s) duplicada(s)
- `backend-fastapi/app/utils/email_service.py` — 38 línea(s) duplicada(s)
- `backend-express/src/controllers/trains.controller.ts` — 38 línea(s) duplicada(s)
- `backend-fastapi/app/schemas/train.py` — 33 línea(s) duplicada(s)
- `frontend-react/src/lib/storage.ts` — 32 línea(s) duplicada(s)

**Acceso a datos dentro del componente (HTTP)** — 1 hallazgo(s) en 1 archivo(s):

| Archivo | Línea(s) | Señal |
|---|---|---|
| `frontend-svelte/src/components/ProjectManagementView.svelte` | 1 | llamada HTTP (fetch/axios) dentro del componente (mover a una capa de servicios) |

**Depuración olvidada (DBG)** — 6 hallazgo(s) en 5 archivo(s):

| Archivo | Línea(s) | Señal |
|---|---|---|
| `backend-express/src/config/db.ts` | 18 | salida de depuración olvidada |
| `backend-express/src/server.ts` | 30 | salida de depuración olvidada |
| `frontend-react/src/components/ETicketModal.tsx` | 125 | salida de depuración olvidada |
| `frontend-svelte/src/components/TicketConfirmationView.svelte` | 153 | salida de depuración olvidada |
| `frontend-svelte/src/lib/components/SearchView.svelte` | 30, 48 | salida de depuración olvidada |

**Componente demasiado grande (BigC)** — 21 hallazgo(s) en 21 archivo(s):

| Archivo | Línea(s) | Señal |
|---|---|---|
| `frontend-react/src/App.tsx` | 1 | componente grande (472 líneas) |
| `frontend-react/src/components/AdminRouteManagementView.tsx` | 1 | componente grande (662 líneas) |
| `frontend-react/src/components/ConnectivityHub.tsx` | 1 | componente grande (203 líneas) |
| `frontend-react/src/components/MyBookings.tsx` | 1 | componente grande (175 líneas) |
| `frontend-react/src/components/SeatMap.tsx` | 1 | componente grande (202 líneas) |
| `frontend-react/src/components/landing/HeroCarousel.tsx` | 1 | componente grande (292 líneas) |
| `frontend-react/src/components/landing/SiteFooter.tsx` | 1 | componente grande (161 líneas) |
| `frontend-react/src/components/landing/TrainResults.tsx` | 1 | componente grande (165 líneas) |
| `frontend-svelte/src/App.svelte` | 1 | componente grande (648 líneas) |
| `frontend-svelte/src/components/AuthModal.svelte` | 1 | componente grande (446 líneas) |
| `frontend-svelte/src/components/ConnectivityHub.svelte` | 1 | componente grande (189 líneas) |
| `frontend-svelte/src/components/MyBookingsView.svelte` | 1 | componente grande (237 líneas) |
| `frontend-svelte/src/components/ProjectManagementView.svelte` | 1 | componente grande (399 líneas) |
| `frontend-svelte/src/components/SeatSelectionCheckoutView.svelte` | 1 | componente grande (522 líneas) |
| `frontend-svelte/src/components/TicketConfirmationView.svelte` | 1 | componente grande (434 líneas) |
| `frontend-svelte/src/components/TrainSearchView.svelte` | 1 | componente grande (792 líneas) |
| `frontend-svelte/src/lib/components/AuthModal.svelte` | 1 | componente grande (163 líneas) |
| `frontend-svelte/src/lib/components/PaymentView.svelte` | 1 | componente grande (186 líneas) |
| `frontend-svelte/src/lib/components/SearchView.svelte` | 1 | componente grande (204 líneas) |
| `frontend-svelte/src/lib/components/SeatMap.svelte` | 1 | componente grande (181 líneas) |
| … | … | y 1 archivo(s) más |

**Baja cohesión (Coh)** — 4 hallazgo(s) en 4 archivo(s):

| Archivo | Línea(s) | Señal |
|---|---|---|
| `frontend-react/src/lib/apiClient.ts` | 232 | clase 'ApiGatewayClient' con baja cohesión (10%) |
| `frontend-react/src/lib/mockAdapter.ts` | 46 | clase 'MockAdapter' con baja cohesión (42%) |
| `frontend-svelte/src/lib/api.js` | 156 | clase 'ApiGatewayClient' con baja cohesión (17%) |
| `frontend-svelte/src/lib/mockAdapter.js` | 37 | clase 'MockAdapter' con baja cohesión (27%) |

**Cobertura (Cob)** — unidades por debajo del umbral:

_No hay detalle por archivo; el repo no es medible o no hay unidades por debajo del umbral._

---
_Informe generado por la cátedra. Los umbrales corresponden al perfil `exigente`. Ante dudas, revisá el archivo y la línea señalados y el criterio en `CRITERIOS-CALIDAD.md`._
<!-- evaluacion:fin -->
