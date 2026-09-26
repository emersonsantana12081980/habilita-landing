import { DEFAULT_INSTRUCTORS } from "./data/instructors.js";
import { DEFAULT_PACKAGES } from "./data/packages.js";
import { normalizeManagement } from "./management.js";
import { normalizeFinance } from "./finance.js";
import { normalizeStudent } from "./student.js";
import {
  googleBookingUrl,
  DEFAULT_GOOGLE_BOOKING_URL,
} from "./google-calendar.js";

export const STORAGE_KEY = "habilita-plus-v1";
export const DEFAULT_WHATSAPP = "12996225250";

export function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  // A national number can itself begin with the Brazilian area code 55.
  if (/^[1-9]\d{9,10}$/.test(digits)) return `55${digits}`;
  if (/^55[1-9]\d{9,10}$/.test(digits)) return digits;
  return "";
}

export function normalizeState(value) {
  const source =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const configuredPhone =
    typeof source.whatsapp === "string" ? source.whatsapp : DEFAULT_WHATSAPP;
  const packages = Array.isArray(source.packages) ? [...source.packages] : [];
  if (source.packageSeedVersion !== 1) {
    for (const example of DEFAULT_PACKAGES) {
      if (
        !packages.some(
          (p) =>
            p?.id === example.id ||
            (typeof p?.name === "string" &&
              p.name.trim().toLowerCase() === example.name.toLowerCase()),
        )
      )
        packages.push({ ...example });
    }
  }
  const instructors = Array.isArray(source.instructors)
    ? [...source.instructors]
    : [];
  if (source.instructorSeedVersion !== 1) {
    for (const example of DEFAULT_INSTRUCTORS) {
      if (
        !instructors.some(
          (i) =>
            i?.id === example.id ||
            (typeof i?.name === "string" &&
              i.name.trim().toLocaleLowerCase("pt-BR")) ===
              example.name.toLocaleLowerCase("pt-BR"),
        )
      ) {
        instructors.push({ ...example });
      }
    }
  }
  return {
    ...normalizeManagement(source),
    ...normalizeFinance(source),
    ...normalizeStudent(source),
    schemaVersion: 2,
    instructorSeedVersion: 1,
    packageSeedVersion: 1,
    city:
      typeof source.city === "string" && source.city.trim()
        ? source.city.trim()
        : "Caçapava",
    // Upgrade the initial demo without replacing a previously configured contact.
    whatsapp:
      source.schemaVersion !== 2 && !configuredPhone
        ? DEFAULT_WHATSAPP
        : configuredPhone,
    ai: typeof source.ai === "boolean" ? source.ai : true,
    googleBookingUrl:
      DEFAULT_GOOGLE_BOOKING_URL || googleBookingUrl(source.googleBookingUrl),
    testimonials: (Array.isArray(source.testimonials)
      ? source.testimonials
      : []
    )
      .filter(
        (t) =>
          t &&
          typeof t.id === "string" &&
          typeof t.name === "string" &&
          t.name.trim() &&
          typeof t.text === "string" &&
          t.text.trim(),
      )
      .map((t) => ({
        id: t.id,
        name: t.name.trim().slice(0, 80),
        text: t.text.trim().slice(0, 1000),
        authorized: t.authorized === true,
        active: t.active === true,
      })),
    instructors: instructors
      .filter(
        (i) =>
          i &&
          typeof i.id === "string" &&
          typeof i.name === "string" &&
          i.name.trim() &&
          ["A", "B", "A+B"].includes(i.category),
      )
      .map((i) => ({
        id: i.id,
        name: i.name.trim(),
        category: i.category,
        city: typeof i.city === "string" ? i.city : "",
        bio: typeof i.bio === "string" ? i.bio : "",
        photo: safePhotoUrl(i.photo),
        active: i.active === true,
      })),
    packages: packages
      .filter(
        (p) =>
          p &&
          typeof p.id === "string" &&
          typeof p.name === "string" &&
          ["A", "B", "A+B"].includes(p.category) &&
          Number(p.price) > 0 &&
          Number.isInteger(Number(p.lessons)) &&
          Number(p.lessons) > 0,
      )
      .map((p) => ({
        ...p,
        examVehicle: p.examVehicle === true,
        freeRetest: p.freeRetest === true,
        retestTerms:
          typeof p.retestTerms === "string"
            ? p.retestTerms.trim().slice(0, 1500)
            : "",
        cardInstallments:
          Number.isInteger(p.cardInstallments) &&
          p.cardInstallments >= 0 &&
          p.cardInstallments <= 12
            ? p.cardInstallments
            : 0,
        boletoInstallments:
          Number.isInteger(p.boletoInstallments) &&
          p.boletoInstallments >= 0 &&
          p.boletoInstallments <= 24
            ? p.boletoInstallments
            : 0,
      })),
    slots: Array.isArray(source.slots)
      ? source.slots.filter(
          (s) =>
            s &&
            typeof s.id === "string" &&
            typeof s.date === "string" &&
            Number.isFinite(Date.parse(s.date)),
        )
      : [],
    reservations: Array.isArray(source.reservations)
      ? source.reservations.filter(
          (r) =>
            r &&
            typeof r.id === "string" &&
            typeof r.name === "string" &&
            Number.isFinite(Date.parse(r.date)),
        )
      : [],
  };
}

export function safePhotoUrl(value) {
  if (
    typeof value === "string" &&
    /^\/[a-zA-Z0-9_/-]+\.(?:png|jpe?g|webp)$/i.test(value) &&
    !value.startsWith("//")
  )
    return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export function teachesCategory(instructor, category) {
  return (
    instructor.active &&
    (instructor.category === "A+B" || instructor.category === category)
  );
}

export function whatsappUrl(
  phone,
  message = "Olá! Quero saber mais sobre as aulas da HABILITA+.",
) {
  const normalized = normalizePhone(phone);
  return normalized
    ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
    : "";
}

export const money = (value) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const packageMessage = (pack) =>
  `Olá! Tenho interesse no ${pack.name}, de ${money(pack.price)} à vista, categoria ${pack.category.replace("+", "/")}. Quero saber os horários e as condições de contratação${pack.freeRetest ? ", incluindo o reteste grátis" : ""}.`;
