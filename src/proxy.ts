import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const publicPaths = ['/', '/login', '/register', '/auth/callback', '/auth/verify', '/auth/confirm']
  const isPublicPath = publicPaths.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)))
  // API routes handle their own auth and return a JSON 401/403 — redirecting
  // them to the /login HTML page here would mask that behind a 200 instead.
  const isApiPath = pathname.startsWith('/api/')

  // GET-only, same reasoning as the /login,/register rule below: a Server
  // Action call on a protected page (e.g. a session expiring mid-session)
  // is a POST to that same pathname, and redirecting it produces "An
  // unexpected response was received from the server" instead of letting
  // the action run and return its own { error: 'Not authenticated' }.
  // Verified safe before making this change: every server action actually
  // reachable from client code already checks auth.getUser() itself
  // (grep across src/lib/actions/*.ts and src/components/match/MatchCard.tsx)
  // — see BUILDER_OUTPUT.md for the specific exceptions checked and why
  // none of them are affected.
  if (request.method === 'GET' && !user && !isPublicPath && !isApiPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // GET-only: a signed-in user's Server Action calls (e.g. Step 2 of
  // registration, submitted from a form still sitting on /register) are
  // POSTs to this same pathname. Redirecting those meant the action never
  // ran at all — the client saw a 307 to /dashboard instead of the
  // expected action response and threw "An unexpected response was
  // received from the server." This is the root cause of Step 2 silently
  // failing, confirmed locally and against the live Vercel deployment: the
  // signup in Step 1 leaves an active session (this project doesn't
  // require email confirmation before a session exists), so by Step 2 the
  // request already carries an auth cookie while still on /register.
  if (user && request.method === 'GET' && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
