import * as React from "react"

export interface MeasuredContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
  name?: string
}

export const MeasuredContainer = React.forwardRef<HTMLDivElement, MeasuredContainerProps>(
  ({ as: Comp = "div", name, className, ...props }, ref) => {
    return (
      <Comp ref={ref} data-measured-container={name} className={className} {...props} />
    )
  }
)

MeasuredContainer.displayName = "MeasuredContainer" 