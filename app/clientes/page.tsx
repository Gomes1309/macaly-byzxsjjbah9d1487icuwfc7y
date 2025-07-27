'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import Link from 'next/link'
import { useClientes, Cliente } from '@/hooks/useClientes'
import { CNPJSearch } from '@/components/CNPJSearch'
import { formatCNPJ } from '@/lib/cnpj-utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface ClienteForm {
  nome: string
  cpfCnpj: string
  tipoCliente: 'pessoa_fisica' | 'pessoa_juridica'
  email: string
  telefone: string
  endereco: string
  status: 'ativo' | 'inativo' | 'suspenso'
  observacoes: string
}

const initialClienteForm: ClienteForm = {
  nome: '',
  cpfCnpj: '',
  tipoCliente: 'pessoa_juridica',
  email: '',
  telefone: '',
  endereco: '',
  status: 'ativo',
  observacoes: ''
}

const statusConfig = {
  ativo: {
    label: 'Ativo',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  inativo: {
    label: 'Inativo',
    color: 'bg-gray-100 text-gray-800',
    icon: AlertCircle
  },
  suspenso: {
    label: 'Suspenso',
    color: 'bg-red-100 text-red-800',
    icon: AlertCircle
  }
} as const

export default function ClientesPage() {
  const { clientes, loading, error, addCliente, updateCliente, deleteCliente, refreshClientes, retryConnection } = useClientes()
  
  // Estados principais
  const [clienteForm, setClienteForm] = useState<ClienteForm>(initialClienteForm)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Estados de interface
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showCNPJSearch, setShowCNPJSearch] = useState(false)
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tipoFilter, setTipoFilter] = useState<string>('all')

  console.log('Gestão de Clientes carregada')

  // Handle CNPJ data found
  const handleCNPJDataFound = useCallback((data: any) => {
    console.log('CNPJ encontrado com dados completos:', data)
    setClienteForm(prev => ({
      ...prev,
      cpfCnpj: data.cnpj,
      nome: data.razaoSocial || '',
      endereco: data.logradouro && data.numero ? 
        `${data.logradouro}, ${data.numero} - ${data.bairro}` : '',
      email: data.email || '',
      telefone: data.telefone || ''
    }))
    setShowCNPJSearch(false)
    
    console.log(`Empresa encontrada: ${data.razaoSocial} - ${data.situacao}`)
    toast.success(`Empresa encontrada: ${data.razaoSocial}`)
  }, [])

  // Handle CNPJ input change
  const handleCNPJInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value)
    setClienteForm(prev => ({
      ...prev,
      cpfCnpj: formatted
    }))
  }, [])

  // Adicionar cliente
  const handleAddCliente = async () => {
    try {
      setIsLoading(true)
      console.log('Iniciando cadastro de cliente:', clienteForm)
      
      if (!clienteForm.nome || !clienteForm.cpfCnpj || !clienteForm.email) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }

      const clienteData = {
        ...clienteForm,
        dataCadastro: new Date(),
        totalDocumentos: 0,
        ultimaAtualizacao: new Date()
      }

      console.log('Dados do cliente preparados:', clienteData)
      
      const novoCliente = await addCliente(clienteData)
      console.log('Cliente criado:', novoCliente)

      toast.success('Cliente cadastrado com sucesso!')
      
      setShowAddDialog(false)
      setClienteForm(initialClienteForm)
      setShowCNPJSearch(false)
      
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`Erro ao cadastrar cliente: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Editar cliente
  const handleEditCliente = useCallback(async () => {
    if (!editingCliente) return
    
    console.log('Editando cliente:', editingCliente.id, clienteForm)
    setIsLoading(true)
    
    try {
      const dadosAtualizados = {
        nome: clienteForm.nome,
        email: clienteForm.email,
        cpfCnpj: clienteForm.cpfCnpj,
        telefone: clienteForm.telefone,
        endereco: clienteForm.endereco,
        tipoCliente: clienteForm.tipoCliente,
        status: clienteForm.status,
        observacoes: clienteForm.observacoes
      }
      
      const clienteAtualizado = await updateCliente(editingCliente.id, dadosAtualizados)
      
      setEditingCliente(null)
      setClienteForm(initialClienteForm)
      setShowEditDialog(false)
      
      toast.success(`Cliente ${clienteAtualizado.nome} atualizado com sucesso!`)
      
    } catch (error) {
      console.error('Erro ao editar cliente:', error)
      toast.error('Erro ao atualizar cliente. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }, [editingCliente, clienteForm, updateCliente])

  // Excluir cliente
  const handleDeleteCliente = useCallback(async () => {
    if (!selectedCliente) return
    
    console.log('Excluindo cliente:', selectedCliente.id)
    setIsLoading(true)
    
    try {
      await deleteCliente(selectedCliente.id)
      
      setShowDeleteDialog(false)
      setSelectedCliente(null)
      
      toast.success(`Cliente ${selectedCliente.nome} removido com sucesso!`)
      
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      toast.error('Erro ao remover cliente. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedCliente, deleteCliente])

  // Preparar edição
  const prepareEdit = useCallback((cliente: Cliente) => {
    console.log('Preparando edição do cliente:', cliente.nome)
    setEditingCliente(cliente)
    setClienteForm({
      nome: cliente.nome || '',
      cpfCnpj: cliente.cpfCnpj || '',
      tipoCliente: cliente.tipoCliente,
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      endereco: cliente.endereco || '',
      status: cliente.status,
      observacoes: cliente.observacoes || ''
    })
    setShowEditDialog(true)
  }, [])

  // Filtrar clientes
  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = 
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.cpfCnpj.includes(searchTerm) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || cliente.status === statusFilter
    const matchesTipo = tipoFilter === 'all' || cliente.tipoCliente === tipoFilter
    
    return matchesSearch && matchesStatus && matchesTipo
  })

  // Estatísticas
  const stats = {
    total: clientes.length,
    ativos: clientes.filter(c => c.status === 'ativo').length,
    inativos: clientes.filter(c => c.status === 'inativo').length,
    suspensos: clientes.filter(c => c.status === 'suspenso').length,
    novosUltimos30Dias: clientes.filter(c => {
      const diffDays = Math.abs(new Date().getTime() - c.dataCadastro.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays <= 30
    }).length,
    pessoaJuridica: clientes.filter(c => c.tipoCliente === 'pessoa_juridica').length,
    pessoaFisica: clientes.filter(c => c.tipoCliente === 'pessoa_fisica').length
  }

  // Gerar relatório do cliente
  const generateClientReport = useCallback((cliente: Cliente) => {
    console.log('Gerando relatório para:', cliente.nome)
    
    const reportDate = new Date().toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    const reportContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Cliente - ${cliente.nome}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { color: #2563eb; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .report-title { color: #1e40af; font-size: 20px; margin: 10px 0; }
        .report-info { background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin: 25px 0; }
        .section-title { color: #1e40af; font-size: 16px; font-weight: bold; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .info-item { margin-bottom: 10px; }
        .info-label { font-weight: bold; color: #4b5563; }
        .info-value { color: #111827; margin-left: 10px; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .status-ativo { background-color: #dcfce7; color: #166534; }
        .status-inativo { background-color: #f3f4f6; color: #374151; }
        .status-suspenso { background-color: #fecaca; color: #991b1b; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">AG ASSESSORIA CONTÁBIL</div>
        <div class="report-title">RELATÓRIO DE CLIENTE</div>
        <div class="report-info">
            <strong>Data de Geração:</strong> ${reportDate}<br>
            <strong>Responsável:</strong> Sistema AG Assessoria
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">INFORMAÇÕES BÁSICAS</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Nome/Razão Social:</span>
                <span class="info-value">${cliente.nome}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Documento:</span>
                <span class="info-value">${cliente.cpfCnpj}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Tipo:</span>
                <span class="info-value">${cliente.tipoCliente === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Status:</span>
                <span class="status-badge status-${cliente.status}">${cliente.status.toUpperCase()}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Data de Cadastro:</span>
                <span class="info-value">${cliente.dataCadastro.toLocaleDateString('pt-BR')}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">CONTATO</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Email Principal:</span>
                <span class="info-value">${cliente.email}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Telefone:</span>
                <span class="info-value">${cliente.telefone || 'Não informado'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Endereço:</span>
                <span class="info-value">${cliente.endereco || 'Não informado'}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">OBSERVAÇÕES</h2>
        <div class="info-item">
            <p>${cliente.observacoes || 'Nenhuma observação cadastrada.'}</p>
        </div>
    </div>

    <div class="footer">
        <p><strong>AG Assessoria Contábil</strong></p>
        <p>Email: agassessoriacontrole@gmail.com | Telefone: (16) 3987-3829</p>
        <p>Este relatório foi gerado automaticamente pelo sistema de gestão de clientes.</p>
    </div>
</body>
</html>
    `
    
    // Criar e baixar o arquivo
    const blob = new Blob([reportContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio_cliente_${cliente.nome.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success(`Relatório de ${cliente.nome} foi baixado.`)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h1>
                  <p className="text-base text-gray-600">Administre sua carteira de clientes</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={() => refreshClientes()} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <div className="flex justify-between items-center w-full">
              <div>
                <AlertDescription className="text-orange-800">
                  <strong>Atenção:</strong> {error}
                </AlertDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retryConnection}
                  disabled={loading}
                  className="text-orange-700 border-orange-300 hover:bg-orange-100"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Reconectando...' : 'Tentar Novamente'}
                </Button>
              </div>
            </div>
          </Alert>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-xs text-green-600 mt-1">
                    +{stats.novosUltimos30Dias} últimos 30 dias
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
                  <p className="text-3xl font-bold text-green-600">{stats.ativos}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.total > 0 ? Math.round((stats.ativos / stats.total) * 100) : 0}% do total
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pessoa Jurídica</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.pessoaJuridica}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {stats.total > 0 ? Math.round((stats.pessoaJuridica / stats.total) * 100) : 0}% do total
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pessoa Física</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pessoaFisica}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    {stats.total > 0 ? Math.round((stats.pessoaFisica / stats.total) * 100) : 0}% do total
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, CNPJ/CPF ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                    <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content - Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClientes.map((cliente) => {
            const statusInfo = statusConfig[cliente.status]
            const StatusIcon = statusInfo.icon
            
            return (
              <Card key={cliente.id} className="bg-white hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {cliente.nome ? cliente.nome.split(' ').map(n => n[0]).join('').substring(0, 2) : 'CL'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg font-semibold">{cliente.nome}</CardTitle>
                        <CardDescription className="text-sm">
                          {cliente.tipoCliente === 'pessoa_juridica' ? cliente.cpfCnpj : `CPF: ${cliente.cpfCnpj}`}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedCliente(cliente)
                          setShowDetailDialog(true)
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => prepareEdit(cliente)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => generateClientReport(cliente)}>
                          <FileText className="w-4 h-4 mr-2" />
                          Gerar Relatório
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedCliente(cliente)
                            setShowDeleteDialog(true)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StatusIcon className="w-4 h-4" />
                      <Badge className={statusInfo.color}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <Badge variant="outline">
                      {cliente.tipoCliente === 'pessoa_fisica' ? 'PF' : 'PJ'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{cliente.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{cliente.telefone || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{cliente.dataCadastro.toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredClientes.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente encontrado</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || tipoFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Adicione seu primeiro cliente para começar'}
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Cliente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialog - Adicionar Cliente */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha as informações do cliente para cadastrá-lo no sistema
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 gap-6 py-4">
              {/* Busca CNPJ */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h4 className="font-semibold text-blue-900 text-lg">🔍 Buscar Empresa por CNPJ</h4>
                      <p className="text-blue-700 text-sm">Digite o CNPJ para preencher automaticamente os dados da Receita Federal</p>
                    </div>

                    <div>
                      <Label htmlFor="tipoCliente" className="text-blue-900 font-medium">Tipo de Cliente *</Label>
                      <Select 
                        value={clienteForm.tipoCliente} 
                        onValueChange={(value: 'pessoa_fisica' | 'pessoa_juridica') => 
                          setClienteForm(prev => ({ ...prev, tipoCliente: value }))
                        }
                      >
                        <SelectTrigger className="border-blue-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                          <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="cpfCnpj" className="text-blue-900 font-medium">
                        {clienteForm.tipoCliente === 'pessoa_fisica' ? 'CPF *' : 'CNPJ *'}
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="cpfCnpj"
                          value={clienteForm.cpfCnpj}
                          onChange={handleCNPJInputChange}
                          placeholder={clienteForm.tipoCliente === 'pessoa_fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                          className="flex-1 border-blue-300 focus:border-blue-500"
                        />
                        {clienteForm.tipoCliente === 'pessoa_juridica' && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (clienteForm.cpfCnpj.length >= 14) {
                                setShowCNPJSearch(true)
                              } else {
                                toast.error('Digite o CNPJ completo para buscar dados automaticamente.')
                              }
                            }}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        💡 {clienteForm.tipoCliente === 'pessoa_fisica' ? 
                          'Digite o CPF para validação' : 
                          'Digite o CNPJ completo e clique na lupa para buscar dados automaticamente'}
                      </p>
                    </div>

                    {showCNPJSearch && (
                      <div className="border-t border-blue-200 pt-4">
                        <CNPJSearch
                          onDataFound={handleCNPJDataFound}
                          onClear={() => setShowCNPJSearch(false)}
                          initialCNPJ={clienteForm.cpfCnpj}
                          autoSearch={true}
                          showDetails={true}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Informações Básicas</h4>
                  
                  <div>
                    <Label htmlFor="nome">
                      {clienteForm.tipoCliente === 'pessoa_fisica' ? 'Nome Completo' : 'Razão Social'} *
                    </Label>
                    <Input
                      id="nome"
                      value={clienteForm.nome}
                      onChange={(e) => setClienteForm(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder={clienteForm.tipoCliente === 'pessoa_fisica' ? 'João Silva' : 'Empresa Ltda'}
                    />
                  </div>
                </div>
                
                {/* Contato */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Contato</h4>
                  
                  <div>
                    <Label htmlFor="email">Email Principal *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={clienteForm.email}
                      onChange={(e) => setClienteForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="telefone">Telefone Principal</Label>
                    <Input
                      id="telefone"
                      value={clienteForm.telefone}
                      onChange={(e) => setClienteForm(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                
                {/* Endereço */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Endereço</h4>
                  
                  <div>
                    <Label htmlFor="endereco">Endereço Completo</Label>
                    <Input
                      id="endereco"
                      value={clienteForm.endereco}
                      onChange={(e) => setClienteForm(prev => ({ ...prev, endereco: e.target.value }))}
                      placeholder="Rua, número - bairro"
                    />
                  </div>
                </div>
                
                {/* Configurações */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Configurações</h4>
                  
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select 
                      value={clienteForm.status} 
                      onValueChange={(value: 'ativo' | 'inativo' | 'suspenso') => 
                        setClienteForm(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="suspenso">Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Observações */}
                <div className="space-y-4 md:col-span-2">
                  <h4 className="font-medium text-gray-900">Observações</h4>
                  
                  <div>
                    <Label htmlFor="observacoes">Anotações Gerais</Label>
                    <Textarea
                      id="observacoes"
                      value={clienteForm.observacoes}
                      onChange={(e) => setClienteForm(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Informações adicionais sobre o cliente..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddDialog(false)
                  setClienteForm(initialClienteForm)
                  setShowCNPJSearch(false)
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddCliente}
                disabled={isLoading || !clienteForm.nome || !clienteForm.cpfCnpj || !clienteForm.email}
                className="bg-gradient-to-r from-blue-600 to-blue-700"
              >
                {isLoading ? 'Salvando...' : 'Salvar Cliente'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog - Editar Cliente */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>
                Atualize as informações do cliente
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div>
                <Label htmlFor="edit-nome">Nome/Razão Social *</Label>
                <Input
                  id="edit-nome"
                  value={clienteForm.nome}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={clienteForm.email}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input
                  id="edit-telefone"
                  value={clienteForm.telefone}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={clienteForm.status} 
                  onValueChange={(value: 'ativo' | 'inativo' | 'suspenso') => 
                    setClienteForm(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="edit-endereco">Endereço</Label>
                <Input
                  id="edit-endereco"
                  value={clienteForm.endereco}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, endereco: e.target.value }))}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="edit-observacoes">Observações</Label>
                <Textarea
                  id="edit-observacoes"
                  value={clienteForm.observacoes}
                  onChange={(e) => setClienteForm(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditDialog(false)
                  setEditingCliente(null)
                  setClienteForm(initialClienteForm)
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleEditCliente}
                disabled={isLoading || !clienteForm.nome || !clienteForm.email}
                className="bg-gradient-to-r from-blue-600 to-blue-700"
              >
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog - Excluir Cliente */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o cliente <strong>{selectedCliente?.nome}</strong>?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Atenção:</strong> Todos os dados do cliente serão removidos permanentemente.
              </AlertDescription>
            </Alert>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleDeleteCliente}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? 'Excluindo...' : 'Excluir Cliente'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog - Detalhes do Cliente */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Cliente</DialogTitle>
              <DialogDescription>
                Informações completas do cliente
              </DialogDescription>
            </DialogHeader>
            
            {selectedCliente && (
              <div className="space-y-6">
                {/* Header do Cliente */}
                <div className="flex items-start space-x-4 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                      {selectedCliente.nome ? selectedCliente.nome.split(' ').map(n => n[0]).join('').substring(0, 2) : 'CL'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{selectedCliente.nome}</h3>
                    <p className="text-gray-600">{selectedCliente.cpfCnpj}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <Badge className={statusConfig[selectedCliente.status].color}>
                        {statusConfig[selectedCliente.status].label}
                      </Badge>
                      <Badge variant="outline">
                        {selectedCliente.tipoCliente === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Informações em Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Contato</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{selectedCliente.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{selectedCliente.telefone || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Informações</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Cadastrado: {selectedCliente.dataCadastro.toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">Tipo: {selectedCliente.tipoCliente === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedCliente.endereco && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Endereço</h4>
                    <p className="text-sm text-gray-700">{selectedCliente.endereco}</p>
                  </div>
                )}

                {selectedCliente.observacoes && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Observações</h4>
                    <p className="text-sm text-gray-700">{selectedCliente.observacoes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

      </main>
    </div>
  )
}