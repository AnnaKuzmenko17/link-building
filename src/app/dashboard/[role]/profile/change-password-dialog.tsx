"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { PasswordInput } from "@/components/shared";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from "@/components/ui";

import { changePasswordAction } from "./actions";
import { changePasswordSchema } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordDialog({ open, onOpenChange }: Props) {
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function onSubmit(values: FormValues) {
    setIsPending(true);
    const result = await changePasswordAction(values);
    setIsPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Password updated.");
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 py-2"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current_password">Current Password</Label>
            <PasswordInput
              id="current_password"
              autoComplete="current-password"
              aria-invalid={!!errors.currentPassword}
              aria-describedby={
                errors.currentPassword ? "current-password-error" : undefined
              }
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p
                id="current-password-error"
                role="alert"
                className="text-destructive text-xs"
              >
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new_password">New Password</Label>
            <PasswordInput
              id="new_password"
              autoComplete="new-password"
              aria-invalid={!!errors.newPassword}
              aria-describedby={
                errors.newPassword ? "new-password-error" : undefined
              }
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p
                id="new-password-error"
                role="alert"
                className="text-destructive text-xs"
              >
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <PasswordInput
              id="confirm_password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "confirm-password-error" : undefined
              }
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p
                id="confirm-password-error"
                role="alert"
                className="text-destructive text-xs"
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Change Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
