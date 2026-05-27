import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import type { UserRole } from './store/authStore'

/** Redirige al dashboard correcto si el rol del usuario no está en la lista permitida */
function RoleRoute({ allowed, children }: { allowed: UserRole[]; children: React.ReactNode }) {
  const rol = useAuthStore((state) => state.user?.rol)
  if (!rol || !allowed.includes(rol)) {
    // El técnico tiene su propio dashboard
    const redirect = rol === 'TECNICO' ? '/tecnico' : '/dashboard'
    return <Navigate replace to={redirect} />
  }
  return <>{children}</>
}

import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage'
import ProfilePage from './features/profile/pages/ProfilePage'
import ActivitiesPage from './features/activities/pages/ActivitiesPage'
import AlertsPage from './features/alerts/pages/AlertsPage'
import NotificationsPage from './features/alerts/pages/NotificationsPage'
import DashboardPage from './features/dashboard/pages/DashboardPage'
import CropsPage from './features/crops/pages/CropsPage'
import FincasPage from './features/fincas/pages/FincasPage'
import NotFoundPage from './features/not-found/pages/NotFoundPage'
import OperariosPage from './features/operarios/pages/OperariosPage'
import ParcelsPage from './features/parcels/pages/ParcelsPage'
import ReportsPage from './features/reports/pages/ReportsPage'
import WeatherPage from './features/weather/pages/WeatherPage'
import UsuariosPage from './features/admin/pages/UsuariosPage'
import GestionTecnicosPage from './features/admin/pages/GestionTecnicosPage'
import AuditLogsPage from './features/admin/pages/AuditLogsPage'
import TecnicoDashboard from './features/tecnico/pages/TecnicoDashboard'
import TecnicoCultivosPage from './features/tecnico/pages/TecnicoCultivosPage'
import TecnicoRecomendacionesPage from './features/tecnico/pages/TecnicoRecomendacionesPage'
import TecnicoReportesPage from './features/tecnico/pages/TecnicoReportesPage'
import MisTecnicosPage from './features/tecnicos/pages/MisTecnicosPage'
import RecomendacionesPage from './features/recomendaciones/pages/RecomendacionesPage'
import LandingPage from './features/landing/pages/LandingPage'
import { AppShell } from './shared/components/layout'
import { PrivateRoute } from './shared/components/common'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<PrivateRoute />}>
          <Route
            path="/profile"
            element={
              <AppShell>
                <ProfilePage />
              </AppShell>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AppShell>
                {/* El técnico tiene su propio dashboard en /tecnico */}
                <RoleRoute allowed={['PRODUCTOR', 'OPERARIO', 'ADMINISTRADOR']}>
                  <DashboardPage />
                </RoleRoute>
              </AppShell>
            }
          />
          <Route
            path="/fincas"
            element={
              <AppShell>
                <FincasPage />
              </AppShell>
            }
          />
          <Route
            path="/parcelas"
            element={
              <AppShell>
                <ParcelsPage />
              </AppShell>
            }
          />
          <Route
            path="/cultivos"
            element={
              <AppShell>
                <CropsPage />
              </AppShell>
            }
          />
          <Route
            path="/operarios"
            element={
              <AppShell>
                <OperariosPage />
              </AppShell>
            }
          />
          <Route
            path="/actividades"
            element={
              <AppShell>
                <ActivitiesPage />
              </AppShell>
            }
          />
          <Route
            path="/clima"
            element={
              <AppShell>
                <WeatherPage />
              </AppShell>
            }
          />
          <Route
            path="/alertas"
            element={
              <AppShell>
                <AlertsPage />
              </AppShell>
            }
          />
          <Route
            path="/notificaciones"
            element={
              <AppShell>
                <NotificationsPage />
              </AppShell>
            }
          />
          <Route
            path="/reportes"
            element={
              <AppShell>
                <RoleRoute allowed={['PRODUCTOR', 'TECNICO', 'ADMINISTRADOR']}>
                  <ReportsPage />
                </RoleRoute>
              </AppShell>
            }
          />
          <Route
            path="/recomendaciones"
            element={
              <AppShell>
                <RecomendacionesPage />
              </AppShell>
            }
          />
          <Route
            path="/mis-tecnicos"
            element={
              <AppShell>
                <MisTecnicosPage />
              </AppShell>
            }
          />
          <Route
            path="/usuarios"
            element={
              <AppShell>
                <UsuariosPage />
              </AppShell>
            }
          />
          <Route
            path="/gestion-fincas"
            element={
              <AppShell>
                <FincasPage adminMode />
              </AppShell>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <AppShell>
                <RoleRoute allowed={['ADMINISTRADOR']}>
                  <AuditLogsPage />
                </RoleRoute>
              </AppShell>
            }
          />
          <Route
            path="/gestion-parcelas"
            element={
              <AppShell>
                <ParcelsPage adminMode />
              </AppShell>
            }
          />
          <Route
            path="/gestion-operarios"
            element={
              <AppShell>
                <OperariosPage adminMode />
              </AppShell>
            }
          />
          <Route
            path="/gestion-tecnicos"
            element={
              <AppShell>
                <GestionTecnicosPage />
              </AppShell>
            }
          />
          <Route
            path="/tecnico"
            element={
              <AppShell>
                <TecnicoDashboard />
              </AppShell>
            }
          />
          <Route
            path="/tecnico/cultivos"
            element={
              <AppShell>
                <TecnicoCultivosPage />
              </AppShell>
            }
          />
          <Route
            path="/tecnico/recomendaciones"
            element={
              <AppShell>
                <TecnicoRecomendacionesPage />
              </AppShell>
            }
          />
          <Route
            path="/tecnico/reportes"
            element={
              <AppShell>
                <TecnicoReportesPage />
              </AppShell>
            }
          />
          <Route
            path="/tecnico/actividades"
            element={
              <AppShell>
                <RoleRoute allowed={['TECNICO']}>
                  <ActivitiesPage readOnly />
                </RoleRoute>
              </AppShell>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
