# Guía de Instalación y Configuración

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v18 o superior): [Descargar aquí](https://nodejs.org/)
- **PostgreSQL** (v12 o superior): [Descargar aquí](https://www.postgresql.org/download/)
- **Git**: [Descargar aquí](https://git-scm.com/downloads)

## Instalación del Proyecto

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd geriatric-app
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Instalar dependencias del frontend

```bash
cd ..
npm install
```

## Configuración de la Base de Datos

### 1. Crear la base de datos en PostgreSQL

```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE geriatric_app;

# Salir
\q
```

### 2. Ejecutar el schema de la base de datos

```bash
cd backend
psql -U postgres -d geriatric_app -f database/schema.sql
```

### 3. Crear usuarios de prueba

```bash
cd backend
psql -U postgres -d geriatric_app -f database/create_test_users.sql
```

### 4. Hashear contraseñas de los usuarios

```bash
cd backend
npm run hash-passwords
```

## Configuración de Variables de Entorno

### Backend

Crea el archivo `backend/.env` con tu configuración:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geriatric_app
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgresql

# JWT Configuration
JWT_SECRET=geriatric-app-secret-key-change-in-production
JWT_EXPIRES_IN=24h
```

### Frontend

Crea el archivo `.env` en la raíz del proyecto:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Ejecución del Proyecto

### 1. Iniciar el backend (Terminal 1)

```bash
cd backend
npm run dev
```

El backend se ejecutará en `http://localhost:3000`

### 2. Iniciar el frontend (Terminal 2)

```bash
cd ..
npm run dev
```

El frontend se ejecutará en `http://localhost:5173` (o el puerto que Vite asigne)

## Credenciales de Prueba

El sistema viene con usuarios de prueba preconfigurados:

- **Enfermera**: `maria.garcia@geriatric.com` / `enfermera123`
- **Jefe Enfermería**: `carlos.rodriguez@geriatric.com` / `jefe123`
- **Enfermera**: `ana.martinez@geriatric.com` / `ana123`
- **Administrador**: `admin@geriatric.com` / `admin123`

## Estructura del Proyecto

```
geriatric-app/
├── backend/                    # API REST con Node.js
│   ├── src/
│   │   ├── config/            # Configuración de base de datos
│   │   ├── controllers/       # Controladores de la API
│   │   ├── middleware/        # Middleware de autenticación
│   │   ├── models/            # Modelos de datos
│   │   ├── routes/            # Rutas de la API
│   │   └── server.js          # Punto de entrada
│   ├── database/              # Scripts SQL
│   ├── scripts/               # Scripts de utilidad
│   ├── .env                  # Variables de entorno (NO compartir)
│   └── package.json
├── src/                       # Frontend React
│   ├── components/            # Componentes React
│   ├── context/               # Context de la aplicación
│   ├── services/              # Servicios API
│   ├── types/                 # Tipos TypeScript
│   └── views/                 # Vistas de la aplicación
├── .env.example              # Ejemplo de variables de entorno
├── .gitignore                # Archivos a ignorar en Git
└── package.json              # Dependencias del frontend
```

## Solución de Problemas Comunes

### Error de conexión a PostgreSQL

- Verifica que PostgreSQL esté ejecutándose
- Verifica las credenciales en `backend/.env`
- Asegúrate de que la base de datos `geriatric_app` exista

### Error 401 Unauthorized al hacer login

- Ejecuta `npm run hash-passwords` en el backend
- Esto hashea las contraseñas en la base de datos

### Puerto ya en uso

- Cambia el puerto en `backend/.env` (variable PORT)
- Vite automáticamente buscará otro puerto si 5173 está ocupado

### Errores de CORS

- Verifica que el backend esté ejecutándose
- Verifica que la URL del API en el frontend sea correcta

## Desarrollo

### Agregar nuevas funcionalidades

1. **Backend**: Agrega el modelo, controlador y rutas correspondientes
2. **Frontend**: Agrega el servicio en `src/services/` y actualiza los tipos en `src/types/`
3. **Base de datos**: Agrega las migraciones necesarias en `database/`

### Pruebas

El proyecto actualmente no tiene pruebas automatizadas. Para probar manualmente:

1. Inicia ambos servidores
2. Usa las credenciales de prueba
3. Prueba cada funcionalidad

## Seguridad

⚠️ **IMPORTANTE**: Nunca compartas el archivo `.env` que contiene credenciales reales. Usa `.env.example` como plantilla.

## Soporte

Si encuentras problemas:

1. Revisa esta guía de instalación
2. Verifica los logs de la terminal
3. Revisa la consola del navegador
4. Contacta al equipo de desarrollo