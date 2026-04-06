import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../config/api/ApiResponse";
import { AppError } from "../../../middleware/AppError";
import { CultivoService } from "../service/CultivoService";

export class CultivoController {
    private service: CultivoService;

    constructor() {
        this.service = new CultivoService();
    }

    public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }
            const response = await this.service.create(req.authUser.userId, req.authUser.rol, req.body);
            ApiResponse.created(res, "Cultivo creado correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }
            const tipoCultivo = req.query.tipoCultivo ? String(req.query.tipoCultivo) : undefined;
            const response = await this.service.list(req.authUser.userId, req.authUser.rol, tipoCultivo);
            ApiResponse.ok(res, "Cultivos obtenidos correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }
            const cultivoId = Number(req.params.id);
            if (!Number.isInteger(cultivoId) || cultivoId < 1) {
                throw new AppError("Id de cultivo inválido", 400);
            }
            const response = await this.service.findOne(cultivoId, req.authUser.userId, req.authUser.rol);
            ApiResponse.ok(res, "Cultivo obtenido correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }
            const cultivoId = Number(req.params.id);
            if (!Number.isInteger(cultivoId) || cultivoId < 1) {
                throw new AppError("Id de cultivo inválido", 400);
            }
            const response = await this.service.update(cultivoId, req.authUser.userId, req.authUser.rol, req.body);
            ApiResponse.ok(res, "Cultivo actualizado correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }
            const cultivoId = Number(req.params.id);
            if (!Number.isInteger(cultivoId) || cultivoId < 1) {
                throw new AppError("Id de cultivo inválido", 400);
            }
            await this.service.delete(cultivoId, req.authUser.userId, req.authUser.rol);
            ApiResponse.ok(res, "Cultivo eliminado correctamente");
        } catch (error) {
            next(error);
        }
    };
}
