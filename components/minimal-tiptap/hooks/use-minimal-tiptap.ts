import { useEditor, type Content, type EditorOptions } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Strike from "@tiptap/extension-strike"
import Code from "@tiptap/extension-code"
import Placeholder from "@tiptap/extension-placeholder"

export interface UseMinimalTiptapEditorProps extends Partial<EditorOptions> {
  value?: Content
  onUpdate?: (value: Content) => void
  placeholder?: string
  editorClassName?: string
}

export function useMinimalTiptapEditor({
  value = "",
  onUpdate,
  placeholder = "Comment here...",
  editorClassName,
  ...options
}: UseMinimalTiptapEditorProps) {
  return useEditor({
    extensions: [
      StarterKit,
      Underline,
      Strike,
      Code,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML())
      }
    },
    editorProps: {
      attributes: {
        class: editorClassName || "",
      },
    },
    ...options,
  })
} 