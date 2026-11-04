import { storage } from '@/storage';
import { createOutageSettingsRepository } from './settings-repository';
export * from './types';
export * from './schedule';
export * from './registry';
export type { OutageSettingsRepository } from './settings-repository';

export const outageSettingsRepository = createOutageSettingsRepository(storage);
