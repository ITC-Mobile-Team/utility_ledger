# Contract: стан налаштування «Світла»

## `src/services/outages/setup-status.ts`

```ts
export type OutageSetupStatus = 'ready' | 'noCity' | 'noProvider' | 'noQueues';

export function getOutageSetupStatus(settings: OutageSettings): OutageSetupStatus;
export function getOutageSetupMessage(status: Exclude<OutageSetupStatus, 'ready'>): string;
```

- Правила й тексти — [data-model.md](../data-model.md#outagesetupstatus).
- Експортується з `src/services/outages/index.ts`.
- `(outages)/index.tsx` замінює інлайн `isConfigured` на `getOutageSetupStatus(settings) === 'ready'`; поведінка вкладки «Світло» не змінюється.

## Навігація

- `src/app/(tabs)/(outages)/_layout.tsx`: `export const unstable_settings = { anchor: 'index' };` (назву ключа звірити з docs v58).
- Профіль: `router.navigate('/outage-settings')` — таб-бар перемикається на «Світло», відкривається налаштування, під ним головний екран «Світла».
