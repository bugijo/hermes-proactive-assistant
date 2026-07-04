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

```bash
bun install
bun run dev
```

A aplicação abre via Vite/TanStack Start. Em ambientes Lovable, a configuração de Vite já injeta plugins necessários.

## Como validar e buildar

```bash
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

## Dados mockados e futura API

Os dados fictícios ficam em `src/services/mock-hermes-data.ts`. O acesso passa por `src/services/hermes-service.ts`, que expõe um contrato `HermesService`. Para conectar uma API real, implemente o mesmo contrato e troque a exportação `hermesService`.

## PWA/Android

O projeto inclui `public/manifest.webmanifest`, `public/sw.js` e ícones temporários SVG em `public/icons`. Essa base permite instalar como PWA e prepara o caminho para empacotamento Android com Capacitor/TWA futuramente.

## Próximas etapas

1. Trocar `mockHermesService` por cliente HTTP com autenticação.
2. Adicionar testes unitários e E2E.
3. Definir contrato seguro Hermes Mobile ↔ Hermes PC.
4. Empacotar Android com Capacitor ou Trusted Web Activity.
5. Implementar armazenamento local criptografado para sessões, permissões e logs.
