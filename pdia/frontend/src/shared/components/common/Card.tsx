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
        'surface-card w-full overflow-visible p-4 md:p-6 lg:p-7 lg:p-8',
        useDefaultBackground ? 'bg-surface-container-lowest' : undefined,
        className,
      )}
      {...props}
    >
      {title || subtitle || actions ? (
        <header className="mb-4 overflow-visible flex items-start justify-between gap-4 border-b border-outline-variant/35 pb-4 md:mb-5">
          <div>
            {title ? <h3 className="text-title-lg text-on-surface">{title}</h3> : null}
            {subtitle ? <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p> : null}
          </div>
          {actions ? <div className="overflow-visible">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </article>
  )
}
