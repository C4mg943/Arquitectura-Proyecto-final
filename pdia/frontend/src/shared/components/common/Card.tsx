import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '../../utils/classNames'

type ArticleProps = Omit<ComponentPropsWithoutRef<'article'>, 'title'>

interface CardProps extends ArticleProps {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}

function hasCustomBackgroundClass(className?: string): boolean {
  return Boolean(className && /\bbg-/.test(className))
}

export default function Card({ title, subtitle, actions, className, children, ...props }: CardProps) {
  const useDefaultBackground = !hasCustomBackgroundClass(className)

  return (
    <article
      className={cn(
        'surface-card overflow-hidden p-6 md:p-7',
        useDefaultBackground ? 'bg-surface-container-lowest' : undefined,
        className,
      )}
      {...props}
    >
      {title || subtitle || actions ? (
        <header className="mb-5 flex items-start justify-between gap-4 border-b border-outline-variant/35 pb-4">
          <div>
            {title ? <h3 className="text-title-lg text-on-surface">{title}</h3> : null}
            {subtitle ? <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p> : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </article>
  )
}
