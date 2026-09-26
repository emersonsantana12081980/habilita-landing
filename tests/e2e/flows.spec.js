import { test, expect } from "@playwright/test";
import { mockChatvolt } from "./chatvolt.fixture";

test.beforeEach(async ({ page }) => {
  await mockChatvolt(page);
  await page.addInitScript(() => {
    if (!localStorage.getItem("habilita-plus-v1"))
      localStorage.setItem(
        "habilita-plus-v1",
        JSON.stringify({ packageSeedVersion: 1, packages: [] }),
      );
  });
});

test("página inicial, navegação e atendimento", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Categorias A e B",
  );
  await expect(
    page.getByText("Seu plano começa com uma conversa."),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator("img").evaluateAll((images) =>
    Promise.all(
      images.map((img) => {
        img.loading = "eager";
        return img.decode();
      }),
    ),
  );
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-landing.png`,
    fullPage: true,
  });
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-inicio.png`,
  });
  await expect(
    page.getByRole("heading", { name: "Emerson Santana", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Foto de Emerson Santana", exact: true }),
  ).toBeVisible();
  await page
    .locator("#instrutores")
    .screenshot({ path: `artifacts/${testInfo.project.name}-emerson.png` });
  await page.evaluate(() => {
    window.open = (url) => {
      window.lastContactUrl = url;
    };
  });
  await page.getByRole("button", { name: "Chame agora no WhatsApp" }).click();
  expect(await page.evaluate(() => window.lastContactUrl)).toContain(
    "https://wa.me/5512996225250?text=",
  );
  await page.getByText("Como escolho os dias e horários?").click();
  await expect(
    page.getByText("Você pode consultar os horários disponibilizados"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Chame especialista" }).click();
  await expect(
    page.getByRole("dialog", { name: "Atendimento Chatvolt" }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.chatvoltOptions.agentId)).toBe(
    "cmkoa8q6501ypkh1566oeotza",
  );
  expect(errors).toEqual([]);
});

test("layout sem rolagem lateral em celulares e tablets", async ({
  page,
}, testInfo) => {
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Largura ${width}`,
    ).toBe(true);
    if (width < 1024) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await page
        .getByRole("navigation", { name: "Navegação móvel" })
        .getByRole("link", { name: "Nossos pacotes" })
        .click();
      await expect(
        page.getByRole("button", { name: "Abrir menu" }),
      ).toHaveAttribute("aria-expanded", "false");
      await expect(page).toHaveURL(/#pacotes$/);
    }
    await page.getByRole("button", { name: "Chame especialista" }).click();
    await expect(
      page.getByRole("dialog", { name: "Atendimento Chatvolt" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Chame especialista" }),
    ).toBeFocused();
  }
});

test("recupera armazenamento inválido sem interromper a página", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "habilita-plus-v1",
      JSON.stringify({
        city: null,
        packageSeedVersion: 1,
        packages: null,
        slots: {},
        reservations: [null],
      }),
    ),
  );
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Caçapava",
  );
  await expect(
    page.getByText("Seu plano começa com uma conversa."),
  ).toBeVisible();
});
