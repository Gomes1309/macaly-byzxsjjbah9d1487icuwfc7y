'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { FileText, Download, Users, Building, Mail, Phone, Calendar, Filter, Printer, Share } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ReportGeneratorProps {
  onClose?: () => void
}

interface ReportData {
  metadata: {
    titulo: string
    dataGeracao: string
    totalClientes: number
    clientesAtivos: number
    pessoasJuridicas: number
    pessoasFisicas: number
    totalEmpresas: number
    orderBy: string
  }
  clientes: Array<{
    nome: string
    cpfCnpj: string
    email: string
    telefone: string
    tipoCliente: string
    status: string
    endereco: string
    dataCadastro: string
    observacoes: string
  }>
}

export default function ReportGenerator({ onClose }: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportType, setReportType] = useState('complete')
  const [orderBy, setOrderBy] = useState('alphabetical')
  const [format, setFormat] = useState('pdf')
  const { toast } = useToast()

  const generatePDF = async (data: ReportData) => {
    // Importação dinâmica para evitar erros de SSR
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height

    // Configurar fonte
    doc.setFont('helvetica')

    // Header com design aprimorado da AG Assessoria
    doc.setFillColor(5, 150, 105) // emerald-600 (cor padrão da AG Assessoria)
    doc.rect(0, 0, pageWidth, 35, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('AG ASSESSORIA', 15, 18)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('CONTABILIDADE E ASSESSORIA EMPRESARIAL', 15, 27)
    
    doc.setFontSize(10)
    doc.text('GESTÃO EMPRESARIAL', 15, 32)

    // Título do relatório com melhor espaçamento
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(data.metadata.titulo, 15, 48)

    // Informações do cabeçalho com formatação profissional
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Data de Geração: ${data.metadata.dataGeracao}`, 15, 58)
    doc.text(`Ordenação: ${data.metadata.orderBy}`, 15, 63)

    // Estatísticas resumidas com design aprimorado
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('RESUMO EXECUTIVO', 15, 78)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(51, 65, 85)
    doc.text(`📊 Total de Clientes: ${data.metadata.totalClientes}`, 15, 88)
    doc.text(`✅ Clientes Ativos: ${data.metadata.clientesAtivos}`, 15, 93)
    doc.text(`🏢 Pessoas Jurídicas: ${data.metadata.pessoasJuridicas}`, 15, 98)
    doc.text(`👤 Pessoas Físicas: ${data.metadata.pessoasFisicas}`, 15, 103)
    doc.text(`🏭 Total de Empresas: ${data.metadata.totalEmpresas}`, 15, 108)

    // Tabela de clientes
    const tableData = data.clientes.map(cliente => [
      cliente.nome,
      cliente.cpfCnpj,
      cliente.tipoCliente,
      cliente.status,
      cliente.email,
      cliente.telefone
    ])

    autoTable(doc, {
      startY: 118,
      head: [['Nome', 'CPF/CNPJ', 'Tipo', 'Status', 'Email', 'Telefone']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [5, 150, 105] }, // emerald-600
      columnStyles: {
        0: { cellWidth: 35 }, // Nome
        1: { cellWidth: 30 }, // CPF/CNPJ
        2: { cellWidth: 20 }, // Tipo
        3: { cellWidth: 15 }, // Status
        4: { cellWidth: 35 }, // Email
        5: { cellWidth: 25 }  // Telefone
      },
      didDrawPage: (data) => {
        // Footer
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(
          `Página ${data.pageNumber} - AG Assessoria | Contabilidade e Assessoria Empresarial`,
          15,
          pageHeight - 10
        )
      }
    })

    // Adicionar página com detalhes se necessário
    if (reportType === 'detailed') {
      doc.addPage()
      doc.setFontSize(14)
      doc.text('DETALHES DOS CLIENTES', 15, 30)

      let yPosition = 45
      data.clientes.forEach((cliente, index) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage()
          yPosition = 30
        }

        doc.setFontSize(12)
        doc.text(`${index + 1}. ${cliente.nome}`, 15, yPosition)
        yPosition += 7

        doc.setFontSize(9)
        doc.text(`CPF/CNPJ: ${cliente.cpfCnpj}`, 20, yPosition)
        yPosition += 5
        doc.text(`Email: ${cliente.email}`, 20, yPosition)
        yPosition += 5
        doc.text(`Telefone: ${cliente.telefone}`, 20, yPosition)
        yPosition += 5
        doc.text(`Endereço: ${cliente.endereco}`, 20, yPosition)
        yPosition += 5
        doc.text(`Data de Cadastro: ${cliente.dataCadastro}`, 20, yPosition)
        yPosition += 5

        if (cliente.observacoes) {
          doc.text(`Observações: ${cliente.observacoes}`, 20, yPosition)
          yPosition += 5
        }

        yPosition += 5 // Espaço entre clientes
      })
    }

    return doc
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    
    try {
      console.log('📊 Gerando relatório com configurações:', { reportType, orderBy, format })
      
      const response = await fetch('/api/generate-client-report-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          format, 
          orderBy: orderBy === 'cnpj' ? 'cnpj' : 'alphabetical',
          reportType 
        })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      console.log('✅ Dados do relatório recebidos:', result.data.metadata)

      if (format === 'pdf') {
        // Gerar PDF
        const pdf = await generatePDF(result.data)
        
        // Download do PDF
        const filename = `relatorio-clientes-${orderBy}-${new Date().toISOString().split('T')[0]}.pdf`
        pdf.save(filename)
        
        toast({
          title: "📄 Relatório PDF Gerado!",
          description: `${result.data.metadata.totalClientes} clientes exportados em PDF`,
        })
      } else {
        // Download como JSON/Excel
        const dataStr = JSON.stringify(result.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `relatorio-clientes-${orderBy}-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
        
        toast({
          title: "📊 Relatório JSON Gerado!",
          description: `${result.data.metadata.totalClientes} clientes exportados`,
        })
      }
      
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error)
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Não foi possível gerar o relatório",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <FileText className="w-5 h-5" />
          Gerador de Relatórios de Clientes
        </CardTitle>
        <CardDescription>
          Gere relatórios personalizados em PDF com dados dos clientes organizados por ordem alfabética ou CNPJ
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Tipo de Relatório */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="report-type">Tipo de Relatório</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="complete">📊 Relatório Completo</SelectItem>
                <SelectItem value="summary">📋 Resumo Executivo</SelectItem>
                <SelectItem value="detailed">📄 Detalhado com Observações</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-by">Ordenação</Label>
            <Select value={orderBy} onValueChange={setOrderBy}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alphabetical">🔤 Nome (A-Z)</SelectItem>
                <SelectItem value="cnpj">🏢 CNPJ/CPF (A-Z)</SelectItem>
                <SelectItem value="date">📅 Data de Cadastro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Formato de Saída */}
        <div className="space-y-2">
          <Label htmlFor="format">Formato de Saída</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha o formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">📄 PDF Personalizado</SelectItem>
              <SelectItem value="json">📊 JSON/Dados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preview das Configurações */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Configurações do Relatório:</h4>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              <FileText className="w-3 h-3 mr-1" />
              {reportType === 'complete' ? 'Completo' : reportType === 'summary' ? 'Resumo' : 'Detalhado'}
            </Badge>
            <Badge variant="outline">
              <Filter className="w-3 h-3 mr-1" />
              {orderBy === 'alphabetical' ? 'A-Z Nome' : orderBy === 'cnpj' ? 'A-Z CNPJ' : 'Data'}
            </Badge>
            <Badge variant="outline">
              <Download className="w-3 h-3 mr-1" />
              {format === 'pdf' ? 'PDF' : 'JSON'}
            </Badge>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Gerando Relatório...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Gerar Relatório {format.toUpperCase()}
              </>
            )}
          </Button>
          
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>

        {/* Informações Adicionais */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• O relatório incluirá todos os clientes cadastrados no sistema</p>
          <p>• Dados exportados: Nome, CNPJ/CPF, Email, Telefone, Status e Data de Cadastro</p>
          <p>• PDF personalizado com logotipo e estatísticas da AG Assessoria</p>
        </div>
      </CardContent>
    </Card>
  )
}