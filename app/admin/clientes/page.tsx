'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, Building, User, Mail, Phone, MapPin, Calendar, Check, X, Eye, Users, ArrowLeft, Download, Upload, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useClientes, Cliente } from '@/hooks/useClientes'
import { useResponsaveis } from '@/hooks/useResponsaveis'
import { ResponsaveisManager } from '@/components/ResponsaveisManager'
import Link from 'next/link'

export default function GestaoClientesPage() {
  const { clientes, loading, error, addCliente, updateCliente, deleteCliente, refreshClientes } = useClientes()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tipoFilter, setTipoFilter] = useState<string>('all')
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [showResponsaveisDialog, setShowResponsaveisDialog] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpfCnpj: '',
    telefone: '',
    endereco: '',
    tipoCliente: 'pessoa_juridica' as 'pessoa_fisica' | 'pessoa_juridica',
    status: 'ativo' as 'ativo' | 'inativo' | 'suspenso',
    observacoes: ''
  })
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  console.log('Gestão de Clientes - Total:', clientes.length)

  // Limpar formulário
  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      cpfCnpj: '',
      telefone: '',
      endereco: '',
      tipoCliente: 'pessoa_juridica',
      status: 'ativo',
      observacoes: ''
    })
    setFormError('')
    setEditingCliente(null)
  }

  // Carregar dados do cliente para edição
  const handleEdit = (cliente: Cliente) => {
    setFormData({
      nome: cliente.nome,
      email: cliente.email,
      cpfCnpj: cliente.cpfCnpj,
      telefone: cliente.telefone || '',
      endereco: cliente.endereco || '',
      tipoCliente: cliente.tipoCliente,
      status: cliente.status,
      observacoes: cliente.observacoes || ''
    })
    setEditingCliente(cliente)
    setShowAddDialog(true)
  }

  // Salvar cliente
  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      setFormError('')

      // Validações básicas
      if (!formData.nome.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (!formData.email.trim()) {
        throw new Error('Email é obrigatório')
      }
      if (!formData.cpfCnpj.trim()) {
        throw new Error('CPF/CNPJ é obrigatório')
      }

      const clienteData = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        cpfCnpj: formData.cpfCnpj.trim(),
        telefone: formData.telefone.trim() || undefined,
        endereco: formData.endereco.trim() || undefined,
        tipoCliente: formData.tipoCliente,
        status: formData.status,
        dataCadastro: editingCliente ? editingCliente.dataCadastro : new Date(),
        observacoes: formData.observacoes.trim() || undefined
      }

      if (editingCliente) {
        await updateCliente(editingCliente.id, clienteData)
      } else {
        await addCliente(clienteData)
      }

      setShowAddDialog(false)
      resetForm()
    } catch (err) {
      console.error('Erro ao salvar cliente:', err)
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Deletar cliente
  const handleDelete = async (cliente: Cliente) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente "${cliente.nome}"?`)) {
      try {
        await deleteCliente(cliente.id)
      } catch (err) {
        console.error('Erro ao deletar cliente:', err)
      }
    }
  }

  // Filtrar clientes
  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.cpfCnpj.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || cliente.status === statusFilter
    const matchesTipo = tipoFilter === 'all' || cliente.tipoCliente === tipoFilter
    
    return matchesSearch && matchesStatus && matchesTipo
  })

  // Estatísticas
  const stats = {
    total: clientes.length,
    ativos: clientes.filter(c => c.status === 'ativo').length,
    pessoaFisica: clientes.filter(c => c.tipoCliente === 'pessoa_fisica').length,
    pessoaJuridica: clientes.filter(c => c.tipoCliente === 'pessoa_juridica').length,
    cadastrosRecentes: clientes.filter(c => {
      const diffDays = Math.abs(new Date().getTime() - c.dataCadastro.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays <= 30
    }).length
  }

  // Formatação de dados
  const formatCpfCnpj = (valor: string) => {
    const numbers = valor.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
  }

  const formatTelefone = (telefone: string) => {
    const numbers = telefone.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      ativo: 'bg-green-100 text-green-800',
      inativo: 'bg-gray-100 text-gray-800',
      suspenso: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || colors.ativo
  }

  const getTipoColor = (tipo: string) => {
    const colors = {
      pessoa_fisica: 'bg-blue-100 text-blue-800',
      pessoa_juridica: 'bg-purple-100 text-purple-800'
    }
    return colors[tipo as keyof typeof colors] || colors.pessoa_juridica
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    Gestão de Clientes
                  </CardTitle>
                  <CardDescription>
                    Cadastro e gerenciamento de clientes do escritório
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={refreshClientes} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingCliente ? 'Atualize as informações do cliente' : 'Cadastre um novo cliente no sistema'}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome/Razão Social *</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                          placeholder="Nome completo ou razão social"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
                        <Input
                          id="cpfCnpj"
                          value={formData.cpfCnpj}
                          onChange={(e) => setFormData(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                          placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          value={formData.telefone}
                          onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tipoCliente">Tipo de Cliente</Label>
                        <Select value={formData.tipoCliente} onValueChange={(value: 'pessoa_fisica' | 'pessoa_juridica') => setFormData(prev => ({ ...prev, tipoCliente: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                            <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
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
                        <Label htmlFor="endereco">Endereço</Label>
                        <Input
                          id="endereco"
                          value={formData.endereco}
                          onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                          placeholder="Endereço completo"
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="observacoes">Observações</Label>
                        <Textarea
                          id="observacoes"
                          value={formData.observacoes}
                          onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                          placeholder="Informações adicionais sobre o cliente"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    {formError && (
                      <Alert>
                        <AlertDescription>{formError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSubmitting ? 'Salvando...' : (editingCliente ? 'Atualizar' : 'Cadastrar')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pessoa Física</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.pessoaFisica}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pessoa Jurídica</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.pessoaJuridica}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Building className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Novos (30 dias)</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.cadastrosRecentes}</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-full">
                  <Calendar className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, email ou CPF/CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
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
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                  <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Clientes List */}
        {filteredClientes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-2">Nenhum cliente encontrado</p>
              <p className="text-sm text-gray-400">
                {searchTerm || statusFilter !== 'all' || tipoFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Cadastre o primeiro cliente do escritório'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClientes.map((cliente) => (
              <Card key={cliente.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{cliente.nome.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{cliente.nome}</h4>
                        <p className="text-sm text-gray-500">{formatCpfCnpj(cliente.cpfCnpj)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className={getStatusColor(cliente.status)}>
                        {cliente.status}
                      </Badge>
                      <Badge className={getTipoColor(cliente.tipoCliente)}>
                        {cliente.tipoCliente === 'pessoa_fisica' ? 'PF' : 'PJ'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{cliente.email}</span>
                    </div>
                    {cliente.telefone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{formatTelefone(cliente.telefone)}</span>
                      </div>
                    )}
                    {cliente.endereco && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{cliente.endereco}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Cadastrado em {cliente.dataCadastro.toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  
                  {cliente.observacoes && (
                    <>
                      <Separator />
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">Observações:</p>
                        <p className="text-xs">{cliente.observacoes}</p>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedCliente(cliente)
                        setShowResponsaveisDialog(true)
                      }}
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(cliente)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(cliente)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Responsáveis Dialog */}
        <Dialog open={showResponsaveisDialog} onOpenChange={setShowResponsaveisDialog}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Responsáveis - {selectedCliente?.nome}</DialogTitle>
              <DialogDescription>
                Gerencie os responsáveis que terão acesso ao sistema desta empresa
              </DialogDescription>
            </DialogHeader>
            
            {selectedCliente && (
              <ResponsaveisManager 
                clienteId={selectedCliente.id}
                clienteNome={selectedCliente.nome}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}