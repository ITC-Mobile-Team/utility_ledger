import type { QueueId } from '../types';

// Регіон svitlo-proxy, привʼязаний до одного міста зі списку міст
export type SvitloRegionConfig = {
  // Ідентифікатор регіону у відповіді svitlo-proxy
  cpu: string;
  // Назва з src/constants/cities.ts
  city: string;
  // Обленерго регіону — так його бачить користувач
  name: string;
  // Офіційний сайт, де можна дізнатися свою чергу
  lookupUrl: string;
  // Черги так, як їх публікує постачальник, у порядку номерів
  queues: readonly QueueId[];
};

// 1.1, 1.2, …, 6.1, 6.2
const subQueues = (groups: number): QueueId[] =>
  Array.from({ length: groups }, (_, index) => [
    `${index + 1}.1`,
    `${index + 1}.2`,
  ]).flat();

const standard = subQueues(6);

// Полтава й Кременчук — на POE (poltavaoblenergo.ts); Херсона в джерелі немає
export const svitloRegions: readonly SvitloRegionConfig[] = [
  {
    cpu: 'kyiv',
    city: 'Київ',
    name: 'ДТЕК Київські електромережі',
    lookupUrl: 'https://www.dtek-kem.com.ua/ua/shutdowns',
    queues: Array.from({ length: 60 }, (_, index) => `${index + 1}.1`),
  },
  {
    cpu: 'kiivska-oblast',
    city: 'Біла Церква',
    name: 'ДТЕК Київські регіональні електромережі',
    lookupUrl: 'https://www.dtek-krem.com.ua/ua/shutdowns',
    queues: standard,
  },
  {
    cpu: 'dnipropetrovska-oblast',
    city: 'Дніпро',
    name: 'ДТЕК Дніпровські електромережі',
    lookupUrl: 'https://www.dtek-dnem.com.ua/ua/shutdowns',
    queues: standard,
  },
  {
    cpu: 'odeska-oblast',
    city: 'Одеса',
    name: 'ДТЕК Одеські електромережі',
    lookupUrl: 'https://www.dtek-oem.com.ua/ua/shutdowns',
    queues: standard,
  },
  {
    cpu: 'harkivska-oblast',
    city: 'Харків',
    name: 'Харківобленерго',
    lookupUrl: 'https://oblenergo.kharkiv.ua/',
    queues: standard,
  },
  {
    cpu: 'lvivska-oblast',
    city: 'Львів',
    name: 'Львівобленерго',
    lookupUrl: 'https://poweron.loe.lviv.ua/',
    queues: standard,
  },
  {
    cpu: 'zaporizka-oblast',
    city: 'Запоріжжя',
    name: 'Запоріжжяобленерго',
    lookupUrl: 'https://www.zoe.com.ua/outage/',
    queues: standard,
  },
  {
    cpu: 'vinnitska-oblast',
    city: 'Вінниця',
    name: 'Вінницяобленерго',
    lookupUrl: 'https://www.voe.com.ua/',
    queues: standard,
  },
  {
    cpu: 'chernigivska-oblast',
    city: 'Чернігів',
    name: 'Чернігівобленерго',
    lookupUrl: 'https://chernihivoblenergo.com.ua/blackouts',
    queues: standard,
  },
  {
    cpu: 'cherkaska-oblast',
    city: 'Черкаси',
    name: 'Черкасиобленерго',
    lookupUrl: 'https://www.cherkasyoblenergo.com/static/perelik-gpv',
    queues: standard,
  },
  {
    cpu: 'sumska-oblast',
    city: 'Суми',
    name: 'Сумиобленерго',
    lookupUrl: 'https://www.soe.com.ua/',
    queues: standard,
  },
  {
    cpu: 'jitomirska-oblast',
    city: 'Житомир',
    name: 'Житомиробленерго',
    lookupUrl: 'https://www.ztoe.com.ua/unhooking-search.php',
    queues: standard,
  },
  {
    cpu: 'hmelnitska-oblast',
    city: 'Хмельницький',
    name: 'Хмельницькобленерго',
    lookupUrl: 'https://hoe.com.ua/page/pogodinni-vidkljuchennja',
    queues: standard,
  },
  {
    cpu: 'rivnenska-oblast',
    city: 'Рівне',
    name: 'Рівнеобленерго',
    lookupUrl: 'https://www.roe.vsei.ua/disconnections',
    queues: standard,
  },
  {
    cpu: 'volinska-oblast',
    city: 'Луцьк',
    name: 'Волиньобленерго',
    lookupUrl:
      'https://energy.volyn.ua/spozhyvacham/perervy-u-elektropostachanni/hrafik-vidkliuchen/',
    queues: standard,
  },
  {
    cpu: 'ternopilska-oblast',
    city: 'Тернопіль',
    name: 'Тернопільобленерго',
    // Сайт за Cloudflare: у браузері користувач проходить перевірку сам
    lookupUrl: 'https://www.toe.com.ua/',
    queues: standard,
  },
  {
    cpu: 'ivano-frankivska-oblast',
    city: 'Івано-Франківськ',
    name: 'Прикарпаттяобленерго',
    lookupUrl: 'https://oe.if.ua/uk',
    queues: standard,
  },
  {
    cpu: 'zakarpatska-oblast',
    city: 'Ужгород',
    name: 'Закарпаттяобленерго',
    lookupUrl:
      'https://zakarpat.energy/customers/break-in-electricity-supply/schedule/',
    queues: standard,
  },
  {
    cpu: 'chernivetska-oblast',
    city: 'Чернівці',
    name: 'Чернівціобленерго',
    lookupUrl: 'https://oblenergo.cv.ua/shutdowns/',
    queues: Array.from({ length: 12 }, (_, index) => `${index + 1}`),
  },
  {
    cpu: 'kirovogradska-oblast',
    city: 'Кропивницький',
    name: 'Кіровоградобленерго',
    lookupUrl: 'https://kiroe.com.ua/electricity-blackout/schedule',
    queues: standard,
  },
  {
    cpu: 'mikolaivska-oblast',
    city: 'Миколаїв',
    name: 'Миколаївобленерго',
    lookupUrl: 'https://off.energy.mk.ua/',
    queues: standard,
  },
];
