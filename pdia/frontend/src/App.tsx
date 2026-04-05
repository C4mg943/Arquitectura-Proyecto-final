import { BrowserRouter, Routes, Route } from 'react-router-dom'
//import type { ReactNode } from 'react'

import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import DashboardPage from './features/dashboard/pages/DashboardPage'
import ParcelsPage from './features/parcels/pages/ParcelsPage'
import CropsPage from './features/crops/pages/CropsPage'
import ActivitiesPage from './features/activities/pages/ActivitiesPage'
import WeatherPage from './features/weather/pages/WeatherPage'
import AlertsPage from './features/alerts/pages/AlertsPage'
import ReportsPage from './features/reports/pages/ReportsPage'
import NotFoundPage from './features/not-found/pages/NotFoundPage'
import { AppShell } from './shared/components/layout'

/*// Util para proteger rutas
const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token')
}

// Componente para rutas protegidas
const PrivateRoute = ({ children }: { children: ReactNode }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}
*/
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <AppShell>
              <DashboardPage />
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
          path="/reportes"
          element={
            <AppShell>
              <ReportsPage />
            </AppShell>
          }
        />

        {/* Ruta raíz redirige según auth */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
