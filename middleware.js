import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  
  // 1. Create a Supabase Client specific to the Middleware
  const supabase = createMiddlewareClient({ req, res })

  // 2. Refresh the Session (securely checks cookies)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  // -------------------------------------------------------------
  // SECURITY LEVEL 1: GOD MODE (ADMIN PANEL)
  // -------------------------------------------------------------
  // If the path is /admin...
  if (path.startsWith('/admin')) {
    // Check if the user is NOT the specific admin email
    if (!session || session.user.email !== 'admin@sandnco.lol') {
      // STEALTH MODE: Rewrite to 404 so hackers think the page doesn't exist
      // (Instead of redirecting, which tells them "You are forbidden")
      return NextResponse.rewrite(new URL('/404', req.url))
    }
  }

  // -------------------------------------------------------------
  // SECURITY LEVEL 2: RESTRICTED ZONES (OPERATIVES ONLY)
  // -------------------------------------------------------------
  // If user is NOT logged in, and tries to visit protected areas...
  if (!session && (path.startsWith('/dashboard') || path.startsWith('/request'))) {
    // ...Redirect them to Login immediately.
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // -------------------------------------------------------------
  // SECURITY LEVEL 3: PUBLIC ZONES (NO BACKSIES)
  // -------------------------------------------------------------
  // If user IS logged in, and tries to visit /login or /signup...
  if (session && (path === '/login' || path === '/signup')) {
    // ...Send them to Dashboard.
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

// 5. CONFIGURE MATCHER
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /api/ (API routes must be public for Telegram Webhooks!)
     * 2. /_next/ (Next.js internals)
     * 3. /static (Images, fonts, etc.)
     * 4. /favicon.ico, /sitemap.xml (SEO files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
