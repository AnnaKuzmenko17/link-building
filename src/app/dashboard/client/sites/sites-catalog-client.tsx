'use client'

import { useState, useMemo, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/shared/data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { buildSiteCatalogColumns } from './sites-catalog-columns'
import type { SiteWithRelations } from '@/lib/data/sites'
import type { Category, LinkType } from '@/types'
import { COUNTRIES, LANGUAGES } from '@/types'

interface Props {
  sites: SiteWithRelations[]
  categories: Category[]
  cartSiteIds: Set<string>
}

const LINK_TYPE_OPTIONS: { value: LinkType; label: string }[] = [
  { value: 'dofollow', label: 'Dofollow' },
  { value: 'nofollow', label: 'Nofollow' },
  { value: 'sponsored', label: 'Sponsored' },
  { value: 'ugc', label: 'UGC' },
]

export function SitesCatalogClient({ sites, categories, cartSiteIds }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterLanguage, setFilterLanguage] = useState('')
  const [filterLinkType, setFilterLinkType] = useState('')
  const [priceFrom, setPriceFrom] = useState('')
  const [priceTo, setPriceTo] = useState('')

  const filtered = sites.filter((site) => {
    if (search) {
      const q = search.toLowerCase()
      if (
        !site.domain.toLowerCase().includes(q) &&
        !(site.description ?? '').toLowerCase().includes(q) &&
        !(site.keywords_relevance ?? '').toLowerCase().includes(q)
      ) {
        return false
      }
    }
    if (filterCategory && site.category_id !== filterCategory) return false
    if (filterCountry && !site.countries.includes(filterCountry)) return false
    if (filterLanguage && !site.languages.includes(filterLanguage)) return false
    if (filterLinkType && site.link_type !== filterLinkType) return false
    if (priceFrom && Number(site.price) < Number(priceFrom)) return false
    if (priceTo && Number(site.price) > Number(priceTo)) return false
    return true
  })

  const columns = useMemo(
    () => buildSiteCatalogColumns(cartSiteIds),
    [cartSiteIds],
  )

  const handleRowClick = useCallback(
    (site: SiteWithRelations) => {
      startTransition(() => {
        router.push(`/dashboard/client/sites/${site.id}`)
      })
    },
    [router, startTransition],
  )

  const hasActiveFilters = !!(search || filterCategory || filterCountry || filterLanguage || filterLinkType || priceFrom || priceTo)

  function clearFilters() {
    setSearch('')
    setFilterCategory('')
    setFilterCountry('')
    setFilterLanguage('')
    setFilterLinkType('')
    setPriceFrom('')
    setPriceTo('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-controls="catalog-filters"
        >
          <SlidersHorizontalIcon className="size-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {[search, filterCategory, filterCountry, filterLanguage, filterLinkType, priceFrom, priceTo].filter(Boolean).length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {filtersOpen && (
        <div id="catalog-filters" className="flex flex-wrap gap-2 rounded-lg border p-4">
          <Input
            placeholder="Search domain, description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />

          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? '')} items={categories.map((c) => ({ value: c.id, label: c.name }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category">
                {filterCategory ? (categories.find((c) => c.id === filterCategory)?.name ?? filterCategory) : 'Category'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCountry} onValueChange={(v) => setFilterCountry(v ?? '')} items={COUNTRIES.map((c) => ({ value: c, label: c }))}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Country">
                {filterCountry || 'Country'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Countries</SelectItem>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterLanguage} onValueChange={(v) => setFilterLanguage(v ?? '')} items={LANGUAGES.map((l) => ({ value: l, label: l }))}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Language">
                {filterLanguage || 'Language'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Languages</SelectItem>
              {LANGUAGES.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterLinkType} onValueChange={(v) => setFilterLinkType(v ?? '')} items={LINK_TYPE_OPTIONS.map((lt) => ({ value: lt.value, label: lt.label }))}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Link Type">
                {filterLinkType ? (LINK_TYPE_OPTIONS.find((lt) => lt.value === filterLinkType)?.label ?? filterLinkType) : 'Link Type'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {LINK_TYPE_OPTIONS.map((lt) => (
                <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
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
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
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

      <DataTable columns={columns} data={filtered} onRowClick={handleRowClick} />
    </div>
  )
}
