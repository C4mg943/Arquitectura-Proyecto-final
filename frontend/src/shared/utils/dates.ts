/**
 * Parsea una fecha "YYYY-MM-DD" como hora LOCAL (no UTC).
 * Evita el bug de zona horaria donde new Date("2026-01-30") en UTC-5
 * se muestra como 29 de enero.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN)
  // Si ya tiene hora, usarla tal cual
  if (dateStr.includes('T')) return new Date(dateStr)
  // Añadir T00:00:00 sin Z para que JS lo interprete como hora local
  return new Date(`${dateStr}T00:00:00`)
}

/**
 * Formatea una fecha "YYYY-MM-DD" en español colombiano sin desfase de zona horaria.
 */
export function formatDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
): string {
  const d = parseLocalDate(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('es-CO', options)
}

/**
 * Formatea una fecha+hora ISO completa en español colombiano.
 */
export function formatDateTime(
  isoStr: string,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  },
): string {
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  return d.toLocaleString('es-CO', options)
}
