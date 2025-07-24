import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Corrigindo CNPJ da empresa existente...')
    
    // Primeiro, buscar o cliente original para pegar o CNPJ correto
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('*')
      .eq('nome', 'LEG - COMERCIO E SERVICOS LTDA')
      .single()
    
    if (clienteError) {
      console.error('❌ Erro ao buscar cliente:', clienteError)
      return NextResponse.json({ 
        error: clienteError.message,
        success: false 
      }, { status: 500 })
    }

    console.log('👤 Cliente encontrado:', {
      id: cliente.id,
      nome: cliente.nome,
      cnpj_original: cliente.cpf_cnpj
    })

    // Agora atualizar a empresa com o CNPJ correto
    const { data: empresaAtualizada, error: updateError } = await supabase
      .from('empresas')
      .update({
        cnpj: cliente.cpf_cnpj || 'Não informado',
        updated_at: new Date().toISOString()
      })
      .eq('cliente_id', cliente.id)
      .select()
    
    if (updateError) {
      console.error('❌ Erro ao atualizar empresa:', updateError)
      return NextResponse.json({ 
        error: updateError.message,
        success: false 
      }, { status: 500 })
    }

    console.log('✅ Empresa atualizada com sucesso:', empresaAtualizada)
    
    return NextResponse.json({
      success: true,
      message: 'CNPJ da empresa corrigido com sucesso',
      cliente: {
        id: cliente.id,
        nome: cliente.nome,
        cnpj_correto: cliente.cpf_cnpj
      },
      empresa_atualizada: empresaAtualizada?.[0] || null
    })
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false 
    }, { status: 500 })
  }
}