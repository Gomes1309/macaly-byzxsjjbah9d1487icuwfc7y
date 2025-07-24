"use client"

import { useState, useCallback, useRef } from 'react'
import { useClientes } from '@/hooks/useClientes'
import { useDocumentos } from '@/hooks/useDocumentos'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  AlertTriangle,
  Building2, 
  Clock,
  Settings,
  Zap,
  Trash2,
  ImageIcon,
  FileIcon,
  FolderIcon
} from 'lucide-react'

// Tipos para o sistema de upload
interface FileWithMetadata {
  file: File
  id: string
  detectedCompany?: string
  detectedCNPJ?: string
  detectedCategory?: string
  detectedType?: string
  status: 'pending' | 'processing' | 'success' | 'error'
  error?: string
  progress: number
  clienteId?: string
}

interface UploadResult {
  totalFiles: number
  successful: number
  failed: number
  results: FileWithMetadata[]
}

// Categorias de documentos disponíveis
const DOCUMENT_CATEGORIES = [
  { id: 'abertura_alteracao', name: 'Abertura/Alteração', keywords: ['contrato', 'abertura', 'alteracao', 'social'] },
  { id: 'fiscal', name: 'Fiscal', keywords: ['fiscal', 'nfe', 'nota', 'nfse', 'icms', 'pis', 'cofins'] },
  { id: 'contabil', name: 'Contábil', keywords: ['balanco', 'dre', 'contabil', 'balanço', 'financeiro'] },
  { id: 'trabalhista', name: 'Trabalhista', keywords: ['folha', 'salario', 'trabalhista', 'funcionario', 'admissao'] },
  { id: 'societario', name: 'Societário', keywords: ['ata', 'assembleia', 'societario', 'reuniao'] },
  { id: 'juridico', name: 'Jurídico', keywords: ['procuracao', 'juridico', 'contrato', 'acordo'] },
  { id: 'outros', name: 'Outros', keywords: [] }
]

// Pastas/diretórios disponíveis para organização
const DOCUMENT_FOLDERS = [
  { id: 'documentos_gerais', name: '📁 Documentos Gerais', description: 'Documentos diversos e gerais' },
  { id: 'contratos', name: '📋 Contratos', description: 'Contratos sociais, alterações contratuais' },
  { id: 'fiscal_tributario', name: '💰 Fiscal e Tributário', description: 'Notas fiscais, declarações, impostos' },
  { id: 'contabilidade', name: '📊 Contabilidade', description: 'Balanços, DRE, relatórios contábeis' },
  { id: 'recursos_humanos', name: '👥 Recursos Humanos', description: 'Folha de pagamento, admissões, demissões' },
  { id: 'juridico_legal', name: '⚖️ Jurídico e Legal', description: 'Procurações, ações judiciais, pareceres' },
  { id: 'licencas_alvaras', name: '🏛️ Licenças e Alvarás', description: 'Alvarás de funcionamento, licenças especiais' },
  { id: 'arquivos_anuais', name: '📅 Arquivos Anuais', description: 'Documentos organizados por ano fiscal' },
  { id: 'correspondencias', name: '✉️ Correspondências', description: 'Comunicações oficiais, cartas, ofícios' },
  { id: 'certidoes', name: '📃 Certidões', description: 'Certidões negativas, positivas, diversos órgãos' }
]

// Tipos de documento suportados
const DOCUMENT_TYPES = [
  { id: 'abertura', name: 'Abertura' },
  { id: 'alteracao', name: 'Alteração' },
  { id: 'fiscal', name: 'Fiscal' },
  { id: 'contabil', name: 'Contábil' },
  { id: 'imposto_renda', name: 'Imposto de Renda' },
  { id: 'pessoal', name: 'Pessoal' }
]

export default function MultipleUploadManager() {
  const { toast } = useToast()
  const { clientes } = useClientes()
  const { addDocumento } = useDocumentos()
  
  const [files, setFiles] = useState<FileWithMetadata[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [autoDetectionEnabled, setAutoDetectionEnabled] = useState(true)
  const [batchSize, setBatchSize] = useState(10) // Aumentado para 10 por lote
  const [maxConcurrentUploads, setMaxConcurrentUploads] = useState(20) // Máximo de 20 simultâneos
  const [selectedFolder, setSelectedFolder] = useState<string>('documentos_gerais')
  const [customFolder, setCustomFolder] = useState<string>('')
  const [useCustomFolder, setUseCustomFolder] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Função para extrair CNPJ do nome do arquivo
  const extractCNPJFromFilename = useCallback((filename: string): string | null => {
    console.log('Analisando arquivo:', filename)
    
    // Regex para CNPJ nos formatos: XX.XXX.XXX/XXXX-XX ou XXXXXXXXXXXXXX
    const cnpjPatterns = [
      /(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})/g,
      /(\d{14})/g
    ]
    
    for (const pattern of cnpjPatterns) {
      const matches = filename.match(pattern)
      if (matches) {
        const cnpj = matches[0].replace(/\D/g, '') // Remove formatação
        if (cnpj.length === 14) {
          console.log('CNPJ detectado:', cnpj)
          return cnpj
        }
      }
    }
    
    return null
  }, [])

  // Função para detectar empresa pelo nome ou CNPJ
  const detectCompanyFromFile = useCallback((filename: string) => {
    console.log('Detectando empresa para arquivo:', filename)
    
    // Primeiro, tentar extrair CNPJ
    const cnpj = extractCNPJFromFilename(filename)
    
    if (cnpj) {
      // Buscar cliente pelo CNPJ
      const clienteEncontrado = clientes.find(cliente => 
        cliente.cpfCnpj.replace(/\D/g, '') === cnpj
      )
      
      if (clienteEncontrado) {
        console.log('Cliente encontrado por CNPJ:', clienteEncontrado.nome)
        return {
          clienteId: clienteEncontrado.id,
          companyName: clienteEncontrado.nome,
          cnpj: cnpj
        }
      }
    }
    
    // Se não encontrou por CNPJ, tentar por nome da empresa no arquivo
    const filenameLower = filename.toLowerCase()
    
    for (const cliente of clientes) {
      const nomeEmpresaWords = cliente.nome.toLowerCase().split(' ')
      const hasCompanyName = nomeEmpresaWords.some(word => 
        word.length > 3 && filenameLower.includes(word)
      )
      
      if (hasCompanyName) {
        console.log('Cliente encontrado por nome:', cliente.nome)
        return {
          clienteId: cliente.id,
          companyName: cliente.nome,
          cnpj: cliente.cpfCnpj
        }
      }
    }
    
    console.log('Nenhuma empresa detectada para:', filename)
    return null
  }, [clientes, extractCNPJFromFilename])

  // Função para detectar categoria do documento
  const detectCategory = useCallback((filename: string): string => {
    const filenameLower = filename.toLowerCase()
    
    for (const category of DOCUMENT_CATEGORIES) {
      if (category.keywords.some(keyword => filenameLower.includes(keyword))) {
        console.log('Categoria detectada:', category.name, 'para arquivo:', filename)
        return category.id
      }
    }
    
    return 'outros' // Categoria padrão
  }, [])

  // Função para detectar tipo de documento
  const detectDocumentType = useCallback((filename: string): string => {
    const filenameLower = filename.toLowerCase()
    
    if (filenameLower.includes('abertura')) return 'abertura'
    if (filenameLower.includes('alteracao')) return 'alteracao'
    if (filenameLower.includes('fiscal') || filenameLower.includes('nfe')) return 'fiscal'
    if (filenameLower.includes('contabil') || filenameLower.includes('balanco')) return 'contabil'
    if (filenameLower.includes('imposto') || filenameLower.includes('irpf')) return 'imposto_renda'
    
    return 'pessoal' // Tipo padrão
  }, [])

  // Função para processar arquivos selecionados
  const processSelectedFiles = useCallback((selectedFiles: FileList) => {
    console.log('Processando', selectedFiles.length, 'arquivos selecionados')
    
    const processedFiles: FileWithMetadata[] = Array.from(selectedFiles).map(file => {
      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      
      let detectedData: { clienteId: string; companyName: string; cnpj: string } | null = null
      if (autoDetectionEnabled) {
        detectedData = detectCompanyFromFile(file.name)
      }
      
      const fileWithMetadata: FileWithMetadata = {
        file,
        id: fileId,
        detectedCompany: detectedData?.companyName || undefined,
        detectedCNPJ: detectedData?.cnpj || undefined,
        detectedCategory: autoDetectionEnabled ? detectCategory(file.name) : 'outros',
        detectedType: autoDetectionEnabled ? detectDocumentType(file.name) : 'pessoal',
        status: 'pending',
        progress: 0,
        clienteId: detectedData?.clienteId || undefined
      }
      
      console.log('Arquivo processado:', fileWithMetadata)
      return fileWithMetadata
    })
    
    setFiles(processedFiles)
    
    toast({
      title: "Arquivos analisados!",
      description: `${processedFiles.length} arquivo(s) processado(s). ${processedFiles.filter(f => f.detectedCompany).length} empresa(s) detectada(s) automaticamente.`,
    })
  }, [autoDetectionEnabled, detectCompanyFromFile, detectCategory, detectDocumentType, toast])

  // Handler para seleção de arquivos
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      processSelectedFiles(selectedFiles)
    }
  }, [processSelectedFiles])

  // Função para fazer upload de um arquivo
  const uploadSingleFile = useCallback(async (fileData: FileWithMetadata): Promise<void> => {
    console.log('Iniciando upload do arquivo:', fileData.file.name)
    
    return new Promise(async (resolve) => {
      try {
        // Atualizar status para processando
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'processing', progress: 25 }
            : f
        ))
        
        // Simular progresso de upload
        await new Promise(resolve => setTimeout(resolve, 500))
        
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, progress: 50 }
            : f
        ))
        
        // Verificar se tem cliente selecionado
        if (!fileData.clienteId) {
          throw new Error('Nenhuma empresa detectada. Selecione manualmente.')
        }
        
        // Simular URL do arquivo (em produção seria upload real)
        const fileUrl = `https://storage.example.com/docs/${fileData.id}/${fileData.file.name}`
        
        // Determinar pasta de destino
        const folderName = useCustomFolder 
          ? (customFolder || 'pasta_personalizada')
          : DOCUMENT_FOLDERS.find(f => f.id === selectedFolder)?.name || 'Documentos Gerais'
          
        const folderPath = `${folderName}/${fileData.detectedCompany || 'sem_empresa'}`
        
        // Preparar dados do documento
        const documentoData = {
          clienteId: fileData.clienteId,
          nomeArquivo: fileData.file.name,
          tipoDocumento: (fileData.detectedType || 'pessoal') as any,
          categoria: fileData.detectedCategory || 'outros',
          urlArquivo: fileUrl,
          tamanhoArquivo: fileData.file.size,
          dataUpload: new Date(),
          uploadedBy: 'Sistema Upload Múltiplo',
          pasta: folderName,
          caminhoCompleto: folderPath,
          observacoes: `Upload automático via detecção inteligente. Empresa detectada: ${fileData.detectedCompany || 'Manual'}. Pasta: ${folderPath}`
        }
        
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, progress: 75 }
            : f
        ))
        
        // Adicionar documento ao sistema
        await addDocumento(documentoData)
        
        // Sucesso
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, status: 'success', progress: 100 }
            : f
        ))
        
        console.log('Upload concluído com sucesso:', fileData.file.name)
        resolve()
        
      } catch (error) {
        console.error('Erro no upload:', error)
        
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { 
                ...f, 
                status: 'error', 
                progress: 0,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
              }
            : f
        ))
        
        resolve()
      }
    })
  }, [addDocumento])

  // Função para processar todos os uploads
  const processAllUploads = useCallback(async () => {
    console.log('Iniciando processamento de todos os uploads')
    setIsProcessing(true)
    
    const filesToUpload = files.filter(f => f.status === 'pending')
    
    if (filesToUpload.length === 0) {
      toast({
        title: "Nenhum arquivo para upload",
        description: "Todos os arquivos já foram processados.",
        variant: "destructive"
      })
      setIsProcessing(false)
      return
    }
    
    // Processar uploads em paralelo (configurável)
    const batches: FileWithMetadata[][] = []
    
    for (let i = 0; i < filesToUpload.length; i += batchSize) {
      batches.push(filesToUpload.slice(i, i + batchSize))
    }
    
    for (const batch of batches) {
      await Promise.all(batch.map(file => uploadSingleFile(file)))
    }
    
    // Calcular resultados
    const finalFiles: FileWithMetadata[] = files.map(f => ({ ...f }))
    const result: UploadResult = {
      totalFiles: files.length,
      successful: finalFiles.filter(f => f.status === 'success').length,
      failed: finalFiles.filter(f => f.status === 'error').length,
      results: finalFiles
    }
    
    setUploadResult(result)
    setIsProcessing(false)
    
    toast({
      title: "Upload concluído!",
      description: `${result.successful} arquivo(s) enviado(s) com sucesso. ${result.failed} falharam.`,
    })
    
    console.log('Resultado final do upload:', result)
    
    // 🔥 NOVO: Enviar notificações por email para clientes que receberam documentos
    if (result.successful > 0) {
      try {
        console.log('📧 Enviando notificações por email aos clientes...')
        
        // Agrupar arquivos por cliente/empresa
        const successfulFiles = finalFiles.filter(f => f.status === 'success')
        const clienteGroups: { [key: string]: FileWithMetadata[] } = {}
        
        successfulFiles.forEach(file => {
          if (file.clienteId && file.detectedCompany) {
            const key = `${file.clienteId}-${file.detectedCompany}`
            if (!clienteGroups[key]) {
              clienteGroups[key] = []
            }
            clienteGroups[key].push(file)
          }
        })
        
        // Enviar notificação para cada cliente/empresa
        for (const [groupKey, groupFiles] of Object.entries(clienteGroups)) {
          const firstFile = groupFiles[0]
          const empresa = firstFile.detectedCompany || 'Empresa'
          
          // Determinar pasta de destino
          const folderName = useCustomFolder 
            ? (customFolder || 'Pasta Personalizada')
            : DOCUMENT_FOLDERS.find(f => f.id === selectedFolder)?.name || 'Documentos Gerais'
          
          // Preparar dados dos documentos para o email
          const documentosParaEmail = groupFiles.map(file => ({
            nome: file.file.name,
            categoria: file.detectedCategory || 'Outros',
            pasta: folderName
          }))
          
          // Simular busca do email do cliente (em produção, buscar do banco de dados)
          // Por enquanto, vamos usar um email padrão ou do primeiro responsável
          const clienteEmail = 'gomes1309@gmail.com' // TODO: Buscar email real do cliente
          const clienteNome = 'Eduardo Aparecido Gomes' // TODO: Buscar nome real do cliente
          
          try {
            const emailResponse = await fetch('/api/notify-document', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                clienteEmail,
                clienteNome,
                empresa,
                documentos: documentosParaEmail,
                contadorNome: 'Contador Responsável' // TODO: Buscar nome do contador logado
              })
            })
            
            const emailResult = await emailResponse.json()
            
            if (emailResult.success) {
              console.log(`✅ Notificação enviada para ${clienteEmail} (${empresa})`)
              toast({
                title: "📧 Notificação enviada!",
                description: `Cliente ${clienteNome} foi notificado sobre ${documentosParaEmail.length} novo(s) documento(s).`,
              })
            } else {
              console.warn(`⚠️ Falha ao notificar ${clienteEmail}:`, emailResult.message)
            }
          } catch (emailError) {
            console.error(`❌ Erro ao enviar notificação para ${clienteEmail}:`, emailError)
          }
        }
        
        if (Object.keys(clienteGroups).length > 0) {
          toast({
            title: "🎉 Upload e notificações concluídos!",
            description: `${result.successful} documento(s) enviado(s) e ${Object.keys(clienteGroups).length} cliente(s) notificado(s) por email.`,
          })
        }
        
      } catch (error) {
        console.error('❌ Erro geral ao enviar notificações:', error)
        toast({
          title: "⚠️ Upload concluído",
          description: "Documentos enviados, mas houve problema ao notificar os clientes.",
          variant: "destructive"
        })
      }
    }
  }, [files, uploadSingleFile, toast, useCustomFolder, customFolder, selectedFolder, batchSize])

  // Função para remover arquivo da lista
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  // Função para limpar tudo
  const clearAll = useCallback(() => {
    setFiles([])
    setUploadResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Função para obter ícone do arquivo
  const getFileIcon = useCallback((fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (['pdf'].includes(extension || '')) return <FileText className="w-5 h-5 text-red-500" />
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) return <ImageIcon className="w-5 h-5 text-blue-500" />
    if (['doc', 'docx'].includes(extension || '')) return <FileText className="w-5 h-5 text-blue-600" />
    if (['xls', 'xlsx'].includes(extension || '')) return <FileIcon className="w-5 h-5 text-green-500" />
    
    return <FileIcon className="w-5 h-5 text-gray-500" />
  }, [])

  // Função para formatar tamanho do arquivo
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  return (
    <Card className="w-full bg-white shadow-lg border-0" data-macaly="upload-manager-card">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-full">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-blue-700 font-bold text-xl" data-macaly="upload-title">
              Upload Múltiplo Inteligente
            </CardTitle>
            <CardDescription className="text-slate-600" data-macaly="upload-description">
              Envie vários documentos de uma vez com detecção automática de empresas
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Configurações de Upload */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-detection">Detecção Automática de Empresas</Label>
              <Switch
                id="auto-detection"
                checked={autoDetectionEnabled}
                onCheckedChange={setAutoDetectionEnabled}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Arquivos por Lote: {batchSize}</Label>
                <Badge variant="outline">{batchSize} arquivos</Badge>
              </div>
              <Slider
                value={[batchSize]}
                onValueChange={(value) => setBatchSize(value[0])}
                max={50}
                min={5}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Processar {batchSize} arquivos por vez (5-50)
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Uploads Simultâneos: {maxConcurrentUploads}</Label>
                <Badge variant="outline">{maxConcurrentUploads} simultâneos</Badge>
              </div>
              <Slider
                value={[maxConcurrentUploads]}
                onValueChange={(value) => setMaxConcurrentUploads(value[0])}
                max={50}
                min={10}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Máximo de {maxConcurrentUploads} uploads simultâneos (10-50)
              </p>
            </div>
            
            <Separator />
            
            {/* Seleção de Pasta */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">🗂️ Pasta de Destino</Label>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {useCustomFolder ? 'Personalizada' : 'Pré-definida'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="custom-folder"
                  checked={useCustomFolder}
                  onCheckedChange={setUseCustomFolder}
                />
                <Label htmlFor="custom-folder" className="text-sm">
                  Usar pasta personalizada
                </Label>
              </div>
              
              {!useCustomFolder ? (
                <div className="space-y-2">
                  <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma pasta" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_FOLDERS.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{folder.name}</span>
                            <span className="text-xs text-muted-foreground">{folder.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Nome da pasta personalizada (ex: Projeto 2024, Cliente Especial)"
                    value={customFolder}
                    onChange={(e) => setCustomFolder(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite o nome da pasta onde os arquivos serão organizados
                  </p>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <div className="text-blue-600 mt-0.5">ℹ️</div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Organização dos Arquivos:</p>
                    <p>Os documentos serão salvos em: <span className="font-mono bg-white px-1 rounded">
                      /{useCustomFolder ? (customFolder || 'pasta_personalizada') : DOCUMENT_FOLDERS.find(f => f.id === selectedFolder)?.name || 'documentos_gerais'}/[empresa]/[arquivo]
                    </span></p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Área de Upload */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-slate-700 font-medium">Selecionar Arquivos</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto-detection"
                checked={autoDetectionEnabled}
                onChange={(e) => setAutoDetectionEnabled(e.target.checked)}
                className="rounded border-slate-300"
              />
              <Label htmlFor="auto-detection" className="text-sm text-slate-600">
                Detecção Automática
              </Label>
            </div>
          </div>
          
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors duration-200">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            />
            
            <div className="space-y-4">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-slate-800 mb-2">
                  Arraste arquivos aqui ou clique para selecionar
                </p>
                <p className="text-sm text-slate-500">
                  Formatos: PDF, Word, Excel, Imagens • Máximo: 50MB por arquivo
                </p>
              </div>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg"
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar Arquivos
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
                  onClick={processAllUploads}
                  disabled={isProcessing || files.every(f => f.status !== 'pending')}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium"
                >
                  {isProcessing ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Todos
                    </>
                  )}
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
            
            <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
              {files.map((fileData) => (
                <Card key={fileData.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {/* Ícone do arquivo */}
                      <div className="bg-slate-100 p-2 rounded-lg">
                        {fileData.file.type.startsWith('image/') ? (
                          <ImageIcon className="h-4 w-4 text-blue-500" />
                        ) : (
                          <FileIcon className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      
                      {/* Informações do arquivo */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 truncate">
                          {fileData.file.name}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {formatFileSize(fileData.file.size)}
                        </p>
                        
                        {/* Detecção automática */}
                        {fileData.detectedCompany && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Building2 className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">
                              {fileData.detectedCompany}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {fileData.detectedCategory}
                            </Badge>
                          </div>
                        )}
                        
                        {/* Pasta de destino */}
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="text-blue-600">📁</div>
                          <span className="text-xs text-blue-700">
                            {useCustomFolder 
                              ? (customFolder || 'Pasta Personalizada')
                              : DOCUMENT_FOLDERS.find(f => f.id === selectedFolder)?.name || 'Documentos Gerais'
                            }
                            {fileData.detectedCompany && ` / ${fileData.detectedCompany}`}
                          </span>
                        </div>
                        
                        {!fileData.detectedCompany && autoDetectionEnabled && (
                          <div className="flex items-center space-x-2 mt-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-orange-600">
                              Empresa não detectada
                            </span>
                          </div>
                        )}
                        
                        {/* Barra de progresso */}
                        {fileData.status === 'processing' && (
                          <div className="mt-2">
                            <Progress value={fileData.progress} className="h-2" />
                          </div>
                        )}
                        
                        {/* Erro */}
                        {fileData.error && (
                          <p className="text-sm text-red-600 mt-1">
                            {fileData.error}
                          </p>
                        )}
                      </div>
                      
                      {/* Status e ações */}
                      <div className="flex items-center space-x-2">
                        {fileData.status === 'pending' && (
                          <Badge variant="outline" className="text-slate-600">
                            Aguardando
                          </Badge>
                        )}
                        {fileData.status === 'processing' && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Clock className="w-3 h-3 mr-1 animate-spin" />
                            Processando
                          </Badge>
                        )}
                        {fileData.status === 'success' && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Sucesso
                          </Badge>
                        )}
                        {fileData.status === 'error' && (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Erro
                          </Badge>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFile(fileData.id)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
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

        {/* Resultado do Upload */}
        {uploadResult && (
          <Card className="border-0 shadow-sm bg-slate-50">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">
                Resultado do Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-slate-800">{uploadResult.totalFiles}</p>
                  <p className="text-sm text-slate-600">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{uploadResult.successful}</p>
                  <p className="text-sm text-slate-600">Sucesso</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{uploadResult.failed}</p>
                  <p className="text-sm text-slate-600">Falharam</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}