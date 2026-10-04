-- Execute inteiro após a migração 202610040001. Dados de teste desfeitos.
begin;
do $$
declare u uuid:=gen_random_uuid(); s uuid; p uuid; other_pack uuid; c uuid; r uuid;
 q record; failed boolean; test_code text:='T'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,15));
begin
 insert into auth.users(id,email,raw_user_meta_data) values(u,u||'@example.invalid','{"name":"Teste cupom"}');
 select id into s from public.students where user_id=u;
 insert into public.packages(slug,name,category,lessons_b,price_cents,card_total_cents,card_installments,pricing_demo)
 values(gen_random_uuid()::text,'Teste cupom','B',2,29900,35880,12,true) returning id into p;
 insert into public.packages(slug,name,category,lessons_b,price_cents)
 values(gen_random_uuid()::text,'Outro pacote','B',2,29900) returning id into other_pack;
 insert into public.coupons(code,kind,amount,package_id) values(test_code,'percent',10,p) returning id into c;
 perform set_config('request.jwt.claim.sub',u::text,true);
 select * into q from public.quote_package(p,lower(test_code),'card');
 if q.total_cents<>32292 or q.discount_cents<>3588 or q.installment_count<>12 then raise exception 'Cálculo parcelado incorreto'; end if;
 select * into q from public.quote_package(p,test_code,'cash');
 if q.total_cents<>26910 or q.installment_count<>1 then raise exception 'Cálculo à vista incorreto'; end if;
 failed:=false;
 begin perform public.quote_package(other_pack,test_code,'cash'); exception when others then failed:=true; end;
 if not failed then raise exception 'Cupom aceito em pacote incorreto'; end if;
 update public.coupons set expires_at=now()-interval '1 minute' where id=c;
 failed:=false;
 begin perform public.quote_package(p,test_code,'cash'); exception when others then failed:=true; end;
 if not failed then raise exception 'Cupom expirado aceito'; end if;
 update public.coupons set expires_at=null,active=false where id=c;
 failed:=false;
 begin perform public.quote_package(p,test_code,'cash'); exception when others then failed:=true; end;
 if not failed then raise exception 'Cupom inativo aceito'; end if;
 update public.coupons set active=true,kind='fixed',amount=1000 where id=c;
 select * into q from public.quote_package(p,test_code,'cash');
 if q.total_cents<>28900 then raise exception 'Desconto fixo incorreto'; end if;
 failed:=false;
 begin perform public.request_package_offer(p,test_code,'cash',1,1); exception when others then failed:=true; end;
 if not failed then raise exception 'Valor adulterado aceito'; end if;
 failed:=false;
 begin perform public.request_package_offer(p,test_code,'card',34880,6); exception when others then failed:=true; end;
 if not failed then raise exception 'Parcelamento desatualizado aceito'; end if;
 r:=public.request_package_offer(p,test_code,'cash',28900,1);
 if not exists(select 1 from public.package_requests where id=r and student_id=s and price_cents=28900 and coupon_code=test_code and discount_cents=1000) then raise exception 'Pedido sem desconto correto'; end if;
 failed:=false;
 begin perform public.request_package_offer(p,test_code,'cash',28900,1); exception when others then failed:=true; end;
 if not failed then raise exception 'Solicitação duplicada'; end if;
 update public.coupons set amount=2000 where id=c;
 if (select price_cents from public.package_requests where id=r)<>28900 then raise exception 'Pedido antigo alterado'; end if;
 if exists(select 1 from public.credit_grants where student_id=s) then raise exception 'Cupom liberou créditos'; end if;
 update public.packages set pricing_demo=false where id=p;
 failed:=false;
 begin perform public.quote_package(p,test_code,'cash'); exception when others then failed:=true; end;
 if not failed then raise exception 'Cupom fictício aceito em pacote real'; end if;
 -- Testar permissões reais do aluno, sem privilégios do SQL Editor.
 execute 'set local role authenticated';
 if exists(select 1 from public.coupons) then raise exception 'Aluno consegue listar cupons'; end if;
 failed:=false;
 begin insert into public.coupons(code,kind,amount) values(test_code||'X','percent',90); exception when others then failed:=true; end;
 if not failed then raise exception 'Aluno consegue criar cupom'; end if;
 execute 'reset role';
end $$;
rollback;
select 'Preços e cupons verificados; dados de teste desfeitos.' as resultado;
