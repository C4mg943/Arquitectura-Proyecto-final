import { Response } from "express";

export interface ApiResponseBody<T> {
    success: boolean;
    message: string;
    data?: T;
}

export class ApiResponse {
    public static ok<T>(res: Response, message: string, data?: T): Response {
        const body: ApiResponseBody<T> = { success: true, message, data };
        return res.status(200).json(body);
    }

    public static created<T>(res: Response, message: string, data?: T): Response {
        const body: ApiResponseBody<T> = { success: true, message, data };
        return res.status(201).json(body);
    }
}
