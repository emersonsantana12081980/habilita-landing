import {test,expect} from '@playwright/test';
async function setup(page){
 await page.route('https://test.supabase.co/**',route=>route.fulfill({json:new URL(route.request().url()).pathname.endsWith('/packages')?[{id:'p',name:'Pacote teste',category:'B',experience_level:'experiencia',price_cents:30000,active:true,lessons_b:2,lessons_a:0,card_total_cents:30000,card_installments:3}]:new URL(route.request().url()).pathname.endsWith('/site_settings')?{whatsapp:'5512996225250',ai_enabled:false}:[]}));
}
test('animações preservam conteúdo, teclado e redução de movimento',async({page,isMobile})=>{
 await setup(page);await page.goto('/');
 const card=page.locator('#pacotes article').first();await expect(card).toBeAttached();
 await card.getByRole('link',{name:'Cadastre-se',exact:false}).focus();
 await expect(card).not.toHaveClass(/hb-wait/);
 await expect(card).toHaveCSS('opacity','1');
 if(!isMobile){await page.locator('h1').first().click();await card.hover({position:{x:40,y:40}});await expect(card).toHaveClass(/hb-tilt/);}
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.hb-tilt,.hb-wait,.hb-pulse')).toHaveCount(0);
 await expect(card).toHaveCSS('opacity','1');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.evaluate(()=>window.habilitaAnimations.destroy());
 await expect(page.locator('style[data-habilita-anim]')).toHaveCount(0);
 await expect(card).not.toHaveClass(/hb-/);
});
test('redução de movimento inicial e portal não recebem efeitos',async({page})=>{
 await setup(page);await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await expect(page.locator('#pacotes article')).toHaveCount(1);
 await expect(page.locator('.hb-wait,.hb-tilt,.hb-reveal,.hb-pulse')).toHaveCount(0);
 await page.goto('/aluno');await expect(page.locator('.public-landing')).toHaveCount(0);
 await expect(page.locator('.hb-wait,.hb-tilt,.hb-reveal,.hb-pulse')).toHaveCount(0);
});
