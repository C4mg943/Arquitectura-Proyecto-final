# Draft: Reestructuración del Modelo de Dominio PDIA

## Requerimiento del Usuario

El usuario identificó un problema en la arquitectura actual:

**Arquitectura ACTUAL (incorrecta):**
```
Usuario (Productor) → Parcela → Cultivo
```

**Arquitectura CORRECTA (requerida):**
```
Usuario (Productor) → Finca(s) → Parcela(s) → Cultivo(s)
```

Además, se necesita implementar la gestión de operarios:
- Un agricultor puede añadir operarios
- Los operarios se asignan a parcelas específicas
- Los operarios solo ven y pueden trabajar en sus parcelas asignadas

## Requisitos Funcionales Relacionados

### Gestión de Operarios (RF66-RF71)
- **RF66**: Registrar operario (nombre, identificación, email, contraseña)
- **RF67**: Asignar operario a parcela específica
- **RF68**: Desasignar operario de parcela
- **RF69**: Login de operario (email + contraseña)
- **RF70**: Operario solo ve parcelas/cultivos asignados
- **RF71**: Productor consulta lista de operarios y sus parcelas

### Gestión de Parcelas (RF53-RF56)
- **RF53**: Registrar parcela (nombre, municipio, hectáreas, coordenadas)
- **RF54**: Modificar información de parcela
- **RF55**: Eliminar parcela con cultivos asociados
- **RF56**: Listar parcelas del productor

## Modelo de Dominio Propuesto

```
Usuario
├── id, nombre, identificacion, email, password, rol
└── rol: PRODUCTOR | OPERARIO | TECNICO | ADMINISTRADOR

Finca (NUEVA ENTIDAD)
├── id, nombre, ubicacion (municipio), descripcion
└── propietario: Usuario (rol PRODUCTOR)

Parcela (MODIFICAR - añadir FK a Finca)
├── id, nombre, hectareas, latitud, longitud
└── pertenece a: Finca (en vez de directo a Usuario)

AsignacionOperario (NUEVA ENTIDAD)
├── id
├── operario: Usuario (rol OPERARIO)
├── parcela: Parcela
└── fechaAsignacion

Cultivo (SIN CAMBIOS - ya pertenece a Parcela)
├── id, tipoCultivo, fechaSiembra, estado, observaciones
└── pertenece a: Parcela
```

## Estado del Análisis

- [ ] Pendiente: Resultados del análisis de modelos actuales
- [ ] Pendiente: Resultados del análisis de esquema BD
- [ ] Pendiente: Resultados del análisis de frontend
- [ ] Pendiente: Resultados del análisis de operarios

## Decisiones Confirmadas

1. **Nueva entidad Finca**: Se insertará entre Usuario y Parcela
2. **Jerarquía completa**: Usuario → Finca → Parcela → Cultivo
3. **Operarios**: Entidad de asignación many-to-many entre Operario y Parcela

## Open Questions

1. ¿Qué atributos adicionales necesita la entidad Finca además de nombre y ubicación?
2. ¿Un operario puede estar asignado a parcelas de diferentes fincas del mismo productor?
3. ¿La migración de datos existentes se hará con una "finca por defecto" para los registros actuales?
4. ¿Hay datos de producción que migrar o es un proyecto nuevo?

---

*Última actualización: Esperando resultados de análisis de agentes*
