import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("habilita-plus-v1"))
      localStorage.setItem(
        "habilita-plus-v1",
        JSON.stringify({
          instructorSeedVersion: 1,
          instructors: [],
          packageSeedVersion: 1,
          packages: [],
        }),
      );
  });
});

async function addInstructor(page, name, category = "A+B", active = true) {
  await page.getByLabel("Nome do instrutor", { exact: true }).fill(name);
  await page
    .getByLabel("Categorias do instrutor", { exact: true })
    .selectOption(category);
  await page
    .getByLabel("Status do instrutor", { exact: true })
    .selectOption(String(active));
  await page
    .getByLabel("Apresentação do instrutor")
    .fill("Aulas com paciência e atenção ao seu ritmo.");
  await page
    .getByRole("button", { name: "Salvar instrutor", exact: true })
    .click();
}

test("cadastro, seleção, agendamento e histórico de instrutores", async ({
  page,
  context,
}, testInfo) => {
  await page.goto("/admin?view=site");
  await addInstructor(page, "Ana Teste", "B");
  await addInstructor(page, "Bruno Teste", "A");
  await addInstructor(page, "Carla Teste", "A+B", false);
  await expect(page.getByText("Instrutores cadastrados (3)")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Instrutores cadastrados (3)")).toBeVisible();
  await page.getByLabel("Nome do pacote").fill("Pacote carro");
  await page.getByLabel("Preço (R$)").fill("350");
  await page.getByRole("button", { name: "Salvar pacote" }).click();
  await page.getByLabel("Data e hora").fill("2099-11-25T14:00");
  await page.getByRole("button", { name: "Liberar horário" }).click();
  const publicPage = await context.newPage();
  await publicPage.goto("/#instrutores");
  await expect(
    publicPage.getByRole("heading", { name: "Ana Teste", exact: true }),
  ).toBeVisible();
  await expect(
    publicPage.getByRole("heading", { name: "Carla Teste", exact: true }),
  ).toHaveCount(0);
  await publicPage
    .getByLabel("Filtrar instrutores por categoria")
    .selectOption("B");
  await expect(
    publicPage.getByRole("heading", { name: "Bruno Teste", exact: true }),
  ).toHaveCount(0);
  await publicPage
    .getByRole("button", {
      name: "Selecionar instrutor Ana Teste",
      exact: true,
    })
    .click();
  await expect(
    publicPage.getByText("Instrutor escolhido: Ana Teste"),
  ).toBeVisible();
  await publicPage
    .locator("#instrutores")
    .screenshot({ path: `artifacts/${testInfo.project.name}-instrutores.png` });
  await publicPage
    .getByRole("button", { name: "Agendar / garantir pacote" })
    .click();
  const chooser = publicPage.getByLabel("Instrutor de preferência");
  await expect(chooser.locator("option:checked")).toContainText("Ana Teste");
  await expect(chooser.locator("option")).toHaveCount(2);
  await publicPage.getByRole("button", { name: /25\/11\/2099/ }).click();
  await publicPage.getByLabel("Nome de demonstração").fill("Aluno Teste");
  await publicPage.getByLabel("Telefone de demonstração").fill("12999999999");
  await publicPage.getByRole("button", { name: "Solicitar horário" }).click();
  await expect(
    publicPage.getByRole("dialog").getByText("Instrutor: Ana Teste"),
  ).toBeVisible();
  await expect(
    page.getByText("Instrutor: Ana Teste", { exact: true }),
  ).toBeVisible();
  await publicPage.evaluate(() => {
    window.open = (url) => {
      window.contactUrl = url;
    };
  });
  await publicPage.getByRole("button", { name: "Enviar ao instrutor" }).click();
  expect(
    decodeURIComponent(await publicPage.evaluate(() => window.contactUrl)),
  ).toContain("Minha preferência de instrutor: Ana Teste.");
  await publicPage.getByRole("button", { name: "Fechar agendamento" }).click();
  await page
    .getByRole("button", { name: "Editar instrutor Ana Teste" })
    .click();
  await page
    .getByLabel("Nome do instrutor", { exact: true })
    .fill("Ana Atualizada");
  await page
    .getByRole("button", { name: "Salvar instrutor", exact: true })
    .click();
  await expect(
    publicPage.getByRole("heading", { name: "Ana Atualizada", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Instrutor: Ana Teste", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Editar instrutor Ana Atualizada" })
    .click();
  await page
    .getByLabel("Status do instrutor", { exact: true })
    .selectOption("false");
  await page
    .getByRole("button", { name: "Salvar instrutor", exact: true })
    .click();
  await expect(
    publicPage.getByRole("heading", { name: "Ana Atualizada", exact: true }),
  ).toHaveCount(0);
  await expect(
    publicPage.getByText("Instrutor escolhido: Ana Atualizada"),
  ).toHaveCount(0);
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Excluir instrutor Ana Atualizada" })
    .click();
  await expect(page.getByText("Instrutores cadastrados (2)")).toBeVisible();
  await expect(
    page.getByText("Instrutor: Ana Teste", { exact: true }),
  ).toBeVisible();
});

test("instrutor removido com o agendamento aberto exige nova escolha", async ({
  page,
  context,
}) => {
  await page.goto("/admin?view=site");
  await addInstructor(page, "Instrutor Temporário");
  await page.getByLabel("Nome do pacote").fill("Aula de carro");
  await page.getByLabel("Preço (R$)").fill("100");
  await page.getByRole("button", { name: "Salvar pacote" }).click();
  await page.getByLabel("Data e hora").fill("2099-10-20T11:00");
  await page.getByRole("button", { name: "Liberar horário" }).click();
  const publicPage = await context.newPage();
  await publicPage.goto("/");
  await publicPage
    .getByRole("button", { name: "Selecionar instrutor Instrutor Temporário" })
    .click();
  await publicPage
    .getByRole("button", { name: "Agendar / garantir pacote" })
    .click();
  await publicPage.getByRole("button", { name: /20\/10\/2099/ }).click();
  await publicPage.getByLabel("Nome de demonstração").fill("Aluno Teste");
  await publicPage.getByLabel("Telefone de demonstração").fill("12999999999");
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Excluir instrutor Instrutor Temporário" })
    .click();
  await expect(
    publicPage.getByRole("button", { name: "Solicitar horário" }),
  ).toBeDisabled();
  await publicPage.getByLabel("Instrutor de preferência").selectOption("");
  await publicPage.getByRole("button", { name: "Solicitar horário" }).click();
  await expect(
    publicPage.getByRole("dialog").getByText("Instrutor: Sem preferência"),
  ).toBeVisible();
});
