export async function POST() {
  try {
    console.log('Criando dados de teste para Eduardo Gomes...')
    
    // Dados da empresa teste
    const empresaTeste = {
      id: 'emp_001',
      cnpj: '12.345.678/0001-90',
      razaoSocial: 'Empresa Teste Ltda',
      nomeFantasia: 'Teste Corp',
      email: 'contato@empresateste.com.br',
      telefone: '(16) 3333-4444',
      endereco: 'Rua das Empresas, 123 - Centro - Ribeirão Preto/SP',
      responsavelContabil: 'AG Assessoria Contábil',
      dataVinculacao: new Date(),
      status: 'ativo' as const,
      plano: 'completo' as const,
      responsavelCpf: '123.456.789-00'
    }
    
    // Dados do responsável de teste
    const responsavelTeste = {
      id: 'resp_eduardo_001',
      nome: 'Eduardo Gomes',
      cpf: '123.456.789-00',
      email: 'eduardo.gomes@teste.com',
      telefone: '(16) 99999-9999',
      senha: 'AG2024@Test', // Senha alfanumérica forte
      senhaInicial: true,
      empresas: [empresaTeste], // Array com a empresa teste
      empresasIds: ['emp_001'], // IDs das empresas que tem acesso
      dataCriacao: new Date(),
      ultimoAcesso: undefined
    }

    console.log('Responsável de teste configurado:', responsavelTeste)
    
    return Response.json({
      success: true,
      message: 'Dados de teste criados com sucesso!',
      data: {
        responsavel: responsavelTeste,
        instructions: {
          cpf: '123.456.789-00',
          senha: 'AG2024@Test',
          empresaNome: 'Empresa Teste Ltda'
        }
      }
    })
    
  } catch (error) {
    console.error('Erro ao criar dados de teste:', error)
    return Response.json({
      success: false,
      message: 'Erro ao criar dados de teste',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}