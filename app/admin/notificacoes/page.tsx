'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/sonner'
import { 
  Bell, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Mail,
  TrendingUp,
  Calendar,
  Users,
  Settings,
  PlayCircle,
  Zap,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface NotificationStats {
  total_enviados: number
  total_erros: number
  ultimo_envio: string | null
  tipos_notificacao: Record<string, number>
}

interface NotificationLog {
  id: string
  alvara_id: string
  email_enviado: string
  data_envio: string
  tipo_notificacao: string
  status: 'sucesso' | 'erro'
  error_message?: string
}

interface NotificationResponse {
  success: boolean
  message: string
  processados?: number
  enviados?: number
  detalhes?: any[]
}

export default function NotificacoesAdminPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [executingAuto, setExecutingAuto] = useState(false)
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [lastExecution, setLastExecution] = useState<NotificationResponse | null>(null)

  // Carregar status do sistema
  const loadStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notify-alvaras-auto')
      const data = await response.json()
      
      if (response.ok) {
        setStats(data.stats)
        setLogs(data.logs || [])
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar estatísticas do sistema de notificação",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Executar verificação automática
  const executeAutoNotification = async () => {
    setExecutingAuto(true)
    try {
      console.log('🤖 Executando verificação automática de notificações...')
      
      const response = await fetch('/api/notify-alvaras-auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log('✅ Verificação automática concluída:', result)
        setLastExecution(result)
        
        toast({
          title: "✅ Verificação Concluída!",
          description: `${result.enviados} notificações enviadas de ${result.processados} alvarás verificados.`,
        })
        
        // Recarregar estatísticas
        await loadStats()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error('❌ Erro na verificação automática:', error)
      toast({
        title: "Erro na Verificação",
        description: error instanceof Error ? error.message : "Erro ao executar verificação automática",
        variant: "destructive"
      })
    } finally {
      setExecutingAuto(false)
    }
  }

  // Carregar dados ao montar componente
  useEffect(() => {
    loadStats()
  }, [])

  // Obter cor do tipo de notificação
  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'vencendo_15': return 'bg-blue-100 text-blue-800'
      case 'vencendo_7': return 'bg-yellow-100 text-yellow-800'
      case 'vencendo_3': return 'bg-orange-100 text-orange-800'
      case 'vencido_1': return 'bg-red-100 text-red-800'
      case 'vencido_7': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Obter label do tipo
  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'vencendo_15': return 'Vence em 15 dias'
      case 'vencendo_7': return 'Vence em 7 dias'
      case 'vencendo_3': return 'Vence em 3 dias'
      case 'vencido_1': return 'Vencido há 1 dia'
      case 'vencido_7': return 'Vencido há 7 dias'
      default: return tipo
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Bell className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Sistema de Notificações</h1>
                  <p className="text-sm text-slate-600 font-medium">Gestão Automática de Avisos de Vencimento</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button 
                  variant="outline"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              
              <Button 
                onClick={loadStats}
                variant="outline"
                className="text-green-600 border-green-300 hover:bg-green-50"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Carregando...' : 'Atualizar'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Ação Principal */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-3">
              <Zap className="w-6 h-6" />
              Verificação Automática de Vencimentos
            </CardTitle>
            <CardDescription className="text-blue-700">
              Execute a verificação automática para identificar e notificar alvarás vencidos ou próximos do vencimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button
                onClick={executeAutoNotification}
                disabled={executingAuto}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <PlayCircle className={`w-5 h-5 mr-2 ${executingAuto ? 'animate-spin' : ''}`} />
                {executingAuto ? 'Executando Verificação...' : 'Executar Verificação Automática'}
              </Button>
              
              <div className="text-sm text-slate-600">
                <p><strong>Como funciona:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Verifica alvarás vencendo em 15, 7 e 3 dias</li>
                  <li>Notifica alvarás vencidos há 1 e 7 dias</li>
                  <li>Evita envio de emails duplicados</li>
                  <li>Registra todas as ações no log</li>
                </ul>
              </div>
            </div>
            
            {lastExecution && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Última Execução</AlertTitle>
                <AlertDescription className="text-green-700">
                  {lastExecution.message}
                  {lastExecution.detalhes && lastExecution.detalhes.length > 0 && (
                    <div className="mt-2">
                      <strong>Detalhes:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {lastExecution.detalhes.slice(0, 5).map((item, index) => (
                          <li key={index} className="text-sm">
                            {item.alvara} ({item.email}) - {item.status === 'enviado' ? '✅' : '❌'}
                          </li>
                        ))}
                        {lastExecution.detalhes.length > 5 && (
                          <li className="text-sm">... e mais {lastExecution.detalhes.length - 5}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-lg border-0 border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Emails Enviados</p>
                    <p className="text-3xl font-bold text-slate-800">{stats.total_enviados}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-lg border-0 border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Erros</p>
                    <p className="text-3xl font-bold text-slate-800">{stats.total_erros}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-lg border-0 border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Total Processado</p>
                    <p className="text-3xl font-bold text-slate-800">{stats.total_enviados + stats.total_erros}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-lg border-0 border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Último Envio</p>
                    <p className="text-lg font-bold text-slate-800">
                      {stats.ultimo_envio ? 
                        format(new Date(stats.ultimo_envio), 'dd/MM HH:mm', { locale: ptBR }) : 
                        'Nunca'
                      }
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Distribuição por Tipo */}
        {stats && Object.keys(stats.tipos_notificacao).length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Distribuição por Tipo de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(stats.tipos_notificacao).map(([tipo, count]) => (
                  <div key={tipo} className="text-center">
                    <Badge className={getTypeColor(tipo)}>
                      {getTypeLabel(tipo)}
                    </Badge>
                    <p className="text-2xl font-bold text-slate-800 mt-2">{count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Log de Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Histórico de Notificações (Últimas 10)
            </CardTitle>
            <CardDescription>
              Log detalhado das notificações enviadas recentemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-slate-500">Carregando logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <p className="text-slate-500">Nenhuma notificação encontrada</p>
                <p className="text-sm text-slate-400 mt-2">
                  Execute a verificação automática para começar
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${log.status === 'sucesso' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {log.status === 'sucesso' ? 
                          <CheckCircle className="w-4 h-4 text-green-600" /> : 
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{log.email_enviado}</p>
                        <p className="text-sm text-slate-600">
                          {format(new Date(log.data_envio), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                        {log.error_message && (
                          <p className="text-sm text-red-600 mt-1">{log.error_message}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getTypeColor(log.tipo_notificacao)}>
                        {getTypeLabel(log.tipo_notificacao)}
                      </Badge>
                      <p className="text-sm text-slate-500 mt-1">
                        {log.status === 'sucesso' ? 'Enviado' : 'Erro'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}