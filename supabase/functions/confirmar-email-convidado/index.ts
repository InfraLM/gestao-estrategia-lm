import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const schema = z.object({ convite_id: z.string().uuid(), usuario_id: z.string().uuid(), motivo: z.string().trim().min(10).max(500) });
Deno.serve(async req => {
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return respond({ error: 'Método não permitido' }, 405);
  let stage = 'configuração';
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return respond({ error: 'Serviço indisponível' }, 503);
    const client = createClient(url, key, { auth: { persistSession: false } });
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return respond({ error: 'Entre na sua conta' }, 401);
    stage = 'sessão';
    const { data: caller, error: authError } = await client.auth.getUser(token);
    if (authError || !caller.user?.email_confirmed_at) return respond({ error: 'Sessão inválida' }, 401);
    stage = 'permissão';
    const { data: allowed, error: roleError } = await client.rpc('is_super_admin', { _user_id: caller.user.id });
    if (roleError || !allowed) return respond({ error: 'Somente o Admin Principal pode confirmar após verificar a identidade' }, 403);
    stage = 'dados';
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return respond({ error: 'Dados inválidos' }, 400);
    const input = parsed.data;
    stage = 'convite';
    const { data: invite, error: inviteError } = await client.from('usuario_convites').select('id,email,aceito_em,user_id').eq('id', input.convite_id).single();
    stage = 'consulta administrativa';
    const targetResponse = await fetch(`${url}/auth/v1/admin/users/${input.usuario_id}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!targetResponse.ok) return respond({ error: 'Consulta administrativa indisponível' }, 503);
    const target = await targetResponse.json();
    const email = typeof target.email === 'string' ? target.email.trim().toLowerCase() : '';
    if (inviteError || !invite || target.id !== input.usuario_id || !email || email !== invite.email.trim().toLowerCase() || !email.endsWith('@liberdademedicaedu.com.br') || (invite.aceito_em && invite.user_id !== target.id)) return respond({ error: 'Conta não corresponde ao convite corporativo' }, 400);
    if (target.email_confirmed_at) return respond({ ok: true, already_confirmed: true });
    const args = { _ator: caller.user.id, _usuario: target.id, _convite: invite.id, _anterior: 'não confirmado', _motivo: input.motivo };
    stage = 'auditoria';
    const { error: intentError } = await client.rpc('convite_auditar_confirmacao', { ...args, _novo: 'confirmação autorizada, solicitada' });
    if (intentError) return respond({ error: 'Não foi possível registrar a autorização' }, 500);
    stage = 'confirmação';
    const updateResponse = await fetch(`${url}/auth/v1/admin/users/${target.id}`, { method: 'PUT', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email_confirm: true }) });
    const updateError = !updateResponse.ok;
    const { error: auditError } = await client.rpc('convite_auditar_confirmacao', { ...args, _novo: updateError ? 'falhou' : 'confirmado' });
    if (updateError) { const failure = await updateResponse.json().catch(() => ({})); return respond({ error: 'Não foi possível confirmar a conta', status: updateResponse.status, code: failure.error_code ?? failure.code ?? null }, 500); }
    if (auditError) return respond({ error: 'Conta confirmada; registro final de auditoria pendente' }, 500);
    return respond({ ok: true });
  } catch { return respond({ error: `Não foi possível confirmar a conta (${stage})` }, 500); }
});