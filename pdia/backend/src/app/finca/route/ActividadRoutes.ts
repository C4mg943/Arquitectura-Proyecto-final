import { Router } from "express";
import { body, param } from "express-validator";
import { ActividadController } from "../controller/ActividadController";
import { RequireAuth } from "../../../middleware/AuthMiddleware";
import { ValidateRequest } from "../../../middleware/ValidationMiddleware";
import { RequireRoles } from "../../../middleware/RoleMiddleware";

const actividadRouter = Router();
const actividadController = new ActividadController();

actividadRouter.use(RequireAuth, RequireRoles(["PRODUCTOR", "OPERARIO"]));

actividadRouter.get("/", actividadController.list);

actividadRouter.get(
    "/cultivo/:cultivoId",
    [
        param("cultivoId").isInt({ min: 1 }),
        ValidateRequest
    ],
    actividadController.listByCultivo
);

actividadRouter.get(
    "/:id",
    [
        param("id").isInt({ min: 1 }),
        ValidateRequest
    ],
    actividadController.findOne
);

actividadRouter.post(
    "/",
    [
        body("tipo").isIn(["RIEGO", "FERTILIZACION", "PLAGA", "OBSERVACION"]),
        body("fecha").isISO8601(),
        body("descripcion").isString().trim().notEmpty().isLength({ min: 3, max: 1500 }),
        body("datos").optional().isObject(),
        body("cultivoId").isInt({ min: 1 }),
        ValidateRequest
    ],
    actividadController.create
);

actividadRouter.put(
    "/:id",
    [
        param("id").isInt({ min: 1 }),
        body("tipo").optional().isIn(["RIEGO", "FERTILIZACION", "PLAGA", "OBSERVACION"]),
        body("fecha").optional().isISO8601(),
        body("descripcion").optional().isString().trim().notEmpty().isLength({ min: 3, max: 1500 }),
        body("datos").optional().isObject(),
        ValidateRequest
    ],
    actividadController.update
);

actividadRouter.delete(
    "/:id",
    [
        param("id").isInt({ min: 1 }),
        ValidateRequest
    ],
    actividadController.delete
);

export default actividadRouter;
