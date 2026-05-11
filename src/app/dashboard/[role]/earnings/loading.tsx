import { TableSkeleton } from "@/components/shared";
import { Skeleton } from "@/components/ui";

export default function EarningsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-24" />
        <TableSkeleton columns={6} />
      </div>
    </div>
  );
}
