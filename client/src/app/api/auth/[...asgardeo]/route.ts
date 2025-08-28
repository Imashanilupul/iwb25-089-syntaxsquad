import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    user: null,
    isAuthenticated: false 
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: "Auth endpoint" 
  });
}
