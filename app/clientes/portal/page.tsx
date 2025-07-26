'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import Link from 'next/link'
import { useClientes } from '@/hooks/useClientes'

import { 
  User, 
  Users,
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Shield,
  Building2,
  Mail,
  Phone,
  Calendar,
  Database,
  X,
  Building,
  ChevronDown,
  CheckCircle,
  Key,
  MoreVertical,
  RefreshCw,
  ArrowLeft,
  Unlock,
  Settings
} from 'lucide-react'

// Interface para Portal do Cliente
interface ResponsavelPortal {
  id: string
  nome: string
  cpf: string
  email: string
  telefone: string
  status: 'ativo' | 'inativo'
  pin: string
  pinInicial: boolean
  empresaId: string
  empresaNome: string
  empresaCnpj: string
  dataCriacao: Date
  ultimoAcesso?: Date
}

// Função para gerar PIN de 4 dígitos
const generatePin = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export default function ClientesPortalPage() {
  const { clientes, loading: loadingClientes } = useClientes()
  
  // Estados
  const [responsaveisPortal, setResponsaveisPortal] = useState<ResponsavelPortal[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo'>('all')
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [pinGerado, setPinGerado] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    cargo: '',
    status: 'ativo' as 'ativo' | 'inativo'
  })

  // Carregar dados do localStorage
  useEffect(() => {
    const savedPortalData = localStorage.getItem('portal_responsaveis')
    if (savedPortalData) {
      try {
        const data = JSON.parse(savedPortalData)
        const responsaveisWithDates = data.map((r: any) => ({
          ...r,
          dataCriacao: new Date(r.dataCriacao),
          ultimoAcesso: r.ultimoAcesso ? new Date(r.ultimoAcesso) : undefined
        }))
        setResponsaveisPortal(responsaveisWithDates)
        console.log('Responsáveis do portal carregados:', responsaveisWithDates.length)
      } catch (error) {
        console.error('Erro ao carregar responsáveis do portal:', error)
        setResponsaveisPortal([])
      }
    } else {
      // Criar exemplo se não existir
      const responsavelExemplo: ResponsavelPortal = {
        id: 'eduardo-portal-001',
        nome: 'Eduardo Aparecido Gomes',
        cpf: '218.680.918-48',
        email: 'eduardo.gomes@legcomercio.com.br',
        telefone: '(16) 99123-4567',
        status: 'ativo',
        pin: '1234',
        pinInicial: true,
        empresaId: 'leg-comercio-001',
        empresaNome: 'LEG - COMERCIO E SERVICOS LTDA',
        empresaCnpj: '00.000.000/0001-28',
        dataCriacao: new Date('2024-01-15T10:00:00'),
        ultimoAcesso: new Date('2024-07-20T14:30:00')
      }
      
      setResponsaveisPortal([responsavelExemplo])
      localStorage.setItem('portal_responsaveis', JSON.stringify([responsavelExemplo]))
      
      console.log('✅ Responsável de exemplo criado!', responsavelExemplo)
      toast.success('Dados de exemplo carregados - Eduardo Gomes - PIN: 1234', { duration: 6000 })
    }
  }, [])

  // Salvar no localStorage
  useEffect(() => {
    if (responsaveisPortal.length > 0) {
      localStorage.setItem('portal_responsaveis', JSON.stringify(responsaveisPortal))
    }
  }, [responsaveisPortal])

  // Filtros
  const clientesComPortal = clientes.filter(cliente => 
    responsaveisPortal.some(r => r.empresaId === cliente.id)
  )

  const clientesSemPortal = clientes.filter(cliente => 
    !responsaveisPortal.some(r => r.empresaId === cliente.id) && 
    cliente.tipoCliente === 'pessoa_juridica' && 
    cliente.status === 'ativo'
  )

  const filteredResponsaveis = responsaveisPortal.filter(responsavel => {
    const matchesSearch = responsavel.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         responsavel.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         responsavel.empresaNome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || responsavel.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Funções
  const handleCreateAccess = (cliente: any) => {
    setSelectedCliente(cliente)
    setFormData({
      nome: '',
      cpf: '',
      email: '',
      telefone: '',
      cargo: '',
      status: 'ativo'
    })
    setShowCreateDialog(true)
  }

  const handleConfirmCreate = async () => {
    if (!selectedCliente || !formData.nome || !formData.cpf || !formData.email) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setIsSubmitting(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const pin = generatePin()
      const novoResponsavel: ResponsavelPortal = {
        id: `portal_${Date.now()}`,
        nome: formData.nome,
        cpf: formData.cpf,
        email: formData.email,
        telefone: formData.telefone,
        status: formData.status,
        pin: pin,
        pinInicial: true,
        empresaId: selectedCliente.id,
        empresaNome: selectedCliente.nome,
        empresaCnpj: selectedCliente.cpfCnpj,
        dataCriacao: new Date()
      }

      setResponsaveisPortal(prev => [...prev, novoResponsavel])
      setPinGerado(pin)
      setShowCreateDialog(false)
      
      toast.success(`Acesso criado! PIN: ${pin}`, { duration: 8000 })
      console.log('Responsável do portal criado:', novoResponsavel)
      
    } catch (error) {
      console.error('Erro ao criar acesso:', error)
      toast.error('Erro ao criar acesso ao portal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPin = (responsavel: ResponsavelPortal) => {
    // PIN fixo para Eduardo, aleatório para outros
    const novoPin = responsavel.nome === 'Eduardo Aparecido Gomes' && responsavel.cpf === '218.680.918-48'
      ? '1234'
      : generatePin()
    
    setResponsaveisPortal(prev => prev.map(r => 
      r.id === responsavel.id 
        ? { ...r, pin: novoPin, pinInicial: true }
        : r
    ))
    
    setPinGerado(novoPin)
    toast.success(`Novo PIN gerado: ${novoPin}`, { duration: 8000 })
  }

  const handleDeleteAccess = (responsavel: ResponsavelPortal) => {
    setResponsaveisPortal(prev => prev.filter(r => r.id !== responsavel.id))
    toast.success(`Acesso removido para ${responsavel.empresaNome}`)
  }

  const handleClearAllData = () => {
    localStorage.removeItem('portal_responsaveis')
    localStorage.removeItem('portal_client_auth')
    setResponsaveisPortal([])
    toast.success('Todos os dados do portal foram limpos')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <Link href="/clientes">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar aos Clientes
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-lg">
                  <Key className="w-8 h-8 text-white" />
                </div>
                Portal do Cliente - Gestão Integrada
              </h1>
              <p className="text-gray-600">
                Configure o acesso dos clientes ao portal de forma integrada com a gestão de clientes
              </p>
            </div>
            
            {responsaveisPortal.length > 0 && (
              <Button 
                onClick={handleClearAllData}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Database className="w-4 h-4 mr-2" />
                Limpar Dados
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="ativos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ativos" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Com Portal ({clientesComPortal.length})
            </TabsTrigger>
            <TabsTrigger value="disponiveis" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Disponíveis ({clientesSemPortal.length})
            </TabsTrigger>
            <TabsTrigger value="configuracao" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuração
            </TabsTrigger>
          </TabsList>

          {/* Clientes com Portal */}
          <TabsContent value="ativos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Clientes com Acesso ao Portal ({filteredResponsaveis.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Pesquisar por nome, email ou empresa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredResponsaveis.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                      <Key className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum acesso configurado
                    </h3>
                    <p className="text-gray-500">
                      Configure o primeiro acesso ao portal para seus clientes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredResponsaveis.map((responsavel) => (
                      <div key={responsavel.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                {responsavel.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{responsavel.nome}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  {responsavel.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  {responsavel.telefone}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={responsavel.status === 'ativo' ? 'default' : 'secondary'}>
                              {responsavel.status === 'ativo' ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {responsavel.pinInicial && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                <Key className="w-3 h-3 mr-1" />
                                PIN Inicial
                              </Badge>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleResetPin(responsavel)}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Gerar Novo PIN
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteAccess(responsavel)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remover Acesso
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        {/* Empresa */}
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="font-medium text-blue-900">{responsavel.empresaNome}</p>
                              <p className="text-sm text-blue-700">CNPJ: {responsavel.empresaCnpj}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clientes Disponíveis */}
          <TabsContent value="disponiveis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Clientes Disponíveis para Portal ({clientesSemPortal.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientesSemPortal.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Todos os clientes já têm acesso
                    </h3>
                    <p className="text-gray-500">
                      Ou não há clientes pessoa jurídica ativos cadastrados
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clientesSemPortal.map((cliente) => (
                      <Card key={cliente.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gray-100 text-gray-600">
                                {cliente.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{cliente.nome}</h4>
                              <p className="text-sm text-gray-500">{cliente.cpfCnpj}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{cliente.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              <span>{cliente.dataCadastro.toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>

                          <Button 
                            onClick={() => handleCreateAccess(cliente)}
                            size="sm" 
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Criar Acesso
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuração */}
          <TabsContent value="configuracao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configurações do Portal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="bg-blue-50 border-blue-200">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Sistema de PIN:</strong> O sistema utiliza PINs de 4 dígitos para acesso seguro ao portal do cliente.
                    Os PINs são gerados automaticamente e devem ser alterados no primeiro acesso.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-medium text-green-900">Acessos Ativos</h4>
                      <p className="text-2xl font-bold text-green-700">{responsaveisPortal.filter(r => r.status === 'ativo').length}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-4 text-center">
                      <Building2 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <h4 className="font-medium text-orange-900">Disponíveis</h4>
                      <p className="text-2xl font-bold text-orange-700">{clientesSemPortal.length}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-medium text-blue-900">Total Clientes</h4>
                      <p className="text-2xl font-bold text-blue-700">{clientes.length}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Ações Rápidas</h4>
                  <div className="flex gap-3">
                    <Link href="/portal-cliente">
                      <Button variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                        <Unlock className="w-4 h-4 mr-2" />
                        Testar Portal
                      </Button>
                    </Link>
                    <Button 
                      onClick={handleClearAllData}
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Limpar Dados
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog - Criar Acesso */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Criar Acesso ao Portal
              </DialogTitle>
              <DialogDescription>
                Configure o acesso ao portal para <strong>{selectedCliente?.nome}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Shield className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>PIN Automático:</strong> Um PIN de 4 dígitos será gerado automaticamente para acesso seguro.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome do Responsável *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({...prev, nome: e.target.value}))}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData(prev => ({...prev, cpf: e.target.value}))}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                      placeholder="email@empresa.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData(prev => ({...prev, telefone: e.target.value}))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => setFormData(prev => ({...prev, cargo: e.target.value}))}
                    placeholder="Ex: Gerente Financeiro"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmCreate}
                disabled={isSubmitting || !formData.nome || !formData.cpf || !formData.email}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar Acesso
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog - PIN Gerado */}
        <Dialog open={!!pinGerado} onOpenChange={() => setPinGerado(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                PIN Gerado!
              </DialogTitle>
              <DialogDescription>
                O PIN foi gerado com sucesso. Anote o código abaixo:
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Key className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">PIN de Acesso</span>
                </div>
                <div className="bg-white border border-yellow-200 rounded px-4 py-3 mb-3">
                  <span className="font-mono text-3xl font-bold text-gray-900 tracking-wider select-all">
                    {pinGerado}
                  </span>
                </div>
                <div className="text-xs text-yellow-700 space-y-1">
                  <p>• Clique no PIN para selecioná-lo</p>
                  <p>• O responsável deve alterar no primeiro acesso</p>
                  <p>• Guarde esta informação em local seguro</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                onClick={() => setPinGerado(null)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                PIN Anotado - Continuar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}