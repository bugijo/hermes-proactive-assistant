import type {
  BatteryStatus,
  ConnectionKind,
  DeviceSummary,
  LocalNotificationRequest,
  NetworkStatus,
  PlatformService,
} from "./contracts";

interface WebBatteryManager {
  level: number;
  charging: boolean;
}
interface WebConnection {
  type?: string;
  effectiveType?: string;
  addEventListener?: (event: string, listener: () => void) => void;
  removeEventListener?: (event: string, listener: () => void) => void;
}

const webNavigator = () => (typeof navigator === "undefined" ? undefined : navigator);
const connection = () =>
  (webNavigator() as (Navigator & { connection?: WebConnection }) | undefined)?.connection;
const connectionKind = (value?: string): ConnectionKind => {
  if (value === "wifi") return "wifi";
  if (value === "cellular" || value?.includes("g")) return "cellular";
  return typeof navigator !== "undefined" && !navigator.onLine ? "none" : "unknown";
};

export const webPlatformService: PlatformService = {
  platform: "web",
  native: false,
  async getBattery(): Promise<BatteryStatus> {
    const nav = webNavigator() as
      | (Navigator & { getBattery?: () => Promise<WebBatteryManager> })
      | undefined;
    if (!nav?.getBattery) return { level: null, charging: null };
    const battery = await nav.getBattery();
    return { level: Math.round(battery.level * 100), charging: battery.charging };
  },
  async getNetwork(): Promise<NetworkStatus> {
    const nav = webNavigator();
    return {
      connected: nav?.onLine ?? true,
      connection:
        nav?.onLine === false
          ? "none"
          : connectionKind(connection()?.type ?? connection()?.effectiveType),
    };
  },
  async watchNetwork(listener) {
    if (typeof window === "undefined") return () => undefined;
    const emit = () => void this.getNetwork().then(listener);
    window.addEventListener("online", emit);
    window.addEventListener("offline", emit);
    connection()?.addEventListener?.("change", emit);
    return () => {
      window.removeEventListener("online", emit);
      window.removeEventListener("offline", emit);
      connection()?.removeEventListener?.("change", emit);
    };
  },
  async getDevice(): Promise<DeviceSummary> {
    const nav = webNavigator();
    return {
      platform: "web",
      model: "Navegador",
      operatingSystem: nav?.platform ?? "web",
      osVersion: "",
      manufacturer: nav?.vendor,
    };
  },
  async scheduleNotification(request: LocalNotificationRequest) {
    if (typeof Notification === "undefined" || request.at) return false;
    const permission =
      Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;
    if (permission !== "granted") return false;
    new Notification(request.title, { body: request.body, data: request.extra });
    return true;
  },
  async openApp() {
    return false;
  },
  async openExternal(url) {
    if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
  },
  async share(input) {
    const nav = webNavigator();
    if (nav?.share) {
      await nav.share(input);
      return true;
    }
    const value = [input.text, input.url].filter(Boolean).join(" ");
    if (value && nav?.clipboard) {
      await nav.clipboard.writeText(value);
      return true;
    }
    return false;
  },
  async secureGet(key) {
    return typeof window === "undefined" ? null : window.sessionStorage.getItem(key);
  },
  async secureSet(key, value) {
    if (typeof window !== "undefined") window.sessionStorage.setItem(key, value);
  },
  async secureRemove(key) {
    if (typeof window !== "undefined") window.sessionStorage.removeItem(key);
  },
  async preferenceGet(key) {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  },
  async preferenceSet(key, value) {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  },
};
