-- Allow users to read profile data of others who share a chat with them.
-- Fixes "Deleted User" display when clients view messages from copywriters/managers,
-- whose rows were blocked by the existing users_select RLS policy.
CREATE POLICY "users_select_chat_participants"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_participants cp1
    JOIN public.chat_participants cp2 ON cp1.chat_id = cp2.chat_id
    WHERE cp1.user_id = auth.uid()
      AND cp2.user_id = users.id
  )
);
