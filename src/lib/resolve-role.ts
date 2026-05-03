import type { Role } from '@/types'
import { VALID_ROLES } from '@/types'

function isRole(r: unknown): r is Role {
  return VALID_ROLES.includes(r as Role)
}

export function resolveRole(role: unknown): Role {
  if (isRole(role)) return role
  console.warn('[resolveRole] unknown role value:', role, '— defaulting to client')
  return 'client'
}
