import { Router } from "express";
import { param } from "express-validator";
import { ReporteController } from "../controller/ReporteController";
import { RequireAuth } from "../../../middleware/AuthMiddleware";
import { ValidateRequest } from "../../../middleware/ValidationMiddleware";

const reporteRouter = Router();
const reporteController = new ReporteController();

reporteRouter.use(RequireAuth);

reporteRouter.get(
    "/actividades/:cultivoId",
    [
        param("cultivoId").isInt({ min: 1 }),
        ValidateRequest
    ],
    reporteController.reporteActividades
);

reporteRouter.get(
    "/actividades/:cultivoId/csv",
    [
        param("cultivoId").isInt({ min: 1 }),
        ValidateRequest
    ],
    reporteController.reporteActividadesCsv
);

reporteRouter.get(
    "/riegos/:cultivoId",
    [
        param("cultivoId").isInt({ min: 1 }),
        ValidateRequest
    ],
    reporteController.reporteRiegos
);

reporteRouter.get(
    "/fertilizaciones/:cultivoId",
    [
        param("cultivoId").isInt({ min: 1 }),
        ValidateRequest
    ],
    reporteController.reporteFertilizaciones
);

export default reporteRouter;
