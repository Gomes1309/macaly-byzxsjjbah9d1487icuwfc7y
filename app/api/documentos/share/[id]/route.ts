import { NextRequest, NextResponse } from 'next/server'

// Redirecionamento para o novo formato de URL
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Redirecionando link antigo para novo formato:', params.id)
    
    // Extrair ID do documento do parâmetro
    const documentId = params.id.split('-')[0] // Remove timestamp se houver
    
    // Redirecionar para o novo formato
    const newUrl = `/documents/share/${documentId}`
    
    return NextResponse.redirect(new URL(newUrl, request.url))
    
  } catch (error) {
    console.error('Erro no redirecionamento:', error)
    
    // Se der erro, redirecionar para página de erro
    return NextResponse.redirect(new URL('/documents/share/error', request.url))
  }
}

// Suporte para POST também (compatibilidade)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return GET(request, { params })
}