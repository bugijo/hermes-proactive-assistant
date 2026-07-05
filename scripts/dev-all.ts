const backend = Bun.spawn(["bun", "backend/src/server.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  env: { ...process.env, HERMES_SEED: process.env.HERMES_SEED ?? "true" },
});
const frontend = Bun.spawn(["bun", "run", "dev"], {
  stdout: "inherit",
  stderr: "inherit",
  env: {
    ...process.env,
    VITE_HERMES_API_URL: process.env.VITE_HERMES_API_URL ?? "http://localhost:8787",
  },
});

const stop = () => {
  backend.kill();
  frontend.kill();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
await Promise.race([backend.exited, frontend.exited]);
stop();
