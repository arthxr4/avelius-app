import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { useUserRole } from "@/hooks/useUserRole"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import { LayoutDashboard, Users, Phone, CalendarDays, Building2, Gauge } from "lucide-react"
import { Button } from "@/components/ui/button"

// ... autres imports ...

export default function Sidebar() {
  const pathname = usePathname()
  const { role, loading } = useUserRole()
  const { isAdmin, loading: isAdminLoading } = useIsAdmin()

  if (loading || isAdminLoading) {
    return null // ou un skeleton/loader si vous préférez
  }

  return (
    <aside className="w-[200px] border-r h-screen px-4 py-6 bg-background">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Link href="/dashboard">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                Navigation
              </h2>
            </Link>
            <nav className="grid items-start gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full justify-start">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/contacts">
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Contacts
                </Button>
              </Link>
              <Link href="/sessions">
                <Button variant="ghost" className="w-full justify-start">
                  <Phone className="mr-2 h-4 w-4" />
                  Sessions de phoning
                </Button>
              </Link>
              <Link href="/appointments">
                <Button variant="ghost" className="w-full justify-start">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Rendez-vous
                </Button>
              </Link>
            </nav>
          </div>
        </div>
        {isAdmin && !loading && (
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Admin
            </h2>
            <nav className="grid items-start gap-2">
              <Link href="/admin/overview">
                <Button variant="ghost" className="w-full justify-start">
                  <Gauge className="mr-2 h-4 w-4" />
                  Cockpit
                </Button>
              </Link>
              <Link href="/admin/clients">
                <Button variant="ghost" className="w-full justify-start">
                  <Building2 className="mr-2 h-4 w-4" />
                  Gestion Clients
                </Button>
              </Link>
              <Link href="/admin/members">
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Gestion Members
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </aside>
  )
} 