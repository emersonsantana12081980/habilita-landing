import { test, expect } from "@playwright/test";

test("cliente, agenda, conflito, cancelamento e persistência", async ({
  page,
}, testInfo) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Seu dia, organizado." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cadastrar cliente", exact: true })
    .click();
  await page.getByLabel("Nome do cliente").fill("Cliente de teste");
  await page.getByLabel("WhatsApp do cliente").fill("11999999999");
  await page
    .getByLabel("Pacote do cliente")
    .selectOption("pacote-carro-exemplo");
  await page
    .getByRole("button", { name: "Salvar cliente", exact: true })
    .click();
  await expect(page.getByText("Carro: 2 livres")).toBeVisible();
  await page.getByRole("button", { name: "Agendar aula", exact: true }).click();
  const future = new Date();
  future.setDate(future.getDate() + 1);
  while ([0, 6].includes(future.getDay())) future.setDate(future.getDate() + 1);
  const day = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
  await page.getByLabel("Dia da agenda").fill(day);
  await page.getByLabel("Instrutor da aula").selectOption("emerson-santana");
  await page.getByRole("button", { name: "08:00", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  await expect(page.getByRole("status")).toContainText("Aula agendada");
  await expect(
    page.getByRole("button", { name: "08:00", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Aulas disponíveis: 1")).toBeVisible();
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-gestor-agenda.png`,
    fullPage: true,
  });
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Cancelar aula" }).click();
  await expect(
    page.getByRole("button", { name: "08:00", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Clientes", exact: true }).click();
  await expect(
    page.getByText("Cliente de teste", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Carro: 2 livres")).toBeVisible();
  await page.getByRole("button", { name: "Histórico", exact: true }).click();
  await expect(page.getByText("Emerson Santana · Cancelada")).toBeVisible();
  await page
    .getByRole("button", { name: "Editar cliente", exact: true })
    .click();
  await page.getByLabel("Cliente ativo").uncheck();
  await page
    .getByRole("button", { name: "Salvar cliente", exact: true })
    .click();
  await expect(page.getByText("Arquivado", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("lista de hoje e baixa de aulas concluídas", async ({ page }) => {
  await page.addInitScript(() => {
    const end = new Date();
    end.setMinutes(end.getMinutes() - 1);
    const start = new Date(end.getTime() - 50 * 60000);
    localStorage.setItem(
      "habilita-plus-v1",
      JSON.stringify({
        clients: [
          {
            id: "test",
            name: "Aluno exemplo",
            phone: "11999999999",
            category: "B",
            active: true,
            credits: { A: 0, B: 2 },
          },
        ],
        lessons: [
          {
            id: "aula",
            clientId: "test",
            clientName: "Aluno exemplo",
            instructorId: "emerson-santana",
            instructorName: "Emerson Santana",
            vehicleId: "carro-mobi",
            vehicleName: "Fiat Mobi",
            category: "B",
            start: start.toISOString(),
            end: end.toISOString(),
            interval: 10,
            status: "scheduled",
          },
        ],
      }),
    );
  });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Realizada", exact: true }).click();
  await expect(page.getByText("Realizada", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clientes", exact: true }).click();
  await expect(page.getByText("Carro: 1 livres")).toBeVisible();
  await expect(
    page.getByText("· 0 agendadas · 1 usadas", { exact: false }),
  ).toBeVisible();
});
