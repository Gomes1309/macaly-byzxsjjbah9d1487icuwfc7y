import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Sincronizando portal com Supabase...')

    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️ Supabase não configurado, usando apenas localStorage')
      return NextResponse.json({
        success: true,
        message: 'Supabase não configurado, usando localStorage',
        usingDatabase: false
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'load_responsaveis':
        // Carregar responsáveis do banco
        const { data: responsaveis, error: loadError } = await supabase
          .from('responsaveis_pf')
          .select('*')
        
        if (loadError) {
          console.error('Erro ao carregar responsáveis:', loadError)
          throw loadError
        }

        return NextResponse.json({
          success: true,
          data: responsaveis || [],
          usingDatabase: true
        })

      case 'save_responsavel':
        // Salvar responsável no banco
        const { data: savedResponsavel, error: saveError } = await supabase
          .from('responsaveis_pf')
          .upsert(data)
          .select()
        
        if (saveError) {
          console.error('Erro ao salvar responsável:', saveError)
          throw saveError
        }

        return NextResponse.json({
          success: true,
          data: savedResponsavel,
          usingDatabase: true
        })

      case 'test_connection':
        // Testar conexão com Supabase
        const { data: testData, error: testError } = await supabase
          .from('responsaveis_pf')
          .select('id')
          .limit(1)
        
        return NextResponse.json({
          success: !testError,
          message: testError ? 'Erro na conexão' : 'Conexão OK',
          usingDatabase: !testError
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Ação não reconhecida' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Erro na sincronização com Supabase:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        usingDatabase: false
      },
      { status: 500 }
    )
  }
}