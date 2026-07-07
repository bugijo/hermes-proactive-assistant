# Protocolo preparatório Hermes Mobile ↔ Hermes PC

## Escopo

Esta fase prepara identidade, aprovação e revogação. Não existe canal de comandos remotos e nenhum endpoint envia mensagens, compra, apaga arquivos ou controla tela.

## Fluxo v1

1. Usuário autenticado toca em **Adicionar Hermes PC**.
2. Mobile solicita `POST /api/pairing-tokens`.
3. Backend cria identificador, código curto, token aleatório de uso único, chave pública temporária mockada e expiração máxima de cinco minutos.
4. SQLite recebe somente SHA-256 do token. O token em texto puro é devolvido uma única vez e entra no QR junto de `pairingId`, código, versão, chave pública temporária e expiração.
5. Futuro Hermes PC lê o QR e chama `POST /api/pairing/claim` com código, token, nome e chave pública própria.
6. Backend valida hash, expiração e uso único; cria o computador como `pending_approval`.
7. Usuário aprova manualmente pelo Mobile. Só então o estado passa a autorizado/offline.
8. Revogação apaga a credencial associada, marca o computador como revogado e registra auditoria.

## Estados

- `waiting`: token temporário aguardando claim.
- `pending_approval`: identidade apresentada, ainda sem confiança.
- `offline`: aprovada, mas sem canal ativo.
- `connected`: reservado para futuro canal autenticado.
- `revoked`: confiança removida.

## Regras de segurança

- IP local nunca prova identidade.
- Token tem alta entropia, uso único, hash no banco e validade máxima de cinco minutos.
- Código curto sozinho não é suficiente.
- Claim inválido/expirado, aprovação e revogação geram `action_logs`.
- QR deve ser tratado como segredo temporário; não registrar seu conteúdo em logs ou analytics.
- Chave pública é mock nesta fase. A próxima implementação deve usar X25519/Ed25519 reais, prova de posse, derivação de chave de sessão e TLS autenticado.
- Aprovação não concede comandos. Permissões futuras serão separadas por capacidade e toda ação sensível continuará exigindo confirmação.

## Payload QR atual

```json
{
  "version": 1,
  "type": "hermes-pc-pairing",
  "pairingId": "pairing-uuid",
  "code": "A1B2C3D4",
  "token": "pair_...",
  "ephemeralPublicKey": "mock-ed25519:...",
  "expiresAt": "2026-07-06T10:00:00.000Z"
}
```

O formato é versionado para permitir substituição da chave mock sem aceitar clientes antigos de forma silenciosa.
