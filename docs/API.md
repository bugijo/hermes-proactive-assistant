# API local — Hermes Mobile

Base padrão: `http://localhost:8787`.

## Respostas

Sucesso:

```json
{ "data": { "ok": true } }
```

Erro:

```json
{ "error": { "code": "UNAUTHORIZED", "message": "Sessão ausente, inválida ou expirada." } }
```

Rotas privadas exigem `Authorization: Bearer <token>`. Tokens expiram, são armazenados no banco somente como SHA-256 e podem ser revogados no logout.

## Autenticação

| Método | Rota                 | Acesso           | Descrição                                                  |
| ------ | -------------------- | ---------------- | ---------------------------------------------------------- |
| `GET`  | `/health`            | Público          | Saúde da API.                                              |
| `GET`  | `/api/auth/status`   | Público          | Indica se o primeiro usuário existe.                       |
| `POST` | `/api/auth/register` | Público, uma vez | Cria o primeiro usuário somente se a tabela estiver vazia. |
| `POST` | `/api/auth/login`    | Público          | Cria sessão com expiração.                                 |
| `POST` | `/api/auth/logout`   | Privado          | Revoga a sessão atual.                                     |

Bootstrap:

```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Usuário local","email":"local@example.test","password":"troque-esta-senha"}'
```

Login:

```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"local@example.test","password":"troque-esta-senha"}'
```

Use o campo `data.token` somente em memória/sessão local e nunca o grave no Git.

## Recursos privados

Todos os recursos abaixo aceitam `GET` e as operações CRUD indicadas. `:id` é o identificador retornado pela API.

| Recurso    | Rotas                                                                            |
| ---------- | -------------------------------------------------------------------------------- |
| Snapshot   | `GET /api/snapshot`, `GET /api/status`, `GET /api/dashboard`                     |
| Sugestões  | `GET/POST /api/suggestions`, `PATCH/PUT/DELETE /api/suggestions/:id`             |
| Promoções  | `GET/POST /api/promotions`, `PATCH/PUT/DELETE /api/promotions/:id`               |
| Automações | `GET/POST /api/automations`, `PATCH/PUT/DELETE /api/automations/:id`             |
| Permissões | `GET/POST /api/permissions`, `PATCH/PUT/DELETE /api/permissions/:id`             |
| Segurança  | `GET/POST /api/security-settings`, `PATCH/PUT/DELETE /api/security-settings/:id` |
| Chat       | `GET/POST /api/chat`, `PATCH/PUT/DELETE /api/chat/:id`                           |
| Auditoria  | `GET/POST /api/action-logs`                                                      |

Compatibilidade preservada: `/api/tasks`, `/api/notifications`, `/api/devices`, `/api/pc` e seus subendpoints existentes continuam disponíveis e autenticados. O pareamento atual é apenas um protótipo local; o pareamento criptográfico completo pertence à próxima fase.

Exemplo de alteração confirmada de sugestão:

```bash
curl -X PATCH http://localhost:8787/api/suggestions/SUGGESTION_ID \
  -H "Authorization: Bearer $HERMES_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"state":"approved","confirmationStatus":"confirmed"}'
```

Valores de `confirmationStatus`:

- `draft`: salvo, não autorizado para execução.
- `pending_confirmation`: aguarda confirmação explícita.
- `confirmed`: usuário confirmou o registro; ainda não implica execução externa nesta fase.

## WebSocket

`/ws` exige bearer token no handshake. Não há cliente WebSocket ativo no frontend nesta fase; o canal permanece compatível para evolução futura.
