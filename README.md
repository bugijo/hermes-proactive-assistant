# Hermes Mobile

Hermes Mobile é a evolução do protótipo Lovable para um app mobile-first/PWA que futuramente poderá conectar com Hermes PC. O visual original foi preservado; esta etapa estabiliza o frontend e isola dados mockados em uma camada de serviço substituível por API real.

## Stack identificada

- React 19 + TypeScript.
- TanStack Router/Start para rotas file-based em `src/routes`.
- TanStack Query para cache e futura integração API.
- Vite 8 + Tailwind CSS 4.
- shadcn/Radix UI em `src/components/ui`.
- Bun como gerenciador, lockfile `bun.lock`.

## Como rodar

### Frontend com mock/fallback

```bash
bun install
bun run dev
```

### Backend local + frontend usando API real

```bash
bun backend/src/server.ts
VITE_HERMES_API_URL=http://localhost:8787 bun run dev
```

A aplicação abre via Vite/TanStack Start. Em ambientes Lovable, a configuração de Vite já injeta plugins necessários. Quando `VITE_HERMES_API_URL` não existir ou a API ficar offline, o frontend volta automaticamente para os mocks.

## Como validar e buildar

```bash
bun test backend/tests
bun run lint
bun run build
```

> Observação: se o registry npm retornar 403, instale dependências em um ambiente com acesso ao registry ou cache configurado.

## Rotas e telas

- `/` — dashboard principal.
- `/chat` — conversa com Hermes.
- `/suggestions` — sugestões e aprovações.
- `/promotions` — monitoramento de ofertas.
- `/automations` — automações em segundo plano.
- `/device` — permissões Android/celular.
- `/pc` — status e tarefas do Hermes PC.
- `/security` — regras de segurança.
- `/settings` — configurações.

## Estrutura do projeto

```text
src/
  components/     Componentes visuais compartilhados e UI base.
  features/       Espaço para evoluir cada domínio/tela sem acoplar tudo às rotas.
  hooks/          Hooks reutilizáveis, incluindo consultas Hermes.
  lib/            Utilitários técnicos e integração PWA/erros.
  pages/          Reservado para páginas compostas quando a migração avançar.
  routes/         Rotas TanStack Start preservadas para não quebrar o Lovable.
  services/       Camada de dados simulada pronta para troca por API.
  types/          Contratos TypeScript do domínio Hermes.
```

## Dados mockados, API local e fallback

Os dados fictícios ficam em `src/services/mock-hermes-data.ts`. O acesso passa por `src/services/hermes-service.ts`, que expõe um contrato `HermesService`. Se `VITE_HERMES_API_URL` estiver configurado, o serviço chama a API local em `backend/`; se a API falhar, usa o mock como fallback.

## Backend local

O backend mínimo fica em `backend/`, roda com Bun e persiste em SQLite local (`backend/data/hermes.sqlite`, ignorado pelo Git). Endpoints principais:

- `GET /health`
- `GET /api/snapshot`
- `GET /api/status`
- `GET /api/suggestions`
- `GET /api/promotions`
- `GET /api/automations`
- `GET /api/permissions`
- `GET /api/chat`
- `POST /api/chat`
- `GET /api/pc`
- `GET /api/pc/sync`
- `GET /api/action-logs`
- `POST /api/action-logs`
- `GET /api/auth/status`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/unlock`
- `GET /api/dashboard`
- `GET /api/tasks` / `POST /api/tasks` / `PUT /api/tasks/:id` / `DELETE /api/tasks/:id`
- `GET /api/notifications` / `POST /api/notifications/:id/read`
- `GET /api/devices` / `POST /api/devices/pairing-code` / `POST /api/devices/claim` / `DELETE /api/devices/:id`
- `WS /ws`

## PWA/Android

O projeto inclui `public/manifest.webmanifest`, `public/sw.js` e ícones temporários SVG em `public/icons`. Essa base permite instalar como PWA e prepara o caminho para empacotamento Android com Capacitor/TWA futuramente.

## Próximas etapas

1. Adicionar autenticação e pareamento de dispositivos na API local.
2. Criar migrations versionadas para SQLite.
3. Adicionar testes unitários e E2E.
4. Definir contrato seguro Hermes Mobile ↔ Hermes PC.
5. Empacotar Android com Capacitor ou Trusted Web Activity.
6. Implementar armazenamento local criptografado para sessões, permissões e logs.
