-- Defense in depth for SECURITY DEFINER functions used by FOCUS.
-- Keep only pg_catalog and public in the function lookup path so caller
-- controlled schemas cannot shadow built-in names.
--
-- get_leaderboard and refresh_my_league_history intentionally remain
-- executable by authenticated users because they are the narrow RPC
-- boundary for the opt-in League feature. Anonymous execution stays revoked.

alter function public.handle_focus_user_created()
  set search_path = pg_catalog, public;

alter function public.recompute_league_score(uuid, date)
  set search_path = pg_catalog, public;

alter function public.refresh_my_league_history(integer)
  set search_path = pg_catalog, public;

alter function public.get_leaderboard(text, date)
  set search_path = pg_catalog, public;

alter function public.refresh_league_score_from_session()
  set search_path = pg_catalog, public;

revoke all on function public.handle_focus_user_created()
  from public, anon, authenticated;

revoke all on function public.recompute_league_score(uuid, date)
  from public, anon, authenticated;

revoke all on function public.refresh_league_score_from_session()
  from public, anon, authenticated;

revoke all on function public.get_leaderboard(text, date)
  from public, anon, authenticated;
grant execute on function public.get_leaderboard(text, date)
  to authenticated;

revoke all on function public.refresh_my_league_history(integer)
  from public, anon, authenticated;
grant execute on function public.refresh_my_league_history(integer)
  to authenticated;

comment on function public.get_leaderboard(text, date) is
  'Authenticated opt-in League read RPC. SECURITY DEFINER is intentional so the function can aggregate only public League profile fields while private study tables remain protected by RLS.';

comment on function public.refresh_my_league_history(integer) is
  'Authenticated self-only League maintenance RPC. Uses auth.uid(), clamps the requested history window, and does not accept a target user id.';
