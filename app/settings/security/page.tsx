"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sécurité</h1>
        <p className="text-muted-foreground">
          Gérez vos paramètres de sécurité et de confidentialité.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Paramètres de sécurité</CardTitle>
            <CardDescription>
              Ces paramètres vous aident à sécuriser votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Contenu de sécurité à venir */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 