import { storage } from '@/storage';
import { createFirestoreProfileRepository } from './firestore-profile-repository';
export * from './types';
export * from './format';
export { PROFILE_KEY } from './local-profile-repository';

// Профіль акаунта — Firestore (`users/{uid}`); на web — локальний (index.web.ts)
export const profileRepository = createFirestoreProfileRepository(storage);
