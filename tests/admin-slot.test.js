import test from "node:test";
import assert from "node:assert/strict";
import { slotRequest } from "../src/admin-slot.js";
const form = { instructor: "i", vehicle: "v", category: "B", start: "08:00", duration: 50, interval: 10 };
const now = new Date("2026-09-26T19:30:00-03:00");
test("horário passado explica a data e horário; próximo dia usa Brasília", () => {
  assert.match(slotRequest("2026-09-26",form,now).error,/já passou/);
  assert.deepEqual(slotRequest("2026-09-27",form,now).params, {p_instructor:"i",p_vehicle:"v",p_category:"B",p_start:"2026-09-27T08:00:00-03:00",p_duration:50,p_interval:10});
});
test("campos vazios e limites não chegam à RPC", () => {
  assert.match(slotRequest("",form,now).error,/Selecione a data/);
  assert.match(slotRequest("2026-09-27",{...form,duration:0},now).error,/duração/);
  assert.match(slotRequest("2026-09-27",{...form,interval:""},now).error,/intervalo/);
  assert.match(slotRequest("2026-09-27",{...form,interval:121},now).error,/intervalo/);
  assert.equal(slotRequest("2026-09-27",{...form,interval:0},now).params.p_interval,0);
});
