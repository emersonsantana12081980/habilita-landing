import { test, expect } from "@playwright/test";

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
  await page.screenshot({ path: `artifacts/${testInfo.project.name}-inicio.png` });
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
  await page.getByRole("button", { name: "Abrir atendimento" }).click();
  await page
    .getByRole("textbox", { name: "Sua pergunta" })
    .fill("Quais são os pacotes?");
  await page.getByRole("button", { name: "Enviar mensagem" }).click();
  await expect(
    page.getByText("Os pacotes são combinados com o instrutor"),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("validações e contato indisponível dentro do agendamento", async ({
  page,
}) => {
  await page.goto("/admin");
  await page.getByLabel("WhatsApp com DDD").fill("123");
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(page.getByRole("status")).toContainText("Informe um WhatsApp");
  await page.getByLabel("WhatsApp com DDD").fill("");
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await page.getByLabel("Nome do pacote").fill("Aula avulsa");
  await page.getByLabel("Preço (R$)").fill("100");
  await page.getByRole("button", { name: "Salvar pacote" }).click();
  await page.goto("/");
  await page.getByRole("button", { name: "Agendar / garantir pacote" }).click();
  const dialog = page.getByRole("dialog", { name: "Aula avulsa" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Consultar pelo WhatsApp" }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "disponibilizado em breve",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Agendar / garantir pacote" }),
  ).toBeFocused();
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
    await page.getByRole("button", { name: "Abrir atendimento" }).click();
    await expect(
      page.getByRole("textbox", { name: "Sua pergunta" }),
    ).toBeFocused();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Abrir atendimento" }),
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

test("pacotes, sincronização entre abas e solicitação de horário", async ({
  page,
  context,
}, testInfo) => {
  await page.goto("/admin");
  await page.getByLabel("Nome do pacote").fill("Reforço de carro");
  await page.getByLabel("Preço (R$)").fill("450");
  await page.getByRole("button", { name: "Salvar pacote" }).click();
  await expect(page.getByText("Pacotes cadastrados (1)")).toBeVisible();
  const publicPage = await context.newPage();
  await publicPage.goto("/");
  await expect(
    publicPage.getByRole("heading", { name: "Reforço de carro" }),
  ).toBeVisible();
  await page.getByLabel("Cidade de atendimento").fill("Taubaté");
  await page.getByRole("button", { name: "Salvar configurações" }).click();
  await expect(publicPage.getByRole("heading", { level: 1 })).toContainText(
    "Taubaté",
  );
  await page.getByLabel("Data e hora").fill("2099-10-20T10:00");
  await page.getByRole("button", { name: "Liberar horário" }).click();
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-admin.png`,
    fullPage: true,
  });
  await publicPage
    .getByRole("button", { name: "Agendar / garantir pacote" })
    .click();
  await publicPage.getByRole("button", { name: /20\/10\/2099/ }).click();
  await publicPage.getByLabel("Nome de demonstração").fill("Aluno de teste");
  await publicPage.getByLabel("Telefone de demonstração").fill("12999999999");
  await publicPage.getByRole("button", { name: "Solicitar horário" }).click();
  await expect(
    publicPage.getByText("Solicitação salva neste navegador."),
  ).toBeVisible();
  await expect(page.getByText("Aluno de teste")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Bloqueado · liberar" }),
  ).toBeVisible();
  await publicPage.getByRole("button", { name: "Fechar agendamento" }).click();
  await page.reload();
  await expect(page.getByText("Aluno de teste")).toBeVisible();
  await page.getByRole("button", { name: "Editar Reforço de carro" }).click();
  await page.getByLabel("Status", { exact: true }).selectOption("false");
  await page.getByRole("button", { name: "Salvar pacote" }).click();
  await expect(
    publicPage.getByRole("heading", { name: "Reforço de carro" }),
  ).toHaveCount(0);
  await expect(
    publicPage.getByText("Seu plano começa com uma conversa."),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Excluir Reforço de carro" }).click();
  await expect(page.getByText("Pacotes cadastrados (0)")).toBeVisible();
});
