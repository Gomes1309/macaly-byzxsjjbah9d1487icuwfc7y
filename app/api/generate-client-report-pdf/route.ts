import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  console.log('📊 Iniciando geração de relatório PDF de clientes...')
  
  try {
    const body = await request.json()
    const { format = 'pdf', orderBy = 'alphabetical' } = body
    
    // Buscar clientes do Supabase
    console.log('🔍 Buscando clientes no Supabase...')
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .order('nome', { ascending: true })

    if (clientesError) {
      console.error('❌ Erro ao buscar clientes:', clientesError)
      return NextResponse.json({ 
        success: false, 
        error: `Erro ao buscar clientes: ${clientesError.message}` 
      }, { status: 500 })
    }

    console.log(`✅ ${clientes?.length || 0} clientes encontrados`)

    // Buscar empresas para estatísticas adicionais
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('*')

    const totalEmpresas = empresas?.length || 0
    const clientesAtivos = clientes?.filter(c => c.status === 'ativo').length || 0
    const pessoasJuridicas = clientes?.filter(c => c.tipo_cliente === 'pessoa_juridica').length || 0
    const pessoasFisicas = clientes?.filter(c => c.tipo_cliente === 'pessoa_fisica').length || 0

    // Preparar dados do relatório
    const reportData = {
      metadata: {
        titulo: 'Relatório de Clientes - AG Assessoria',
        dataGeracao: new Date().toLocaleString('pt-BR'),
        totalClientes: clientes?.length || 0,
        clientesAtivos,
        pessoasJuridicas,
        pessoasFisicas,
        totalEmpresas,
        orderBy: orderBy === 'alphabetical' ? 'Ordem Alfabética' : 'Data de Cadastro'
      },
      clientes: clientes?.map(cliente => ({
        nome: cliente.nome,
        cpfCnpj: cliente.cpf_cnpj || cliente.cpfCnpj || 'Não informado',
        email: cliente.email || 'Não informado',
        telefone: cliente.telefone || 'Não informado',
        tipoCliente: cliente.tipo_cliente === 'pessoa_juridica' ? 'Pessoa Jurídica' : 'Pessoa Física',
        status: cliente.status === 'ativo' ? 'Ativo' : cliente.status === 'inativo' ? 'Inativo' : 'Suspenso',
        endereco: cliente.endereco || 'Não informado',
        dataCadastro: cliente.data_cadastro ? new Date(cliente.data_cadastro).toLocaleDateString('pt-BR') : 'Não informado',
        observacoes: cliente.observacoes || ''
      })) || []
    }

    // Ordenar por CNPJ alfabeticamente se solicitado
    if (orderBy === 'cnpj') {
      reportData.clientes.sort((a, b) => a.cpfCnpj.localeCompare(b.cpfCnpj))
      reportData.metadata.orderBy = 'CNPJ/CPF (Ordem Alfabética)'
    }

    console.log('📈 Relatório preparado:', {
      totalClientes: reportData.metadata.totalClientes,
      clientesAtivos: reportData.metadata.clientesAtivos,
      totalEmpresas: reportData.metadata.totalEmpresas
    })

    return NextResponse.json({ 
      success: true, 
      data: reportData,
      message: `Relatório gerado com ${reportData.metadata.totalClientes} clientes`
    })

  } catch (error) {
    console.error('❌ Erro na geração do relatório:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido na geração do relatório' 
    }, { status: 500 })
  }
}

export async function GET() {
  console.log('📊 Buscando estatísticas rápidas de clientes...')
  
  try {
    // Buscar totais básicos
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('id, nome, cpf_cnpj, status, tipo_cliente')
      .order('nome', { ascending: true })

    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id')

    if (clientesError) {
      return NextResponse.json({ 
        success: false, 
        error: `Erro ao buscar dados: ${clientesError.message}` 
      }, { status: 500 })
    }

    const stats = {
      totalClientes: clientes?.length || 0,
      clientesAtivos: clientes?.filter(c => c.status === 'ativo').length || 0,
      pessoasJuridicas: clientes?.filter(c => c.tipo_cliente === 'pessoa_juridica').length || 0,
      totalEmpresas: empresas?.length || 0,
      ultimaAtualizacao: new Date().toLocaleString('pt-BR')
    }

    return NextResponse.json({ 
      success: true, 
      stats,
      message: `${stats.totalClientes} clientes cadastrados`
    })

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 })
  }
}