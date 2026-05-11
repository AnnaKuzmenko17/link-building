-- Allow admins to access all chats, participants, and messages without
-- being a participant themselves. Updates is_chat_participant so all
-- three dependent policies (chats_select, chat_participants_select,
-- participant_read_messages, participant_update_messages) inherit it.
CREATE OR REPLACE FUNCTION public.is_chat_participant(p_chat_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  select
    current_user_role() = 'admin'
    or exists (
      select 1 from public.chat_participants
      where chat_id = p_chat_id and user_id = auth.uid()
    )
$$;
