"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AddMemberDialog } from "@/components/add-member-dialog"

type Member = {
  id: string
  first_name: string
  last_name: string
  email: string
  role: "admin" | "agent"
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])

  const fetchMembers = async () => {
    const res = await fetch("/api/get-members", { credentials: "include" })
    const data = await res.json()
    setMembers(data)
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Membres internes</h1>
        <AddMemberDialog onAdded={fetchMembers} />
      </div>

      <Card className="p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Nom</th>
              <th className="py-2">Email</th>
              <th className="py-2">Rôle</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b">
                <td className="py-2">
                  {member.first_name} {member.last_name}
                </td>
                <td className="py-2">{member.email}</td>
                <td className="py-2">{member.role}</td>
                <td className="py-2 text-right space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Modifier
                  </Button>
                  <Button variant="destructive" size="sm" disabled>
                    Supprimer
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
