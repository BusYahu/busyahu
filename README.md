# BusYahu - Plataforma Global de Reserva de Pasajes
> **Trabajo Final Integrador - Programación 3**  
> **Nivel:** 5to Año - Educación Técnica en Informática  
> **Modalidad:** Equipo de 2 integrantes  

---

## 📌 Descripción del Proyecto

**BusYahu** es una solución web completa para la búsqueda, reserva, emisión y gestión de pasajes en 11 redes de transporte internacionales (**España, Francia, Alemania, Bélgica, Reino Unido, Estados Unidos, Canadá, Rusia, China, India y Japón**).

El proyecto cumple con la exigencia de **diversidad tecnológica y paridad de arquitectura**, exponiendo la misma API REST en **dos backends distintos** y ofreciendo la misma experiencia de usuario en **dos frontends distintos**, todo orquestado bajo contenedores **Docker**.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología A | Tecnología B | Detalle |
| :--- | :--- | :--- | :--- |
| **Base de Datos** | **MongoDB 7.0** | - | Contenedor Docker con persistencia por volúmenes y script de seed automático (`mongo-init.js`). |
| **Backend** | **Node.js + Express (TypeScript)** | **Python + FastAPI** | 100% de paridad en los 12 endpoints REST, autenticación JWT, middleware de roles y CORS. |
| **Frontend** | **React 19 (Vite + Tailwind CSS)** | **Svelte 5 (Vite + Tailwind CSS)** | Mismas 5 vistas, mapa interactivo de asientos por unidad, pasarela simulada y emisión de ticket con QR. |
| **DevOps** | **Docker & Docker Compose** | **Git Flow / PRs** | Despliegue en un comando y control estricto de ramas con *Conventional Commits*. |

---

## 📂 Estructura del Repositorio

```text
busyahu/
├── PROYECTO.md              # Contrato de límites, alcances y objetivos SMART
├── ISSUES.md                # Backlog detallado de las 12 issues del proyecto
├── README.md                # Guía técnica de instalación y ejecución
├── docker-compose.yml       # Orquestación de Base de Datos y Servicios
├── database/
│   └── mongo-init.js        # Script de carga inicial (11 países, estaciones y admin)
├── backend-express/         # Backend 1: Node.js + Express (Puerto 4000)
├── backend-fastapi/         # Backend 2: Python + FastAPI (Puerto 8000)
├── frontend-react/          # Frontend 1: React + Vite (Puerto 5173)
└── frontend-svelte/         # Frontend 2: Svelte + Vite (Puerto 5174)
```

---

## 🚀 Inicio Rápido (Quick Start con Docker)

### Requisitos Previos
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24.0+)
* [Docker Compose](https://docs.docker.com/compose/) (v2.0+)
* Git

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/busyahu.git
cd busyahu
```

### 2. Levantar la Infraestructura Completa
Para construir las imágenes y levantar todos los contenedores en segundo plano:
```bash
docker compose up -d --build
```

### 3. Verificar Servicios Activos
```bash
docker compose ps
```

---

## 🌐 Puertos y Puntos de Acceso

Una vez levantado el entorno con Docker, los servicios estarán disponibles en:

| Servicio | URL Local | Descripción |
| :--- | :--- | :--- |
| **Frontend React** | [http://localhost:5173](http://localhost:5173) | Aplicación web cliente en React 19 |
| **Frontend Svelte** | [http://localhost:5174](http://localhost:5174) | Aplicación web cliente en Svelte 5 |
| **Backend Express (TS)** | [http://localhost:4000](http://localhost:4000) | API REST en Node.js / Express |
| **Backend FastAPI (Py)** | [http://localhost:8000](http://localhost:8000) | API REST en Python (Swagger en `/docs`) |
| **Base de Datos MongoDB** | `mongodb://localhost:27017` | Instancia de MongoDB con volumen persistente |

---

## 🔑 Credenciales por Defecto (Seed Inicial)

* **Usuario Administrador:** `admin@busyahu.com`
* **Contraseña:** `Admin123!`
* **Base de Datos:** `busyahu_db`

---

## 🌿 Flujo de Trabajo Git (Obligatorio por Consigna)

1. **Sin Push a Main:** Todo cambio ingresa exclusivamente por **Pull Request** revisado y aprobado por el docente.
2. **Nomenclatura de Ramas:** `tipo/issue-XX-descripcion` (ej. `feat/issue-03-auth-express`).
3. **Conventional Commits:**
   * `feat(alcance): descripción` para nuevas funcionalidades.
   * `fix(alcance): descripción` para correcciones de errores.
   * `docs(alcance): descripción` para documentación.
   * `chore(alcance): descripción` para tareas de configuración o dependencias.
   * `test(alcance): descripción` para pruebas unitarias o de integración.

---

## 📄 Documentación Adicional

* Para consultar los límites del sistema, alcances y matriz de países, revisa **[PROYECTO.md](./PROYECTO.md)**.
* Para ver el backlog, dependencias y criterios de aceptación por tarea, revisa **[ISSUES.md](./ISSUES.md)**.
