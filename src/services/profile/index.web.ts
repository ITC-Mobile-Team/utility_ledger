import { storage } from '@/storage';
import { createLocalProfileRepository } from './local-profile-repository';
export * from './types';
export * from './format';
export { PROFILE_KEY } from './local-profile-repository';

// Web поза обсягом хмарного зберігання: профіль лишається локальним
export const profileRepository = createLocalProfileRepository(storage);
