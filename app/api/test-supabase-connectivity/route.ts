import { NextResponse } from 'next/server'
import { testSupabaseConnectivity } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Iniciando teste avançado de conectividade do Supabase...');
    
    const result = await testSupabaseConnectivity();
    
    console.log('✅ Teste de conectividade concluído:', result);
    
    return NextResponse.json({ 
      success: result.connected && result.configured,
      result,
      summary: {
        configured: result.configured,
        connected: result.connected,
        tablesFound: Object.values(result.tablesExist).filter(Boolean).length,
        totalTables: Object.keys(result.tablesExist).length,
        errorCount: result.errors.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Erro crítico no teste de conectividade:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error?.message || String(error),
      result: {
        configured: false,
        connected: false,
        tablesExist: {},
        errors: [`Erro crítico: ${error?.message || String(error)}`],
        details: {}
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}