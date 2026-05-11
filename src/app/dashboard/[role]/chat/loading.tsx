import { TableSkeleton } from "@/components/shared";
import { Skeleton } from "@/components/ui";

export default function ChatLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-16" />
      </div>
      <TableSkeleton columns={3} />
    </div>
  );
}
