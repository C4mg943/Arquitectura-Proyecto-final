import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '../../utils/classNames'

type BadgeVariant = 'safe' | 'warning' | 'danger' | 'neutral'

interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  safe: 'bg-primary-fixed text-on-primary-fixed ring-1 ring-primary/15',
  warning: 'bg-secondary-container text-on-secondary-container ring-1 ring-secondary/25',
  danger: 'bg-error-container text-on-error-container ring-1 ring-error/20',
  neutral: 'bg-surface-container-high text-on-surface-variant ring-1 ring-outline-variant/60',
}

export default function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap text-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-[0_1px_2px_rgb(25_28_26/8%)]',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
