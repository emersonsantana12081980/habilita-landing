import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import { createTestCheckoutHandler } from "./handler.js";

// JWT é validado com Auth.getUser, independentemente do gateway da função.
const client = (authorization: string) => createClient(
  Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
  { global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false } },
);

Deno.serve(createTestCheckoutHandler({
  env: (key: string) => Deno.env.get(key),
  authenticate: async (authorization: string) => {
    const db = client(authorization);
    const { data, error } = await db.auth.getUser(authorization.slice(7));
    if (error || !data.user) return null;
    const role = await db.rpc("my_access_role");
    if (role.error) throw role.error;
    return { id: data.user.id, role: role.data };
  },
  loadOrder: async (userId: string, requestId: string, authorization: string) => {
    const db = client(authorization);
    const student = await db.from("students").select("id").eq("user_id", userId).eq("active", true).maybeSingle();
    if (student.error) throw student.error;
    if (!student.data) return null;
    const order = await db.from("package_requests")
      .select("id,package_name,price_cents,payment_method,installment_count,status,pricing_demo")
      .eq("id", requestId).eq("student_id", student.data.id).maybeSingle();
    if (order.error) throw order.error;
    return order.data;
  },
}));
