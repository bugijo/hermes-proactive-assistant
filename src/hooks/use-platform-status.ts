import { useEffect, useState } from "react";
import {
  platformService,
  type BatteryStatus,
  type DeviceSummary,
  type NetworkStatus,
} from "@/services/platform";

export function usePlatformStatus() {
  const [battery, setBattery] = useState<BatteryStatus>({ level: null, charging: null });
  const [network, setNetwork] = useState<NetworkStatus>({ connected: true, connection: "unknown" });
  const [device, setDevice] = useState<DeviceSummary>({
    platform: "web",
    model: "Navegador",
    operatingSystem: "web",
    osVersion: "",
  });
  useEffect(() => {
    let cleanup: () => void = () => undefined;
    void Promise.all([
      platformService.getBattery(),
      platformService.getNetwork(),
      platformService.getDevice(),
    ]).then(([nextBattery, nextNetwork, nextDevice]) => {
      setBattery(nextBattery);
      setNetwork(nextNetwork);
      setDevice(nextDevice);
    });
    void platformService.watchNetwork(setNetwork).then((remove) => {
      cleanup = remove;
    });
    return () => cleanup();
  }, []);
  return { battery, network, device, native: platformService.native };
}
