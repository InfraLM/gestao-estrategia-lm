import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authFeedback } from '@/lib/authFeedback';

export default function ResetPassword() {
  const nav = useNavigate();
  const [recovery, setRecovery] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(event => { if (event === 'PASSWORD_RECOVERY') setRecovery(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!recovery || busy) return;
    if (password !== confirm) { setMessage('As senhas não coincidem.'); return; }
    setBusy(true);
    const { data, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !data.user) { setMessage('Link inválido ou expirado. Solicite outro e-mail de recuperação.'); setBusy(false); return; }
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setMessage(authFeedback(error)); return; }
    await supabase.auth.signOut();
    setRecovery(false);
    setMessage('Senha atualizada. Entre com sua nova senha.');
  };
  return <div className="min-h-screen grid place-items-center p-6 bg-background"><Card className="w-full max-w-md p-8 space-y-4">
    <h1 className="text-2xl font-semibold">Redefinir senha</h1>
    {message && <p role="status" className="text-sm text-foreground">{message}</p>}
    {recovery ? <form onSubmit={save} className="space-y-4">
      <div><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} /></div>
      <div><Label htmlFor="confirm-password">Confirmar nova senha</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={6} required value={confirm} onChange={e => setConfirm(e.target.value)} /></div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Salvando…' : 'Salvar nova senha'}</Button>
    </form> : <><p className="text-sm text-muted-foreground">{message ? '' : 'Abra o link de recuperação enviado por e-mail. Se expirou, solicite outro na tela de entrada.'}</p><Button onClick={() => nav('/auth')}>Voltar para entrar</Button></>}
  </Card></div>;
}