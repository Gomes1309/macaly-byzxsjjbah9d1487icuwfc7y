"use client"

import { useState, useEffect } from 'react'
import { useEmpresas } from '@/hooks/useEmpresas'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Plus, 
  Building2, 
  Loader2, 
  Zap, 
  CheckCircle2, 
  Target, 
  Settings, 
  Building, 
  Clock, 
  Calendar, 
  User, 
  AlertTriangle, 
  Save, 
  ArrowLeft, 
  ArrowRight,
  Sparkles
} from 'lucide-react'

interface ObligationFormData {
  codigo: string
  nome: string
  descricao: string
  tipo: string
  periodicidade: string
  prioridade: string
  responsavel: string
  cliente: string
  observacoes: string
  categoria: string
  orgaoDestino: string
  sistemaEnvio: string
  diasAlerta: string
  recorrente: boolean
  diaVencimento: string
}

interface QuickObrigationFormProps {
  formData: ObligationFormData
  setFormData: (data: ObligationFormData) => void
  onSubmit: () => void
  onCancel: () => void
  funcionarios: string[]
  isLoading?: boolean
}

// Dados pré-definidos para autocompletar
const OBRIGACOES_COMMON = [
  { codigo: 'DARF', nome: 'DARF - Documento de Arrecadação de Receitas Federais', tipo: 'federal', orgao: 'Receita Federal', sistema: 'e-CAC' },
  { codigo: 'GFIP', nome: 'GFIP - Guia de Recolhimento do FGTS', tipo: 'trabalhista', orgao: 'Caixa Econômica Federal', sistema: 'Conectividade Social' },
  { codigo: 'DIRF', nome: 'DIRF - Declaração do Imposto de Renda Retido na Fonte', tipo: 'federal', orgao: 'Receita Federal', sistema: 'PGD - DIRF' },
  { codigo: 'RAIS', nome: 'RAIS - Relação Anual de Informações Sociais', tipo: 'trabalhista', orgao: 'Ministério do Trabalho', sistema: 'RAIS Web' },
  { codigo: 'DCTF', nome: 'DCTF - Declaração de Débitos e Créditos Tributários Federais', tipo: 'federal', orgao: 'Receita Federal', sistema: 'PGD - DCTF' },
  { codigo: 'EFD-CONTRIB', nome: 'EFD-Contribuições', tipo: 'federal', orgao: 'Receita Federal', sistema: 'PVA EFD-Contribuições' },
  { codigo: 'EFD-ICMS', nome: 'EFD-ICMS/IPI', tipo: 'estadual', orgao: 'Secretaria da Fazenda', sistema: 'PVA EFD-ICMS/IPI' },
  { codigo: 'DEFIS', nome: 'DEFIS - Declaração de Informações Socioeconômicas e Fiscais', tipo: 'federal', orgao: 'Receita Federal', sistema: 'Portal do Simples Nacional' },
  { codigo: 'DASN', nome: 'DASN - Declaração Anual do Simples Nacional', tipo: 'federal', orgao: 'Receita Federal', sistema: 'Portal do Simples Nacional' },
  { codigo: 'DES', nome: 'DES - Declaração Eletrônica de Serviços', tipo: 'municipal', orgao: 'Prefeitura Municipal', sistema: 'Portal da Prefeitura' }
]

// Empresas reais serão carregadas via hook useEmpresas

export default function QuickObrigationForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel,
  funcionarios,
  isLoading = false
}: QuickObrigationFormProps) {
  // Load real companies from Supabase
  const { empresas, loading: empresasLoading, error: empresasError } = useEmpresas()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [filteredObrigacoes, setFilteredObrigacoes] = useState(OBRIGACOES_COMMON)
  const [searchTerm, setSearchTerm] = useState('')

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  // Filtrar obrigações baseado na busca
  useEffect(() => {
    if (searchTerm) {
      const filtered = OBRIGACOES_COMMON.filter(obr => 
        obr.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obr.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredObrigacoes(filtered)
    } else {
      setFilteredObrigacoes(OBRIGACOES_COMMON)
    }
  }, [searchTerm])

  // Aplicar template selecionado
  const applyTemplate = (template: any) => {
    console.log('Applying template:', template)
    setSelectedTemplate(template)
    setFormData({
      ...formData,
      codigo: template.codigo,
      nome: template.nome,
      tipo: template.tipo,
      orgaoDestino: template.orgao,
      sistemaEnvio: template.sistema,
      categoria: 'declaracao',
      prioridade: template.tipo === 'federal' ? 'alta' : 'media',
      diasAlerta: '5'
    })
    setCurrentStep(2)
  }

  // Validação do passo atual
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return selectedTemplate !== null || (formData.codigo && formData.nome)
      case 2:
        return formData.periodicidade && formData.diaVencimento && formData.responsavel
      case 3:
        return true // Passo opcional
      default:
        return false
    }
  }

  // Avançar para próximo passo
  const nextStep = () => {
    if (currentStep < totalSteps && isStepValid()) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Voltar para passo anterior
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Finalizar criação
  const handleFinish = () => {
    console.log('Finishing obligation creation:', formData)
    onSubmit()
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" data-macaly="quick-obligation-form">
      {/* Header com progresso */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="bg-gradient-to-r from-blue-500 to-violet-500 p-3 rounded-full">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800" data-macaly="form-title">
              Nova Obrigação Fiscal
            </h2>
            <p className="text-slate-600">Criação rápida e inteligente</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <span className={`flex items-center space-x-1 ${currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <span>Tipo</span>
            </span>
            
            <div className={`w-12 h-1 rounded-full ${currentStep >= 2 ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
            
            <span className={`flex items-center space-x-1 ${currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                {currentStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
              </div>
              <span>Dados</span>
            </span>
            
            <div className={`w-12 h-1 rounded-full ${currentStep >= 3 ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
            
            <span className={`flex items-center space-x-1 ${currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                3
              </div>
              <span>Detalhes</span>
            </span>
          </div>
          
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Passo 1: Seleção de Template */}
      {currentStep === 1 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-blue-700 font-bold text-lg flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Escolha o Tipo de Obrigação</span>
            </CardTitle>
            <CardDescription>
              Selecione um template pré-configurado ou crie do zero
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Barra de busca */}
            <div className="relative">
              <Input
                placeholder="🔍 Buscar obrigação... (ex: DARF, GFIP, DIRF)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-center text-lg py-3 border-2 border-dashed border-slate-300 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Templates populares */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredObrigacoes.map((template, index) => (
                <Card 
                  key={index} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                    selectedTemplate?.codigo === template.codigo ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => applyTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        template.tipo === 'federal' ? 'bg-blue-100 text-blue-600' :
                        template.tipo === 'estadual' ? 'bg-purple-100 text-purple-600' :
                        template.tipo === 'municipal' ? 'bg-green-100 text-green-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-bold text-slate-800">{template.codigo}</h3>
                          <Badge variant="outline" className={
                            template.tipo === 'federal' ? 'text-blue-600 border-blue-300' :
                            template.tipo === 'estadual' ? 'text-purple-600 border-purple-300' :
                            template.tipo === 'municipal' ? 'text-green-600 border-green-300' :
                            'text-orange-600 border-orange-300'
                          }>
                            {template.tipo === 'federal' ? 'Federal' :
                             template.tipo === 'estadual' ? 'Estadual' :
                             template.tipo === 'municipal' ? 'Municipal' : 'Trabalhista'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{template.nome}</p>
                        <p className="text-xs text-slate-500">
                          <strong>Órgão:</strong> {template.orgao}
                        </p>
                      </div>
                      {selectedTemplate?.codigo === template.codigo && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Opção criar do zero */}
            <Separator />
            <Card 
              className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 transition-colors"
              onClick={() => {
                setSelectedTemplate(null)
                setCurrentStep(2)
              }}
            >
              <CardContent className="p-6 text-center">
                <div className="space-y-3">
                  <div className="bg-slate-100 p-3 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-slate-600" />
                  </div>
                  <h3 className="font-bold text-slate-800">Criar do Zero</h3>
                  <p className="text-sm text-slate-600">
                    Configure uma obrigação personalizada com todos os detalhes
                  </p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Passo 2: Dados Essenciais */}
      {currentStep === 2 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-purple-700 font-bold text-lg flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Dados Essenciais</span>
            </CardTitle>
            <CardDescription>
              Configure as informações principais da obrigação
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo" className="text-slate-700 font-medium flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>Código *</span>
                </Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  placeholder="Ex: DARF, GFIP, DIRF"
                  className="border-slate-300 focus:border-blue-500"
                  disabled={selectedTemplate !== null}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-slate-700 font-medium flex items-center space-x-1">
                  <Building className="w-4 h-4" />
                  <span>Nome da Obrigação *</span>
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo da obrigação"
                  className="border-slate-300 focus:border-blue-500"
                  disabled={selectedTemplate !== null}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="periodicidade" className="text-slate-700 font-medium flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Periodicidade *</span>
                </Label>
                <Select value={formData.periodicidade} onValueChange={(value) => setFormData({ ...formData, periodicidade: value })}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500">
                    <SelectValue placeholder="Selecione a periodicidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">📅 Mensal</SelectItem>
                    <SelectItem value="trimestral">📊 Trimestral</SelectItem>
                    <SelectItem value="semestral">📈 Semestral</SelectItem>
                    <SelectItem value="anual">🗓️ Anual</SelectItem>
                    <SelectItem value="conforme_movimento">🔄 Conforme Movimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="diaVencimento" className="text-slate-700 font-medium flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Dia do Vencimento *</span>
                </Label>
                <Select value={formData.diaVencimento} onValueChange={(value) => setFormData({ ...formData, diaVencimento: value })}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500">
                    <SelectValue placeholder="Selecione o dia do vencimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                      <SelectItem key={dia} value={dia.toString()}>
                        📅 Dia {dia}
                      </SelectItem>
                    ))}
                    <SelectItem value="ultimo">📅 Último dia do mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="responsavel" className="text-slate-700 font-medium flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Responsável *</span>
                </Label>
                <Select value={formData.responsavel} onValueChange={(value) => setFormData({ ...formData, responsavel: value })}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500">
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios.length > 0 ? (
                      funcionarios.map((funcionario, index) => (
                        <SelectItem key={index} value={funcionario}>
                          👤 {funcionario}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-slate-500 text-center">
                        ⚠️ Nenhum funcionário cadastrado
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prioridade" className="text-slate-700 font-medium flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Prioridade</span>
                </Label>
                <Select value={formData.prioridade} onValueChange={(value) => setFormData({ ...formData, prioridade: value })}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500">
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">🟢 Baixa</SelectItem>
                    <SelectItem value="media">🟡 Média</SelectItem>
                    <SelectItem value="alta">🟠 Alta</SelectItem>
                    <SelectItem value="critica">🔴 Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedTemplate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Template Aplicado</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <p><strong>Órgão:</strong> {formData.orgaoDestino}</p>
                  <p><strong>Sistema:</strong> {formData.sistemaEnvio}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Passo 3: Detalhes Adicionais */}
      {currentStep === 3 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-green-700 font-bold text-lg flex items-center space-x-2">
              <Save className="w-5 h-5" />
              <span>Detalhes Adicionais</span>
            </CardTitle>
            <CardDescription>
              Informações complementares (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente" className="text-slate-700 font-medium">Cliente</Label>
                <Select value={formData.cliente} onValueChange={(value) => setFormData({ ...formData, cliente: value })}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresasLoading ? (
                      <div className="px-3 py-2 text-sm text-slate-500 text-center">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                        Carregando empresas...
                      </div>
                    ) : empresasError ? (
                      <div className="px-3 py-2 text-sm text-red-500 text-center">
                        ❌ Erro ao carregar empresas
                      </div>
                    ) : empresas.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500 text-center">
                        ⚠️ Nenhuma empresa cadastrada
                      </div>
                    ) : (
                      empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.razaoSocial}>
                          🏢 {empresa.razaoSocial}
                          {empresa.nomeFantasia && ` (${empresa.nomeFantasia})`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="diasAlerta" className="text-slate-700 font-medium">Dias para Alerta</Label>
                <Input
                  id="diasAlerta"
                  type="number"
                  value={formData.diasAlerta}
                  onChange={(e) => setFormData({ ...formData, diasAlerta: e.target.value })}
                  placeholder="5"
                  className="border-slate-300 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-slate-700 font-medium">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição detalhada da obrigação fiscal..."
                className="border-slate-300 focus:border-blue-500"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-slate-700 font-medium">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                className="border-slate-300 focus:border-blue-500"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de navegação */}
      <div className="flex items-center justify-between pt-6">
        <div className="flex space-x-2">
          {currentStep > 1 && (
            <Button 
              variant="outline" 
              onClick={prevStep}
              className="text-slate-600 border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="text-slate-600 border-slate-300 hover:bg-slate-50"
          >
            Cancelar
          </Button>
        </div>
        
        <div className="flex space-x-2">
          {currentStep < totalSteps ? (
            <Button 
              onClick={nextStep}
              disabled={!isStepValid()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleFinish}
              disabled={isLoading || !formData.codigo || !formData.nome || !formData.responsavel || !formData.diaVencimento}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Criar Obrigação
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}