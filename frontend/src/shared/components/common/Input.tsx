import type { InputHTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/classNames'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: ReactNode
  helperText?: string
}

export default function Input({ label, icon, helperText, id, className, ...props }: InputProps) {
  return (
    <div className="space-y-2.5">
      <label className="text-label-md block text-on-surface-variant" htmlFor={id}>
        {label}
      </label>

      <div className="relative">
        {icon ? (
          <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          className={cn(
            'w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface shadow-[0_1px_2px_rgb(25_28_26_/_4%)] outline-none ring-0 transition-all duration-200 placeholder:text-outline focus:-translate-y-0.5 focus:border-primary/60 focus:shadow-[0_12px_24px_rgb(21_66_18_/_12%)] focus:ring-2 focus:ring-primary/30',
            icon ? 'pl-11' : '',
            className,
          )}
          {...props}
        />
      </div>

      {helperText ? <p className="text-xs text-on-surface-variant">{helperText}</p> : null}
    </div>
  )
}
