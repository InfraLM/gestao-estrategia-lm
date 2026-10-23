import { describe, expect, it } from 'vitest';
import { completudeImpedimentos, devidoImpedimento, impedimentoAtrasado, respostaCompleta, type Impedimento } from '@/lib/impedimentos';
const item = { id: '1', atribuido_cadeira_id: 'CFO', publicado_ciclo: '2026-10-26', resposta_status: 'aberto', resposta_ciclo: null } as Impedimento;
describe('Impedimentos entre diretores', () => {
  it('atribuição empilha a partir do ciclo seguinte, não no ciclo de origem', () => {
    expect(devidoImpedimento(item, 'CFO', '2026-10-26')).toBe(false);
    expect(devidoImpedimento(item, 'CFO', '2026-11-02')).toBe(true);
    expect(devidoImpedimento(item, 'CFO', '2026-11-09')).toBe(true);
    expect(devidoImpedimento(item, 'COO', '2026-11-02')).toBe(false);
  });
  it('exige plano e prazo; Não procede exige justificativa', () => {
    expect(respostaCompleta({plano: '', prazo:'2026-11-06',status:'aberto',justificativa:''})).toBe(false);
    expect(respostaCompleta({plano:'Ação',prazo:'',status:'aberto',justificativa:''})).toBe(false);
    expect(respostaCompleta({plano:'Ação',prazo:'2026-11-06',status:'nao_procede',justificativa:''})).toBe(false);
    expect(respostaCompleta({plano:'Ação',prazo:'2026-11-06',status:'nao_procede',justificativa:'Duplicado'})).toBe(true);
  });
  it('conta a resposta do ciclo do destinatário, nunca do sinalizador', () => {
    expect(completudeImpedimentos([item], 'CFO','2026-11-02')).toEqual({total:1,feitos:0});
    const respondido = {...item,resposta_ciclo:{plano:'Desbloquear',prazo:'2026-11-06',status:'em_andamento' as const,justificativa:''}};
    expect(completudeImpedimentos([respondido], 'CFO','2026-11-02')).toEqual({total:1,feitos:1});
    expect(completudeImpedimentos([respondido], 'CPPO','2026-11-02')).toEqual({total:0,feitos:0});
  });
  it('resolvido sai do empilhamento futuro; reabertura volta a exigir resposta', () => {
    expect(devidoImpedimento({...item,resposta_status:'resolvido'},'CFO','2026-11-09')).toBe(false);
    expect(devidoImpedimento({...item,resposta_status:'aberto',motivo_reabertura:'Não resolveu'},'CFO','2026-11-09')).toBe(true);
  });
  it('Não procede encerra o item e não gera alerta de atraso', () => {
    expect(impedimentoAtrasado('2026-11-01','aberto','2026-11-02')).toBe(true);
    expect(impedimentoAtrasado('2026-11-01','nao_procede','2026-11-02')).toBe(false);
    expect(devidoImpedimento({...item,resposta_status:'nao_procede'},'CFO','2026-11-09')).toBe(false);
    expect(impedimentoAtrasado('2026-11-01','resolvido','2026-11-02')).toBe(false);
    expect(impedimentoAtrasado('2026-11-02','aberto','2026-11-02')).toBe(false);
  });
});