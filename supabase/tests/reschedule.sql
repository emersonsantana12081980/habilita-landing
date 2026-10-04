-- Execute inteiro depois de 202609270002_reschedule_lesson.sql.
-- Os dados deste teste são desfeitos. Se ocorrer erro, execute ROLLBACK;.
begin;
do $$
declare u uuid:=gen_random_uuid(); student uuid; instructor uuid; vehicle uuid;
 pack uuid; request uuid; first_slot uuid; second_slot uuid; occupied_slot uuid;
 lesson uuid; failed boolean; grants_before bigint;
 t timestamptz:=(date_trunc('day',now() at time zone 'America/Sao_Paulo')+interval '4 days 8 hours') at time zone 'America/Sao_Paulo';
begin
 insert into auth.users(id,email,raw_user_meta_data) values(u,u||'@example.invalid','{"name":"Teste remarcação"}');
 select id into student from public.students where user_id=u;
 insert into public.instructors(slug,name,category) values(gen_random_uuid()::text,'Teste','B') returning id into instructor;
 insert into public.vehicles(slug,name,category) values(gen_random_uuid()::text,'Teste','B') returning id into vehicle;
 select id into pack from public.packages where category='B' limit 1;
 insert into public.package_requests(student_id,package_id,package_name,lessons_a,lessons_b,price_cents,status)
 values(student,pack,'Teste',0,3,100,'approved') returning id into request;
 insert into public.credit_grants(request_id,student_id,lessons_a,lessons_b,granted_by,reason)
 values(request,student,0,3,u,'Teste');
 delete from public.schedule_exceptions where day=(t at time zone 'America/Sao_Paulo')::date;
 update public.booking_settings set minimum_notice_hours=0,daily_limit=3 where id;
 insert into public.availability_slots(instructor_id,vehicle_id,category,starts_at,ends_at)
 values(instructor,vehicle,'B',t,t+interval '50 minutes') returning id into first_slot;
 insert into public.availability_slots(instructor_id,vehicle_id,category,starts_at,ends_at)
 values(instructor,vehicle,'B',t+interval '1 hour',t+interval '110 minutes') returning id into second_slot;
 insert into public.availability_slots(instructor_id,vehicle_id,category,starts_at,ends_at)
 values(instructor,vehicle,'B',t+interval '2 hours',t+interval '170 minutes') returning id into occupied_slot;
 perform set_config('request.jwt.claim.sub',u::text,true);
 lesson:=public.book_lesson(student,first_slot);
 perform public.book_lesson(student,occupied_slot);
 failed:=false;
 begin perform public.reschedule_lesson(lesson,second_slot); exception when others then failed:=true; end;
 if not failed then raise exception 'Aluno conseguiu editar como administrador'; end if;
 insert into habilita_private.user_roles(user_id,role) values(u,'admin');
 select count(*) into grants_before from public.credit_grants where student_id=student;
 failed:=false;
 begin perform public.reschedule_lesson(lesson,occupied_slot); exception when others then failed:=true; end;
 if not failed then raise exception 'Conflito não foi bloqueado'; end if;
 if not exists(select 1 from public.lessons where id=lesson and slot_id=first_slot) then raise exception 'Original alterado após falha'; end if;
 perform public.reschedule_lesson(lesson,second_slot);
 if not exists(select 1 from public.lessons where id=lesson and slot_id=second_slot and status='scheduled') then raise exception 'Remarcação falhou'; end if;
 if (select count(*) from public.lessons where student_id=student and status<>'cancelled')<>2 then raise exception 'Crédito reservado incorreto'; end if;
 if (select count(*) from public.credit_grants where student_id=student)<>grants_before then raise exception 'Créditos alterados'; end if;
 if (select count(*) from public.lesson_changes where lesson_id=lesson)<>1 then raise exception 'Histórico incorreto'; end if;
end $$;
rollback;
select 'Remarcação verificada. Dados de teste desfeitos.' as resultado;
