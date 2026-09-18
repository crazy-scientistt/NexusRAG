import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export type DeviceType = "mobile" | "tablet" | "desktop";
export type Orientation = "portrait" | "landscape";

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: DeviceType;
  orientation: Orientation;
  width: number;
  height: number;
}

export function useDevice(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>(() => {
    if (typeof window === "undefined") {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        deviceType: "desktop",
        orientation: "landscape",
        width: 1280,
        height: 800,
      };
    }
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < MOBILE_BREAKPOINT;
    const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
    const isDesktop = width >= TABLET_BREAKPOINT;
    const deviceType: DeviceType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";
    const orientation: Orientation = width < height ? "portrait" : "landscape";
    return { isMobile, isTablet, isDesktop, deviceType, orientation, width, height };
  });

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < MOBILE_BREAKPOINT;
      const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
      const isDesktop = width >= TABLET_BREAKPOINT;
      const deviceType: DeviceType = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";
      const orientation: Orientation = width < height ? "portrait" : "landscape";
      setDeviceInfo({ isMobile, isTablet, isDesktop, deviceType, orientation, width, height });
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceInfo;
}

export function useIsMobile(): boolean {
  const { isMobile } = useDevice();
  return isMobile;
}

export function useIsTablet(): boolean {
  const { isTablet } = useDevice();
  return isTablet;
}
