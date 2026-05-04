'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import type { Category } from '@/types'
import { createCategoryAction, editCategoryAction } from './actions'

const schema = z.object({ name: z.string().min(1, 'Name is required').max(100) })
type FormValues = z.infer<typeof schema>

interface Props {
  categories: Category[]
}

export function CategoriesClient({ categories }: Props) {
  const router = useRouter()
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const isOpen = isCreating || !!editTarget

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  function openCreate() {
    reset({ name: '' })
    setEditTarget(null)
    setIsCreating(true)
  }

  function openEdit(category: Category) {
    reset({ name: category.name })
    setIsCreating(false)
    setEditTarget(category)
  }

  function handleClose() {
    setIsCreating(false)
    setEditTarget(null)
  }

  async function onSubmit(values: FormValues) {
    setIsPending(true)
    const result = editTarget
      ? await editCategoryAction(editTarget.id, values)
      : await createCategoryAction(values)
    setIsPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(editTarget ? 'Category updated.' : 'Category created.')
    handleClose()
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>Create Category</Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState message="No categories yet. Create your first category to get started." />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(category.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openEdit(category)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                autoFocus
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'category-name-error' : undefined}
                {...register('name')}
              />
              {errors.name && (
                <p id="category-name-error" role="alert" className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={isPending} onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
