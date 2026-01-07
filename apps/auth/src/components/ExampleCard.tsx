import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

// R-FOUNDATION-04: Minimal ExampleCard component
interface ExampleCardProps {
  title: string
  description: string
  icon?: LucideIcon
  className?: string
}

export const ExampleCard = ({
  title,
  description,
  icon: Icon,
  className = '',
}: ExampleCardProps) => {
  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader>
        {Icon && (
          <div className="mb-2">
            <Icon className="w-8 h-8 text-primary" />
          </div>
        )}
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}
