'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/sonner'
import { Send, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function TesteNotificacaoPage() {
  const { toast } = useToast()
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({
    clienteEmail: 'gomes1309@gmail.com',
    clienteNome: 'Eduardo Gomes',
    empresa: 'Empresa Teste LTDA',
    cnpj: '12.345.678/0001-90',
    tipo: 'municipal',
    numeroProtocolo: 'TESTE-2024-001',
    dataVencimento: '15/02/2024',
    status: 'vencendo' as 'vencendo' | 'vencido',
    responsavel: 'Eduardo Gomes',
    daysToExpire: '5'
  })

  const handleSendTest = async () => {
    if (!formData.clienteEmail || !formData.clienteNome || !formData.empresa) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos email, nome e empresa",
        variant: "destructive"
      })
      return
    }

    setSending(true)
    try {
      console.log('📧 Enviando email de teste:', formData)

      const response = await fetch('/api/notify-alvara-expiration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          daysToExpire: parseInt(formData.daysToExpire) || 0
        })
      })

      const result = await response.json()

      if (response.ok) {
        console.log('✅ Email enviado:', result)
        toast({
          title: "📧 Email Enviado!",
          description: `Notificação de teste enviada para ${formData.clienteEmail}`,
        })
      } else {
        throw new Error(result.message || 'Erro no envio')
      }

    } catch (error) {
      console.error('❌ Erro:', error)
      toast({
        title: "Erro no Envio",
        description: error instanceof Error ? error.message : "Erro ao enviar email de teste",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Teste de Notificação</h1>
                <p className="text-sm text-slate-600">Sistema de Emails para Vencimento de Alvarás</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Informação sobre o sistema */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-3">
              <CheckCircle className="w-6 h-6" />
              Sistema de Notificação por Email - Funcionando! ✅
            </CardTitle>
            <CardDescription className="text-blue-700">
              O sistema de email está configurado e funcional. Use este formulário para testar o envio de notificações de vencimento de alvarás.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Formulário de Teste */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Enviar Email de Teste
            </CardTitle>
            <CardDescription>
              Preencha os dados abaixo para testar o envio de email de notificação de vencimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clienteEmail">Email do Cliente *</Label>
                <Input
                  id="clienteEmail"
                  type="email"
                  value={formData.clienteEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, clienteEmail: e.target.value }))}
                  placeholder="cliente@empresa.com"
                  className="border-slate-300"
                />
              </div>
              
              <div>
                <Label htmlFor="clienteNome">Nome do Cliente *</Label>
                <Input
                  id="clienteNome"
                  value={formData.clienteNome}
                  onChange={(e) => setFormData(prev => ({ ...prev, clienteNome: e.target.value }))}
                  placeholder="Nome completo"
                  className="border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="empresa">Nome da Empresa *</Label>
                <Input
                  id="empresa"
                  value={formData.empresa}
                  onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
                  placeholder="Empresa LTDA"
                  className="border-slate-300"
                />
              </div>
              
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                  placeholder="00.000.000/0000-00"
                  className="border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo de Alvará</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vigilancia_sanitaria">Vigilância Sanitária</SelectItem>
                    <SelectItem value="bombeiro">Bombeiros</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="numeroProtocolo">Número do Protocolo</Label>
                <Input
                  id="numeroProtocolo"
                  value={formData.numeroProtocolo}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroProtocolo: e.target.value }))}
                  placeholder="PROTOCOLO-2024-001"
                  className="border-slate-300"
                />
              </div>
              
              <div>
                <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                <Input
                  id="dataVencimento"
                  value={formData.dataVencimento}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataVencimento: e.target.value }))}
                  placeholder="01/12/2024"
                  className="border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status do Alvará</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'vencendo' | 'vencido') => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vencendo">Vencendo</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="daysToExpire">Dias para Vencimento</Label>
                <Input
                  id="daysToExpire"
                  type="number"
                  value={formData.daysToExpire}
                  onChange={(e) => setFormData(prev => ({ ...prev, daysToExpire: e.target.value }))}
                  placeholder="5"
                  className="border-slate-300"
                />
              </div>
              
              <div>
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                  placeholder="Nome do responsável"
                  className="border-slate-300"
                />
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <Button
                onClick={handleSendTest}
                disabled={sending || !formData.clienteEmail || !formData.clienteNome || !formData.empresa}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                size="lg"
              >
                <Send className={`w-5 h-5 mr-2 ${sending ? 'animate-pulse' : ''}`} />
                {sending ? 'Enviando Email...' : 'Enviar Email de Teste'}
              </Button>
            </div>

            {/* Instruções */}
            <div className="bg-slate-50 rounded-lg p-6 mt-8">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Como Funciona o Sistema
              </h3>
              <div className="text-sm text-slate-600 space-y-2">
                <p><strong>✅ Sistema Configurado:</strong> O email está funcionando via Resend com domínio padrão</p>
                <p><strong>📧 Template Profissional:</strong> Emails HTML responsivos com design da AG Assessoria</p>
                <p><strong>🎯 Notificação Inteligente:</strong> Diferentes estilos para alvarás vencendo vs. vencidos</p>
                <p><strong>📱 WhatsApp Integrado:</strong> Links diretos para contato via WhatsApp</p>
                <p><strong>⚡ Sistema Manual:</strong> Use o botão "Avisar Cliente" na página de alvarás</p>
                <p><strong>🤖 Sistema Automático:</strong> Execute verificações automáticas na página de administração</p>
              </div>
            </div>

          </CardContent>
        </Card>
      </main>
    </div>
  )
}