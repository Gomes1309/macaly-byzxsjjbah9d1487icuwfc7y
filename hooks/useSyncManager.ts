"use client"

import { useCallback, useEffect, useRef } from 'react'

interface SyncEvent {
  type: 'clientes_updated' | 'documentos_updated' | 'alvaras_updated' | 'obrigacoes_updated' | 'usuarios_updated' | 'global_refresh'
  action: 'create' | 'update' | 'delete' | 'refresh'
  data?: any
  timestamp: number
}

type SyncCallback = (event: SyncEvent) => void

class SyncManager {
  private listeners: Set<SyncCallback> = new Set()
  private static instance: SyncManager

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager()
    }
    return SyncManager.instance
  }

  subscribe(callback: SyncCallback): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  emit(event: Omit<SyncEvent, 'timestamp'>) {
    const fullEvent: SyncEvent = {
      ...event,
      timestamp: Date.now()
    }
    
    console.log('🔄 SyncManager: Emitting event', fullEvent)
    
    // Emit to all listeners
    this.listeners.forEach(callback => {
      try {
        callback(fullEvent)
      } catch (error) {
        console.error('🔄 SyncManager: Error in callback', error)
      }
    })

    // Clear localStorage caches based on event type
    this.clearRelatedCaches(event.type, event.action)
  }

  private clearRelatedCaches(eventType: string, action: string) {
    console.log('🧹 SyncManager: Clearing caches for', eventType, action)
    
    // Clear all backup caches on delete operations and refresh
    if (action === 'delete' || action === 'refresh') {
      const cachesToClear = [
        'clientes_backup',
        'documentos_backup', 
        'alvaras_backup',
        'obrigacoes_backup',
        'usuarios_backup'
      ]
      
      cachesToClear.forEach(cache => {
        localStorage.removeItem(cache)
        console.log(`🧹 Cleared ${cache}`)
      })
      
      // Clear specific caches based on event type
      switch (eventType) {
        case 'clientes_updated':
          // Cliente deletado - limpar todos os dados relacionados
          localStorage.removeItem('documentos_sistema')
          localStorage.removeItem('portal_responsaveis')
          console.log('🧹 Cleared client-related local data')
          break
        case 'documentos_updated':
          localStorage.removeItem('documentos_sistema')
          console.log('🧹 Cleared documents local data')
          break
        case 'alvaras_updated':
          // Alvarás são específicos, não precisam limpar outros dados
          console.log('🧹 Alvarás cache cleared')
          break
        case 'obrigacoes_updated':
          // Obrigações são específicas, não precisam limpar outros dados
          console.log('🧹 Obrigações cache cleared')
          break
        case 'usuarios_updated':
          // Usuários são específicos, não precisam limpar outros dados
          console.log('🧹 Usuários cache cleared')
          break
        case 'global_refresh':
          // Clear all system data
          localStorage.removeItem('documentos_sistema')
          localStorage.removeItem('portal_responsaveis')
          console.log('🧹 All system data cleared')
          break
      }
      
      console.log('🧹 SyncManager: Cache clearing completed')
    }
  }

  // Force refresh all data across the application
  forceGlobalRefresh() {
    console.log('🔄 SyncManager: Forcing global refresh')
    this.emit({
      type: 'global_refresh',
      action: 'refresh',
      data: { forced: true }
    })
  }

  // NOVO: Função para limpar cache específico
  clearSpecificCache(cacheKey: string) {
    console.log(`🧹 SyncManager: Clearing specific cache: ${cacheKey}`)
    localStorage.removeItem(cacheKey)
  }

  // NOVO: Função para invalidar todos os caches
  invalidateAllCaches() {
    console.log('🧹 SyncManager: Invalidating ALL caches')
    const allCaches = [
      'clientes_backup',
      'documentos_backup',
      'documentos_sistema', 
      'alvaras_backup',
      'obrigacoes_backup',
      'usuarios_backup',
      'portal_responsaveis'
    ]
    
    allCaches.forEach(cache => {
      localStorage.removeItem(cache)
      console.log(`🧹 Invalidated ${cache}`)
    })
    
    console.log('✅ All caches invalidated')
  }
}

export function useSyncManager() {
  const syncManager = useRef(SyncManager.getInstance())
  const listenersRef = useRef<(() => void)[]>([])

  const emitSync = useCallback((event: Omit<SyncEvent, 'timestamp'>) => {
    syncManager.current.emit(event)
  }, [])

  const subscribe = useCallback((callback: SyncCallback) => {
    const unsubscribe = syncManager.current.subscribe(callback)
    listenersRef.current.push(unsubscribe)
    return unsubscribe
  }, [])

  const forceGlobalRefresh = useCallback(() => {
    syncManager.current.forceGlobalRefresh()
  }, [])

  const clearSpecificCache = useCallback((cacheKey: string) => {
    syncManager.current.clearSpecificCache(cacheKey)
  }, [])

  const invalidateAllCaches = useCallback(() => {
    syncManager.current.invalidateAllCaches()
  }, [])

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      listenersRef.current.forEach(unsubscribe => unsubscribe())
      listenersRef.current = []
    }
  }, [])

  return {
    emitSync,
    subscribe,
    forceGlobalRefresh,
    clearSpecificCache,
    invalidateAllCaches
  }
}