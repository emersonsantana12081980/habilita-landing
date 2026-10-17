import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Separate client: creating the instructor must not replace the admin session.
export async function createInstructorAccount(instructor, email, password) {
  const auth = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await auth.auth.signUp({ email: email.trim(), password,
    options: { data: { name: instructor.name }, emailRedirectTo: `${location.origin}/instrutor?primeiro-acesso=1` },
  });
  if (error || !data.user?.identities?.length) throw new Error('O cadastro do profissional foi salvo, mas não foi possível criar a conta. Confira se o e-mail já tem cadastro ou se o serviço de e-mail atingiu seu limite. Não tente substituir a senha de uma conta existente.');
  const { error: linkError } = await supabase.rpc('admin_link_instructor', { p_instructor: instructor.id, p_email: email.trim() });
  if (linkError) throw new Error('A conta foi criada, mas o vínculo não foi concluído. Use “Vincular login do instrutor” com o mesmo e-mail; não crie outra conta.');
  return data.session
    ? 'Instrutor e acesso criados. A confirmação de e-mail está desativada no Supabase: nenhum e-mail de ativação é exigido. Ative Confirm email para os próximos cadastros.'
    : 'Instrutor e acesso criados. Oriente-o a confirmar o e-mail recebido e definir sua própria senha no primeiro acesso.';
}
