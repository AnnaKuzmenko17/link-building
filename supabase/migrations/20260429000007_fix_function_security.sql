-- ============================================================
-- Fix mutable search_path on all public functions.
-- Without set search_path, an attacker could shadow system
-- functions by creating objects in a schema earlier in the path.
--
-- NOTE: create or replace function resets ACLs to Postgres
-- defaults (EXECUTE for PUBLIC) on a fresh create. Each revoke
-- must follow its function definition in the same transaction.
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.role language sql stable security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;
revoke execute on function public.current_user_role() from public;

create or replace function public.is_chat_participant(p_chat_id uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chat_participants
    where chat_id = p_chat_id and user_id = auth.uid()
  )
$$;
revoke execute on function public.is_chat_participant(uuid) from public;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
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
$$;
revoke execute on function public.handle_new_user() from public;
