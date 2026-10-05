import { test, expect } from "@playwright/test";

async function catalog(page,{phone="5512996225250",multiple=false,empty=false}={}) {
  await page.addInitScript(() => {
    window.events=[]; window.contacts=[];
    window.open = url => {window.contacts.push(url);};
    window.addEventListener("habilita:conversion",e=>window.events.push(e.detail));
    window.vitals={cls:0};
    new PerformanceObserver(list=>{for(const e of list.getEntries()) if(!e.hadRecentInput) window.vitals.cls+=e.value;}).observe({type:"layout-shift",buffered:true});
    new PerformanceObserver(list=>{window.vitals.lcp=list.getEntries().at(-1)?.startTime;}).observe({type:"largest-contentful-paint",buffered:true});
  });
  await page.route("https://test.supabase.co/**",route=>{
    const path=new URL(route.request().url()).pathname;
    let json=[];
    if(path.endsWith("/site_settings"))json={city:"Caçapava",whatsapp:phone,ai_enabled:true};
    if(path.endsWith("/packages"))json=empty?[]:[
      {id:"moto",slug:"moto",name:"Pacote Moto",category:"A",lessons_a:2,lessons_b:0,price_cents:16990,exam_vehicle:true,free_retest:true,card_installments:3,boleto_installments:6,active:true},
      {id:"carro",slug:"carro",name:"Pacote Carro",category:"B",lessons_a:0,lessons_b:2,price_cents:29900,exam_vehicle:true,free_retest:true,card_installments:3,boleto_installments:6,active:true},
      {id:"ambos",slug:"ambos",name:"Pacote Carro e Moto",category:"A+B",lessons_a:2,lessons_b:2,price_cents:39999,exam_vehicle:true,free_retest:true,card_installments:3,boleto_installments:6,active:true},
    ];
    if(path.endsWith("/instructors"))json=[{id:"emerson",name:"Emerson Santana",category:"A+B",city:"Caçapava",photo_url:"/9f9ca8a1-0a11-4449-9b8b-b09d88bcb6d0.png",bio:"Há 15 anos, atuo como instrutor de trânsito e diretor-geral de CFC, contribuindo para a formação de mais de 5 mil alunos.",active:true},...(multiple?[{id:"ana",name:"Ana Teste",category:"A",city:"Outra cidade",active:true}]:[])];
    return route.fulfill({json});
  });
}

test("oferta única, condições honestas e WhatsApp por categoria",async({page},info)=>{
  await catalog(page);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/");
  await page.locator('.hero img').evaluate(img=>img.decode());
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:`artifacts/prd-${info.project.name}-hero.png`});
  await expect(page.locator("h1")).toContainText("Ganhe confiança para dirigir");
  await expect(page.locator("#pacotes article")).toHaveCount(3);
  if(info.project.name==='desktop'){
    const installments=await page.evaluate(async()=>{
      const {installmentText}=await import('/src/components/PublicPackages.jsx');
      return [installmentText(29900,3),installmentText(39999,6),installmentText(null,3)].map(x=>x?.replace(/\s/g,' ')??null);
    });
    expect(installments).toEqual(['2x de R$ 99,67 + 1x de R$ 99,66 · total R$ 299,00','3x de R$ 66,67 + 3x de R$ 66,66 · total R$ 399,99',null]);
  }
  await expect(page.getByRole("heading",{name:"Aprenda com quem entende do caminho."})).toBeVisible();
  await expect(page.getByLabel("Filtrar instrutores por categoria")).toHaveCount(0);
  await expect(page.locator(".hero").getByRole("link",{name:"Cadastre-se grátis"})).toHaveAttribute("href","/cadastro");
  for(const cat of ["A","B","A+B"]){
    const card=page.locator(`#pacotes article[data-category="${cat}"]`);
    await expect(card).toContainText("não é a CNH completa");
    await card.getByText("Ver condições",{exact:true}).click();
    await expect(card).toContainText("Valores fictícios para visualização");
    await expect(card).toContainText("12x");
    await expect(card).toContainText("Total parcelado:");
    await expect(card.getByRole("link",{name:"Cadastre-se grátis",exact:true})).toHaveAttribute("href", `/cadastro?pacote=${cat === "A" ? "moto" : cat === "B" ? "carro" : "ambos"}`);
  }
  await expect(page.locator("main")).not.toContainText("Reteste grátis");
  await expect(page.locator("#duvidas details")).toHaveCount(15);
  await page.getByText("O pacote inclui o processo completo da CNH?",{exact:true}).click();
  await expect(page.locator("#duvidas details[open]")).toContainText("Não representam o preço do processo completo");
  await page.getByRole("button",{name:"Falar com este instrutor"}).click();
  expect(await page.evaluate(()=>new URL(window.contacts.at(-1)).searchParams.get("text"))).toContain("Emerson Santana");
  await expect(page.locator("#prova-social")).toContainText("Ainda não há avaliações publicadas");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator("img").evaluateAll(imgs=>Promise.all(imgs.map(img=>{img.loading="eager";return img.decode();})));
  await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:"instant"});});
  await page.screenshot({path:`artifacts/prd-${info.project.name}.png`,fullPage:true});
  const events=await page.evaluate(()=>window.events);
  for(const name of ["page_view","package_view","package_conditions_open","faq_open"])expect(events.some(e=>e.event===name)).toBe(true);
  expect(JSON.stringify(events)).not.toContain("Emerson");
  expect(errors).toEqual([]);
  console.log(info.project.name,await page.evaluate(()=>window.vitals));
});

test("menu, fallback de contato e catálogo vazio",async({page})=>{
  await catalog(page,{phone:"",empty:true});await page.goto("/");
  await expect(page.getByText("Seu plano começa com uma conversa.")).toBeVisible();
  await expect(page.locator(".hero").getByRole("link",{name:"Cadastre-se grátis"})).toHaveAttribute("href","/cadastro");
  if(await page.getByRole("button",{name:"Abrir menu"}).isVisible()){
    await page.getByRole("button",{name:"Abrir menu"}).click();
    await expect(page.getByRole("navigation",{name:"Navegação móvel"})).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button",{name:"Abrir menu"})).toBeFocused();
  }
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://habilita-landing.vercel.app/");
});

test("vários instrutores filtram por categoria e região",async({page})=>{
  await catalog(page,{multiple:true});await page.goto("/#instrutores");
  await page.getByLabel("Filtrar instrutores por categoria").selectOption("B");
  await expect(page.getByRole("heading",{name:"Ana Teste",exact:true})).toHaveCount(0);
  await page.getByLabel("Filtrar instrutores por categoria").selectOption("A");
  await page.getByLabel("Região",{exact:true}).selectOption("Outra cidade");
  await expect(page.getByRole("heading",{name:"Ana Teste",exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Emerson Santana",exact:true})).toHaveCount(0);
});

 test("cadastro recebe pacote selecionado",async({page})=>{
  await catalog(page);await page.goto('/');
  await page.locator('#pacotes article[data-category="B"]').getByRole('link',{name:'Cadastre-se grátis',exact:true}).click();
  await expect(page).toHaveURL(/\/cadastro\?pacote=carro$/);
  await expect(page.getByLabel('E-mail',{exact:true})).toBeVisible();
 });
