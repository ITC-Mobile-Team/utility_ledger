import { ActionSheetIOS, Alert, Platform } from 'react-native';

type ConfirmDestructiveOptions = {
  title: string;
  message?: string;
  confirmText: string;
  onConfirm: () => void;
};

// Підтвердження деструктивної дії акаунта: на iOS — action sheet знизу з
// окремою «Скасувати» (як у макеті), на Android — системний діалог
export function confirmDestructive({
  title,
  message,
  confirmText,
  onConfirm,
}: ConfirmDestructiveOptions) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: [confirmText, 'Скасувати'],
        destructiveButtonIndex: 0,
        cancelButtonIndex: 1,
      },
      (index) => {
        if (index === 0) onConfirm();
      },
    );
    return;
  }
  Alert.alert(title, message, [
    { text: 'Скасувати', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
}
