import { test, expect } from '@playwright/test';
test('categorias mostram três experiências e preservam escolha e WhatsApp', async ({page},info)=>{
  await page.route('https://test.supabase.co/**',route=>{
    const path=new URL(route.request().url()).pathname;
    return route.fulfill({json:path.endsWith('/site_settings') ? {city:'Caçapava',whatsapp:'5512996225250',ai_enabled:false} : path.endsWith('/packages') ? [{id:'demo',name:'Pacote de demonstração',category:'B',active:true,price_cents:29900,pricing_demo:true,lessons_a:0,lessons_b:2}] : []});
  });
  await page.addInitScript(()=>{window.openedLinks=[];window.open=(url)=>{window.openedLinks.push(url);return null;};});
  await page.goto('/');
  const section=page.locator('#pacotes');
  for(const [id,label] of [['B','Carro — Categoria B'],['A','Moto — Categoria A'],['A+B','Carro e moto — Categorias A/B']]) {
    await section.getByRole('button',{name:label,exact:true}).click();
    await expect(section.locator('article')).toHaveCount(3);
    await expect(section.locator(`article[data-category="${id}"]`)).toHaveCount(3);
    await expect(section).not.toContainText('R$');
    for(const level of ['experiencia','base','zero']) {
      const card=section.locator(`[data-experience="${level}"]`);
      await card.getByText('Ver condições',{exact:true}).click();
      await expect(card).toContainText('ainda precisam ser definidos');
      await card.getByText('Ver condições',{exact:true}).click();
      await card.getByRole('button',{name:'Conversar sobre este plano'}).click();
      const last=new URL(await page.evaluate(()=>window.openedLinks.at(-1)));
      expect(last.hostname).toBe('wa.me');expect(last.pathname).toBe('/5512996225250');
      expect(last.searchParams.get('text')).toContain(label);
      expect(last.searchParams.get('text')).toContain(await card.locator('h4').textContent());
      const link=await card.getByRole('link',{name:'Cadastre-se grátis'}).getAttribute('href');
      const params=new URL(link,'https://example.com').searchParams;
      expect(params.get('categoria')).toBe(id);expect(params.get('experiencia')).toBe(level);expect(params.has('pacote')).toBe(false);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  }
  await section.getByRole('button',{name:'Carro — Categoria B',exact:true}).focus();
  await page.keyboard.press('Enter');
  await expect(section.getByRole('button',{name:'Carro — Categoria B',exact:true})).toHaveAttribute('aria-pressed','true');
  await section.screenshot({path:`artifacts/experience-${info.project.name}.png`});
  await section.locator('[data-experience="base"]').getByRole('link',{name:'Cadastre-se grátis'}).click();
  await expect(page.getByRole('complementary',{name:'Sua escolha de aulas'})).toContainText('Tenho alguma base');
  await expect(page.getByRole('complementary',{name:'Sua escolha de aulas'})).toContainText('Carro — Categoria B');
  await page.getByRole('link',{name:'Já tenho conta. Entrar'}).click();
  await expect(page.getByRole('complementary',{name:'Sua escolha de aulas'})).toContainText('Tenho alguma base');
});
