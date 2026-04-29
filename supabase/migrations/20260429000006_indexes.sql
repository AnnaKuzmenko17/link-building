-- Indexes for columns used in RLS policies and common query filters.
-- Foreign key columns are not automatically indexed in Postgres.

create index idx_orders_client_id          on public.orders(client_id);
create index idx_orders_copywriter_id      on public.orders(copywriter_id);
create index idx_orders_sourcer_id         on public.orders(sourcer_id);
create index idx_orders_status             on public.orders(status);
create index idx_cart_items_client_id      on public.cart_items(client_id);
create index idx_messages_chat_id          on public.messages(chat_id);
create index idx_chat_participants_user_id on public.chat_participants(user_id);
create index idx_chat_participants_chat_id on public.chat_participants(chat_id);
create index idx_sites_sourcer_id          on public.sites(sourcer_id);
create index idx_invoices_client_id        on public.invoices(client_id);
create index idx_change_requests_order_id  on public.change_requests(order_id);
create index idx_invoice_items_invoice_id  on public.invoice_items(invoice_id);
