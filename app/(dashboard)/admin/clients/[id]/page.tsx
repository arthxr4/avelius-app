"use client"

import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Copy, FileText, MoreHorizontal, Plus, Users, Pencil, CalendarDays, Target, Clock, Trash2, MoreVertical, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateContractDialog } from "@/components/clients/create-contract-dialog"
import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { AddMemberDialog } from "@/components/clients/add-member-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreatePeriodDialog } from "@/components/clients/create-period-dialog"

interface ContractPeriod {
  id: string;
  contract_id: string;
  period_start: string;
  period_end: string;
  goal: number;
  rdv_realised: number;
  status: 'active' | 'completed' | 'upcoming';
  performance_percent: number;
  days_remaining: number;
  expected_performance: number;
  performance_delta: number;
}

interface Contract {
  id: string;
  client_id: string;
  start_date: string;
  end_date: string | null;
  is_recurring: boolean;
  recurrence_unit: 'day' | 'week' | 'month' | null;
  recurrence_every: number | null;
  default_goal: number;
  status: 'active' | 'completed' | 'upcoming';
  periods: ContractPeriod[];
  expected_performance: number;
  performance_delta: number;
}

interface Member {
  id: string
  user_email: string
  accepted_at: string | null
  users: {
    first_name: string
    last_name: string
    email: string
    avatar_url: string | null
    status: string
  }
}

interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  contracts?: Contract[];
  members?: any[];
  documents?: any[];
}

export default function ClientPage() {
  const params = useParams()
  const clientId = params.id as string
  const [refreshKey, setRefreshKey] = useState(0)
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [periodToDelete, setPeriodToDelete] = useState<ContractPeriod | null>(null)
  const [periodToEdit, setPeriodToEdit] = useState<ContractPeriod | null>(null)
  const [newGoal, setNewGoal] = useState<number>(0)
  const [isDeletingPeriod, setIsDeletingPeriod] = useState(false)
  const [isEditingPeriod, setIsEditingPeriod] = useState(false)

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const response = await fetch(`/api/get-client-details?id=${clientId}`)
        if (!response.ok) throw new Error('Failed to fetch client data')
        const data = await response.json()
        setClientData(data)
      } catch (error) {
        console.error('Error fetching client data:', error)
        toast.error('Erreur lors du chargement des données du client')
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
  }, [clientId, refreshKey])

  const copyId = () => {
    navigator.clipboard.writeText(clientId)
    toast.success("ID copié dans le presse-papier")
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Non défini'
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: fr })
    } catch (error) {
      console.error('Erreur de formatage de date:', error)
      return 'Date invalide'
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Convert file to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const base64Data = await base64Promise

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          files: {
            file: {
              name: file.name,
              type: file.type,
              data: base64Data,
            },
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to upload file")

      toast.success("Document ajouté avec succès")
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Erreur lors de l'ajout du document")
    }
  }

  const handleDeleteFile = async (fileName: string) => {
    try {
      const response = await fetch(`/api/onboarding?clientId=${clientId}&fileName=${fileName}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete file")

      toast.success("Document supprimé avec succès")
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error("Error deleting file:", error)
      toast.error("Erreur lors de la suppression du document")
    }
  }

  const handleDeleteMember = async () => {
    if (!memberToDelete) return
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/delete-member`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          userEmail: memberToDelete.user_email,
        }),
      })

      if (!response.ok) throw new Error('Failed to delete member')

      toast.success('Membre supprimé avec succès')
      setMemberToDelete(null)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Error deleting member:', error)
      toast.error('Erreur lors de la suppression du membre')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeletePeriod = async () => {
    if (!periodToDelete) return
    setIsDeletingPeriod(true)

    try {
      const response = await fetch(`/api/contract/period/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          periodId: periodToDelete.id,
        }),
      })

      if (!response.ok) throw new Error('Failed to delete period')

      toast.success('Période supprimée avec succès')
      setPeriodToDelete(null)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Error deleting period:', error)
      toast.error('Erreur lors de la suppression de la période')
    } finally {
      setIsDeletingPeriod(false)
    }
  }

  const handleEditPeriod = async () => {
    if (!periodToEdit || !newGoal) return
    setIsEditingPeriod(true)

    try {
      const response = await fetch(`/api/contract/period/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          periodId: periodToEdit.id,
          goal: newGoal,
        }),
      })

      if (!response.ok) throw new Error('Failed to update period')

      toast.success('Objectif mis à jour avec succès')
      setPeriodToEdit(null)
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Error updating period:', error)
      toast.error("Erreur lors de la mise à jour de l'objectif")
    } finally {
      setIsEditingPeriod(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-2 sm:py-4 lg:px-6 pb-20 md:pb-4">
        <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-7">
          <div className="space-y-6 md:col-span-5">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-32 animate-pulse rounded-md bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6 md:col-span-2">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-24 animate-pulse rounded-md bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-2 sm:py-4 lg:px-6 pb-20 md:pb-4">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{clientData?.name}</h1>
          <p className="text-sm text-muted-foreground">ID: {clientId}</p>
        </div>
        <div className="flex items-center gap-2">
          {clientData && clientData.contracts && clientData.contracts.length > 0 ? (
            <Button>
              <Clock className="mr-2 h-4 w-4" />
              Gérer le contrat
            </Button>
          ) : (
            <CreateContractDialog
              clientId={clientId}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un contrat
                </Button>
              }
              onSuccess={() => setRefreshKey(prev => prev + 1)}
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Supprimer le client</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-7">
        {/* Colonne principale */}
        <div className="space-y-6 md:col-span-5">
          {/* Section Contrat */}
          <div className={`grid gap-6 grid-cols-1 ${clientData && clientData.contracts && clientData.contracts.length > 0 ? 'md:grid-cols-2' : 'md:col-span-2'}`}>
            <Card className={clientData && clientData.contracts && clientData.contracts.length > 0 ? '' : 'md:col-span-2'}>
              <CardHeader>
                <CardTitle>Contrat</CardTitle>
                <CardDescription>Détails du contrat client</CardDescription>
              </CardHeader>
              <CardContent>
                {clientData && clientData.contracts && clientData.contracts.length > 0 ? (
                  <div className="space-y-6">
                    {clientData.contracts.map((contract) => (
                      <div key={contract.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                contract.status === 'active' ? 'default' :
                                contract.status === 'completed' ? 'secondary' :
                                'outline'
                              }>
                                {contract.status === 'active' ? 'Actif' :
                                 contract.status === 'completed' ? 'Terminé' :
                                 'À venir'}
                              </Badge>
                              <Badge variant="outline">
                                {contract.is_recurring ? 'Récurrent' : 'One-shot'}
                              </Badge>
                              {contract.is_recurring && (
                                <Badge variant="secondary">
                                  {contract.recurrence_every}{' '}
                                  {contract.recurrence_unit === 'month' ? 'mois' : 'jours'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Du {formatDate(contract.start_date)} {contract.end_date ? `au ${formatDate(contract.end_date)}` : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Objectif par défaut</p>
                            <p className="text-2xl font-bold">{contract.default_goal} RDV</p>
                          </div>
                        </div>
                        {contract.status === 'active' && (
                          <Button variant="outline" className="w-full">
                            <Clock className="mr-2 h-4 w-4" />
                            Gérer le contrat
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                      <CalendarDays className="h-10 w-10 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">Aucun contrat</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Ce client n'a pas encore de contrat. Créez un contrat pour commencer le suivi.
                      </p>
                      <CreateContractDialog
                        clientId={clientId}
                        trigger={
                          <Button className="mt-4">
                            <Plus className="mr-2 h-4 w-4" />
                            Créer un contrat
                          </Button>
                        }
                        onSuccess={() => setRefreshKey(prev => prev + 1)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {clientData && clientData.contracts && clientData.contracts.some(c => c.status === 'active' && c.periods.length > 0) ? (
              <Card>
                <CardHeader>
                  <CardTitle>Période en cours</CardTitle>
                  <CardDescription>Suivi de la période actuelle</CardDescription>
                </CardHeader>
                <CardContent>
                  {clientData.contracts
                    .filter(c => c.status === 'active')
                    .map(contract => {
                      const activePeriod = contract.periods.find(p => p.status === 'active')
                      if (!activePeriod) return null
                      
                      return (
                        <div key={activePeriod.id} className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="default">En cours</Badge>
                                <span className="text-sm">
                                  {formatDate(activePeriod.period_start)} - {formatDate(activePeriod.period_end)}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {activePeriod.days_remaining} jours restants
                            </p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Progression</span>
                              <span className="text-sm font-medium">
                                {activePeriod.rdv_realised} / {activePeriod.goal} RDV
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{
                                  width: `${Math.min(
                                    (activePeriod.rdv_realised / activePeriod.goal) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                            <div className="flex justify-end">
                              <Badge variant="outline">
                                {activePeriod.performance_percent}% réalisé
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </CardContent>
              </Card>
            ) : clientData && clientData.contracts && clientData.contracts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Période en cours</CardTitle>
                  <CardDescription>Aucune période active</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-8 gap-4">
                    <CalendarDays className="h-8 w-8 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Pas de période active</p>
                      <p className="text-sm text-muted-foreground">
                        Créez une nouvelle période pour commencer le suivi
                      </p>
                    </div>
                    <CreatePeriodDialog
                      clientId={clientId}
                      trigger={
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Créer une période
                        </Button>
                      }
                      onSuccess={() => setRefreshKey(prev => prev + 1)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Section Périodes & Objectifs */}
          {clientData?.contracts && clientData.contracts.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Périodes & Objectifs</CardTitle>
                  <CardDescription>Historique et suivi des périodes</CardDescription>
                </div>
                <CreatePeriodDialog
                  clientId={clientId}
                  trigger={
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Créer une période
                    </Button>
                  }
                  onSuccess={() => setRefreshKey(prev => prev + 1)}
                />
              </CardHeader>
              <CardContent>
                {clientData && clientData.contracts && clientData.contracts.some(contract => contract.periods.length > 0) ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contrat</TableHead>
                        <TableHead>Période</TableHead>
                        <TableHead>Objectif</TableHead>
                        <TableHead>RDV réalisés</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientData.contracts.flatMap(contract =>
                        contract.periods.map(period => (
                          <TableRow key={period.id}>
                            <TableCell className="font-medium">
                              {contract.is_recurring ? 'Récurrent' : 'One-shot'}
                            </TableCell>
                            <TableCell>
                              {formatDate(period.period_start)} - {formatDate(period.period_end)}
                            </TableCell>
                            <TableCell>{period.goal} RDV</TableCell>
                            <TableCell>{period.rdv_realised}</TableCell>
                            <TableCell>{period.performance_percent}%</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant={period.status === 'completed' ? 'default' : 'secondary'}>
                                  {period.status === 'completed' ? 'Terminée' : 'En cours'}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setPeriodToEdit(period)
                                        setNewGoal(period.goal)
                                      }}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Modifier l'objectif
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setPeriodToDelete(period)}
                                      className="text-destructive hover:bg-destructive/10 data-[highlighted]:text-destructive data-[highlighted]:bg-destructive/10"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Supprimer la période
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                    <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                      <Target className="h-10 w-10 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">Aucune période enregistrée</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Créez une première période et définissez les objectifs pour commencer le suivi des performances.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Section Membres */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Membres</CardTitle>
                <CardDescription>Gérez les membres associés au client</CardDescription>
              </div>
              <AddMemberDialog
                clientId={clientId}
                trigger={
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Inviter
                  </Button>
                }
                onSuccess={() => setRefreshKey(prev => prev + 1)}
              />
            </CardHeader>
            <CardContent>
              {clientData && clientData.members && clientData.members.length > 0 ? (
                <div className="space-y-4">
                  {clientData.members.map((member: Member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {member.users.avatar_url ? (
                          <img
                            src={member.users.avatar_url}
                            alt={`${member.users.first_name} ${member.users.last_name}`}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            
                          </div>
                        )}
                        <div>
                          <p className="font-medium">
                            {member.users.first_name} {member.users.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.users.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {member.users.status === 'active' ? 'Actif' : 'En attente'}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => setMemberToDelete(member)}
                              className="text-destructive hover:bg-destructive/10 data-[highlighted]:text-destructive data-[highlighted]:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer le membre
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                    <Users className="h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Aucun membre</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Ce client n'a pas encore de membre associé. Ajoutez des membres pour leur donner accès.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog de confirmation de suppression */}
          <Dialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer {memberToDelete?.users.first_name} {memberToDelete?.users.last_name} de ce client ?
                  Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setMemberToDelete(null)}
                  className="w-full sm:w-auto"
                  disabled={isDeleting}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteMember}
                  className="w-full sm:w-auto"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog de modification de l'objectif */}
          <Dialog open={!!periodToEdit} onOpenChange={(open) => !open && setPeriodToEdit(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier l'objectif</DialogTitle>
                <DialogDescription>
                  Modifiez l'objectif de RDV pour la période du {formatDate(periodToEdit?.period_start)} au {formatDate(periodToEdit?.period_end)}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="goal" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Nouvel objectif
                  </label>
                  <Input
                    id="goal"
                    type="number"
                    value={newGoal}
                    onChange={(e) => setNewGoal(parseInt(e.target.value))}
                    min={1}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setPeriodToEdit(null)}
                  className="w-full sm:w-auto"
                  disabled={isEditingPeriod}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleEditPeriod}
                  className="w-full sm:w-auto"
                  disabled={isEditingPeriod || !newGoal || newGoal < 1}
                >
                  {isEditingPeriod ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    'Modifier'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog de confirmation de suppression de période */}
          <Dialog open={!!periodToDelete} onOpenChange={(open) => !open && setPeriodToDelete(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer la suppression</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer la période du {formatDate(periodToDelete?.period_start)} au {formatDate(periodToDelete?.period_end)} ?
                  Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setPeriodToDelete(null)}
                  className="w-full sm:w-auto"
                  disabled={isDeletingPeriod}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeletePeriod}
                  className="w-full sm:w-auto"
                  disabled={isDeletingPeriod}
                >
                  {isDeletingPeriod ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    'Supprimer'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Section Documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Gérez les documents du client</CardDescription>
              </div>
              <div>
                <Input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  id="file-upload"
                />
                <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {clientData && clientData.documents && clientData.documents.length > 0 ? (
                <div className="space-y-4">
                  {clientData.documents.map((doc) => (
                    <div key={doc.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(doc.size / 1024 / 1024).toFixed(2)} MB • {formatDate(doc.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.publicUrl} target="_blank" rel="noopener noreferrer">
                            Voir
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.publicUrl} download>
                            Télécharger
                          </a>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteFile(doc.name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Aucun document</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Ce client n'a pas encore de document. Ajoutez des documents pour les partager.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne de détails */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Détails</CardTitle>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ID du client</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono">{clientId}</p>
                  <Button variant="ghost" size="icon" className="h-4 w-4" onClick={copyId}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Client(e) depuis</p>
                <p className="text-sm">
                  {formatDate(clientData?.created_at)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Statut</p>
                <Badge>Actif</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Métadonnées</CardTitle>
              <Button variant="ghost" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[100px] flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">Aucune métadonnée</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
