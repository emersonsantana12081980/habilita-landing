import { test, expect } from "@playwright/test";

test("ofertas iniciais recolhidas, expansão e agendamento", async ({
  page,
}, testInfo) => {
  await page.goto("/#categorias");
  const cards = page.locator("#categorias details");
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all())
    await expect(card).not.toHaveAttribute("open", "");
  await page.locator("#categorias img").evaluateAll((images) =>
    Promise.all(
      images.map((i) => {
        i.loading = "eager";
        return i.decode();
      }),
    ),
  );
  await page
    .locator("#categorias")
    .screenshot({
      path: `artifacts/${testInfo.project.name}-categorias-fechadas.png`,
    });
  const car = page.locator('details[data-category="B"]');
  await car.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(car).toHaveAttribute("open", "");
  await expect(car.getByText("R$ 299,00", { exact: true })).toBeVisible();
  for (const text of [
    "02 aulas de carro",
    "Veículo para o exame",
    "Reteste grátis",
    "3x no cartão de crédito",
    "6x no boleto",
  ])
    await expect(car.getByText(text, { exact: true })).toBeVisible();
  await car.getByRole("button", { name: "GARANTIR MEU PACOTE" }).click();
  await expect(
    page.getByRole("dialog", { name: "Pacote Carro" }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("R$ 299,00", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar agendamento" }).click();
  await car.locator("summary").click();
  await expect(car).not.toHaveAttribute("open", "");
  const moto = page.locator('details[data-category="A"]');
  await moto.locator("summary").click();
  await expect(moto.getByText("R$ 169,90", { exact: true })).toBeVisible();
  const both = page.locator('details[data-category="A/B"]');
  await both.locator("summary").click();
  await expect(
    both.getByText("02 aulas de carro + 02 aulas de moto", { exact: true }),
  ).toBeVisible();
  await expect(both.getByText("R$ 399,99", { exact: true })).toBeVisible();
  await page
    .locator("#categorias")
    .screenshot({
      path: `artifacts/${testInfo.project.name}-categorias-abertas.png`,
    });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("edições do pacote refletem nas categorias sem restaurar ofertas excluídas", async ({
  page,
  context,
}) => {
  await page.goto("/admin");
  await expect(page.getByText("Pacotes cadastrados (3)")).toBeVisible();
  const publicPage = await context.newPage();
  await publicPage.goto("/");
  await publicPage.locator('details[data-category="A/B"] summary').click();
  await page
    .getByRole("button", { name: "Editar Pacote Carro e Moto", exact: true })
    .click();
  await page.getByLabel("Aulas de carro", { exact: true }).fill("3");
  await page.getByLabel("Aulas de moto", { exact: true }).fill("2");
  await page.getByLabel("Preço (R$)", { exact: true }).fill("450");
  await page.getByLabel("Reteste grátis", { exact: true }).uncheck();
  await page.getByLabel("Parcelas no cartão", { exact: true }).fill("4");
  await page
    .getByRole("button", { name: "Salvar pacote", exact: true })
    .click();
  const card = publicPage.locator('details[data-category="A/B"]');
  await expect(
    card.getByText("03 aulas de carro + 02 aulas de moto", { exact: true }),
  ).toBeVisible();
  await expect(card.getByText("R$ 450,00", { exact: true })).toBeVisible();
  await expect(
    card.getByText("4x no cartão de crédito", { exact: true }),
  ).toBeVisible();
  await expect(card.getByText("Reteste grátis", { exact: true })).toHaveCount(
    0,
  );
  await page.reload();
  await expect(page.getByText("Pacotes cadastrados (3)")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Excluir Pacote Carro e Moto", exact: true })
    .click();
  await page.reload();
  await expect(page.getByText("Pacotes cadastrados (2)")).toBeVisible();
  await expect(
    card.getByRole("button", { name: "CONSULTAR NO WHATSAPP" }),
  ).toBeVisible();
});
