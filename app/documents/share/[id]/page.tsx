"use client"

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  FileText, 
  Image, 
  File, 
  Download, 
  Building,
  Calendar,
  User,
  Tag,
  Share2,
  Eye,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

// Interface para documento compartilhado
interface SharedDocument {
  id: string
  nome: string
  nomeOriginal: string
  categoria: string
  tipo: string
  tamanho: number
  dataUpload: Date
  uploadPor: string
  descricao?: string
  tags?: string[]
  cliente: {
    id: string
    nome: string
    cnpj: string
  }
}

// Configuração de categorias
const CATEGORIAS = {
  'abertura_alteracao': { nome: 'Abertura/Alteração', cor: 'blue' },
  'fiscal': { nome: 'Fiscal', cor: 'green' },
  'contabil': { nome: 'Contábil', cor: 'purple' },
  'trabalhista': { nome: 'Trabalhista', cor: 'orange' },
  'societario': { nome: 'Societário', cor: 'red' },
  'juridico': { nome: 'Jurídico', cor: 'indigo' },
  'outros': { nome: 'Outros', cor: 'gray' }
}

export default function SharedDocumentPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  
  // Estados
  const [documento, setDocumento] = useState<SharedDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadAttempted, setDownloadAttempted] = useState(false)

  // Carregar documento compartilhado
  useEffect(() => {
    const loadSharedDocument = async () => {
      try {
        console.log('Carregando documento compartilhado:', params.id)
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/documents/share/${params.id}`)
        const data = await response.json()

        console.log('Resposta da API:', data)

        if (!response.ok) {
          throw new Error(data.message || 'Erro ao carregar documento')
        }

        if (data.success && data.documento) {
          setDocumento({
            ...data.documento,
            dataUpload: new Date(data.documento.dataUpload)
          })

          console.log('Documento carregado com sucesso:', data.documento.nome)
        } else {
          throw new Error('Formato de resposta inválido')
        }

      } catch (error: any) {
        console.error('Erro ao carregar documento:', error)
        setError(error.message || 'Erro ao carregar documento')
        
        toast({
          title: "Erro ao carregar documento",
          description: error.message || "Não foi possível carregar o documento compartilhado.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadSharedDocument()
    }
  }, [params.id, toast])

  // Obter ícone do arquivo
  const getFileIcon = (tipo: string) => {
    if (tipo.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />
    if (tipo.includes('image')) return <Image className="w-6 h-6 text-blue-500" />
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return <File className="w-6 h-6 text-green-500" />
    if (tipo.includes('word') || tipo.includes('document')) return <FileText className="w-6 h-6 text-blue-600" />
    return <File className="w-6 h-6 text-gray-500" />
  }

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Obter informações da categoria
  const getCategoryInfo = (categoria: string) => {
    return CATEGORIAS[categoria as keyof typeof CATEGORIAS] || { nome: 'Desconhecido', cor: 'gray' }
  }

  // Simular download do documento
  const handleDownload = () => {
    if (!documento) return

    console.log('Iniciando download do documento:', documento.nome)
    setDownloadAttempted(true)

    // Simular download (em produção seria um arquivo real)
    const fakeDownload = document.createElement('a')
    fakeDownload.href = '#'
    fakeDownload.download = documento.nomeOriginal
    fakeDownload.click()

    toast({
      title: "Download iniciado",
      description: `Download do arquivo ${documento.nome} foi iniciado.`,
    })
  }

  // Componente de loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Carregando documento...</h3>
            <p className="text-slate-600">Aguarde enquanto processamos sua solicitação.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Componente de erro
  if (error || !documento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center">
        <Toaster />
        <Card className="w-full max-w-md mx-4 border-red-200">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Documento não encontrado</h3>
            <p className="text-red-600 mb-4">
              {error || 'O documento solicitado não existe ou o link expirou.'}
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-red-600 hover:bg-red-700"
            >
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const categoryInfo = getCategoryInfo(documento.categoria)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-xl shadow-lg">
                <img 
                  src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/ra4c-kVU0_Z0Hdr1uDggb/logo-ag-2025.png" 
                  alt="AG Assessoria Logo" 
                  className="h-10 w-auto object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">AG ASSESSORIA</h1>
                <p className="text-sm text-slate-600 font-medium">DOCUMENTO COMPARTILHADO</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                <CheckCircle className="w-3 h-3 mr-1" />
                Link válido
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Document Card */}
        <Card className="bg-white shadow-xl border-0 mb-6">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg border-b">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white p-3 rounded-lg shadow-md">
                  {getFileIcon(documento.tipo)}
                </div>
                <div>
                  <CardTitle className="text-xl text-slate-800 mb-1">
                    {documento.nome}
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    {documento.nomeOriginal}
                  </CardDescription>
                </div>
              </div>
              
              <Badge 
                className={`bg-${categoryInfo.cor}-100 text-${categoryInfo.cor}-800 font-medium`}
              >
                {categoryInfo.nome}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Document Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Cliente</p>
                    <p className="text-slate-900">{documento.cliente.nome}</p>
                    <p className="text-sm text-slate-600">{documento.cliente.cnpj}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Data de envio</p>
                    <p className="text-slate-900">
                      {format(documento.dataUpload, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Enviado por</p>
                    <p className="text-slate-900">{documento.uploadPor}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Tamanho</p>
                    <p className="text-slate-900">{formatFileSize(documento.tamanho)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {documento.descricao && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Descrição</h4>
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <p className="text-slate-800">{documento.descricao}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {documento.tags && documento.tags.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center">
                  <Tag className="w-4 h-4 mr-1" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {documento.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                <p>📋 Este documento foi compartilhado com você pela <strong>AG Assessoria Contábil</strong></p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </Button>
                
                <Button
                  onClick={handleDownload}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloadAttempted ? 'Baixar novamente' : 'Baixar documento'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Share2 className="w-5 h-5 text-slate-400" />
              <p className="text-slate-700 font-medium">Documento compartilhado via AG Assessoria</p>
            </div>
            <p className="text-sm text-slate-600">
              📞 Entre em contato: <strong>(16) 99109-8966</strong> | 
              📧 Email: <strong>contato@ag-assessoria.com</strong>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Este link foi gerado automaticamente pelo sistema de documentos da AG Assessoria Contábil
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}