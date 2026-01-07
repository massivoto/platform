import { type ButtonHTMLAttributes } from 'react'
import { type VariantProps } from 'class-variance-authority'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SimpleButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  extraClasses?: string
}

export function SimpleButton({
  children,
  extraClasses,
  type = 'button',
  className,
  variant,
  size,
  ...props
}: SimpleButtonProps) {
  const composedClassName = cn(buttonVariants({ variant, size }), className, extraClasses)

  return (
    <button type={type} className={composedClassName} {...props}>
      {children}
    </button>
  )
}
