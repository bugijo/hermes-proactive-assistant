# Segurança — Hermes Mobile

## Princípios

- Nenhuma ação sensível sem confirmação explícita.
- Menor privilégio para permissões Android.
- Logs auditáveis para ações importantes.
- Separação entre UI, serviço e futura API.

## Dados sensíveis

Não armazenar tokens, chaves, histórico de mensagens ou dados de pareamento em texto puro. Em Android, preferir KeyStore/armazenamento seguro via camada nativa.

## Integração com Hermes PC

- Pareamento com prova de posse, preferencialmente QR code.
- Comunicação TLS quando possível.
- Rotação/revogação de tokens por dispositivo.
- Lista de permissões por módulo do PC.
- Confirmação obrigatória para envio de mensagens, compras, exclusão de arquivos e comandos remotos destrutivos.

## PWA

O service worker atual é mínimo e cacheia apenas o shell. Antes de produção, revisar estratégia de cache para não expor dados privados offline.
