import type { Role } from '@/types'
import { VALID_ROLES } from '@/types'

function isRole(r: unknown): r is Role {
  return VALID_ROLES.includes(r as Role)
}

export function resolveRole(role: unknown): Role | null {
  if (isRole(role)) return role
  return null
}
