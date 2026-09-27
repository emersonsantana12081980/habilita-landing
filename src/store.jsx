import { useEffect, useState } from "react";
import { STORAGE_KEY, normalizeState } from "./store-data";
import { cloudEnabled, supabase } from "./lib/supabase";
export { whatsappUrl, money, normalizePhone } from "./store-data";
function read() {
  if (cloudEnabled)
    return normalizeState({
      packageSeedVersion: 1,
      instructorSeedVersion: 1,
      packages: [],
      instructors: [],
    });
  try {
    return normalizeState(
      JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"),
    );
  } catch {
    return normalizeState(null);
  }
}
export function useStore() {
  const [data, setData] = useState(read);
  const [error, setError] = useState("");
  useEffect(() => {
    if (cloudEnabled) {
      let alive = true;
      const refresh = async () => {
        try {
          const [p, i, s] = await Promise.all([
            supabase.from("packages").select("*").eq("active", true),
            supabase
              .from("instructors")
              .select("id,slug,name,category,city,bio,photo_url,active")
              .eq("active", true),
            supabase.from("site_settings").select("*").single(),
          ]);
          if (p.error || i.error || s.error) throw new Error("catalog");
          if (alive) {
            setData(
              normalizeState({
                packageSeedVersion: 1,
                instructorSeedVersion: 1,
                city: s.data.city,
                whatsapp: s.data.whatsapp,
                ai: s.data.ai_enabled,
                instructors: i.data.map((x) => ({ ...x, photo: x.photo_url })),
                packages: p.data.map((x) => ({
                  ...x,
                  lessons: x.lessons_a + x.lessons_b,
                  carLessons: x.lessons_b,
                  motorcycleLessons: x.lessons_a,
                  price: x.price_cents / 100,
                  examVehicle: x.exam_vehicle,
                  freeRetest: x.free_retest,
                  retestTerms: x.retest_terms,
                  cardInstallments: x.card_installments,
                  boletoInstallments: x.boleto_installments,
                })),
              }),
            );
            setError("");
          }
        } catch {
          if (alive)
            setError(
              "Não foi possível atualizar o catálogo. Tente novamente em instantes.",
            );
        }
      };
      refresh();
      window.addEventListener("focus", refresh);
      return () => {
        alive = false;
        window.removeEventListener("focus", refresh);
      };
    }
    const sync = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) setData(read());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function update(patch) {
    if (cloudEnabled) return false;
    try {
      const current = read();
      const changes = typeof patch === "function" ? patch(current) : patch;
      if (!changes) {
        setData(current);
        return false;
      }
      const next = normalizeState({ ...current, ...changes });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setData(next);
      setError("");
      return true;
    } catch {
      setError(
        "Não foi possível salvar neste navegador. Verifique o armazenamento disponível.",
      );
      return false;
    }
  }
  return [data, update, error];
}
