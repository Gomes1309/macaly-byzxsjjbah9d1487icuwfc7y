"use client"

import { useState, useRef } from 'react'
import { useClientes } from '@/hooks/useClientes'
import { useDocumentos } from '@/hooks/useDocumentos'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Building2,
  Trash2,
  Send
} from 'lucide-react'

interface SimpleFile {
  id: string
  file: File
  clienteId?: string
  categoria: string
  status: 'waiting' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

const CATEGORIAS = [
  { id: 'fiscal', name: '📊 Fiscal' },
  { id: 'contabil', name: '💰 Contábil' },
  { id: 'trabalhista', name: '👥 Trabalhista' },
  { id: 'juridico', name: '⚖️ Jurídico' },
  { id: 'societario', name: '🏢 Societário' },
  { id: 'outros', name: '📁 Outros' }
]

export default function SimpleUpload() {
  const { toast } = useToast()
  const { clientes } = useClientes()
  const { addDocumento } = useDocumentos()
  
  const [files, setFiles] = useState<SimpleFile[]>([])
  const [selectedCliente, setSelectedCliente] = useState<string>('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('outros')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'single' | 'multiple' | 'auto'>('single')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  console.log('🎯 SimpleUpload iniciado')
  console.log('📋 Clientes disponíveis:', clientes.length)
  console.log('📄 Arquivos selecionados:', files.length)

  // Extrair texto de PDF com importação dinâmica
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      console.log('📖 Extraindo texto do PDF:', file.name)
      
      // Importação dinâmica do PDF.js apenas no cliente
      if (typeof window === 'undefined') {
        console.log('⚠️ PDF.js não disponível no servidor')
        return ''
      }

      const pdfjs = await import('pdfjs-dist')
      
      // Configurar worker apenas uma vez
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`
      }
      
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument(arrayBuffer).promise
      let text = ''
      
      // Ler até 3 páginas (otimização)
      const maxPages = Math.min(pdf.numPages, 3)
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
        text += pageText + ' '
      }
      
      console.log('✅ Texto extraído, caracteres:', text.length)
      return text
    } catch (error) {
      console.error('❌ Erro ao extrair texto do PDF:', error)
      return ''
    }
  }

  // Detectar CNPJ no conteúdo do arquivo
  const detectClienteFromContent = async (file: File) => {
    try {
      console.log('🔍 Analisando conteúdo do arquivo:', file.name)
      
      let text = ''
      
      // Extrair texto baseado no tipo de arquivo
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file)
      } else if (file.type.includes('text')) {
        text = await file.text()
      } else {
        console.log('⚠️ Arquivo não-PDF, tentando nome do arquivo como fallback:', file.type)
        // Fallback: tentar detectar pelo nome se não for PDF
        const cnpjPattern = /(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/g
        const matches = file.name.match(cnpjPattern)
        if (matches && matches.length > 0) {
          const cnpj = matches[0].replace(/[^\d]/g, '')
          const cliente = clientes.find(c => 
            c.nome.includes(cnpj) || 
            c.nome.includes(matches[0]) ||
            c.id.includes(cnpj)
          )
          if (cliente) {
            console.log('✅ Cliente detectado pelo nome do arquivo:', cliente.nome)
            return cliente.id
          }
        }
        return null
      }
      
      if (!text || text.length < 10) {
        console.log('⚠️ Não foi possível extrair texto suficiente do arquivo')
        return null
      }
      
      // Buscar CNPJs no texto extraído
      const cnpjPattern = /(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/g
      const matches = text.match(cnpjPattern)
      
      if (matches && matches.length > 0) {
        console.log('🎯 CNPJs encontrados no conteúdo:', matches.slice(0, 5)) // Mostrar apenas os primeiros 5
        
        // Buscar cliente correspondente para cada CNPJ encontrado
        for (const match of matches) {
          const cnpjLimpo = match.replace(/[^\d]/g, '') // Remove formatação
          
          // Buscar cliente por CNPJ no cadastro
          const cliente = clientes.find(c => {
            // Verificar se o nome do cliente contém o CNPJ
            const nomeComCnpj = c.nome.replace(/[^\d]/g, '')
            return nomeComCnpj.includes(cnpjLimpo) || 
                   c.nome.includes(match) ||
                   c.id.includes(cnpjLimpo)
          })
          
          if (cliente) {
            console.log('✅ Cliente detectado por conteúdo:', cliente.nome, 'CNPJ:', match)
            return cliente.id
          }
        }
        
        console.log('⚠️ CNPJs encontrados mas nenhum cliente correspondente no cadastro')
      } else {
        console.log('⚠️ Nenhum CNPJ encontrado no conteúdo')
      }
      
      return null
    } catch (error) {
      console.error('❌ Erro na detecção por conteúdo:', error)
      return null
    }
  }

  // Selecionar arquivos (MODIFICADO PARA SER ASSÍNCRONO)
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles) return

    console.log('📁 Arquivos selecionados:', selectedFiles.length)

    // Criar arquivos iniciais (sem detecção ainda)
    const initialFiles: SimpleFile[] = Array.from(selectedFiles).map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      file,
      clienteId: selectedCliente || undefined,
      categoria: selectedCategoria,
      status: 'waiting' as const,
      progress: 0
    }))

    setFiles(prev => [...prev, ...initialFiles])

    // Se estiver no modo automático, fazer a detecção por conteúdo
    if (uploadMode === 'auto') {
      console.log('🔍 Modo automático ativado - iniciando detecção por conteúdo...')

      for (const fileData of initialFiles) {
        try {
          console.log('🕵️‍♂️ Analisando arquivo:', fileData.file.name)
          const detectedClienteId = await detectClienteFromContent(fileData.file)
          
          if (detectedClienteId) {
            // Atualizar arquivo com cliente detectado
            setFiles(prev => prev.map(f => 
              f.id === fileData.id 
                ? { ...f, clienteId: detectedClienteId }
                : f
            ))
            
            const cliente = clientes.find(c => c.id === detectedClienteId)
            toast({
              title: "🎯 Cliente detectado!",
              description: `Arquivo "${fileData.file.name}" → ${cliente?.nome || 'Cliente encontrado'}`,
            })
          } else {
            console.log('⚠️ Nenhum cliente detectado para:', fileData.file.name)
          }
        } catch (error) {
          console.error('❌ Erro na detecção para arquivo:', fileData.file.name, error)
        }
      }
    }
    
    toast({
      title: "Arquivos adicionados!",
      description: `${selectedFiles.length} arquivo(s) pronto(s) para envio.`
    })
  }

  // Remover arquivo
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  // Upload de um arquivo (usando Base64 para evitar problemas de bucket)
  const uploadFile = async (fileData: SimpleFile): Promise<boolean> => {
    console.log('⬆️ Iniciando upload:', fileData.file.name)

    if (!fileData.clienteId && uploadMode !== 'multiple') {
      setFiles(prev => prev.map(f => 
        f.id === fileData.id 
          ? { ...f, status: 'error', error: 'Selecione uma empresa' }
          : f
      ))
      return false
    }

    try {
      // Atualizar status
      setFiles(prev => prev.map(f => 
        f.id === fileData.id 
          ? { ...f, status: 'uploading', progress: 25 }
          : f
      ))

      console.log('📤 Convertendo arquivo para Base64...')

      // Converter arquivo para Base64 (evita problemas de bucket)
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result)
        }
        reader.onerror = reject
        reader.readAsDataURL(fileData.file)
      })

      setFiles(prev => prev.map(f => 
        f.id === fileData.id 
          ? { ...f, progress: 75 }
          : f
      ))

      // Encontrar dados do cliente
      const cliente = clientes.find(c => c.id === fileData.clienteId)
      const nomeCliente = cliente?.nome || 'Cliente detectado automaticamente'
      
      console.log('💾 Salvando no banco de dados...')

      // Criar dados do documento
      const documentoData = {
        clienteId: fileData.clienteId || 'sem-empresa',
        nomeArquivo: fileData.file.name,
        categoria: fileData.categoria,
        tipoDocumento: fileData.categoria as any,
        urlArquivo: fileBase64, // Salvar como Base64
        tamanhoArquivo: fileData.file.size,
        dataUpload: new Date(),
        uploadedBy: 'Sistema Upload Inteligente',
        observacoes: `Upload ${uploadMode} - Cliente: ${nomeCliente}, Categoria: ${CATEGORIAS.find(c => c.id === fileData.categoria)?.name || 'Outros'}`
      }

      await addDocumento(documentoData)

      // Sucesso!
      setFiles(prev => prev.map(f => 
        f.id === fileData.id 
          ? { ...f, status: 'success', progress: 100 }
          : f
      ))

      console.log('✅ Upload concluído:', fileData.file.name)
      return true

    } catch (error) {
      console.error('❌ Erro no upload:', error)
      
      setFiles(prev => prev.map(f => 
        f.id === fileData.id 
          ? { 
              ...f, 
              status: 'error', 
              progress: 0,
              error: error instanceof Error ? error.message : 'Erro no upload'
            }
          : f
      ))
      
      return false
    }
  }

  // Enviar todos os arquivos
  const uploadAll = async () => {
    console.log('🚀 Iniciando upload de todos os arquivos - Modo:', uploadMode)
    
    if (files.length === 0) {
      toast({
        title: "Nenhum arquivo",
        description: "Selecione arquivos primeiro.",
        variant: "destructive"
      })
      return
    }

    // Verificar se precisa de cliente selecionado
    if (uploadMode === 'single' && !selectedCliente) {
      toast({
        title: "Selecione uma empresa",
        description: "No modo empresa única, é necessário escolher uma empresa.",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    const waitingFiles = files.filter(f => f.status === 'waiting')
    let successful = 0
    let failed = 0

    // Processar arquivos baseado no modo
    for (const file of waitingFiles) {
      let fileWithData = { ...file }

      if (uploadMode === 'single') {
        // Modo empresa única - usar empresa selecionada
        fileWithData = {
          ...file,
          clienteId: selectedCliente,
          categoria: selectedCategoria
        }
      } else if (uploadMode === 'multiple') {
        // Modo múltiplas empresas - enviar para todas
        for (const cliente of clientes) {
          const fileForCliente = {
            ...file,
            id: file.id + '_' + cliente.id,
            clienteId: cliente.id,
            categoria: selectedCategoria
          }
          const success = await uploadFile(fileForCliente)
          if (success) successful++
          else failed++
        }
        continue // Pular o upload normal para este arquivo
      } else if (uploadMode === 'auto') {
        // Modo automático - usar detecção já feita ou deixar sem empresa
        fileWithData = {
          ...file,
          categoria: selectedCategoria
        }
      }
      
      const success = await uploadFile(fileWithData)
      if (success) successful++
      else failed++
    }

    setIsUploading(false)

    toast({
      title: "Upload concluído!",
      description: `${successful} arquivo(s) enviado(s) com sucesso. ${failed} falharam.`,
    })

    console.log(`📊 Resultado: ${successful} sucessos, ${failed} falhas`)
  }

  // Limpar tudo
  const clearAll = () => {
    setFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Obter nome do arquivo formatado
  const formatFileName = (name: string) => {
    if (name.length <= 30) return name
    return name.substring(0, 27) + '...'
  }

  // Obter tamanho do arquivo formatado  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <Card className="w-full bg-white shadow-lg border-0" data-macaly="simple-upload-card">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-500 to-green-500 p-3 rounded-full">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-blue-700 font-bold text-xl" data-macaly="upload-title">
              Upload Inteligente de Documentos
            </CardTitle>
            <p className="text-slate-600 text-sm" data-macaly="upload-description">
              Envie para uma empresa, todas empresas ou com detecção automática por conteúdo
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Modo de Upload */}
        <div className="space-y-3">
          <Label className="text-slate-700 font-medium">🎯 Como enviar os documentos?</Label>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={uploadMode === 'single' ? 'default' : 'outline'}
              onClick={() => setUploadMode('single')}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Building2 className="w-5 h-5" />
              <div className="text-center">
                <div className="font-medium text-sm">Uma Empresa</div>
                <div className="text-xs opacity-70">Selecionar empresa específica</div>
              </div>
            </Button>
            
            <Button
              variant={uploadMode === 'multiple' ? 'default' : 'outline'}
              onClick={() => setUploadMode('multiple')}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <div className="flex space-x-1">
                <Building2 className="w-4 h-4" />
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">Todas Empresas</div>
                <div className="text-xs opacity-70">Enviar para todas</div>
              </div>
            </Button>
            
            <Button
              variant={uploadMode === 'auto' ? 'default' : 'outline'}
              onClick={() => setUploadMode('auto')}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <div className="bg-gradient-to-r from-blue-500 to-green-500 w-5 h-5 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">Automático</div>
                <div className="text-xs opacity-70">Detectar pelo conteúdo</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Configurações Específicas */}
        <div className="grid grid-cols-2 gap-4">
          {uploadMode === 'single' && (
            <div className="space-y-2">
              <Label htmlFor="cliente-select" className="text-slate-700 font-medium">
                🏢 Empresa/Cliente
              </Label>
              <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                <SelectTrigger id="cliente-select">
                  <SelectValue placeholder="Selecione uma empresa..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <span>{cliente.nome}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {uploadMode === 'multiple' && (
            <div className="col-span-1 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                📢 <strong>Modo lote:</strong> Os documentos serão enviados para todas as {clientes.length} empresas cadastradas.
              </p>
            </div>
          )}

          {uploadMode === 'auto' && (
            <div className="col-span-1 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                🤖 <strong>Detecção automática:</strong> Sistema analisará o conteúdo dos PDFs procurando por CNPJs.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="categoria-select" className="text-slate-700 font-medium">
              📂 Categoria
            </Label>
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger id="categoria-select">
                <SelectValue placeholder="Selecione uma categoria..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Área de Upload */}
        <div className="space-y-4">
          <Label className="text-slate-700 font-medium">📄 Arquivos</Label>
          
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-200">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
            
            <div className="space-y-3">
              <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              
              <div>
                <p className="font-medium text-slate-800 mb-1">
                  Clique para selecionar arquivos
                </p>
                <p className="text-sm text-slate-500">
                  PDF, Word, Excel, Imagens • Até 50MB cada
                </p>
              </div>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                <Upload className="w-4 h-4 mr-2" />
                Escolher Arquivos
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Arquivos */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                Arquivos Selecionados ({files.length})
              </h3>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={uploadAll}
                  disabled={isUploading || (uploadMode === 'single' && !selectedCliente)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isUploading ? 'Enviando...' : 'Enviar Todos'}
                </Button>
                <Button
                  onClick={clearAll}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {files.map((fileData) => (
                <Card key={fileData.id} className="border shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      {/* Ícone */}
                      <div className="bg-slate-100 p-2 rounded">
                        <FileText className="h-4 w-4 text-slate-600" />
                      </div>
                      
                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 truncate">
                          {formatFileName(fileData.file.name)}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {formatFileSize(fileData.file.size)}
                          {fileData.clienteId && (
                            <span className="ml-2 text-green-600">
                              → {clientes.find(c => c.id === fileData.clienteId)?.nome || 'Cliente detectado'}
                            </span>
                          )}
                        </p>
                        
                        {/* Progresso */}
                        {fileData.status === 'uploading' && (
                          <div className="mt-2">
                            <Progress value={fileData.progress} className="h-1" />
                          </div>
                        )}
                        
                        {/* Erro */}
                        {fileData.error && (
                          <p className="text-sm text-red-600 mt-1">
                            {fileData.error}
                          </p>
                        )}
                      </div>
                      
                      {/* Status */}
                      <div className="flex items-center space-x-2">
                        {fileData.status === 'waiting' && (
                          <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                        )}
                        {fileData.status === 'uploading' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                        {fileData.status === 'success' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {fileData.status === 'error' && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(fileData.id)}
                          className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Instruções */}
        {files.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">📝 Como usar:</h4>
            {uploadMode === 'single' && (
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Selecione a empresa/cliente específica</li>
                <li>Escolha a categoria dos documentos</li>
                <li>Clique em "Escolher Arquivos" e selecione os documentos</li>
                <li>Clique em "Enviar Todos" para fazer o upload</li>
              </ol>
            )}
            {uploadMode === 'multiple' && (
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Escolha a categoria dos documentos</li>
                <li>Clique em "Escolher Arquivos" e selecione os documentos</li>
                <li>Clique em "Enviar Todos" - documentos irão para TODAS as empresas</li>
                <li>⚠️ Cuidado: cada documento será duplicado para todas as empresas</li>
              </ol>
            )}
            {uploadMode === 'auto' && (
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Escolha a categoria dos documentos</li>
                <li>Clique em "Escolher Arquivos" - PDFs terão seu conteúdo analisado automaticamente</li>
                <li>Sistema buscará CNPJs no conteúdo dos documentos</li>
                <li>Correspondência com empresas cadastradas será feita automaticamente</li>
                <li>Clique em "Enviar Todos" para fazer o upload inteligente</li>
              </ol>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}