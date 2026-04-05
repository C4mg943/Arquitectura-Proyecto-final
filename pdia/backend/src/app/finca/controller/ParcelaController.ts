import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../config/api/ApiResponse";
import { AppError } from "../../../middleware/AppError";
import { ParcelaService } from "../service/ParcelaService";

export class ParcelaController {
    private service: ParcelaService;

    constructor() {
        this.service = new ParcelaService();
    }

    public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }
            const response = await this.service.create(req.authUser.userId, req.body);
            ApiResponse.created(res, "Parcela creada correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }
            const response = await this.service.list(req.authUser.userId);
            ApiResponse.ok(res, "Parcelas obtenidas correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public findOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }
            const parcelaId = Number(req.params.id);
            const response = await this.service.findOne(parcelaId, req.authUser.userId);
            ApiResponse.ok(res, "Parcela obtenida correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }
            const parcelaId = Number(req.params.id);
            const response = await this.service.update(parcelaId, req.authUser.userId, req.body);
            ApiResponse.ok(res, "Parcela actualizada correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }
            const parcelaId = Number(req.params.id);
            await this.service.delete(parcelaId, req.authUser.userId);
            ApiResponse.ok(res, "Parcela eliminada correctamente");
        } catch (error) {
            next(error);
        }
    };
}
