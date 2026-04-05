import { Router } from "express";
import { body } from "express-validator";
import { AuthController } from "../controller/AuthController";
import { ValidateRequest } from "../../../middleware/ValidationMiddleware";
import { RequireAuth } from "../../../middleware/AuthMiddleware";

const authRouter = Router();
const authController = new AuthController();

authRouter.post(
    "/register",
    [
        body("nombre").isString().trim().notEmpty().isLength({ min: 3, max: 120 }),
        body("identificacion").isString().trim().notEmpty().isLength({ min: 5, max: 30 }),
        body("email").isEmail().normalizeEmail(),
        body("password").isString().isLength({ min: 6, max: 64 }),
        body("rol").optional().isIn(["PRODUCTOR", "OPERARIO", "TECNICO", "ADMINISTRADOR"]),
        ValidateRequest
    ],
    authController.register
);

authRouter.post(
    "/login",
    [
        body("email").isEmail().normalizeEmail(),
        body("password").isString().isLength({ min: 6, max: 64 }),
        ValidateRequest
    ],
    authController.login
);

authRouter.get("/me", RequireAuth, authController.me);

export default authRouter;
