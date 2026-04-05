import { Badge, Button, Card } from '../../../shared/components/common'
import { Activity } from '../../../shared/models/Activity'

const activities = [
  new Activity(1, 'RIEGO', '2026-04-03T09:45:00', 'Caudal aplicado: 450L/ha. Duración: 2h 15min.'),
  new Activity(2, 'FERTILIZACION', '2026-04-02T16:20:00', 'Aplicación de NPK granulado. Suelo con humedad óptima.'),
  new Activity(3, 'PLAGA', '2026-04-01T11:30:00', 'Detección de Spodoptera frugiperda. Tratamiento biológico aplicado.'),
  new Activity(4, 'OBSERVACION', '2026-03-31T08:15:00', 'Crecimiento vegetativo vigoroso sin deficiencias nutricionales.'),
]

const activityMeta: Record<Activity['tipo'], { icon: string; sync: 'safe' | 'danger'; syncText: string; crop: string }> = {
  RIEGO: { icon: 'water_drop', sync: 'danger', syncText: 'Offline', crop: 'Maíz Híbrido XL' },
  FERTILIZACION: { icon: 'science', sync: 'safe', syncText: 'Synced', crop: 'Soja Premium' },
  PLAGA: { icon: 'pest_control', sync: 'safe', syncText: 'Synced', crop: 'Tomate Cherry' },
  OBSERVACION: { icon: 'visibility', sync: 'danger', syncText: 'Offline', crop: 'Trigo de Invierno' },
}

export default function ActivitiesPage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Historial de Actividades</h1>
        <p className="mt-1 max-w-2xl text-on-surface-variant">
          Seguimiento detallado de operaciones de campo y gestión de cultivos.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="md:col-span-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-label-md block text-on-surface-variant">Filtrar por tipo</span>
              <select className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary">
                <option>Todas las actividades</option>
                <option>Riego</option>
                <option>Fertilización</option>
                <option>Plagas</option>
                <option>Observaciones</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-label-md block text-on-surface-variant">Cultivo</span>
              <select className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface focus:ring-2 focus:ring-primary">
                <option>Todos los cultivos</option>
                <option>Maíz Híbrido XL</option>
                <option>Soja Premium</option>
                <option>Trigo de Invierno</option>
              </select>
            </label>

            <div className="flex items-end">
              <Button className="w-full" leadingIcon="filter_list" variant="primary">
                Aplicar
              </Button>
            </div>
          </div>
        </Card>

        <Card className="bg-tertiary text-on-tertiary" title="Estado Offline">
          <p className="font-headline text-3xl font-bold">3</p>
          <p className="mt-1 text-sm opacity-90">Pendientes de sincronizar</p>
        </Card>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const meta = activityMeta[activity.tipo]
          return (
            <Card className="p-4" key={activity.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low">
                    <span className="material-symbols-outlined text-primary">{meta.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-on-surface">{activity.tipo.replace('_', ' ')}</p>
                      <Badge variant={meta.sync}>{meta.syncText}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-on-surface-variant">{activity.descripcion}</p>
                  </div>
                </div>

                <div className="text-sm text-on-surface-variant">
                  <p>{new Date(activity.fecha).toLocaleString('es-CO')}</p>
                  <p className="mt-1 text-xs font-semibold">{meta.crop}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <button
        aria-label="Registrar actividad"
        className="ambient-shadow fixed bottom-24 right-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary lg:bottom-10"
        type="button"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </section>
  )
}
