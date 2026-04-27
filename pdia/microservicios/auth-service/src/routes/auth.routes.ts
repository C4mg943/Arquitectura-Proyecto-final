import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { AuthService, RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from "../services/auth.service.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";

const router = Router();
const authService = new AuthService();

router.post(
  "/register",
  [
    body("nombre").notEmpty().withMessage("El nombre es requerido"),
    body("identificacion").notEmpty().withMessage("La identificación es requerida"),
    body("email").isEmail().withMessage("Email inválido"),
    body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
  ],
  async (req: any, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await authService.register(req.body as RegisterDto);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email inválido"),
    body("password").notEmpty().withMessage("La contraseña es requerida"),
  ],
  async (req: any, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await authService.login(req.body as LoginDto);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }
);

router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await authService.getProfile(req.user!.userId);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Email inválido")],
  async (req: any, res: Response) => {
    try {
      const result = await authService.forgotPassword(req.body as ForgotPasswordDto);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("El token es requerido"),
    body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
  ],
  async (req: any, res: Response) => {
    try {
      await authService.resetPassword(req.body as ResetPasswordDto);
      res.json({ message: "Contraseña actualizada correctamente" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.put(
  "/profile",
  authMiddleware,
  [
    body("nombre").optional(),
    body("email").optional().isEmail(),
    body("identificacion").optional(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await authService.updateProfile(req.user!.userId, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export { router as authRouter };