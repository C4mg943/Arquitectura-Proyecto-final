import type { To } from 'react-router-dom'
import type { UserRole } from '../../../store/authStore'

export interface NavItem {
  to: To
  label: string
  icon: string
  end?: boolean
  roles?: UserRole[]
}

export const navItems: NavItem[] = [
  // ── Productor / Operario / Admin ──────────────────────────────────────────
  { to: '/dashboard', label: 'Inicio',          icon: 'dashboard',       end: true, roles: ['PRODUCTOR', 'OPERARIO', 'ADMINISTRADOR'] },
  { to: '/fincas',    label: 'Fincas',           icon: 'villa',                      roles: ['PRODUCTOR'] },
  { to: '/parcelas',  label: 'Parcelas',         icon: 'potted_plant',               roles: ['PRODUCTOR'] },
  { to: '/parcelas',  label: 'Mis Parcelas',     icon: 'map',                        roles: ['OPERARIO'] },
  { to: '/cultivos',  label: 'Cultivos',         icon: 'agriculture',                roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/operarios', label: 'Operarios',        icon: 'engineering',                roles: ['PRODUCTOR'] },
  { to: '/mis-tecnicos', label: 'Mis Técnicos',  icon: 'science',                    roles: ['PRODUCTOR'] },
  { to: '/recomendaciones', label: 'Recomendaciones', icon: 'tips_and_updates',      roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/actividades', label: 'Actividades',    icon: 'pending_actions',            roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/clima',     label: 'Clima',            icon: 'partly_cloudy_day',          roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/alertas',   label: 'Alertas',          icon: 'warning',                    roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/notificaciones', label: 'Notificaciones', icon: 'notifications',           roles: ['PRODUCTOR', 'OPERARIO', 'ADMINISTRADOR'] },
  { to: '/reportes',  label: 'Reportes',         icon: 'assessment',                 roles: ['PRODUCTOR'] },

  // ── Admin ─────────────────────────────────────────────────────────────────
  { to: '/usuarios',      label: 'Gestión Usuarios', icon: 'group',   roles: ['ADMINISTRADOR'] },
  { to: '/gestion-fincas', label: 'Ver Fincas',      icon: 'villa',   roles: ['ADMINISTRADOR'] },
  { to: '/admin/logs',    label: 'Registro Actividad', icon: 'history', roles: ['ADMINISTRADOR'] },

  // ── Técnico — su dashboard es /tecnico ───────────────────────────────────
  { to: '/tecnico',                  label: 'Inicio',          icon: 'eco',             end: true, roles: ['TECNICO'] },
  { to: '/tecnico/cultivos',         label: 'Cultivos',        icon: 'agriculture',               roles: ['TECNICO'] },
  { to: '/tecnico/actividades',      label: 'Actividades',     icon: 'pending_actions',           roles: ['TECNICO'] },
  { to: '/tecnico/recomendaciones',  label: 'Recomendaciones', icon: 'tips_and_updates',          roles: ['TECNICO'] },
  { to: '/tecnico/reportes',         label: 'Reportes',        icon: 'assessment',                roles: ['TECNICO'] },
  { to: '/clima',                    label: 'Clima',           icon: 'partly_cloudy_day',         roles: ['TECNICO'] },
  { to: '/alertas',                  label: 'Alertas',         icon: 'warning',                   roles: ['TECNICO'] },
  { to: '/notificaciones',           label: 'Notificaciones',  icon: 'notifications',             roles: ['TECNICO'] },
]

export const mobileNavItems: NavItem[] = [
  // Productor
  { to: '/parcelas',    label: 'Parcelas',    icon: 'map',       roles: ['PRODUCTOR'] },
  { to: '/cultivos',    label: 'Cultivos',    icon: 'grass',     roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/dashboard',   label: 'Inicio',      icon: 'dashboard', end: true, roles: ['PRODUCTOR', 'OPERARIO', 'ADMINISTRADOR'] },
  { to: '/actividades', label: 'Actividades', icon: 'task_alt',  roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/clima',       label: 'Clima',       icon: 'cloudy',    roles: ['PRODUCTOR', 'OPERARIO'] },
  // Operario
  { to: '/parcelas',    label: 'Mis Parcelas', icon: 'map',      roles: ['OPERARIO'] },
  // Admin
  { to: '/usuarios',    label: 'Usuarios',    icon: 'group',     roles: ['ADMINISTRADOR'] },
  // Técnico — dashboard propio
  { to: '/tecnico',     label: 'Inicio',      icon: 'eco',       end: true, roles: ['TECNICO'] },
  { to: '/tecnico/cultivos', label: 'Cultivos', icon: 'agriculture', roles: ['TECNICO'] },
  { to: '/tecnico/actividades', label: 'Actividades', icon: 'pending_actions', roles: ['TECNICO'] },
]
