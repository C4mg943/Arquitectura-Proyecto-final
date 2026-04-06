import type { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../config/api/ApiResponse";
import { AuthService } from "../service/AuthService";
import { AppError } from "../../../middleware/AppError";
import { UserRoles } from "../model/User";

export class AuthController {
    private service: AuthService;

    constructor() {
        this.service = new AuthService();
    }

    public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (req.body?.rol === UserRoles.OPERARIO) {
                throw new AppError("El registro de operarios debe hacerse desde el módulo de operarios", 403);
            }
            const response = await this.service.register(req.body);
            ApiResponse.created(res, "Usuario registrado correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const response = await this.service.login(req.body);
            ApiResponse.ok(res, "Inicio de sesión exitoso", response);
        } catch (error) {
            next(error);
        }
    };

    public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }
            const profile = await this.service.getProfile(req.authUser.userId);
            ApiResponse.ok(res, "Perfil obtenido correctamente", profile);
        } catch (error) {
            next(error);
        }
    };

    public forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const response = await this.service.forgotPassword(req.body);
            ApiResponse.ok(res, "Si el correo existe, enviamos un enlace de recuperación", response);
        } catch (error) {
            next(error);
        }
    };

    public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.service.resetPassword(req.body);
            ApiResponse.ok(res, "Contraseña actualizada correctamente");
        } catch (error) {
            next(error);
        }
    };

    public updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }
            const response = await this.service.updateProfile(req.authUser.userId, req.body);
            ApiResponse.ok(res, "Perfil actualizado correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }
            await this.service.updatePassword(req.authUser.userId, req.body);
            ApiResponse.ok(res, "Contraseña actualizada correctamente");
        } catch (error) {
            next(error);
        }
    };
}
