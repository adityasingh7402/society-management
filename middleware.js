import { NextResponse } from 'next/server'

export default function middleware(request) {
  // Allow WebSocket upgrade requests
  if (request.headers.get('upgrade') === 'websocket') {
    return NextResponse.next()
  }

  // Handle CORS
  const response = NextResponse.next()
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/api/websocket',  // Add WebSocket route
    '/api/:path*',     // Apply to all API routes
    '/:path*'
  ]
}