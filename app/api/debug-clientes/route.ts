import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Debug: Buscando dados dos clientes...')
    
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erro ao buscar clientes:', error)
      return NextResponse.json({ 
        error: error.message,
        success: false 
      }, { status: 500 })
    }

    console.log(`📋 Encontrados ${clientes?.length || 0} clientes total`)
    console.log('👤 Clientes encontrados:', clientes?.map(c => ({
      id: c.id,
      nome: c.nome,
      cnpj: c.cnpj,
      status: c.status,
      email: c.email
    })))
    
    return NextResponse.json({
      success: true,
      count: clientes?.length || 0,
      clientes: clientes || [],
      message: `Successfully loaded ${clientes?.length || 0} clientes`
    })
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false 
    }, { status: 500 })
  }
}