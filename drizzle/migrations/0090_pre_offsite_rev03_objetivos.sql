update public.offsite_config c set conteudo = jsonb_set(jsonb_set(c.conteudo,'{perguntas,0}',(
  select jsonb_agg(case when q ? 'objetivos' then jsonb_set(q,'{objetivos}',coalesce((
    select jsonb_agg(n order by m) from (select n, min(ord) m from (
      select ord, case
        when o like 'AC.02 Maturidade%' then 'AC.01 Líderes que formam líderes'
        when o like 'AC.01 Execução do Método LIVRE%' then 'AC.03 Execução e inovação por experimento'
        when o like 'AC.03 Tecnologia%' or o='AC.03' then 'AC.02 IA nativa e dado único'
        when o like 'P.01 Execução impecável%' then 'P.01 Jornada do aluno sem perda (processos sagrados)'
        when o like 'P.02 Aquisição disciplinada e gestão de ICP%' then 'P.02 Aquisição disciplinada no ICP'
        when o like 'P.03 Expansão estruturada%' then 'P.03 Expansão da prática só com qualidade'
        when o like 'C.01 Pertencimento%' then case when q->>'id'='0.10' then 'C.02 Marca de referência em paciente grave' else 'C.01 Segurança clínica e aluno transformado' end
        else o end n
      from jsonb_array_elements_text(q->'objetivos') with ordinality t(o,ord)) a group by n) b),'[]'::jsonb)) else q end order by i)
  from jsonb_array_elements(c.conteudo#>'{perguntas,0}') with ordinality x(q,i))),
  '{bsc,0,pergunta}','"Como as pessoas da LM aprendem e inovam?"'::jsonb)
where c.id='2027' and c.conteudo#>>'{bsc,0,perspectiva}'='Aprendizado e Crescimento';
