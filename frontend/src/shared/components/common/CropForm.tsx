import { type FormEvent, useEffect, useMemo, useState } from 'react'

import type { CreateCultivoPayload, CultivoDto, ParcelaAreaUsageDto, ParcelaDto } from '../../services/apiClient'
import { apiClient } from '../../services/apiClient'
import { cultivoSchema } from '../../utils/validators'
import Button from './Button'
import Input from './Input'

type CropFormMode = 'create' | 'edit'

interface CropFormProps {
  mode: CropFormMode
  parcelas: ParcelaDto[]
  initialValue?: CultivoDto | null
  isSubmitting: boolean
  onSubmit: (payload: CreateCultivoPayload) => Promise<void>
  onCancel: () => void
}

interface CropFormState {
  tipoCultivo: string
  fechaSiembra: string
  estado: CreateCultivoPayload['estado']
  observaciones: string
  areaM2: string
  parcelaId: string
}

const initialState: CropFormState = {
  tipoCultivo: '',
  fechaSiembra: '',
  estado: 'EN_CRECIMIENTO',
  observaciones: '',
  areaM2: '',
  parcelaId: '',
}

export default function CropForm({ mode, parcelas, initialValue, isSubmitting, onSubmit, onCancel }: CropFormProps) {
  const seedForm = useMemo<CropFormState>(() => {
    if (mode === 'edit' && initialValue) {
      return {
        tipoCultivo: initialValue.tipoCultivo,
        fechaSiembra: initialValue.fechaSiembra,
        estado: initialValue.estado,
        observaciones: initialValue.observaciones ?? '',
        areaM2: initialValue.areaM2 != null ? String(initialValue.areaM2) : '',
        parcelaId: String(initialValue.parcelaId),
      }
    }

    if (mode === 'create' && parcelas.length > 0) {
      return { ...initialState, parcelaId: String(parcelas[0].id) }
    }

    return initialState
  }, [initialValue, mode, parcelas])

  const [form, setForm] = useState<CropFormState>(seedForm)
  const [error, setError] = useState<string | null>(null)
  const [tiposCultivo, setTiposCultivo] = useState<{ id: number; nombre: string; descripcion: string | null }[]>([])
  const [areaUsage, setAreaUsage] = useState<ParcelaAreaUsageDto | null>(null)

  const todayIso = new Date().toISOString().split('T')[0]

  useEffect(() => {
    apiClient.cultivos.getTipos().then(setTiposCultivo).catch(console.error)
  }, [])

  // Cuando se cambia la parcela seleccionada, consultar uso de área
  useEffect(() => {
    setAreaUsage(null)
    const parcelaId = Number(form.parcelaId)
    if (!parcelaId || Number.isNaN(parcelaId)) return
    let cancelled = false
    apiClient.parcelas
      .areaUsage(parcelaId)
      .then((data) => {
        if (!cancelled) setAreaUsage(data)
      })
      .catch(() => {
        // silencioso
      })
    return () => {
      cancelled = true
    }
  }, [form.parcelaId])

  const parcelOptions = useMemo(() => parcelas.map((parcela) => ({ id: parcela.id, nombre: parcela.nombre })), [parcelas])

  // Cálculo del espacio disponible considerando si es edición sobre la misma parcela
  const areaM2Num = Number(form.areaM2)
  const ownAreaM2 = mode === 'edit' && initialValue?.areaM2 != null ? Number(initialValue.areaM2) : 0
  const espacioDisponibleM2 = areaUsage
    ? areaUsage.disponibleM2 + (mode === 'edit' && Number(initialValue?.parcelaId) === Number(form.parcelaId) ? ownAreaM2 : 0)
    : null
  const excedeArea =
    espacioDisponibleM2 !== null &&
    !Number.isNaN(areaM2Num) &&
    areaM2Num > 0 &&
    areaM2Num > espacioDisponibleM2 + 0.01

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const payload = {
      tipoCultivo: form.tipoCultivo.trim(),
      fechaSiembra: form.fechaSiembra,
      estado: form.estado,
      observaciones: form.observaciones.trim() || undefined,
      areaM2: form.areaM2 ? Number(form.areaM2) : undefined,
      parcelaId: Number(form.parcelaId),
    }

    const parsed = cultivoSchema.safeParse(payload)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos de cultivo')
      return
    }

    // Validación adicional: fecha de siembra no puede ser futura
    if (parsed.data.fechaSiembra > todayIso) {
      setError('La fecha de siembra no puede ser futura.')
      return
    }

    // Validación de área disponible (eco del backend)
    if (excedeArea && espacioDisponibleM2 !== null) {
      setError(
        `El cultivo no cabe en la parcela. Disponible: ${espacioDisponibleM2.toFixed(0)} m². Estás registrando ${areaM2Num.toFixed(0)} m².`,
      )
      return
    }

    await onSubmit(parsed.data)
  }

  const title = mode === 'create' ? 'Nuevo cultivo' : 'Editar cultivo'
  const submitLabel = mode === 'create' ? 'Crear cultivo' : 'Guardar cambios'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-surface p-6 shadow-[0_20px_60px_rgb(0_0_0_/_30%)]">
        <h2 className="mb-4 text-xl font-bold text-on-surface">{title}</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2" htmlFor="crop-tipo">
              <span className="text-label-md block text-on-surface-variant">Tipo de cultivo</span>
              <select
                id="crop-tipo"
                className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                onChange={(event) => setForm((current) => ({ ...current, tipoCultivo: event.target.value }))}
                value={form.tipoCultivo}
              >
                <option value="">Selecciona un tipo de cultivo</option>
                {tiposCultivo.map((tipo) => (
                  <option key={tipo.id} value={tipo.nombre}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2" htmlFor="crop-parcela">
              <span className="text-label-md block text-on-surface-variant">Parcela</span>
              <select
                id="crop-parcela"
                className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                onChange={(event) => setForm((current) => ({ ...current, parcelaId: event.target.value }))}
                value={form.parcelaId}
              >
                <option value="">Selecciona una parcela</option>
                {parcelOptions.map((parcela) => (
                  <option key={parcela.id} value={parcela.id}>
                    {parcela.nombre}
                  </option>
                ))}
              </select>
            </label>

            <Input
              id="crop-fecha"
              label="Fecha de siembra"
              max={todayIso}
              onChange={(event) => setForm((current) => ({ ...current, fechaSiembra: event.target.value }))}
              type="date"
              value={form.fechaSiembra}
            />

            <Input
              id="crop-area"
              label="Área del cultivo (m²)"
              min="0"
              onChange={(event) => setForm((current) => ({ ...current, areaM2: event.target.value }))}
              placeholder="Ej. 500"
              step="1"
              type="number"
              value={form.areaM2}
            />

            <label className="space-y-2 md:col-span-2" htmlFor="crop-estado">
              <span className="text-label-md block text-on-surface-variant">Estado</span>
              <select
                id="crop-estado"
                className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    estado: event.target.value as CreateCultivoPayload['estado'],
                  }))
                }
                value={form.estado}
              >
                <option value="EN_CRECIMIENTO">En crecimiento</option>
                <option value="COSECHADO">Cosechado</option>
                <option value="AFECTADO">Afectado</option>
              </select>
            </label>

            <div className="md:col-span-2">
              <label className="space-y-2" htmlFor="crop-observaciones">
                <span className="text-label-md block text-on-surface-variant">Observaciones</span>
                <textarea
                  id="crop-observaciones"
                  className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                  onChange={(event) => setForm((current) => ({ ...current, observaciones: event.target.value }))}
                  placeholder="Observaciones del cultivo..."
                  rows={4}
                  value={form.observaciones}
                />
              </label>
            </div>
          </div>

          {/* Indicador de uso de área de la parcela */}
          {areaUsage && espacioDisponibleM2 !== null ? (
            <div className={`rounded-xl px-3 py-2.5 text-sm ${excedeArea ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">
                  {excedeArea ? '⚠ El cultivo no cabe en la parcela' : '📐 Área de la parcela'}
                </span>
                <span className="text-xs">
                  Total: {areaUsage.totalM2.toFixed(0)} m² ({areaUsage.hectareas.toFixed(2)} ha) · Disponible: {espacioDisponibleM2.toFixed(0)} m²
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface/40">
                <div
                  className={`h-full transition-all ${excedeArea ? 'bg-error' : 'bg-primary'}`}
                  style={{
                    width: `${Math.min(100, ((areaUsage.totalM2 - espacioDisponibleM2 + (Number.isFinite(areaM2Num) ? areaM2Num : 0)) / Math.max(areaUsage.totalM2, 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button disabled={isSubmitting} onClick={onCancel} type="button" variant="tertiary">
              Cancelar
            </Button>
            <Button disabled={isSubmitting} type="submit" variant="primary">
              {isSubmitting ? 'Guardando...' : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
