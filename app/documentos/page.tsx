"use client"

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { 
  FolderOpen, 
  FileText, 
  Plus, 
  Search,
  Upload,
  Download,
  LogOut,
  User,
  Building,
  Receipt,
  Calculator,
  DollarSign,
  UserCheck,
  Eye,
  Trash2,
  Filter,
  ChevronRight,
  Home,
  Calendar,
  FileIcon,
  Image,
  File,
  Share2,
  Link,
  Copy,
  Tractor,
  FolderPlus,
  MessageCircle,
  Mail
} from 'lucide-react'

interface Cliente {
  id: string
  nome: string
  cnpj: string
  email: string
  telefone: string
  endereco: string
  dataCadastro: Date
}

interface Documento {
  id: string
  clienteId: string
  categoria: 'abertura_alteracao' | 'fiscal' | 'contabil' | 'imposto_renda' | 'pessoal' | 'propriedades_rurais' | 'outros_documentos'
  nome: string
  nomeOriginal: string
  tipo: string
  tamanho: number
  dataUpload: Date
  uploadPor: string
  descricao?: string
  tags?: string[]
  arquivo?: File
  url?: string
}

interface Pasta {
  categoria: string
  nome: string
  icone: any
  cor: string
  descricao: string
}

const PASTAS: Pasta[] = [
  {
    categoria: 'abertura_alteracao',
    nome: 'Abertura e Alterações',
    icone: Building,
    cor: 'blue',
    descricao: 'Documentos de abertura e alterações de empresas'
  },
  {
    categoria: 'fiscal',
    nome: 'Documentos Fiscais',
    icone: Receipt,
    cor: 'green',
    descricao: 'Notas fiscais, declarações e documentos fiscais'
  },
  {
    categoria: 'contabil',
    nome: 'Documentos Contábeis',
    icone: Calculator,
    cor: 'purple',
    descricao: 'Balanços, demonstrativos e relatórios contábeis'
  },
  {
    categoria: 'imposto_renda',
    nome: 'Imposto de Renda',
    icone: DollarSign,
    cor: 'yellow',
    descricao: 'Declarações e documentos de IR'
  },
  {
    categoria: 'pessoal',
    nome: 'Documentos Pessoais',
    icone: UserCheck,
    cor: 'red',
    descricao: 'Documentos pessoais dos sócios e funcionários'
  },
  {
    categoria: 'propriedades_rurais',
    nome: 'Propriedades Rurais',
    icone: Tractor,
    cor: 'emerald',
    descricao: 'Documentos de propriedades rurais e agronegócio'
  },
  {
    categoria: 'outros_documentos',
    nome: 'Outros Documentos',
    icone: FolderPlus,
    cor: 'slate',
    descricao: 'Documentos diversos que não se encaixam em outras categorias'
  }
]

const VALID_CREDENTIALS = {
  email: 'agassessoriacontrole@gmail.com',
  password: 'Fx21701313@@##'
}

const WHATSAPP_NUMBER = '5516991098966' // Número da contabilidade com código do país

export default function SistemaDocumentos() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null)
  const [pesquisa, setPesquisa] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')
  const [showAddClienteDialog, setShowAddClienteDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<Documento | null>(null)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const { toast } = useToast()

  // Login state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  // Form states
  const [clienteForm, setClienteForm] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: ''
  })

  const [uploadForm, setUploadForm] = useState({
    categoria: 'abertura_alteracao',
    descricao: '',
    tags: ''
  })

  // Authentication check
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth_token')
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true)
    }
  }, [])

  // Load data
  useEffect(() => {
    if (isAuthenticated) {
      // Load clientes
      const savedClientes = localStorage.getItem('clientes_documentos')
      if (savedClientes) {
        try {
          const parsedClientes = JSON.parse(savedClientes).map((cliente: any) => ({
            ...cliente,
            dataCadastro: new Date(cliente.dataCadastro)
          }))
          setClientes(parsedClientes)
        } catch (error) {
          console.error('Error loading clientes:', error)
        }
      } else {
        // Sample data
        const sampleClientes: Cliente[] = [
          {
            id: '1',
            nome: 'Restaurante Sabor Mineiro Ltda',
            cnpj: '12.345.678/0001-90',
            email: 'contato@sabormineiro.com',
            telefone: '(11) 99999-9999',
            endereco: 'Rua das Flores, 123 - Centro',
            dataCadastro: new Date('2024-01-15')
          },
          {
            id: '2',
            nome: 'Farmácia Central Ltda',
            cnpj: '98.765.432/0001-10',
            email: 'admin@farmaciacentral.com',
            telefone: '(11) 88888-8888',
            endereco: 'Av. Principal, 456 - Centro',
            dataCadastro: new Date('2024-02-10')
          },
          {
            id: '3',
            nome: 'Hotel Estrela Ltda',
            cnpj: '11.222.333/0001-44',
            email: 'reservas@hotelestrela.com',
            telefone: '(11) 77777-7777',
            endereco: 'Praça Central, 789 - Centro',
            dataCadastro: new Date('2024-03-05')
          }
        ]
        setClientes(sampleClientes)
      }

      // Load documentos
      const savedDocumentos = localStorage.getItem('documentos_sistema')
      if (savedDocumentos) {
        try {
          const parsedDocumentos = JSON.parse(savedDocumentos).map((doc: any) => ({
            ...doc,
            dataUpload: new Date(doc.dataUpload)
          }))
          setDocumentos(parsedDocumentos)
        } catch (error) {
          console.error('Error loading documentos:', error)
        }
      } else {
        // Sample documents
        const sampleDocumentos: Documento[] = [
          {
            id: '1',
            clienteId: '1',
            categoria: 'abertura_alteracao',
            nome: 'Contrato Social',
            nomeOriginal: 'contrato_social_restaurante.pdf',
            tipo: 'application/pdf',
            tamanho: 1024000,
            dataUpload: new Date('2024-01-20'),
            uploadPor: 'João Silva',
            descricao: 'Contrato social da empresa',
            tags: ['contrato', 'social', 'abertura']
          },
          {
            id: '2',
            clienteId: '1',
            categoria: 'fiscal',
            nome: 'Nota Fiscal Janeiro 2024',
            nomeOriginal: 'nf_janeiro_2024.xml',
            tipo: 'application/xml',
            tamanho: 512000,
            dataUpload: new Date('2024-02-01'),
            uploadPor: 'Maria Santos',
            descricao: 'Notas fiscais do mês de janeiro',
            tags: ['nota', 'fiscal', 'janeiro']
          },
          {
            id: '3',
            clienteId: '2',
            categoria: 'contabil',
            nome: 'Balanço Patrimonial 2023',
            nomeOriginal: 'balanco_2023.xlsx',
            tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            tamanho: 2048000,
            dataUpload: new Date('2024-02-15'),
            uploadPor: 'Carlos Oliveira',
            descricao: 'Balanço patrimonial do exercício 2023',
            tags: ['balanço', 'patrimonial', '2023']
          },
          {
            id: '4',
            clienteId: '3',
            categoria: 'propriedades_rurais',
            nome: 'Cadastro Ambiental Rural',
            nomeOriginal: 'car_propriedade_rural.pdf',
            tipo: 'application/pdf',
            tamanho: 1536000,
            dataUpload: new Date('2024-03-10'),
            uploadPor: 'Ana Costa',
            descricao: 'Cadastro Ambiental Rural da propriedade',
            tags: ['car', 'ambiental', 'rural']
          },
          {
            id: '5',
            clienteId: '1',
            categoria: 'outros_documentos',
            nome: 'Plano de Negócios',
            nomeOriginal: 'plano_negocios_2024.docx',
            tipo: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            tamanho: 768000,
            dataUpload: new Date('2024-03-15'),
            uploadPor: 'Pedro Almeida',
            descricao: 'Plano de negócios atualizado para 2024',
            tags: ['plano', 'negócios', '2024']
          }
        ]
        setDocumentos(sampleDocumentos)
      }
    }
  }, [isAuthenticated])

  // Save data
  useEffect(() => {
    if (clientes.length > 0 && isAuthenticated) {
      localStorage.setItem('clientes_documentos', JSON.stringify(clientes))
    }
  }, [clientes, isAuthenticated])

  useEffect(() => {
    if (documentos.length > 0 && isAuthenticated) {
      localStorage.setItem('documentos_sistema', JSON.stringify(documentos))
    }
  }, [documentos, isAuthenticated])

  // Login handler
  const handleLogin = useCallback(() => {
    console.log('Login attempt:', loginData)
    setLoginError('')
    
    if (loginData.email === VALID_CREDENTIALS.email && loginData.password === VALID_CREDENTIALS.password) {
      setIsAuthenticated(true)
      localStorage.setItem('auth_token', 'authenticated')
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao sistema de documentos.",
      })
    } else {
      setLoginError('Email ou senha incorretos')
    }
  }, [loginData, toast])

  // Logout handler
  const handleLogout = useCallback(() => {
    setIsAuthenticated(false)
    localStorage.removeItem('auth_token')
    setLoginData({ email: '', password: '' })
    setClienteSelecionado(null)
    setCategoriaSelecionada(null)
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema.",
    })
  }, [toast])

  // Add cliente handler
  const handleAddCliente = useCallback(() => {
    console.log('Adding cliente:', clienteForm)
    
    const novoCliente: Cliente = {
      id: Date.now().toString(),
      nome: clienteForm.nome,
      cnpj: clienteForm.cnpj,
      email: clienteForm.email,
      telefone: clienteForm.telefone,
      endereco: clienteForm.endereco,
      dataCadastro: new Date()
    }
    
    setClientes(prev => [...prev, novoCliente])
    setClienteForm({
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: ''
    })
    setShowAddClienteDialog(false)
    
    toast({
      title: "Cliente adicionado com sucesso!",
      description: `${novoCliente.nome} foi cadastrado.`,
    })
  }, [clienteForm, toast])

  // Upload handler
  const handleUpload = useCallback(() => {
    console.log('Uploading files:', uploadFiles, 'Form:', uploadForm)
    
    if (!clienteSelecionado || uploadFiles.length === 0) return
    
    const novosDocumentos = uploadFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      clienteId: clienteSelecionado.id,
      categoria: uploadForm.categoria as Documento['categoria'],
      nome: file.name.split('.')[0],
      nomeOriginal: file.name,
      tipo: file.type,
      tamanho: file.size,
      dataUpload: new Date(),
      uploadPor: 'Usuário Logado',
      descricao: uploadForm.descricao,
      tags: uploadForm.tags ? uploadForm.tags.split(',').map(tag => tag.trim()) : [],
      arquivo: file
    }))
    
    setDocumentos(prev => [...prev, ...novosDocumentos])
    setUploadFiles([])
    setUploadForm({
      categoria: 'abertura_alteracao',
      descricao: '',
      tags: ''
    })
    setShowUploadDialog(false)
    
    toast({
      title: "Upload realizado com sucesso!",
      description: `${novosDocumentos.length} documento(s) enviado(s).`,
    })
  }, [clienteSelecionado, uploadFiles, uploadForm, toast])

  // Get file icon
  const getFileIcon = (tipo: string) => {
    if (tipo.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
    if (tipo.includes('image')) return <Image className="w-5 h-5 text-blue-500" />
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return <FileIcon className="w-5 h-5 text-green-500" />
    if (tipo.includes('word') || tipo.includes('document')) return <FileText className="w-5 h-5 text-blue-600" />
    return <File className="w-5 h-5 text-gray-500" />
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get category color
  const getCategoryColor = (categoria: string) => {
    const pasta = PASTAS.find(p => p.categoria === categoria)
    return pasta?.cor || 'gray'
  }

  // Get category icon
  const getCategoryIcon = (categoria: string) => {
    const pasta = PASTAS.find(p => p.categoria === categoria)
    return pasta?.icone || FileText
  }

  // Get category name
  const getCategoryName = (categoria: string) => {
    const pasta = PASTAS.find(p => p.categoria === categoria)
    return pasta?.nome || 'Desconhecido'
  }

  // Filter documents
  const filteredDocumentos = documentos.filter(doc => {
    const matchesCliente = !clienteSelecionado || doc.clienteId === clienteSelecionado.id
    const matchesCategoria = !categoriaSelecionada || doc.categoria === categoriaSelecionada
    const matchesFiltro = filtroCategoria === 'todas' || doc.categoria === filtroCategoria
    
    const matchesPesquisa = pesquisa === '' || 
      doc.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
      doc.nomeOriginal.toLowerCase().includes(pesquisa.toLowerCase()) ||
      doc.descricao?.toLowerCase().includes(pesquisa.toLowerCase()) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(pesquisa.toLowerCase()))
    
    return matchesCliente && matchesCategoria && matchesFiltro && matchesPesquisa
  })

  // Get breadcrumbs
  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: 'Início', onClick: () => { setClienteSelecionado(null); setCategoriaSelecionada(null) } }
    ]
    
    if (clienteSelecionado) {
      breadcrumbs.push({
        label: clienteSelecionado.nome,
        onClick: () => setCategoriaSelecionada(null)
      })
    }
    
    if (categoriaSelecionada) {
      breadcrumbs.push({
        label: getCategoryName(categoriaSelecionada),
        onClick: () => {}
      })
    }
    
    return breadcrumbs
  }

  // Delete document handler
  const handleDeleteDocument = useCallback((id: string) => {
    const documento = documentos.find(d => d.id === id)
    setDocumentos(prev => prev.filter(d => d.id !== id))
    
    toast({
      title: "Documento removido",
      description: `${documento?.nome} foi removido do sistema.`,
    })
  }, [documentos, toast])

  // View document handler
  const handleViewDocument = useCallback((documento: Documento) => {
    setSelectedDocument(documento)
    setShowViewDialog(true)
  }, [])

  // Download document handler
  const handleDownloadDocument = useCallback((documento: Documento) => {
    console.log('Downloading document:', documento.nome)
    
    // Simular download de arquivo
    if (documento.arquivo) {
      const url = URL.createObjectURL(documento.arquivo)
      const a = document.createElement('a')
      a.href = url
      a.download = documento.nomeOriginal
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      // Simular download para documentos que não têm arquivo físico
      const fakeDownload = document.createElement('a')
      fakeDownload.href = '#'
      fakeDownload.download = documento.nomeOriginal
      fakeDownload.click()
    }
    
    toast({
      title: "Download iniciado",
      description: `Download do arquivo ${documento.nome} iniciado.`,
    })
  }, [toast])

  // Share document handler
  const handleShareDocument = useCallback((documento: Documento) => {
    console.log('Sharing document:', documento.nome)
    
    // Gerar URL de compartilhamento (simulado)
    const shareableUrl = `https://ag-assessoria.com/documentos/share/${documento.id}`
    setShareUrl(shareableUrl)
    setSelectedDocument(documento)
    setShowShareDialog(true)
  }, [])

  // Copy share URL to clipboard
  const copyShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link copiado!",
        description: "O link de compartilhamento foi copiado para a área de transferência.",
      })
    } catch (error) {
      console.error('Erro ao copiar URL:', error)
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: "destructive",
      })
    }
  }, [shareUrl, toast])

  // Generate share link via email
  const shareViaEmail = useCallback(() => {
    if (!selectedDocument) return
    
    const subject = `Documento: ${selectedDocument.nome}`
    const body = `Olá,\n\nEstou compartilhando com você o documento "${selectedDocument.nome}".\n\nDescrição: ${selectedDocument.descricao || 'Sem descrição'}\n\nAcesse através do link: ${shareUrl}\n\nAtenciosamente,\nAG Assessoria`
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoUrl, '_blank')
    
    toast({
      title: "Email aberto",
      description: "O cliente de email foi aberto para compartilhamento.",
    })
  }, [selectedDocument, shareUrl, toast])

  // Generate share link via WhatsApp
  const shareViaWhatsApp = useCallback(() => {
    if (!selectedDocument) return
    
    const message = `🔗 *Documento Compartilhado*\n\n` +
      `📋 *Documento:* ${selectedDocument.nome}\n` +
      `📁 *Categoria:* ${getCategoryName(selectedDocument.categoria)}\n` +
      `📄 *Descrição:* ${selectedDocument.descricao || 'Sem descrição'}\n\n` +
      `🌐 *Link de Acesso:* ${shareUrl}\n\n` +
      `---\n` +
      `*AG Assessoria Contábil*\n` +
      `📞 (16) 99109-8966`
    
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
    
    toast({
      title: "WhatsApp aberto",
      description: "O WhatsApp foi aberto para compartilhamento.",
    })
  }, [selectedDocument, shareUrl, toast])

  // Login Component
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-white/10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/6779714/pexels-photo-6779714.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')`
          }}
        ></div>
        <Toaster />
        <div className="max-w-md w-full relative z-10">
          <Card className="shadow-2xl bg-white/95 backdrop-blur-sm border-0">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-8">
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <img 
                    src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/byzxsjjbah9d1487icuwfc7y/sTuQmgVPSl8WwCSW-LJke/image.png" 
                    alt="AG Assessoria Logo" 
                    className="h-20 w-auto object-contain"
                  />
                </div>
              </div>
              <div className="text-center">
                <CardDescription className="text-slate-700 font-semibold text-lg">
                  SISTEMA DE DOCUMENTOS
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="email"
                    placeholder="Digite seu email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="current-password"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Digite sua senha"
                  />
                </div>
              </div>
              
              {loginError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                  {loginError}
                </div>
              )}
              
              <Button 
                onClick={handleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors duration-200"
                disabled={!loginData.email || !loginData.password}
              >
                Entrar no Sistema
              </Button>
              
              <div className="text-center pt-4">
                <p className="text-xs text-slate-500">
                  Desenvolvimento por <span className="font-semibold text-slate-700">AG ASSESSORIA CONTÁBIL</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="bg-white p-3 rounded-xl shadow-lg">
                  <img 
                    src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/byzxsjjbah9d1487icuwfc7y/sTuQmgVPSl8WwCSW-LJke/image.png" 
                    alt="AG Assessoria Logo" 
                    className="h-12 w-auto object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">AG ASSESSORIA</h1>
                  <p className="text-sm text-slate-600 font-medium">SISTEMA DE DOCUMENTOS</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 font-medium px-6 py-2 rounded-lg transition-colors duration-200"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              
              <Button 
                onClick={() => setShowAddClienteDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
              
              {clienteSelecionado && (
                <Button 
                  onClick={() => setShowUploadDialog(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              )}
              
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 font-medium px-6 py-2 rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-slate-600">
            {getBreadcrumbs().map((breadcrumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
                <button
                  onClick={breadcrumb.onClick}
                  className="hover:text-blue-600 transition-colors duration-200"
                >
                  {breadcrumb.label}
                </button>
              </div>
            ))}
          </nav>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 bg-white shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-blue-700 font-bold text-lg">Pesquisa e Filtros</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="pesquisa" className="text-slate-700 font-medium">Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="pesquisa"
                    placeholder="Nome, descrição ou tags..."
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="filtro-categoria" className="text-slate-700 font-medium">Categoria</Label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Categorias</SelectItem>
                    {PASTAS.map(pasta => (
                      <SelectItem key={pasta.categoria} value={pasta.categoria}>
                        {pasta.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 font-medium rounded-lg transition-colors duration-200"
                  onClick={() => {
                    setPesquisa('')
                    setFiltroCategoria('todas')
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Area */}
        {!clienteSelecionado ? (
          /* Clientes Grid */
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
              <CardTitle className="text-blue-700 font-bold text-lg">Clientes</CardTitle>
              <CardDescription className="text-slate-600">
                Selecione um cliente para visualizar seus documentos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientes.map((cliente) => {
                  const docsCount = documentos.filter(doc => doc.clienteId === cliente.id).length
                  
                  return (
                    <Card 
                      key={cliente.id} 
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 border-l-4 border-l-blue-500 hover:scale-105"
                      onClick={() => setClienteSelecionado(cliente)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-100 p-3 rounded-full">
                            <Building className="w-8 h-8 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-800">{cliente.nome}</h3>
                            <p className="text-sm text-slate-600">{cliente.cnpj}</p>
                            <p className="text-sm text-slate-600">{cliente.email}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center">
                          <Badge className="bg-blue-100 text-blue-800">
                            {docsCount} documento(s)
                          </Badge>
                          <p className="text-xs text-slate-500">
                            Cadastrado em {format(cliente.dataCadastro, 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ) : !categoriaSelecionada ? (
          /* Pastas Grid */
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
              <CardTitle className="text-blue-700 font-bold text-lg">
                Documentos - {clienteSelecionado.nome}
              </CardTitle>
              <CardDescription className="text-slate-600">
                Selecione uma categoria para visualizar os documentos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PASTAS.map((pasta) => {
                  const docsCount = documentos.filter(doc => 
                    doc.clienteId === clienteSelecionado.id && doc.categoria === pasta.categoria
                  ).length
                  
                  const Icon = pasta.icone
                  
                  return (
                    <Card 
                      key={pasta.categoria} 
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 border-l-4 border-l-blue-500 hover:scale-105"
                      onClick={() => setCategoriaSelecionada(pasta.categoria)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className={`bg-${pasta.cor}-100 p-3 rounded-full`}>
                            <Icon className={`w-8 h-8 text-${pasta.cor}-600`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-slate-800">{pasta.nome}</h3>
                            <p className="text-sm text-slate-600">{pasta.descricao}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Badge className={`bg-${pasta.cor}-100 text-${pasta.cor}-800`}>
                            {docsCount} documento(s)
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Documentos List */
          <Card className="bg-white shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
              <CardTitle className="text-blue-700 font-bold text-lg">
                {getCategoryName(categoriaSelecionada)} - {clienteSelecionado.nome}
              </CardTitle>
              <CardDescription className="text-slate-600">
                Documentos da categoria selecionada
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {filteredDocumentos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-slate-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-lg">Nenhum documento encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredDocumentos.map((documento) => (
                    <Card key={documento.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-slate-100 p-2 rounded-lg">
                              {getFileIcon(documento.tipo)}
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-bold text-slate-800">{documento.nome}</h3>
                              <p className="text-sm text-slate-600">{documento.nomeOriginal}</p>
                              <div className="flex items-center space-x-4 mt-2">
                                <p className="text-xs text-slate-500">
                                  Enviado em {format(documento.dataUpload, 'dd/MM/yyyy HH:mm')}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {formatFileSize(documento.tamanho)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Por {documento.uploadPor}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 transition-colors duration-200"
                              onClick={() => handleViewDocument(documento)}
                              title="Visualizar documento"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-500 transition-colors duration-200"
                              onClick={() => handleDownloadDocument(documento)}
                              title="Baixar documento"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-purple-600 border-purple-300 hover:bg-purple-50 hover:border-purple-500 transition-colors duration-200"
                              onClick={() => handleShareDocument(documento)}
                              title="Compartilhar documento"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500 transition-colors duration-200"
                              onClick={() => handleDeleteDocument(documento.id)}
                              title="Remover documento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {documento.descricao && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-md">
                            <p className="text-sm text-slate-700">{documento.descricao}</p>
                          </div>
                        )}
                        
                        {documento.tags && documento.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {documento.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add Cliente Dialog */}
      <Dialog open={showAddClienteDialog} onOpenChange={setShowAddClienteDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Adicione um novo cliente ao sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome da Empresa *</Label>
              <Input
                id="nome"
                value={clienteForm.nome}
                onChange={(e) => setClienteForm(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome da empresa"
                className="border-slate-300"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={clienteForm.cnpj}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, cnpj: e.target.value }))}
                  placeholder="00.000.000/0000-00"
                  className="border-slate-300"
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={clienteForm.telefone}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="border-slate-300"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={clienteForm.email}
                onChange={(e) => setClienteForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contato@empresa.com"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                value={clienteForm.endereco}
                onChange={(e) => setClienteForm(prev => ({ ...prev, endereco: e.target.value }))}
                placeholder="Rua, número, bairro, cidade"
                className="border-slate-300"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddClienteDialog(false)}
                className="text-slate-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddCliente}
                disabled={!clienteForm.nome || !clienteForm.cnpj || !clienteForm.email || !clienteForm.telefone || !clienteForm.endereco}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Adicionar Cliente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload de Documentos</DialogTitle>
            <DialogDescription>
              Envie documentos para {clienteSelecionado?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={uploadForm.categoria} onValueChange={(value) => setUploadForm(prev => ({ ...prev, categoria: value }))}>
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {PASTAS.map(pasta => (
                    <SelectItem key={pasta.categoria} value={pasta.categoria}>
                      {pasta.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="files">Arquivos *</Label>
              <Input
                id="files"
                type="file"
                multiple
                onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                className="border-slate-300"
              />
              {uploadFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  {uploadFiles.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-slate-600">
                      {getFileIcon(file.type)}
                      <span>{file.name}</span>
                      <span className="text-xs">({formatFileSize(file.size)})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={uploadForm.descricao}
                onChange={(e) => setUploadForm(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição dos documentos (opcional)"
                className="border-slate-300"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Tags separadas por vírgula (opcional)"
                className="border-slate-300"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
                className="text-slate-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploadFiles.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Fazer Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Visualizar Documento</DialogTitle>
            <DialogDescription>
              Detalhes do documento selecionado
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Nome</Label>
                  <p className="text-slate-900 font-semibold">{selectedDocument.nome}</p>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">Nome Original</Label>
                  <p className="text-slate-900">{selectedDocument.nomeOriginal}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Categoria</Label>
                  <p className="text-slate-900">{getCategoryName(selectedDocument.categoria)}</p>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">Tamanho</Label>
                  <p className="text-slate-900">{formatFileSize(selectedDocument.tamanho)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Data de Upload</Label>
                  <p className="text-slate-900">{format(selectedDocument.dataUpload, 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">Enviado por</Label>
                  <p className="text-slate-900">{selectedDocument.uploadPor}</p>
                </div>
              </div>
              
              {selectedDocument.descricao && (
                <div>
                  <Label className="text-slate-700 font-medium">Descrição</Label>
                  <p className="text-slate-900 bg-slate-50 p-3 rounded-md">{selectedDocument.descricao}</p>
                </div>
              )}
              
              {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                <div>
                  <Label className="text-slate-700 font-medium">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedDocument.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowViewDialog(false)}
                  className="text-slate-600"
                >
                  Fechar
                </Button>
                <Button
                  variant="outline"
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                  onClick={() => {
                    setShowViewDialog(false)
                    handleShareDocument(selectedDocument)
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    handleDownloadDocument(selectedDocument)
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Document Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Compartilhar Documento</DialogTitle>
            <DialogDescription>
              Compartilhe o documento "{selectedDocument?.nome}" com outras pessoas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-700 font-medium">Link de Compartilhamento</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="bg-slate-50 border-slate-300 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyShareUrl}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  title="Copiar link"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Opções de Compartilhamento</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={shareViaEmail}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  onClick={shareViaWhatsApp}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowShareDialog(false)}
                className="text-slate-600"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}