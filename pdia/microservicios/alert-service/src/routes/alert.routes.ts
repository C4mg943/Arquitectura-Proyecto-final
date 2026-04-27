import { Router, Response } from "express";
import { AlertService } from "../services/alert.service.js";
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

router.put("/:id/read", requireRoles("PRODUCTOR"), async (req: AuthRequest, res: Response) => {
  try {
    const updated = await alertService.markAsRead(parseInt(req.params.id), req.user!.userId);
    if (!updated) return res.status(404).json({ error: "Alerta no encontrada" });
    res.json({ message: "Alerta marcada como leída" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as alertRouter };