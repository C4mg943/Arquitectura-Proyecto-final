import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { RecommendationService } from "../services/recommendation.service.js";
import { authMiddleware, requireRoles } from "../middleware/auth.middleware.js";
import { AuthRequest } from "../types/express.js";

const router = Router();
const recService = new RecommendationService();

router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const recomendaciones = req.user!.rol === "TECNICO"
      ? await recService.listByTecnico(req.user!.userId)
      : await recService.listByUser(req.user!.userId, req.user!.rol);
    res.json(recomendaciones.map((r) => r.toJson()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/cultivo/:cultivoId", async (req: AuthRequest, res: Response) => {
  try {
    const recomendaciones = await recService.listByCultivo(
      parseInt(req.params.cultivoId),
      req.user!.userId,
      req.user!.rol
    );
    res.json(recomendaciones.map((r) => r.toJson()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/",
  requireRoles("TECNICO", "ADMINISTRADOR"),
  [
    body("tipo").isIn(["RIEGO", "FERTILIZACION", "FITORECOMENDACION"]),
    body("descripcion").notEmpty(),
    body("cultivoId").isInt({ min: 1 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const recomendacion = await recService.create(req.body);
      res.status(201).json(recomendacion.toJson());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export { router as recommendationRouter };