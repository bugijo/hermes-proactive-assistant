import { registerPlugin } from "@capacitor/core";
import { AppLauncher } from "@capacitor/app-launcher";
import { Browser } from "@capacitor/browser";
import { Device } from "@capacitor/device";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Network } from "@capacitor/network";
import { Preferences } from "@capacitor/preferences";
import { Share } from "@capacitor/share";
import type { ConnectionKind, PlatformKind, PlatformService } from "./contracts";

interface SecureStoragePlugin {
  get(input: { key: string }): Promise<{ value: string | null }>;
  set(input: { key: string; value: string }): Promise<void>;
  remove(input: { key: string }): Promise<void>;
}
const SecureStorage = registerPlugin<SecureStoragePlugin>("HermesSecureStorage");
const networkKind = (value: string): ConnectionKind =>
  value === "wifi" || value === "cellular" || value === "none" ? value : "unknown";

export const capacitorPlatformService: PlatformService = {
  platform: "android",
  native: true,
  async getBattery() {
    const battery = await Device.getBatteryInfo();
    return {
      level: battery.batteryLevel == null ? null : Math.round(battery.batteryLevel * 100),
      charging: battery.isCharging ?? null,
    };
  },
  async getNetwork() {
    const status = await Network.getStatus();
    return { connected: status.connected, connection: networkKind(status.connectionType) };
  },
  async watchNetwork(listener) {
    const handle = await Network.addListener("networkStatusChange", (status) =>
      listener({ connected: status.connected, connection: networkKind(status.connectionType) }),
    );
    return () => void handle.remove();
  },
  async getDevice() {
    const info = await Device.getInfo();
    return {
      platform: info.platform as PlatformKind,
      model: info.model,
      operatingSystem: info.operatingSystem,
      osVersion: info.osVersion,
      manufacturer: info.manufacturer,
    };
  },
  async scheduleNotification(request) {
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display === "prompt") permission = await LocalNotifications.requestPermissions();
    if (permission.display !== "granted") return false;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: request.id,
          title: request.title,
          body: request.body,
          schedule: request.at ? { at: request.at } : undefined,
          extra: request.extra,
          smallIcon: "ic_stat_hermes",
          iconColor: "#7c3aed",
        },
      ],
    });
    return true;
  },
  async openApp(url) {
    const result = await AppLauncher.canOpenUrl({ url });
    if (!result.value) return false;
    await AppLauncher.openUrl({ url });
    return true;
  },
  async openExternal(url) {
    await Browser.open({ url });
  },
  async share(input) {
    await Share.share(input);
    return true;
  },
  async secureGet(key) {
    return (await SecureStorage.get({ key })).value;
  },
  async secureSet(key, value) {
    await SecureStorage.set({ key, value });
  },
  async secureRemove(key) {
    await SecureStorage.remove({ key });
  },
  async preferenceGet(key) {
    return (await Preferences.get({ key })).value;
  },
  async preferenceSet(key, value) {
    await Preferences.set({ key, value });
  },
};
