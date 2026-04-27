import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
export interface AuthRequest extends Request { user?: { userId: number; email: string; rol: string; }; }
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "No autorizado" });
    req.user = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET || "pdia-secret-key-change-in-production") as any;
    next();
  } catch { return res.status(401).json({ error: "Token inválido" }); }
};