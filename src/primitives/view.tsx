import * as React from 'react'
import { UtopiaComponentProps, calculateFrame } from './common'

export interface ViewProps
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
    UtopiaComponentProps {}

export const View: React.FunctionComponent<ViewProps> = (props: ViewProps) => {
  let { layout: passedLayout, frame: passedFrame, ...divProps } = props

  let { absoluteFrame, frame, childFrames } = calculateFrame(props)

  // Duplicate some handlers to cover ourselves.
  const touchStart = divProps.onTouchStart
  if (touchStart !== undefined) {
    divProps = {
      ...divProps,
      onMouseDown: () => touchStart({} as any),
    }
  }
  const touchEnd = divProps.onTouchEnd
  if (touchEnd !== undefined) {
    divProps = {
      ...divProps,
      onMouseUp: () => touchEnd({} as any),
    }
  }

  const isGroup: boolean = passedLayout == null ? false : passedLayout.layoutType === 'group'

  return (
    <div
      {...divProps}
      style={{
        position: 'absolute',
        ...frame,
        ...divProps.style,
      }}
    >
      {React.Children.map(props.children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, {
            parentAbsoluteFrame: absoluteFrame,
            parentFrame: isGroup ? props.parentFrame : frame,
            frame: childFrames[index],
          })
        } else {
          return child
        }
      })}
    </div>
  )
}
View.displayName = 'View'
