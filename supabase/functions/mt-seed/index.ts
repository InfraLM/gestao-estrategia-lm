import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import bsc from "./bscRev02.json" with { type: "json" };
import okr from "./okrs20262.json" with { type: "json" };
Deno.serve(async () => {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { count } = await db.from("mt_cadeiras").select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) return new Response("already seeded");
  const persp: any = { F: "Financeira", C: "Cliente", P: "Processos Internos", AC: "Aprendizado e Crescimento" };
  const cad: Record<string, string> = { Ian: "CEO", Cleto: "Institucional", Yuri: "COO", Bruno: "CFO", Guilherme: "CRO", Naira: "Governança e Eficiência Operacional", "Iuri Franco": "CMO / BU Certificações", Felipe: "Comercial" };
  const { data: cads, error: e1 } = await db.from("mt_cadeiras").insert(Object.entries(cad).map(([n, c]) => ({ nome: c, diretor_nome: n }))).select();
  if (e1) return new Response(e1.message, { status: 500 });
  const cid = (name?: string) => { if (!name) return null; const n = name.split(/[+;]/)[0].trim(); const k = n.startsWith("Iuri") ? "Iuri Franco" : n.split(" ")[0]; return cads!.find((c: any) => c.nome === cad[k])?.id ?? null; };
  const { data: objs } = await db.from("mt_objetivos").insert((bsc as any[]).map((o) => ({ codigo: o.codigo, perspectiva: persp[o.codigo.match(/[A-Z]+/)[0]], descricao: o.nome }))).select();
  const oid = (c?: string) => objs!.find((o: any) => o.codigo === c)?.id ?? null;
  const inds: any[] = [];
  (bsc as any[]).forEach((o) => o.kpis.forEach((k: any, i: number) => inds.push({ codigo: `${o.codigo.toLowerCase()}.${String(i + 1).padStart(2, "0")}`, nome: k.kpi, origem: "bsc", objetivo_id: oid(o.codigo), cadeira_id: cid(k.diretor), peso: 1, meta_texto: k.meta2026 || null, observacoes: k.formula || null })));
  for (const o of (okr as any).okrs) {
    const { data: ok } = await db.from("mt_okrs").insert({ codigo: o.codigo, nome: o.titulo }).select().single();
    const links = (o.objetivos ?? []).map(oid).filter(Boolean).map((x: string) => ({ okr_id: ok!.id, objetivo_id: x }));
    if (links.length) await db.from("mt_okr_objetivos").insert(links);
    for (const k of o.krs) inds.push({ codigo: k.codigo, nome: k.titulo, origem: "okr", okr_id: ok!.id, objetivo_id: oid(k.objetivos?.[0]), cadeira_id: cid(k.responsavel), peso: k.peso ?? 0, meta_texto: k.meta || null, observacoes: k.obs || null });
  }
  for (const d of (okr as any).diretores) d.metas.forEach((m: any, i: number) => inds.push({ codigo: `cesta.${d.nome.toLowerCase().replace(/[^a-z]/g, "").slice(0, 6)}.${String(i + 1).padStart(2, "0")}`, nome: m.indicador, origem: "cesta", objetivo_id: oid(m.objetivos?.[0]), cadeira_id: cid(d.nome), peso: m.peso ?? 0, meta_texto: m.meta || null, observacoes: m.obs || null }));
  const { error: e2 } = await db.from("mt_indicadores").insert(inds);
  if (e2) return new Response(e2.message, { status: 500 });
  const { data: p } = await db.from("profiles").select("user_id").eq("email", "naira.yurie@liberdademedicaedu.com.br").maybeSingle();
  const gov = cads!.find((c: any) => c.nome === cad.Naira)!.id;
  if (p) { await db.from("mt_usuarios").upsert({ user_id: p.user_id, perfil: "governanca", cadeira_id: gov }); await db.from("mt_cadeiras").update({ diretor_user_id: p.user_id }).eq("id", gov); }
  return new Response(`ok ${inds.length} indicadores`);
});
