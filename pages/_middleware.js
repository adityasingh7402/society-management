import { NextResponse } from 'next/server';

export function middleware(req) {
  // Initialize WebSocket connection if needed
  if (req.nextUrl.pathname.startsWith('/api/websocket')) {
    // This will trigger the WebSocket initialization
    return NextResponse.next();
  }
  
  return NextResponse.next();
}