import { useState, useEffect } from 'react'
import { apiClient } from '../../../shared/services/apiClient.ts'
import { useAuthStore } from '../../../store/authStore'

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

export default function FarmMockup() {
    const [fincas, setFincas] = useState<any[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const user = useAuthStore(state => state.user);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        id: null as number | null,
        nombre: '',
        municipio: '',
        departamento: '',
        areaHectareas: '' as string | number,
        codigoIca: ''
    });

    const cargarDatos = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await apiClient.fincas.list();
            setFincas(data || []);
        } catch (err: any) {
            setError(err.message || "Error al cargar las fincas.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const fincasFiltradas = fincas.filter(f =>
        f.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (f.municipio && f.municipio.toLowerCase().includes(busqueda.toLowerCase())) ||
        (f.departamento && f.departamento.toLowerCase().includes(busqueda.toLowerCase()))
    );

    const manejarEnvio = async (e: React.FormEvent) => {
        e.preventDefault();
        const idDelProductor = user?.id || 1;

        const payload = {
            nombre: formData.nombre,
            municipio: formData.municipio,
            departamento: formData.departamento,
            productorId: idDelProductor,
            area_hectareas: Number(formData.areaHectareas) || 0,
            // Enviamos vacío si no hay código, para que no cuente como activo
            codigo_ica: formData.codigoIca.trim()
        };

        try {
            if (isEditing && formData.id) {
                await apiClient.fincas.update(formData.id, payload);
            } else {
                await apiClient.fincas.create(payload as any);
            }

            cerrarFormulario();
            await cargarDatos();
        } catch (err: any) {
            console.error("Error completo del servidor:", err.response?.data);
            const mensaje = err.response?.data?.message || err.message || "Error desconocido";
            alert("Error al procesar: " + (Array.isArray(mensaje) ? mensaje.join(", ") : mensaje));
        }
    };

    const manejarCambioHectareas = (valor: string) => {
        if (valor === "" || /^\d*\.?\d*$/.test(valor)) {
            setFormData({...formData, areaHectareas: valor});
        }
    };

    const iniciarCreacion = () => {
        setFormData({ id: null, nombre: '', municipio: '', departamento: '', areaHectareas: '', codigoIca: '' });
        setIsEditing(false);
        setIsFormOpen(true);
    };

    const iniciarEdicion = (finca: any) => {
        setFormData({
            id: finca.id,
            nombre: finca.nombre,
            municipio: finca.municipio,
            departamento: finca.departamento,
            areaHectareas: finca.area_hectareas || finca.areaHectareas || '',
            codigoIca: finca.codigo_ica || finca.codigoIca || ''
        });
        setIsEditing(true);
        setIsFormOpen(true);
    };

    const cerrarFormulario = () => {
        setIsFormOpen(false);
        setFormData({ id: null, nombre: '', municipio: '', departamento: '', areaHectareas: '', codigoIca: '' });
        setIsEditing(false);
    };

    const manejarEliminar = async (id: number) => {
        if (!window.confirm(`¿Estás seguro de eliminar la finca #${id}?`)) return;
        try {
            await apiClient.fincas.delete(id);
            await cargarDatos();
        } catch (err: any) {
            alert("Error: " + err.message);
        }
    };

    // Lógica de Códigos ICA Activos: Solo cuenta si el campo tiene texto y no es solo espacios
    const areaTotal = fincas.reduce((acc, f) => acc + (Number(f.area_hectareas || f.areaHectareas) || 0), 0);
    const fincasConIca = fincas.filter(f => {
        const val = (f.codigo_ica || f.codigoIca || "").trim();
        return val !== "" && val !== "---" && val !== "Pendiente";
    }).length;

    return (
        <div className="p-4 md:p-8 bg-[#f9fbf9] min-h-screen font-sans text-slate-700 pb-24 md:pb-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#2d5a27] mb-1">Gestión de Fincas</h1>
                    <p className="text-slate-500 max-w-xl text-xs md:text-sm">
                        Organiza tus unidades productivas y operarios asignados.
                    </p>
                </div>
                <button
                    onClick={iniciarCreacion}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#1a4316] text-white px-5 py-3 rounded-xl font-semibold hover:bg-[#245a1e] transition-all shadow-lg text-sm"
                >
                    <PlusIcon />
                    Añadir Finca
                </button>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-slate-400 text-[10px] md:text-sm font-medium mb-2 md:mb-4 uppercase tracking-wider">Área total</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl md:text-4xl font-bold text-slate-800">{areaTotal.toFixed(1)}</span>
                        <span className="text-lg font-semibold text-slate-800">Ha</span>
                    </div>
                </div>

                <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-slate-400 text-[10px] md:text-sm font-medium mb-2 md:mb-4 uppercase tracking-wider">Registradas</h3>
                    <span className="text-3xl md:text-4xl font-bold text-green-600">{fincas.length}</span>
                </div>

                <div className="bg-[#fde2d3] p-5 md:p-6 rounded-2xl shadow-sm border border-orange-100 sm:col-span-2 md:col-span-1">
                    <h3 className="text-slate-500 text-[10px] md:text-sm font-medium mb-2 md:mb-4 uppercase tracking-wider">ICA Activos</h3>
                    <span className="text-3xl md:text-4xl font-bold text-orange-800/60">{fincasConIca}</span>
                </div>
            </section>

            <div className="mb-6">
                <div className="relative">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o ubicación..."
                        className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm text-sm"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="bg-white p-12 rounded-2xl text-center border-2 border-dashed border-slate-200 text-slate-400 animate-pulse text-sm">
                        Cargando unidades...
                    </div>
                ) : error ? (
                    <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-600 text-center text-sm">
                        {error}
                    </div>
                ) : fincasFiltradas.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl text-center border border-slate-200 shadow-sm text-slate-400 italic text-sm">
                        No se encontraron registros.
                    </div>
                ) : (
                    fincasFiltradas.map((f: any) => (
                        <div key={f.id} className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                                <div className="min-w-[56px] h-14 bg-green-50 rounded-xl flex flex-col items-center justify-center text-green-700 font-bold border border-green-100">
                                    <span className="text-lg leading-none">{f.area_hectareas || f.areaHectareas || 0}</span>
                                    <span className="text-[10px] uppercase">Ha</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-slate-800 text-base md:text-lg leading-tight truncate">{f.nombre}</h4>
                                    <p className="text-[10px] md:text-[11px] text-slate-400 uppercase tracking-wider mt-1 break-words">
                                        ICA: {(f.codigo_ica || f.codigoIca || "").trim() || '---'} • {f.municipio}, {f.departamento}
                                    </p>
                                    <div className="text-[10px] text-blue-600 font-bold mt-1 uppercase flex items-center gap-1">
                                        <span className="opacity-50">👤</span> {f.productorNombre || 'Productor'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                                <button onClick={() => iniciarEdicion(f)} className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-xl text-xs font-bold transition-all border border-slate-100 hover:border-blue-100">
                                    Editar
                                </button>
                                <button onClick={() => manejarEliminar(f.id)} className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-50 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition-all border border-slate-100 hover:border-red-100">
                                    Borrar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-hidden">
                    <div className="bg-white p-6 md:p-8 rounded-t-[32px] sm:rounded-[32px] shadow-2xl w-full max-w-lg border border-slate-100 max-h-[95vh] overflow-y-auto pb-32 sm:pb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl md:text-2xl font-bold text-[#2d5a27]">
                                {isEditing ? 'Editar Finca' : 'Nueva Finca'}
                            </h2>
                            <button onClick={cerrarFormulario} className="sm:hidden text-slate-400 font-bold p-2 text-xl">&times;</button>
                        </div>
                        <form onSubmit={manejarEnvio} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Nombre de la unidad</label>
                                    <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Municipio</label>
                                    <input type="text" value={formData.municipio} onChange={(e) => setFormData({...formData, municipio: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Departamento</label>
                                    <input type="text" value={formData.departamento} onChange={(e) => setFormData({...formData, departamento: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Hectáreas</label>
                                    <input
                                        type="text" inputMode="decimal"
                                        value={formData.areaHectareas}
                                        onChange={(e) => manejarCambioHectareas(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all" required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Código ICA</label>
                                    <input type="text" value={formData.codigoIca} onChange={(e) => setFormData({...formData, codigoIca: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all" />
                                </div>
                            </div>
                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                                <button type="button" onClick={cerrarFormulario} className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all text-sm">Cancelar</button>
                                <button type="submit" className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#2d5a27] text-white font-bold shadow-lg hover:bg-[#1f401b] transition-all text-sm">
                                    {isEditing ? 'Guardar Cambios' : 'Registrar Finca'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
