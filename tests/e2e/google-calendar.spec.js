import { test, expect } from "@playwright/test";
test("configuração legada aceita só página de agendamento, sem expor calendário na venda", async ({
  page,
}) => {
  await page.goto("/admin?view=site");
  await page
    .getByLabel("Link de agendamento do Google Agenda")
    .fill("https://calendar.google.com/calendar/embed?src=private");
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Use o link da página de agendamento",
  );
  await page
    .getByLabel("Link de agendamento do Google Agenda")
    .fill(
      "https://calendar.google.com/calendar/appointments/schedules/test-example",
    );
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await page.goto("/#categorias");
  await page.locator('details[data-category="B"] summary').click();
  await page
    .locator('details[data-category="B"]')
    .getByRole("button", { name: "ESCOLHER ESTE PACOTE" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Criar cadastro grátis" }),
  ).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
});
