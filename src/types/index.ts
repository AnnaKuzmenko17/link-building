import type { Enums, Tables } from './database.types'

// Enums derived from database — single source of truth
export type Role = Enums<'role'>
export type UserStatus = Enums<'user_status'>
export type SiteStatus = Enums<'site_status'>
export type LinkType = Enums<'link_type'>
export type OrderStatus = Enums<'order_status'>
export type InvoiceStatus = Enums<'invoice_status'>
export type ChatCategory = Enums<'chat_category'>
export type ChatStatus = Enums<'chat_status'>

export const VALID_ROLES = ['client', 'manager', 'copywriter', 'sourcer', 'admin'] as const satisfies readonly Role[]

export const COUNTRIES = [
  'Ukraine', 'Germany', 'Poland', 'USA', 'UK',
  'France', 'Spain', 'Italy', 'Netherlands', 'Czech Republic',
] as const
export type Country = typeof COUNTRIES[number]

export const LANGUAGES = ['English', 'German', 'Spanish', 'Portuguese', 'French'] as const
export type Language = typeof LANGUAGES[number]

// Entity types derived from database row types
export type User = Tables<'users'>
export type Site = Tables<'sites'>
export type Category = Tables<'categories'>
export type Order = Tables<'orders'>
export type CartItem = Tables<'cart_items'>
export type ChangeRequest = Tables<'change_requests'>
export type Invoice = Tables<'invoices'>
export type InvoiceItem = Tables<'invoice_items'>
export type Chat = Tables<'chats'>
export type ChatParticipant = Tables<'chat_participants'>
export type Message = Tables<'messages'>
