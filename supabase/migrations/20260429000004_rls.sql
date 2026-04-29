-- enable RLS on all tables
alter table public.users             enable row level security;
alter table public.sites             enable row level security;
alter table public.cart_items        enable row level security;
alter table public.orders            enable row level security;
alter table public.change_requests   enable row level security;
alter table public.invoices          enable row level security;
alter table public.invoice_items     enable row level security;
alter table public.chats             enable row level security;
alter table public.chat_participants enable row level security;
alter table public.messages          enable row level security;

-- helper: get current user's role without RLS recursion
create or replace function public.current_user_role()
returns public.role language sql stable security definer as $$
  select role from public.users where id = auth.uid()
$$;

-- ==================== users ====================
create policy "admin_all_users" on public.users
  for all using (public.current_user_role() = 'admin');

create policy "manager_read_users" on public.users
  for select using (public.current_user_role() = 'manager');

create policy "manager_update_users" on public.users
  for update using (
    public.current_user_role() = 'manager'
    and role in ('client', 'copywriter', 'sourcer')
  );

create policy "self_read_users" on public.users
  for select using (
    public.current_user_role() in ('sourcer', 'copywriter', 'client')
    and id = auth.uid()
  );

-- ==================== sites ====================
create policy "admin_all_sites" on public.sites
  for all using (public.current_user_role() = 'admin');

create policy "manager_read_sites" on public.sites
  for select using (public.current_user_role() = 'manager');

create policy "sourcer_read_sites" on public.sites
  for select using (
    public.current_user_role() = 'sourcer'
    and sourcer_id = auth.uid()
    and status != 'archived'
  );

create policy "sourcer_insert_sites" on public.sites
  for insert with check (public.current_user_role() = 'sourcer');

create policy "sourcer_update_sites" on public.sites
  for update using (
    public.current_user_role() = 'sourcer'
    and sourcer_id = auth.uid()
    and status != 'archived'
  );

-- ==================== cart_items ====================
create policy "client_own_cart" on public.cart_items
  for all using (
    public.current_user_role() = 'client'
    and client_id = auth.uid()
  );

-- ==================== orders ====================
create policy "admin_manager_all_orders" on public.orders
  for all using (public.current_user_role() in ('admin', 'manager'));

create policy "client_read_own_orders" on public.orders
  for select using (
    public.current_user_role() = 'client'
    and client_id = auth.uid()
  );

create policy "client_update_own_orders" on public.orders
  for update using (
    public.current_user_role() = 'client'
    and client_id = auth.uid()
  );

create policy "client_insert_orders" on public.orders
  for insert with check (
    public.current_user_role() = 'client'
    and client_id = auth.uid()
  );

create policy "copywriter_read_assigned_orders" on public.orders
  for select using (
    public.current_user_role() = 'copywriter'
    and copywriter_id = auth.uid()
  );

create policy "copywriter_update_assigned_orders" on public.orders
  for update using (
    public.current_user_role() = 'copywriter'
    and copywriter_id = auth.uid()
  );

create policy "sourcer_read_own_orders" on public.orders
  for select using (
    public.current_user_role() = 'sourcer'
    and sourcer_id = auth.uid()
  );

-- ==================== change_requests ====================
create policy "admin_manager_all_change_requests" on public.change_requests
  for all using (public.current_user_role() in ('admin', 'manager'));

create policy "client_insert_change_requests" on public.change_requests
  for insert with check (
    public.current_user_role() = 'client'
    and exists (
      select 1 from public.orders
      where id = order_id and client_id = auth.uid()
    )
  );

create policy "client_read_own_change_requests" on public.change_requests
  for select using (
    public.current_user_role() = 'client'
    and created_by = auth.uid()
  );

create policy "copywriter_read_assigned_change_requests" on public.change_requests
  for select using (
    public.current_user_role() = 'copywriter'
    and exists (
      select 1 from public.orders
      where id = order_id and copywriter_id = auth.uid()
    )
  );

-- ==================== invoices ====================
create policy "admin_manager_all_invoices" on public.invoices
  for all using (public.current_user_role() in ('admin', 'manager'));

create policy "client_read_own_invoices" on public.invoices
  for select using (
    public.current_user_role() = 'client'
    and client_id = auth.uid()
    and status in ('sent', 'paid')
  );

-- ==================== invoice_items ====================
create policy "admin_manager_all_invoice_items" on public.invoice_items
  for all using (public.current_user_role() in ('admin', 'manager'));

create policy "client_read_own_invoice_items" on public.invoice_items
  for select using (
    public.current_user_role() = 'client'
    and exists (
      select 1 from public.invoices
      where id = invoice_id
        and client_id = auth.uid()
        and status in ('sent', 'paid')
    )
  );

-- ==================== chats ====================
create policy "participant_read_chats" on public.chats
  for select using (
    exists (
      select 1 from public.chat_participants
      where chat_id = id and user_id = auth.uid()
    )
  );

create policy "participant_insert_chats" on public.chats
  for insert with check (auth.uid() is not null);

-- ==================== chat_participants ====================
create policy "participant_read_chat_participants" on public.chat_participants
  for select using (
    exists (
      select 1 from public.chat_participants cp
      where cp.chat_id = chat_id and cp.user_id = auth.uid()
    )
  );

create policy "participant_insert_chat_participants" on public.chat_participants
  for insert with check (auth.uid() is not null);

-- ==================== messages ====================
create policy "participant_read_messages" on public.messages
  for select using (
    exists (
      select 1 from public.chat_participants
      where chat_id = messages.chat_id and user_id = auth.uid()
    )
  );

create policy "participant_insert_messages" on public.messages
  for insert with check (
    exists (
      select 1 from public.chat_participants
      where chat_id = messages.chat_id and user_id = auth.uid()
    )
  );

create policy "participant_update_messages" on public.messages
  for update using (
    exists (
      select 1 from public.chat_participants
      where chat_id = messages.chat_id and user_id = auth.uid()
    )
  );
