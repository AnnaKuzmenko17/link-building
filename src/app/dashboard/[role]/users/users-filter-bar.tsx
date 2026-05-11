"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

import { SearchIcon } from "lucide-react";

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

import { ROLE_OPTIONS, STATUS_OPTIONS } from "./constants";

interface Props {
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function UsersFilterBar({ searchValue, onSearchChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roleValue = searchParams.get("role") ?? "all";
  const statusValue = searchParams.get("status") ?? "all";

  function pushParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const role =
      "role" in updates ? updates.role : searchParams.get("role") || undefined;
    const status =
      "status" in updates
        ? updates.status
        : searchParams.get("status") || undefined;
    const search =
      "search" in updates
        ? updates.search
        : searchParams.get("search") || undefined;
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    onSearchChange(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams({ search: value || undefined });
    }, 300);
  }

  function handleRoleChange(value: string | null) {
    const next = value ?? "all";
    pushParams({ role: next === "all" ? undefined : next });
  }

  function handleStatusChange(value: string | null) {
    const next = value ?? "all";
    pushParams({ status: next === "all" ? undefined : next });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          className="w-64 pl-8"
          placeholder="Search by name or email…"
          value={searchValue}
          onChange={handleSearchChange}
        />
      </div>
      <Select
        value={roleValue}
        onValueChange={handleRoleChange}
        items={ROLE_OPTIONS}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Roles">
            {ROLE_OPTIONS.find((r) => r.value === roleValue)?.label ??
              "All Roles"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ROLE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={statusValue}
        onValueChange={handleStatusChange}
        items={STATUS_OPTIONS}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Statuses">
            {STATUS_OPTIONS.find((s) => s.value === statusValue)?.label ??
              "All Statuses"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
