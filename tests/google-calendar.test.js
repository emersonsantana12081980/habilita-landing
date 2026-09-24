import test from "node:test";
import assert from "node:assert/strict";
import { googleBookingUrl } from "../src/google-calendar.js";

test("aceita apenas páginas de agendamento do Google", () => {
  assert.equal(
    googleBookingUrl("https://calendar.app.google/abc123"),
    "https://calendar.app.google/abc123",
  );
  assert.equal(
    googleBookingUrl(
      "https://calendar.google.com/calendar/appointments/schedules/abc123?gv=true",
    ),
    "https://calendar.google.com/calendar/appointments/schedules/abc123",
  );
  for (const value of [
    null,
    "",
    "javascript:alert(1)",
    "https://calendar.google.com/calendar/embed?src=private",
    "https://calendar.google.com.evil.com/calendar/appointments/schedules/abc",
    "https://evil.com",
    "https://user@calendar.app.google/abc",
  ])
    assert.equal(googleBookingUrl(value), "");
});
