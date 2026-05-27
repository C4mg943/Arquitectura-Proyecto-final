import { type FormEvent, useEffect, useMemo, useState } from 'react'

import type { CreateParcelaPayload, FincaAreaUsageDto, FincaDto, MunicipioDto, ParcelaDto } from '../../services/apiClient'
import { apiClient } from '../../services/apiClient'
import { parcelaSchema } from '../../utils/validators'
import Button from './Button'
import Input from './Input'

type ParcelFormMode = 'create' | 'edit'

interface ParcelFormProps {
  mode: ParcelFormMode
  fincas: FincaDto[]
  initialValue?: ParcelaDto | null
  isSubmitting: boolean
  onSubmit: (payload: CreateParcelaPayload) => Promise<void>
  onCancel: () => void
}

interface ParcelFormState {
  nombre: string
  municipio: string
  hectareas: string
  latitud: string
  longitud: string
  fincaId: string
}

const initialState: ParcelFormState = {
  nombre: '',
  municipio: '',
  hectareas: '',
  latitud: '',
  longitud: '',
  fincaId: '',
}

/** Distancia haversine en km. */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function ParcelForm({ mode, fincas, initialValue, isSubmitting, onSubmit, onCancel }: ParcelFormProps) {
  const seedForm = useMemo<ParcelFormState>(() => {
    if (mode === 'edit' && initialValue) {
      return {
        nombre: initialValue.nombre ?? '',
        municipio: initialValue.municipio ?? '',
        hectareas: initialValue.hectareas != null ? String(initialValue.hectareas) : '',
        latitud: initialValue.latitud != null ? String(initialValue.latitud) : '',
        longitud: initialValue.longitud != null ? String(initialValue.longitud) : '',
        fincaId: initialValue.fincaId != null ? String(initialValue.fincaId) : '',
      }
    }

    if (mode === 'create' && fincas.length > 0) {
      return {
        ...initialState,
        fincaId: String(fincas[0].id),
      }
    }

    return initialState
  }, [fincas, mode, initialValue])

  const [form, setForm] = useState<ParcelFormState>(seedForm)
  const [error, setError] = useState<string | null>(null)
  const [municipios, setMunicipios] = useState<MunicipioDto[]>([])
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false)
  const [areaUsage, setAreaUsage] = useState<FincaAreaUsageDto | null>(null)

  // Cuando se selecciona una finca, consultar cuánto espacio queda disponible.
  useEffect(() => {
    setAreaUsage(null)
    const fincaId = Number(form.fincaId)
    if (!fincaId || Number.isNaN(fincaId)) return
    let cancelled = false
    apiClient.fincas
      .areaUsage(fincaId)
      .then((data) => {
        if (!cancelled) setAreaUsage(data)
      })
      .catch(() => {
        // silencioso, no rompe el form
      })
    return () => {
      cancelled = true
    }
  }, [form.fincaId])

  // Calcula advertencia/uso si las hectáreas exceden lo disponible
  const hectareasNum = Number(form.hectareas)
  const ownHectareas = mode === 'edit' && initialValue ? Number(initialValue.hectareas) : 0
  const espacioDisponible = areaUsage
    ? areaUsage.disponibleHa + (mode === 'edit' && Number(initialValue?.fincaId) === Number(form.fincaId) ? ownHectareas : 0)
    : null
  const excedeArea = espacioDisponible !== null && !Number.isNaN(hectareasNum) && hectareasNum > espacioDisponible + 0.0001

  useEffect(() => {
    let cancelled = false
    setIsLoadingMunicipios(true)
    apiClient.parcelas
      .listMunicipios()
      .then((data) => {
        if (!cancelled) setMunicipios(data)
      })
      .catch(() => {
        // Si falla, el form sigue funcionando como texto libre
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMunicipios(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedMunicipio = useMemo(() => {
    if (!form.municipio) return null
    return municipios.find((m) => m.nombre.toLowerCase() === form.municipio.toLowerCase()) ?? null
  }, [form.municipio, municipios])

  // Advertencia si las coords se salen del radio del municipio declarado
  const distanceWarning = useMemo(() => {
    if (!selectedMunicipio) return null
    const lat = Number(form.latitud)
    const lon = Number(form.longitud)
    if (Number.isNaN(lat) || Number.isNaN(lon) || lat === 0 || lon === 0) return null
    const distance = haversineKm(lat, lon, selectedMunicipio.latitud, selectedMunicipio.longitud)
    if (distance > selectedMunicipio.radioKm) {
      return `Las coordenadas están a ${distance.toFixed(1)} km del centro de ${selectedMunicipio.nombre} (máx. ${selectedMunicipio.radioKm} km).`
    }
    return null
  }, [form.latitud, form.longitud, selectedMunicipio])

  const handleMunicipioChange = (nombre: string) => {
    setForm((current) => {
      const match = municipios.find((m) => m.nombre === nombre)
      // Si no hay coords aún y elige un municipio catalogado, auto-rellenar con el centroide.
      const shouldPrefill =
        match &&
        (!current.latitud || !current.longitud || current.latitud === '0' || current.longitud === '0')
      return {
        ...current,
        municipio: nombre,
        latitud: shouldPrefill ? String(match.latitud) : current.latitud,
        longitud: shouldPrefill ? String(match.longitud) : current.longitud,
      }
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const payload = {
      nombre: form.nombre.trim(),
      municipio: form.municipio.trim(),
      hectareas: Number(form.hectareas),
      latitud: Number(form.latitud),
      longitud: Number(form.longitud),
      fincaId: Number(form.fincaId),
    }

    const parsed = parcelaSchema.safeParse(payload)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos de parcela')
      return
    }

    // Validación client-side: si el municipio está en el catálogo, las coords deben
    // estar dentro del radio. Duplica la validación del backend para feedback inmediato.
    if (selectedMunicipio) {
      const distance = haversineKm(
        payload.latitud,
        payload.longitud,
        selectedMunicipio.latitud,
        selectedMunicipio.longitud,
      )
      if (distance > selectedMunicipio.radioKm) {
        setError(
          `Las coordenadas no concuerdan con ${selectedMunicipio.nombre}. Están a ${distance.toFixed(1)} km del centro (máx. ${selectedMunicipio.radioKm} km).`,
        )
        return
      }
    }

    // Validación de área disponible (eco del backend, feedback inmediato)
    if (excedeArea && espacioDisponible !== null) {
      setError(
        `La parcela no cabe en la finca. Tienes ${espacioDisponible.toFixed(2)} ha disponibles y estás registrando ${hectareasNum.toFixed(2)} ha.`,
      )
      return
    }

    await onSubmit(parsed.data)
  }

  const title = mode === 'create' ? 'Nueva parcela' : 'Editar parcela'
  const submitLabel = mode === 'create' ? 'Crear parcela' : 'Guardar cambios'
  const useMunicipioCatalog = municipios.length > 0

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-surface p-6 shadow-[0_20px_60px_rgb(0_0_0_/_30%)]">
        <h2 className="mb-4 text-xl font-bold text-on-surface">{title}</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="parcel-nombre"
              label="Nombre"
              onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
              placeholder="Finca El Roble"
              type="text"
              value={form.nombre}
            />

            {useMunicipioCatalog ? (
              <label className="space-y-2" htmlFor="parcel-municipio">
                <span className="text-label-md block text-on-surface-variant">Municipio</span>
                <select
                  id="parcel-municipio"
                  className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                  onChange={(event) => handleMunicipioChange(event.target.value)}
                  value={form.municipio}
                  disabled={isLoadingMunicipios}
                >
                  <option value="">Selecciona un municipio</option>
                  {municipios.map((m) => (
                    <option key={m.id} value={m.nombre}>
                      {m.nombre} · {m.departamento}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <Input
                id="parcel-municipio"
                label="Municipio"
                onChange={(event) => setForm((current) => ({ ...current, municipio: event.target.value }))}
                placeholder="Santa Marta"
                type="text"
                value={form.municipio}
              />
            )}

            <Input
              id="parcel-hectareas"
              label="Hectáreas"
              min="0"
              onChange={(event) => setForm((current) => ({ ...current, hectareas: event.target.value }))}
              placeholder="12.5"
              step="0.01"
              type="number"
              value={form.hectareas}
            />

            <Input
              id="parcel-latitud"
              label="Latitud"
              onChange={(event) => setForm((current) => ({ ...current, latitud: event.target.value }))}
              placeholder="11.2408"
              step="0.000001"
              type="number"
              value={form.latitud}
            />

            <Input
              id="parcel-longitud"
              label="Longitud"
              onChange={(event) => setForm((current) => ({ ...current, longitud: event.target.value }))}
              placeholder="-74.1990"
              step="0.000001"
              type="number"
              value={form.longitud}
            />

            <label className="space-y-2 md:col-span-2" htmlFor="parcel-finca">
              <span className="text-label-md block text-on-surface-variant">Finca</span>
              <select
                id="parcel-finca"
                className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                onChange={(event) => setForm((current) => ({ ...current, fincaId: event.target.value }))}
                value={form.fincaId}
              >
                <option value="">Selecciona una finca</option>
                {fincas.map((finca) => (
                  <option key={finca.id} value={finca.id}>
                    {finca.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedMunicipio && !distanceWarning ? (
            <p className="rounded-xl bg-tertiary-container px-3 py-2 text-xs text-on-tertiary-container">
              Centro sugerido de {selectedMunicipio.nombre}: {selectedMunicipio.latitud.toFixed(4)}, {selectedMunicipio.longitud.toFixed(4)} (radio permitido {selectedMunicipio.radioKm} km).
            </p>
          ) : null}

          {distanceWarning ? (
            <p className="rounded-xl bg-secondary-container px-3 py-2 text-sm font-semibold text-on-secondary-container">
              ⚠ {distanceWarning}
            </p>
          ) : null}

          {/* Indicador de uso de área de la finca */}
          {areaUsage && espacioDisponible !== null ? (
            <div className={`rounded-xl px-3 py-2.5 text-sm ${excedeArea ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary-container'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">
                  {excedeArea ? '⚠ La parcela no cabe en la finca' : '📐 Área de la finca'}
                </span>
                <span className="text-xs">
                  Total: {areaUsage.totalHa.toFixed(2)} ha · Disponible: {espacioDisponible.toFixed(2)} ha
                </span>
              </div>
              {/* Barra visual del uso */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface/40">
                <div
                  className={`h-full transition-all ${excedeArea ? 'bg-error' : 'bg-primary'}`}
                  style={{
                    width: `${Math.min(100, ((areaUsage.totalHa - espacioDisponible + (Number.isFinite(hectareasNum) ? hectareasNum : 0)) / Math.max(areaUsage.totalHa, 0.01)) * 100)}%`,
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
