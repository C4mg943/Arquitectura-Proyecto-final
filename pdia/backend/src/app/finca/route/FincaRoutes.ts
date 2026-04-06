import { Router } from "express";
import { body, param } from "express-validator";
import { FincaController } from "../controller/FincaController";
import { RequireAuth } from "../../../middleware/AuthMiddleware";
import { ValidateRequest } from "../../../middleware/ValidationMiddleware";
import { RequireRoles } from "../../../middleware/RoleMiddleware";

const fincaRouter = Router();
const fincaController = new FincaController();

fincaRouter.use(RequireAuth, RequireRoles(["PRODUCTOR"]));

fincaRouter.get("/", fincaController.list);

fincaRouter.get(
    "/:id",
    [
        param("id").isInt({ min: 1 }),
        ValidateRequest
    ],
    fincaController.findOne
);

fincaRouter.post(
    "/",
    [
        body("nombre").isString().trim().notEmpty().isLength({ min: 2, max: 120 }),
        body("ubicacion").isString().trim().notEmpty().isLength({ min: 2, max: 200 }),
        body("descripcion").optional().isString().isLength({ max: 1500 }),
        body("area").isFloat({ gt: 0 }),
        body("tipoFinca").isIn(["AGRICOLA", "GANADERA", "MIXTA", "FORESTAL"]),
        body("fechaRegistro").optional().isISO8601(),
        body("codigoIcaInvima").optional().isString().isLength({ min: 3, max: 80 }),
        ValidateRequest
    ],
    fincaController.create
);

fincaRouter.put(
    "/:id",
    [
        param("id").isInt({ min: 1 }),
        body("nombre").optional().isString().trim().notEmpty().isLength({ min: 2, max: 120 }),
        body("ubicacion").optional().isString().trim().notEmpty().isLength({ min: 2, max: 200 }),
        body("descripcion").optional().isString().isLength({ max: 1500 }),
        body("area").optional().isFloat({ gt: 0 }),
        body("tipoFinca").optional().isIn(["AGRICOLA", "GANADERA", "MIXTA", "FORESTAL"]),
        body("fechaRegistro").optional().isISO8601(),
        body("codigoIcaInvima").optional().isString().isLength({ min: 3, max: 80 }),
        ValidateRequest
    ],
    fincaController.update
);

fincaRouter.delete(
    "/:id",
    [
        param("id").isInt({ min: 1 }),
        ValidateRequest
    ],
    fincaController.delete
);

export default fincaRouter;
