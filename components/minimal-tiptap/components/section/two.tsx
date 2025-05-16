import * as React from "react"
import type { Editor } from "@tiptap/react"

interface SectionTwoProps {
  editor: Editor
  activeActions?: string[]
  mainActionCount?: number
}

const ACTIONS = [
  { type: "bold", label: "B", className: "font-bold" },
  { type: "italic", label: "I", className: "italic" },
  { type: "underline", label: "U", className: "underline" },
  { type: "strikethrough", label: "S", className: "line-through" },
  { type: "code", label: "</>", className: "" },
]

export const SectionTwo: React.FC<SectionTwoProps> = ({ editor, activeActions = ["bold", "italic", "underline", "strikethrough", "code"], mainActionCount = 5 }) => {
  return (
    <>
      {ACTIONS.filter(a => activeActions.includes(a.type)).slice(0, mainActionCount).map(action => (
        <button
          key={action.type}
          type="button"
          className={`px-2 py-1 rounded ${action.className} ${editor.isActive(action.type) ? "bg-muted text-foreground" : "text-muted-foreground"}`}
          onClick={() => {
            switch (action.type) {
              case "bold":
                editor.chain().focus().toggleBold().run(); break;
              case "italic":
                editor.chain().focus().toggleItalic().run(); break;
              case "underline":
                editor.chain().focus().toggleUnderline().run(); break;
              case "strikethrough":
                editor.chain().focus().toggleStrike().run(); break;
              case "code":
                editor.chain().focus().toggleCode().run(); break;
              default:
                break;
            }
          }}
        >
          {action.label}
        </button>
      ))}
    </>
  )
} 