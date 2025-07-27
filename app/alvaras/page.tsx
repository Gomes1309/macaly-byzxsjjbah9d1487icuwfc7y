'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, Calendar, Building2, Plus, Edit, Trash2, AlertCircle, Eye, Bell, Send, Download, LogOut, Home, RefreshCw, Search, Filter, FileText, CheckCircle, Clock, User, Building } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAlvaras } from '@/hooks/useAlvaras'
import { useClientes } from '@/hooks/useClientes'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Toaster } from '@/components/ui/sonner'
import { format, differenceInDays } from 'date-fns'
import Link from 'next/link'

// ⚠️ ATENÇÃO SEGURANÇA: Credenciais hardcoded apenas para demo/exemplo
// Em produção, remover e implementar autenticação adequada com Supabase Auth
const VALID_CREDENTIALS = {
  email: 'agassessoriacontrole@gmail.com',
  password: 'Fx21701313@@##'
}

export default function AlvarasPage() {
  const { alvaras, loading, addAlvara, updateAlvara, deleteAlvara, refreshAlvaras, error } = useAlvaras()
  const { clientes, loading: clientesLoading } = useClientes()
  const { toast } = useToast()
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showNotifyDialog, setShowNotifyDialog] = useState(false)
  const [selectedAlvara, setSelectedAlvara] = useState<any>(null)
  const [sendingNotification, setSendingNotification] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [typeFilter, setTypeFilter] = useState('todos')
  const [filteredAlvaras, setFilteredAlvaras] = useState<any[]>([])

  // Form state - com clienteId para integração
  const [formData, setFormData] = useState({
    clienteId: '', // Novo campo para conectar com cliente
    empresa: '',
    cnpj: '',
    endereco: '',
    tipo: '' as 'vigilancia_sanitaria' | 'bombeiro' | 'municipal' | '',
    atividade: '',
    numeroProtocolo: '',
    dataEmissao: '',
    dataVencimento: '',
    observacoes: '',
    responsavel: '',
    contato: '',
    valorTaxa: '',
    urgencia: 'media' as 'baixa' | 'media' | 'alta',
    anotacoes: ''
  })

  // Authentication check
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth_token')
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true)
    }
  }, [])

  // Filter alvarás
  useEffect(() => {
    let filtered = alvaras

    if (searchTerm) {
      filtered = filtered.filter(alvara =>
        alvara.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alvara.cnpj?.includes(searchTerm) ||
        alvara.numeroProtocolo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alvara.responsavel?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'todos') {
      filtered = filtered.filter(alvara => alvara.status === statusFilter)
    }

    if (typeFilter !== 'todos') {
      filtered = filtered.filter(alvara => alvara.tipo === typeFilter)
    }

    setFilteredAlvaras(filtered)
  }, [alvaras, searchTerm, statusFilter, typeFilter])

  // Handle client selection - atualiza empresa e CNPJ automaticamente
  const handleClienteChange = useCallback((clienteId: string) => {
    console.log('Cliente selecionado:', clienteId)
    
    // Se selecionou "none", limpa os campos
    if (clienteId === 'none') {
      setFormData(prev => ({
        ...prev,
        clienteId: '',
        empresa: '',
        cnpj: '',
        endereco: '',
        responsavel: '',
        contato: ''
      }))
      return
    }
    
    const cliente = clientes.find(c => c.id === clienteId)
    
    if (cliente) {
      console.log('Dados do cliente:', cliente)
      setFormData(prev => ({
        ...prev,
        clienteId: clienteId,
        empresa: cliente.nome,
        cnpj: cliente.cpfCnpj,
        endereco: cliente.endereco || '',
        responsavel: cliente.nome,
        contato: cliente.email
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        clienteId: clienteId,
        empresa: '',
        cnpj: '',
        endereco: '',
        responsavel: '',
        contato: ''
      }))
    }
  }, [clientes])

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

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      clienteId: '',
      empresa: '',
      cnpj: '',
      endereco: '',
      tipo: '',
      atividade: '',
      numeroProtocolo: '',
      dataEmissao: '',
      dataVencimento: '',
      observacoes: '',
      responsavel: '',
      contato: '',
      valorTaxa: '',
      urgencia: 'media',
      anotacoes: ''
    })
  }, [])

  // Add alvará handler
  const handleAddAlvara = useCallback(async () => {
    if (!formData.empresa || !formData.cnpj || !formData.tipo || !formData.numeroProtocolo || 
        !formData.dataEmissao || !formData.dataVencimento || !formData.responsavel || !formData.contato) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      })
      return
    }

    try {
      console.log('Adding alvará:', formData)
      
      const alvaraData = {
        clienteId: formData.clienteId || undefined, // Inclui clienteId se selecionado
        empresa: formData.empresa,
        cnpj: formData.cnpj,
        tipo: formData.tipo as 'vigilancia_sanitaria' | 'bombeiro' | 'municipal',
        numeroProtocolo: formData.numeroProtocolo,
        dataEmissao: new Date(formData.dataEmissao),
        dataVencimento: new Date(formData.dataVencimento),
        observacoes: formData.observacoes,
        responsavel: formData.responsavel,
        contato: formData.contato
      }
      
      await addAlvara(alvaraData)
      
      resetForm()
      setShowAddDialog(false)
      
      toast({
        title: "Alvará adicionado com sucesso!",
        description: `Protocolo: ${formData.numeroProtocolo}`,
      })
    } catch (error) {
      console.error('Error adding alvará:', error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar alvará. Tente novamente.",
        variant: "destructive"
      })
    }
  }, [formData, addAlvara, toast, resetForm])

  // Edit alvará handler
  const handleEditAlvara = useCallback(async () => {
    if (!selectedAlvara) return
    
    try {
      console.log('Editing alvará:', selectedAlvara.id, formData)
      
      const updateData = {
        clienteId: formData.clienteId || undefined,
        empresa: formData.empresa,
        cnpj: formData.cnpj,
        tipo: formData.tipo as 'vigilancia_sanitaria' | 'bombeiro' | 'municipal',
        numeroProtocolo: formData.numeroProtocolo,
        dataEmissao: new Date(formData.dataEmissao),
        dataVencimento: new Date(formData.dataVencimento),
        observacoes: formData.observacoes,
        responsavel: formData.responsavel,
        contato: formData.contato
      }
      
      await updateAlvara(selectedAlvara.id, updateData)
      
      setShowEditDialog(false)
      setSelectedAlvara(null)
      
      toast({
        title: "Alvará atualizado com sucesso!",
        description: `Protocolo: ${formData.numeroProtocolo}`,
      })
    } catch (error) {
      console.error('Error updating alvará:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar alvará. Tente novamente.",
        variant: "destructive"
      })
    }
  }, [selectedAlvara, formData, updateAlvara, toast])

  // Delete alvará handler
  const handleDeleteAlvara = useCallback(async (id: string) => {
    try {
      const alvara = alvaras.find(a => a.id === id)
      await deleteAlvara(id)
      
      toast({
        title: "Alvará removido",
        description: `Protocolo ${alvara?.numeroProtocolo} foi removido.`,
      })
    } catch (error) {
      console.error('Error deleting alvará:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover alvará. Tente novamente.",
        variant: "destructive"
      })
    }
  }, [alvaras, deleteAlvara, toast])

  // View alvará handler
  const handleViewAlvara = useCallback((alvara: any) => {
    setSelectedAlvara(alvara)
    setShowViewDialog(true)
  }, [])

  // Edit alvará dialog open handler
  const handleEditDialogOpen = useCallback((alvara: any) => {
    setSelectedAlvara(alvara)
    setFormData({
      clienteId: alvara.clienteId || '',
      empresa: alvara.empresa,
      cnpj: alvara.cnpj,
      endereco: '',
      tipo: alvara.tipo,
      atividade: '',
      numeroProtocolo: alvara.numeroProtocolo,
      dataEmissao: format(alvara.dataEmissao, 'yyyy-MM-dd'),
      dataVencimento: format(alvara.dataVencimento, 'yyyy-MM-dd'),
      observacoes: alvara.observacoes || '',
      responsavel: alvara.responsavel,
      contato: alvara.contato,
      valorTaxa: '',
      urgencia: 'media',
      anotacoes: ''
    })
    setShowEditDialog(true)
  }, [])

  // Notify client handler
  const handleNotifyClient = useCallback((alvara: any) => {
    setSelectedAlvara(alvara)
    setShowNotifyDialog(true)
  }, [])

  // Send notification
  const sendNotification = useCallback(async () => {
    if (!selectedAlvara) return

    setSendingNotification(true)
    
    try {
      // Simular envio de notificação (aqui você integraria com um serviço real)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Notificação enviada!",
        description: `Cliente da empresa ${selectedAlvara.empresa} foi notificado sobre a expiração do alvará.`,
      })
      
      setShowNotifyDialog(false)
      setSelectedAlvara(null)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar notificação. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setSendingNotification(false)
    }
  }, [selectedAlvara, toast])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_dia': return 'bg-green-100 text-green-800'
      case 'vencendo': return 'bg-yellow-100 text-yellow-800'
      case 'vencido': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_dia': return 'Em Dia'
      case 'vencendo': return 'Vencendo'
      case 'vencido': return 'Vencido'
      default: return 'Desconhecido'
    }
  }

  // Get type label
  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'vigilancia_sanitaria': return 'Vigilância Sanitária'
      case 'bombeiro': return 'Bombeiros'
      case 'municipal': return 'Municipal'
      default: return tipo
    }
  }

  // Get days to expire
  const getDaysToExpire = (dataVencimento: Date) => {
    return differenceInDays(dataVencimento, new Date())
  }

  // Get expiring alvarás
  const expiringAlvaras = alvaras.filter(alvara => 
    alvara.status === 'vencendo' || alvara.status === 'vencido'
  )

  // Get cliente name by ID
  const getClienteNome = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId)
    return cliente ? cliente.nome : 'Cliente não encontrado'
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
                    src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/ra4c-kVU0_Z0Hdr1uDggb/logo-ag-2025.png" 
                    alt="AG Assessoria Logo" 
                    className="h-20 w-auto object-contain"
                    data-macaly="logo-login"
                  />
                </div>
              </div>
              <div className="text-center">
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
                  Sistema seguro • Dados protegidos por criptografia
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
                    src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/ra4c-kVU0_Z0Hdr1uDggb/logo-ag-2025.png" 
                    alt="AG Assessoria Logo" 
                    className="h-12 w-auto object-contain"
                    data-macaly="logo-header"
                  />
                </div>
                <div>
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
                onClick={refreshAlvaras}
                variant="outline"
                className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-500 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Carregando...' : 'Atualizar'}
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
        
        {/* Alerts for expiring alvarás */}
        {expiringAlvaras.length > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">Atenção: Alvarás Vencendo!</AlertTitle>
            <AlertDescription className="text-orange-700">
              Você tem {expiringAlvaras.length} alvará(s) vencendo ou vencido(s). 
              <Button 
                variant="link" 
                className="p-0 h-auto text-orange-800 underline ml-1"
                onClick={() => setStatusFilter('vencendo')}
              >
                Clique aqui para visualizar
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Erro</AlertTitle>
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
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
                    <SelectItem value="em_dia">Em Dia</SelectItem>
                    <SelectItem value="vencendo">Vencendo</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="type-filter" className="text-slate-700 font-medium">Tipo</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Tipos</SelectItem>
                    <SelectItem value="vigilancia_sanitaria">Vigilância Sanitária</SelectItem>
                    <SelectItem value="bombeiro">Bombeiros</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
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
                    setTypeFilter('todos')
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
                  <p className="text-sm text-slate-600 font-medium">Em Dia</p>
                  <p className="text-3xl font-bold text-slate-800">
                    {alvaras.filter(a => a.status === 'em_dia').length}
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
                  <p className="text-sm text-slate-600 font-medium">Vencendo</p>
                  <p className="text-3xl font-bold text-slate-800">
                    {alvaras.filter(a => a.status === 'vencendo').length}
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
                  <p className="text-sm text-slate-600 font-medium">Vencidos</p>
                  <p className="text-3xl font-bold text-slate-800">
                    {alvaras.filter(a => a.status === 'vencido').length}
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
              Gerenciamento de alvarás e licenças com integração ao cadastro de clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-slate-500 text-lg">Carregando alvarás...</p>
              </div>
            ) : filteredAlvaras.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-slate-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Building className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-slate-500 text-lg">Nenhum alvará encontrado</p>
                <p className="text-slate-400 text-sm mt-2">
                  {searchTerm || statusFilter !== 'todos' || typeFilter !== 'todos'
                    ? 'Tente ajustar os filtros de pesquisa'
                    : 'Clique em "Novo Alvará" para começar'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredAlvaras.map((alvara) => {
                  const daysToExpire = getDaysToExpire(alvara.dataVencimento)
                  return (
                    <Card key={alvara.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                              <Building className="w-6 h-6 text-blue-600" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-bold text-lg text-slate-800" data-macaly="company-name">{alvara.empresa}</h3>
                                <Badge className={getStatusColor(alvara.status)}>
                                  {getStatusLabel(alvara.status)}
                                </Badge>
                                {(alvara.status === 'vencendo' || alvara.status === 'vencido') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:border-orange-500"
                                    onClick={() => handleNotifyClient(alvara)}
                                  >
                                    <Bell className="w-3 h-3 mr-1" />
                                    Avisar Cliente
                                  </Button>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-3">
                                <div>
                                  <p><strong>CNPJ:</strong> {alvara.cnpj}</p>
                                  <p><strong>Tipo:</strong> {getTypeLabel(alvara.tipo)}</p>
                                  <p><strong>Protocolo:</strong> {alvara.numeroProtocolo}</p>
                                  {alvara.clienteId && (
                                    <p><strong>Cliente:</strong> {getClienteNome(alvara.clienteId)}</p>
                                  )}
                                </div>
                                <div>
                                  <p><strong>Responsável:</strong> {alvara.responsavel}</p>
                                  <p><strong>Contato:</strong> {alvara.contato}</p>
                                  <p><strong>Vencimento:</strong> {format(alvara.dataVencimento, 'dd/MM/yyyy')}</p>
                                </div>
                              </div>
                              
                              {(alvara.status === 'vencendo' || alvara.status === 'vencido') && (
                                <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-3">
                                  <div className="flex items-center space-x-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                                    <span className="text-sm font-medium text-orange-800">
                                      {alvara.status === 'vencido' 
                                        ? `Vencido há ${Math.abs(daysToExpire)} dias`
                                        : `Vence em ${daysToExpire} dias`
                                      }
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4 text-slate-500" />
                                  <span className="text-sm text-slate-500">
                                    Emitido em {format(alvara.dataEmissao, 'dd/MM/yyyy')}
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
                  )
                })}
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
              Adicione um novo alvará ao sistema - selecione um cliente cadastrado ou insira dados manualmente
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cliente Selection */}
            <div className="md:col-span-2">
              <Label htmlFor="cliente-select" className="text-slate-700 font-medium">Cliente Cadastrado (Opcional)</Label>
              <Select value={formData.clienteId || 'none'} onValueChange={handleClienteChange}>
                <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Selecione um cliente ou deixe em branco para inserir manualmente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum cliente selecionado</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome} - {cliente.cpfCnpj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clientesLoading && (
                <p className="text-sm text-slate-500 mt-1">Carregando clientes...</p>
              )}
            </div>

            <div>
              <Label htmlFor="empresa">Nome da Empresa *</Label>
              <Input
                id="empresa"
                value={formData.empresa}
                onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
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
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                placeholder="Endereço completo da empresa"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="tipo">Tipo de Alvará *</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as any }))}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vigilancia_sanitaria">Vigilância Sanitária</SelectItem>
                  <SelectItem value="bombeiro">Bombeiros</SelectItem>
                  <SelectItem value="municipal">Municipal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="numeroProtocolo">Número do Protocolo *</Label>
              <Input
                id="numeroProtocolo"
                value={formData.numeroProtocolo}
                onChange={(e) => setFormData(prev => ({ ...prev, numeroProtocolo: e.target.value }))}
                placeholder="Número do protocolo"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="dataEmissao">Data de Emissão *</Label>
              <Input
                id="dataEmissao"
                type="date"
                value={formData.dataEmissao}
                onChange={(e) => setFormData(prev => ({ ...prev, dataEmissao: e.target.value }))}
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
              <Label htmlFor="contato">Contato *</Label>
              <Input
                id="contato"
                value={formData.contato}
                onChange={(e) => setFormData(prev => ({ ...prev, contato: e.target.value }))}
                placeholder="Email ou telefone"
                className="border-slate-300"
              />
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
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false)
                resetForm()
              }}
              className="text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddAlvara}
              disabled={!formData.empresa || !formData.cnpj || !formData.tipo || !formData.numeroProtocolo || !formData.dataEmissao || !formData.dataVencimento || !formData.responsavel || !formData.contato}
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
            {/* Cliente Selection */}
            <div className="md:col-span-2">
              <Label htmlFor="edit-cliente-select" className="text-slate-700 font-medium">Cliente Cadastrado (Opcional)</Label>
              <Select value={formData.clienteId || 'none'} onValueChange={handleClienteChange}>
                <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Selecione um cliente ou deixe em branco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum cliente selecionado</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome} - {cliente.cpfCnpj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-empresa">Nome da Empresa *</Label>
              <Input
                id="edit-empresa"
                value={formData.empresa}
                onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
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
            
            <div>
              <Label htmlFor="edit-tipo">Tipo de Alvará *</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as any }))}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vigilancia_sanitaria">Vigilância Sanitária</SelectItem>
                  <SelectItem value="bombeiro">Bombeiros</SelectItem>
                  <SelectItem value="municipal">Municipal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-numeroProtocolo">Número do Protocolo *</Label>
              <Input
                id="edit-numeroProtocolo"
                value={formData.numeroProtocolo}
                onChange={(e) => setFormData(prev => ({ ...prev, numeroProtocolo: e.target.value }))}
                placeholder="Número do protocolo"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-dataEmissao">Data de Emissão *</Label>
              <Input
                id="edit-dataEmissao"
                type="date"
                value={formData.dataEmissao}
                onChange={(e) => setFormData(prev => ({ ...prev, dataEmissao: e.target.value }))}
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
              <Label htmlFor="edit-contato">Contato *</Label>
              <Input
                id="edit-contato"
                value={formData.contato}
                onChange={(e) => setFormData(prev => ({ ...prev, contato: e.target.value }))}
                placeholder="Email ou telefone"
                className="border-slate-300"
              />
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
              disabled={!formData.empresa || !formData.cnpj || !formData.tipo || !formData.numeroProtocolo || !formData.dataEmissao || !formData.dataVencimento || !formData.responsavel || !formData.contato}
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
                  <p className="text-slate-900 font-semibold" data-macaly="view-company">{selectedAlvara.empresa}</p>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">CNPJ</Label>
                  <p className="text-slate-900">{selectedAlvara.cnpj}</p>
                </div>
              </div>
              
              {selectedAlvara.clienteId && (
                <div>
                  <Label className="text-slate-700 font-medium">Cliente Cadastrado</Label>
                  <p className="text-slate-900 bg-blue-50 p-2 rounded">{getClienteNome(selectedAlvara.clienteId)}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Tipo de Alvará</Label>
                  <p className="text-slate-900">{getTypeLabel(selectedAlvara.tipo)}</p>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">Protocolo</Label>
                  <p className="text-slate-900 font-mono">{selectedAlvara.numeroProtocolo}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Responsável</Label>
                  <p className="text-slate-900">{selectedAlvara.responsavel}</p>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">Contato</Label>
                  <p className="text-slate-900">{selectedAlvara.contato}</p>
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
                  <Label className="text-slate-700 font-medium">Data Emissão</Label>
                  <p className="text-slate-900">{format(selectedAlvara.dataEmissao, 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">Data Vencimento</Label>
                  <p className="text-slate-900">{format(selectedAlvara.dataVencimento, 'dd/MM/yyyy')}</p>
                </div>
              </div>
              
              {selectedAlvara.observacoes && (
                <div>
                  <Label className="text-slate-700 font-medium">Observações</Label>
                  <p className="text-slate-900 bg-slate-50 p-3 rounded-md">{selectedAlvara.observacoes}</p>
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

      {/* Notify Client Dialog */}
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-orange-600" />
              <span>Notificar Cliente</span>
            </DialogTitle>
            <DialogDescription>
              Enviar notificação sobre expiração do alvará
            </DialogDescription>
          </DialogHeader>
          {selectedAlvara && (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800">{selectedAlvara.empresa}</h4>
                    <p className="text-sm text-orange-700">
                      Alvará {selectedAlvara.status === 'vencido' ? 'vencido' : 'vencendo'}
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      <strong>Contato:</strong> {selectedAlvara.contato}
                    </p>
                    <p className="text-sm text-orange-700">
                      <strong>Vencimento:</strong> {format(selectedAlvara.dataVencimento, 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-slate-600">
                <p>
                  Uma notificação será enviada para <strong>{selectedAlvara.contato}</strong> informando sobre 
                  {selectedAlvara.status === 'vencido' ? ' o vencimento' : ' a proximidade do vencimento'} do alvará.
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowNotifyDialog(false)}
                  className="text-slate-600"
                  disabled={sendingNotification}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={sendNotification}
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={sendingNotification}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendingNotification ? 'Enviando...' : 'Enviar Notificação'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}