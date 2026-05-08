import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function getInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email?: string | null,
): string {
  const parts = [firstName, lastName].filter(Boolean)
  if (parts.length > 0) return parts.map((p) => p![0]).join('').toUpperCase()
  return email?.[0]?.toUpperCase() ?? '?'
}
