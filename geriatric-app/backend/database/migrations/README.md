# Migraciones de Base de Datos

Este directorio contiene las migraciones SQL ordenadas para el sistema NurseNote.

## Convención de Nombres

- `001_initial_schema.sql` - Tablas base (usuarios, pacientes, medicamentos)
- `002_medicamentos_pacientes.sql` - Asignación de medicamentos
- `003_notas_enfermeria.sql` - Notas de enfermería
- `004_signos_vitales.sql` - Signos vitales
- `005_alertas_medicamentos.sql` - Alertas de medicamentos
- `006_auditoria.sql` - Sistema de auditoría
- `007_administraciones_medicamentos.sql` - Administración de medicamentos
- `008_entregas_turno.sql` - Entregas de turno
- `009_estado_paciente.sql` - Estado calculado de pacientes
- `010_triggers_alertas.sql` - Triggers automáticos

## Ejecutar Migraciones

Las migraciones se ejecutan automáticamente al inicializar la base de datos mediante el script `initDatabase.js`.

## Agregar Nueva Migración

1. Crear un nuevo archivo con el siguiente número de secuencia (ej: `011_nueva_funcionalidad.sql`)
2. Usar `CREATE TABLE IF NOT EXISTS` para tablas
3. Usar `CREATE INDEX IF NOT EXISTS` para índices
4. Usar `ALTER TABLE` con verificación de existencia para columnas
5. Actualizar este README con la descripción

## Notas

- Las migraciones usan `IF NOT EXISTS` para poder ejecutarse múltiples veces sin errores
- El parser SQL maneja correctamente los delimitadores `$$` para funciones y triggers
- Los triggers se eliminan y recrean para asegurar la versión más reciente
