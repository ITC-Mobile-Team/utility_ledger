import { HORIZONTAL_PADDING } from './navigation-bar/constants';

export type ContentInsets = {
  /**
   * @deprecated ігнорується: відступ до першого блоку задає NavigationView
   * (SHEET_CONTENT_TOP); прибирається, щойно екрани перестануть його передавати
   */
  top?: number;
  // За замовчуванням HORIZONTAL_PADDING; 0 — контент на всю ширину
  horizontal?: number;
  bottom?: number;
};

export const toPadding = (insets?: ContentInsets) => ({
  paddingHorizontal: insets?.horizontal ?? HORIZONTAL_PADDING,
  paddingBottom: insets?.bottom,
});
