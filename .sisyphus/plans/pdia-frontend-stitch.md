# PDIA Frontend - Implementación del Sistema de Diseño Stitch

## TL;DR

> **Quick Summary**: Transformar los mockups HTML de Stitch en componentes React + TypeScript + Tailwind, aplicando el sistema de diseño "Organic Brutalism" con paleta terra_core, tipografía Manrope/Inter, y soporte offline/PWA.
> 
> **Deliverables**:
> - Sistema de diseño configurado en Tailwind (colores, tipografía, spacing)
> - Componentes compartidos de layout (AppShell, TopBar, SideNav, BottomNav)
> - 4 páginas principales convertidas: Login, Dashboard, Parcelas, Actividades
> - Indicadores de estado offline funcionales
> - Build sin errores TypeScript
> 
> **Estimated Effort**: Medium (2-3 días de trabajo)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 2 → Tasks 3-6 (paralelo) → Tasks 7-10 (paralelo) → Task 11

---

## Context

### Original Request
Implementar el frontend de PDIA basándose en los diseños de Stitch (mockups HTML + screenshots) con el sistema de diseño terra_core.

### Interview Summary
**Key Discussions**:
- Stack: React + Tailwind CSS + TypeScript (sin Next.js)
- Target: PWA mobile-first para productores rurales con Android de gama baja
- Conectividad: Sistema DEBE funcionar offline
- Diseño: "Organic Brutalism" - sin bordes de 1px, layering tonal, glassmorphism

**Research Findings**:
- terra_core/DESIGN.md define paleta completa con tokens Material Design
- Tipografía: Manrope (headlines) + Inter (body/labels)
- Regla "No-Line": Usar shifts de background en lugar de borders
- Min-height botones: 56px para manos con guantes
- Glassmorphism: `bg-surface/80 backdrop-blur-md` para navegación flotante

### Design System Extraction

**Color Palette (from terra_core/DESIGN.md)**:
```
primary: #154212          primary-container: #2d5a27
on-primary: #ffffff       on-primary-container: #bcf0ae
surface: #f7faf5          surface-container-lowest: #ffffff
surface-container-low: #f1f4ef    surface-container-high: #e6e9e4
surface-dim: #d8dbd6      tertiary: #003c60
tertiary-container: #005484       secondary: #7a5649
secondary-container: #fdcdbc      error: #ba1a1a
error-container: #ffdad6  on-surface: #191c1a
on-surface-variant: #42493e       outline: #72796e
outline-variant: #c2c9bb  primary-fixed: #bcf0ae
```

**Typography**:
- Headlines: `font-family: 'Manrope', sans-serif` (600-800 weight)
- Body/Labels: `font-family: 'Inter', sans-serif` (400-600 weight)

**Key Components Identified**:
1. TopAppBar - fixed, glassmorphic
2. SideNavBar (Desktop) - 288px width
3. BottomNavBar (Mobile) - fixed bottom
4. Cards - surface-container-lowest, rounded-2xl/3xl, 24px padding
5. Weather Widget - gradient tertiary
6. Offline Banner - error-container bg
7. FAB - 64px, bottom-right
8. Activity Timeline - type icons
9. Parcel Cards - image + stats
10. Status Badges - colored indicators

---

## Work Objectives

### Core Objective
Convertir los mockups HTML de Stitch a componentes React funcionales siguiendo el sistema de diseño terra_core "Organic Brutalism".

### Concrete Deliverables
- `pdia/frontend/src/index.css` - Tema Tailwind completo
- `pdia/frontend/src/shared/components/layout/` - AppShell, TopBar, SideNav, BottomNav
- `pdia/frontend/src/shared/components/common/` - Button, Card, Badge, Input
- `pdia/frontend/src/shared/components/feedback/` - OfflineBanner, LoadingSpinner
- `pdia/frontend/src/features/auth/pages/LoginPage.tsx` - Rediseñado
- `pdia/frontend/src/features/dashboard/pages/DashboardPage.tsx` - Rediseñado
- `pdia/frontend/src/features/parcels/pages/ParcelsPage.tsx` - Rediseñado
- `pdia/frontend/src/features/activities/pages/ActivitiesPage.tsx` - Rediseñado

### Definition of Done
- [ ] `npm run build` pasa sin errores
- [ ] Todas las páginas siguen el sistema de diseño terra_core
- [ ] Indicador offline visible cuando no hay conexión
- [ ] Navegación responsive (SideNav desktop, BottomNav mobile)
- [ ] Tipografía Manrope + Inter cargada correctamente

### Must Have
- Paleta de colores terra_core completa en Tailwind
- Componentes sin borders de 1px (usar tonal layering)
- Botones con min-height 56px
- Mobile-first responsive
- Indicador visual de modo offline

### Must NOT Have (Guardrails)
- NO usar borders de 1px para seccionar (usar background shifts)
- NO usar negro puro (#000000) - usar on-surface (#191c1a)
- NO usar shadows pesados - usar tonal layering
- NO cambiar de stack (mantener React + Tailwind, sin Next.js)
- NO implementar lógica de backend - solo UI
- NO usar `any` en TypeScript

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - Verificación por build y lint

### Test Decision
- **Infrastructure exists**: NO (no hay tests configurados aún)
- **Automated tests**: None (se verificará por build)
- **Framework**: N/A

### QA Policy
- Verificación primaria: `npm run build` debe pasar
- Verificación secundaria: `npm run lint` sin errores críticos
- Verificación visual: Comparar screenshots con mockups de Stitch

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Fundación - debe completarse primero):
├── Task 1: Configurar tema Tailwind con colores terra_core [quick]
├── Task 2: Configurar tipografía Manrope + Inter [quick]
└── (Bloqueante para todas las demás tareas)

Wave 2 (Componentes compartidos - paralelo):
├── Task 3: Crear componentes de layout (AppShell, TopBar) [visual-engineering]
├── Task 4: Crear SideNav (desktop) y BottomNav (mobile) [visual-engineering]
├── Task 5: Crear componentes comunes (Button, Card, Badge) [visual-engineering]
└── Task 6: Crear componentes de feedback (OfflineBanner) [quick]

Wave 3 (Páginas - paralelo):
├── Task 7: Implementar LoginPage con diseño Stitch [visual-engineering]
├── Task 8: Implementar DashboardPage con weather widget [visual-engineering]
├── Task 9: Implementar ParcelsPage con cards [visual-engineering]
└── Task 10: Implementar ActivitiesPage con timeline [visual-engineering]

Wave FINAL:
└── Task 11: Integración, App.tsx con layout, verificación build [quick]
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1    | -          | 2, 3-11 |
| 2    | 1          | 3-11 |
| 3    | 2          | 7-11 |
| 4    | 2          | 7-11 |
| 5    | 2          | 7-10 |
| 6    | 2          | 7-10 |
| 7    | 3, 5       | 11 |
| 8    | 3, 4, 5, 6 | 11 |
| 9    | 3, 4, 5    | 11 |
| 10   | 3, 4, 5, 6 | 11 |
| 11   | 7-10       | - |

### Agent Dispatch Summary

- **Wave 1**: 2 tasks → `quick` (configuración)
- **Wave 2**: 4 tasks → 3× `visual-engineering`, 1× `quick`
- **Wave 3**: 4 tasks → 4× `visual-engineering`
- **Wave FINAL**: 1 task → `quick`

---

## TODOs

- [ ] 1. Configurar tema Tailwind con colores terra_core

  **What to do**:
  - Editar `pdia/frontend/src/index.css` para añadir variables CSS con la paleta completa
  - Configurar los colores como custom properties para Tailwind v4
  - Incluir: primary, surface (todos los niveles), tertiary, secondary, error, outline
  - Añadir la textura de grano sutil (2% noise) como clase opcional

  **Must NOT do**:
  - No usar borders de 1px - seguir la regla "No-Line"
  - No usar negro puro (#000000)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (es la primera tarea)
  - **Blocked By**: None
  - **Blocks**: Tasks 2-11

  **References**:
  - `pdia/stitch/stitch/terra_core/DESIGN.md` - Paleta completa de colores
  - `pdia/frontend/src/index.css` - Archivo actual a modificar

  **Acceptance Criteria**:
  - [ ] Todas las variables CSS de color definidas en :root
  - [ ] Clases Tailwind personalizadas disponibles (bg-primary, text-on-surface, etc.)
  - [ ] `npm run build` pasa

  **Commit**: YES
  - Message: `feat(frontend): add terra_core color palette to tailwind`
  - Files: `pdia/frontend/src/index.css`

---

- [ ] 2. Configurar tipografía Manrope + Inter

  **What to do**:
  - Añadir imports de Google Fonts para Manrope e Inter en index.css
  - Configurar font-family variables para headlines (Manrope) y body (Inter)
  - Definir las clases tipográficas según terra_core: display-lg, headline-md, title-lg, body-lg, label-md

  **Must NOT do**:
  - No usar fonts del sistema para textos importantes

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depende de Task 1)
  - **Blocked By**: Task 1
  - **Blocks**: Tasks 3-11

  **References**:
  - `pdia/stitch/stitch/terra_core/DESIGN.md:35-44` - Tabla de tipografía
  - `pdia/frontend/src/index.css` - Archivo a modificar

  **Acceptance Criteria**:
  - [ ] Fonts Manrope e Inter cargando desde Google Fonts
  - [ ] Clases .font-headline y .font-body disponibles
  - [ ] `npm run build` pasa

  **Commit**: YES (agrupa con Task 1)
  - Message: `feat(frontend): configure typography manrope + inter`
  - Files: `pdia/frontend/src/index.css`

---

- [ ] 3. Crear componentes de layout (AppShell, TopBar)

  **What to do**:
  - Crear `pdia/frontend/src/shared/components/layout/AppShell.tsx`
    - Layout principal que envuelve todas las páginas autenticadas
    - Incluye TopBar, área de contenido, y slot para navegación
  - Crear `pdia/frontend/src/shared/components/layout/TopBar.tsx`
    - Barra superior fija con glassmorphism: `bg-surface/80 backdrop-blur-md`
    - Logo PDIA a la izquierda
    - Icono de notificaciones y avatar a la derecha
    - Sin borders - usar tonal layering

  **Must NOT do**:
  - No usar borders de 1px
  - No usar shadows pesados

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2, con Tasks 4, 5, 6)
  - **Blocked By**: Tasks 1, 2
  - **Blocks**: Tasks 7-11

  **References**:
  - `pdia/stitch/stitch/dashboard_pdia/code.html:1-50` - Estructura del header
  - `pdia/stitch/stitch/terra_core/DESIGN.md:26-28` - Glassmorphism specs
  - `pdia/frontend/src/shared/components/` - Directorio destino

  **Acceptance Criteria**:
  - [ ] AppShell.tsx exporta componente funcional
  - [ ] TopBar.tsx con glassmorphism aplicado
  - [ ] Props tipados correctamente (sin `any`)
  - [ ] `npm run build` pasa

  **Commit**: YES (grupo Wave 2)
  - Message: `feat(frontend): add AppShell and TopBar layout components`
  - Files: `shared/components/layout/AppShell.tsx`, `shared/components/layout/TopBar.tsx`

---

- [ ] 4. Crear SideNav (desktop) y BottomNav (mobile)

  **What to do**:
  - Crear `pdia/frontend/src/shared/components/layout/SideNav.tsx`
    - Sidebar de 288px para desktop (hidden en mobile)
    - Background: surface-container-low
    - Items de navegación con íconos: Dashboard, Parcelas, Cultivos, Actividades, Clima, Alertas, Reportes
    - Estado activo con primary-fixed background
  - Crear `pdia/frontend/src/shared/components/layout/BottomNav.tsx`
    - Navegación inferior fija para mobile (hidden en desktop)
    - Glassmorphism: `bg-surface/80 backdrop-blur-md`
    - 5 items principales con íconos

  **Must NOT do**:
  - No usar borders para separar items
  - No romper responsive (mobile-first)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2, con Tasks 3, 5, 6)
  - **Blocked By**: Tasks 1, 2
  - **Blocks**: Tasks 7-11

  **References**:
  - `pdia/stitch/stitch/dashboard_pdia/code.html:51-120` - Sidebar HTML
  - `pdia/stitch/stitch/terra_core/DESIGN.md:19-24` - Surface hierarchy
  - `pdia/frontend/public/icons.svg` - Íconos disponibles

  **Acceptance Criteria**:
  - [ ] SideNav visible solo en md+ breakpoint
  - [ ] BottomNav visible solo en mobile (<md)
  - [ ] Navegación funcional con react-router-dom
  - [ ] `npm run build` pasa

  **Commit**: YES (grupo Wave 2)
  - Message: `feat(frontend): add SideNav and BottomNav navigation`
  - Files: `shared/components/layout/SideNav.tsx`, `shared/components/layout/BottomNav.tsx`

---

- [ ] 5. Crear componentes comunes (Button, Card, Badge, Input)

  **What to do**:
  - Crear `pdia/frontend/src/shared/components/common/Button.tsx`
    - Variantes: primary, secondary, tertiary (según terra_core)
    - Min-height: 56px para touch targets grandes
    - Border-radius: lg (0.5rem)
    - Sin borders - solo color de fondo
  - Crear `pdia/frontend/src/shared/components/common/Card.tsx`
    - Background: surface-container-lowest
    - Padding: 24px interno
    - Border-radius: 2xl o 3xl
    - Sin borders - usar tonal layering
  - Crear `pdia/frontend/src/shared/components/common/Badge.tsx`
    - Variantes: success (primary-fixed), warning (secondary-container), error (error-container)
  - Crear `pdia/frontend/src/shared/components/common/Input.tsx`
    - Background: surface-container-lowest
    - Focus ring con primary color
    - Labels con font-label

  **Must NOT do**:
  - No usar borders de 1px
  - No usar `any` en props

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2, con Tasks 3, 4, 6)
  - **Blocked By**: Tasks 1, 2
  - **Blocks**: Tasks 7-10

  **References**:
  - `pdia/stitch/stitch/terra_core/DESIGN.md:58-66` - Button y Card specs
  - `pdia/stitch/stitch/iniciar_sesi_n_pdia/code.html:150-180` - Input patterns
  - `pdia/frontend/src/shared/components/common/` - Directorio destino

  **Acceptance Criteria**:
  - [ ] Button con 3 variantes funcionando
  - [ ] Card sin borders, con tonal layering
  - [ ] Badge con colores semánticos
  - [ ] Input con focus state correcto
  - [ ] Todos los props tipados con TypeScript
  - [ ] `npm run build` pasa

  **Commit**: YES (grupo Wave 2)
  - Message: `feat(frontend): add common UI components (Button, Card, Badge, Input)`
  - Files: `shared/components/common/Button.tsx`, `shared/components/common/Card.tsx`, `shared/components/common/Badge.tsx`, `shared/components/common/Input.tsx`

---

- [ ] 6. Crear componentes de feedback (OfflineBanner, LoadingSpinner)

  **What to do**:
  - Crear `pdia/frontend/src/shared/components/feedback/OfflineBanner.tsx`
    - Banner fijo en la parte superior cuando hay modo offline
    - Background: error-container (#ffdad6)
    - Texto: on-error-container
    - Ícono de señal con tachado
    - Usa el hook useOffline existente
  - Crear `pdia/frontend/src/shared/components/feedback/LoadingSpinner.tsx`
    - Spinner con color primary
    - Tamaños: sm, md, lg

  **Must NOT do**:
  - No hardcodear estado offline - usar el hook existente

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2, con Tasks 3, 4, 5)
  - **Blocked By**: Tasks 1, 2
  - **Blocks**: Tasks 8, 10

  **References**:
  - `pdia/stitch/stitch/terra_core/DESIGN.md:68-69` - Status indicators
  - `pdia/frontend/src/shared/hooks/useOffline.ts` - Hook existente
  - RF59, RF60 en AGENTS.md - Requisitos de indicador offline

  **Acceptance Criteria**:
  - [ ] OfflineBanner aparece cuando useOffline() retorna true
  - [ ] LoadingSpinner con 3 tamaños
  - [ ] Colores correctos del sistema de diseño
  - [ ] `npm run build` pasa

  **Commit**: YES (grupo Wave 2)
  - Message: `feat(frontend): add feedback components (OfflineBanner, LoadingSpinner)`
  - Files: `shared/components/feedback/OfflineBanner.tsx`, `shared/components/feedback/LoadingSpinner.tsx`

---

- [ ] 7. Implementar LoginPage con diseño Stitch

  **What to do**:
  - Reescribir `pdia/frontend/src/features/auth/pages/LoginPage.tsx`
  - Seguir el mockup de `iniciar_sesi_n_pdia/code.html`:
    - Logo PDIA centrado arriba
    - Card central con inputs de email y contraseña
    - Botón primario "Iniciar Sesión"
    - Link a registro y recuperación de contraseña
  - Usar los componentes creados: Card, Input, Button
  - Background: surface (#f7faf5)
  - Tipografía: headline-md para título

  **Must NOT do**:
  - No implementar lógica de autenticación real - solo UI
  - No usar borders de 1px

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3, con Tasks 8, 9, 10)
  - **Blocked By**: Tasks 3, 5
  - **Blocks**: Task 11

  **References**:
  - `pdia/stitch/stitch/iniciar_sesi_n_pdia/code.html` - Mockup HTML completo
  - `pdia/stitch/stitch/iniciar_sesi_n_pdia/screen.png` - Screenshot de referencia
  - `pdia/frontend/src/features/auth/pages/LoginPage.tsx` - Archivo actual
  - RF03 en AGENTS.md - Requisito de login

  **Acceptance Criteria**:
  - [ ] UI coincide visualmente con el mockup de Stitch
  - [ ] Usa componentes Card, Input, Button
  - [ ] Responsive (funciona en 360px+)
  - [ ] Sin borders de 1px
  - [ ] `npm run build` pasa

  **Commit**: YES (grupo Wave 3)
  - Message: `feat(frontend): implement LoginPage with stitch design`
  - Files: `features/auth/pages/LoginPage.tsx`

---

- [ ] 8. Implementar DashboardPage con weather widget

  **What to do**:
  - Reescribir `pdia/frontend/src/features/dashboard/pages/DashboardPage.tsx`
  - Seguir el mockup de `dashboard_pdia/code.html`:
    - Usar AppShell como wrapper
    - Sección de bienvenida con nombre del usuario
    - Weather Widget con gradiente tertiary-container → surface
    - Cards de resumen: parcelas, cultivos, actividades recientes
    - Sección de alertas activas con Badge
  - Integrar OfflineBanner

  **Must NOT do**:
  - No implementar llamadas reales a API - usar datos mock
  - No usar borders de 1px

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3, con Tasks 7, 9, 10)
  - **Blocked By**: Tasks 3, 4, 5, 6
  - **Blocks**: Task 11

  **References**:
  - `pdia/stitch/stitch/dashboard_pdia/code.html` - Mockup HTML completo
  - `pdia/stitch/stitch/dashboard_pdia/screen.png` - Screenshot de referencia
  - `pdia/stitch/stitch/terra_core/DESIGN.md:72-74` - Weather components spec
  - `pdia/frontend/src/features/dashboard/pages/DashboardPage.tsx` - Archivo actual
  - RF18-RF22 en AGENTS.md - Requisitos de clima

  **Acceptance Criteria**:
  - [ ] UI coincide con el mockup de Stitch
  - [ ] Weather widget con gradiente correcto
  - [ ] Cards de resumen sin borders
  - [ ] OfflineBanner integrado
  - [ ] Responsive
  - [ ] `npm run build` pasa

  **Commit**: YES (grupo Wave 3)
  - Message: `feat(frontend): implement DashboardPage with weather widget`
  - Files: `features/dashboard/pages/DashboardPage.tsx`

---

- [ ] 9. Implementar ParcelsPage con cards

  **What to do**:
  - Reescribir `pdia/frontend/src/features/parcels/pages/ParcelsPage.tsx`
  - Seguir el mockup de `mis_parcelas_pdia/code.html`:
    - Usar AppShell como wrapper
    - Header con título y botón FAB para agregar parcela
    - Grid de Parcel Cards:
      - Imagen de cabecera (placeholder)
      - Nombre de parcela
      - Ubicación (municipio)
      - Hectáreas
      - Número de cultivos activos
      - Badge de estado (Synced, Offline, Alert)
    - Filtros por municipio (opcional)

  **Must NOT do**:
  - No implementar CRUD real - solo UI con datos mock
  - No usar borders de 1px en cards

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3, con Tasks 7, 8, 10)
  - **Blocked By**: Tasks 3, 4, 5
  - **Blocks**: Task 11

  **References**:
  - `pdia/stitch/stitch/mis_parcelas_pdia/code.html` - Mockup HTML completo
  - `pdia/stitch/stitch/mis_parcelas_pdia/screen.png` - Screenshot de referencia
  - `pdia/frontend/src/features/parcels/pages/ParcelsPage.tsx` - Archivo actual
  - `pdia/frontend/src/shared/models/Parcel.ts` - Modelo existente
  - RF53-RF56 en AGENTS.md - Requisitos de parcelas

  **Acceptance Criteria**:
  - [ ] UI coincide con el mockup de Stitch
  - [ ] Grid responsive de parcel cards
  - [ ] FAB para agregar (no funcional, solo UI)
  - [ ] Badges de estado visibles
  - [ ] `npm run build` pasa

  **Commit**: YES (grupo Wave 3)
  - Message: `feat(frontend): implement ParcelsPage with parcel cards`
  - Files: `features/parcels/pages/ParcelsPage.tsx`

---

- [ ] 10. Implementar ActivitiesPage con timeline

  **What to do**:
  - Reescribir `pdia/frontend/src/features/activities/pages/ActivitiesPage.tsx`
  - Seguir el mockup de `historial_de_actividades_pdia/code.html`:
    - Usar AppShell como wrapper
    - Header con título y filtros
    - Timeline de actividades:
      - Ícono según tipo (riego, fertilización, plaga, observación)
      - Fecha y hora
      - Descripción
      - Cultivo/parcela asociado
      - Badge de sincronización (Synced, Pending)
    - Filtros por tipo de actividad
    - OfflineBanner si está offline

  **Must NOT do**:
  - No implementar registro real de actividades - solo UI
  - No usar borders de 1px

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 3, con Tasks 7, 8, 9)
  - **Blocked By**: Tasks 3, 4, 5, 6
  - **Blocks**: Task 11

  **References**:
  - `pdia/stitch/stitch/historial_de_actividades_pdia/code.html` - Mockup HTML completo
  - `pdia/stitch/stitch/historial_de_actividades_pdia/screen.png` - Screenshot de referencia
  - `pdia/frontend/src/features/activities/pages/ActivitiesPage.tsx` - Archivo actual
  - `pdia/frontend/src/shared/models/Activity.ts` - Modelo existente
  - RF11-RF17, RF45-RF47 en AGENTS.md - Requisitos de actividades

  **Acceptance Criteria**:
  - [ ] UI coincide con el mockup de Stitch
  - [ ] Timeline con íconos por tipo de actividad
  - [ ] Filtros funcionales (solo UI)
  - [ ] OfflineBanner integrado
  - [ ] Badges de sincronización visibles
  - [ ] `npm run build` pasa

  **Commit**: YES (grupo Wave 3)
  - Message: `feat(frontend): implement ActivitiesPage with timeline`
  - Files: `features/activities/pages/ActivitiesPage.tsx`

---

- [ ] 11. Integración: App.tsx con layout y verificación final

  **What to do**:
  - Actualizar `pdia/frontend/src/App.tsx`:
    - Envolver rutas autenticadas con AppShell
    - Login y Register sin AppShell (páginas públicas)
    - Añadir export de index para componentes compartidos
  - Crear `pdia/frontend/src/shared/components/layout/index.ts` con exports
  - Crear `pdia/frontend/src/shared/components/common/index.ts` con exports
  - Crear `pdia/frontend/src/shared/components/feedback/index.ts` con exports
  - Ejecutar `npm run build` y verificar que pasa

  **Must NOT do**:
  - No romper rutas existentes
  - No dejar imports sin usar

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (tarea final de integración)
  - **Blocked By**: Tasks 7, 8, 9, 10
  - **Blocks**: None

  **References**:
  - `pdia/frontend/src/App.tsx` - Archivo actual
  - Todos los componentes creados en Wave 2

  **Acceptance Criteria**:
  - [ ] App.tsx usa AppShell para rutas autenticadas
  - [ ] Todos los index.ts exportan componentes
  - [ ] `npm run build` pasa sin errores
  - [ ] `npm run lint` sin errores críticos
  - [ ] Navegación funciona correctamente

  **Commit**: YES
  - Message: `feat(frontend): integrate layout and finalize stitch implementation`
  - Files: `App.tsx`, `shared/components/*/index.ts`

---

## Final Verification Wave

- [ ] F1. **Build Verification** — `quick`
  Ejecutar `npm run build` en pdia/frontend. Debe completar sin errores TypeScript.
  Output: `Build [PASS/FAIL] | Errors [0/N]`

- [ ] F2. **Visual Comparison** — `visual-engineering`
  Comparar cada página implementada contra los screenshots de Stitch.
  Output: `Pages [N/N match] | Issues [list]`

---

## Commit Strategy

| Wave | Commit Message | Files |
|------|----------------|-------|
| 1 | `feat(frontend): configure terra_core design tokens` | index.css |
| 2 | `feat(frontend): add shared layout components` | shared/components/layout/* |
| 3 | `feat(frontend): implement stitch design pages` | features/*/pages/* |
| FINAL | `feat(frontend): integrate layout and verify build` | App.tsx |

---

## Success Criteria

### Verification Commands
```bash
cd pdia/frontend && npm run build  # Expected: Build successful
cd pdia/frontend && npm run lint   # Expected: 0 errors
```

### Final Checklist
- [ ] Paleta terra_core aplicada en Tailwind
- [ ] Tipografía Manrope + Inter funcionando
- [ ] 4 páginas convertidas al diseño Stitch
- [ ] Navegación responsive (SideNav/BottomNav)
- [ ] Indicador offline visible
- [ ] Build sin errores
