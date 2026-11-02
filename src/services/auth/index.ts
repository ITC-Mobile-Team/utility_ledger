import { createInMemoryAuthService } from './in-memory-auth-service';
export * from './types';

export const authService = createInMemoryAuthService();
