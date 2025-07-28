import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testando conexão com Supabase...')
    
    // Verificar se há empresas na base
    const { data: existingEmpresas, error: selectError } = await supabase
      .from('empresas')
      .select('*')
      .limit(10)
    
    if (selectError) {
      console.error('Erro ao buscar empresas:', selectError)
      return NextResponse.json({ 
        error: selectError.message,
        success: false 
      }, { status: 500 })
    }
    
    console.log('Empresas existentes:', existingEmpresas?.length || 0)
    
    // Se não há empresas, inserir dados de exemplo
    if (!existingEmpresas || existingEmpresas.length === 0) {
      console.log('Inserindo empresas de exemplo...')
      
      const empresasExemplo = [
        {
          cliente_id: '11111111-1111-1111-1111-111111111111',
          razao_social: 'Tech Solutions Ltda',
          nome_fantasia: 'Tech Solutions',
          cnpj: '12.345.678/0001-90',
          atividade_principal: 'Desenvolvimento de Software',
          endereco: 'Rua da Tecnologia, 123, São Paulo - SP',
          telefone: '(11) 99999-9999',
          email: 'contato@techsolutions.com.br',
          capital_social: 100000,
          tipo_empresa: 'ltda',
          status: 'aprovada',
          responsavel_abertura: 'João Silva',
          observacoes: 'Empresa de tecnologia especializada em soluções web'
        },
        {
          cliente_id: '22222222-2222-2222-2222-222222222222',
          razao_social: 'Bella Estética MEI',
          nome_fantasia: 'Bella Estética',
          cnpj: '98.765.432/0001-10',
          atividade_principal: 'Serviços de Beleza e Estética',
          endereco: 'Av. Beleza, 456, Rio de Janeiro - RJ',
          telefone: '(21) 88888-8888',
          email: 'contato@bellaestetica.com.br',
          capital_social: 10000,
          tipo_empresa: 'mei',
          status: 'aprovada',
          responsavel_abertura: 'Maria Santos',
          observacoes: 'Microempreendedor individual no ramo de estética'
        },
        {
          cliente_id: '33333333-3333-3333-3333-333333333333',
          razao_social: 'Distribuidora ABC S.A.',
          nome_fantasia: 'ABC Distribuidora',
          cnpj: '55.444.333/0001-22',
          atividade_principal: 'Distribuição de Produtos Alimentícios',
          endereco: 'Rod. Santos Dumont, 789, Belo Horizonte - MG',
          telefone: '(31) 77777-7777',
          email: 'vendas@abcdistribuidora.com.br',
          capital_social: 500000,
          tipo_empresa: 'sa',
          status: 'aprovada',
          responsavel_abertura: 'Carlos Oliveira',
          observacoes: 'Distribuidora de alimentos com ampla rede de fornecedores'
        }
      ]
      
      const { data: insertedEmpresas, error: insertError } = await supabase
        .from('empresas')
        .insert(empresasExemplo)
        .select()
      
      if (insertError) {
        console.error('Erro ao inserir empresas:', insertError)
        return NextResponse.json({ 
          error: insertError.message,
          success: false,
          existingCount: existingEmpresas?.length || 0
        }, { status: 500 })
      }
      
      console.log('Empresas inseridas:', insertedEmpresas?.length || 0)
      
      return NextResponse.json({
        success: true,
        message: 'Empresas de exemplo inseridas com sucesso',
        existingCount: existingEmpresas?.length || 0,
        insertedCount: insertedEmpresas?.length || 0,
        totalCount: (existingEmpresas?.length || 0) + (insertedEmpresas?.length || 0)
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Empresas já existem na base de dados',
      count: existingEmpresas.length,
      empresas: existingEmpresas.map(e => ({
        id: e.id,
        razaoSocial: e.razao_social,
        nomeFantasia: e.nome_fantasia,
        status: e.status
      }))
    })
    
  } catch (error) {
    console.error('Erro geral:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false 
    }, { status: 500 })
  }
}