import { normalizePhone } from "./store-data.js";
import { createLesson } from "./management.js";
import { cents } from "./finance.js";

export const STUDENT_SESSION_KEY = "habilita-student-demo";
export function normalizeStudent(source) {
  return {
    packageRequests: (Array.isArray(source.packageRequests)
      ? source.packageRequests
      : []
    ).filter(
      (r) =>
        r &&
        typeof r.id === "string" &&
        typeof r.clientId === "string" &&
        typeof r.packageId === "string" &&
        typeof r.name === "string" &&
        ["pending", "approved", "rejected"].includes(r.status) &&
        ["A", "B", "A+B"].includes(r.category) &&
        r.credits &&
        [r.credits.A, r.credits.B].every(
          (n) => Number.isInteger(n) && n >= 0,
        ) &&
        Number.isSafeInteger(r.priceCents),
    ),
    notifications: (Array.isArray(source.notifications)
      ? source.notifications
      : []
    ).filter(
      (n) =>
        n &&
        typeof n.id === "string" &&
        typeof n.lessonId === "string" &&
        typeof n.clientName === "string" &&
        typeof n.start === "string",
    ),
  };
}
export function registerStudent(data, form, id) {
  const email = String(form.email || "")
    .trim()
    .toLowerCase();
  const name = String(form.name || "").trim();
  const phone = normalizePhone(form.phone);
  if (
    !name ||
    name.length > 80 ||
    !phone ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 150 ||
    !["A", "B", "A+B"].includes(form.category)
  )
    return { error: "Preencha nome, e-mail, WhatsApp com DDD e categoria." };
  if (
    data.clients.some(
      (c) =>
        c.email?.toLowerCase() === email || normalizePhone(c.phone) === phone,
    )
  )
    return {
      error:
        "Já existe um cadastro com esse e-mail ou WhatsApp. Retome o cadastro de teste ou fale com o instrutor.",
    };
  return {
    client: {
      id,
      name,
      email,
      phone: form.phone.trim(),
      category: form.category,
      active: true,
      source: "student-demo",
      createdAt: new Date().toISOString(),
      credits: { A: 0, B: 0 },
      packageId: "",
      packageName: "",
    },
  };
}
export function requestPackage(data, clientId, packageId, id) {
  const client = data.clients.find((c) => c.id === clientId && c.active);
  const pack = data.packages.find((p) => p.id === packageId && p.active);
  if (!client || !pack)
    return { error: "Cadastro ou pacote indisponível. Atualize a página." };
  if (
    data.packageRequests.some(
      (r) =>
        r.clientId === clientId &&
        r.packageId === packageId &&
        r.status === "pending",
    )
  )
    return { error: "Você já solicitou este pacote. Aguarde o instrutor." };
  const credits = {
    A:
      pack.category === "A"
        ? Number(pack.lessons)
        : pack.category === "A+B"
          ? Number(pack.motorcycleLessons)
          : 0,
    B:
      pack.category === "B"
        ? Number(pack.lessons)
        : pack.category === "A+B"
          ? Number(pack.carLessons)
          : 0,
  };
  const priceCents = cents(pack.price);
  if (
    !priceCents ||
    ![credits.A, credits.B].every((n) => Number.isInteger(n) && n >= 0) ||
    credits.A + credits.B === 0
  )
    return {
      error: "O instrutor precisa revisar as aulas e o valor deste pacote.",
    };
  return {
    request: {
      id,
      clientId,
      clientName: client.name,
      packageId,
      name: pack.name,
      category: pack.category,
      credits,
      priceCents,
      status: "pending",
      createdAt: new Date().toISOString(),
    },
  };
}
export function resolvePackage(data, requestId, action, reason) {
  const request = data.packageRequests.find(
    (r) => r.id === requestId && r.status === "pending",
  );
  const client = data.clients.find(
    (c) => c.id === request?.clientId && c.active,
  );
  if (!request || !client)
    return { error: "Solicitação já atendida ou cliente inativo." };
  if (!["approved", "rejected"].includes(action) || !reason.trim())
    return { error: "Informe o motivo da decisão." };
  const requests = data.packageRequests.map((r) =>
    r.id === requestId
      ? {
          ...r,
          status: action,
          reason: reason.trim(),
          resolvedAt: new Date().toISOString(),
          releaseMethod: "manual-demo",
        }
      : r,
  );
  if (action === "rejected") return { patch: { packageRequests: requests } };
  const category =
    client.category === request.category ? client.category : "A+B";
  return {
    patch: {
      packageRequests: requests,
      clients: data.clients.map((c) =>
        c.id === client.id
          ? {
              ...c,
              category,
              credits: {
                A: c.credits.A + request.credits.A,
                B: c.credits.B + request.credits.B,
              },
              packageId: request.packageId,
              packageName: request.name,
            }
          : c,
      ),
    },
  };
}
export function bookStudent(data, clientId, selection, id, now = new Date()) {
  const result = createLesson(data, { ...selection, clientId, id }, now);
  if (result.error) return result;
  const lesson = {
    ...result.lesson,
    source: "student",
    createdAt: now.toISOString(),
  };
  return {
    patch: {
      lessons: [...data.lessons, lesson],
      notifications: [
        ...data.notifications,
        {
          id: `lesson-${id}`,
          lessonId: id,
          clientId,
          clientName: lesson.clientName,
          start: lesson.start,
          instructorName: lesson.instructorName,
          category: lesson.category,
          createdAt: now.toISOString(),
          read: false,
        },
      ],
    },
  };
}
