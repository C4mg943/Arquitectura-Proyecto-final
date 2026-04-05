import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../config/api/ApiResponse";
import { AuthService } from "../service/AuthService";
import { AppError } from "../../../middleware/AppError";

export class AuthController {
    private service: AuthService;

    constructor() {
        this.service = new AuthService();
    }

    public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
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
}
