import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { getAuth, currentUser } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req)
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Récupérer l'email de l'utilisateur
    const user = await currentUser()
    if (!user?.emailAddresses[0]?.emailAddress) {
      return new NextResponse('Email not found', { status: 400 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const cookies = new URL(req.url).searchParams.get('cookies')
            if (!cookies) return ''
            
            const cookie = JSON.parse(cookies)
            return cookie[name]
          },
        },
      }
    )
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.emailAddresses[0].emailAddress)
      .single()

    if (error || !userData || userData.role !== 'admin') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 