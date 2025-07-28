import { NextResponse } from 'next/server'

export async function GET() {
  const resendApiKey = process.env.RESEND_API_KEY
  
  const oldProductionCheck = process.env.NODE_ENV === 'production'
  
  // Vercel environment variables
  const vercelEnv = process.env.VERCEL_ENV
  const vercel = process.env.VERCEL
  
  // Standard checks
  const isOnVercel = process.env.VERCEL === '1'
  const isVercelProduction = process.env.VERCEL_ENV === 'production'
  const isNodeProduction = process.env.NODE_ENV === 'production'
  
  // Domain and deployment checks
  const hasVercelDomain = process.env.VERCEL_URL?.includes('.vercel.app') || process.env.VERCEL_URL?.includes('macaly.dev')
  const isVercelDeployment = !!process.env.VERCEL_URL || isOnVercel
  const hasProductionDomain = process.env.VERCEL_URL?.includes('macaly.dev')
  const notLocalhost = !process.env.VERCEL_URL?.includes('localhost') && 
                       !process.env.VERCEL_URL?.includes('127.0.0.1') &&
                       !process.env.VERCEL_URL?.includes('.local')
  const hasCloudflareHeaders = process.env.CF_RAY || process.env.CF_VISITOR
  const isDeployedEnvironment = isVercelDeployment || hasProductionDomain || hasCloudflareHeaders
  
  // 🚨 FORCE PRODUCTION MODE: If we have RESEND_API_KEY, assume production
  // This is the simplest way to ensure emails work when API key is configured
  const forceProductionMode = !!resendApiKey
  
  const newProductionCheck = (
    isNodeProduction || 
    isVercelProduction ||
    isVercelDeployment ||
    hasVercelDomain ||
    hasProductionDomain ||
    (!!resendApiKey && isDeployedEnvironment && notLocalhost) ||
    forceProductionMode // 🔥 FORCE PRODUCTION if API key exists
  )
  
  const isFullyProduction = newProductionCheck && !!resendApiKey

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_URL: process.env.VERCEL_URL,
    IS_ON_VERCEL: isOnVercel,
    IS_VERCEL_PRODUCTION: isVercelProduction,
    IS_NODE_PRODUCTION: isNodeProduction,
    IS_VERCEL_DEPLOYMENT: isVercelDeployment,
    HAS_VERCEL_DOMAIN: hasVercelDomain,
    HAS_PRODUCTION_DOMAIN: hasProductionDomain,
    NOT_LOCALHOST: notLocalhost,
    HAS_CLOUDFLARE_HEADERS: hasCloudflareHeaders,
    IS_DEPLOYED_ENVIRONMENT: isDeployedEnvironment,
    FORCE_PRODUCTION_MODE: forceProductionMode,
    RESEND_API_KEY_EXISTS: !!resendApiKey,
    RESEND_API_KEY_LENGTH: resendApiKey?.length || 0,
    RESEND_API_KEY_PREFIX: resendApiKey?.substring(0, 5) || 'N/A',
    OLD_PRODUCTION_CHECK: oldProductionCheck,
    NEW_PRODUCTION_CHECK: newProductionCheck,
    IS_FULLY_PRODUCTION: isFullyProduction,
    timestamp: new Date().toISOString(),
    build_version: 'v2.5 - FORCE PRODUCTION'
  })
}