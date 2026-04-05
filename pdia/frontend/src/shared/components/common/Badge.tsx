import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '../../utils/classNames'

type BadgeVariant = 'safe' | 'warning' | 'danger' | 'neutral'

interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  safe: 'bg-primary-fixed text-on-primary-fixed',
  warning: 'bg-secondary-container text-on-secondary-container',
  danger: 'bg-error-container text-on-error-container',
  neutral: 'bg-surface-container-high text-on-surface-variant',
}

export default function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
