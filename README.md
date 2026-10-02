# GoValue Mobile

App mobile (React Native/Expo) companion do [GoValue](https://github.com/menezes97/govalue), cobrindo o fluxo de autoatendimento do funcionário: login, consulta de avaliações pendentes e resposta pelo celular.

## Sobre o projeto

Consome a mesma API REST (Spring Boot/JWT) que já serve o frontend web do GoValue, sem nenhuma mudança no backend — prova de que a API é genuinamente cliente-agnóstica, não acoplada a um único frontend. Escopo deliberadamente pequeno: só o que faz sentido "no bolso" (responder uma avaliação), sem réplica das telas de administração.

Inclui o segundo fator de login por reconhecimento facial (já existente no GoValue) usando a câmera nativa do celular, em vez da webcam.

## Stack

- **App:** Expo + React Native + TypeScript
- **Navegação:** React Navigation (stack)
- **Dados:** TanStack Query
- **Sessão:** `expo-secure-store` (Keychain/Keystore do sistema, não um storage em texto plano)
- **Câmera:** `expo-camera`, para o passo de verificação facial

## Como rodar

Pré-requisitos: Node.js 20+, o [backend do GoValue](https://github.com/menezes97/govalue) rodando (`docker compose up -d`), e o app **Expo Go** instalado no celular (mesma rede Wi-Fi da máquina de desenvolvimento).

```bash
npm install
cp .env.example .env
# edite EXPO_PUBLIC_API_URL com o IP de LAN da sua máquina (não localhost —
# o celular não enxerga o localhost da máquina de dev). Descubra com `ipconfig`.

npx expo start
```

Escaneie o QR code com o Expo Go (Android) ou a câmera do iPhone (iOS). Login de teste (seed do GoValue, apenas dev): `carlos@govalue.dev` / `Demo@1234`.
