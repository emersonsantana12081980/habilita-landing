import { test, expect } from '@playwright/test';
test('landing destaca somente um básico por categoria e leva filtros ao portal',async({page})=>{
 const packages=[
  {id:'b',name:'Carro básico',category:'B',experience_level:'experiencia',price_cents:29900},
  {id:'a',name:'Moto básico',category:'A',experience_level:'experiencia',price_cents:25990},
  {id:'ab',name:'Carro e Moto básico',category:'A+B',experience_level:'experiencia',price_cents:47999},
  {id:'extra',name:'Carro revisão maior',category:'B',experience_level:'experiencia',price_cents:59900},
  {id:'zero',name:'Começar do zero',category:'B',experience_level:'zero',price_cents:90000},
 ].map(p=>({...p,active:true,lessons_a:p.category!=='B'?2:0,lessons_b:p.category!=='A'?2:0,card_total_cents:p.price_cents,card_installments:4}));
 packages.push(...['A','B'].map(category=>({id:`avulsa-${category}`,name:`Aula avulsa ${category}`,category,experience_level:'experiencia',active:true,price_cents:9000,lessons_a:category==='A'?1:0,lessons_b:category==='B'?1:0})));
 await page.route('https://test.supabase.co/**',r=>r.fulfill({json:new URL(r.request().url()).pathname.endsWith('/packages')?packages:[]}));
 await page.goto('/');const section=page.locator('#pacotes');
 await expect(section.locator('article')).toHaveCount(3);
 await expect(section.getByText(/Aula avulsa/)).toHaveCount(0);
 await expect(section.locator('article').first()).toContainText('Carro básico');
 await expect(section.locator('article').first()).toContainText('299,00');
 await expect(section.getByRole('button',{name:'Vou começar do zero'})).toHaveCount(0);
 await expect(section.getByText('Carro revisão maior',{exact:true})).toHaveCount(0);
 await expect(section.getByRole('link',{name:'Ver pacotes por experiência',exact:true})).toHaveAttribute('href','/aluno?catalogo=1');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await section.getByRole('link',{name:'Ver pacotes por experiência',exact:true}).click();
 await expect(page).toHaveURL(/\/aluno\?catalogo=1$/);
});
