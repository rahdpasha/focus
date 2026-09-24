revoke all on function public.handle_focus_user_created() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

revoke all on function public.get_leaderboard(text, date) from public, anon, authenticated;
grant execute on function public.get_leaderboard(text, date) to authenticated;

revoke all on function public.refresh_my_league_history(integer) from public, anon, authenticated;
grant execute on function public.refresh_my_league_history(integer) to authenticated;
