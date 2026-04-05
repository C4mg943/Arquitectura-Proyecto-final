import { Router } from "express";
import { body, param } from "express-validator";
import { ParcelaController } from "../controller/ParcelaController";
import { RequireAuth } from "../../../middleware/AuthMiddleware";
import { ValidateRequest } from "../../../middleware/ValidationMiddleware";

const parcelaRouter = Router();
const parcelaController = new ParcelaController();

parcelaRouter.use(RequireAuth);

parcelaRouter.get("/", parcelaController.list);

parcelaRouter.get(
    "/:id",
    [
        param("id").isInt({ min: 1 }),
        ValidateRequest
    ],
    parcelaController.findOne
);

parcelaRouter.post(
    "/",
    [
        body("nombre").isString().trim().notEmpty().isLength({ min: 2, max: 120 }),
        body("municipio").isString().trim().notEmpty().isLength({ min: 2, max: 120 }),
        body("hectareas").isFloat({ gt: 0 }),
        body("latitud").isFloat({ min: -90, max: 90 }),
        body("longitud").isFloat({ min: -180, max: 180 }),
        ValidateRequest
    ],
    parcelaController.create
);

parcelaRouter.put(
    "/:id",
    [
        param("id").isInt({ min: 1 }),
        body("nombre").optional().isString().trim().notEmpty().isLength({ min: 2, max: 120 }),
        body("municipio").optional().isString().trim().notEmpty().isLength({ min: 2, max: 120 }),
        body("hectareas").optional().isFloat({ gt: 0 }),
        body("latitud").optional().isFloat({ min: -90, max: 90 }),
        body("longitud").optional().isFloat({ min: -180, max: 180 }),
        ValidateRequest
    ],
    parcelaController.update
);

parcelaRouter.delete(
    "/:id",
    [
        param("id").isInt({ min: 1 }),
        ValidateRequest
    ],
    parcelaController.delete
);

export default parcelaRouter;
