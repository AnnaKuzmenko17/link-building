import { TableSkeleton } from "@/components/shared";
import { Skeleton } from "@/components/ui";

export default function CopywriterOrdersLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
      </div>
      <TableSkeleton columns={4} />
    </div>
  );
}
