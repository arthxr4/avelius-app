import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, format } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!from || !to) {
      return NextResponse.json(
        { error: "Les dates 'from' et 'to' sont requises" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const fromDate = new Date(from)
    const toDate = new Date(to)
    const diffInDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Récupérer tous les rendez-vous pour la période
    const { data: appointments } = await supabase
      .from('appointments')
      .select('created_at')
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString())
      .order('created_at', { ascending: true })

    if (diffInDays <= 30) {
      // Affichage journalier
      const days = eachDayOfInterval({ start: fromDate, end: toDate })
      
      const dailyData = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const count = appointments?.filter(apt => 
          apt.created_at.startsWith(dayStr)
        ).length || 0

        return {
          date: format(day, 'd MMM', { locale: fr }),
          appointments: count
        }
      })

      return NextResponse.json({
        data: dailyData,
        type: 'daily'
      })
    } else {
      // Affichage hebdomadaire
      const weeks = eachWeekOfInterval(
        { start: fromDate, end: toDate },
        { locale: fr }
      )

      const weeklyData = weeks.map(week => {
        const weekStart = startOfWeek(week, { locale: fr })
        const weekEnd = endOfWeek(week, { locale: fr })
        
        const count = appointments?.filter(apt => {
          const aptDate = new Date(apt.created_at)
          return aptDate >= weekStart && aptDate <= weekEnd
        }).length || 0

        return {
          date: `${format(weekStart, 'd MMM', { locale: fr })}`,
          appointments: count
        }
      })

      return NextResponse.json({
        data: weeklyData,
        type: 'weekly'
      })
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des données du graphique" },
      { status: 500 }
    )
  }
} 