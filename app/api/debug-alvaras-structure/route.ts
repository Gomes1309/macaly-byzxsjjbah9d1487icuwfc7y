import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🔍 Verificando estrutura da tabela alvaras...')
    
    // 1. Tentar uma consulta SELECT * na tabela alvaras
    console.log('🔍 Tentando consulta SELECT *...')
    const { data: allData, error: allError } = await supabase
      .from('alvaras')
      .select('*')
      .limit(3)
    
    let result: any = {
      success: true,
      tests: []
    }
    
    if (allError) {
      console.error('❌ Erro SELECT *:', allError)
      result.tests.push({
        test: 'SELECT *',
        success: false,
        error: allError.message,
        details: allError
      })
    } else {
      console.log('✅ SELECT * funcionou:', allData?.length || 0, 'registros')
      
      // Se há dados, mostrar as chaves (colunas) do primeiro registro
      let currentColumns: string[] | null = null
      if (allData && allData.length > 0) {
        currentColumns = Object.keys(allData[0])
      }
      
      result.tests.push({
        test: 'SELECT *',
        success: true,
        count: allData?.length || 0,
        sample: allData?.[0] || null,
        currentColumns: currentColumns
      })
    }
    
    // 2. Tentar consulta específica por campos esperados
    console.log('🔍 Tentando consulta com campos específicos...')
    const { data: specificData, error: specificError } = await supabase
      .from('alvaras')
      .select('id, empresa, cnpj, contato, responsavel')
      .limit(1)
    
    if (specificError) {
      console.error('❌ Erro campos específicos:', specificError)
      result.tests.push({
        test: 'SELECT campos específicos',
        success: false,
        error: specificError.message,
        details: specificError
      })
    } else {
      console.log('✅ Campos específicos funcionaram:', specificData?.length || 0)
      result.tests.push({
        test: 'SELECT campos específicos',
        success: true,
        count: specificData?.length || 0,
        sample: specificData?.[0] || null
      })
    }
    
    // 3. Testar apenas campo contato
    console.log('🔍 Tentando consulta apenas campo contato...')
    const { data: contatoData, error: contatoError } = await supabase
      .from('alvaras')
      .select('contato')
      .limit(1)
    
    if (contatoError) {
      console.error('❌ Erro campo contato:', contatoError)
      result.tests.push({
        test: 'SELECT contato',
        success: false,
        error: contatoError.message,
        details: contatoError
      })
    } else {
      console.log('✅ Campo contato funcionou:', contatoData?.length || 0)
      result.tests.push({
        test: 'SELECT contato',
        success: true,
        count: contatoData?.length || 0,
        sample: contatoData?.[0] || null
      })
    }
    
    // 4. Tentar inserir um registro de teste
    console.log('🔍 Tentando INSERT de teste...')
    const testData = {
      empresa: 'Teste Empresa',
      cnpj: '00.000.000/0000-00',
      tipo: 'municipal',
      numero_protocolo: 'TEST-001',
      data_emissao: '2025-01-01',
      data_vencimento: '2025-12-31',
      responsavel: 'Teste Responsavel',
      contato: 'teste@teste.com'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('alvaras')
      .insert([testData])
      .select()
    
    if (insertError) {
      console.error('❌ Erro INSERT:', insertError)
      result.tests.push({
        test: 'INSERT teste',
        success: false,
        error: insertError.message,
        details: insertError,
        testData: testData
      })
    } else {
      console.log('✅ INSERT funcionou:', insertData?.length || 0)
      result.tests.push({
        test: 'INSERT teste',
        success: true,
        count: insertData?.length || 0,
        inserted: insertData?.[0] || null
      })
      
      // Limpar o registro de teste
      if (insertData?.[0]?.id) {
        await supabase.from('alvaras').delete().eq('id', insertData[0].id)
      }
    }
    
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro desconhecido',
      details: error
    })
  }
}