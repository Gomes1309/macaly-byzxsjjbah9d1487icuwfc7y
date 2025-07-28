import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🧪 Testando configuração Supabase para frontend...')
    
    // Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔑 Variáveis de ambiente:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlStart: supabaseUrl?.substring(0, 20) + '...',
      keyStart: supabaseKey?.substring(0, 20) + '...'
    })
    
    // Testar conexão
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro na conexão:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro de conexão',
        details: error,
        env: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        }
      }, { status: 400 })
    }
    
    console.log('✅ Conexão Supabase OK')
    
    return NextResponse.json({ 
      success: true,
      message: 'Supabase configurado corretamente',
      env: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      }
    })
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro inesperado',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}