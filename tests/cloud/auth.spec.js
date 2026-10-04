import { test, expect } from "@playwright/test";
const uid = "00000000-0000-4000-8000-000000000001";
const user = { id: uid, aud: "authenticated", role: "authenticated", email: "aluno@example.com", email_confirmed_at: "2026-01-01T00:00:00Z", user_metadata: {}, app_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
const jwt = () => [Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url"), Buffer.from(JSON.stringify({ sub: uid, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now()/1000)+3600 })).toString("base64url"), "testsignature"].join(".");
test('edição individual trata conflito e salva sem criar outra aula', async ({ page }) => {
  await mock(page, false, true);
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  let lesson = { id:'lesson1',student_id:'student1',instructor_id:'instructor1',vehicle_id:'vehicle1',category:'B',status:'scheduled',starts_at:day+'T08:00:00-03:00',ends_at:day+'T08:50:00-03:00' };
  let attempts = 0;
  await page.route('**/rest/v1/lessons*', route => route.fulfill({json:[lesson]}));
  await page.route('**/rest/v1/rpc/reschedule_options', route => route.fulfill({json:[{id:'slot2',instructor_id:'instructor1',vehicle_id:'vehicle1',starts_at:day+'T14:00:00-03:00',ends_at:day+'T14:50:00-03:00'}]}));
  await page.route('**/rest/v1/rpc/reschedule_lesson', route => {
    expect(route.request().postDataJSON()).toEqual({p_lesson:'lesson1',p_slot:'slot2'});
    attempts++;
    if(attempts===1)return route.fulfill({status:400,json:{code:'P0001',message:'Horário indisponível. A aula original foi mantida.'}});
    lesson={...lesson,starts_at:day+'T14:00:00-03:00',ends_at:day+'T14:50:00-03:00'};
    return route.fulfill({json:null});
  });
  await page.goto('/admin');
  await page.getByLabel('E-mail administrativo', {exact:true}).fill('admin@example.com');
  await page.getByLabel('Senha', {exact:true}).fill('senha-teste-123');
  await page.getByRole('button',{name:'Entrar no painel',exact:true}).click();
  await page.getByRole('button',{name:'Ver',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Aluno Teste');
  await expect(page.getByRole('dialog').getByRole('button',{name:'Cancelar aula',exact:true})).toBeVisible();
  await page.getByRole('dialog').getByRole('button',{name:'Editar agendamento',exact:true}).click();
  await expect(page.getByRole('dialog').getByLabel('Novo horário e instrutor')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'Editar agendamento',exact:true}).click();
  await page.getByLabel('Novo horário e instrutor').selectOption('slot2');
  await page.getByRole('button',{name:'Salvar alteração',exact:true}).click();
  await expect(page.getByText('Horário indisponível. A aula original foi mantida.',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'08:00 · Aluno Teste'})).toBeVisible();
  await page.getByLabel('Novo horário e instrutor').selectOption('slot2');
  await page.getByRole('button',{name:'Salvar alteração',exact:true}).click();
  await expect(page.getByRole('heading',{name:'14:00 · Aluno Teste'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Cancelar aula',exact:true})).toHaveCount(1);
  expect(attempts).toBe(2);
});
async function mock(page, broken = false, admin = false) {
  const calls = [];
  let rules = [], exceptions = [];
  let studentName='Aluno Teste';
  let packages=[{id:'package1',slug:'carro',name:'Pacote Carro',category:'B',lessons_a:0,lessons_b:2,price_cents:29900,card_total_cents:35880,pricing_demo:true,exam_vehicle:true,free_retest:true,retest_terms:'',card_installments:12,boleto_installments:6,active:true}];
  let bookingSettings={id:true,minimum_notice_hours:2,cancellation_notice_hours:24,daily_limit:2};
  await page.route("https://test.supabase.co/**", async route => {
    const req = route.request(), path = new URL(req.url()).pathname;
    calls.push({ path, body: req.postDataJSON() });
    let body = {}, status = 200;
    if (path.endsWith("/token")) {
      if (req.postDataJSON().password === "errada") { status = 400; body = { code: "invalid_credentials", error_code: "invalid_credentials", msg: "Invalid login credentials" }; }
      else body = { access_token: jwt(), refresh_token: "refresh-test", token_type: "bearer", expires_in: 3600, user };
    } else if (path.endsWith("/signup")) body = user;
    else if (path.endsWith("/user")) body = user;
    else if (path.includes("/rest/v1/")) {
      if(path.endsWith('/booking_settings')){if(req.method()==='PATCH')bookingSettings={...bookingSettings,...req.postDataJSON()};body=bookingSettings;}
      else if(path.endsWith('/packages')){if(req.method()==='PATCH')packages=[{...packages[0],...req.postDataJSON()}];body=packages;}
      else if(path.endsWith('/students')&&req.method()==='PATCH'){studentName=req.postDataJSON().name;body=null;}
      else if (path.endsWith('/schedule_rules')) {
        if (req.method() === 'POST') rules = [{...req.postDataJSON(),id:'rule1'}];
        body = rules;
      }
      else if (path.endsWith('/schedule_exceptions')) {
        if (req.method() === 'POST') exceptions = [req.postDataJSON()];
        body = exceptions;
      }
      else if (path.endsWith('/rpc/my_access_role')) body = admin ? 'admin' : 'student';
      else if (path.endsWith('/rpc/resolve_package') || path.endsWith('/rpc/publish_slot')) body = null;
      else if (broken) { status = 403; body = { message: "Access unavailable" }; }
      else if (admin && path.endsWith('/students') && !new URL(req.url()).searchParams.has('user_id')) body = [{id:'student1',name:studentName,category:'B',active:true,phone:'11999999999'}];
      else if (admin && path.endsWith('/instructors')) body = [{id:'instructor1',name:'Emerson',category:'A+B',active:true}];
      else if (admin && path.endsWith('/vehicles')) body = [{id:'vehicle1',name:'Fiat Mobi',category:'B',active:true}];
      else if (admin && path.endsWith('/package_requests')) body = [{id:'request1',student_id:'student1',package_name:'Pacote Carro',price_cents:29900,lessons_a:0,lessons_b:2,status:'pending'}];
      else if (path.endsWith("/students")) body = { id: "student1", name: "Aluno Teste", phone: "11999999999", active: true, category: "B" };
      else if (path.endsWith("/site_settings")) body = { whatsapp: "5512996225250", ai_enabled: false };
      else if (path.endsWith("/packages")) body = [{ id: "package1", name: "Pacote Carro", category: "B", lessons_a: 0, lessons_b: 2, price_cents: 29900 }];
      else body = [];
    }
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  return calls;
}

test('cupom inválido, troca de forma e revalidação antes de solicitar',async({page})=>{
  await mock(page);let failSubmit=true;const sent=[];
  await page.route('**/rest/v1/rpc/quote_package',route=>{
    const p=route.request().postDataJSON();
    if(p.p_coupon==='ERRADO')return route.fulfill({status:400,json:{code:'P0001',message:'Cupom inválido, expirado ou não aplicável a este pacote'}});
    const original=p.p_method==='cash'?29900:35880,discount=p.p_coupon?Math.round(original*.1):0;
    return route.fulfill({json:[{original_cents:original,discount_cents:discount,total_cents:original-discount,installment_count:p.p_method==='cash'?1:12,coupon_code:p.p_coupon||null,pricing_demo:true}]});
  });
  await page.route('**/rest/v1/rpc/request_package_offer',route=>{
    sent.push(route.request().postDataJSON());
    if(failSubmit){failSubmit=false;return route.fulfill({status:400,json:{code:'P0001',message:'Cupom inválido, expirado ou não aplicável a este pacote'}});}
    return route.fulfill({json:'request2'});
  });
  await page.goto('/aluno');
  await page.getByLabel('E-mail',{exact:true}).fill('aluno@example.com');
  await page.getByLabel('Senha',{exact:true}).fill('senha-teste-123');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.getByRole('button',{name:'Meus pacotes',exact:true}).click();
  await expect(page.getByText('Valores fictícios para visualização')).toBeVisible();
  await expect(page.getByRole('button',{name:'Solicitar pacote',exact:true})).toBeDisabled();
  await page.getByLabel('Cupom de desconto (opcional)').fill('ERRADO');
  await page.getByRole('button',{name:'Aplicar cupom',exact:true}).click();
  await expect(page.getByText('Cupom inválido, expirado ou não aplicável a este pacote')).toBeVisible();
  await page.getByLabel('Cupom de desconto (opcional)').fill('habilita10');
  await page.getByRole('button',{name:'Aplicar cupom',exact:true}).click();
  await expect(page.getByText('Total: R$ 322,92')).toBeVisible();
  await page.getByLabel('Forma de pagamento').selectOption('cash');
  await expect(page.getByRole('button',{name:'Solicitar pacote',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Aplicar cupom',exact:true}).click();
  await expect(page.getByText('Total: R$ 269,10')).toBeVisible();
  await page.getByRole('button',{name:'Solicitar pacote',exact:true}).click();
  await expect(page.getByText('Cupom inválido, expirado ou não aplicável a este pacote')).toBeVisible();
  await expect(page.getByRole('button',{name:'Solicitar pacote',exact:true})).toBeDisabled();
  await page.getByLabel('Cupom de desconto (opcional)').fill('');
  await page.getByRole('button',{name:'Conferir valor',exact:true}).click();
  await page.getByRole('button',{name:'Solicitar pacote',exact:true}).click();
  await expect(page.getByText('Solicitação enviada. Aguarde a liberação pela equipe.')).toBeVisible();
  expect(sent[0]).toEqual({p_package:'package1',p_coupon:'HABILITA10',p_method:'cash',p_expected_total:26910,p_expected_installments:1});
  expect(sent[1].p_coupon).toBe('');expect(sent[1].p_expected_total).toBe(29900);
});

test('administrador altera preços e cadastra cupom fixo',async({page})=>{
  const calls=await mock(page,false,true);let coupons=[];
  await page.route('**/rest/v1/coupons*',route=>{
    if(route.request().method()==='POST')coupons=[{...route.request().postDataJSON(),id:'coupon1'}];
    return route.fulfill({json:coupons});
  });
  await page.goto('/admin');
  await page.getByLabel('E-mail administrativo').fill('admin@example.com');
  await page.getByLabel('Senha',{exact:true}).fill('senha-teste-123');
  await page.getByRole('button',{name:'Entrar no painel',exact:true}).click();
  await page.getByRole('button',{name:'Catálogo',exact:true}).click();
  await page.getByRole('button',{name:'Editar',exact:true}).click();
  await page.getByLabel('Preço à vista (R$)').fill('300');
  await page.getByLabel('Valor total parcelado (R$)').fill('399.60');
  await page.getByLabel('Número de parcelas').fill('6');
  await page.getByRole('button',{name:'Salvar no site'}).click();
  await expect(page.getByText('Catálogo atualizado no banco.')).toBeVisible();
  const saved=calls.find(c=>c.path.endsWith('/packages')&&c.body?.card_total_cents===39960);
  expect(saved.body.price_cents).toBe(30000);expect(saved.body.card_installments).toBe(6);
  await page.getByLabel('Código do cupom').fill('TESTE50');
  await page.getByLabel('Tipo de desconto').selectOption('fixed');
  await page.getByLabel('Desconto (R$)').fill('50');
  await page.getByRole('button',{name:'Salvar cupom',exact:true}).click();
  await expect(page.getByRole('heading',{name:'TESTE50',exact:true})).toBeVisible();
  expect(coupons[0].amount).toBe(5000);expect(coupons[0].demo_only).toBe(true);
});

test('aluno vê próximas aulas compactas e histórico separado', async ({page}) => {
  await mock(page);
  const future = new Date(Date.now()+7*86400000).toISOString();
  await page.route('**/rest/v1/lessons*', route => route.fulfill({json:[
    {id:'future',student_id:'student1',category:'A',status:'scheduled',starts_at:future,ends_at:future},
    {id:'past',student_id:'student1',category:'B',status:'cancelled',starts_at:'2026-01-01T12:00:00Z'}
  ]}));
  await page.goto('/aluno');
  await page.getByLabel('E-mail',{exact:true}).fill('aluno@example.com');
  await page.getByLabel('Senha',{exact:true}).fill('senha-teste-123');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.getByRole('button',{name:'Minhas aulas',exact:true}).click();
  const list = page.getByRole('region',{name:'Lista de aulas'});
  await expect(list.getByText('Aula de moto',{exact:true})).toBeVisible();
  await expect(list.getByText('Aula de carro',{exact:true})).toHaveCount(0);
  await list.getByRole('button',{name:'Histórico (1)',exact:true}).click();
  await expect(list.getByText('Aula de carro',{exact:true})).toBeVisible();
  await expect(list.getByRole('button',{name:'Cancelar aula',exact:true})).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
test("cadastro envia senha ao Auth e aguarda confirmação, sem login fictício", async ({ page }) => {
  const calls = await mock(page);
  await page.goto("/cadastro");
  await page.getByLabel("Nome completo").fill("Novo Aluno");
  await page.getByLabel("WhatsApp com DDD").fill("11999999999");
  await page.getByLabel("E-mail", { exact: true }).fill("aluno@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha-teste-123");
  await page.getByLabel("Confirme a senha").fill("senha-teste-123");
  await page.getByRole("button", { name: "Criar conta grátis" }).click();
  await expect(page.getByRole("status")).toContainText("Confira seu e-mail");
  const sent = calls.find(c => c.path.endsWith("/signup"));
  expect(sent.body.data).toEqual({ name: "Novo Aluno", phone: "11999999999", category: "B" });
  expect(await page.evaluate(() => localStorage.getItem("habilita-plus-v1"))).toBeNull();
  await expect(page.getByRole("navigation", { name: "Área do aluno" })).toHaveCount(0);
});
test("login, recuperação, consulta de vagas sem crédito e saída", async ({ page }) => {
  const calls = await mock(page);
  await page.goto("/aluno");
  await page.getByLabel("E-mail", { exact: true }).fill("aluno@example.com");
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await expect(page.getByRole("status")).toContainText("Se houver uma conta");
  expect(calls.some(c => c.path.endsWith("/recover"))).toBeTruthy();
  await page.getByLabel("Senha", { exact: true }).fill("errada");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("E-mail ou senha incorretos");
  await page.getByLabel("Senha", { exact: true }).fill("senha-teste-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Olá, Aluno" })).toBeVisible();
  await page.getByRole("button", { name: "Agendar aula", exact: true }).click();
  await expect(page.getByText("Você pode consultar horários")).toBeVisible();
  await page.getByLabel("Dia", { exact: true }).fill("2027-01-15");
  await expect(page.getByText("Não há horários livres nessa data", { exact: false })).toBeVisible();
  expect(calls.some(c => c.path.endsWith("/book_lesson"))).toBeFalsy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Olá, Aluno" })).toHaveCount(0);
});
test("falha do banco não usa dados locais e admin não abre demonstração", async ({ page }) => {
  await mock(page, true);
  await page.goto("/aluno");
  await page.getByLabel("E-mail", { exact: true }).fill("aluno@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("senha-teste-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("Não conseguimos carregar sua conta.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Agendar aula", exact: true })).toHaveCount(0);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Acesso restrito" })).toBeVisible();
});

test('consulta de horários travada não bloqueia a configuração semanal', async ({page}) => {
  await mock(page,false,true);
  await page.route('**/rest/v1/rpc/available_slots', () => {});
  await page.goto('/admin');
  await page.getByLabel('E-mail administrativo',{exact:true}).fill('admin@example.com');
  await page.getByLabel('Senha',{exact:true}).fill('senha-teste-123');
  await page.getByRole('button',{name:'Entrar no painel',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Agendar para um aluno'})).toBeVisible();
  await page.getByRole('button',{name:'Configurar agenda',exact:true}).click();
  await expect(page.getByRole('button',{name:'Salvar e ativar rotina'})).toBeVisible();
});

test('calendário semanal, edição de aluno, catálogo público e regras persistidas',async({page})=>{
 const calls=await mock(page,false,true);
 await page.goto('/admin');
 await page.getByLabel('E-mail administrativo').fill('admin@example.com');
 await page.getByLabel('Senha',{exact:true}).fill('senha-teste-123');
 await page.getByRole('button',{name:'Entrar no painel',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Visão semanal'})).toBeVisible();
 await page.getByRole('button',{name:'Alunos',exact:true}).click();
 await page.getByRole('button',{name:'Editar aluno',exact:true}).click();
 await page.getByLabel('Nome',{exact:true}).fill('Aluno Atualizado');
 await page.getByRole('button',{name:'Salvar aluno'}).click();
 await expect(page.getByRole('heading',{name:'Aluno Atualizado'})).toBeVisible();
 expect(calls.find(c=>c.path.endsWith('/students')&&c.body?.name==='Aluno Atualizado').body).not.toHaveProperty('credits');
 await page.getByRole('button',{name:'Ver histórico'}).click();
 await expect(page.getByText('Nenhuma aula registrada.')).toBeVisible();
 await page.getByRole('button',{name:'Regras',exact:true}).click();
 await page.getByLabel('Máximo de aulas por aluno/dia').fill('3');
 await page.getByRole('button',{name:'Salvar regras'}).click();
 await expect(page.getByText('Regras salvas.',{exact:false})).toBeVisible();
 expect(calls.find(c=>c.path.endsWith('/booking_settings')&&c.body).body.daily_limit).toBe(3);
 await page.getByRole('button',{name:'Catálogo',exact:true}).click();
 await page.getByRole('button',{name:'Editar',exact:true}).click();
 await page.getByLabel('Nome',{exact:true}).fill('Pacote atualizado no banco');
 await page.getByRole('button',{name:'Salvar no site'}).click();
 await expect(page.getByText('Catálogo atualizado no banco.')).toBeVisible();
 await page.goto('/');
 await expect(page.locator('#pacotes').getByText('Pacote atualizado no banco',{exact:true})).toBeVisible();
});

test('administrador consulta alunos, decide pedidos e publica horário pelo servidor', async ({page}) => {
  const calls=await mock(page,false,true);
  await page.goto('/admin');
  await expect(page.getByRole('link',{name:'Área do aluno'})).toHaveCount(0);
  await page.getByLabel('E-mail administrativo',{exact:true}).fill('aluno@example.com');
  await page.getByLabel('Senha',{exact:true}).fill('senha-teste-123');
  await page.getByRole('button',{name:'Entrar no painel',exact:true}).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole('button',{name:'Alunos',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Aluno Teste',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Pedidos (1)',exact:true}).click();
  await page.getByLabel('Motivo da decisão').fill('Liberação manual autorizada');
  await page.getByRole('button',{name:'Aprovar e liberar créditos'}).click();
  await expect(page.getByRole('status')).toContainText('Pacote aprovado');
  expect(calls.find(c=>c.path.endsWith('/resolve_package')).body).toEqual({p_request:'request1',p_approve:true,p_reason:'Liberação manual autorizada'});
  await page.getByRole('button',{name:'Horários avulsos',exact:true}).click();
  await page.getByLabel('Data (horário de Brasília)').fill('2027-02-15');
  await page.getByRole('combobox',{name:'Instrutor',exact:true}).selectOption('instructor1');
  await page.getByRole('combobox',{name:'Veículo',exact:true}).selectOption('vehicle1');
  await page.getByRole('button',{name:'Liberar horário',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Horário liberado');
  expect(calls.find(c=>c.path.endsWith('/publish_slot')).body.p_start).toBe('2027-02-15T08:00:00-03:00');
  await page.getByRole('button',{name:'Configurar agenda',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Configurações da agenda'})).toBeVisible();
  await page.getByRole('combobox',{name:'Instrutor',exact:true}).selectOption('instructor1');
  await page.getByRole('combobox',{name:'Veículo',exact:true}).selectOption('vehicle1');
  await page.getByRole('checkbox',{name:'Sábado',exact:true}).check();
  await page.getByRole('button',{name:'Salvar e ativar rotina'}).click();
  await expect(page.getByText('Rotina salva.',{exact:false})).toBeVisible();
  const routine=calls.find(c=>c.path.endsWith('/schedule_rules') && c.body);
  expect(routine.body.weekdays).toEqual([1,2,3,4,5,6]);
  expect(routine.body.horizon).toBe(30);
  expect(routine.body.lunch_start).toBe('12:00');
  await page.getByLabel('Data bloqueada',{exact:true}).fill('2027-02-16');
  await page.getByLabel('Motivo',{exact:true}).fill('Folga');
  await page.getByRole('button',{name:'Bloquear data',exact:true}).click();
  await expect(page.getByText('16/02/2027 · Folga')).toBeVisible();
  await page.getByRole('button',{name:'Agenda',exact:true}).click();
  await page.getByRole('button',{name:'Configurar agenda',exact:true}).click();
  await expect(page.getByText('próximos 30 dias',{exact:false})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.getByRole('button',{name:'Sair da administração'}).click();
  await expect(page.getByRole('heading',{name:'Acesso administrativo'})).toBeVisible();
  await expect(page).toHaveURL(/\/admin$/);
});
