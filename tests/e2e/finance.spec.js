import { test, expect } from "@playwright/test";
test("venda, recebimento parcial, estorno e cancelamento preservam histórico", async ({
  page,
}, info) => {
  await page.goto("/admin");
  await page
    .getByRole("button", { name: "Cadastrar cliente", exact: true })
    .click();
  await page.getByLabel("Nome do cliente").fill("Aluno financeiro teste");
  await page.getByLabel("WhatsApp do cliente").fill("11999999999");
  await page.getByRole("button", { name: "Salvar cliente" }).click();
  await page.getByRole("button", { name: "Faturamento", exact: true }).click();
  await page.getByRole("button", { name: "Nova venda" }).click();
  await page
    .getByLabel("Cliente da venda")
    .selectOption({ label: "Aluno financeiro teste" });
  await page.getByLabel("Valor total (R$)").fill("299.00");
  await page.getByLabel("Quantidade de parcelas").selectOption("3");
  await page.getByRole("button", { name: "Salvar venda" }).click();
  await expect(page.getByText("Parcela 1 · R$ 99,67")).toBeVisible();
  await expect(page.getByText("Parcela 3 · R$ 99,66")).toBeVisible();
  await page
    .getByRole("button", {
      name: "Receber parcela 1 de Aluno financeiro teste",
    })
    .click();
  await page.getByLabel("Valor recebido (R$)").fill("100");
  await page.getByRole("button", { name: "Confirmar recebimento" }).click();
  await expect(page.getByRole("status")).toContainText("não pode ultrapassar");
  await page.getByLabel("Valor recebido (R$)").fill("50");
  await page.getByRole("button", { name: "Confirmar recebimento" }).click();
  await expect(page.getByText("Saldo R$ 49,67", { exact: true })).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Cancelar venda", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Estorne");
  await page.screenshot({
    path: `artifacts/${info.project.name}-faturamento.png`,
    fullPage: true,
  });
  await page.reload();
  await page.getByRole("button", { name: "Faturamento", exact: true }).click();
  await expect(page.getByText("Saldo R$ 49,67", { exact: true })).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Estornar registro", exact: true })
    .click();
  await expect(page.getByText("Saldo R$ 99,67", { exact: true })).toHaveCount(
    2,
  );
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Cancelar venda", exact: true })
    .click();
  await page.getByLabel("Situação da venda").selectOption("cancelled");
  await expect(
    page.getByText("Aluno financeiro teste", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Receber parcela/ }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
