const light = {
  // surfaces & text
  bg: '#F1F3F7',
  surface: '#FFFFFF',
  surface2: '#F1F3F7',
  ink: '#0F1B2D',
  muted: '#566173',
  line: '#E2E6EC',
  chev: '#8A94A3',
  placeholder: '#7B8494',
  track: '#E4E8EE',
  faint: '#B9C2CE',
  disabledBg: '#D5DAE1',
  disabledInk: '#5F6977',
  inkTile: '#1C2B40',
  tabInk: '#6B7584',
  scrim: 'rgba(15,27,45,0.42)',
  onPrimary: '#FFFFFF',

  // brand
  blue: '#0B57C2',
  blueSoft: '#E7F0FC',
  blueSoft2: '#D3E3F8',
  blueInk: '#0A4CA8',
  coral: '#D2392F',
  coralSoft: '#FDECEA',
  coralInk: '#A82A22',
  green: '#17804F',
  greenSoft: '#E3F4EB',
  greenSoft2: '#CFE5D6',
  greenInk: '#1F6B3E',
  greenBrand: '#2B6B42',
  amber: '#B86400',
  amberSoft: '#FFF2DE',
  amberInk: '#7A4300',
  purple: '#6B3FA0',
  purpleSoft: '#EFE8F8',
  purpleInk: '#5A2E88',

  // services
  water: '#1F6FE0',
  waterSoft: '#E5EFFD',
  gas: '#C2410C',
  gasSoft: '#FDEEE6',
  heat: '#B42318',
  heatSoft: '#FDECEA',

  // hero
  heroEnd: '#1E7BD0',
  heroSub: '#D4E3F8',
  heroSubGreen: '#D2EBDA',
  heroSubPurple: '#E3D6F5',

  // components
  btnDarkBg: '#0F1B2D',
  btnDarkInk: '#FFFFFF',
  meterBg: '#0F1B2D',
  meterDigit: '#1E2D44',
  monthDim: 'transparent',

  // liquid glass
  glassBg: 'rgba(255,255,255,0.58)',
  glassRim: 'rgba(255,255,255,0.75)',
  glassHi: 'rgba(255,255,255,0.9)',
  glassLo: 'rgba(0,0,0,0.04)',
  glassPill: 'rgba(120,130,150,0.16)',
} as const;

export type AppColor = keyof typeof light;

const dark: Record<AppColor, string> = {
  bg: '#111214',
  surface: '#222327',
  surface2: '#2D2E33',
  ink: '#F2F3F5',
  muted: '#A3A9B3',
  line: '#34363C',
  chev: '#8B919B',
  placeholder: '#858B95',
  track: '#3A3D43',
  faint: '#555A62',
  disabledBg: '#3A3C41',
  disabledInk: '#8D929A',
  inkTile: '#3A3D44',
  tabInk: '#9AA0A9',
  scrim: 'rgba(0,0,0,0.6)',
  onPrimary: '#FFFFFF',

  blue: '#3D82E6',
  blueSoft: 'rgba(77,140,235,0.18)',
  blueSoft2: 'rgba(77,140,235,0.30)',
  blueInk: '#8DB8F5',
  coral: '#D2392F',
  coralSoft: 'rgba(235,85,75,0.18)',
  coralInk: '#FF8E86',
  green: '#4CC285',
  greenSoft: 'rgba(70,180,115,0.18)',
  greenSoft2: 'rgba(70,180,115,0.32)',
  greenInk: '#7FD3A2',
  greenBrand: '#3C9A62',
  amber: '#F2A93B',
  amberSoft: 'rgba(240,160,50,0.18)',
  amberInk: '#F2B866',
  purple: '#A47BDB',
  purpleSoft: 'rgba(160,120,220,0.18)',
  purpleInk: '#C3A2EE',

  water: '#6FA5F5',
  waterSoft: 'rgba(80,140,240,0.2)',
  gas: '#F59362',
  gasSoft: 'rgba(240,120,60,0.2)',
  heat: '#F27A6E',
  heatSoft: 'rgba(235,90,80,0.2)',

  heroEnd: '#1262B4',
  heroSub: '#B9CDEB',
  heroSubGreen: '#B8D9C4',
  heroSubPurple: '#D2C2EC',

  btnDarkBg: '#FFFFFF',
  btnDarkInk: '#0F1B2D',
  meterBg: '#05080D',
  meterDigit: '#1E2D44',
  monthDim: 'rgba(17,18,20,0.62)',

  glassBg: 'rgba(40,41,46,0.55)',
  glassRim: 'rgba(255,255,255,0.14)',
  glassHi: 'rgba(255,255,255,0.18)',
  glassLo: 'rgba(0,0,0,0.3)',
  glassPill: 'rgba(255,255,255,0.12)',
};

export const gradientLocations = [0, 0.55, 1] as const;

export const gradients = {
  light: {
    heroBlue: ['#0A45A3', '#1567C4', '#1E7BD0'],
    heroGreen: ['#1D4E33', '#2B6B42', '#3C8753'],
    heroPurple: ['#24103F', '#3D1F66', '#5B2E88'],
  },
  dark: {
    heroBlue: ['#07326F', '#0B4F9E', '#1262B4'],
    heroGreen: ['#123222', '#1E4E31', '#2B6B42'],
    heroPurple: ['#170A2A', '#2A1548', '#422264'],
  },
} as const;

export const chart = {
  trend: '#E8590C',
  electricity: '#E08A00',
  water: '#1F6FE0',
} as const;

export const colors = { light, dark };
