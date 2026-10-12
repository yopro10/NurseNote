# NurseNote · SIG Geriátrico

Sistema de notas de enfermería y gestión de un hogar geriátrico (React + TypeScript + Vite / Node + Express + PostgreSQL).

## Ejecutar

```bash
# 1) Backend (crea la BD, aplica migraciones y carga datos de demostración)
cd backend
cp .env.example .env        # y pon tu DB_PASSWORD de PostgreSQL
npm install
npm run dev                 # http://localhost:3000

# 2) Frontend (otra terminal)
cd ..
npm install
npm run dev                 # http://localhost:5173
```

Si ya tenías la BD de una versión anterior, al arrancar el backend se migra sola (migración `011`) y se completa la demo
(documentos, signos vitales, prescripciones, fechas de caducidad vigentes). Para empezar de cero: `cd backend && npm run reset-db`.

Cuentas de demostración: `admin@geriatric.com / admin123` · `carlos.rodriguez@geriatric.com / jefe123` · `maria.garcia@geriatric.com / enfermera123`.

## Pruebas

```bash
cd backend && npm run dev          # backend encendido
cd backend && npm run test-api     # 119 verificaciones de la API (permisos, validaciones, medicación, exportación…)
npm run test:ui                    # recorre cada pantalla y botón principal de la interfaz contra el backend real
```

## Funcionalidades

| Área | Qué hace |
|---|---|
| Acceso | Registro público cerrado; las cuentas las crea un administrador. Login valida cuenta activa; sesión expirada → vuelve al login. |
| Residentes | Fichas compactas, filtros, alta/edición, egreso con motivo (suspende prescripciones y cancela dosis futuras) y reingreso. |
| Estado calculado | Se calcula con el último registro de signos (48 h) y dosis omitidas; cada cambio queda en el **historial** (automático o ajuste manual con motivo). |
| Signos vitales | Validación de rangos plausibles, alertas en vivo al digitar, tendencias en gráficas, resumen por residente. |
| Notas | Listado global con filtros/paginación, panel de detalle, edición del autor (24 h) y anulación con motivo (no se borran). |
| Medicación | Prescripciones con horarios → dosis programadas del día; administrar / omitir / rechazar; dosis extra PRN; **descuenta stock**; **valida alergias** (bloquea; solo jefe/admin puede confirmar excepción); bloquea vencidos y sin stock. |
| Inventario | Estados (vencido, por vencer, stock bajo), movimientos con trazabilidad, panel con residentes y movimientos. |
| Entrega de turno | Resumen automático (críticos, dosis atrasadas/omitidas, signos alterados, notas, inventario), receptor, notas, confirmación y PDF. |
| Dashboard | 100 % datos reales: KPIs, residentes que requieren atención, próximas dosis, actividad 7 días, signos alterados. |
| Estadísticas | Rango de fechas; barras, líneas y circulares; exportación. |
| Notificaciones | Campana con alertas vivas (inventario, críticos, dosis atrasadas, signos, relevos) y marcado como leídas por usuario. |
| Exportar | PDF y Excel de residentes, inventario, notas, signos, administraciones, estadísticas, ficha y entrega de turno. |

## Permisos

| Acción | Enfermera | Jefe | Admin |
|---|:-:|:-:|:-:|
| Ver todo, registrar notas/signos, administrar dosis | ✔ | ✔ | ✔ |
| Crear/editar residentes, egresos, ajustar estado | | ✔ | ✔ |
| Prescribir, gestionar inventario | | ✔ | ✔ |
| Ver usuarios | | ✔ | ✔ |
| Crear/editar/desactivar usuarios | | | ✔ |

La documentación histórica anterior está en `docs/anteriores/`.
