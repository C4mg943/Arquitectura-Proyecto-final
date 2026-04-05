import { UserRole } from "../User";

export interface RegisterUserDto {
    nombre: string;
    identificacion: string;
    email: string;
    password: string;
    rol?: UserRole;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface PublicUserDto {
    id: number;
    nombre: string;
    identificacion: string;
    email: string;
    rol: UserRole;
}

export interface AuthResponseDto {
    token: string;
    user: PublicUserDto;
}
