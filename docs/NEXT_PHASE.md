# Próxima fase

A Fase 4 entrega o contêiner Android, ponte nativa leve e protocolo preparatório. Os próximos passos devem avançar nesta ordem:

1. **Hermes PC real** — substituir chave mock por X25519/Ed25519, prova de posse, TLS e canal autenticado sem comandos genéricos.
2. **Agendamento Android de baixo consumo** — WorkManager com restrições de Wi-Fi/bateria, sem serviço permanente.
3. **Permissões Android por capacidade** — consentimento de menor privilégio e revogação visível.
4. **Assinatura/release** — keystore fora do Git, CI protegida, revisão de backup e Network Security Config.
5. **Conectores confirmados** — Telegram, navegador e futuro WhatsApp apenas por ações tipadas, rascunho e confirmação explícita.

Continuam fora de escopo até essa infraestrutura existir: compras automáticas, exclusão de arquivos, controle de tela, envio autônomo de mensagens e execução irreversível em segundo plano.
