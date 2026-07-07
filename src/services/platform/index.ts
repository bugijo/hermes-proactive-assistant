import { Capacitor } from "@capacitor/core";
import type { PlatformService } from "./contracts";
import { capacitorPlatformService } from "./capacitor-adapter";
import { webPlatformService } from "./web-adapter";

export function createPlatformService(native = Capacitor.isNativePlatform()): PlatformService {
  return native ? capacitorPlatformService : webPlatformService;
}

export const platformService = createPlatformService();
export type * from "./contracts";
