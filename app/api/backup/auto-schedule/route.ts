import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface ScheduleConfig {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string // HH:MM format
  maxBackups: number
  autoCleanup: boolean
}

export async function POST(request: NextRequest) {
  try {
    console.log('⚙️ Configurando backup automático')
    
    const body = await request.json()
    const { enabled, frequency, time, maxBackups = 10, autoCleanup = true }: ScheduleConfig = body
    
    // Validar dados
    if (enabled && (!frequency || !time)) {
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos',
        message: 'Frequência e horário são obrigatórios quando habilitado'
      }, { status: 400 })
    }
    
    // Validar formato do horário
    if (enabled && time && !time.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      return NextResponse.json({
        success: false,
        error: 'Horário inválido',
        message: 'Use o formato HH:MM (ex: 14:30)'
      }, { status: 400 })
    }
    
    const config = {
      enabled,
      frequency: enabled ? frequency : null,
      time: enabled ? time : null,
      maxBackups,
      autoCleanup,
      lastUpdate: new Date().toISOString(),
      nextScheduledBackup: enabled ? calculateNextBackup(frequency, time) : null
    }
    
    console.log('📋 Configuração do backup automático:', config)
    
    // Simular salvamento da configuração (em produção, salvar no banco ou arquivo)
    // Por ora, apenas retornar a confirmação
    
    return NextResponse.json({
      success: true,
      message: enabled ? 'Backup automático configurado' : 'Backup automático desabilitado',
      config,
      info: {
        status: enabled ? 'Ativo' : 'Inativo',
        nextBackup: config.nextScheduledBackup,
        description: enabled 
          ? `Backup ${frequency} às ${time}h, máximo ${maxBackups} arquivos`
          : 'Backup automático desabilitado'
      }
    })
    
  } catch (error: any) {
    console.error('❌ Erro ao configurar backup automático:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro na configuração',
      message: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Simular recuperação da configuração atual
    const currentConfig = {
      enabled: false,
      frequency: null,
      time: null,
      maxBackups: 10,
      autoCleanup: true,
      lastUpdate: null,
      nextScheduledBackup: null
    }
    
    return NextResponse.json({
      success: true,
      config: currentConfig,
      message: 'Configuração atual do backup automático'
    })
    
  } catch (error: any) {
    console.error('❌ Erro ao obter configuração:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao obter configuração',
      message: error.message
    }, { status: 500 })
  }
}

function calculateNextBackup(frequency: string, time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const now = new Date()
  const next = new Date()
  
  next.setHours(hours, minutes, 0, 0)
  
  // Se o horário já passou hoje, programar para o próximo período
  if (next <= now) {
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1)
        break
      case 'weekly':
        next.setDate(next.getDate() + 7)
        break
      case 'monthly':
        next.setMonth(next.getMonth() + 1)
        break
    }
  }
  
  return next.toISOString()
}