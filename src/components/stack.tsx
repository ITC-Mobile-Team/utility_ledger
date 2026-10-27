import { View, ViewProps } from 'react-native';

type StackDirection = 'row' | 'column';

type StackProps = ViewProps & {
  direction?: StackDirection;
  spacing?: number;
};

function Stack({
  direction = 'column',
  spacing = 0,
  style,
  ...rest
}: StackProps) {
  return (
    <View
      style={[{ flexDirection: direction, gap: spacing }, style]}
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
