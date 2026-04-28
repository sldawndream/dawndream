import { NextResponse } from 'next/server';

// ── Blocked IPs — add any IP here to block site-wide access ──
const BLOCKED_IPS = [
  '45.13.6.185',
  // Add more IPs below as needed:
  // '1.2.3.4',
];

export function middleware(request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '';

  if (BLOCKED_IPS.includes(ip)) {
    // Return a plain 403 — give no information about the site
    return new NextResponse('Access denied.', { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  // Apply to all routes except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
