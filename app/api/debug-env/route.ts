import { NextResponse } from 'next/server'

export async function GET() {
  const resendApiKey = process.env.RESEND_API_KEY
  
  const oldProductionCheck = process.env.NODE_ENV === 'production'
  
  // Vercel sets specific environment variables
  const vercelEnv = process.env.VERCEL_ENV // 'production', 'preview', 'development'
  const vercel = process.env.VERCEL // '1' when running on Vercel
  
  // NEW: More robust production detection
  const isOnVercel = process.env.VERCEL === '1'
  const isVercelProduction = process.env.VERCEL_ENV === 'production'
  const isNodeProduction = process.env.NODE_ENV === 'production'
  
  // Consider production if any of these conditions are met:
  const newProductionCheck = (
    isNodeProduction || 
    isVercelProduction ||
    (isOnVercel && process.env.VERCEL_ENV !== 'development')
  )
  
  const isFullyProduction = newProductionCheck && !!resendApiKey

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL: process.env.VERCEL,
    IS_ON_VERCEL: isOnVercel,
    IS_VERCEL_PRODUCTION: isVercelProduction,
    IS_NODE_PRODUCTION: isNodeProduction,
    RESEND_API_KEY_EXISTS: !!resendApiKey,
    RESEND_API_KEY_LENGTH: resendApiKey?.length || 0,
    RESEND_API_KEY_PREFIX: resendApiKey?.substring(0, 5) || 'N/A',
    OLD_PRODUCTION_CHECK: oldProductionCheck,
    NEW_PRODUCTION_CHECK: newProductionCheck,
    IS_FULLY_PRODUCTION: isFullyProduction,
    timestamp: new Date().toISOString(),
    build_version: 'v2.2'
  })
}