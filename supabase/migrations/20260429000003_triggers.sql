-- reusable updated_at trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sites_updated_at
  before update on public.sites
  for each row execute function public.set_updated_at();

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create trigger invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- auto-create public.users row when an auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, role, status, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.role, 'client'),
    'pending',
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
