import { View, ViewProps, ViewStyle } from 'react-native';

type StackDirection = 'row' | 'column';

type StackAlign = 'top' | 'center' | 'bottom' | 'stretch';

type StackProps = ViewProps & {
  direction?: StackDirection;
  align?: StackAlign;
  spacing?: number;
};

const alignRecord: Record<StackAlign, ViewStyle['alignItems']> = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
  stretch: 'stretch',
};

function Stack({
  direction = 'column',
  spacing = 0,
  align = 'stretch',
  style,
  ...rest
}: StackProps) {
  const alignItems = alignRecord[align];
  return (
    <View
      style={[{ flexDirection: direction, gap: spacing, alignItems }, style]}
      {...rest}
    />
  );
}

export const VStack = (props: StackProps) => (
  <Stack direction='column' {...props} />
);

export const HStack = (props: StackProps) => (
  <Stack direction='row' {...props} />
);
