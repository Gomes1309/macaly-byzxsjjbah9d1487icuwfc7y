'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, User, Mail, Phone, Shield, Check, X, Users, UserPlus, Settings, Building, UserCog } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useResponsaveis, ResponsavelComVinculo } from '@/hooks/useResponsaveis'

interface ResponsaveisManagerProps {
  clienteId: string
  clienteNome: string
}

export function ResponsaveisManager({ clienteId, clienteNome }: ResponsaveisManagerProps) {
  const { 
    responsaveis, 
    loading, 
    error, 
    addResponsavelToCliente, 
    updateResponsavelCliente, 
    deleteResponsavelCliente, 
    getResponsaveisByCliente,
    testConnection
  } = useResponsaveis()
  
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingVinculo, setEditingVinculo] = useState<ResponsavelComVinculo | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    cargo: '',
    permissoes: {
      documentos: true,
      download: true,
      notificacoes: true
    },
    status: 'ativo' as 'ativo' | 'inativo' | 'suspenso',
    observacoes: ''
  })
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const clienteResponsaveis = getResponsaveisByCliente(clienteId)

  console.log('ResponsaveisManager loaded for cliente:', clienteId)
  console.log('Responsáveis encontrados:', clienteResponsaveis.length)

  // Função para testar conexão
  const handleTestConnection = async () => {
    console.log('Iniciando teste de conexão...')
    await testConnection()
  }

  // Limpar formulário
  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      cpf: '',
      telefone: '',
      cargo: '',
      permissoes: {
        documentos: true,
        download: true,
        notificacoes: true
      },
      status: 'ativo',
      observacoes: ''
    })
    setFormError('')
    setEditingVinculo(null)
  }

  // Carregar dados do responsável para edição
  const handleEdit = (responsavel: ResponsavelComVinculo) => {
    const empresaInfo = responsavel.empresas.find(emp => emp.clienteId === clienteId)
    
    if (empresaInfo) {
      setFormData({
        nome: responsavel.nome,
        email: responsavel.email,
        cpf: responsavel.cpf,
        telefone: responsavel.telefone || '',
        cargo: empresaInfo.cargo,
        permissoes: empresaInfo.permissoes,
        status: empresaInfo.status,
        observacoes: responsavel.observacoes || ''
      })
      setEditingVinculo(responsavel)
      setShowAddDialog(true)
    }
  }

  // Salvar responsável
  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      setFormError('')
      
      console.log('Iniciando handleSave:', { editingVinculo, formData })

      // Validações básicas
      if (!formData.nome.trim()) {
        throw new Error('Nome é obrigatório')
      }
      if (!formData.email.trim()) {
        throw new Error('Email é obrigatório')
      }
      if (!formData.cpf.trim()) {
        throw new Error('CPF é obrigatório')
      }
      if (!formData.cargo.trim()) {
        throw new Error('Cargo é obrigatório')
      }
      
      console.log('Validações básicas passaram')

      if (editingVinculo) {
        // Atualizar vínculo existente
        console.log('Atualizando vínculo existente:', editingVinculo.vinculo.id)
        const vinculoId = editingVinculo.vinculo.id
        await updateResponsavelCliente(vinculoId, {
          cargo: formData.cargo.trim(),
          permissoes: formData.permissoes,
          status: formData.status,
          observacoes: formData.observacoes.trim() || undefined
        })
        console.log('Vínculo atualizado com sucesso')
      } else {
        // Adicionar novo responsável/vínculo
        console.log('Adicionando novo responsável/vínculo para cliente:', clienteId)
        await addResponsavelToCliente(clienteId, {
          nome: formData.nome.trim(),
          email: formData.email.trim(),
          cpf: formData.cpf.trim(),
          telefone: formData.telefone.trim() || undefined,
          cargo: formData.cargo.trim(),
          permissoes: formData.permissoes,
          status: formData.status,
          observacoes: formData.observacoes.trim() || undefined
        })
        console.log('Novo responsável/vínculo adicionado com sucesso')
      }

      setShowAddDialog(false)
      resetForm()
      console.log('Processo concluído com sucesso')
    } catch (err) {
      console.error('Erro detalhado ao salvar responsável:', err)
      console.error('Stack trace:', err instanceof Error ? err.stack : 'Sem stack trace')
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar responsável')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Deletar vínculo
  const handleDelete = async (responsavel: ResponsavelComVinculo) => {
    if (window.confirm('Tem certeza que deseja remover este responsável desta empresa?')) {
      try {
        const vinculoId = responsavel.vinculo.id
        await deleteResponsavelCliente(vinculoId)
      } catch (err) {
        console.error('Erro ao deletar vínculo:', err)
      }
    }
  }

  // Formatação de dados
  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatTelefone = (telefone: string) => {
    if (!telefone) return ''
    return telefone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3')
  }

  const getStatusColor = (status: string) => {
    const colors = {
      ativo: 'bg-green-100 text-green-800',
      inativo: 'bg-gray-100 text-gray-800',
      suspenso: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || colors.ativo
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Carregando responsáveis...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Responsáveis - {clienteNome}
              </CardTitle>
              <CardDescription>
                Gerencie os responsáveis que terão acesso ao sistema desta empresa
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleTestConnection}
                className="text-gray-600"
              >
                <Settings className="w-4 h-4 mr-2" />
                Testar Conexão
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Adicionar Responsável
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingVinculo ? 'Editar Responsável' : 'Adicionar Responsável'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingVinculo 
                        ? 'Atualize as informações do responsável para esta empresa' 
                        : 'Adicione um novo responsável ou vincule um existente a esta empresa'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="Nome completo"
                        disabled={!!editingVinculo}
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
                        disabled={!!editingVinculo}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value.replace(/\D/g, '') }))}
                        placeholder="000.000.000-00"
                        maxLength={11}
                        disabled={!!editingVinculo}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                        disabled={!!editingVinculo}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cargo">Cargo *</Label>
                      <Input
                        id="cargo"
                        value={formData.cargo}
                        onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                        placeholder="Ex: Diretor, Gerente, Sócio"
                      />
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
                  </div>
                  
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <Label className="text-base font-medium">Permissões de Acesso</Label>
                      <div className="grid grid-cols-1 gap-4 mt-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label htmlFor="perm-documentos">Visualizar Documentos</Label>
                            <p className="text-sm text-gray-500">Permite ver a lista de documentos</p>
                          </div>
                          <Switch
                            id="perm-documentos"
                            checked={formData.permissoes.documentos}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, permissoes: { ...prev.permissoes, documentos: checked } }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label htmlFor="perm-download">Fazer Download</Label>
                            <p className="text-sm text-gray-500">Permite baixar documentos</p>
                          </div>
                          <Switch
                            id="perm-download"
                            checked={formData.permissoes.download}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, permissoes: { ...prev.permissoes, download: checked } }))}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label htmlFor="perm-notificacoes">Receber Notificações</Label>
                            <p className="text-sm text-gray-500">Recebe emails sobre novos documentos</p>
                          </div>
                          <Switch
                            id="perm-notificacoes"
                            checked={formData.permissoes.notificacoes}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, permissoes: { ...prev.permissoes, notificacoes: checked } }))}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes}
                        onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                        placeholder="Informações adicionais sobre o responsável"
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
                      {isSubmitting ? 'Salvando...' : (editingVinculo ? 'Atualizar' : 'Adicionar')}
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
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Responsáveis Cards */}
      {clienteResponsaveis.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-2">Nenhum responsável cadastrado</p>
            <p className="text-sm text-gray-400">
              Adicione responsáveis que terão acesso ao sistema desta empresa
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clienteResponsaveis.map((responsavel) => {
            const empresaInfo = responsavel.empresas.find(emp => emp.clienteId === clienteId)
            
            if (!empresaInfo) return null
            
            return (
              <Card key={responsavel.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{responsavel.nome.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{responsavel.nome}</h4>
                        <p className="text-sm text-gray-500">{empresaInfo.cargo}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(empresaInfo.status)}>
                      {empresaInfo.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{responsavel.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{formatCpf(responsavel.cpf)}</span>
                    </div>
                    {responsavel.telefone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{formatTelefone(responsavel.telefone)}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span>Permissões:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {empresaInfo.permissoes.documentos && (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Documentos
                        </Badge>
                      )}
                      {empresaInfo.permissoes.download && (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Download
                        </Badge>
                      )}
                      {empresaInfo.permissoes.notificacoes && (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Notificações
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Outras empresas */}
                  {responsavel.empresas.length > 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span>Outras empresas ({responsavel.empresas.length - 1}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {responsavel.empresas
                          .filter(emp => emp.clienteId !== clienteId)
                          .slice(0, 2)
                          .map((emp, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {emp.clienteNome}
                            </Badge>
                          ))}
                        {responsavel.empresas.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{responsavel.empresas.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(responsavel)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(responsavel)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}