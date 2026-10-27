import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjetoRow {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  wave: "W1" | "W2" | "W3";
  classificacao: string;
  status: string;
  status_bc: string;
  saude: "On-Track" | "Alerta" | "Off-Track";
  diretor: string | null;
  gerente: string | null;
  diretor_pessoa_id?: string | null;
  gerente_pessoa_id?: string | null;
  budget: number;
  realizado: number;
  ice: number;
  inicio: string | null;
  termino: string | null;
  objetivos: string[];
  krs: string[];
  avancos: string | null;
  causa_raiz: string | null;
  plano_acao: string | null;
}

export interface CronogramaRow {
  id: string;
  projeto_id: string;
  ordem: number;
  fase: string;
  responsavel: string | null;
  responsavel_pessoa_id?: string | null;
  data_prevista: string | null;
  data_conclusao: string | null;
  status: string;
  observacoes: string | null;
}

export interface EapRow {
  id: string;
  projeto_id: string;
  pacote: string;
  entregavel: string;
  responsavel: string | null;
  responsavel_pessoa_id?: string | null;
  data_prevista: string | null;
  data_conclusao: string | null;
  status: string;
  observacoes: string | null;
}

export interface SubmissaoRow {
  id: string;
  projeto_id: string;
  eap_item_id: string | null;
  titulo: string;
  descricao: string | null;
  tipo_arquivo: string | null;
  arquivo_path: string | null;
  arquivo_nome: string | null;
  arquivo_tamanho: number | null;
  submitted_by: string;
  created_at: string;
}

export interface StatusReportRow {
  id: string;
  projeto_id: string;
  periodo: string;
  avancos: string | null;
  desvios: string | null;
  saude: string | null;
  causa_raiz: string | null;
  plano_acao: string | null;
  created_at: string;
}

export function useProjetoFromDB(codigo: string | undefined) {
  const [projeto, setProjeto] = useState<ProjetoRow | null>(null);
  const [cronograma, setCronograma] = useState<CronogramaRow[]>([]);
  const [eap, setEap] = useState<EapRow[]>([]);
  const [submissoes, setSubmissoes] = useState<SubmissaoRow[]>([]);
  const [statusReports, setStatusReports] = useState<StatusReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!codigo) return;
    setLoading(true);
    const { data: p } = await supabase.from("projetos").select("*").eq("codigo", codigo).maybeSingle();
    setProjeto(p as any);
    if (p) {
      const [c, e, s, sr] = await Promise.all([
        supabase.from("cronograma_itens").select("*").eq("projeto_id", p.id).order("ordem"),
        supabase.from("eap_itens").select("*").eq("projeto_id", p.id).order("created_at"),
        supabase.from("entrega_submissoes").select("*").eq("projeto_id", p.id).order("created_at", { ascending: false }),
        supabase.from("status_reports").select("*").eq("projeto_id", p.id).order("created_at", { ascending: false }),
      ]);
      setCronograma((c.data ?? []) as any);
      setEap((e.data ?? []) as any);
      setSubmissoes((s.data ?? []) as any);
      setStatusReports((sr.data ?? []) as any);
    }
    setLoading(false);
  }, [codigo]);

  useEffect(() => { reload(); }, [reload]);

  const addCronograma = async (item: Partial<CronogramaRow>) => {
    if (!projeto) return;
    const { error } = await supabase.from("cronograma_itens").insert({
      projeto_id: projeto.id, fase: item.fase || "Nova fase",
      ordem: cronograma.length, responsavel: item.responsavel ?? null,
      data_prevista: item.data_prevista ?? null, data_conclusao: item.data_conclusao ?? null,
      status: (item.status as any) ?? "Não Iniciado", observacoes: item.observacoes ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("Item adicionado"); reload();
  };

  const updateCronograma = async (id: string, patch: Partial<CronogramaRow>) => {
    const { error } = await supabase.from("cronograma_itens").update(patch as any).eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };

  const deleteCronograma = async (id: string) => {
    const { error } = await supabase.from("cronograma_itens").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido"); reload();
  };

  const addEap = async (item: Partial<EapRow>) => {
    if (!projeto) return;
    const { error } = await supabase.from("eap_itens").insert({
      projeto_id: projeto.id, pacote: item.pacote || "Pacote", entregavel: item.entregavel || "Entregável",
      responsavel: item.responsavel ?? null, data_prevista: item.data_prevista ?? null,
      data_conclusao: item.data_conclusao ?? null, status: (item.status as any) ?? "Pendente",
      observacoes: item.observacoes ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("Entregável adicionado"); reload();
  };

  const updateEap = async (id: string, patch: Partial<EapRow>) => {
    const { error } = await supabase.from("eap_itens").update(patch as any).eq("id", id);
    if (error) return toast.error(error.message);
    reload();
  };

  const deleteEap = async (id: string) => {
    const { error } = await supabase.from("eap_itens").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido"); reload();
  };

  const submitEntrega = async (file: File, meta: { titulo: string; descricao?: string; eap_item_id?: string | null }) => {
    if (!projeto) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Sessão expirada");
    const path = `${user.id}/${projeto.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("entregas").upload(path, file);
    if (upErr) return toast.error(upErr.message);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const tipo = ["pdf"].includes(ext) ? "pdf" : ["xlsx","xls","csv"].includes(ext) ? "planilha" : ["mp3","wav","m4a","ogg"].includes(ext) ? "gravacao" : ["pptx","ppt","key"].includes(ext) ? "apresentacao" : "documento";
    const { error } = await supabase.from("entrega_submissoes").insert({
      projeto_id: projeto.id, eap_item_id: meta.eap_item_id ?? null,
      titulo: meta.titulo, descricao: meta.descricao ?? null,
      tipo_arquivo: tipo, arquivo_path: path, arquivo_nome: file.name, arquivo_tamanho: file.size,
      submitted_by: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Entrega submetida"); reload();
  };

  const addStatusReport = async (sr: Partial<StatusReportRow>) => {
    if (!projeto) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("status_reports").insert({
      projeto_id: projeto.id, periodo: sr.periodo || new Date().toISOString().slice(0, 7),
      avancos: sr.avancos ?? null, desvios: sr.desvios ?? null,
      saude: (sr.saude as any) ?? projeto.saude, causa_raiz: sr.causa_raiz ?? null,
      plano_acao: sr.plano_acao ?? null, reportado_por: user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success("Status report registrado"); reload();
  };

  const updateProjeto = async (patch: Partial<ProjetoRow>) => {
    if (!projeto) return;
    const { error } = await supabase.from("projetos").update(patch as any).eq("id", projeto.id);
    if (error) return toast.error(error.message);
    reload();
  };

  const downloadEntrega = async (path: string, nome: string) => {
    const { data, error } = await supabase.storage.from("entregas").createSignedUrl(path, 60);
    if (error || !data) return toast.error("Falha ao gerar link");
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = nome;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
  };

  return {
    projeto, cronograma, eap, submissoes, statusReports, loading, reload,
    addCronograma, updateCronograma, deleteCronograma,
    addEap, updateEap, deleteEap,
    submitEntrega, downloadEntrega,
    addStatusReport, updateProjeto,
  };
}
