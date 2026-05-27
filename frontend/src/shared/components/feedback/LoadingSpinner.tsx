import { cn } from '../../utils/classNames'

type SpinnerSize = 'sm' | 'md' | 'lg'

interface LoadingSpinnerProps {
  size?: SpinnerSize
  className?: string
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

export default function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <span
      aria-label="Cargando"
      className={cn(
        'inline-block animate-spin rounded-full border-primary border-r-transparent',
        sizeClasses[size],
        className,
      )}
      role="status"
    />
  )
}
