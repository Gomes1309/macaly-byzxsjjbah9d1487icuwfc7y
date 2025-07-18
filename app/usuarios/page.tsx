'use client'

import { useState } from 'react'
import { ArrowLeft, Users, Shield, Eye, Edit, Trash2, Plus, Search, Filter, Crown, UserCheck, User, Eye as EyeIcon, Settings } from 'lucide-react'
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
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)

  console.log('Usuarios page loaded with', users.length, 'users')

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleStatusChange = (userId: string, newStatus: User['status']) => {
    console.log('Changing user status:', userId, newStatus)
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ))
  }

  const handlePermissionUpdate = (userId: string, permissions: string[]) => {
    console.log('Updating user permissions:', userId, permissions)
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, permissions } : user
    ))
  }

  const getRoleStats = () => {
    const stats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<UserRole, number>)
    
    return Object.entries(roleConfig).map(([role, config]) => ({
      role: role as UserRole,
      count: stats[role as UserRole] || 0,
      config
    }))
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
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
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
              {filteredUsers.map((user) => {
                const roleInfo = roleConfig[user.role]
                const RoleIcon = roleInfo.icon
                
                return (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{user.name}</h3>
                          <Badge className={roleInfo.color}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {roleInfo.label}
                          </Badge>
                          <Badge variant={user.status === 'ativo' ? 'default' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">
                          Último acesso: {user.lastLogin?.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
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
                          const newStatus = user.status === 'ativo' ? 'inativo' : 'ativo'
                          handleStatusChange(user.id, newStatus)
                        }}
                      >
                        {user.status === 'ativo' ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Permission Dialog */}
        <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gerenciar Permissões</DialogTitle>
              <DialogDescription>
                Configurar permissões para {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Avatar>
                    <AvatarFallback>{selectedUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedUser.name}</h3>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
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
                        checked={selectedUser.permissions.includes(permission.id) || selectedUser.permissions.includes('*')}
                        disabled={selectedUser.permissions.includes('*')}
                        onCheckedChange={(checked) => {
                          const newPermissions = checked
                            ? [...selectedUser.permissions, permission.id]
                            : selectedUser.permissions.filter(p => p !== permission.id)
                          handlePermissionUpdate(selectedUser.id, newPermissions)
                          setSelectedUser({ ...selectedUser, permissions: newPermissions })
                        }}
                      />
                    </div>
                  ))}
                </div>
                
                {selectedUser.permissions.includes('*') && (
                  <Alert>
                    <Crown className="w-4 h-4" />
                    <AlertDescription>
                      Este usuário tem acesso total ao sistema (Administrador).
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}