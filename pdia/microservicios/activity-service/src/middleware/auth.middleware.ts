import { Request, Response, NextFunction } from "express";
import { AuthRequest, AuthUser } from "../types/express";
import jwt from "jsonwebtoken";

export { AuthRequest, AuthUser } from "../types/express";

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "No autorizado" });
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "pdia-secret-key-change-in-production") as AuthUser;
    req.user = decoded;
    next();
  } catch { return res.status(401).json({ error: "Token inválido" }); }
};

export const requireRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "No autorizado" });
    if (!roles.includes(req.user.rol)) return res.status(403).json({ error: "Rol no autorizado" });
    next();
  };
};