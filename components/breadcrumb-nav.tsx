"use client"

import { usePathname } from "next/navigation"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { useTeam } from "@/lib/team-context"
import { useUser } from "@clerk/nextjs"

const breadcrumbTitles: { [key: string]: string } = {
  clients: "Clients",
  "phoning-sessions": "Sessions de phoning",
  meetings: "Rendez-vous",
  prospects: "Prospects",
  dashboard: "Accueil",
}

export function BreadcrumbNav() {
  const pathname = usePathname()
  const { current } = useTeam()
  const { user } = useUser()
  const userRole = user?.publicMetadata?.role as "admin" | "agent" | "manager" | undefined
  const isInternalUser = userRole === "admin" || userRole === "agent"
  
  // Supprimer le préfixe (dashboard) et diviser le chemin
  const segments = pathname.split("/").filter(Boolean)
  const isClientSection = segments.includes("clients")
  
  // Si c'est un manager (client)
  if (userRole === "manager") {
    // Si on est sur la page d'accueil du client
    if (segments.length <= 2) {
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Accueil</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
    }

    // Si on est dans une sous-section
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Accueil</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {breadcrumbTitles[segments[segments.length - 1]] || segments[segments.length - 1]}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  // Pour un admin/agent dans une section client
  if (isInternalUser && isClientSection && current) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/clients">Clients</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/clients/${current.id}`}>
              {current.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.length > 2 && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {breadcrumbTitles[segments[segments.length - 1]] || segments[segments.length - 1]}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  // Pour un admin/agent dans les autres sections
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const path = `/${segments.slice(0, index + 1).join("/")}`
          const isLast = index === segments.length - 1
          
          // Si c'est un ID de client, utiliser le nom du client actuel
          if (current && segments[index - 1] === "clients" && segment === current.id) {
            return (
              <BreadcrumbItem key={path}>
                <BreadcrumbLink href={path}>
                  {current.name}
                </BreadcrumbLink>
                {!isLast && <BreadcrumbSeparator />}
              </BreadcrumbItem>
            )
          }

          return (
            <BreadcrumbItem key={path}>
              {isLast ? (
                <BreadcrumbPage>
                  {breadcrumbTitles[segment] || segment}
                </BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink href={path}>
                    {breadcrumbTitles[segment] || segment}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
} 