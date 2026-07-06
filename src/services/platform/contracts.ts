export type PlatformKind = "web" | "android" | "ios";
export type ConnectionKind = "wifi" | "cellular" | "none" | "unknown";

export interface BatteryStatus {
  level: number | null;
  charging: boolean | null;
}

export interface NetworkStatus {
  connected: boolean;
  connection: ConnectionKind;
}

export interface DeviceSummary {
  platform: PlatformKind;
  model: string;
  operatingSystem: string;
  osVersion: string;
  manufacturer?: string;
}

export interface LocalNotificationRequest {
  id: number;
  title: string;
  body: string;
  at?: Date;
  extra?: Record<string, unknown>;
}

export interface PlatformService {
  platform: PlatformKind;
  native: boolean;
  getBattery(): Promise<BatteryStatus>;
  getNetwork(): Promise<NetworkStatus>;
  watchNetwork(listener: (status: NetworkStatus) => void): Promise<() => void>;
  getDevice(): Promise<DeviceSummary>;
  scheduleNotification(request: LocalNotificationRequest): Promise<boolean>;
  openApp(url: string): Promise<boolean>;
  openExternal(url: string): Promise<void>;
  share(input: { title?: string; text?: string; url?: string }): Promise<boolean>;
  secureGet(key: string): Promise<string | null>;
  secureSet(key: string, value: string): Promise<void>;
  secureRemove(key: string): Promise<void>;
  preferenceGet(key: string): Promise<string | null>;
  preferenceSet(key: string, value: string): Promise<void>;
}
