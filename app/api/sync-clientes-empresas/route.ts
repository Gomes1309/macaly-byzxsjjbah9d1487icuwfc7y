import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔄 Sincronizando clientes como empresas...')
    
    // Buscar todos os clientes ativos
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .eq('status', 'ativo')
    
    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError)
      return NextResponse.json({ 
        error: clientesError.message,
        success: false 
      }, { status: 500 })
    }

    console.log(`📋 Encontrados ${clientes?.length || 0} clientes ativos`)

    if (!clientes || clientes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum cliente ativo encontrado para sincronizar',
        count: 0
      })
    }

    // Converter clientes em empresas
    const empresasParaInserir = clientes.map(cliente => ({
      cliente_id: cliente.id,
      razao_social: cliente.nome || cliente.razao_social || 'Sem nome',
      nome_fantasia: cliente.nome_fantasia || cliente.nome || 'Sem nome fantasia',
      cnpj: cliente.cpf_cnpj || cliente.cnpj || 'Não informado',
      email: cliente.email || 'nao@informado.com',
      telefone: cliente.telefone || '(00) 0000-0000',
      endereco: `${cliente.endereco || 'Endereço não informado'}`,
      tipo_empresa: cliente.tipo_cliente === 'pessoa_fisica' ? 'mei' : 'ltda',
      status: 'aprovada',
      atividade_principal: 'Não informada',
      capital_social: 0,
      responsavel_abertura: 'Sistema'
    }))

    // Inserir empresas (usando upsert para evitar duplicatas por CNPJ)
    const { data: empresasInseridas, error: insertError } = await supabase
      .from('empresas')
      .upsert(empresasParaInserir, {
        onConflict: 'cnpj'
      })
      .select()

    if (insertError) {
      console.error('❌ Erro ao inserir empresas:', insertError)
      return NextResponse.json({ 
        error: insertError.message,
        success: false 
      }, { status: 500 })
    }

    console.log(`✅ ${empresasInseridas?.length || 0} empresas sincronizadas com sucesso`)
    
    return NextResponse.json({
      success: true,
      message: `${empresasInseridas?.length || 0} empresas sincronizadas com os dados dos clientes`,
      count: empresasInseridas?.length || 0,
      empresas: empresasInseridas?.map(e => ({
        id: e.id,
        clienteId: e.cliente_id,
        razaoSocial: e.razao_social,
        cnpj: e.cnpj,
        status: e.status
      })) || []
    })
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false 
    }, { status: 500 })
  }
}