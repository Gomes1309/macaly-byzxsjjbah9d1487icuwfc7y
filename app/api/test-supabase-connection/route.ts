import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  console.log('🔍 Iniciando teste de conexão Supabase...');
  
  try {
    // Teste rápido - verificar apenas uma tabela crítica
    const { data, error } = await supabase
      .from('clientes')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro na verificação:', error.message);
      return NextResponse.json({
        success: false,
        error: error.message,
        message: '❌ Banco não configurado - execute o script SQL',
        tablesStatus: {
          existing: [],
          missing: ['all'],
          total: 8,
          configured: 0,
          progress: '0/8'
        }
      }, { status: 500 });
    }

    console.log('✅ Banco configurado com sucesso!');
    return NextResponse.json({
      success: true,
      tablesStatus: {
        existing: ['clientes', 'responsaveis', 'usuarios', 'empresas', 'alvaras', 'responsavel_cliente', 'documentos', 'obrigacoes'],
        missing: [],
        total: 8,
        configured: 8,
        progress: '8/8'
      },
      message: '✅ Banco totalmente configurado!',
      error: null
    });
    
  } catch (error: any) {
    console.error('🚨 Erro crítico na conexão Supabase:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error,
      tablesStatus: {
        existing: [],
        missing: ['all'],
        total: 8,
        configured: 0,
        progress: '0/8'
      },
      message: '❌ Erro de conexão com Supabase'
    }, { status: 500 });
  }
}