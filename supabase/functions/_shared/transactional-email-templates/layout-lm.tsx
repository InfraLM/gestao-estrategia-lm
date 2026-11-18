import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { DadosEmail } from '../avisosEmail.ts'

// Identidade LM: vermelho, azul-marinho e branco. Estilos inline (clientes de e-mail).
const COR = { vermelho: '#E42535', marinho: '#1B2A4A', texto: '#1F2937', suave: '#6B7280', fundo: '#F4F4F5', borda: '#E4E4E7' }

export const LayoutLM = ({ titulo = 'Gestão e Estratégia', blocos = [], botao, rodape }: Partial<DadosEmail>) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{titulo}</Preview>
    <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: '24px 12px' }}>
      <Container style={{ maxWidth: '560px', border: `1px solid ${COR.borda}`, borderRadius: '10px', overflow: 'hidden', color: COR.texto }}>
        <Section style={{ background: COR.marinho, padding: '16px 24px', borderBottom: `4px solid ${COR.vermelho}` }}>
          <Text style={{ margin: 0, color: '#ffffff', fontSize: '15px', fontWeight: 'bold' }}>
            <span style={{ background: COR.vermelho, padding: '4px 8px', borderRadius: '4px', marginRight: '8px', letterSpacing: '1px' }}>LM</span>
            Gestão e Estratégia
          </Text>
        </Section>
        <Section style={{ padding: '24px 24px 8px' }}>
          <Heading style={{ margin: '0 0 16px', fontSize: '20px', color: COR.marinho }}>{titulo}</Heading>
          {blocos.map((b, i) => {
            if (b.tipo === 'titulo') return <Text key={i} style={{ margin: '0 0 6px', fontWeight: 'bold', color: COR.marinho, fontSize: '15px' }}>{b.texto}</Text>
            if (b.tipo === 'destaque') return <Text key={i} style={{ margin: '0 0 16px', padding: '12px 14px', background: '#FEF2F2', borderLeft: `4px solid ${COR.vermelho}`, borderRadius: '4px', fontSize: '15px' }}>{b.texto}</Text>
            if (b.tipo === 'lista') {
              const Tag = b.ordenada ? 'ol' : 'ul'
              return <Tag key={i} style={{ margin: '0 0 14px', paddingLeft: '20px', fontSize: '15px', lineHeight: '1.6' }}>{b.itens.map((t, j) => <li key={j}>{t}</li>)}</Tag>
            }
            return <Text key={i} style={{ margin: '0 0 14px', fontSize: '15px', lineHeight: '1.6', fontWeight: b.negrito ? 'bold' : 'normal' }}>{b.texto}</Text>
          })}
        </Section>
        {botao && <Section style={{ padding: '8px 24px 28px' }}>
          <Button href={botao.url} style={{ background: COR.vermelho, color: '#ffffff', fontWeight: 'bold', fontSize: '15px', padding: '12px 22px', borderRadius: '6px' }}>{botao.texto}</Button>
        </Section>}
        {rodape && <Section style={{ padding: '14px 24px', background: COR.fundo, borderTop: `1px solid ${COR.borda}` }}>
          <Text style={{ margin: 0, fontSize: '12px', color: COR.suave }}>{rodape}</Text>
        </Section>}
      </Container>
    </Body>
  </Html>
)

export const assunto = (d: Record<string, any>) => String(d?.subject ?? 'Gestão e Estratégia LM')
