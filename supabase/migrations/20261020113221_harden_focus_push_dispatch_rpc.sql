-- Harden the RPCs against unsigned public callers.
-- The Edge Function authenticates with Supabase's injected server-only secret key.
revoke execute on function public.focus_claim_push_jobs(text) from anon;
revoke execute on function public.focus_ack_push_job(text,uuid,boolean,boolean) from anon;
grant execute on function public.focus_claim_push_jobs(text) to service_role;
grant execute on function public.focus_ack_push_job(text,uuid,boolean,boolean) to service_role;
