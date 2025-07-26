import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Debugging usuarios hook issue...')
    
    // Testar conexão básica
    const { data: testConnection, error: connectionError } = await supabase
      .from('usuarios')
      .select('count')
      .single()
    
    if (connectionError) {
      console.error('❌ Connection error:', connectionError)
    }
    
    // Testar query que o hook usa
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('📊 Query result:', { data: data?.length || 0, error: error?.message || 'none' })
    
    if (error) {
      console.error('❌ Query error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error,
        step: 'query_usuarios'
      }, { status: 400 })
    }
    
    // Verificar estrutura dos dados
    if (data && data.length > 0) {
      console.log('📋 First user structure:', Object.keys(data[0]))
      console.log('📋 First user data (limited):', { 
        id: data[0].id, 
        nome: data[0].nome, 
        email: data[0].email,
        hasPassword: !!data[0].senha_hash
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      data: data || [],
      count: data?.length || 0,
      message: 'Debug completed successfully'
    })
    
  } catch (err) {
    console.error('💥 Unexpected error:', err)
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error',
      details: err instanceof Error ? err.message : String(err),
      step: 'catch_block'
    }, { status: 500 })
  }
}