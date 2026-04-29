export type Role = 'client' | 'manager' | 'copywriter' | 'sourcer' | 'admin'

export type UserStatus = 'pending' | 'active' | 'disabled'

export type SiteStatus = 'pending' | 'active' | 'archived'

export type OrderStatus =
  | 'new'
  | 'in_progress'
  | 'content_sent'
  | 'needs_changes'
  | 'content_approved'
  | 'published'
  | 'completed'
  | 'canceled'

export type InvoiceStatus = 'draft' | 'sent' | 'paid'

export type ChatCategory = 'support' | 'sales' | 'general'

export type MessageStatus = 'unread' | 'read'

export type User = {
  id: string
  email: string
  role: Role
  status: UserStatus
  first_name: string
  last_name: string
  manager_id: string | null
  created_at: string
}

export type Site = {
  id: string
  url: string
  sourcer_id: string | null
  status: SiteStatus
  created_at: string
  updated_at: string
}

export type Order = {
  id: string
  client_id: string
  site_id: string
  copywriter_id: string | null
  sourcer_id: string | null
  status: OrderStatus
  publish_month: string
  content: string | null
  published_url: string | null
  created_at: string
  updated_at: string
}

export type CartItem = {
  id: string
  client_id: string
  site_id: string
  created_at: string
}

export type ChangeRequest = {
  id: string
  order_id: string
  comment: string
  created_by: string
  created_at: string
}

export type Invoice = {
  id: string
  client_id: string
  status: InvoiceStatus
  billing_period_start: string
  billing_period_end: string
  created_at: string
  updated_at: string
}

export type InvoiceItem = {
  id: string
  invoice_id: string
  order_id: string
  amount: number
}

export type Chat = {
  id: string
  category: ChatCategory
  created_at: string
}

export type ChatParticipant = {
  id: string
  chat_id: string
  user_id: string
}

export type Message = {
  id: string
  chat_id: string
  sender_id: string
  body: string
  status: MessageStatus
  created_at: string
}
