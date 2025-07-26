import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🧪 Teste: Simulando geração de senha no admin...')
    
    // Simular o responsável criado no admin com a senha TcQ91SUy
    const eduardoGomesComNovaSenha = {
      id: 'eduardo-gomes-001',
      nome: 'Eduardo Aparecido Gomes',
      cpf: '218.680.918-48',
      email: 'eduardo.gomes@legcomercio.com.br',
      telefone: '(16) 99123-4567',
      senha: 'TcQ91SUy', // ✅ SENHA GERADA NO ADMIN (da imagem)
      senhaInicial: true, // 🔒 SENHA PROVISÓRIA - forçar troca
      empresas: [{
        id: 'leg-comercio-001',
        cnpj: '00.000.000/0001-28',
        razaoSocial: 'LEG - COMERCIO E SERVICOS LTDA',
        nomeFantasia: 'LEG Comércio',
        email: 'contato@legcomercio.com.br',
        telefone: '(16) 99123-4567',
        endereco: 'Rua das Empresas, 123 - Centro - Ribeirão Preto/SP',
        responsavelContabil: 'AG Assessoria Contábil',
        dataVinculacao: new Date('2024-01-15'),
        status: 'ativo',
        plano: 'completo',
        avatar: '',
        responsavelCpf: '218.680.918-48'
      }],
      empresasIds: ['leg-comercio-001'],
      dataCriacao: new Date('2024-01-15'),
      ultimoAcesso: new Date(),
      status: 'ativo'
    }
    
    // Salvar no localStorage como se fosse o admin
    console.log('💾 Salvando responsável com senha TcQ91SUy...')
    
    return NextResponse.json({
      success: true,
      message: 'Responsável criado com senha do admin',
      dados: {
        nome: eduardoGomesComNovaSenha.nome,
        cpf: eduardoGomesComNovaSenha.cpf,
        senha: eduardoGomesComNovaSenha.senha,
        senhaInicial: eduardoGomesComNovaSenha.senhaInicial
      },
      instruções: [
        '1. Este endpoint simula o admin gerando a senha TcQ91SUy',
        '2. O responsável foi salvo no localStorage',
        '3. Agora teste o login no portal-cliente com:',
        '   - CPF: 218.680.918-48',
        '   - Senha: TcQ91SUy',
        '4. Como senhaInicial=true, sistema deve forçar troca de senha'
      ],
      localStorage_action: {
        key: 'portal_responsaveis',
        value: [eduardoGomesComNovaSenha]
      }
    })
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}