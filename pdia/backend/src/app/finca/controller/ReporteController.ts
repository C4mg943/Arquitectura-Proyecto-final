import type { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../config/api/ApiResponse";
import { AppError } from "../../../middleware/AppError";
import { ReporteService } from "../service/ReporteService";

export class ReporteController {
    private service: ReporteService;

    constructor() {
        this.service = new ReporteService();
    }

    public reporteActividades = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const cultivoId = Number(req.params.cultivoId);
            const response = await this.service.reporteActividades(cultivoId, req.authUser.userId);
            ApiResponse.ok(res, "Reporte de actividades generado correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public reporteActividadesCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const cultivoId = Number(req.params.cultivoId);
            const csv = await this.service.generarCsvActividades(cultivoId, req.authUser.userId);

            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="reporte-actividades-cultivo-${cultivoId}.csv"`);
            res.status(200).send(csv);
        } catch (error) {
            next(error);
        }
    };

    public reporteRiegos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const cultivoId = Number(req.params.cultivoId);
            const response = await this.service.reporteRiegos(cultivoId, req.authUser.userId);
            ApiResponse.ok(res, "Reporte de riegos generado correctamente", response);
        } catch (error) {
            next(error);
        }
    };

    public reporteFertilizaciones = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.authUser) {
                throw new AppError("No autorizado", 401);
            }

            const cultivoId = Number(req.params.cultivoId);
            const response = await this.service.reporteFertilizaciones(cultivoId, req.authUser.userId);
            ApiResponse.ok(res, "Reporte de fertilizaciones generado correctamente", response);
        } catch (error) {
            next(error);
        }
    };
}
