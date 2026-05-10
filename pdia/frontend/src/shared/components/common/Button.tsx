import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/classNames'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger'
type ButtonSize = 'small' | 'medium' | 'large'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-container))] text-on-primary shadow-[0_12px_30px_rgb(21_66_18_/_30%)] hover:-translate-y-0.5 hover:brightness-110',
  secondary:
    'bg-secondary-container text-on-secondary-container shadow-[0_10px_24px_rgb(121_85_72_/_18%)] hover:-translate-y-0.5 hover:brightness-105',
  tertiary:
    'border border-outline-variant/70 bg-surface-container-lowest text-on-surface hover:-translate-y-0.5 hover:bg-surface-container-low',
  danger:
    'bg-error-container text-on-error-container shadow-[0_8px_20px_rgb(186_26_26_/_22%)] hover:-translate-y-0.5 hover:brightness-105',
}

const sizeClasses: Record<ButtonSize, string> = {
  small: 'min-h-9 gap-1.5 rounded-xl px-3 py-1.5 text-xs',
  medium: 'min-h-14 gap-2 rounded-2xl px-5 py-3 text-sm',
  large: 'min-h-16 gap-2 rounded-2xl px-6 py-4 text-base',
}

const iconSizeClasses: Record<ButtonSize, string> = {
  small: 'text-base',
  medium: 'text-xl',
  large: 'text-2xl',
}

export default function Button({
  variant = 'primary',
  size = 'medium',
  leadingIcon,
  trailingIcon,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'font-headline inline-flex items-center justify-center font-bold tracking-[0.01em] transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {leadingIcon ? <span className={cn('material-symbols-outlined', iconSizeClasses[size])}>{leadingIcon}</span> : null}
      <span>{children}</span>
      {trailingIcon ? <span className={cn('material-symbols-outlined', iconSizeClasses[size])}>{trailingIcon}</span> : null}
    </button>
  )
}
