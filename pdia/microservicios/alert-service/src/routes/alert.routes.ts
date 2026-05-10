import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { AlertService } from "../services/alert.service.js";
import { TipoAlerta } from "../models/alert.model.js";
import { authMiddleware, requireRoles } from "../middleware/auth.middleware.js";
import { AuthRequest } from "../types/express.js";

const router = Router();
const alertService = new AlertService();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const alertas = await alertService.listByUser(req.user!.userId);
    res.json(alertas.map((a) => a.toJson()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/cultivo/:cultivoId", async (req: AuthRequest, res: Response) => {
  try {
    const alertas = await alertService.listByCultivo(
      parseInt(req.params.cultivoId),
      req.user!.userId,
      req.user!.rol
    );
    res.json(alertas.map((a) => a.toJson()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/",
  requireRoles("PRODUCTOR", "TECNICO", "ADMINISTRADOR"),
  [
    body("tipo").isIn(["LLUVIA", "TEMPERATURA_ALTA", "TEMPERATURA_BAJA", "VIENTO"]),
    body("valorDetectado").isFloat(),
    body("cultivoId").isInt({ min: 1 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const alerta = await alertService.create({
        tipo: req.body.tipo as TipoAlerta,
        valor: req.body.valorDetectado,
        cultivoId: req.body.cultivoId,
      });
      res.status(201).json(alerta.toJson());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const alerta = await alertService.findById(
      parseInt(req.params.id),
      req.user!.userId,
      req.user!.rol
    );
    if (!alerta) return res.status(404).json({ error: "Alerta no encontrada" });
    res.json(alerta.toJson());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id/read", requireRoles("PRODUCTOR"), async (req: AuthRequest, res: Response) => {
  try {
    const updated = await alertService.markAsRead(parseInt(req.params.id), req.user!.userId);
    if (!updated) return res.status(404).json({ error: "Alerta no encontrada" });
    res.json({ message: "Alerta marcada como leída" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete(
  "/:id",
  requireRoles("PRODUCTOR", "ADMINISTRADOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const deleted = await alertService.delete(
        parseInt(req.params.id),
        req.user!.userId,
        req.user!.rol
      );
      if (!deleted) return res.status(404).json({ error: "Alerta no encontrada" });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export { router as alertRouter };
