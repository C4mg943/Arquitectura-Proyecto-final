import { useState, useEffect } from 'react'

export default function FarmWireframe() {
    // 1. Espacio para los datos que vendrán del Back
    const [fincas, setFincas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 2. EFECTO PARA LA CONEXIÓN (Aquí irá tu fetch de Spring Boot)
    useEffect(() => {
        const fetchFincas = async () => {
            try {
                setIsLoading(true);
                // CUANDO TENGAS EL BACK:
                // const response = await fetch('http://localhost:8080/api/fincas');
                // const data = await response.json();
                // setFincas(data);

                // Por ahora simulamos que no hay nada o está cargando
                setFincas([]);
            } catch (error) {
                console.error("Error conectando al back:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFincas();
    }, []);

    return (
        <div className="p-6 bg-white min-h-screen font-mono text-gray-400 border-4 border-dashed border-gray-200">

            {/* BARRA DE NAVEGACIÓN (CRUD) */}
            <nav className="flex items-center justify-between border-2 border-gray-200 p-4 mb-8 bg-gray-50">
                <span className="font-bold">[MODULO_FINCAS_API_CONNECT]</span>
                <div className="flex gap-4">
                    <button className="border-2 border-gray-200 px-4 py-1 hover:bg-black hover:text-white transition-colors">
                        [+ NUEVO_REGISTRO]
                    </button>
                </div>
            </nav>

            <main>
                {/* 3. ESPACIO DE CARGA O TABLA VACÍA */}
                {isLoading ? (
                    <div className="text-center p-20 border-2 border-dotted border-gray-200">
                        <p className="animate-pulse">[CONECTANDO_CON_SERVIDOR_BACKEND...]</p>
                    </div>
                ) : fincas.length === 0 ? (
                    <div className="text-center p-20 border-2 border-dotted border-gray-300">
                        <p>0 REGISTROS ENCONTRADOS EN LA ENTIDAD 'FINCA'</p>
                        <p className="text-[10px] mt-2">Verifique la conexión con el puerto 8080 o la base de datos.</p>
                    </div>
                ) : (
                    /* Esta tabla solo se renderizará cuando setFincas tenga datos reales */
                    <table className="w-full border-collapse border-2 border-gray-200">
                        <thead>
                        <tr className="bg-gray-50">
                            <th className="border-2 border-gray-200 p-2">ID</th>
                            <th className="border-2 border-gray-200 p-2">NOMBRE</th>
                            <th className="border-2 border-gray-200 p-2">ACCIONES</th>
                        </tr>
                        </thead>
                        <tbody>
                        {fincas.map((f: any) => (
                            <tr key={f.id}>
                                <td className="p-2 border-2 border-gray-200">{f.id}</td>
                                <td className="p-2 border-2 border-gray-200">{f.nombre}</td>
                                <td className="p-2 border-2 border-gray-200 text-center">[EDIT] [DEL]</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </main>

            <footer className="mt-20 text-[10px] text-gray-300">
                ENDPOINT_PENDIENTE: GET /api/v1/fincas
            </footer>
        </div>
    )
}