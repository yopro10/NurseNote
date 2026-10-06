# Backend API - Sistema de Gestión de Hogares Geriátricos

## Requisitos previos

- Node.js (v18 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```
Editar el archivo `.env` con tus credenciales de PostgreSQL.

3. Crear la base de datos:
```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE geriatric_app;

# Salir
\q
```

4. Ejecutar el schema de la base de datos:
```bash
psql -U postgres -d geriatric_app -f database/schema.sql
```

## Ejecución

### Modo desarrollo:
```bash
npm run dev
```

### Modo producción:
```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000`

## Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil del usuario (requiere token)

### Usuarios (Solo administradores)
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Pacientes
- `POST /api/pacientes` - Crear paciente
- `GET /api/pacientes` - Obtener todos los pacientes
- `GET /api/pacientes/:id` - Obtener paciente por ID
- `PUT /api/pacientes/:id` - Actualizar paciente
- `DELETE /api/pacientes/:id` - Eliminar paciente
- `GET /api/pacientes/habitacion/:habitacion` - Obtener pacientes por habitación

### Notas de Enfermería
- `POST /api/notas` - Crear nota de enfermería
- `GET /api/notas` - Obtener todas las notas
- `GET /api/notas/:id` - Obtener nota por ID
- `GET /api/notas/paciente/:pacienteId` - Obtener notas de un paciente
- `GET /api/notas/paciente/:pacienteId/ultimas` - Obtener últimas notas de un paciente
- `PUT /api/notas/:id` - Actualizar nota
- `DELETE /api/notas/:id` - Eliminar nota

### Medicamentos
- `POST /api/medicamentos` - Crear medicamento
- `GET /api/medicamentos` - Obtener todos los medicamentos
- `GET /api/medicamentos/:id` - Obtener medicamento por ID
- `PUT /api/medicamentos/:id` - Actualizar medicamento
- `DELETE /api/medicamentos/:id` - Eliminar medicamento
- `PATCH /api/medicamentos/:id/cantidad` - Actualizar cantidad de medicamento
- `GET /api/medicamentos/alertas` - Obtener alertas de medicamentos
- `GET /api/medicamentos/proximos-vencer` - Obtener medicamentos próximos a vencer
- `GET /api/medicamentos/vencidos` - Obtener medicamentos vencidos
- `GET /api/medicamentos/bajo-stock` - Obtener medicamentos con stock bajo

### Asignación de Medicamentos a Pacientes
- `POST /api/medicamentos/asignar` - Asignar medicamento a paciente
- `GET /api/medicamentos/paciente/:pacienteId` - Obtener medicamentos de un paciente
- `GET /api/medicamentos/medicamento/:medicamentoId/pacientes` - Obtener pacientes con un medicamento
- `PUT /api/medicamentos/asignacion/:id` - Actualizar asignación
- `DELETE /api/medicamentos/asignacion/:id` - Eliminar asignación

## Autenticación

Para acceder a las rutas protegidas, debes incluir el token JWT en el header:

```
Authorization: Bearer <tu_token>
```

## Roles de Usuario

- `administrador`: Acceso completo a todas las funcionalidades
- `jefe_enfermeria`: Supervisión y gestión completa
- `enfermera`: Registro y consulta de información

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración de PostgreSQL
│   ├── controllers/
│   │   ├── authController.js    # Controlador de autenticación
│   │   ├── userController.js    # Controlador de usuarios
│   │   ├── pacienteController.js # Controlador de pacientes
│   │   ├── notaController.js    # Controlador de notas
│   │   └── medicamentoController.js # Controlador de medicamentos
│   ├── middleware/
│   │   └── authMiddleware.js    # Middleware de autenticación
│   ├── models/
│   │   ├── userModel.js         # Modelo de usuarios
│   │   ├── pacienteModel.js     # Modelo de pacientes
│   │   ├── notaModel.js         # Modelo de notas
│   │   ├── medicamentoModel.js  # Modelo de medicamentos
│   │   └── medicamentoPacienteModel.js # Modelo de asignación
│   ├── routes/
│   │   ├── authRoutes.js        # Rutas de autenticación
│   │   ├── userRoutes.js        # Rutas de usuarios
│   │   ├── pacienteRoutes.js    # Rutas de pacientes
│   │   ├── notaRoutes.js        # Rutas de notas
│   │   └── medicamentoRoutes.js # Rutas de medicamentos
│   └── server.js                # Punto de entrada
├── database/
│   └── schema.sql               # Schema de la base de datos
├── .env                         # Variables de entorno
├── .env.example                 # Ejemplo de variables de entorno
├── package.json
└── README.md
```