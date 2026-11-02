-- Executar em banco de teste após 202611020002. ROLLBACK desfaz os dados.
begin;
do $$
declare a uuid:=gen_random_uuid();u uuid:=gen_random_uuid();s uuid;p uuid;op uuid:=gen_random_uuid();op2 uuid:=gen_random_uuid();denied boolean;
begin
 insert into auth.users(id,email,raw_user_meta_data) values(a,a||'@example.invalid','{"name":"Admin teste"}'),(u,u||'@example.invalid','{"name":"Aluno teste"}');
 insert into habilita_private.user_roles(user_id,role) values(a,'admin');
 select id into s from public.students where user_id=u;
 insert into public.packages(slug,name,category,lessons_a,lessons_b,price_cents) values(gen_random_uuid()::text,'Pacote teste','B',0,2,30000) returning id into p;
 perform set_config('request.jwt.claim.sub',u::text,true);
 execute 'set local role authenticated';
 denied:=false;
 begin perform public.admin_add_student_classes(op,s,null,'Avulsas',1,2,30000,'cash',1,false,'Teste');exception when others then denied:=true;end;
 if not denied then raise exception 'Aluno criou lançamento';end if;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',a::text,true);
 execute 'set local role authenticated';
 perform public.admin_add_student_classes(op,s,null,'Avulsas',1,2,30000,'cash',1,false,'Teste');
 perform public.admin_add_student_classes(op,s,null,'Avulsas',1,2,30000,'cash',1,false,'Teste');
 if (select count(*) from public.package_requests where id=op)<>1 then raise exception 'Duplicação';end if;
 if exists(select 1 from public.credit_grants where request_id=op) then raise exception 'Pendente liberou créditos';end if;
 perform public.confirm_manual_package_payment(op,'Pix conferido');
 if not exists(select 1 from public.credit_grants where request_id=op and lessons_a=1 and lessons_b=2) then raise exception 'Confirmação não liberou quantidade manual';end if;
 perform public.admin_add_student_classes(op2,s,p,'Nome adulterado',99,99,30000,'cash',1,true,'Confirmado');
 if not exists(select 1 from public.credit_grants where request_id=op2 and lessons_a=0 and lessons_b=2) then raise exception 'Pacote aceitou quantidade do navegador';end if;
 denied:=false;
 begin perform public.admin_add_student_classes(op2,s,p,'Outra entrada',0,2,30000,'cash',1,true,'Outro');exception when others then denied:=true;end;
 if not denied then raise exception 'Identificador reutilizado com dados diferentes';end if;
 execute 'reset role';
end $$;
rollback;
