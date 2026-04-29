-- users: extends auth.users
create table public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null unique,
  role       public.role not null,
  status     public.user_status not null default 'pending',
  first_name text not null default '',
  last_name  text not null default '',
  manager_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- sites
create table public.sites (
  id         uuid primary key default gen_random_uuid(),
  url        text not null,
  sourcer_id uuid references public.users(id) on delete set null,
  status     public.site_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- cart_items
create table public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.users(id) on delete cascade,
  site_id    uuid not null references public.sites(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id, site_id)
);

-- orders
create table public.orders (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.users(id),
  site_id       uuid not null references public.sites(id),
  copywriter_id uuid references public.users(id) on delete set null,
  sourcer_id    uuid references public.users(id) on delete set null,
  status        public.order_status not null default 'new',
  publish_month date not null,
  content       text,
  published_url text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- change_requests
create table public.change_requests (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  comment    text not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

-- invoices
create table public.invoices (
  id                   uuid primary key default gen_random_uuid(),
  client_id            uuid not null references public.users(id),
  status               public.invoice_status not null default 'draft',
  billing_period_start date not null,
  billing_period_end   date not null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- invoice_items
create table public.invoice_items (
  id         uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  order_id   uuid not null references public.orders(id),
  amount     numeric(10, 2) not null
);

-- chats
create table public.chats (
  id         uuid primary key default gen_random_uuid(),
  category   public.chat_category not null,
  created_at timestamptz not null default now()
);

-- chat_participants
create table public.chat_participants (
  id      uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  unique (chat_id, user_id)
);

-- messages
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  chat_id    uuid not null references public.chats(id) on delete cascade,
  sender_id  uuid not null references public.users(id),
  body       text not null,
  status     public.message_status not null default 'unread',
  created_at timestamptz not null default now()
);
