import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🔄 Resetando portal do cliente com senha provisória...')
    
    // Simular limpeza completa do localStorage e recriação com dados corretos
    const responseData = {
      success: true,
      message: 'Portal resetado com senha provisória',
      actions: [
        'localStorage.clear()',
        'localStorage.setItem("portal_responsaveis", JSON.stringify([eduardoGomesComSenhaProvisoria]))'
      ],
      credentials: {
        cpf: '218.680.918-48',
        senha: '5VD1fAnL',
        senhaInicial: true,
        observacao: 'Esta é uma senha PROVISÓRIA. O usuário será forçado a criar uma nova senha na primeira vez que fizer login.'
      },
      fluxo: {
        passo1: 'Login com CPF: 218.680.918-48 e senha: 5VD1fAnL',
        passo2: 'Sistema detecta que é senha provisória (senhaInicial: true)',
        passo3: 'Modal forçado para criação de nova senha personalizada',
        passo4: 'Após criar nova senha, usuário acessa o portal normalmente'
      },
      dadosEduardoGomes: {
        id: 'eduardo-gomes-001',
        nome: 'Eduardo Aparecido Gomes',
        cpf: '218.680.918-48',
        email: 'eduardo.gomes@legcomercio.com.br',
        telefone: '(16) 99123-4567',
        senha: '5VD1fAnL',
        senhaInicial: true, // ✅ CONFIGURAÇÃO CORRETA PARA SENHA PROVISÓRIA
        empresas: [{
          id: 'leg-comercio-001',
          cnpj: '00.000.000/0001-28',
          razaoSocial: 'LEG - COMERCIO E SERVICOS LTDA',
          nomeFantasia: 'LEG Comércio',
          email: 'contato@legcomercio.com.br',
          telefone: '(16) 99123-4567',
          endereco: 'Rua das Empresas, 123 - Centro - Ribeirão Preto/SP',
          responsavelContabil: 'AG Assessoria Contábil',
          dataVinculacao: '2024-01-15T00:00:00.000Z',
          status: 'ativo',
          plano: 'completo',
          avatar: '',
          responsavelCpf: '218.680.918-48'
        }],
        empresasIds: ['leg-comercio-001'],
        dataCriacao: '2024-01-15T00:00:00.000Z',
        ultimoAcesso: new Date().toISOString()
      }
    }
    
    console.log('✅ Portal resetado com senha provisória configurada corretamente')
    console.log('🔑 CREDENCIAIS PROVISÓRIAS:', responseData.credentials)
    
    return NextResponse.json(responseData)
    
  } catch (error) {
    console.error('❌ Erro ao resetar portal:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Falha ao resetar portal'
    }, { status: 500 })
  }
}