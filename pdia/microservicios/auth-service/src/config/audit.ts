import { pool } from "./db.js";

/**
 * Registra una acción en la tabla audit_logs.
 * No lanza errores — si falla, solo loguea en consola para no interrumpir el flujo.
 */
export async function auditLog(params: {
  userId: number | null;
  action: string;
  entity: string;
  entityId?: number | null;
  details?: object | null;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        params.userId ?? null,
        params.action,
        params.entity,
        params.entityId ?? null,
        params.details ? JSON.stringify(params.details) : null,
        params.ipAddress ?? null,
      ]
    );
  } catch (error) {
    console.error("⚠️ audit_log failed (non-critical):", error);
  }
}
