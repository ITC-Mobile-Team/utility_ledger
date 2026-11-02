import { ScreenView, ThemedText } from '@/components';
import { MeterReadingInput } from '@/views';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

export default function Onboarding() {
  const [value, setValue] = useState('12660');
  return (
    <ScreenView backgroundColor='surface' contentInsets={{ horizontal: 20 }}>
      <ThemedText>Onboarding</ThemedText>
      <MeterReadingInput
        value={value}
        onChangeValue={setValue}
        integerDigits={4}
        fractionDigits={1}
        readOnly={true}
      />
    </ScreenView>
  );
}

const styles = StyleSheet.create({});
