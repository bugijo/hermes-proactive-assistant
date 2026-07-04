import {
  automations,
  devicePermissions,
  hermesPc,
  hermesSnapshot,
  hermesStatus,
  initialChat,
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
  Suggestion,
  UserProfile,
} from "@/types/hermes";

const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data)) as T;
const delay = <T>(data: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(clone(data)), ms));

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
};

export const hermesService = mockHermesService;
