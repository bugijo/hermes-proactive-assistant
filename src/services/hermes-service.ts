import {
  automations,
  devicePermissions,
  hermesPc,
  hermesSnapshot,
  hermesStatus,
  initialChat,
  systemMetrics,
  tasks,
  notifications,
  authorizedDevices,
  offers,
  promotionCategories,
  securitySettings,
  suggestions,
  user,
} from "./mock-hermes-data";
import type {
  Automation,
  ChatMessage,
  DevicePermission,
  HermesPcStatus,
  HermesSnapshot,
  HermesStatus,
  Offer,
  SecuritySetting,
  SystemMetrics,
  TaskRecord,
  NotificationRecord,
  AuthorizedDevice,
  Suggestion,
  UserProfile,
} from "@/types/hermes";

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data)) as T;
const delay = <T>(data: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(clone(data)), ms));

const apiBaseUrl = import.meta.env.VITE_HERMES_API_URL?.replace(/\/$/, "");

async function apiGet<T>(path: string, fallback: () => Promise<T>): Promise<T> {
  if (!apiBaseUrl) return fallback();

  try {
    const response = await fetch(`${apiBaseUrl}${path}`);
    if (!response.ok) throw new Error(`Hermes API ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    console.warn(`Hermes API unavailable for ${path}; using mock fallback.`, error);
    return fallback();
  }
}

async function apiPost<T>(path: string, body: unknown, fallback: () => Promise<T>): Promise<T> {
  if (!apiBaseUrl) return fallback();

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Hermes API ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    console.warn(`Hermes API unavailable for ${path}; using mock fallback.`, error);
    return fallback();
  }
}

export interface HermesService {
  getSnapshot(): Promise<HermesSnapshot>;
  getUser(): Promise<UserProfile>;
  getStatus(): Promise<HermesStatus>;
  getSuggestions(): Promise<Suggestion[]>;
  getOffers(): Promise<{ categories: string[]; offers: Offer[] }>;
  getAutomations(): Promise<Automation[]>;
  getDevicePermissions(): Promise<DevicePermission[]>;
  getPcStatus(): Promise<HermesPcStatus>;
  getSecuritySettings(): Promise<SecuritySetting[]>;
  getInitialChat(): Promise<ChatMessage[]>;
  sendChatMessage(text: string): Promise<ChatMessage>;
  getDashboardMetrics(): Promise<SystemMetrics>;
  getTasks(): Promise<TaskRecord[]>;
  getNotifications(): Promise<NotificationRecord[]>;
  getDevices(): Promise<AuthorizedDevice[]>;
  logAction(input: {
    action: string;
    entityType?: string;
    entityId?: string;
    sensitivity?: "normal" | "low" | "high";
    requiresConfirmation?: boolean;
    confirmed?: boolean;
    details?: unknown;
  }): Promise<{ id: string }>;
}

export const mockHermesService: HermesService = {
  getSnapshot: () => delay(hermesSnapshot),
  getUser: () => delay(user),
  getStatus: () => delay(hermesStatus),
  getSuggestions: () => delay(suggestions),
  getOffers: () => delay({ categories: promotionCategories, offers }),
  getAutomations: () => delay(automations),
  getDevicePermissions: () => delay(devicePermissions),
  getPcStatus: () => delay(hermesPc),
  getSecuritySettings: () => delay(securitySettings),
  getInitialChat: () => delay(initialChat),
  sendChatMessage: async () =>
    delay({
      id: `h-${Date.now()}`,
      role: "hermes",
      text: "Entendi. Deixa comigo — vou preparar uma sugestão e te aviso antes de fazer qualquer coisa.",
    }),
  getDashboardMetrics: () => delay(systemMetrics),
  getTasks: () => delay(tasks),
  getNotifications: () => delay(notifications),
  getDevices: () => delay(authorizedDevices),
  logAction: async () => delay({ id: `mock-log-${Date.now()}` }),
};

export const hermesService: HermesService = {
  getSnapshot: () => apiGet("/api/snapshot", mockHermesService.getSnapshot),
  getUser: () =>
    apiGet("/api/snapshot", mockHermesService.getSnapshot).then((snapshot) => snapshot.user),
  getStatus: () => apiGet("/api/status", mockHermesService.getStatus),
  getSuggestions: () => apiGet("/api/suggestions", mockHermesService.getSuggestions),
  getOffers: () => apiGet("/api/promotions", mockHermesService.getOffers),
  getAutomations: () => apiGet("/api/automations", mockHermesService.getAutomations),
  getDevicePermissions: () => apiGet("/api/permissions", mockHermesService.getDevicePermissions),
  getPcStatus: () => apiGet("/api/pc", mockHermesService.getPcStatus),
  getSecuritySettings: () =>
    apiGet("/api/snapshot", mockHermesService.getSnapshot).then(
      (snapshot) => snapshot.securitySettings,
    ),
  getInitialChat: () => apiGet("/api/chat", mockHermesService.getInitialChat),
  sendChatMessage: (text: string) =>
    apiPost("/api/chat", { text }, () => mockHermesService.sendChatMessage(text)),
  getDashboardMetrics: () => apiGet("/api/dashboard", mockHermesService.getDashboardMetrics),
  getTasks: () => apiGet("/api/tasks", mockHermesService.getTasks),
  getNotifications: () => apiGet("/api/notifications", mockHermesService.getNotifications),
  getDevices: () => apiGet("/api/devices", mockHermesService.getDevices),
  logAction: (input) =>
    apiPost("/api/action-logs", input, () => mockHermesService.logAction(input)),
};
