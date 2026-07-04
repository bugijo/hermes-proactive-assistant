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
