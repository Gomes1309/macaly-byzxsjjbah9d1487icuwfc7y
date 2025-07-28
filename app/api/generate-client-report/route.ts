import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Gerando relatório de clientes...')
    
    // Buscar dados dos clientes
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError)
      return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 })
    }

    // Buscar dados das empresas
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false })

    if (empresasError) {
      console.error('❌ Erro ao buscar empresas:', empresasError)
    }

    // Gerar estatísticas
    const stats = {
      totalClientes: clientes?.length || 0,
      totalEmpresas: empresas?.length || 0,
      clientesAtivos: clientes?.filter(c => c.status === 'ativo').length || 0,
      clientesInativos: clientes?.filter(c => c.status === 'inativo').length || 0,
      dataRelatorio: new Date().toLocaleString('pt-BR')
    }

    // Gerar conteúdo do relatório
    const relatorio = {
      titulo: 'Relatório de Clientes - AG Assessoria',
      dataGeracao: new Date().toISOString(),
      estatisticas: stats,
      clientes: clientes || [],
      empresas: empresas || [],
      resumo: {
        porcentagemAtivos: stats.totalClientes > 0 ? Math.round((stats.clientesAtivos / stats.totalClientes) * 100) : 0,
        clientesRecentes: clientes?.filter(c => {
          const created = new Date(c.created_at)
          const now = new Date()
          const diffTime = Math.abs(now.getTime() - created.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          return diffDays <= 30
        }).length || 0
      }
    }

    console.log('✅ Relatório gerado com sucesso:', {
      totalClientes: stats.totalClientes,
      totalEmpresas: stats.totalEmpresas,
      clientesAtivos: stats.clientesAtivos
    })

    return NextResponse.json({
      success: true,
      message: 'Relatório gerado com sucesso!',
      data: relatorio
    })

  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}