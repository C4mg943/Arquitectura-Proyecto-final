import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./AppError";

declare global {
    namespace Express {
        interface Request {
            authUser?: {
                userId: number;
                email: string;
                rol: string;
            };
        }
    }
}

interface JwtPayload {
    userId: number;
    email: string;
    rol: string;
}

export function RequireAuth(req: Request, _res: Response, next: NextFunction): void {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
        throw new AppError("Token de autenticación requerido", 401);
    }

    const token = authorization.split(" ")[1];
    const secret = process.env.JWT_SECRET ?? "dev-secret-change";

    try {
        const payload = jwt.verify(token, secret) as JwtPayload;
        req.authUser = {
            userId: payload.userId,
            email: payload.email,
            rol: payload.rol
        };
        next();
    } catch {
        throw new AppError("Token inválido o expirado", 401);
    }
}
