import { Router } from "express";
import { body, param } from "express-validator";
import { OperarioController } from "../controller/OperarioController";
import { RequireAuth } from "../../../middleware/AuthMiddleware";
import { ValidateRequest } from "../../../middleware/ValidationMiddleware";
import { RequireRoles } from "../../../middleware/RoleMiddleware";

const operarioRouter = Router();
const operarioController = new OperarioController();

operarioRouter.use(RequireAuth, RequireRoles(["PRODUCTOR"]));

operarioRouter.get("/", operarioController.list);

operarioRouter.post(
    "/",
    [
        body("nombre").isString().trim().notEmpty().isLength({ min: 3, max: 120 }),
        body("identificacion").isString().trim().notEmpty().isLength({ min: 5, max: 30 }),
        body("email").isEmail().normalizeEmail(),
        body("password").isString().isLength({ min: 6, max: 64 }),
        ValidateRequest
    ],
    operarioController.register
);

operarioRouter.post(
    "/asignaciones",
    [
        body("operarioId").isInt({ min: 1 }),
        body("parcelaId").isInt({ min: 1 }),
        ValidateRequest
    ],
    operarioController.assign
);

operarioRouter.delete(
    "/asignaciones/:operarioId/:parcelaId",
    [
        param("operarioId").isInt({ min: 1 }),
        param("parcelaId").isInt({ min: 1 }),
        ValidateRequest
    ],
    operarioController.unassign
);

export default operarioRouter;
