import { NextResponse } from 'next/server'

export default function middleware(request) {
  // Allow WebSocket upgrade requests
  if (request.headers.get('upgrade') === 'websocket') {
    return NextResponse.next()
  }

  // Handle other requests
  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/api/websocket',  // Add WebSocket route
    '/:path*'
  ]
}