# Android/Capacitor no Linux Mint

O projeto usa Capacitor 8 e mantém um build separado para o navegador/PWA. O Android suporta API 24+, compila com SDK 36 e usa o identificador `com.hermes.mobile`.

## 1. Requisitos

- Bun 1.3+ e Node.js 22+.
- Android Studio 2025.2.1 ou superior.
- Android SDK Platform 36, Build Tools e Platform Tools.
- JDK embutido no Android Studio (recomendado). Não use JDK 25 com o Gradle atual.

Instale as ferramentas básicas:

```bash
sudo apt update
sudo apt install -y curl unzip git
```

Baixe o Android Studio no site oficial, extraia e abra `bin/studio.sh`. No primeiro assistente, instale o SDK. Depois, configure o terminal conforme o caminho escolhido:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME="$HOME/android-studio/jbr"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

Coloque essas linhas em `~/.bashrc` após confirmar os caminhos.

## 2. Dependências e build web

```bash
bun install --frozen-lockfile
bun run web:build
bun run cap:web
```

`web:build` gera o PWA/Nitro normal. `cap:web` gera um shell SPA estático em `dist/client`, exigido pelo Capacitor.

## 3. Sincronizar e abrir o Android Studio

```bash
bun run cap:sync
bun run cap:open
```

No Android Studio, aguarde o Gradle terminar, escolha aparelho/emulador API 24+ e pressione Run.

## 4. Gerar APK debug

```bash
bun run android:debug
```

Saída esperada:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

APKs, AABs, `local.properties`, caches Gradle, keystores e segredos são ignorados pelo Git. Não crie nem versione keystore de produção nesta fase.

## Backend durante desenvolvimento

O APK funciona em modo offline/demo sem backend. Para um emulador acessar o backend do computador, use `http://10.0.2.2:8787` em `VITE_HERMES_API_URL` antes de `cap:sync`; o manifest permite HTTP somente no build debug. Para produção, use HTTPS e uma origem explicitamente autorizada.

## Limite encontrado neste ambiente

`cap:sync` foi validado. `assembleDebug` não concluiu porque o ambiente de CI não possui Android SDK e oferece apenas JDK 25, incompatível com Gradle 8.14.3 (`Unsupported class file major version 69`). Use o JDK embutido no Android Studio e SDK 36 conforme acima.
