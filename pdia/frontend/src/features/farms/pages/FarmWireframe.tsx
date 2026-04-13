import { useState, useEffect } from 'react'
import {apiClient,type FincaDto} from '../../../shared/services/apiClient.ts'
import { useAuthStore } from '../../../store/authStore'

export default function FarmWireframe() {
    const [fincas, setFincas] = useState<FincaDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const user = useAuthStore(state => state.user);

    const [formData, setFormData] = useState({
        id: null as number | null,
        nombre: '',
        municipio: '',
        departamento: '',
        areaHectareas: '' as string | number,
        codigoIca: ''
    });

    const [isEditing, setIsEditing] = useState(false);

    const cargarDatosDelBack = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await apiClient.fincas.list();
            setFincas(data || []);
        } catch (err: any) {
            setError(err.message || "Error al conectar con el servidor");
        } finally {
            setIsLoading(false);
        }
    };

    const manejarEliminar = async (id: number) => {
        if (!window.confirm(`¿ELIMINAR_REGISTRO #${id}?`)) return;
        try {
            await apiClient.fincas.delete(id);
            await cargarDatosDelBack();
        } catch (err: any) {
            alert("ERROR_SISTEMA: " + err.message);
        }
    };

    const iniciarEdicion = (finca: any) => {
        setFormData({
            id: finca.id,
            nombre: finca.nombre,
            municipio: finca.municipio,
            departamento: finca.departamento,
            areaHectareas: finca.areaHectareas || '',
            codigoIca: finca.codigoIca || ''
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelarAccion = () => {
        setFormData({ id: null, nombre: '', municipio: '', departamento: '', areaHectareas: '', codigoIca: '' });
        setIsEditing(false);
    };

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();

        // Obtenemos el ID del productor
        const productorId = 1;

        // IMPORTANTE: Mapeo de campos para que coincidan con la Base de Datos (snake_case)
        const payload = {
            nombre: formData.nombre,
            municipio: formData.municipio,
            departamento: formData.departamento,

            area_hectareas: Number(formData.areaHectareas) || 0, // Cambiado a snake_case
            codigo_ica: formData.codigoIca,                     // Cambiado a snake_case
            productor_id: productorId                           // Cambiado a snake_case
        };

        try {
            if (isEditing && formData.id) {
                await apiClient.fincas.update(formData.id, payload);
            } else {
                await apiClient.fincas.create(payload as any);
            }

            cancelarAccion();
            await cargarDatosDelBack();
        } catch (err: any) {
            alert("ERROR_TRANSACCION: " + err.message);
        }
    };

    const manejarCambioHectareas = (valor: string) => {
        if (valor === "" || /^\d*\.?\d*$/.test(valor)) {
            setFormData({...formData, areaHectareas: valor});
        }
    };

    useEffect(() => { cargarDatosDelBack(); }, []);

    const areaTotal = fincas.reduce((acc, f) => acc + (Number(f.areaHectareas) || 0), 0);
    const fincasConIca = fincas.filter(f => f.codigoIca && f.codigoIca.trim() !== "").length;

    return (
        <div className="p-4 md:p-6 bg-white min-h-screen font-mono border-2 md:border-4 border-dashed border-gray-300 text-black">
            {/* Nav Adaptativo */}
            <nav className="flex flex-col md:flex-row items-start md:items-center justify-between border-2 border-black p-4 mb-6 bg-gray-50 gap-4">
                <div className="flex flex-col w-full md:w-auto">
                    <span className="font-bold uppercase text-xs">[MODULO: GESTIÓN_FINCAS]</span>
                    {user && (
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">ID:</span>
                            <span className="text-[10px] text-black font-bold uppercase truncate max-w-[150px]">{user.nombre}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-2 md:flex gap-2 text-[9px] mt-2 border-t border-dotted border-gray-300 pt-2 text-gray-500">
                        <span>ÁREA: {areaTotal.toFixed(1)} HA</span>
                        <span>ICA: {fincasConIca}</span>
                    </div>
                </div>
                <button onClick={cargarDatosDelBack} className="w-full md:w-auto border-2 border-black px-4 py-2 hover:bg-black hover:text-white text-[10px] font-bold uppercase transition-all">
                    [RECARGAR_DATOS]
                </button>
            </nav>

            {error && (
                <div className="mb-4 p-3 border-2 border-black bg-gray-100 text-black text-[10px] uppercase font-bold">
                    [!] ERROR: {error}
                </div>
            )}

            {/* Formulario Adaptativo */}
            <section className={`mb-8 border-2 p-4 border-dashed ${isEditing ? 'border-black bg-gray-50' : 'border-gray-300 bg-white'}`}>
                <h2 className="text-xs font-bold uppercase mb-4 text-black">{isEditing ? `[MODIFICAR: #${formData.id}]` : '[NUEVO_REGISTRO]'}</h2>
                <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Nombre_Finca</label>
                            <input type="text" placeholder="NOMBRE" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required className="border-2 border-gray-300 p-3 text-sm focus:border-black outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Municipio</label>
                            <input type="text" placeholder="MUNICIPIO" value={formData.municipio} onChange={(e) => setFormData({...formData, municipio: e.target.value})} required className="border-2 border-gray-300 p-3 text-sm focus:border-black outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Departamento</label>
                            <input type="text" placeholder="DEPTO" value={formData.departamento} onChange={(e) => setFormData({...formData, departamento: e.target.value})} required className="border-2 border-gray-300 p-3 text-sm focus:border-black outline-none" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Área (Ha)</label>
                            <input
                                type="text" inputMode="decimal" placeholder="0.00"
                                value={formData.areaHectareas}
                                onChange={(e) => manejarCambioHectareas(e.target.value)}
                                required className="border-2 border-gray-300 p-3 text-sm focus:border-black outline-none"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500">Código_ICA</label>
                            <input type="text" placeholder="ICA_REF" value={formData.codigoIca} onChange={(e) => setFormData({...formData, codigoIca: e.target.value})} className="border-2 border-gray-300 p-3 text-sm focus:border-black outline-none" />
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 mt-2">
                        <button type="submit" className="flex-1 bg-black text-white text-xs font-bold py-3 px-6 uppercase border-2 border-black hover:bg-white hover:text-black transition-all">
                            {isEditing ? '[GUARDAR_CAMBIOS]' : '[EJECUTAR_REGISTRO]'}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={cancelarAccion} className="bg-white text-black border-2 border-black text-xs font-bold py-3 px-6 uppercase hover:bg-gray-100">
                                [CANCELAR]
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <main>
                {isLoading ? (
                    <div className="text-center p-20 border-2 border-dashed border-gray-300 animate-pulse text-gray-500 uppercase text-xs font-bold">[PROCESANDO...]</div>
                ) : (
                    <div className="space-y-4">
                        {/* Vista Desktop: Tabla */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full border-collapse border-2 border-black text-xs text-left">
                                <thead>
                                <tr className="bg-gray-100 uppercase font-bold text-center">
                                    <th className="border-2 border-black p-3 w-16">REF</th>
                                    <th className="border-2 border-black p-3 text-left">DATOS_DE_FINCA</th>
                                    <th className="border-2 border-black p-3 w-24">EXTENSIÓN</th>
                                    <th className="border-2 border-black p-3 w-32">REG_ICA</th>
                                    <th className="border-2 border-black p-3 w-32">ACCIONES</th>
                                </tr>
                                </thead>
                                <tbody>
                                {fincas.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-10 text-center text-gray-400 italic font-mono uppercase border-2 border-black">-- NO_HAY_DATOS --</td>
                                    </tr>
                                ) : (
                                    fincas.map((f, index) => (
                                        <tr key={f.id} className="hover:bg-gray-50 border-b border-black">
                                            <td className="border-2 border-black p-3 text-center text-gray-500 font-bold">#{index + 1}</td>
                                            <td className="border-2 border-black p-3">
                                                <div className="font-bold uppercase">{f.nombre}</div>
                                                <div className="text-[10px] text-gray-500 uppercase mt-0.5">{f.municipio}, {f.departamento}</div>
                                                <div className="text-[9px] text-black font-bold uppercase mt-2 border-t border-dotted border-gray-300 pt-1">
                                                    PRODUCTOR: {f.productorId|| 'NO_ASIGNADO'}
                                                </div>
                                            </td>
                                            <td className="border-2 border-black p-3 text-center font-bold uppercase">{f.areaHectareas || 0} HA</td>
                                            <td className="border-2 border-black p-3 text-center text-gray-500 uppercase">{f.codigoIca || 'SIN_REG'}</td>
                                            <td className="border-2 border-black p-3">
                                                <div className="flex flex-col gap-2">
                                                    <button onClick={() => iniciarEdicion(f)} className="border-2 border-black px-2 py-1.5 text-[10px] font-bold uppercase hover:bg-black hover:text-white transition-all">[EDITAR]</button>
                                                    <button onClick={() => manejarEliminar(f.id)} className="border-2 border-black px-2 py-1.5 text-[10px] font-bold uppercase hover:bg-black hover:text-white transition-all">[ELIMINAR]</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Vista Móvil: Cards */}
                        <div className="md:hidden space-y-4">
                            {fincas.length === 0 ? (
                                <div className="p-10 text-center text-gray-400 italic font-mono uppercase border-2 border-black border-dashed">-- NO_HAY_DATOS --</div>
                            ) : (
                                fincas.map((f, index) => (
                                    <div key={f.id} className="border-2 border-black p-4 bg-white space-y-3">
                                        <div className="flex justify-between items-start border-b border-black pb-2">
                                            <div>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">REF: #{index + 1}</span>
                                                <h3 className="font-bold uppercase text-sm">{f.nombre}</h3>
                                            </div>
                                            <span className="bg-black text-white text-[9px] px-2 py-1 font-bold">{f.areaHectareas || 0} HA</span>
                                        </div>
                                        <div className="text-[10px] uppercase space-y-1">
                                            <p><span className="text-gray-500">UBICACIÓN:</span> {f.municipio}, {f.departamento}</p>
                                            <p><span className="text-gray-500">REG_ICA:</span> {f.codigoIca || 'SIN_REGISTRO'}</p>
                                            <p className="pt-1 border-t border-dotted border-gray-300 font-bold">PRODUCTOR: {f.productorId || 'NO_ASIGNADO'}</p>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => iniciarEdicion(f)} className="flex-1 border-2 border-black py-2 text-[10px] font-bold uppercase hover:bg-black hover:text-white transition-all">[EDITAR]</button>
                                            <button onClick={() => manejarEliminar(f.id)} className="flex-1 border-2 border-black py-2 text-[10px] font-bold uppercase hover:bg-black hover:text-white transition-all">[ELIMINAR]</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>
            <footer className="mt-8 text-[9px] text-gray-400 uppercase text-center font-bold italic">
                -- PDIA_MOBILE_STUB -- v1.0 --
            </footer>
        </div>
    )
}