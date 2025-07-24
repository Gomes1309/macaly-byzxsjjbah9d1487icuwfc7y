import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE() {
  try {
    console.log('Excluindo empresas de exemplo...')
    
    // Excluir todas as empresas de exemplo baseadas nos IDs que inserimos
    const empresasExemplo = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222', 
      '33333333-3333-3333-3333-333333333333'
    ]
    
    const { error } = await supabase
      .from('empresas')
      .delete()
      .in('cliente_id', empresasExemplo)
    
    if (error) {
      console.error('Erro ao excluir empresas:', error)
      return NextResponse.json({ 
        error: error.message,
        success: false 
      }, { status: 500 })
    }
    
    console.log('Empresas de exemplo excluídas com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'Empresas de exemplo removidas do banco de dados',
      deletedIds: empresasExemplo
    })
    
  } catch (error) {
    console.error('Erro geral:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('Verificando empresas no banco...')
    
    // Verificar empresas existentes
    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar empresas:', error)
      return NextResponse.json({ 
        error: error.message,
        success: false 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      count: empresas?.length || 0,
      empresas: empresas?.map(e => ({
        id: e.id,
        clienteId: e.cliente_id,
        razaoSocial: e.razao_social,
        cnpj: e.cnpj,
        status: e.status
      })) || []
    })
    
  } catch (error) {
    console.error('Erro geral:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false 
    }, { status: 500 })
  }
}