import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppError } from "./AppError";

export function ValidateRequest(req: Request, _res: Response, next: NextFunction): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new AppError("Validación fallida", 400, errors.array());
    }
    next();
}
