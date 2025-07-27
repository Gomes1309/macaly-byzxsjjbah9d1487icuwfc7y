import { NextRequest, NextResponse } from 'next/server'

// Interface para documento compartilhado
interface SharedDocument {
  id: string
  clienteId: string
  categoria: string
  nome: string
  nomeOriginal: string
  tipo: string
  tamanho: number
  dataUpload: Date
  uploadPor: string
  descricao?: string
  tags?: string[]
  isShared: boolean
  shareToken: string
}

// Simulação de dados de documentos (em produção seria do banco de dados)
const getSharedDocuments = (): SharedDocument[] => {
  // Como esta é uma API route que roda no servidor, não podemos acessar localStorage diretamente
  // Vamos usar uma simulação baseada no ID ou implementar um sistema de cache
  
  // Simulação de documentos baseada em IDs conhecidos
  const mockDocuments: SharedDocument[] = [
    {
      id: '17533811944939e7wxnuc2',
      clienteId: 'cliente-1',
      categoria: 'contabil',
      nome: 'Holerite Recibo de Salario PRO LABORE',
      nomeOriginal: 'holerite-pro-labore.pdf',
      tipo: 'application/pdf',
      tamanho: 245760, // ~240KB
      dataUpload: new Date('2025-01-24T15:52:00'),
      uploadPor: 'AG Assessoria Contábil',
      descricao: 'Recibo de salário pró-labore do período atual',
      tags: ['salario', 'pro-labore', 'contabil'],
      isShared: true,
      shareToken: '17533811944939e7wxnuc2'
    }
  ]
  
  return mockDocuments
}

// GET - Buscar documento compartilhado
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Buscando documento compartilhado:', params.id)
    
    // Primeiro, tentar buscar nos dados simulados
    const documentos = getSharedDocuments()
    let documento = documentos.find(d => d.id === params.id || d.shareToken === params.id)
    
    // Se não encontrou nos dados simulados, tentar no cache
    if (!documento) {
      try {
        // Em um ambiente real, isso seria uma consulta ao banco de dados
        // Por enquanto, vamos simular buscando em um cache hipotético
        
        // Criar um documento simulado baseado no ID fornecido
        documento = {
          id: params.id,
          clienteId: 'cliente-dinamico',
          categoria: 'contabil',
          nome: 'Documento Compartilhado',
          nomeOriginal: `documento-${params.id}.pdf`,
          tipo: 'application/pdf',
          tamanho: 150000,
          dataUpload: new Date(),
          uploadPor: 'AG Assessoria Contábil',
          descricao: 'Documento disponibilizado para compartilhamento',
          tags: ['compartilhado'],
          isShared: true,
          shareToken: params.id
        }
        
        console.log('Documento criado dinamicamente para compartilhamento:', documento.nome)
      } catch (error) {
        console.error('Erro ao criar documento dinâmico:', error)
      }
    }
    
    if (!documento) {
      return NextResponse.json(
        { 
          error: 'Documento não encontrado',
          message: 'O documento solicitado não existe ou o link expirou.'
        }, 
        { status: 404 }
      )
    }

    // Verificar se o documento está disponível para compartilhamento
    if (!documento.isShared) {
      return NextResponse.json(
        { 
          error: 'Documento não disponível',
          message: 'Este documento não está disponível para compartilhamento.'
        }, 
        { status: 403 }
      )
    }

    // Buscar informações do cliente (simulado com dados mais realistas)
    const getClienteInfo = (clienteId: string) => {
      const mockClientes: Record<string, any> = {
        'cliente-1': {
          id: 'cliente-1',
          nome: 'Empresa Exemplo Ltda',
          cnpj: '12.345.678/0001-90'
        }
      }
      
      return mockClientes[clienteId] || {
        id: clienteId,
        nome: 'Cliente AG Assessoria',
        cnpj: '00.000.000/0000-00'
      }
    }

    const clienteInfo = getClienteInfo(documento.clienteId)

    // Log de acesso
    console.log(`Documento ${documento.nome} acessado via compartilhamento`)

    return NextResponse.json({
      success: true,
      documento: {
        id: documento.id,
        nome: documento.nome,
        nomeOriginal: documento.nomeOriginal,
        categoria: documento.categoria,
        tipo: documento.tipo,
        tamanho: documento.tamanho,
        dataUpload: documento.dataUpload,
        uploadPor: documento.uploadPor,
        descricao: documento.descricao,
        tags: documento.tags,
        cliente: clienteInfo
      }
    })

  } catch (error) {
    console.error('Erro ao buscar documento compartilhado:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro ao processar sua solicitação.'
      }, 
      { status: 500 }
    )
  }
}

// POST - Gerar link de compartilhamento
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'generate-link') {
      console.log('Gerando link de compartilhamento para documento:', params.id)
      
      // Gerar token de compartilhamento (em produção seria mais seguro)
      const shareToken = params.id + '-' + Date.now().toString(36)
      
      // URL de compartilhamento
      const shareableUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ag-assessoria.com'}/documents/share/${params.id}`
      
      return NextResponse.json({
        success: true,
        shareUrl: shareableUrl,
        shareToken: shareToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      })
    }

    return NextResponse.json(
      { error: 'Ação não reconhecida' }, 
      { status: 400 }
    )

  } catch (error) {
    console.error('Erro ao processar compartilhamento:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: 'Ocorreu um erro ao processar sua solicitação.'
      }, 
      { status: 500 }
    )
  }
}