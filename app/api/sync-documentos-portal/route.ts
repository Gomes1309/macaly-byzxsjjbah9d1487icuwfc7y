import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Sincronizando documentos do portal com Supabase...')
    
    // Buscar todos os documentos do Supabase
    const { data: documentos, error: docError } = await supabase
      .from('documentos')
      .select(`
        *,
        clientes (
          id,
          nome,
          cpf_cnpj,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (docError) {
      console.error('❌ Erro ao buscar documentos:', docError)
      throw new Error(`Erro ao buscar documentos: ${docError.message}`)
    }

    // Buscar todos os clientes
    const { data: clientes, error: clienteError } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })

    if (clienteError) {
      console.error('❌ Erro ao buscar clientes:', clienteError)
      throw new Error(`Erro ao buscar clientes: ${clienteError.message}`)
    }

    console.log(`📊 Encontrados ${documentos?.length || 0} documentos e ${clientes?.length || 0} clientes`)

    // Converter documentos para formato do portal
    const documentosPortal = (documentos || []).map(doc => ({
      id: doc.id,
      clienteId: doc.cliente_id,
      categoria: mapTipoToCategoria(doc.tipo_documento, doc.categoria),
      nome: doc.nome_arquivo,
      nomeOriginal: doc.nome_arquivo,
      tipo: getFileExtension(doc.nome_arquivo),
      tamanho: doc.tamanho_arquivo ? formatFileSize(doc.tamanho_arquivo) : '0 KB',
      dataUpload: doc.data_upload,
      uploadPor: doc.uploaded_by || 'Sistema',
      status: 'disponivel' as const,
      urlArquivo: doc.url_arquivo,
      // Adicionar informações do cliente se disponível
      cliente: doc.clientes ? {
        nome: doc.clientes.nome,
        cpf_cnpj: doc.clientes.cpf_cnpj,
        email: doc.clientes.email
      } : null
    }))

    // Converter clientes para formato do portal
    const clientesPortal = (clientes || []).map(cliente => ({
      id: cliente.id,
      cnpj: cliente.cpf_cnpj,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone || '',
      endereco: cliente.endereco || '',
      tipo_cliente: cliente.tipo_cliente,
      status: cliente.status,
      data_cadastro: cliente.data_cadastro
    }))

    const result = {
      success: true,
      message: 'Portal sincronizado com sucesso',
      timestamp: new Date().toISOString(),
      data: {
        documentos: documentosPortal,
        clientes: clientesPortal,
        stats: {
          totalDocumentos: documentosPortal.length,
          totalClientes: clientesPortal.length,
          documentosPorCliente: groupDocumentsByClient(documentosPortal)
        }
      }
    }

    console.log('✅ Sincronização concluída:', result.data.stats)
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ Erro na sincronização do portal:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Erro na sincronização do portal',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// Mapear tipo de documento para categoria do portal
function mapTipoToCategoria(tipoDocumento: string, categoria?: string): string {
  // Se há categoria específica, usar ela primeiro
  if (categoria) {
    const categoriaMapped = categoria.toLowerCase()
    if (['abertura', 'alteracao'].some(t => categoriaMapped.includes(t))) {
      return 'abertura_alteracao'
    }
    if (categoriaMapped.includes('fiscal')) return 'fiscal'
    if (categoriaMapped.includes('contabil')) return 'contabil'
    if (categoriaMapped.includes('trabalhista')) return 'trabalhista'
    if (categoriaMapped.includes('societario')) return 'societario'
    if (categoriaMapped.includes('juridico')) return 'juridico'
  }

  // Mapear por tipo de documento
  switch (tipoDocumento?.toLowerCase()) {
    case 'abertura':
    case 'alteracao':
      return 'abertura_alteracao'
    case 'fiscal':
      return 'fiscal'
    case 'contabil':
      return 'contabil'
    case 'trabalhista':
      return 'trabalhista'
    case 'societario':
      return 'societario'
    case 'juridico':
      return 'juridico'
    default:
      return 'outros'
  }
}

// Obter extensão do arquivo
function getFileExtension(nomeArquivo: string): string {
  const ext = nomeArquivo.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf': return 'application/pdf'
    case 'doc':
    case 'docx': return 'application/msword'
    case 'xls':
    case 'xlsx': return 'application/excel'
    case 'jpg':
    case 'jpeg':
    case 'png': return 'image'
    default: return 'application/octet-stream'
  }
}

// Formatar tamanho do arquivo
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Agrupar documentos por cliente
function groupDocumentsByClient(documentos: any[]): Record<string, number> {
  return documentos.reduce((acc, doc) => {
    acc[doc.clienteId] = (acc[doc.clienteId] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

// Permitir também GET para testar
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API de sincronização do portal ativa',
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: 'Sincronizar dados do portal com Supabase',
      GET: 'Status da API'
    }
  })
}