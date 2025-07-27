import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Buscando logs do sistema...')
    
    // Simular logs do sistema (em produção isso viria de arquivos de log ou banco)
    const logs = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        level: 'INFO',
        message: 'Sistema iniciado com sucesso',
        component: 'Sistema',
        user: 'Sistema'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        level: 'SUCCESS',
        message: 'Login realizado com sucesso',
        component: 'Autenticação',
        user: 'agassessoriacontrole@gmail.com'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        level: 'INFO',
        message: 'Cliente criado: Tech Solutions Ltda',
        component: 'Clientes',
        user: 'Administrador Principal'
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        level: 'SUCCESS',
        message: 'Backup automático realizado',
        component: 'Backup',
        user: 'Sistema'
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        level: 'WARNING',
        message: 'Alvará vencendo em 7 dias: Silva & Santos',
        component: 'Alvarás',
        user: 'Sistema'
      },
      {
        id: 6,
        timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
        level: 'INFO',
        message: 'Relatório de clientes gerado',
        component: 'Relatórios',
        user: 'Administrador Principal'
      },
      {
        id: 7,
        timestamp: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
        level: 'SUCCESS',
        message: 'Obrigação cumprida: DARF Mensal',
        component: 'Obrigações',
        user: 'Contabilidade'
      },
      {
        id: 8,
        timestamp: new Date(Date.now() - 125 * 60 * 1000).toISOString(),
        level: 'INFO',
        message: 'Documento enviado via email',
        component: 'Documentos',
        user: 'Administrador Principal'
      }
    ]

    // Estatísticas dos logs
    const stats = {
      total: logs.length,
      info: logs.filter(l => l.level === 'INFO').length,
      success: logs.filter(l => l.level === 'SUCCESS').length,
      warning: logs.filter(l => l.level === 'WARNING').length,
      error: logs.filter(l => l.level === 'ERROR').length,
      ultimaAtualizacao: new Date().toISOString()
    }

    console.log('✅ Logs do sistema carregados:', {
      totalLogs: stats.total,
      info: stats.info,
      success: stats.success,
      warning: stats.warning,
      error: stats.error
    })

    return NextResponse.json({
      success: true,
      message: 'Logs carregados com sucesso!',
      data: {
        logs: logs.reverse(), // Mais recentes primeiro
        statistics: stats
      }
    })

  } catch (error) {
    console.error('❌ Erro ao buscar logs:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}