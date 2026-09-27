import { loadEnv } from "vite";

const env = { ...loadEnv("development", process.cwd(), "VITE_"), ...process.env };
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key?.startsWith("sb_publishable_")) {
  console.error("Configure a URL e a chave pública do Supabase em .env.local.");
  process.exit(1);
}

try {
  const response = await fetch(new URL("/auth/v1/settings", url), {
    headers: { apikey: key },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const settings = await response.json();
  console.log("Conexão com Supabase Auth validada usando a chave pública.");
  console.log(`Login por e-mail: ${settings.external?.email ? "habilitado" : "desabilitado"}.`);
  console.log("Teste somente de leitura: nenhum usuário ou registro foi criado.");
  console.log("Isso não valida tabelas, políticas de acesso ou a integração do aplicativo.");
} catch (error) {
  console.error(`Não foi possível validar a conexão: ${error.message}.`);
  process.exitCode = 1;
}
