import { Router, Response } from "express";
import { authMiddleware, requireRoles, AuthRequest } from "../middleware/auth.middleware.js";
import { OperarioService } from "../services/operario.service.js";

const router = Router();
const operarioService = new OperarioService();

router.use(authMiddleware);

router.post(
  "/",
  requireRoles("PRODUCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const operario = await operarioService.registerOperario(
        req.user!.userId,
        req.body
      );
      res.status(201).json(operario);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get("/", requireRoles("PRODUCTOR"), async (req: AuthRequest, res: Response) => {
  try {
    const operariosConParcelas = await operarioService.listOperariosConParcelas(req.user!.userId);
    res.json(operariosConParcelas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/con-parcelas", requireRoles("PRODUCTOR"), async (req: AuthRequest, res: Response) => {
  try {
    const operariosConParcelas = await operarioService.listOperariosConParcelas(req.user!.userId);
    res.json(operariosConParcelas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/asignaciones",
  requireRoles("PRODUCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      await operarioService.asignarAParcela(
        req.user!.userId,
        req.body.operarioId,
        req.body.parcelaId
      );
      res.json({ message: "Operario asignado correctamente" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  "/:operarioId/asignar",
  requireRoles("PRODUCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      await operarioService.asignarAParcela(
        req.user!.userId,
        parseInt(req.params.operarioId),
        req.body.parcelaId
      );
      res.json({ success: true, message: "Operario asignado correctamente" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  "/:operarioId/desasignar",
  requireRoles("PRODUCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      await operarioService.desasignarDeParcela(
        req.user!.userId,
        parseInt(req.params.operarioId),
        req.body.parcelaId
      );
      res.json({ success: true, message: "Operario desasignado correctamente" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.delete(
  "/asignaciones/:operarioId/:parcelaId",
  requireRoles("PRODUCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      await operarioService.desasignarDeParcela(
        req.user!.userId,
        parseInt(req.params.operarioId),
        parseInt(req.params.parcelaId)
      );
      res.json({ message: "Operario desasignado correctamente" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export { router as operarioRouter };