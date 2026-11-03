import AsyncStorage from '@react-native-async-storage/async-storage';
import { type KeyValueStorage } from './key-value-storage';

// Персистентне сховище на пристрої (аналог UserDefaults / SharedPreferences)
export class AsyncKeyValueStorage implements KeyValueStorage {
  getItem(key: string) {
    return AsyncStorage.getItem(key);
  }

  setItem(key: string, value: string) {
    return AsyncStorage.setItem(key, value);
  }

  removeItem(key: string) {
    return AsyncStorage.removeItem(key);
  }
}
