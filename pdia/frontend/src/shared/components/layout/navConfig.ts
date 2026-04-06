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
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true, roles: ['PRODUCTOR', 'OPERARIO', 'TECNICO', 'ADMINISTRADOR'] },
  { to: '/profile', label: 'Perfil', icon: 'person', roles: ['PRODUCTOR', 'OPERARIO', 'TECNICO', 'ADMINISTRADOR'] },
  { to: '/fincas', label: 'Fincas', icon: 'villa', roles: ['PRODUCTOR'] },
  { to: '/parcelas', label: 'Parcelas', icon: 'potted_plant', roles: ['PRODUCTOR'] },
  { to: '/mis-parcelas', label: 'Mis Parcelas', icon: 'map', roles: ['OPERARIO'] },
  { to: '/cultivos', label: 'Cultivos', icon: 'agriculture', roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/operarios', label: 'Operarios', icon: 'engineering', roles: ['PRODUCTOR'] },
  { to: '/actividades', label: 'Actividades', icon: 'pending_actions', roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/clima', label: 'Clima', icon: 'partly_cloudy_day', roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/alertas', label: 'Alertas', icon: 'warning', roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/reportes', label: 'Reportes', icon: 'assessment', roles: ['PRODUCTOR', 'OPERARIO'] },
]

export const mobileNavItems: NavItem[] = [
  { to: '/parcelas', label: 'Parcelas', icon: 'map', roles: ['PRODUCTOR'] },
  { to: '/mis-parcelas', label: 'Mis Parcelas', icon: 'map', roles: ['OPERARIO'] },
  { to: '/cultivos', label: 'Cultivos', icon: 'grass', roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/', label: 'Inicio', icon: 'home', end: true, roles: ['PRODUCTOR', 'OPERARIO', 'TECNICO', 'ADMINISTRADOR'] },
  { to: '/clima', label: 'Clima', icon: 'cloudy', roles: ['PRODUCTOR', 'OPERARIO'] },
  { to: '/reportes', label: 'Reportes', icon: 'settings', roles: ['PRODUCTOR', 'OPERARIO'] },
]
