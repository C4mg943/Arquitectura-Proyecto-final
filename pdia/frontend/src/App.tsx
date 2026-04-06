import { BrowserRouter, Route, Routes } from 'react-router-dom'

import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import ForgotPasswordPage from './features/ForgotPasswordPage'
import ResetPasswordPage from './features/ResetPasswordPage'
import ProfilePage from './features/ProfilePage'
import ActivitiesPage from './features/activities/pages/ActivitiesPage'
import AlertsPage from './features/alerts/pages/AlertsPage'
import DashboardPage from './features/dashboard/pages/DashboardPage'
import CropsPage from './features/crops/pages/CropsPage'
import NotFoundPage from './features/not-found/pages/NotFoundPage'
import ParcelsPage from './features/parcels/pages/ParcelsPage'
import ReportsPage from './features/reports/pages/ReportsPage'
import WeatherPage from './features/weather/pages/WeatherPage'
import { AppShell } from './shared/components/layout'
import FarmsPage from './features/fram/pages/FarmsPage.tsx'
import FarmWireframe from './features/fram/pages/FarmWireframe.tsx';
function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rutas Públicas de siempre */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* --- BYPASS: Rutas ahora fuera de PrivateRoute --- */}
                <Route
                    path="/profile"
                    element={<AppShell><ProfilePage /></AppShell>}
                />
                <Route
                    path="/"
                    element={<AppShell><DashboardPage /></AppShell>}
                />
                <Route
                    path="/parcelas"
                    element={<AppShell><ParcelsPage /></AppShell>}
                />
                <Route
                    path="/cultivos"
                    element={<AppShell><CropsPage /></AppShell>}
                />
                <Route
                    path="/actividades"
                    element={<AppShell><ActivitiesPage /></AppShell>}
                />
                <Route
                    path="/clima"
                    element={<AppShell><WeatherPage /></AppShell>}
                />
                <Route
                    path="/alertas"
                    element={<AppShell><AlertsPage /></AppShell>}
                />
                <Route
                    path="/reportes"
                    element={<AppShell><ReportsPage /></AppShell>}
                />
                <Route
                    path="/fincas"
                    element={<AppShell><FarmsPage /></AppShell>}
                />
                <Route path="/fincas" element={<FarmsPage />} />


                <Route path="/finca/wireframe" element={<FarmWireframe />} />

                {/* El bloque PrivateRoute ahora está vacío o lo puedes comentar */}
                {/* <Route element={<PrivateRoute />}></Route> */}

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    )
}
export default App
