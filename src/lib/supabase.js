import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const cloudEnabled = import.meta.env.VITE_SUPABASE_ENABLED === "true";
// Ativação explícita permite validar a integração antes de publicar.
// Nunca aceite uma chave secreta em uma variável exposta pelo Vite.
if (key && !key.startsWith("sb_publishable_")) {
  throw new Error("Use somente a chave pública sb_publishable_ do Supabase.");
}

export const supabase = url && key ? createClient(url, key) : null;
