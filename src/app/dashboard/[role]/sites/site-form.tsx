'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver, SubmitHandler } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { COUNTRIES, LANGUAGES } from '@/types'
import type { Category, LinkType } from '@/types'
import type { SiteWithRelations } from '@/lib/data/sites'
import { createSiteAction, editSiteAction } from './actions'
import { siteSchema, type SiteFormInput, type SiteFormValues } from './site-schema'
import { cn } from '@/lib/utils'

const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: 'dofollow', label: 'Dofollow' },
  { value: 'nofollow', label: 'Nofollow' },
  { value: 'sponsored', label: 'Sponsored' },
  { value: 'ugc', label: 'UGC' },
]

interface Props {
  categories: Category[]
  site?: SiteWithRelations
  backHref: string
  isSourcer?: boolean
  isAdmin?: boolean
}

export function SiteForm({ categories, site, backHref, isSourcer = false, isAdmin = false }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const isEdit = !!site

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<SiteFormInput, unknown, SiteFormValues>({
    resolver: zodResolver(siteSchema) as Resolver<SiteFormInput, unknown, SiteFormValues>,
    defaultValues: site
      ? {
          domain: site.domain,
          dr: site.dr,
          category_id: site.category_id ?? '',
          top_countries: site.top_countries,
          countries: site.countries,
          languages: site.languages,
          price: Number(site.price),
          requirements: site.requirements ?? '',
          description: site.description ?? '',
          sourcer_notes: site.sourcer_notes ?? '',
          contact_info: site.contact_info ?? '',
          link_type: site.link_type,
          keywords_relevance: site.keywords_relevance ?? '',
          organic_keywords_count: site.organic_keywords_count,
          organic_traffic_count: site.organic_traffic_count,
        }
      : {
          domain: '',
          dr: 0,
          category_id: '',
          top_countries: '',
          countries: [],
          languages: [],
          price: 0,
          requirements: '',
          description: '',
          sourcer_notes: '',
          contact_info: '',
          link_type: 'dofollow',
          keywords_relevance: '',
          organic_keywords_count: 0,
          organic_traffic_count: 0,
        },
  })

  const selectedCountries = watch('countries')
  const selectedLanguages = watch('languages')

  function toggleMulti(field: 'countries' | 'languages', value: string) {
    const current = field === 'countries' ? selectedCountries : selectedLanguages
    if (current.includes(value)) {
      setValue(field, current.filter((v) => v !== value), { shouldValidate: true })
    } else {
      setValue(field, [...current, value], { shouldValidate: true })
    }
  }

  function handleCancel() {
    router.push(backHref)
  }

  const onSubmit: SubmitHandler<SiteFormValues> = async (values) => {
    setIsPending(true)
    const result = isEdit
      ? await editSiteAction(site.id, values)
      : await createSiteAction(values)
    setIsPending(false)

    if (!result.success) {
      if (result.error === 'A site with this domain already exists.') {
        setError('domain', { message: result.error })
      } else {
        toast.error(result.error)
      }
      return
    }

    toast.success(isEdit ? 'Site updated.' : 'Site added.')
    router.push(backHref)
  }

  const categoryItems = categories.map((c) => ({ value: c.id, label: c.name }))
  const linkTypeItems = LINK_TYPES.map((lt) => ({ value: lt.value, label: lt.label }))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {isEdit && isSourcer && (
        <p className="text-sm text-muted-foreground rounded-md border border-border bg-muted/50 px-3 py-2">
          Saving will reset this site to <strong>Pending</strong> for re-approval.
        </p>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Domain */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                type="text"
                placeholder="example.com"
                aria-invalid={!!errors.domain}
                aria-describedby={errors.domain ? 'domain-error' : undefined}
                {...register('domain')}
              />
              {errors.domain && (
                <p id="domain-error" role="alert" className="text-xs text-destructive">{errors.domain.message}</p>
              )}
            </div>

            {/* DR */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dr">Domain Rating (DR)</Label>
              <Input
                id="dr"
                type="number"
                min={0}
                max={100}
                aria-invalid={!!errors.dr}
                aria-describedby={errors.dr ? 'dr-error' : undefined}
                {...register('dr')}
              />
              {errors.dr && (
                <p id="dr-error" role="alert" className="text-xs text-destructive">{errors.dr.message}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                aria-invalid={!!errors.price}
                aria-describedby={errors.price ? 'price-error' : undefined}
                {...register('price')}
              />
              {errors.price && (
                <p id="price-error" role="alert" className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category_id">Category</Label>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={categoryItems}
                  >
                    <SelectTrigger
                      id="category_id"
                      className="w-full"
                      aria-invalid={!!errors.category_id}
                      aria-describedby={errors.category_id ? 'category-error' : undefined}
                    >
                      <SelectValue placeholder="Select a category…" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          No categories yet.{' '}
                          {isAdmin ? (
                            <Link
                              href="/dashboard/admin/categories"
                              className="underline underline-offset-4 hover:text-foreground"
                            >
                              Add one
                            </Link>
                          ) : (
                            'Ask an admin to add categories.'
                          )}
                        </div>
                      ) : (
                        categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category_id && (
                <p id="category-error" role="alert" className="text-xs text-destructive">{errors.category_id.message}</p>
              )}
            </div>

            {/* Link Type */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="link_type">Link Type</Label>
              <Controller
                name="link_type"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    items={linkTypeItems}
                  >
                    <SelectTrigger id="link_type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LINK_TYPES.map((lt) => (
                        <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Top Countries */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="top_countries">Top Countries</Label>
              <Input
                id="top_countries"
                placeholder="e.g. USA, Germany"
                aria-invalid={!!errors.top_countries}
                aria-describedby={errors.top_countries ? 'top-countries-error' : undefined}
                {...register('top_countries')}
              />
              {errors.top_countries && (
                <p id="top-countries-error" role="alert" className="text-xs text-destructive">{errors.top_countries.message}</p>
              )}
            </div>

            {/* Countries multi-select */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium leading-none">Countries</span>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Countries"
                aria-describedby={errors.countries ? 'countries-error' : undefined}
              >
                {COUNTRIES.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => toggleMulti('countries', country)}
                    aria-pressed={selectedCountries.includes(country)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                      selectedCountries.includes(country)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-transparent text-foreground hover:bg-accent',
                    )}
                  >
                    {country}
                  </button>
                ))}
              </div>
              {errors.countries && (
                <p id="countries-error" role="alert" className="text-xs text-destructive">{errors.countries.message}</p>
              )}
            </div>

            {/* Languages multi-select */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium leading-none">Languages</span>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Languages"
                aria-describedby={errors.languages ? 'languages-error' : undefined}
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleMulti('languages', lang)}
                    aria-pressed={selectedLanguages.includes(lang)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                      selectedLanguages.includes(lang)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-transparent text-foreground hover:bg-accent',
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              {errors.languages && (
                <p id="languages-error" role="alert" className="text-xs text-destructive">{errors.languages.message}</p>
              )}
            </div>

            {/* Organic Keywords Count */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="organic_keywords_count">Organic Keywords Count</Label>
              <Input
                id="organic_keywords_count"
                type="number"
                min={0}
                aria-invalid={!!errors.organic_keywords_count}
                {...register('organic_keywords_count')}
              />
            </div>

            {/* Organic Traffic Count */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="organic_traffic_count">Organic Traffic Count</Label>
              <Input
                id="organic_traffic_count"
                type="number"
                min={0}
                aria-invalid={!!errors.organic_traffic_count}
                {...register('organic_traffic_count')}
              />
            </div>

            {/* Keywords Relevance */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="keywords_relevance">Keywords Relevance</Label>
              <Input
                id="keywords_relevance"
                placeholder="e.g. finance, investment, crypto"
                {...register('keywords_relevance')}
              />
            </div>

            {/* Requirements */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                rows={3}
                placeholder="Site content requirements…"
                {...register('requirements')}
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                {...register('description')}
              />
            </div>

            {/* Sourcer Notes */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="sourcer_notes">Sourcer Notes</Label>
              <Textarea
                id="sourcer_notes"
                rows={3}
                {...register('sourcer_notes')}
              />
            </div>

            {/* Contact Info */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="contact_info">Contact Info</Label>
              <Textarea
                id="contact_info"
                rows={2}
                placeholder="Site communication info…"
                {...register('contact_info')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Site'}
        </Button>
      </div>
    </form>
  )
}
