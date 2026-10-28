import { describe, expect, it } from 'vitest';
import { PADRAO, type Config } from '@/features/preOffsite/config';
import { aplicarMapeamentos, contarUsos, prepararConfig, restaurarComoRascunho, validarRascunho, novoIdPergunta, camposProjeto, CAMPOS_4A } from '@/features/preOffsite/editorConfig';
import { completude } from '@/features/preOffsite/domain';

const base = () => JSON.parse(JSON.stringify(PADRAO)) as Config;
const diretores = ['Felipe Souza', 'Guilherme Vieira', 'Iuri Franco', 'Yuri Ribeiro', 'Bruno Garcia', 'Naira Yurie'];

describe('editor estruturado do Pré-Offsite', () => {
  it('apagar uma pergunta publicada é recusado; arquivar é aceito e some do formulário', () => {
    const b = base(); const semPergunta = base(); semPergunta.perguntas[1] = semPergunta.perguntas[1].slice(1);
    expect(validarRascunho(semPergunta, b, diretores).some(e => e.includes('não pode ser apagada'))).toBe(true);
    const arquivada = base(); const id = arquivada.perguntas[1][0].id; arquivada.perguntas[1][0].arquivada = true;
    expect(validarRascunho(arquivada, b, diretores).filter(e => e.includes('apagada'))).toEqual([]);
    const c = prepararConfig(arquivada);
    expect(c.perguntas[1].some(p => p.id === id)).toBe(false);
    expect(c.arquivo.perguntas.map(x => x.pergunta.id)).toContain(id);
  });

  it('recusa IDs repetidos, opções vazias e diretor que não participa', () => {
    const c = base(); c.perguntas[2].push({ ...c.perguntas[2][0] });
    c.perguntas[1].push({ id: '1.99', texto: 'x', tipo: 'escolha', opcoes: ['A', ''], cadeiras: ['Fulano'] });
    const erros = validarRascunho(c, base(), diretores).join(' | ');
    expect(erros).toContain('IDs de pergunta repetidos');
    expect(erros).toContain('opção vazia');
    expect(erros).toContain('Fulano');
  });

  it('gera ID novo que não colide', () => {
    const c = base(); const id = novoIdPergunta(c, 1);
    expect(c.perguntas.flat().some(p => p.id === id)).toBe(false);
    expect(id.startsWith('1.')).toBe(true);
  });

  it('renomear campo e opção migra a resposta e é idempotente', () => {
    const r = { 'b0.v3.0.2': { linhas: [{ 'Nome e cargo': 'Ana', Tempo: 'Curto' }], extras: { Pergunta: 'x' } }, '1.1': [{ Item: 'a', Status: 'Ruim' }] };
    const mapas = [
      { pergunta: '0.2', bloco: 0, tipo: 'campo' as const, escopo: 'campos' as const, de: 'Nome e cargo', para: 'Pessoa' },
      { pergunta: '0.2', bloco: 0, tipo: 'campo' as const, escopo: 'extras' as const, de: 'Pergunta', para: 'P2' },
      { pergunta: '1.1', bloco: 1, tipo: 'opcao' as const, campo: 'Status', escopo: 'campos' as const, de: 'Ruim', para: 'Fraco' },
    ];
    const uma = aplicarMapeamentos(r, mapas);
    expect(uma['b0.v3.0.2'].linhas[0]).toEqual({ Pessoa: 'Ana', Tempo: 'Curto' });
    expect(uma['b0.v3.0.2'].extras).toEqual({ P2: 'x' });
    expect(uma['1.1'][0].Status).toBe('Fraco');
    expect(aplicarMapeamentos(uma, mapas)).toEqual(uma);
  });

  it('renomear linha da matriz migra o Item e conta usos', () => {
    const r = { 'b0.v3.0.1': { itens: [{ Item: 'Velha', Avaliação: '3' }] } };
    expect(contarUsos([{ respostas: r }], 0, '0.1', { tipo: 'item', valor: 'Velha' })).toBe(1);
    const n = aplicarMapeamentos(r, [{ pergunta: '0.1', bloco: 0, tipo: 'item', de: 'Velha', para: 'Nova' }]);
    expect(n['b0.v3.0.1'].itens[0].Item).toBe('Nova');
  });

  it('campos da 4A vêm da configuração e a completude segue os campos obrigatórios', () => {
    const c = base(); c.campos4A = [{ nome: 'Só este', tipo: 'texto' }, { nome: 'Extra', tipo: 'texto', opcional: true }];
    expect(camposProjeto(base(), base().projetos[0])).toEqual(CAMPOS_4A);
    const r: Record<string, any> = Object.fromEntries(c.projetos.map(p => [`4A.${p.id}`, { 'Só este': 'ok' }]));
    expect(completude(r, c, 'Yuri Ribeiro').avisos.some(a => a.startsWith('4A'))).toBe(false);
  });

  it('restaurar versão antiga mantém como arquivado o que foi criado depois', () => {
    const atual = base(); atual.perguntas[1].push({ id: '1.99', texto: 'Nova', tipo: 'texto' });
    atual.projetos.push({ id: 'proj-9', titulo: 'Novo' });
    const r = restaurarComoRascunho(base(), atual);
    expect(r.perguntas[1].find(p => p.id === '1.99')?.arquivada).toBe(true);
    expect(r.projetos.find(p => p.id === 'proj-9')?.arquivado).toBe(true);
    expect(validarRascunho(r, atual, diretores).filter(e => e.includes('apagad'))).toEqual([]);
  });
});
