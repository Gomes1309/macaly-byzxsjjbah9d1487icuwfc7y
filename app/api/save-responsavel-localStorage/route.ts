import { NextResponse } from 'next/server'

export async function GET() {
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

  return NextResponse.json({
    success: true,
    message: 'Execute este script no console do browser para salvar no localStorage:',
    script: `
// Executar no console do browser na página /portal-cliente
const responsavelData = ${JSON.stringify([responsavelData], null, 2)};
localStorage.setItem('portal_responsaveis', JSON.stringify(responsavelData));
console.log('✅ Responsável Eduardo Gomes salvo no localStorage:', responsavelData);
alert('✅ Dados salvos! Agora você pode fazer login com CPF: 218.680.918-48 e Senha: 22HHgYhJ');
    `,
    responsavelData: [responsavelData],
    credentials: {
      cpf: '218.680.918-48',
      senha: '22HHgYhJ'
    }
  })
}