import React, { useEffect, useRef } from "react"
import { EditorContent, useEditor, Content } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Code from "@tiptap/extension-code"
import Placeholder from "@tiptap/extension-placeholder"

interface MinimalTiptapEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  editorContentClassName?: string
  toolbarClassName?: string
  output?: "html" | "json"
  editable?: boolean
}

export const MinimalTiptapEditor: React.FC<MinimalTiptapEditorProps> = ({
  value,
  onChange,
  placeholder = "Comment here...",
  editorContentClassName = "",
  toolbarClassName = "",
  output = "html",
  editable = true,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Code,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable,
    onUpdate: ({ editor }) => {
      if (output === "html") {
        onChange(editor.getHTML())
      } else {
        onChange(JSON.stringify(editor.getJSON()))
      }
    },
  })

  // Sync external value
  const lastValue = useRef(value)
  useEffect(() => {
    if (editor && value !== lastValue.current) {
      editor.commands.setContent(value || "", false)
      lastValue.current = value
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className="w-full">
      <div className={`border-b px-2 py-1 flex gap-2 ${toolbarClassName}`.trim()}>
        <button
          type="button"
          className={`font-bold ${editor.isActive("bold") ? "text-black" : "text-muted-foreground"}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </button>
        <button
          type="button"
          className={`italic ${editor.isActive("italic") ? "text-black" : "text-muted-foreground"}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </button>
        <button
          type="button"
          className={`underline ${editor.isActive("underline") ? "text-black" : "text-muted-foreground"}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          U
        </button>
        <button
          type="button"
          className={`ml-2 ${editor.isActive("code") ? "text-black" : "text-muted-foreground"}`}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          {'</>'}
        </button>
      </div>
      <EditorContent editor={editor} className={`min-h-[80px] px-3 py-2 outline-none ${editorContentClassName}`.trim()} />
    </div>
  )
} 