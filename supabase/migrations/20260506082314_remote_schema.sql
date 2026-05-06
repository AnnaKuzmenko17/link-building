drop extension if exists "pg_net";

create type "public"."chat_category" as enum ('support', 'sales', 'general');

create type "public"."chat_status" as enum ('active', 'archived');

create type "public"."invoice_status" as enum ('draft', 'sent', 'paid');

create type "public"."link_type" as enum ('dofollow', 'nofollow', 'sponsored', 'ugc');

create type "public"."order_status" as enum ('new', 'in_progress', 'content_sent', 'needs_changes', 'content_approved', 'published', 'completed', 'canceled');

create type "public"."role" as enum ('client', 'manager', 'copywriter', 'sourcer', 'admin');

create type "public"."site_status" as enum ('pending', 'active', 'archived', 'needs_changes');

create type "public"."user_status" as enum ('pending', 'active', 'disabled');

create sequence "public"."orders_order_number_seq";


  create table "public"."cart_items" (
    "id" uuid not null default gen_random_uuid(),
    "client_id" uuid not null,
    "site_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."cart_items" enable row level security;


  create table "public"."categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."categories" enable row level security;


  create table "public"."change_requests" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "comment" text not null,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."change_requests" enable row level security;


  create table "public"."chat_participants" (
    "id" uuid not null default gen_random_uuid(),
    "chat_id" uuid not null,
    "user_id" uuid not null
      );


alter table "public"."chat_participants" enable row level security;


  create table "public"."chats" (
    "id" uuid not null default gen_random_uuid(),
    "category" public.chat_category not null,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "title" text not null default ''::text,
    "status" public.chat_status not null default 'active'::public.chat_status
      );


alter table "public"."chats" enable row level security;


  create table "public"."invoice_items" (
    "id" uuid not null default gen_random_uuid(),
    "invoice_id" uuid not null,
    "order_id" uuid not null,
    "amount" numeric(10,2) not null
      );


alter table "public"."invoice_items" enable row level security;


  create table "public"."invoices" (
    "id" uuid not null default gen_random_uuid(),
    "client_id" uuid not null,
    "status" public.invoice_status not null default 'draft'::public.invoice_status,
    "billing_period_start" date not null,
    "billing_period_end" date not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."invoices" enable row level security;


  create table "public"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "chat_id" uuid not null,
    "sender_id" uuid not null,
    "body" text not null,
    "created_at" timestamp with time zone not null default now(),
    "read_by" uuid[] not null default '{}'::uuid[]
      );


alter table "public"."messages" enable row level security;


  create table "public"."orders" (
    "id" uuid not null default gen_random_uuid(),
    "client_id" uuid not null,
    "site_id" uuid not null,
    "copywriter_id" uuid,
    "sourcer_id" uuid,
    "status" public.order_status not null default 'new'::public.order_status,
    "publish_month" date not null,
    "content" text,
    "published_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "comment" text,
    "order_number" integer not null default nextval('public.orders_order_number_seq'::regclass),
    "chat_id" uuid
      );


alter table "public"."orders" enable row level security;


  create table "public"."sites" (
    "id" uuid not null default gen_random_uuid(),
    "domain" text not null,
    "sourcer_id" uuid,
    "status" public.site_status not null default 'pending'::public.site_status,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid,
    "dr" integer not null default 0,
    "category_id" uuid,
    "top_countries" text not null default ''::text,
    "countries" text[] not null default '{}'::text[],
    "languages" text[] not null default '{}'::text[],
    "price" numeric(10,2) not null default 0,
    "requirements" text,
    "description" text,
    "sourcer_notes" text,
    "contact_info" text,
    "link_type" public.link_type not null default 'dofollow'::public.link_type,
    "keywords_relevance" text,
    "organic_keywords_count" integer not null default 0,
    "organic_traffic_count" integer not null default 0,
    "needs_changes_by" uuid,
    "needs_changes_at" timestamp with time zone,
    "approved_by" uuid,
    "approved_at" timestamp with time zone
      );


alter table "public"."sites" enable row level security;


  create table "public"."users" (
    "id" uuid not null,
    "email" text not null,
    "role" public.role not null,
    "status" public.user_status not null default 'pending'::public.user_status,
    "first_name" text not null default ''::text,
    "last_name" text not null default ''::text,
    "manager_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "avatar_url" text
      );


alter table "public"."users" enable row level security;

alter sequence "public"."orders_order_number_seq" owned by "public"."orders"."order_number";

CREATE UNIQUE INDEX cart_items_client_id_site_id_key ON public.cart_items USING btree (client_id, site_id);

CREATE UNIQUE INDEX cart_items_pkey ON public.cart_items USING btree (id);

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX change_requests_pkey ON public.change_requests USING btree (id);

CREATE UNIQUE INDEX chat_participants_chat_id_user_id_key ON public.chat_participants USING btree (chat_id, user_id);

CREATE UNIQUE INDEX chat_participants_pkey ON public.chat_participants USING btree (id);

CREATE UNIQUE INDEX chats_pkey ON public.chats USING btree (id);

CREATE INDEX idx_cart_items_client_id ON public.cart_items USING btree (client_id);

CREATE INDEX idx_change_requests_order_id ON public.change_requests USING btree (order_id);

CREATE INDEX idx_chat_participants_chat_id ON public.chat_participants USING btree (chat_id);

CREATE INDEX idx_chat_participants_user_id ON public.chat_participants USING btree (user_id);

CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items USING btree (invoice_id);

CREATE INDEX idx_invoices_client_id ON public.invoices USING btree (client_id);

CREATE INDEX idx_messages_chat_id ON public.messages USING btree (chat_id);

CREATE INDEX idx_orders_client_id ON public.orders USING btree (client_id);

CREATE INDEX idx_orders_copywriter_id ON public.orders USING btree (copywriter_id);

CREATE INDEX idx_orders_sourcer_id ON public.orders USING btree (sourcer_id);

CREATE INDEX idx_orders_status ON public.orders USING btree (status);

CREATE INDEX idx_sites_sourcer_id ON public.sites USING btree (sourcer_id);

CREATE UNIQUE INDEX invoice_items_pkey ON public.invoice_items USING btree (id);

CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);

CREATE UNIQUE INDEX sites_domain_unique ON public.sites USING btree (domain);

CREATE UNIQUE INDEX sites_pkey ON public.sites USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."cart_items" add constraint "cart_items_pkey" PRIMARY KEY using index "cart_items_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."change_requests" add constraint "change_requests_pkey" PRIMARY KEY using index "change_requests_pkey";

alter table "public"."chat_participants" add constraint "chat_participants_pkey" PRIMARY KEY using index "chat_participants_pkey";

alter table "public"."chats" add constraint "chats_pkey" PRIMARY KEY using index "chats_pkey";

alter table "public"."invoice_items" add constraint "invoice_items_pkey" PRIMARY KEY using index "invoice_items_pkey";

alter table "public"."invoices" add constraint "invoices_pkey" PRIMARY KEY using index "invoices_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."orders" add constraint "orders_pkey" PRIMARY KEY using index "orders_pkey";

alter table "public"."sites" add constraint "sites_pkey" PRIMARY KEY using index "sites_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."cart_items" add constraint "cart_items_client_id_fkey" FOREIGN KEY (client_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."cart_items" validate constraint "cart_items_client_id_fkey";

alter table "public"."cart_items" add constraint "cart_items_client_id_site_id_key" UNIQUE using index "cart_items_client_id_site_id_key";

alter table "public"."cart_items" add constraint "cart_items_site_id_fkey" FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE CASCADE not valid;

alter table "public"."cart_items" validate constraint "cart_items_site_id_fkey";

alter table "public"."categories" add constraint "categories_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id) not valid;

alter table "public"."categories" validate constraint "categories_created_by_fkey";

alter table "public"."categories" add constraint "categories_name_key" UNIQUE using index "categories_name_key";

alter table "public"."change_requests" add constraint "change_requests_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id) not valid;

alter table "public"."change_requests" validate constraint "change_requests_created_by_fkey";

alter table "public"."change_requests" add constraint "change_requests_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."change_requests" validate constraint "change_requests_order_id_fkey";

alter table "public"."chat_participants" add constraint "chat_participants_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE not valid;

alter table "public"."chat_participants" validate constraint "chat_participants_chat_id_fkey";

alter table "public"."chat_participants" add constraint "chat_participants_chat_id_user_id_key" UNIQUE using index "chat_participants_chat_id_user_id_key";

alter table "public"."chat_participants" add constraint "chat_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."chat_participants" validate constraint "chat_participants_user_id_fkey";

alter table "public"."chats" add constraint "chats_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."chats" validate constraint "chats_created_by_fkey";

alter table "public"."invoice_items" add constraint "invoice_items_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE not valid;

alter table "public"."invoice_items" validate constraint "invoice_items_invoice_id_fkey";

alter table "public"."invoice_items" add constraint "invoice_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) not valid;

alter table "public"."invoice_items" validate constraint "invoice_items_order_id_fkey";

alter table "public"."invoices" add constraint "invoices_client_id_fkey" FOREIGN KEY (client_id) REFERENCES public.users(id) not valid;

alter table "public"."invoices" validate constraint "invoices_client_id_fkey";

alter table "public"."messages" add constraint "messages_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_chat_id_fkey";

alter table "public"."messages" add constraint "messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES public.users(id) not valid;

alter table "public"."messages" validate constraint "messages_sender_id_fkey";

alter table "public"."orders" add constraint "orders_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_chat_id_fkey";

alter table "public"."orders" add constraint "orders_client_id_fkey" FOREIGN KEY (client_id) REFERENCES public.users(id) not valid;

alter table "public"."orders" validate constraint "orders_client_id_fkey";

alter table "public"."orders" add constraint "orders_copywriter_id_fkey" FOREIGN KEY (copywriter_id) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_copywriter_id_fkey";

alter table "public"."orders" add constraint "orders_site_id_fkey" FOREIGN KEY (site_id) REFERENCES public.sites(id) not valid;

alter table "public"."orders" validate constraint "orders_site_id_fkey";

alter table "public"."orders" add constraint "orders_sourcer_id_fkey" FOREIGN KEY (sourcer_id) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_sourcer_id_fkey";

alter table "public"."sites" add constraint "sites_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES public.users(id) not valid;

alter table "public"."sites" validate constraint "sites_approved_by_fkey";

alter table "public"."sites" add constraint "sites_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) not valid;

alter table "public"."sites" validate constraint "sites_category_id_fkey";

alter table "public"."sites" add constraint "sites_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id) not valid;

alter table "public"."sites" validate constraint "sites_created_by_fkey";

alter table "public"."sites" add constraint "sites_domain_unique" UNIQUE using index "sites_domain_unique";

alter table "public"."sites" add constraint "sites_needs_changes_by_fkey" FOREIGN KEY (needs_changes_by) REFERENCES public.users(id) not valid;

alter table "public"."sites" validate constraint "sites_needs_changes_by_fkey";

alter table "public"."sites" add constraint "sites_sourcer_id_fkey" FOREIGN KEY (sourcer_id) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."sites" validate constraint "sites_sourcer_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

alter table "public"."users" add constraint "users_manager_id_fkey" FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL not valid;

alter table "public"."users" validate constraint "users_manager_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.current_user_role()
 RETURNS public.role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select role from public.users where id = auth.uid()
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.users (id, email, role, status, first_name, last_name, manager_id)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.role, 'client'),
    'pending',
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    (new.raw_user_meta_data->>'manager_id')::uuid
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_chat_participant(p_chat_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.chat_participants
    where chat_id = p_chat_id and user_id = auth.uid()
  )
$function$
;

CREATE OR REPLACE FUNCTION public.mark_messages_read(p_chat_id uuid, p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update public.messages
  set read_by = array_append(read_by, p_user_id)
  where chat_id = p_chat_id
    and sender_id <> p_user_id
    and not (p_user_id = any(read_by));
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sourcer_can_access_invoice(invoice_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM invoice_items ii
    JOIN orders o ON o.id = ii.order_id
    JOIN sites s ON s.id = o.site_id
    WHERE ii.invoice_id = invoice_uuid
      AND s.created_by = auth.uid()
  );
$function$
;

grant delete on table "public"."cart_items" to "anon";

grant insert on table "public"."cart_items" to "anon";

grant references on table "public"."cart_items" to "anon";

grant select on table "public"."cart_items" to "anon";

grant trigger on table "public"."cart_items" to "anon";

grant truncate on table "public"."cart_items" to "anon";

grant update on table "public"."cart_items" to "anon";

grant delete on table "public"."cart_items" to "authenticated";

grant insert on table "public"."cart_items" to "authenticated";

grant references on table "public"."cart_items" to "authenticated";

grant select on table "public"."cart_items" to "authenticated";

grant trigger on table "public"."cart_items" to "authenticated";

grant truncate on table "public"."cart_items" to "authenticated";

grant update on table "public"."cart_items" to "authenticated";

grant delete on table "public"."cart_items" to "service_role";

grant insert on table "public"."cart_items" to "service_role";

grant references on table "public"."cart_items" to "service_role";

grant select on table "public"."cart_items" to "service_role";

grant trigger on table "public"."cart_items" to "service_role";

grant truncate on table "public"."cart_items" to "service_role";

grant update on table "public"."cart_items" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."change_requests" to "anon";

grant insert on table "public"."change_requests" to "anon";

grant references on table "public"."change_requests" to "anon";

grant select on table "public"."change_requests" to "anon";

grant trigger on table "public"."change_requests" to "anon";

grant truncate on table "public"."change_requests" to "anon";

grant update on table "public"."change_requests" to "anon";

grant delete on table "public"."change_requests" to "authenticated";

grant insert on table "public"."change_requests" to "authenticated";

grant references on table "public"."change_requests" to "authenticated";

grant select on table "public"."change_requests" to "authenticated";

grant trigger on table "public"."change_requests" to "authenticated";

grant truncate on table "public"."change_requests" to "authenticated";

grant update on table "public"."change_requests" to "authenticated";

grant delete on table "public"."change_requests" to "service_role";

grant insert on table "public"."change_requests" to "service_role";

grant references on table "public"."change_requests" to "service_role";

grant select on table "public"."change_requests" to "service_role";

grant trigger on table "public"."change_requests" to "service_role";

grant truncate on table "public"."change_requests" to "service_role";

grant update on table "public"."change_requests" to "service_role";

grant delete on table "public"."chat_participants" to "anon";

grant insert on table "public"."chat_participants" to "anon";

grant references on table "public"."chat_participants" to "anon";

grant select on table "public"."chat_participants" to "anon";

grant trigger on table "public"."chat_participants" to "anon";

grant truncate on table "public"."chat_participants" to "anon";

grant update on table "public"."chat_participants" to "anon";

grant delete on table "public"."chat_participants" to "authenticated";

grant insert on table "public"."chat_participants" to "authenticated";

grant references on table "public"."chat_participants" to "authenticated";

grant select on table "public"."chat_participants" to "authenticated";

grant trigger on table "public"."chat_participants" to "authenticated";

grant truncate on table "public"."chat_participants" to "authenticated";

grant update on table "public"."chat_participants" to "authenticated";

grant delete on table "public"."chat_participants" to "service_role";

grant insert on table "public"."chat_participants" to "service_role";

grant references on table "public"."chat_participants" to "service_role";

grant select on table "public"."chat_participants" to "service_role";

grant trigger on table "public"."chat_participants" to "service_role";

grant truncate on table "public"."chat_participants" to "service_role";

grant update on table "public"."chat_participants" to "service_role";

grant delete on table "public"."chats" to "anon";

grant insert on table "public"."chats" to "anon";

grant references on table "public"."chats" to "anon";

grant select on table "public"."chats" to "anon";

grant trigger on table "public"."chats" to "anon";

grant truncate on table "public"."chats" to "anon";

grant update on table "public"."chats" to "anon";

grant delete on table "public"."chats" to "authenticated";

grant insert on table "public"."chats" to "authenticated";

grant references on table "public"."chats" to "authenticated";

grant select on table "public"."chats" to "authenticated";

grant trigger on table "public"."chats" to "authenticated";

grant truncate on table "public"."chats" to "authenticated";

grant update on table "public"."chats" to "authenticated";

grant delete on table "public"."chats" to "service_role";

grant insert on table "public"."chats" to "service_role";

grant references on table "public"."chats" to "service_role";

grant select on table "public"."chats" to "service_role";

grant trigger on table "public"."chats" to "service_role";

grant truncate on table "public"."chats" to "service_role";

grant update on table "public"."chats" to "service_role";

grant delete on table "public"."invoice_items" to "anon";

grant insert on table "public"."invoice_items" to "anon";

grant references on table "public"."invoice_items" to "anon";

grant select on table "public"."invoice_items" to "anon";

grant trigger on table "public"."invoice_items" to "anon";

grant truncate on table "public"."invoice_items" to "anon";

grant update on table "public"."invoice_items" to "anon";

grant delete on table "public"."invoice_items" to "authenticated";

grant insert on table "public"."invoice_items" to "authenticated";

grant references on table "public"."invoice_items" to "authenticated";

grant select on table "public"."invoice_items" to "authenticated";

grant trigger on table "public"."invoice_items" to "authenticated";

grant truncate on table "public"."invoice_items" to "authenticated";

grant update on table "public"."invoice_items" to "authenticated";

grant delete on table "public"."invoice_items" to "service_role";

grant insert on table "public"."invoice_items" to "service_role";

grant references on table "public"."invoice_items" to "service_role";

grant select on table "public"."invoice_items" to "service_role";

grant trigger on table "public"."invoice_items" to "service_role";

grant truncate on table "public"."invoice_items" to "service_role";

grant update on table "public"."invoice_items" to "service_role";

grant delete on table "public"."invoices" to "anon";

grant insert on table "public"."invoices" to "anon";

grant references on table "public"."invoices" to "anon";

grant select on table "public"."invoices" to "anon";

grant trigger on table "public"."invoices" to "anon";

grant truncate on table "public"."invoices" to "anon";

grant update on table "public"."invoices" to "anon";

grant delete on table "public"."invoices" to "authenticated";

grant insert on table "public"."invoices" to "authenticated";

grant references on table "public"."invoices" to "authenticated";

grant select on table "public"."invoices" to "authenticated";

grant trigger on table "public"."invoices" to "authenticated";

grant truncate on table "public"."invoices" to "authenticated";

grant update on table "public"."invoices" to "authenticated";

grant delete on table "public"."invoices" to "service_role";

grant insert on table "public"."invoices" to "service_role";

grant references on table "public"."invoices" to "service_role";

grant select on table "public"."invoices" to "service_role";

grant trigger on table "public"."invoices" to "service_role";

grant truncate on table "public"."invoices" to "service_role";

grant update on table "public"."invoices" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant references on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant trigger on table "public"."orders" to "anon";

grant truncate on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant references on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant trigger on table "public"."orders" to "authenticated";

grant truncate on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";

grant delete on table "public"."sites" to "anon";

grant insert on table "public"."sites" to "anon";

grant references on table "public"."sites" to "anon";

grant select on table "public"."sites" to "anon";

grant trigger on table "public"."sites" to "anon";

grant truncate on table "public"."sites" to "anon";

grant update on table "public"."sites" to "anon";

grant delete on table "public"."sites" to "authenticated";

grant insert on table "public"."sites" to "authenticated";

grant references on table "public"."sites" to "authenticated";

grant select on table "public"."sites" to "authenticated";

grant trigger on table "public"."sites" to "authenticated";

grant truncate on table "public"."sites" to "authenticated";

grant update on table "public"."sites" to "authenticated";

grant delete on table "public"."sites" to "service_role";

grant insert on table "public"."sites" to "service_role";

grant references on table "public"."sites" to "service_role";

grant select on table "public"."sites" to "service_role";

grant trigger on table "public"."sites" to "service_role";

grant truncate on table "public"."sites" to "service_role";

grant update on table "public"."sites" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


  create policy "cart_items_all"
  on "public"."cart_items"
  as permissive
  for all
  to public
using (((public.current_user_role() = 'client'::public.role) AND (client_id = ( SELECT auth.uid() AS uid))))
with check (((public.current_user_role() = 'client'::public.role) AND (client_id = ( SELECT auth.uid() AS uid))));



  create policy "categories_admin_all"
  on "public"."categories"
  as permissive
  for all
  to authenticated
using ((public.current_user_role() = 'admin'::public.role))
with check ((public.current_user_role() = 'admin'::public.role));



  create policy "categories_read"
  on "public"."categories"
  as permissive
  for select
  to authenticated
using (true);



  create policy "change_requests_delete"
  on "public"."change_requests"
  as permissive
  for delete
  to public
using ((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])));



  create policy "change_requests_insert"
  on "public"."change_requests"
  as permissive
  for insert
  to public
with check (((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])) OR ((public.current_user_role() = 'client'::public.role) AND (EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = change_requests.order_id) AND (orders.client_id = ( SELECT auth.uid() AS uid))))))));



  create policy "change_requests_select"
  on "public"."change_requests"
  as permissive
  for select
  to public
using (((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])) OR ((public.current_user_role() = 'client'::public.role) AND (created_by = ( SELECT auth.uid() AS uid))) OR ((public.current_user_role() = 'copywriter'::public.role) AND (EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = change_requests.order_id) AND (orders.copywriter_id = ( SELECT auth.uid() AS uid))))))));



  create policy "change_requests_update"
  on "public"."change_requests"
  as permissive
  for update
  to public
using ((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])));



  create policy "chat_participants_insert"
  on "public"."chat_participants"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) IS NOT NULL));



  create policy "chat_participants_select"
  on "public"."chat_participants"
  as permissive
  for select
  to public
using (public.is_chat_participant(chat_id));



  create policy "chats_insert"
  on "public"."chats"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) IS NOT NULL));



  create policy "chats_select"
  on "public"."chats"
  as permissive
  for select
  to public
using (public.is_chat_participant(id));



  create policy "participant_update_chats"
  on "public"."chats"
  as permissive
  for update
  to public
using (((category = 'general'::public.chat_category) AND (EXISTS ( SELECT 1
   FROM public.chat_participants
  WHERE ((chat_participants.chat_id = chat_participants.id) AND (chat_participants.user_id = auth.uid()))))));



  create policy "invoice_items_delete"
  on "public"."invoice_items"
  as permissive
  for delete
  to public
using ((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])));



  create policy "invoice_items_insert"
  on "public"."invoice_items"
  as permissive
  for insert
  to public
with check ((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])));



  create policy "invoice_items_select"
  on "public"."invoice_items"
  as permissive
  for select
  to public
using (((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])) OR ((public.current_user_role() = 'client'::public.role) AND (EXISTS ( SELECT 1
   FROM public.invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.client_id = ( SELECT auth.uid() AS uid)) AND (invoices.status = ANY (ARRAY['sent'::public.invoice_status, 'paid'::public.invoice_status]))))))));



  create policy "invoice_items_select_sourcer"
  on "public"."invoice_items"
  as permissive
  for select
  to public
using (((public.current_user_role() = 'sourcer'::public.role) AND (EXISTS ( SELECT 1
   FROM (public.orders o
     JOIN public.sites s ON ((s.id = o.site_id)))
  WHERE ((o.id = invoice_items.order_id) AND (s.created_by = auth.uid()))))));



  create policy "invoice_items_update"
  on "public"."invoice_items"
  as permissive
  for update
  to public
using ((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])));



  create policy "invoices_delete"
  on "public"."invoices"
  as permissive
  for delete
  to public
using ((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])));



  create policy "invoices_insert"
  on "public"."invoices"
  as permissive
  for insert
  to public
with check ((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])));



  create policy "invoices_select"
  on "public"."invoices"
  as permissive
  for select
  to public
using (((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])) OR ((public.current_user_role() = 'client'::public.role) AND (client_id = ( SELECT auth.uid() AS uid)) AND (status = ANY (ARRAY['sent'::public.invoice_status, 'paid'::public.invoice_status])))));



  create policy "invoices_select_sourcer"
  on "public"."invoices"
  as permissive
  for select
  to public
using (((public.current_user_role() = 'sourcer'::public.role) AND public.sourcer_can_access_invoice(id)));



  create policy "invoices_update"
  on "public"."invoices"
  as permissive
  for update
  to public
using ((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])));



  create policy "participant_insert_messages"
  on "public"."messages"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM (public.chat_participants cp
     JOIN public.chats c ON ((c.id = cp.chat_id)))
  WHERE ((cp.chat_id = messages.chat_id) AND (cp.user_id = auth.uid()) AND (c.status = 'active'::public.chat_status)))));



  create policy "participant_read_messages"
  on "public"."messages"
  as permissive
  for select
  to public
using (public.is_chat_participant(chat_id));



  create policy "participant_update_messages"
  on "public"."messages"
  as permissive
  for update
  to public
using (public.is_chat_participant(chat_id));



  create policy "orders_delete"
  on "public"."orders"
  as permissive
  for delete
  to public
using ((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])));



  create policy "orders_insert"
  on "public"."orders"
  as permissive
  for insert
  to public
with check (((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])) OR ((public.current_user_role() = 'client'::public.role) AND (client_id = ( SELECT auth.uid() AS uid)))));



  create policy "orders_select"
  on "public"."orders"
  as permissive
  for select
  to public
using (((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])) OR ((public.current_user_role() = 'client'::public.role) AND (client_id = ( SELECT auth.uid() AS uid))) OR ((public.current_user_role() = 'copywriter'::public.role) AND (copywriter_id = ( SELECT auth.uid() AS uid))) OR ((public.current_user_role() = 'sourcer'::public.role) AND ((sourcer_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.sites s
  WHERE ((s.id = orders.site_id) AND (s.created_by = ( SELECT auth.uid() AS uid)))))))));



  create policy "orders_update"
  on "public"."orders"
  as permissive
  for update
  to public
using (((public.current_user_role() = ANY (ARRAY['admin'::public.role, 'manager'::public.role])) OR ((public.current_user_role() = 'client'::public.role) AND (client_id = ( SELECT auth.uid() AS uid))) OR ((public.current_user_role() = 'copywriter'::public.role) AND (copywriter_id = ( SELECT auth.uid() AS uid)))));



  create policy "sites_admin_all"
  on "public"."sites"
  as permissive
  for all
  to authenticated
using ((public.current_user_role() = 'admin'::public.role))
with check ((public.current_user_role() = 'admin'::public.role));



  create policy "sites_client_select"
  on "public"."sites"
  as permissive
  for select
  to authenticated
using (((public.current_user_role() = 'client'::public.role) AND (status = 'active'::public.site_status)));



  create policy "sites_copywriter_select"
  on "public"."sites"
  as permissive
  for select
  to authenticated
using ((public.current_user_role() = 'copywriter'::public.role));



  create policy "sites_manager_select"
  on "public"."sites"
  as permissive
  for select
  to authenticated
using ((public.current_user_role() = 'manager'::public.role));



  create policy "sites_sourcer_insert"
  on "public"."sites"
  as permissive
  for insert
  to authenticated
with check (((public.current_user_role() = 'sourcer'::public.role) AND (created_by = ( SELECT auth.uid() AS uid))));



  create policy "sites_sourcer_select"
  on "public"."sites"
  as permissive
  for select
  to authenticated
using (((public.current_user_role() = 'sourcer'::public.role) AND (created_by = ( SELECT auth.uid() AS uid)) AND (status <> 'archived'::public.site_status)));



  create policy "sites_sourcer_update"
  on "public"."sites"
  as permissive
  for update
  to authenticated
using (((public.current_user_role() = 'sourcer'::public.role) AND (created_by = ( SELECT auth.uid() AS uid)) AND (status <> 'archived'::public.site_status)))
with check (((public.current_user_role() = 'sourcer'::public.role) AND (created_by = ( SELECT auth.uid() AS uid))));



  create policy "users_delete"
  on "public"."users"
  as permissive
  for delete
  to public
using ((public.current_user_role() = 'admin'::public.role));



  create policy "users_insert"
  on "public"."users"
  as permissive
  for insert
  to public
with check ((public.current_user_role() = 'admin'::public.role));



  create policy "users_select"
  on "public"."users"
  as permissive
  for select
  to public
using (((public.current_user_role() = 'admin'::public.role) OR (public.current_user_role() = 'manager'::public.role) OR ((public.current_user_role() = ANY (ARRAY['sourcer'::public.role, 'copywriter'::public.role, 'client'::public.role])) AND (id = ( SELECT auth.uid() AS uid)))));



  create policy "users_update"
  on "public"."users"
  as permissive
  for update
  to public
using (((public.current_user_role() = 'admin'::public.role) OR ((public.current_user_role() = 'manager'::public.role) AND (role = ANY (ARRAY['client'::public.role, 'copywriter'::public.role, 'sourcer'::public.role])))));


CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Public read avatars"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Users can delete own avatar"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can update own avatar"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload own avatar"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



