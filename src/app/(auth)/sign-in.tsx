import { StyleSheet } from 'react-native';
import React from 'react';
import { NavigationView } from '@/components';

export default function SignIn() {
  return (
    <NavigationView
      title='Вхід і реєстрація'
      subtitle='test'
      type='short'
      barType='blue'
    ></NavigationView>
  );
}

const styles = StyleSheet.create({});
