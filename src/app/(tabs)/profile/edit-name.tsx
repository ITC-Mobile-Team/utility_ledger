import {
  ActionButton,
  HStack,
  KeyboardDismissView,
  NavigationView,
  ThemedText,
  ThemedTextInput,
  ThemedView,
  VStack,
} from '@/components';
import { useProfile, useProfileRepository } from '@/providers/profile-provider';
import {
  getInitial,
  getProviderName,
  NAME_MAX_LENGTH,
} from '@/services/profile';
import { FormFooter, useFormFooterKeyboardInsets } from '@/views';
import { Avatar, ProviderLogo } from '@/views/profile';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

export default function EditNameScreen() {
  const profile = useProfile();
  const repository = useProfileRepository();
  const keyboardInsets = useFormFooterKeyboardInsets();
  const current = profile?.name ?? '';
  const [value, setValue] = useState(current);
  const [isSaving, setSaving] = useState(false);

  const trimmed = value.trim();
  const canSave = trimmed.length > 0 && trimmed !== current;
  const method = profile?.method ?? null;

  const save = async () => {
    setSaving(true);
    try {
      await repository.setName(value);
      router.back();
    } catch {
      Alert.alert('Не вдалося зберегти', 'Спробуйте ще раз.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardDismissView>
      <NavigationView
        title='Ваше імʼя'
        subtitle='Як до вас звертатися в застосунку'
        testID='editName.screen'
        contentInsets={{ top: 0, horizontal: 20, bottom: 24 }}
        {...keyboardInsets}
      >
        <VStack spacing={14}>
          <HStack style={styles.avatar}>
            <Avatar
              initial={getInitial(value)}
              size={88}
              testID='editName.avatar'
            />
          </HStack>
          <ThemedTextInput
            title='Імʼя'
            value={value}
            onChangeText={(text) =>
              setValue(Array.from(text).slice(0, NAME_MAX_LENGTH).join(''))
            }
            placeholder='Введіть імʼя'
            autoComplete='given-name'
            textContentType='givenName'
            autoFocus
            testID='editName.input'
            onSubmitEditing={canSave ? save : undefined}
          />
          {method && (
            <ThemedView
              backgroundColor='purpleSoft'
              style={styles.callout}
              testID='editName.hint'
            >
              <HStack spacing={12}>
                <ProviderLogo method={method} size={18} onLight />
                <VStack spacing={2} style={styles.flex}>
                  <ThemedText font='bodySmallStrong'>
                    Отримано з {getProviderName(method)}
                  </ThemedText>
                  <ThemedText font='bodySmall' color='purpleInk'>
                    Імʼя підставилось під час реєстрації. Зміна тут не впливає
                    на ваш {method === 'apple' ? 'Apple ID' : 'Google-акаунт'}.
                  </ThemedText>
                </VStack>
              </HStack>
            </ThemedView>
          )}
        </VStack>
      </NavigationView>

      <FormFooter>
        <ActionButton
          title='Зберегти'
          disabled={!canSave}
          loading={isSaving}
          testID='editName.save'
          onPress={save}
        />
      </FormFooter>
    </KeyboardDismissView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    paddingVertical: 8,
  },
  callout: {
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  flex: {
    flex: 1,
  },
});
