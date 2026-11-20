import { poltavaoblenergo } from './providers/poltavaoblenergo';
import { svitloProviders } from './providers/svitlo-proxy';
import type { OutageProvider } from './types';

// Усі підключені постачальники. Полтава й Кременчук — POE (першим, щоб ці
// міста ніколи не дісталися svitlo-proxy), решта міст — svitlo-proxy, таблиця
// регіонів у providers/svitlo-regions.ts. Нове місто = новий файл у
// providers/ і рядок тут або запис у svitlo-regions.ts
export const outageProviders: readonly OutageProvider[] = [
  poltavaoblenergo,
  ...svitloProviders,
];

export const getProviderForCity = (city: string | undefined) =>
  city
    ? outageProviders.find((provider) => provider.cities.includes(city))
    : undefined;

export const getProvider = (id: string) =>
  outageProviders.find((provider) => provider.id === id);
