// Gera um único index.ts para colar no Dashboard, a partir do código testado.
import { readFile, writeFile, mkdir } from "node:fs/promises";
const root = new URL("../", import.meta.url);
for (const name of ['mercado-pago-test-checkout', 'mercado-pago-test-webhook']) {
const folder = `supabase/functions/${name}/`;
const handler = await readFile(new URL(`${folder}handler.js`, root), "utf8");
const entry = await readFile(new URL(`${folder}index.ts`, root), "utf8");
const standalone = "// @ts-nocheck\n// Gerado por scripts/build-mp-dashboard.mjs. Não inserir credenciais aqui.\n" +
  handler + "\n" + entry.replace(/^import \{ \w+ \} from "\.\/handler.js";\r?\n/m, "");
await mkdir(new URL("docs/supabase-dashboard/", root), { recursive: true });
await writeFile(new URL(`docs/supabase-dashboard/${name}.ts`, root), standalone);
}
console.log("Código único do Dashboard atualizado.");
