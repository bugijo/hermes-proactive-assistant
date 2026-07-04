// Mock data for Hermes Mobile — no backend yet.

export const userName = "Giovanni";

export const hermesStatus = {
  state: "Ativo" as "Ativo" | "Dormindo" | "Economia de bateria",
  battery: 78,
  connection: "Wi-Fi" as "Wi-Fi" | "Dados móveis",
  pending: 4,
};

export type SuggestionType = "promo" | "reminder" | "message" | "task";
export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  time: string;
}

export const suggestions: Suggestion[] = [
  {
    id: "s1",
    type: "promo",
    title: "Promoção boa: SSD NVMe 1TB",
    description: "Kingston NV2 caiu para R$ 349 (histórico R$ 429). Nota Hermes 8.6.",
    time: "há 12 min",
  },
  {
    id: "s2",
    type: "reminder",
    title: "Lembrete: Consulta amanhã 09:00",
    description: "Quer que eu prepare o trajeto e um alerta 30 min antes?",
    time: "há 1 h",
  },
  {
    id: "s3",
    type: "message",
    title: "Mensagem sem resposta — Ana",
    description: "'Confirma o horário de sábado?' Posso preparar uma resposta.",
    time: "há 2 h",
  },
  {
    id: "s4",
    type: "task",
    title: "Tarefa sugerida: Backup de fotos",
    description: "Faz 21 dias sem backup. Posso sincronizar com o Hermes PC.",
    time: "há 4 h",
  },
];

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

export const promotionCategories = [
  "Processadores",
  "Placas-mãe",
  "Memória RAM",
  "SSD",
  "Placas de vídeo",
  "Jogos",
];

export const offers: Offer[] = [
  { id: "o1", category: "Processadores", name: "Ryzen 5 7600", price: 1189, target: 1100, score: 8.2, status: "Esperar", url: "#" },
  { id: "o2", category: "SSD", name: "Kingston NV2 1TB", price: 349, target: 380, score: 8.6, status: "Comprar agora", url: "#" },
  { id: "o3", category: "Placas de vídeo", name: "RTX 4060 8GB", price: 1899, target: 1700, score: 6.8, status: "Esperar", url: "#" },
  { id: "o4", category: "Memória RAM", name: "DDR5 32GB 6000MHz", price: 649, target: 600, score: 7.9, status: "Esperar", url: "#" },
  { id: "o5", category: "Jogos", name: "Elden Ring", price: 89, target: 99, score: 9.4, status: "Comprar agora", url: "#" },
  { id: "o6", category: "Placas-mãe", name: "B650M AORUS", price: 1299, target: 1000, score: 4.5, status: "Ruim", url: "#" },
  { id: "o7", category: "SSD", name: "SSD genérico 2TB", price: 199, target: 500, score: 2.1, status: "Suspeita", url: "#" },
];

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

export const automations: Automation[] = [
  { id: "a1", name: "Monitorar promoções", description: "Consulta lojas parceiras e histórico de preços.", enabled: true, frequency: "A cada 30 min", impact: "baixo", permissions: ["Internet"] },
  { id: "a2", name: "Resumir Telegram", description: "Gera resumos diários de grupos selecionados.", enabled: true, frequency: "Diário 08:00", impact: "médio", permissions: ["Notificações"] },
  { id: "a3", name: "Preparar resposta no WhatsApp", description: "Sugere respostas — nunca envia sem confirmação.", enabled: false, frequency: "Ao receber", impact: "médio", permissions: ["Notificações", "Acessibilidade"] },
  { id: "a4", name: "Pesquisar preços", description: "Busca variações de preço para itens da sua lista.", enabled: true, frequency: "A cada 2 h", impact: "baixo", permissions: ["Internet"] },
  { id: "a5", name: "Sincronizar com Hermes PC", description: "Troca tarefas e arquivos com o desktop.", enabled: true, frequency: "Ao conectar Wi-Fi", impact: "baixo", permissions: ["Rede local"] },
  { id: "a6", name: "Organizar arquivos", description: "Sugere organização de downloads e fotos.", enabled: false, frequency: "Semanal", impact: "alto", permissions: ["Armazenamento"] },
];

export interface DevicePermission {
  id: string;
  title: string;
  description: string;
  granted: boolean;
}

export const devicePermissions: DevicePermission[] = [
  { id: "p1", title: "Abrir apps", description: "Iniciar apps específicos quando você pedir.", granted: true },
  { id: "p2", title: "Ler notificações", description: "Entender contexto de mensagens e alertas.", granted: true },
  { id: "p3", title: "Controlar tela (acessibilidade)", description: "Executar ações complexas em outros apps.", granted: false },
  { id: "p4", title: "Digitar textos", description: "Preparar rascunhos em campos de texto.", granted: false },
  { id: "p5", title: "Preparar mensagens", description: "Escrever mensagens para você revisar antes de enviar.", granted: true },
  { id: "p6", title: "Pesquisar no navegador", description: "Abrir buscas e páginas em nome do assistente.", granted: true },
];

export interface PcTask {
  id: string;
  title: string;
  status: "Enviada" | "Concluída" | "Em execução";
  time: string;
}

export const hermesPc = {
  connected: true,
  ip: "192.168.0.14",
  lastSync: "há 3 min",
  tasks: [
    { id: "t1", title: "Baixar dataset ML", status: "Em execução", time: "há 5 min" },
    { id: "t2", title: "Gerar relatório mensal", status: "Concluída", time: "há 1 h" },
    { id: "t3", title: "Compilar projeto Hermes-core", status: "Concluída", time: "hoje 10:12" },
    { id: "t4", title: "Renomear fotos viagem", status: "Enviada", time: "há 20 min" },
  ] as PcTask[],
  modules: [
    { id: "m1", name: "IA local", description: "Modelo rodando no PC", icon: "brain" as const },
    { id: "m2", name: "Projetos", description: "12 projetos ativos", icon: "folder" as const },
    { id: "m3", name: "Scripts", description: "34 automações", icon: "terminal" as const },
    { id: "m4", name: "Arquivos", description: "2.4 TB indexados", icon: "hard-drive" as const },
  ],
};

export interface SecuritySetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export const securitySettings: SecuritySetting[] = [
  { id: "sec1", title: "Confirmar antes de enviar mensagens", description: "Nada será enviado sem seu 'ok'.", enabled: true },
  { id: "sec2", title: "Confirmar antes de compras", description: "Toda compra passa por revisão.", enabled: true },
  { id: "sec3", title: "Nunca apagar arquivos automaticamente", description: "Exclusão sempre exige confirmação.", enabled: true },
  { id: "sec4", title: "Modo economia de bateria", description: "Reduz automações em segundo plano.", enabled: false },
  { id: "sec5", title: "Limitar uso em dados móveis", description: "Só sincroniza pesado em Wi-Fi.", enabled: true },
  { id: "sec6", title: "Registrar ações em log", description: "Mantém histórico auditável.", enabled: true },
];

export interface ChatMessage {
  id: string;
  role: "user" | "hermes";
  text: string;
  card?: { title: string; description: string };
}

export const initialChat: ChatMessage[] = [
  { id: "c1", role: "hermes", text: "Olá, Giovanni. Estou monitorando 3 promoções e vi uma mensagem sem resposta. Quer que eu comece por onde?" },
  { id: "c2", role: "user", text: "Analisa a promoção do SSD." },
  {
    id: "c3",
    role: "hermes",
    text: "Analisei. O preço está 19% abaixo do histórico e a loja é confiável.",
    card: { title: "Kingston NV2 1TB — R$ 349", description: "Nota Hermes 8.6 · Recomendação: Comprar agora" },
  },
];
