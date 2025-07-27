import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('💾 Iniciando exportação de dados...')
    
    // Buscar todos os dados principais
    const [clientesResult, empresasResult, usuariosResult, alvarasResult, obrigacoesResult] = await Promise.all([
      supabase.from('clientes').select('*'),
      supabase.from('empresas').select('*'),
      supabase.from('usuarios').select('*'),
      supabase.from('alvaras').select('*'),
      supabase.from('obrigacoes').select('*')
    ])

    const dados = {
      clientes: clientesResult.data || [],
      empresas: empresasResult.data || [],
      usuarios: usuariosResult.data || [],
      alvaras: alvarasResult.data || [],
      obrigacoes: obrigacoesResult.data || []
    }

    // Calcular estatísticas
    const stats = {
      totalClientes: dados.clientes.length,
      totalEmpresas: dados.empresas.length,
      totalUsuarios: dados.usuarios.length,
      totalAlvaras: dados.alvaras.length,
      totalObrigacoes: dados.obrigacoes.length,
      dataExportacao: new Date().toISOString()
    }

    // Gerar arquivo de exportação
    const exportData = {
      metadata: {
        sistema: 'AG Assessoria - Sistema de Gestão',
        versao: '1.0.0',
        dataExportacao: new Date().toLocaleString('pt-BR'),
        totalRegistros: stats.totalClientes + stats.totalEmpresas + stats.totalUsuarios + stats.totalAlvaras + stats.totalObrigacoes
      },
      estatisticas: stats,
      dados: dados
    }

    console.log('✅ Dados exportados com sucesso:', {
      totalRegistros: exportData.metadata.totalRegistros,
      clientes: stats.totalClientes,
      empresas: stats.totalEmpresas,
      usuarios: stats.totalUsuarios,
      alvaras: stats.totalAlvaras,
      obrigacoes: stats.totalObrigacoes
    })

    return NextResponse.json({
      success: true,
      message: 'Dados exportados com sucesso!',
      data: exportData,
      downloadUrl: `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`
    })

  } catch (error) {
    console.error('❌ Erro ao exportar dados:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}