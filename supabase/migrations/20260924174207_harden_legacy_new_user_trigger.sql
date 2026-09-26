do $$
begin
  if to_regprocedure('public.handle_new_user()') is not null then
    execute 'alter function public.handle_new_user() set search_path = pg_catalog, public';
    execute 'revoke all on function public.handle_new_user() from public, anon, authenticated';
    execute 'comment on function public.handle_new_user() is ''Legacy auth trigger helper retained for profile compatibility. SECURITY DEFINER lookup path is pinned and direct client execution is revoked.''';
  end if;
end
$$;
