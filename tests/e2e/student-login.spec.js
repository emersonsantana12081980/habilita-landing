import { test, expect } from "@playwright/test";
test("login separado, saída, recuperação demonstrativa e perfil", async ({
  page,
}, info) => {
  await page.goto("/aluno");
  await expect(
    page.getByRole("heading", { name: "Bom ter você de volta." }),
  ).toBeVisible();
  await expect(page.getByLabel("Seu nome", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Retomar cadastro de teste")).toHaveCount(0);
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Nenhum e-mail foi enviado",
  );
  await page.goto("/");
  await page
    .getByRole("link", { name: "Criar minha conta grátis", exact: true })
    .click();
  await expect(page).toHaveURL(/\/cadastro$/);
  await page.getByLabel("Seu nome").fill("Teste Login");
  await page.getByLabel("Seu e-mail").fill("login@example.com");
  await page.getByLabel("Seu WhatsApp").fill("11999999999");
  await page.getByRole("button", { name: "Criar meu cadastro grátis" }).click();
  await expect(page).toHaveURL(/\/aluno$/);
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await page.getByLabel("E-mail de acesso").fill("login@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("incorreta");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Confira");
  await page.getByLabel("Senha", { exact: true }).fill("habilita-demo");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  for (const label of ["Início", "Meus pacotes", "Minhas aulas", "Meu perfil"])
    await expect(
      page.getByRole("button", { name: label, exact: true }),
    ).toBeVisible();
  await page.getByRole("button", { name: "Meu perfil", exact: true }).click();
  await page.getByLabel("Nome no perfil").fill("Teste Atualizado");
  await page.getByRole("button", { name: "Salvar meus dados" }).click();
  await expect(page.getByRole("status")).toContainText("atualizados");
  await page.getByRole("button", { name: "Início", exact: true }).click();
  await page.screenshot({
    path: `artifacts/${info.project.name}-aluno-inicio.png`,
    fullPage: true,
  });
  await page.reload();
  await page.getByRole("button", { name: "Meu perfil", exact: true }).click();
  await expect(page.getByLabel("Nome no perfil")).toHaveValue(
    "Teste Atualizado",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
