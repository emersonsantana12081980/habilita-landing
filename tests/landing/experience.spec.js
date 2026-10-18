import { test, expect } from '@playwright/test';
test('experience filters registered packages while preserving original price cards', async ({page}) => {
  const packages = [
    {id:'p1',name:'Carro inicial',category:'B',experience_level:'zero',price_cents:30000},
    {id:'p2',name:'Carro completo',category:'B',experience_level:'zero',price_cents:50000},
    {id:'p3',name:'Moto revisao',category:'A',experience_level:'experiencia',price_cents:20000},
    {id:'p4',name:'Pacote antigo',category:'B',experience_level:null,price_cents:10000},
  ].map(p => ({...p,active:true,lessons_a:p.category==='A'?2:0,lessons_b:p.category==='B'?2:0,card_total_cents:p.price_cents,card_installments:4}));
  await page.route('https://test.supabase.co/**', route => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({json:path.endsWith('/packages')?packages:path.endsWith('/site_settings')?{city:'Teste',whatsapp:'5512996225250',ai_enabled:false}:[]});
  });
  await page.goto('/');
  const section=page.locator('#pacotes');
  await expect(section.locator('article')).toHaveCount(1);
  await expect(section.locator('article')).toContainText('Moto revisao');
  await expect(section.getByRole('button',{name:'tenho experi',exact:false})).toHaveAttribute('aria-pressed','true');
  await section.getByRole('button',{name:'Vou come',exact:false}).click();
  await expect(section.locator('article')).toHaveCount(2);
  await expect(section.locator('article').filter({hasText:'Carro inicial'})).toContainText('300,00');
  await expect(section.locator('article').first().getByRole('link',{name:'Cadastre-se'})).toHaveAttribute('href','/cadastro?pacote=p1');
  await section.getByRole('button',{name:/^Moto/}).click();
  await expect(section.locator('article')).toHaveCount(0);
  await section.getByRole('button',{name:'Ver todos os pacotes'}).click();
  await expect(section.locator('article')).toHaveCount(4);
  await section.getByRole('button',{name:'tenho experi',exact:false}).click();
  await expect(section.locator('article')).toHaveCount(1);
  await expect(section.locator('article')).toContainText('200,00');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
