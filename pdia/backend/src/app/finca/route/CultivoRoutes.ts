import { Router } from "express";
import { body, param, query } from "express-validator";
import { CultivoController } from "../controller/CultivoController";
import { RequireAuth } from "../../../middleware/AuthMiddleware";
import { ValidateRequest } from "../../../middleware/ValidationMiddleware";

const cultivoRouter = Router();
const cultivoController = new CultivoController();

cultivoRouter.use(RequireAuth);

cultivoRouter.get(
    "/",
    [
        query("tipoCultivo").optional().isString().trim().isLength({ min: 2, max: 120 }),
        ValidateRequest
    ],
    cultivoController.list
);

cultivoRouter.get(
    "/:id",
    [
        param("id").isInt({ min: 1 }),
        ValidateRequest
    ],
    cultivoController.findOne
);

cultivoRouter.post(
    "/",
    [
        body("tipoCultivo").isString().trim().notEmpty().isLength({ min: 2, max: 120 }),
        body("fechaSiembra").isISO8601(),
        body("estado").isIn(["EN_CRECIMIENTO", "COSECHADO", "AFECTADO"]),
        body("observaciones").optional().isString().isLength({ max: 1500 }),
        body("parcelaId").isInt({ min: 1 }),
        ValidateRequest
    ],
    cultivoController.create
);

cultivoRouter.put(
    "/:id",
    [
        param("id").isInt({ min: 1 }),
        body("tipoCultivo").optional().isString().trim().notEmpty().isLength({ min: 2, max: 120 }),
        body("fechaSiembra").optional().isISO8601(),
        body("estado").optional().isIn(["EN_CRECIMIENTO", "COSECHADO", "AFECTADO"]),
        body("observaciones").optional().isString().isLength({ max: 1500 }),
        ValidateRequest
    ],
    cultivoController.update
);

cultivoRouter.delete(
    "/:id",
    [
        param("id").isInt({ min: 1 }),
        ValidateRequest
    ],
    cultivoController.delete
);

export default cultivoRouter;
