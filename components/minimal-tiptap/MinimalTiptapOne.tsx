import * as React from "react"
import "@/components/minimal-tiptap/styles/index.css"

import type { Content, Editor } from "@tiptap/react"
import type { UseMinimalTiptapEditorProps } from "@/components/minimal-tiptap/hooks/use-minimal-tiptap"
import { EditorContent } from "@tiptap/react"
import { cn } from "@/lib/utils"
import { SectionTwo } from "@/components/minimal-tiptap/components/section/two"
import { LinkBubbleMenu } from "@/components/minimal-tiptap/components/bubble-menu/link-bubble-menu"
import { useMinimalTiptapEditor } from "@/components/minimal-tiptap/hooks/use-minimal-tiptap"
import { MeasuredContainer } from "@/components/minimal-tiptap/components/measured-container"

export interface MinimalTiptapProps
  extends Omit<UseMinimalTiptapEditorProps, "onUpdate"> {
  value?: Content
  onChange?: (value: Content) => void
  className?: string
  editorClassName?: string
  editorContentClassName?: string
}

export const MinimalTiptapOne = React.forwardRef<
  HTMLDivElement,
  MinimalTiptapProps & { actionButton?: React.ReactNode }
>(({ value, onChange, className, editorClassName, editorContentClassName, actionButton, ...props }, ref) => {
  const editor = useMinimalTiptapEditor({
    value,
    onUpdate: onChange,
    editorClassName,
    ...props,
  })

  if (!editor) {
    return null
  }

  return (
    <MeasuredContainer
      as="div"
      name="editor"
      ref={ref}
      className={cn(
        "flex h-auto w-full flex-col rounded-md border border-input shadow-sm focus-within:border-primary",
        className
      )}
    >
      <EditorContent editor={editor} className={cn(editorContentClassName)} />
      <div className="flex items-center justify-between gap-2 bg-muted/50 p-2 border-t">
        <div className="flex items-center gap-1">
          <SectionTwo
            editor={editor}
            activeActions={["bold", "italic", "underline", "strikethrough"]}
            mainActionCount={5}
          />
        </div>
        {actionButton}
      </div>
      <LinkBubbleMenu editor={editor} />
    </MeasuredContainer>
  )
})

MinimalTiptapOne.displayName = "MinimalTiptapOne"

export default MinimalTiptapOne 