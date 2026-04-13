import { useNavigate } from 'react-router-dom'


export default function FarmsPage() {
    const navigate = useNavigate()

    const handleSelectFarm = (farmName: string) => {
        // Si el nombre es Wireframe (antes Wilfried), va a la ruta del esqueleto
        if (farmName === 'Wireframe') {
            navigate('/finca/wireframe')
        } else {
            // Si es Mockup, va a la versión con diseño
            navigate('/finca/mockup')
        }
    }

    return (
        <section className="space-y-8 p-4 text-on-surface">
            <header className="text-center md:text-left">
                <h1 className="text-headline-lg font-bold text-primary">Prototipo</h1>
                <p className="text-on-surface-variant mt-2">Gestionar fincas.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* BOTÓN WIREFRAME */}
                <button
                    onClick={() => handleSelectFarm('Wireframe')} // Cambié el nombre aquí
                    className="group relative flex flex-col items-center justify-center p-10 bg-surface-container-high rounded-[40px] border-2 border-transparent hover:border-primary hover:bg-primary-container transition-all duration-300 shadow-lg active:scale-95"
                >
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary text-on-primary shadow-md group-hover:rotate-6 transition-transform">
                        <span className="material-symbols-outlined text-5xl">grid_view</span>
                    </div>
                    <h2 className="text-3xl font-black">Wireframe</h2>
                </button>

                {/* BOTÓN MOCKUP */}
                <button
                    onClick={() => handleSelectFarm('Mockup')}
                    className="group relative flex flex-col items-center justify-center p-10 bg-surface-container-high rounded-[40px] border-2 border-transparent hover:border-secondary hover:bg-secondary-container transition-all duration-300 shadow-lg active:scale-95"
                >
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-secondary text-on-secondary shadow-md group-hover:-rotate-6 transition-transform">
                        <span className="material-symbols-outlined text-5xl">palette</span>
                    </div>
                    <h2 className="text-3xl font-black">Mockup</h2>
                </button>
            </div>
        </section>
    )
}