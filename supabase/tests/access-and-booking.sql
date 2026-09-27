-- Execute SOMENTE após a migração, no SQL Editor como postgres.
-- Todos os usuários e registros de teste são desfeitos pelo ROLLBACK final.
-- Se houver erro, execute ROLLBACK; antes de qualquer outro comando.
begin;
create temporary table test_ids (admin_id uuid, student_id uuid, other_id uuid, slot_id uuid);
insert into test_ids values(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid());
grant select on test_ids to authenticated;
insert into auth.users(id, email, raw_user_meta_data)
  select admin_id, admin_id || '@example.invalid', '{"name":"Teste admin"}'::jsonb from test_ids
  union all select student_id, student_id || '@example.invalid', '{"name":"Teste aluno", "role":"admin"}'::jsonb from test_ids
  union all select other_id, other_id || '@example.invalid', '{"name":"Teste outro aluno"}'::jsonb from test_ids;
insert into habilita_private.user_roles(user_id,role) select admin_id,'admin' from test_ids;
insert into public.availability_slots(id,instructor_id,vehicle_id,category,starts_at,ends_at)
select t.slot_id,i.id,v.id,'B',date_trunc('day',now()) + interval '365 days 12 hours',
  date_trunc('day',now()) + interval '365 days 12 hours 50 minutes'
from test_ids t, public.instructors i, public.vehicles v
where i.slug = 'emerson-santana' and v.slug = 'carro-mobi';

create function pg_temp.assert_true(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FALHOU: %',label; end if; end $$;
create function pg_temp.expect_error(command text) returns void language plpgsql as $$
declare failed boolean := false;
begin
  begin execute command; exception when others then failed := true; end;
  if not failed then raise exception 'FALHOU: operação indevida foi aceita: %',command; end if;
end $$;

select set_config('request.jwt.claim.sub',(select student_id::text from test_ids),true);
set local role authenticated;
select pg_temp.assert_true(not habilita_private.is_admin(),'metadata não promove aluno');
select pg_temp.assert_true((select count(*) = 1 from public.students),'aluno só lê seu cadastro');
select pg_temp.assert_true((select count(*) = 0 from public.credit_grants),'cadastro sem créditos');
select pg_temp.expect_error('select * from habilita_private.user_roles');
update public.students set active=false;
select pg_temp.assert_true((select bool_and(active) from public.students),'aluno não altera status administrativo');
select pg_temp.expect_error('update public.profiles set id=gen_random_uuid()');
select pg_temp.expect_error('insert into public.credit_grants default values');
select pg_temp.expect_error(format('select public.book_lesson(%L,%L)',
  (select id from public.students), (select slot_id from test_ids)));
select public.request_package((select id from public.packages where slug='pacote-carro-exemplo'));
select pg_temp.expect_error(format('select public.request_package(%L)',
  (select id from public.packages where slug='pacote-carro-exemplo')));
select pg_temp.expect_error(format('select public.resolve_package(%L,true,%L)',
  (select id from public.package_requests),'tentativa aluno'));

reset role;
select set_config('request.jwt.claim.sub',(select admin_id::text from test_ids),true);
set local role authenticated;
select public.resolve_package(r.id,true,'Teste manual sem pagamento') from public.package_requests r
join public.students s on s.id=r.student_id where s.user_id=(select student_id from test_ids);
select pg_temp.expect_error(format('select public.resolve_package(%L,true,%L)',
  (select r.id from public.package_requests r join public.students s on s.id=r.student_id
    where s.user_id=(select student_id from test_ids)), 'Duplicação'));

reset role;
select set_config('request.jwt.claim.sub',(select student_id::text from test_ids),true);
set local role authenticated;
select pg_temp.assert_true((select sum(lessons_b)=2 from public.credit_grants),'aprovação única');
select public.book_lesson((select id from public.students), (select slot_id from test_ids));
select pg_temp.assert_true((select count(*)=1 from public.lessons),'aula reservada');
select pg_temp.assert_true((select count(*)=0 from public.available_slots(
  ((date_trunc('day',now()) + interval '365 days 12 hours') at time zone 'America/Sao_Paulo')::date,'B')
  where id=(select slot_id from test_ids)), 'horário ocupado não aparece');
select pg_temp.expect_error(format('select public.book_lesson(%L,%L)',
  (select id from public.students),(select slot_id from test_ids)));

reset role;
select set_config('request.jwt.claim.sub',(select other_id::text from test_ids),true);
set local role authenticated;
select pg_temp.assert_true((select count(*)=0 from public.lessons),'outro aluno não vê aula');
select pg_temp.assert_true((select count(*)=0 from public.package_requests),'outro aluno não vê pedidos');
select pg_temp.assert_true((select count(*)=0 from public.credit_grants),'outro aluno não vê créditos');

reset role;
select set_config('request.jwt.claim.sub',(select admin_id::text from test_ids),true);
set local role authenticated;
select pg_temp.expect_error(format('select public.set_lesson_status(%L,%L)',
  (select id from public.lessons where slot_id=(select slot_id from test_ids)),'completed'));
select public.set_lesson_status(id,'cancelled') from public.lessons where slot_id=(select slot_id from test_ids);

reset role;
select set_config('request.jwt.claim.sub',(select student_id::text from test_ids),true);
set local role authenticated;
select public.book_lesson((select id from public.students),(select slot_id from test_ids));
select pg_temp.assert_true((select count(*)=1 from public.lessons where status='scheduled'),'cancelamento libera reserva');

reset role;
set local role anon;
select pg_temp.assert_true((select count(*) >= 3 from public.packages),'catálogo público');
select pg_temp.expect_error('select * from public.students');
select pg_temp.expect_error('select * from public.lessons');
select pg_temp.expect_error('select public.request_package(gen_random_uuid())');
reset role;
rollback;
select 'Testes concluídos; dados fictícios desfeitos.' as resultado;
