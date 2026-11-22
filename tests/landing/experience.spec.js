import { test, expect } from '@playwright/test';
test('landing destaca somente um básico por categoria e leva filtros ao portal',async({page},testInfo)=>{
 const packages=[
  {id:'b',name:'Carro básico',category:'B',experience_level:'experiencia',price_cents:29900},
  {id:'a',name:'Moto básico',category:'A',experience_level:'experiencia',price_cents:25990},
  {id:'ab',name:'Carro e Moto básico',category:'A+B',experience_level:'experiencia',price_cents:47999},
  {id:'extra',name:'Carro revisão maior',category:'B',experience_level:'experiencia',price_cents:59900},
  {id:'zero',name:'Começar do zero',category:'B',experience_level:'zero',price_cents:90000},
 ].map(p=>({...p,active:true,lessons_a:p.category!=='B'?2:0,lessons_b:p.category!=='A'?2:0,card_total_cents:p.price_cents,card_installments:4}));
 packages.push(...['A','B'].map(category=>({id:`avulsa-${category}`,name:`Aula avulsa ${category}`,category,experience_level:'experiencia',active:true,price_cents:9000,lessons_a:category==='A'?1:0,lessons_b:category==='B'?1:0})));
 packages.push({id:'licensed',name:'Reforço habilitado',category:'B',audience:'licensed',experience_level:'experiencia',active:true,price_cents:10000,lessons_b:2,lessons_a:0});
 await page.route('https://test.supabase.co/**',r=>r.fulfill({json:new URL(r.request().url()).pathname.endsWith('/packages')?packages:new URL(r.request().url()).pathname.endsWith('/instructors')?[{id:'emerson',slug:'emerson-santana',name:'Emerson Santana',active:true,category:'A+B'}]:[]}));
 await page.goto('/');const section=page.locator('#pacotes');
 await expect(page.getByRole('heading',{level:1})).toContainText('Suas aulas começam no celular');
 await expect(page.getByRole('link',{name:/Quero aulas para habilitados/})).toHaveAttribute('href','/habilitados');
 await expect(page.locator('.hero-video-frame iframe')).toHaveAttribute('src',/embed\/l_OCd2l2e6E/);
 await page.getByRole('button',{name:'Parar vídeo',exact:true}).click();
 await expect(page.locator('.hero-video-frame iframe')).toHaveCount(0);
 await page.getByRole('button',{name:'Reproduzir vídeo',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Seu instrutor encontra você no ponto escolhido.'})).toHaveCount(1);
 await expect(page.locator('#instrutores article')).toHaveCount(1);
 for(const file of ['MULHER','ENCONTRO','EMERSON']){
   const photo=page.locator(`img[src="/images/${file}%20.png"]`);
   await photo.scrollIntoViewIfNeeded();
   await expect.poll(()=>photo.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 }
 await expect(section.getByRole('button',{name:'Tenho interesse neste pacote'})).toHaveCount(3);
 await expect(section.locator('article')).toHaveCount(3);
 await expect(section.getByText(/Aula avulsa/)).toHaveCount(0);
 await expect(section.getByText('Reforço habilitado',{exact:true})).toHaveCount(0);
 await expect(section.locator('article').first()).toContainText('Carro básico');
 await expect(section.locator('article').first()).toContainText('299,00');
 await expect(section.getByRole('button',{name:'Vou começar do zero'})).toHaveCount(0);
 await expect(section.getByText('Carro revisão maior',{exact:true})).toHaveCount(0);
 await expect(section.getByRole('link',{name:'Ver pacotes por experiência',exact:true})).toHaveAttribute('href','/aluno?catalogo=1');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:testInfo.outputPath('landing.png'),fullPage:true});
 await section.getByRole('link',{name:'Ver pacotes por experiência',exact:true}).click();
 await expect(page).toHaveURL(/\/aluno\?catalogo=1$/);
});
