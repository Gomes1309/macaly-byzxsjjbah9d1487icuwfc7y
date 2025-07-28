import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugando estrutura da tabela usuarios...')

    // Buscar todos os usuários para ver os campos disponíveis
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .limit(5)

    if (error) {
      console.error('❌ Erro ao consultar tabela usuarios:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        debugInfo: {
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      })
    }

    console.log('✅ Dados encontrados:', data)

    // Obter estrutura dos campos
    const sampleStructure = data && data.length > 0 
      ? Object.keys(data[0]).reduce((acc, key) => {
          acc[key] = typeof data[0][key]
          return acc
        }, {} as Record<string, string>)
      : {}

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: data?.length || 0,
        sampleStructure,
        sampleData: data?.map(user => ({
          id: user.id,
          nome: user.nome,
          email: user.email,
          hasHashedPassword: !!user.senha_hash,
          campos: Object.keys(user)
        })) || []
      }
    })

  } catch (error) {
    console.error('💥 Erro interno:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}