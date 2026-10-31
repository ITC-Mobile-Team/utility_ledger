export type Size = {
  width: number;
  height?: number;
};

export const toSize = (size: Size) => ({
  width: size.width,
  height: size.height ?? size.width,
});
