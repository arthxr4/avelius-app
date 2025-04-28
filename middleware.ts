import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const isBypassedRoute = createRouteMatcher([
  '/api/webhook/clerk',
])

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/unauthorized',
])

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
])

// Client admin Supabase (service_role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default clerkMiddleware(async (auth, req) => {
  if (isBypassedRoute(req)) {
    console.log("🛑 Middleware bypassed for:", req.nextUrl.pathname)
    return NextResponse.next()
  }

  const { userId } = await auth()

  if (isAdminRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (error || !userData || userData.role !== 'admin') {
      console.warn("⛔ Middleware access denied - not admin", { userData, error })
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  if (!isPublicRoute(req) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|api/webhook/clerk|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
