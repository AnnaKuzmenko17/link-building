"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { SlidersHorizontalIcon } from "lucide-react";

import type { OrderWithSite } from "@/lib/data/orders";
import { DataTable } from "@/components/shared";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

import { buildOrderColumns } from "./client-orders-columns";
import { STATUS_OPTIONS } from "./constants";

interface Props {
  orders: OrderWithSite[];
  role: string;
}

export function ClientOrdersClient({ orders, role }: Props) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  const columns = useMemo(() => buildOrderColumns(role), [role]);

  const filtered = useMemo(() => {
    if (!filterStatus) return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [orders, filterStatus]);

  const activeCount = filterStatus ? 1 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-controls="orders-filters"
        >
          <SlidersHorizontalIcon className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground ml-1 flex size-4 items-center justify-center rounded-full text-[10px] font-medium">
              {activeCount}
            </span>
          )}
        </Button>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setFilterStatus("")}>
            Clear filters
          </Button>
        )}
      </div>

      {filtersOpen && (
        <div id="orders-filters" className="rounded-lg border p-4">
          <div className="flex flex-wrap gap-3">
            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v ?? "")}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Statuses">
                  {filterStatus
                    ? (STATUS_OPTIONS.find((s) => s.value === filterStatus)
                        ?.label ?? filterStatus)
                    : "All Statuses"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(order) =>
          router.push(`/dashboard/${role}/orders/${order.id}`)
        }
      />
    </div>
  );
}
