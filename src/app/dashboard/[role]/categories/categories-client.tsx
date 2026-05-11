"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import type { Category } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { formatDate } from "@/lib/format-date";
import { EmptyState } from "@/components/shared";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";

import { createCategoryAction, editCategoryAction } from "./actions";
import { categorySchema } from "./types";

type FormValues = z.infer<typeof categorySchema>;

interface Props {
  categories: Category[];
}

export function CategoriesClient({ categories }: Props) {
  const router = useRouter();
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const isOpen = isCreating || !!editTarget;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(categorySchema) });

  function openCreate() {
    reset({ name: "" });
    setEditTarget(null);
    setIsCreating(true);
  }

  function openEdit(category: Category) {
    reset({ name: category.name });
    setIsCreating(false);
    setEditTarget(category);
  }

  function handleClose() {
    setIsCreating(false);
    setEditTarget(null);
  }

  async function onSubmit(values: FormValues) {
    setIsPending(true);
    const result = editTarget
      ? await editCategoryAction(editTarget.id, values)
      : await createCategoryAction(values);
    setIsPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(editTarget ? "Category updated." : "Category created.");
    handleClose();
    router.refresh();
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
                    {formatDate(category.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(category)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Category" : "Create Category"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                autoFocus
                aria-invalid={!!errors.name}
                aria-describedby={
                  errors.name ? "category-name-error" : undefined
                }
                {...register("name")}
              />
              {errors.name && (
                <p
                  id="category-name-error"
                  role="alert"
                  className="text-destructive text-xs"
                >
                  {errors.name.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
