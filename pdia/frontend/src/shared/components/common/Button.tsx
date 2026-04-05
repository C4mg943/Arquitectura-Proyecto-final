import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/classNames'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:brightness-110 ambient-shadow',
  secondary: 'bg-secondary-container text-on-secondary-container hover:brightness-105',
  tertiary: 'bg-transparent text-on-surface hover:bg-surface-container-low',
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
        'font-headline inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
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
