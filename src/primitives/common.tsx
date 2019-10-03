import { resolveLayout } from "../layout/yoga";
import { defaultIfNull } from "../utils";
import * as React from "react";
import {
  NormalisedFrame,
  toNormalisedFrame,
  toAbsoluteFrame
} from "../layout/frame";
import { LayoutType, LayoutProps } from "../layout/layout";

export interface UtopiaComponentProps {
  id?: string;
  index?: number;
  parentAbsoluteFrame?: NormalisedFrame;
  parentFrame?: NormalisedFrame;
  frame?: NormalisedFrame;
  layout?: LayoutProps;
  style?: React.CSSProperties;
}

function computeFlexChildren(
  frame: NormalisedFrame,
  layout: LayoutProps,
  children: React.ReactNode
): Array<NormalisedFrame> {
  return resolveLayout(
    frame,
    defaultIfNull({}, layout),
    React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return defaultIfNull({}, child.props.layout);
      } else {
        // TODO handle non-element children
        throw new Error(
          `Currently unable to handle children that aren't elements`
        );
      }
    })
  );
}

function computePinnedChildren(
  frame: NormalisedFrame,
  children: React.ReactNode
): Array<NormalisedFrame> {
  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      const layout = defaultIfNull({}, child.props.layout);
      return toNormalisedFrame(layout, frame);
    } else {
      // TODO handle non-element children
      throw new Error(
        `Currently unable to handle children that aren't elements`
      );
    }
  });
}

function computeGroupChildren(
  children: React.ReactNode,
  parentFrame: NormalisedFrame
): Array<NormalisedFrame> {
  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      const propsWithParentFrame = {
        ...child.props,
        parentFrame: parentFrame
      };
      return calculateFrame(propsWithParentFrame).frame;
    } else {
      // TODO handle non-element children
      throw new Error(
        `Currently unable to handle children that aren't elements`
      );
    }
  });
}

function boundingRectangle(
  first: NormalisedFrame,
  second: NormalisedFrame
): NormalisedFrame {
  const firstTL: NormalisedFrame = first;
  const firstBR = {
    left: first.left + first.width,
    top: first.top + first.height
  };
  const secondTL: NormalisedFrame = second;
  const secondBR = {
    left: second.left + second.width,
    top: second.top + second.height
  };

  const newTL = {
    left: Math.min(firstTL.left, secondTL.left),
    top: Math.min(firstTL.top, secondTL.top)
  };
  const newBR = {
    left: Math.max(firstBR.left, secondBR.left),
    top: Math.max(firstBR.top, secondBR.top)
  };

  return {
    left: newTL.left,
    top: newTL.top,
    width: newBR.left - newTL.left,
    height: newBR.top - newTL.top
  };
}

function boundingRectangleFromArray(
  rectangles: Array<NormalisedFrame>
): NormalisedFrame {
  if (rectangles.length === 0) {
    return { left: 0, top: 0, width: 0, height: 0 };
  } else {
    const [firstRectangle, ...remainder] = rectangles;
    return remainder.reduce(boundingRectangle, firstRectangle);
  }
}

function calculateGroupBounds(frames: Array<NormalisedFrame>): NormalisedFrame {
  return boundingRectangleFromArray(frames);
}

function shiftGroupChildren(
  parentFrame: NormalisedFrame,
  childFrames: Array<NormalisedFrame>
): Array<NormalisedFrame> {
  return childFrames.map(childFrame => {
    return {
      left: childFrame.left - parentFrame.left,
      top: childFrame.top - parentFrame.top,
      width: childFrame.width,
      height: childFrame.height
    };
  });
}

function layoutValueOr0(layoutValue: string | number | undefined): number {
  return typeof layoutValue === "number" ? layoutValue : 0;
}

const zeroNormalisedFrame: NormalisedFrame = {
  left: 0,
  top: 0,
  width: 0,
  height: 0
};

export function calculateFrame(
  props: React.PropsWithChildren<UtopiaComponentProps>
): {
  absoluteFrame: NormalisedFrame;
  frame: NormalisedFrame;
  childFrames: Array<NormalisedFrame>;
} {
  const layout = defaultIfNull({} as LayoutProps, props.layout);

  const passedFrame = props.frame;

  const parentFrame = defaultIfNull<NormalisedFrame | null>(
    null,
    props.parentFrame
  );

  let frame: NormalisedFrame;
  if (passedFrame == null) {
    if (parentFrame == null) {
      frame = {
        left: layoutValueOr0(layout.left),
        top: layoutValueOr0(layout.top),
        width: layoutValueOr0(layout.width),
        height: layoutValueOr0(layout.height)
      };
    } else {
      frame = toNormalisedFrame(layout, parentFrame);
    }
  } else {
    frame = {
      left: defaultIfNull(layoutValueOr0(layout.left), passedFrame.left),
      top: defaultIfNull(layoutValueOr0(layout.top), passedFrame.top),
      width: defaultIfNull(layoutValueOr0(layout.width), passedFrame.width),
      height: defaultIfNull(layoutValueOr0(layout.height), passedFrame.height)
    };
  }

  const parentAbsoluteFrame: NormalisedFrame = getParentAbsoluteFrame(props);

  let absoluteFrame = toAbsoluteFrame(frame, parentAbsoluteFrame);

  let childFrames: Array<NormalisedFrame>;
  switch (layout.layoutType) {
    case undefined:
    case LayoutType.Pinned:
      childFrames = computePinnedChildren(frame, props.children);
      break;
    case LayoutType.Flex:
      childFrames = computeFlexChildren(frame, layout, props.children);
      break;
    case LayoutType.Group:
      const defaultedParentFrame = defaultIfNull(
        zeroNormalisedFrame,
        parentFrame
      );
      childFrames = computeGroupChildren(props.children, defaultedParentFrame);
      frame = calculateGroupBounds(childFrames);
      childFrames = shiftGroupChildren(frame, childFrames);
      absoluteFrame = toAbsoluteFrame(frame, parentAbsoluteFrame);
      break;
    default:
      const _exhaustiveCheck: never = layout.layoutType;
      throw new Error(
        `Unknown layout type ${JSON.stringify(layout.layoutType)}`
      );
  }

  return {
    absoluteFrame: absoluteFrame,
    frame: frame,
    childFrames: childFrames
  };
}

function getParentAbsoluteFrame(props: UtopiaComponentProps): NormalisedFrame {
  return (
    props.parentAbsoluteFrame || {
      left: 0,
      top: 0,
      width: 0,
      height: 0
    }
  );
}
