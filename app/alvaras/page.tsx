"use client"

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Plus, 
  Search,
  Shield,
  Flame,
  Building,
  Eye,
  Edit,
  Trash2,
  Download,
  LogOut,
  Lock,
  User,
  Home,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface Alvara {
  id: string
  nomeEmpresa: string
  cnpj: string
  endereco: string
  tipoAlvara: string
  atividade: string
  responsavel: string
  dataSubmissao: Date
  dataVencimento: Date
  status: 'pendente' | 'em_analise' | 'aprovado' | 'rejeitado'
  observacoes: string
  numeroProtocolo: string
  valorTaxa: number
  urgencia: 'baixa' | 'media' | 'alta'
  anotacoes: string
  anexos: string[]
}

const VALID_CREDENTIALS = {
  email: 'agassessoriacontrole@gmail.com',
  password: 'Fx21701313@@##'
}

export default function SistemaAlvaras() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [alvaras, setAlvaras] = useState<Alvara[]>([])
  const [filteredAlvaras, setFilteredAlvaras] = useState<Alvara[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('todas')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedAlvara, setSelectedAlvara] = useState<Alvara | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Login state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  // Form state
  const [formData, setFormData] = useState({
    nomeEmpresa: '',
    cnpj: '',
    endereco: '',
    tipoAlvara: '',
    atividade: '',
    responsavel: '',
    dataVencimento: '',
    observacoes: '',
    numeroProtocolo: '',
    valorTaxa: '',
    urgencia: 'media',
    anotacoes: ''
  })

  // Authentication check
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth_token')
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true)
    }
  }, [])

  // Load alvarás
  useEffect(() => {
    if (isAuthenticated) {
      loadAlvaras()
    }
  }, [isAuthenticated])

  // Filter alvarás
  useEffect(() => {
    let filtered = alvaras

    if (searchTerm) {
      filtered = filtered.filter(alvara =>
        alvara.nomeEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alvara.cnpj.includes(searchTerm) ||
        alvara.numeroProtocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alvara.tipoAlvara.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'todos') {
      filtered = filtered.filter(alvara => alvara.status === statusFilter)
    }

    if (urgencyFilter !== 'todas') {
      filtered = filtered.filter(alvara => alvara.urgencia === urgencyFilter)
    }

    setFilteredAlvaras(filtered)
  }, [alvaras, searchTerm, statusFilter, urgencyFilter])

  const loadAlvaras = useCallback(() => {
    console.log('Loading alvarás...')
    setIsLoading(true)
    
    const saved = localStorage.getItem('alvaras')
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((alvara: any) => ({
          ...alvara,
          dataSubmissao: new Date(alvara.dataSubmissao),
          dataVencimento: new Date(alvara.dataVencimento)
        }))
        setAlvaras(parsed)
      } catch (error) {
        console.error('Error loading alvarás:', error)
      }
    } else {
      // Sample data
      const sampleAlvaras: Alvara[] = [
        {
          id: '1',
          nomeEmpresa: 'Restaurante Sabor Mineiro Ltda',
          cnpj: '12.345.678/0001-90',
          endereco: 'Rua das Flores, 123 - Centro',
          tipoAlvara: 'Funcionamento',
          atividade: 'Restaurante',
          responsavel: 'João Silva',
          dataSubmissao: new Date('2024-01-15'),
          dataVencimento: new Date('2024-07-15'),
          status: 'aprovado',
          observacoes: 'Documentação completa',
          numeroProtocolo: 'ALV-2024-001',
          valorTaxa: 350.00,
          urgencia: 'baixa',
          anotacoes: 'Cliente regular',
          anexos: ['contrato_social.pdf', 'cnpj.pdf']
        },
        {
          id: '2',
          nomeEmpresa: 'Farmácia Central Ltda',
          cnpj: '98.765.432/0001-10',
          endereco: 'Av. Principal, 456 - Centro',
          tipoAlvara: 'Sanitário',
          atividade: 'Farmácia',
          responsavel: 'Maria Santos',
          dataSubmissao: new Date('2024-02-10'),
          dataVencimento: new Date('2024-08-10'),
          status: 'pendente',
          observacoes: 'Aguardando vistoria',
          numeroProtocolo: 'ALV-2024-002',
          valorTaxa: 500.00,
          urgencia: 'alta',
          anotacoes: 'Precisa de acompanhamento',
          anexos: ['licenca_anvisa.pdf']
        },
        {
          id: '3',
          nomeEmpresa: 'Hotel Estrela Ltda',
          cnpj: '11.222.333/0001-44',
          endereco: 'Praça Central, 789 - Centro',
          tipoAlvara: 'Funcionamento',
          atividade: 'Hotel',
          responsavel: 'Carlos Oliveira',
          dataSubmissao: new Date('2024-03-05'),
          dataVencimento: new Date('2024-09-05'),
          status: 'em_analise',
          observacoes: 'Em análise pela prefeitura',
          numeroProtocolo: 'ALV-2024-003',
          valorTaxa: 750.00,
          urgencia: 'media',
          anotacoes: 'Documentação OK',
          anexos: ['planta_baixa.pdf', 'avcb.pdf']
        }
      ]
      setAlvaras(sampleAlvaras)
    }
    
    setIsLoading(false)
  }, [])

  // Save alvarás
  useEffect(() => {
    if (alvaras.length > 0 && isAuthenticated) {
      localStorage.setItem('alvaras', JSON.stringify(alvaras))
    }
  }, [alvaras, isAuthenticated])

  // Login handler
  const handleLogin = useCallback(() => {
    console.log('Login attempt:', loginData)
    setLoginError('')
    
    if (loginData.email === VALID_CREDENTIALS.email && loginData.password === VALID_CREDENTIALS.password) {
      setIsAuthenticated(true)
      localStorage.setItem('auth_token', 'authenticated')
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao sistema de alvarás.",
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
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema.",
    })
  }, [toast])

  // Add alvará handler
  const handleAddAlvara = useCallback(() => {
    console.log('Adding alvará:', formData)
    
    const novoAlvara: Alvara = {
      id: Date.now().toString(),
      nomeEmpresa: formData.nomeEmpresa,
      cnpj: formData.cnpj,
      endereco: formData.endereco,
      tipoAlvara: formData.tipoAlvara,
      atividade: formData.atividade,
      responsavel: formData.responsavel,
      dataSubmissao: new Date(),
      dataVencimento: new Date(formData.dataVencimento),
      status: 'pendente',
      observacoes: formData.observacoes,
      numeroProtocolo: `ALV-${new Date().getFullYear()}-${String(alvaras.length + 1).padStart(3, '0')}`,
      valorTaxa: parseFloat(formData.valorTaxa) || 0,
      urgencia: formData.urgencia as 'baixa' | 'media' | 'alta',
      anotacoes: formData.anotacoes,
      anexos: []
    }
    
    setAlvaras(prev => [...prev, novoAlvara])
    setFormData({
      nomeEmpresa: '',
      cnpj: '',
      endereco: '',
      tipoAlvara: '',
      atividade: '',
      responsavel: '',
      dataVencimento: '',
      observacoes: '',
      numeroProtocolo: '',
      valorTaxa: '',
      urgencia: 'media',
      anotacoes: ''
    })
    setShowAddDialog(false)
    
    toast({
      title: "Alvará adicionado com sucesso!",
      description: `Protocolo: ${novoAlvara.numeroProtocolo}`,
    })
  }, [formData, alvaras, toast])

  // Edit alvará handler
  const handleEditAlvara = useCallback(() => {
    if (!selectedAlvara) return
    
    console.log('Editing alvará:', selectedAlvara.id, formData)
    
    const updatedAlvara: Alvara = {
      ...selectedAlvara,
      nomeEmpresa: formData.nomeEmpresa,
      cnpj: formData.cnpj,
      endereco: formData.endereco,
      tipoAlvara: formData.tipoAlvara,
      atividade: formData.atividade,
      responsavel: formData.responsavel,
      dataVencimento: new Date(formData.dataVencimento),
      observacoes: formData.observacoes,
      valorTaxa: parseFloat(formData.valorTaxa) || 0,
      urgencia: formData.urgencia as 'baixa' | 'media' | 'alta',
      anotacoes: formData.anotacoes
    }
    
    setAlvaras(prev => prev.map(alvara => 
      alvara.id === selectedAlvara.id ? updatedAlvara : alvara
    ))
    
    setShowEditDialog(false)
    setSelectedAlvara(null)
    
    toast({
      title: "Alvará atualizado com sucesso!",
      description: `Protocolo: ${updatedAlvara.numeroProtocolo}`,
    })
  }, [selectedAlvara, formData, toast])

  // Delete alvará handler
  const handleDeleteAlvara = useCallback((id: string) => {
    const alvara = alvaras.find(a => a.id === id)
    setAlvaras(prev => prev.filter(a => a.id !== id))
    
    toast({
      title: "Alvará removido",
      description: `Protocolo ${alvara?.numeroProtocolo} foi removido.`,
    })
  }, [alvaras, toast])

  // View alvará handler
  const handleViewAlvara = useCallback((alvara: Alvara) => {
    setSelectedAlvara(alvara)
    setShowViewDialog(true)
  }, [])

  // Edit alvará handler
  const handleEditDialogOpen = useCallback((alvara: Alvara) => {
    setSelectedAlvara(alvara)
    setFormData({
      nomeEmpresa: alvara.nomeEmpresa,
      cnpj: alvara.cnpj,
      endereco: alvara.endereco,
      tipoAlvara: alvara.tipoAlvara,
      atividade: alvara.atividade,
      responsavel: alvara.responsavel,
      dataVencimento: format(alvara.dataVencimento, 'yyyy-MM-dd'),
      observacoes: alvara.observacoes,
      numeroProtocolo: alvara.numeroProtocolo,
      valorTaxa: alvara.valorTaxa.toString(),
      urgencia: alvara.urgencia,
      anotacoes: alvara.anotacoes
    })
    setShowEditDialog(true)
  }, [])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800'
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'em_analise': return 'bg-blue-100 text-blue-800'
      case 'rejeitado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get urgency color
  const getUrgencyColor = (urgencia: string) => {
    switch (urgencia) {
      case 'alta': return 'bg-red-100 text-red-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'baixa': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprovado': return 'Aprovado'
      case 'pendente': return 'Pendente'
      case 'em_analise': return 'Em Análise'
      case 'rejeitado': return 'Rejeitado'
      default: return 'Desconhecido'
    }
  }

  // Get urgency label
  const getUrgencyLabel = (urgencia: string) => {
    switch (urgencia) {
      case 'alta': return 'Alta'
      case 'media': return 'Média'
      case 'baixa': return 'Baixa'
      default: return 'Desconhecida'
    }
  }

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
                <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
                  AG ASSESSORIA
                </CardTitle>
                <CardDescription className="text-slate-700 font-semibold text-lg">
                  SISTEMA DE ALVARÁS
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
                  <p className="text-sm text-slate-600 font-medium">SISTEMA DE ALVARÁS</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button 
                  variant="outline"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 font-medium px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Alvará
              </Button>
              
              <Button 
                onClick={loadAlvaras}
                variant="outline"
                className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-500 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Carregando...' : 'Atualizar'}
              </Button>
              
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
        
        {/* Filters */}
        <Card className="mb-6 bg-white shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-blue-700 font-bold text-lg">Filtros e Pesquisa</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search" className="text-slate-700 font-medium">Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Empresa, CNPJ ou protocolo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status-filter" className="text-slate-700 font-medium">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_analise">Em Análise</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="urgency-filter" className="text-slate-700 font-medium">Urgência</Label>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Selecione a urgência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Urgências</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 font-medium rounded-lg transition-colors duration-200"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('todos')
                    setUrgencyFilter('todas')
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total de Alvarás</p>
                  <p className="text-3xl font-bold text-slate-800">{alvaras.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Aprovados</p>
                  <p className="text-3xl font-bold text-slate-800">
                    {alvaras.filter(a => a.status === 'aprovado').length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Pendentes</p>
                  <p className="text-3xl font-bold text-slate-800">
                    {alvaras.filter(a => a.status === 'pendente').length}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Urgente</p>
                  <p className="text-3xl font-bold text-slate-800">
                    {alvaras.filter(a => a.urgencia === 'alta').length}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alvarás List */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-blue-700 font-bold text-lg">Alvarás ({filteredAlvaras.length})</CardTitle>
            <CardDescription className="text-slate-600">
              Gerenciamento de alvarás e licenças
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {filteredAlvaras.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-slate-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Building className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-slate-500 text-lg">Nenhum alvará encontrado</p>
                <p className="text-slate-400 text-sm mt-2">
                  {searchTerm || statusFilter !== 'todos' || urgencyFilter !== 'todas'
                    ? 'Tente ajustar os filtros de pesquisa'
                    : 'Clique em "Novo Alvará" para começar'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredAlvaras.map((alvara) => (
                  <Card key={alvara.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="bg-blue-100 p-3 rounded-lg">
                            <Building className="w-6 h-6 text-blue-600" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-bold text-lg text-slate-800">{alvara.nomeEmpresa}</h3>
                              <Badge className={getStatusColor(alvara.status)}>
                                {getStatusLabel(alvara.status)}
                              </Badge>
                              <Badge className={getUrgencyColor(alvara.urgencia)}>
                                {getUrgencyLabel(alvara.urgencia)}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                              <div>
                                <p><strong>CNPJ:</strong> {alvara.cnpj}</p>
                                <p><strong>Tipo:</strong> {alvara.tipoAlvara}</p>
                                <p><strong>Atividade:</strong> {alvara.atividade}</p>
                              </div>
                              <div>
                                <p><strong>Protocolo:</strong> {alvara.numeroProtocolo}</p>
                                <p><strong>Responsável:</strong> {alvara.responsavel}</p>
                                <p><strong>Vencimento:</strong> {format(alvara.dataVencimento, 'dd/MM/yyyy')}</p>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                <span className="text-sm text-slate-500">
                                  Submetido em {format(alvara.dataSubmissao, 'dd/MM/yyyy')}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-slate-500">
                                  Taxa: R$ {alvara.valorTaxa.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 transition-colors duration-200"
                            onClick={() => handleViewAlvara(alvara)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-500 transition-colors duration-200"
                            onClick={() => handleEditDialogOpen(alvara)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500 transition-colors duration-200"
                            onClick={() => handleDeleteAlvara(alvara.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Alvará Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Alvará</DialogTitle>
            <DialogDescription>
              Adicione um novo alvará ao sistema
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nomeEmpresa">Nome da Empresa *</Label>
              <Input
                id="nomeEmpresa"
                value={formData.nomeEmpresa}
                onChange={(e) => setFormData(prev => ({ ...prev, nomeEmpresa: e.target.value }))}
                placeholder="Nome da empresa"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                placeholder="00.000.000/0000-00"
                className="border-slate-300"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                placeholder="Endereço completo"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="tipoAlvara">Tipo de Alvará *</Label>
              <Select 
                value={formData.tipoAlvara} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipoAlvara: value }))}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Funcionamento">Funcionamento</SelectItem>
                  <SelectItem value="Sanitário">Sanitário</SelectItem>
                  <SelectItem value="Bombeiros">Bombeiros</SelectItem>
                  <SelectItem value="Ambiental">Ambiental</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="atividade">Atividade *</Label>
              <Input
                id="atividade"
                value={formData.atividade}
                onChange={(e) => setFormData(prev => ({ ...prev, atividade: e.target.value }))}
                placeholder="Atividade principal"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="responsavel">Responsável *</Label>
              <Input
                id="responsavel"
                value={formData.responsavel}
                onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                placeholder="Nome do responsável"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
              <Input
                id="dataVencimento"
                type="date"
                value={formData.dataVencimento}
                onChange={(e) => setFormData(prev => ({ ...prev, dataVencimento: e.target.value }))}
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="valorTaxa">Valor da Taxa</Label>
              <Input
                id="valorTaxa"
                type="number"
                step="0.01"
                value={formData.valorTaxa}
                onChange={(e) => setFormData(prev => ({ ...prev, valorTaxa: e.target.value }))}
                placeholder="0.00"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="urgencia">Urgência</Label>
              <Select 
                value={formData.urgencia} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, urgencia: value }))}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecione a urgência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais"
                className="border-slate-300"
                rows={3}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="anotacoes">Anotações Internas</Label>
              <Textarea
                id="anotacoes"
                value={formData.anotacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, anotacoes: e.target.value }))}
                placeholder="Anotações para uso interno"
                className="border-slate-300"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddAlvara}
              disabled={!formData.nomeEmpresa || !formData.cnpj || !formData.endereco || !formData.tipoAlvara || !formData.atividade || !formData.responsavel || !formData.dataVencimento}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Adicionar Alvará
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Alvará Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Alvará</DialogTitle>
            <DialogDescription>
              Edite as informações do alvará
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-nomeEmpresa">Nome da Empresa *</Label>
              <Input
                id="edit-nomeEmpresa"
                value={formData.nomeEmpresa}
                onChange={(e) => setFormData(prev => ({ ...prev, nomeEmpresa: e.target.value }))}
                placeholder="Nome da empresa"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-cnpj">CNPJ *</Label>
              <Input
                id="edit-cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                placeholder="00.000.000/0000-00"
                className="border-slate-300"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="edit-endereco">Endereço *</Label>
              <Input
                id="edit-endereco"
                value={formData.endereco}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                placeholder="Endereço completo"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-tipoAlvara">Tipo de Alvará *</Label>
              <Select 
                value={formData.tipoAlvara} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipoAlvara: value }))}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Funcionamento">Funcionamento</SelectItem>
                  <SelectItem value="Sanitário">Sanitário</SelectItem>
                  <SelectItem value="Bombeiros">Bombeiros</SelectItem>
                  <SelectItem value="Ambiental">Ambiental</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-atividade">Atividade *</Label>
              <Input
                id="edit-atividade"
                value={formData.atividade}
                onChange={(e) => setFormData(prev => ({ ...prev, atividade: e.target.value }))}
                placeholder="Atividade principal"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-responsavel">Responsável *</Label>
              <Input
                id="edit-responsavel"
                value={formData.responsavel}
                onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                placeholder="Nome do responsável"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-dataVencimento">Data de Vencimento *</Label>
              <Input
                id="edit-dataVencimento"
                type="date"
                value={formData.dataVencimento}
                onChange={(e) => setFormData(prev => ({ ...prev, dataVencimento: e.target.value }))}
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-valorTaxa">Valor da Taxa</Label>
              <Input
                id="edit-valorTaxa"
                type="number"
                step="0.01"
                value={formData.valorTaxa}
                onChange={(e) => setFormData(prev => ({ ...prev, valorTaxa: e.target.value }))}
                placeholder="0.00"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-urgencia">Urgência</Label>
              <Select 
                value={formData.urgencia} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, urgencia: value }))}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecione a urgência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea
                id="edit-observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais"
                className="border-slate-300"
                rows={3}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="edit-anotacoes">Anotações Internas</Label>
              <Textarea
                id="edit-anotacoes"
                value={formData.anotacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, anotacoes: e.target.value }))}
                placeholder="Anotações para uso interno"
                className="border-slate-300"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditAlvara}
              disabled={!formData.nomeEmpresa || !formData.cnpj || !formData.endereco || !formData.tipoAlvara || !formData.atividade || !formData.responsavel || !formData.dataVencimento}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Alvará Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Visualizar Alvará</DialogTitle>
            <DialogDescription>
              Detalhes completos do alvará
            </DialogDescription>
          </DialogHeader>
          {selectedAlvara && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Nome da Empresa</Label>
                  <p className="text-slate-900 font-semibold">{selectedAlvara.nomeEmpresa}</p>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">CNPJ</Label>
                  <p className="text-slate-900">{selectedAlvara.cnpj}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-slate-700 font-medium">Endereço</Label>
                <p className="text-slate-900">{selectedAlvara.endereco}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Tipo de Alvará</Label>
                  <p className="text-slate-900">{selectedAlvara.tipoAlvara}</p>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">Atividade</Label>
                  <p className="text-slate-900">{selectedAlvara.atividade}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Responsável</Label>
                  <p className="text-slate-900">{selectedAlvara.responsavel}</p>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">Protocolo</Label>
                  <p className="text-slate-900 font-mono">{selectedAlvara.numeroProtocolo}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedAlvara.status)}>
                      {getStatusLabel(selectedAlvara.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">Urgência</Label>
                  <div className="mt-1">
                    <Badge className={getUrgencyColor(selectedAlvara.urgencia)}>
                      {getUrgencyLabel(selectedAlvara.urgencia)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">Valor da Taxa</Label>
                  <p className="text-slate-900 font-semibold">R$ {selectedAlvara.valorTaxa.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Data de Submissão</Label>
                  <p className="text-slate-900">{format(selectedAlvara.dataSubmissao, 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">Data de Vencimento</Label>
                  <p className="text-slate-900">{format(selectedAlvara.dataVencimento, 'dd/MM/yyyy')}</p>
                </div>
              </div>
              
              {selectedAlvara.observacoes && (
                <div>
                  <Label className="text-slate-700 font-medium">Observações</Label>
                  <p className="text-slate-900 bg-slate-50 p-3 rounded-md">{selectedAlvara.observacoes}</p>
                </div>
              )}
              
              {selectedAlvara.anotacoes && (
                <div>
                  <Label className="text-slate-700 font-medium">Anotações Internas</Label>
                  <p className="text-slate-900 bg-slate-50 p-3 rounded-md">{selectedAlvara.anotacoes}</p>
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
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    // Simular download
                    toast({
                      title: "Download iniciado",
                      description: `Download do alvará ${selectedAlvara.numeroProtocolo} iniciado.`,
                    })
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
    </div>
  )
}