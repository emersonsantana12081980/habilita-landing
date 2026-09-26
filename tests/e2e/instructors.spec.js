import { test, expect } from "@playwright/test";
test("cadastro e inativação de instrutor atualizam a página pública", async ({
  page,
  context,
}) => {
  await page.goto("/admin?view=site");
  await page.getByLabel("Nome do instrutor", { exact: true }).fill("Ana Teste");
  await page
    .getByLabel("Categorias do instrutor", { exact: true })
    .selectOption("B");
  await page
    .getByRole("button", { name: "Salvar instrutor", exact: true })
    .click();
  const publicPage = await context.newPage();
  await publicPage.goto("/#instrutores");
  await expect(
    publicPage.getByRole("heading", { name: "Ana Teste", exact: true }),
  ).toBeVisible();
  await publicPage
    .getByLabel("Filtrar instrutores por categoria")
    .selectOption("A");
  await expect(
    publicPage.getByRole("heading", { name: "Ana Teste", exact: true }),
  ).toHaveCount(0);
  await publicPage
    .getByLabel("Filtrar instrutores por categoria")
    .selectOption("B");
  await publicPage
    .getByRole("button", {
      name: "Selecionar instrutor Ana Teste",
      exact: true,
    })
    .click();
  await expect(
    publicPage.getByText("Instrutor escolhido: Ana Teste"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Editar instrutor Ana Teste" })
    .click();
  await page
    .getByLabel("Status do instrutor", { exact: true })
    .selectOption("false");
  await page
    .getByRole("button", { name: "Salvar instrutor", exact: true })
    .click();
  await expect(
    publicPage.getByRole("heading", { name: "Ana Teste", exact: true }),
  ).toHaveCount(0);
  await expect(
    publicPage.getByText("Instrutor escolhido: Ana Teste"),
  ).toHaveCount(0);
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Excluir instrutor Ana Teste" })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Editar instrutor Ana Teste" }),
  ).toHaveCount(0);
});
