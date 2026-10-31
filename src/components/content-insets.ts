export type ContentInsets = {
  top?: number;
  horizontal?: number;
  bottom?: number;
};

export const toPadding = (insets?: ContentInsets) => ({
  paddingTop: insets?.top,
  paddingHorizontal: insets?.horizontal,
  paddingBottom: insets?.bottom,
});
