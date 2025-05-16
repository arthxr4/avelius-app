import * as React from "react"
import { BubbleMenu } from "@tiptap/react"
import type { Editor } from "@tiptap/react"

export function LinkBubbleMenu({ editor }: { editor: Editor }) {
  const [url, setUrl] = React.useState("")
  const isLink = editor.isActive("link")

  React.useEffect(() => {
    if (isLink) {
      const attrs = editor.getAttributes("link")
      setUrl(attrs.href || "")
    } else {
      setUrl("")
    }
  }, [isLink, editor])

  if (!isLink) return null

  return (
    <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
      <div className="flex items-center gap-2 bg-white border rounded shadow p-2">
        <input
          className="border rounded px-2 py-1 text-sm"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="URL"
        />
        <button
          className="text-xs px-2 py-1 rounded bg-muted text-foreground border"
          onClick={() => {
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
          }}
        >
          Set
        </button>
        <button
          className="text-xs px-2 py-1 rounded bg-muted text-foreground border"
          onClick={() => {
            editor.chain().focus().unsetLink().run()
            setUrl("")
          }}
        >
          Remove
        </button>
      </div>
    </BubbleMenu>
  )
} 