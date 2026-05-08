-- Fix function_search_path_mutable:
-- mark_messages_read and sourcer_can_access_invoice lacked SET search_path.

CREATE OR REPLACE FUNCTION public.mark_messages_read(p_chat_id uuid, p_user_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
begin
  update public.messages
  set read_by = array_append(read_by, p_user_id)
  where chat_id = p_chat_id
    and sender_id <> p_user_id
    and not (p_user_id = any(read_by));
end;
$function$;

CREATE OR REPLACE FUNCTION public.sourcer_can_access_invoice(invoice_uuid uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.invoice_items ii
    JOIN public.orders o ON o.id = ii.order_id
    JOIN public.sites s ON s.id = o.site_id
    WHERE ii.invoice_id = invoice_uuid
      AND s.created_by = auth.uid()
  );
$function$;

-- Fix anon_security_definer_function_executable:
-- Revoke EXECUTE from anon on all 5 SECURITY DEFINER functions.
-- Unauthenticated REST API calls to /rest/v1/rpc/* for these will 403.
-- RLS policy evaluation is unaffected (runs under table owner privileges).

REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_chat_participant(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_messages_read(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.sourcer_can_access_invoice(uuid) FROM anon;

-- Fix authenticated_security_definer_function_executable (handle_new_user only):
-- handle_new_user is a trigger — it fires via auth.users INSERT, never via RPC.
-- The other 4 functions legitimately need authenticated EXECUTE (RLS + server actions).

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Fix public_bucket_allows_listing:
-- Replace broad "to public" SELECT policy with two targeted policies.
-- Authenticated users can read any avatar (needed to display others' avatars).
-- Anon users can read individual objects matching <uuid>/<filename> but not list.

DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;

CREATE POLICY "Authenticated users can read avatars"
  ON storage.objects
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Anon users can read individual avatar objects"
  ON storage.objects
  AS PERMISSIVE
  FOR SELECT
  TO anon
  USING (
    bucket_id = 'avatars'
    AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.+'
  );
