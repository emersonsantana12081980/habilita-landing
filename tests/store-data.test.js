import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePhone,
  normalizeState,
  whatsappUrl,
} from "../src/store-data.js";

test("números nacionais, internacionais e DDD 55", () => {
  assert.equal(normalizePhone("(12) 99622-5250"), "5512996225250");
  assert.equal(normalizePhone("+55 (12) 99622-5250"), "5512996225250");
  assert.equal(normalizePhone("(55) 99999-9999"), "5555999999999");
  assert.equal(normalizePhone("(55) 3333-4444"), "555533334444");
  for (const value of ["", null, "123", "1234567890123456", "00000000000"])
    assert.equal(normalizePhone(value), "");
  assert.equal(whatsappUrl("invalid"), "");
  assert.equal(
    new URL(whatsappUrl("12996225250", "Olá! Quero A+B.")).searchParams.get(
      "text",
    ),
    "Olá! Quero A+B.",
  );
});

test("atualiza contato vazio legado e preserva configurações explícitas", () => {
  assert.equal(normalizeState({ whatsapp: "" }).whatsapp, "12996225250");
  assert.equal(
    normalizeState({ whatsapp: "11999999999" }).whatsapp,
    "11999999999",
  );
  assert.equal(normalizeState({ schemaVersion: 2, whatsapp: "" }).whatsapp, "");
});

test("dados danificados retornam um estado utilizável", () => {
  const state = normalizeState({
    city: " ",
    packages: [null, {}, { name: "incompleto" }],
    slots: {},
    reservations: [null],
  });
  assert.equal(state.city, "Caçapava");
  assert.deepEqual(state.packages, []);
  assert.deepEqual(state.slots, []);
  assert.deepEqual(state.reservations, []);
  assert.equal(normalizeState(null).ai, true);
});
