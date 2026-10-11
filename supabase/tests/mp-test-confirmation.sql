-- Execute depois de 202610110001_mp_test_confirmation.sql.
-- Cria somente fixtures e desfaz tudo ao final.
begin;
do $$
declare u uuid:=gen_random_uuid(); other_u uuid:=gen_random_uuid(); s uuid; p uuid; r uuid;
 ref text; result text; failed boolean;
begin
 insert into auth.users(id,email,raw_user_meta_data) values
 (u,u||'@example.invalid','{"name":"Teste MP"}'),
 (other_u,other_u||'@example.invalid','{"name":"Outro teste MP"}');
 insert into habilita_private.user_roles(user_id,role) values(u,'admin'),(other_u,'admin');
 select id into s from public.students where user_id=u;
 insert into public.packages(slug,name,category,lessons_b,price_cents)
 values(gen_random_uuid()::text,'Pacote teste MP','B',2,29900) returning id into p;
 insert into public.package_requests(student_id,package_id,package_name,lessons_a,lessons_b,price_cents,pricing_demo)
 values(s,p,'Pacote teste MP',0,2,29900,true) returning id into r;
 ref:='habilita-test-'||r::text||'-'||gen_random_uuid()::text;
 perform public.register_mp_test_attempt(r,ref,'123',29900);
 select public.record_mp_test_payment('999000001',ref,'123',r,100,'approved','2026-10-11 12:00:00Z') into result;
 if result <> 'mismatch' then raise exception 'Valor incorreto aceito'; end if;
 select public.record_mp_test_payment('999000001',ref,'456',r,29900,'approved','2026-10-11 12:00:00Z') into result;
 if result <> 'mismatch' then raise exception 'Vendedor incorreto aceito'; end if;
 perform public.record_mp_test_payment('999000001',ref,'123',r,29900,'approved','2026-10-11 12:00:00Z');
 perform public.record_mp_test_payment('999000001',ref,'123',r,29900,'approved','2026-10-11 12:00:00Z');
 perform public.record_mp_test_payment('999000001',ref,'123',r,29900,'pending','2026-10-11 11:00:00Z');
 if (select count(*) from public.mp_test_payments where request_id=r) <> 1 then raise exception 'Duplicata criada'; end if;
 if (select status from public.mp_test_payments where request_id=r) <> 'approved' then raise exception 'Estado regrediu'; end if;
 if exists(select 1 from public.credit_grants where request_id=r) then raise exception 'Teste liberou aulas'; end if;
 if (select status from public.package_requests where id=r) <> 'pending' then raise exception 'Teste aprovou pedido real'; end if;
 perform public.record_mp_test_payment('999000001',ref,'123',r,29900,'refunded','2026-10-11 13:00:00Z');
 if (select status from public.mp_test_payments where request_id=r) <> 'refunded' then raise exception 'Estorno ignorado'; end if;

 perform set_config('request.jwt.claim.sub',u::text,true);
 execute 'set local role authenticated';
 if (select count(*) from public.mp_test_payments where request_id=r) <> 1 then raise exception 'Titular não vê confirmação'; end if;
 failed:=false;
 begin perform public.record_mp_test_payment('999000002',ref,'123',r,29900,'approved',now());
 exception when insufficient_privilege then failed:=true; end;
 if not failed then raise exception 'Navegador pode confirmar pagamento'; end if;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',other_u::text,true);
 execute 'set local role authenticated';
 if exists(select 1 from public.mp_test_payments where request_id=r) then raise exception 'Outro usuário vê confirmação'; end if;
 execute 'reset role';
end $$;
rollback;
select 'Confirmações de teste verificadas; dados fictícios desfeitos.' as resultado;
