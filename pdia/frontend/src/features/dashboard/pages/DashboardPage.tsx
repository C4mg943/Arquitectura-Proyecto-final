import { useEffect, useState } from 'react';
import { apiClient } from '../../../shared/services/apiClient';

export default function DashboardPage() {
    const [mensajeServidor, setMensajeServidor] = useState("Conectando con el backend...");
    const [error, setError] = useState(false);

    useEffect(() => {
        apiClient.probarConexion()
            .then(data => {
                setMensajeServidor(data.message);
                setError(false);
            })
            .catch(() => {
                setMensajeServidor("Error: No se pudo conectar al servidor en el puerto 3123");
                setError(true);
            });
    }, []);

    return (
        <section className="mx-auto max-w-5xl px-4 py-8">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">
                Bienvenido a PDIA. Desde aquí podrás gestionar tus parcelas, cultivos y actividades.
            </p>

            <div className={`mt-6 p-4 rounded-lg border ${error ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <h2 className={`text-sm font-semibold ${error ? 'text-red-800' : 'text-emerald-800'}`}>
                    Estado de la Conexión:
                </h2>
                <p className={`text-lg font-mono ${error ? 'text-red-600' : 'text-emerald-600'}`}>
                    {mensajeServidor}
                </p>
            </div>
        </section>
    )
}
