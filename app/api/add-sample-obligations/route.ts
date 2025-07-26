import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 10)
    
    const obrigacoes = [
      {
        id: '1',
        codigo: 'DARF',
        nome: 'DARF - Documento de Arrecadação de Receitas Federais',
        nomeObrigacao: 'DARF - Documento de Arrecadação de Receitas Federais',
        descricao: 'Recolhimento de impostos federais (IRPJ, CSLL, PIS, COFINS, etc.)',
        tipo: 'federal',
        tipoObrigacao: 'mensal',
        periodicidade: 'mensal',
        dataVencimento: nextMonth.toISOString(),
        status: 'pendente',
        prioridade: 'alta',
        responsavel: 'Eduardo Gomes',
        cliente: 'LEG - COMERCIO E SERVICOS LTDA',
        observacoes: 'Verificar apuração dos impostos antes do vencimento',
        categoria: 'pagamento',
        orgaoDestino: 'Receita Federal',
        sistemaEnvio: 'e-CAC',
        diasAlerta: 5,
        recorrente: true
      },
      {
        id: '2',
        codigo: 'ECF',
        nome: 'ECF - Escrituração Contábil Fiscal',
        nomeObrigacao: 'ECF - Escrituração Contábil Fiscal',
        descricao: 'Escrituração das operações realizadas pelas pessoas jurídicas',
        tipo: 'federal',
        tipoObrigacao: 'anual',
        periodicidade: 'anual',
        dataVencimento: new Date(today.getFullYear() + 1, 4, 31).toISOString(),
        status: 'em_andamento',
        prioridade: 'media',
        responsavel: 'Carlos Silva',
        cliente: 'LEG - COMERCIO E SERVICOS LTDA',
        observacoes: 'Preparar documentação contábil',
        categoria: 'declaracao',
        orgaoDestino: 'Receita Federal',
        sistemaEnvio: 'SPED',
        diasAlerta: 15,
        recorrente: true
      }
    ]
    
    return NextResponse.json({
      success: true,
      message: 'Obrigações de exemplo criadas com sucesso',
      data: obrigacoes
    })
    
  } catch (error) {
    console.error('Error creating sample obligations:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false 
    }, { status: 500 })
  }
}