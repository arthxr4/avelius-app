"use client"

import { useEffect, useState } from "react"
import { Member, columns } from "./columns"
import { DataTable } from "@/components/members/table"
import { Skeleton } from "@/components/ui/skeleton"
import { AddMemberDialog } from "@/components/members/add-member-dialog"

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/get-members", {
        next: { revalidate: 60 },
      })
      if (!response.ok) {
        throw new Error("Failed to fetch members")
      }
      const data = await response.json()
      setMembers(data)
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Membres</h2>
        <AddMemberDialog />
      </div>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <DataTable columns={columns} data={members} />
      )}
    </div>
  )
}
