-- REVOKE from anon/authenticated alone is insufficient in Supabase because
-- the default EXECUTE grant is held by PUBLIC (which covers all roles).
-- Must revoke from PUBLIC, then re-grant only to roles that legitimately
-- need direct access (none — these are internal trigger/RLS helpers).
revoke execute on function public.current_user_role()       from public;
revoke execute on function public.handle_new_user()         from public;
revoke execute on function public.is_chat_participant(uuid) from public;
