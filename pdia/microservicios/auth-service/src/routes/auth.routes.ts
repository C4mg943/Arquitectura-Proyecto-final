import { Router, Response } from "express";
import { body, validationResult } from "express-validator";
import { AuthService, RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from "../services/auth.service.js";
import { authMiddleware, AuthRequest, requireRoles } from "../middleware/auth.middleware.js";
import { auditLog } from "../config/audit.js";

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
      await auditLog({ userId: result.user.id, action: "REGISTER", entity: "users", entityId: result.user.id, details: { email: result.user.email, rol: result.user.rol }, ipAddress: req.ip });
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
      await auditLog({ userId: result.user.id, action: "LOGIN", entity: "users", entityId: result.user.id, details: { email: result.user.email }, ipAddress: req.ip });
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

router.put(
  "/password",
  authMiddleware,
  [
    body("currentPassword").notEmpty().withMessage("La contraseña actual es requerida"),
    body("newPassword").isLength({ min: 6 }).withMessage("La nueva contraseña debe tener al menos 6 caracteres"),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      await authService.changePassword(req.user!.userId, req.body as ChangePasswordDto);
      res.json({ message: "Contraseña actualizada correctamente" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get(
  "/roles",
  authMiddleware,
  requireRoles("ADMINISTRADOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const roles = await authService.getAllRoles();
      res.json(roles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get(
  "/users",
  authMiddleware,
  requireRoles("ADMINISTRADOR", "PRODUCTOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { rol } = req.query;
      let users;
      if (rol) {
        users = await authService.getUsersByRol(rol as string);
      } else {
        users = await authService.getAllUsers();
      }
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get(
  "/users/:id",
  authMiddleware,
  requireRoles("ADMINISTRADOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await authService.getProfile(userId);
      res.json(user);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
);

router.post(
  "/users",
  authMiddleware,
  requireRoles("ADMINISTRADOR"),
  [
    body("nombre").notEmpty().withMessage("El nombre es requerido"),
    body("identificacion").notEmpty().withMessage("La identificación es requerida"),
    body("email").isEmail().withMessage("Email inválido"),
    body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
    body("rol").optional().isIn(["PRODUCTOR", "OPERARIO", "TECNICO", "ADMINISTRADOR"]),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await authService.createUser(req.body as RegisterDto);
      await auditLog({ userId: (req as AuthRequest).user?.userId ?? null, action: "CREATE_USER", entity: "users", entityId: result.user.id, details: { email: result.user.email, rol: result.user.rol }, ipAddress: req.ip });
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.put(
  "/users/:id",
  authMiddleware,
  requireRoles("ADMINISTRADOR"),
  [
    body("nombre").optional(),
    body("identificacion").optional(),
    body("email").optional().isEmail(),
    body("rol").optional().isIn(["PRODUCTOR", "OPERARIO", "TECNICO", "ADMINISTRADOR"]),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = parseInt(req.params.id);
      const result = await authService.updateUser(userId, req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.delete(
  "/users/:id",
  authMiddleware,
  requireRoles("ADMINISTRADOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      await authService.deleteUser(userId);
      await auditLog({ userId: (req as AuthRequest).user?.userId ?? null, action: "DELETE_USER", entity: "users", entityId: userId, ipAddress: req.ip });
      res.json({ message: "Usuario eliminado correctamente" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  "/seed",  async (req: AuthRequest, res: Response) => {
    try {
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.default.hashSync("admin123", 10);
      
      const { AuthRepository } = await import("../repositories/auth.repository.js");
      const repository = new AuthRepository();
      
      const existingAdmin = await repository.findByEmail("admin@pdia.com");
      if (existingAdmin) {
        return res.json({ message: "Usuario admin ya existe", email: "admin@pdia.com", password: "admin123" });
      }
      
      await repository.create({
        nombre: "Administrador",
        identificacion: "1234567890",
        email: "admin@pdia.com",
        passwordHash,
        rol: "ADMINISTRADOR",
      });
      
      res.json({ message: "Usuario admin creado", email: "admin@pdia.com", password: "admin123" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  "/tecnicos/asignar",
  authMiddleware,
  requireRoles("PRODUCTOR", "ADMINISTRADOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { tecnicoId, productorId } = req.body;
      const asignadoPorId = req.user!.userId;
      await authService.asignarTecnico(tecnicoId, productorId, asignadoPorId);
      res.json({ message: "Técnico asignado correctamente" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  "/tecnicos/desasignar",
  authMiddleware,
  requireRoles("PRODUCTOR", "ADMINISTRADOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { tecnicoId, productorId } = req.body;
      await authService.desasignarTecnico(tecnicoId, productorId);
      res.json({ message: "Técnico desasignado correctamente" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get(
  "/tecnicos/asignados",
  authMiddleware,
  requireRoles("PRODUCTOR", "ADMINISTRADOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      // Admin puede ver los técnicos de cualquier productor pasando ?productorId=X
      const productorId = req.user!.rol === "ADMINISTRADOR" && req.query.productorId
        ? parseInt(req.query.productorId as string)
        : req.user!.userId;
      const tecnicos = await authService.listTecnicosAsignados(productorId);
      res.json(tecnicos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get(
  "/tecnicos/mis-productores",
  authMiddleware,
  requireRoles("TECNICO"),
  async (req: AuthRequest, res: Response) => {
    try {
      const productores = await authService.listProductoresAsignados(req.user!.userId);
      res.json(productores);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get(
  "/tecnicos/fincas",
  authMiddleware,
  requireRoles("TECNICO"),
  async (req: AuthRequest, res: Response) => {
    try {
      const fincas = await authService.getFincasByTecnico(req.user!.userId);
      res.json(fincas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ── RF49: Logs de auditoría (solo ADMINISTRADOR) ──────────────────────────
router.get(
  "/audit-logs",
  authMiddleware,
  requireRoles("ADMINISTRADOR"),
  async (req: AuthRequest, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string || "100"), 500);
      const offset = parseInt(req.query.offset as string || "0");
      const action = req.query.action as string | undefined;

      let query = `
        SELECT al.id, al.action, al.entity, al.entity_id, al.details,
               al.ip_address, al.created_at,
               u.nombre AS user_nombre, u.email AS user_email, u.rol AS user_rol
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
      `;
      const params: any[] = [];
      if (action) {
        query += ` WHERE al.action = $${params.length + 1}`;
        params.push(action);
      }
      query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const { pool } = await import("../config/db.js");
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export { router as authRouter };