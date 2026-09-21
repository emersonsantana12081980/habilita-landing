import { useEffect, useState } from "react";
import { STORAGE_KEY, normalizeState } from "./store-data";
export { whatsappUrl, money, normalizePhone } from "./store-data";
function read() {
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
    const sync = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) setData(read());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function update(patch) {
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
