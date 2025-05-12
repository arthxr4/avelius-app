"use client"

import { useCallback, useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  CardWithDividers,
  CardWithDividersHeader,
  CardWithDividersTitle,
  CardWithDividersDescription,
  CardWithDividersContent,
  CardWithDividersFooter,
} from "@/components/ui/card-with-dividers"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Loader2, FileIcon, ExternalLink, X } from "lucide-react"
import { FileField } from "@/components/onboarding/file-field"

interface OnboardingField {
  id: string
  label: string
  type: string
  required: boolean
  created_at: string
  section: 'company' | 'targeting' | 'pitch' | 'resources' | 'tech' | 'confirm'
  order_in_section: number
}

interface OnboardingResponse {
  id: string
  client_id: string
  field_id: string
  value: string
  created_at: string
  updated_at: string
}

interface OnboardingFormProps {
  clientId: string
  fields: OnboardingField[]
  responses: OnboardingResponse[]
}

const sectionTitles: Record<OnboardingField['section'], { title: string; description: string }> = {
  company: {
    title: "1 - À propos de l'entreprise",
    description: "Informations générales sur l'entreprise et son activité",
  },
  targeting: {
    title: "2 - Ciblage & prospects",
    description: "Définition de la cible et des critères de prospection",
  },
  pitch: {
    title: "3 - Argumentaire de vente",
    description: "Messages clés et points de différenciation",
  },
  resources: {
    title: "4 - Docs & fichiers",
    description: "Documents et ressources nécessaires",
  },
  tech: {
    title: "5 - Setup technique",
    description: "Configuration et paramètres techniques",
  },
  confirm: {
    title: "Validation finale",
    description: "Vérification et confirmation des informations",
  },
}

export function OnboardingForm({ clientId, fields, responses }: OnboardingFormProps) {
  const [formData, setFormData] = useState<Record<string, string | boolean>>({})
  const [submittingSections, setSubmittingSections] = useState<Record<string, boolean>>({})
  const [files, setFiles] = useState<Record<string, File>>({})
  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>({})

  // Initialize form data with existing responses
  useEffect(() => {
    const initialData: Record<string, string | boolean> = {}
    fields.forEach((field) => {
      const response = responses.find((r) => r.field_id === field.id)
      if (response) {
        initialData[field.id] = field.type === "checkbox" 
          ? response.value === "true"
          : response.value
      } else {
        initialData[field.id] = field.type === "checkbox" ? false : ""
      }
    })
    setFormData(initialData)
  }, [fields, responses])

  const handleInputChange = useCallback((fieldId: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
    setDirtyFields((prev) => ({ ...prev, [fieldId]: true }))
  }, [])

  const handleFileChange = useCallback((fieldId: string, file: File | null) => {
    if (file) {
      setFiles((prev) => ({ ...prev, [fieldId]: file }))
      setDirtyFields((prev) => ({ ...prev, [fieldId]: true }))
    } else {
      setFiles((prev) => {
        const newFiles = { ...prev }
        delete newFiles[fieldId]
        return newFiles
      })
    }
  }, [])

  const handleSubmit = async (section: OnboardingField['section'], sectionFields: OnboardingField[]) => {
    setSubmittingSections((prev) => ({ ...prev, [section]: true }))

    try {
      // Get only the data for this section's fields
      const sectionFormData: Record<string, string | boolean> = {}
      const sectionFiles: Record<string, File> = {}

      sectionFields.forEach((field) => {
        if (dirtyFields[field.id]) {
          // Ne pas inclure les champs de type fichier dans formData
          if (field.type !== 'file') {
            sectionFormData[field.id] = formData[field.id]
          }
          if (files[field.id]) {
            sectionFiles[field.id] = files[field.id]
          }
        }
      })

      // If no changes in this section, skip the API call
      if (Object.keys(sectionFormData).length === 0 && Object.keys(sectionFiles).length === 0) {
        toast.info("Aucune modification à enregistrer")
        return
      }

      // Convert files to base64
      const fileData: Record<string, { name: string; type: string; data: string }> = {}
      for (const [fieldId, file] of Object.entries(sectionFiles)) {
        const reader = new FileReader()
        const data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        fileData[fieldId] = {
          name: file.name,
          type: file.type,
          data,
        }
      }

      // Send data to API
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          formData: sectionFormData,
          files: fileData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save onboarding data")
      }

      // Clear dirty flags for the submitted fields
      setDirtyFields((prev) => {
        const newDirty = { ...prev }
        sectionFields.forEach((field) => {
          delete newDirty[field.id]
        })
        return newDirty
      })

      toast.success("Les informations ont été enregistrées avec succès")
    } catch (error) {
      console.error("Error saving onboarding data:", error)
      toast.error("Une erreur est survenue lors de l'enregistrement")
    } finally {
      setSubmittingSections((prev) => ({ ...prev, [section]: false }))
    }
  }

  // Fonction pour générer des placeholders pertinents
  const getPlaceholder = (field: OnboardingField) => {
    const label = field.label.toLowerCase()
    
    // Placeholders spécifiques pour chaque champ
    if (label.includes("description de l'entreprise")) 
      return "Agence de growth marketing B2B spécialisée dans la génération de leads qualifiés pour les éditeurs de logiciels. 5 ans d'expérience, équipe de 12 personnes."

    if (label.includes("proposition de valeur")) 
      return "Nous générons 50+ leads B2B qualifiés par mois pour les éditeurs de logiciels, avec un taux de transformation de 15% en moyenne"

    if (label.includes("chiffres clés")) 
      return "CA 2023: 1.2M€, 150 clients actifs, Ticket moyen: 3500€/mois, LTV: 24 mois, Taux de rétention: 85%"

    if (label.includes("site web")) 
      return "https://www.votreentreprise.com"

    if (label.includes("méthodologie commerciale")) 
      return "Prospection via LinkedIn (Social Selling) et emailing, Qualification BANT, Démos produit en 3 étapes"

    if (label.includes("objections fréquentes")) 
      return "1. 'C'est trop cher' → ROI démontré en 3 mois\n2. 'Nous le faisons en interne' → Comparaison coûts/résultats\n3. 'Pas le bon moment' → Offre d'audit gratuit"

    if (label.includes("références clients")) 
      return "Microsoft France (depuis 2021, +200 leads/mois), Salesforce (depuis 2022, +40% de conversion), SAP (projet de 6 mois, ROI de 300%)"

    if (label.includes("concurrents")) 
      return "Entreprise A (forces: prix bas, faiblesses: qualité), Entreprise B (forces: notoriété, faiblesses: délais longs)"

    if (label.includes("lien de démo")) 
      return "https://www.youtube.com/watch?v=votre-demo ou https://www.loom.com/share/votre-demo"

    if (label.includes("icp") || label.includes("personas")) 
      return "1. DSI de grands comptes (budget >100k€)\n2. Directeurs Marketing de PME tech\n3. CEO de startups B2B SaaS"

    if (label.includes("secteurs préférentiels")) 
      return "SaaS B2B, Services IT, Industrie 4.0, Cybersécurité"

    if (label.includes("secteurs à éviter")) 
      return "B2C, Retail traditionnel, Secteur public"

    if (label.includes("taille d'entreprise cible")) 
      return "PME et ETI, 50-1000 salariés, CA entre 10M€ et 100M€"

    if (label.includes("email")) 
      return "prenom.nom@entreprise.com"

    if (label.includes("calendly")) 
      return "https://calendly.com/votre-lien"

    if (label.includes("crm")) 
      return "Hubspot (API disponible), compte existant à synchroniser, champs personnalisés nécessaires: X, Y, Z"

    if (label.includes("infos supplémentaires")) 
      return "Projet de levée de fonds en cours, ouverture internationale prévue, contraintes spécifiques..."

    // Placeholders par défaut selon le type
    switch (field.type) {
      case "textarea":
        return "Détaillez votre réponse ici..."
      case "email":
        return "email@exemple.com"
      case "url":
        return "https://www..."
      default:
        return `Saisissez ${label}`
    }
  }

  const renderField = (field: OnboardingField) => {
    const value = formData[field.id]
    const isSubmitting = submittingSections[field.section]

    if (field.type === "file") {
      return (
        <FileField
          clientId={clientId}
          label=""
          required={field.required}
          onUpload={() => {
            setDirtyFields((prev) => ({ ...prev, [field.id]: true }))
          }}
        />
      )
    }

    if (field.type === "checkbox") {
      return (
        <Checkbox
          id={field.id}
          checked={value as boolean}
          onCheckedChange={(checked) => handleInputChange(field.id, checked)}
          disabled={isSubmitting}
        />
      )
    }

    if (field.type === "textarea") {
      return (
        <Textarea
          id={field.id}
          value={value as string}
          onChange={(e) => handleInputChange(field.id, e.target.value)}
          disabled={isSubmitting}
          placeholder={getPlaceholder(field)}
          className="min-h-[100px]"
        />
      )
    }

    return (
      <Input
        id={field.id}
        type={field.type}
        value={value as string}
        onChange={(e) => handleInputChange(field.id, e.target.value)}
        disabled={isSubmitting}
        placeholder={getPlaceholder(field)}
      />
    )
  }

  // Group and sort fields by section
  const fieldsBySection = fields.reduce((acc, field) => {
    if (!acc[field.section]) {
      acc[field.section] = []
    }
    acc[field.section].push(field)
    acc[field.section].sort((a, b) => (a.order_in_section || 0) - (b.order_in_section || 0))
    return acc
  }, {} as Record<OnboardingField['section'], OnboardingField[]>)

  // Define the order of sections
  const sectionOrder: OnboardingField['section'][] = [
    'company',
    'targeting',
    'pitch',
    'resources',
    'tech',
    'confirm'
  ]

  // Check if a section has any dirty fields (excluding file fields)
  const isSectionDirty = (section: OnboardingField['section']) => {
    return fieldsBySection[section].some((field) => 
      field.type !== 'file' && dirtyFields[field.id]
    )
  }

  return (
    <div className="space-y-6">
      {sectionOrder.map((section) => (
        fieldsBySection[section] && (
          <CardWithDividers key={section}>
            <CardWithDividersHeader>
              <CardWithDividersTitle>
                {sectionTitles[section].title}
              </CardWithDividersTitle>
              <CardWithDividersDescription>
                {sectionTitles[section].description}
              </CardWithDividersDescription>
            </CardWithDividersHeader>
            <Separator />
            <CardWithDividersContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fieldsBySection[section].map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id} className="flex items-center gap-2">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            </CardWithDividersContent>
            <Separator />
            <CardWithDividersFooter>
              <Button
                onClick={() => handleSubmit(section, fieldsBySection[section])}
                disabled={submittingSections[section] || !isSectionDirty(section)}
              >
                {submittingSections[section] ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                  Mettre à jour
                  </>
                )}
              </Button>
            </CardWithDividersFooter>
          </CardWithDividers>
        )
      ))}
    </div>
  )
} 