'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { 
  Download, 
  Upload, 
  Database, 
  Shield, 
  Clock, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Archive,
  HardDrive
} from 'lucide-react'

interface BackupMetadata {
  timestamp: string
  version: string
  tables: Record<string, any>
  totalRecords: number
  duration: string
  size: number
}

interface BackupResult {
  success: boolean
  metadata: BackupMetadata
  backup: any
  downloadName: string
  summary: any
}

interface RestoreResult {
  success: boolean
  results: Record<string, any>
  summary: any
}

export default function BackupPage() {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backupResult, setBackupResult] = useState<BackupResult | null>(null)
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null)
  const [restoreMode, setRestoreMode] = useState<'append' | 'replace'>('append')
  const [confirmDangerousRestore, setConfirmDangerousRestore] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const createBackup = async () => {
    try {
      setIsCreatingBackup(true)
      setBackupResult(null)
      
      console.log('🔄 Iniciando criação de backup...')
      
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao criar backup')
      }
      
      console.log('✅ Backup criado com sucesso:', result.summary)
      setBackupResult(result)
      
      toast({
        title: '✅ Backup Criado',
        description: `${result.summary.tables} tabelas, ${result.summary.records} registros, ${result.summary.size}`,
      })
      
    } catch (error: any) {
      console.error('❌ Erro ao criar backup:', error)
      
      toast({
        title: '❌ Erro no Backup',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const downloadBackup = () => {
    if (!backupResult) return
    
    const dataStr = JSON.stringify(backupResult.backup, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = backupResult.downloadName
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast({
      title: '📥 Download Iniciado',
      description: `Arquivo: ${exportFileDefaultName}`,
    })
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (!file.name.endsWith('.json')) {
      toast({
        title: '❌ Arquivo Inválido',
        description: 'Selecione um arquivo JSON de backup',
        variant: 'destructive',
      })
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string)
        restoreFromBackup(backupData)
      } catch (error) {
        toast({
          title: '❌ Arquivo Corrompido',
          description: 'Não foi possível ler o arquivo de backup',
          variant: 'destructive',
        })
      }
    }
    reader.readAsText(file)
  }

  const restoreFromBackup = async (backupData: any) => {
    try {
      setIsRestoring(true)  
      setRestoreResult(null)
      
      if (restoreMode === 'replace' && !confirmDangerousRestore) {
        toast({
          title: '⚠️ Confirmação Necessária',
          description: 'Marque a confirmação para o modo REPLACE',
          variant: 'destructive',
        })
        return
      }
      
      console.log('🔄 Iniciando restauração...', { mode: restoreMode })
      
      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backupData,
          mode: restoreMode,
          confirmReplace: restoreMode === 'replace' ? confirmDangerousRestore : false
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao restaurar backup')
      }
      
      console.log('✅ Restauração concluída:', result.summary)
      setRestoreResult(result)
      
      toast({
        title: result.success ? '✅ Restauração Concluída' : '⚠️ Restauração Parcial',
        description: `${result.summary.successfulTables}/${result.summary.totalTables} tabelas, ${result.summary.totalRestored} registros`,
        variant: result.success ? 'default' : 'destructive',
      })
      
    } catch (error: any) {
      console.error('❌ Erro ao restaurar backup:', error)
      
      toast({
        title: '❌ Erro na Restauração',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Database className="h-10 w-10 text-blue-600" />
            Sistema de Backup e Recuperação
          </h1>
          <p className="text-lg text-gray-600">
            Faça backup seguro dos dados e restaure quando necessário
          </p>
        </div>

        <Tabs defaultValue="backup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Criar Backup
            </TabsTrigger>
            <TabsTrigger value="restore" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Restaurar Dados
            </TabsTrigger>
          </TabsList>

          {/* Aba de Backup */}
          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-blue-600" />
                  Criar Backup Completo
                </CardTitle>
                <CardDescription>
                  Gera um backup completo de todas as tabelas do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    O backup incluirá: usuários, clientes, empresas, documentos, obrigações, alvarás e responsáveis.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-4">
                  <Button 
                    onClick={createBackup}
                    disabled={isCreatingBackup}
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    {isCreatingBackup ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Criando Backup...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        Criar Backup Agora
                      </>
                    )}
                  </Button>

                  {backupResult && (
                    <Button 
                      onClick={downloadBackup}
                      variant="outline"
                      className="flex items-center gap-2"
                      size="lg"
                    >
                      <Download className="h-4 w-4" />
                      Baixar Arquivo
                    </Button>
                  )}
                </div>

                {/* Resultado do Backup */}
                {backupResult && (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-800 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Backup Criado com Sucesso
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {backupResult.summary.tables}
                          </div>
                          <div className="text-sm text-gray-600">Tabelas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {backupResult.summary.records}
                          </div>
                          <div className="text-sm text-gray-600">Registros</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {backupResult.summary.size}
                          </div>
                          <div className="text-sm text-gray-600">Tamanho</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            {backupResult.summary.duration}
                          </div>
                          <div className="text-sm text-gray-600">Duração</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="font-semibold">Detalhes por Tabela:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.entries(backupResult.metadata.tables).map(([table, info]: [string, any]) => (
                            <Badge key={table} variant="secondary" className="justify-between">
                              {table}: {info.records}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Criado em: {new Date(backupResult.metadata.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Restauração */}
          <TabsContent value="restore" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-orange-600" />
                  Restaurar Dados do Backup
                </CardTitle>
                <CardDescription>
                  Selecione um arquivo de backup para restaurar os dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>ATENÇÃO:</strong> A restauração pode sobrescrever dados existentes. 
                    Faça um backup atual antes de prosseguir.
                  </AlertDescription>
                </Alert>

                {/* Configurações de Restauração */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="restore-mode">Modo de Restauração</Label>
                    <Select value={restoreMode} onValueChange={(value: 'append' | 'replace') => setRestoreMode(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="append">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div>
                              <div className="font-medium">Adicionar (Seguro)</div>
                              <div className="text-sm text-gray-500">Mantém dados existentes</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="replace">
                          <div className="flex items-center gap-2">
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <div>
                              <div className="font-medium">Substituir (Perigoso)</div>
                              <div className="text-sm text-gray-500">Apaga todos os dados atuais</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {restoreMode === 'replace' && (
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="confirm-dangerous" 
                        checked={confirmDangerousRestore}
                        onCheckedChange={(checked) => setConfirmDangerousRestore(checked as boolean)}
                      />
                      <Label htmlFor="confirm-dangerous" className="text-red-600 font-medium">
                        Confirmo que quero APAGAR todos os dados atuais
                      </Label>
                    </div>
                  )}
                </div>

                {/* Upload de Arquivo */}
                <div className="space-y-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".json"
                    className="hidden"
                  />
                  
                  <Button 
                    onClick={triggerFileSelect}
                    disabled={isRestoring}
                    variant="outline"
                    size="lg"
                    className="w-full h-16 border-dashed border-2"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                        Restaurando Dados...
                      </>
                    ) : (
                      <>
                        <FileText className="h-6 w-6 mr-2" />
                        Selecionar Arquivo de Backup (.json)
                      </>
                    )}
                  </Button>
                </div>

                {/* Resultado da Restauração */}
                {restoreResult && (
                  <Card className={restoreResult.success ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
                    <CardHeader>
                      <CardTitle className={`flex items-center gap-2 ${restoreResult.success ? 'text-green-800' : 'text-yellow-800'}`}>
                        {restoreResult.success ? (
                          <>
                            <CheckCircle className="h-5 w-5" />
                            Restauração Concluída
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-5 w-5" />
                            Restauração Parcial
                          </>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {restoreResult.summary.successfulTables}/{restoreResult.summary.totalTables}
                          </div>
                          <div className="text-sm text-gray-600">Tabelas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {restoreResult.summary.totalRestored}
                          </div>
                          <div className="text-sm text-gray-600">Registros</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {restoreResult.summary.duration}
                          </div>
                          <div className="text-sm text-gray-600">Duração</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="font-semibold">Resultado por Tabela:</h4>
                        <div className="space-y-1">
                          {Object.entries(restoreResult.results).map(([table, result]: [string, any]) => (
                            <div key={table} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div className="flex items-center gap-2">
                                {result.success ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="font-medium">{table}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {result.records} registros
                                {result.error && (
                                  <span className="text-red-500 ml-2">• {result.error}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {restoreResult.summary.backupInfo && (
                        <div className="text-sm text-gray-600">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Backup original: {new Date(restoreResult.summary.backupInfo.timestamp).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}