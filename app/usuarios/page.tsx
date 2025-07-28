'use client'

import { useState } from 'react'
import { ArrowLeft, Users, Shield, Eye, Edit, Trash2, Plus, Search, Filter, Crown, UserCheck, User, Eye as EyeIcon, Settings, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { useUsuariosSimple as useUsuarios } from '@/hooks/useUsuarios-simple'
import { toast } from 'sonner'
import Link from 'next/link'

// Tipos de usuário
type UserRole = 'admin' | 'supervisor' | 'operador' | 'visualizador'

interface Permission {
  id: string
  name: string
  description: string
  module: string
}

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  status: 'ativo' | 'inativo' | 'suspenso'
  permissions: string[]
  lastLogin?: Date
  createdAt: Date
}

const availablePermissions: Permission[] = [
  { id: 'dashboard', name: 'Dashboard', description: 'Acesso ao painel principal', module: 'Sistema' },
  { id: 'documentos', name: 'Documentos', description: 'Gerenciar documentos de clientes', module: 'Documentos' },
  { id: 'alvaras', name: 'Alvarás', description: 'Controle de alvarás e licenças', module: 'Licenças' },
  { id: 'abertura', name: 'Abertura de Empresas', description: 'Processos de abertura', module: 'Abertura' },
  { id: 'obrigacoes', name: 'Obrigações Fiscais', description: 'Controle de obrigações', module: 'Fiscal' },
  { id: 'usuarios', name: 'Usuários', description: 'Gerenciar usuários do sistema', module: 'Administração' },
  { id: 'relatorios', name: 'Relatórios', description: 'Gerar e visualizar relatórios', module: 'Relatórios' },
]

const roleConfig = {
  admin: {
    label: 'Administrador',
    color: 'bg-red-100 text-red-800',
    icon: Crown,
    description: 'Acesso total ao sistema'
  },
  supervisor: {
    label: 'Supervisor',
    color: 'bg-orange-100 text-orange-800',
    icon: UserCheck,
    description: 'Supervisão de equipes e processos'
  },
  operador: {
    label: 'Operador',
    color: 'bg-green-100 text-green-800',
    icon: User,
    description: 'Operações diárias'
  },
  visualizador: {
    label: 'Visualizador',
    color: 'bg-gray-100 text-gray-800',
    icon: EyeIcon,
    description: 'Apenas visualização'
  }
}

export default function UsuariosPage() {
  console.log('📄 UsuariosPage renderizando - FORÇANDO REFRESH DO HOOK...')
  
  const hookResult = useUsuarios()
  console.log('🔍 Hook result:', { 
    usuarios: hookResult.usuarios?.length || 0, 
    loading: hookResult.loading, 
    error: !!hookResult.error 
  })
  
  const { usuarios, loading, error, addUsuario, updateUsuario, deleteUsuario, refreshUsuarios, restoreDeletedUsers, forceResetSystem } = hookResult
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{id: string, nome: string} | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    departamento: '',
    permissoes: {} as Record<string, boolean>,
    status: 'ativo' as 'ativo' | 'inativo' | 'suspenso'
  })
  const [accountOptions, setAccountOptions] = useState({
    createAccount: true,
    notifyUser: false
  })

  console.log('Usuarios page loaded with', usuarios.length, 'usuarios')

  const filteredUsers = usuarios.filter(usuario => {
    const matchesSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || (usuario.departamento || 'operador').toLowerCase() === roleFilter.toLowerCase()
    const matchesStatus = statusFilter === 'all' || usuario.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleStatusChange = async (userId: string, newStatus: 'ativo' | 'inativo' | 'suspenso') => {
    try {
      console.log('Changing user status:', userId, newStatus)
      await updateUsuario(userId, { status: newStatus })
      toast.success('Status do usuário atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status do usuário')
    }
  }

  const handlePermissionUpdate = async (userId: string, permissions: Record<string, boolean>) => {
    try {
      console.log('Updating user permissions:', userId, permissions)
      await updateUsuario(userId, { permissoes: permissions })
      toast.success('Permissões atualizadas com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error)
      toast.error('Erro ao atualizar permissões')
    }
  }

  const handleCreateUser = async () => {
    try {
      setIsSubmitting(true)
      
      if (!formData.nome || !formData.email) {
        toast.error('Preencha todos os campos obrigatórios (Nome e Email)')
        return
      }

      console.log('Iniciando criação de usuário com dados:', formData)

      // Mapear departamento para cargo apropriado
      const departamentoToCargo = {
        'Contabilidade': 'Contador',
        'Fiscal': 'Analista Fiscal',
        'Pessoal': 'Analista de RH',
        'Abertura': 'Especialista em Abertura',
        'Documentos': 'Analista de Documentos',
        'TI': 'Analista de TI',
        'Administração': 'Administrador'
      }

      const cargoFinal = departamentoToCargo[formData.departamento as keyof typeof departamentoToCargo] || 'Usuário'

      const usuarioData = {
        nome: formData.nome,
        email: formData.email,
        cargo: cargoFinal, // Usar cargo mapeado do departamento
        departamento: formData.departamento || 'Geral',
        permissoes: formData.permissoes,
        status: formData.status,
        ultimoAcesso: new Date()
      }

      console.log('Dados formatados para usuário:', usuarioData)

      const result = await addUsuario(usuarioData, {
        createAccount: accountOptions.createAccount,
        notifyUser: accountOptions.notifyUser
      })
      
      console.log('Resultado da criação:', result)
      
      if (result.account) {
        toast.success(result.message || 'Usuário e conta criados com sucesso!')
        
        if (accountOptions.notifyUser) {
          if (result.email?.success) {
            toast.success('✅ Email com dados de acesso enviado com sucesso!')
          } else if (result.email?.simulated) {
            toast.info('📧 Email simulado (modo desenvolvimento) - verifique o console')
          } else if ((result.email as any)?.testingMode) {
            toast.warning('⚠️ Sistema de email em modo teste - email não enviado')
            toast.info(`🔑 Senha temporária gerada: ${result.account.senhaTemporaria}`)
            toast.info('💡 Configure domínio no Resend para enviar emails reais')
          } else {
            toast.error(`❌ Erro no envio de email: ${result.email?.message || 'Erro desconhecido'}`)
            toast.info(`🔑 Senha temporária: ${result.account.senhaTemporaria}`)
          }
        }
      } else {
        toast.success(result.message || 'Usuário criado com sucesso!')
      }
      
      setIsCreateDialogOpen(false)
      setFormData({
        nome: '',
        email: '',
        departamento: '',
        permissoes: {},
        status: 'ativo'
      })
      setAccountOptions({
        createAccount: true,
        notifyUser: false
      })
    } catch (error) {
      console.error('Erro detalhado ao criar usuário:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao criar usuário'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDeleteDialog = (userId: string, userName: string) => {
    console.log('🗑️ PÁGINA: Abrindo dialog de exclusão:', { userId, userName })
    setUserToDelete({ id: userId, nome: userName })
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    
    console.log('🗑️ PÁGINA: Iniciando processo de exclusão:', userToDelete)
    console.log('📊 PÁGINA: Estado antes da exclusão - Total usuários:', usuarios.length)
    
    try {
      console.log('✅ PÁGINA: Confirmação obtida, chamando deleteUsuario...')
      
      // Executar exclusão
      await deleteUsuario(userToDelete.id)
      
      console.log('✅ PÁGINA: Função deleteUsuario retornou sem erro')
      console.log('📊 PÁGINA: Estado após exclusão - Total usuários:', usuarios.length)
      
      toast.success(`Usuário "${userToDelete.nome}" excluído com sucesso!`)
      
      // Log adicional para debug
      setTimeout(() => {
        console.log('🔍 PÁGINA: Verificação pós-exclusão - Usuários:', usuarios.length)
        console.log('📝 PÁGINA: IDs dos usuários restantes:', usuarios.map(u => u.id))
      }, 100)
      
    } catch (error) {
      console.error('💥 PÁGINA: Erro detalhado ao excluir usuário:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao excluir usuário'
      console.error('📄 PÁGINA: Mensagem de erro:', errorMessage)
      
      toast.error(`Erro ao excluir "${userToDelete.nome}": ${errorMessage}`)
    }
    
    // Fechar dialog e limpar estado
    setIsDeleteDialogOpen(false)
    setUserToDelete(null)
  }

  const getRoleStats = () => {
    // Mapeamento correto dos departamentos para roles
    const departamentoToRole = {
      'administração': 'admin',
      'ti': 'admin',
      'fiscal': 'supervisor',
      'contabilidade': 'supervisor',
      'pessoal': 'supervisor',
      'abertura': 'operador',
      'documentos': 'operador',
      'operacional': 'operador',
      'geral': 'visualizador'
    }
    
    const stats = usuarios.reduce((acc, usuario) => {
      const departamento = (usuario.departamento || 'Geral').toLowerCase()
      const role = departamentoToRole[departamento] || 'operador'
      
      console.log(`📊 Usuário: ${usuario.nome} | Departamento: "${usuario.departamento}" | Role mapeado: "${role}"`)
      
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('📈 Stats finais:', stats)
    
    return Object.entries(roleConfig).map(([role, config]) => ({
      role: role as UserRole,
      count: stats[role] || 0,
      config
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refreshUsuarios}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

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
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-macaly="usuarios-title">
                Gestão de Usuários
              </h1>
              <p className="text-gray-600">Controle de acesso e permissões</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => {
                console.log('🔄 Botão ATUALIZAR clicado - carregando dados completos...')
                refreshUsuarios()
                toast.info('Carregando usuários do banco de dados...')
              }} 
              variant="outline"
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar (Carregar do Banco)
            </Button>
            <Button 
              onClick={() => {
                if (window.confirm('Tem certeza que deseja restaurar todos os usuários de teste excluídos?')) {
                  restoreDeletedUsers()
                  toast.success('Usuários de teste restaurados com sucesso!')
                }
              }} 
              variant="outline"
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restaurar Excluídos
            </Button>
            <Button 
              onClick={() => {
                if (window.confirm('⚠️ RESET COMPLETO: Limpar localStorage e resetar sistema?\\n\\nIsto vai limpar TODOS os dados temporários.')) {
                  forceResetSystem()
                  toast.success('Sistema resetado completamente!')
                }
              }} 
              variant="outline"
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Completo
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {/* Alert sobre usuários cadastrados */}
        {usuarios.length === 2 && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">💡</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900 mb-1">
                    Usuários cadastrados não aparecem?
                  </h3>
                  <p className="text-sm text-blue-700 mb-2">
                    Se você cadastrou um novo usuário e ele não aparece após atualizar a página, 
                    clique no botão <strong>"Atualizar (Carregar do Banco)"</strong> para sincronizar com o banco de dados.
                  </p>
                  <p className="text-xs text-blue-600">
                    Sistema atual: {usuarios.length} usuários de teste carregados
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {getRoleStats().map(({ role, count, config }) => {
            const Icon = config.icon
            return (
              <Card key={role}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{config.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                    </div>
                    <div className={`p-2 rounded-full ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os perfis</SelectItem>
                  {Object.entries(roleConfig).map(([role, config]) => (
                    <SelectItem key={role} value={role}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuários ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((usuario) => {
                return (
                  <div key={usuario.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>{usuario.nome.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{usuario.nome}</h3>
                          <Badge className="bg-blue-100 text-blue-800">
                            <User className="w-3 h-3 mr-1" />
                            {usuario.departamento || 'Geral'}
                          </Badge>
                          <Badge variant={usuario.status === 'ativo' ? 'default' : 'secondary'}>
                            {usuario.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{usuario.email}</p>
                        <p className="text-xs text-gray-400">
                          Último acesso: {usuario.ultimoAcesso ? usuario.ultimoAcesso.toLocaleDateString('pt-BR') : 'Nunca'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Botão Visualizar */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(usuario)
                          setIsPermissionDialogOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Visualizar
                      </Button>
                      
                      {/* Botão Editar/Permissões */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(usuario)
                          setIsPermissionDialogOpen(true)
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      
                      {/* Botão Status */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newStatus = usuario.status === 'ativo' ? 'inativo' : 'ativo'
                          handleStatusChange(usuario.id, newStatus)
                        }}
                      >
                        {usuario.status === 'ativo' ? 'Desativar' : 'Ativar'}
                      </Button>
                      
                      {/* Botão Excluir */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(usuario.id, usuario.nome)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo usuário no sistema
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 gap-4 py-4 px-1">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome completo do usuário"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@agassessoria.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento</Label>
                <Select value={formData.departamento} onValueChange={(value) => setFormData(prev => ({ ...prev, departamento: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contabilidade">Contabilidade</SelectItem>
                    <SelectItem value="Fiscal">Fiscal</SelectItem>
                    <SelectItem value="Pessoal">Pessoal</SelectItem>
                    <SelectItem value="Abertura">Abertura</SelectItem>
                    <SelectItem value="Documentos">Documentos</SelectItem>
                    <SelectItem value="TI">TI</SelectItem>
                    <SelectItem value="Administração">Administração</SelectItem>
                  </SelectContent>
                </Select>
                {formData.departamento && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    💼 Cargo será definido como: <strong>
                      {formData.departamento === 'Contabilidade' && 'Contador'}
                      {formData.departamento === 'Fiscal' && 'Analista Fiscal'}
                      {formData.departamento === 'Pessoal' && 'Analista de RH'}
                      {formData.departamento === 'Abertura' && 'Especialista em Abertura'}
                      {formData.departamento === 'Documentos' && 'Analista de Documentos'}
                      {formData.departamento === 'TI' && 'Analista de TI'}
                      {formData.departamento === 'Administração' && 'Administrador'}
                    </strong>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: 'ativo' | 'inativo' | 'suspenso') => setFormData(prev => ({ ...prev, status: value }))}>
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
              
              <div className="space-y-2">
                <Label>Permissões Básicas</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availablePermissions.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between space-x-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <Label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                          {permission.name}
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                      </div>
                      <Switch
                        id={permission.id}
                        checked={formData.permissoes[permission.id] || false}
                        onCheckedChange={(checked) => setFormData(prev => ({ 
                          ...prev, 
                          permissoes: { ...prev.permissoes, [permission.id]: checked } 
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <Label className="text-base font-medium">Configurações de Conta</Label>
                  </div>
                  
                  <div className="space-y-3 p-3 border rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="createUserAccount" className="text-sm font-medium">
                          Criar conta de acesso automaticamente
                        </Label>
                        <p className="text-xs text-gray-500">
                          Cria uma conta de acesso para que o usuário possa fazer login no sistema
                        </p>
                      </div>
                      <Switch
                        id="createUserAccount"
                        checked={accountOptions.createAccount}
                        onCheckedChange={(checked) => setAccountOptions(prev => ({ ...prev, createAccount: checked }))}
                      />
                    </div>
                    
                    {accountOptions.createAccount && (
                      <div className="space-y-3 pl-3 border-l-2 border-blue-200">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <Label htmlFor="notifyNewUser" className="text-sm font-medium">
                              Notificar usuário por email
                            </Label>
                            <p className="text-xs text-gray-500">
                              Envia email com dados de acesso (senha temporária)
                            </p>
                          </div>
                          <Switch
                            id="notifyNewUser"
                            checked={accountOptions.notifyUser}
                            onCheckedChange={(checked) => setAccountOptions(prev => ({ ...prev, notifyUser: checked }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateUser}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Permission Dialog */}
        <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerenciar Permissões</DialogTitle>
              <DialogDescription>
                Configurar permissões para {selectedUser?.nome}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 py-4 px-1">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Avatar>
                    <AvatarFallback>{selectedUser.nome.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedUser.nome}</h3>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    <Badge className="mt-1">{selectedUser.departamento || 'Geral'}</Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium">Permissões por Módulo</h4>
                  {availablePermissions.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{permission.name}</p>
                        <p className="text-sm text-gray-500">{permission.description}</p>
                        <Badge variant="outline" className="mt-1">{permission.module}</Badge>
                      </div>
                      <Switch
                        checked={selectedUser.permissoes[permission.id] || false}
                        onCheckedChange={(checked) => {
                          const newPermissions = { ...selectedUser.permissoes, [permission.id]: checked }
                          handlePermissionUpdate(selectedUser.id, newPermissions)
                          setSelectedUser({ ...selectedUser, permissoes: newPermissions })
                        }}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPermissionDialogOpen(false)}
                  >
                    Fechar
                  </Button>
                  <Button 
                    onClick={() => {
                      toast.success('Permissões salvas com sucesso!')
                      setIsPermissionDialogOpen(false)
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            {userToDelete && (
              <div className="py-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-sm font-medium">⚠️</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        Tem certeza que deseja excluir este usuário?
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        <strong>{userToDelete.nome}</strong> será removido permanentemente do sistema.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  💡 Usuários de teste podem ser restaurados com o botão "Restaurar Excluídos"
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setUserToDelete(null)
                }}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteUser}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Usuário
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}