import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeleton } from '@/components/shared/table-skeleton'

export default function CategoriesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-9 w-36" />
      </div>
      <TableSkeleton columns={3} />
    </div>
  )
}
