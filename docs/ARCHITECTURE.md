# Arquitetura — Hermes Mobile

## Objetivo atual

Preservar a interface criada no Lovable enquanto o projeto ganha separação de responsabilidades para virar um app Android/PWA real.

## Camadas

- **Routes (`src/routes`)**: arquivos do TanStack Router/Start. Continuam estáveis para compatibilidade Lovable.
- **Components (`src/components`)**: shell mobile, navegação e componentes UI reutilizáveis.
- **Features (`src/features`)**: área reservada por domínio para mover lógica de tela gradualmente.
- **Services (`src/services`)**: fronteira entre UI e dados. Hoje usa mocks; amanhã API real.
- **Types (`src/types`)**: contratos do domínio Hermes usados por serviços e telas.
- **Hooks (`src/hooks`)**: consultas e estados compartilhados, incluindo TanStack Query.
- **Lib (`src/lib`)**: utilitários técnicos, registro de service worker e integrações Lovable.

## Contrato de dados

`HermesService` define métodos para snapshot, status, sugestões, promoções, automações, permissões, Hermes PC, segurança e chat. A implementação mock simula latência e retorna cópias para evitar mutação acidental.

## Integração Hermes PC futura

A tela `/pc` deve evoluir para um cliente de sincronização autenticado. Recomendado: pareamento por QR code, troca de chaves, canal HTTPS local/WebSocket e logs auditáveis.

## Backend local

A Fase 2 adiciona `backend/` com Bun + SQLite. A UI chama `HermesService`; quando `VITE_HERMES_API_URL` existe, o serviço tenta a API REST local e volta para mocks se houver falha.

Na Fase 3, a API usa migrações SQL numeradas em `backend/migrations`, repositórios de domínio, envelope uniforme de respostas e middleware de sessão para todas as rotas privadas. O seed só roda fora de produção e pode ser desativado com `HERMES_SEED=false`.

O frontend é envolvido por `AuthGate`: com API online, exige bootstrap/login; sem API, preserva o fluxo Lovable e sinaliza o modo demo. O token fica em `sessionStorage`, enquanto o servidor persiste somente seu hash.

## Organização backend Fase 3

```text
backend/src/
  controllers/    Reservado para controladores HTTP específicos.
  database/       Runner de migrações, conexão SQLite e seed de desenvolvimento.
  middleware/     Autenticação JWT e validações transversais.
  models/         Tipos de domínio do backend.
  repositories/   Persistência por domínio.
  routes/         Mapeamento REST/WebSocket.
  services/       Regras de negócio: auth, pareamento e dispositivos.
  utils/          HTTP, JWT, hashing e tokens.
```

Fluxo: frontend → `HermesService` → REST/WebSocket local → routes → services → repositories → SQLite → action logs quando a ação for sensível.
