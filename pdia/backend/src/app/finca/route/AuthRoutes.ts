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
        body("rol").optional().isIn(["PRODUCTOR", "TECNICO", "ADMINISTRADOR"]),
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

authRouter.post(
    "/forgot-password",
    [
        body("email").isEmail().normalizeEmail(),
        ValidateRequest
    ],
    authController.forgotPassword
);

authRouter.post(
    "/reset-password",
    [
        body("token").isString().trim().notEmpty(),
        body("password").isString().isLength({ min: 6, max: 64 }),
        ValidateRequest
    ],
    authController.resetPassword
);

authRouter.get("/me", RequireAuth, authController.me);

authRouter.put(
    "/me",
    RequireAuth,
    [
        body("nombre").optional().isString().trim().isLength({ min: 3, max: 120 }),
        body("identificacion").optional().isString().trim().isLength({ min: 5, max: 30 }),
        body("email").optional().isEmail().normalizeEmail(),
        ValidateRequest
    ],
    authController.updateProfile
);

authRouter.put(
    "/me/password",
    RequireAuth,
    [
        body("currentPassword").isString().isLength({ min: 6, max: 64 }),
        body("newPassword").isString().isLength({ min: 6, max: 64 }),
        ValidateRequest
    ],
    authController.updatePassword
);

export default authRouter;
