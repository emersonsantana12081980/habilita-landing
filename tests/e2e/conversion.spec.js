import { test, expect } from "@playwright/test";

test("preço fechado e WhatsApp carregam o pacote escolhido", async ({
  page,
}) => {
  await page.goto("/#categorias");
  await page.evaluate(() => {
    window.open = (url) => {
      window.lastContact = url;
    };
  });
  const card = page.locator('details[data-category="B"]');
  await expect(card.locator("summary")).toContainText("À vista R$ 299,00");
  await expect(card.locator("summary")).toContainText("Ver pacote e valores");
  await card.locator("summary").click();
  await card
    .getByRole("button", { name: "Quero este pacote no WhatsApp" })
    .click();
  const url = new URL(await page.evaluate(() => window.lastContact));
  expect(url.hostname).toBe("wa.me");
  expect(url.pathname).toBe("/5512996225250");
  expect(url.searchParams.get("text").replace(/\s/g, " ")).toContain(
    "Pacote Carro, de R$ 299,00 à vista",
  );
});

test("regras editáveis e depoimentos dependem de autorização", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#depoimentos")).toHaveCount(0);
  await page.goto("/admin?view=site");
  await page
    .getByRole("button", { name: "Editar Pacote Carro", exact: true })
    .click();
  await page
    .getByLabel("Condições do reteste grátis", { exact: true })
    .fill("Condição de teste: prazo de 30 dias.");
  await page
    .getByRole("button", { name: "Salvar pacote", exact: true })
    .click();
  await page.getByLabel("Nome para exibição").fill("Aluno de teste");
  await page
    .getByLabel("Texto do depoimento")
    .fill("Relato apenas para teste automatizado.");
  await page.getByRole("button", { name: "Salvar depoimento" }).click();
  await page.goto("/");
  await expect(page.locator("#depoimentos")).toHaveCount(0);
  await page.locator('details[data-category="B"] summary').click();
  await expect(page.locator('details[data-category="B"]')).toContainText(
    "Condição de teste: prazo de 30 dias.",
  );
  await page.goto("/admin?view=site");
  await page
    .getByRole("button", { name: "Editar depoimento de Aluno de teste" })
    .click();
  await page.getByLabel("Tenho autorização do aluno").check();
  await page.getByRole("button", { name: "Salvar depoimento" }).click();
  await page.goto("/");
  await expect(page.locator("#depoimentos")).toContainText(
    "Relato apenas para teste automatizado.",
  );
  await page.goto("/admin?view=site");
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Excluir depoimento de Aluno de teste" })
    .click();
  await page.goto("/");
  await expect(page.locator("#depoimentos")).toHaveCount(0);
});
