<!-- evaluacion:inicio -->
# Evaluación — BusYahu/busyahu

> Documento **generado automáticamente** por la cátedra de Programación III (RepoSense + análisis de calidad + constancia). **No editar a mano**: se regenera en cada evaluación.
> Rama evaluada: `main`. Análisis **heurístico** (regex + métricas): es una criba para orientar la revisión, **no una nota**.
> Generado: 2026-10-28.

## 1. Veredicto

| Aspecto | Resultado |
|---|---|
| Tipo de proyecto | frontend |
| Índice de calidad de servicios | **9/100** (mínimo 60) |
| Criterios cumplidos | **9/15** |
| Aprobado (semáforo) | **NO** |
| Código (LOC) | 7,924 |
| Archivos de código | 63 |
| Tests (archivos) | 0 |
| Cobertura de líneas | no medible (mínimo 80%) |
| Capas detectadas | vistas, servicios, estado |

> **Aprobado** exige cumplir **todos** los criterios del semáforo. No es una nota: sirve para ordenar y priorizar la revisión.

## 2. Autoría (RepoSense)

| Autor | Commits | Código (LOC) | Tests (LOC) | Docs (LOC) | Días activos | % del código |
|---|---:|---:|---:|---:|---:|---:|
| Valentino Dilello | 10 | 2,757 | 0 | 23,638 | 12 | 51% |
| Lauti Gómez | 8 | 2,650 | 0 | 60 | 6 | 49% |

> _El LOC de autoría lo calcula RepoSense sobre el historial y puede diferir del LOC de código del análisis de calidad (que mira solo el estado de `main`)._

## 3. Constancia (IC) — todas las ramas

> El IC mide **cuándo** se trabajó (sesiones por semana, pausas y recencia), no cuánto ni con qué calidad. Se calcula sobre **todas las ramas** de todos los repositorios del alumno, no sólo `main`.

| Alumno | Sesiones | Cumplimiento | Pausa | Recencia | IC | Nivel | Para subir de nivel |
|---|--:|--:|--:|--:|--:|--|--|
| Valentino Dilello | 12 | 55% | 21 d | 64% | **45** | No aprueba | Pausa 21 d (máx. 10 d) |
| Lauti Gómez | 7 | 32% | 35 d | 0% | **21** | No aprueba | Cumplimiento 32% (mín. 50%); Pausa 35 d (máx. 10 d); Recencia 0% (mín. 50%) |

> Para aprobar el IC: **2 sesiones por semana** sostenidas, sin pausas mayores a **10 días** y con actividad en las **últimas 2 semanas**. Se excluyen merges, bots y al docente. Zona horaria UTC-3.

## 4. Aspectos evaluados

Cada aspecto indica **qué mide**, **por qué importa** y **tu resultado**. Cuando el resultado está en rojo, se agregan preguntas para **investigar la causa** (no hay recetas: entender el porqué es parte de la evaluación).

### 1. Índice de calidad de servicios (indice) — A REVISAR

- **Qué mide:** Un resumen numérico (0-100) que combina todas las señales y métricas del análisis, con topes duros por duplicación.
- **Por qué importa:** Ordena y prioriza la revisión: un índice bajo indica varias señales que conviene mirar juntas.
- **Tu resultado:** índice **9/100** _(mínimo 60)_
- **Para investigar la causa:**
    - ¿En qué momento del proyecto se concentraron los problemas (arranque, integración de partes, cierre)?
    - ¿El índice bajó por muchas señales chicas o por una o dos graves?
    - ¿Se revisó el código integrado después de unir el trabajo de cada integrante?

### 2. Duplicación (DRY) (duplicacion) — OK

- **Qué mide:** Porcentaje de bloques de código repetidos (similitud) en el repositorio.
- **Por qué importa:** Cada copia se mantiene por separado: un arreglo hay que repetirlo y los defectos se multiplican.
- **Tu resultado:** **13.1%** de duplicación _(máximo 15%)_

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
- **Tu resultado:** **3** capa(s) detectada(s): vistas, servicios, estado _(mínimo 2 capas (a partir de 150 LOC))_

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
- **Tu resultado:** **20** mensaje(s) de depuración olvidado(s) _(máximo 0)_
- **Para investigar la causa:**
    - ¿Fue depuración que quedó al cerrar una tarea, o se usó como registro permanente?
    - ¿Hubo una revisión final antes de cerrar la issue o la entrega?
    - ¿Quién agregó cada mensaje y con qué objetivo?

### 8. Uso del tipo `any` (Any) — OK

- **Qué mide:** Uso de `any` en TypeScript, que desactiva la verificación de tipos.
- **Por qué importa:** Se pierde la ayuda del compilador justo donde los datos vienen de afuera (API, formularios).
- **Tu resultado:** **1** uso(s) de `any` _(máximo 2)_

### 9. Componente demasiado grande (BigC) — A REVISAR

- **Qué mide:** Componentes de UI muy extensos, que suelen mezclar render, estado y lógica.
- **Por qué importa:** Son difíciles de leer, probar y reutilizar, y sus cambios tienen efectos inesperados.
- **Tu resultado:** **14** componente(s) demasiado grande(s) _(máximo 1)_
- **Para investigar la causa:**
    - ¿El componente creció a medida que se agregaban requisitos, sin volver a dividirlo?
    - ¿Mezcla responsabilidades distintas (mostrar, calcular, pedir datos)?
    - ¿Se dividió por pantalla o por unidad de responsabilidad?

### 10. Baja cohesión (Coh) — OK

- **Qué mide:** Una clase o unidad cuyos métodos y campos no están relacionados entre sí.
- **Por qué importa:** Una unidad que cambia por motivos distintos es frágil y cuesta entenderla.
- **Tu resultado:** **0** unidad(es) con baja cohesión _(máximo 0)_

### 11. Complejidad alta (Compl) — OK

- **Qué mide:** Complejidad ciclomática: cantidad de caminos posibles dentro de una función (condicionales, bucles, casos).
- **Por qué importa:** Muchos caminos = difícil de seguir y de probar; suelen esconderse casos sin cubrir.
- **Tu resultado:** **9** bloque(s) de complejidad alta _(máximo 5 por 1000 LOC (tenés 7924 LOC))_

### 12. Funciones/métodos largos o con muchos parámetros (Tam) — OK

- **Qué mide:** Tamaño de las funciones/métodos y cantidad de parámetros.
- **Por qué importa:** Una función que hace varias cosas cuesta leerla, nombrarla y reutilizarla.
- **Tu resultado:** **21** función/método(s) largos o con muchos parámetros _(máximo 10 por 1000 LOC)_

### 13. Acoplamiento alto (Acop) — A REVISAR

- **Qué mide:** Cuánto depende una unidad de las partes internas de otra.
- **Por qué importa:** Piezas muy enlazadas hacen que un cambio se propague y que sea difícil reemplazar partes.
- **Tu resultado:** **18** unidad(es) con acoplamiento alto _(máximo 2 por 1000 LOC)_
- **Para investigar la causa:**
    - ¿Las piezas se conocen en detalle entre sí (acceden a campos o estructuras internas)?
    - ¿El acceso a datos ocurre desde lugares que no son los responsables?
    - ¿Se puede cambiar una parte sin tocar las demás?

### 14. Cobertura de tests (Cob) — A REVISAR

- **Qué mide:** Porcentaje de líneas de código ejecutadas por la suite de tests (cobertura real, no cantidad de archivos de test).
- **Por qué importa:** Un test que existe pero no ejecuta el código no protege de nada: la cobertura muestra qué partes quedan sin verificar.
- **Tu resultado:** **no medible** (sin tests, sin runner o sin artefacto de cobertura) _(mínimo 80% de líneas)_
- **Para investigar la causa:**
    - ¿Qué módulos o ramas del sistema nunca se ejecutan en los tests?
    - ¿Los tests prueban el camino principal y los errores, o solo el caso feliz?
    - ¿La suite se puede correr en CI sin base de datos ni servicios externos?

### 15. Vistas del frontend (Vistas) — OK

- **Qué mide:** Cantidad de vistas/componentes de pantalla del frontend.
- **Por qué importa:** El frontend se mide por pantallas: pocas vistas sugiere poca cobertura de la interfaz pedida.
- **Tu resultado:** **22** vista(s)/componente(s) _(mínimo 8)_

## 5. Qué falta para aprobar

Criterios que hoy están en rojo y qué habría que cambiar para alcanzar el nivel de aprobación (perfil `exigente`):

| Criterio | Resultado actual | Meta | Qué arreglar |
|---|---|---|---|
| Índice de calidad de servicios (indice) | índice **9/100** | mínimo 60 | Subir el índice a ≥60 corrigiendo primero las señales de más peso: duplicación, secretos, SQL y capas. |
| Acceso a datos dentro del componente (HTTP) | **1** llamada(s) a la API dentro de componente(s) | máximo 0 | Mover `fetch`/`axios` a una capa de servicios/API y consumirla desde los componentes; 0 casos. |
| Depuración olvidada (DBG) | **20** mensaje(s) de depuración olvidado(s) | máximo 0 | Quitar `console.log`/`print`/`debugger` del código de producción; 0 casos. |
| Componente demasiado grande (BigC) | **14** componente(s) demasiado grande(s) | máximo 1 | Dividir el componente por responsabilidad en subcomponentes; ≤1 componente grande. |
| Acoplamiento alto (Acop) | **18** unidad(es) con acoplamiento alto | máximo 2 por 1000 LOC | Reducir dependencias directas entre unidades; ≤2 por 1000 LOC. |
| Cobertura de tests (Cob) | **no medible** (sin tests, sin runner o sin artefacto de cobertura) | mínimo 80% de líneas | Publicar cobertura (o correr la suite con coverage) y cubrir ≥80% de líneas. |

> Empezá por las señales de seguridad (**SEC**, **SQL**) y por la **duplicación**: son las que más pesan en el índice y las más rápidas de verificar a ojo.

## 6. Anexo: dónde mirar

Archivos donde el análisis encontró cada señal en rojo (sin número de línea, a propósito):

**Acceso a datos dentro del componente (HTTP)** — 1 archivo(s):
- `frontend-svelte/src/components/ProjectManagementView.svelte`

**Depuración olvidada (DBG)** — 7 archivo(s):
- `backend-express/src/config/db.ts`
- `backend-express/src/server.ts`
- `database/mongo-init.js`
- `frontend-react/src/components/ETicketModal.tsx`
- `frontend-svelte/src/components/TicketConfirmationView.svelte`
- `frontend-svelte/src/lib/components/SearchView.svelte`
- `frontend-svelte/src/lib/stores.js`

**Componente demasiado grande (BigC)** — 14 archivo(s):
- `frontend-react/src/App.tsx`
- `frontend-react/src/components/MyBookings.tsx`
- `frontend-react/src/components/SeatMap.tsx`
- `frontend-svelte/src/App.svelte`
- `frontend-svelte/src/components/MyBookingsView.svelte`
- `frontend-svelte/src/components/ProjectManagementView.svelte`
- `frontend-svelte/src/components/SeatSelectionCheckoutView.svelte`
- `frontend-svelte/src/components/TicketConfirmationView.svelte`
- `frontend-svelte/src/components/TrainSearchView.svelte`
- `frontend-svelte/src/lib/components/AuthModal.svelte`
- `frontend-svelte/src/lib/components/PaymentView.svelte`
- `frontend-svelte/src/lib/components/SearchView.svelte`
- `frontend-svelte/src/lib/components/SeatMap.svelte`
- `frontend-svelte/src/lib/components/TicketView.svelte`

**Acoplamiento alto (Acop)** — 6 archivo(s):
- `backend-fastapi/app/config.py`
- `backend-fastapi/app/schemas/booking.py`
- `backend-fastapi/app/schemas/destination.py`
- `backend-fastapi/app/schemas/train.py`
- `backend-fastapi/app/schemas/user.py`
- `frontend-svelte/src/lib/api.js`

---
_Informe generado por la cátedra. Los umbrales corresponden al perfil `exigente`. Ante dudas, revisá el archivo señalado y el criterio en `CRITERIOS-CALIDAD.md`._
<!-- evaluacion:fin -->
