"use client"

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // Redirect to dashboard
    window.location.href = '/dashboard'
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600 text-lg">Redirecionando para o Dashboard...</p>
      </div>
    </div>
  )
}