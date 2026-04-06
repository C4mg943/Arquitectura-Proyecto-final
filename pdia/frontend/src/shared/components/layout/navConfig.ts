import type { To } from 'react-router-dom'

export interface NavItem {
  to: To
  label: string
  icon: string
  end?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/profile', label: 'Perfil', icon: 'person' },
  { to: '/fincas', label: 'Mis Fincas', icon: 'holiday_village' },
  { to: '/parcelas', label: 'Parcelas', icon: 'potted_plant' },
  { to: '/cultivos', label: 'Cultivos', icon: 'agriculture' },
  { to: '/actividades', label: 'Actividades', icon: 'pending_actions' },
  { to: '/clima', label: 'Clima', icon: 'partly_cloudy_day' },
  { to: '/alertas', label: 'Alertas', icon: 'warning' },
  { to: '/reportes', label: 'Reportes', icon: 'assessment' },
]

export const mobileNavItems: NavItem[] = [
  { to: '/parcelas', label: 'Parcelas', icon: 'map' },
  { to: '/cultivos', label: 'Cultivos', icon: 'grass' },
  { to: '/', label: 'Inicio', icon: 'home', end: true },
  { to: '/clima', label: 'Clima', icon: 'cloudy' },
  { to: '/reportes', label: 'Reportes', icon: 'settings' },
]
