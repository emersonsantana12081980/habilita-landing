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
  return {
    schemaVersion: 2,
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
    packages: Array.isArray(source.packages)
      ? source.packages.filter(
          (p) =>
            p &&
            typeof p.id === "string" &&
            typeof p.name === "string" &&
            ["A", "B", "A+B"].includes(p.category) &&
            Number(p.price) > 0 &&
            Number.isInteger(Number(p.lessons)) &&
            Number(p.lessons) > 0,
        )
      : [],
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
