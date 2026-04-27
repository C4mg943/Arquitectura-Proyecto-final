import { Router, Response } from "express";
import { RecommendationService } from "../services/recommendation.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { AuthRequest } from "../types/express.js";

const router = Router();
const recService = new RecommendationService();

router.use(authMiddleware);
router.get("/", async (req: AuthRequest, res: Response) => {
  const recomendaciones = await recService.listByUser(req.user!.userId);
  res.json(recomendaciones.map((r) => r.toJson()));
});

export { router as recommendationRouter };