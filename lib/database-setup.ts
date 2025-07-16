import { supabase } from './supabase'

export async function setupDatabase() {
  console.log('Iniciando setup do banco de dados...')
  
  try {
    // Tentar executar uma query simples para verificar se a tabela existe
    const { error: testError } = await supabase
      .from('alvaras')
      .select('*')
      .limit(1)

    if (testError && testError.code === '42P01') {
      console.log('Tabela não existe. Precisa ser criada manualmente no painel do Supabase.')
      console.log('Acesse: https://supabase.com/dashboard/project/sctlaitmqghnoxiqmbiw')
      console.log('Vá para SQL Editor e execute o script em supabase_schema.sql')
      
      return { 
        success: false, 
        error: 'Tabela não existe. Execute o SQL manualmente no painel do Supabase.' 
      }
    }

    console.log('Tabela alvaras já existe!')
    return { success: true }
  } catch (error) {
    console.error('Erro no setup do banco:', error)
    return { success: false, error }
  }
}

// Função para inserir dados de exemplo
export async function insertSampleData() {
  console.log('Inserindo dados de exemplo...')
  
  try {
    const sampleData = [
      {
        empresa: 'Restaurante Sabor Mineiro',
        cnpj: '12.345.678/0001-90',
        tipo: 'vigilancia_sanitaria',
        numero_protocolo: 'VS-2024-001',
        data_emissao: '2024-01-15',
        data_vencimento: '2025-01-15',
        status: 'em_dia',
        observacoes: 'Renovação sem pendências',
        responsavel: 'João Silva',
        contato: '(11) 99999-9999'
      },
      {
        empresa: 'Farmácia Central',
        cnpj: '98.765.432/0001-10',
        tipo: 'vigilancia_sanitaria',
        numero_protocolo: 'VS-2024-002',
        data_emissao: '2024-07-01',
        data_vencimento: '2025-07-01',
        status: 'vencendo',
        observacoes: 'Vencimento próximo - providenciar renovação',
        responsavel: 'Maria Santos',
        contato: '(11) 88888-8888'
      },
      {
        empresa: 'Hotel Estrela',
        cnpj: '11.222.333/0001-44',
        tipo: 'bombeiro',
        numero_protocolo: 'CB-2024-003',
        data_emissao: '2023-12-01',
        data_vencimento: '2024-12-01',
        status: 'vencido',
        observacoes: 'URGENTE: Alvará vencido - regularizar imediatamente',
        responsavel: 'Carlos Oliveira',
        contato: '(11) 77777-7777'
      },
      {
        empresa: 'Loja do Centro',
        cnpj: '55.666.777/0001-88',
        tipo: 'municipal',
        numero_protocolo: 'MUN-2024-004',
        data_emissao: '2024-03-10',
        data_vencimento: '2025-03-10',
        status: 'em_dia',
        observacoes: 'Alvará de funcionamento municipal renovado',
        responsavel: 'Ana Costa',
        contato: '(11) 66666-6666'
      }
    ]

    const { error } = await supabase
      .from('alvaras')
      .insert(sampleData)

    if (error) {
      console.error('Erro ao inserir dados de exemplo:', error)
      throw error
    }

    console.log('Dados de exemplo inseridos com sucesso!')
    return { success: true }
  } catch (error) {
    console.error('Erro ao inserir dados:', error)
    return { success: false, error }
  }
}