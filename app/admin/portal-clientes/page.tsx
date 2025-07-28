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
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useClientes, Cliente } from '@/hooks/useClientes'

// Ícones
import { 
  User, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Shield,
  Building2,
  Mail,
  Phone,
  CheckCircle,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react'

// Tipos simplificados
interface ResponsavelSimplificado {
  id: string
  nome: string
  cpf: string
  email: string
  telefone: string
  status: 'ativo' | 'inativo'
  senha: string
  senhaInicial: boolean
  empresasIds: string[]
  dataCriacao: Date
  ultimoAcesso?: Date
}

interface EmpresaCliente {
  id: string
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
}

// Função para converter Cliente para EmpresaCliente
const clienteToEmpresa = (cliente: Cliente): EmpresaCliente => ({
  id: cliente.id,
  cnpj: cliente.cpfCnpj,
  razaoSocial: cliente.nome,
  nomeFantasia: cliente.nome
})

// Função para gerar senha aleatória
const generateRandomPassword = (length: number = 8): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

// Função para formatar CPF
const formatCPF = (value: string) => {
  const numericValue = value.replace(/\D/g, '')
  let formattedCpf = numericValue
  if (numericValue.length > 3) {
    formattedCpf = numericValue.substring(0, 3) + '.' + numericValue.substring(3)
  }
  if (numericValue.length > 6) {
    formattedCpf = numericValue.substring(0, 3) + '.' + 
                  numericValue.substring(3, 6) + '.' + 
                  numericValue.substring(6)
  }
  if (numericValue.length > 9) {
    formattedCpf = numericValue.substring(0, 3) + '.' + 
                  numericValue.substring(3, 6) + '.' + 
                  numericValue.substring(6, 9) + '-' + 
                  numericValue.substring(9, 11)
  }
  return formattedCpf
}

export default function GestaoPortalClientesPage() {
  // Hook para carregar clientes/empresas reais
  const { clientes, loading: loadingClientes } = useClientes()
  
  // Estados principais
  const [responsaveis, setResponsaveis] = useState<ResponsavelSimplificado[]>([])
  const [selectedResponsavel, setSelectedResponsavel] = useState<ResponsavelSimplificado | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estados dos modais
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEmpresasDialogOpen, setIsEmpresasDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [senhaGeradaExibir, setSenhaGeradaExibir] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    status: 'ativo' as 'ativo' | 'inativo',
    empresasIds: [] as string[]
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Converter clientes para empresas (apenas pessoa jurídica)
  const empresasDisponiveis = clientes
    .filter(cliente => cliente.tipoCliente === 'pessoa_juridica' && cliente.status === 'ativo')
    .map(clienteToEmpresa)

  // Carregar dados do localStorage
  useEffect(() => {
    const loadResponsaveis = () => {
      try {
        const saved = localStorage.getItem('portal_responsaveis')
        if (saved) {
          const data = JSON.parse(saved)
          
          // Consolidar responsáveis por CPF (remover duplicatas)
          const responsaveisConsolidados = new Map<string, ResponsavelSimplificado>()
          
          data.forEach((r: any) => {
            const cpfNumerico = r.cpf.replace(/\D/g, '')
            
            if (responsaveisConsolidados.has(cpfNumerico)) {
              // Adicionar empresa ao existente
              const existing = responsaveisConsolidados.get(cpfNumerico)!
              if (r.empresaId && !existing.empresasIds.includes(r.empresaId)) {
                existing.empresasIds.push(r.empresaId)
              }
              if (r.empresas) {
                r.empresas.forEach((emp: any) => {
                  if (!existing.empresasIds.includes(emp.id)) {
                    existing.empresasIds.push(emp.id)
                  }
                })
              }
              if (r.empresasIds) {
                r.empresasIds.forEach((empId: string) => {
                  if (!existing.empresasIds.includes(empId)) {
                    existing.empresasIds.push(empId)
                  }
                })
              }
            } else {
              // Criar novo responsável consolidado
              const empresasIds: string[] = []
              
              if (r.empresaId) empresasIds.push(r.empresaId)
              if (r.empresas) {
                r.empresas.forEach((emp: any) => {
                  if (!empresasIds.includes(emp.id)) {
                    empresasIds.push(emp.id)
                  }
                })
              }
              if (r.empresasIds) {
                r.empresasIds.forEach((empId: string) => {
                  if (!empresasIds.includes(empId)) {
                    empresasIds.push(empId)
                  }
                })
              }
              
              responsaveisConsolidados.set(cpfNumerico, {
                id: r.id,
                nome: r.nome,
                cpf: r.cpf,
                email: r.email,
                telefone: r.telefone,
                status: r.status,
                senha: r.senha,
                senhaInicial: r.senhaInicial,
                empresasIds,
                dataCriacao: new Date(r.dataCriacao),
                ultimoAcesso: r.ultimoAcesso ? new Date(r.ultimoAcesso) : undefined
              })
            }
          })
          
          setResponsaveis(Array.from(responsaveisConsolidados.values()))
          console.log('Responsáveis consolidados carregados:', responsaveisConsolidados.size)
        }
      } catch (error) {
        console.error('Erro ao carregar responsáveis:', error)
        setResponsaveis([])
      }
    }
    
    loadResponsaveis()
  }, [])

  // Salvar responsáveis no formato compatível com o portal
  const salvarResponsaveis = (responsaveisAtualizado: ResponsavelSimplificado[]) => {
    try {
      // Converter para formato expandido compatível com portal
      const responsaveisExpandidos: any[] = []
      
      responsaveisAtualizado.forEach(resp => {
        resp.empresasIds.forEach(empresaId => {
          const empresa = empresasDisponiveis.find(e => e.id === empresaId)
          if (empresa) {
            responsaveisExpandidos.push({
              id: `${resp.id}_${empresaId}`,
              nome: resp.nome,
              cpf: resp.cpf,
              email: resp.email,
              telefone: resp.telefone,
              status: resp.status,
              senha: resp.senha,
              senhaInicial: resp.senhaInicial,
              empresasIds: [empresaId],
              empresas: [empresa],
              dataCriacao: resp.dataCriacao,
              ultimoAcesso: resp.ultimoAcesso,
              
              // Campos de compatibilidade com portal
              empresaId: empresa.id,
              empresaNome: empresa.razaoSocial,
              empresaCnpj: empresa.cnpj
            })
          }
        })
      })
      
      localStorage.setItem('portal_responsaveis', JSON.stringify(responsaveisExpandidos))
      console.log('Responsáveis salvos no formato expandido:', responsaveisExpandidos.length)
      
    } catch (error) {
      console.error('Erro ao salvar responsáveis:', error)
    }
  }

  // Filtrar responsáveis
  const filteredResponsaveis = responsaveis.filter(responsavel => {
    if (!searchTerm) return true
    const termo = searchTerm.toLowerCase()
    return (
      responsavel.nome.toLowerCase().includes(termo) ||
      responsavel.email.toLowerCase().includes(termo) ||
      responsavel.cpf.includes(searchTerm)
    )
  })

  // Criar responsável
  const handleCreateResponsavel = async () => {
    if (!formData.nome || !formData.cpf || !formData.email || !formData.telefone) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (formData.empresasIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa')
      return
    }

    setIsSubmitting(true)

    try {
      // Verificar se CPF ou email já existe
      const cpfNumeros = formData.cpf.replace(/\D/g, '')
      const cpfExists = responsaveis.some(r => r.cpf.replace(/\D/g, '') === cpfNumeros)
      const emailExists = responsaveis.some(r => r.email === formData.email)

      if (cpfExists) {
        toast.error('CPF já cadastrado')
        return
      }

      if (emailExists) {
        toast.error('Email já cadastrado')
        return
      }

      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Gerar senha
      const senhaGerada = generateRandomPassword()

      // Criar responsável
      const novoResponsavel: ResponsavelSimplificado = {
        id: `resp_${Date.now()}`,
        nome: formData.nome,
        cpf: formData.cpf,
        email: formData.email,
        telefone: formData.telefone,
        status: formData.status,
        senha: senhaGerada,
        senhaInicial: true,
        empresasIds: [...formData.empresasIds],
        dataCriacao: new Date()
      }

      const novosResponsaveis = [...responsaveis, novoResponsavel]
      setResponsaveis(novosResponsaveis)
      salvarResponsaveis(novosResponsaveis)

      setSenhaGeradaExibir(senhaGerada)
      setIsCreateDialogOpen(false)
      
      // Reset form
      setFormData({
        nome: '',
        cpf: '',
        email: '',
        telefone: '',
        status: 'ativo',
        empresasIds: []
      })

      toast.success('Responsável criado com sucesso!')

    } catch (error) {
      console.error('Erro ao criar responsável:', error)
      toast.error('Erro ao criar responsável')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Editar responsável
  const handleEditResponsavel = (responsavel: ResponsavelSimplificado) => {
    setSelectedResponsavel(responsavel)
    setFormData({
      nome: responsavel.nome,
      cpf: responsavel.cpf,
      email: responsavel.email,
      telefone: responsavel.telefone,
      status: responsavel.status,
      empresasIds: [...responsavel.empresasIds]
    })
    setIsEditDialogOpen(true)
  }

  // Salvar edição do responsável
  const handleSaveEditResponsavel = async () => {
    if (!selectedResponsavel || !formData.nome || !formData.cpf || !formData.email || !formData.telefone) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (formData.empresasIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa')
      return
    }

    setIsSubmitting(true)

    try {
      // Verificar se CPF ou email já existe (exceto o próprio responsável)
      const cpfNumeros = formData.cpf.replace(/\D/g, '')
      const cpfExists = responsaveis.some(r => 
        r.id !== selectedResponsavel.id && r.cpf.replace(/\D/g, '') === cpfNumeros
      )
      const emailExists = responsaveis.some(r => 
        r.id !== selectedResponsavel.id && r.email === formData.email
      )

      if (cpfExists) {
        toast.error('CPF já cadastrado para outro responsável')
        return
      }

      if (emailExists) {
        toast.error('Email já cadastrado para outro responsável')
        return
      }

      await new Promise(resolve => setTimeout(resolve, 500))

      const responsaveisAtualizados = responsaveis.map(r => 
        r.id === selectedResponsavel.id 
          ? { 
              ...r, 
              nome: formData.nome,
              cpf: formData.cpf,
              email: formData.email,
              telefone: formData.telefone,
              status: formData.status,
              empresasIds: [...formData.empresasIds]
            }
          : r
      )

      setResponsaveis(responsaveisAtualizados)
      salvarResponsaveis(responsaveisAtualizados)
      
      setIsEditDialogOpen(false)
      setSelectedResponsavel(null)
      
      toast.success('Responsável atualizado com sucesso!')

    } catch (error) {
      console.error('Erro ao editar responsável:', error)
      toast.error('Erro ao editar responsável')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Ver empresas do responsável
  const handleVerEmpresas = (responsavel: ResponsavelSimplificado) => {
    setSelectedResponsavel(responsavel)
    setFormData({
      nome: responsavel.nome,
      cpf: responsavel.cpf,
      email: responsavel.email,
      telefone: responsavel.telefone,
      status: responsavel.status,
      empresasIds: [...responsavel.empresasIds]
    })
    setIsEmpresasDialogOpen(true)
  }

  // Atualizar empresas do responsável
  const handleUpdateEmpresas = async () => {
    if (!selectedResponsavel || formData.empresasIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa')
      return
    }

    setIsSubmitting(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      const responsaveisAtualizados = responsaveis.map(r => 
        r.id === selectedResponsavel.id 
          ? { ...r, empresasIds: [...formData.empresasIds] }
          : r
      )

      setResponsaveis(responsaveisAtualizados)
      salvarResponsaveis(responsaveisAtualizados)
      
      setIsEmpresasDialogOpen(false)
      setSelectedResponsavel(null)
      
      toast.success('Empresas atualizadas com sucesso!')

    } catch (error) {
      console.error('Erro ao atualizar empresas:', error)
      toast.error('Erro ao atualizar empresas')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Resetar senha
  const handleResetPassword = async (responsavel: ResponsavelSimplificado) => {
    try {
      const novaSenha = generateRandomPassword()
      
      const responsaveisAtualizados = responsaveis.map(r => 
        r.id === responsavel.id 
          ? { ...r, senha: novaSenha, senhaInicial: true }
          : r
      )
      
      setResponsaveis(responsaveisAtualizados)
      salvarResponsaveis(responsaveisAtualizados)
      
      setSenhaGeradaExibir(novaSenha)
      
      toast.success('Nova senha gerada com sucesso!')
      
    } catch (error) {
      console.error('Erro ao resetar senha:', error)
      toast.error('Erro ao resetar senha')
    }
  }

  // Deletar responsável
  const handleDeleteResponsavel = (id: string, nome: string) => {
    const responsaveisAtualizados = responsaveis.filter(r => r.id !== id)
    setResponsaveis(responsaveisAtualizados)
    
    if (responsaveisAtualizados.length === 0) {
      localStorage.removeItem('portal_responsaveis')
    } else {
      salvarResponsaveis(responsaveisAtualizados)
    }
    
    toast.success(`Responsável "${nome}" excluído com sucesso`)
  }

  // Limpar todos os dados
  const handleClearAllData = () => {
    localStorage.removeItem('portal_responsaveis')
    localStorage.removeItem('portal_responsavel_auth')
    localStorage.removeItem('portal_client_auth')
    setResponsaveis([])
    toast.success('Todos os dados foram removidos')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Portal do Cliente - Administração
              </h1>
              <p className="text-gray-600">
                Gerencie os responsáveis e suas empresas autorizadas
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Responsável
              </Button>

              {responsaveis.length > 0 && (
                <Button 
                  onClick={handleClearAllData}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Dados
                </Button>
              )}
            </div>
          </div>

          {/* Pesquisa */}
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Pesquisar por nome, email ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Instruções de uso */}
          {responsaveis.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">💡 Como adicionar novas empresas a responsáveis existentes</h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Quando você cadastrar uma nova empresa no sistema, pode facilmente dar acesso a qualquer responsável já existente:
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <div className="bg-white border border-blue-200 rounded px-2 py-1 flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span>Clique no botão <strong>"Empresas"</strong> do responsável</span>
                    </div>
                    <div className="bg-white border border-blue-200 rounded px-2 py-1 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>Selecione as novas empresas</span>
                    </div>
                    <div className="bg-white border border-blue-200 rounded px-2 py-1 flex items-center gap-1">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      <span>Clique <strong>"Salvar Empresas"</strong></span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    ✅ <strong>Sem nova senha:</strong> O responsável usa a mesma senha para acessar todas as empresas autorizadas!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Responsáveis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Responsáveis Cadastrados ({filteredResponsaveis.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredResponsaveis.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'Nenhum responsável encontrado' : 'Nenhum responsável cadastrado'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? 'Tente alterar os termos de pesquisa' : 'Comece cadastrando o primeiro responsável'}
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Cadastrar Primeiro Responsável
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredResponsaveis.map((responsavel) => {
                  const empresasDoResponsavel = empresasDisponiveis.filter(e => 
                    responsavel.empresasIds.includes(e.id)
                  )
                  
                  return (
                    <div key={responsavel.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                              {responsavel.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{responsavel.nome}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="font-mono">{responsavel.cpf}</span>
                              <span className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {responsavel.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {responsavel.telefone}
                              </span>
                            </div>
                            
                            {/* Empresas */}
                            <div className="mt-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm text-gray-600">Empresas ({empresasDoResponsavel.length}):</span>
                                {empresasDoResponsavel.slice(0, 2).map((empresa) => (
                                  <Badge key={empresa.id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    <Building2 className="w-3 h-3 mr-1" />
                                    {empresa.nomeFantasia}
                                  </Badge>
                                ))}
                                {empresasDoResponsavel.length > 2 && (
                                  <Badge variant="outline" className="bg-gray-50 text-gray-600">
                                    +{empresasDoResponsavel.length - 2} mais
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={responsavel.status === 'ativo' ? 'default' : 'secondary'}>
                            {responsavel.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </Badge>
                          
                          {responsavel.senhaInicial && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                              <Key className="w-3 h-3 mr-1" />
                              Senha Inicial
                            </Badge>
                          )}
                          
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerEmpresas(responsavel)}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              title="Gerenciar empresas autorizadas"
                            >
                              <Building2 className="w-4 h-4 mr-1" />
                              <span className="text-xs">Empresas</span>
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditResponsavel(responsavel)}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                              title="Editar dados pessoais"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              <span className="text-xs">Editar</span>
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResetPassword(responsavel)}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50"
                              title="Gerar nova senha"
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              <span className="text-xs">Senha</span>
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteResponsavel(responsavel.id, responsavel.nome)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              title="Excluir responsável"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog - Criar Responsável */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Cadastrar Novo Responsável
              </DialogTitle>
              <DialogDescription>
                Crie um novo responsável que terá acesso ao portal do cliente. Você pode adicionar ou remover empresas depois sem alterar a senha.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {/* Alerta sobre funcionalidade */}
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Flexibilidade:</strong> Após criar o responsável, você pode facilmente adicionar novas empresas usando o botão "Empresas" sem precisar criar nova senha ou novo cadastro.
                </AlertDescription>
              </Alert>

              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Dados Pessoais
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({...prev, nome: e.target.value}))}
                      placeholder="Nome completo"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData(prev => ({...prev, cpf: formatCPF(e.target.value)}))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="mt-1"
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
                      placeholder="usuario@empresa.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData(prev => ({...prev, telefone: e.target.value}))}
                      placeholder="(11) 99999-9999"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Seleção de Empresas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    Empresas Iniciais *
                  </h3>
                  <div className="text-xs text-gray-500">
                    Pode adicionar mais depois
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {loadingClientes ? (
                    <div className="text-center py-4">Carregando empresas...</div>
                  ) : empresasDisponiveis.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Nenhuma empresa disponível
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2 text-xs text-gray-600">
                        <span>Selecione pelo menos uma empresa:</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6 px-2"
                          onClick={() => {
                            if (formData.empresasIds.length === empresasDisponiveis.length) {
                              // Desmarcar todas
                              setFormData(prev => ({...prev, empresasIds: []}))
                            } else {
                              // Marcar todas
                              setFormData(prev => ({
                                ...prev,
                                empresasIds: empresasDisponiveis.map(e => e.id)
                              }))
                            }
                          }}
                        >
                          {formData.empresasIds.length === empresasDisponiveis.length ? 'Desmarcar Todas' : 'Marcar Todas'}
                        </Button>
                      </div>
                      
                      {empresasDisponiveis.map((empresa) => (
                        <div key={empresa.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            id={`empresa-${empresa.id}`}
                            checked={formData.empresasIds.includes(empresa.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  empresasIds: [...prev.empresasIds, empresa.id]
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  empresasIds: prev.empresasIds.filter(id => id !== empresa.id)
                                }))
                              }
                            }}
                          />
                          <label htmlFor={`empresa-${empresa.id}`} className="flex-1 cursor-pointer">
                            <div className="font-medium text-sm">{empresa.nomeFantasia}</div>
                            <div className="text-xs text-gray-500">{empresa.cnpj}</div>
                          </label>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                
                {formData.empresasIds.length > 0 && (
                  <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-2">
                    ✓ {formData.empresasIds.length} empresa(s) selecionada(s) - Você pode alterar depois!
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateResponsavel}
                disabled={isSubmitting || formData.empresasIds.length === 0}
                className="bg-gradient-to-r from-blue-600 to-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Salvar Responsável
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog - Gerenciar Empresas */}
        <Dialog open={isEmpresasDialogOpen} onOpenChange={setIsEmpresasDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Gerenciar Empresas - {selectedResponsavel?.nome}
              </DialogTitle>
              <DialogDescription>
                Selecione quais empresas este responsável pode acessar no portal.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-800">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{selectedResponsavel?.nome}</span>
                  <span className="text-sm">({selectedResponsavel?.cpf})</span>
                </div>
              </div>

              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                {empresasDisponiveis.map((empresa) => (
                  <div key={empresa.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id={`edit-empresa-${empresa.id}`}
                      checked={formData.empresasIds.includes(empresa.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            empresasIds: [...prev.empresasIds, empresa.id]
                          }))
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            empresasIds: prev.empresasIds.filter(id => id !== empresa.id)
                          }))
                        }
                      }}
                    />
                    <label htmlFor={`edit-empresa-${empresa.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium text-sm">{empresa.nomeFantasia}</div>
                      <div className="text-xs text-gray-500">{empresa.cnpj}</div>
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-gray-600 bg-gray-50 border rounded p-2">
                {formData.empresasIds.length} empresa(s) selecionada(s)
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
              <Button variant="outline" onClick={() => setIsEmpresasDialogOpen(false)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateEmpresas}
                disabled={isSubmitting || formData.empresasIds.length === 0}
                className="bg-gradient-to-r from-blue-600 to-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Salvar Empresas
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog - Editar Responsável */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Editar Responsável - {selectedResponsavel?.nome}
              </DialogTitle>
              <DialogDescription>
                Atualize os dados pessoais e empresas do responsável. A senha permanece a mesma.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {/* Alerta sobre senha */}
              <Alert className="bg-blue-50 border-blue-200">
                <Shield className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Senha mantida:</strong> A senha atual do responsável será preservada. Use o botão "Senha" na lista para gerar uma nova senha se necessário.
                </AlertDescription>
              </Alert>

              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Dados Pessoais
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-nome">Nome Completo *</Label>
                    <Input
                      id="edit-nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({...prev, nome: e.target.value}))}
                      placeholder="Nome completo"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-cpf">CPF *</Label>
                    <Input
                      id="edit-cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData(prev => ({...prev, cpf: formatCPF(e.target.value)}))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                      placeholder="usuario@empresa.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-telefone">Telefone *</Label>
                    <Input
                      id="edit-telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData(prev => ({...prev, telefone: e.target.value}))}
                      placeholder="(11) 99999-9999"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({...prev, status: value}))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seleção de Empresas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Empresas com Acesso *
                </h3>
                
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {loadingClientes ? (
                    <div className="text-center py-4">Carregando empresas...</div>
                  ) : empresasDisponiveis.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Nenhuma empresa disponível
                    </div>
                  ) : (
                    empresasDisponiveis.map((empresa) => (
                      <div key={empresa.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                          id={`edit-empresa-full-${empresa.id}`}
                          checked={formData.empresasIds.includes(empresa.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData(prev => ({
                                ...prev,
                                empresasIds: [...prev.empresasIds, empresa.id]
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                empresasIds: prev.empresasIds.filter(id => id !== empresa.id)
                              }))
                            }
                          }}
                        />
                        <label htmlFor={`edit-empresa-full-${empresa.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium text-sm">{empresa.nomeFantasia}</div>
                          <div className="text-xs text-gray-500">{empresa.cnpj}</div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
                
                {formData.empresasIds.length > 0 && (
                  <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-2">
                    ✓ {formData.empresasIds.length} empresa(s) selecionada(s)
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveEditResponsavel}
                disabled={isSubmitting || formData.empresasIds.length === 0}
                className="bg-gradient-to-r from-green-600 to-green-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog - Senha Gerada */}
        <Dialog open={!!senhaGeradaExibir} onOpenChange={() => setSenhaGeradaExibir(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                Senha Gerada!
              </DialogTitle>
              <DialogDescription>
                Anote a senha abaixo e repasse ao responsável:
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Key className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Senha Inicial</span>
                </div>
                <div className="bg-white border border-yellow-200 rounded px-4 py-3 mb-3 relative">
                  <span className={`font-mono text-2xl font-bold text-gray-900 tracking-wider select-all ${showPassword ? '' : 'filter blur-sm'}`}>
                    {senhaGeradaExibir}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="text-xs text-yellow-700 space-y-1">
                  <p>• Clique no ícone do olho para revelar/ocultar</p>
                  <p>• O responsável deve alterar no primeiro acesso</p>
                  <p>• Guarde esta informação com segurança</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                onClick={() => setSenhaGeradaExibir(null)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Senha Anotada - Continuar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}