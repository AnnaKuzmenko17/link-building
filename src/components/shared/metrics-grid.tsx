import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { MetricCard } from '@/lib/data/metrics'

const gridCols: Partial<Record<number, string>> = {
  1: '',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
}

interface Props {
  metrics: MetricCard[]
}

export function MetricsGrid({ metrics }: Props) {
  const colClass = gridCols[metrics.length] ?? 'sm:grid-cols-2'

  return (
    <div className={cn('grid gap-4', colClass)}>
      {metrics.map((metric) => (
        <Link key={metric.label} href={metric.href} className="group">
          <Card className="h-full transition-colors group-hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{metric.value}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export function MetricsGridSkeleton({ count }: { count: number }) {
  return (
    <div className={cn('grid gap-4', gridCols[count])}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
