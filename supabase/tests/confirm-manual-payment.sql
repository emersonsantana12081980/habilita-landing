-- Executar após 202611020001 em banco de teste; ROLLBACK desfaz os registros.
begin;
do $$
declare a uuid:=gen_random_uuid(); u uuid:=gen_random_uuid(); s uuid; p uuid; r uuid; denied boolean;
begin
 insert into auth.users(id,email,raw_user_meta_data) values(a,a||'@example.invalid','{"name":"Admin teste"}'),(u,u||'@example.invalid','{"name":"Aluno teste"}');
 insert into habilita_private.user_roles(user_id,role) values(a,'admin');
 select id into s from public.students where user_id=u;
 insert into public.packages(slug,name,category,lessons_a,lessons_b,price_cents) values(gen_random_uuid()::text,'Teste','A+B',1,2,30000) returning id into p;
 insert into public.package_requests(student_id,package_id,package_name,lessons_a,lessons_b,price_cents) values(s,p,'Teste',1,2,30000) returning id into r;
 perform set_config('request.jwt.claim.sub',u::text,true);
 execute 'set local role authenticated';
 denied:=false;
 begin perform public.confirm_manual_package_payment(r,'Tentativa aluno'); exception when others then denied:=true; end;
 if not denied then raise exception 'Aluno confirmou pagamento'; end if;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',a::text,true);
 update public.students set active=false where id=s;
 execute 'set local role authenticated';
 denied:=false;
 begin perform public.confirm_manual_package_payment(r,'Aluno inativo'); exception when others then denied:=true; end;
 if not denied then raise exception 'Aluno inativo recebeu créditos'; end if;
 if exists(select 1 from public.package_requests where id=r and payment_confirmed_at is not null) then raise exception 'Confirmação parcial'; end if;
 execute 'reset role';
 update public.students set active=true where id=s;
 execute 'set local role authenticated';
 perform public.confirm_manual_package_payment(r,'Pix conferido');
 perform public.confirm_manual_package_payment(r,'Repetição do clique');
 if (select count(*) from public.credit_grants where request_id=r)<>1 then raise exception 'Créditos duplicados'; end if;
 if not exists(select 1 from public.credit_grants where request_id=r and lessons_a=1 and lessons_b=2) then raise exception 'Quantidade incorreta'; end if;
 if not exists(select 1 from public.package_requests where id=r and status='approved' and payment_confirmed_cents=30000 and payment_confirmed_by=a and payment_confirmed_at is not null) then raise exception 'Pagamento não registrado'; end if;
 execute 'reset role';
end $$;
rollback;
