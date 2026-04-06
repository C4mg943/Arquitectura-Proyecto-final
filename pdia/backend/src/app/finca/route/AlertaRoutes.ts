import { Router } from "express";
import { body, param } from "express-validator";
import { AlertaController } from "../controller/AlertaController";
import { RequireAuth } from "../../../middleware/AuthMiddleware";
import { ValidateRequest } from "../../../middleware/ValidationMiddleware";
import { RequireRoles } from "../../../middleware/RoleMiddleware";

const alertaRouter = Router();
const alertaController = new AlertaController();

alertaRouter.use(RequireAuth, RequireRoles(["PRODUCTOR", "OPERARIO"]));

alertaRouter.get("/", alertaController.list);

alertaRouter.get(
    "/cultivo/:cultivoId",
    [
        param("cultivoId").isInt({ min: 1 }),
        ValidateRequest
    ],
    alertaController.listByCultivo
);

alertaRouter.get(
    "/:id",
    [
        param("id").isInt({ min: 1 }),
        ValidateRequest
    ],
    alertaController.findOne
);

alertaRouter.post(
    "/",
    RequireRoles(["PRODUCTOR", "ADMINISTRADOR"]),
    [
        body("tipo").isIn(["LLUVIA", "TEMPERATURA_ALTA", "TEMPERATURA_BAJA", "VIENTO"]),
        body("valorDetectado").isFloat(),
        body("fecha").isISO8601(),
        body("cultivoId").isInt({ min: 1 }),
        ValidateRequest
    ],
    alertaController.create
);

alertaRouter.delete(
    "/:id",
    RequireRoles(["PRODUCTOR", "ADMINISTRADOR"]),
    [
        param("id").isInt({ min: 1 }),
        ValidateRequest
    ],
    alertaController.delete
);

export default alertaRouter;
