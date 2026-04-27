import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { FarmService } from "../services/farm.service.js";
import { authMiddleware, requireRoles, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();
const farmService = new FarmService();

router.use(authMiddleware);

router.get("/finca", requireRoles("PRODUCTOR"), async (req: AuthRequest, res: Response) => {
  try {
    const fincas = await farmService.listFincas(req.user!.userId);
    res.json(fincas.map((f) => f.toJson()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/finca",
  requireRoles("PRODUCTOR"),
  [
    body("nombre").notEmpty(),
    body("ubicacion").notEmpty(),
    body("area").isFloat({ min: 0.01 }),
    body("tipoFinca").isIn(["AGRICOLA", "GANADERA", "MIXTA", "FORESTAL"]),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const Finca = await farmService.createFinca(req.user!.userId, req.body);
      res.status(201).json(Finca.toJson());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.delete("/finca/:id", requireRoles("PRODUCTOR"), async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await farmService.deleteFinca(parseInt(req.params.id), req.user!.userId);
    if (!deleted) return res.status(404).json({ error: "Finca no encontrada" });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/parcela", async (req: AuthRequest, res: Response) => {
  try {
    const parcelas = req.user!.rol === "PRODUCTOR"
      ? await farmService.listParcelas(req.user!.userId)
      : await farmService.listParcelasByOperario(req.user!.userId);
    res.json(parcelas.map((p) => p.toJson()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/parcela",
  requireRoles("PRODUCTOR"),
  [
    body("nombre").notEmpty(),
    body("municipio").notEmpty(),
    body("hectareas").isFloat({ min: 0.01 }),
    body("latitud").isFloat(),
    body("longitud").isFloat(),
    body("fincaId").isInt({ min: 1 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const parcela = await farmService.createParcela(req.user!.userId, req.body);
      res.status(201).json(parcela.toJson());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.put(
  "/parcela/:id",
  requireRoles("PRODUCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const parcela = await farmService.updateParcela(
        parseInt(req.params.id),
        req.user!.userId,
        req.body
      );
      if (!parcela) return res.status(404).json({ error: "Parcela no encontrada" });
      res.json(parcela.toJson());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.delete("/parcela/:id", requireRoles("PRODUCTOR"), async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await farmService.deleteParcela(parseInt(req.params.id), req.user!.userId);
    if (!deleted) return res.status(404).json({ error: "Parcela no encontrada" });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as farmRouter };