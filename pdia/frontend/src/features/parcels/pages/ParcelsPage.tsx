import { Badge, Button, Card, Input } from '../../../shared/components/common'
import { Parcel } from '../../../shared/models/Parcel'

const parcels = [
  new Parcel(1, 'Finca El Paraíso', 'Villavicencio, Meta', 145, 4.15, -73.64),
  new Parcel(2, 'Lote Las Brisas', 'Espinal, Tolima', 320, 4.08, -74.88),
  new Parcel(3, 'Hacienda Real', 'Pereira, Risaralda', 88, 4.81, -75.69),
]

const parcelBadges: Array<{ id: number; status: 'safe' | 'warning' | 'danger'; text: string }> = [
  { id: 1, status: 'safe', text: 'Productivo' },
  { id: 2, status: 'warning', text: 'Sembrado Reciente' },
  { id: 3, status: 'danger', text: 'En Alerta' },
]

export default function ParcelsPage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-headline-md text-on-primary-fixed-variant">Parcels Inventory</h1>
          <p className="mt-1 max-w-2xl text-on-surface-variant">
            Gestiona tus activos agrícolas y monitorea rendimiento en todas las ubicaciones registradas.
          </p>
        </div>
        <Button leadingIcon="add_circle" variant="primary">
          Añadir Parcela
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-6" title="Total Area">
          <p className="font-headline text-4xl font-bold text-primary">1,240 Ha</p>
        </Card>
        <Card className="surface-panel p-6" title="Active Parcels">
          <p className="font-headline text-4xl font-bold text-primary">24</p>
        </Card>
        <Card className="bg-secondary-container p-6" title="Avg. Yield Status">
          <p className="font-headline text-3xl font-bold text-on-secondary-container">Optimal</p>
        </Card>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input id="parcel-filter" label="Buscar" placeholder="Filtrar por nombre o municipio..." type="text" />
        <Button className="md:mt-6" leadingIcon="filter_list" variant="tertiary">
          Municipios
        </Button>
        <Button className="md:mt-6" leadingIcon="sort" variant="tertiary">
          Hectáreas
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {parcels.map((parcel) => {
          const badge = parcelBadges.find((item) => item.id === parcel.id)
          return (
            <Card className="overflow-hidden p-0" key={parcel.id}>
              <div className="h-40 bg-gradient-to-br from-primary-container to-surface-container-high" />
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-title-lg text-on-surface">{parcel.nombre}</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">{parcel.municipio}</p>
                  </div>
                  <Badge variant={badge?.status ?? 'neutral'}>{badge?.text ?? 'Info'}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="surface-panel rounded-xl p-3">
                    <p className="text-label-md text-on-surface-variant">ÁREA</p>
                    <p className="font-headline mt-1 text-lg font-bold text-on-surface">{parcel.hectareas} Ha</p>
                  </div>
                  <div className="surface-panel rounded-xl p-3">
                    <p className="text-label-md text-on-surface-variant">CULTIVOS</p>
                    <p className="font-headline mt-1 text-lg font-bold text-on-surface">{(parcel.id % 4) + 1} Variedades</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button className="flex-1" variant="tertiary">
                    Ver detalles
                  </Button>
                  <button
                    aria-label={`Editar ${parcel.nombre}`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                    type="button"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
