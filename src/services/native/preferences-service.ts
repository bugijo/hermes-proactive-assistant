import { platformService } from "@/services/platform";
import { hermesService } from "@/services/hermes-service";

export type SyncFrequency = "manual" | "15m" | "30m" | "1h" | "6h";
export interface NativePreferences {
  batterySaver: boolean;
  limitMobileData: boolean;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  syncFrequency: SyncFrequency;
  notificationsEnabled: boolean;
}

export const defaultNativePreferences: NativePreferences = {
  batterySaver: false,
  limitMobileData: true,
  quietHoursEnabled: true,
  quietStart: "22:00",
  quietEnd: "07:00",
  syncFrequency: "30m",
  notificationsEnabled: false,
};

const KEY = "hermes.native.preferences.v1";

export const nativePreferencesService = {
  async get(): Promise<NativePreferences> {
    const stored = await platformService.preferenceGet(KEY);
    if (!stored) return defaultNativePreferences;
    try {
      return { ...defaultNativePreferences, ...(JSON.parse(stored) as Partial<NativePreferences>) };
    } catch {
      return defaultNativePreferences;
    }
  },
  async set(value: NativePreferences) {
    await platformService.preferenceSet(KEY, JSON.stringify(value));
    await hermesService.updateNotificationPreferences(value);
  },
};

export function isQuietTime(preferences: NativePreferences, now = new Date()) {
  if (!preferences.quietHoursEnabled) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const parse = (value: string) => {
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute;
  };
  const start = parse(preferences.quietStart);
  const end = parse(preferences.quietEnd);
  return start <= end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}
