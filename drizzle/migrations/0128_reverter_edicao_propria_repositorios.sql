ALTER TABLE public.usuario_acessos DROP CONSTRAINT usuario_acessos_propria_modulo_check;
ALTER TABLE public.usuario_acessos ADD CONSTRAINT usuario_acessos_propria_modulo_check CHECK (nivel <> 'edicao_propria' OR modulo = 'okrs');
ALTER POLICY acesso_atualizar ON public.repositorio_documentos
  USING (public.acesso_modulo(auth.uid(),'repositorios',true))
  WITH CHECK (public.acesso_modulo(auth.uid(),'repositorios',true));
ALTER POLICY acesso_excluir ON public.repositorio_documentos
  USING (public.acesso_modulo(auth.uid(),'repositorios',true));
ALTER POLICY acesso_inserir ON public.repositorio_documentos
  WITH CHECK (public.acesso_modulo(auth.uid(),'repositorios',true));