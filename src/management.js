export const DEFAULT_HOURS = {
  days: [1, 2, 3, 4, 5],
  start: "08:00",
  end: "18:00",
  duration: 50,
  interval: 10,
};
export const DEFAULT_VEHICLES = [
  { id: "carro-mobi", name: "Fiat Mobi", category: "B" },
  { id: "moto-treino", name: "Moto de instrução", category: "A" },
];
export const LESSON_STATUS = {
  scheduled: "Agendada",
  completed: "Realizada",
  missed: "Falta",
  cancelled: "Cancelada",
};
export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const minutes = (value) =>
  /^\d{2}:\d{2}$/.test(value || "")
    ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3))
    : NaN;
export function validHours(h) {
  return (
    h &&
    Array.isArray(h.days) &&
    h.days.length > 0 &&
    h.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) &&
    Number.isInteger(h.duration) &&
    h.duration >= 15 &&
    h.duration <= 180 &&
    Number.isInteger(h.interval) &&
    h.interval >= 0 &&
    h.interval <= 120 &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(h.start) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(h.end) &&
    minutes(h.end) - minutes(h.start) >= h.duration
  );
}
export function normalizeManagement(source) {
  return {
    workingHours: validHours(source.workingHours)
      ? source.workingHours
      : { ...DEFAULT_HOURS },
    clients: (Array.isArray(source.clients) ? source.clients : []).filter(
      (c) =>
        c &&
        typeof c.id === "string" &&
        typeof c.name === "string" &&
        typeof c.phone === "string" &&
        ["A", "B", "A+B"].includes(c.category) &&
        c.credits &&
        [c.credits.A, c.credits.B].every((n) => Number.isInteger(n) && n >= 0),
    ),
    lessons: (Array.isArray(source.lessons) ? source.lessons : []).filter(
      (l) =>
        l &&
        typeof l.id === "string" &&
        typeof l.clientId === "string" &&
        ["A", "B"].includes(l.category) &&
        LESSON_STATUS[l.status] &&
        Number.isFinite(Date.parse(l.start)) &&
        Number.isFinite(Date.parse(l.end)) &&
        Date.parse(l.end) > Date.parse(l.start) &&
        Number.isInteger(l.interval) &&
        l.interval >= 0,
    ),
  };
}
export function balance(client, lessons, category) {
  const own = lessons.filter(
    (l) => l.clientId === client.id && l.category === category,
  );
  const used = own.filter((l) =>
    ["completed", "missed"].includes(l.status),
  ).length;
  const reserved = own.filter((l) => l.status === "scheduled").length;
  return {
    total: client.credits[category],
    used,
    reserved,
    available: client.credits[category] - used - reserved,
  };
}
export function conflicts(lessons, candidate) {
  return lessons.some(
    (l) =>
      l.id !== candidate.id &&
      l.status !== "cancelled" &&
      (l.instructorId === candidate.instructorId ||
        l.vehicleId === candidate.vehicleId ||
        l.clientId === candidate.clientId) &&
      Date.parse(candidate.start) < Date.parse(l.end) + l.interval * 60000 &&
      Date.parse(candidate.end) + candidate.interval * 60000 >
        Date.parse(l.start),
  );
}
export function freeTimes(data, selection, now = new Date(), preview = false) {
  const { day, clientId, instructorId, category, vehicleId } = selection;
  const c = data.clients.find((c) => c.id === clientId && c.active);
  const i = data.instructors.find(
    (i) =>
      i.id === instructorId &&
      i.active &&
      (i.category === category || i.category === "A+B"),
  );
  const v = DEFAULT_VEHICLES.find(
    (v) => v.id === vehicleId && v.category === category,
  );
  if (
    !c ||
    !i ||
    !v ||
    !["A", "B"].includes(category) ||
    !c.category.includes(category) ||
    (!preview && balance(c, data.lessons, category).available <= 0) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(day || "")
  )
    return [];
  const h = data.workingHours;
  const base = new Date(`${day}T00:00:00`);
  if (
    !Number.isFinite(base.getTime()) ||
    localDay(base) !== day ||
    !h.days.includes(base.getDay())
  )
    return [];
  const result = [];
  for (
    let n = minutes(h.start);
    n + h.duration <= minutes(h.end);
    n += h.duration + h.interval
  ) {
    const start = new Date(base);
    start.setHours(Math.floor(n / 60), n % 60, 0, 0);
    const end = new Date(start.getTime() + h.duration * 60000);
    const candidate = {
      clientId,
      instructorId,
      vehicleId,
      category,
      start: start.toISOString(),
      end: end.toISOString(),
      interval: h.interval,
    };
    if (start > now && !conflicts(data.lessons, candidate))
      result.push(candidate);
  }
  return result;
}
export function createLesson(data, selection, now = new Date()) {
  const candidate = freeTimes(data, selection, now).find(
    (s) => s.start === selection.start,
  );
  if (!candidate)
    return {
      error: "Horário indisponível ou saldo insuficiente. Atualize a escolha.",
    };
  const client = data.clients.find((c) => c.id === candidate.clientId);
  const instructor = data.instructors.find(
    (i) => i.id === candidate.instructorId,
  );
  return {
    lesson: {
      ...candidate,
      id: selection.id,
      status: "scheduled",
      clientName: client.name,
      instructorName: instructor.name,
      vehicleName: DEFAULT_VEHICLES.find((v) => v.id === candidate.vehicleId)
        .name,
    },
  };
}
export function changeLessonStatus(lesson, status, now = new Date()) {
  if (
    !lesson ||
    lesson.status !== "scheduled" ||
    !["completed", "missed", "cancelled"].includes(status)
  )
    return null;
  if (status !== "cancelled" && Date.parse(lesson.end) > now.getTime())
    return null;
  return { ...lesson, status };
}
