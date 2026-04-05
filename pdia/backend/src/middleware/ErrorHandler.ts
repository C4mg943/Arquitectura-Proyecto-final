import { NextFunction, Request, Response } from "express";
import { AppError } from "./AppError";

export function ErrorHandler(error: unknown, req: Request, res: Response, next: NextFunction): Response | void {
    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            details: error.details ?? null
        });
    }

    if (error instanceof Error) {
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            details: error.message
        });
    }

    return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        details: "Error no tipado"
    });
}
