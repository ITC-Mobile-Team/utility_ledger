export const appIcons = {
  plus: require('@/assets/images/icons/plus.svg'),
  house: require('@/assets/images/icons/house.svg'),
  lock: require('@/assets/images/icons/lock.svg'),
  danger: require('@/assets/images/icons/danger.svg'),
  document: require('@/assets/images/icons/document.svg'),
  arrowUpRight: require('@/assets/images/icons/arrow-up-right.svg'),
  apartment: require('@/assets/images/icons/services/apartment.svg'),
  electricity: require('@/assets/images/icons/services/electricity.svg'),
  water: require('@/assets/images/icons/services/water.svg'),
  network: require('@/assets/images/icons/services/network.svg'),
  gas: require('@/assets/images/icons/services/gas.svg'),
  heating: require('@/assets/images/icons/services/heating.svg'),
};

export type AppIcon = keyof typeof appIcons;
