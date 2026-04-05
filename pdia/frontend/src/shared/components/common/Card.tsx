import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '../../utils/classNames'

type ArticleProps = Omit<ComponentPropsWithoutRef<'article'>, 'title'>

interface CardProps extends ArticleProps {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}

export default function Card({ title, subtitle, actions, className, children, ...props }: CardProps) {
  return (
    <article
      className={cn('surface-card p-6 md:p-7', className)}
      {...props}
    >
      {title || subtitle || actions ? (
        <header className="mb-5 flex items-start justify-between gap-4">
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
