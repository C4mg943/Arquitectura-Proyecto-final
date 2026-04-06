import type { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../config/api/ApiResponse";
import { AppError } from "../../../middleware/AppError";
import { ActividadService } from "../service/ActividadService";

export class ActividadController {
    private service: ActividadService;

    constructor() {
        this.service = new ActividadService();
    }

    public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const response = await this.service.create(req.authUser.userId, req.authUser.rol, req.body);
            ApiResponse.created(res, "Actividad creada correctamente", response);
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
            ApiResponse.ok(res, "Actividades obtenidas correctamente", response);
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
            ApiResponse.ok(res, "Actividades por cultivo obtenidas correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const actividadId = Number(req.params.id);
            if (!Number.isInteger(actividadId) || actividadId < 1) {
                throw new AppError("Id de actividad inválido", 400);
            }
            const response = await this.service.findOne(actividadId, req.authUser.userId, req.authUser.rol);
            ApiResponse.ok(res, "Actividad obtenida correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const actividadId = Number(req.params.id);
            if (!Number.isInteger(actividadId) || actividadId < 1) {
                throw new AppError("Id de actividad inválido", 400);
            }
            const response = await this.service.update(actividadId, req.authUser.userId, req.authUser.rol, req.body);
            ApiResponse.ok(res, "Actividad actualizada correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const actividadId = Number(req.params.id);
            if (!Number.isInteger(actividadId) || actividadId < 1) {
                throw new AppError("Id de actividad inválido", 400);
            }
            await this.service.delete(actividadId, req.authUser.userId, req.authUser.rol);
            ApiResponse.ok(res, "Actividad eliminada correctamente");
        } catch (error) {
            next(error);
        }
    };
}
