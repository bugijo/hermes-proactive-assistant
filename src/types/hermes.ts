export type HermesState = "Ativo" | "Dormindo" | "Economia de bateria";
export type ConnectionType = "Wi-Fi" | "Dados móveis";

export interface UserProfile {
  name: string;
}
export interface HermesStatus {
  state: HermesState;
  battery: number;
  connection: ConnectionType;
  pending: number;
}
export type SuggestionType = "promo" | "reminder" | "message" | "task";
export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  time: string;
  state?: "pending" | "approved" | "ignored" | "later";
  confirmationStatus?: "draft" | "pending_confirmation" | "confirmed";
}
export type OfferStatus = "Comprar agora" | "Esperar" | "Ruim" | "Suspeita";
export interface Offer {
  id: string;
  category: string;
  name: string;
  price: number;
  target: number;
  score: number;
  status: OfferStatus;
  url: string;
}
export type BatteryImpact = "baixo" | "médio" | "alto";
export interface Automation {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  frequency: string;
  impact: BatteryImpact;
  permissions: string[];
}
export interface DevicePermission {
  id: string;
  title: string;
  description: string;
  granted: boolean;
}
export interface PcTask {
  id: string;
  title: string;
  status: "Enviada" | "Concluída" | "Em execução";
  time: string;
}
export interface PcModule {
  id: string;
  name: string;
  description: string;
  icon: "brain" | "folder" | "terminal" | "hard-drive";
}
export interface HermesPcStatus {
  connected: boolean;
  ip: string;
  lastSync: string;
  tasks: PcTask[];
  modules: PcModule[];
}
export interface SecuritySetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  enforced?: boolean;
  editable?: boolean;
}
export interface ChatMessage {
  id: string;
  role: "user" | "hermes";
  text: string;
  card?: { title: string; description: string };
}

export interface SystemMetrics {
  cpu: number;
  ram: number;
  disk: number;
  gpu: number;
  hermesStatus: string;
  lastSync: string;
  taskCount: number;
  connectedDevices: number;
}
export interface TaskRecord {
  id: string;
  title: string;
  description?: string;
  priority: "baixa" | "média" | "alta";
  category: string;
  reminderAt?: string;
  status: "pendente" | "em andamento" | "concluída" | "cancelada";
  createdAt: string;
  updatedAt: string;
}
export interface NotificationRecord {
  id: string;
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
}
export interface AuthorizedDevice {
  id: string;
  name: string;
  type: string;
  connected: boolean;
  revoked: boolean;
  lastSync?: string;
  status?: "connected" | "offline" | "pending_approval" | "revoked";
  approvalStatus?: "pending" | "approved" | "revoked";
  pairedAt?: string;
}

export interface PairingToken {
  id: string;
  code: string;
  token: string;
  publicKey: string;
  qrPayload: string;
  expiresAt: string;
  status: "waiting" | "expired" | "claimed";
}

export interface HermesSnapshot {
  user: UserProfile;
  status: HermesStatus;
  suggestions: Suggestion[];
  offers: Offer[];
  promotionCategories: string[];
  automations: Automation[];
  devicePermissions: DevicePermission[];
  pc: HermesPcStatus;
  securitySettings: SecuritySetting[];
  initialChat: ChatMessage[];
  metrics?: SystemMetrics;
  tasks?: TaskRecord[];
  devices?: AuthorizedDevice[];
  notifications?: NotificationRecord[];
}
