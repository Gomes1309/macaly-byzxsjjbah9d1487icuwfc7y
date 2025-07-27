import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Verificando estrutura da tabela usuarios...')
    
    // Verificar estrutura da tabela
    const { data: structure, error: structureError } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT 
            column_name, 
            data_type, 
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'usuarios' 
          ORDER BY ordinal_position;
        `
      })

    if (structureError) {
      console.error('❌ Erro ao verificar estrutura:', structureError)
      // Tentar método alternativo
      const { data: altStructure, error: altError } = await supabase
        .from('usuarios')
        .select('*')
        .limit(1)
        
      return NextResponse.json({
        success: false,
        error: structureError,
        alternativeMethod: altError ? 'Também falhou' : 'Sucesso na consulta alternativa',
        sampleData: altStructure
      })
    }

    console.log('✅ Estrutura da tabela usuarios:', structure)

    // Tentar buscar um usuário para ver campos disponíveis
    const { data: sampleUser, error: sampleError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      structure: structure,
      sampleUser: sampleUser,
      sampleError: sampleError,
      message: 'Estrutura da tabela usuarios verificada'
    })

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: error,
      message: 'Erro ao verificar estrutura da tabela usuarios'
    }, { status: 500 })
  }
}