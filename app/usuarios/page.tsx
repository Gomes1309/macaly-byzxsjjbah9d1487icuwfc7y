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
import { useUsuarios } from '@/hooks/useUsuarios'
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

// Dados mock
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Carlos Silva',
    email: 'carlos@agassessoria.com',
    role: 'admin',
    status: 'ativo',
    permissions: ['*'],
    lastLogin: new Date('2024-01-15T10:30:00'),
    createdAt: new Date('2023-06-01'),
  },
  {
    id: '2',
    name: 'Marina Santos',
    email: 'marina@agassessoria.com',
    role: 'supervisor',
    status: 'ativo',
    permissions: ['documentos', 'alvaras', 'obrigacoes', 'abertura'],
    lastLogin: new Date('2024-01-15T09:15:00'),
    createdAt: new Date('2023-08-15'),
  },
  {
    id: '3',
    name: 'João Oliveira',
    email: 'joao@agassessoria.com',
    role: 'operador',
    status: 'ativo',
    permissions: ['documentos', 'obrigacoes'],
    lastLogin: new Date('2024-01-15T08:45:00'),
    createdAt: new Date('2023-11-20'),
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana@agassessoria.com',
    role: 'visualizador',
    status: 'inativo',
    permissions: ['documentos:read'],
    lastLogin: new Date('2024-01-10T14:20:00'),
    createdAt: new Date('2023-12-01'),
  },
]

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
  const { usuarios, loading, error, addUsuario, updateUsuario, deleteUsuario, refreshUsuarios } = useUsuarios()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cargo: '',
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
    const matchesRole = roleFilter === 'all' || usuario.cargo.toLowerCase() === roleFilter.toLowerCase()
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
      
      if (!formData.nome || !formData.email || !formData.cargo || !formData.departamento) {
        toast.error('Preencha todos os campos obrigatórios')
        return
      }

      const usuarioData = {
        nome: formData.nome,
        email: formData.email,
        cargo: formData.cargo,
        departamento: formData.departamento,
        permissoes: formData.permissoes,
        status: formData.status,
        ultimoAcesso: new Date()
      }

      const result = await addUsuario(usuarioData, {
        createAccount: accountOptions.createAccount,
        notifyUser: accountOptions.notifyUser
      })
      
      if (result.account) {
        toast.success(result.message || 'Usuário e conta criados com sucesso!')
        if (accountOptions.notifyUser) {
          toast.info('Email com dados de acesso enviado para o usuário')
        }
      } else {
        toast.success(result.message || 'Usuário criado com sucesso!')
      }
      
      setIsCreateDialogOpen(false)
      setFormData({
        nome: '',
        email: '',
        cargo: '',
        departamento: '',
        permissoes: {},
        status: 'ativo'
      })
      setAccountOptions({
        createAccount: true,
        notifyUser: false
      })
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar usuário')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${userName}"?`)) {
      try {
        await deleteUsuario(userId)
        toast.success('Usuário excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir usuário:', error)
        toast.error('Erro ao excluir usuário')
      }
    }
  }

  const getRoleStats = () => {
    const stats = usuarios.reduce((acc, usuario) => {
      const role = usuario.cargo.toLowerCase()
      acc[role] = (acc[role] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
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
            <Button onClick={refreshUsuarios} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </div>

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
                            {usuario.cargo}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(usuario)
                          setIsPermissionDialogOpen(true)
                        }}
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Permissões
                      </Button>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(usuario.id, usuario.nome)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo usuário no sistema
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
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
                <Label htmlFor="cargo">Cargo *</Label>
                <Select value={formData.cargo} onValueChange={(value) => setFormData(prev => ({ ...prev, cargo: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Contador">Contador</SelectItem>
                    <SelectItem value="Assistente">Assistente</SelectItem>
                    <SelectItem value="Estagiário">Estagiário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento *</Label>
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
              
              <div className="space-y-2 md:col-span-2">
                <Label>Permissões Básicas</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availablePermissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Switch
                        id={permission.id}
                        checked={formData.permissoes[permission.id] || false}
                        onCheckedChange={(checked) => setFormData(prev => ({ 
                          ...prev, 
                          permissoes: { ...prev.permissoes, [permission.id]: checked } 
                        }))}
                      />
                      <Label htmlFor={permission.id} className="text-sm">{permission.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-4 md:col-span-2">
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <Label className="text-base font-medium">Configurações de Conta</Label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="createUserAccount">Criar conta de acesso automaticamente</Label>
                      <p className="text-sm text-gray-500">
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
                    <div className="space-y-3 pl-4 border-l-2 border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifyNewUser">Notificar usuário por email</Label>
                          <p className="text-sm text-gray-500">
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gerenciar Permissões</DialogTitle>
              <DialogDescription>
                Configurar permissões para {selectedUser?.nome}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Avatar>
                    <AvatarFallback>{selectedUser.nome.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedUser.nome}</h3>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    <Badge className="mt-1">{selectedUser.cargo}</Badge>
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
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}