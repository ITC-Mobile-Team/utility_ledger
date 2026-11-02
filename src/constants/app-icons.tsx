export const appIcons = {
  plus: require('@/images/button/plus.svg'),
  house: require('@/images/house.svg'),
  lock: require('@/images/lock.svg'),
  danger: require('@/images/danger.svg'),
  apartment: require('@/images/services/apartment.svg'),
  electricity: require('@/images/services/electricity.svg'),
  water: require('@/images/services/water.svg'),
  network: require('@/images/services/network.svg'),
};

export type AppIcon = keyof typeof appIcons;
