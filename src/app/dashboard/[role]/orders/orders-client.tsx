"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { SlidersHorizontalIcon } from "lucide-react";

import { type OrderWithDetails } from "@/lib/data/orders";
import { type ActiveCopywriter } from "@/lib/data/users";
import { formatPublishMonth } from "@/lib/publish-months";
import { DataTable } from "@/components/shared";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

import { STATUS_OPTIONS } from "./constants";
import { buildManagerOrderColumns } from "./orders-columns";

interface Props {
  orders: OrderWithDetails[];
  copywriters: ActiveCopywriter[];
  clients: { id: string; first_name: string; last_name: string }[];
  role: string;
}

export function ManagerOrdersClient({
  orders,
  copywriters,
  clients,
  role,
}: Props) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterCopywriter, setFilterCopywriter] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const columns = useMemo(
    () => buildManagerOrderColumns(copywriters, role),
    [copywriters, role]
  );

  const publishMonths = useMemo(() => {
    const months = [...new Set(orders.map((o) => o.publish_month))].sort();
    return months.map((m) => ({ value: m, label: formatPublishMonth(m) }));
  }, [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filterStatus && o.status !== filterStatus) return false;
      if (filterClient && o.client_id !== filterClient) return false;
      if (filterCopywriter) {
        if (filterCopywriter === "__unassigned__" && o.copywriter_id !== null)
          return false;
        if (
          filterCopywriter !== "__unassigned__" &&
          o.copywriter_id !== filterCopywriter
        )
          return false;
      }
      if (filterMonth && o.publish_month !== filterMonth) return false;
      return true;
    });
  }, [orders, filterStatus, filterClient, filterCopywriter, filterMonth]);

  const activeCount = [
    filterStatus,
    filterClient,
    filterCopywriter,
    filterMonth,
  ].filter(Boolean).length;

  function clearFilters() {
    setFilterStatus("");
    setFilterClient("");
    setFilterCopywriter("");
    setFilterMonth("");
  }

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
          <Button variant="ghost" size="sm" onClick={clearFilters}>
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

            <Select
              value={filterClient}
              onValueChange={(v) => setFilterClient(v ?? "")}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Clients">
                  {filterClient
                    ? (clients.find((c) => c.id === filterClient)?.first_name ??
                        "") +
                      " " +
                      (clients.find((c) => c.id === filterClient)?.last_name ??
                        "")
                    : "All Clients"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Clients</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterCopywriter}
              onValueChange={(v) => setFilterCopywriter(v ?? "")}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Copywriters">
                  {filterCopywriter === "__unassigned__"
                    ? "Unassigned"
                    : filterCopywriter
                      ? (copywriters.find((cw) => cw.id === filterCopywriter)
                          ?.first_name ?? "") +
                        " " +
                        (copywriters.find((cw) => cw.id === filterCopywriter)
                          ?.last_name ?? "")
                      : "All Copywriters"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Copywriters</SelectItem>
                <SelectItem value="__unassigned__">Unassigned</SelectItem>
                {copywriters.map((cw) => (
                  <SelectItem key={cw.id} value={cw.id}>
                    {cw.first_name} {cw.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterMonth}
              onValueChange={(v) => setFilterMonth(v ?? "")}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Months">
                  {filterMonth
                    ? (publishMonths.find((m) => m.value === filterMonth)
                        ?.label ?? filterMonth)
                    : "All Months"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Months</SelectItem>
                {publishMonths.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
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
