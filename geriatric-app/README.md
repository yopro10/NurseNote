# NurseNote - Sistema de Gestión de Hogares Geriátricos

Sistema web para la gestión de notas de enfermería, signos vitales, medicamentos y residentes en hogares geriátricos.

## 🚀 Requisitos Previos

- **Node.js** (v18 o superior) - [Descargar](https://nodejs.org/)
- **PostgreSQL** (v14 o superior) - [Descargar](https://www.postgresql.org/download/)
- **Git** (opcional, para clonar el repositorio)

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/yopro10/NurseNote.git
cd geriatric-app
```

### 2. Configurar el Proyecto (Automático - Recomendado)

**Opción A - Usar npm (todas las plataformas):**
```bash
npm run setup
```

**Opción B - Windows:**
```bash
setup.bat
```

**Opción C - Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

El script interactivo te pedirá:
- Contraseña de PostgreSQL
- Configuración opcional del servidor (puertos, URLs)
- Generará automáticamente los archivos `.env`
- Instalará todas las dependencias

### 3. Configuración Manual (Opcional)

Si prefieres configurar manualmente:

**Backend:**
```bash
cd backend
npm install
```

Crear archivo `.env` en la carpeta `backend` basándote en `backend/.env.example`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geriatric_app
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgresql_aqui
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:5173
```

**Frontend:**
```bash
cd ..
npm install
```

Crear archivo `.env` en la carpeta raíz basándote en `.env.example`:

```env
VITE_API_URL=http://localhost:3000
```

## 🗄️ Configuración de Base de Datos

La base de datos se inicializa **automáticamente** al iniciar el backend por primera vez. El sistema:

1. Crea la base de datos `geriatric_app` si no existe
2. Ejecuta el schema SQL con todas las tablas necesarias
3. Crea **21 usuarios de prueba** (1 admin, 2 jefes, 18 enfermeras)
4. Crea **20 pacientes de prueba** (habitaciones 101-121)
5. Crea **20 medicamentos de prueba** (varios tipos)
6. Crea **notas de enfermería de prueba** (histórico realista)

### Usuarios de Prueba

**Usuarios Principales:**
| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@geriatric.com | admin123 |
| Jefe de Enfermería | carlos.rodriguez@geriatric.com | jefe123 |
| Jefe de Enfermería | laura.fernandez@geriatric.com | jefe123 |
| Enfermera | maria.garcia@geriatric.com | enfermera123 |
| Enfermera | ana.martinez@geriatric.com | enfermera123 |

**Más Enfermeras Disponibles:**
- carmen.lopez@geriatric.com / enfermera123
- elena.sanchez@geriatric.com / enfermera123
- patricia.romero@geriatric.com / enfermera123
- isabel.torres@geriatric.com / enfermera123
- sofia.ruiz@geriatric.com / enfermera123
- clara.morales@geriatric.com / enfermera123
- julia.ortega@geriatric.com / enfermera123
- marta.castro@geriatric.com / enfermera123
- adriana.vargas@geriatric.com / enfermera123
- valentina.ramos@geriatric.com / enfermera123
- daniela.flores@geriatric.com / enfermera123
- gabriela.mendoza@geriatric.com / enfermera123
- rocio.reyes@geriatric.com / enfermera123
- beatriz.herrera@geriatric.com / enfermera123
- victoria.pena@geriatric.com / enfermera123
- natalia.cruz@geriatric.com / enfermera123

**Total:** 21 usuarios (1 admin, 2 jefes, 18 enfermeras)

## 🏃 Ejecutar la Aplicación

### Opción 1: Backend y Frontend por separado

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
# Desde la carpeta raíz
npm run dev
```

### Opción 2: Solo Backend (ya incluye inicialización de DB)

```bash
cd backend
npm run dev
```

El backend iniciará en `http://localhost:3000`

### Opción 3: Solo Frontend

```bash
npm run dev
```

El frontend iniciará en `http://localhost:5173`

## 🌐 Acceder a la Aplicación

1. Abre tu navegador en `http://localhost:5173`
2. Usa una de las cuentas de prueba para iniciar sesión
3. El sistema cargará automáticamente los datos de prueba

## 📁 Estructura del Proyecto

```
geriatric-app/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuración de base de datos
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── middleware/     # Middleware de autenticación
│   │   ├── models/         # Modelos de datos
│   │   ├── routes/         # Rutas de la API
│   │   └── server.js       # Punto de entrada del servidor
│   ├── database/           # Scripts SQL
│   ├── scripts/            # Scripts de utilidad
│   └── package.json
├── src/
│   ├── components/         # Componentes React
│   ├── context/            # Contextos de React
│   ├── services/           # Servicios API
│   ├── views/              # Vistas de la aplicación
│   ├── types/              # Definiciones TypeScript
│   └── utils/              # Utilidades
├── public/                 # Archivos estáticos
└── package.json
```

## 🔧 Scripts Disponibles

### Backend

```bash
npm run dev          # Iniciar servidor en modo desarrollo
npm start            # Iniciar servidor en modo producción
npm run init-db      # Inicializar base de datos manualmente
```

### Frontend

```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Compilar para producción
npm run preview      # Previsualizar build de producción
```

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/profile` - Obtener perfil

### Pacientes
- `GET /api/pacientes` - Listar pacientes
- `GET /api/pacientes/:id` - Obtener paciente
- `POST /api/pacientes` - Crear paciente
- `PUT /api/pacientes/:id` - Actualizar paciente
- `DELETE /api/pacientes/:id` - Eliminar paciente

### Notas de Enfermería
- `GET /api/notas` - Listar notas
- `GET /api/notas/paciente/:pacienteId` - Notas de un paciente
- `POST /api/notas` - Crear nota
- `PUT /api/notas/:id` - Actualizar nota
- `DELETE /api/notas/:id` - Eliminar nota

### Medicamentos
- `GET /api/medicamentos` - Listar medicamentos
- `GET /api/medicamentos/:id` - Obtener medicamento
- `POST /api/medicamentos` - Crear medicamento
- `PUT /api/medicamentos/:id` - Actualizar medicamento
- `DELETE /api/medicamentos/:id` - Eliminar medicamento

### Medicamentos asignados a pacientes
- `GET /api/medicamentos-pacientes/paciente/:pacienteId` - Medicamentos de un paciente
- `POST /api/medicamentos-pacientes` - Asignar medicamento
- `PUT /api/medicamentos-pacientes/:id` - Actualizar asignación
- `DELETE /api/medicamentos-pacientes/:id` - Eliminar asignación

## 🎨 Características

- ✅ Diseño responsivo (móvil, tablet, desktop)
- ✅ Autenticación con JWT
- ✅ Roles de usuario (Administrador, Enfermera, Jefe de Enfermería)
- ✅ Gestión de pacientes
- ✅ Notas de enfermería
- ✅ Signos vitales
- ✅ Control de medicamentos
- ✅ Alertas de inventario
- ✅ Inicialización automática de base de datos
- ✅ Datos de prueba pre-cargados

## 🐛 Solución de Problemas

### Error: "vite no se reconoce como comando"

```bash
# Instalar dependencias del frontend
npm install
```

### Error: "Connection refused" en PostgreSQL

- Verifica que PostgreSQL esté corriendo
- Verifica que las credenciales en `.env` sean correctas
- Verifica que el puerto 5432 esté disponible

### Error: "Database does not exist"

- El sistema crea la base de datos automáticamente al iniciar el backend
- Si hay problemas, ejecuta manualmente: `cd backend && npm run init-db`

### Error: "EACCES" en Windows

- Ejecuta PowerShell como Administrador
- O usa Git Bash en lugar de PowerShell

## 📝 Notas Importantes

- La primera vez que inicies el backend, se creará la base de datos automáticamente
- Los datos de prueba se cargan solo si la base de datos está vacía
- Las contraseñas de PostgreSQL se configuran mediante variables de entorno (.env)
- Los archivos .env NO se incluyen en el repositorio (ver .gitignore)
- Cada desarrollador debe configurar su propia contraseña de PostgreSQL
- En producción, usar variables de ambiente seguras y hashear contraseñas

## 🤝 Contribuir

Este es un proyecto de desarrollo para uso educativo. Si deseas contribuir:

1. Haz un fork del repositorio
2. Crea una rama para tu feature
3. Haz commit de tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es para uso educativo y de demostración.

## 👥 Equipo

Desarrollado para el curso de desarrollo de aplicaciones web.
