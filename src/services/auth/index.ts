import { storage } from '@/storage';
import { createLocalAuthService } from './local-auth-service';
export * from './types';

export const authService = createLocalAuthService(storage);
