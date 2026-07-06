import {
  authorizedDevices,
  automations,
  devicePermissions,
  hermesPc,
  hermesSnapshot,
  hermesStatus,
  initialChat,
  notifications,
  offers,
  promotionCategories,
  securitySettings,
  suggestions,
  systemMetrics,
  tasks,
  user,
} from "./mock-hermes-data";
import type {
  AuthorizedDevice,
  Automation,
  ChatMessage,
  DevicePermission,
  HermesPcStatus,
  HermesSnapshot,
  HermesStatus,
  NotificationRecord,
  Offer,
  SecuritySetting,
  Suggestion,
  SystemMetrics,
  TaskRecord,
  UserProfile,
  PairingToken,
} from "@/types/hermes";
import type { NativePreferences } from "@/services/native/preferences-service";
import { platformService } from "@/services/platform";

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data)) as T;
const delay = <T>(data: T, ms = 100): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(clone(data)), ms));
const apiBaseUrl = import.meta.env.VITE_HERMES_API_URL?.replace(/\/$/, "");
const TOKEN_KEY = "hermes.session";

export type ConnectionMode = "online" | "offline";
export interface AuthStatus {
  hasUser: boolean;
  authenticationRequired: boolean;
}
export interface AuthSession {
  token: string;
  expiresAt: string;
  user: { id: string; name: string; email: string };
}

const browser = typeof window !== "undefined";
let tokenCache: string | null = null;
let restorePromise: Promise<string | null> | null = null;
const getToken = async () => {
  if (tokenCache) return tokenCache;
  restorePromise ??= platformService.secureGet(TOKEN_KEY);
  tokenCache = await restorePromise;
  return tokenCache;
};
export const saveSession = (session: AuthSession) => {
  tokenCache = session.token;
  void platformService.secureSet(TOKEN_KEY, session.token);
};
export const clearSession = () => {
  tokenCache = null;
  restorePromise = null;
  void platformService.secureRemove(TOKEN_KEY);
};
const notifyMode = (mode: ConnectionMode) => {
  if (browser) window.dispatchEvent(new CustomEvent("hermes:connection", { detail: mode }));
};

class ApiResponseError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiBaseUrl) throw new TypeError("API not configured");
  const token = await getToken();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const payload = (await response.json()) as {
    data?: T;
    error?: { code: string; message: string };
  };
  if (!response.ok) {
    if (response.status === 401) {
      clearSession();
      if (browser) window.dispatchEvent(new Event("hermes:unauthorized"));
    }
    throw new ApiResponseError(
      response.status,
      payload.error?.code ?? "API_ERROR",
      payload.error?.message ?? `Hermes API ${response.status}`,
    );
  }
  notifyMode("online");
  return payload.data as T;
}

async function withFallback<T>(path: string, fallback: () => Promise<T>): Promise<T> {
  try {
    return await request<T>(path);
  } catch (error) {
    if (error instanceof ApiResponseError) throw error;
    console.warn(`Hermes API indisponível em ${path}; usando fallback mock.`, error);
    notifyMode("offline");
    return fallback();
  }
}

const mutate = <T>(method: string, path: string, body?: unknown) =>
  request<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });

async function mutateWithFallback<T>(
  method: string,
  path: string,
  body: unknown,
  fallback: () => Promise<T>,
) {
  try {
    return await mutate<T>(method, path, body);
  } catch (error) {
    if (error instanceof ApiResponseError) throw error;
    notifyMode("offline");
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
  updateSuggestion(id: string, state: "approved" | "ignored" | "later"): Promise<Suggestion>;
  updateAutomation(id: string, enabled: boolean): Promise<Automation>;
  updatePermission(id: string, granted: boolean): Promise<DevicePermission>;
  updateSecuritySetting(id: string, enabled: boolean): Promise<SecuritySetting>;
  addPromotion(input: Pick<Offer, "name" | "category" | "target"> & Partial<Offer>): Promise<Offer>;
  removePromotion(id: string): Promise<void>;
  createPairingToken(): Promise<PairingToken>;
  approveDevice(id: string): Promise<AuthorizedDevice>;
  revokeDevice(id: string): Promise<void>;
  getNotificationPreferences(): Promise<NativePreferences>;
  updateNotificationPreferences(input: NativePreferences): Promise<NativePreferences>;
  createNotification(input: {
    title: string;
    description: string;
    type: string;
  }): Promise<{ id: string }>;
  recordNativeAction(input: {
    action: string;
    payload?: unknown;
    confirmationStatus?: "draft" | "pending_confirmation" | "confirmed";
  }): Promise<{ id: string }>;
}

export const authApi = {
  status: () => request<AuthStatus>("/api/auth/status"),
  register: (input: { name: string; email: string; password: string }) =>
    mutate<AuthSession>("POST", "/api/auth/register", input),
  login: (input: { email: string; password: string }) =>
    mutate<AuthSession>("POST", "/api/auth/login", input),
  async logout() {
    try {
      await mutate("POST", "/api/auth/logout");
    } finally {
      clearSession();
    }
  },
  hasSession: () => Boolean(tokenCache),
  async restoreSession() {
    return Boolean(await getToken());
  },
  isConfigured: () => Boolean(apiBaseUrl),
};

export const hermesService: HermesService = {
  getSnapshot: () => withFallback("/api/snapshot", () => delay(hermesSnapshot)),
  getUser: () => withFallback("/api/snapshot", () => delay(hermesSnapshot)).then((x) => x.user),
  getStatus: () => withFallback("/api/status", () => delay(hermesStatus)),
  getSuggestions: () => withFallback("/api/suggestions", () => delay(suggestions)),
  getOffers: () =>
    withFallback("/api/promotions", () => delay({ categories: promotionCategories, offers })),
  getAutomations: () => withFallback("/api/automations", () => delay(automations)),
  getDevicePermissions: () => withFallback("/api/permissions", () => delay(devicePermissions)),
  getPcStatus: () => withFallback("/api/pc", () => delay(hermesPc)),
  getSecuritySettings: () => withFallback("/api/security-settings", () => delay(securitySettings)),
  getInitialChat: () => withFallback("/api/chat", () => delay(initialChat)),
  sendChatMessage: (text) =>
    apiBaseUrl
      ? mutateWithFallback("POST", "/api/chat", { text, confirmationStatus: "draft" }, () =>
          delay({
            id: `h-${Date.now()}`,
            role: "hermes",
            text: "Modo demo: salvei apenas nesta tela; ações sensíveis continuam bloqueadas.",
          }),
        )
      : delay({
          id: `h-${Date.now()}`,
          role: "hermes",
          text: "Modo demo: salvei apenas nesta tela; ações sensíveis continuam bloqueadas.",
        }),
  getDashboardMetrics: () => withFallback("/api/dashboard", () => delay(systemMetrics)),
  getTasks: () => withFallback("/api/tasks", () => delay(tasks)),
  getNotifications: () => withFallback("/api/notifications", () => delay(notifications)),
  getDevices: () => withFallback("/api/devices", () => delay(authorizedDevices)),
  updateSuggestion: (id, state) =>
    apiBaseUrl
      ? mutateWithFallback(
          "PATCH",
          `/api/suggestions/${id}`,
          { state, confirmationStatus: "confirmed" },
          () => delay({ ...suggestions.find((x) => x.id === id)!, state }),
        )
      : delay({ ...suggestions.find((x) => x.id === id)!, state }),
  updateAutomation: (id, enabled) =>
    apiBaseUrl
      ? mutateWithFallback(
          "PATCH",
          `/api/automations/${id}`,
          { enabled, confirmationStatus: "confirmed" },
          () => delay({ ...automations.find((x) => x.id === id)!, enabled }),
        )
      : delay({ ...automations.find((x) => x.id === id)!, enabled }),
  updatePermission: (id, granted) =>
    apiBaseUrl
      ? mutateWithFallback(
          "PATCH",
          `/api/permissions/${id}`,
          { granted, confirmationStatus: "confirmed" },
          () => delay({ ...devicePermissions.find((x) => x.id === id)!, granted }),
        )
      : delay({ ...devicePermissions.find((x) => x.id === id)!, granted }),
  updateSecuritySetting: (id, enabled) =>
    apiBaseUrl
      ? mutateWithFallback(
          "PATCH",
          `/api/security-settings/${id}`,
          { enabled, confirmationStatus: "confirmed" },
          () => delay({ ...securitySettings.find((x) => x.id === id)!, enabled }),
        )
      : delay({ ...securitySettings.find((x) => x.id === id)!, enabled }),
  addPromotion: (input) =>
    apiBaseUrl
      ? mutateWithFallback(
          "POST",
          "/api/promotions",
          { price: 0, score: 0, status: "Esperar", url: "#", ...input },
          () =>
            delay({
              id: `mock-${Date.now()}`,
              price: 0,
              score: 0,
              status: "Esperar",
              url: "#",
              ...input,
            } as Offer),
        )
      : delay({
          id: `mock-${Date.now()}`,
          price: 0,
          score: 0,
          status: "Esperar",
          url: "#",
          ...input,
        } as Offer),
  removePromotion: async (id) => {
    if (apiBaseUrl)
      await mutateWithFallback("DELETE", `/api/promotions/${id}`, undefined, () =>
        Promise.resolve(undefined),
      );
  },
  createPairingToken: () => mutate("POST", "/api/pairing-tokens", {}),
  approveDevice: (id) => mutate("POST", `/api/devices/${id}/approve`),
  revokeDevice: async (id) => {
    await mutate("DELETE", `/api/devices/${id}`);
  },
  getNotificationPreferences: () =>
    withFallback(
      "/api/preferences/notifications",
      async () => (await import("@/services/native/preferences-service")).defaultNativePreferences,
    ),
  updateNotificationPreferences: (input) =>
    mutateWithFallback("PUT", "/api/preferences/notifications", input, () =>
      Promise.resolve(input),
    ),
  createNotification: (input) =>
    mutateWithFallback("POST", "/api/notifications", input, () =>
      Promise.resolve({ id: `offline-${Date.now()}` }),
    ),
  recordNativeAction: (input) =>
    mutateWithFallback("POST", "/api/native-actions", input, () =>
      Promise.resolve({ id: `offline-${Date.now()}` }),
    ),
};
