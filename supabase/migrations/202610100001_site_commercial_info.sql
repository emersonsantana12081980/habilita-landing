begin;
-- Dados públicos; mantém as políticas existentes de escrita apenas administrativa.
alter table public.site_settings add column commercial_info jsonb not null default '{}'::jsonb
 check(jsonb_typeof(commercial_info)='object' and octet_length(commercial_info::text)<=24000);
commit;
