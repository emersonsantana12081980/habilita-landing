-- Preserva os pacotes existentes; o administrador escolhe o quadro ao editar.
begin;
alter table public.packages
  add column if not exists experience_level text,
  add column if not exists offer_confirmed boolean not null default false,
  add column if not exists lesson_minutes_a integer,
  add column if not exists lesson_minutes_b integer,
  add column if not exists cash_a_cents integer,
  add column if not exists cash_b_cents integer,
  add column if not exists card_contract text,
  add column if not exists exam_terms text,
  add column if not exists cancellation_terms text,
  add column if not exists exclusions text;

alter table public.packages add constraint packages_experience_level_valid
  check (experience_level is null or experience_level in ('experiencia', 'base', 'zero'));

create unique index packages_active_experience_slot
  on public.packages(category, experience_level)
  where active and experience_level is not null;

alter table public.packages add constraint packages_confirmed_offer_valid check (
  not offer_confirmed or coalesce((
    experience_level is not null and pricing_demo = false
    and price_cents > 0 and card_total_cents > 0 and card_installments between 1 and 12
    and length(trim(card_contract)) > 0
    and length(trim(exam_terms)) > 0
    and length(trim(cancellation_terms)) > 0
    and length(trim(exclusions)) > 0
    and (category = 'B' or (lessons_a > 0 and lesson_minutes_a between 1 and 1440))
    and (category = 'A' or (lessons_b > 0 and lesson_minutes_b between 1 and 1440))
    and (category <> 'A+B' or (cash_a_cents > 0 and cash_b_cents > 0
      and cash_a_cents::bigint + cash_b_cents::bigint = price_cents))
  ), false)
);
-- As políticas de autorização existentes continuam valendo: somente admin grava.
commit;
