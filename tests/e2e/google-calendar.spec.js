import { test, expect } from "@playwright/test";

test("agenda do Google substitui solicitações locais sem expor reservas", async ({
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
  await page.route("https://calendar.google.com/**", (route) =>
    route.fulfill({
      body: "<p>Calendário simulado para teste</p>",
      contentType: "text/html",
    }),
  );
  await page.goto("/#categorias");
  await page.locator('details[data-category="B"] summary').click();
  await page
    .locator('details[data-category="B"]')
    .getByRole("button", { name: "GARANTIR MEU PACOTE" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByText("Agende sua aula no Google Agenda"),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Solicitar horário" }),
  ).toHaveCount(0);
  await expect(dialog.getByLabel("Instrutor de preferência")).toHaveCount(0);
  await expect(
    dialog.getByRole("link", { name: "Agendar no Google" }),
  ).toHaveAttribute(
    "href",
    "https://calendar.google.com/calendar/appointments/schedules/test-example",
  );
  await dialog
    .getByRole("button", { name: "Ver horários disponíveis" })
    .click();
  await expect(dialog.locator("iframe")).toHaveAttribute(
    "src",
    "https://calendar.google.com/calendar/appointments/schedules/test-example?gv=true",
  );
});
