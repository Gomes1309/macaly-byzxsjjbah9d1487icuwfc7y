import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('👥 Iniciando backup de usuários...')
    
    // Buscar todos os usuários
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false })

    if (usuariosError) {
      console.error('❌ Erro ao buscar usuários:', usuariosError)
      return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
    }

    // Buscar responsáveis se existir a tabela
    let responsaveis: any[] = []
    try {
      const { data: responsaveisData } = await supabase
        .from('responsaveis')
        .select('*')
        .order('created_at', { ascending: false })
      responsaveis = responsaveisData || []
    } catch (error) {
      console.log('⚠️ Tabela responsaveis não encontrada, continuando...')
    }

    // Remover dados sensíveis (senhas)
    const usuariosSeguros = usuarios?.map(user => ({
      id: user.id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login
      // Senha removida por segurança
    })) || []

    const responsaveisSeguros = responsaveis.map((resp: any) => ({
      id: resp.id,
      nome: resp.nome,
      email: resp.email,
      cargo: resp.cargo,
      telefone: resp.telefone,
      status: resp.status,
      created_at: resp.created_at,
      updated_at: resp.updated_at,
      last_access: resp.last_access
      // Senha removida por segurança
    }))

    // Gerar backup
    const backup = {
      metadata: {
        sistema: 'AG Assessoria - Backup de Usuários',
        dataBackup: new Date().toISOString(),
        totalUsuarios: usuariosSeguros.length,
        totalResponsaveis: responsaveisSeguros.length,
        versao: '1.0.0'
      },
      usuarios: usuariosSeguros,
      responsaveis: responsaveisSeguros,
      estatisticas: {
        usuariosAtivos: usuariosSeguros.filter(u => u.status === 'ativo').length,
        usuariosInativos: usuariosSeguros.filter(u => u.status !== 'ativo').length,
        administradores: usuariosSeguros.filter(u => u.cargo === 'Administrador').length,
        funcionarios: usuariosSeguros.filter(u => u.cargo !== 'Administrador').length
      }
    }

    console.log('✅ Backup de usuários gerado com sucesso:', {
      totalUsuarios: backup.metadata.totalUsuarios,
      totalResponsaveis: backup.metadata.totalResponsaveis,
      usuariosAtivos: backup.estatisticas.usuariosAtivos,
      administradores: backup.estatisticas.administradores
    })

    return NextResponse.json({
      success: true,
      message: 'Backup de usuários gerado com sucesso!',
      data: backup,
      downloadUrl: `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backup, null, 2))}`
    })

  } catch (error) {
    console.error('❌ Erro ao fazer backup de usuários:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}