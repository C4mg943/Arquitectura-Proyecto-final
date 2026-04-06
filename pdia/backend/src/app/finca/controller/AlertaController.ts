import type { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../config/api/ApiResponse";
import { AppError } from "../../../middleware/AppError";
import { AlertaService } from "../service/AlertaService";

export class AlertaController {
    private service: AlertaService;

    constructor() {
        this.service = new AlertaService();
    }

    public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const response = await this.service.create(req.authUser.userId, req.authUser.rol, req.body);
            ApiResponse.created(res, "Alerta creada correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const response = await this.service.list(req.authUser.userId, req.authUser.rol);
            ApiResponse.ok(res, "Alertas obtenidas correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public listByCultivo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const cultivoId = Number(req.params.cultivoId);
            if (!Number.isInteger(cultivoId) || cultivoId < 1) {
                throw new AppError("Id de cultivo inválido", 400);
            }
            const response = await this.service.listByCultivo(cultivoId, req.authUser.userId, req.authUser.rol);
            ApiResponse.ok(res, "Alertas por cultivo obtenidas correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const alertaId = Number(req.params.id);
            if (!Number.isInteger(alertaId) || alertaId < 1) {
                throw new AppError("Id de alerta inválido", 400);
            }
            const response = await this.service.findOne(alertaId, req.authUser.userId, req.authUser.rol);
            ApiResponse.ok(res, "Alerta obtenida correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const alertaId = Number(req.params.id);
            if (!Number.isInteger(alertaId) || alertaId < 1) {
                throw new AppError("Id de alerta inválido", 400);
            }
            await this.service.delete(alertaId, req.authUser.userId, req.authUser.rol);
            ApiResponse.ok(res, "Alerta eliminada correctamente");
        } catch (error) {
            next(error);
        }
    };
}
