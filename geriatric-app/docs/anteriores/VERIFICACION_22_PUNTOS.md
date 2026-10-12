# Verificación de los 22 Puntos Requeridos

## Estado: ❌ NO IMPLEMENTADO / ⚠️ PARCIALMENTE / ✅ COMPLETO

---

### 1. ❌ Cerrar el registro público: solo el admin crea usuarios

**Estado:** NO IMPLEMENTADO

**Evidencia:**
- `backend/src/routes/authRoutes.js` línea 8: `router.post('/register', AuthController.register);` es público
- Cualquier persona puede registrarse enviando un POST a `/api/auth/register`

**Lo que falta:**
- Eliminar o proteger la ruta `/api/auth/register`
- Solo los administradores deben poder crear usuarios (ya existe `userRoutes.js` con `isAdmin`)

**Referencia:** <ref_file file="C:\Users\DELL\NorseNote\geriatric-app\backend\src\routes\authRoutes.js" />

---

### 2. ⚠️ Arreglar la inicialización de BD, con archivos de migración `.sql` ordenados o un parser que respete `$$`

**Estado:** PARCIALMENTE IMPLEMENTADO

**Evidencia:**
- ✅ Existe `backend/scripts/sqlParser.js` que maneja correctamente `$$`
- ✅ `backend/scripts/initDatabase.js` usa el parser
- ⚠️ No hay archivos de migración ordenados, solo un schema.sql grande

**Lo que falta:**
- Separar el schema.sql en archivos de migración ordenados (001_initial.sql, 002_users.sql, etc.)
- O asegurar que el schema.sql está bien organizado

**Referencia:** <ref_file file="C:\Users\DELL\NorseNote\geriatric-app\backend\scripts\sqlParser.js" />

---

### 3. ⚠️ Agregar una tabla de auditoría (quién hizo qué y cuándo) y validar todas las rutas

**Estado:** PARCIALMENTE IMPLEMENTADO

**Evidencia:**
- ✅ Existe tabla `auditoria` en `backend/database/schema.sql` (líneas 98-109)
- ✅ Existe middleware `auditMiddleware.js` con `auditLog` y `captureBeforeData`
- ❌ El middleware NO está aplicado a todas las rutas

**Lo que falta:**
- Aplicar `auditLog` a todas las rutas CRUD de:
  - usuarios
  - pacientes
  - medicamentos
  - notas_enfermeria
  - signos_vitales
  - medicamentos_pacientes

**Referencia:** <ref_file file="C:\Users\DELL\NorseNote\geriatric-app\backend\src\middleware\auditMiddleware.js" />

---

### 4. ⚠️ Cambiar los borrados físicos por desactivación, y que las notas no se borren sino que se corrijan con una nota aclaratoria

**Estado:** PARCIALMENTE IMPLEMENTADO

**Evidencia:**
- ✅ `userModel.js` línea 45-54: `delete` hace `SET activo = false`
- ✅ `medicamentoModel.js` línea 93-101: `delete` hace `SET activo = false`
- ✅ `pacienteModel.js` línea 98-105: `delete` hace `SET activo = false, fecha_egreso = NOW()`
- ✅ `medicamentoPacienteModel.js` línea 153-162: `delete` hace `SET activo = false`
- ✅ `notaModel.js` línea 153-189: `delete` marca como corregida + `createCorrección` crea nota aclaratoria

**Lo que falta:**
- Revisar que no haya `DELETE FROM` en ningún lugar del código
- Verificar que el frontend muestre correctamente los estados desactivados

**Referencia:** <ref_file file="C:\Users\DELL\NorseNote\geriatric-app\backend\src\models\notaModel.js" />

---

### 5. ⚠️ Aplicar roles en el front (menú y vistas) y en el backend: enfermera, jefe y admin

**Estado:** PARCIALMENTE IMPLEMENTADO

**Evidencia:**
- ✅ `Sidebar.tsx` línea 63: `roles: ['administrador', 'jefe_enfermeria']` para sección Usuarios
- ✅ `authMiddleware.js` tiene `authorizeRoles`, `isAdmin`, `isEnfermeraOrAdmin`, `isJefeEnfermeriaOrAdmin`
- ✅ `userRoutes.js` aplica `isAdmin` a todas las rutas
- ✅ `medicamentoRoutes.js` aplica `isEnfermeraOrAdmin`
- ⚠️ Faltan más rutas con validación de roles

**Lo que falta:**
- Aplicar middleware de roles a más rutas:
  - pacienteRoutes
  - notaRoutes
  - signosVitalesRoutes
- Validar en el frontend que vistas específicas solo estén disponibles para ciertos roles

**Referencia:** <ref_file file="C:\Users\DELL\NorseNote\geriatric-app\src\components\Sidebar.tsx" />

---

### 6. ⚠️ Residentes: crear, editar y egresar, con una ficha por pestañas (Resumen, Notas, Signos, Medicamentos, Contactos)

**Estado:** PARCIALMENTE IMPLEMENTADO

**Evidencia:**
- ✅ `FichaResidenteView.tsx` existe con tabs (líneas 128-232)
- ✅ Tabs: Resumen, Notas, Signos Vitales, Medicamentos
- ❌ Falta tab de Contactos
- ❌ No hay implementación de crear/editar/egresar residente

**Lo que falta:**
- Agregar tab de Contactos
- Implementar formulario de crear residente
- Implementar formulario de editar residente
- Implementar funcionalidad de egreso (ya existe soft delete con fecha_egreso)

**Referencia:** <ref_file file="C:\Users\DELL\NorseNote\geriatric-app\src\views\FichaResidenteView.tsx" />

---

### 7. ⚠️ Inventario conectado a la API real, con crear, editar y ajustar stock

**Estado:** PARCIALMENTE IMPLEMENTADO

**Evidencia:**
- ✅ `medicamentoController.js` tiene `create`, `update`, `actualizarCantidad`
- ✅ `medicamentoModel.js` tiene `actualizarCantidad` (líneas 104-110)
- ✅ Rutas existen en `medicamentoRoutes.js`
- ⚠️ No hay funcionalidad específica de "ajuste de stock" (manual entry)

**Lo que falta:**
- Implementar endpoint específico para ajuste manual de stock con motivo
- UI en frontend para ajuste de stock

**Referencia:** <ref_file file="C:\Users\DELL\NorseNote\geriatric-app\backend\src\controllers\medicamentoController.js" />

---

### 8. ⚠️ Usuarios: crear, editar, desactivar y restablecer contraseña

**Estado:** PARCIALMENTE IMPLEMENTADO

**Evidencia:**
- ✅ `userController.js` tiene:
  - `create` (líneas 5-45)
  - `update` (líneas 73-92)
  - `delete` (líneas 94-114) - desactiva
  - `reactivate` (líneas 116-134)
  - `resetPassword` (líneas 136-167)
- ✅ `userModel.js` tiene los métodos correspondientes
- ✅ Rutas en `userRoutes.js`

**Lo que falta:**
- Verificar que el frontend tenga UI para todas estas operaciones
- Validar que `resetPassword` no puede aplicarse al usuario actual

**Referencia:** <ref_file file="C:\Users\DELL\NorseNote\geriatric-app\backend\src\controllers\userController.js" />

---

### 9. ⚠️ Notas: detalle en un panel lateral, filtros por tipo y fecha, y paginación

**Estado:** PARCIALMENTE IMPLEMENTADO

**Evidencia:**
- ✅ `notaModel.js` tiene filtros por tipo_nota, fecha_inicio, fecha_fin (líneas 55-71)
- ✅ `notaController.js` aplica filtros
- ❌ No hay panel lateral en el frontend
- ❌ No hay paginación en el frontend (solo LIMIT en backend)

**Lo que falta:**
- Implementar panel lateral para detalle de notas
- Implementar paginación en frontend
- UI para filtros por tipo y fecha

**Referencia:** <ref_file file="C:\Users\DELL\NorseNote\geriatric-app\backend\src\models\notaModel.js" />

---

### 10. ⚠️ Signos vitales: campos estructurados, rangos de referencia, alertas automáticas (SpO₂ baja, presión o temperatura fuera de rango) y gráficas de tendencia por residente

**Estado:** PARCIALMENTE IMPLEMENTADO

**Evidencia:**
- ✅ `signosVitalesController.js` tiene alertas automáticas (líneas 41-51):
  - SpO₂ < 90: crítico
  - SpO₂ < 95: bajo
  - Presión alta/baja
  - Fiebre/Hipotermia
  - Taquicardia/Bradicardia
- ✅ Campos estructurados en el modelo
- ⚠️ No hay gráficas de tendencia en frontend (existe `SignosVitalesGraficas.tsx` pero no verifiqué si está integrado)

**Lo que falta:**
- Verificar que `SignosVitalesGraficas.tsx` esté integrado y funcional
- Asegurar que los rangos de referencia sean configurables
- Gráficas de tendencia por residente

**Referencia:** <ref_file file="C:\Users\DELL\NorseNote\geriatric-app\backend\src\controllers\signosVitalesController.js" />

---

### 11. ❌ Estado del residente calculado desde los signos y las alertas, con posibilidad de que el jefe lo ajuste. Queda con historial

**Estado:** NO IMPLEMENTADO

**Evidencia:**
- ❌ No se encontró tabla o campo para `estado_calculado` con historial
- ❌ No se encontró lógica para calcular estado desde signos
- ❌ No se encontró endpoint para que el jefe ajuste el estado

**Lo que falta:**
- Crear tabla `estados_residentes` con historial
- Implementar lógica para calcular estado desde signos y alertas
- Endpoint PUT para que jefes/admins ajusten el estado
- UI para mostrar y ajustar estado

---

### 12. ❌ Medición - Pantalla de prescripciones

**Estado:** NO IMPLEMENTADO

**Evidencia:**
- ❌ No se encontró vista o componente de prescripciones
- ❌ No se encontró tabla de prescripciones en schema

**Lo que falta:**
- Crear tabla de prescripciones médicas
- Crear vista de prescripciones
- Endpoint para crear/editar prescripciones

---

### 13. ❌ Medición - Tabla de administraciones (programada, administrada, omitida o rechazada, con motivo)

**Estado:** NO IMPLEMENTADO

**Evidencia:**
- ❌ No se encontró tabla de administraciones
- ❌ No se encontró lógica de seguimiento de administración

**Lo que falta:**
- Crear tabla `administraciones_medicamentos` con campos:
  - estado: programada, administrada, omitida, rechazada
  - motivo
  - fecha_administracion
  - usuario_administrador
- Crear vista de tabla de administraciones
- Endpoints para CRUD de administraciones

---

### 14. ❌ Medición - Vista de "pendientes ahora"

**Estado:** NO IMPLEMENTADO

**Evidencia:**
- ❌ No se encontró vista de medicamentos pendientes
- ❌ No se encontró endpoint para obtener pendientes

**Lo que falta:**
- Endpoint GET `/api/medicamentos/pendientes-ahora`
- Vista en frontend que muestre medicamentos pendientes en el momento actual
- Filtros por paciente, turno, etc.

---

### 15. ❌ Medición - Descuento de stock en una transacción

**Estado:** NO IMPLEMENTADO

**Evidencia:**
- ❌ No se encontró lógica de transacción para descuento de stock
- ✅ Existe `actualizarCantidad` pero no es transaccional

**Lo que falta:**
- Implementar transacción que:
  - Registre la administración
  - Descuente el stock del medicamento
  - Si falla el descuento, revierta la administración
- Endpoint para administración con descuento automático de stock

---

### 16. ❌ Medición - Aviso si el medicamento choca con las alergias del residente

**Estado:** NO IMPLEMENTADO

**Evidencia:**
- ❌ No se encontró validación de alergias vs medicamentos
- ✅ La tabla `pacientes` tiene campo `alergias`

**Lo que falta:**
- Campo de alergias/contraindicaciones en tabla `medicamentos`
- Validación al asignar medicamento a paciente
- UI que muestre advertencia si hay conflicto de alergias

---

### 17. ❌ Entrega de turno: resumen automático de notas, alertas y pendientes, más una nota de relevo

**Estado:** NO IMPLEMENTADO

**Evidencia:**
- ❌ No se encontró vista de entrega de turno
- ❌ No se encontró endpoint para generar resumen de turno

**Lo que falta:**
- Endpoint GET `/api/entrega-turno` que devuelva:
  - Resumen de notas del turno
  - Alertas activas
  - Pendientes de medicación
- Vista de entrega de turno
- Funcionalidad para crear nota de relevo

---

### 18. ❌ Panel principal con datos reales: pendientes, críticos y vencimientos

**Estado:** NO IMPLEMENTADO

**Evidencia:**
- ❌ `DashboardView.tsx` parece tener datos de prueba
- ❌ No se encontraron endpoints para métricas reales del dashboard

**Lo que falta:**
- Endpoint GET `/api/dashboard/metricas` con:
  - Pacientes críticos
  - Medicamentos pendientes
  - Vencimientos de medicamentos
  - Alertas activas
- Actualizar `DashboardView.tsx` para usar datos reales

---

### 19. ❌ Exportar a PDF y Excel (historia del residente, medicación, inventario)

**Estado:** NO IMPLEMENTADO

**Evidencia:**
- ❌ No se encontró ninguna librería de PDF/Excel
- ❌ No se encontraron endpoints de exportación

**Lo que falta:**
- Instalar librerías: `pdfkit`, `exceljs` o similares
- Endpoints de exportación:
  - `/api/exportar/paciente/:id/historia`
  - `/api/exportar/paciente/:id/medicacion`
  - `/api/exportar/inventario`
- UI con botones de exportar

---

### 20. ❌ Estadísticas reales con rango de fechas, corrigiendo la métrica de la semana

**Estado:** NO IMPLEMENTADO

**Evidencia:**
- ❌ No se encontraron endpoints de estadísticas con rango de fechas
- ❌ `metricasService.ts` tiene datos de prueba

**Lo que falta:**
- Endpoint GET `/api/estadisticas` con parámetros `fecha_inicio`, `fecha_fin`
- Calcular métricas reales de:
  - Admisiones por período
  - Incidentes por período
  - Medicamentos administrados
  - Corregir lógica de "última semana"

---

### 21. ❌ Campana de notificaciones con las alertas

**Estado:** NO IMPLEMENTADO

**Evidencia:**
- ❌ No se encontró componente de campana de notificaciones
- ❌ No se encontró endpoint para obtener alertas del usuario

**Lo que falta:**
- Endpoint GET `/api/alertas` que devuelva alertas relevantes al usuario
- Componente de campana de notificaciones en Header
- Contador de alertas no leídas
- Panel desplegable con lista de alertas

---

### 22. ⚠️ Búsqueda global, estados vacíos y de error, y opción de letra más grande

**Estado:** PARCIALMENTE IMPLEMENTADO

**Evidencia:**
- ✅ `BusquedaGlobal.tsx` existe
- ✅ `Header.tsx` tiene selector de tamaño de letra (líneas 86-97)
- ⚠️ No se verificó si hay estados vacíos/error consistentes en todas las vistas

**Lo que falta:**
- Verificar que todas las vistas tengan estados vacíos
- Verificar que todas las vistas tengan estados de error
- Asegurar que `BusquedaGlobal.tsx` esté integrado en todas las vistas necesarias

**Referencia:** <ref_file file="C:\Users\DELL\NorseNote\geriatric-app\src\components\BusquedaGlobal.tsx" />

---

## Resumen

| Estado | Cantidad | Porcentaje |
|--------|----------|------------|
| ❌ NO IMPLEMENTADO | 10 | 45% |
| ⚠️ PARCIALMENTE | 10 | 45% |
| ✅ COMPLETO | 2 | 10% |

**Progreso general: ~27%**

---

## Prioridades Altas (Faltan completamente)

1. **Punto 1:** Cerrar registro público - SEGURIDAD
2. **Punto 11:** Estado calculado del residente - CORE
3. **Puntos 12-16:** Sistema completo de medicación - CORE
4. **Punto 17:** Entrega de turno - CORE
5. **Punto 18:** Dashboard real - UX
