import type { Role } from '@/types'
import { VALID_ROLES } from '@/types'

export function resolveRole(role: unknown): Role {
  return VALID_ROLES.includes(role as Role) ? (role as Role) : 'client'
}
