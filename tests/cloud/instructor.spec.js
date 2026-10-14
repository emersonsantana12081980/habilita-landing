import { test, expect } from '@playwright/test';
async function setup(page, mode = 'ok') {
  const user = { id: '11111111-1111-4111-8111-111111111111', email: 'instrutor@example.com', aud: 'authenticated', role: 'authenticated' };
  const jwt = [ { alg: 'HS256', typ: 'JWT' }, { sub: user.id, exp: Math.floor(Date.now()/1000)+3600, aud: 'authenticated' } ].map(v => Buffer.from(JSON.stringify(v)).toString('base64url')).join('.')+'.signature';
  const start = new Date(); start.setDate(start.getDate()+1);
  await page.route('https://test.supabase.co/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/token')) return route.fulfill({json:{access_token:jwt,refresh_token:'refresh',expires_in:3600,token_type:'bearer',user}});
    if (path.endsWith('/user')) return route.fulfill({json:user});
    if (path.endsWith('/instructor_portal')) {
      expect(route.request().postDataJSON()).toEqual({});
      if (mode === 'denied') return route.fulfill({status:403,json:{message:'instructor_access_required'}});
      if (mode === 'missing') return route.fulfill({status:404,json:{message:'function missing'}});
      return route.fulfill({json:{instructor:{name:'Instrutor Teste',category:'B',city:'Caçapava'},lessons:mode === 'empty' ? [] : [
        {id:'l1',student_id:'s1',student_name:'Aluno Vinculado',vehicle_name:'Carro de aula',category:'B',starts_at:start.toISOString(),ends_at:new Date(+start+3000000).toISOString(),status:'scheduled'},
        {id:'l2',student_id:'s1',student_name:'Aluno Histórico',vehicle_name:'Carro de aula',category:'B',starts_at:'2026-01-01T12:00:00Z',ends_at:'2026-01-01T12:50:00Z',status:'completed'}
      ]}});
    }
    return route.fulfill({json:{}});
  });
  await page.goto('/instrutor');
  await page.getByLabel('E-mail',{exact:true}).fill(user.email);
  await page.getByLabel('Senha',{exact:true}).fill('teste123456');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
}
test('instrutor consulta agenda e histórico com login e sai sem dados na tela', async ({page}, testInfo) => {
  await setup(page);
  await expect(page.getByRole('heading',{name:'Olá, Instrutor!'})).toBeVisible();
  await expect(page.getByRole('region',{name:'Agenda da semana'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({path:`artifacts/instructor-${testInfo.project.name}.png`,fullPage:true});
  await page.locator('.instructor-lesson').filter({hasText:'Aluno Vinculado'}).click();
  await expect(page.getByRole('region',{name:'Detalhes da aula'})).toContainText('Carro de aula');
  await page.getByRole('button',{name:'Fechar detalhes'}).click();
  await page.getByRole('navigation',{name:'Menu do instrutor'}).getByRole('button',{name:'Histórico'}).click();
  await expect(page.locator('.instructor-lesson')).toHaveCount(1);
  await expect(page.locator('.instructor-lesson')).toContainText('Aluno Histórico');
  await page.getByRole('button',{name:'Sair',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Entrar na área do instrutor'})).toBeVisible();
  await expect(page.getByText('Aluno Histórico')).toHaveCount(0);
});
for (const mode of ['denied','missing','empty']) test(`instrutor trata acesso ${mode} sem inventar aulas`,async ({page}) => {
  await setup(page,mode);
  if(mode==='empty') await expect(page.getByText('Nenhuma aula agendada neste período.',{exact:false})).toBeVisible();
  else await expect(page.getByRole('alert')).toContainText(mode==='denied'?'vinculada a um instrutor ativo':'configuração da área do instrutor');
  await expect(page.locator('.instructor-lesson')).toHaveCount(0);
});
