# Auditoria QA — Hermes Mobile

- **Data:** 2026-07-07 (America/Sao_Paulo)
- **Ambiente:** Linux Mint 22.3 x86_64; Bun 1.3.14; Google Chrome 150; OpenJDK 21.0.11; sem Android SDK/ADB configurado.
- **Branch e hash atual:** `main`, `48ff3460a33bdd669865cb3cb5e7bbe4a4b6c580`, sincronizada com `origin/main` no início da auditoria.
- **Modo:** auditoria somente. Nenhum código, migration, lockfile ou configuração foi alterado.
- **Comandos executados:** inventário com `git ls-files`, leitura de fontes/configurações/docs, buscas com `rg`, `bun test --coverage --coverage-reporter=text backend/tests src/services`, `bun run lint`, `bun run build`, `bun run cap:web`, `bunx cap sync android`, Chrome headless em 360×800, 393×852 e 1365×768, `curl` contra API isolada em `127.0.0.1:8898`, inspeção SQLite somente leitura e checagens de portas/Git.
- **Limitações do ambiente:** APK/emulador/dispositivo, permissões Android, Keystore em aparelho, instalação PWA, prompts reais de notificação/compartilhamento e comportamento offline após instalação não foram validados. Não há Android SDK, `adb`, `ANDROID_HOME` ou `ANDROID_SDK_ROOT`. Integrações externas e auditoria online de dependências não foram executadas por restrição. A UI autenticada foi auditada por código/testes e a UI completa foi renderizada em modo demo isolado, preservando o banco do usuário.

## 1. Resumo executivo

**Nota atual: 5,2/10.** O Hermes Mobile é uma **base de MVP funcional local**, não apenas um protótipo visual, mas ainda não é um produto pronto para uso real ou produção.

Funciona de verdade: primeiro usuário, login/logout, Argon2id, sessões opacas revogáveis, migrations SQLite, persistência CRUD de vários domínios, action logs, bloqueio de ações externas perigosas, preferências, geração de token/QR de pareamento preparatório, build web, shell Capacitor e armazenamento Android cifrado em código. A suíte atual terminou com **17 testes aprovados e 0 falhas**.

É mock ou preparatório: telemetria CPU/RAM/disco/GPU; PC conectado, IP, módulos e tarefas sem cliente real; monitoramento de promoções; automações; permissões Android; inteligência do chat; voz; sincronização; leitura de QR; conectores externos. O backend persiste estados, mas não executa essas capacidades.

Está quebrado ou enganoso: chat retorna 500 em banco limpo com seed desativado; validação insuficiente aceita valores inválidos ou produz 500; controles visíveis não têm ação; a UI pode anunciar sucesso antes de a API confirmar; modo demo mostra dados fictícios com linguagem de estado real; PWA não cacheia os bundles necessários; API escuta todas as interfaces sem TLS nem rate limiting.

**Contagem de achados:** Crítico 0 · Alto 8 · Médio 12 · Baixo 5 · Melhoria 3 — **28 no total**.

## 2. Mapa de arquitetura atual

```text
React/TanStack routes
  ├─ AuthGate + TanStack Query
  ├─ HermesService
  │   ├─ REST http://localhost:8787 (quando configurada)
  │   └─ mock-hermes-data (fallback/demo)
  └─ PlatformService
      ├─ Web: sessionStorage/localStorage/Notification/Web Share
      └─ Android: Capacitor plugins + AES-GCM/Android Keystore

Bun.serve REST + WebSocket
  ├─ routes/http-routes.ts
  ├─ auth/device services
  ├─ repositories com queries parametrizadas
  └─ SQLite WAL + migrations + seed de desenvolvimento
```

Entradas: `src/start.ts`/`src/router.tsx` no frontend, `backend/src/server.ts` na API e `scripts/dev-all.ts` no desenvolvimento. Rotas visuais: `/`, `/suggestions`, `/promotions`, `/automations`, `/chat`, `/device`, `/pc`, `/security`, `/settings`, `/native`. O banco possui 19 tabelas, incluindo usuários, sessões, domínios, dispositivos, pairing, preferências, notificações e auditoria. As migrations `001`, `002` e `003` estão aplicadas no banco local inspecionado.

O canal `/ws` existe apenas no servidor. Não há cliente WebSocket, orquestrador de IA, provedor LLM, memória semântica, fila de workers, streaming, STT, TTS, cancelamento ou interrupção.

## 3. Matriz funcional por tela

| Tela | Elemento | Funciona? | Backend? | Persistência? | Mock? | Problema | Prioridade |
|---|---|---:|---:|---:|---:|---|---|
| Global | Menu inferior e links | Sim | Não | Não aplicável | Não | Navegação correta | — |
| Global | Ícone de configurações | Parcial | Não | Não | Não | Selo offline sobrepõe a área no mobile | P3 |
| Auth | Primeiro usuário/login/logout | Sim | Sim | SQLite/sessão | Não | Faltam rate limit e testes de concorrência | P0 |
| Início | Status, bateria e pendências | Visual | Sim | Parcial | Sim | Valores sem fonte real | P1 |
| Início | “Falar com Hermes” | Parcial | Não | Não | Sim | Abre chat textual; não há voz | P1 |
| Início | “Status real do sistema” | Não como anunciado | Sim | Não | Sim | CPU/RAM/disco/GPU são constantes | P1 |
| Sugestões | Aprovar/ignorar/depois | Sim online | Sim | SQLite + log | Fallback | Otimista e sem erro/loading | P0 |
| Sugestões | Detalhes | Não | Não | Não | Decorativo | Botão sem handler | P1 |
| Promoções | Adicionar/remover | Sim online | Sim | SQLite + log | Fallback | Sem estado de erro/loading | P0 |
| Promoções | Abrir link/monitoramento | Não útil | Não | Não | Sim | Seeds usam `#`; não existe coletor | P1 |
| Automações | Switch | Parcial | Sim | Apenas flag | Sim | Nenhuma automação executa | P1 |
| Chat | Enviar/quick actions | Parcial | Sim | SQLite em dev | Sim | Resposta fixa; 500 sem seed | P0 |
| Hermes PC | Adicionar PC/gerar QR | Parcial | Sim | Token hash SQLite | Preparatório | Chave mock, sem cliente/prova de posse | P2 |
| Hermes PC | Aprovar/revogar | Sim após claim | Sim | SQLite + log | Preparatório | Sem credencial/canal real | P2 |
| Hermes PC | Escanear QR | Não | Não | Não | Sim | Texto preparatório, sem câmera | P2 |
| Hermes PC | Sincronizar agora | Não | Não | Não | Decorativo | Botão sem handler | P2 |
| Hermes PC | Módulos/tarefas/status | Não | Snapshot | Seed/mock | Sim | Cards não interativos e dados fictícios | P2 |
| Controle | Permissões | Parcial | Sim | Preferência SQLite | Sim | Não concede/revoga permissão Android | P3 |
| Segurança | Regras | Parcial | Sim | SQLite + log | Parcial | Não alimentam o enforcement real | P0 |
| Segurança | Pausar Hermes | Não | Não | Não | Visual | Apenas muda estado React local | P1 |
| Native | Preferências | Sim | Sim + local | SQLite/localStorage | Não | Sem validação de enum/horário | P0 |
| Native | Testar aviso/compartilhar | Parcial | Log + plataforma | Parcial | Fallback web | Sem feedback de sucesso/negação | P3 |
| Native | Abrir configurações Android | APK apenas | Sim + Capacitor | Log | Não | No navegador falha silenciosamente | P3 |
| Settings | Links e logout | Sim | Logout | Sessão revogada | Não | Sem confirmação/feedback de falha | P3 |
| PWA | Instalar/offline | NÃO VALIDADO | Não | Cache | Não | Service worker não cacheia JS/CSS | P3 |

Em 360×800 e 393×852, as telas principais renderizaram sem corte horizontal geral; o chat exibiu scrollbar horizontal visível nas quick actions. Em desktop, o app permanece intencionalmente limitado a uma coluna mobile. Teclado/foco completo e leitores de tela: **NÃO VALIDADO — ausência de automação de acessibilidade/browser interativo**.

## 4. Problemas encontrados

### Alto

#### QA-001 — Dados simulados apresentados como estado real
- **Onde:** dashboard, `/pc`, `task-repository.ts`, `mock-hermes-data.ts`.
- **Reproduzir:** abrir em demo; observar “Status real do sistema”, PC conectado, IP, módulos e tarefas.
- **Esperado/atual:** dados reais ou rótulo explícito de demonstração; hoje constantes e seeds parecem telemetria viva.
- **Evidência:** CPU 18, RAM 42, disco 67 e GPU 24 são hardcoded; screenshot textual mostrou PC `192.168.0.14` conectado mesmo em “Modo offline/demo”.
- **Causa/risco:** preservação visual do protótipo; induz decisões com informação fictícia.
- **Recomendação/dependências:** substituir por “Demonstração” por componente e estado desconhecido; exige fontes reais antes de usar “real/conectado”.

#### QA-002 — Chat falha em banco limpo sem seed
- **Onde:** `domain-repository.ts:addChatMessage`, migration `001`, `POST /api/chat`.
- **Reproduzir:** iniciar API com banco novo, `HERMES_SEED=false`, cadastrar usuário e postar chat.
- **Esperado/atual:** 201 com mensagem; atual 500 `INTERNAL_ERROR`, log interno `SQLITE_CONSTRAINT_FOREIGNKEY`.
- **Causa/risco:** sessão `default` só é criada por `seedDevelopment`; produção sempre desativa seed. Chat fica inutilizável no cenário mais importante.
- **Recomendação/dependências:** criar sessão padrão por migration/regra transacional ou criar sessão sob demanda; adicionar teste sem seed.

#### QA-003 — Validação de entrada inconsistente
- **Onde:** repositories e `http-routes.ts` em permissões, promoções, automações e preferências.
- **Reproduzir:** `POST /permissions {}` → 500; automação com `enabled:"false"` → `true`; promoção aceita preço `"não-numérico"` e status `"inventado"`; preferências aceitam `syncFrequency:"nunca"` e `quietStart:"banana"`.
- **Esperado/atual:** 400 estruturado e nenhuma gravação; atual aceita tipos/enum inválidos ou vaza para constraint 500.
- **Causa/risco:** casts TypeScript sem validação runtime; corrupção semântica, falhas inesperadas e UI inconsistente.
- **Recomendação/dependências:** schemas Zod por rota, limites de tamanho, enum/URL/número/horário e transações; testes negativos por endpoint.

#### QA-004 — API exposta na LAN por HTTP
- **Onde:** `backend/src/server.ts`, execução Bun.
- **Reproduzir:** `ss -ltnp` mostrou `*:8787`; URL usa `http://`.
- **Esperado/atual:** bind em loopback para modo local ou TLS/autenticação de transporte; atual aceita conexões em todas as interfaces.
- **Causa/risco:** `Bun.serve` sem `hostname`; amplia superfície para dispositivos da rede e expõe bearer token se usado remotamente.
- **Recomendação/dependências:** padrão `127.0.0.1`, configuração explícita para LAN, TLS e firewall; pareamento real antes de acesso remoto.

#### QA-005 — Ausência de rate limiting e proteção de abuso
- **Onde:** login, cadastro, pairing claim/token e API geral.
- **Reproduzir:** 12 logins inválidos consecutivos retornaram 401; nenhum 429 ou cabeçalho de limite.
- **Esperado/atual:** limite por IP/identidade, backoff e auditoria; atual Argon2 é invocado sem contenção.
- **Causa/risco:** não há limiter; força bruta e exaustão de CPU/SQLite, além de flood de pairing/logs.
- **Recomendação/dependências:** limiter local persistente/memória com limites menores em auth/pairing; testes determinísticos.

#### QA-006 — UI confirma mudanças antes da API e falhas podem ser silenciosas
- **Onde:** sugestões, automações, permissões, segurança, preferências e ações nativas.
- **Reproduzir:** interromper API e alternar controles; estado React muda imediatamente e promises são descartadas/fallback retorna mock.
- **Esperado/atual:** loading, confirmação após resposta, rollback e erro; atual mostra sucesso local sem garantia de SQLite.
- **Causa/risco:** `void hermesService...`, updates otimistas sem callbacks e fallback de mutação; usuário acredita que regra sensível foi aplicada.
- **Recomendação/dependências:** mutations do TanStack Query, rollback, toast/erro e distinção “não sincronizado”.

#### QA-007 — Pareamento não estabelece identidade criptográfica nem canal
- **Onde:** `device-service.ts`, `/pc`, protocolo v1.
- **Reproduzir:** gerar QR; `publicKey` começa com `mock-ed25519`, e qualquer string é aceita como chave do PC.
- **Esperado/atual:** X25519/Ed25519, prova de posse, derivação de sessão e TLS; atual apenas token de alta entropia + aprovação de registro.
- **Causa/risco:** fase preparatória; não suporta confiar num Hermes PC real nem transportar tarefas com segurança.
- **Recomendação/dependências:** cliente desktop, identidade persistente, desafio assinado, canal autenticado, rotação/revogação por capacidade.

#### QA-008 — Controles de segurança não governam a política real
- **Onde:** `/security`, `security_settings`, guardas de ações nativas.
- **Reproduzir:** desligar regra “confirmar” ou “registrar ações”; backend continua com guardas hardcoded; “Pausar Hermes” só troca boolean local.
- **Esperado/atual:** política central coerente ou controles somente leitura; atual UI afirma aplicação global sem ligação ao enforcement.
- **Causa/risco:** configurações são domínio visual separado; falsa sensação de controle, embora os bloqueios hardcoded preservem segurança nesta fase.
- **Recomendação/dependências:** definir políticas não desativáveis versus preferências, enforcement central e estado de pausa persistente/fail-closed.

### Médio

#### QA-009 — Chat não possui inteligência, memória gerenciada ou voz
- **Onde:** `/chat`, `POST /api/chat`, CTA “Falar com Hermes”.
- **Reproduzir:** enviar qualquer pergunta; quando o seed existe, resposta é sempre “Recebi... rascunho local”.
- **Esperado/atual:** rotular como caixa de rascunho ou integrar agente; atual promete conversa e sugere voz sem LLM/STT/TTS.
- **Evidência/causa/risco:** resposta literal no código; expectativa enganosa.
- **Recomendação/dependências:** primeiro corrigir chat/persistência e segurança; depois interface `AgentProvider`, memória e streaming; voz somente em P5.

#### QA-010 — WebSocket não está pronto para cliente browser nem isolamento futuro
- **Onde:** `/ws` em `server.ts`.
- **Reproduzir:** handshake sem bearer retorna 401; API WebSocket padrão do navegador não permite header `Authorization` customizado; não há cliente.
- **Esperado/atual:** autenticação compatível e tópicos isolados; atual mantém `Set` global e publica eventos a todos os sockets autenticados.
- **Causa/risco:** scaffold futuro; bloqueia streaming e pode cruzar eventos se houver múltiplos usuários.
- **Recomendação/dependências:** ticket/subprotocol curto, escopo por usuário/conversa, limites, backpressure, heartbeat e testes.

#### QA-011 — PWA offline incompleta
- **Onde:** `public/sw.js`.
- **Reproduzir:** instalar/cachear shell e retirar rede; SW pré-cacheia HTML/manifest/ícones, não JS/CSS versionados.
- **Esperado/atual:** app shell executável offline; atual depende de cache HTTP incidental para bundles.
- **Evidência/causa/risco:** `APP_SHELL` não contém assets; tela offline pode não hidratar.
- **Recomendação/dependências:** manifest de precache gerado no build, estratégia versionada e testes Playwright offline. Funcionamento offline real: **NÃO VALIDADO**.

#### QA-012 — Controles visíveis sem ação
- **Onde:** “Detalhes” em sugestões; “Sincronizar agora”; scanner QR; módulos PC.
- **Reproduzir:** clicar; detalhes e sync não têm `onClick`; scanner/módulos são cards estáticos.
- **Esperado/atual:** executar, navegar ou estar desabilitado com “em preparação”; atual parece acionável em partes.
- **Risco/recomendação:** frustração e promessa falsa; desabilitar/rotular até existir fluxo, com testes de cada elemento.

#### QA-013 — Promoções não são monitoradas e links são vazios
- **Onde:** seeds, `/promotions`, automação “Monitorar promoções”.
- **Reproduzir:** clicar “Abrir link” nos seeds (`url: "#"`) ou aguardar atualização.
- **Esperado/atual:** URL válida e coletor autorizado; atual retorna ao topo e preços nunca são coletados.
- **Causa/risco:** mock persistido; pode aparentar recomendação comercial real.
- **Recomendação/dependências:** rótulo demo, validação de URL e conector futuro com fonte/data/proveniência.

#### QA-014 — Exclusões e mudanças sensíveis não exigem confirmação na API
- **Onde:** DELETE de sugestões/promoções/automações/permissões/chat/tasks e updates de regra.
- **Reproduzir:** chamar DELETE autenticado diretamente, sem `confirmationStatus`; API executa e audita como confirmado por padrão.
- **Esperado/atual:** confirmação verificável para operação sensível; confirmação hoje é principalmente visual.
- **Causa/risco:** API confia no cliente; cliente comprometido ignora diálogo.
- **Recomendação/dependências:** nonce/intenção de confirmação server-side, classificação por ação e idempotência.

#### QA-015 — Log de auditoria pode ser poluído pelo próprio cliente
- **Onde:** `POST /api/action-logs`.
- **Reproduzir:** usuário autenticado envia `action`, `sensitivity`, detalhes e status arbitrários.
- **Esperado/atual:** eventos de segurança emitidos somente pelo servidor; atual permite registros indistinguíveis na mesma tabela.
- **Risco/recomendação:** reduz valor forense; separar notas do cliente de eventos imutáveis, validar tipos e proteger retenção/integridade.

#### QA-016 — Cobertura de testes não representa caminhos críticos
- **Onde:** suíte Bun.
- **Reproduzir:** cobertura textual mostrou 63,29% das linhas instrumentadas, mas backend em subprocesso não aparece adequadamente; `hermes-service` 26,82%, adapters baixos.
- **Esperado/atual:** unit/integration/E2E para todos os fluxos críticos; faltam produção sem seed, validação negativa, UI, PWA, WebSocket e concorrência.
- **Risco/recomendação:** regressões como QA-002/003 passam com 17/17; ampliar pirâmide e CI.

#### QA-017 — Hydration mismatch no desenvolvimento
- **Onde:** frontend dev com plugin de marcação Lovable.
- **Reproduzir:** Chrome headless em múltiplas rotas; console reportou atributos `data-tsd-source` diferentes entre SSR e cliente.
- **Esperado/atual:** hidratação limpa; React avisa que atributos não serão corrigidos.
- **Causa/risco:** provável instrumentação dev/linhas distintas; ruído mascara erros reais e pode causar divergência.
- **Recomendação/dependências:** reproduzir sem extensões, alinhar plugin SSR/client e adicionar console-clean E2E.

#### QA-018 — Estados loading/error/empty são incompletos
- **Onde:** todas as listas e mutations.
- **Reproduzir:** API lenta, lista vazia ou erro 4xx; telas usam `initialData` mock, listas vazias não explicam estado e mutations não mostram erro.
- **Esperado/atual:** skeleton, vazio, retry e erro contextual; atual pode exibir mock transitório ou área em branco.
- **Risco/recomendação:** confusão e dados stale; modelar estados por query/mutation.

#### QA-019 — API não envia headers defensivos
- **Onde:** `utils/http.ts`.
- **Reproduzir:** inspecionar `/health`; só foram observados Content-Type e CORS, sem CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` ou frame policy.
- **Esperado/atual:** baseline apropriado ao deployment; ausente.
- **Risco/recomendação:** defesa em profundidade fraca se exposta; adicionar headers e TLS/HSTS apenas no contexto HTTPS correto.

#### QA-020 — Dados de domínio não têm escopo de proprietário
- **Onde:** tabelas/repositories de sugestões, promoções, automações, permissões, chat e logs.
- **Reproduzir:** queries não filtram por `user_id`; o produto hoje limita cadastro a um usuário.
- **Esperado/atual:** invariável explicitamente single-user ou ownership; expansão futura para contas/dispositivos causaria BOLA.
- **Risco/recomendação:** alto risco futuro; documentar single-user e migrar ownership antes de multiusuário/sync.

### Baixo

#### QA-021 — Selo offline sobrepõe configurações
- **Onde:** `AuthGate` e `AppHeader` em 360/393 px.
- **Reproduzir:** abrir modo demo no mobile; selo fixo ocupa o canto do botão de engrenagem.
- **Esperado/atual:** ambos clicáveis e legíveis; atual há sobreposição visual/possível interceptação de clique.
- **Recomendação:** integrar status ao header ou usar `pointer-events-none`; testar hit target.

#### QA-022 — Navegador desktop classificado como dados móveis
- **Onde:** `web-adapter.ts:connectionKind`.
- **Reproduzir:** Chrome expõe `effectiveType: 4g`; tela native mostrou “Dados móveis” no desktop.
- **Esperado/atual:** “tipo desconhecido/online” sem Network Information confiável; heurística trata qualquer `*g` como celular.
- **Risco/recomendação:** políticas “somente Wi-Fi” podem ser aplicadas incorretamente; não inferir transporte de `effectiveType`.

#### QA-023 — `pin_hash` recebe cópia do hash da senha
- **Onde:** `auth-repository.ts:createUser`.
- **Reproduzir:** inspecionar insert; `passwordHash` é gravado em `password_hash` e `pin_hash`.
- **Esperado/atual:** `pin_hash` nulo até PIN real; atual duplica material derivado sem função.
- **Risco/recomendação:** confusão de modelo e superfície desnecessária; migrar para null com compatibilidade.

#### QA-024 — Endpoint de sync usa GET e não sincroniza
- **Onde:** `GET /api/pc/sync`.
- **Reproduzir:** chamar endpoint; cria action log e retorna snapshot, sem trabalho real.
- **Esperado/atual:** POST idempotente/202 com job ou endpoint ausente; GET tem efeito colateral.
- **Risco/recomendação:** caches/prefetch podem gerar logs falsos; remover até existir job ou trocar contrato.

#### QA-025 — Qualidade visual/console possui ruídos menores
- **Onde:** chat, lint, mensagens 404/erro.
- **Reproduzir:** viewport 393 mostra scrollbar das quick actions; lint retorna 6 warnings; telas de erro estão em inglês.
- **Esperado/atual:** acabamento consistente pt-BR, foco/scroll discreto e lint limpo.
- **Recomendação:** rodada de acessibilidade/i18n e limpeza dos exports de Fast Refresh.

### Melhoria

#### QA-026 — Bundle principal grande
- **Onde:** build web.
- **Evidência:** chunk `index` 609,06 kB (187,60 kB gzip); Vite alertou acima de 500 kB.
- **Risco/recomendação:** startup pior em aparelhos modestos; medir antes/depois, lazy load e revisar UI kit/imports. Dependência: orçamento de performance.

#### QA-027 — Falta pipeline automatizado e observabilidade de produto
- **Onde:** repositório sem workflow CI visível; API usa `console` e não possui readiness/métricas estruturadas.
- **Esperado/atual:** checks reproduzíveis, logs sanitizados, IDs de correlação e alertas; atual é adequado apenas ao local.
- **Recomendação:** CI para lint/build/test/cap sync, SAST/dependency audit aprovado e logs estruturados sem payload sensível.

#### QA-028 — Instalação PWA e APK não têm teste de aceitação neste PC
- **Onde:** PWA/Android.
- **Evidência:** `cap sync` passou e 7 plugins foram detectados, mas não há SDK/ADB; manifest tem apenas INTERNET e APK não foi montado.
- **Resultado:** **NÃO VALIDADO — ambiente sem Android SDK/emulador/aparelho e sem teste interativo de instalação PWA**.
- **Recomendação:** matriz em dispositivo API 24/atual, release sem cleartext, permissões/notificações, background e instalação/offline PWA.

## 5. Segurança da API e dados

Pontos positivos confirmados: Argon2id com memória/tempo explícitos; token aleatório de 256 bits; somente SHA-256 do token em SQLite; expiração e revogação; erro de login não enumera conta; queries de entrada observadas usam placeholders; foreign keys e WAL ativos; `.env`, SQLite, builds e keystores ignorados; nenhum segredo com padrão conhecido foi encontrado em arquivos rastreados; React escapa texto de domínio; ações `send_message`, `purchase`, `delete_file`, `remote_command` e `control_screen` retornam 403 mesmo confirmadas; `open_app` exige confirmação; Android usa AES-GCM com chave no Keystore e `allowBackup=false`; cleartext está desativado no manifest principal.

Lacunas: QA-003/004/005/008/014/015/019/020. CORS devolve apenas `http://localhost:8080`, inclusive diante de Origin maliciosa, portanto o navegador não libera leitura para outra origem; contudo CORS não substitui bind em loopback, TLS, rate limit ou autorização. Não foi encontrada injeção SQL explorável nas entradas atuais. O `dangerouslySetInnerHTML` do componente genérico de gráficos monta CSS a partir de configuração interna; não há uso com dados do usuário no projeto auditado.

## 6. Qualidade, testes, banco, performance e estabilidade

- `bun test`: 17 pass, 0 fail, 61 expectations.
- `lint`: 0 erros, 6 warnings de Fast Refresh.
- `build`: sucesso; alerta de chunk >500 kB.
- `cap:web`: sucesso; `cap sync android`: sucesso e sem diff rastreado.
- Backend testado isoladamente confirmou auth, sessão revogada, CRUD de sugestão, logs, pairing/expiração, preferências, notificação e bloqueios sensíveis.
- A falha transitória anterior de startup não reapareceu isoladamente; o teste espera só 1,5 s para a API, logo continua suscetível a carga concorrente. Não foi observada falha de lock SQLite; concorrência intensiva: **NÃO VALIDADO — a suíte não contém teste de carga/escrita paralela**.
- Coverage exibida (63,29% de linhas instrumentadas) não cobre corretamente o backend iniciado em subprocesso e não deve ser tratada como cobertura global.
- Migrações e seed funcionam no ambiente local; o acoplamento do seed à sessão de chat causa QA-002.
- Dependências vulneráveis: **NÃO VALIDADO — auditoria online foi evitada pela proibição de testar serviços externos**.

## 7. Estado do chat, IA, Hermes PC e preparo para voz

**Chat/IA:** persistência de mensagens existe em desenvolvimento, mas a resposta é fixa. Não há chamada de modelo, ferramenta, prompt, memória resumida/vetorial, limites de contexto, moderação ou cancelamento. O campo `sessionId` existe, mas não há gestão de sessões na UI e o caminho production-like está quebrado.

**Hermes PC:** token de uso único, hash, TTL de 5 minutos, claim pendente, aprovação e revogação formam uma boa máquina de estados inicial. Faltam identidade real, prova de posse, credencial do dispositivo, canal, heartbeat, sync, autorização por capacidade, protocolo de tarefas e cliente desktop.

**WebSocket:** apenas eco/publicação JSON. Não há cliente, autenticação compatível com WebSocket browser, isolamento, backpressure, resume, ack, cancelamento ou observabilidade.

**Voz:** preparo atual é **baixo**. O ícone de microfone é apenas navegação. Faltam captura de áudio, STT, VAD, filas produtor/consumidor, streaming do agente, TTS, controle temporal de chunks, mute anti-eco, eventos interrompíveis, cancelamento, transcript parcial, seleção de providers e testes de latência/interrupção. A ordem segura é: corrigir P0/P1 → PC seguro → agente textual → streaming/cancelamento → voz.

## 8. Diferença entre “o que a interface promete” e “o que realmente existe”

| Promessa visual | Realidade auditada |
|---|---|
| “Status real do sistema” | Métricas constantes, não telemetria |
| “Falar com Hermes” com microfone | Link para chat textual |
| “Converse com o Hermes” | Resposta fixa; sem IA; pode retornar 500 sem seed |
| PC “Conectado” e IP | Seed/mock; nenhum canal PC |
| “Sincronizar agora” | Sem handler na UI; endpoint separado apenas registra intenção |
| IA local/Projetos/Scripts/Arquivos | Cards decorativos com contagens mock |
| Tarefas enviadas ao PC | Metadata seed, sem envio |
| Escanear QR | Texto preparatório, sem câmera |
| Monitorar promoções | Lista CRUD; sem monitor/coletor |
| Automações em segundo plano | Flags persistidas; sem executor |
| Permissões Android | Preferências, não permissões do SO |
| Regras “aplicadas em toda ação” | Persistidas, mas enforcement hardcoded separado |
| Pausar Hermes | Estado visual não persistido |
| Offline/PWA | Mocks funcionam com app carregado; cache offline completo não existe |

## 9. Backlog para chegar ao Hermes desejado

### P0 — bloqueadores e bugs que impedem uso

1. **Objetivo:** corrigir chat sem seed. **Áreas:** migration/chat repository/routes. **Esforço:** pequeno. **Dependências:** migration compatível. **Pronto:** chat 201 em banco limpo production-like e teste automatizado.
2. **Objetivo:** validar todos os payloads. **Áreas:** rotas/repositories/types. **Esforço:** médio. **Dependências:** schemas compartilhados. **Pronto:** entradas inválidas retornam 400 sem escrita/500.
3. **Objetivo:** tornar mutações honestas e recuperáveis. **Áreas:** hooks/routes/HermesService. **Esforço:** médio. **Dependências:** padrão de mutations. **Pronto:** loading, rollback, retry e erro testados.
4. **Objetivo:** fechar exposição local. **Áreas:** server/config/auth/pairing. **Esforço:** médio. **Dependências:** decisão loopback versus LAN. **Pronto:** loopback default, rate limit e documentação/testes.
5. **Objetivo:** alinhar controles de segurança ao enforcement. **Áreas:** security/native actions/policies. **Esforço:** médio. **Dependências:** modelo de política. **Pronto:** cada controle tem efeito verificável ou é claramente não editável.

### P1 — transformar telas falsas em fluxos reais

1. **Objetivo:** remover alegações de dados reais. **Áreas:** dashboard/mocks/PC. **Esforço:** pequeno. **Dependências:** estados `demo/unknown`. **Pronto:** nenhum mock aparece como real/conectado.
2. **Objetivo:** completar ou desabilitar Detalhes, Sync, módulos, pausa e links. **Áreas:** routes. **Esforço:** médio. **Dependências:** contratos de produto. **Pronto:** todo elemento acionável possui resultado, erro e teste.
3. **Objetivo:** criar estados loading/error/empty e acessibilidade E2E. **Áreas:** todas as telas. **Esforço:** médio. **Dependências:** harness browser. **Pronto:** 360/393/desktop, teclado e axe sem bloqueadores.
4. **Objetivo:** tratar promoções/automações como configuração, não execução. **Áreas:** copy e domínio. **Esforço:** pequeno. **Dependências:** nenhuma. **Pronto:** origem e capacidade real sempre explícitas.

### P2 — Hermes PC real e pareamento seguro

1. **Objetivo:** implementar identidade e prova de posse. **Áreas:** mobile/backend/cliente PC. **Esforço:** grande. **Dependências:** X25519/Ed25519 e threat model. **Pronto:** handshake autenticado, replay negado, rotação/revogação testadas.
2. **Objetivo:** canal TLS/WebSocket por dispositivo e capacidade. **Áreas:** WS/device auth/protocolo. **Esforço:** grande. **Dependências:** identidade. **Pronto:** isolamento, heartbeat, ack, reconnect e logs.
3. **Objetivo:** sync tipado de tarefas/arquivos sem comando genérico. **Áreas:** schemas/jobs/UI. **Esforço:** grande. **Dependências:** canal. **Pronto:** idempotência, confirmação e testes de conflito.
4. **Objetivo:** scanner QR real. **Áreas:** Capacitor/câmera/UI. **Esforço:** médio. **Dependências:** protocolo final. **Pronto:** permissão mínima, validação de payload/versão/expiração.

### P3 — notificações, tarefas, automações seguras

1. **Objetivo:** agendamento Android com WorkManager e restrições. **Áreas:** Android/native service. **Esforço:** grande. **Dependências:** testes em dispositivo. **Pronto:** bateria/rede/silêncio respeitados sem loop permanente.
2. **Objetivo:** UI e lifecycle reais de tarefas. **Áreas:** tasks API/routes/logs. **Esforço:** médio. **Dependências:** P1. **Pronto:** CRUD, estados, persistência e auditoria E2E.
3. **Objetivo:** executor de automações allowlist e confirmável. **Áreas:** scheduler/policy/audit. **Esforço:** grande. **Dependências:** P0 e tarefas. **Pronto:** nenhuma ação externa fora do tipo/escopo; dry-run e kill switch.
4. **Objetivo:** PWA offline segura. **Áreas:** SW/build/cache. **Esforço:** médio. **Dependências:** política de dados. **Pronto:** instalação e offline E2E sem cache de segredo.

### P4 — IA local/remota e memória

1. **Objetivo:** interface de provider textual local/remoto. **Áreas:** agent service/config. **Esforço:** grande. **Dependências:** P0–P2. **Pronto:** provider substituível, timeout, quota, cancelamento e redaction.
2. **Objetivo:** memória de conversa controlada. **Áreas:** sessions/messages/storage. **Esforço:** médio. **Dependências:** chat corrigido. **Pronto:** consentimento, retenção, exclusão e isolamento.
3. **Objetivo:** ferramentas tipadas e confirmação. **Áreas:** agent/tools/policy. **Esforço:** grande. **Dependências:** P3. **Pronto:** modelo nunca chama ação irreversível diretamente; testes adversariais.

### P5 — voz, streaming e integração Android avançada

1. **Objetivo:** pipeline áudio → STT → agente → TTS. **Áreas:** workers/WS/mobile. **Esforço:** grande. **Dependências:** P4 e canal estável. **Pronto:** streaming medido, cleanup e fallback textual.
2. **Objetivo:** interrupção/barge-in segura. **Áreas:** filas/eventos/cancelamento/transcript. **Esforço:** grande. **Dependências:** pipeline. **Pronto:** usuário interrompe geração e áudio; histórico registra somente trecho falado.
3. **Objetivo:** privacidade e operação móvel. **Áreas:** permissões/microfone/logs/background. **Esforço:** grande. **Dependências:** testes em aparelhos. **Pronto:** indicador de captação, consentimento, sem áudio em logs e limites de bateria/dados.

## 10. Plano recomendado de execução

1. **Fase de verdade e estabilidade (P0, 1–2 ciclos):** corrigir chat sem seed, validação runtime, mutações/erros, bind/rate limit e política de segurança. Criar testes que reproduzam todos os achados P0.
2. **Fase de honestidade funcional (P1):** remover dados fictícios apresentados como reais, desabilitar controles vazios e completar estados de UI/acessibilidade.
3. **Fase desktop segura (P2):** threat model, identidade, prova de posse e canal tipado. Não transportar comandos genéricos.
4. **Fase operacional (P3):** tarefas, notificações e automações allowlist com confirmação e kill switch; PWA offline segura.
5. **Fase de inteligência textual (P4):** provider abstrato, memória com retenção e ferramentas confirmáveis.
6. **Fase de voz (P5):** somente após as anteriores; streaming, filas, cancelamento e interrupção, com testes em Android real.

Não iniciar WhatsApp, compras, exclusão de arquivos, controle de tela, comando remoto genérico ou voz antes de fechar P0/P1 e estabelecer o canal PC seguro.
