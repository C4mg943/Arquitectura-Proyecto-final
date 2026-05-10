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
  { to: '/dashboard', label: 'Inicio', icon: 'dashboard', end: true, roles: ['PRODUCTOR', 'OPERARIO', 'TECNICO', 'ADMINISTRADOR'] },
  { to: '/fincas', label: 'Fincas', icon: 'villa', roles: ['PRODUCTOR'] },
  { to: '/parcelas', label: 'Parcelas', icon: 'potted_plant', roles: ['PRODUCTOR'] },
  { to: '/parcelas', label: 'Mis Parcelas', icon: 'map', roles: ['OPERARIO'] },
  { to: '/cultivos', label: 'Cultivos', icon: 'agriculture', roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/operarios', label: 'Operarios', icon: 'engineering', roles: ['PRODUCTOR'] },
  { to: '/mis-tecnicos', label: 'Mis Técnicos', icon: 'science', roles: ['PRODUCTOR'] },
  { to: '/recomendaciones', label: 'Recomendaciones', icon: 'tips_and_updates', roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/actividades', label: 'Actividades', icon: 'pending_actions', roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/clima', label: 'Clima', icon: 'partly_cloudy_day', roles: ['PRODUCTOR', 'OPERARIO', 'TECNICO'] },
  { to: '/alertas', label: 'Alertas', icon: 'warning', roles: ['PRODUCTOR', 'OPERARIO', 'TECNICO'] },
  { to: '/notificaciones', label: 'Notificaciones', icon: 'notifications', roles: ['PRODUCTOR', 'OPERARIO', 'TECNICO', 'ADMINISTRADOR'] },
  { to: '/reportes', label: 'Reportes', icon: 'assessment', roles: ['PRODUCTOR', 'OPERARIO', 'TECNICO'] },
  { to: '/usuarios', label: 'Usuarios', icon: 'group', roles: ['ADMINISTRADOR'] },
  { to: '/gestion-fincas', label: 'Gestión Fincas', icon: 'villa', roles: ['ADMINISTRADOR'] },
  { to: '/gestion-parcelas', label: 'Gestión Parcelas', icon: 'map', roles: ['ADMINISTRADOR'] },
  { to: '/gestion-operarios', label: 'Gestión Operarios', icon: 'engineering', roles: ['ADMINISTRADOR'] },
  { to: '/tecnico', label: 'Técnico', icon: 'eco', roles: ['TECNICO'], end: true },
  { to: '/tecnico/cultivos', label: 'Cultivos', icon: 'agriculture', roles: ['TECNICO'] },
  { to: '/tecnico/recomendaciones', label: 'Recomendaciones', icon: 'tips_and_updates', roles: ['TECNICO'] },
  { to: '/tecnico/reportes', label: 'Reportes', icon: 'assessment', roles: ['TECNICO'] },
]

export const mobileNavItems: NavItem[] = [
  { to: '/parcelas', label: 'Parcelas', icon: 'map', roles: ['PRODUCTOR'] },
  { to: '/parcelas', label: 'Mis Parcelas', icon: 'map', roles: ['OPERARIO'] },
  { to: '/cultivos', label: 'Cultivos', icon: 'grass', roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/dashboard', label: 'Inicio', icon: 'dashboard', end: true, roles: ['PRODUCTOR', 'OPERARIO', 'TECNICO', 'ADMINISTRADOR'] },
  { to: '/clima', label: 'Clima', icon: 'cloudy', roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/reportes', label: 'Reportes', icon: 'assessment', roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/usuarios', label: 'Usuarios', icon: 'group', roles: ['ADMINISTRADOR'] },
  { to: '/tecnico', label: 'Técnico', icon: 'eco', roles: ['TECNICO'] },
]