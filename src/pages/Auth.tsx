import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { invitationId, invitationLink } from "@/lib/userInvitation";

export default function Auth() {
  const { user, loading, signOut } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [cargo, setCargo] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSignInPwd, setShowSignInPwd] = useState(false);
  const [showSignUpPwd, setShowSignUpPwd] = useState(false);
  const [convite] = useState(() => invitationId(new URLSearchParams(window.location.search).get("convite")) ?? invitationId(sessionStorage.getItem("convite-pendente")));
  const [inviteError, setInviteError] = useState("");
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!convite || !user) return;
    let active = true;
    void supabase.auth.getUser().then(async ({ data, error }) => {
      if (error || !data.user) { if (active) setInviteError("Entre novamente para aceitar o convite"); return; }
      const result = await supabase.rpc("aceitar_convite_usuario", { _convite_id: convite });
      if (!active) return;
      if (result.error) setInviteError(result.error.message);
      else { sessionStorage.removeItem("convite-pendente"); setAccepted(true); }
    });
    return () => { active = false; };
  }, [convite, user]);


  if (!loading && user && (!convite || accepted)) return <Navigate to="/" replace />;
  if (!loading && user && convite) return <div className="min-h-screen grid place-items-center p-6"><Card className="w-full max-w-md p-8 space-y-4 text-center"><h1 className="text-xl font-semibold">Convite Gestão e Estratégia</h1>{inviteError ? <><p className="text-destructive">{inviteError}</p><Button variant="outline" onClick={async () => { await signOut(); setInviteError(""); }}>Entrar com outra conta</Button></> : <><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /><p>Confirmando seu convite…</p></>}</Card></div>;

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo!");
    if (!convite) nav("/");
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: convite ? invitationLink(convite) : `${window.location.origin}/`, data: { display_name: name, cargo } },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Verifique seu e-mail.");
  };

  const google = async () => {
    setBusy(true);
    try {
      if (convite) sessionStorage.setItem("convite-pendente", convite);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: convite ? invitationLink(convite) : window.location.origin,
      });
      if (result.error) toast.error(result.error.message);
    } catch { toast.error("Não foi possível entrar com Google. Tente novamente."); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-background to-muted/30">
      <Card className="w-full max-w-md p-8 shadow-elevated">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Gestão e Estratégia</h1>
          <p className="text-sm text-muted-foreground mt-1">{convite ? "Convite recebido · entre com o e-mail convidado" : "Entre para acessar o portfólio"}</p>
        </div>
        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={signIn} className="space-y-3">
              <div><Label>E-mail</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div><Label>Senha</Label><div className="relative"><Input type={showSignInPwd ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="pr-10" /><button type="button" onClick={() => setShowSignInPwd(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showSignInPwd ? "Ocultar senha" : "Mostrar senha"} tabIndex={-1}>{showSignInPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
              <Button type="submit" disabled={busy} className="w-full">{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Entrar</Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={signUp} className="space-y-3">
              <div><Label>Nome</Label><Input required value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label>Cargo</Label><Input value={cargo} onChange={e => setCargo(e.target.value)} /></div>
              <div><Label>E-mail</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div><Label>Senha</Label><div className="relative"><Input type={showSignUpPwd ? "text" : "password"} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="pr-10" /><button type="button" onClick={() => setShowSignUpPwd(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showSignUpPwd ? "Ocultar senha" : "Mostrar senha"} tabIndex={-1}>{showSignUpPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
              <Button type="submit" disabled={busy} className="w-full">{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Criar conta</Button>
            </form>
          </TabsContent>
        </Tabs>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <span className="relative bg-card px-3 text-xs text-muted-foreground mx-auto block w-fit">ou</span>
        </div>
        <Button variant="outline" disabled={busy} onClick={google} className="w-full">Entrar ou criar conta com Google</Button>
      </Card>
    </div>
  );
}
