import { storage } from '@/storage';
import { createFirebaseAuthService } from './firebase-auth-service';
export * from './types';

export const authService = createFirebaseAuthService(storage);
