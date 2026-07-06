# Instalação local no Linux Mint

## 1. Dependências básicas

```bash
sudo apt update
sudo apt install -y curl unzip git
```

## 2. Bun

```bash
curl -fsSL https://bun.sh/install -o /tmp/bun-install.sh
bash /tmp/bun-install.sh
source ~/.bashrc
bun --version
```

## 3. Projeto

```bash
git clone https://github.com/bugijo/hermes-proactive-assistant.git
cd hermes-proactive-assistant
cp .env.example .env
bun install --frozen-lockfile
```

Revise `.env` se as portas `8080` ou `8787` estiverem ocupadas. Não envie esse arquivo para o Git.

## 4. Rodar

```bash
bun run dev:all
```

Abra `http://localhost:8080` (ou o endereço informado pelo terminal), crie o primeiro usuário e guarde a senha localmente. O SQLite será criado em `backend/data/hermes.sqlite`.

## 5. Testar

```bash
bun run lint
bun run build
bun run backend:test
```

Os testes usam um banco temporário em `/tmp` e não alteram o banco de desenvolvimento.

## Solução rápida de problemas

- `bun: command not found`: feche/reabra o terminal ou rode `source ~/.bashrc`.
- Frontend mostra `Modo offline/demo`: confirme que a API está em `http://localhost:8787` e que `VITE_HERMES_API_URL` está correto.
- Porta ocupada: altere `HERMES_API_PORT` e `VITE_HERMES_API_URL` juntos.
- Reset de desenvolvimento: faça backup e remova manualmente `backend/data/hermes.sqlite`; na próxima execução, migrações e seed serão recriados.
