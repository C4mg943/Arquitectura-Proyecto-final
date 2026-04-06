import { NextFunction, Request, Response } from "express";
import { AppError } from "./AppError";

export function RequireRoles(allowedRoles: string[]) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.authUser) {
            throw new AppError("No autorizado", 401);
        }

        if (!allowedRoles.includes(req.authUser.rol)) {
            throw new AppError("No tienes permisos para esta acción", 403);
        }

        next();
    };
}
