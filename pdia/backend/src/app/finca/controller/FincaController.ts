import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../config/api/ApiResponse";
import { AppError } from "../../../middleware/AppError";
import { FincaService } from "../service/FincaService";

export class FincaController {
    private readonly service: FincaService;

    constructor() {
        this.service = new FincaService();
    }

    public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const response = await this.service.create(req.authUser.userId, req.authUser.rol, req.body);
            ApiResponse.created(res, "Finca creada correctamente", response);
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
            ApiResponse.ok(res, "Fincas obtenidas correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const fincaId = Number(req.params.id);
            const response = await this.service.findOne(fincaId, req.authUser.userId, req.authUser.rol);
            ApiResponse.ok(res, "Finca obtenida correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const fincaId = Number(req.params.id);
            const response = await this.service.update(fincaId, req.authUser.userId, req.authUser.rol, req.body);
            ApiResponse.ok(res, "Finca actualizada correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const fincaId = Number(req.params.id);
            await this.service.delete(fincaId, req.authUser.userId, req.authUser.rol);
            ApiResponse.ok(res, "Finca eliminada correctamente");
        } catch (error) {
            next(error);
        }
    };
}
