const BASE_URL = import.meta.env.VITE_API_URL;

export const apiClient = {
    probarConexion: async () => {
        try {
            const response = await fetch(`${BASE_URL}/`, {
                headers: {
                    "Bypass-Tunnel-Reminder": "true"
                }
            });
            return await response.json();
        } catch (error) {
            return { mensaje: "Error de conexión con PDIA-API" };
        }
    }
};