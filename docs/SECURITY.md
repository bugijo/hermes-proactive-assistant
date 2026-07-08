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
- No APK, a sessão é cifrada com AES-GCM e chave não exportável do Android Keystore; backup do armazenamento está desativado.
- Preferências não secretas usam Capacitor Preferences e nunca recebem senha/token.
- `.env`, bancos locais e derivados são ignorados pelo Git.

Esta é segurança local de desenvolvimento, não um modelo pronto para exposição na internet. Não publique a porta da API em rede pública.

O bind padrão é `127.0.0.1`. Definir `HERMES_BIND_HOST=0.0.0.0` expõe a API HTTP à LAN e só deve
ser feito conscientemente em rede confiável; CORS não substitui TLS, firewall ou autenticação.
Login, bootstrap e pareamento usam rate limiting em memória para reduzir força bruta e abuso local.

## Integração com Hermes PC

- Pareamento com prova de posse, preferencialmente QR code.
- Comunicação TLS quando possível.
- Rotação/revogação de tokens por dispositivo.
- Lista de permissões por módulo do PC.
- Confirmação obrigatória para envio de mensagens, compras, exclusão de arquivos e comandos remotos destrutivos.
- Token de pareamento tem uso único, hash no SQLite e expiração máxima de cinco minutos.
- Claim cria estado `pending_approval`; aprovação manual é separada.
- IP local é apenas metadado de rede, jamais identidade.

O protocolo preparatório está em [PAIRING_PROTOCOL.md](PAIRING_PROTOCOL.md).

## Ponte nativa

- Abrir app exige confirmação visual e confirmação também no endpoint de auditoria.
- Compartilhar e abrir link só ocorrem por gesto explícito na tela.
- A API não possui endpoint de comando remoto.
- Mensagens, compras, arquivos e controle de tela são bloqueados com `ACTION_NOT_AVAILABLE`.
- O build release não permite conteúdo HTTP misto; HTTP local é liberado somente no manifest debug.

## PWA

O service worker atual é mínimo e cacheia apenas o shell. Antes de produção, revisar estratégia de cache para não expor dados privados offline.

## Logs de ação

A API local registra ações operacionais e sensíveis em `action_logs`. A existência de log não autoriza execução automática: ações destrutivas ou externas continuam exigindo confirmação explícita.

Os estados auditáveis são `draft`, `pending_confirmation` e `confirmed`. Mesmo `confirmed` representa apenas a decisão local nesta fase: não existe conector capaz de comprar, enviar mensagens, apagar arquivos ou controlar a tela.

O cliente não pode criar eventos forenses arbitrários. O endpoint de escrita aceita apenas notas
informativas validadas, marcadas como `client.note.created`; eventos de segurança e operação são
gerados internamente pela API.

## Políticas e preferências

Bloqueios de mensagens, compras, exclusão de arquivos, controle de tela e comandos remotos são
políticas obrigatórias e fail-closed. A tela de segurança as apresenta como somente leitura.
Controles que ainda não governam enforcement real aparecem como “Em preparação” e não podem ser
ativados. “Pausar Hermes” também permanece desabilitado até possuir persistência e efeito verificável.
