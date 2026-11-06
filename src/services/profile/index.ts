import { storage } from '@/storage';
import { createLocalProfileRepository } from './local-profile-repository';
export * from './types';
export * from './format';
export { PROFILE_KEY } from './local-profile-repository';

// Після переходу на Firebase тут підставиться Firestore-реалізація
// ProfileRepository; екрани й провайдер не зміняться
export const profileRepository = createLocalProfileRepository(storage);
