import type { InputHTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/classNames'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: ReactNode
  helperText?: string
}

export default function Input({ label, icon, helperText, id, className, ...props }: InputProps) {
  return (
    <div className="space-y-2">
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
            'w-full rounded-xl border-0 bg-surface-container-low px-4 py-4 text-sm text-on-surface outline-none ring-0 transition focus:ring-2 focus:ring-primary',
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
