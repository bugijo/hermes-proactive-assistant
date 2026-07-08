INSERT OR IGNORE INTO security_settings (id, title, description, enabled, confirmation_status)
VALUES
  ('sec1', 'Confirmar antes de enviar mensagens', 'Nada será enviado sem confirmação explícita.', 1, 'confirmed'),
  ('sec2', 'Confirmar antes de compras', 'Compras permanecem indisponíveis nesta fase.', 1, 'confirmed'),
  ('sec3', 'Nunca apagar arquivos automaticamente', 'Exclusão de arquivos permanece indisponível.', 1, 'confirmed'),
  ('sec6', 'Registrar ações em log', 'Eventos operacionais são gerados somente pelo servidor.', 1, 'confirmed');
