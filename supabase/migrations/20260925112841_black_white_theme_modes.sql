alter table public.user_settings
  drop constraint if exists user_settings_theme_check;

alter table public.user_settings
  add constraint user_settings_theme_check
  check (
    theme = any (
      array[
        'dark'::text,
        'light'::text,
        'system'::text,
        'black'::text,
        'white'::text
      ]
    )
  );
