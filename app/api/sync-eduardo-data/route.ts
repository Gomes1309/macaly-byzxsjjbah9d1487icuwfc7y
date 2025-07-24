import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🔄 Sincronizando dados do Eduardo Aparecido Gomes...')
    
    const responsavelData = {
      id: 'eduardo-gomes-001',
      nome: 'Eduardo Aparecido Gomes',
      cpf: '218.680.918-48',
      email: 'gomes1309@gmail.com',
      telefone: '16992714270',
      status: 'ativo',
      senha: '22HHgYhJ',
      senhaInicial: false,
      empresasIds: ['leg-comercio-001'],
      empresas: [{
        id: 'leg-comercio-001',
        cnpj: '00.000.000/0001-28',
        razaoSocial: 'LEG - COMERCIO E SERVICOS LTDA',
        nomeFantasia: 'LEG Comércio',
        status: 'ativa',
        responsavelContabil: 'AG Assessoria Contábil',
        email: 'gomes1309@gmail.com',
        telefone: '16992714270',
        endereco: 'Rua das Empresas, 123 - Centro - Ribeirão Preto/SP',
        plano: 'completo',
        dataVinculacao: new Date('2024-01-15').toISOString()
      }],
      dataCriacao: new Date('2024-01-15').toISOString(),
      ultimoAcesso: new Date().toISOString()
    }

    // Simular salvamento no sistema
    console.log('✅ Dados do Eduardo sincronizados:', responsavelData)

    return NextResponse.json({
      success: true,
      message: 'Dados sincronizados com sucesso!',
      action: 'Os dados foram atualizados no sistema.',
      responsavel: {
        nome: responsavelData.nome,
        cpf: responsavelData.cpf,
        email: responsavelData.email,
        telefone: responsavelData.telefone,
        empresaNome: responsavelData.empresas[0].razaoSocial
      },
      credentials: {
        cpf: '218.680.918-48',
        senha: '22HHgYhJ'
      },
      clientScript: `
// Execute no console do navegador na página do portal do cliente
const responsavelData = ${JSON.stringify([responsavelData], null, 2)};
localStorage.setItem('portal_responsaveis', JSON.stringify(responsavelData));
console.log('✅ Dados salvos no localStorage!', responsavelData);
window.location.reload();
      `
    })

  } catch (error) {
    console.error('❌ Erro ao sincronizar dados:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao sincronizar dados do Eduardo'
    }, { status: 500 })
  }
}