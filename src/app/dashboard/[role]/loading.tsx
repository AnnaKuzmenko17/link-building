import { Skeleton } from '@/components/ui/skeleton'
import { MetricsGridSkeleton } from '@/components/shared/metrics-grid'

export default function DashboardLoading() {
  return (
    <>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
      </div>
      <MetricsGridSkeleton count={3} />
    </>
  )
}
