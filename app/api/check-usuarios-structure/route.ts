import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Verificando estrutura da tabela usuarios...')
    
    // Tentar fazer uma query simples para ver os dados
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1)
    
    if (usuariosError) {
      console.log('❌ Erro ao consultar usuarios:', usuariosError)
      return NextResponse.json({
        success: false,
        error: usuariosError,
        message: 'Erro ao acessar tabela usuarios'
      })
    }
    
    // Se conseguiu buscar dados, mostrar estrutura
    const structure = usuarios && usuarios.length > 0 ? Object.keys(usuarios[0]) : []
    
    console.log('📋 Estrutura atual da tabela usuarios:', structure)
    
    return NextResponse.json({
      success: true,
      message: 'Estrutura da tabela usuarios verificada',
      data: {
        totalRecords: usuarios?.length || 0,
        columns: structure,
        sampleData: usuarios?.[0] || null
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro ao verificar estrutura da tabela',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}