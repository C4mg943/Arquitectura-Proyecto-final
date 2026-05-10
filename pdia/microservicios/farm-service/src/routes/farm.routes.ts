import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { FarmService } from "../services/farm.service.js";
import { authMiddleware, requireRoles, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();
const farmService = new FarmService();

router.use(authMiddleware);

router.get("/finca", requireRoles("PRODUCTOR", "ADMINISTRADOR"), async (req: AuthRequest, res: Response) => {
  try {
    const fincas = req.user!.rol === "ADMINISTRADOR"
      ? await farmService.listAllFincas()
      : await farmService.listFincas(req.user!.userId);
    res.json(fincas.map((f) => f.toJson()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/finca",
  requireRoles("PRODUCTOR", "ADMINISTRADOR"),
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
      const userId = req.user!.rol === "ADMINISTRADOR" ? null : req.user!.userId;
      const Finca = await farmService.createFinca(userId, req.body);
      res.status(201).json(Finca.toJson());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.delete("/finca/:id", requireRoles("PRODUCTOR", "ADMINISTRADOR"), async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await farmService.deleteFinca(parseInt(req.params.id), req.user!.userId);
    if (!deleted) return res.status(404).json({ error: "Finca no encontrada" });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/finca/:id", requireRoles("PRODUCTOR", "OPERARIO", "TECNICO", "ADMINISTRADOR"), async (req: AuthRequest, res: Response) => {
  try {
    const fincaId = parseInt(req.params.id);
    const propietarioId = req.user!.rol === "ADMINISTRADOR" ? null : req.user!.userId;
    const finca = await farmService.findFinca(fincaId, propietarioId);
    if (!finca) return res.status(404).json({ error: "Finca no encontrada" });
    res.json(finca.toJson());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put(
  "/finca/:id",
  requireRoles("PRODUCTOR", "ADMINISTRADOR"),
  [
    body("nombre").optional().notEmpty(),
    body("ubicacion").optional().notEmpty(),
    body("area").optional().isFloat({ min: 0.01 }),
    body("tipoFinca").optional().isIn(["AGRICOLA", "GANADERA", "MIXTA", "FORESTAL"]),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const fincaId = parseInt(req.params.id);
      const propietarioId = req.user!.rol === "ADMINISTRADOR" ? null : req.user!.userId;
      const finca = await farmService.updateFinca(fincaId, propietarioId, req.body);
      if (!finca) return res.status(404).json({ error: "Finca no encontrada" });
      res.json(finca.toJson());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get("/parcela", requireRoles("PRODUCTOR", "OPERARIO", "ADMINISTRADOR", "TECNICO"), async (req: AuthRequest, res: Response) => {
  try {
    let parcelas;
    if (req.user!.rol === "ADMINISTRADOR") {
      parcelas = await farmService.listAllParcelas();
    } else if (req.user!.rol === "TECNICO") {
      parcelas = await farmService.listParcelasByTecnico(req.user!.userId);
    } else if (req.user!.rol === "PRODUCTOR") {
      parcelas = await farmService.listParcelas(req.user!.userId);
    } else {
      parcelas = await farmService.listParcelasByOperario(req.user!.userId);
    }
    res.json(parcelas.map((p) => p.toJson()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/parcela",
  requireRoles("PRODUCTOR", "ADMINISTRADOR"),
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
  requireRoles("PRODUCTOR", "ADMINISTRADOR"),
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

router.delete("/parcela/:id", requireRoles("PRODUCTOR", "ADMINISTRADOR"), async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await farmService.deleteParcela(parseInt(req.params.id), req.user!.userId);
    if (!deleted) return res.status(404).json({ error: "Parcela no encontrada" });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as farmRouter };