# Hermes Mobile

Hermes Mobile é um app mobile-first/PWA com frontend React preservado do Lovable, API local Bun + SQLite e projeto Android Capacitor. A Fase 4 mantém o navegador funcionando e adiciona uma ponte nativa leve, notificações, preferências e pareamento preparatório.

## O que funciona nesta fase

- Primeiro usuário local, senha Argon2id e sessões revogáveis com expiração.
- Migrações SQLite numeradas e seed apenas para desenvolvimento.
- Dados reais para sugestões, promoções monitoradas, automações, permissões, segurança e chat.
- Logs auditáveis para alterações importantes.
- Login no frontend, operações persistidas e confirmações visuais para ações sensíveis.
- Fallback mock quando a API não estiver configurada ou estiver offline, com aviso `Modo offline/demo`.
- Capacitor 8 com projeto Android, plugins oficiais e sessão criptografada pelo Android Keystore.
- Bateria, rede, dispositivo, links, compartilhamento e notificações com fallback web.
- Preferências de bateria/dados móveis, horários silenciosos e frequência de sincronização.
- Tokens de pareamento temporários, QR, aprovação manual e revogação de computadores.

WhatsApp, Telegram, compras, exclusão de arquivos, controle de tela, permissões Android e automações reais **não são executados**. Pedidos desse tipo permanecem como rascunho ou pendentes de confirmação.

## Requisitos

- [Bun](https://bun.sh/) 1.3 ou superior.
- Linux, macOS ou Windows/WSL. Para Linux Mint, veja [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md).

## Rodar frontend e backend

```bash
cp .env.example .env
bun install --frozen-lockfile
bun run dev:all
```

Abra o endereço mostrado pelo Vite (normalmente `http://localhost:8080`). No primeiro acesso, crie o usuário local; nos próximos, faça login. O backend usa `http://localhost:8787` e grava o banco ignorado pelo Git em `backend/data/hermes.sqlite`.

Para rodar separadamente:

```bash
bun run backend:dev
VITE_HERMES_API_URL=http://localhost:8787 bun run dev
```

Sem `VITE_HERMES_API_URL`, o frontend inicia diretamente em modo demo. Se a API cair, leituras usam os mocks; mutações externas permanecem bloqueadas.

## Validar

```bash
bun run lint
bun run build
bun run backend:test
bun run phase4:test
bun run cap:sync
```

## Android

```bash
bun run cap:web       # shell estático para o APK
bun run cap:sync      # build + sincronização Android
bun run cap:open      # Android Studio
bun run android:debug # APK debug
```

Consulte [docs/ANDROID_SETUP.md](docs/ANDROID_SETUP.md) e [docs/PAIRING_PROTOCOL.md](docs/PAIRING_PROTOCOL.md).

## Variáveis de ambiente

Consulte [.env.example](.env.example). Não versione `.env`, bancos locais, tokens ou senhas.

| Variável                | Uso                                          |
| ----------------------- | -------------------------------------------- |
| `VITE_HERMES_API_URL`   | URL da API usada pelo frontend.              |
| `HERMES_API_PORT`       | Porta da API, padrão `8787`.                 |
| `HERMES_ALLOWED_ORIGIN` | Origem CORS permitida, padrão local.         |
| `HERMES_DB_PATH`        | Caminho do SQLite.                           |
| `HERMES_SESSION_HOURS`  | Duração da sessão local.                     |
| `HERMES_SEED`           | `true` para dados demo em desenvolvimento.   |
| `NODE_ENV`              | Em `production`, o seed é sempre desativado. |

## Estrutura

```text
backend/
  migrations/    Migrações SQL versionadas.
  src/            API, autenticação, serviços e repositórios.
  tests/          Testes Bun isolados em banco temporário.
src/
  components/     Shell Lovable, login e confirmação.
  hooks/          Consultas TanStack Query.
  routes/         Telas preservadas.
  services/       API real com fallback mock.
  services/native/ Notificações, preferências e guardas de ações.
  services/platform/ Adapters Capacitor/web.
  types/          Contratos do frontend.
```

Mais detalhes: [API](docs/API.md), [arquitetura](docs/ARCHITECTURE.md), [segurança](docs/SECURITY.md), [Android](docs/ANDROID_SETUP.md) e [próxima fase](docs/NEXT_PHASE.md).
