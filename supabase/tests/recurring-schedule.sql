-- Executar após a migração 003. Nada deste teste fica salvo.
begin;
do $$
declare i uuid; v uuid; r uuid; d date := (now() at time zone 'America/Sao_Paulo')::date+60; n integer; first_id uuid;
begin
 insert into public.instructors(slug,name,category) values(gen_random_uuid()::text,'Teste rotina','B') returning id into i;
 insert into public.vehicles(slug,name,category) values(gen_random_uuid()::text,'Teste veículo','B') returning id into v;
 insert into public.schedule_rules(instructor_id,vehicle_id,category,weekdays,opens,closes,lunch_start,lunch_end,duration,gap,horizon)
 values(i,v,'B',array[0,1,2,3,4,5,6],'08:00','12:00','10:00','11:00',50,10,90) returning id into r;
 -- Remove bloqueios apenas dentro da transação, para não depender dos dados do dono.
 delete from public.schedule_exceptions where day in(d,d+1);
 perform habilita_private.ensure_day(d);
 select count(*) into n from public.availability_slots where rule_id=r and active;
 if n<>3 then raise exception 'Esperados 3 horários fora do almoço, encontrados %',n; end if;
 select id into first_id from public.availability_slots where rule_id=r order by starts_at limit 1;
 perform habilita_private.ensure_day(d);
 select count(*) into n from public.availability_slots where rule_id=r;
 if n<>3 then raise exception 'A consulta duplicou horários'; end if;
 update public.availability_slots set manually_blocked=true,active=false where id=first_id;
 perform habilita_private.ensure_day(d);
 if exists(select 1 from public.availability_slots where id=first_id and active) then raise exception 'Bloqueio individual perdido'; end if;
 perform habilita_private.ensure_day(d+1);
 select count(*) into n from public.availability_slots where rule_id=r and active and (starts_at at time zone 'America/Sao_Paulo')::date=d+1;
 if n<>3 then raise exception 'O próximo dia não foi gerado'; end if;
 insert into public.schedule_exceptions(day,reason) values(d,'Feriado de teste');
 perform habilita_private.ensure_day(d);
 if exists(select 1 from public.availability_slots where rule_id=r and active and (starts_at at time zone 'America/Sao_Paulo')::date=d) then raise exception 'Feriado não bloqueado'; end if;
 update public.schedule_rules set active=false where id=r;
 perform habilita_private.ensure_day(d+1);
 if exists(select 1 from public.availability_slots where rule_id=r and active) then raise exception 'Pausa não aplicada'; end if;
 update public.schedule_rules set active=true,horizon=7 where id=r;
 perform habilita_private.ensure_day(d+1);
 if exists(select 1 from public.availability_slots where rule_id=r and active) then raise exception 'Janela de antecedência ignorada'; end if;
end $$;
rollback;
select 'Rotina, almoço, renovação, bloqueios e janela verificados. Dados de teste desfeitos.' as resultado;
