'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ShoppingCartIcon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import type { SiteWithRelations } from '@/lib/data/sites'
import { addToCartAction } from './actions'

interface AddToCartButtonProps {
  site: SiteWithRelations
  inCart: boolean
}

function AddToCartButton({ site, inCart }: AddToCartButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (inCart) return
    const result = await addToCartAction(site.id)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Added to cart.')
    startTransition(() => router.refresh())
  }

  return (
    <Button
      variant={inCart ? 'secondary' : 'outline'}
      size="sm"
      disabled={inCart || isPending}
      onClick={handleClick}
    >
      <ShoppingCartIcon className="size-4" />
      {inCart ? 'In Cart' : 'Add to Cart'}
    </Button>
  )
}

export function buildSiteCatalogColumns(
  cartSiteIds: Set<string>,
): ColumnDef<SiteWithRelations>[] {
  return [
    {
      accessorKey: 'domain',
      header: 'Domain',
      cell: ({ row }) => (
        <span className="font-medium max-w-[200px] truncate block">{row.original.domain}</span>
      ),
    },
    { accessorKey: 'dr', header: 'DR' },
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => row.original.category?.name ?? '—',
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => `$${Number(row.original.price).toFixed(2)}`,
    },
    {
      id: 'countries',
      header: 'Countries',
      cell: ({ row }) => row.original.countries.join(', ') || '—',
    },
    {
      id: 'languages',
      header: 'Languages',
      cell: ({ row }) => row.original.languages.join(', ') || '—',
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <AddToCartButton
          site={row.original}
          inCart={cartSiteIds.has(row.original.id)}
        />
      ),
    },
  ]
}
