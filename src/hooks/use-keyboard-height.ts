import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// Висота клавіатури; працює і всередині Modal
export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const isIOS = Platform.OS === 'ios';
    const show = Keyboard.addListener(
      isIOS ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      isIOS ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}
