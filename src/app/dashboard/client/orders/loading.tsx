import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeleton } from '@/components/shared/table-skeleton'

export default function ClientOrdersLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-24" />
        <TableSkeleton columns={5} />
      </div>
    </div>
  )
}
