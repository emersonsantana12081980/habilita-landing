import { useEffect } from "react";
// Sem cookies, dados pessoais ou envio externo. Adaptador futuro deve respeitar consentimento.
export function trackLanding(event, fields = {}) {
  const payload = {
    event,
    page: location.pathname,
    device: innerWidth < 768 ? "mobile" : "desktop",
  };
  for (const key of [
    "source",
    "category",
    "package_id",
    "question_id",
    "percent",
  ])
    if (fields[key] !== undefined) payload[key] = fields[key];
  window.dispatchEvent(
    new CustomEvent("habilita:conversion", { detail: payload }),
  );
}
export function useLandingEvents() {
  useEffect(() => {
    trackLanding("page_view");
    const reached = new Set();
    const scroll = () => {
      const total = document.documentElement.scrollHeight - innerHeight;
      if (total <= 0) return;
      for (const percent of [25, 50, 75, 90])
        if (!reached.has(percent) && (scrollY / total) * 100 >= percent) {
          reached.add(percent);
          trackLanding("scroll_depth", { percent });
        }
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
}
