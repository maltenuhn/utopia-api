import * as Yoga from "typeflex";
import { Node } from "typeflex";
import { NormalisedFrame } from "./frame";
import { defaultIfNull } from "../utils";

export type Sides = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export interface FlexElementProps {
  grow?: number;
  shrink?: number;
  position?: FlexPosition;
  width?: number | string;
  height?: number | string;
  left?: number | string;
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  margin?: Partial<Sides>;
  alignSelf?: FlexAlignment;
}

export interface FlexParentProps {
  flexDirection?: FlexDirection;
  alignContent?: FlexAlignment;
  alignItems?: FlexAlignment;
  justifyContent?: FlexJustifyContent;
  wrap?: FlexWrap;
  gapCross?: number;
  gapMain?: number;
  padding?: Partial<Sides>;
}

export enum FlexAlignment {
  Auto = "auto",
  FlexStart = "flex-start",
  Center = "center",
  FlexEnd = "flex-end",
  Stretch = "stretch"
}

function yogaAlignmentForFlexAlignment(
  defaultAlignment: number,
  alignment?: FlexAlignment
): number {
  if (alignment == null) {
    return defaultAlignment;
  }

  switch (alignment) {
    case FlexAlignment.Auto:
      return Yoga.ALIGN_AUTO;
    case FlexAlignment.FlexStart:
      return Yoga.ALIGN_FLEX_START;
    case FlexAlignment.Center:
      return Yoga.ALIGN_CENTER;
    case FlexAlignment.FlexEnd:
      return Yoga.ALIGN_FLEX_END;
    case FlexAlignment.Stretch:
      return Yoga.ALIGN_STRETCH;
    default:
      const _exhaustiveCheck: never = alignment;
      throw new Error(`Invalid flex alignment ${alignment}`);
  }
}

const yogaAlignmentForFlexContentAlignment = (alignment?: FlexAlignment) =>
  yogaAlignmentForFlexAlignment(Yoga.ALIGN_FLEX_START, alignment);
const yogaAlignmentForFlexItemsAlignment = (alignment?: FlexAlignment) =>
  yogaAlignmentForFlexAlignment(Yoga.ALIGN_FLEX_START, alignment);
const yogaAlignmentForFlexSelfAlignment = (alignment?: FlexAlignment) =>
  yogaAlignmentForFlexAlignment(Yoga.ALIGN_AUTO, alignment);

export enum FlexJustifyContent {
  FlexStart = "flex-start",
  Center = "center",
  FlexEnd = "flex-end",
  SpaceAround = "space-around",
  SpaceBetween = "space-between",
  SpaceEvenly = "space-evenly"
}

function yogaJustifyContentForFlexJustifyContent(
  flexJustifyContent?: FlexJustifyContent
): number {
  if (flexJustifyContent == null) {
    return Yoga.JUSTIFY_FLEX_START;
  }

  switch (flexJustifyContent) {
    case FlexJustifyContent.FlexStart:
      return Yoga.JUSTIFY_FLEX_START;
    case FlexJustifyContent.Center:
      return Yoga.JUSTIFY_CENTER;
    case FlexJustifyContent.FlexEnd:
      return Yoga.JUSTIFY_FLEX_END;
    case FlexJustifyContent.SpaceAround:
      return Yoga.JUSTIFY_SPACE_AROUND;
    case FlexJustifyContent.SpaceBetween:
      return Yoga.JUSTIFY_SPACE_BETWEEN;
    case FlexJustifyContent.SpaceEvenly:
      return Yoga.JUSTIFY_SPACE_EVENLY;
    default:
      const _exhaustiveCheck: never = flexJustifyContent;
      throw new Error(`Invalid flex flexJustifyContent ${flexJustifyContent}`);
  }
}

export enum FlexDirection {
  Column = "column",
  ColumnReverse = "column-reverse",
  Row = "row",
  RowReverse = "row-reverse"
}

function yogaDirectionForFlexDirection(flexDirection?: FlexDirection): number {
  if (flexDirection == null) {
    return Yoga.FLEX_DIRECTION_ROW;
  }

  switch (flexDirection) {
    case FlexDirection.Column:
      return Yoga.FLEX_DIRECTION_COLUMN;
    case FlexDirection.ColumnReverse:
      return Yoga.FLEX_DIRECTION_COLUMN_REVERSE;
    case FlexDirection.Row:
      return Yoga.FLEX_DIRECTION_ROW;
    case FlexDirection.RowReverse:
      return Yoga.FLEX_DIRECTION_ROW_REVERSE;
    default:
      const _exhaustiveCheck: never = flexDirection;
      throw new Error(`Invalid flex flexDirection ${flexDirection}`);
  }
}

export enum FlexWrap {
  NoWrap = "nowrap",
  Wrap = "wrap",
  WrapReverse = "wrap-reverse"
}

function yogaWrapForFlexWrap(flexWrap?: FlexWrap): number {
  if (flexWrap == null) {
    return Yoga.WRAP_NO_WRAP;
  }

  switch (flexWrap) {
    case FlexWrap.NoWrap:
      return Yoga.WRAP_NO_WRAP;
    case FlexWrap.Wrap:
      return Yoga.WRAP_WRAP;
    case FlexWrap.WrapReverse:
      return Yoga.WRAP_WRAP_REVERSE;
    default:
      const _exhaustiveCheck: never = flexWrap;
      throw new Error(`Invalid flex flexWrap ${flexWrap}`);
  }
}

export enum FlexPosition {
  Absolute = "absolute",
  Relative = "relative"
}

function yogaPositionForFlexPosition(flexPosition?: FlexPosition): number {
  if (flexPosition == null) {
    return Yoga.POSITION_TYPE_RELATIVE;
  }

  switch (flexPosition) {
    case FlexPosition.Absolute:
      return Yoga.POSITION_TYPE_ABSOLUTE;
    case FlexPosition.Relative:
      return Yoga.POSITION_TYPE_RELATIVE;
    default:
      const _exhaustiveCheck: never = flexPosition;
      throw new Error(`Invalid flex flexPosition ${flexPosition}`);
  }
}

interface NodesForComponent {
  parent: Node;
  children: { [key: string]: Node };
}
interface NodeCache {
  [key: string]: NodesForComponent;
}
let yogaNodeCache: NodeCache = {};

export function resolveLayout(
  parentFrame: NormalisedFrame,
  parentProps: FlexParentProps,
  childrenProps: Array<FlexElementProps>
): Array<NormalisedFrame> {
  const { parent, children } = createParentNode(
    parentFrame,
    parentProps,
    childrenProps
  );
  parent.calculateLayout();
  return children.map(child => {
    // TODO take into account dragging
    return child.getComputedLayout();
  });
}

function createParentNode(
  parentFrame: NormalisedFrame,
  parentProps: FlexParentProps,
  childrenProps: Array<FlexElementProps>
): { parent: Node; children: Array<Node> } {
  // TODO Cache nodes using IDs
  const parent = Yoga.Node.create();
  addConfigToNodeParent(parentFrame, parentProps, parent);
  const children = childrenProps.map((childProps, index) => {
    const node = Yoga.Node.create();
    addConfigToNodeChild(
      parentProps,
      childProps,
      node,
      index,
      childrenProps.length
    );
    parent.insertChild(node, index);
    return node;
  });
  return { parent: parent, children: children };
}

function asNumber(v: number | string | undefined): number | null {
  if (v == null) {
    return null;
  } else if (typeof v === "number") {
    return v;
  } else {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
}

function addConfigToNodeChild(
  parentProps: FlexParentProps,
  childProps: FlexElementProps,
  node: Node,
  index: number,
  siblingsCount: number
): void {
  const childIsStretched = yogaChildIsStretched(childProps, parentProps);

  if (childIsStretched.width) {
    node.setWidthAuto();
  } else {
    const width = defaultIfNull<number>(100, asNumber(childProps.width));
    node.setWidth(width);
  }

  if (childIsStretched.height) {
    node.setHeightAuto();
  } else {
    const height = defaultIfNull<number>(100, asNumber(childProps.height));
    node.setHeight(height);
  }

  node.setFlexGrow(defaultIfNull<number>(0, childProps.grow));

  node.setFlexShrink(defaultIfNull<number>(1, childProps.shrink));

  // ⚠️ this is super ugly in yoga. NaN is used for removing a previously set minwidth/maxwidth, instead of null or having an unset helper.
  const maxWidth = defaultIfNull(NaN, childProps.maxWidth);
  node.setMaxWidth(maxWidth);
  const maxHeight = defaultIfNull(NaN, childProps.maxHeight);
  node.setMaxHeight(maxHeight);
  const minWidth = defaultIfNull(NaN, childProps.minWidth);
  node.setMinWidth(minWidth);
  const minHeight = defaultIfNull(NaN, childProps.minHeight);
  node.setMinHeight(minHeight);

  node.setPositionType(yogaPositionForFlexPosition(childProps.position));
  node.setAlignSelf(yogaAlignmentForFlexSelfAlignment(childProps.alignSelf));
  if (childProps.position === FlexPosition.Absolute) {
    node.setPosition(
      Yoga.EDGE_LEFT,
      defaultIfNull<number>(0, asNumber(childProps.left))
    );
    node.setPosition(
      Yoga.EDGE_TOP,
      defaultIfNull<number>(0, asNumber(childProps.top))
    );
    node.setPosition(
      Yoga.EDGE_RIGHT,
      defaultIfNull<number>(0, asNumber(childProps.right))
    );
    node.setPosition(
      Yoga.EDGE_BOTTOM,
      defaultIfNull<number>(0, asNumber(childProps.bottom))
    );
  }

  const gap = getElementGapFromParent(parentProps, index, siblingsCount);
  const margin: Partial<Sides> = childProps.margin || {};

  const marginLeft = defaultIfNull(gap.left, margin.left);
  const marginTop = defaultIfNull(gap.top, margin.top);
  const marginRight = defaultIfNull(gap.right, margin.right);
  const marginBottom = defaultIfNull(gap.bottom, margin.bottom);
  node.setMargin(Yoga.EDGE_LEFT, marginLeft);
  node.setMargin(Yoga.EDGE_TOP, marginTop);
  node.setMargin(Yoga.EDGE_RIGHT, marginRight);
  node.setMargin(Yoga.EDGE_BOTTOM, marginBottom);
}

function getElementGapFromParent(
  parentProps: FlexParentProps,
  index: number,
  siblingsCount: number
): Sides {
  const gapMainAxis: number = defaultIfNull<number>(0, parentProps.gapMain);
  const gapCrossAxis: number = defaultIfNull<number>(0, parentProps.gapCross);
  const elementGapBaseMain = gapMainAxis / 2;

  // first child, last child has gap only inside
  // reversed direction has gap on the other side
  const isFirstChild = index === 0;
  const isLastChild = index === siblingsCount - 1;

  const flexDirection = defaultIfNull<FlexDirection>(
    FlexDirection.Row,
    parentProps.flexDirection
  );

  switch (flexDirection) {
    case FlexDirection.Column:
      return {
        left: gapCrossAxis,
        top: isFirstChild ? 0 : elementGapBaseMain,
        right: gapCrossAxis,
        bottom: isLastChild ? 0 : elementGapBaseMain
      };
    case FlexDirection.ColumnReverse:
      return {
        left: gapCrossAxis,
        top: isLastChild ? 0 : elementGapBaseMain,
        right: gapCrossAxis,
        bottom: isFirstChild ? 0 : elementGapBaseMain
      };
    case FlexDirection.Row:
      return {
        left: isFirstChild ? 0 : elementGapBaseMain,
        top: gapCrossAxis,
        right: isLastChild ? 0 : elementGapBaseMain,
        bottom: gapCrossAxis
      };
    case FlexDirection.RowReverse:
      return {
        left: isLastChild ? 0 : elementGapBaseMain,
        top: gapCrossAxis,
        right: isFirstChild ? 0 : elementGapBaseMain,
        bottom: gapCrossAxis
      };
    default:
      const _exhaustiveCheck: never = flexDirection;
      throw new Error("Unknown value for flexDirection");
  }
}

function addConfigToNodeParent(
  parentFrame: NormalisedFrame,
  parentProps: FlexParentProps,
  node: Node
): void {
  node.setWidth(parentFrame.width);
  node.setHeight(parentFrame.height);
  node.setFlexDirection(
    yogaDirectionForFlexDirection(parentProps.flexDirection)
  );
  node.setFlexWrap(yogaWrapForFlexWrap(parentProps.wrap));
  node.setJustifyContent(
    yogaJustifyContentForFlexJustifyContent(parentProps.justifyContent)
  );
  node.setAlignContent(
    yogaAlignmentForFlexContentAlignment(parentProps.alignContent)
  );
  node.setAlignItems(
    yogaAlignmentForFlexItemsAlignment(parentProps.alignItems)
  );
  node.setPadding(
    Yoga.EDGE_LEFT,
    defaultIfNull<number>(0, parentProps.padding && parentProps.padding.left)
  );
  node.setPadding(
    Yoga.EDGE_TOP,
    defaultIfNull<number>(0, parentProps.padding && parentProps.padding.top)
  );
  node.setPadding(
    Yoga.EDGE_RIGHT,
    defaultIfNull<number>(0, parentProps.padding && parentProps.padding.right)
  );
  node.setPadding(
    Yoga.EDGE_BOTTOM,
    defaultIfNull<number>(0, parentProps.padding && parentProps.padding.bottom)
  );
}

export function yogaChildIsStretched(
  childProps: FlexElementProps,
  parentProps: FlexParentProps
): { width: boolean; height: boolean } {
  const alignSelf = yogaAlignmentForFlexSelfAlignment(childProps.alignSelf);
  const parentFlexDirection = yogaDirectionForFlexDirection(
    parentProps.flexDirection
  );
  const parentStretchesChildren =
    yogaAlignmentForFlexItemsAlignment(parentProps.alignItems) ===
    Yoga.ALIGN_STRETCH;
  const childrenStretchesSelf = alignSelf === Yoga.ALIGN_STRETCH;
  const childrenAlignsSelfAuto = alignSelf === Yoga.ALIGN_AUTO;
  const childIsStretched =
    (parentStretchesChildren && childrenAlignsSelfAuto) ||
    childrenStretchesSelf;
  return {
    width:
      childIsStretched &&
      (parentFlexDirection === Yoga.FLEX_DIRECTION_COLUMN ||
        parentFlexDirection === Yoga.FLEX_DIRECTION_COLUMN_REVERSE),
    height:
      childIsStretched &&
      (parentFlexDirection === Yoga.FLEX_DIRECTION_ROW ||
        parentFlexDirection === Yoga.FLEX_DIRECTION_ROW_REVERSE)
  };
}
