import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  identificacion: z.string().min(5, 'La identificación debe tener al menos 5 caracteres'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export type RegisterInput = z.infer<typeof registerSchema>

export const parcelaSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  municipio: z.string().min(2, 'El municipio debe tener al menos 2 caracteres'),
  hectareas: z.number().positive('Las hectáreas deben ser mayores a 0'),
  latitud: z.number().min(-90, 'Latitud mínima -90').max(90, 'Latitud máxima 90'),
  longitud: z.number().min(-180, 'Longitud mínima -180').max(180, 'Longitud máxima 180'),
})

export type ParcelaInput = z.infer<typeof parcelaSchema>

export const cultivoSchema = z.object({
  tipoCultivo: z.string().min(2, 'El tipo de cultivo debe tener al menos 2 caracteres'),
  fechaSiembra: z.string().min(1, 'La fecha de siembra es obligatoria'),
  estado: z.enum(['EN_CRECIMIENTO', 'COSECHADO', 'AFECTADO']),
  observaciones: z.string().max(1500, 'Máximo 1500 caracteres').optional(),
  parcelaId: z.number().int().positive('Debes seleccionar una parcela'),
})

export type CultivoInput = z.infer<typeof cultivoSchema>

export const actividadSchema = z.object({
  tipo: z.enum(['RIEGO', 'FERTILIZACION', 'PLAGA', 'OBSERVACION']),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  descripcion: z.string().min(3, 'La descripción debe tener al menos 3 caracteres'),
  cultivoId: z.number().int().positive('Debes seleccionar un cultivo'),
  datos: z.record(z.string(), z.unknown()).optional(),
})

export type ActividadInput = z.infer<typeof actividadSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('Correo inválido'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const updateProfileSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  identificacion: z.string().min(5, 'La identificación debe tener al menos 5 caracteres'),
  email: z.string().email('Correo inválido'),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Mínimo 6 caracteres'),
    newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmNewPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmNewPassword'],
  })

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
