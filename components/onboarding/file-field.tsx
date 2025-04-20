"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileIcon, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

interface FileFieldProps {
  clientId: string
  label: string
  required?: boolean
  onUpload?: () => void
}

interface FileInfo {
  name: string
  signedUrl: string
  metadata: {
    size: number
    mimetype: string
  }
}

export function FileField({ clientId, label, required, onUpload }: FileFieldProps) {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const fetchFiles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/onboarding?clientId=${clientId}`)
      if (!response.ok) throw new Error("Failed to fetch files")
      const data = await response.json()
      setFiles(data)
    } catch (error) {
      console.error("Error fetching files:", error)
      toast.error("Erreur lors du chargement des fichiers")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [clientId])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)

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

      toast.success("Fichier uploadé avec succès")
      fetchFiles()
      onUpload?.()
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Erreur lors de l'upload du fichier")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (fileName: string) => {
    try {
      const response = await fetch(`/api/onboarding?clientId=${clientId}&fileName=${fileName}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete file")

      toast.success("Fichier supprimé avec succès")
      fetchFiles()
    } catch (error) {
      console.error("Error deleting file:", error)
      toast.error("Erreur lors de la suppression du fichier")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {label && (
            <label className="text-sm font-medium">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </label>
          )}
          <p className="text-sm text-muted-foreground">
            {files.length === 0 ? "Aucun fichier" : `${files.length} fichier${files.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <div>
          <Input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            id={`file-upload-${clientId}`}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(`file-upload-${clientId}`)?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Ajouter un fichier
              </>
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between p-2 rounded-md border bg-muted/40"
            >
              <div className="flex items-center space-x-3">
                <FileIcon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <a
                    href={file.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline"
                  >
                    {file.name}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.metadata.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(file.name)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 