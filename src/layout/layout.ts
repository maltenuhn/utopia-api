import { FlexParentProps, FlexElementProps } from "./yoga";
import { Frame } from "./frame";

export enum LayoutType {
  Flex = "flex",
  Pinned = "pinned",
  Group = "group"
}

export interface LayoutProps extends Frame, FlexElementProps, FlexParentProps {
  layoutType?: LayoutType;
}
