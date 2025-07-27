'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { useToast } from '@/hooks/use-toast'
import { 
  Calendar, 
  Building2, 
  FileText, 
  Sparkles, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Zap,
  Search,
  Plus
} from 'lucide-react'

interface ObligationFormData {
  codigo: string
  nome: string
  descricao: string
  tipo: string
  tipoObrigacao: string
  periodicidade: string
  prioridade: string
  responsavel: string
  cliente: string
  observacoes: string
  categoria: string
  orgaoDestino: string
  sistemaEnvio: string
  diasAlerta: number
  recorrente: boolean
  diaVencimento: string
}

interface QuickObligationFormProps {
  formData: ObligationFormData
  setFormData: (data: ObligationFormData) => void
  onSubmit: () => void
  onCancel: () => void
  funcionarios: string[]
  isLoading?: boolean
  empresas?: any[]
  empresasLoading?: boolean
}

// Templates predefinidos de obrigações mais comuns
const OBLIGATION_TEMPLATES = [
  {
    id: 'darf',
    codigo: 'DARF',
    nome: 'DARF - Documento de Arrecadação de Receitas Federais',
    descricao: 'Recolhimento de impostos federais (IRPJ, CSLL, PIS, COFINS, etc.)',
    tipo: 'federal',
    periodicidade: 'mensal',
    categoria: 'pagamento',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'e-CAC',
    prioridade: 'alta',
    icon: '💰'
  },
  {
    id: 'gfip',
    codigo: 'GFIP',
    nome: 'GFIP - Guia de Recolhimento do FGTS e Informações à Previdência Social',
    descricao: 'Declaração mensal de informações trabalhistas e previdenciárias',
    tipo: 'federal',
    periodicidade: 'mensal',
    categoria: 'informacao',
    orgaoDestino: 'Caixa Econômica Federal',
    sistemaEnvio: 'Conectividade Social',
    prioridade: 'critica',
    icon: '🏢'
  },
  {
    id: 'defis',
    codigo: 'DEFIS',
    nome: 'DEFIS - Declaração de Informações Socioeconômicas e Fiscais',
    descricao: 'Declaração anual do Simples Nacional',
    tipo: 'federal',
    periodicidade: 'anual',
    categoria: 'declaracao',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'Portal do Simples Nacional',
    prioridade: 'critica',
    icon: '📊'
  },
  {
    id: 'das',
    codigo: 'DAS',
    nome: 'DAS - Documento de Arrecadação do Simples Nacional',
    descricao: 'Guia de recolhimento unificado do Simples Nacional',
    tipo: 'federal',
    periodicidade: 'mensal',
    categoria: 'pagamento',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'Portal do Simples Nacional',
    prioridade: 'critica',
    icon: '💳'
  },
  {
    id: 'esocial',
    codigo: 'eSocial',
    nome: 'eSocial - Sistema de Escrituração Digital das Obrigações Fiscais',
    descricao: 'Transmissão de eventos trabalhistas, previdenciários e fiscais',
    tipo: 'federal',
    periodicidade: 'mensal',
    categoria: 'informacao',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'Portal eSocial',
    prioridade: 'critica',
    icon: '👥'
  },
  {
    id: 'ecd',
    codigo: 'ECD',
    nome: 'ECD - Escrituração Contábil Digital',
    descricao: 'Escrituração digital da contabilidade empresarial',
    tipo: 'federal',
    periodicidade: 'anual',
    categoria: 'declaracao',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'Receitanet',
    prioridade: 'alta',
    icon: '📚'
  }
]

export default function QuickObligationForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel,
  funcionarios,
  isLoading = false,
  empresas = [],
  empresasLoading = false
}: QuickObligationFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const { toast } = useToast()

  // Debug log para empresas
  useEffect(() => {
    console.log('QuickObligationForm - Estado das empresas recebidas como props:', {
      empresasLoading,
      empresasCount: empresas.length,
      empresas: empresas.map(e => ({ id: e.id, razaoSocial: e.razaoSocial }))
    })
  }, [empresas, empresasLoading])

  // Auto-preenchimento baseado no código
  useEffect(() => {
    if (formData.codigo && formData.codigo.length >= 3) {
      const template = OBLIGATION_TEMPLATES.find(
        t => t.codigo.toLowerCase().includes(formData.codigo.toLowerCase())
      )
      
      if (template && !selectedTemplate) {
        setSelectedTemplate(template.id)
        toast({
          title: "🎯 Auto-preenchimento ativado!",
          description: `Template "${template.nome}" detectado e aplicado automaticamente.`,
        })
      }
    }
  }, [formData.codigo, selectedTemplate, toast])

  const applyTemplate = (template: typeof OBLIGATION_TEMPLATES[0]) => {
    setFormData({
      ...formData,
      codigo: template.codigo,
      nome: template.nome,
      descricao: template.descricao,
      tipo: template.tipo,
      periodicidade: template.periodicidade,
      categoria: template.categoria,
      orgaoDestino: template.orgaoDestino,
      sistemaEnvio: template.sistemaEnvio,
      prioridade: template.prioridade
    })
    setSelectedTemplate(template.id)
    setCurrentStep(2)
    
    toast({
      title: "✨ Template aplicado!",
      description: `Dados preenchidos automaticamente para ${template.codigo}`,
    })
  }

  const filteredTemplates = OBLIGATION_TEMPLATES.filter(template =>
    template.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica': return 'bg-red-100 text-red-800 border-red-200'
      case 'alta': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'baixa': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critica': return <AlertTriangle className="w-4 h-4" />
      case 'alta': return <Clock className="w-4 h-4" />
      case 'media': return <FileText className="w-4 h-4" />
      case 'baixa': return <CheckCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1: return !!formData.codigo && !!formData.nome
      case 2: return !!formData.tipo && !!formData.periodicidade
      case 3: return !!formData.responsavel
      default: return false
    }
  }

  const canProceedToNext = (step: number) => {
    return isStepComplete(step)
  }

  return (
    <div className="w-full space-y-6">
      {/* Header com progresso */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-600" />
            Cadastro Inteligente de Obrigação
          </h2>
          <p className="text-slate-600 mt-1">Sistema automático com templates predefinidos</p>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center space-x-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep === step 
                  ? 'bg-violet-600 text-white' 
                  : isStepComplete(step)
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-200 text-slate-600'
                }`}>
                {isStepComplete(step) && currentStep !== step ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step
                )}
              </div>
              {step < 3 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  isStepComplete(step) ? 'bg-green-500' : 'bg-slate-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Template Selection & Basic Info */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50">
            <CardHeader>
              <CardTitle className="text-violet-700 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Templates Inteligentes
              </CardTitle>
              <CardDescription>
                Escolha um template para preenchimento automático ou digite o código manualmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Templates */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Busque por código ou nome da obrigação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-violet-200 focus:border-violet-400"
                />
              </div>

              {/* Template Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {filteredTemplates.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedTemplate === template.id 
                        ? 'ring-2 ring-violet-500 bg-violet-50' 
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => applyTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{template.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800">{template.codigo}</h4>
                            <p className="text-sm text-slate-600 line-clamp-2">{template.nome}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getPriorityColor(template.prioridade)}>
                                {getPriorityIcon(template.prioridade)}
                                {template.prioridade}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {template.periodicidade}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Manual Input */}
              <div className="space-y-4">
                <h4 className="font-medium text-slate-700 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Ou preencha manualmente
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codigo">Código da Obrigação *</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                      placeholder="Ex: DARF, GFIP, DAS..."
                      className="font-mono uppercase"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="federal">🏛️ Federal</SelectItem>
                        <SelectItem value="estadual">🏢 Estadual</SelectItem>
                        <SelectItem value="municipal">🏙️ Municipal</SelectItem>
                        <SelectItem value="trabalhista">👥 Trabalhista</SelectItem>
                        <SelectItem value="previdenciaria">🛡️ Previdenciária</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="nome">Nome da Obrigação *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo da obrigação fiscal"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToNext(1)}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Próximo: Configurações
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Configuration Details */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Configurações da Obrigação
              </CardTitle>
              <CardDescription>
                Configure periodicidade, prioridade e detalhes técnicos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição detalhada da obrigação"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="periodicidade">Periodicidade *</Label>
                  <Select value={formData.periodicidade} onValueChange={(value) => setFormData({ ...formData, periodicidade: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">📅 Mensal</SelectItem>
                      <SelectItem value="bimestral">📅 Bimestral</SelectItem>
                      <SelectItem value="trimestral">📅 Trimestral</SelectItem>
                      <SelectItem value="semestral">📅 Semestral</SelectItem>
                      <SelectItem value="anual">📅 Anual</SelectItem>
                      <SelectItem value="conforme_movimento">🔄 Conforme Movimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="prioridade">Prioridade *</Label>
                  <Select value={formData.prioridade} onValueChange={(value) => setFormData({ ...formData, prioridade: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">🟢 Baixa</SelectItem>
                      <SelectItem value="media">🟡 Média</SelectItem>
                      <SelectItem value="alta">🟠 Alta</SelectItem>
                      <SelectItem value="critica">🔴 Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="declaracao">📋 Declaração</SelectItem>
                      <SelectItem value="pagamento">💰 Pagamento</SelectItem>
                      <SelectItem value="informacao">📊 Informação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orgaoDestino">Órgão Destino</Label>
                  <Input
                    id="orgaoDestino"
                    value={formData.orgaoDestino}
                    onChange={(e) => setFormData({ ...formData, orgaoDestino: e.target.value })}
                    placeholder="Ex: Receita Federal, SEFAZ..."
                  />
                </div>
                <div>
                  <Label htmlFor="sistemaEnvio">Sistema de Envio</Label>
                  <Input
                    id="sistemaEnvio"
                    value={formData.sistemaEnvio}
                    onChange={(e) => setFormData({ ...formData, sistemaEnvio: e.target.value })}
                    placeholder="Ex: e-CAC, GFIP, Portal..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="diaVencimento">Dia do Vencimento</Label>
                <Input
                  id="diaVencimento"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.diaVencimento}
                  onChange={(e) => setFormData({ ...formData, diaVencimento: e.target.value })}
                  placeholder="Dia do mês para vencimento"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Voltar
            </Button>
            <Button 
              onClick={() => setCurrentStep(3)}
              disabled={!canProceedToNext(2)}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Próximo: Responsável
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Assignment & Final Details */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Atribuição e Finalização
              </CardTitle>
              <CardDescription>
                Defina responsável, cliente e observações finais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responsavel">Responsável *</Label>
                  <Select value={formData.responsavel} onValueChange={(value) => setFormData({ ...formData, responsavel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionarios.length > 0 ? funcionarios.map((funcionario) => (
                        <SelectItem key={funcionario} value={funcionario}>
                          👤 {funcionario}
                        </SelectItem>
                      )) : (
                        <SelectItem value="Equipe Fiscal">👥 Equipe Fiscal</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="diasAlerta">Dias de Alerta</Label>
                  <Select value={String(formData.diasAlerta)} onValueChange={(value) => setFormData({ ...formData, diasAlerta: Number(value) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione os dias de alerta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">⚡ 1 dia</SelectItem>
                      <SelectItem value="3">🟡 3 dias</SelectItem>
                      <SelectItem value="5">🟠 5 dias</SelectItem>
                      <SelectItem value="7">🔴 7 dias</SelectItem>
                      <SelectItem value="15">⏰ 15 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="cliente">Cliente/Empresa</Label>
                <Select value={formData.cliente} onValueChange={(value) => setFormData({ ...formData, cliente: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      empresasLoading 
                        ? "Carregando empresas..." 
                        : empresas.length === 0 
                        ? "Nenhuma empresa encontrada" 
                        : "Selecione a empresa (opcional)"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {empresasLoading ? (
                      <div className="p-4 text-center text-slate-500">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-400 mx-auto mb-2" />
                        <p className="text-sm">Carregando empresas...</p>
                      </div>
                    ) : empresas.length > 0 ? (
                      <>
                        <div className="px-2 py-1 text-xs text-slate-500 font-medium border-b">
                          {empresas.length} empresa(s) encontrada(s)
                        </div>
                        {empresas.map((empresa) => (
                          <SelectItem key={empresa.id} value={empresa.razaoSocial}>
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-600">🏢</span>
                              <div>
                                <p className="font-medium">{empresa.razaoSocial}</p>
                                {empresa.cnpj && (
                                  <p className="text-xs text-slate-500">{empresa.cnpj}</p>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    ) : (
                      <div className="p-4 text-center text-slate-500">
                        <div className="text-2xl mb-2">🏢</div>
                        <p className="text-sm font-medium">Nenhuma empresa cadastrada</p>
                        <p className="text-xs mt-1">
                          Cadastre empresas no sistema para vincular às obrigações
                        </p>
                      </div>
                    )}
                  </SelectContent>
                </Select>
                
                {/* Debug info - remove after testing */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-1 text-xs text-slate-400">
                    Debug: {empresasLoading ? 'Loading...' : `${empresas.length} empresas`}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais, instruções especiais, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Resumo da Obrigação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-600">Código:</span>
                  <span className="ml-2 font-mono bg-white px-2 py-1 rounded">{formData.codigo || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-600">Tipo:</span>
                  <span className="ml-2 capitalize">{formData.tipo || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-600">Periodicidade:</span>
                  <span className="ml-2 capitalize">{formData.periodicidade || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-600">Prioridade:</span>
                  <Badge className={getPriorityColor(formData.prioridade)}>
                    {formData.prioridade || 'N/A'}
                  </Badge>
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium text-slate-600">Responsável:</span>
                  <span className="ml-2">{formData.responsavel || 'Não definido'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Voltar
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button 
                onClick={onSubmit}
                disabled={!canProceedToNext(3) || isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Criar Obrigação
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}