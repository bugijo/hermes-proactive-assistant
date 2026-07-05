# Segurança — Hermes Mobile

## Princípios

- Nenhuma ação sensível sem confirmação explícita.
- Menor privilégio para permissões Android.
- Logs auditáveis para ações importantes.
- Separação entre UI, serviço e futura API.

## Dados sensíveis

Não armazenar tokens, chaves, histórico de mensagens ou dados de pareamento em texto puro. Em Android, preferir KeyStore/armazenamento seguro via camada nativa.

## Autenticação local atual

- Senhas usam Argon2id pelo `Bun.password`; senha em texto puro nunca é persistida.
- O cadastro público funciona apenas enquanto não existir usuário.
- Tokens de sessão são opacos, expiram e ficam no SQLite somente como SHA-256.
- Logout revoga a sessão; rotas `/api/*`, exceto status/bootstrap/login, exigem bearer token.
- O frontend mantém o token em `sessionStorage`, não em arquivos ou código-fonte.
- `.env`, bancos locais e derivados são ignorados pelo Git.

Esta é segurança local de desenvolvimento, não um modelo pronto para exposição na internet. Não publique a porta da API em rede pública.

## Integração com Hermes PC

- Pareamento com prova de posse, preferencialmente QR code.
- Comunicação TLS quando possível.
- Rotação/revogação de tokens por dispositivo.
- Lista de permissões por módulo do PC.
- Confirmação obrigatória para envio de mensagens, compras, exclusão de arquivos e comandos remotos destrutivos.

## PWA

O service worker atual é mínimo e cacheia apenas o shell. Antes de produção, revisar estratégia de cache para não expor dados privados offline.

## Logs de ação

A API local registra ações operacionais e sensíveis em `action_logs`. A existência de log não autoriza execução automática: ações destrutivas ou externas continuam exigindo confirmação explícita.

Os estados auditáveis são `draft`, `pending_confirmation` e `confirmed`. Mesmo `confirmed` representa apenas a decisão local nesta fase: não existe conector capaz de comprar, enviar mensagens, apagar arquivos ou controlar a tela.
