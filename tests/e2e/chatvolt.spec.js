import { test, expect } from "@playwright/test";

test("falha no Chatvolt oferece WhatsApp e permite desativação no painel", async ({
  page,
}) => {
  await page.route(
    "https://cdn.jsdelivr.net/npm/@chatvolt/embeds@latest/dist/chatbox/index.js",
    (route) => route.abort(),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Chame especialista" }).click();
  await expect(page.getByRole("alert")).toContainText("Não foi possível abrir");
  await expect(
    page.getByRole("button", { name: "Falar pelo WhatsApp", exact: true }),
  ).toBeVisible();
  await page.goto("/admin");
  await page.getByLabel("Exibir atendimento Chatvolt").uncheck();
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Chame especialista" }),
  ).toHaveCount(0);
});

test("embed real abre o agente sem enviar mensagens", async ({
  page,
}, testInfo) => {
  test.skip(
    !process.env.CHATVOLT_LIVE,
    "Verificação externa opcional, executada separadamente.",
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Chame especialista" }).click();
  const widget = page.locator("chatvolt-chatbox-bubble");
  await expect(widget).toHaveAttribute(
    "agent-id",
    "cmkoa8q6501ypkh1566oeotza",
    { timeout: 25000 },
  );
  await expect(widget.locator("textarea").first()).toBeVisible({
    timeout: 25000,
  });
  await expect
    .poll(() => widget.evaluate((element) => element.isOpen))
    .toBe(true);
  await expect
    .poll(() =>
      widget
        .locator("textarea")
        .first()
        .evaluate((element) => getComputedStyle(element).pointerEvents),
    )
    .toBe("all");
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-chatvolt-live.png`,
  });
});
