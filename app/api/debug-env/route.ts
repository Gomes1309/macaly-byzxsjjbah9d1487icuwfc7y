import { NextResponse } from 'next/server'

export async function GET() {
  const resendApiKey = process.env.RESEND_API_KEY
  const isProduction = (
    process.env.NODE_ENV === 'production' || 
    process.env.VERCEL_ENV === 'production' ||
    process.env.VERCEL === '1'
  ) && resendApiKey

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL: process.env.VERCEL,
    RESEND_API_KEY_EXISTS: !!process.env.RESEND_API_KEY,
    RESEND_API_KEY_LENGTH: process.env.RESEND_API_KEY?.length || 0,
    RESEND_API_KEY_PREFIX: process.env.RESEND_API_KEY?.substring(0, 5) || 'N/A',
    OLD_PRODUCTION_CHECK: process.env.NODE_ENV === 'production' && !!process.env.RESEND_API_KEY,
    NEW_PRODUCTION_CHECK: isProduction,
    timestamp: new Date().toISOString(),
    build_version: 'v2.0'
  })
}