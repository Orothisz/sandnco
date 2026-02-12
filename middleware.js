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

  // 3. DEFINE RESTRICTED ZONES (The "VIP" Areas)
  // If user is NOT logged in, and tries to visit these paths...
  if (!session && (path.startsWith('/dashboard') || path.startsWith('/request'))) {
    // ...Redirect them to Login immediately.
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 4. DEFINE PUBLIC ZONES (Optional: Kick logged-in users out of login page)
  // If user IS logged in, and tries to visit /login or /signup...
  if (session && (path === '/login' || path === '/signup')) {
    // ...Send them to Dashboard.
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

// 5. CONFIGURE MATCHER
// This tells Next.js to run this security check on specific paths
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
