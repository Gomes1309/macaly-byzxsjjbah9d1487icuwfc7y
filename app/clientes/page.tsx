'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Download, FileText, Eye, Search, Filter, Calendar, Building, User, Lock, Shield, CheckCircle, AlertCircle, Folder, FolderOpen, Star, Clock, Mail, Phone, Users, UserPlus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ResponsaveisManager } from '@/components/ResponsaveisManager'
import { CNPJSearch } from '@/components/CNPJSearch'
import { formatCNPJ } from '@/lib/cnpj-utils'
import Link from 'next/link'

// Tipos
interface Cliente {
  id: string
  nome: string
  cnpj: string
  email: string
  telefone: string
  responsavel: string
  dataVinculacao: Date
  status: 'ativo' | 'inativo' | 'suspenso'
  plano: 'basico' | 'completo' | 'premium'
  avatar?: string
}

interface Documento {
  id: string
  clienteId: string
  nome: string
  categoria: 'abertura_alteracao' | 'fiscal' | 'contabil' | 'imposto_renda' | 'pessoal'
  tipo: string
  tamanho: string
  dataUpload: Date
  status: 'disponivel' | 'processando' | 'vencido'
  url: string
  descricao?: string
  confidencial: boolean
}

interface Notificacao {
  id: string
  clienteId: string
  titulo: string
  mensagem: string
  tipo: 'info' | 'warning' | 'success' | 'error'
  dataEnvio: Date
  lida: boolean
}

// Dados mock
const mockClientes: Cliente[] = [
  {
    id: '1',
    nome: 'Empresa ABC Ltda',
    cnpj: '12.345.678/0001-90',
    email: 'contato@empresaabc.com',
    telefone: '(11) 99999-9999',
    responsavel: 'João Silva',
    dataVinculacao: new Date('2023-01-15'),
    status: 'ativo',
    plano: 'completo',
  },
  {
    id: '2',
    nome: 'Comércio XYZ ME',
    cnpj: '98.765.432/0001-10',
    email: 'financeiro@comercioxyz.com',
    telefone: '(11) 88888-8888',
    responsavel: 'Maria Santos',
    dataVinculacao: new Date('2023-03-20'),
    status: 'ativo',
    plano: 'premium',
  },
]

const mockDocumentos: Documento[] = [
  {
    id: '1',
    clienteId: '1',
    nome: 'Contrato Social',
    categoria: 'abertura_alteracao',
    tipo: 'PDF',
    tamanho: '2.5 MB',
    dataUpload: new Date('2024-01-10'),
    status: 'disponivel',
    url: '#',
    descricao: 'Contrato social da empresa com última alteração',
    confidencial: true,
  },
  {
    id: '2',
    clienteId: '1',
    nome: 'Balancete Dezembro 2023',
    categoria: 'contabil',
    tipo: 'PDF',
    tamanho: '1.8 MB',
    dataUpload: new Date('2024-01-05'),
    status: 'disponivel',
    url: '#',
    descricao: 'Balancete patrimonial referente ao mês de dezembro',
    confidencial: false,
  },
  {
    id: '3',
    clienteId: '1',
    nome: 'DARF Janeiro 2024',
    categoria: 'fiscal',
    tipo: 'PDF',
    tamanho: '456 KB',
    dataUpload: new Date('2024-01-15'),
    status: 'disponivel',
    url: '#',
    descricao: 'Guia DARF para pagamento de impostos',
    confidencial: false,
  },
]

const mockNotificacoes: Notificacao[] = [
  {
    id: '1',
    clienteId: '1',
    titulo: 'Novos documentos disponíveis',
    mensagem: 'Balancete de dezembro e DARF de janeiro foram adicionados',
    tipo: 'info',
    dataEnvio: new Date('2024-01-15'),
    lida: false,
  },
  {
    id: '2',
    clienteId: '1',
    titulo: 'Prazo de entrega',
    mensagem: 'Documentos para IR devem ser enviados até 28/02/2024',
    tipo: 'warning',
    dataEnvio: new Date('2024-01-10'),
    lida: true,
  },
]

const categoriaConfig = {
  abertura_alteracao: {
    label: 'Abertura/Alteração',
    color: 'bg-blue-100 text-blue-800',
    icon: Building,
  },
  fiscal: {
    label: 'Documentos Fiscais',
    color: 'bg-red-100 text-red-800',
    icon: FileText,
  },
  contabil: {
    label: 'Documentos Contábeis',
    color: 'bg-green-100 text-green-800',
    icon: FileText,
  },
  imposto_renda: {
    label: 'Imposto de Renda',
    color: 'bg-purple-100 text-purple-800',
    icon: FileText,
  },
  pessoal: {
    label: 'Documentos Pessoais',
    color: 'bg-orange-100 text-orange-800',
    icon: User,
  },
}

const planoConfig = {
  basico: {
    label: 'Básico',
    color: 'bg-gray-100 text-gray-800',
    limite: 50,
  },
  completo: {
    label: 'Completo',
    color: 'bg-blue-100 text-blue-800',
    limite: 200,
  },
  premium: {
    label: 'Premium',
    color: 'bg-gold-100 text-gold-800',
    limite: 500,
  },
}

export default function ClientesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentCliente, setCurrentCliente] = useState<Cliente | null>(null)
  const [documentos, setDocumentos] = useState<Documento[]>(mockDocumentos)
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>(mockNotificacoes)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all')
  const [selectedDocument, setSelectedDocument] = useState<Documento | null>(null)
  const [loginData, setLoginData] = useState({
    cnpj: '',
    password: ''
  })
  const [loginError, setLoginError] = useState('')
  const [showCNPJSearch, setShowCNPJSearch] = useState(false)

  console.log('Clientes page loaded')

  // Handle CNPJ data found
  const handleCNPJDataFound = (data: any) => {
    console.log('CNPJ data found for login:', data)
    setLoginData(prev => ({
      ...prev,
      cnpj: data.cnpj
    }))
    setShowCNPJSearch(false)
  }

  // Handle CNPJ input change
  const handleCNPJInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value)
    setLoginData(prev => ({
      ...prev,
      cnpj: formatted
    }))
  }

  // Simulação de autenticação
  const handleLogin = () => {
    console.log('Client login attempt:', loginData)
    setLoginError('')
    
    const cliente = mockClientes.find(c => c.cnpj === loginData.cnpj)
    if (cliente && loginData.password === '123456') {
      setCurrentCliente(cliente)
      setIsAuthenticated(true)
      localStorage.setItem('client_auth', JSON.stringify(cliente))
    } else {
      setLoginError('CNPJ ou senha incorretos')
    }
  }

  // Verificar autenticação salva
  useEffect(() => {
    const savedAuth = localStorage.getItem('client_auth')
    if (savedAuth) {
      try {
        const cliente = JSON.parse(savedAuth)
        setCurrentCliente(cliente)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error loading client auth:', error)
      }
    }
  }, [])

  // Logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentCliente(null)
    localStorage.removeItem('client_auth')
  }

  // Filtrar documentos
  const filteredDocumentos = documentos.filter(doc => {
    if (!currentCliente || doc.clienteId !== currentCliente.id) return false
    
    const matchesSearch = doc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoriaFilter === 'all' || doc.categoria === categoriaFilter
    
    return matchesSearch && matchesCategory
  })

  // Estatísticas
  const getStats = () => {
    if (!currentCliente) return { total: 0, recentes: 0, confidenciais: 0 }
    
    const clienteDocs = documentos.filter(d => d.clienteId === currentCliente.id)
    const recentes = clienteDocs.filter(d => {
      const diffDays = Math.abs(new Date().getTime() - d.dataUpload.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays <= 7
    }).length
    const confidenciais = clienteDocs.filter(d => d.confidencial).length
    
    return {
      total: clienteDocs.length,
      recentes,
      confidenciais,
    }
  }

  // Download documento
  const handleDownload = (documento: Documento) => {
    console.log('Downloading document:', documento.nome)
    // Simular download
    const blob = new Blob(['Conteúdo do documento'], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = documento.nome
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Marcar notificação como lida
  const markAsRead = (notificacaoId: string) => {
    setNotificacoes(prev => prev.map(n => 
      n.id === notificacaoId ? { ...n, lida: true } : n
    ))
  }

  const stats = getStats()
  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida && n.clienteId === currentCliente?.id).length

  // Tela de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="shadow-2xl bg-white/95 backdrop-blur-sm border-0">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-8">
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <img 
                    src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/byzxsjjbah9d1487icuwfc7y/sTuQmgVPSl8WwCSW-LJke/image.png" 
                    alt="AG Assessoria Logo" 
                    className="h-20 w-auto object-contain"
                    data-macaly="client-portal-logo"
                  />
                </div>
              </div>
              <div className="text-center">
                <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
                  AG ASSESSORIA
                </CardTitle>
                <CardDescription className="text-slate-700 font-semibold text-lg" data-macaly="client-portal-subtitle">
                  SISTEMA DE CONTROLE CONTÁBIL
                </CardDescription>
                <CardDescription className="text-slate-600 mt-2">
                  Acesse seus documentos de forma segura
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {!showCNPJSearch ? (
                <div className="space-y-2">
                  <Label htmlFor="cnpj" className="text-gray-700 font-medium">CNPJ</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="cnpj"
                      type="text"
                      value={loginData.cnpj}
                      onChange={handleCNPJInputChange}
                      placeholder="00.000.000/0000-00"
                      className="border-gray-300 focus:border-blue-500"
                      maxLength={18}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCNPJSearch(true)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Clique no ícone de busca para preenchimento automático
                  </p>
                </div>
              ) : (
                <CNPJSearch
                  onDataFound={handleCNPJDataFound}
                  onClear={() => setShowCNPJSearch(false)}
                  initialCNPJ={loginData.cnpj}
                  autoSearch={true}
                  showDetails={true}
                />
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Digite sua senha"
                  className="border-gray-300 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              
              {loginError && (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!loginData.cnpj || !loginData.password}
              >
                Acessar Portal
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Precisa de ajuda? Entre em contato conosco
                </p>
                <div className="flex justify-center gap-4 mt-2">
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    <Phone className="w-4 h-4 mr-1" />
                    Telefone
                  </Button>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </Button>
                </div>
              </div>
              
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Desenvolvimento por <span className="font-semibold text-gray-700">AG ASSESSORIA CONTÁBIL</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Portal do cliente autenticado
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <img 
                    src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/byzxsjjbah9d1487icuwfc7y/sTuQmgVPSl8WwCSW-LJke/image.png" 
                    alt="AG Assessoria Logo" 
                    className="h-8 w-auto object-contain"
                    data-macaly="client-header-logo"
                  />
                </div>
                <div className="text-sm text-slate-600 font-medium">
                  <span className="font-bold">AG ASSESSORIA</span><br />
                  <span className="text-xs">SISTEMA DE CONTROLE CONTÁBIL</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={currentCliente?.avatar} />
                  <AvatarFallback>{currentCliente?.nome.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{currentCliente?.nome}</h1>
                  <p className="text-gray-600">{currentCliente?.cnpj}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={planoConfig[currentCliente?.plano || 'basico'].color}>
              {planoConfig[currentCliente?.plano || 'basico'].label}
            </Badge>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <Lock className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Documentos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Documentos Recentes</p>
                  <p className="text-2xl font-bold text-green-600">{stats.recentes}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Confidenciais</p>
                  <p className="text-2xl font-bold text-red-600">{stats.confidenciais}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-full">
                  <Shield className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Notificações</p>
                  <p className="text-2xl font-bold text-orange-600">{notificacoesNaoLidas}</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-full">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="documentos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documentos">Meus Documentos</TabsTrigger>
            <TabsTrigger value="responsaveis">
              <Users className="w-4 h-4 mr-2" />
              Responsáveis
            </TabsTrigger>
            <TabsTrigger value="notificacoes">
              Notificações
              {notificacoesNaoLidas > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {notificacoesNaoLidas}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documentos" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Buscar documentos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filtrar por categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {Object.entries(categoriaConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocumentos.map((documento) => {
                const categoriaInfo = categoriaConfig[documento.categoria]
                const CategoriaIcon = categoriaInfo.icon
                
                return (
                  <Card key={documento.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CategoriaIcon className="w-5 h-5 text-blue-600" />
                          <Badge className={categoriaInfo.color}>
                            {categoriaInfo.label}
                          </Badge>
                        </div>
                        {documento.confidencial && (
                          <Shield className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <CardTitle className="text-lg">{documento.nome}</CardTitle>
                      <CardDescription>{documento.descricao}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Tipo: {documento.tipo}</span>
                          <span>Tamanho: {documento.tamanho}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Enviado em: {documento.dataUpload.toLocaleDateString('pt-BR')}</span>
                          <Badge variant={documento.status === 'disponivel' ? 'default' : 'secondary'}>
                            {documento.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="flex-1">
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{documento.nome}</DialogTitle>
                                <DialogDescription>{documento.descricao}</DialogDescription>
                              </DialogHeader>
                              <div className="text-center py-8">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-500">Preview não disponível</p>
                                <p className="text-sm text-gray-400">Use o botão "Baixar" para acessar o arquivo</p>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            size="sm" 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleDownload(documento)}
                            disabled={documento.status !== 'disponivel'}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {filteredDocumentos.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Nenhum documento encontrado</p>
                  <p className="text-sm text-gray-400">Tente ajustar os filtros ou aguarde novos uploads</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="responsaveis" className="space-y-4">
            {currentCliente && (
              <ResponsaveisManager 
                clienteId={currentCliente.id}
                clienteNome={currentCliente.nome}
              />
            )}
          </TabsContent>

          <TabsContent value="notificacoes" className="space-y-4">
            <div className="space-y-4">
              {notificacoes.filter(n => n.clienteId === currentCliente?.id).map((notificacao) => (
                <Card key={notificacao.id} className={`${!notificacao.lida ? 'border-blue-200 bg-blue-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{notificacao.titulo}</h4>
                          {!notificacao.lida && (
                            <Badge variant="default" className="text-xs">
                              Nova
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{notificacao.mensagem}</p>
                        <p className="text-sm text-gray-500">
                          {notificacao.dataEnvio.toLocaleDateString('pt-BR')} às {notificacao.dataEnvio.toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                      {!notificacao.lida && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notificacao.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}