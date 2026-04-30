import { Skeleton } from '@/components/ui/skeleton'
import { MetricsGridSkeleton } from '@/components/shared/metrics-grid'

export default function DashboardLoading() {
  return (
    <>
      <Skeleton className="h-8 w-64" />
      <MetricsGridSkeleton count={3} />
    </>
  )
}
