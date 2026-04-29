create type public.role as enum ('client', 'manager', 'copywriter', 'sourcer', 'admin');
create type public.user_status as enum ('pending', 'active', 'disabled');
create type public.site_status as enum ('pending', 'active', 'archived');
create type public.order_status as enum (
  'new', 'in_progress', 'content_sent', 'needs_changes',
  'content_approved', 'published', 'completed', 'canceled'
);
create type public.invoice_status as enum ('draft', 'sent', 'paid');
create type public.chat_category as enum ('support', 'sales', 'general');
create type public.message_status as enum ('unread', 'read');
