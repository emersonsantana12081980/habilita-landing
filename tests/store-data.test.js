import test from "node:test";
import assert from "node:assert/strict";
import { lessonLabel } from "../src/data/packages.js";
import {
  normalizePhone,
  normalizeState,
  whatsappUrl,
  teachesCategory,
  safePhotoUrl,
} from "../src/store-data.js";

test("pacotes iniciais preservam edições e exclusões e detalham aulas combinadas", () => {
  const state = normalizeState({ packages: [] });
  assert.deepEqual(
    state.packages.map((p) => p.price),
    [299, 169.9, 399.99],
  );
  assert.equal(
    lessonLabel(state.packages[2]),
    "02 aulas de carro + 02 aulas de moto",
  );
  assert.equal(normalizeState(state).packages.length, 3);
  const edited = {
    ...state,
    packages: state.packages.map((p) => ({ ...p, price: 100, active: false })),
  };
  assert.equal(normalizeState(edited).packages[0].price, 100);
  assert.equal(normalizeState(edited).packages[0].active, false);
  assert.deepEqual(normalizeState({ ...state, packages: [] }).packages, []);
  const existing = { ...state.packages[0], id: "outro-id", price: 250 };
  assert.equal(normalizeState({ packages: [existing] }).packages.length, 3);
  assert.equal(normalizeState({ packages: [existing] }).packages[0].price, 250);
});

test("instrutores: compatibilidade de categorias e migração", () => {
  assert.deepEqual(
    normalizeState({ schemaVersion: 2, instructorSeedVersion: 1 }).instructors,
    [],
  );
  assert.equal(teachesCategory({ active: true, category: "A+B" }, "A"), true);
  assert.equal(teachesCategory({ active: true, category: "A+B" }, "B"), true);
  assert.equal(teachesCategory({ active: true, category: "A" }, "A+B"), false);
  assert.equal(teachesCategory({ active: false, category: "A+B" }, "B"), false);
  const state = normalizeState({
    instructorSeedVersion: 1,
    instructors: [
      null,
      {},
      {
        id: "1",
        name: " Ana ",
        category: "B",
        active: true,
        photo: "javascript:alert(1)",
      },
    ],
  });
  assert.equal(state.instructors.length, 1);
  assert.equal(state.instructors[0].name, "Ana");
  assert.equal(state.instructors[0].photo, "");
  assert.equal(
    safePhotoUrl("https://example.com/photo.jpg"),
    "https://example.com/photo.jpg",
  );
});

test("perfil inicial aparece uma vez e respeita edições e exclusões", () => {
  const first = normalizeState({ instructors: [] });
  assert.equal(first.instructors[0].name, "Emerson Santana");
  assert.equal(first.instructors[0].photo.startsWith("/"), true);
  assert.equal(normalizeState(first).instructors.length, 1);
  assert.equal(
    normalizeState({ ...first, instructors: [] }).instructors.length,
    0,
  );
  const edited = {
    ...first,
    instructors: [{ ...first.instructors[0], bio: "Editado", active: false }],
  };
  assert.equal(normalizeState(edited).instructors[0].bio, "Editado");
  assert.equal(normalizeState(edited).instructors[0].active, false);
  assert.equal(
    normalizeState({
      instructors: [{ ...first.instructors[0], id: "outro-id" }],
    }).instructors.length,
    1,
  );
  assert.equal(safePhotoUrl("//example.com/photo.jpg"), "");
  assert.equal(safePhotoUrl("/../photo.jpg"), "");
});

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
    packageSeedVersion: 1,
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
