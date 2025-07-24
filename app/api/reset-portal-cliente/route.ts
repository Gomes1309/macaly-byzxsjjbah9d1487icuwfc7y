import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Solicitação de reset do portal do cliente recebida...')

    // Validação simples para ambientes de desenvolvimento/teste
    const origin = request.headers.get('origin')
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         origin?.includes('macaly.dev') || 
                         origin?.includes('localhost')

    if (!isDevelopment) {
      console.warn('⚠️ Tentativa de reset negada - ambiente não autorizado')
      return NextResponse.json(
        { success: false, error: 'Operação não permitida neste ambiente' },
        { status: 403 }
      )
    }

    // Instruções seguras para o cliente executar
    const instructions = [
      'Limpar dados do localStorage',
      'Recriar responsável Eduardo Gomes',
      'Definir credenciais corretas',
      'Atualizar estado do componente'
    ]

    console.log('✅ Reset autorizado para ambiente de desenvolvimento/teste')

    return NextResponse.json({
      success: true,
      message: 'Portal do cliente resetado com sucesso',
      instructions,
      credentials: {
        cpf: '218.680.918-48',
        senha: '5VD1fAnL'
      }
    })

  } catch (error) {
    console.error('Erro ao resetar portal:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}