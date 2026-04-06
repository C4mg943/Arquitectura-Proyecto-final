import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../config/api/ApiResponse";
import { AppError } from "../../../middleware/AppError";
import { OperarioService } from "../service/OperarioService";

export class OperarioController {
    private readonly service: OperarioService;

    constructor() {
        this.service = new OperarioService();
    }

    public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const response = await this.service.registerOperario(req.authUser.userId, req.authUser.rol, req.body);
            ApiResponse.created(res, "Operario registrado correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const response = await this.service.listarOperariosConParcelas(req.authUser.userId, req.authUser.rol);
            ApiResponse.ok(res, "Operarios obtenidos correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public assign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const { operarioId, parcelaId } = req.body as { operarioId: number; parcelaId: number; };
            const response = await this.service.asignarAParcela(req.authUser.userId, req.authUser.rol, operarioId, parcelaId);
            ApiResponse.created(res, "Operario asignado correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public unassign = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const operarioId = Number(req.params.operarioId);
            const parcelaId = Number(req.params.parcelaId);
            if (!Number.isInteger(operarioId) || operarioId < 1 || !Number.isInteger(parcelaId) || parcelaId < 1) {
                throw new AppError("Ids inválidos para desasignación", 400);
            }
            await this.service.desasignarDeParcela(req.authUser.userId, req.authUser.rol, operarioId, parcelaId);
            ApiResponse.ok(res, "Operario desasignado correctamente");
        } catch (error) {
            next(error);
        }
    };
}
