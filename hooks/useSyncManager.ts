"use client"

import { useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

// Types for sync events
export type SyncEventType = 
  | 'clientes_updated'
  | 'alvaras_updated' 
  | 'documentos_updated'
  | 'obrigacoes_updated'
  | 'usuarios_updated'
  | 'portal_responsaveis_updated'
  | 'obrigacoes_fiscais_updated'
  | 'empresas_updated'

export interface SyncEvent {
  type: SyncEventType
  action: 'create' | 'update' | 'delete' | 'refresh'
  data?: any
  timestamp: number
}

// Global event emitter class
class SyncEventEmitter {
  private listeners: Map<SyncEventType, Set<(event: SyncEvent) => void>> = new Map()
  private lastEvents: Map<SyncEventType, SyncEvent> = new Map()

  // Register a listener for specific event type
  on(eventType: SyncEventType, callback: (event: SyncEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)
    
    console.log(`🔄 SyncManager: Registered listener for ${eventType}`)
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback)
      console.log(`🔄 SyncManager: Unregistered listener for ${eventType}`)
    }
  }

  // Emit event to all listeners
  emit(event: SyncEvent) {
    console.log(`🚀 SyncManager: Emitting event ${event.type} with action ${event.action}`)
    
    this.lastEvents.set(event.type, event)
    
    const listeners = this.listeners.get(event.type)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event)
        } catch (error) {
          console.error(`❌ SyncManager: Error in listener for ${event.type}:`, error)
        }
      })
    }
  }

  // Get last event for a specific type
  getLastEvent(eventType: SyncEventType): SyncEvent | undefined {
    return this.lastEvents.get(eventType)
  }

  // Clear all listeners (useful for cleanup)
  clear() {
    this.listeners.clear()
    this.lastEvents.clear()
    console.log('🧹 SyncManager: Cleared all listeners')
  }
}

// Global singleton instance
const globalSyncEmitter = new SyncEventEmitter()

// Hook for managing sync events
export function useSyncManager() {
  const { toast } = useToast()
  const isInitialized = useRef(false)

  // Initialize localStorage event listener (only once)
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    console.log('🔄 SyncManager: Initializing localStorage sync listener')

    const handleStorageChange = (e: StorageEvent) => {
      console.log('💾 LocalStorage changed:', e.key, e.newValue ? 'updated' : 'deleted')
      
      // Map localStorage keys to sync events
      const keyToEvent: Record<string, SyncEventType> = {
        'obrigacoes_fiscais': 'obrigacoes_fiscais_updated',
        'portal_responsaveis': 'portal_responsaveis_updated',
        'documentos_sistema': 'documentos_updated',
        'funcionarios_responsaveis': 'usuarios_updated'
      }

      if (e.key && keyToEvent[e.key]) {
        const eventType = keyToEvent[e.key]
        
        globalSyncEmitter.emit({
          type: eventType,
          action: e.newValue ? 'update' : 'delete',
          data: e.newValue ? JSON.parse(e.newValue) : null,
          timestamp: Date.now()
        })

        // Show toast for important changes
        if (eventType === 'obrigacoes_fiscais_updated') {
          toast({
            title: "Obrigações atualizadas",
            description: "Os dados foram sincronizados automaticamente.",
            duration: 2000
          })
        }
      }
    }

    // Listen to localStorage changes
    window.addEventListener('storage', handleStorageChange)

    // Listen to custom storage events (for same-tab changes)
    const handleCustomStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent
      handleStorageChange(customEvent.detail as StorageEvent)
    }
    
    window.addEventListener('localStorageChange', handleCustomStorageChange)

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorageChange', handleCustomStorageChange)
      console.log('🧹 SyncManager: Cleaned up localStorage listeners')
    }
  }, [toast])

  // Function to emit sync events
  const emitSync = useCallback((event: Omit<SyncEvent, 'timestamp'>) => {
    globalSyncEmitter.emit({
      ...event,
      timestamp: Date.now()
    })
  }, [])

  // Function to subscribe to events
  const subscribe = useCallback((eventType: SyncEventType, callback: (event: SyncEvent) => void) => {
    return globalSyncEmitter.on(eventType, callback)
  }, [])

  // Function to trigger manual refresh of all data
  const refreshAll = useCallback(() => {
    console.log('🔄 SyncManager: Triggering full refresh of all data')
    
    const eventTypes: SyncEventType[] = [
      'clientes_updated',
      'alvaras_updated',
      'documentos_updated',
      'obrigacoes_updated',
      'usuarios_updated',
      'portal_responsaveis_updated',
      'obrigacoes_fiscais_updated',
      'empresas_updated'
    ]

    eventTypes.forEach(eventType => {
      globalSyncEmitter.emit({
        type: eventType,
        action: 'refresh',
        timestamp: Date.now()
      })
    })

    toast({
      title: "Dados atualizados",
      description: "Todas as informações foram sincronizadas.",
      duration: 3000
    })
  }, [toast])

  return {
    emitSync,
    subscribe,
    refreshAll,
    getLastEvent: globalSyncEmitter.getLastEvent.bind(globalSyncEmitter)
  }
}

// Enhanced localStorage wrapper that emits sync events
export const syncedLocalStorage = {
  setItem: (key: string, value: string) => {
    console.log(`💾 SyncedLocalStorage: Setting ${key}`)
    localStorage.setItem(key, value)
    
    // Emit custom event for same-tab synchronization
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: {
        key,
        newValue: value,
        oldValue: localStorage.getItem(key)
      } as StorageEvent
    }))
  },
  
  removeItem: (key: string) => {
    console.log(`💾 SyncedLocalStorage: Removing ${key}`)
    const oldValue = localStorage.getItem(key)
    localStorage.removeItem(key)
    
    // Emit custom event for same-tab synchronization
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: {
        key,
        newValue: null,
        oldValue
      } as StorageEvent
    }))
  },
  
  getItem: (key: string) => localStorage.getItem(key),
  clear: () => localStorage.clear()
}

export default useSyncManager