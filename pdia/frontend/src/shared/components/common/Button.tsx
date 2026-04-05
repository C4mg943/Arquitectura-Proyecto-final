import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/classNames'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
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
}

export default function Button({
  variant = 'primary',
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
        'font-headline inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold tracking-[0.01em] transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {leadingIcon ? <span className="material-symbols-outlined text-xl">{leadingIcon}</span> : null}
      <span>{children}</span>
      {trailingIcon ? <span className="material-symbols-outlined text-xl">{trailingIcon}</span> : null}
    </button>
  )
}
