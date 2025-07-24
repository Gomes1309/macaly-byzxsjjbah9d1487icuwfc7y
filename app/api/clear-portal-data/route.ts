import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Limpando dados do portal do cliente...')

    // Resposta de sucesso indicando que o localStorage deve ser limpo no frontend
    return NextResponse.json({
      success: true,
      message: 'Portal limpo com sucesso',
      clearedItems: [
        'portal_responsaveis',
        'portal_responsavel_auth', 
        'portal_client_auth',
        'portal_current_responsavel',
        'portal_current_cliente'
      ]
    })

  } catch (error) {
    console.error('❌ Erro ao limpar portal:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}