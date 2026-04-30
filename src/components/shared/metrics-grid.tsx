import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { MetricCard } from '@/lib/queries/dashboard-metrics'

const gridCols: Record<2 | 3, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
}

interface Props {
  metrics: MetricCard[]
}

export function MetricsGrid({ metrics }: Props) {
  const cols = (metrics.length === 3 ? 3 : 2) as 2 | 3

  return (
    <div className={`grid gap-4 ${gridCols[cols]}`}>
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{metric.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function MetricsGridSkeleton({ count }: { count: 2 | 3 }) {
  return (
    <div className={`grid gap-4 ${gridCols[count]}`}>
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
