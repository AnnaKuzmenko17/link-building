"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

import { COUNTRIES, LANGUAGES, type Category, type Role } from "@/types";
import { SlidersHorizontalIcon } from "lucide-react";

import type { SiteWithRelations } from "@/lib/data/sites";
import { DataTable } from "@/components/shared";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

import { LINK_OPTIONS, STATUS_OPTIONS } from "./constants";
import { buildSiteColumns } from "./sites-columns";

interface Props {
  sites: SiteWithRelations[];
  categories: Category[];
  viewerRole: Role;
  viewerUserId: string;
}

export function SitesClient({
  sites,
  categories,
  viewerRole,
  viewerUserId,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("");
  const [filterLinkType, setFilterLinkType] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");

  const filtered = sites.filter((site) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !site.domain.toLowerCase().includes(q) &&
        !(site.description ?? "").toLowerCase().includes(q) &&
        !(site.keywords_relevance ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filterCategory && site.category_id !== filterCategory) return false;
    if (filterStatus && site.status !== filterStatus) return false;
    if (filterCountry && !site.countries.includes(filterCountry)) return false;
    if (filterLanguage && !site.languages.includes(filterLanguage))
      return false;
    if (filterLinkType && site.link_type !== filterLinkType) return false;
    if (priceFrom && Number(site.price) < Number(priceFrom)) return false;
    if (priceTo && Number(site.price) > Number(priceTo)) return false;
    return true;
  });

  const columns = useMemo(
    () => buildSiteColumns(viewerRole, viewerUserId),
    [viewerRole, viewerUserId]
  );

  const handleRowClick = useCallback(
    (site: SiteWithRelations) => {
      startTransition(() => {
        router.push(`/dashboard/${viewerRole}/sites/${site.id}`);
      });
    },
    [router, viewerRole, startTransition]
  );

  const categoryItems = categories.map((c) => ({ value: c.id, label: c.name }));
  const countryItems = COUNTRIES.map((c) => ({ value: c, label: c }));
  const languageItems = LANGUAGES.map((l) => ({ value: l, label: l }));

  const hasActiveFilters = !!(
    search ||
    filterCategory ||
    filterStatus ||
    filterCountry ||
    filterLanguage ||
    filterLinkType ||
    priceFrom ||
    priceTo
  );

  function clearFilters() {
    setSearch("");
    setFilterCategory("");
    setFilterStatus("");
    setFilterCountry("");
    setFilterLanguage("");
    setFilterLinkType("");
    setPriceFrom("");
    setPriceTo("");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-controls="sites-filters"
        >
          <SlidersHorizontalIcon className="size-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-primary text-primary-foreground ml-1 flex size-4 items-center justify-center rounded-full text-[10px] font-medium">
              {
                [
                  search,
                  filterCategory,
                  filterStatus,
                  filterCountry,
                  filterLanguage,
                  filterLinkType,
                  priceFrom,
                  priceTo,
                ].filter(Boolean).length
              }
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div
          id="sites-filters"
          className="flex flex-wrap gap-2 rounded-lg border p-4"
        >
          <Input
            placeholder="Search domain, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />

          <Select
            value={filterCategory}
            onValueChange={(v) => setFilterCategory(v ?? "")}
            items={categoryItems}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category">
                {filterCategory
                  ? (categories.find((c) => c.id === filterCategory)?.name ??
                    filterCategory)
                  : "Category"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(viewerRole === "sourcer" || viewerRole === "admin") && (
            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v ?? "")}
              items={STATUS_OPTIONS}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status">
                  {filterStatus
                    ? (STATUS_OPTIONS.find((s) => s.value === filterStatus)
                        ?.label ?? filterStatus)
                    : "Status"}
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
          )}

          <Select
            value={filterCountry}
            onValueChange={(v) => setFilterCountry(v ?? "")}
            items={countryItems}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Country">
                {filterCountry || "Country"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Countries</SelectItem>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterLanguage}
            onValueChange={(v) => setFilterLanguage(v ?? "")}
            items={languageItems}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Language">
                {filterLanguage || "Language"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Languages</SelectItem>
              {LANGUAGES.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterLinkType}
            onValueChange={(v) => setFilterLinkType(v ?? "")}
            items={LINK_OPTIONS}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Link Type">
                {filterLinkType
                  ? (LINK_OPTIONS.find((lt) => lt.value === filterLinkType)
                      ?.label ?? filterLinkType)
                  : "Link Type"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {LINK_OPTIONS.map((lt) => (
                <SelectItem key={lt.value} value={lt.value}>
                  {lt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <div className="relative">
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm">
                $
              </span>
              <Input
                type="number"
                placeholder="From"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                className="w-28 pl-6"
              />
            </div>
            <span className="text-muted-foreground text-sm">–</span>
            <div className="relative">
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm">
                $
              </span>
              <Input
                type="number"
                placeholder="To"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                className="w-28 pl-6"
              />
            </div>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={handleRowClick}
      />
    </div>
  );
}
