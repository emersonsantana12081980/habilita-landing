import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_HOURS,
  freeTimes,
  createLesson,
  balance,
  conflicts,
  changeLessonStatus,
  normalizeManagement,
} from "../src/management.js";
const now = new Date("2030-04-01T07:00:00");
const client = {
  id: "c",
  name: "Aluno teste",
  category: "A+B",
  active: true,
  credits: { A: 2, B: 2 },
};
const data = {
  clients: [client],
  instructors: [
    { id: "i", name: "Instrutor teste", active: true, category: "A+B" },
  ],
  lessons: [],
  workingHours: DEFAULT_HOURS,
};
const selection = {
  day: "2030-04-01",
  clientId: "c",
  instructorId: "i",
  category: "B",
  vehicleId: "carro-mobi",
};
test("oferece expediente futuro e reserva saldo sem duplicar horário", () => {
  const times = freeTimes(data, selection, now);
  assert.equal(times.length, 10);
  const booked = createLesson(
    data,
    { ...selection, start: times[0].start, id: "l" },
    now,
  ).lesson;
  const next = { ...data, lessons: [booked] };
  assert.equal(freeTimes(next, selection, now).length, 9);
  assert.equal(balance(client, next.lessons, "B").available, 1);
  assert.ok(
    createLesson(
      next,
      { ...selection, start: times[0].start, id: "duplicate" },
      now,
    ).error,
  );
  assert.equal(
    freeTimes(data, { ...selection, day: "2030-04-07" }, now).length,
    0,
  );
  assert.equal(
    freeTimes(data, selection, new Date("2030-04-02T00:00:00")).length,
    0,
  );
  assert.equal(
    freeTimes(
      { ...data, clients: [{ ...client, active: false }] },
      selection,
      now,
    ).length,
    0,
  );
});
test("conflitos por aluno, instrutor e veículo incluem intervalo e permitem limite exato", () => {
  const [first, second] = freeTimes(data, selection, now);
  const existing = { ...first, id: "l", status: "scheduled" };
  assert.equal(conflicts([existing], second), false);
  for (const field of ["clientId", "instructorId", "vehicleId"]) {
    const candidate = {
      ...first,
      clientId: "other-c",
      instructorId: "other-i",
      vehicleId: "other-v",
      [field]: first[field],
    };
    assert.equal(conflicts([existing], candidate), true);
  }
  assert.equal(
    conflicts([existing], {
      ...second,
      start: new Date(Date.parse(second.start) - 60000).toISOString(),
    }),
    true,
  );
  assert.equal(conflicts([{ ...existing, status: "cancelled" }], first), false);
});
test("realização e falta consomem saldo, cancelamento libera e não aceita conclusão futura", () => {
  const lesson = {
    ...freeTimes(data, selection, now)[0],
    id: "l",
    status: "scheduled",
  };
  assert.equal(changeLessonStatus(lesson, "completed", now), null);
  const completed = changeLessonStatus(
    lesson,
    "completed",
    new Date(lesson.end),
  );
  assert.deepEqual(balance(client, [completed], "B"), {
    total: 2,
    used: 1,
    reserved: 0,
    available: 1,
  });
  assert.equal(changeLessonStatus(completed, "cancelled", now), null);
  assert.equal(
    balance(client, [changeLessonStatus(lesson, "cancelled", now)], "B")
      .available,
    2,
  );
  const full = { ...data, clients: [{ ...client, credits: { A: 0, B: 0 } }] };
  assert.equal(freeTimes(full, selection, now).length, 0);
  assert.deepEqual(
    normalizeManagement({ clients: [null, {}], lessons: [null, {}] }).clients,
    [],
  );
});
