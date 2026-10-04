import { test, expect } from "@playwright/test";

test("pacotes comparáveis com condições acessíveis pelo teclado", async ({page}) => {
  await page.goto('/#pacotes');
  await expect(page.locator('#pacotes article')).toHaveCount(3);
  const car=page.locator('article[data-category="B"]');
  await expect(car.getByText('R$ 299,00 à vista',{exact:true})).toBeVisible();
  await car.locator('summary').focus();await page.keyboard.press('Enter');
  await expect(car.locator('details')).toHaveAttribute('open','');
  await expect(car).toContainText('12x');
  await expect(car).toContainText('Total parcelado: R$ 358,80');
  await expect(car).toContainText('02 aulas de carro');
  await expect(page.locator('article[data-category="A"]')).toContainText('R$ 169,90');
  await expect(page.locator('article[data-category="A+B"]')).toContainText('02 aulas de carro + 02 aulas de moto');
  await expect(page.locator('article[data-category="A+B"]')).toContainText('R$ 399,99');
});

test("edições do pacote refletem no catálogo sem restaurar ofertas excluídas",async({page,context})=>{
  await page.goto('/admin?view=site');
  const publicPage=await context.newPage();await publicPage.goto('/#pacotes');
  await page.getByRole('button',{name:'Editar Pacote Carro e Moto',exact:true}).click();
  await page.getByLabel('Aulas de carro',{exact:true}).fill('3');
  await page.getByLabel('Aulas de moto',{exact:true}).fill('2');
  await page.getByLabel('Preço (R$)',{exact:true}).fill('450');
  await page.getByLabel('Parcelas no cartão',{exact:true}).fill('4');
  await page.getByRole('button',{name:'Salvar pacote',exact:true}).click();
  const card=publicPage.locator('article[data-category="A+B"]');
  await expect(card).toContainText('03 aulas de carro + 02 aulas de moto');
  await expect(card).toContainText('R$ 450,00');
  await card.locator('summary').click();await expect(card).toContainText('12x');
  page.once('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Excluir Pacote Carro e Moto',exact:true}).click();
  await expect(card).toHaveCount(0);
  await publicPage.reload();await expect(publicPage.locator('#pacotes article')).toHaveCount(2);
});
