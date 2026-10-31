import {test,expect} from '@playwright/test';
test('ofertas confirmadas, condições e contato persistente sem conteúdo inventado',async({page},testInfo)=>{
 const pack={id:'confirmed',slug:'confirmado',name:'Oferta confirmada',active:true,offer_confirmed:true,pricing_demo:false,category:'B',experience_level:'experiencia',lessons_a:0,lessons_b:2,lesson_minutes_b:50,price_cents:30000,card_total_cents:33000,card_installments:3,card_contract:'Total inclui acréscimo de R$ 30.',exam_vehicle:false,exam_terms:'Veículo do exame contratado separadamente.',exclusions:'Taxas do Detran não incluídas.',cancellation_terms:'Avisar com 24 horas.',free_retest:true,retest_coverage:'Uma utilização do veículo no reteste.',retest_validity:'30 dias após o primeiro exame.',retest_uses:1,retest_costs:'Taxa do exame paga separadamente.'};
 await page.route('https://test.supabase.co/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  let body=[];
  if(path.endsWith('/packages'))body=[pack,{...pack,id:'draft',name:'Oferta não aprovada',offer_confirmed:false},{...pack,id:'fake',name:'Preço fictício',pricing_demo:true}];
  if(path.endsWith('/site_settings'))body={whatsapp:'5512999999999',commercial_info:{privacyUrl:'https://example.com/unreviewed',photos:[{url:'https://example.com/fake.jpg',caption:'Foto não autorizada'}],testimonials:[{name:'Inventado',text:'Aprovação garantida'}]}};
  await route.fulfill({json:body});
 });
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Oferta confirmada',exact:true})).toBeVisible();
 await expect(page.getByText('Oferta não aprovada',{exact:true})).toHaveCount(0);
 await expect(page.getByText('Preço fictício',{exact:true})).toHaveCount(0);
 await expect(page.getByText('Veículo do exame contratado separadamente.',{exact:true})).toBeVisible();
 await expect(page.getByText('30 dias após o primeiro exame.',{exact:false})).toBeVisible();
 await expect(page.locator('a[href="https://example.com/unreviewed"]')).toHaveCount(0);
 await expect(page.locator('img[src="https://example.com/fake.jpg"]')).toHaveCount(0);
 await expect(page.getByText('Aprovação garantida',{exact:true})).toHaveCount(0);
 if(testInfo.project.name==='mobile'){
  const cta=page.locator('.mobile-contact-bar').getByRole('button',{name:'Consultar horários e valores no WhatsApp'});
  await expect(cta).toBeInViewport();
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect(cta).toBeInViewport();
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
