import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  // -------------------------------------------------------------
  // SECURITY LEVEL 1: GOD MODE (ADMIN PANEL)
  // -------------------------------------------------------------
  if (path.startsWith('/admin')) {
    // Normalizing email to prevent case-sensitivity lockouts
    const userEmail = session?.user?.email?.toLowerCase().trim();
    const adminEmail = 'admin@sandnco.lol'; 

    if (!session || userEmail !== adminEmail) {
      // STEALTH MODE: Rewrite to 404
      return NextResponse.rewrite(new URL('/404', req.url))
    }
  }

  // -------------------------------------------------------------
  // SECURITY LEVEL 2: RESTRICTED ZONES (OPERATIVES ONLY)
  // -------------------------------------------------------------
  if (!session && (path.startsWith('/dashboard') || path.startsWith('/request'))) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // -------------------------------------------------------------
  // SECURITY LEVEL 3: PUBLIC ZONES (NO BACKSIES)
  // -------------------------------------------------------------
  if (session && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

// -------------------------------------------------------------
// CONFIGURATION (THE FIX FOR LOGO.PNG)
// -------------------------------------------------------------
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /api/ (API routes)
     * 2. /_next/ (Next.js internals)
     * 3. /static (Static files)
     * 4. /favicon.ico, /sitemap.xml (SEO files)
     * 5. /logo.png (YOUR IMAGE FIX)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
}
