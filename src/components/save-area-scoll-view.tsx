// import { ScrollView, Platform, ScrollViewProps } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';

// type SaveAreaContentProps = ScrollViewProps & {};

// export function SaveAreaScrollView({
//   contentContainerStyle,
//   ...rest
// }: SaveAreaContentProps) {
//   const insets = useSafeAreaInsets();
//   return (
//     <ScrollView
//       contentInsetAdjustmentBehavior='automatic'
//       contentContainerStyle={[
//         contentContainerStyle,
//         Platform.OS === 'android' && { paddingTop: insets.top + 16 },
//       ]}
//       {...rest}
//     />
//   );
// }
