import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  console.log('🔍 Debug endpoint - Checking empresas...')
  
  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('empresas')
      .select('count', { count: 'exact' })
    
    if (testError) {
      console.error('❌ Connection test failed:', testError)
      return NextResponse.json({ 
        success: false, 
        error: 'Connection failed',
        details: testError 
      })
    }

    console.log('✅ Connection test passed, total count:', testData)

    // Get all empresas
    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error fetching empresas:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      })
    }
    
    console.log(`📊 Found ${empresas?.length || 0} empresas:`, empresas?.map(e => ({
      id: e.id,
      razao_social: e.razao_social
    })))
    
    return NextResponse.json({
      success: true,
      count: empresas?.length || 0,
      empresas: empresas || [],
      message: `Successfully loaded ${empresas?.length || 0} empresas`
    })
    
  } catch (err) {
    console.error('💥 Unexpected error:', err)
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error',
      details: err instanceof Error ? err.message : String(err)
    })
  }
}