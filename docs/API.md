# API local — Hermes Mobile

A API local é a Fase 2 do Hermes Mobile. Ela roda com Bun, usa SQLite local e expõe endpoints REST para substituir os mocks progressivamente.

## Rodando

```bash
bun backend/src/server.ts
```

Por padrão a API sobe em `http://localhost:8787`. Para o frontend usar a API:

```bash
VITE_HERMES_API_URL=http://localhost:8787 bun run dev
```

## Banco de dados

O SQLite fica em `backend/data/hermes.sqlite` e é ignorado pelo Git. O schema inicial cria:

- `suggestions`
- `promotions`
- `automations`
- `permissions`
- `chat_messages`
- `devices`
- `action_logs`
- `app_state` para status e configurações globais simples

## Endpoints

| Método | Rota               | Descrição                                                   |
| ------ | ------------------ | ----------------------------------------------------------- |
| `GET`  | `/health`          | Health check.                                               |
| `GET`  | `/api/snapshot`    | Snapshot usado pelo dashboard.                              |
| `GET`  | `/api/status`      | Status atual do Hermes.                                     |
| `GET`  | `/api/suggestions` | Sugestões persistidas.                                      |
| `GET`  | `/api/promotions`  | Promoções e categorias.                                     |
| `GET`  | `/api/automations` | Automações configuradas.                                    |
| `GET`  | `/api/permissions` | Permissões do dispositivo.                                  |
| `GET`  | `/api/chat`        | Histórico do chat.                                          |
| `POST` | `/api/chat`        | Persiste mensagem do usuário e resposta simulada do Hermes. |
| `GET`  | `/api/pc`          | Estado do Hermes PC local.                                  |
| `GET`  | `/api/pc/sync`     | Simula sync e registra log.                                 |
| `GET`  | `/api/action-logs` | Últimos logs de ação.                                       |
| `POST` | `/api/action-logs` | Cria log de ação sensível ou operacional.                   |

## Segurança atual

A API é local e simples. A regra de produto continua: enviar mensagens, comprar, apagar arquivos e comandos remotos destrutivos devem exigir confirmação explícita antes de execução real.

## Fase 3 adicionada

### Autenticação local

- `GET /api/auth/status`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/unlock`

A API emite JWT local e guarda sessões em SQLite. Biometria permanece como capacidade planejada para Android nativo.

### Pareamento Hermes PC

- `GET /api/devices`
- `POST /api/devices/pairing-code`
- `POST /api/devices/claim`
- `DELETE /api/devices/:id`

O QR Code ainda é representado por um payload textual (`qrPayload`) para ser transformado em imagem na camada PC/app quando o leitor/câmera for integrado.

### Tarefas e notificações

- `GET /api/dashboard`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET /api/notifications`
- `POST /api/notifications/:id/read`

### Tempo real

- `WS /ws`

O WebSocket envia eventos de conexão, chat e sincronização para clientes conectados.
