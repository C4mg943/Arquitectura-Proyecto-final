import { Router, Response } from "express";
import { body } from "express-validator";
import { CropService } from "../services/crop.service.js";
import { authMiddleware, requireRoles, AuthRequest } from "../middleware/auth.middleware.js";
import { EstadoCultivo } from "../models/crop.model.js";

const router = Router();
const cropService = new CropService();

router.use(authMiddleware);

router.post(
  "/",
  requireRoles("PRODUCTOR"),
  [
    body("tipoCultivo").notEmpty(),
    body("fechaSiembra").isISO8601(),
    body("estado").isIn(["EN_CRECIMIENTO", "COSECHADO", "AFECTADO"]),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const cultivo = await cropService.create({
        ...req.body,
        usuarioId: req.user!.userId,
      });
      res.status(201).json(cultivo.toJson());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const cultivos = req.user!.rol === "PRODUCTOR"
      ? await cropService.listByPropietario(req.user!.userId)
      : await cropService.listByOperario(req.user!.userId);
    res.json(cultivos.map((c) => c.toJson()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/search", async (req: AuthRequest, res: Response) => {
  try {
    const tipo = req.query.tipo as string;
    if (!tipo) return res.status(400).json({ error: "Parámetro 'tipo' requerido" });

    const cultivos = await cropService.searchByTipo(req.user!.userId, tipo);
    res.json(cultivos.map((c) => c.toJson()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", requireRoles("PRODUCTOR"), async (req: AuthRequest, res: Response) => {
  try {
    const cultivo = await cropService.update(
      parseInt(req.params.id),
      req.user!.userId,
      req.body
    );
    if (!cultivo) return res.status(404).json({ error: "Cultivo no encontrado" });
    res.json(cultivo.toJson());
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", requireRoles("PRODUCTOR"), async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await cropService.delete(parseInt(req.params.id), req.user!.userId);
    if (!deleted) return res.status(404).json({ error: "Cultivo no encontrado" });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as cropRouter };