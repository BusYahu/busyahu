<!-- calidad:inicio -->
![Calidad](https://img.shields.io/badge/Calidad-5%2F100-red) ![Aprobado](https://img.shields.io/badge/Aprobado-NO-red) ![Cumple](https://img.shields.io/badge/Cumple-9%2F15-yellow) ![Duplicación](https://img.shields.io/badge/Duplicaci%C3%B3n-17.9%25-yellow) ![SEC](https://img.shields.io/badge/SEC-0-green) ![SQL](https://img.shields.io/badge/SQL-0-green) ![DBG](https://img.shields.io/badge/DBG-21-red) ![Capas](https://img.shields.io/badge/Capas-3-green) ![Tests](https://img.shields.io/badge/Tests-1-orange) ![Cob](https://img.shields.io/badge/Cob-sin%20medir-lightgrey) ![Vistas](https://img.shields.io/badge/Vistas-24-green)

**Calidad de servicios (heurístico):** índice **5/100** · cumple **9/15** · aprobado **NO** · capas **3**
Detalle completo en [`docs/EVALUACION.md`](docs/EVALUACION.md).
<!-- calidad:fin -->

# 🚆 BusYahu - Plataforma Global de Reserva de Pasajes
> **Trabajo Final Integrador - Programación 3**  
> **Nivel:** 5to Año - Educación Técnica en Informática  
> **Modalidad:** Equipo de 2 integrantes  

---

## ⚡ Guía de Inicio Rápido (1 Solo Comando)

No se requiere instalar Node.js, Python ni MongoDB en el equipo; el entorno está completamente contenerizado mediante **Docker Desktop**.

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/busyahu.git
   cd busyahu
   ```

2. **Levantar los 5 servicios con Docker Compose:**
   ```bash
   docker compose up --build
   ```

   También se puede iniciar con un solo clic usando los scripts incluidos:

   - **Windows:** doble clic en `start.bat` (o ejecutarlo desde la terminal).
   - **Mac / Linux:**
     ```bash
     chmod +x start.sh stop.sh
     ./start.sh
     ```

El comando construye las imágenes, espera a que MongoDB esté `healthy`, arranca ambos backends y expone los dos frontends. Docker Compose se encarga de la red interna `busyahu-network`, el volumen persistente y los healthchecks de todos los servicios.
📌 Descripción del Proyecto

BusYahu es una solución web completa para la búsqueda, reserva, emisión y gestión de pasajes en 11 redes de transporte internacionales (España, Francia, Alemania, Bélgica, Reino Unido, Estados Unidos, Canadá, Rusia, China, India y Japón).

El proyecto cumple con la exigencia de diversidad tecnológica y paridad de arquitectura, exponiendo la misma API REST en dos backends distintos y ofreciendo la misma experiencia de usuario en dos frontends distintos, todo orquestado bajo contenedores Docker.
🛠️ Stack Tecnológico y Paridad (2x2)
Capa	Tecnología A	Tecnología B	Detalle
Base de Datos	MongoDB 7.0	-	Contenedor Docker con persistencia por volúmenes y script de seed automático (mongo-init.js).
Backend	Node.js + Express (TypeScript)	Python + FastAPI	100% de paridad en los 12 endpoints REST, autenticación JWT, middleware de roles y CORS.
Frontend	React 19 (Vite + Tailwind CSS)	Svelte 5 (Vite + Tailwind CSS)	Mismas 5 vistas, selector de país, mapa interactivo de asientos por unidad, pasarela simulada y emisión de ticket con QR.
DevOps	Docker & Docker Compose	Git Flow / PRs	Despliegue en un comando y control estricto de ramas con Conventional Commits.
📂 Estructura del Repositorio
code Text

busyahu/
├── PROYECTO.md              # Contrato de límites, alcances y objetivos SMART
├── ISSUES.md                # Backlog detallado de las issues del proyecto
├── README.md                # Guía técnica de instalación y ejecución
├── docker-compose.yml       # Orquestación de Base de Datos y Servicios
├── start.sh / start.bat     # Scripts de inicio en 1 clic
├── stop.sh / stop.bat       # Scripts de detención limpia de servicios
├── docs/
│   └── openapi.yaml         # Especificación formal OpenAPI 3.0 / Swagger
├── database/
│   └── mongo-init.js        # Script de carga inicial (11 países, estaciones y admin)
├── backend-express/         # Backend 1: Node.js + Express (Puerto 4000)
├── backend-fastapi/         # Backend 2: Python + FastAPI (Puerto 8000)
├── frontend-react/          # Frontend 1: React 19 + Vite (Puerto 5173)
└── frontend-svelte/         # Frontend 2: Svelte 5 + Vite (Puerto 5174)

🚀 Ejecución Nativa con Docker Compose

Si prefieres operar el sistema manualmente desde la consola:
1. Configurar Variables de Entorno
code Bash

cp .env.example .env

2. Levantar la Infraestructura Completa

Para construir las imágenes y levantar todos los contenedores en segundo plano:
code Bash

docker compose up -d --build

3. Verificar Servicios Activos
code Bash

docker compose ps

4. Detener los Servicios
code Bash

docker compose down

🌐 Puertos y Puntos de Acceso

Una vez levantado el entorno, los servicios estarán disponibles en:
Servicio	URL Local	Descripción
Frontend React	http://localhost:5173	Aplicación web cliente en React 19
Frontend Svelte	http://localhost:5174	Aplicación web cliente en Svelte 5
Backend Express (TS)	http://localhost:4000	API REST en Node.js / Express (/api/health)
Backend FastAPI (Py)	http://localhost:8000	API REST en Python (Swagger interactivo en /docs)
Base de Datos MongoDB	mongodb://localhost:27017	Instancia de MongoDB con volumen persistente

## 🎨 Landing B2C (React)

La aplicación React incluye una portada comercial orientada al pasajero final:

- Carrusel automático con 3 fotografías de alta resolución por cada uno de los 11 países y rótulo sincronizado del monumento.
- Buscador flotante translúcido con origen, destino, fecha, viajeros y país de la red.
- Marquee infinito con los operadores ferroviarios reales (Renfe AVE, Ouigo, iryo, SNCF TGV inOui, DB ICE, Eurostar, Amtrak, VIA Rail, JR Shinkansen, CRH China, Indian Railways y RZD Sapsan).
- Grilla de destinos, sección "Cómo funciona", resultados de tren de ejemplo y FAQ desplegable con apertura independiente.
- Navbar comercial y footer corporativo con métodos de pago y acceso discreto al panel administrativo.

El acceso a `/admin` conserva el control RBAC: un usuario con rol `client` recibe **HTTP 403** y puede elevarse a administrador desde la misma pantalla de acceso restringido.

### Personalizar imágenes, banderas y logos

- **Fotos del hero:** se editan en `frontend-react/src/data/landing.ts`, dentro de `HERO_SLIDES`. Cada objeto tiene `image`, `alt` y un `imagePosition` opcional que equivale a CSS `object-position`.
  - `'center'` centra el encuadre.
  - `'center 20%'` muestra más la parte superior de la foto; `'center 80%'` muestra más la parte inferior.
  - `'left center'` y `'right center'` desplazan el encuadre hacia la izquierda o derecha.
  - También se aceptan valores combinados como `'30% 70%'`.
- **Banderas:** son SVG locales en `frontend-react/public/flags/`. El componente `src/components/landing/Flag.tsx` traduce el código ISO (`ES`, `FR`, `GB`…) al archivo correspondiente. Para reemplazar una bandera, sustituí su archivo manteniendo el nombre (`es.svg`, `fr.svg`, etc.).
- **Logos de operadores:** viven en `frontend-react/public/brands/` y se asignan con la propiedad `logo` de cada elemento de `RAILWAY_BRANDS` en `landing.ts` (por ejemplo, `logo: '/brands/renfe.svg'`). Si se quita esa propiedad, el carrusel usa la marca tipográfica de respaldo.


🔑 Credenciales por Defecto (Seed Inicial)

    Usuario Administrador: admin@busyahu.com

    Contraseña: Admin123!

    Rol: admin (Gestión de viajes, unidades y reportes)

    Base de Datos: busyahu_db

🌿 Flujo de Trabajo Git (Obligatorio por Consigna)

    Sin Push directo a Main: Todo cambio ingresa exclusivamente mediante Pull Request revisado y aprobado.

    Nomenclatura de Ramas: tipo/issue-XX-descripcion (ej. feat/issue-03-auth-express).

    Conventional Commits:

        feat(alcance): descripción para nuevas funcionalidades.

        fix(alcance): descripción para correcciones de errores.

        docs(alcance): descripción para documentación.

        chore(alcance): descripción para tareas de configuración o dependencias.

        test(alcance): descripción para pruebas unitarias o de integración.