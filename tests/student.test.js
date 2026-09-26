import test from "node:test";
import assert from "node:assert/strict";
import { normalizeState } from "../src/store-data.js";
import {
  registerStudent,
  requestPackage,
  resolvePackage,
  bookStudent,
} from "../src/student.js";
import { freeTimes, balance, changeLessonStatus } from "../src/management.js";
const form = {
  name: "Teste",
  email: "teste@example.com",
  phone: "11999999999",
  category: "A+B",
};
function state() {
  const data = normalizeState({});
  const result = registerStudent(data, form, "s");
  return { ...data, clients: [result.client] };
}
test("cadastro gratuito não concede créditos e evita contato duplicado", () => {
  const data = state();
  assert.deepEqual(data.clients[0].credits, { A: 0, B: 0 });
  assert.ok(
    registerStudent(data, { ...form, email: "other@example.com" }, "dup").error,
  );
  assert.ok(
    registerStudent(data, { ...form, phone: "11988888888" }, "dup").error,
  );
});
test("solicitação guarda aulas e preço e liberação é idempotente", () => {
  let data = state();
  const { request } = requestPackage(
    data,
    "s",
    "pacote-carro-moto-exemplo",
    "r",
  );
  data = { ...data, packageRequests: [request] };
  assert.deepEqual(request.credits, { A: 2, B: 2 });
  assert.equal(request.priceCents, 39999);
  assert.ok(
    requestPackage(data, "s", "pacote-carro-moto-exemplo", "dup").error,
  );
  data.packages = [];
  const resolved = resolvePackage(data, "r", "approved", "Liberação de teste");
  data = { ...data, ...resolved.patch };
  assert.deepEqual(data.clients[0].credits, { A: 2, B: 2 });
  assert.ok(resolvePackage(data, "r", "approved", "Duplicado").error);
});
test("sem crédito pode consultar mas não reservar; agendamento notifica e cancelamento devolve saldo", () => {
  let data = state();
  const now = new Date("2030-04-01T07:00:00");
  const selection = {
    clientId: "s",
    day: "2030-04-01",
    category: "B",
    vehicleId: "carro-mobi",
    instructorId: "emerson-santana",
  };
  const times = freeTimes(data, selection, now, true);
  assert.ok(times.length);
  assert.equal(freeTimes(data, selection, now).length, 0);
  assert.ok(
    bookStudent(data, "s", { ...selection, start: times[0].start }, "l", now)
      .error,
  );
  data.clients[0].credits.B = 1;
  const result = bookStudent(
    data,
    "s",
    { ...selection, start: times[0].start },
    "l",
    now,
  );
  data = { ...data, ...result.patch };
  assert.equal(data.notifications.length, 1);
  assert.equal(data.notifications[0].read, false);
  assert.equal(balance(data.clients[0], data.lessons, "B").available, 0);
  assert.ok(
    bookStudent(data, "s", { ...selection, start: times[1].start }, "l2", now)
      .error,
  );
  data.lessons = [changeLessonStatus(data.lessons[0], "cancelled", now)];
  assert.equal(balance(data.clients[0], data.lessons, "B").available, 1);
});
