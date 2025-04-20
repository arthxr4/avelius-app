import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'


// Routes que l'on veut ignorer complètement (ex : webhooks)
const isBypassedRoute = createRouteMatcher([
  '/api/webhook/clerk',
])

// Routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/unauthorized',
])

// Routes that require admin role
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
])

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default clerkMiddleware(async (auth, req) => {
   // 🔁 Ne pas appliquer le middleware à ces routes
   if (isBypassedRoute(req)) {
    console.log("🛑 Middleware bypassed for:", req.nextUrl.pathname)
    return NextResponse.next()
  }
  const { userId } = await auth()

  // For admin routes, check if user has admin role in Supabase
  if (isAdminRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !userData || userData.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  // For all other non-public routes, just check if user is authenticated
  if (!isPublicRoute(req) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  // Allow the request to continue
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Exclure le webhook Clerk
    '/((?!_next|api/webhook/clerk|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Inclure toutes les API
    '/(api|trpc)(.*)',
  ],
}

