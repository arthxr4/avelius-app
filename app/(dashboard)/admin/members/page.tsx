"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { AddMemberDialog } from "@/components/members/add-member-dialog"
import { DataTable } from "@/components/members/table"
import { columns } from "./columns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Member } from "./columns"

function MembersTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-[200px]" />
        <div className="rounded-md border">
          <div className="border-b p-4">
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cache, setCache] = useState<Member[] | null>(null)

  // Afficher le skeleton immédiatement
  useEffect(() => {
    setIsLoading(true)
  }, [])

  const fetchMembers = useCallback(async () => {
    try {
      // Vérifier le cache
      if (cache) {
        setMembers(cache)
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/get-members")
      if (!response.ok) {
        throw new Error("Failed to fetch members")
      }
      const data = await response.json()
      setMembers(data)
      setCache(data)
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setIsLoading(false)
    }
  }, [cache])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const activeMembers = members.filter(m => m.id.startsWith('user_') || (!m.id.startsWith('inv_') && !m.id.startsWith('user_')))
  const pendingMembers = members.filter(m => m.id.startsWith('inv_'))

  const columnsWithRefresh = columns.map(column => {
    if (column.id === "actions") {
      return {
        ...column,
        cell: ({ row }: any) => {
          const Cell = column.cell as any
          return Cell({ row, onSuccess: fetchMembers })
        }
      }
    }
    return column
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
      <div className="">
          <h1 className="text-xl font-bold">Équipe interne</h1>
          <p className="text-sm text-muted-foreground">
            Gestion des membres internes à Avelius
          </p>
        </div>
        
        <AddMemberDialog onSuccess={fetchMembers} />
      </div>
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="pending">
            En attente
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <MembersTableSkeleton />
          ) : (
            <DataTable columns={columnsWithRefresh} data={activeMembers} />
          )}
        </TabsContent>
        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <MembersTableSkeleton />
          ) : (
            <DataTable columns={columnsWithRefresh} data={pendingMembers} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
