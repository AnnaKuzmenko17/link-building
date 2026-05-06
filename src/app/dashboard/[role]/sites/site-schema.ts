import { z } from 'zod'

export const siteSchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain is required')
    .transform((v) => v.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim())
    .pipe(
      z.string().regex(
        /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i,
        'Enter a valid domain (e.g. example.com)'
      )
    ),
  dr: z.coerce.number().int().min(0).max(100, 'DR must be 0–100'),
  category_id: z.string().uuid('Select a category'),
  top_countries: z.string().min(1, 'Top countries is required'),
  countries: z.array(z.string()).min(1, 'Select at least one country'),
  languages: z.array(z.string()).min(1, 'Select at least one language'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  requirements: z.string().optional(),
  description: z.string().optional(),
  sourcer_notes: z.string().optional(),
  contact_info: z.string().optional(),
  link_type: z.enum(['dofollow', 'nofollow', 'sponsored', 'ugc'] as const),
  keywords_relevance: z.string().optional(),
  organic_keywords_count: z.coerce.number().int().min(0),
  organic_traffic_count: z.coerce.number().int().min(0),
})

export type SiteFormInput = z.input<typeof siteSchema>
export type SiteFormValues = z.output<typeof siteSchema>
