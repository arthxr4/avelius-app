"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function BillingPage() {
  return (
    <div className="container max-w-6xl space-y-6 p-8">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Facturation</h2>
        <p className="text-muted-foreground">
          Gérez vos informations de facturation et votre abonnement.
        </p>
      </div>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Abonnement actuel</CardTitle>
          <CardDescription>
            Consultez et gérez votre abonnement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La gestion des abonnements sera bientôt disponible.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 