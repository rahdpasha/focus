alter table public.user_settings
  add column if not exists custom_theme_pack jsonb;

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
        'white'::text,
        'custom'::text
      ]
    )
  );

alter table public.user_settings
  drop constraint if exists user_settings_custom_theme_pack_check;

alter table public.user_settings
  add constraint user_settings_custom_theme_pack_check
  check (
    (
      custom_theme_pack is null
      or (
        jsonb_typeof(custom_theme_pack) = 'object'
        and octet_length(custom_theme_pack::text) <= 65536
      )
    )
    and (
      theme <> 'custom'
      or custom_theme_pack is not null
    )
  );
