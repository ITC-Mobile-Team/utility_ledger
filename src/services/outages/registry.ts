import { poltavaoblenergo } from './providers/poltavaoblenergo';
import type { OutageProvider } from './types';

// Усі підключені постачальники. Нове місто = новий файл у providers/ і
// рядок тут
export const outageProviders: readonly OutageProvider[] = [poltavaoblenergo];

export const getProviderForCity = (city: string | undefined) =>
  city
    ? outageProviders.find((provider) => provider.cities.includes(city))
    : undefined;

export const getProvider = (id: string) =>
  outageProviders.find((provider) => provider.id === id);
