-- Após a migração de melhorias. Executar inteiro como postgres no SQL Editor.
-- Tudo é desfeito ao terminar; se houver erro, execute ROLLBACK;.
begin;
do $$
declare u uuid:=gen_random_uuid(); other_user uuid:=gen_random_uuid(); student uuid;
 instructor uuid; vehicle uuid; pack uuid; request uuid; first_slot uuid; second_slot uuid;
 lesson uuid; failed boolean; start_time timestamptz:=(date_trunc('day',now() at time zone 'America/Sao_Paulo')+interval '4 days 8 hours') at time zone 'America/Sao_Paulo';
begin
 insert into auth.users(id,email,raw_user_meta_data) values(u,u||'@example.invalid','{"name":"Aluno teste regras"}');
 insert into auth.users(id,email,raw_user_meta_data) values(other_user,other_user||'@example.invalid','{"name":"Outro aluno"}');
 select id into student from public.students where user_id=u;
 insert into public.instructors(slug,name,category) values(gen_random_uuid()::text,'Instrutor teste','B') returning id into instructor;
 insert into public.vehicles(slug,name,category) values(gen_random_uuid()::text,'Veículo teste','B') returning id into vehicle;
 select id into pack from public.packages where category='B' limit 1;
 insert into public.package_requests(student_id,package_id,package_name,lessons_a,lessons_b,price_cents,status)
 values(student,pack,'Teste',0,3,100,'approved') returning id into request;
 insert into public.credit_grants(request_id,student_id,lessons_a,lessons_b,granted_by,reason)
 values(request,student,0,3,u,'Teste transacional');
 delete from public.schedule_exceptions where day=(start_time at time zone 'America/Sao_Paulo')::date;
 insert into public.availability_slots(instructor_id,vehicle_id,category,starts_at,ends_at)
 values(instructor,vehicle,'B',start_time,start_time+interval '50 minutes') returning id into first_slot;
 insert into public.availability_slots(instructor_id,vehicle_id,category,starts_at,ends_at)
 values(instructor,vehicle,'B',start_time+interval '1 hour',start_time+interval '110 minutes') returning id into second_slot;
 perform set_config('request.jwt.claim.sub',u::text,true);
 update public.booking_settings set minimum_notice_hours=168,daily_limit=1 where id;
 failed:=false;
 begin perform public.book_lesson(student,first_slot); exception when others then failed:=true; end;
 if not failed then raise exception 'Antecedência ignorada'; end if;
 update public.booking_settings set minimum_notice_hours=0 where id;
 lesson:=public.book_lesson(student,first_slot);
 failed:=false;
 begin perform public.book_lesson(student,second_slot); exception when others then failed:=true; end;
 if not failed then raise exception 'Limite diário ignorado'; end if;
 perform set_config('request.jwt.claim.sub',other_user::text,true);
 failed:=false;
 begin perform public.cancel_my_lesson(lesson); exception when others then failed:=true; end;
 if not failed then raise exception 'Outro aluno cancelou a aula'; end if;
 perform set_config('request.jwt.claim.sub',u::text,true);
 update public.booking_settings set cancellation_notice_hours=168 where id;
 failed:=false;
 begin perform public.cancel_my_lesson(lesson); exception when others then failed:=true; end;
 if not failed then raise exception 'Prazo de cancelamento ignorado'; end if;
 update public.booking_settings set cancellation_notice_hours=0 where id;
 perform public.cancel_my_lesson(lesson);
 if not exists(select 1 from public.lessons where id=lesson and status='cancelled') then raise exception 'Aula não cancelada'; end if;
 perform public.book_lesson(student,second_slot);
 perform public.update_my_profile('Nome corrigido','11999999999');
 if not exists(select 1 from public.students where id=student and name='Nome corrigido')
 or not exists(select 1 from public.profiles where id=u and name='Nome corrigido') then raise exception 'Perfil não sincronizado'; end if;
end $$;
rollback;
select 'Regras e cancelamento verificados. Dados de teste desfeitos.' as resultado;
