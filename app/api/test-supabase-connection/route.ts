import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔧 Testando conexão com o Supabase...')
    
    // Teste básico de conectividade
    const { count, error } = await supabase
      .from('empresas')
      .select('*', { count: 'exact' })
    
    if (error) {
      console.error('❌ Erro na conexão Supabase:', error)
      return NextResponse.json({ 
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    console.log('✅ Conexão Supabase bem-sucedida:', count)
    
    // Teste de busca das empresas
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (empresasError) {
      console.error('❌ Erro ao buscar empresas:', empresasError)
      return NextResponse.json({ 
        success: false,
        error: empresasError.message,
        details: empresasError
      }, { status: 500 })
    }

    console.log('🏢 Empresas encontradas:', empresas?.length)
    console.log('📋 Detalhes das empresas:', empresas?.map(e => ({ 
      id: e.id, 
      razao_social: e.razao_social,
      cnpj: e.cnpj 
    })))
    
    return NextResponse.json({
      success: true,
      message: 'Conexão Supabase funcionando perfeitamente',
      count: empresas?.length || 0,
      empresas: empresas?.map(e => ({
        id: e.id,
        razaoSocial: e.razao_social,
        cnpj: e.cnpj,
        status: e.status
      })) || []
    })
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: error
    }, { status: 500 })
  }
}