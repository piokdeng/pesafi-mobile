import { useWindowDimensions } from 'react-native';

export const DESKTOP_BREAKPOINT = 768;
export const SIDEBAR_WIDTH = 220;
export const MAX_CONTENT_WIDTH = 600;

export function useResponsive() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  return { isDesktop, width };
}
