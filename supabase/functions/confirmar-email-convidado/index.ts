import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const schema = z.object({ convite_id: z.string().uuid(), usuario_id: z.string().uuid(), motivo: z.string().trim().min(10).max(500) });
Deno.serve(async req => {
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return respond({ error: 'Método não permitido' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return respond({ error: 'Serviço indisponível' }, 503);
    const client = createClient(url, key, { auth: { persistSession: false } });
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return respond({ error: 'Entre na sua conta' }, 401);
    const { data: caller, error: authError } = await client.auth.getUser(token);
    if (authError || !caller.user?.email_confirmed_at) return respond({ error: 'Sessão inválida' }, 401);
    const { data: allowed, error: roleError } = await client.rpc('is_super_admin', { _user_id: caller.user.id });
    if (roleError || !allowed) return respond({ error: 'Somente o Admin Principal pode confirmar após verificar a identidade' }, 403);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return respond({ error: 'Dados inválidos' }, 400);
    const input = parsed.data;
    const { data: invite, error: inviteError } = await client.from('usuario_convites').select('id,email,aceito_em,user_id').eq('id', input.convite_id).single();
    const { data: target, error: targetError } = await client.auth.admin.getUserById(input.usuario_id);
    const email = target.user?.email?.trim().toLowerCase();
    if (inviteError || targetError || !invite || !target.user || !email || email !== invite.email.trim().toLowerCase() || !email.endsWith('@liberdademedicaedu.com.br') || (invite.aceito_em && invite.user_id !== target.user.id)) return respond({ error: 'Conta não corresponde ao convite corporativo' }, 400);
    if (target.user.email_confirmed_at) return respond({ ok: true, already_confirmed: true });
    const args = { _ator: caller.user.id, _usuario: target.user.id, _convite: invite.id, _anterior: 'não confirmado', _motivo: input.motivo };
    const { error: intentError } = await client.rpc('convite_auditar_confirmacao', { ...args, _novo: 'confirmação autorizada, solicitada' });
    if (intentError) return respond({ error: 'Não foi possível registrar a autorização' }, 500);
    const { error: updateError } = await client.auth.admin.updateUserById(target.user.id, { email_confirm: true });
    const { error: auditError } = await client.rpc('convite_auditar_confirmacao', { ...args, _novo: updateError ? 'falhou' : 'confirmado' });
    if (updateError) return respond({ error: 'Não foi possível confirmar a conta' }, 500);
    if (auditError) return respond({ error: 'Conta confirmada; registro final de auditoria pendente' }, 500);
    return respond({ ok: true });
  } catch { return respond({ error: 'Não foi possível confirmar a conta' }, 500); }
});