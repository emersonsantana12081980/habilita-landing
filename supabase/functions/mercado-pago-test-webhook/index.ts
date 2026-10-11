import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import { createTestWebhookHandler } from "./handler.js";

Deno.serve(createTestWebhookHandler({
  env: (key: string) => Deno.env.get(key),
  recordPayment: async (args: Record<string, unknown>) => {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db.rpc("record_mp_test_payment", args);
    if (error) throw error;
    return data;
  },
}));
