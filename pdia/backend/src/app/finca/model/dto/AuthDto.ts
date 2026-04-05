import type { UserRole } from "../User";

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

export interface ForgotPasswordDto {
    email: string;
}

export interface ForgotPasswordResponseDto {
    requestAccepted: boolean;
    resetUrl?: string;
}

export interface ResetPasswordDto {
    token: string;
    password: string;
}

export interface UpdateProfileDto {
    nombre?: string;
    identificacion?: string;
    email?: string;
}

export interface UpdatePasswordDto {
    currentPassword: string;
    newPassword: string;
}
