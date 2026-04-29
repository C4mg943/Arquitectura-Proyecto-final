import { Router, Response } from "express";
import { body } from "express-validator";
import { ActivityService } from "../services/activity.service.js";
import { authMiddleware, requireRoles, AuthRequest } from "../middleware/auth.middleware.js";
import { TipoActividad } from "../models/activity.model.js";

const router = Router();
const activityService = new ActivityService();

router.use(authMiddleware);

router.post(
  "/",
  requireRoles("PRODUCTOR", "OPERARIO"),
  [
    body("tipo").isIn(["RIEGO", "FERTILIZACION", "PLAGA", "OBSERVACION"]),
    body("fecha").isISO8601(),
    body("descripcion").notEmpty(),
    body("cultivoId").isInt({ min: 1 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const actividad = await activityService.create({
        ...req.body,
        usuarioId: req.user!.userId,
      });
      res.status(201).json(actividad.toJson());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  "/riego",
  requireRoles("PRODUCTOR", "OPERARIO"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { fecha, cantidadAgua, observaciones, cultivoId } = req.body;
      const actividad = await activityService.create({
        tipo: TipoActividad.RIEGO,
        fecha,
        descripcion: `Riego de ${cantidadAgua} litros. ${observaciones || ""}`,
        datos: { cantidadAgua, observaciones },
        cultivoId,
        usuarioId: req.user!.userId,
      });
      res.status(201).json(actividad.toJson());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  "/fertilizante",
  requireRoles("PRODUCTOR", "OPERARIO"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { fecha, tipoFertilizante, observaciones, cultivoId } = req.body;
      const actividad = await activityService.create({
        tipo: TipoActividad.FERTILIZACION,
        fecha,
        descripcion: `Aplicación de fertilizante: ${tipoFertilizante}. ${observaciones || ""}`,
        datos: { tipoFertilizante, observaciones },
        cultivoId,
        usuarioId: req.user!.userId,
      });
      res.status(201).json(actividad.toJson());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  "/plaga",
  requireRoles("PRODUCTOR", "OPERARIO"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { fecha, tipoPlaga, accionAplicada, observaciones, cultivoId } = req.body;
      const actividad = await activityService.create({
        tipo: TipoActividad.PLAGA,
        fecha,
        descripcion: `Control de plaga: ${tipoPlaga}. Acción: ${accionAplicada}. ${observaciones || ""}`,
        datos: { tipoPlaga, accionAplicada, observaciones },
        cultivoId,
        usuarioId: req.user!.userId,
      });
      res.status(201).json(actividad.toJson());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const actividades = await activityService.listByUsuario(req.user!.userId, req.user!.rol);
    res.json(actividades.map((a) => a.toJson()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/cultivo/:cultivoId", async (req: AuthRequest, res: Response) => {
  try {
    const actividades = await activityService.listByCultivo(
      parseInt(req.params.cultivoId),
      req.user!.userId,
      req.user!.rol
    );
    res.json(actividades.map((a) => a.toJson()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/filter", async (req: AuthRequest, res: Response) => {
  try {
    const tipo = req.query.tipo as string;
    if (!tipo || !Object.values(TipoActividad).includes(tipo as TipoActividad)) {
      return res.status(400).json({ error: "Tipo de actividad inválido" });
    }
    const actividades = await activityService.filterByTipo(
      req.user!.userId,
      req.user!.rol,
      tipo as TipoActividad
    );
    res.json(actividades.map((a) => a.toJson()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", requireRoles("PRODUCTOR", "OPERARIO"), async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await activityService.delete(
      parseInt(req.params.id),
      req.user!.userId,
      req.user!.rol
    );
    if (!deleted) return res.status(404).json({ error: "Actividad no encontrada" });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as activityRouter };