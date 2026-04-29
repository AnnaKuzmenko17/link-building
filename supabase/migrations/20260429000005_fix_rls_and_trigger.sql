-- ============================================================
-- Fix 1: chat_participants RLS self-join recursion
-- Replace the self-referencing subquery with a security definer
-- function so Postgres doesn't enter an infinite RLS loop.
-- ============================================================
create or replace function public.is_chat_participant(p_chat_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.chat_participants
    where chat_id = p_chat_id and user_id = auth.uid()
  )
$$;

-- Drop old recursive policies
drop policy if exists "participant_read_chat_participants" on public.chat_participants;
drop policy if exists "participant_read_chats"             on public.chats;
drop policy if exists "participant_read_messages"          on public.messages;
drop policy if exists "participant_insert_messages"        on public.messages;
drop policy if exists "participant_update_messages"        on public.messages;

-- Recreate using the helper function
create policy "participant_read_chats" on public.chats
  for select using (public.is_chat_participant(id));

create policy "participant_read_chat_participants" on public.chat_participants
  for select using (public.is_chat_participant(chat_id));

create policy "participant_read_messages" on public.messages
  for select using (public.is_chat_participant(chat_id));

create policy "participant_insert_messages" on public.messages
  for insert with check (public.is_chat_participant(chat_id));

create policy "participant_update_messages" on public.messages
  for update using (public.is_chat_participant(chat_id));

-- ============================================================
-- Fix 2: sourcer_insert_sites must enforce sourcer_id = auth.uid()
-- Without this a sourcer could insert a site owned by someone else.
-- ============================================================
drop policy if exists "sourcer_insert_sites" on public.sites;

create policy "sourcer_insert_sites" on public.sites
  for insert with check (
    public.current_user_role() = 'sourcer'
    and sourcer_id = auth.uid()
  );

-- ============================================================
-- Fix 3: handle_new_user trigger — include manager_id from metadata
-- When an admin invites a client and passes manager_id in metadata,
-- the trigger now sets it directly instead of requiring a follow-up update.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
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
