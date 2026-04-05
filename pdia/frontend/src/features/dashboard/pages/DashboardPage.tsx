import { Badge, Button, Card } from '../../../shared/components/common'

const summaryCards = [
  { icon: 'grid_view', value: '12', label: 'Parcelas Totales' },
  { icon: 'area_chart', value: '450', label: 'Hectáreas' },
  { icon: 'water_drop', value: '85%', label: 'Eficiencia Riego' },
  { icon: 'potted_plant', value: '4', label: 'Tipos de Cultivo' },
]

const activeCrops = [
  { name: 'Trigo de Invierno', detail: 'Parcela 02 • Cosecha en 14 días', status: 'Fase Final' },
  { name: 'Girasol', detail: 'Parcela 08 • Floración temprana', status: 'Crecimiento' },
  { name: 'Maíz Forrajero', detail: 'Parcela 01 • Preparación suelo', status: 'Inicial' },
]

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-headline-md text-on-primary-fixed-variant">Bienvenido, Agrónomo</h1>
          <p className="mt-1 text-on-surface-variant">
            Estado general de la explotación: <strong className="text-primary">Óptimo</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button leadingIcon="add_task" variant="primary">
            Registrar Actividad
          </Button>
          <Button leadingIcon="nature_people" variant="secondary">
            Añadir Cultivo
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <Card className="md:col-span-4 bg-gradient-to-br from-tertiary-container to-surface-container-low text-on-tertiary">
          <p className="text-label-md opacity-80">CLIMA ACTUAL</p>
          <div className="mt-4 flex items-center gap-4">
            <span className="material-symbols-outlined text-6xl">partly_cloudy_day</span>
            <div>
              <h2 className="font-headline text-5xl font-bold">24°C</h2>
              <p className="text-sm opacity-90">Mayormente soleado</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <p className="text-sm">Humedad: 45%</p>
            <p className="text-sm">Viento: 12 km/h</p>
          </div>
        </Card>

        <Card className="md:col-span-8" subtitle="Resumen de estado productivo" title="Resumen de Parcelas">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <div className="surface-panel rounded-2xl p-4 text-center" key={card.label}>
                <span className="material-symbols-outlined text-primary">{card.icon}</span>
                <p className="font-headline mt-2 text-2xl font-bold text-on-surface">{card.value}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{card.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-6" title="Cultivos Activos">
          <div className="space-y-3">
            {activeCrops.map((crop) => (
              <article className="surface-panel rounded-2xl p-4" key={crop.name}>
                <p className="font-semibold text-on-surface">{crop.name}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{crop.detail}</p>
                <p className="mt-2 text-xs font-bold text-primary">{crop.status}</p>
              </article>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-6" title="Alertas y Notificaciones">
          <div className="space-y-3">
            <article className="rounded-2xl bg-error-container p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold text-on-error-container">Estrés hídrico detectado</p>
                <Badge variant="danger">Nueva</Badge>
              </div>
              <p className="text-sm text-on-error-container">Parcela 02 con humedad crítica (&lt;12%).</p>
            </article>
            <article className="surface-panel rounded-2xl p-4">
              <p className="font-semibold text-on-surface">Reporte semanal disponible</p>
              <p className="mt-1 text-sm text-on-surface-variant">Semana 22 lista para descarga.</p>
            </article>
          </div>
        </Card>
      </div>
    </section>
  )
}
