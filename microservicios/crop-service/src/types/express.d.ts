import { Request } from "express";

export interface AuthUser {
  userId: number;
  email: string;
  rol: "PRODUCTOR" | "OPERARIO" | "TECNICO" | "ADMINISTRADOR";
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export { AuthUser, AuthRequest };