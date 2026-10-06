-- Execute após 202610060001. Desfaz todos os dados deste teste.
begin;
do $$
declare admin_id uuid:=gen_random_uuid(); test_user uuid:=gen_random_uuid();
 test_student uuid; test_package uuid; test_request uuid; failed boolean;
begin
 insert into auth.users(id,email,raw_user_meta_data) values
 (admin_id,admin_id||'@example.invalid','{"name":"Teste admin"}'),
 (test_user,test_user||'@example.invalid','{"name":"Teste arquivado"}');
 insert into habilita_private.user_roles(user_id,role) values(admin_id,'admin');
 select s.id into test_student from public.students s where s.user_id=test_user;
 update public.students set active=false where id=test_student;
 insert into public.packages(slug,name,category,lessons_b,price_cents)
 values(gen_random_uuid()::text,'Teste recusa','B',2,29900) returning id into test_package;
 insert into public.package_requests(student_id,package_id,package_name,lessons_a,lessons_b,price_cents)
 values(test_student,test_package,'Teste recusa',0,2,29900) returning id into test_request;
 perform set_config('request.jwt.claim.sub',test_user::text,true);
 execute 'set local role authenticated';
 failed:=false;
 begin perform public.resolve_package(test_request,false,'Tentativa aluno'); exception when others then failed:=true; end;
 if not failed then raise exception 'Aluno conseguiu decidir pedido'; end if;
 execute 'reset role';
 perform set_config('request.jwt.claim.sub',admin_id::text,true);
 execute 'set local role authenticated';
 failed:=false;
 begin perform public.resolve_package(test_request,true,'Tentativa aprovação'); exception when others then failed:=true; end;
 if not failed then raise exception 'Aprovação de aluno inativo aceita'; end if;
 perform public.resolve_package(test_request,false,'Aluno arquivado');
 if not exists(select 1 from public.package_requests where id=test_request and status='rejected' and resolved_by=admin_id) then raise exception 'Recusa não registrada'; end if;
 if exists(select 1 from public.credit_grants where student_id=test_student) then raise exception 'Recusa gerou crédito'; end if;
 failed:=false;
 begin perform public.resolve_package(test_request,false,'Repetição'); exception when others then failed:=true; end;
 if not failed then raise exception 'Pedido finalizado alterado'; end if;
 execute 'reset role';
end $$;
rollback;
select 'Recusa de aluno arquivado verificada; dados de teste desfeitos.' as resultado;
