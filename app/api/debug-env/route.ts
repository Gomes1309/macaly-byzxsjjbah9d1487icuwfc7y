import { NextResponse } from 'next/server'

export async function GET() {
  const resendApiKey = process.env.RESEND_API_KEY
  
  const oldProductionCheck = process.env.NODE_ENV === 'production'
  const newProductionCheck = (
    process.env.NODE_ENV === 'production' || 
    process.env.VERCEL_ENV === 'production' ||
    process.env.VERCEL === '1'
  )
  
  const isFullyProduction = newProductionCheck && !!resendApiKey

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL: process.env.VERCEL,
    RESEND_API_KEY_EXISTS: !!resendApiKey,
    RESEND_API_KEY_LENGTH: resendApiKey?.length || 0,
    RESEND_API_KEY_PREFIX: resendApiKey?.substring(0, 5) || 'N/A',
    OLD_PRODUCTION_CHECK: oldProductionCheck,
    NEW_PRODUCTION_CHECK: newProductionCheck,
    IS_FULLY_PRODUCTION: isFullyProduction,
    timestamp: new Date().toISOString(),
    build_version: 'v2.1'
  })
}