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
          sectionFormData[field.id] = formData[field.id]
          if (files[field.id]) {
            sectionFiles[field.id] = files[field.id]
          }
        }
      })

      // If no changes in this section, skip the API call
      if (Object.keys(sectionFormData).length === 0) {
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

  const renderField = (field: OnboardingField) => {
    const value = formData[field.id]
    const response = responses.find((r) => r.field_id === field.id)
    const isSubmitting = submittingSections[field.section]
    const file = files[field.id]

    switch (field.type) {
      case "textarea":
        return (
          <Textarea
            id={field.id}
            value={value as string}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="w-full"
            disabled={isSubmitting}
          />
        )

      case "checkbox":
        return (
          <Checkbox
            id={field.id}
            checked={value as boolean}
            onCheckedChange={(checked) => handleInputChange(field.id, checked)}
            disabled={isSubmitting}
          />
        )

      case "file":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                onChange={(e) => handleFileChange(field.id, e.target.files?.[0] || null)}
                required={field.required && !response}
                disabled={isSubmitting}
                className="flex-1"
              />
              {file && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFileChange(field.id, null)}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {(response?.value || file) && (
              <div className="flex items-center gap-2 text-sm">
                <FileIcon className="h-4 w-4 text-blue-600" />
                <span className="font-medium">
                  {file ? file.name : response?.value.split('/').pop()}
                </span>
                {response?.value && !file && (
                  <a
                    href={response.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    Voir <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        )

      default:
        return (
          <Input
            type={field.type}
            id={field.id}
            value={value as string}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="w-full"
            disabled={isSubmitting}
          />
        )
    }
  }

  // Group and sort fields by section
  const fieldsBySection = fields.reduce((acc, field) => {
    if (!acc[field.section]) {
      acc[field.section] = []
    }
    acc[field.section].push(field)
    // Sort fields within each section by order_in_section
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

  // Check if a section has any dirty fields
  const isSectionDirty = (section: OnboardingField['section']) => {
    return fieldsBySection[section].some((field) => dirtyFields[field.id])
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
              <div className="space-y-6">
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