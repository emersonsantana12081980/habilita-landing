import { test, expect } from "@playwright/test";
import { mockChatvolt } from "./chatvolt.fixture";
test("cadastro gratuito, liberação, crédito reservado e aviso ao instrutor", async ({
  page,
  context,
}, info) => {
  await mockChatvolt(page);
  await page.goto("/#categorias");
  await page.locator('details[data-category="B"] summary').click();
  await page
    .locator('details[data-category="B"]')
    .getByRole("button", { name: "ESCOLHER ESTE PACOTE" })
    .click();
  await expect(page).toHaveURL(/\/cadastro\?pacote=pacote-carro-exemplo/);
  await page.getByLabel("Seu nome").fill("Aluno Portal Teste");
  await page.getByLabel("Seu e-mail").fill("portal@example.com");
  await page.getByLabel("Seu WhatsApp").fill("11999999999");
  await page.getByRole("button", { name: "Criar meu cadastro grátis" }).click();
  await page.getByRole("button", { name: "Agendar aula", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Instrutor", exact: true })
    .selectOption("emerson-santana");
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while ([0, 6].includes(d.getDay())) d.setDate(d.getDate() + 1);
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  await page.getByLabel("Dia da aula").fill(day);
  await expect(
    page.getByRole("button", { name: "08:00", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirmar aula · usar 1 crédito" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Escolher um pacote" }).click();
  await page
    .locator("article")
    .filter({
      has: page.getByRole("heading", { name: "Pacote Carro", exact: true }),
    })
    .getByRole("button", { name: "Solicitar este pacote" })
    .click();
  const admin = await context.newPage();
  await admin.goto("/admin");
  await admin
    .getByRole("button", { name: "Pedidos de alunos (1)", exact: true })
    .click();
  await admin.getByRole("button", { name: "Revisar pedido" }).click();
  await admin
    .getByLabel("Motivo da liberação ou recusa")
    .fill("Liberação de teste");
  await admin.getByRole("button", { name: "Liberar créditos" }).click();
  await expect(page.getByText("Créditos liberados manualmente")).toBeVisible();
  await page.getByRole("button", { name: "Agendar aula", exact: true }).click();
  await page.getByRole("button", { name: "08:00", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirmar aula · usar 1 crédito" })
    .click();
  await expect(page.getByRole("status")).toContainText("Aula agendada!");
  await expect(
    admin.getByRole("heading", { name: "Novas aulas de alunos (1)" }),
  ).toBeVisible();
  await page.screenshot({
    path: `artifacts/${info.project.name}-area-aluno.png`,
    fullPage: true,
  });
  await admin
    .getByRole("button", { name: "Ver aula e marcar como lida" })
    .click();
  await expect(
    admin.getByText("Aluno Portal Teste", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    admin.getByRole("heading", { name: "Novas aulas de alunos (1)" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Início" }).click();
  await expect(page.getByText("1 reservados · 0 utilizados")).toBeVisible();
  await page.getByRole("button", { name: "Chame especialista" }).click();
  await expect(
    page.getByRole("dialog", { name: "Atendimento Chatvolt" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Olá, Aluno." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("cada cadastro de teste vê suas próprias aulas e arquivamento bloqueia acesso", async ({
  page,
  context,
}) => {
  await page.goto("/cadastro");
  await page.getByLabel("Seu nome").fill("Aluno Sem Aulas");
  await page.getByLabel("Seu e-mail").fill("sem@example.com");
  await page.getByLabel("Seu WhatsApp").fill("11988888888");
  await page.getByRole("button", { name: "Criar meu cadastro grátis" }).click();
  await page.getByRole("button", { name: "Minhas aulas", exact: true }).click();
  await expect(
    page.getByText("Nenhuma aula agendada.", { exact: false }),
  ).toBeVisible();
  const admin = await context.newPage();
  await admin.goto("/admin");
  await admin.getByRole("button", { name: "Clientes", exact: true }).click();
  await admin.getByRole("button", { name: "Editar cliente" }).click();
  await admin.getByLabel("Cliente ativo").uncheck();
  await admin.getByRole("button", { name: "Salvar cliente" }).click();
  await expect(
    page.getByRole("heading", { name: "Cadastro indisponível" }),
  ).toBeVisible();
});
