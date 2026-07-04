import { useQuery } from "@tanstack/react-query";
import { hermesService } from "@/services/hermes-service";
import {
  automations,
  devicePermissions,
  hermesPc,
  hermesSnapshot,
  initialChat,
  systemMetrics,
  tasks,
  notifications,
  authorizedDevices,
  offers,
  promotionCategories,
  securitySettings,
  suggestions,
} from "@/services/mock-hermes-data";

export function useHermesSnapshot() {
  return useQuery({
    queryKey: ["hermes", "snapshot"],
    queryFn: () => hermesService.getSnapshot(),
    initialData: hermesSnapshot,
  });
}

export function useSuggestions() {
  return useQuery({
    queryKey: ["hermes", "suggestions"],
    queryFn: () => hermesService.getSuggestions(),
    initialData: suggestions,
  });
}

export function useOffers() {
  return useQuery({
    queryKey: ["hermes", "offers"],
    queryFn: () => hermesService.getOffers(),
    initialData: { categories: promotionCategories, offers },
  });
}

export function useAutomations() {
  return useQuery({
    queryKey: ["hermes", "automations"],
    queryFn: () => hermesService.getAutomations(),
    initialData: automations,
  });
}

export function useDevicePermissions() {
  return useQuery({
    queryKey: ["hermes", "permissions"],
    queryFn: () => hermesService.getDevicePermissions(),
    initialData: devicePermissions,
  });
}

export function usePcStatus() {
  return useQuery({
    queryKey: ["hermes", "pc"],
    queryFn: () => hermesService.getPcStatus(),
    initialData: hermesPc,
  });
}

export function useSecuritySettings() {
  return useQuery({
    queryKey: ["hermes", "security"],
    queryFn: () => hermesService.getSecuritySettings(),
    initialData: securitySettings,
  });
}

export function useInitialChat() {
  return useQuery({
    queryKey: ["hermes", "chat"],
    queryFn: () => hermesService.getInitialChat(),
    initialData: initialChat,
  });
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["hermes", "dashboard"],
    queryFn: () => hermesService.getDashboardMetrics(),
    initialData: systemMetrics,
  });
}

export function useTasks() {
  return useQuery({
    queryKey: ["hermes", "tasks"],
    queryFn: () => hermesService.getTasks(),
    initialData: tasks,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["hermes", "notifications"],
    queryFn: () => hermesService.getNotifications(),
    initialData: notifications,
  });
}

export function useAuthorizedDevices() {
  return useQuery({
    queryKey: ["hermes", "authorized-devices"],
    queryFn: () => hermesService.getDevices(),
    initialData: authorizedDevices,
  });
}
